"use client"

import * as React from "react"
import {
  Server,
  Layers,
  LineChart,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { FacilityPicker } from "@/components/facility-picker"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Navigation items with collapsible sections
  const navItems = [
    {
      title: "Facility",
      icon: Home,
      items: [
        {
          title: "Overview",
          url: "/facilities/[facilityId]",
        },
        {
          title: "Impact",
          url: "/facilities/[facilityId]/impact",
        },
        {
          title: "Operational",
          url: "/facilities/[facilityId]/operational",
        },
      ],
    },
    {
      title: "Servers",
      icon: Server,
      items: [
        {
          title: "Overview",
          url: "/facilities/[facilityId]/servers",
        },
        {
          title: "New Server",
          url: "/facilities/[facilityId]/servers/new",
        },
      ],
    },
    {
      title: "Racks",
      icon: Layers,
      items: [
        {
          title: "Overview",
          url: "/facilities/[facilityId]/racks",
        },
        {
          title: "New Rack",
          url: "/facilities/[facilityId]/racks/new",
        },
      ],
    },
    {
      title: "Metrics",
      icon: LineChart,
      items: [
        {
          title: "Overview",
          url: "/metrics",
        },
        {
          title: "Add Metric",
          url: "/metrics/new",
        },
      ],
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <FacilityPicker />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        {/* Could add user menu or other footer content here */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
