"use server";

import { db } from "@/server/db"; // Adjust the import based on your project structure
import { sgAlert } from "@/server/db/schema";
import { protectedProcedure } from "@/server/procedures"; // Ensure you have the necessary authentication
import { and, eq, gte, lte } from "drizzle-orm"; // Import the eq function from drizzle-orm
import { getOrganizations } from "../organization/queries"; // Import the function to get organizations

export async function removeAlertMutation(id: string) {
    if (!id) {
        throw new Error("Invalid alert ID");
    }

    // Ensure the user is authenticated
    const { user } = await protectedProcedure();

    // Fetch the current organization
    const { currentOrg } = await getOrganizations();

    // Fetch the alert data
    const alert = await db.query.sgAlert.findFirst({
        where: eq(sgAlert.id, id)
    });

    if (!alert || alert.organizationId !== currentOrg.id) {
        throw new Error("Alert not found or does not belong to the organization");
    }

    const result = await db.delete(sgAlert).where(eq(sgAlert.id, id)).execute();

    if (result.count === 0) {
        throw new Error("No alert found with the provided ID");
    }

    return { message: "Alert removed successfully" }; // Optional: return a success message
}

/**
 * Removes alerts for a specific organization within a specified time frame.
 * If no time frame is specified, it deletes all alerts for the organization.
 * 
 * @param orgId - The ID of the organization
 * @param startDate - The start date of the time frame (optional)
 * @param endDate - The end date of the time frame (optional)
 * @returns A message indicating the result of the operation
 */
export async function removeAlertsByOrgAndTimeframe(
    startDate?: Date,
    endDate?: Date
) {


    // Ensure the user is authenticated
    const { user } = await protectedProcedure();

    // Fetch the current organization to ensure user has access
    const { currentOrg } = await getOrganizations();
    const orgId = currentOrg.id

    let result;


    if (startDate && endDate) {
        // Perform deletion for the specified time frame
        result = await db.delete(sgAlert)
            .where(
                and(
                    eq(sgAlert.organizationId, orgId),
                    gte(sgAlert.createdAt, startDate),
                    lte(sgAlert.createdAt, endDate)
                )
            )
            .execute();
    } else {
        // Perform deletion for all alerts (no time frame specified)
        result = await db.delete(sgAlert)
            .where(eq(sgAlert.organizationId, orgId))
            .execute();
    }


    const deletedCount = result.count || 0;


    return { removedCount: deletedCount }; // Return a success message
}
