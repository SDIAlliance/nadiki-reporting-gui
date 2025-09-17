"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MetricsTable } from "@/components/metrics/metrics-table";
import { MetricForm } from "@/components/metrics/metric-form";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/browser-client";
import { Metric } from "@/types/metrics";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const { toast } = useToast();
  const supabase = createSupabaseBrowserClient();

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from("metrics")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = () => {
    setEditingMetric(null);
    setFormOpen(true);
  };

  const handleEdit = (metric: Metric) => {
    setEditingMetric(metric);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this metric?")) return;

    try {
      const { error } = await supabase
        .from("metrics")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Metric deleted successfully",
      });
      
      await fetchMetrics();
    } catch (error) {
      console.error("Error deleting metric:", error);
      toast({
        title: "Error",
        description: "Failed to delete metric",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (values: { metric_name: string; unit: string; entity: string }) => {
    try {
      if (editingMetric) {
        const { error } = await supabase
          .from("metrics")
          .update(values)
          .eq("id", editingMetric.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Metric updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("metrics")
          .insert([values]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Metric created successfully",
        });
      }
      
      await fetchMetrics();
    } catch (error) {
      console.error("Error saving metric:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save metric",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Metrics Configuration</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Metric
        </Button>
      </div>

      <MetricsTable
        metrics={metrics}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <MetricForm
        metric={editingMetric}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}