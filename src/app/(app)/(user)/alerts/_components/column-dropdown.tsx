"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { alertTypeEnum } from "@/server/db/schema";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useAwaitableTransition } from "@/hooks/use-awaitable-transition";
import { removeAlertMutation } from "@/server/actions/alert/mutation";

type AlertType = (typeof alertTypeEnum.enumValues)[number];

export function ColumnDropdown({
    id,
}: any) {
    const router = useRouter();

    // Mutation to update the alert type of a watchlist item
    const { mutateAsync: updateAlertTypeMutate, isPending: updateAlertTypeIsPending } =
        useMutation({
            mutationFn: ({ alertType }: { alertType: AlertType }) => {
                console.log("alertType", alertType);
            },
            onSettled: () => {
                router.refresh();
            },
        });

    const [alertTypeChangeIsTransitionPending, startAwaitableAlertTypeChangeTransition] =
        useAwaitableTransition();

    const onAlertTypeChange = (alertType: AlertType) => {
        toast.promise(
            async () => {
                await updateAlertTypeMutate({ alertType });
                await startAwaitableAlertTypeChangeTransition(() => {
                    router.refresh();
                });
            },
            {
                loading: "Updating alert type...",
                success: "Alert type updated!",
                error: (error) => error?.message ?? "Failed to update alert type.",
            }
        );
    };

    // Mutation to remove a watchlist item
    const { mutateAsync: removeAlertItemMutate, isPending: removeWatchListItemIsPending } =
        useMutation({
            mutationFn: ({ id }: { id: string }) => removeAlertMutation(id),
        });

    const [removeWatchListItemIsTransitionPending, startAwaitableRemoveWatchListItemTransition] =
        useAwaitableTransition();

    const onRemoveWatchListItem = async () => {
        toast.promise(
            async () => {
                await removeAlertItemMutate({ id });
                await startAwaitableRemoveWatchListItemTransition(() => {
                    router.refresh();
                });
            },
            {
                loading: "Removing escalation item...",
                success: "Escalation removed",
                error: "Failed to remove escalation item.",
            }
        );
    };

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-screen max-w-[12rem]">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
{/* 
                <DropdownMenuSeparator />

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Edit Alert Type</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                            value={alertType}
                            onValueChange={(at) => onAlertTypeChange(at as AlertType)}
                        >
                            {alertTypeEnum.enumValues.map((currentAlertType) => (
                                <DropdownMenuRadioItem
                                    key={currentAlertType}
                                    value={currentAlertType}
                                    disabled={
                                        updateAlertTypeIsPending || alertTypeChangeIsTransitionPending
                                    }
                                >
                                    {currentAlertType}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuSub> */}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    disabled={
                        removeWatchListItemIsPending || removeWatchListItemIsTransitionPending
                    }
                    onClick={onRemoveWatchListItem}
                    className="text-red-600"
                >
                    Archive
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
