import { useEffect, useState } from "react";
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

function mapFrequencyToLabel(frequency: number | string | null): string {
    switch (frequency) {
        case 0:
            return "Instantly";
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
            return "Only when approved";
    }
}


export default async function UserTenantPage() {
    const source = await getOrgConnectedQuery();
    const { currentOrg } = await getOrganizations();

    return (
        <AppPageShell
            title={connectPageConfig.title}
            description={connectPageConfig.description}
        >
            <div className="flex w-full items-start justify-between mb-6">
                <h2 className="text-base font-medium sm:text-lg">
                    {source.length} email accounts you have added.
                </h2>

                <ConnectEmailForm defaultOpen={false} orgId={currentOrg.id}   />
            </div>

            <div className={source.length > 0 ? "grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid gap-4"}>
                {source.length > 0 ? (
                    source.map((emailConnected) => (
                        <Card key={emailConnected.email} className="relative shadow-md">
                            <ConnectedEmailsDropdown {...emailConnected} />
                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                <div>
                                    <CardTitle className="text-xl font-semibold mb-2">{emailConnected.email}</CardTitle>
                                    <CardDescription className="text-sm mb-2">{`Reply Frequency: ${mapFrequencyToLabel(emailConnected.frequency)}`}</CardDescription>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                                        <p>Added on {format(new Date(emailConnected.createdAt), "PPP")}</p>
                                        {emailConnected.purpose && <Badge variant="background" className="w-fit">{emailConnected.purpose}</Badge>}

                                    </div>
                                </div>
                                <div className="flex justify-between items-end mt-auto">
                                    <Badge
                                        variant={
                                            emailConnected.isActive
                                                ? "success"
                                                : !emailConnected.isActive
                                                    ? "destructive"
                                                    : "info"
                                        }
                                        className="w-fit"
                                    >
                                        {emailConnected.isActive ? "active" : "disconnected"}
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
        </AppPageShell>
    );
}
