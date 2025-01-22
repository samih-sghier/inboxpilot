"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@tanstack/react-query";
import { MoreVerticalIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { connectedSelectSchema } from "@/server/db/schema"; // Update this import path as needed
import { authorizeGmailMutationSend, removeConnectedItemMutation } from "@/server/actions/gmail/mutations";
import { prop } from "node_modules/cheerio/dist/esm/api/attributes";

type ConnectedEmailDropdownProps = z.infer<typeof connectedSelectSchema>;

export function ConnectedEmailsDropdown(props: ConnectedEmailDropdownProps) {
    const router = useRouter();

    const {
        mutateAsync: removeConnectedEmailMutate,
        isPending: isRemoveConnectedEmailPending,
    } = useMutation({
        mutationFn: () => removeConnectedItemMutation({ email: props.email }),
        onSettled: () => {
            router.refresh();
        },
    });

    const {
        mutateAsync: reconnectEmail,
        isPending: isReconnecting,
    } = useMutation({
        mutationFn: async (data: any) => await handleConnect(data),
        onSettled: () => {
            router.refresh();
        },
    });

    const handleConnect = async (data: any) => {
        if (data.provider === 'google') {
            try {
                const authUrl = await authorizeGmailMutationSend(data);
                window.location.href = authUrl;
            } catch (error) {
                toast.error("Failed to authorize Gmail");
            }
        }
    };


    const handleReconnectEmail = async () => {
        toast.promise(async () => reconnectEmail({
            orgId: props?.orgId,
            frequency: props?.frequency,
            purpose: props?.purpose,
            provider: props?.provider
        }), {
            loading: "Redirecting you to provider page...",
            success: "Successfully reconnected!",
            error: "Failed to reconnect email",
        });
    };

    const handleRemoveConnectedEmail = async () => {
        toast.promise(async () => removeConnectedEmailMutate(), {
            loading: "Removing linked email...",
            success: "Linked email removed successfully",
            error: "Failed to remove linked email",
        });
    };


    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="absolute right-3 top-3 h-8 w-8 p-0"
                >
                    <span className="sr-only">Open menu</span>
                    <MoreVerticalIcon className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-screen max-w-[12rem]">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {!props.isActive &&
                    <DropdownMenuItem
                        disabled={isReconnecting}
                        onClick={handleReconnectEmail}
                    >
                        Reconnect
                    </DropdownMenuItem>}
                {!props.isActive && <DropdownMenuSeparator />}

                <DropdownMenuItem
                    disabled={isRemoveConnectedEmailPending}
                    onClick={handleRemoveConnectedEmail}
                    className="text-red-600"
                >
                    Disconnect
                </DropdownMenuItem>


                {/* Add more items here if needed, e.g., View Details */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
