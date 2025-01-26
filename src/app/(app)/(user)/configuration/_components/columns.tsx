"use client";

import React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ColumnDropdown } from "./column-dropdown";
import { MoreHorizontal } from "lucide-react";

export interface blacklistData {
    blacklistedEmail: string;
    blacklistedDomain: string;
    note: string;
    createdAt: string;
}

export function getBlacklistColumns(): ColumnDef<blacklistData>[] {
    return columns;
}

const TruncatedContent = ({ content }: { content: string }) => {
    const truncated = content.length > 30 ? content.slice(0, 30) + "..." : content;
    return (
        <div className="truncate-content">
            <span className="mr-2">{truncated}</span>
        </div>
    );
};


export const columns: ColumnDef<blacklistData>[] = [
    {
        accessorKey: "blacklistedEmail",
        header: "Email",
        cell: ({ row }) => row.original.blacklistedEmail,
    },
    {
        accessorKey: "blacklistedDomain",
        header: "Domain",
        cell: ({ row }) => row.original.blacklistedDomain,
    },
    {
        accessorKey: "personalNote",
        header: "Note",
        cell: ({ row }) => <TruncatedContent content={row.original.note} />,
    },
        {
            id: "actions",
            cell: ({ row }) => <ColumnDropdown {...row.original} />,
        },
]