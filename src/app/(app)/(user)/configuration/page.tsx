// Server Component (fetches data on the server)
import { AppPageShell } from "@/app/(app)/_components/page-shell";
import { emailLogsPageConfig } from "./_constants/page-config";
import { getOrgConfigurations } from "@/server/actions/organization/queries";
import BlacklistContent from "./blacklist-content";

export default async function BlacklistPage() {
  // Fetch the data on the server
  const { blacklist_domains, blacklist_emails, notification_emails } = await getOrgConfigurations();

  return (
    <AppPageShell
      title={emailLogsPageConfig.title}
      description={emailLogsPageConfig.description}
    >
      <BlacklistContent 
        blacklistDomains={blacklist_domains}
        blacklistEmails={blacklist_emails}
        notificationEmails={notification_emails}
      />
    </AppPageShell>
  );
}
