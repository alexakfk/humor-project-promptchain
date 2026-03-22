"use client";

import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StepForm, type StepFormData } from "@/components/step-form";
import { createClient } from "@/lib/supabase/client";
import type {
  HumorFlavorStepWithRelations,
  HumorFlavorStepType,
  LlmModel,
  LlmInputType,
  LlmOutputType,
} from "@/lib/types";

interface StepListProps {
  humorFlavorId: number;
  steps: HumorFlavorStepWithRelations[];
  stepTypes: HumorFlavorStepType[];
  models: LlmModel[];
  inputTypes: LlmInputType[];
  outputTypes: LlmOutputType[];
  onRefresh: () => void;
  userId: string;
}

export function StepList({
  humorFlavorId,
  steps,
  stepTypes,
  models,
  inputTypes,
  outputTypes,
  onRefresh,
  userId,
}: StepListProps) {
  const supabase = createClient();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<HumorFlavorStepWithRelations | null>(
    null
  );

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    const reordered = Array.from(steps);
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    const updates = reordered.map((step, i) => ({
      id: step.id,
      order_by: i + 1,
      humor_flavor_id: step.humor_flavor_id,
      llm_input_type_id: step.llm_input_type_id,
      llm_output_type_id: step.llm_output_type_id,
      llm_model_id: step.llm_model_id,
      humor_flavor_step_type_id: step.humor_flavor_step_type_id,
      modified_by_user_id: userId,
    }));

    const { error } = await supabase.from("humor_flavor_steps").upsert(updates);

    if (error) {
      toast.error("Failed to reorder steps", { description: error.message });
    } else {
      toast.success("Steps reordered");
    }
    onRefresh();
  }

  async function handleAddStep(data: StepFormData) {
    const nextOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.order_by)) + 1 : 1;

    const { error } = await supabase.from("humor_flavor_steps").insert({
      humor_flavor_id: humorFlavorId,
      order_by: nextOrder,
      ...data,
      created_by_user_id: userId,
      modified_by_user_id: userId,
    });

    if (error) {
      toast.error("Failed to add step", { description: error.message });
      return;
    }

    toast.success("Step added");
    setFormOpen(false);
    onRefresh();
  }

  async function handleEditStep(data: StepFormData) {
    if (!editingStep) return;

    const { error } = await supabase
      .from("humor_flavor_steps")
      .update({ ...data, modified_by_user_id: userId })
      .eq("id", editingStep.id);

    if (error) {
      toast.error("Failed to update step", { description: error.message });
      return;
    }

    toast.success("Step updated");
    setEditingStep(null);
    onRefresh();
  }

  async function handleDeleteStep(id: number) {
    const confirmed = window.confirm("Delete this step?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("humor_flavor_steps")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete step", { description: error.message });
      return;
    }

    const remaining = steps
      .filter((s) => s.id !== id)
      .sort((a, b) => a.order_by - b.order_by);

    if (remaining.length > 0) {
      const renumber = remaining.map((step, i) => ({
        id: step.id,
        order_by: i + 1,
        humor_flavor_id: step.humor_flavor_id,
        llm_input_type_id: step.llm_input_type_id,
        llm_output_type_id: step.llm_output_type_id,
        llm_model_id: step.llm_model_id,
        humor_flavor_step_type_id: step.humor_flavor_step_type_id,
        modified_by_user_id: userId,
      }));
      await supabase.from("humor_flavor_steps").upsert(renumber);
    }

    toast.success("Step deleted");
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="steps">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {steps.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  No steps yet. Add one below.
                </div>
              )}
              {steps.map((step, index) => (
                <Draggable
                  key={step.id}
                  draggableId={String(step.id)}
                  index={index}
                >
                  {(prov, snapshot) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      className={`rounded-lg border bg-card transition-shadow ${
                        snapshot.isDragging ? "shadow-lg" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div
                          {...prov.dragHandleProps}
                          className="cursor-grab text-muted-foreground hover:text-foreground"
                        >
                          <GripVertical className="h-5 w-5" />
                        </div>

                        <Badge variant="outline" className="shrink-0 font-mono">
                          {step.order_by}
                        </Badge>

                        <button
                          onClick={() => toggleExpand(step.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          {expanded.has(step.id) ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate font-medium">
                            {step.description || `Step ${step.order_by}`}
                          </span>
                        </button>

                        <div className="flex shrink-0 items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {step.llm_models?.name || `Model #${step.llm_model_id}`}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingStep(step);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteStep(step.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {expanded.has(step.id) && (
                        <>
                          <Separator />
                          <div className="space-y-3 p-4 text-sm">
                            <div className="grid gap-2 sm:grid-cols-4">
                              <div>
                                <span className="text-muted-foreground">Type:</span>{" "}
                                {step.humor_flavor_step_types?.slug ?? "—"}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Input:</span>{" "}
                                {step.llm_input_types?.slug ?? "—"}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Output:</span>{" "}
                                {step.llm_output_types?.slug ?? "—"}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Temp:</span>{" "}
                                {step.llm_temperature ?? "default"}
                              </div>
                            </div>
                            {step.llm_system_prompt && (
                              <div>
                                <p className="mb-1 font-medium text-muted-foreground">
                                  System Prompt
                                </p>
                                <pre className="whitespace-pre-wrap rounded bg-muted p-3 font-mono text-xs">
                                  {step.llm_system_prompt}
                                </pre>
                              </div>
                            )}
                            {step.llm_user_prompt && (
                              <div>
                                <p className="mb-1 font-medium text-muted-foreground">
                                  User Prompt
                                </p>
                                <pre className="whitespace-pre-wrap rounded bg-muted p-3 font-mono text-xs">
                                  {step.llm_user_prompt}
                                </pre>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button variant="outline" className="w-full" onClick={() => setFormOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Step
      </Button>

      <StepForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleAddStep}
        stepTypes={stepTypes}
        models={models}
        inputTypes={inputTypes}
        outputTypes={outputTypes}
      />

      <StepForm
        open={!!editingStep}
        onOpenChange={(open) => {
          if (!open) setEditingStep(null);
        }}
        onSubmit={handleEditStep}
        stepTypes={stepTypes}
        models={models}
        inputTypes={inputTypes}
        outputTypes={outputTypes}
        initial={editingStep}
      />
    </div>
  );
}
