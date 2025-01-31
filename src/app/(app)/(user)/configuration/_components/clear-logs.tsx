"use client";

import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAwaitableTransition } from "@/hooks/use-awaitable-transition";
import { removeLogsByOrgAndTimeframe } from "@/server/actions/logs/mutation";
import { removeAlertsByOrgAndTimeframe } from "@/server/actions/alert/mutation";

interface ClearAllLogsDropdownProps {
    type: "logs" | "escalations";
}

export function ClearAllLogsDropdown({ type }: ClearAllLogsDropdownProps) {
    const router = useRouter();
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedTimeframe, setSelectedTimeframe] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [showDateRange, setShowDateRange] = useState(false);

    const typeLabel = type === "escalations" ? "escalations" : "logs";

    const { mutateAsync: clearLogsMutate, isPending: clearLogsIsPending } = useMutation({
        mutationFn: async ({ start, end }: { start?: Date; end?: Date }) => {
            if (type === "logs") return await removeLogsByOrgAndTimeframe(start, end);
            if (type === "escalations") return await removeAlertsByOrgAndTimeframe(start, end);
            return { removedCount: -1 }; // Default fallback
        },
        onSettled: () => {
            router.refresh();
        },
    });


    const [clearLogsIsTransitionPending, startAwaitableClearLogsTransition] =
        useAwaitableTransition();

    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0);
        return date.toLocaleDateString();
    };

    const getTimeframeDescription = () => {
        if (selectedTimeframe === "all") return `all ${typeLabel}`;
        if (selectedTimeframe === "custom" && startDate) {
            return `${typeLabel} between ${formatDate(startDate)} and ${endDate ? formatDate(endDate) : "now"}`;
        }
        if (selectedTimeframe === "24h") return `${typeLabel} older than 24 hours`;
        if (selectedTimeframe === "7d") return `${typeLabel} older than 7 days`;
        if (selectedTimeframe === "30d") return `${typeLabel} older than 30 days`;
        return "";
    };

    const onClearLogs = async () => {
        let start: Date | undefined;
        let end: Date | undefined;

        if (selectedTimeframe === "custom") {
            if (startDate) {
                start = new Date(startDate + 'T12:00:00');
                start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
            }
            if (endDate) {
                end = new Date(endDate + 'T12:00:00');
                end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
            }
        } else if (selectedTimeframe !== "all") {
            end = new Date();
            start = new Date();
            const days = selectedTimeframe === "24h" ? 1 : selectedTimeframe === "7d" ? 7 : 30;
            end.setDate(end.getDate() - days); // Change this line
        }

        toast.promise(
            async () => {
                const result = await clearLogsMutate({ start, end });
                await startAwaitableClearLogsTransition(() => {
                    router.refresh();
                });
                setIsAlertOpen(false);
                setSelectedTimeframe(null);
                setStartDate("");
                setEndDate("");
                return result;
            },
            {
                loading: `Clearing ${typeLabel}...`,
                success: (result) =>
                    `${result?.removedCount} ${typeLabel} removed successfully!`,
                error: `Failed to clear ${typeLabel}. Please try again.`,
            }
        );

    };

    const isPending = clearLogsIsPending || clearLogsIsTransitionPending;

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <SettingsIcon className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-screen max-w-[12rem]">
                    <DropdownMenuLabel>Clear {typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        disabled={isPending}
                        onClick={() => {
                            setSelectedTimeframe("all");
                            setIsAlertOpen(true);
                        }}
                        className="text-red-600"
                    >
                        Clear All {typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger disabled={isPending}>
                            Clear Older Than...
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedTimeframe("24h");
                                    setIsAlertOpen(true);
                                }}
                            >
                                24 Hours
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedTimeframe("7d");
                                    setIsAlertOpen(true);
                                }}
                            >
                                7 Days
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedTimeframe("30d");
                                    setIsAlertOpen(true);
                                }}
                            >
                                30 Days
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem
                                onClick={() => {
                                    setSelectedTimeframe("custom");
                                    setShowDateRange(true);
                                }}
                            >
                                Custom Date Range
                            </DropdownMenuItem> */}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>

            {showDateRange && (
                <AlertDialog open={true} onOpenChange={() => setShowDateRange(false)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Select Date Range</AlertDialogTitle>
                            <AlertDialogDescription>
                                Choose a date range to clear {typeLabel}:
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    type="date"
                                    id="startDate"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="endDate">End Date (Optional)</Label>
                                <Input
                                    type="date"
                                    id="endDate"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    setShowDateRange(false);
                                    if (startDate) {
                                        setIsAlertOpen(true);
                                    }
                                }}
                                disabled={!startDate}
                            >
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm {typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to clear {getTimeframeDescription()}? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onClearLogs}
                            disabled={isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Clear {typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default ClearAllLogsDropdown;
