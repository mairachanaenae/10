import type { Metadata } from "next";
import { PasswordGate } from "@/components/PasswordGate";
import { authConfigured } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Investor's Command Center",
  description:
    "A premium AI-powered investment command center: mentors, agents, and your portfolio in one place.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tree = (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg bg-radial-glow font-sans text-ink antialiased">
        <PasswordGate>{children}</PasswordGate>
      </body>
    </html>
  );

  // Only pull Clerk into the graph when configured — keeps the static export
  // (which has no server actions) clean, and avoids Clerk throwing without keys.
  if (authConfigured()) {
    const { ClerkProvider } = await import("@clerk/nextjs");
    return <ClerkProvider>{tree}</ClerkProvider>;
  }
  return tree;
}
