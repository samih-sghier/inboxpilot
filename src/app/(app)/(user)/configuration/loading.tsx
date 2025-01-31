import { AppPageLoading } from "@/app/(app)/_components/page-loading";
import { Skeleton } from "@/components/ui/skeleton";
import { emailLogsPageConfig } from "./_constants/page-config";

export default function EmailLogsLoading() {
    return (
        <AppPageLoading
            title={emailLogsPageConfig.title}
            description={emailLogsPageConfig.description}
        >
            <Skeleton className="h-96 w-full" />
        </AppPageLoading>
    );
}
