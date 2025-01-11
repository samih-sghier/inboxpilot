import { useEffect, useState } from "react";
import { AppPageShell } from "@/app/(app)/_components/page-shell";
import { propertiesPageConfig } from "@/app/(app)/(user)/sources/_constants/page-config";
import { TabsSection } from "./_components/tabs-section";
import { SourcesCard } from "./_components/sources-card";
import { getOrgSourcesQuery, getSourceStatsQuery } from "@/server/actions/sources/queries";
import { getOrgSubscription } from "@/server/actions/stripe_subscription/query";
import { freePricingPlan } from "@/config/pricing";

export default async function UserPropertyPage() {
    const source = await getOrgSourcesQuery();
    const stats = await getSourceStatsQuery();
    const subscription = await getOrgSubscription();

    // const totalChars = links.reduce((total, link) => total + link.chars, 0);


    return (
        <AppPageShell
            title={propertiesPageConfig.title}
            description={propertiesPageConfig.description}
        >
            <div className="flex flex-col lg:flex-row lg:space-x-4">
                <div className="flex-1">
                    <TabsSection source={source || {}} subscription={subscription ? subscription.plan : freePricingPlan} stats={stats} />
                </div>
                <div className="mt-4 lg:mt-0 lg:w-1/4">
                    <SourcesCard stats={stats} subscription={subscription} dataSources={source} />
                </div>
            </div>
        </AppPageShell>
    );
}
