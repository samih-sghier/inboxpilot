"use client";

import React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { X, MoreHorizontal } from "lucide-react";

// Types for both tables
export type BlacklistedEmailData = {
    id: number;
    email: string;
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
};

export type BlacklistedDomainData = {
    id: number;
    domain: string;
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
};

// Dialog components for viewing details
const EmailViewDialog = ({ email }: { email: BlacklistedEmailData }) => {
    return (
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>Blacklisted Email Details</DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-4">
                <div className="grid grid-cols-[auto,1fr] gap-x-2 text-sm">
                    <span className="font-semibold">Email:</span>
                    <span>{email.email}</span>
                    <span className="font-semibold">Added On:</span>
                    <span>{format(new Date(email.createdAt), "PPpp")}</span>
                    {email.reason && (
                        <>
                            <span className="font-semibold">Reason:</span>
                            <span>{email.reason}</span>
                        </>
                    )}
                </div>
            </div>
        </DialogContent>
    );
};

const DomainViewDialog = ({ domain }: { domain: BlacklistedDomainData }) => {
    return (
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>Blacklisted Domain Details</DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-4">
                <div className="grid grid-cols-[auto,1fr] gap-x-2 text-sm">
                    <span className="font-semibold">Domain:</span>
                    <span>{domain.domain}</span>
                    <span className="font-semibold">Added On:</span>
                    <span>{format(new Date(domain.createdAt), "PPpp")}</span>
                    {domain.reason && (
                        <>
                            <span className="font-semibold">Reason:</span>
                            <span>{domain.reason}</span>
                        </>
                    )}
                </div>
            </div>
        </DialogContent>
    );
};

// Column definitions for Email Blacklist
export const emailBlacklistColumns: ColumnDef<BlacklistedEmailData>[] = [
    {
        accessorKey: "email",
        header: "Email Address",
    },
    {
        accessorKey: "createdAt",
        header: "Added On",
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {format(new Date(row.getValue("createdAt")), "PPp")}
            </span>
        ),
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                    // Implement remove functionality
                    console.log("Remove email", row.original.id);
                }}
            >
                <X className="h-4 w-4" />
            </Button>
        ),
    },
];

// Column definitions for Domain Blacklist
export const domainBlacklistColumns: ColumnDef<BlacklistedDomainData>[] = [
    {
        accessorKey: "domain",
        header: "Domain",
    },
    {
        accessorKey: "createdAt",
        header: "Added On",
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {format(new Date(row.getValue("createdAt")), "PPp")}
            </span>
        ),
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                    // Implement remove functionality
                    console.log("Remove domain", row.original.id);
                }}
            >
                <X className="h-4 w-4" />
            </Button>
        ),
    },
];

export function getEmailBlacklistColumns(): ColumnDef<BlacklistedEmailData>[] {
    return emailBlacklistColumns.map(column => {
        if (column.id === "actions") {
            return column;
        }

        return {
            ...column,
            cell: ({ row }) => (
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="cursor-pointer">
                            {column.cell ? column.cell({ row }) : row.getValue(column.accessorKey as string)}
                        </div>
                    </DialogTrigger>
                    <EmailViewDialog email={row.original} />
                </Dialog>
            ),
        };
    });
}

export function getDomainBlacklistColumns(): ColumnDef<BlacklistedDomainData>[] {
    return domainBlacklistColumns.map(column => {
        if (column.id === "actions") {
            return column;
        }

        return {
            ...column,
            cell: ({ row }) => (
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="cursor-pointer">
                            {column.cell ? column.cell({ row }) : row.getValue(column.accessorKey as string)}
                        </div>
                    </DialogTrigger>
                    <DomainViewDialog domain={row.original} />
                </Dialog>
            ),
        };
    });
}