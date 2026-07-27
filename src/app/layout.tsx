import type { Metadata, Viewport } from "next";
import { Playfair_Display, Parisienne, Jost } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import SiteHeader from "@/components/chrome/SiteHeader";
import SiteFooter from "@/components/chrome/SiteFooter";
import CartDrawer from "@/components/cart/CartDrawer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const parisienne = Parisienne({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-parisienne",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://juicecartel.uk"),
  title: {
    default: "Juice Cartel — Nottingham's No.1 Juice Spot",
    template: "%s · Juice Cartel",
  },
  description:
    "Freshly made juices, milkshakes and desserts, delivered across Nottingham. Pressed the morning they go out. Elevate your day, the JC way.",
  keywords: [
    "juice delivery Nottingham",
    "fresh juice Nottingham",
    "cold pressed juice",
    "crunch cake Nottingham",
    "milkshake delivery",
  ],
  openGraph: {
    title: "Juice Cartel — Nottingham's No.1 Juice Spot",
    description:
      "Freshly made juices, milkshakes and desserts, delivered across Nottingham.",
    url: "https://juicecartel.uk",
    siteName: "Juice Cartel",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juice Cartel — Nottingham's No.1 Juice Spot",
    description:
      "Freshly made juices, milkshakes and desserts, delivered across Nottingham.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#080706",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      className={`${playfair.variable} ${parisienne.variable} ${jost.variable}`}
    >
      <body className="min-h-dvh flex flex-col">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
