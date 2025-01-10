import { AppPageShell } from "@/app/(app)/_components/page-shell";
import { dashboardPageConfig } from "@/app/(app)/(user)/dashboard/_constants/page-config";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ActivityIcon,
    CreditCardIcon,
    DollarSignIcon,
    Users2Icon,
    HomeIcon, // For Properties
    UsersIcon, // For Organization Members
    EyeIcon, // For Watch List
    ShieldIcon, // For Subscription Plan
    BarChartIcon, // For Delinquency Score
    SendIcon,
    LinkIcon,
    MessageSquareIcon,
    ClockIcon,
    AlertCircleIcon,
    SlidersIcon,
    PenIcon
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component
import { siteUrls } from "@/config/urls";
import { redirect, useRouter } from "next/navigation";
import { getDashboardInfo } from "@/server/actions/dashboard/queries";
import { getOrgSubscription } from "@/server/actions/stripe_subscription/query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Suspense } from "react";
import { SidebarLoading } from "../../_components/sidebar";
import DashboardLoading from "./loading";
import { formatNumberWithCommas } from "../sources/_components/sources-card";

export default async function DashboardPage() {
    const dashInfo = await getDashboardInfo();
    const subscription = await getOrgSubscription();
    // const router = useRouter();

    return (
        <AppPageShell
            title={dashboardPageConfig.title}
            description={dashboardPageConfig.description}
        >
            <Suspense fallback={<DashboardLoading />}>

                <div className="grid gap-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Emails Sent
                                </CardTitle>
                                <SendIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashInfo.emailsSent}</div>
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-muted-foreground">
                                    {dashInfo.emailsSentGrowth > 0 ? '+' : ''}{dashInfo.emailsSentGrowth}% from last month
                                </p>
                            </CardFooter>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Active Users
                                </CardTitle>
                                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashInfo.activeUsers}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Connected Emails
                                </CardTitle>
                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashInfo.connectedEmails}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Sources
                                </CardTitle>
                                <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashInfo.sources}</div>

                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Emails Drafted
                                </CardTitle>
                                <PenIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashInfo.draftedEmails}</div>
                                {/* <p className="text-xs text-muted-foreground">
                                {dashInfo.draftedEmails > 0 ? '+' : '-'}{Math.abs(dashInfo.avgResponseTimeChange)}% from last month
                            </p> */}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Escalations
                                </CardTitle>
                                <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashInfo.alerts}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Token Usage
                                </CardTitle>
                                <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashInfo.apiUsage}</div>

                            </CardContent>
                            <CardFooter>
                                {dashInfo.overLimit && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-red-600">
                                            You have exceeded your token limit for your current plan
                                        </p>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                        <Card className="relative">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Subscription Plan
                                </CardTitle>
                                <ShieldIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="relative pb-12">
                                <div className="flex items-center gap-2">
                                    <div className="text-2xl font-bold">{subscription ? subscription.plan?.title : "Free"}</div>
                                    {subscription?.status && (
                                        <Badge variant="secondary">
                                            {subscription.status}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
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
                            </CardContent>
                            <CardFooter>
                                <form
                                    action={async () => {
                                        "use server";
                                        redirect(siteUrls.organization.plansAndBilling);
                                    }}
                                >
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                    >
                                        Upgrade Plan
                                    </Button>
                                </form>


                            </CardFooter>

                        </Card>
                    </div>
                </div>
            </Suspense>
        </AppPageShell >
    );
}