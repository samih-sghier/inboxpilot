import { NextResponse } from 'next/server';
import { handleOAuthCallbackMutation, listEmailsMutation } from '@/server/actions/gmail/mutations';
import { siteUrls } from '@/config/urls';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Extract the state parameter
    const redirectUrl = new URL(siteUrls.dashboard.connect, request.url).toString();

    if (!code) {
        return NextResponse.redirect(redirectUrl);
    }

    try {
        // Exchange the authorization code for tokens
        const { tokens, email, metadata } = await handleOAuthCallbackMutation({ code, state });
        const emails = await listEmailsMutation(tokens);
        

        // Optionally, you can store the tokens or any other information here

        // Redirect the user to the dashboard or any other URL
        const redirectUrl = new URL(siteUrls.dashboard.connect, request.url).toString();
        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error("Error exchanging code for tokens: ", error);
        return NextResponse.json({ error: `Failed to exchange code for tokens: ${error.message}` }, { status: 500 });
    }
}
