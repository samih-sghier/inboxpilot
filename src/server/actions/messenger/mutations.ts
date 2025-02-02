"use server";

import { db } from "@/server/db";
import { protectedProcedure } from "@/server/procedures";
import { env } from "@/env";
import { connected, connectedInsertSchema, connectedUpdateSchema, social } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

const FB_APP_ID = "602394722407996";
const FB_APP_SECRET = "d6f425298beee2f96e1a8d3cad1336f0";
const REDIRECT_URI = `${env.NEXTAUTH_URL}/api/messenger/authorize`;

export interface FacebookMetadata {
    orgId: string;
    purpose: string;
    provider: string;
    reveal_ai: boolean;
    response_mode: string;
}

export async function authorizeFacebookPage(metadata: FacebookMetadata) {
    try {
        // Create the authorization URL with necessary permissions
        const scopes = [
            'pages_messaging',
            'pages_show_list',
            'pages_manage_metadata',
            'pages_read_engagement'
        ].join(',');

        console.log("system dear reader")

        const state = JSON.stringify(metadata);

        const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
            `client_id=${FB_APP_ID}` +
            `&redirect_uri=${REDIRECT_URI}` +
            `&state=${encodeURIComponent(state)}` +
            `&scope=${scopes}`;

        return authUrl;
    } catch (error) {
        console.error('Error creating Facebook authorization URL:', error);
        throw new Error('Failed to create authorization URL');
    }
}

export async function handleFacebookCallbackMutation({ code, state }: { code: string; state: string }) {
    if (!code) throw new Error("Authorization code is required");

    try {
        // Exchange code for access token
        const tokenResponse = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?` +
            `client_id=${FB_APP_ID}` +
            `&client_secret=${FB_APP_SECRET}` +
            `&redirect_uri=${REDIRECT_URI}` +
            `&code=${code}`
        );


        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            throw new Error('Failed to obtain access token');
        }

        // Get long-lived token
        const longLivedTokenResponse = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?` +
            `grant_type=fb_exchange_token` +
            `&client_id=${FB_APP_ID}` +
            `&client_secret=${FB_APP_SECRET}` +
            `&fb_exchange_token=${tokenData.access_token}`
        );


        const longLivedData = await longLivedTokenResponse.json();

        // Get user's pages
        const pagesResponse = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedData.access_token}`
        );

        const pagesData = await pagesResponse.json();

        let metadata: FacebookMetadata = {};
        if (state) {
            try {
                metadata = JSON.parse(state);
            } catch (error) {
                console.warn('Failed to parse state:', error);
            }
        }
        console.log("pages data")
        console.log(pagesData)

        // Store each page connection
        for (const page of pagesData.data) {
            await createSocialMutation({
                pageId: page.id,
                pageName: page.name,
                access_token: page.access_token,
                orgId: metadata.orgId,
                provider: 'messenger',
                purpose: metadata.purpose,
                reveal_ai: metadata.reveal_ai,
                isActive: true,
            });
        }

        return { success: true, pages: pagesData.data };
    } catch (error) {
        console.error('Facebook callback error:', error);
        throw new Error("Failed to process Facebook authorization: " + error.message);
    }
}

export async function createSocialMutation(data: {
    pageId: string;
    pageName: string;
    access_token: string;
    orgId: string;
    provider: string;
    purpose: string;
    reveal_ai: boolean;
    isActive: boolean;
}) {
    try {
        await db.insert(social).values({
            pageId: data.pageId,
            pageName: data.pageName,
            accessToken: data.access_token,
            orgId: data.orgId,
            provider: data.provider,
            purpose: data.purpose,
            revealAi: data.reveal_ai,
            isActive: data.isActive,
        });

        return { success: true };
    } catch (error) {
        console.error('Error creating Facebook connection:', error);
        throw new Error('Failed to store Facebook connection');
    }
}

export async function disconnectFacebookPageMutation({ pageId }: { pageId: string }) {
    try {
        const connection = await db.query.connected.findFirst({
            where: eq(connected.pageId, pageId),
        });

        if (!connection) {
            throw new Error('Page connection not found');
        }

        // Revoke app permissions
        await fetch(
            `https://graph.facebook.com/v18.0/${pageId}/permissions?access_token=${connection.accessToken}`,
            { method: 'DELETE' }
        );

        // Update database
        await db
            .update(connected)
            .set({ isActive: false })
            .where(eq(connected.pageId, pageId));

        return { success: true };
    } catch (error) {
        console.error('Error disconnecting Facebook page:', error);
        throw new Error('Failed to disconnect Facebook page');
    }
}

// Queries
export async function getConnectedFacebookPages(orgId: string) {
    try {
        const pages = await db.query.connected.findMany({
            where: and(
                eq(connected.orgId, orgId),
                eq(connected.provider, 'facebook'),
                eq(connected.isActive, true)
            ),
        });

        return pages;
    } catch (error) {
        console.error('Error fetching Facebook pages:', error);
        throw new Error('Failed to fetch Facebook pages');
    }
}

export async function getFacebookPageConnection(pageId: string) {
    try {
        const connection = await db.query.connected.findFirst({
            where: and(
                eq(connected.pageId, pageId),
                eq(connected.provider, 'facebook'),
                eq(connected.isActive, true)
            ),
        });

        return connection;
    } catch (error) {
        console.error('Error fetching Facebook page connection:', error);
        throw new Error('Failed to fetch Facebook page connection');
    }
}