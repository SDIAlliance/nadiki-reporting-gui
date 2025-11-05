"use client"

import * as React from "react"
import Image from "next/image"
import {
  Server,
  Layers,
  LineChart,
  Home,
  Briefcase,
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
    {
      title: "Workloads",
      icon: Briefcase,
      items: [
        {
          title: "Overview",
          url: "/facilities/[facilityId]/workloads",
        },
        {
          title: "New Workload",
          url: "/facilities/[facilityId]/workloads/new",
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
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center">
          <Image
            src="/IDED_logo.svg"
            alt="IDED"
            width={120}
            height={30}
            className="group-data-[collapsible=icon]:w-8"
            priority
          />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
