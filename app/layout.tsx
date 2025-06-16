import type { Metadata } from "next";
import "@/app/globals.css";
import React from "react";
import { NavBar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Nadiki GUI",
  description: "Nadiki GUI Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NavBar />
        <main className="min-h-screen bg-background">{children}</main>
      </body>
    </html>
  )
}