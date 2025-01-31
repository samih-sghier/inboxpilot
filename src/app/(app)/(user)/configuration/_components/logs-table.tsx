"use client";

import { DataTable } from "@/app/(app)/_components/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import { getEmailBlacklistColumns, type BlacklistedEmailData } from "./columns";
import { getDomainBlacklistColumns, type BlacklistedDomainData } from "./columns";

import { useDataTable } from "@/hooks/use-data-table";
import type {
    DataTableFilterableColumn,
    DataTableSearchableColumn,
} from "@/types/data-table";
import { type getAllPaginatedEmailLogsQuery } from "@/server/actions/logs/queries";
import { ClearAllLogsDropdown } from "./clear-logs";

type EmailLogsTableProps = {
    emailLogsPromise: ReturnType<typeof getAllPaginatedEmailLogsQuery>;
};


export function EmailLogsTable({ emailLogsPromise }: EmailLogsTableProps) {
    const { data, pageCount, total } = React.use(emailLogsPromise);

    // Define the columns
    const columns = useMemo<ColumnDef<BlacklistedDomainData, unknown>[]>(
        () => getDomainBlacklistColumns(),
        [],
    );

    // Map the data to EmailLogData
    const emailLogsData: BlacklistedDomainData[] = data.map((item) => ({
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
    });

    return (
        <>
            <DataTable
                table={table}
                columns={columns}
                totalRows={total}
            />
        </>
    );
}