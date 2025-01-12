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
    hobby: "hobby",
    standard: "standard",
    unlimited: "unlimited",
} as const;

export const pricingFeatures: PricingFeature[] = [
    {
        id: "1",
        title: "Access to GPT-4o mini model",
        includedIn: [pricingIds.free],
    },
    {
        id: "2",
        title: "Access to GPT-4o model",
        includedIn: [pricingIds.hobby, pricingIds.standard, pricingIds.unlimited],
    },
    {
        id: "3",
        title: "400k email tokens (~20 Emails)",
        includedIn: [pricingIds.free],
    },
    {
        id: "4",
        title: "4m email tokens (~200 Emails)",
        includedIn: [pricingIds.hobby],
    },
    {
        id: "5",
        title: "40m email tokens (~2,000 Emails)",
        includedIn: [pricingIds.standard],
    },
    {
        id: "6",
        title: "200m email tokens (~10,000 Emails)",
        includedIn: [pricingIds.unlimited],
    },
    {
        id: "7",
        title: "1 connected email account",
        includedIn: [pricingIds.free],
    },
    {
        id: "8",
        title: "2 connected email accounts",
        includedIn: [pricingIds.hobby],
    },
    {
        id: "9",
        title: "5 connected email accounts",
        includedIn: [pricingIds.standard],
    },
    {
        id: "10",
        title: "10 connected email accounts",
        includedIn: [pricingIds.unlimited],
    },
    {
        id: "11",
        title: "400,000 chars data source limit",
        includedIn: [pricingIds.free],
    },
    {
        id: "12",
        title: "5,000,000 chars data source limit",
        includedIn: [pricingIds.hobby],
    },
    {
        id: "13",
        title: "11,000,000 chars data source limit",
        includedIn: [pricingIds.standard],
    },
    {
        id: "14",
        title: "20,000,000 chars data source limit",
        includedIn: [pricingIds.unlimited],
    },
    {
        id: "15",
        title: "1 team member",
        includedIn: [pricingIds.free],
    },
    {
        id: "16",
        title: "3 team members",
        includedIn: [pricingIds.hobby],
    },
    {
        id: "17",
        title: "5 team members",
        includedIn: [pricingIds.standard],
    },
    {
        id: "18",
        title: "20 team members",
        includedIn: [pricingIds.unlimited],
    },
    {
        id: "19",
        title: "Limited to 10 links to train on",
        includedIn: [pricingIds.free],
    },
    {
        id: "20",
        title: "Unlimited links to train on",
        includedIn: [pricingIds.hobby, pricingIds.standard, pricingIds.unlimited],
    },
    {
        id: "21",
        title: "Capture Email Escalations",
        includedIn: [pricingIds.free, pricingIds.hobby, pricingIds.standard, pricingIds.unlimited],
    },
    {
        id: "22",
        title: "Remove 'Powered by InboxPilot'",
        includedIn: [pricingIds.hobby, pricingIds.standard, pricingIds.unlimited],
    }
];


export const pricingPlans: PricingPlan[] = [
    {
        id: pricingIds.free,
        title: "Free",
        description: "Test AI workflows on small-scale email queries. Perfect for individuals exploring automation.",
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
        monthlyTokens: 400000,
        chatbots: 1,
        charactersPerChatbot: 400000,
        teamMembers: 1,
        links: 10,
    },
    {
        id: pricingIds.hobby,
        title: "Hobby",
        description: "Manage moderate email workflows for small teams or basic CRM tasks with ease.",
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
        monthlyTokens: 4000000,
        chatbots: 2,
        charactersPerChatbot: 5000000,
        teamMembers: 1,
        links: Infinity,
        priceId: {
            monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOBBY_MONTHLY ?? "",
            yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOBBY_YEARLY ?? ""
        },
    },
    {
        id: pricingIds.standard,
        title: "Standard",
        description: "Streamline email workflows for mid-sized teams handling customer support or CRM.",
        price: {
            monthly: 29,
            yearly: 299,
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
        monthlyTokens: 40000000,
        chatbots: 10,
        charactersPerChatbot: 11000000,
        teamMembers: 3,
        links: Infinity,
        priceId: {
            monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY ?? "",
            yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_YEARLY ?? ""
        },
    },
    {
        id: pricingIds.unlimited,
        title: "Unlimited",
        description: "Built for large teams managing high-volume email workflows for CRM or operations.",
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
        monthlyTokens: 200000000,
        chatbots: 50,
        charactersPerChatbot: 20000000,
        teamMembers: 5,
        links: Infinity,
        priceId: {
            monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY ?? "",
            yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY ?? ""
        },
    },
];


export const freePricingPlan = pricingPlans.find(plan => plan.id === pricingIds.free); // Retrieve the free pricing plan