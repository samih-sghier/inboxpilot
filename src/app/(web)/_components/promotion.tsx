import { Button } from "@/components/ui/button";
import { siteUrls } from "@/config/urls";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { ArrowRightIcon } from "lucide-react";

export function Promotion() {
    return (
        <section className="flex min-h-96 w-full flex-col items-center justify-center gap-5 rounded-[26px] bg-gradient-to-t from-[#603060] via-[#5C4A5B] to-[#807280] p-8 py-10 text-white">
            <Balancer
                as="h2"
                className="text-center font-heading text-3xl font-bold md:text-5xl"
            >
                Stop Drowning in Emails
            </Balancer>
            <Balancer
                as="p"
                className="text-center text-base leading-relaxed text-white/90 sm:text-xl"
            >
                Set up the AI to either draft responses for your review or send them directly allowing you to focus on important tasks while it handles queries around the clock.
            </Balancer>

            <Link href={siteUrls.auth.signup}>
                <Button
                    variant="secondary"
                    size="lg"
                    className="mt-4 bg-white text-[#603060] hover:bg-white/90"
                >
                    Try for Free
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
            </Link>
        </section>
    );
}