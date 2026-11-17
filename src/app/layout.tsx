import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({
  src: [
    {
      path: "../../public/fonts/instrument-serif.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/instrument-serif-italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-display",
  display: "swap",
});
const body = localFont({
  src: [
    {
      path: "../../public/fonts/dm-sans-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/dm-sans-semibold.ttf",
      weight: "500 700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: "Sagar Live Fish — Fresh Catch. Real Flavour.",
  description:
    "Discover freshwater fish, sea catch, prawns and crabs at Sagar Live Fish. Choose your cut and quantity, then enquire directly on WhatsApp. Retail and wholesale.",
  applicationName: "Sagar Live Fish",
  openGraph: {
    title: "Sagar Live Fish — Fresh Catch. Real Flavour.",
    description:
      "Freshwater favourites and sea treasures. Cleaned and cut your way. Order enquiries on WhatsApp.",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/hero.webp",
        width: 1536,
        height: 1024,
        alt: "Sagar Live Fish — fresh fish, prawns and crab on ice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sagar Live Fish — Fresh Catch. Real Flavour.",
    images: ["/images/hero.webp"],
  },
};

export const viewport: Viewport = { themeColor: "#082d62" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
