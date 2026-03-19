const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.almostcrackd.ai";

interface PresignedUrlResponse {
  presignedUrl: string;
  cdnUrl: string;
}

interface RegisterImageResponse {
  imageId: string;
  now: number;
}

export async function generatePresignedUrl(
  token: string,
  contentType: string
): Promise<PresignedUrlResponse> {
  const res = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentType }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to generate presigned URL: ${res.status} ${text}`);
  }

  return res.json();
}

export async function uploadImageToPresigned(
  presignedUrl: string,
  file: File
): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload image: ${res.status}`);
  }
}

export async function registerImage(
  token: string,
  cdnUrl: string,
  isCommonUse = false
): Promise<RegisterImageResponse> {
  const res = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to register image: ${res.status} ${text}`);
  }

  return res.json();
}

export async function generateCaptions(
  token: string,
  imageId: string,
  humorFlavorId?: number
) {
  const body: Record<string, unknown> = { imageId };
  if (humorFlavorId !== undefined) {
    body.humorFlavorId = humorFlavorId;
  }

  const res = await fetch(`${API_BASE}/pipeline/generate-captions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to generate captions: ${res.status} ${text}`);
  }

  return res.json();
}

export async function uploadAndGenerateCaptions(
  token: string,
  file: File,
  humorFlavorId: number
) {
  const { presignedUrl, cdnUrl } = await generatePresignedUrl(token, file.type);
  await uploadImageToPresigned(presignedUrl, file);
  const { imageId } = await registerImage(token, cdnUrl);
  return generateCaptions(token, imageId, humorFlavorId);
}

export async function generateCaptionsForExistingImage(
  token: string,
  imageId: string,
  humorFlavorId: number
) {
  return generateCaptions(token, imageId, humorFlavorId);
}
