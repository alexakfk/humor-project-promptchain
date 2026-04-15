import type { SupabaseClient } from "@supabase/supabase-js";

export function suggestDuplicateSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  const normalized = baseSlug.trim();
  const set = new Set(existingSlugs.map((s) => s.toLowerCase()));
  let candidate = `${normalized}-copy`;
  let n = 2;
  while (set.has(candidate.toLowerCase())) {
    candidate = `${normalized}-copy-${n}`;
    n += 1;
  }
  return candidate;
}

export async function duplicateHumorFlavor(
  supabase: SupabaseClient,
  params: { sourceFlavorId: number; newSlug: string; userId: string }
): Promise<{ newFlavorId: number } | { error: string }> {
  const { sourceFlavorId, newSlug, userId } = params;
  const slug = newSlug.trim();
  if (!slug) {
    return { error: "Name is required." };
  }

  const { data: source, error: sourceError } = await supabase
    .from("humor_flavors")
    .select("*")
    .eq("id", sourceFlavorId)
    .single();

  if (sourceError || !source) {
    return { error: sourceError?.message ?? "Flavor not found." };
  }

  const { data: stepRows, error: stepsError } = await supabase
    .from("humor_flavor_steps")
    .select("*")
    .eq("humor_flavor_id", sourceFlavorId)
    .order("order_by");

  if (stepsError) {
    return { error: stepsError.message };
  }

  const { data: newFlavor, error: insertFlavorError } = await supabase
    .from("humor_flavors")
    .insert({
      slug,
      description: source.description,
      created_by_user_id: userId,
      modified_by_user_id: userId,
    })
    .select("id")
    .single();

  if (insertFlavorError || !newFlavor) {
    return { error: insertFlavorError?.message ?? "Failed to create flavor." };
  }

  const newId = newFlavor.id;

  if (!stepRows?.length) {
    return { newFlavorId: newId };
  }

  const inserts = stepRows.map((step) => ({
    humor_flavor_id: newId,
    order_by: step.order_by,
    llm_temperature: step.llm_temperature,
    llm_input_type_id: step.llm_input_type_id,
    llm_output_type_id: step.llm_output_type_id,
    llm_model_id: step.llm_model_id,
    humor_flavor_step_type_id: step.humor_flavor_step_type_id,
    llm_system_prompt: step.llm_system_prompt,
    llm_user_prompt: step.llm_user_prompt,
    description: step.description,
    created_by_user_id: userId,
    modified_by_user_id: userId,
  }));

  const { error: insertStepsError } = await supabase
    .from("humor_flavor_steps")
    .insert(inserts);

  if (insertStepsError) {
    await supabase.from("humor_flavors").delete().eq("id", newId);
    return { error: insertStepsError.message };
  }

  return { newFlavorId: newId };
}
