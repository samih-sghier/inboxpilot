import { siteConfig } from "@/config/site";
import { siteUrls } from "@/config/urls";
import type { Metadata } from "next";

export const defaultMetadata: Metadata = {
    title: {
        template: `%s | ${siteConfig.name}`,
        default: siteConfig.name,
    },
    description: siteConfig.description,
    metadataBase: new URL(siteUrls.publicUrl),
    keywords: [
        "automated email replies",
        "inbound email automation software",
        "automated inbound email replies",
        "AI for inbound email responses",
        "AI email automation for customer support",
        "automated customer support email replies",
        "inbox automation for inbound emails",
        "AI-driven inbound email management",
        "intelligent inbound email response system",
        "automated email triage for inbound messages",
        "24/7 inbound email automation",
        "AI email assistant for inbound inquiries",
        "machine learning email management for inbound emails",
        "automated email ticketing system for inbound support",
        "AI-powered inbound email routing",
        "AI for email classification and triage",
        "automated email workflow for inbound emails",
        "real-time inbound email AI solutions",
        "self-learning inbound email bot",
        "AI-powered email replies for customer support",
        "AI email support for inbound messages",
        "automated email ticketing for customer service",
        "inbound email automation for business",
        "cheap Zendesk alternative for inbound email automation",
        "email automation for customer support tickets",
        "Chatbase integration for Gmail inbound email automation",
        "AI-powered customer service email automation",
        "AI email marketing automation for inbound leads",
        "email marketing automation with AI",
        "AI email marketing platform for inbound leads",
        "inbound email marketing automation tools",
        "automated email marketing campaigns for inbound leads",
        "email marketing solutions for inbound email automation",
        "AI-driven email marketing for inbound inquiries",
        "email marketing automation for customer support",
        "AI-powered email management for inbound support",
        "AI chatbot for inbound email automation",
        "email automation for customer service teams",
        "AI email routing system for inbound emails",
        "real-time email AI solutions for customer service"
    ],    
    authors: [{ name: "InboxPilot", url: "https://x.com/inboxpilot" }],
    creator: "InboxPilot",
};

export const twitterMetadata: Metadata["twitter"] = {
    title: siteConfig.name,
    description: siteConfig.description,
    card: "summary_large_image",
    images: [siteConfig.orgImage],
    creator: "@InboxPilot",
};

export const ogMetadata: Metadata["openGraph"] = {
    title: siteConfig.name,
    description: siteConfig.description,
    type: "website",
    images: [{ url: siteConfig.orgImage, alt: siteConfig.name }],
    locale: "en_US",
    url: siteUrls.publicUrl,
    siteName: siteConfig.name,
};
