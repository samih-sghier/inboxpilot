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
import { RefreshCcw } from 'lucide-react';
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

            const websiteDataUpdate = { ...source.website_data, [urlToValidate]: content };
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

    const fetchLinks = async (type: 'page' | 'sitemap') => {
        const totalLinks = links.length + (type === 'page' ? 1 : subscription.links - links.length);
    
        if (totalLinks > subscription.links) {
            toast.error(`You have reached the maximum number of links (${subscription.links}) for your plan.`);
            return;
        }
        setFetching(true);
        setProgress(0);
        setProcessedLinks(0);
        setDiscoveredLinks([]);

    
        try {
            const linkToFetch = type === 'page' ? crawlLink : sitemapLink;
            const schema = type === 'page' ? urlSchema : sitemapSchema;
            schema.parse(linkToFetch);
    
            const mapResult = await app.mapUrl(linkToFetch, { limit: subscription.links - links.length });
    
            if (!mapResult.success || !mapResult.links.length) {
                throw new Error('No links were found or the mapping failed.');
            }
    
            const newLinks = mapResult.links.map((url, index) => ({
                id: links.length + index + 1,
                url,
                llmData: null,
                status: 'pending',
            }));
    
            setDiscoveredLinks(mapResult.links);
            setLinks(prevLinks => [...prevLinks, ...newLinks]);
            setCrawlLimit(newLinks.length);
    
            const updatedLinks = [...links, ...newLinks];
            let processedCount = 0;
    
            const processedResults = await Promise.all(
                newLinks.map(async (link) => {
                    try {
                        const scrapeResult = await app.scrapeUrl(link.url);
                        if (scrapeResult.success && scrapeResult.markdown) {
                            const content = scrapeResult.markdown;
                            const maxChars = subscription.charactersPerChatbot;
                            const remainingChars = maxChars - currentTotalChars;
                            const truncatedContent = content.slice(0, remainingChars);
    
                            setTotalChars((prev) => prev + truncatedContent.length);
                            processedCount++;
                            updateProgress(processedCount, totalLinks)
                            setProcessedLinks(processedCount);
                            return { ...link, llmData: truncatedContent, status: 'success' };
                        } else {
                            // If scrape fails, update status to 'failed' without throwing an error
                            processedCount++;
                            updateProgress(processedCount, totalLinks)
                            setProcessedLinks(processedCount);
                            return { ...link, status: 'failed' };
                        }
                    } catch (error) {
                        // Catch any other errors, treat as fail but continue processing
                        processedCount++;
                        updateProgress(processedCount, totalLinks)
                        setProcessedLinks(processedCount);
                        return { ...link, status: 'failed' };
                    }
                })
            );
    
            setLinks(updatedLinks.map((link) =>
                processedResults.find((res) => res.id === link.id) || link
            ));
    
            const websiteDataUpdate = processedResults.reduce((acc, link) => {
                if (link.status === 'success' && link.llmData) {
                    acc[link.url] = link.llmData;
                }
                return acc;
            }, { ...source.website_data });
    
            onSourceChange({ ...source, website_data: websiteDataUpdate });
            await updateWebsiteDataField(websiteDataUpdate);
    
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setFetching(false);
            if (subscription.title == "Free") {
                toast.info(`Crawled only ${subscription.links} links for your current plan. Please upgrade to access more pages.`);
            } else {
                toast.info(`Successfully crawled ${url}`);
            }
        }
    };

    return (
        <div className="space-y-6">
            {fetching && (
                <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 relative">
                        <div
                            className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="text-sm text-center text-gray-600">
                        Processed {processedLinks} of {crawlLimit} links ({progress}%)
                    </div>
                    {discoveredLinks.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium mb-2">Discovered Links:</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {discoveredLinks.map((url, index) => (
                                    <div key={index} className="text-sm text-gray-600">
                                        {url}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}


            <div>
                <p className="text-sm font-medium mb-2">Crawl</p>
                <div className="flex space-x-2">
                    <Input
                        placeholder="https://www.example.com"
                        className="flex-1"
                        value={crawlLink}
                        onChange={(e) => setCrawlLink(e.target.value)}
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