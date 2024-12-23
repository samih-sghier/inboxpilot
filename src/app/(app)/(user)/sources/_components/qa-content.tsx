"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { removeQaSourceField, updateQaSourceField } from '@/server/actions/sources/mutations';
import { toast } from 'sonner';

const qnaSchema = z.object({
    qnaPairs: z.array(z.object({
        key: z.string(),
        question: z.string().min(1, "Question is required"),
        answer: z.string().min(1, "Answer is required"),
    })),
});

type QnAPair = z.infer<typeof qnaSchema>['qnaPairs'][number];

interface Source {
    qa_source: Record<string, string> | null;
}

export function QnAContent({ source, stats, subscription, onSourceChange }: { source: Source, stats: any, subscription: any, onSourceChange: (newSource: any) => void }) {
    const [loading, setLoading] = useState(false);
    const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());

    const {
        textInputChars,
        linkChars,
        totalChars,
        linkCount,
        qaChars,
        qaCount,
        fileChars,
        fileCount,
        trainChatbot,
        lastTrainedDate
    } = stats;

    // Transform source.qa_source into the format expected by the form
    const transformedInitialData = React.useMemo(() => {
        if (!source?.qa_source) {
            return [];
        }

        return Object.entries(source.qa_source).map(([question, answer]) => ({
            key: question,
            question,
            answer
        }));
    }, [source?.qa_source]);

    // Initialize the form with validation schema
    const form = useForm<z.infer<typeof qnaSchema>>({
        resolver: zodResolver(qnaSchema),
        defaultValues: {
            qnaPairs: transformedInitialData,
        },
    });

    // Initialize form with existing data on component mount
    useEffect(() => {
        // Only reset if the transformedInitialData has actually changed
        const currentValues = form.getValues().qnaPairs;
        const hasChanged = JSON.stringify(currentValues) !== JSON.stringify(transformedInitialData);

        if (hasChanged) {
            form.reset({ qnaPairs: transformedInitialData });
        }
    }, [transformedInitialData, form.reset]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "qnaPairs",
    });

    const onSubmit = async (data: z.infer<typeof qnaSchema>) => {
        setLoading(true);
        try {
            const qaSourceUpdate: Record<string, string> = {};
            let newQaChars = 0;
            data.qnaPairs.forEach(pair => {
                qaSourceUpdate[pair.question] = pair.answer;
                newQaChars += pair.question.length + pair.answer.length;
            });

            const newTotalChars = (totalChars - qaChars) + newQaChars;
            if (newTotalChars > subscription?.charactersPerChatbot) {
                toast.error(`Q&A content exceeds the character limit for your subscription. Current total: ${totalChars}, New Q&A total: ${newQaChars}, Limit: ${subscription?.charactersPerChatbot}`);
                return;
            }

            // Update source state
            onSourceChange({ ...source, qa_source: qaSourceUpdate });

            // Send update request to the backend
            await updateQaSourceField(qaSourceUpdate);

            // Handle removed keys
            if (removedKeys.size > 0) {
                const keysToRemove = Array.from(removedKeys);
                await removeQaSourceField(keysToRemove);
                setRemovedKeys(new Set());
            }

            toast.success("Q&A pairs updated successfully!");
        } catch (error) {
            console.error("Error updating questions and answers:", error);
            toast.error("Failed to update Q&A pairs");
        } finally {
            setLoading(false);
        }
    };


    const handleRemove = async (index: number, key: string) => {
        const updatedQaSource = { ...source?.qa_source };
        remove(index);
        removeQaSourceField(new Set([key]));
        // onSourceChange({ ...source, qa_source: qaSourceUpdate });

        // Update the source after removal
        delete updatedQaSource[key];

        // Call the onSourceChange to persist the changes
        onSourceChange({ ...source, qa_source: updatedQaSource });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium">Question & Answer</p>
                <div className="flex space-x-2">
                    <Button
                        type="button"
                        onClick={() => append({ key: `new_${Date.now()}`, question: "", answer: "" })}
                        variant="outline"
                    >
                        + Add Another FAQ Pair
                    </Button>
                    <Button type="submit" form="qna-form" disabled={loading}>
                        {loading ? "Processing..." : "Submit"}
                    </Button>
                </div>
            </div>

            <Form {...form}>
                <form
                    id="qna-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    {fields.map((field, index) => (
                        <div key={field.id} className="space-y-4 p-4 border rounded-md">
                            <FormField
                                control={form.control}
                                name={`qnaPairs.${index}.question`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Question {index + 1}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter your question here..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`qnaPairs.${index}.answer`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Answer {index + 1}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter your answer here..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                onClick={() => handleRemove(index, fields[index].question)}
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