/**
 * This file contains the pricing data for the pricing page.
 *
 * @add a new pricing plan, add a new object to the `pricing` array.
 * 1. Add id to the pricingIds object then use it as the id of the new pricing object.
 * 2. Add badge(optional), title, description, price, currency, duration, highlight, popular, and uniqueFeatures(optional) to the new pricing object.
 * 3. if the new pricing plan has unique features, add a new object to the `uniqueFeatures` array.
 *
 * @add a new feature, add a new object to the `features` array.
 * 1. Add id to the features object then use it as the id of the new feature object.
 * 2. Add title and includedIn to the new feature object. (includedIn is an array of pricing plan ids that include this feature)
 */
import { env } from "@/env";
import { siteConfig } from "./site";

export type PricingPlan = {
    id: string;
    badge?: string;
    title: string;
    description: string;
    price: {
        monthly: number;
        yearly: number;
    };
    currency: {
        code: string;
        symbol: string;
    };
    duration: string;
    highlight: string;
    buttonHighlighted: boolean;
    planLimit: number;
    usersLimit: number;
    monthlyEmails: number;
    uniqueFeatures?: string[];
    variantId?: {
        monthly: number;
        yearly: number;
    };
    priceId?: {
        monthly: string;
        yearly: string;
    };
    monthlyTokens: number;
    chatbots: number;
    charactersPerChatbot: number;
    teamMembers: number;
    links: number | number;
};

export type PricingFeature = {
    id: string;
    title: string;
    includedIn: string[];
};

export const pricingIds = {
    free: "free",
    starter: "starter",
    hobby: "hobby",
    standard: "standard",
    unlimited: "unlimited",
} as const;

export const pricingFeatures: PricingFeature[] = [
    {
        id: "1",
        title: "Access to latest mini models",
        includedIn: [pricingIds.free],
    },
    {
        id: "2",
        title: "Access to latest models",
        includedIn: [pricingIds.hobby, pricingIds.starter, pricingIds.standard, pricingIds.unlimited],
    },
    {
        id: "3",
        title: "10 Emails",
        includedIn: [pricingIds.free],
    },
    {
        id: "4",
        title: "100 Emails",
        includedIn: [pricingIds.starter],
    },
    {
        id: "5",
        title: "200 Emails",
        includedIn: [pricingIds.hobby],
    },
    {
        id: "6",
        title: "1,000 Emails",
        includedIn: [pricingIds.standard],
    },
    {
        id: "7",
        title: "5,000 Email",
        includedIn: [pricingIds.unlimited],
    },
    {
        id: "8",
        title: "1 connected email account",
        includedIn: [pricingIds.free, pricingIds.starter],
    },
    {
        id: "9",
        title: "2 connected email accounts",
        includedIn: [pricingIds.hobby],
    },
    {
        id: "10",
        title: "5 connected email accounts",
        includedIn: [pricingIds.standard],
    },
    {
        id: "11",
        title: "10 connected email accounts",
        includedIn: [pricingIds.unlimited],
    },
    {
        id: "12",
        title: "400,000 characters data source limit",
        includedIn: [pricingIds.free],
    },
    {
        id: "13",
        title: "2,500,000 characters data source limit",
        includedIn: [pricingIds.starter],
    },
    {
        id: "14",
        title: "5,000,000 characters data source limit",
        includedIn: [pricingIds.hobby],
    },
    {
        id: "15",
        title: "11,000,000 characters data source limit",
        includedIn: [pricingIds.standard],
    },
    {
        id: "16",
        title: "20,000,000 characters data source limit",
        includedIn: [pricingIds.unlimited],
    },
    {
        id: "17",
        title: "1 team member",
        includedIn: [pricingIds.free, pricingIds.starter],
    },
    {
        id: "18",
        title: "3 team members",
        includedIn: [pricingIds.hobby],
    },
    {
        id: "19",
        title: "5 team members",
        includedIn: [pricingIds.standard],
    },
    {
        id: "20",
        title: "20 team members",
        includedIn: [pricingIds.unlimited],
    },
    {
        id: "21",
        title: "Limited to 10 links to train on",
        includedIn: [pricingIds.free],
    },
    {
        id: "22",
        title: "Limited to 30 links to train on",
        includedIn: [pricingIds.starter],
    },
    {
        id: "23",
        title: "Up to 100 links to train on",
        includedIn: [pricingIds.hobby],
    },
    {
        id: "24",
        title: "Up to 500 links to train on",
        includedIn: [pricingIds.standard],
    },
    {
        id: "25",
        title: "Up to 1000 links to train on",
        includedIn: [pricingIds.unlimited],
    },
    {
        id: "26",
        title: "Capture Email Escalations",
        includedIn: [pricingIds.free, pricingIds.starter, pricingIds.hobby, pricingIds.standard, pricingIds.unlimited],
    },
    {
        id: "27",
        title: "Multilanguage Support",
        includedIn: [pricingIds.free, pricingIds.starter, pricingIds.hobby, pricingIds.standard, pricingIds.unlimited],
    },
    {
        id: "28",
        title: "Remove 'Powered by InboxPilot'",
        includedIn: [pricingIds.hobby, pricingIds.starter, pricingIds.standard, pricingIds.unlimited],
    }
];


