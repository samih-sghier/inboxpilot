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
    const domainsColumns = useMemo<ColumnDef<BlacklistedDomainData, unknown>[]>(
        () => getDomainBlacklistColumns(),
        [],
    );

    const emailColumns = useMemo<ColumnDef<BlacklistedEmailData, unknown>[]>(
        () => getEmailBlacklistColumns(),
        [],
    );

    // Map the data to EmailLogData
    const emailBlackData: BlacklistedEmailData[] = data.map((item) => ({
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

    const domainBlackData: BlacklistedDomainData[] = data.map((item) => ({
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

    const { table: domainsTable } = useDataTable({
        data: domainBlackData,
        columns: domainsColumns,
        pageCount,
    });

    const { table: emailsTable } = useDataTable({
        data: emailBlackData,
        columns: emailColumns,
        pageCount,
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="w-full">
                <DataTable
                    table={domainsTable}
                    columns={domainsColumns}
                    totalRows={total}
                />
            </div>
            <div className="w-full">
                <DataTable
                    table={emailsTable}
                    columns={emailColumns}
                    totalRows={total}
                />
            </div>
        </div>
    );
}