import { AppPageShell } from "@/app/(app)/_components/page-shell";
import type { SearchParams } from "@/types/data-table";
import { z } from "zod";
import { getAllPaginatedEmailLogsQuery } from "@/server/actions/logs/queries";
import { emailLogsPageConfig } from "./_constants/page-config";
import { EmailLogsTable } from "./_components/logs-table";
import { Suspense } from "react";
import { SidebarLoading } from "../../_components/sidebar";
import EmailLogsLoading from "./loading";

type EmailLogsPageProps = {
    searchParams: SearchParams;
};

const searchParamsSchema = z.object({
    page: z.coerce.number().default(1),
    per_page: z.coerce.number().default(10),
    sort: z.string().optional(),
    email: z.string().optional(),
    recipient: z.string().optional(),
    subject: z.string().optional(),
    status: z.string().optional()
});

export default async function EmailLogsPage({ searchParams }: EmailLogsPageProps) {
    const search = searchParamsSchema.parse(searchParams);

    const emailLogsPromise = getAllPaginatedEmailLogsQuery(search);

    return (
        <AppPageShell
            title={emailLogsPageConfig.title}
            description={emailLogsPageConfig.description}

        >
            <div className="w-full space-y-5">
                <EmailLogsTable emailLogsPromise={emailLogsPromise} />
            </div>
        </AppPageShell>
    );
}