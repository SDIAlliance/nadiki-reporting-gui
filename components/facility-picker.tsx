"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Building2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useFacilities } from "@/lib/hooks/use-facilities"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function FacilityPicker() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const params = useParams()
  const currentFacilityId = params.facilityId as string | undefined

  const { facilities, isLoading } = useFacilities()

  // Find the currently selected facility
  const activeFacility = facilities.find(f => f.id === currentFacilityId)

  const handleFacilityChange = (facilityId: string) => {
    router.push(`/facilities/${facilityId}/operational`)
  }

  const handleNewFacility = () => {
    router.push('/facilities/new')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {isLoading ? "Loading..." : activeFacility?.id || "Select Facility"}
                </span>
                <span className="truncate text-xs">
                  {activeFacility?.countryCode || "No facility selected"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Facilities
            </DropdownMenuLabel>
            {facilities.map((facility) => (
              <DropdownMenuItem
                key={facility.id}
                onClick={() => handleFacilityChange(facility.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Building2 className="size-4 shrink-0" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{facility.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {facility.countryCode}
                  </span>
                </div>
                <DropdownMenuShortcut>⌘{facilities.indexOf(facility) + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleNewFacility} className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add facility</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
