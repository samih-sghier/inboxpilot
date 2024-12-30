/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

await import("./src/env.js");
import createMDX from "fumadocs-mdx/config";

const withMDX = createMDX({
    mdxOptions: {
        lastModifiedTime: "git",
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Optionally, add any other Next.js config below
    experimental: {
        optimizePackageImports: ["lucide-react"],
        sri: { algorithm: 'sha256' }, // Enable Subresource Integrity (SRI)
        serverActions: {
            bodySizeLimit: '10mb',
          },
    },
    images: {
        remotePatterns: [{ hostname: "images.unsplash.com" }, { hostname: "utfs.io" }],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    async rewrites() {
        return [
            {
                source: "/ingest/static/:path*",
                destination: "https://us-assets.i.posthog.com/static/:path*",
            },
            {
                source: "/ingest/:path*",
                destination: "https://us.i.posthog.com/:path*",
            },
        ];
    },
    // This is required to support PostHog trailing slash API requests
    skipTrailingSlashRedirect: true,
    webpack: (config) => {
        // See https://webpack.js.org/configuration/resolve/#resolvealias
        config.resolve.alias = {
            ...config.resolve.alias,
            sharp$: false,
            "onnxruntime-node$": false,
        };
        return config;
    },

};

export default withMDX(nextConfig);
