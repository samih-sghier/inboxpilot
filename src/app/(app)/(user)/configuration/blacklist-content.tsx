"use client";

import { useState } from "react";
import { CompactBlacklist } from "./_components/blacklist/compact-blacklist";
import { NotificationManager } from "./_components/notifications/notification-manager";
import { toast } from "sonner";
import {
  addBlacklistDomain, removeBlacklistDomain, 
  addBlacklistEmail, removeBlacklistEmail, 
  addNotificationEmail, removeNotificationEmail 
} from "@/server/actions/organization/mutations";

interface BlacklistContentProps {
  blacklistDomains: string[];
  blacklistEmails: string[];
  notificationEmails: string[];
}

export default function BlacklistContent({ blacklistDomains, blacklistEmails, notificationEmails }: BlacklistContentProps) {
  // State management (optional)
  const [domains, setDomains] = useState(blacklistDomains);
  const [emails, setEmails] = useState(blacklistEmails);
  const [notifyEmails, setNotifyEmails] = useState(notificationEmails);

  // Validators
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidDomain = (domain: string) => /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(domain);

  // Transform initial data
  const initialEmailEntries = emails.map(email => ({ id: `email_${email}`, value: email }));
  const initialDomainEntries = domains.map(domain => ({ id: `domain_${domain}`, value: domain }));
  const initialNotificationEmails = notifyEmails.map(email => ({ id: `notify_${email}`, email }));

const handleEmailUpdate = async (entries: { id: string; value: string }[]) => {
    try {
        const updatedEmails = entries.map(e => e.value);
        setEmails(updatedEmails);

        const toAdd = updatedEmails.filter(e => !emails.includes(e));
        const toRemove = emails.filter(e => !updatedEmails.includes(e));

        for (const email of toAdd) {
            if (isValidEmail(email)) {
                console.log("adding "+ email)
                await addBlacklistEmail(email);
            } else {
                console.error(`Invalid email: ${email}`);
            }
        }
        for (const email of toRemove) {
            await removeBlacklistEmail(email);
        }

    } catch (error) {
        console.error("Failed to update email blacklist:", error);
        toast.error("Error updating email blacklist");
    }
};

// Similar improvements for handleDomainUpdate and handleNotificationUpdate

  const handleDomainUpdate = async (entries: { id: string; value: string }[]) => {

    try {
      const updatedDomains = entries.map(e => e.value);
      setDomains(updatedDomains);

      const toAdd = updatedDomains.filter(d => !domains.includes(d));
      const toRemove = domains.filter(d => !updatedDomains.includes(d));

      for (const domain of toAdd) await addBlacklistDomain(domain);
      for (const domain of toRemove) await removeBlacklistDomain(domain);

    } catch (error) {
      console.error("Failed to update domain blacklist:", error);
      toast.error("Error updating domain blacklist");
    }
  };

  const handleNotificationUpdate = async (entries: { id: string; email: string }[]) => {
    try {
      const updatedEmails = entries.map(e => e.email);
      setNotifyEmails(updatedEmails);

      const toAdd = updatedEmails.filter(e => !notifyEmails.includes(e));
      const toRemove = notifyEmails.filter(e => !updatedEmails.includes(e));
      console.log("to remove")

      console.log(toRemove)

      for (const email of toAdd) await addNotificationEmail(email);
      for (const email of toRemove) await removeNotificationEmail(email);

      toast.success("Notification emails updated successfully!");
    } catch (error) {
      console.error("Failed to update notification emails:", error);
      toast.error("Error updating notification emails");
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <CompactBlacklist
          title="Email Blacklist"
          subtitle="Emails sent from the addresses listed below will be skipped, and not processed."
          type="email"
          initialEntries={initialEmailEntries}
          onUpdate={handleEmailUpdate}
          validator={isValidEmail}
          placeholder="Enter address (ex: support@inboxpilot.co)"
        />
        <CompactBlacklist
          title="Domain Blacklist"
          subtitle="Emails sent from the domains listed below will be skipped, and not processed."
          type="domain"
          initialEntries={initialDomainEntries}
          onUpdate={handleDomainUpdate}
          validator={isValidDomain}
          placeholder="Enter domain (ex: inboxpilot.co)"
        />
      </div>
      <NotificationManager
        initialEmails={initialNotificationEmails}
        onUpdate={handleNotificationUpdate}
      />
    </div>
  );
}
