import { db } from "@/server/db";
import { sgAlert, subscriptions, users, membersToOrganizations, emailLogs, connected, sources, } from "@/server/db/schema";
import { eq, count, and, isNotNull, or, ne } from "drizzle-orm";
import { protectedProcedure } from "@/server/procedures";
import { getOrganizations } from "@/server/actions/organization/queries";
import { freePricingPlan } from "@/config/pricing";
import { getOrgTokens, getOrgTokensBasedOnPlan } from "../stripe_subscription/query";

// Function to get dashboard information
export async function getDashboardInfo() {
    await protectedProcedure();
    const { currentOrg } = await getOrganizations();

    if (!currentOrg) {
        return {
            emailsSent: 0,
            emailsSentGrowth: 0,
            activeUsers: 0,
            activeUsersGrowth: 0,
            connectedEmails: 0,
            connectedEmailsGrowth: 0,
            sources: 0,
            scheduledEmails: 0,
            // avgResponseTimeChange: 0,
            overLimit: false,
            alerts: 0,
            apiUsage: 0,
            apiUsageChange: 0
        };
    }

    const organizationId = currentOrg.id;

    const emailsSent = await db
        .select({ count: count() })
        .from(emailLogs)
        .where(eq(emailLogs.orgId, organizationId))
        .execute()
        .then(res => res[0]?.count ?? 0);

    const activeUsers = await db
        .select({ count: count() })
        .from(membersToOrganizations)
        .where(eq(membersToOrganizations.organizationId, organizationId))
        .execute()
        .then(res => res[0]?.count ?? 0);

    const connectedEmails = await db
        .select({ count: count() })
        .from(connected)
        .where(eq(connected.orgId, organizationId))
        .execute()
        .then(res => res[0]?.count ?? 0);

    const sourcesNotNull = await db
        .select({ count: count() })
        .from(sources)
        .where(
            and(
                eq(sources.orgId, organizationId), // Ensure correct organization
                or(
                    isNotNull(sources.qa_source), // JSON is not null (non-empty check to be handled logically)
                    and(isNotNull(sources.text_source), ne(sources.text_source, '')), // Ensure text is not empty
                    isNotNull(sources.mail_source), // JSON is not null (non-empty check to be handled logically)
                    isNotNull(sources.website_data), // JSON is not null (non-empty check to be handled logically)
                    isNotNull(sources.documents) // JSON is not null (non-empty check to be handled logically)
                )
            )
        )
        .execute()
        .then(res => res[0]?.count ?? 0);

    const alerts = await db
        .select({ count: count() })
        .from(sgAlert)
        .where(eq(sgAlert.organizationId, organizationId))
        .execute()
        .then(res => res[0]?.count ?? 0);

    // Implement logic for other metrics...
    const tokenUsage: number | undefined = currentOrg.tokens || 0;
    const maxTokens: number | undefined = currentOrg?.max_tokens || await getOrgTokensBasedOnPlan();

    return {
        emailsSent,
        emailsSentGrowth: 0, // Placeholder, implement actual growth calculation
        activeUsers,
        activeUsersGrowth: 0, // Placeholder
        connectedEmails,
        connectedEmailsGrowth: 0, // Placeholder
        sources: sourcesNotNull, // Placeholder
        scheduledEmails: 0, // Placeholder
        overLimit: tokenUsage >= maxTokens,
        alerts, // Placeholder
        apiUsage: `${formatNumber(tokenUsage)} / ${formatNumber(maxTokens)}`, // Use the new formatNumber function
        apiUsageChange: 0 // Placeholder
    };
}

export function formatNumber(number: number): string {
    if (number < 1_000) return number.toString(); // Return the number as is if less than 1,000
    if (number < 1_000_000) return `${Math.floor(number / 1_000)}k`; // Format as 'k' for thousands with space
    return `${(number / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`; // Format as 'M' for millions
}

// currencyUtils.ts
export function formatCurrency(amount: string | number | null | undefined): string {
    // Convert string to number if necessary
    if (typeof amount === 'string') {
        amount = parseFloat(amount);
    }

    // Check if the amount is a valid number
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '$0.00';
    }

    // Use Intl.NumberFormat to format the number
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return formatter.format(amount);
}

