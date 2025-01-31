import { AppPageShell } from "@/app/(app)/_components/page-shell";

//user/config/constants/page-config
import { emailConfigurationsPageConfig } from "@/app/(app)/(user)/configuration/_constants/page-config";
import ConfigurationLoading from "src/app/(app)/(user)/configuration/loading";
import { getOrgConnectedQuery } from "@/server/actions/gmail/queries";
import { getAllPaginatedConfiguredEmailsQuery } from "@/server/actions/configuration/queries";
import { BlacklistTable } from "./_components/blacklist-table";
import type { SearchParams } from "@/types/data-table";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component
import { siteUrls } from "@/config/urls";
import { redirect, useRouter } from "next/navigation";
import { getDashboardInfo } from "@/server/actions/dashboard/queries";
import { getOrgSubscription } from "@/server/actions/stripe_subscription/query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Suspense } from "react";
import { SidebarLoading } from "../../_components/sidebar";
import { formatNumberWithCommas } from "../sources/_components/sources-card";
import { z } from "zod";

type EmailLogsPageProps = {
    searchParams: SearchParams;
};

// Schema for paginated email logs
const searchParamsSchema = z.object({
    page: z.coerce.number().default(1),
    per_page: z.coerce.number().default(10),
    sort: z.string().optional(),
    blacklistedEmail: z.string().optional(),
    blacklistedDomain: z.string().optional(),
    note: z.string().optional(),
});

export default async function ConfigurationPage({ searchParams }: EmailLogsPageProps) {
    const search = searchParamsSchema.parse(searchParams);

    const blacklistPromise = getAllPaginatedConfiguredEmailsQuery(search)
    // const router = useRouter();

    return (
        <AppPageShell
            title={emailConfigurationsPageConfig.title}
            description={emailConfigurationsPageConfig.description}
        >
            <Suspense fallback={<ConfigurationLoading />}>
                <div className="flex w-full items-start justify-between mb-6">
                    <h2 className="text-base font-medium sm:text-lg">
                    Block these email addresses and domains from receiving automated responses. The automated responder system will reply to every email in your inbox
                    that is not blocked.
                    </h2>
                </div>
                <Button type="button">Add Email/Domain</Button>
                    
            <div className="w-full space-y-5">
                <BlacklistTable blacklistPromise={blacklistPromise} />
            </div>

            </Suspense>
        </AppPageShell >
    );
}