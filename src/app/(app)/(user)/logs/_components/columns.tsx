"use client";

import React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ColumnDropdown } from "./column-dropdown";
import { MoreHorizontal } from "lucide-react";

export enum EmailStatus {
    SENT = 'sent',
    FAILED = 'failed',
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
}

export type EmailLogData = {
    id: number;
    email: string;
    orgId: string;
    recipient: string;
    subject: string;
    content: string;
    status: EmailStatus;
    threadId: string;
    tokens: number;
    messageId: string;
    createdAt: Date;
    updatedOn: Date;
};

const TruncatedContent = ({ content }: { content: string }) => {
    const truncated = content.length > 30 ? content.slice(0, 30) + "..." : content;
    return (
        <div className="truncate-content">
            <span className="mr-2">{truncated}</span>
        </div>
    );
};

const EmailViewDialog = ({ email }: { email: EmailLogData }) => {
    return (
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle>{email.subject}</DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-4">
                <div className="grid grid-cols-[auto,1fr] gap-x-2 text-sm">
                    <span className="font-semibold">From:</span>
                    <span>{email.email}</span>
                    <span className="font-semibold">To:</span>
                    <span>{email.recipient}</span>
                    <span className="font-semibold">Date:</span>
                    <span>{format(new Date(email.createdAt), "PPpp")}</span>
                    <span className="font-semibold">Status:</span>
                    <Badge variant={getBadgeVariant(email.status)} className="w-fit capitalize">
                        {email.status}
                    </Badge>
                </div>
                <div className="border-t pt-4">
                    <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
                        {email.content}
                    </div>
                </div>
                <div className="border-t pt-4 text-sm text-muted-foreground">
                    <p>Message ID: {email.messageId}</p>
                    {email.threadId && <p>Thread ID: {email.threadId}</p>}
                </div>
            </div>
        </DialogContent>
    );
};

const getBadgeVariant = (status: EmailStatus): 'default' | 'secondary' | 'destructive' | 'success' => {
    switch (status) {
        case EmailStatus.SENT:
            return "success";
        case EmailStatus.FAILED:
            return "destructive";
        case EmailStatus.DRAFT:
            return "secondary";
        case EmailStatus.SCHEDULED:
            return "default";
        default:
            return "secondary";
    }
};

export const columns: ColumnDef<EmailLogData>[] = [
    // {
    //     accessorKey: "messageId",
    //     header: "Message ID",
    //     cell: ({ row }) => row.original.messageId || "N/A",
    // },
    {
        accessorKey: "email",
        header: "Account",
        cell: ({ row }) => row.original.email,
    },
    {
        accessorKey: "recipient",
        header: "Recipient",
        cell: ({ row }) => row.original.recipient,
    },
    {
        accessorKey: "tokens",
        header: "Tokens Used",
        cell: ({ row }) => row.original.tokens,
    },
    {
        accessorKey: "content",
        header: "Content",
        cell: ({ row }) => <TruncatedContent content={row.original.content} />,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant={getBadgeVariant(row.original.status)} className="capitalize">
                {row.original.status}
            </Badge>
        ),
        filterFn: (row, id, value) => {
            return !!value.includes(row.getValue(id));
        },
    },
    {
        accessorKey: "createdAt",
        header: "Delivered On",
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {format(new Date(row.original.createdAt), "PPp")}
            </span>
        ),
    },
    {
        id: "actions",
        cell: ({ row }) => <ColumnDropdown {...row.original} />,
    },
];

export function getEmailLogsColumns(): ColumnDef<EmailLogData>[] {
    return columns.map(column => {
        if (column.id === "actions") {
            // Return the actions column as is, without wrapping it in a Dialog
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