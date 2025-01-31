"use server";

import { freePricingPlan, pricingPlans } from "@/config/pricing";
import { siteUrls } from "@/config/urls";
import { env } from "@/env";
import { getAbsoluteUrl } from "@/lib/utils";
import { getOrganizations } from "@/server/actions/organization/queries";
import { getUser } from "@/server/auth";
import { db } from "@/server/db";
import { organizations, subscriptions } from "@/server/db/schema";
import { protectedProcedure } from "@/server/procedures";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { eachMonthOfInterval, format, startOfMonth, subMonths } from "date-fns";
import stripe from "@/server/stripe";
import { toast } from "sonner";

// Initialize Stripe client

export async function getCheckoutURL(variantId?: string, embed = false) {
    await protectedProcedure();

    const user = await getUser();
    const { currentOrg } = await getOrganizations();

    if (!user || !currentOrg) {
        return redirect(siteUrls.auth.login);
    }

    if (!variantId) {
        return redirect(siteUrls.dashboard.home);
    }
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price: variantId, // This should be a Stripe Price ID
            quantity: 1,
        }],
        mode: 'subscription',
        success_url: getAbsoluteUrl(siteUrls.organization.plansAndBilling),
        cancel_url: getAbsoluteUrl(siteUrls.dashboard.home),
        customer_email: currentOrg.email,
        subscription_data: {
            metadata: {
                user_id: user.id,
                org_id: currentOrg.id,
            },
        },
        metadata: {
            user_id: user.id,
            org_id: currentOrg.id,
        },
        ...(embed && { payment_method_types: ['card', 'us_bank_account'] }) // Optionally include more settings for embedded mode
    });

    return session.url;
}


export async function getOrgTokens() {
    await protectedProcedure();

    const { currentOrg } = await getOrganizations();

    if (!currentOrg) {
        throw new Error("Organization not found.");
    }


    return currentOrg?.tokens || await getOrgTokensBasedOnPlan(); 
}

export async function getOrgMonthlyEmailsBasedOnPlan() {
    await protectedProcedure(); // Ensure the user is authenticated

    const { currentOrg } = await getOrganizations(); // Get the current organization

    if (!currentOrg) {
        throw new Error("Organization not found.");
    }

    // Fetch the user's plan
    const subscription = await getOrgSubscription(); // This function should return the user's current plan

    if (!subscription) {
        return freePricingPlan?.monthlyEmails;
    }

    // Determine the number of tokens based on the user's plan
    let tokens;

    // Assuming userPlan has a property that defines the token limit
    switch (subscription.planTitle) {
        case pricingPlans[0]?.title:
            tokens = pricingPlans[0]?.monthlyEmails; // Adjust based on your free plan structure
            break;
        case pricingPlans[1]?.title:
            tokens = pricingPlans[1]?.monthlyEmails; // Adjust based on your free plan structure
            break;
        case pricingPlans[2]?.title:
            tokens = pricingPlans[2]?.monthlyEmails 
            break;
        case pricingPlans[3]?.title:
            tokens = pricingPlans[3]?.monthlyEmails ; // Adjust based on your premium plan structure
            break;
        default:
            tokens = freePricingPlan?.monthlyEmails; // Default case if no valid plan is found
            break;
    }

    // Optionally, you can also check if the organization has a specific allocation
    // For example, if the organization has a specific number of tokens that should be used
    return tokens; // Return the calculated tokens based on the user's plan
}

export async function getOrgTokensBasedOnPlan() {
    await protectedProcedure(); // Ensure the user is authenticated

    const { currentOrg } = await getOrganizations(); // Get the current organization

    if (!currentOrg) {
        throw new Error("Organization not found.");
    }

    // Fetch the user's plan
    const subscription = await getOrgSubscription(); // This function should return the user's current plan

    if (!subscription) {
        return freePricingPlan?.monthlyTokens;
    }

    // Determine the number of tokens based on the user's plan
    let tokens;

    // Assuming userPlan has a property that defines the token limit
    switch (subscription.planTitle) {
        case pricingPlans[0]?.title:
            tokens = pricingPlans[0]?.monthlyTokens; // Adjust based on your free plan structure
            break;
        case pricingPlans[1]?.title:
            tokens = pricingPlans[1]?.monthlyTokens; // Adjust based on your free plan structure
            break;
        case pricingPlans[2]?.title:
            tokens = pricingPlans[2]?.monthlyTokens 
            break;
        case pricingPlans[3]?.title:
            tokens = pricingPlans[3]?.monthlyTokens ; // Adjust based on your premium plan structure
            break;
        default:
            tokens = freePricingPlan?.monthlyTokens; // Default case if no valid plan is found
            break;
    }

    // Optionally, you can also check if the organization has a specific allocation
    // For example, if the organization has a specific number of tokens that should be used
    return tokens; // Return the calculated tokens based on the user's plan
}


