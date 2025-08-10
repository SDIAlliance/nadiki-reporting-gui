"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Metric } from "@/types/metrics";
import { Trash2, Edit } from "lucide-react";

interface MetricsTableProps {
  metrics: Metric[];
  onEdit: (metric: Metric) => void;
  onDelete: (id: string) => void;
}

export function MetricsTable({ metrics, onEdit, onDelete }: MetricsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Metric Name</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {metrics.map((metric) => (
          <TableRow key={metric.id}>
            <TableCell className="font-medium">{metric.metric_name}</TableCell>
            <TableCell>{metric.unit}</TableCell>
            <TableCell>{metric.entity}</TableCell>
            <TableCell>
              {new Date(metric.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(metric)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(metric.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}