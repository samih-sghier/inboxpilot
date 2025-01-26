// Import necessary modules
import { db } from "@/server/db";
import {  escalationPriority, sgAlert } from "@/server/db/schema";
import { protectedProcedure } from "@/server/procedures";
import { unstable_noStore as noStore } from "next/cache";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { z } from "zod";
import { getOrganizations } from "../organization/queries";
import { endOfDay, startOfDay, subDays } from "date-fns";

// Schema for paginated sgAlert query
const paginatedSgAlertPropsSchema = z.object({
    page: z.coerce.number().default(1),
    per_page: z.coerce.number().default(10),
    sort: z.string().optional(),
    summary: z.string().optional(),
    subject: z.string().optional(),
    account: z.string().optional(),
    recipient: z.string().optional(),
    archived: z.boolean().optional(),
    priority: z.string().optional(),
});

type GetPaginatedSgAlertQueryProps = z.infer<typeof paginatedSgAlertPropsSchema>;

// Function to get all sgAlert records with pagination and filtering
export async function getAllPaginatedAlertsQuery(
    input: GetPaginatedSgAlertQueryProps
) {
    const { currentOrg } = await getOrganizations();
    if (!currentOrg) {
        throw new Error("Organization not found");
    }
    noStore();
    await protectedProcedure();

    const offset = (input.page - 1) * input.per_page;

    // Determine sorting column and order
    const [column, order] = (input.sort?.split(".") as [
        keyof typeof sgAlert.$inferSelect | undefined,
        "asc" | "desc" | undefined
    ]) ?? ["createdAt", "desc"];

    const statuses = (input.priority?.split(".") as (typeof sgAlert.$inferSelect.priority)[]) ?? escalationPriority.enumValues;

    // Fetch paginated data with filters
    const { data, total } = await db.transaction(async (tx) => {
        const response = await tx.query.sgAlert.findMany({
            where: and(
                or(
                    input.summary ? ilike(sgAlert.summary, `%${input.summary}%`) : undefined,
                    input.account ? ilike(sgAlert.account, `%${input.account}%`) : undefined,
                    input.recipient ? ilike(sgAlert.recipient, `%${input.recipient}%`) : undefined,
                    input.subject ? ilike(sgAlert.subject, `%${input.subject}%`) : undefined,
                    escalationPriority.length > 0 ? inArray(sgAlert.priority, statuses) : undefined,
                ),
                eq(sgAlert.organizationId, currentOrg.id),
                input.archived !== undefined ? eq(sgAlert.archived, input.archived) : undefined
            ),
            offset,
            limit: input.per_page,
            orderBy:
                column && column in sgAlert
                    ? order === "asc"
                        ? asc(sgAlert[column])
                        : desc(sgAlert[column])
                    : desc(sgAlert.createdAt),
        });

        // Count the total number of items for pagination
        const total = await tx
            .select({ count: count() })
            .from(sgAlert)
            .where(
                and(
                    or(
                        input.summary ? ilike(sgAlert.summary, `%${input.summary}%`) : undefined,
                        input.account ? ilike(sgAlert.account, `%${input.account}%`) : undefined,
                        input.recipient ? ilike(sgAlert.recipient, `%${input.recipient}%`) : undefined
                    ),
                    eq(sgAlert.organizationId, currentOrg.id),
                    input.archived !== undefined ? eq(sgAlert.archived, input.archived) : undefined
                )
            )
            .execute()
            .then(res => res[0]?.count ?? 0);
        return { data: response, total };
    });

    const pageCount = Math.ceil(total / input.per_page);

    return { data, pageCount, total };
}



// Function to get alert statistics based on organizationId
export async function getAlertStatistics() {
    await protectedProcedure(); // Ensure proper authorization
    const { currentOrg } = await getOrganizations();
    const organizationId = currentOrg.id;
    // Define the date range for new alerts (last 3 days)
    const now = new Date();
    const threeDaysAgo = subDays(now, 3);
    const startOfThreeDaysAgo = startOfDay(threeDaysAgo);
    const endOfThreeDaysAgo = endOfDay(now);

    // Count total alerts for the specified organization
    const totalAlertsPromise = db
        .select({ count: count() })
        .from(sgAlert)
        .where(eq(sgAlert.organizationId, organizationId))
        .execute();

    // Count new alerts (detected within the last 3 days) for the specified organization
    const newAlertsPromise = db
        .select({ count: count() })
        .from(sgAlert)
        .where(
            and(
                eq(sgAlert.organizationId, organizationId),
                gte(sgAlert.createdAt, startOfThreeDaysAgo),
                lte(sgAlert.createdAt, endOfThreeDaysAgo)
            )
        )
        .execute();

    // Count archived alerts for the specified organization
    const archivedAlertsPromise = db
        .select({ count: count() })
        .from(sgAlert)
        .where(
            and(
                eq(sgAlert.organizationId, organizationId),
                eq(sgAlert.archived, true)
            )
        )
        .execute();

    // Execute all queries concurrently
    const [totalAlertsResult, newAlertsResult, archivedAlertsResult] = await Promise.all([
        totalAlertsPromise,
        newAlertsPromise,
        archivedAlertsPromise
    ]);

    // Extract counts from results
    const totalAlerts = totalAlertsResult[0]?.count ?? 0;
    const newAlerts = newAlertsResult[0]?.count ?? 0;
    const archivedAlerts = archivedAlertsResult[0]?.count ?? 0;

    return {
        totalAlerts,
        newAlerts,
        archivedAlerts
    };
}
