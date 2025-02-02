'use client';

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

const notificationSchema = z.object({
    emails: z.array(z.object({
        id: z.string(),
        email: z.string().email("Please enter a valid email address")
    }))
});

interface NotificationManagerProps {
    initialEmails?: { id: string; email: string; }[];
    onUpdate?: (emails: { id: string; email: string; }[]) => Promise<void>;
}

export function NotificationManager({ initialEmails = [], onUpdate }: NotificationManagerProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof notificationSchema>>({
        resolver: zodResolver(notificationSchema),
        defaultValues: {
            emails: initialEmails
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "emails"
    });

    const onSubmit = async (data: z.infer<typeof notificationSchema>) => {
        setLoading(true);
        try {
            if (onUpdate) {
                await onUpdate(data.emails);
            }
        } catch (error) {
            console.error("Error updating notification list:", error);
            toast.error("Failed to update notification list");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="p-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Notification Recipients</CardTitle>
                    <Button
                        type="button"
                        onClick={() => append({ id: `email_${Date.now()}`, email: '' })}
                        variant="outline"
                        size="sm"
                    >
                        Add Recipient
                    </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    Whenever a new escalation is raised, an email notification will be sent to the recipients listed below.
                </p>
            </CardHeader>

            <CardContent className="p-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <ScrollArea className="h-[300px] w-full rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email Address</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell className="py-2">
                                                <Input
                                                    {...form.register(`emails.${index}.email`)}
                                                    placeholder="Enter email address"
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell className="w-[50px]">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        <div className="mt-4">
                            <Button type="submit" disabled={loading} size="sm">
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}