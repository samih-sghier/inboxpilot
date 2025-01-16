import { Suspense, useEffect, useState } from "react";
import { AppPageShell } from "@/app/(app)/_components/page-shell";
import { connectPageConfig } from "@/app/(app)/(user)/connect/_constants/page-config";
import { ConnectEmailForm } from "@/app/(app)/(user)/connect/_components/create-tenants-form";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ConnectedEmailsDropdown } from "@/app/(app)/(user)/connect/_components/connect-dropdown";
import Balancer from "react-wrap-balancer";
import { toast } from "sonner";
import { getOrganizations } from "@/server/actions/organization/queries";
import { getOrgConnectedQuery } from "@/server/actions/gmail/queries";
import { SidebarLoading } from "../../_components/sidebar";
import { getOrgSubscription } from "@/server/actions/stripe_subscription/query";
import { Icons } from "@/components/ui/icons";

function mapFrequencyToLabel(frequency: number | string | null): string {
    switch (frequency) {
        case 0:
            return "less than 1 minute";
        case 2:
            return "After 2 minutes";
        case 60:
            return "After 1 hour";
        case 240:
            return "After 4 hours";
        case 1440:
            return "After 24 hours";
        case 2880:
            return "After 48 hours";
        case 4320:
            return "After 72 hours";
        default:
            return "less than 1 minute";
    }
}

function mapPurposeToLabel(purpose: string): string {
    switch (purpose) {
        case "customer_support":
            return "Customer Support";
        case "sales":
            return "Sales Team";
        case "personal_assistant":
            return "Personal Assistant";
        case "technical_inquiries":
            return "Technical Inquiries";
        case "security_operations":
            return "Security Operations";
        case "multipurpose":
            return "Multipurpose";
        case "marketing":
            return "Marketing";
        case "recruitment":
            return "Recruitment";
        case "general":
            return "General Communication";
        default:
            return purpose; // if purpose is not in the list, return the string itself
    }
}


function mapSendModeToLabel(sendMode: string): string {
    return sendMode === "send" ? "Sends Automatically" : "Creates Drafts Only";
}

export default async function UserTenantPage() {
    const source = await getOrgConnectedQuery();
    const { currentOrg } = await getOrganizations();
    const subscription = await getOrgSubscription();

    return (
        <AppPageShell
            title={connectPageConfig.title}
            description={connectPageConfig.description}
        >
            <Suspense fallback={<SidebarLoading />}>
                <div className="flex w-full items-start justify-between mb-6">
                    <h2 className="text-base font-medium sm:text-lg">
                        {source.length} email accounts you have linked.
                    </h2>

                    <ConnectEmailForm defaultOpen={false} orgId={currentOrg.id} upgradeNeeded={(subscription?.plan?.planLimit ?? 1) <= source.length} />
                </div>

                <div className={source.length > 0 ? "grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid gap-4"}>
                    {source.length > 0 ? (
                        source.map((emailConnected) => (
                            <Card key={emailConnected.email} className="relative shadow-md">
                                <ConnectedEmailsDropdown {...emailConnected} />
                                <CardContent className="p-4 flex flex-col justify-between h-full">
                                    <div className="space-y-4">
                                        <div>
                                            <CardTitle className="text-xl font-semibold mb-1">{emailConnected.email}</CardTitle>
                                            <div className="flex items-center gap-2">

                                                <Badge variant="outline" className="text-xs">
                                                    {mapPurposeToLabel(emailConnected?.purpose)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    Added on {format(new Date(emailConnected?.createdAt), "PPP")}
                                                </span>
                                            </div>

                                            {emailConnected.provider === "google" && <Icons.google className="h-4 w-4" />}
                                            {emailConnected.provider === "outlook" && <Icons.microsoft className="h-4 w-4" />}
                                        </div>

                                    </div>

                                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                        <Badge
                                            variant={emailConnected.isActive ? "success" : "destructive"}
                                            className="w-fit"
                                        >
                                            {emailConnected.isActive ? "active" : "disconnected"}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="w-fit"
                                        >
                                            {mapSendModeToLabel(emailConnected.sendMode || 'draft')}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="flex w-full flex-col items-center justify-center gap-4 py-10">
                            <p className="font-medium text-muted-foreground">No email accounts connected.</p>
                            <Balancer as="p" className="text-center text-muted-foreground">
                                Connect an email account using the form above to start automating your email responses.
                            </Balancer>
                        </div>
                    )}
                </div>
            </Suspense>
        </AppPageShell>
    );
}