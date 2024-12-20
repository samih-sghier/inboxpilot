"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { updateMailSourceField, removeMailSourceField } from '@/server/actions/sources/mutations';

const mailSchema = z.object({
    mailSamples: z.array(z.object({
        key: z.string(),
        description: z.string().min(1, "Brief description is required"),
        value: z.string().min(1, "Email value is required"),
    })),
});

type MailSample = z.infer<typeof mailSchema>['mailSamples'][number];

interface Source {
    mail_source: Record<string, string> | null;
}

interface MailContentProps {
    source: Source;
    stats: any;
    subscription: any;
    onSourceChange: (updatedSource: any) => void;
}

export function MailContent({ source, stats, subscription, onSourceChange }: MailContentProps) {
    const [loading, setLoading] = useState(false);
    const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());
    const [initialLoad, setInitialLoad] = useState(true);

    const transformedInitialData = React.useMemo(() => {
        if (!source?.mail_source) {
            return [];
        }

        return Object.entries(source.mail_source).map(([description, value]) => ({
            key: description,
            description,
            value
        }));
    }, [source?.mail_source]);

    const form = useForm<z.infer<typeof mailSchema>>({
        resolver: zodResolver(mailSchema),
        defaultValues: {
            mailSamples: transformedInitialData,
        },
    });

    // Only reset the form on initial load or when source changes
    useEffect(() => {
        if (initialLoad) {
            form.reset({ mailSamples: transformedInitialData });
            setInitialLoad(false);
        }
    }, [transformedInitialData, form, initialLoad]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "mailSamples",
    });

    const onSubmit = async (data: z.infer<typeof mailSchema>) => {
        setLoading(true);
        try {
            const mailSourceUpdate: Record<string, string> = {};
            let newMailChars = 0;
            
            data.mailSamples.forEach(sample => {
                mailSourceUpdate[sample.description] = sample.value;
                newMailChars += sample.description.length + sample.value.length;
            });

            const newTotalChars = (stats.totalChars - stats.mailChars) + newMailChars;
            if (newTotalChars > subscription?.charactersPerChatbot) {
                toast.error(`Mail content exceeds the character limit for your subscription. Current total: ${stats.totalChars}, New mail total: ${newMailChars}, Limit: ${subscription?.charactersPerChatbot}`);
                return;
            }

            onSourceChange({ ...source, mail_source: mailSourceUpdate });
            await updateMailSourceField(mailSourceUpdate);

            if (removedKeys.size > 0) {
                await removeMailSourceField(removedKeys);
                setRemovedKeys(new Set());
            }

            toast.success("Sample emails updated successfully!");
        } catch (error) {
            console.error("Error updating sample emails:", error);
            toast.error("Failed to update sample emails");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (index: number, description: string) => {
        const updatedMailSource = { ...source?.mail_source };
        remove(index);
        removeMailSourceField(new Set([description]));
        delete updatedMailSource[description];
        onSourceChange({ ...source, mail_source: updatedMailSource });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <p className="text-lg font-semibold">Sample Emails for Training</p>
                <div className="flex space-x-2">
                    <Button
                        type="button"
                        onClick={() => {
                            append({ 
                                key: `new_${Date.now()}`, 
                                description: "", 
                                value: "" 
                            });
                        }}
                        variant="outline"
                    >
                        + Add Sample Email
                    </Button>
                    <Button type="submit" form="mail-form" disabled={loading}>
                        {loading ? "Processing..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <Form {...form}>
                <form
                    id="mail-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    {fields.map((field, index) => (
                        <div key={field.id} className="space-y-4 p-4 border rounded-md">
                            <FormField
                                control={form.control}
                                name={`mailSamples.${index}.description`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Brief Description</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter brief description of the email..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`mailSamples.${index}.value`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Value</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter email value..."
                                                {...field}
                                                rows={5}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                onClick={() => handleRemove(index, fields[index].description)}
                                variant="outline"
                                className="text-red-600"
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                </form>
            </Form>
        </div>
    );
}