"use client";

import { DataTable } from "@/app/(app)/_components/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import { getEmailLogsColumns, type EmailLogData } from "./columns";
import { useDataTable } from "@/hooks/use-data-table";
import type {
    DataTableFilterableColumn,
    DataTableSearchableColumn,
} from "@/types/data-table";
import { type getAllPaginatedEmailLogsQuery } from "@/server/actions/logs/queries";
import { ClearAllLogsDropdown } from "./clear-logs";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component

type EmailLogsTableProps = {
    emailLogsPromise: ReturnType<typeof getAllPaginatedEmailLogsQuery>;
};

// Define searchable columns for the DataTable
const searchableColumns: DataTableSearchableColumn<EmailLogData>[] = [
    { id: "subject", placeholder: "Search by subject..." },
    { id: "email", placeholder: "Search by sender email..." },
    { id: "recipient", placeholder: "Search by recipient..." },
];

// Define filterable columns for the DataTable
const filterableColumns: DataTableFilterableColumn<EmailLogData>[] = [
    {
        id: "status",
        title: "Status",
        options: [
            { label: "Sent", value: "sent" },
            { label: "Failed", value: "failed" },
            { label: "Draft", value: "draft" },
            // { label: "Scheduled", value: "scheduled" },
        ],
    },
];

export function EmailLogsTable({ emailLogsPromise }: EmailLogsTableProps) {
    const { data, pageCount, total } = React.use(emailLogsPromise);

    // Define the columns
    const columns = useMemo<ColumnDef<EmailLogData, unknown>[]>(
        () => getEmailLogsColumns(),
        [],
    );

    // Map the data to EmailLogData
    const emailLogsData: EmailLogData[] = data.map((item) => ({
        id: item.id,
        email: item.email,
        orgId: item.orgId,
        recipient: item.recipient,
        subject: item.subject || "",
        content: item.content,
        status: item.status,
        tokens: item.tokens || 0,
        messageId: item.messageId || "",
        createdAt: item.createdAt,
        updatedOn: item.updatedOn,
    }));

    const { table } = useDataTable({
        data: emailLogsData,
        columns,
        pageCount,
        searchableColumns,
        filterableColumns,
    });

    return (
        <>
            <Button>hi</Button>
            <DataTable
                table={table}
                columns={columns}
                filterableColumns={filterableColumns}
                searchableColumns={searchableColumns}
                totalRows={total}
                type="logs"
            />
        </>
    );
}