'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { BlacklistEntry } from './blacklist-entry';

const emailBlacklistSchema = z.object({
  entries: z.array(z.object({
    id: z.string(),
    type: z.literal('email'),
    value: z.string()
      .email("Please enter a valid email address")
  }))
});

type EmailBlacklistEntry = z.infer<typeof emailBlacklistSchema>['entries'][number];

interface EmailBlacklistProps {
  initialEntries?: EmailBlacklistEntry[];
  onUpdate?: (entries: EmailBlacklistEntry[]) => Promise<void>;
}

export function EmailBlacklist({ initialEntries = [], onUpdate }: EmailBlacklistProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof emailBlacklistSchema>>({
    resolver: zodResolver(emailBlacklistSchema),
    defaultValues: {
      entries: initialEntries.length > 0 ? initialEntries : []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries"
  });

  const onSubmit = async (data: z.infer<typeof emailBlacklistSchema>) => {
    setLoading(true);
    try {
      if (onUpdate) {
        await onUpdate(data.entries);
      }
    } catch (error) {
      console.error("Error updating email blacklist:", error);
      toast.error("Failed to update email blacklist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Blacklist Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => append({
                id: `email_${Date.now()}`,
                type: 'email',
                value: ''
              })}
              variant="outline"
            >
              Add Email
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {fields.map((field, index) => (
                <BlacklistEntry
                  key={field.id}
                  index={index}
                  control={form.control}
                  watch={form.watch}
                  onRemove={() => remove(index)}
                  type="email"
                />
              ))}

              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Email Blacklist"}
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}