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
import { authorizeGmailMutationRead, authorizeGmailMutationSend } from "@/server/actions/gmail/mutations";
import { getOrganizations } from "@/server/actions/organization/queries";
import { authorizeOutlook } from "@/server/actions/outlook/mutations";
import { Checkbox } from "@/components/ui/checkbox";

export function ConnectEmailForm({ defaultOpen, orgId, upgradeNeeded }: { defaultOpen: boolean, orgId: string, upgradeNeeded: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm({
        defaultValues: {
            purpose: "",
            sendMode: "send",
            reveal_ai: true
        },
    });

    const handleConnect = async (provider: string, data: any) => {
        if (upgradeNeeded) {
            toast.error("You have exceeded your plan's connect accounts limit!");
            return;
        }

        try {
            const authUrl = provider === 'google'
                ? await authorizeGmailMutationSend({ ...data, orgId, provider })
                : await authorizeOutlook({ ...data, orgId, provider });
            window.location.href = authUrl;
        } catch (error) {
            toast.error(`Failed to authorize ${provider === 'google' ? 'Gmail' : 'Outlook'}`);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            setIsLoading(true);
            await handleConnect('google', data);
            form.reset();
            setIsOpen(false);
        } catch (error) {
            toast.error("Failed to connect email");
        } finally {
            setIsLoading(false);
        }
    };

    return (
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
                        Your privacy is our priority. All communications are fully encrypted, and we never access, store, or retain your data.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid w-full gap-4">
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
                            name="frequency"
                            rules={{ required: "Frequency is required" }}
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
                                                <SelectItem value="send">Send Automatically</SelectItem>
                                                <SelectItem value="draft">Create Drafts Only</SelectItem>
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
                                            className="mt-4" // This class ensures the checkbox isn't too far off
                                        />
                                    </FormControl>
                                    <div className="leading-none space-y-1">
                                        <FormLabel className="text-sm font-medium"> {/* Slightly adjust label size */}
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
                            onClick={form.handleSubmit((data) => handleConnect('google', data))}
                            className="w-full gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? <Icons.loader className="h-4 w-4" /> : <Icons.google className="h-4 w-4 fill-foreground" />}
                            <span>Connect Gmail</span>
                        </Button>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <Button
                            onClick={form.handleSubmit((data) => handleConnect('outlook', data))}
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
    );
}