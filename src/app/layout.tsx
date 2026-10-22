import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { mesclarClasses } from "@/utils/mesclarClasses";
import { AppProviders } from "@/providers/AppProviders";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SmartLocker",
  description: "Gestão inteligente de armários rotativos e diários para academias.",
  manifest: "/manifest.json",
  icons: {
    icon: "/smartlocker_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={mesclarClasses("font-sans", plusJakartaSans.variable, jetBrainsMono.variable)}
    >
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
