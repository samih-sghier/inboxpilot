// _components/blacklist/compact-blacklist.tsx
'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

// Schema for a single blacklist entry
const blacklistEntrySchema = z.object({
    id: z.string(),
    value: z.string(),
});

const blacklistSchema = z.object({
    entries: z.array(blacklistEntrySchema)
});

type BlacklistEntry = z.infer<typeof blacklistEntrySchema>;

interface CompactBlacklistProps {
    title: string;
    subtitle: string;
    initialEntries?: BlacklistEntry[];
    type: string;
    onUpdate?: (entries: BlacklistEntry[]) => Promise<void>;
    validator?: (value: string) => boolean;
    placeholder?: string;
}

export function CompactBlacklist({
    title,
    subtitle,
    initialEntries = [],
    type,
    onUpdate,
    validator,
    placeholder
}: CompactBlacklistProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof blacklistSchema>>({
        resolver: zodResolver(blacklistSchema),
        defaultValues: {
            entries: initialEntries
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "entries"
    });

    const onSubmit = async (data: z.infer<typeof blacklistSchema>) => {
        if (validator && !data.entries.every(entry => validator(entry.value))) {
            toast.error("Please check all " + type + " entries are valid!");
            return;
        }

        setLoading(true);
        try {
            if (onUpdate) {
                await onUpdate(data.entries);
            }
            toast.success(`${title} updated successfully!`);
        } catch (error) {
            console.error(`Error updating ${title}:`, error);
            toast.error(`Failed to update ${title}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        append({ id: `entry_${Date.now()}`, value: '' });
    };

    return (
        <Card className="w-full">
            <CardHeader className="p-4">
                <div className="flex justify-between items-center flex-wrap">
                    <CardTitle className="text-lg w-full sm:w-auto">{title}</CardTitle>
                    <Button
                        type="button"
                        onClick={handleAdd}
                        variant="outline"
                        size="sm"
                        className="mt-2 sm:mt-0"
                    >
                        Add Entry
                    </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    {subtitle}
                </p>
            </CardHeader>

            <CardContent className="p-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <ScrollArea className="h-[300px] w-full rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{type == "domain" ? "Domain" : "Email Address"}</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell className="py-2">
                                                <Input
                                                    {...form.register(`entries.${index}.value`)}
                                                    placeholder={placeholder}
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
