import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://azura.js.org"),
  title: {
    default: "AzuraJS - Minimal Decorator-Based Framework for Node.js & Bun",
    template: "%s | AzuraJS",
  },
  description:
    "The minimal, decorator-based framework for Node.js & Bun. Experience full type-safety without the boilerplate overhead. Build faster with AzuraJS.",
  keywords: [
    "AzuraJS",
    "Node.js framework",
    "Bun framework",
    "TypeScript framework",
    "decorator-based framework",
    "minimal framework",
    "type-safe framework",
    "REST API",
    "backend framework",
    "web framework",
  ],
  authors: [{ name: "0xviny" }],
  creator: "0xviny",
  publisher: "AzuraJS",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://azura.js.org",
    title: "AzuraJS - Minimal Decorator-Based Framework",
    description:
      "Build faster with AzuraJS. The minimal, decorator-based framework for Node.js & Bun with full type-safety.",
    siteName: "AzuraJS",
    images: [
      {
        url: "https://azura.js.org/logo.png",
        alt: "AzuraJS Framework",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AzuraJS - Minimal Decorator-Based Framework",
    description:
      "Build faster with AzuraJS. The minimal, decorator-based framework for Node.js & Bun with full type-safety.",
    images: ["https://azura.js.org/logo.png"],
    creator: "@azurajs",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/site.webmanifest",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>
          {children}
          <Analytics />
        </RootProvider>
      </body>
    </html>
  );
}
