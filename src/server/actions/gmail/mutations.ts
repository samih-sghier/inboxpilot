"use server";
import { decode } from 'html-entities';

import { db } from "@/server/db";
import { protectedProcedure, adminProcedure } from "@/server/procedures";
import { google } from 'googleapis';
import { env } from "@/env";
import { OAuth2Client } from 'google-auth-library';
import type { z } from "zod";
import { siteUrls } from "@/config/urls";
import { connected, connectedInsertSchema, connectedUpdateSchema } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { getOrganizations } from "../organization/queries";
import { getOrgSubscription } from "../stripe_subscription/query";
import { pricingIds, pricingPlans } from '@/config/pricing';
import { count } from 'console';
import { stopOutlookWatchMutation } from '../outlook/mutations';

// Replace these with your own credentials
const CLIENT_ID = env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${env.NEXTAUTH_URL}/api/gmail/authorize`;

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
// const people = google.people({ version: 'v1', auth: oauth2Client });


/**
 * Handle Gmail OAuth callback and exchange code for access token
 * @params code - The authorization code from Gmail
 */

export interface MetaData {
    orgId: string,
    frequency: number,
    sendMode: string,
    purpose: string,
    provider: string,
    reveal_ai: boolean

}
export async function handleOAuthCallbackMutation({ code, state }: { code: string, state: any }) {
    if (!code) throw new Error("Authorization code is required");

    try {
        const { tokens } = await oauth2Client.getToken(code);
        await oauth2Client.setCredentials(tokens);
        const profileResponse = await gmail.users.getProfile({ userId: 'me' });
        const { emailAddress } = profileResponse?.data;
        let metadata: MetaData = {};

        if (state) {
            try {
                metadata = JSON.parse(state);
            } catch (error) {
                console.warn('Failed to parse state:', error);
            }
        }
        const orgId = metadata?.orgId || '';
        const purpose = metadata?.purpose;
        const email = emailAddress || '';
        // Set up the Gmail watch for push notifications
        const watchResponse = await createWatchMutation(tokens);
        if (watchResponse.error) {
            console.error('Error setting up Gmail watch:', watchResponse.error);
            throw new Error('Failed to set up Gmail watch');
        }

        await createConnectedMutation({
            email,
            orgId,
            access_token: tokens.access_token || '',
            refresh_token: tokens.refresh_token || '',
            provider: metadata.provider,
            expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 10000) : undefined,
            frequency: +metadata.frequency || undefined,
            sendMode: metadata.sendMode || 'draft',
            reveal_ai: metadata?.reveal_ai,
            isActive: true,
            historyId: watchResponse.historyId || -1,
            expiration: BigInt(watchResponse.expiration || 0),
            purpose,
        });

        // Fetch user profile information
        // const profileResponse = await gmail.users.getProfile({ userId: 'me' });
        // const { emailAddress } = profileResponse.data;
        // Store tokens and email in your database or session if needed

        // You can store tokens and profile information in your database
        // Example:

        return { tokens, email, metadata };
    } catch (error) {
        throw new Error("Failed to exchange code for access token and fetch profile: " + error.message);
    }
}

export async function createWatchMutation({ access_token, refresh_token }: { access_token: string, refresh_token: string }) {
    try {

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Define the Pub/Sub topic and label to watch (e.g., "INBOX")
        const topicName = 'projects/kava-c7f69/topics/inboxpilot';  // Replace with your actual Pub/Sub topic
        const watchRequest = {
            labelIds: ['INBOX'],  // Monitor the INBOX for new messages
            topicName: topicName,
        };

        // Call Gmail API to set up watch
        const response = await gmail.users.watch({
            userId: 'me',  // 'me' refers to the authenticated user
            requestBody: watchRequest,
        });

        return { historyId: convertStringToInt(response.data.historyId), expiration: convertExpirationToInt(response.data.expiration) };  // Return the watch response data

    } catch (error) {
        console.error('Error setting up Gmail watch:', error);
        return { error: error.message };
    }
}

export async function stopWatchMutation({ access_token, refresh_token }: { access_token: string, refresh_token: string }) {
    try {

        // Set the tokens
        await oauth2Client.setCredentials({ access_token, refresh_token });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Call Gmail API to stop watch
        await gmail.users.stop({
            userId: 'me',  // 'me' refers to the authenticated user
        });

        return { message: 'Watch stopped successfully.' };

    } catch (error) {
        console.error('Error stopping Gmail watch:', error);
        return { error: error?.message };
    }
}

function convertExpirationToInt(expiration?: string | null): number | null {
    if (expiration) {
        // Convert the string to an integer
        const expirationInt = parseInt(expiration, 10);

        // Check if the conversion was successful (not NaN)
        if (!isNaN(expirationInt)) {
            return expirationInt;
        }
    }
    // If expiration is null or conversion fails, return null
    return null;
}

function convertStringToInt(value?: string | null): number | null {
    if (value) {
        const intValue = parseInt(value, 10);
        return !isNaN(intValue) ? intValue : null;
    }
    return null;
}







/**
 * Authorize Gmail and redirect user to consent screen
 */
export async function authorizeGmailMutationSend(metadata?: MetaData) {

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // Forces the consent screen to show
        scope: [
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/pubsub'
        ],
        state: JSON.stringify(metadata)
    });
    return authUrl;
}

/**
 * Authorize Gmail and redirect user to consent screen
 */
export async function authorizeGmailMutationRead(metadata?: MetaData) {

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // Forces the consent screen to show
        scope: [
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/pubsub'

        ],
        state: JSON.stringify(metadata)
    });
    return authUrl;
}


type CreateConnectedProps = z.infer<typeof connectedInsertSchema>;
export async function createConnectedMutation(props: CreateConnectedProps) {
    // Ensure the user is authenticated and fetch organizations
    const { user } = await protectedProcedure();
    const { currentOrg } = await getOrganizations();

    // Validate the connected data against the schema
    const connectedParse = await connectedInsertSchema.safeParseAsync(props);

    if (!connectedParse.success) {
        console.error(connectedParse.error.errors);
        throw new Error("Invalid connected item", {
            cause: connectedParse.error.errors,
        });
    }

    const connectedData = connectedParse.data;

    // Check if the item already exists
    const existingConnectedItem = await db
        .select()
        .from(connected)
        .where(and(
            eq(connected.email, connectedData?.email),
            eq(connected.orgId, currentOrg?.id ?? connectedData?.orgId)
        ))
        .execute();

    if (existingConnectedItem.length > 0) {
        // Update the existing record
        return await db
            .update(connected)
            .set({
                refresh_token: connectedData?.refresh_token,
                access_token: connectedData.access_token,
                expires_at: connectedData.expires_at,
                isActive: true,
                // Update any other fields as needed
            })
            .where(and(
                eq(connected.email, connectedData.email),
                eq(connected.orgId, currentOrg?.id ?? connectedData.orgId)
            ))
            .execute();
    } else {
        // Insert the connected item
        return await db
            .insert(connected)
            .values({
                ...connectedData,
                orgId: connectedData.orgId ?? currentOrg?.id,
                isActive: true,
            })
            .execute();
    }
}

/**
 * Remove a connected item by email
 * @param email - The email of the connected item to remove
 */
export async function removeConnectedItemMutation({
    email,
}: {
    email: string;
}) {
    const { currentOrg } = await getOrganizations();

    // Ensure an email is provided
    if (!email) {
        throw new Error("Email must be provided");
    }

    // Fetch tokens for the given email from the connected table

    const tokenRecord: any = await db
        .select()
        .from(connected)
        .where(and(
            eq(connected.orgId, currentOrg.id),
            eq(connected.email, email)
        ))
        .execute();

    if (tokenRecord.count == 0) {
        throw new Error("No tokens found for the provided email");
    }

    const { access_token, refresh_token, provider } = tokenRecord[0]; // Get the first record
    // Remove the connected item
    const result = await db.delete(connected).where(
        and(
            eq(connected.orgId, currentOrg.id),
            eq(connected.email, email)
        )
    ).execute();

    if (result.count === 0) {
        throw new Error("No matching connected entry found");
    }

    if (access_token && refresh_token) {
        // Stop the Gmail watch if the removal was successful
        if (provider == "google") {
            const stopWatchResult = await stopWatchMutation({
                access_token,
                refresh_token,
            });
            if (stopWatchResult.error) {
                console.error("Error stopping the watch:", stopWatchResult.error);
                // You might want to handle the error differently depending on your needs
            }
        } else if (provider == "outlook" ){
            const stopWatchResult = await stopOutlookWatchMutation({
                access_token,
                refresh_token,
            });
            if (stopWatchResult.error) {
                console.error("Error stopping the watch:", stopWatchResult.error);
                // You might want to handle the error differently depending on your needs
            }
        }
     
    } else {
        console.error("Error to stop gmail watch");
    }


    return {
        message: 'Connected item removed and watch stopped successfully.',
    };
}

/**
 * Update the access token of a connected item
 * @param props - The data to update
 */
type UpdateConnectedProps = z.infer<typeof connectedUpdateSchema>;

export async function updateConnectedMutation(props: UpdateConnectedProps & { email: string }) {
    const { email, ...updateProps } = props;

    // Validate the connected data against the schema
    const connectedParse = await connectedUpdateSchema.safeParseAsync(updateProps);

    if (!connectedParse.success) {
        throw new Error("Invalid connected data", {
            cause: connectedParse.error.errors,
        });
    }

    // Fetch the current connected item
    const currentItems = await db
        .select()
        .from(connected)
        .where(eq(connected.email, email))
        .execute();

    if (currentItems.length === 0) {
        throw new Error("Connected item not found");
    }

    // Update the connected item
    return await db.update(connected).set(updateProps).where(
        and(
            eq(connected.email, email)
        )
    ).execute();
}

export const canPostConnected = async (): Promise<boolean> => {
    // Check if the subscription is active
    const { currentOrg } = await getOrganizations();

    if (!currentOrg) {
        throw new Error("Organization not found");
    }

    const currentOrgId = currentOrg.id;
    const subscription = await getOrgSubscription();

    const isSubscriptionActive = () => {
        if (!subscription) return false;
        const currentDate = new Date();
        return subscription.status === 'active' || (subscription.status === 'canceled' && subscription.ends_at && new Date(subscription.ends_at) > currentDate);
    };

    // Verify if the plan allows posting more connected items
    const verifyPlan = async () => {
        const planId = subscription?.plan?.id || pricingIds.free; // Default to free plan if no subscription

        // Find the plan based on pricingIds
        const plan = pricingPlans.find(p => p.id === planId);

        if (!plan) return false;

        // Count the number of connected items already posted by the organization
        const connectedCount = await db
            .select({ count: count() })
            .from(connected)
            .where(eq(connected.orgId, currentOrgId))
            .execute()
            .then(res => res[0]?.count ?? 0);

        // Check if the current connected count exceeds the limit
        return (connectedCount < plan.planLimit);
    };

    // Check if the user can post another connected item based on their plan
    return isSubscriptionActive() && await verifyPlan();
};
