"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { FileIcon, BookTextIcon, Building2Icon, ClipboardListIcon, MailIcon } from "lucide-react";
import WebsiteContent from "./website-content";
import { TextContent } from "./text-content";
import { QnAContent } from "./qa-content";
import { FileUploadForm } from "./files-content";
import { MailContent } from "./mail-content";

// Remove async
export function TabsSection({ source, subscription, stats }: { source: any, subscription: any, stats: any }) {
    const [activeTab, setActiveTab] = useState<string>("files");
    const [currentSource, setCurrentSource] = useState(source); // Store source in state

    const handleSourceChange = (newSource: any) => {
        setCurrentSource(newSource); // Update the source whenever it changes
    };

    return (
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
            <Tabs.List className="flex border-b border-gray-300">
                <Tabs.Trigger
                    value="files"
                    className="flex items-center px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out hover:bg-gray-200 focus:outline-none relative"
                    style={{ backgroundColor: 'var(--tab-bg-default)' }}
                >
                    <FileIcon className="text-lg" />
                    <span className="ml-2">Files</span>
                    <div
                        className={`absolute bottom-0 left-0 w-full h-1 bg-primary transition-transform transform ${activeTab === "files" ? "scale-x-100" : "scale-x-0"} origin-left`}
                    />
                </Tabs.Trigger>
                <Tabs.Trigger
                    value="text"
                    className="flex items-center px-4 py-2 text-sm font-medium bg-primary transition-colors duration-300 ease-in-out hover:bg-gray-200 focus:outline-none relative"
                    style={{ backgroundColor: 'var(--tab-bg-default)' }}
                >
                    <BookTextIcon className="text-lg" />
                    <span className="ml-2">Special Instructions</span>
                    <div
                        className={`absolute bottom-0 left-0 w-full h-1 bg-primary transition-transform transform ${activeTab === "text" ? "scale-x-100" : "scale-x-0"} origin-left`}
                    />
                </Tabs.Trigger>
                <Tabs.Trigger
                    value="website"
                    className="flex items-center px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out hover:bg-gray-200 focus:outline-none relative"
                    style={{ backgroundColor: 'var(--tab-bg-default)' }}
                >
                    <Building2Icon className="text-lg" />
                    <span className="ml-2">Website</span>
                    <div
                        className={`absolute bottom-0 left-0 w-full h-1 bg-primary transition-transform transform ${activeTab === "website" ? "scale-x-100" : "scale-x-0"} origin-left`}
                    />
                </Tabs.Trigger>
                <Tabs.Trigger
                    value="qna"
                    className="flex items-center px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out hover:bg-gray-200 focus:outline-none relative"
                    style={{ backgroundColor: 'var(--tab-bg-default)' }}
                >
                    <ClipboardListIcon className="text-lg" />
                    <span className="ml-2">FAQ</span>
                    <div
                        className={`absolute bottom-0 left-0 w-full h-1 bg-primary transition-transform transform ${activeTab === "qna" ? "scale-x-100" : "scale-x-0"} origin-left`}
                    />
                </Tabs.Trigger>
                <Tabs.Trigger
                    value="mail"
                    className="flex items-center px-4 py-2 text-sm font-medium transition-colors duration-300 ease-in-out hover:bg-gray-200 focus:outline-none relative"
                    style={{ backgroundColor: 'var(--tab-bg-default)' }}
                >
                    <MailIcon className="text-lg" />
                    <span className="ml-2">Mail</span>
                    <div
                        className={`absolute bottom-0 left-0 w-full h-1 bg-primary transition-transform transform ${activeTab === "mail" ? "scale-x-100" : "scale-x-0"} origin-left`}
                    />
                </Tabs.Trigger>
            </Tabs.List>

            {/* Lazy load tab contents */}
            {activeTab === "files" && (
                <Tabs.Content value="files" className="p-4">
                    <FileUploadForm source={currentSource} subscription={subscription} stats={stats} onSourceChange={handleSourceChange} />
                </Tabs.Content>
            )}
            {activeTab === "text" && (
                <Tabs.Content value="text" className="p-4">
                    <TextContent 
                        source={currentSource} 
                        subscription={subscription} 
                        stats={stats}
                        onSourceChange={handleSourceChange} // Pass down the setter function
                    />
                </Tabs.Content>
            )}
            {activeTab === "website" && (
                <Tabs.Content value="website" className="p-4">
                    <WebsiteContent source={currentSource || {}} subscription={subscription} stats={stats} onSourceChange={handleSourceChange}/>
                </Tabs.Content>
            )}
            {activeTab === "qna" && (
                <Tabs.Content value="qna" className="p-4">
                    <QnAContent source={currentSource} subscription={subscription} stats={stats} onSourceChange={handleSourceChange} />
                </Tabs.Content>
            )}
            {activeTab === "mail" && (
                <Tabs.Content value="mail" className="p-4">
                    <MailContent source={currentSource} stats={stats} subscription={subscription} onSourceChange={handleSourceChange}/>
                </Tabs.Content>
            )}
        </Tabs.Root>
    );
}
