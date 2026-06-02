import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Dancing_Script } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["400", "700"],
});

import { Toaster } from "sonner";
import { ModalRoot } from "@/components/modals/ModalRoot";

export const metadata: Metadata = {
  title: "eTours León",
  description: "Premium Electric Tourism Mobility",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${dancingScript.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="h-full flex bg-gray-50/50">
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
          <ModalRoot />
        </Providers>
      </body>
    </html>
  );
}