export async function getOrgSubscription() {
    try {
        await protectedProcedure();

        const { currentOrg } = await getOrganizations();
        if (!currentOrg) return null;

        const orgSubscription = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.orgId, currentOrg.id),
        });

        if (!orgSubscription) {
            return null;
        }

        const subscription = await stripe.subscriptions.retrieve(orgSubscription.stripeSubscriptionId);

        if (!subscription) {
            return null;
        }

        if (subscription.status === 'canceled' || (subscription.cancel_at_period_end && subscription.current_period_end < Date.now() / 1000)) {
            return null; // Return null if the subscription is expired
        }


        // const customer = await stripe.customers.retrieve(subscription.customer as string);

        // Extract the payment method ID from the subscription's latest invoice
        const paymentMethodId: any = subscription.default_payment_method; // or subscription.latest_invoice.payment_method
        let card_last_four = '';
        let card_brand = '';

        if (paymentMethodId) {
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
            card_last_four = paymentMethod.card?.last4 || (paymentMethod.us_bank_account?.last4 || '');
            card_brand = paymentMethod.card?.brand || (paymentMethod.us_bank_account?.bank_name || '');
        }

        const customerPortalUrl = await stripe.billingPortal.sessions.create({
            customer: subscription.customer as string,
            return_url: getAbsoluteUrl(siteUrls.organization.plansAndBilling),
        });

        // Add plan details to the subscription
        const plan = pricingPlans.find(
            (p) =>
                p.priceId?.monthly === subscription.items.data[0]?.price.id ||
                p.priceId?.yearly === subscription.items.data[0]?.price.id,
        );

        const status = await getSubscriptionStatus(subscription);
        return {
            ...subscription,
            status: status,
            customerPortalUrl: customerPortalUrl?.url,
            renews_at: subscription.current_period_end * 1000,
            ends_at:  subscription.cancel_at_period_end && subscription.cancel_at ? subscription.cancel_at * 1000 : subscription?.canceled_at && subscription?.canceled_at * 1000,
            stripeSubscriptionId: orgSubscription.stripeSubscriptionId,
            priceId: subscription.items.data[0]?.price.id,
            planTitle: plan?.title,
            plan,
            card_last_four,
            card_brand,
        };
    } catch (error: any) {
        console.error(error?.raw?.message || error); // Log the error for debugging purposes
        return null;
    }
}


async function getSubscriptionStatus(subscription: Stripe.Subscription): Promise<'active' | 'canceled' | 'paused'> {
    try {
        // Check if the subscription is canceled
        if (subscription.status === 'canceled' || subscription.canceled_at !== null || subscription.cancel_at_period_end) {
            return 'canceled';
        }

        // Check if the subscription is paused
        const pauseCollection = subscription.pause_collection;
        if (pauseCollection && pauseCollection.behavior === 'mark_uncollectible') {
            return 'paused';
        }

        // If not canceled or paused, then it is active
        return 'active';
    } catch (error) {
        // Handle errors appropriately
        throw new Error(`Failed to retrieve subscription status: ${error.message}`);
    }
}



type SubscriptionCountByMonth = {
    status?: Stripe.Subscription.Status;
};

export async function getSubscriptionsCount({
    status,
}: SubscriptionCountByMonth) {
    await protectedProcedure();

    const dateBeforeMonths = subMonths(new Date(), 6);
    const startDateOfTheMonth = startOfMonth(dateBeforeMonths);

    const subscriptions = await stripe.subscriptions.list({
        created: {
            gte: Math.floor(startDateOfTheMonth.getTime() / 1000),
        },
        status,
    });

    const months = eachMonthOfInterval({
        start: startDateOfTheMonth,
        end: new Date(),
    });

    const subscriptionsCountByMonth = months.map((month) => {
        const monthStr = format(month, "MMM-yyy");
        const count =
            subscriptions.data.filter(
                (subscription) =>
                    format(
                        new Date(subscription.created * 1000),
                        "MMM-yyy",
                    ) === monthStr,
            )?.length ?? 0;
        return { Date: monthStr, SubsCount: count };
    });

    return {
        totalCount: subscriptions.data.length ?? 0,
        subscriptionsCountByMonth,
    };
}

export async function getRevenueCount() {
    await protectedProcedure();

    const dateBeforeMonths = subMonths(new Date(), 6);
    const startDateOfTheMonth = startOfMonth(dateBeforeMonths);

    const invoices = await stripe.invoices.list({
        created: {
            gte: Math.floor(startDateOfTheMonth.getTime() / 1000),
        },
    });

    const totalRevenue = invoices.data.reduce(
        (acc, invoice) => acc + invoice.amount_paid,
        0,
    );

    const months = eachMonthOfInterval({
        start: startDateOfTheMonth,
        end: new Date(),
    });

    const revenueCountByMonth = months.map((month) => {
        const monthStr = format(month, "MMM-yyy");
        const revenueCount =
            invoices.data
                .filter(
                    (invoice) =>
                        format(
                            new Date(invoice.created * 1000),
                            "MMM-yyy",
                        ) === monthStr,
                )
                .reduce((acc, invoice) => acc + invoice.amount_paid, 0) ?? 0;

        const count = revenueCount / 100; // Stripe amount is in cents
        return { Date: monthStr, RevenueCount: count };
    });

    return {
        totalRevenue: totalRevenue / 100, // Stripe amount is in cents
        revenueCountByMonth,
    };
}
