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

// Server type matching the API response
export type Server = {
  id: string
  facility_id: string
  rack_id: string
  rated_power?: number
  total_cpu_sockets?: number
  total_installed_memory?: number
  installed_gpus?: any[]
  storage_devices?: any[]
  cooling_type: string
}

// Utility function to format cooling type for display
function formatCoolingType(coolingType: string): string {
  return coolingType.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export const columns: ColumnDef<Server>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Server ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "facility_id",
    header: "Datacenter ID",
    cell: ({ row }) => <div>{row.getValue("facility_id")}</div>,
  },
  {
    accessorKey: "rack_id",
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
    cell: ({ row }) => <div>{row.getValue("rack_id")}</div>,
  },
  {
    accessorKey: "rated_power",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rated Power
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const power = row.getValue("rated_power") as number | undefined
      return <div>{power ? `${power} kW` : 'N/A'}</div>
    },
  },
  {
    accessorKey: "total_cpu_sockets",
    header: "CPU Sockets",
    cell: ({ row }) => {
      const sockets = row.getValue("total_cpu_sockets") as number | undefined
      return <div>{sockets || 'N/A'}</div>
    },
  },
  {
    accessorKey: "total_installed_memory",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Memory
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const memory = row.getValue("total_installed_memory") as number | undefined
      return <div>{memory ? `${memory} GB` : 'N/A'}</div>
    },
  },
  {
    accessorKey: "installed_gpus",
    header: "GPUs",
    cell: ({ row }) => {
      const gpus = row.getValue("installed_gpus") as any[] | undefined
      return <div>{gpus?.length || '0'}</div>
    },
    enableSorting: false,
  },
  {
    accessorKey: "storage_devices",
    header: "Storage Devices",
    cell: ({ row }) => {
      const devices = row.getValue("storage_devices") as any[] | undefined
      return <div>{devices?.length || '0'}</div>
    },
    enableSorting: false,
  },
  {
    accessorKey: "cooling_type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cooling Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const coolingType = row.getValue("cooling_type") as string
      return <div>{formatCoolingType(coolingType)}</div>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const server = row.original
      const facilityId = server.facility_id

      return (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/facilities/${facilityId}/servers/${server.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/facilities/${facilityId}/servers/${server.id}/edit`}>
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
                onClick={() => navigator.clipboard.writeText(server.id)}
              >
                Copy server ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete server
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
