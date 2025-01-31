import { AppPageLoading } from "@/app/(app)/_components/page-loading";
import { emailConfigurationsPageConfig } from "@/app/(app)/(user)/configuration/_constants/page-config";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConfigurationLoading() {
    return (
        <AppPageLoading
            title={emailConfigurationsPageConfig.title}
            description={emailConfigurationsPageConfig.description}
        >
            <Skeleton className="h-96 w-full" />
        </AppPageLoading>
    );
}
