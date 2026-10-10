import { getSyncCached } from "./apiCache";
import { cleanEnglishTitle } from "./categories";

/**
 * Unwraps a proxied image URL back to the original raw URL.
 */
export function unwrapImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  let target = url.trim();
  while (target.includes("/api/proxy-image")) {
    const match = target.match(/[?&]url=([^&]+)/);
    if (match && match[1]) {
      try {
        target = decodeURIComponent(match[1]);
      } catch {
        break;
      }
    } else {
      break;
    }
  }
  if (target.startsWith("//")) {
    target = "https:" + target;
  }
  return target;
}

export function getImageFingerprint(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const raw = unwrapImageUrl(url);
  if (!raw) return "";
  const clean = raw.split("?")[0].split("#")[0].trim();
  // Alibaba/Taobao/1688 image asset IDs like O1CN01...
  const alibabaMatch = clean.match(/(O1CN01[A-Za-z0-9]+)/i);
  if (alibabaMatch) {
    return alibabaMatch[1].toLowerCase();
  }
  // Standard numerical Alibaba IDs like 2222229412444-0-cib or 23202549069_1412612519
  const numIdMatch = clean.match(/(\d{6,}_\d{6,}|\d{6,}-\d+-cib)/i);
  if (numIdMatch) {
    return numIdMatch[1].toLowerCase();
  }
  // Strip protocol, size suffix (e.g. _300x300.jpg, _50x50.jpg, _.webp)
  return clean
    .replace(/^https?:/i, "")
    .replace(/_\d+x\d+.*$/i, "")
    .replace(/_[a-z0-9]+\.(jpg|jpeg|png|webp)$/i, "")
    .toLowerCase();
}

/**
 * Compares two image URLs (whether raw or proxied with different filenames or size suffixes)
 * to check if they refer to the same underlying image.
 */
export function isSameImageUrl(urlA?: string | null, urlB?: string | null): boolean {
  if (!urlA || !urlB) return false;
  if (urlA === urlB) return true;
  const rawA = unwrapImageUrl(urlA);
  const rawB = unwrapImageUrl(urlB);
  if (!rawA || !rawB) return false;
  if (rawA === rawB) return true;

  const fpA = getImageFingerprint(rawA);
  const fpB = getImageFingerprint(rawB);
  if (fpA && fpB && fpA === fpB) return true;

  const normA = rawA.replace(/^https?:/i, "").split("?")[0].replace(/_\d+x\d+.*$/i, "");
  const normB = rawB.replace(/^https?:/i, "").split("?")[0].replace(/_\d+x\d+.*$/i, "");
  return normA === normB;
}

/**
 * Attempts to find a matching product (and variation) name for a raw image URL
 * from the client-side cached products list when customName is not explicitly passed.
 */
function lookupImageNameFromCache(rawUrl: string): string | null {
  try {
    const products = getSyncCached<any[]>("/api/products");
    if (!Array.isArray(products) || products.length === 0) return null;

    const normTarget = rawUrl.replace(/^https?:/i, "");

    for (const p of products) {
      if (!p) continue;
      const prodTitle = cleanEnglishTitle(p.name || "", p.category);
      if (!prodTitle) continue;

      // Check SKU / property values first so variant images get "Product Name - Color"
      const props = p.skuDetails?.properties;
      if (Array.isArray(props)) {
        for (const prop of props) {
          if (Array.isArray(prop?.values)) {
            for (const val of prop.values) {
              const vImg = val?.imageUrl || val?.image;
              if (vImg && unwrapImageUrl(vImg).replace(/^https?:/i, "") === normTarget) {
                const vName = val.cleanName || val.name || "";
                return vName ? `${prodTitle} - ${vName}` : prodTitle;
              }
            }
          }
        }
      }

      // Check variants array
      if (Array.isArray(p.variants)) {
        for (const v of p.variants) {
          const vImg = v?.imageUrl || v?.image;
          if (vImg && unwrapImageUrl(vImg).replace(/^https?:/i, "") === normTarget) {
            const vName = v.name || v.color || "";
            return vName ? `${prodTitle} - ${vName}` : prodTitle;
          }
        }
      }

      // Check main product image
      if (p.image && unwrapImageUrl(p.image).replace(/^https?:/i, "") === normTarget) {
        return prodTitle;
      }

      // Check gallery images
      if (Array.isArray(p.images)) {
        const gIdx = p.images.findIndex(
          (img: string) => img && unwrapImageUrl(img).replace(/^https?:/i, "") === normTarget
        );
        if (gIdx !== -1) {
          return gIdx === 0 ? prodTitle : `${prodTitle} - ${gIdx + 1}`;
        }
      }
    }
  } catch {
    // Ignore cache lookup errors
  }
  return null;
}

