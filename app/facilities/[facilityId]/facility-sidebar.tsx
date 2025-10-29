'use client';

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Edit, Home, TrendingUp, ChevronLeft, Activity } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface FacilitySidebarProps {
  facilityId: string;
}

export function FacilitySidebar({ facilityId }: FacilitySidebarProps) {
  const pathname = usePathname();
  
  const navigation = [
    {
      name: "Overview",
      href: `/facilities/${facilityId}`,
      icon: Home,
    },
    {
      name: "Impact",
      href: `/facilities/${facilityId}/impact`,
      icon: TrendingUp,
    },
    {
      name: "Operational",
      href: `/facilities/${facilityId}/operational`,
      icon: Activity,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Facility</h2>
            <p className="text-sm text-muted-foreground">{facilityId}</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button asChild className="w-full">
          <Link href={`/facilities/${facilityId}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Facility
          </Link>
        </Button>
        <Button variant="ghost" asChild className="w-full">
          <Link href="/facilities">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Facilities
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}