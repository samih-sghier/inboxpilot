"use server";

import { db } from "@/server/db";
import { connected } from "@/server/db/schema";
import { protectedProcedure } from "@/server/procedures";
import { unstable_noStore as noStore } from "next/cache";
import { and, eq, ilike, inArray, asc, desc, count, or } from "drizzle-orm";
import { z } from "zod";
import { getOrganizations } from "../organization/queries";

/**
 * Get all connected records for the user's organization
 * @returns all connected records
 */
export async function getOrgConnectedQuery() {
    const { user } = await protectedProcedure();
    const { currentOrg } = await getOrganizations();

    // Ensure the user is linked to an organization
    if (!currentOrg) {
        throw new Error("Organization not found");
    }

    return await db.query.connected.findMany({
        orderBy: desc(connected.createdAt),
        where: eq(connected.orgId, currentOrg.id),
    });
}

