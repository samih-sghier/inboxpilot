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


export function ConnectEmailForm({ defaultOpen, orgId, upgradeNeeded }: { defaultOpen: boolean, orgId: string, upgradeNeeded: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm({
        defaultValues: {
            purpose: "",
            frequency: ""
        },
    });


    const handleConnect = async (provider: string, data: any) => {
        if (upgradeNeeded) {
            toast.error("You have exceeded your plan's connect accounts limit!");
            return
        }

        if (provider === 'google') {
            try {
                const authUrl = await authorizeGmailMutationSend({ ...data, orgId, provider });
                window.location.href = authUrl;
            } catch (error) {
                toast.error("Failed to authorize Gmail");
            }
        } else if (provider === 'outlook') {
            try {
                const authUrl = await authorizeOutlook({ ...data, orgId, provider });
                window.location.href = authUrl;
            } catch (error) {
                toast.error("Failed to authorize Outlook");
            }
        }
    };

    const onSubmit = async (data: any) => {
        const frequency = data.frequency === 'manual' ? null : parseInt(data.frequency, 10);

        try {
            setIsLoading(true);
            await handleConnect('google', { ...data, frequency }); // Pass frequency in minutes or null
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
                                                <SelectItem value="sales">Sales</SelectItem>
                                                <SelectItem value="technical_inquiries">Technical Inquiries</SelectItem>
                                                <SelectItem value="general_inquiries">General Inquiries</SelectItem>
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
                                    <FormLabel>Reply Frequency</FormLabel>
                                    <FormControl>
                                        <Select
                                            value={field.value}
                                            onValueChange={(value) => field.onChange(value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select frequency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">less than 1 minute</SelectItem>
                                                {/* <SelectItem value="2">After 2 minutes</SelectItem>
                                                <SelectItem value="60">After 1 hour</SelectItem>
                                                <SelectItem value="240">After 4 hours</SelectItem>
                                                <SelectItem value="1440">After 24 hours</SelectItem>
                                                <SelectItem value="2880">After 48 hours</SelectItem>
                                                <SelectItem value="4320">After 72 hours</SelectItem>
                                                <SelectItem value="manual">Only when approved</SelectItem> */}
                                            </SelectContent>


                                        </Select>
                                    </FormControl>
                                    <FormDescription>
                                        Select when to automate replies if no response is received.
                                    </FormDescription>
                                    <FormMessage>{fieldState.error?.message}</FormMessage>
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
