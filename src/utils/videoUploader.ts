import { ShowcaseVideoItem } from "../pages/admin/AdminVideos";
import { invalidateApiCache } from "./apiCache";

export interface UploadVideoOptions {
  file: File;
  autoPublish?: boolean;
  title?: string;
  subtitle?: string;
  category?: string;
  productLink?: string;
  priceText?: string;
  thumbnailUrl?: string;
  onProgress?: (percent: number) => void;
}

export interface UploadVideoResult {
  url: string;
  filename?: string;
  autoPublished?: boolean;
  video?: ShowcaseVideoItem | null;
  videos?: ShowcaseVideoItem[];
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const step = 0x8000;
  for (let i = 0; i < len; i += step) {
    const sub = bytes.subarray(i, Math.min(i + step, len));
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

/**
 * Uploads any video file using 1MB base64 chunks to `/api/admin/videos/upload-chunk`
 * so large videos never fail due to reverse-proxy / Cloud Run body size limits.
 */
export async function uploadVideoFileChunked(
  options: UploadVideoOptions
): Promise<UploadVideoResult> {
  const {
    file,
    autoPublish = false,
    title = "",
    subtitle = "",
    category = "Bag",
    productLink = "",
    priceText = "",
    thumbnailUrl = "",
    onProgress,
  } = options;

  const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  if (onProgress) onProgress(2);

  let lastResponseData: any = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const blobSlice = file.slice(start, end);
    const arrayBuffer = await blobSlice.arrayBuffer();
    const chunkBase64 = arrayBufferToBase64(arrayBuffer);

    const isLast = chunkIndex + 1 === totalChunks;

    const res = await fetch("/api/admin/videos/upload-chunk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadId,
        chunkIndex,
        totalChunks,
        fileName: file.name,
        chunkBase64,
        autoPublish: isLast ? autoPublish : false,
        title: isLast ? title : undefined,
        subtitle: isLast ? subtitle : undefined,
        category: isLast ? category : undefined,
        productLink: isLast ? productLink : undefined,
        priceText: isLast ? priceText : undefined,
        thumbnailUrl: isLast ? thumbnailUrl : undefined,
      }),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Invalid response received from server (HTTP ${res.status})`
      );
    }

    if (!res.ok || !data?.success) {
      throw new Error(data?.error || `Video upload failed (HTTP ${res.status})`);
    }

    lastResponseData = data;
    const percent = Math.min(100, Math.round(((chunkIndex + 1) / totalChunks) * 100));
    if (onProgress) onProgress(percent);
  }

  invalidateApiCache("/api/videos");

  return {
    url: lastResponseData?.url || "",
    filename: lastResponseData?.filename,
    autoPublished: Boolean(lastResponseData?.autoPublished),
    video: lastResponseData?.video || null,
    videos: Array.isArray(lastResponseData?.videos) ? lastResponseData.videos : undefined,
  };
}
