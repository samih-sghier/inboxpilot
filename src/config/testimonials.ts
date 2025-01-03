/**
 * This file is used to store the testimonials for the homepage.
 * The testimonials are stored as an array of arrays of arrays.
 * Each array represents a column of testimonials.
 * Each inner array represents a row of testimonials.
 * Each testimonial is an object with a body and author property.
 *
 * @note add your testimonials evenly
 */

type Testimonial = {
    body: string;
    author: {
        name: string;
        handle: string;
        imageUrl: string;
        logoUrl?: string;
    };
};

export const featuredTestimonial: Testimonial = {
    body: "InboxPilot has transformed how we manage emails. It's a game changer!",
    author: {
        name: "Lara Thompson",
        handle: "larartofficial",
        imageUrl:
            "https://plus.unsplash.com/premium_photo-1669075651198-674fab1370b3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cmVhbCUyMGVzdGF0ZSUyMGNvbXBhbnklMjBsb2dvfGVufDB8fDB8fHww",
        logoUrl: "https://tailwindui.com/img/logos/savvycal-logo-gray-900.svg",
    },
};

export const testimonials: Testimonial[][][] = [
    [
        [
            {
                body: "Incredible tool! Makes email so much easier.",
                author: {
                    name: "Zara Finch",
                    handle: "ZaraTech",
                    imageUrl:
                        "https://utfs.io/f/e9364a67-9c41-421d-bb94-b7101f618d1f-1uet02.png",
                },
            },
            // More testimonials...
        ],
        [
            {
                body: "A must-have for anyone who values communication.",
                author: {
                    name: "Kian Rivers",
                    handle: "kian78Innovate",
                    imageUrl:
                        "https://static.wixstatic.com/media/cea8c0_365d1486f5204ccbbb40e3b77e591dc4~mv2.jpg/v1/fill/w_600,h_362,al_c,lg_1,q_80,enc_auto/cea8c0_365d1486f5204ccbbb40e3b77e591dc4~mv2.jpg",
                },
            },
            // More testimonials...
        ],
    ],
    [
        [
            {
                body: "Saves me so much time! Highly recommend.",
                author: {
                    name: "Mira Gold",
                    handle: "MiraG_Creative",
                    imageUrl:
                        "https://utfs.io/f/e6ed2635-d6e0-4acf-abb9-3466525c819e-5hoeg9.jpg",
                },
            },
            // More testimonials...
        ],
        [
            {
                body: "Simply the best email management tool out there.",
                author: {
                    name: "Finn Carter",
                    handle: "finn_carter4",
                    imageUrl:
                        "https://utfs.io/f/291a4aa7-892f-4eb3-be3b-0661fbc665c7-i5ejyz.jpg",
                },
            },
            // More testimonials...
        ],
    ],
];
