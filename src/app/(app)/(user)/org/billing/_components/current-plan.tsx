import { CancelPauseResumeBtns } from "@/app/(app)/(user)/org/billing/_components/cancel-pause-resume-btns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { OrgSubscription } from "@/types/org-subscription";
import { format } from "date-fns";
import { redirect } from "next/navigation";

type CurrentPlanProps = {
    subscription: OrgSubscription;
};

export function CurrentPlan({ subscription }: CurrentPlanProps) {
    const isArchivedPlan = subscription && !subscription.plan?.title;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                    Manage and view your current plan
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {isArchivedPlan && (
                    <div className="rounded-md border border-yellow-200 bg-yellow-100 p-3">
                        <p className="text-sm text-yellow-900">
                            This plan has been archived due to a price change. Your plan is still active, and you will continue to be billed at your original subscription price.
                        </p>
                    </div>
                )}


                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <p>
                            <span className="font-semibold">Plan:</span>{" "}
                            {isArchivedPlan ?
                                "Archived Price"
                                : (subscription ? subscription.plan?.title : "Free")}
                        </p>

                        {subscription?.status && (
                            <Badge variant="secondary">
                                {subscription.status}
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {subscription ? (
                            <>
                                {subscription.status === "active" &&
                                    "Renews at " +
                                    format(subscription.renews_at, "PP")}

                                {subscription.status === "paused" &&
                                    "Your subscription is paused"}

                                {subscription.status === "canceled" &&
                                    subscription.ends_at &&
                                    `${new Date(subscription.ends_at) >
                                        new Date()
                                        ? "Ends at "
                                        : "Ended on "
                                    }` + format(subscription.ends_at, "PP")}
                            </>
                        ) : (
                            "No expiration"
                        )}
                    </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <form
                        action={async () => {
                            "use server";

                            if (subscription?.customerPortalUrl) {
                                redirect(subscription?.customerPortalUrl);
                            }
                        }}
                    >
                        <Button disabled={!subscription} variant="outline">
                            Manage your billing settings
                        </Button>
                    </form>

                    <CancelPauseResumeBtns subscription={subscription} />
                </div>
            </CardContent>
        </Card>
    );
}
