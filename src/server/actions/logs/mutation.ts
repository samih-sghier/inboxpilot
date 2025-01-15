"use server";

import { db } from "@/server/db"; // Adjust the import based on your project structure
import { emailLogs } from "@/server/db/schema"; // Import the emailLogs schema
import { protectedProcedure } from "@/server/procedures"; // Ensure you have the necessary authentication
import { and, eq, gte, lte } from "drizzle-orm"; // Import the eq function from drizzle-orm
import { getOrganizations } from "../organization/queries"; // Import the function to get organizations

export async function removeLogMutation(id: string) {
    if (!id) {
        throw new Error("Invalid log ID");
    }

    // Ensure the user is authenticated
    const { user } = await protectedProcedure();

    // Fetch the current organization
    const { currentOrg } = await getOrganizations();

    // Fetch the log data
    const log = await db.query.emailLogs.findFirst({
        where: eq(emailLogs.id, id)
    });

    if (!log || log.orgId !== currentOrg.id) {
        throw new Error("Log not found or does not belong to the organization");
    }

    // Perform the deletion from the database
    const result = await db.delete(emailLogs).where(eq(emailLogs.id, id)).execute();

    if (result.count === 0) {
        throw new Error("No log found with the provided ID");
    }

    return { message: "Log removed successfully" }; // Optional: return a success message
}


/**
 * Removes logs based on organization ID and a specified time frame.
 * If no time frame is specified, it deletes all logs for the organization.
 * 
 * @param orgId - The ID of the organization
 * @param startDate - The start date of the time frame (optional)
 * @param endDate - The end date of the time frame (optional)
 * @returns A message indicating the result of the operation
 */
export async function removeLogsByOrgAndTimeframe(startDate?: Date, endDate?: Date) {

    // Ensure the user is authenticated
    const { user } = await protectedProcedure();

    // Fetch the current organization to ensure user has access
    const { currentOrg } = await getOrganizations();

    let result;

    if (startDate && endDate) {
        // Perform deletion for the specified time frame
        result = await db.delete(emailLogs)
            .where(
                and(
                    eq(emailLogs.orgId, currentOrg.id),
                    gte(emailLogs.createdAt, startDate),
                    lte(emailLogs.createdAt, endDate)
                )
            )
            .execute();
    } else {
        // Perform deletion for all logs (no time frame specified)
        result = await db.delete(emailLogs)
            .where(eq(emailLogs.orgId, currentOrg.id))
            .execute();
    }

    const deletedCount = result.count || 0;


    return { removedCount: deletedCount }; // Return a success message
}
