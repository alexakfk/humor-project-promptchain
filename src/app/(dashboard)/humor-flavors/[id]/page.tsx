"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  Play,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StepList } from "@/components/step-list";
import { ImagePicker } from "@/components/image-picker";
import { CaptionResults } from "@/components/caption-results";
import { createClient } from "@/lib/supabase/client";
import {
  uploadAndGenerateCaptions,
  generateCaptionsForExistingImage,
} from "@/lib/api";
import type {
  HumorFlavor,
  HumorFlavorStepWithRelations,
  HumorFlavorStepType,
  LlmModel,
  LlmInputType,
  LlmOutputType,
  Caption,
} from "@/lib/types";

export default function HumorFlavorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [flavor, setFlavor] = useState<HumorFlavor | null>(null);
  const [steps, setSteps] = useState<HumorFlavorStepWithRelations[]>([]);
  const [stepTypes, setStepTypes] = useState<HumorFlavorStepType[]>([]);
  const [models, setModels] = useState<LlmModel[]>([]);
  const [inputTypes, setInputTypes] = useState<LlmInputType[]>([]);
  const [outputTypes, setOutputTypes] = useState<LlmOutputType[]>([]);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testExistingImageId, setTestExistingImageId] = useState<string>("");
  const [testResults, setTestResults] = useState<Caption[]>([]);
  const [testing, setTesting] = useState(false);
  const [testProgress, setTestProgress] = useState("");

  const fetchFlavor = useCallback(async () => {
    const { data, error } = await supabase
      .from("humor_flavors")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error || !data) {
      toast.error("Humor flavor not found");
      router.push("/humor-flavors");
      return;
    }

    setFlavor(data);
    setEditSlug(data.slug);
    setEditDescription(data.description || "");
  }, [supabase, id, router]);

  const fetchSteps = useCallback(async () => {
    const { data } = await supabase
      .from("humor_flavor_steps")
      .select(
        `*, humor_flavor_step_types(*), llm_models(*, llm_providers(*)), llm_input_types(*), llm_output_types(*)`
      )
      .eq("humor_flavor_id", Number(id))
      .order("order_by");

    setSteps((data as HumorFlavorStepWithRelations[]) ?? []);
  }, [supabase, id]);

  const fetchLookups = useCallback(async () => {
    const [st, m, it, ot] = await Promise.all([
      supabase.from("humor_flavor_step_types").select("*").order("slug"),
      supabase
        .from("llm_models")
        .select("*, llm_providers(*)")
        .order("name"),
      supabase.from("llm_input_types").select("*").order("slug"),
      supabase.from("llm_output_types").select("*").order("slug"),
    ]);

    setStepTypes(st.data ?? []);
    setModels(m.data ?? []);
    setInputTypes(it.data ?? []);
    setOutputTypes(ot.data ?? []);
  }, [supabase]);

  const fetchCaptions = useCallback(async () => {
    const { data } = await supabase
      .from("captions")
      .select("*, images(*)")
      .eq("humor_flavor_id", Number(id))
      .order("created_datetime_utc", { ascending: false })
      .limit(100);

    setCaptions((data as Caption[]) ?? []);
  }, [supabase, id]);

  useEffect(() => {
    async function init() {
      const [, , , , { data: { user } }] = await Promise.all([
        fetchFlavor(),
        fetchSteps(),
        fetchLookups(),
        fetchCaptions(),
        supabase.auth.getUser(),
      ]);
      if (user) setUserId(user.id);
      setLoading(false);
    }
    init();
  }, [fetchFlavor, fetchSteps, fetchLookups, fetchCaptions, supabase]);

  async function handleSaveFlavor(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("humor_flavors")
      .update({
        slug: editSlug.trim(),
        description: editDescription.trim() || null,
        modified_by_user_id: userId!,
      })
      .eq("id", Number(id));

    if (error) {
      toast.error("Failed to update", { description: error.message });
    } else {
      toast.success("Humor flavor updated");
      fetchFlavor();
    }
    setSaving(false);
  }

  async function handleDeleteFlavor() {
    const confirmed = window.confirm(
      "Are you sure? This will also delete all steps."
    );
    if (!confirmed) return;

    await supabase
      .from("humor_flavor_steps")
      .delete()
      .eq("humor_flavor_id", Number(id));

    const { error } = await supabase
      .from("humor_flavors")
      .delete()
      .eq("id", Number(id));

    if (error) {
      toast.error("Failed to delete", { description: error.message });
      return;
    }

    toast.success("Humor flavor deleted");
    router.push("/humor-flavors");
  }

  async function handleTest() {
    if (!testFile && !testExistingImageId) {
      toast.error("Select or upload an image first");
      return;
    }

    setTesting(true);
    setTestResults([]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("Not authenticated");
        setTesting(false);
        return;
      }

      const token = session.access_token;
      let result;

      if (testFile) {
        setTestProgress("Generating upload URL...");
        result = await uploadAndGenerateCaptions(token, testFile, Number(id));
      } else {
        setTestProgress("Generating captions...");
        result = await generateCaptionsForExistingImage(
          token,
          testExistingImageId,
          Number(id)
        );
      }

      const captionArray = Array.isArray(result) ? result : [result];
      setTestResults(captionArray);
      toast.success(`Generated ${captionArray.length} caption(s)`);
      fetchCaptions();
    } catch (err) {
      toast.error("Test failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setTesting(false);
      setTestProgress("");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!flavor) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/humor-flavors">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{flavor.slug}</h1>
          <p className="text-sm text-muted-foreground">
            {flavor.description || "No description"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">
            Steps
            <Badge variant="secondary" className="ml-1.5">
              {steps.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          <TabsTrigger value="captions">
            Captions
            <Badge variant="secondary" className="ml-1.5">
              {captions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          <form onSubmit={handleSaveFlavor} className="max-w-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteFlavor}
              >
                Delete Flavor
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── Steps Tab ── */}
        <TabsContent value="steps">
          <StepList
            humorFlavorId={Number(id)}
            steps={steps}
            stepTypes={stepTypes}
            models={models}
            inputTypes={inputTypes}
            outputTypes={outputTypes}
            onRefresh={fetchSteps}
            userId={userId!}
          />
        </TabsContent>

        {/* ── Test Tab ── */}
        <TabsContent value="test">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Test This Flavor</h3>
              <p className="text-sm text-muted-foreground">
                Upload an image or select one from an existing set, then generate
                captions using this humor flavor&apos;s prompt chain.
              </p>
            </div>

            <ImagePicker
              onFileSelected={(file) => {
                setTestFile(file);
                setTestExistingImageId("");
              }}
              onExistingImageSelected={(imgId) => {
                setTestExistingImageId(imgId);
                setTestFile(null);
              }}
              disabled={testing}
            />

            <Separator />

            <div className="flex items-center gap-3">
              <Button
                onClick={handleTest}
                disabled={testing || (!testFile && !testExistingImageId)}
              >
                {testing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Generate Captions
              </Button>
              {testProgress && (
                <span className="text-sm text-muted-foreground">
                  {testProgress}
                </span>
              )}
            </div>

            <CaptionResults captions={testResults} />
          </div>
        </TabsContent>

        {/* ── Captions Tab ── */}
        <TabsContent value="captions">
          {captions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-medium">No captions yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Use the Test tab to generate captions with this flavor.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Caption</TableHead>
                    <TableHead className="w-24 text-right">Likes</TableHead>
                    <TableHead className="w-36">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {captions.map((caption) => (
                    <TableRow key={caption.id}>
                      <TableCell>
                        {caption.images?.url ? (
                          <img
                            src={caption.images.url}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate text-sm">{caption.content}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        {caption.like_count}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(caption.created_datetime_utc).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
