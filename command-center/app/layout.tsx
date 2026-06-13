import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { authConfigured } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Investor's Command Center",
  description:
    "A premium AI-powered investment command center — mentors, agents, and your portfolio in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tree = (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg bg-radial-glow font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );

  // Only mount ClerkProvider when configured (it throws without a publishable key).
  return authConfigured() ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
