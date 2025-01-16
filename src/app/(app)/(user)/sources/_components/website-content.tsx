'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { toast } from 'sonner';
import { clearSourceFields, removeWebsiteDataField, updateWebsiteDataField } from '@/server/actions/sources/mutations';
import { sourcesUpdateSchema } from '@/server/db/schema';
import { freePricingPlan, PricingPlan } from '@/config/pricing';
import { Icons } from '@/components/ui/icons';
import { Loader2, RefreshCcw } from 'lucide-react';
import FirecrawlApp from 'firecrawl';

const urlSchema = z.string().url().min(1, 'URL cannot be empty');
const sitemapSchema = z.string().url().min(1, 'Sitemap URL cannot be empty');

const app = new FirecrawlApp({ apiKey: process.env.NEXT_PUBLIC_CRAWLER_API_KEY });

interface Link {
    id: number;
    url: string;
    llmData?: string;
    status: 'pending' | 'success' | 'error';
}

interface WebsiteContentProps {
    source: any;
    stats: any;
    subscription: PricingPlan;
    onSourceChange: (newSource: any) => void;
}

export default function WebsiteContent({ source, stats, subscription, onSourceChange }: WebsiteContentProps) {
    const [links, setLinks] = useState<Link[]>([]);
    const [crawlLink, setCrawlLink] = useState('');
    const [sitemapLink, setSitemapLink] = useState('');
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [newLink, setNewLink] = useState('');
    const [fetching, setFetching] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTotalChars, setTotalChars] = useState(0);
    const [crawlLimit, setCrawlLimit] = useState(0);
    const [processedLinks, setProcessedLinks] = useState(0);
    const [discoveredLinks, setDiscoveredLinks] = useState<string[]>([]);

    // State to track excluded paths
    const [excludedPaths, setExcludedPaths] = useState<string>('');
    useEffect(() => {

        if (source?.website_data) {
            const initialLinks = Object.entries(source.website_data).map(([url, llmData], index) => ({
                id: index + 1,
                url,
                llmData: typeof llmData === 'string' ? llmData : undefined,
                status: llmData ? 'success' : 'error'
            }));
            setLinks(initialLinks);
            const totalChars = initialLinks.reduce((acc, link) => acc + (link.llmData?.length || 0), 0);
            setTotalChars(totalChars);
        }
    }, [source]);

    const updateProgress = (processed: number, total: number) => {
        if (total > 0) {
            const percentage = Math.min(Math.round((processed / total) * 100), 100);
            setProgress(percentage);
            setProcessedLinks(processed);
        }
    };

    const processUrl = async (url: string) => {
        const scrapeResult = await app.scrapeUrl(url);
        if (!scrapeResult.success) {
            throw new Error('Failed to fetch content');
        }
        const content = scrapeResult.markdown;
        const maxChars = subscription.charactersPerChatbot;
        const remainingChars = maxChars - currentTotalChars;
        const truncatedContent = content?.slice(0, remainingChars);
        if ((content?.length || 0) > remainingChars) {
            toast.warning('Content was truncated to fit within your plan\'s character limit.');
        }
        return truncatedContent;
    };

    const handleDeleteLink = async (id: number, url: string) => {
        try {
            const { [url]: _, ...websiteDataUpdate } = source.website_data;
            const urlsToDelete = new Set([url]);
            onSourceChange({ ...source, website_data: websiteDataUpdate });
            removeWebsiteDataField(urlsToDelete);
            const updatedLinks = links.filter(link => link.id !== id);
            setLinks(updatedLinks);
            setTotalChars(prev => prev - (source.website_data[url]?.length || 0));
            await updateWebsiteDataField(websiteDataUpdate);
            toast.success('Link deleted (' + url + ')');
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        }
    };


    const handleAddLink = async () => {
        try {
            setFetching(true);
            setProgress(0);
            setProcessedLinks(0);
            setDiscoveredLinks([]);
            setCrawlLimit(1);

            const urlToValidate = /^https?:\/\//i.test(newLink.trim()) ? newLink.trim() : `http://${newLink.trim()}`;
            urlSchema.parse(urlToValidate);

            if (links.length >= subscription.links) {
                toast.error(`You have reached the maximum number of links (${subscription.links}) for your plan.`);
                return;
            }

            const normalizedUrl = normalizeUrl(urlToValidate);
            if (links.some(link => normalizeUrl(link.url) === normalizedUrl)) {
                toast.error('This URL is already in the list.');
                return;
            }

            setFetching(true);
            setProgress(0);

            const content = await processUrl(urlToValidate);
            const newId = links.length > 0 ? Math.max(...links.map(link => link.id)) + 1 : 1;

            const newLinkEntry = { id: newId, url: urlToValidate, llmData: content, status: 'success' };

            setLinks(prevLinks => [...prevLinks, newLinkEntry]);
            setTotalChars(prev => prev + (content?.length || 0));
            const websiteData = source.website_data || {};
            const websiteDataUpdate = { ...websiteData, [urlToValidate]: content };
            onSourceChange({ ...source, website_data: websiteDataUpdate });
            await updateWebsiteDataField(websiteDataUpdate);

            setNewLink('');
            setIsAddingLink(false);
            toast.success('Link added successfully');
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setFetching(false);
            setProgress(100);
        }
    };

    const retryAddLink = async (url: string) => {
        try {
            setFetching(true);
            setProgress(0);
            const content = await processUrl(url);
            setLinks(prevLinks => prevLinks.map(link =>
                link.url === url
                    ? { ...link, llmData: content, status: 'success' }
                    : link
            ));
            const websiteDataUpdate = { ...source.website_data, [url]: content };
            onSourceChange({ ...source, website_data: websiteDataUpdate });
            await updateWebsiteDataField(websiteDataUpdate);
            toast.success('Link refetched successfully');
        } catch (error) {
            setLinks(prevLinks => prevLinks.map(link =>
                link.url === url
                    ? { ...link, llmData: undefined, status: 'error' }
                    : link
            ));
            toast.error('Failed to fetch link data');
        } finally {
            setFetching(false);
            setProgress(100);
        }
    };

    const normalizeUrl = (url: string) => {
        if (!url) return '';
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.toString().toLowerCase().replace(/\/+$/, '');
        } catch (e) {
            return url.toLowerCase().replace(/\/+$/, '');
        }
    };

    const removeAll = async () => {
        const ls = links.map(l => l.url);
        await removeWebsiteDataField(new Set(ls));
        await onSourceChange({ ...source, website_data: [] });
        await setLinks([]);
        await setTotalChars(0);
    }

    const fetchLinks = async (type: 'page' | 'sitemap') => {
        const linkToFetch = type === 'page' ? crawlLink : sitemapLink;

        if (links.length >= subscription.links) {
            toast.error(`You have reached the maximum number of links (${subscription.links}) for your plan.`);
            return;
        }

        setFetching(true);
        setProgress(0);
        setProcessedLinks(0);
        setDiscoveredLinks([]);

        let websiteDataUpdate = {}; // Initialize website data for incremental updates

        try {
            // Validate URL with schema
            const schema = type === 'page' ? urlSchema : sitemapSchema;
            schema.parse(linkToFetch);

            // Start the crawling and watching process directly with `crawlUrlAndWatch`
            const excludePaths = excludedPaths.split(',').map(path => path.trim()).filter(path => path);

            const watch = await app.crawlUrlAndWatch(linkToFetch, { excludePaths, limit: subscription.links });

            await removeAll();

            let processedCount = 0;

            // Listen for the 'document' event which provides crawled content
            watch.addEventListener("document", (doc) => {
                const { markdown: content, metadata } = doc.detail;
                const url = metadata?.sourceURL;

                if (!content || !url) return;

                // Process content and ensure it doesn't exceed character limits
                const maxChars = subscription.charactersPerChatbot;
                const remainingChars = maxChars - currentTotalChars;
                const truncatedContent = content.slice(0, remainingChars);

                // Update total characters and processed count
                setTotalChars(prev => prev + truncatedContent.length);
                processedCount++;
                updateProgress(processedCount, links.length);
                setProcessedLinks(processedCount);

                // Update the status of the existing link directly in the state
                setLinks(prevLinks => {
                    // Check if the link already exists in the list
                    const existingLinkIndex = prevLinks.findIndex(link => normalizeUrl(link.url) === normalizeUrl(url));

                    if (existingLinkIndex !== -1) {
                        // Link exists, so we update it
                        const updatedLinks = [...prevLinks];
                        updatedLinks[existingLinkIndex] = {
                            ...updatedLinks[existingLinkIndex],
                            llmData: truncatedContent,
                            status: 'success',
                        };
                        return updatedLinks;
                    } else {
                        // Link doesn't exist, so we add it
                        return [
                            ...prevLinks,
                            {
                                id: prevLinks.length + 1,
                                url,
                                llmData: truncatedContent,
                                status: 'success',
                            },
                        ];
                    }
                });

                // Dynamically update the website data for this URL
                websiteDataUpdate[url] = truncatedContent;

                // Call onSourceChange to update the source with the new website data
                onSourceChange({ ...source, website_data: websiteDataUpdate });

                // Immediately update the website data field with the incremental changes
                updateWebsiteDataField(websiteDataUpdate);


            });

            // // Listen for errors during the crawl
            watch.addEventListener("error", (err) => {
                console.error("Crawl Error:", err.detail.error);
                toast.error(`Crawl Error; please try again if the issue persists contact support@inboxpilot.co`);
                setFetching(false);

            });

            // Listen for when the crawl is done
            watch.addEventListener("done", (state) => {
                console.log("Crawl Done:", state.detail.status);
                toast.success(`Crawl completed; ${processedCount} links scrapped`);
                setFetching(false);

            });

        } catch (error) {
            toast.error(`Error: ${error.message}`);
            setFetching(false);
        }
    };

    return (
        <div className="space-y-6">
            {fetching && (
                <div className="flex justify-center items-center space-y-2">
                    <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
                </div>
            )}


            <div>
                <p className="text-sm font-medium mb-2">Crawl</p>
                <div className="flex space-x-2">
                    <Input
                        placeholder="https://www.example.com"
                        className="flex-1"
                        value={crawlLink}
                        onChange={(e) => setCrawlLink(e.target.value.trim())}
                        disabled={fetching}
                    />
                    <Button onClick={() => fetchLinks('page')} disabled={fetching}>
                        {fetching ? 'Crawling...' : 'Fetch links from page'}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    This will crawl all the internal links starting with the URL (excluding files).
                </p>
            </div>
            {/* New Exclude Paths Input */}
            <div>
                <p className="text-sm font-medium mb-2">Exclude Paths</p>
                <Input
                    placeholder="e.g. blog/*, admin/*"
                    className="flex-1"
                    value={excludedPaths}
                    onChange={(e) => setExcludedPaths(e.target.value.trim())}
                    disabled={fetching}
                />
                <p className="text-xs text-muted-foreground mt-2">
                    Specify comma-separated paths to exclude from the crawl (e.g., blog/*, admin/*).
                </p>
            </div>

            <div className="relative flex items-center justify-center">
                <div className="absolute border-t border-gray-300 w-full"></div>
                <span className="relative px-2 text-sm text-muted-foreground">Or</span>
            </div>

            {/* <div>
                <p className="text-sm font-medium mb-2">Submit Sitemap</p>
                <div className="flex space-x-2">
                    <Input
                        placeholder="https://www.example.com/sitemap.xml"
                        className="flex-1"
                        value={sitemapLink}
                        onChange={(e) => setSitemapLink(e.target.value)}
                        disabled={fetching}
                    />
                    <Button onClick={() => fetchLinks('sitemap')} disabled={fetching}>
                        {fetching ? 'Fetching...' : 'Fetch links from sitemap'}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    This will fetch all the links listed in the sitemap XML URL.
                </p>
            </div> */}

            <div>
                <div className="flex justify-between items-center mb-4">


                    <p className="text-sm font-medium">Included Links ({links.length})</p>
                    <div className="flex items-center space-x-2">
                        {!isAddingLink && (
                            <Button onClick={() => setIsAddingLink(true)} disabled={fetching}>
                                Add Single Link
                            </Button>
                        )}
                        {links.length > 0 && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    const ls = links.map(l => l.url);
                                    removeWebsiteDataField(new Set(ls));
                                    onSourceChange({ ...source, website_data: [] });
                                    setLinks([]);
                                    setTotalChars(0);
                                }}
                                className="text-red-500"
                                disabled={fetching}
                            >
                                Delete all
                            </Button>
                        )}
                    </div>
                </div>

                {isAddingLink && (
                    <div className="flex space-x-2 mb-4">
                        <Input
                            placeholder="https://www.inboxpilot.co/"
                            className="flex-1"
                            value={newLink}
                            onChange={(e) => setNewLink(e.target.value)}
                            disabled={fetching}
                        />
                        <Button onClick={handleAddLink} disabled={fetching}>
                            Add Link
                        </Button>
                        <Button onClick={() => setIsAddingLink(false)} variant="ghost" disabled={fetching}>
                            Cancel
                        </Button>
                    </div>
                )}

                <div className="space-y-2">
                    {links.map((link) => (
                        <div key={link.id} className="flex items-center bg-gray-100 p-2 rounded-md">
                            <div className="flex items-center space-x-2 flex-grow">
                                <Badge variant={
                                    link.status === 'success' ? "success" :
                                        link.status === 'error' ? "destructive" :
                                            "info"
                                }>
                                    {link.status === 'success' ? 'Success' :
                                        link.status === 'error' ? 'Error' :
                                            'Processing...'}
                                </Badge>
                                <p className="text-m text-muted-foreground flex-grow">{link.url}</p>
                                {link.status === 'error' && !fetching && (
                                    <button
                                        onClick={() => retryAddLink(link.url)}
                                        className="ml-4 text-muted-foreground hover:text-primary transition-colors"
                                        title="Retry fetch"
                                        disabled={fetching}
                                    >
                                        <RefreshCcw className="h-4 w-4" />
                                    </button>
                                )}
                                {link.llmData && (
                                    <p className="text-xs text-muted-foreground ml-4">
                                        {link.llmData.length} chars
                                    </p>
                                )}
                                <Button
                                    variant="ghost"
                                    onClick={() => handleDeleteLink(link.id, link.url)}
                                    className="text-red-500 ml-2"
                                    disabled={fetching}
                                >
                                    🗑️
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                {links.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-4">
                        Total characters: {currentTotalChars}
                    </p>
                )}
            </div>
        </div>
    );
}