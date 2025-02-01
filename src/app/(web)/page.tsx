import Features from "@/app/(web)/_components/features";
import {
    WebPageHeader,
    WebPageWrapper,
} from "@/app/(web)/_components/general-components";
import { Promotion } from "@/app/(web)/_components/promotion";
import { Testimonials } from "@/app/(web)/_components/testimonials";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { siteUrls } from "@/config/urls";
import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";
import HowItWorks from "@/app/(web)/_components/howitworks";

export const metadata: Metadata = {
    title: "Automate Email Replies",    
    alternates: {
        canonical: `${siteUrls.publicUrl}`,
    },
    openGraph: {
        type: 'website',
        url: `${siteUrls.publicUrl}`,
    }
};

export const dynamic = "force-static";

export default async function HomePage() {
    return (
        <WebPageWrapper>
            <WebPageHeader
                badge="Email Support on Autopilot"
                title={`Automated Email Replies`}
            >
                <Balancer
                    as="p"
                    className="text-center text-base text-muted-foreground sm:text-lg"
                >

                    AI that learns your business and replies to emails 24/7 from your support email account!
                </Balancer>

                <Balancer
                    as="p"
                    className="text-center text-base text-muted-foreground sm:text-lg"
                >
                    Connect your email, train AI with your company data (website, faq...) and let it reply to all incoming emails around the clock—delivering responses in your brand's voice.
                </Balancer>

                <div className="flex items-center gap-2">
                    {/* <Link
                        href={siteUrls.auth.signup}
                        className={buttonVariants({ variant: "outline" })}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Icons.google className="mr-2 h-4 w-4" /> Google
                    </Link> */}

                    <Link
                        href={siteUrls.auth.signup}
                        className={buttonVariants({
                            className: "bg-gradient-to-r from-[#807280] via-[#5C4A5B] to-[#603060] text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300"
                        })}
                    >
                        Build your mailbot
                        <ArrowRightIcon className="ml-1 h-4 w-4" />
                    </Link>


                </div>
            </WebPageHeader>

            <VideoDisplay />
            <HowItWorks />
            <Features />
            <Promotion />
            {/* <Testimonials /> */}
        </WebPageWrapper>
    );
}


const VideoDisplay = () => {
    // YouTube parameters for high quality playback
    const videoId = '2RI69BaMtIo';
    const params = new URLSearchParams({
        rel: '0',           // Don't show related videos
        modestbranding: '1', // Minimal YouTube branding
        hd: '1',            // Force HD mode
        vq: 'hd1080',       // Request 1080p quality
        controls: '1',       // Show player controls
    }).toString();

    return (
        <div className="-m-2 w-full rounded-xl bg-foreground/5 p-2 ring-1 ring-inset ring-foreground/10 shadow-[0_0_32px_#603060,0_0_64px_#603060] lg:-m-4 lg:rounded-2xl lg:p-4">
            <div className="relative aspect-video w-full rounded-md bg-muted">
                <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-md border border-border border-[0.5px]"
                    src={`https://www.youtube.com/embed/${videoId}?${params}`}
                    title="InboxPilot Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </div>
    );
};
