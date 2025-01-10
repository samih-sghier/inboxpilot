"use client"; // Ensure this component is a Client Component

import { useState } from "react";
import { Upload, Brain, Plug, Clock } from "lucide-react"; // Importing the icons

// Step data array
const steps = [
    {
        number: 1,
        title: "Import Data",
        description:
            "Upload your custom data and add a website for crawling to train your bot",
        icon: Upload,
    },
    {
        number: 2,
        title: "Train the AI",
        description:
            "Train the email bot on your data to understand customer queries",
        icon: Brain,
    },
    {
        number: 3,
        title: "Connect Your Account",
        description:
            "Securely link your email account",
        icon: Plug,
    },
    {
        number: 4,
        title: "24/7 Auto-Responses, or Drafts for review",
        description:
            "Let the AI handle queries round the clock while you focus on important tasks",
        icon: Clock, // Replaced Coffee with Clock icon
    },
];

export default function HowItWorks() {
    const [expandedStep, setExpandedStep] = useState<number>(1); // Default to the first step expanded

    return (
        <section className="flex flex-col items-center justify-center gap-20 py-20 bg-background">
            {/* Header Section */}
            <div className="grid gap-3 text-center">
                <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                    How It Works
                </h2>
                <p className="max-w-2xl mx-auto text-base text-muted-foreground sm:text-lg">
                    Add your data sources, train the AI, customize it to your liking, and link it to your email accounts.
                </p>
            </div>

            {/* Steps Grid */}
            <div className="grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
                {steps.map((step) => (
                    <StepCard
                        key={step.number}
                        number={step.number}
                        title={step.title}
                        description={step.description}
                        icon={step.icon}
                        isExpanded={expandedStep === step.number}
                        onClick={() =>
                            setExpandedStep(expandedStep === step.number ? null : step.number)
                        }
                    />
                ))}
            </div>
        </section>
    );
}

type StepCardProps = {
    number: number;
    title: string;
    description: string;
    icon: React.ElementType;
    isExpanded: boolean;
    onClick: () => void;
};

function StepCard({
    number,
    title,
    description,
    icon: IconComponent,
    isExpanded,
    onClick,
}: StepCardProps) {
    return (
        <div
            onClick={onClick}
            className="cursor-pointer border border-border rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105 p-6 flex flex-col gap-4 bg-card"
        >
            <div className="flex items-center gap-4">
                {/* Icon with consistent size for all steps */}
                <IconComponent className="w-12 h-12" style={{ color: "#603060" }} />
                <div className="flex flex-col">
                    <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
            </div>

            {/* Show description when expanded */}

        </div>
    );
}
