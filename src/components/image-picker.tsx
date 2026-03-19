"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, ImageIcon, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { StudyImageSet, Image } from "@/lib/types";

type PickerMode = "upload" | "set" | "individual";

interface ImagePickerProps {
  onFileSelected: (file: File) => void;
  onExistingImageSelected: (imageId: string) => void;
  disabled?: boolean;
}

export function ImagePicker({
  onFileSelected,
  onExistingImageSelected,
  disabled,
}: ImagePickerProps) {
  const supabase = createClient();
  const [mode, setMode] = useState<PickerMode>("upload");
  const [imageSets, setImageSets] = useState<StudyImageSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [setImages, setSetImages] = useState<Image[]>([]);
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const [loadingSets, setLoadingSets] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchSets() {
      setLoadingSets(true);
      const { data } = await supabase
        .from("study_image_sets")
        .select("*")
        .order("slug");
      setImageSets(data ?? []);
      setLoadingSets(false);
    }
    fetchSets();
  }, [supabase]);

  const fetchSetImages = useCallback(
    async (setId: string) => {
      setLoadingImages(true);
      const { data } = await supabase
        .from("study_image_set_image_mappings")
        .select("image_id, images(*)")
        .eq("study_image_set_id", Number(setId));

      const imgs = (data ?? [])
        .map((m) => m.images as unknown as Image)
        .filter(Boolean);
      setSetImages(imgs);
      setLoadingImages(false);
    },
    [supabase]
  );

  const fetchAllImages = useCallback(async () => {
    setLoadingImages(true);
    const { data } = await supabase
      .from("images")
      .select("*")
      .order("created_datetime_utc", { ascending: false })
      .limit(50);
    setAllImages(data ?? []);
    setLoadingImages(false);
  }, [supabase]);

  useEffect(() => {
    if (mode === "set" && selectedSetId) {
      fetchSetImages(selectedSetId);
    } else if (mode === "individual") {
      fetchAllImages();
    }
  }, [mode, selectedSetId, fetchSetImages, fetchAllImages]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
    ];
    if (!allowed.includes(file.type)) {
      toast.error("Unsupported file type", {
        description: "Use JPEG, PNG, WebP, GIF, or HEIC.",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    onFileSelected(file);
  }

  function handleSelectImage(img: Image) {
    setSelectedImageId(img.id);
    setPreviewUrl(img.url);
    onExistingImageSelected(img.id);
  }

  const imagesToShow = mode === "set" ? setImages : allImages;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("upload")}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
        <Button
          variant={mode === "set" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("set")}
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Image Set
        </Button>
        <Button
          variant={mode === "individual" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("individual")}
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Browse
        </Button>
      </div>

      {mode === "upload" && (
        <div className="space-y-3">
          <label
            htmlFor="image-upload"
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary/50 hover:bg-muted/50 ${
              disabled ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {previewUrl && selectedFile ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 rounded object-contain"
              />
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to select an image
                </span>
                <span className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP, GIF, or HEIC
                </span>
              </>
            )}
            <input
              id="image-upload"
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
              onChange={handleFileChange}
              disabled={disabled}
            />
          </label>
        </div>
      )}

      {mode === "set" && (
        <div className="space-y-3">
          {loadingSets ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Select value={selectedSetId} onValueChange={(v) => setSelectedSetId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Pick an image set..." />
              </SelectTrigger>
              <SelectContent>
                {imageSets.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.slug} {s.description ? `— ${s.description}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {loadingImages ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImageGrid
              images={imagesToShow}
              selectedId={selectedImageId}
              onSelect={handleSelectImage}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {mode === "individual" && (
        <div className="space-y-3">
          {loadingImages ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImageGrid
              images={imagesToShow}
              selectedId={selectedImageId}
              onSelect={handleSelectImage}
              disabled={disabled}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ImageGrid({
  images,
  selectedId,
  onSelect,
  disabled,
}: {
  images: Image[];
  selectedId: string;
  onSelect: (img: Image) => void;
  disabled?: boolean;
}) {
  if (images.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No images available.</p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {images.map((img) => (
        <button
          key={img.id}
          onClick={() => onSelect(img)}
          disabled={disabled}
          className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
            selectedId === img.id
              ? "border-primary ring-2 ring-primary/30"
              : "border-transparent hover:border-muted-foreground/30"
          } ${disabled ? "pointer-events-none opacity-50" : ""}`}
        >
          {img.url ? (
            <img
              src={img.url}
              alt={img.image_description || "Image"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          {selectedId === img.id && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
              <Check className="h-6 w-6 text-primary" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
