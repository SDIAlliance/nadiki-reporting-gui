import type { Metadata } from "next";
import { Html, Head, Main, NextScript } from 'next/document'
import "@/app/globals.css";
import React from "react";

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
        {/* Layout UI */}
        {/* Place children where you want to render a page or nested layout */}
        <main>{children}</main>
      </body>
    </html>
  )
}