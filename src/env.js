import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    /**
     * Specify your server-side environment variables schema here. This way you can ensure the app
     * isn't built with invalid env vars.
     */
    server: {
        DATABASE_URL: z
            .string()
            .url()
            .refine(
                (str) => !str.includes("postgresql://samihsghier:@Rabat1995@localhost:5432/sg"),
                "You forgot to change the default URL",
            ),
        NODE_ENV: z
            .enum(["development", "test", "production"])
            .default("development"),
        NEXTAUTH_SECRET:
            process.env.NODE_ENV === "production"
                ? z.string()
                : z.string().optional(),
        NEXTAUTH_URL: z.string().url(),
        GOOGLE_CLIENT_ID: z.string(),
        GOOGLE_CLIENT_SECRET: z.string(),
        GITHUB_CLIENT_ID: z.string(),
        GITHUB_CLIENT_SECRET: z.string(),
        RESEND_API_KEY: z.string(),
        UPLOADTHING_SECRET: z.string(),
        UPLOADTHING_ID: z.string(),
        STRIPE_SK: z.string(),
        STRIPE_HOOK_SECRET: z.string(),
        OPENAI_API_KEY: z.string(),
        OUTLOOK_CLIENT_ID: z.string(),
        OUTLOOK_CLIENT_SECRET: z.string(),
        OUTLOOK_TENANT_ID: z.string(),
        OUTLOOK_WEBHOOK: z.string(),

    },

    /**
     * Specify your client-side environment variables schema here. This way you can ensure the app
     * isn't built with invalid env vars. To expose them to the client, prefix them with
     * `NEXT_PUBLIC_`.
     */
    client: {
        // NEXT_PUBLIC_CLIENTVAR: z.string(),
        NEXT_PUBLIC_POSTHOG_KEY: z.string(),
        NEXT_PUBLIC_POSTHOG_HOST: z.string(),
        NEXT_PUBLIC_WAITLIST_MODE: z.enum(["on", "off"]).default("off"),
        NEXT_PUBLIC_MAINTENANCE_MODE: z.enum(["on", "off"]).default("off"),
        NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: z.string(),
        // NEXT_PUBLIC_STRIPE_PRICE_BASIC_MONTHLY: z.string(),
        // NEXT_PUBLIC_STRIPE_PRICE_BASIC_YEARLY: z.string(),
        NEXT_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY: z.string(),
        NEXT_PUBLIC_STRIPE_PRICE_STANDARD_YEARLY: z.string(),
        NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY: z.string(),
        NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY: z.string(),
        NEXT_PUBLIC_STRIPE_PRICE_HOBBY_YEARLY: z.string(),
        NEXT_PUBLIC_STRIPE_PRICE_HOBBY_MONTHLY: z.string(),
        NEXT_PUBLIC_CRAWLER_API_KEY: z.string(),
    },

    /**
     * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
     * middlewares) or client-side so we need to destruct manually.
     */
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
        UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
        UPLOADTHING_ID: process.env.UPLOADTHING_ID,
        STRIPE_SK: process.env.STRIPE_SK,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        STRIPE_HOOK_SECRET: process.env.STRIPE_HOOK_SECRET,
        OUTLOOK_CLIENT_ID: process.env.OUTLOOK_CLIENT_ID,
        OUTLOOK_CLIENT_SECRET: process.env.OUTLOOK_CLIENT_SECRET,
        OUTLOOK_TENANT_ID: process.env.OUTLOOK_TENANT_ID,
        OUTLOOK_WEBHOOK: process.env.OUTLOOK_WEBHOOK,
        // NEXT_PUBLIC_STRIPE_PRICE_BASIC_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_MONTHLY,
        // NEXT_PUBLIC_STRIPE_PRICE_BASIC_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_YEARLY,
        NEXT_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY,
        NEXT_PUBLIC_STRIPE_PRICE_STANDARD_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_YEARLY,
        NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY,
        NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY,
        NEXT_PUBLIC_STRIPE_PRICE_HOBBY_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOBBY_YEARLY,
        NEXT_PUBLIC_STRIPE_PRICE_HOBBY_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOBBY_MONTHLY,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        NEXT_PUBLIC_WAITLIST_MODE: process.env.NEXT_PUBLIC_WAITLIST_MODE,
        NEXT_PUBLIC_MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE,
        NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY,
        NEXT_PUBLIC_CRAWLER_API_KEY: process.env.NEXT_PUBLIC_CRAWLER_API_KEY,

    },
    /**
     * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
     * useful for Docker builds.
     */
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
    /**
     * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
     * `SOME_VAR=''` will throw an error.
     */
    emptyStringAsUndefined: true,
});
