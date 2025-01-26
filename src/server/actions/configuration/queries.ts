// Import necessary modules
import { db } from "@/server/db";
import { blacklistedData } from "@/server/db/schema";
import { protectedProcedure } from "@/server/procedures";
import { unstable_noStore as noStore } from "next/cache";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { z } from "zod";
import { getOrganizations } from "../organization/queries";
import { endOfDay, startOfDay, subDays } from "date-fns";

// Schema for paginated email logs
const paginatedConfiguredEmailPropsSchema = z.object({
    page: z.coerce.number().default(1),
    per_page: z.coerce.number().default(10),
    sort: z.string().optional(),
    blacklistedEmail: z.string().optional(),
    blacklistedDomain: z.string().optional(),
    note: z.string().optional(),
});

type GetPaginatedConfiguredEmailPropsSchema = z.infer<typeof paginatedConfiguredEmailPropsSchema>;

export async function getAllPaginatedConfiguredEmailsQuery(
    input: GetPaginatedConfiguredEmailPropsSchema
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
        keyof typeof blacklistedData.$inferSelect | undefined,
        "asc" | "desc" | undefined
    ]) ?? ["createdAt", "desc"];

    // Fetch paginated data with filters
    const { data, total } = await db.transaction(async (tx) => {
        const response = await tx.query.sgAlert.findMany({
            where: and(
                or(
                    input.blacklistedEmail ? ilike(blacklistedData.blacklistedEmail, `%${input.blacklistedEmail}%`) : undefined,
                    input.blacklistedDomain ? ilike(blacklistedData.blacklistedDomain, `%${input.blacklistedDomain}%`) : undefined,
                    input.note ? ilike(blacklistedData.note, `%${input.note}%`) : undefined,
                ),
            ),
            offset,
            limit: input.per_page,
            orderBy:
                column && column in blacklistedData
                    ? order === "asc"
                        ? asc(blacklistedData[column])
                        : desc(blacklistedData[column])
                    : desc(blacklistedData.createdAt),
        });

        // Count the total number of items for pagination
        const total = await tx
            .select({ count: count() })
            .from(blacklistedData)
            .where(
                and(
                    or(
                        input.blacklistedEmail ? ilike(blacklistedData.blacklistedEmail, `%${input.blacklistedEmail}%`) : undefined,
                        input.blacklistedDomain ? ilike(blacklistedData.blacklistedDomain, `%${input.blacklistedDomain}%`) : undefined,
                        input.note ? ilike(blacklistedData.note, `%${input.note}%`) : undefined
                    ),
                    // eq(blacklistedData.organizationId, currentOrg.id),
                    // input.archived !== undefined ? eq(sgAlert.archived, input.archived) : undefined
                )
            )
            .execute()
            .then(res => res[0]?.count ?? 0);
        return { data: response, total };
    });

    const pageCount = Math.ceil(total / input.per_page);

    return { data, pageCount, total };
}
