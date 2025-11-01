"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

// Rack type matching the API response
export type Rack = {
  id: string
  facility_id: string
  total_available_power?: number
  total_available_cooling_capacity?: number
  number_of_pdus?: number
  power_redundancy?: string
  createdAt?: string
  updatedAt?: string
}

// Utility function to extract cage ID from rack ID
function extractCageId(rackId: string): string {
  const parts = rackId.split('-');
  if (parts.length >= 4) {
    return parts[parts.length - 1];
  }
  return rackId;
}

export const columns: ColumnDef<Rack>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rack ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
  },
  {
    id: "cage_id",
    header: "Cage ID",
    cell: ({ row }) => {
      const rackId = row.getValue("id") as string
      return <div>{extractCageId(rackId)}</div>
    },
    enableSorting: false,
  },
  {
    accessorKey: "total_available_power",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Available Power
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const power = row.getValue("total_available_power") as number | undefined
      return <div>{power ? `${power} kW` : 'N/A'}</div>
    },
  },
  {
    accessorKey: "total_available_cooling_capacity",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cooling Capacity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const cooling = row.getValue("total_available_cooling_capacity") as number | undefined
      return <div>{cooling ? `${cooling} kW` : 'N/A'}</div>
    },
  },
  {
    accessorKey: "number_of_pdus",
    header: "PDUs",
    cell: ({ row }) => {
      const pdus = row.getValue("number_of_pdus") as number | undefined
      return <div>{pdus || 'N/A'}</div>
    },
  },
  {
    accessorKey: "power_redundancy",
    header: "Redundancy",
    cell: ({ row }) => {
      const redundancy = row.getValue("power_redundancy") as string | undefined
      return <div>{redundancy || 'N/A'}</div>
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string | undefined
      return <div>{date ? new Date(date).toLocaleDateString() : 'N/A'}</div>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const rack = row.original
      const facilityId = rack.facility_id

      return (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/facilities/${facilityId}/racks/${rack.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/facilities/${facilityId}/racks/${rack.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(rack.id)}
              >
                Copy rack ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete rack
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
