export const OFFICIAL_SITE_DOMAIN = "worldbuybd.web.app";
export const OFFICIAL_SITE_ORIGIN = `https://${OFFICIAL_SITE_DOMAIN}`;

/**
 * Extracts a clean product code (offerId or clean ID) without duplicate prefixes like
 * `abb-`, `abb`, or `wb-1688-`.
 */
export function getCleanProductCode(productOrId?: any): string {
  if (productOrId === undefined || productOrId === null) return "";

  let raw = "";
  if (typeof productOrId === "object") {
    // If explicit offerId or productId is present
    const directCode = productOrId.offerId || productOrId.productId || productOrId.productCode;
    if (directCode) {
      raw = String(directCode).trim();
    } else if (productOrId.productLink && typeof productOrId.productLink === "string") {
      raw = productOrId.productLink;
    } else if (productOrId.url && typeof productOrId.url === "string") {
      raw = productOrId.url;
    } else if (productOrId.importedUrl && typeof productOrId.importedUrl === "string") {
      raw = productOrId.importedUrl;
    } else if (productOrId.sourceUrl && typeof productOrId.sourceUrl === "string") {
      raw = productOrId.sourceUrl;
    } else {
      raw = String(productOrId.id || "").trim();
    }
  } else {
    raw = String(productOrId).trim();
  }

  if (!raw) return "";

  // If 1688 URL, extract offer ID (e.g. detail.1688.com/offer/1024794580729.html)
  const offerMatch = raw.match(/offer\/(\d+)/i) || raw.match(/product\/[a-z]*-?(\d+)/i);
  if (offerMatch && offerMatch[1]) {
    return offerMatch[1];
  }

  // Strip any leading url / path if passed accidentally
  if (raw.includes("/product/")) {
    raw = raw.split("/product/").pop() || raw;
  }
  raw = raw.replace(/\.html.*$/i, "").replace(/^\/+/, "").trim();

  // Strip leading `abb/`, `abb-`, `abb_` or `abb` (when followed by digits/letters)
  raw = raw.replace(/^(?:abb[-_/]?)+/i, "").trim();

  // Strip `wb-1688-`, `wb-taobao-`, `wb-alibaba-`, `wb-tmall-`, `wholesale-` if followed by an offerId
  const strippedMarketplace = raw.replace(/^(?:wb-(?:1688|taobao|alibaba|tmall)-|wholesale-)/i, "").trim();
  if (strippedMarketplace) {
    raw = strippedMarketplace;
  }

  return raw;
}

/**
 * Returns the relative React Router path for a product page:
 * `/product/abb-<productCode>`
 */
export function getProductPath(productOrId?: any): string {
  const code = getCleanProductCode(productOrId);
  if (!code) return "/shop";
  return `/product/abb-${code}`;
}

/**
 * Returns the external supplier / 1688 source URL if available
 */
export function getProductExternalUrl(productOrId?: any): string | undefined {
  if (!productOrId) return undefined;
  if (typeof productOrId === "object") {
    const directUrl =
      productOrId.sourceUrl ||
      productOrId.importedUrl ||
      productOrId.detailUrl ||
      productOrId.originalUrl;
    if (directUrl && typeof directUrl === "string" && directUrl.startsWith("http")) {
      return directUrl;
    }
    if (productOrId.productLink && typeof productOrId.productLink === "string" && productOrId.productLink.startsWith("http")) {
      return productOrId.productLink;
    }
    const code = getCleanProductCode(productOrId);
    if (code && /^\d{9,}$/.test(code)) {
      return `https://detail.1688.com/offer/${code}.html`;
    }
  }
  return undefined;
}

/**
 * Opens the product link in a new browser tab.
 * Safely works from any dashboard (Customer, Admin, Employee).
 */
export function openProductInNewTab(productOrId?: any, e?: React.MouseEvent) {
  if (e) {
    e.stopPropagation();
  }
  const path = getProductPath(productOrId);
  if (typeof window !== "undefined") {
    window.open(path, "_blank", "noopener,noreferrer");
  }
}

/**
 * Returns the full official product URL:
 * `https://worldbuybd.web.app/product/abb-<productCode>`
 */
export function getFullProductUrl(productOrId?: any): string {
  const code = getCleanProductCode(productOrId);
  if (!code) return `${OFFICIAL_SITE_ORIGIN}/shop`;
  return `${OFFICIAL_SITE_ORIGIN}/product/abb-${code}`;
}
