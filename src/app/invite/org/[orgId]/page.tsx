import { getOrgByIdQuery, getUserOrgsQuery } from "@/server/actions/organization/queries";
import { RequestCard } from "@/app/invite/org/[orgId]/_components/request-card";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { getUser } from "@/server/auth";
import LoginPromptPage from "./_components/account-notfound";

export type OrgRequestProps = {
    params: {
        orgId: string;
    };
};

export default async function OrgRequestPage({
    params: { orgId },
}: OrgRequestProps) {
    const org = await getOrgByIdQuery({ orgId });

    const user = await getUser();

    if (!user) {
        return <LoginPromptPage orgName={org?.name || ''} />
    }

    const users = await getUserOrgsQuery();


    if (!org) {
        return notFound();
    }


    return (
        <main className="container flex min-h-screen flex-col items-center justify-center">
            <RequestCard org={org} orgId={orgId} />
        </main>
    );
}

export async function generateMetadata({
    params,
}: OrgRequestProps): Promise<Metadata> {
    const org = await getOrgByIdQuery({ orgId: params.orgId });

    if (!org) {
        return notFound();
    }

    return {
        title: `Invite to ${org.name}`,
        description: `Invite your team to ${org.name} and get started building your next project.`,
    };
}
