import { buttonVariants } from "@/components/ui/button";
import { siteUrls } from "@/config/urls";
import { getOrganizations } from "@/server/actions/organization/queries";
import { getUser } from "@/server/auth";
import Link from "next/link";
import { Fragment } from "react";

export async function HeaderAuth() {
    const user = await getUser();

    if (user) {
        return (
            <Link
                href={siteUrls.dashboard.home}
                className={buttonVariants({
                    className: "flex items-center space-x-1",
                })}
            >
                <span>Dashboard</span>
            </Link>
        );
    }

    return (
        <Link
            href={siteUrls.auth.signup}
            className={buttonVariants({
                className: "flex items-center space-x-1",
            })}
            prefetch={true}
        >
            <span>Try it out</span>
            <span className="font-light italic">
                {" "}
                — it&apos;s free
            </span>
        </Link>
    );
}

