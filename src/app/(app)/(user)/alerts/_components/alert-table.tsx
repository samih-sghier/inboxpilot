"use client";

import { DataTable } from "@/app/(app)/_components/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import { getWatchListColumns, type AlertData } from "./columns";
import { alertTypeEnum, escalationPriority } from "@/server/db/schema";
import { useDataTable } from "@/hooks/use-data-table";
import type {
    DataTableFilterableColumn,
    DataTableSearchableColumn,
} from "@/types/data-table";
import { getAllPaginatedAlertsQuery } from "@/server/actions/alert/queries";


// Define filterable columns for the DataTable
const filterableColumns: DataTableFilterableColumn<AlertData>[] = [
    {
        id: "priority",
        title: "Priority",
        options: escalationPriority.enumValues.map((v) => ({
            label: v,
            value: v,
        })),
    }
    // {
    //     id: "archived",
    //     title: "Archived", // Changed title for clarity
    //     options: [

    //     ],
    // },

    // {
    //     id: "lastName",
    //     title: "Tenant's name",
    //     options: [], // Define specific options if necessary
    // },
    // {
    //     id: "email",
    //     title: "Tenant's mail",
    //     options: [], // Define specific options if necessary
    // },
];

type AlertTableProps = {
    watchListPromise: ReturnType<typeof getAllPaginatedAlertsQuery>;
};

// Define searchable columns for the DataTable
const searchableColumns: DataTableSearchableColumn<AlertData>[] = [
    { id: "recipient", placeholder: "Search by contact..." },
    // { id: "lastName", placeholder: "Search tenant name..." }
];

export function AlertTable({ watchListPromise }: AlertTableProps) {
    const { data, pageCount, total } = React.use(watchListPromise);

    // Define the columns with the new fields
    const columns = useMemo<ColumnDef<AlertData, unknown>[]>(
        () => getWatchListColumns(),
        [],
    );

    // Ensure that the new fields are included
    const alertData: AlertData[] = data.map((item) => ({
        id: item.id!,
        summary: item.summary || "", // Added to match the table structure
        createdAt: item.createdAt.toISOString(), // Convert to string
        updatedAt: item.updatedAt ? item.updatedAt.toISOString() : "", // Convert to string
        organizationId: item.organizationId,
        account: item.account || "", // Added to match the table structure
        recipient: item.recipient || "", // Added to match the table structure
        escalationLink: item.escalationLink || "", // Added to match the table structure
        archived: item.archived || false, // Added to match the table structure
        subject: item.subject || "", // Added to match the table structure
        threadId: item.threadId || "", // Added to match the table structure
        category: item.category || "Other", // Added to match the table structure
        priority: item.priority || "low"
    }));

    const { table } = useDataTable({
        data: alertData,
        columns,
        pageCount,
        searchableColumns,
        filterableColumns,
    });

    return (
        <>
            <DataTable
                table={table}
                columns={columns}
                filterableColumns={filterableColumns}
                searchableColumns={searchableColumns}
                totalRows={total}
                type="escalations"
            />
        </>
    );
}
