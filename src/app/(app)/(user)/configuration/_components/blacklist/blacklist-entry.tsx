// _components/blacklist/blacklist-entry.tsx
'use client';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrashIcon } from "lucide-react";

interface BlacklistEntryProps {
  index: number;
  control: any;
  onRemove: () => void;
  watch: any;
}

export function BlacklistEntry({ index, control, onRemove, watch }: BlacklistEntryProps) {
  const entryType = watch(`entries.${index}.type`);
  
  return (
    <div className="grid grid-cols-12 gap-4 p-4 border rounded-lg bg-white">
      {/* Type Selection */}
      <div className="col-span-3">
        <FormField
          control={control}
          name={`entries.${index}.type`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="domain">Domain</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Value Input */}
      <div className="col-span-8">
        <FormField
          control={control}
          name={`entries.${index}.value`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                {entryType === 'domain' ? 'Domain' : 'Email Address'}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={
                    entryType === 'domain'
                      ? "Enter domain (e.g., example.com)"
                      : "Enter email address"
                  }
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Remove Button */}
      <div className="col-span-1 flex items-end justify-center pb-1">
        <Button
          type="button"
          onClick={onRemove}
          variant="ghost"
          size="icon"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}