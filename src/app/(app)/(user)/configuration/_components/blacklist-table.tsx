"use client";

import { DataTable } from "@/app/(app)/_components/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import { getBlacklistColumns, type blacklistData } from "./columns";
import { alertTypeEnum, escalationPriority } from "@/server/db/schema";
import { useDataTable } from "@/hooks/use-data-table";
import type {
    DataTableFilterableColumn,
    DataTableSearchableColumn,
} from "@/types/data-table";
import { getAllPaginatedConfiguredEmailsQuery } from "@/server/actions/configuration/queries";

type blacklistTableProps = {
    blacklistPromise: ReturnType<typeof getAllPaginatedConfiguredEmailsQuery>;
};



// Define searchable columns for the DataTable
const searchableColumns: DataTableSearchableColumn<blacklistData>[] = [
    { id: "blacklistedEmail", placeholder: "Search by email..." },
    { id: "blacklistedDomain", placeholder: "Search by domain..." },
    // { id: "lastName", placeholder: "Search tenant name..." }
];

export function BlacklistTable({ blacklistPromise }: blacklistTableProps) {
    const { data, pageCount, total } = React.use(blacklistPromise);

    // Define the columns
    const columns = useMemo<ColumnDef<blacklistData, unknown>[]>(
        () => getBlacklistColumns(),
        [],
    );

    const alertData: blacklistData[] = data.map((item) => ({
        blacklistedEmail: item.blacklistedEmail || "",
        blacklistedDomain: item.blacklistedDomain || "",
        note: item.note || "",
        createdAt: item.createdAt.toISOString()
    }));

    const { table } = useDataTable({
        data: alertData,
        columns,
        pageCount,
        searchableColumns,
    });

    return (
        <>
            <DataTable
                table={table}
                columns={columns}
                // filterableColumns={filterableColumns}
                searchableColumns={searchableColumns}
                totalRows={total}
                type="escalations"
            />
        </>
    );
    
}

