"use server";

import { freePricingPlan, pricingPlans } from "@/config/pricing";
import { getOrgSubscription } from "@/server/actions/stripe_subscription/query";
import { db } from "@/server/db";
import { organizations, subscriptions, webhookEvents } from "@/server/db/schema";
import stripe from "@/server/stripe";
import { webhookHasData, webhookHasMeta } from "@/validations/stripe"; // Update import to Stripe
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Stripe } from "stripe"; // Import Stripe's types
import { getOrganizations } from "../organization/queries";
import { getUser } from "@/server/auth";
import { protectedProcedure } from "@/server/procedures";

// Initialize Stripe with your secret key

type NewWebhookEvent = typeof webhookEvents.$inferInsert;
type NewSubscription = typeof subscriptions.$inferInsert;

export async function storeWebhookEvent(
    eventName: string,
    body: NewWebhookEvent["body"],
) {
    const returnedValue = await db
        .insert(webhookEvents)
        .values({
            eventName,
            processed: false,
            body,
        })
        .returning();

    return returnedValue[0];
}


/**
 * Processes a webhook event and updates the corresponding data in the database.
 * @param webhookEvent - The webhook event to process.
 * @returns A Promise that resolves when the processing is complete.
 * @throws An error if the webhook event is not found in the database or if there is an error during processing.
 */
export async function processWebhookEvent(webhookEvent: { id?: string; body: Stripe.Event }) {
    // console.log("Processing webhook event:", webhookEvent);

    // Retrieve the webhook event from the database
    const dbWebhookEvent = await db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.id, webhookEvent.id!));

    if (dbWebhookEvent.length < 1) {
        throw new Error(`Webhook event #${webhookEvent.id} not found in the database.`);
    }

    let processingError = "";
    const eventBody = webhookEvent.body;

    if (!eventBody || !eventBody.type || !eventBody.data) {
        processingError = "Event body is missing required properties.";
    } else {
        const eventType = eventBody.type;

        // Handle different Stripe event types
        switch (eventType) {
            case 'invoice.payment_succeeded':
            case 'invoice.payment_failed':
                const invoice = eventBody.data.object as Stripe.Invoice;
                break;
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                // Handle subscription events
                const subscription = eventBody.data.object;
                // console.log("subscription that was created ", subscription)
                const priceId = subscription.items.data[0]?.price.id;
                const orgId = subscription?.metadata?.org_id;



                // Find the plan in your pricing configuration
                const plan = pricingPlans.find(
                    (p) => p.priceId?.monthly === priceId || p.priceId?.yearly === priceId
                );

                if (!plan) {
                    processingError = `Plan with priceId ${priceId} not found.`;
                } else {

                    // Update the subscription in the database
                    const updateData: NewSubscription = {
                        stripeSubscriptionId: subscription.id,
                        orgId: orgId || "", // Handle optional metadata
                        priceId: priceId || "",
                        orderId: subscription.items.data[0]?.id || "" // Adjust as needed
                    };

                    try {
                        await db
                            .insert(subscriptions)
                            .values(updateData)
                            .onConflictDoUpdate({
                                target: subscriptions.orgId,
                                set: updateData
                            });

                        await db
                            .update(organizations)
                            .set({ max_tokens: (plan?.monthlyTokens || freePricingPlan?.monthlyTokens), max_emails: (plan?.monthlyEmails || freePricingPlan?.monthlyEmails) })
                            .where(eq(organizations.id, orgId || "NO_ORG_ID"))
                            .execute();
                        // console.log("data to be inserted", updateData)
                    } catch (error) {
                        processingError = `Failed to upsert Subscription #${updateData.stripeSubscriptionId} to the database.`;
                        console.error(error);
                    }
                }
                break;

            case 'checkout.session.completed':
                // Handle checkout session completed events
                const session = eventBody.data.object as Stripe.Checkout.Session;
                // console.log('Checkout Session Completed Event:', session);
                // Implement checkout session handling logic here
                break;

            default:
                // Handle unknown or unhandled event types
                // console.log(`Unhandled event type: ${eventType}`);
                break;
        }
    }

    // Update the webhook event status in the database
    await db
        .update(webhookEvents)
        .set({
            processed: true,
            processingError
        })
        .where(eq(webhookEvents.id, webhookEvent.id!));
}

export async function getCustomerById(customerD: any) {
    try {
        // Retrieve the subscription      
        // Retrieve the customer using the customer ID from the subscription
        const customer = await stripe.customers.retrieve(customerD);

        return customer;
    } catch (error) {
        console.error('Error retrieving customer:', error);
        throw error;
    }
}

