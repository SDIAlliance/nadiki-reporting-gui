'use client';

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FacilitySidebar } from "./facility-sidebar";
import { useParams } from "next/navigation";

export default function FacilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const facilityId = params.facilityId as string;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <FacilitySidebar facilityId={facilityId} />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-8">
            <SidebarTrigger className="mb-4 md:hidden" />
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}