export const pricingPlans: PricingPlan[] = [
    {
        id: pricingIds.free,
        title: "Free",
        description: "Start automating emails with AI",
        price: {
            monthly: 0,
            yearly: 0,
        },
        currency: {
            code: "USD",
            symbol: "$",
        },
        duration: "Forever",
        highlight: "20 message credits/month",
        buttonHighlighted: false,
        planLimit: 1,
        usersLimit: 1,
        uniqueFeatures: [],
        monthlyTokens: 200000,
        monthlyEmails: 10,
        chatbots: 1,
        charactersPerChatbot: 400000,
        teamMembers: 1,
        links: 10,
    },
    {
        id: pricingIds.starter,
        title: "Starter",
        description: "Basic AI email automation",
        price: {
            monthly: 9,
            yearly: 99,
        },
        currency: {
            code: "USD",
            symbol: "$",
        },
        duration: "per month",
        highlight: "2,000 message credits/month",
        buttonHighlighted: false,
        planLimit: 2,
        usersLimit: 1,
        uniqueFeatures: [],
        monthlyTokens: 1000000,
        monthlyEmails: 100,
        chatbots: 2,
        charactersPerChatbot: 2500000,
        teamMembers: 1,
        links: 30,
        priceId: {
            monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? "",
            yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY ?? ""
        },
    },
    {
        id: pricingIds.hobby,
        title: "Hobby",
        description: "Enhanced AI email automation",
        price: {
            monthly: 19,
            yearly: 190,
        },
        currency: {
            code: "USD",
            symbol: "$",
        },
        duration: "per month",
        highlight: "2,000 message credits/month",
        buttonHighlighted: false,
        planLimit: 2,
        usersLimit: 1,
        uniqueFeatures: [],
        monthlyTokens: 2000000,
        monthlyEmails: 200,
        chatbots: 2,
        charactersPerChatbot: 5000000,
        teamMembers: 1,
        links: 100,
        priceId: {
            monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOBBY_MONTHLY ?? "",
            yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOBBY_YEARLY ?? ""
        },
    },
    {
        id: pricingIds.standard,
        title: "Standard",
        description: "Heavy AI email automation",
        price: {
            monthly: 99,
            yearly: 990,
        },
        currency: {
            code: "USD",
            symbol: "$",
        },
        duration: "per month",
        highlight: "10,000 message credits/month",
        buttonHighlighted: true,
        planLimit: 10,
        usersLimit: 3,
        uniqueFeatures: [],
        monthlyTokens: 10000000,
        chatbots: 10,
        monthlyEmails: 1000,

        charactersPerChatbot: 11000000,
        teamMembers: 3,
        links: 1000,
        priceId: {
            monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY ?? "",
            yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_YEARLY ?? ""
        },
    },
    {
        id: pricingIds.unlimited,
        title: "Unlimited",
        description: "Entreprise AI email automation",
        price: {
            monthly: 399,
            yearly: 3990,
        },
        currency: {
            code: "USD",
            symbol: "$",
        },
        duration: "per month",
        highlight: "40,000 message credits/month included (Messages over the limit will use your OpenAI API Key)",
        buttonHighlighted: false,
        planLimit: 50,
        usersLimit: 5,
        uniqueFeatures: [],
        monthlyTokens: 400000000,
        monthlyEmails: 5000,
        chatbots: 50,
        charactersPerChatbot: 20000000,
        teamMembers: 5,
        links: 1000,
        priceId: {
            monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY ?? "",
            yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY ?? ""
        },
    },
];


export const freePricingPlan = pricingPlans.find(plan => plan.id === pricingIds.free); // Retrieve the free pricing plan