export async function changePlan(
    currentPriceId: string, // This should be the SubscriptionItem ID
    newPriceId: string,     // This should be the new Plan (Price) ID
) {
    const { currentOrg } = await getOrganizations();
    const { user } = await protectedProcedure();

    const subscription = await getOrgSubscription();

    if (!subscription || !currentOrg) {
        throw new Error(`No subscription found for organization ${currentOrg?.id}.`);
    }


    try {
        // Retrieve the subscription to get the current items
        const currentSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

        // Log current subscription items
        // console.log("Current Subscription Items:", currentSubscription.items.data);

        // Identify the SubscriptionItem ID for the item to be updated
        const subscriptionItemId = currentSubscription.items.data.find(item => item.price.id === currentPriceId)?.id;

        if (!subscriptionItemId) {
            throw new Error(`Subscription item with Price ID ${currentPriceId} not found.`);
        }

        // Update the subscription by replacing the old plan with the new plan
        const updatedSub = await stripe.subscriptions.update(subscription.stripeSubscriptionId,
            {
                items: [{
                    id: currentSubscription.items.data[0]?.id,
                    price: newPriceId,
                }],
                proration_behavior: 'create_prorations', // Adjust as needed
            });

        // Save the updated subscription in the database
        try {
            await db
                .update(subscriptions)
                .set({
                    stripeSubscriptionId: updatedSub.id,
                    priceId: newPriceId,
                })
                .where(
                    eq(subscriptions.stripeSubscriptionId, subscription.id),
                );
        } catch (error) {
            throw new Error(
                `Failed to update Subscription #${subscription.stripeSubscriptionId} in the database.`,
            );
        }

        revalidatePath("/");

        return JSON.parse(JSON.stringify(updatedSub));
    } catch (error) {
        throw new Error(`Failed to update subscription plan: ${error.message}`);
    }
}



export async function cancelPlan() {
    const subscription = await getOrgSubscription();

    if (!subscription) {
        throw new Error("No subscription found.");
    }

    try {
        // Cancel the subscription in Stripe
        const canceledSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });

        // Save in the database
        try {
            await db
                .update(subscriptions)
                .set({
                    stripeSubscriptionId: canceledSubscription.id,
                    priceId: canceledSubscription.items.data[0]?.price.id || undefined, // Update to the latest price ID or null if not available
                })
                .where(
                    eq(subscriptions.stripeSubscriptionId, subscription.stripeSubscriptionId),
                );
        } catch (error) {
            throw new Error(
                `Failed to update Subscription #${subscription.stripeSubscriptionId} in the database.`,
            );
        }

        revalidatePath("/");

        return JSON.parse(JSON.stringify(canceledSubscription));
    } catch (error) {
        throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
}

export async function pausePlan() {
    const subscription = await getOrgSubscription();

    if (!subscription) {
        throw new Error("No subscription found.");
    }

    // Stripe does not have a direct "pause" feature, so this might involve changing the subscription to a trial period or similar.
    // For this example, we assume a custom implementation.
    try {
        const returnedSub = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            pause_collection: { behavior: 'mark_uncollectible' }, // Example behavior
        });

        // Update the db
        try {
            await db
                .update(subscriptions)
                .set({
                    stripeSubscriptionId: returnedSub.id,
                    priceId: returnedSub.items.data[0]?.price.id, // Update with current plan
                })
                .where(
                    eq(subscriptions.stripeSubscriptionId, subscription.stripeSubscriptionId),
                );
        } catch (error) {
            throw new Error(
                `Failed to pause Subscription #${subscription.stripeSubscriptionId} in the database.`,
            );
        }

        revalidatePath("/");

        return JSON.parse(JSON.stringify(returnedSub));
    } catch (error) {
        throw new Error(`Failed to pause subscription: ${error.message}`);
    }
}

export async function resumePlan() {
    const subscription = await getOrgSubscription();

    if (!subscription) {
        throw new Error("No subscription found.");
    }

    // Resume a subscription might involve removing pause_collection settings or similar.
    try {
        const returnedSub = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            pause_collection: null, // Clear pause_collection
            cancel_at_period_end: false
        });

        // Update the db
        try {
            await db
                .update(subscriptions)
                .set({
                    stripeSubscriptionId: returnedSub.id,
                    priceId: returnedSub.items.data[0]?.price.id, // Update with current plan
                })
                .where(
                    eq(subscriptions.stripeSubscriptionId, subscription.stripeSubscriptionId),
                );
        } catch (error) {
            throw new Error(
                `Failed to resume Subscription #${subscription.stripeSubscriptionId} in the database.`,
            );
        }

        revalidatePath("/");

        return JSON.parse(JSON.stringify(returnedSub));
    } catch (error) {
        throw new Error(`Failed to resume subscription: ${error.message}`);
    }
}
