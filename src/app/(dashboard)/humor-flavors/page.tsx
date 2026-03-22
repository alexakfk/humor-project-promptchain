"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HumorFlavorCard } from "@/components/humor-flavor-card";
import { createClient } from "@/lib/supabase/client";
import type { HumorFlavor } from "@/lib/types";

type FlavorWithCount = HumorFlavor & { step_count: number };

export default function HumorFlavorsPage() {
  const supabase = createClient();
  const [flavors, setFlavors] = useState<FlavorWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  const fetchFlavors = useCallback(async () => {
    const { data, error } = await supabase
      .from("humor_flavors")
      .select("*, humor_flavor_steps(count)")
      .order("created_datetime_utc", { ascending: false });

    if (error) {
      toast.error("Failed to load humor flavors", { description: error.message });
      setLoading(false);
      return;
    }

    const mapped: FlavorWithCount[] = (data ?? []).map((f) => ({
      id: f.id,
      created_datetime_utc: f.created_datetime_utc,
      description: f.description,
      slug: f.slug,
      step_count: (f.humor_flavor_steps as { count: number }[])?.[0]?.count ?? 0,
    }));

    setFlavors(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchFlavors();
  }, [fetchFlavors]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const { error } = await supabase
      .from("humor_flavors")
      .insert({
        slug: newSlug.trim(),
        description: newDescription.trim() || null,
        created_by_user_id: userId!,
        modified_by_user_id: userId!,
      });

    if (error) {
      toast.error("Failed to create humor flavor", { description: error.message });
      setCreating(false);
      return;
    }

    toast.success("Humor flavor created");
    setNewSlug("");
    setNewDescription("");
    setDialogOpen(false);
    setCreating(false);
    fetchFlavors();
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure? This will also delete all steps for this flavor."
    );
    if (!confirmed) return;

    const { error: stepsError } = await supabase
      .from("humor_flavor_steps")
      .delete()
      .eq("humor_flavor_id", id);

    if (stepsError) {
      toast.error("Failed to delete flavor steps", { description: stepsError.message });
      return;
    }

    const { error } = await supabase
      .from("humor_flavors")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete humor flavor", { description: error.message });
      return;
    }

    toast.success("Humor flavor deleted");
    fetchFlavors();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Humor Flavors</h1>
          <p className="text-muted-foreground">
            Manage your prompt chain flavors for caption generation.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            New Flavor
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Humor Flavor</DialogTitle>
                <DialogDescription>
                  Add a new humor flavor to define a prompt chain.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="dry-wit"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="A humor style focused on dry, understated wit..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {flavors.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No humor flavors yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first humor flavor to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flavors.map((flavor) => (
            <HumorFlavorCard
              key={flavor.id}
              flavor={flavor}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
