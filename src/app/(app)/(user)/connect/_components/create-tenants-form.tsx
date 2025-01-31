"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { authorizeGmailMutationSend } from "@/server/actions/gmail/mutations";
import { authorizeOutlook } from "@/server/actions/outlook/mutations";
import { Checkbox } from "@/components/ui/checkbox";
import { siteUrls } from "@/config/urls";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function ConnectEmailForm({ defaultOpen, orgId, upgradeNeeded, hasUploadedSources }: { defaultOpen: boolean, orgId: string, upgradeNeeded: boolean, hasUploadedSources: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSendAutoWarning, setShowSendAutoWarning] = useState(false);
    const [showDraftAutoWarning, setShowDraftAutoWarning] = useState(false);

    const [pendingConnectData, setPendingConnectData] = useState<{
        provider: string,
        data: any
    } | null>(null);

    const form = useForm({
        defaultValues: {
            purpose: "",
            sendMode: "",
            reveal_ai: true
        },
    });

    const handleConnect = async (provider: string, data: any) => {
        if (upgradeNeeded) {
            toast.error("You have exceeded your plan's connect accounts limit!");
            return null;
        }

        try {
            const authUrl = provider === 'google'
                ? await authorizeGmailMutationSend({ ...data, orgId, provider })
                : await authorizeOutlook({ ...data, orgId, provider });
            return authUrl;
        } catch (error) {
            toast.error(`Failed to authorize ${provider === 'google' ? 'Gmail' : 'Outlook'}`);
            return null;
        }
    };

    const onSubmit = async (data: any, provider: string) => {
        try {
            setIsLoading(true);

            if (data.sendMode === "send") {
                // Store pending connection data and show warning
                setPendingConnectData({ provider, data });
                setShowSendAutoWarning(true);
            } else if (data.sendMode === "draft") {
                setPendingConnectData({ provider, data });
                setShowDraftAutoWarning(true);
            } else {
                // Directly connect if draft mode
                const authUrl = await handleConnect(provider, data);
                if (authUrl) {
                    window.location.href = authUrl;
                }
            }
        } catch (error) {
            toast.error("Failed to connect email");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmSendMode = async () => {
        if (pendingConnectData) {
            try {
                const authUrl = await handleConnect(
                    pendingConnectData.provider,
                    pendingConnectData.data
                );

                if (authUrl) {
                    window.location.href = authUrl;
                }

                setShowSendAutoWarning(false);
                setPendingConnectData(null);
            } catch (error) {
                toast.error("Failed to connect email");
            }
        }
    };

    const handleConfirmDraftMode = async () => {
        if (pendingConnectData) {
            try {
                const authUrl = await handleConnect(
                    pendingConnectData.provider,
                    pendingConnectData.data
                );

                if (authUrl) {
                    window.location.href = authUrl;
                }

                setShowDraftAutoWarning(false);
                setPendingConnectData(null);
            } catch (error) {
                toast.error("Failed to connect email");
            }
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(o) => setIsOpen(o)}>
                <DialogTrigger asChild>
                    <Button type="button">Connect Email</Button>
                </DialogTrigger>
                <DialogContent className="max-h-screen overflow-auto">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-xl font-semibold">
                            Link your Email Account
                        </DialogTitle>
                        <DialogDescription className="mt-2">
                            Your privacy is our priority. Read more{" "}
                            <a href="https://inboxpilot.co/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                here
                            </a>.
                        </DialogDescription>
                        <DialogDescription className="mt-2">
                            If you're having any difficulties getting started, please email{" "}
                            <a href="mailto:support@inboxpilot.co" className="text-blue-600 underline">
                                support@inboxpilot.co
                            </a>.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit((data) => onSubmit(data, 'google'))} className="grid w-full gap-4">
                            <FormField
                                control={form.control}
                                name="purpose"
                                rules={{ required: "Purpose is required" }}
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <FormLabel>Purpose</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={field.value}
                                                onValueChange={(value) => field.onChange(value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select purpose" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="customer_support">Customer Support</SelectItem>
                                                    <SelectItem value="technical_inquiries">Technical Inquiries</SelectItem>
                                                    <SelectItem value="security_operations">Security Operations</SelectItem>
                                                    <SelectItem value="multipurpose">Multipurpose</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormDescription>
                                            Select the purpose of this email account.
                                        </FormDescription>
                                        <FormMessage>{fieldState.error?.message}</FormMessage>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sendMode"
                                rules={{ required: "Send Mode is required" }}
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <FormLabel>Send Mode</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={field.value}
                                                onValueChange={(value) => field.onChange(value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Mode" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="send">Send Replies Automatically</SelectItem>
                                                    <SelectItem value="draft">Create Draft Replies Only</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormDescription>
                                            Choose whether to send emails automatically or create drafts for review.
                                        </FormDescription>
                                        <FormMessage>{fieldState.error?.message}</FormMessage>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="reveal_ai"
                                render={({ field }) => (
                                    <FormItem className="flex items-start space-x-3 p-4 border rounded-md">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="mt-4"
                                            />
                                        </FormControl>
                                        <div className="leading-none space-y-1">
                                            <FormLabel className="text-sm font-medium">
                                                Reveal AI-generated replies
                                            </FormLabel>
                                            <FormDescription className="text-sm text-gray-500">
                                                Enable this option to inform recipients that the reply was generated by AI.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <div className="flex flex-col space-y-2">
                            <Button
                                onClick={() => form.handleSubmit((data) => onSubmit(data, 'google'))()}
                                className="w-full gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? <Icons.loader className="h-4 w-4" /> : <Icons.google className="h-4 w-4 fill-foreground" />}
                                <span>Connect Gmail</span>
                            </Button>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <Button
                                onClick={() => form.handleSubmit((data) => onSubmit(data, 'outlook'))()}
                                className="w-full gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? <Icons.loader className="h-4 w-4" /> : <Icons.microsoft className="h-4 w-4 fill-foreground" />}
                                <span>Connect Outlook</span>
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {showSendAutoWarning && (
                <Dialog open={showSendAutoWarning} onOpenChange={setShowSendAutoWarning}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">⚠️ Automated Email Replies Warning</DialogTitle>

                            <DialogDescription className="space-y-4">
                                <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                                    <p className="text-red-700 font-semibold">
                                        Caution: Emails sent to this address will receive automatic AI-generated responses sent from your account.
                                    </p>
                                </div>

                                {/* <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                                    <p className="text-yellow-800">
                                        Important Checklist:
                                        <ul className="list-disc list-inside ml-2 mt-1">
                                            <li>Verify data sources are uploaded</li>
                                            <li>Choose the sending mode: create drafts only or send automatically.</li>
                                        </ul>
                                    </p>
                                </div> */}

                                <div className="text-sm text-muted-foreground">
                                    {!hasUploadedSources ? (
                                        <p>
                                            No data sources uploaded. The AI cannot generate responses without context.
                                            <Link
                                                href={siteUrls.dashboard.sources}
                                                className={cn(
                                                    "ml-2 text-blue-600 hover:underline",
                                                    "inline-block"
                                                )}
                                            >
                                                Upload Sources Now
                                            </Link>
                                        </p>
                                    ) : (
                                        <p className="text-green-600">
                                            ✓ Data sources verified
                                        </p>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="flex justify-between">
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowSendAutoWarning(false);
                                        setPendingConnectData(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={handleConfirmSendMode}
                                disabled={!hasUploadedSources}
                            >
                                I Understand
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {showDraftAutoWarning && (
                <Dialog open={showDraftAutoWarning} onOpenChange={setShowDraftAutoWarning}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">⚠️ Automated Email Drafts Warning</DialogTitle>

                            <DialogDescription className="space-y-4">
                                <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                                    <p className="text-red-700 font-semibold">
                                        Important: For every incoming email, a draft will be automatically created and added to the corresponding email thread in your account. To view the draft, navigate to the specific email thread in your account. Simply review the draft, make any necessary edits, and click "Send" when you're ready.                                    </p>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {!hasUploadedSources ? (
                                        <p>
                                            No data sources uploaded. The AI cannot generate responses without context.
                                            <Link
                                                href={siteUrls.dashboard.sources}
                                                className={cn(
                                                    "ml-2 text-blue-600 hover:underline",
                                                    "inline-block"
                                                )}
                                            >
                                                Upload Sources Now
                                            </Link>
                                        </p>
                                    ) : (
                                        <p className="text-green-600">
                                            ✓ Data sources verified
                                        </p>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="flex justify-between">
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowDraftAutoWarning(false);
                                        setPendingConnectData(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={handleConfirmDraftMode}
                                disabled={!hasUploadedSources}
                            >
                                I Understand
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}