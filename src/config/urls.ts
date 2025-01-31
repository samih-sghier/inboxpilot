/**
 * @purpose This file contains all the site urls
 *
 * To add a new URL:
 * 1. Add a new property to the siteUrls object with the URL path.
 * 2. Import the siteUrls object from "@/config/urls" in the file where you want to use the URL.
 * 3. Use the URL in the file.
 */

export const siteUrls = {
    publicUrl: "https://inboxpilot.co",
    github: "https://github.com/inboxpilot",
    twitter: "https://x.com/inboxpilot",
    instagram: "https://instagram.com/inboxpilot",
    home: "/",
    pricing: "/pricing",
    features: "/features",
    support: "/support",
    blogs: "/blogs",
    docs: "/docs",
    changelogs: "/changelogs",
    maintenance: "/maintenance",
    waitlist: "/waitlist",
    subletguard: "https://inboxpilot.co",
    privacy: "/privacy",
    terms: "/terms",
    contact: "/contact",
    dashboard: {
        home: "/dashboard",
        emailConfig: "/configuration",
        sources: "/sources",
        connect: "/connect",
        logs: "/logs",
        alerts: "/alerts",
    },
    feedback: "/feedback",
    organization: {
        members: {
            home: "/org/members",
            invite: "/org/members/invite",
        },
        settings: "/org/settings",
        plansAndBilling: "/org/billing",
    },
    auth: {
        login: "/auth/login",
        signup: "/auth/signup",
    },
    admin: {
        dashboard: "/admin/dashboard",
        users: "/admin/users",
        organizations: "/admin/organizations",
        settings: "/admin/settings",
        waitlist: "/admin/waitlist",
        feedbacks: "/admin/feedbacks",
        analytics: "https://us.posthog.com/project/83824/dashboard",
    },
    profile: {
        settings: "/profile/settings",
        billing: "/profile/billing",
    },
} as const;

export const publicRoutes: string[] = [
    siteUrls.publicUrl,
    siteUrls.home,
    siteUrls.pricing,
    siteUrls.features,
    siteUrls.support,
    siteUrls.blogs,
    siteUrls.docs,
    siteUrls.changelogs,
    siteUrls.maintenance,
    siteUrls.waitlist,
    siteUrls.subletguard,
];

export const protectedRoutes: string[] = [
    siteUrls.dashboard.home,
    siteUrls.dashboard.sources,
    siteUrls.dashboard.connect,
    siteUrls.dashboard.alerts,
    siteUrls.feedback,
    siteUrls.organization.members.home,
    siteUrls.organization.members.invite,
    siteUrls.organization.settings,
    siteUrls.organization.plansAndBilling,
    siteUrls.auth.login,
    siteUrls.auth.signup,
    siteUrls.admin.dashboard,
    siteUrls.admin.users,
    siteUrls.admin.organizations,
    siteUrls.admin.settings,
    siteUrls.admin.waitlist,
    siteUrls.admin.feedbacks,
    siteUrls.admin.analytics,
    siteUrls.profile.settings,
    siteUrls.profile.billing,
];
