import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { updateTextSourceField } from "@/server/actions/sources/mutations";
import { toast } from "sonner";

const textSchema = z.object({
    text: z.string().optional(),
});

export function TextContent({ source, subscription, stats, onSourceChange }: { source: any, subscription: any, stats: any, onSourceChange: (newSource: any) => void }) {
    const [loading, setLoading] = useState(false);

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

    const form = useForm({
        resolver: zodResolver(textSchema),
        defaultValues: {
            text: source?.text_source || "",
        },
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const newTotalChars = (totalChars - textInputChars) + data.text.length;
            if (newTotalChars > subscription?.charactersPerChatbot) {
                toast.error(`File exceeds the character limit for your subscription. Current total: ${totalChars}, New file: ${data.text.length}, Limit: ${subscription?.charactersPerChatbot}`);
                return;
            }
            onSourceChange({ ...source, text_source: data.text });
            await updateTextSourceField(data.text);

            toast.success("Text Source Updated");
        } catch (error) {
            toast.error("Error Submitting Text Source");
            console.error("Error submitting text:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Text</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter additional instructions that you want your AI Agent to follow..."
                                    {...field}
                                    value={field.value || ""}
                                    className="h-80 w-full resize-none" // Increased height
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Submit Text"}
                </Button>
            </form>
        </Form>
    );
}
