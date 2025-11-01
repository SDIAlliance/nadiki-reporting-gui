import type { Metadata } from "next";
import "@/app/globals.css";
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";

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
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">
                  Nadiki Reporting
                </h1>
              </div>
            </header>
            <main className="flex flex-1 flex-col p-4 md:p-8">
              {children}
            </main>
          </SidebarInset>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  )
}