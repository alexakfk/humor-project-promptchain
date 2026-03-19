"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  HumorFlavorStep,
  HumorFlavorStepType,
  LlmModel,
  LlmInputType,
  LlmOutputType,
} from "@/lib/types";

interface StepFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StepFormData) => Promise<void>;
  stepTypes: HumorFlavorStepType[];
  models: LlmModel[];
  inputTypes: LlmInputType[];
  outputTypes: LlmOutputType[];
  initial?: HumorFlavorStep | null;
}

export interface StepFormData {
  description: string;
  humor_flavor_step_type_id: number;
  llm_model_id: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  llm_temperature: number | null;
  llm_system_prompt: string;
  llm_user_prompt: string;
}

export function StepForm({
  open,
  onOpenChange,
  onSubmit,
  stepTypes,
  models,
  inputTypes,
  outputTypes,
  initial,
}: StepFormProps) {
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [stepTypeId, setStepTypeId] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const [inputTypeId, setInputTypeId] = useState<string>("");
  const [outputTypeId, setOutputTypeId] = useState<string>("");
  const [temperature, setTemperature] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");

  const selectedModel = models.find((m) => m.id === Number(modelId));

  useEffect(() => {
    if (initial) {
      setDescription(initial.description || "");
      setStepTypeId(String(initial.humor_flavor_step_type_id));
      setModelId(String(initial.llm_model_id));
      setInputTypeId(String(initial.llm_input_type_id));
      setOutputTypeId(String(initial.llm_output_type_id));
      setTemperature(
        initial.llm_temperature !== null ? String(initial.llm_temperature) : ""
      );
      setSystemPrompt(initial.llm_system_prompt || "");
      setUserPrompt(initial.llm_user_prompt || "");
    } else {
      setDescription("");
      setStepTypeId("");
      setModelId("");
      setInputTypeId("");
      setOutputTypeId("");
      setTemperature("");
      setSystemPrompt("");
      setUserPrompt("");
    }
  }, [initial, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        description: description.trim(),
        humor_flavor_step_type_id: Number(stepTypeId),
        llm_model_id: Number(modelId),
        llm_input_type_id: Number(inputTypeId),
        llm_output_type_id: Number(outputTypeId),
        llm_temperature:
          temperature !== "" && selectedModel?.is_temperature_supported
            ? Number(temperature)
            : null,
        llm_system_prompt: systemPrompt.trim(),
        llm_user_prompt: userPrompt.trim(),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initial ? "Edit Step" : "Add Step"}</DialogTitle>
            <DialogDescription>
              {initial
                ? "Modify this prompt chain step."
                : "Configure a new step in the prompt chain."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="step-desc">Description</Label>
              <Input
                id="step-desc"
                placeholder="Describe what this step does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Step Type</Label>
                <Select value={stepTypeId} onValueChange={(v) => setStepTypeId(v ?? "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stepTypes.map((st) => (
                      <SelectItem key={st.id} value={String(st.id)}>
                        {st.slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>LLM Model</Label>
                <Select value={modelId} onValueChange={(v) => setModelId(v ?? "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.llm_providers?.name
                          ? `${m.llm_providers.name} / ${m.name}`
                          : m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Input Type</Label>
                <Select value={inputTypeId} onValueChange={(v) => setInputTypeId(v ?? "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select input..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inputTypes.map((it) => (
                      <SelectItem key={it.id} value={String(it.id)}>
                        {it.slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Output Type</Label>
                <Select value={outputTypeId} onValueChange={(v) => setOutputTypeId(v ?? "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select output..." />
                  </SelectTrigger>
                  <SelectContent>
                    {outputTypes.map((ot) => (
                      <SelectItem key={ot.id} value={String(ot.id)}>
                        {ot.slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedModel?.is_temperature_supported && (
              <div className="space-y-2">
                <Label htmlFor="temp">Temperature</Label>
                <Input
                  id="temp"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  placeholder="0.7"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sys-prompt">System Prompt</Label>
              <Textarea
                id="sys-prompt"
                placeholder="You are a helpful assistant..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-prompt">User Prompt</Label>
              <Textarea
                id="user-prompt"
                placeholder="Given the following image description..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initial ? "Save Changes" : "Add Step"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