/**
 * Formats a human-readable image filename (with extension) from a title/label or URL.
 */
export function sanitizeImageFilename(customName?: string | null, rawUrl?: string | null): string {
  let ext = ".jpg";
  if (rawUrl) {
    const cleanPath = rawUrl.split("?")[0].split("#")[0].toLowerCase();
    if (cleanPath.endsWith(".png")) ext = ".png";
    else if (cleanPath.endsWith(".webp")) ext = ".webp";
    else if (cleanPath.endsWith(".gif")) ext = ".gif";
    else if (cleanPath.endsWith(".jpeg")) ext = ".jpeg";
  }

  let baseName = (customName || "").trim();

  if (!baseName && rawUrl) {
    baseName = lookupImageNameFromCache(rawUrl) || "";
  }

  if (!baseName && rawUrl) {
    try {
      const parsed = new URL(rawUrl.startsWith("//") ? "https:" + rawUrl : rawUrl);
      const lastSeg = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || "");
      const withoutExt = lastSeg.replace(/\.(jpg|jpeg|png|webp|gif|avif|svg)$/i, "");
      if (
        withoutExt &&
        withoutExt.toLowerCase() !== "proxy-image" &&
        !withoutExt.startsWith("O1CN01") &&
        !withoutExt.startsWith("photo-")
      ) {
        baseName = withoutExt;
      }
    } catch {
      // Ignore URL parse error
    }
  }

  if (!baseName) {
    baseName = "World-Buy-BD-Product";
  }

  // Strip any existing image extension from baseName before sanitizing
  baseName = baseName.replace(/\.(jpg|jpeg|png|webp|gif|avif)$/i, "").trim();

  // Remove characters that are invalid in filenames or URL path segments
  let safe = baseName
    .replace(/[<>:"/\\|?*\x00-\x1F%~#&+{}`^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (safe.length > 90) {
    safe = safe.slice(0, 90).trim();
  }

  // Replace spaces with hyphens for clean URL path and cross-browser Save-As support
  safe = safe
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!safe || safe.toLowerCase() === "proxy-image") {
    safe = "World-Buy-BD-Product";
  }

  return `${safe}${ext}`;
}

export function getSafeImageUrl(
  url?: string | null,
  fallbackUrl?: string,
  customName?: string | null
): string {
  const source =
    url && typeof url === "string" && url.trim() !== ""
      ? url.trim()
      : fallbackUrl && typeof fallbackUrl === "string" && fallbackUrl.trim() !== ""
      ? fallbackUrl.trim()
      : "";

  if (!source) {
    return "";
  }

  // Data URLs or blob URLs or local static assets don't need proxying
  if (source.startsWith("data:") || source.startsWith("blob:")) {
    return source;
  }

  // Unwrap if already proxied so we can attach the proper filename segment
  const rawUrl = unwrapImageUrl(source);
  if (!rawUrl) {
    return source;
  }

  // If it's a relative local path (not starting with http/https), return as-is
  if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  const filename = sanitizeImageFilename(customName, rawUrl);
  return `/api/proxy-image/${encodeURIComponent(filename)}?url=${encodeURIComponent(rawUrl)}`;
}

/**
 * Triggers a direct browser download of any image with its exact product/variation filename.
 */
export async function downloadImageWithName(
  url?: string | null,
  customName?: string | null
): Promise<void> {
  if (!url) return;
  const rawUrl = unwrapImageUrl(url);
  const filename = sanitizeImageFilename(customName, rawUrl);
  const downloadProxyUrl = rawUrl.startsWith("http")
    ? `/api/proxy-image/${encodeURIComponent(filename)}?url=${encodeURIComponent(rawUrl)}&download=1`
    : url;

  try {
    const response = await fetch(downloadProxyUrl);
    if (!response.ok) throw new Error("Download fetch failed");
    const blob = await response.blob();
    let finalFilename = filename;
    if (blob.type === "image/png" && !finalFilename.endsWith(".png")) {
      finalFilename = finalFilename.replace(/\.[a-z0-9]+$/i, ".png");
    } else if (blob.type === "image/webp" && !finalFilename.endsWith(".webp")) {
      finalFilename = finalFilename.replace(/\.[a-z0-9]+$/i, ".webp");
    } else if (blob.type === "image/jpeg" && !finalFilename.match(/\.(jpg|jpeg)$/i)) {
      finalFilename = finalFilename.replace(/\.[a-z0-9]+$/i, ".jpg");
    }
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    const link = document.createElement("a");
    link.href = downloadProxyUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Transparent 1x1 pixel or default product image placeholder when needed
export const DEFAULT_PRODUCT_FALLBACK =
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=80";

export const FALLBACK_BAG_IMAGES = [
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500&auto=format&fit=crop&q=80",
];
