'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { toast } from 'sonner';
import { clearSourceFields, removeWebsiteDataField, updateWebsiteDataField } from '@/server/actions/sources/mutations';
import { sourcesUpdateSchema } from '@/server/db/schema';
import { freePricingPlan, PricingPlan } from '@/config/pricing';
import { c } from 'node_modules/fumadocs-ui/dist/layout-WuS8Ab4e';
import { Icons } from '@/components/ui/icons';
import { RefreshCcw } from 'lucide-react';
import { env } from "@/env";
import pLimit from 'p-limit';

const urlSchema = z.string().url().min(1, 'URL cannot be empty');
const sitemapSchema = z.string().url().min(1, 'Sitemap URL cannot be empty');

interface Link {
    id: number;
    url: string;
    llmData?: string; // Optional field for LLM data
}

export default function WebsiteContent({ source, stats, subscription, onSourceChange }: { source: any, stats: any, subscription: PricingPlan, onSourceChange: (newSource: any) => void }) {
    const [links, setLinks] = useState<Link[]>([]);
    const [crawlLink, setCrawlLink] = useState('');
    const [sitemapLink, setSitemapLink] = useState('');
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [newLink, setNewLink] = useState('');
    const [fetching, setFetching] = useState(false);
    const [progress, setProgress] = useState(0); // Progress state for the progress bar
    const [currentTotalChars, setTotalChars] = useState(0); // Total characters in the link URLs and LLM data
    const [refetchingLinks, setRefetchingLinks] = useState<Set<string>>(new Set());

    const {
        textInputChars,
        linkChars,
        totalChars,
        linkCount,
        qaChars,
        qaCount,
        fileChars,
        fileCount,
        trainChatbot,
        lastTrainedDate
    } = stats;

    useEffect(() => {
        if (source && source.website_data) {
            const initialLinks = Object.keys(source.website_data).map((url, index) => ({
                id: index + 1,
                url,
                llmData: source.website_data[url], // Assuming website_data stores the llmData as values
            }));
            setLinks(initialLinks);
            const totalChars = initialLinks.reduce((acc, link) => acc + (link.llmData?.length || 0), 0);
            setTotalChars(totalChars);
        }
    }, [source]);

    // Normalize the URL by removing trailing slashes and converting to lowercase
    const normalizeUrl = (url: string) => {
        try {
            const parsedUrl = new URL(url);
            const normalizedPath = parsedUrl.pathname.replace(/\/+$/, '');
            const normalizedOrigin = parsedUrl.origin.toLowerCase();
            return `${normalizedOrigin}${normalizedPath}`;
        } catch (e) {
            return url.toLowerCase().replace(/\/+$/, '');
        }
    };

    // Handle the deletion of a link by its ID
    const handleDeleteLink = async (id: number, url: string) => {
        try {
            // Create a set with the URL to delete (assuming removeWebsiteDataField expects a Set)
            const urlsToDelete = new Set([url]);

            // Call the mutation to delete the link from the website_data field
            removeWebsiteDataField(urlsToDelete);

            // Update the UI after successful deletion
            setLinks((prevLinks) => prevLinks.filter((link) => link.id !== id));
            setTotalChars((prevTotal) => prevTotal - (source.website_data[url]?.length || 0));
            toast.success('Link deleted successfully.');

            // Update the website data field
            const updatedLinks = links.filter(link => link.id !== id);
            const websiteDataUpdate = updatedLinks.reduce((acc: Record<string, string>, link: Link) => {
                if (link.llmData) {
                    acc[link.url] = link.llmData;
                }
                return acc;
            }, {});
            onSourceChange({ ...source, website_data: websiteDataUpdate });
            await updateWebsiteDataField(websiteDataUpdate);

        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
    };

    // Add a new link to the list and start fetching its LLM data
    const handleAddLink = async () => {
        try {

            const trimmedLink = newLink.trim();

            if (trimmedLink.length === 0) {
                toast.error('URL cannot be empty');
                return;
            }

            const urlToValidate = /^https?:\/\//i.test(trimmedLink) ? trimmedLink : `http://${trimmedLink}`;

            urlSchema.parse(urlToValidate);

            const normalizedNewLink = normalizeUrl(urlToValidate);

            if (links.some(link => normalizeUrl(link.url) === normalizedNewLink)) {
                toast.error('This URL is already in the list.');
                return;
            }

            // Check link count limit
            const maxLinks = Number(subscription.links);
            const currentLinkCount = links.length;

            if (currentLinkCount >= maxLinks) {
                toast.error(`You have reached the maximum number of links allowed for your plan (${maxLinks}).`);
                return;
            }

            const newId = links.length > 0 ? Math.max(...links.map(link => link.id)) + 1 : 1;
            const newLinkEntry = { id: newId, url: urlToValidate };

            setLinks(prevLinks => [...prevLinks, newLinkEntry]);
            setNewLink('');
            setIsAddingLink(false);

            // Fetch LLM data for the new link
            setFetching(true);
            setProgress(0);

            try {
                const response = await fetch(`https://r.jina.ai/${urlToValidate}`, {
                    headers: {
                        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRAWLER_API_KEY}`,
                        'Content-Type': 'application/json',
                    }
                });
                const text = await response.text();
                setProgress(100);

                // Check character limit
                const maxChars = subscription.charactersPerChatbot;
                const currentChars = totalChars;
                const remainingChars = Math.max(0, maxChars - currentChars);

                let truncatedText = text;
                if (text.length > remainingChars) {
                    truncatedText = text.slice(0, remainingChars);
                    toast.warning(`The content was truncated to fit within your plan's character limit.`);
                }

                const updatedLink = { ...newLinkEntry, llmData: truncatedText };
                setLinks(prevLinks => prevLinks.map(link =>
                    link.id === newId ? updatedLink : link
                ));
                setTotalChars(prevTotal => Math.min(prevTotal + truncatedText.length, maxChars));

                // Update the website data field with the new link and its LLM data
                const websiteDataUpdate = { [urlToValidate]: truncatedText };
                // Trigger onSourceChange to notify parent about the update
                onSourceChange({ ...source, website_data: websiteDataUpdate });
                await updateWebsiteDataField(websiteDataUpdate);

                toast.success('Link added and LLM data fetched successfully.');
            } catch (error) {
                console.error('Error fetching LLM data:', error);
                toast.error(`Failed to fetch LLM data: ${error.message}`);

                const errorMessage = `Failed to fetch LLM data: ${error.message}`;
                const updatedLink = { ...newLinkEntry, llmData: errorMessage };
                setLinks(prevLinks => prevLinks.map(link =>
                    link.id === newId ? updatedLink : link
                ));
                setTotalChars(prevTotal => prevTotal + errorMessage.length);

                // Update the website data field with the new link and error message
                const websiteDataUpdate = { [urlToValidate]: errorMessage };
                await updateWebsiteDataField(websiteDataUpdate);
            } finally {
                setFetching(false);
                setProgress(100);
            }

        } catch (e) {
            if (e instanceof z.ZodError) {
                const errors = e.errors.map(error => error.message).join(', ');
                toast.error(`Invalid input: ${errors}`);
            } else {
                toast.error('An unexpected error occurred');
            }
        }
    };

    const retryAddLink = async (newLink: string) => {
        try {
            toast.info(`Refetching ${newLink}`);
            setFetching(true);
            setProgress(0);

            const response = await fetch(`https://r.jina.ai/${newLink}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRAWLER_API_KEY}`,
                    'Content-Type': 'application/json',
                }
            });

            const text = await response.text();
            setProgress(100);

            // Check character limit
            const maxChars = subscription.charactersPerChatbot;
            const currentChars = totalChars;
            const remainingChars = Math.max(0, maxChars - currentChars);

            let truncatedText = text;
            if (text.length > remainingChars) {
                truncatedText = text.slice(0, remainingChars);
                toast.warning(`The content was truncated to fit within your plan's character limit.`);
            }


            setLinks(prevLinks => prevLinks.map(link =>
                link.url === newLink
                    ? { ...link, llmData: truncatedText }
                    : link
            ));

            // Update the website data field
            const websiteDataUpdate = { [newLink]: truncatedText };
            onSourceChange({ ...source, website_data: links });
            await updateWebsiteDataField(websiteDataUpdate);

            toast.success('Link refetched successfully');
        } catch (error) {
            // Update the link with error message
            setLinks(prevLinks => prevLinks.map(link =>
                link.url === newLink
                    ? { ...link, llmData: `Failed to fetch LLM data: ${error.message}` }
                    : link
            ));
            toast.error('Failed to fetch link data');
        } finally {
            setFetching(false);
            setProgress(100);
        }
    };
    // Fetch LLM data for a given link and update its entry in the state
    const fetchLLMDataForLinks = async (linksToFetch: Link[]) => {
        try {
            const totalLinks = linksToFetch.length;
            let completedLinks = 0;
            let totalNewChars = 0;

            const maxChars = Number(subscription.charactersPerChatbot);
            const initialTotalChars = totalChars;

            // Calculate optimal concurrency while respecting 200 RPM
            const requestsPerMinute = 195;
            const minDelayBetweenRequests = (60 * 1000) / requestsPerMinute; // in milliseconds
            const optimalConcurrency = 10; // Process 10 requests concurrently
            const limit = pLimit(optimalConcurrency);

            // Batch size for updating UI and reducing state updates
            const BATCH_SIZE = 5;
            let currentBatch: Link[] = [];

            const processBatch = async (batch: Link[]) => {
                if (batch.length === 0) return;
                setLinks(prevLinks => {
                    const linkMap = new Map(prevLinks.map(link => [link.url, link]));
                    batch.forEach(link => linkMap.set(link.url, link));
                    return Array.from(linkMap.values());
                });
            };

            const fetchWithRateLimit = async (link: Link) => {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                    const response = await fetch(`https://r.jina.ai/${link.url}`, {
                        headers: {
                            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRAWLER_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const text = await response.text();
                    completedLinks++;

                    const remainingChars = Math.max(0, maxChars - (initialTotalChars + totalNewChars));
                    const truncatedText = text.length > remainingChars ? text.slice(0, remainingChars) : text;

                    if (text.length > remainingChars) {
                        toast.warning(`Some content was truncated to fit within your plan's character limit.`);
                    }

                    totalNewChars += truncatedText.length;

                    // Update progress less frequently
                    if (completedLinks % 5 === 0 || completedLinks === totalLinks) {
                        setProgress(Math.round((completedLinks / totalLinks) * 100));
                    }

                    const updatedLink = { ...link, llmData: truncatedText };
                    currentBatch.push(updatedLink);

                    // Process batch when it reaches the batch size or is the last item
                    if (currentBatch.length >= BATCH_SIZE || completedLinks === totalLinks) {
                        await processBatch([...currentBatch]);
                        currentBatch = [];
                    }

                    return updatedLink;
                } catch (error) {
                    completedLinks++;
                    if (completedLinks % 5 === 0 || completedLinks === totalLinks) {
                        setProgress(Math.round((completedLinks / totalLinks) * 100));
                    }
                    return { ...link, llmData: `Failed to fetch LLM data: ${error.message}` };
                }
            };

            // Create a queue of rate-limited requests with delay
            const queue = linksToFetch.map((link, index) =>
                limit(async () => {
                    await new Promise(resolve =>
                        setTimeout(resolve, Math.floor(index / optimalConcurrency) * minDelayBetweenRequests)
                    );
                    return fetchWithRateLimit(link);
                })
            );

            const updatedLinks = await Promise.all(queue);
            setTotalChars(prevTotal => Math.min(prevTotal + totalNewChars, maxChars));

            // Batch update website data
            const websiteDataUpdate = updatedLinks.reduce((acc: Record<string, string>, link: Link) => {
                if (link.llmData) {
                    acc[link.url] = link.llmData;
                }
                return acc;
            }, {});
            await updateWebsiteDataField(websiteDataUpdate);

        } catch (error) {
            console.error('Detailed LLM fetch error info:', error);
            toast.error(`Error: ${error.message}`);
        }
    };
    // Fetch links based on crawl or sitemap link
    const fetchLinks = async (type: 'page' | 'sitemap') => {
        setFetching(true);
        setProgress(0);

        try {
            const linkToFetch = type === 'page' ? crawlLink : sitemapLink;

            if (type === 'page') {
                urlSchema.parse(linkToFetch);
            } else if (type === 'sitemap') {
                sitemapSchema.parse(linkToFetch);
            }

            const response = await fetch(`/api/links?page=${encodeURIComponent(linkToFetch)}&linkType=${type}`);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
            }

            const fetchedLinks: string[] = await response.json();
            const newLinks = fetchedLinks.map((url: string, index: number) => ({
                id: links.length + index + 1,
                url
            }));

            // Check for duplicates and add new links
            const existingUrls = new Set(links.map(link => normalizeUrl(link.url)));
            const filteredNewLinks = newLinks.filter(link => !existingUrls.has(normalizeUrl(link.url)));

            // Check link count limit
            const maxLinks = Number(subscription ? subscription.links : freePricingPlan?.links);
            const availableSlots = Math.max(0, maxLinks - links.length);
            const linksToAdd = filteredNewLinks.slice(0, availableSlots);

            if (linksToAdd.length === 0) {
                if (links.length >= maxLinks) {
                    toast.error(`No links were added. You have reached the maximum number of links (${maxLinks}) allowed for your plan.`);
                } else if (filteredNewLinks.length === 0) {
                    toast.error(`No new links were found or all fetched links are already in your list.`);
                } else {
                    toast.error(`No links were added due to reaching your plan's limit of ${maxLinks} links.`);
                }
                return; // Exit the function early as no links can be added
            }

            const allLinks = [...links, ...linksToAdd];
            setLinks(allLinks);

            // Fetch LLM data for new links only
            await fetchLLMDataForLinks(linksToAdd);

            if (type === 'page') setCrawlLink('');
            if (type === 'sitemap') setSitemapLink('');

            if (linksToAdd.length < filteredNewLinks.length) {
                const remainingLinks = filteredNewLinks.length - linksToAdd.length;
                toast.warning(`Added ${linksToAdd.length} links. ${remainingLinks} links were not added due to reaching your plan's limit of ${maxLinks} links.`);
            } else {
                toast.success(`Successfully added ${linksToAdd.length} new links.`);
            }
        } catch (error: any) {
            console.error('Detailed error info:', error);
            toast.error(`Error: ${error.message}`);
        } finally {
            setFetching(false);
            setProgress(100);
        }
    };

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            {fetching && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 relative">
                    <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                    <div
                        className="absolute inset-0 flex items-center justify-center text-xs font-medium text-black"
                        style={{ width: '100%' }}
                    >
                        {progress}%
                    </div>
                </div>
            )}

            {/* Crawl Section */}
            <div>
                <p className="text-sm font-medium mb-2">Crawl</p>
                <div className="flex space-x-2">
                    <Input
                        placeholder="https://www.example.com"
                        className="flex-1"
                        value={crawlLink}
                        onChange={(e) => setCrawlLink(e.target.value)}
                    />
                    <Button onClick={() => fetchLinks('page')} disabled={fetching}>
                        {fetching ? 'Fetching...' : 'Fetch links from page'}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    This will crawl all the internal links starting with the URL (excluding files).
                </p>
            </div>

            {/* OR Divider */}
            <div className="relative flex items-center justify-center">
                <div className="absolute border-t border-gray-300 w-full"></div>
                <span className="relative px-2 text-sm text-muted-foreground">Or</span>
            </div>

            {/* Sitemap Section */}
            <div>
                <p className="text-sm font-medium mb-2">Submit Sitemap</p>
                <div className="flex space-x-2">
                    <Input
                        placeholder="https://www.inboxpilot.co/sitemap.xml"
                        className="flex-1"
                        value={sitemapLink}
                        onChange={(e) => setSitemapLink(e.target.value)}
                    />
                    <Button onClick={() => fetchLinks('sitemap')} disabled={fetching}>
                        {fetching ? 'Fetching...' : 'Fetch links from sitemap'}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    This will fetch all the links listed in the sitemap XML URL.
                </p>
            </div>

            {/* OR Divider */}
            <div className="relative flex items-center justify-center">
                <div className="absolute border-t border-gray-300 w-full"></div>
                <span className="relative px-2 text-sm text-muted-foreground">Included Links</span>
            </div>

            {/* Included Links Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-medium">Included Links</p>
                    <div className="flex items-center space-x-2">
                        {!isAddingLink && (
                            <Button onClick={() => setIsAddingLink(true)}>
                                +
                            </Button>
                        )}
                        {links.length > 0 && (
                            <Button variant="ghost" onClick={() => {
                                const ls = links.map(l => l.url);
                                removeWebsiteDataField(new Set(ls));
                                onSourceChange({ ...source, website_data: [] });
                                setLinks([])
                            }} className="text-red-500">
                                Delete all
                            </Button>
                        )}
                    </div>
                </div>
                {isAddingLink && (
                    <div className="flex space-x-2 mb-4">
                        <Input
                            placeholder="https://www.example.com"
                            className="flex-1"
                            value={newLink}
                            onChange={(e) => setNewLink(e.target.value)}
                        />
                        <Button onClick={handleAddLink}>Add Link</Button>
                        <Button onClick={() => setIsAddingLink(false)} variant="ghost">
                            Cancel
                        </Button>
                    </div>
                )}
                <div className="space-y-2">
                    {links.map((link) => (
                        <div key={link.id} className="flex items-center bg-gray-100 p-2 rounded-md">
                            <div className="flex items-center space-x-2 flex-grow">
                                {link.llmData ? (
                                    link.llmData.startsWith('Failed to fetch') ? (
                                        <Badge variant="destructive">Error</Badge>
                                    ) : (
                                        <Badge variant="success">Trained</Badge>
                                    )
                                ) : fetching || isAddingLink ? (
                                    <Badge variant="info">Training...</Badge>
                                ) : (
                                    <Badge variant="destructive">Error</Badge>
                                )}
                                <p className="text-m text-muted-foreground flex-grow">{link.url}</p>
                                {(link.llmData?.startsWith('Failed to fetch') || !link.llmData) && !fetching ? (
                                    <button
                                        onClick={async () => await retryAddLink(link.url)}
                                        className="ml-4 text-muted-foreground hover:text-primary transition-colors"
                                        title="Retry fetch"
                                        disabled={fetching}

                                    >
                                        {fetching ? (
                                            <RefreshCcw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCcw className="h-4 w-4" />
                                        )}
                                    </button>
                                ) : (
                                    <p className="text-xs text-muted-foreground ml-4">
                                        {link.llmData?.length} chars
                                    </p>
                                )}
                            </div>
                            <Button variant="ghost" onClick={async () => await handleDeleteLink(link.id, link.url)} className="text-red-500 ml-2">
                                🗑️
                            </Button>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">{currentTotalChars} detected characters</p>
            </div>
        </div>
    );
}
