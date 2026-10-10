import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { GoogleGenAI } from "@google/genai";
import { CATEGORIES_LIST, BAG_SUBCATEGORIES, SHOES_SUBCATEGORIES, JEWELRY_SUBCATEGORIES, BEAUTY_SUBCATEGORIES, MENS_CLOTHING_SUBCATEGORIES, WOMENS_CLOTHING_SUBCATEGORIES, isBagMainOrSubCategory, isShoesMainOrSubCategory, isJewelryMainOrSubCategory, isBeautyMainOrSubCategory, isMensClothingMainOrSubCategory, isWomensClothingMainOrSubCategory, cleanEnglishTitle, matchesCategory, getMappedSlug, getCanonicalCategoryName, syncSkuDetailsWithVariants } from "../utils/categories";
import { cleanProductDescription, cleanProductDescriptionHtml } from "../utils/sanitizeDescription";


export interface ScrapedVariant {
  variantId: string;
  skuId: string;
  name: string;
  color?: string | null;
  size?: string | null;
  style?: string | null;
  attributes: Record<string, string>;
  priceRmb: number;
  priceBdt: number;
  price?: number;
  stock: number;
  imageUrl?: string | null;
  specsToken: string;
}

export interface QuantityPriceTier {
  minQty: number;
  maxQty: number | null;
  rmbPrice: number;
  price: number; // in BDT
}

export interface ProductSpecification {
  name: string;
  value: string;
}

export interface SellerInfo {
  name?: string | null;
  companyName?: string | null;
  location?: string | null;
  province?: string | null;
  city?: string | null;
  rating?: number | null;
  responseRate?: string | null;
  tpYear?: number | null;
  factoryInspected?: boolean | null;
  shopUrl?: string | null;
}

export interface SkuPropertyOption {
  name: string;
  originalName?: string;
  imageUrl?: string | null;
}

export interface SkuProperty {
  name: string;
  values: SkuPropertyOption[];
}

export interface SkuDetails {
  properties: SkuProperty[];
  variants: Array<{
    skuId: string;
    specs: string;
    price: number;
    priceRmb?: number;
    priceBdt?: number;
    stock: number;
    imageUrl?: string | null;
  }>;
}

export interface ProductMasterRecord {
  id: string;
  offerId: string | null;
  importedUrl: string | null;
  platform: "wholesale" | "taobao" | "alibaba" | "aliexpress" | "generic";
  name: string;
  originalTitle: string | null;
  category: string;
  brand: string | null;
  unit: string;
  minOrderQuantity: number;
  rmbPrice: number;
  price: number; // BDT
  originalPrice: number; // BDT
  discount: number;
  stock: number;
  soldDisplay: string | null;
  image: string;
  images: string[];
  description: string | null;
  descriptionHtml?: string | null;
  descriptionImages: string[];
  videoUrl?: string | null;
  specifications: ProductSpecification[];
  quantityPrices: QuantityPriceTier[];
  sellerInfo: SellerInfo;
  skuDetails: SkuDetails | null;
  variants: ScrapedVariant[];
  status: "published" | "draft";
  isNew: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  extractedMeta: {
    scrapedAt: string;
    variantCount: number;
    hasTiers: boolean;
    imageCount: number;
    sourceDomain: string;
  };
}

/**
 * Extracts platform and offer ID / item ID from URL
 */
export function extractUrlMetadata(url: string): {
  platform: "wholesale" | "taobao" | "alibaba" | "aliexpress" | "generic";
  offerId: string | null;
  cleanUrl: string;
  domain: string;
} {
  if (!url || typeof url !== "string") {
    return { platform: "generic", offerId: null, cleanUrl: "", domain: "" };
  }

  const trimmed = url.trim();
  let domain = "";
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    domain = parsed.hostname;
  } catch {
    domain = "";
  }

  let platform: "wholesale" | "taobao" | "alibaba" | "aliexpress" | "generic" = "generic";
  let offerId: string | null = null;

  if (domain.includes("supplier.factory")) {
    platform = "wholesale";
    const offerMatch = trimmed.match(/\/offer\/(\d+)\.html/) || trimmed.match(/[?&]id=(\d+)/) || trimmed.match(/(\d{9,15})/);
    if (offerMatch) offerId = offerMatch[1];
  } else if (domain.includes("taobao.com") || domain.includes("tmall.com")) {
    platform = "taobao";
    const idMatch = trimmed.match(/[?&]id=(\d+)/) || trimmed.match(/item\/(\d+)/);
    if (idMatch) offerId = idMatch[1];
  } else if (domain.includes("alibaba.com")) {
    platform = "alibaba";
    const aliMatch = trimmed.match(/(\d{9,16})/);
    if (aliMatch) offerId = aliMatch[1];
  } else if (domain.includes("aliexpress.com")) {
    platform = "aliexpress";
    const axMatch = trimmed.match(/item\/(\d+)\.html/) || trimmed.match(/(\d{10,16})/);
    if (axMatch) offerId = axMatch[1];
  }

  return {
    platform,
    offerId,
    cleanUrl: trimmed,
    domain: domain || "unknown",
  };
}

/**
 * Clean image URL (strips unwanted size reducers or adds https)
 */
export function cleanImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  let clean = url.trim();
  if (clean.startsWith("//")) clean = "https:" + clean;
  if (!clean.startsWith("http")) return "";
  // Strip thumbnail suffixes like .60x60.jpg or _300x300.jpg if present
  clean = clean.replace(/(\.jpg|\.png|\.jpeg)_\d+x\d+.*$/i, "$1");
  return clean;
}

/**
 * Deduplicate image list while filtering out icons/tiny badges
 */
export function sanitizeImageList(images: string[]): string[] {
  if (!Array.isArray(images)) return [];
  const set = new Set<string>();
  const result: string[] = [];
  for (const img of images) {
    const clean = cleanImageUrl(img);
    if (!clean) continue;
    // skip tiny icons or 1x1 tracking pixels
    if (clean.includes("space.gif") || clean.includes("avatar") || clean.includes("icon") || clean.includes("blank.gif")) {
      continue;
    }
    if (!set.has(clean)) {
      set.add(clean);
      result.push(clean);
    }
  }
  return result;
}

/**
 * Detect product category from title or text keywords (supports main categories & all 13 Bag sub-categories)
 */
export function autoClassifyCategory(title: string, customCategory?: string): string {
  const cleanCustom = (customCategory || "").trim();
  const lowerCustom = cleanCustom.toLowerCase();
  if (lowerCustom === "bag") {
    const detected = getCanonicalCategoryName("Bag", title);
    return detected === "Bag" ? "Bags" : detected;
  }
  return getCanonicalCategoryName(cleanCustom, title);
}


/**
 * Extract offerId and basic metadata from window.FE_GLOBALS or HTML scripts
 */
export function parseFeGlobals(html: string): { offerId?: string; company?: string } {
  const result: { offerId?: string; company?: string } = {};
  const feMatch = html.match(/window\.FE_GLOBALS\s*=\s*(\{[\s\S]*?\});/);
  if (feMatch) {
    const idMatch = feMatch[1].match(/offerId\s*:\s*(\d+)/);
    if (idMatch) result.offerId = idMatch[1];
    const loginMatch = feMatch[1].match(/offerLoginId\s*:\s*["']([^"']+)["']/);
    if (loginMatch) result.company = loginMatch[1];
  }
  if (!result.offerId) {
    const auctionMatch = html.match(/b2c_auction=(\d+)/);
    if (auctionMatch) result.offerId = auctionMatch[1];
  }
  return result;
}

/**
 * Deep parser for Wholesale window.context or embedded JSON structures
 */
function parseSupplierJson(html: string): any | null {
  // Method 1: Balanced bracket parser for window.contextPath, {...}
  try {
    const marker = "(window.contextPath,";
    const idx = html.indexOf(marker);
    if (idx !== -1) {
      const start = idx + marker.length;
      let depth = 0;
      let inString = false;
      let stringChar = "";
      let escape = false;
      let endIdx = -1;
      for (let i = start; i < html.length; i++) {
        const char = html[i];
        if (escape) { escape = false; continue; }
        if (char === "\\" && inString) { escape = true; continue; }
        if (inString) {
          if (char === stringChar) inString = false;
          continue;
        }
        if (char === "\"" || char === "'") {
          inString = true;
          stringChar = char;
          continue;
        }
        if (char === "{" || char === "[") depth++;
        else if (char === "}" || char === "]") {
          depth--;
          if (depth === 0) { endIdx = i + 1; break; }
        }
      }
      if (endIdx !== -1) {
        const jsonStr = html.substring(start, endIdx).trim();
        return JSON.parse(jsonStr);
      }
    }
  } catch (e) {
    // continue
  }

  try {
    // Method 2: Check window.context = (...);
    const contextMatch = html.match(/window\.context\s*=\s*(.*?)\)\);/s) || html.match(/window\.context\s*=\s*(\{.*?\});/s);
    if (contextMatch && contextMatch[1]) {
      let jsonStr = contextMatch[1].replace(/.*window\.contextPath,\s*/, "").trim();
      if (jsonStr.startsWith("(") && jsonStr.endsWith(")")) jsonStr = jsonStr.slice(1, -1);
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    // continue
  }

  try {
    // Method 3: Check window.__INIT_DATA or window.__INITIAL_DATA__
    const initMatch = html.match(/window\.__INIT_DATA\s*=\s*(\{.*?\});/s) || html.match(/window\.__INITIAL_DATA__\s*=\s*(\{.*?\});/s);
    if (initMatch && initMatch[1]) {
      return JSON.parse(initMatch[1]);
    }
  } catch (e) {
    // continue
  }

  try {
    // Method 4: Check iDetailData
    const detailMatch = html.match(/var\s+iDetailData\s*=\s*(\{.*?\});/s);
    if (detailMatch && detailMatch[1]) {
      return JSON.parse(detailMatch[1]);
    }
  } catch (e) {
    // continue
  }

  return null;
}


/**
 * AI-assisted extraction using Gemini for complex, unstructured or truncated pages
 */
async function extractWithGeminiFallback(
  html: string,
  url: string,
  rmbRate: number
): Promise<any | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Provide a condensed slice of HTML or text to fit within context limits
    const textSnippet = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/\s+/g, " ")
      .slice(0, 30000);

    const prompt = `You are a professional B2B e-commerce product data extraction system for WORLD BUY BD.
Extract all structured product data from this e-commerce page into a single strict JSON object.

CRITICAL RULES:
1. Extract ALL variants (Color, Size, Style, SKU) independently. Do not merge variants.
2. Extract wholesale tiered pricing (quantity prices: e.g. 2-9 pcs, 10-49 pcs, 50+ pcs).
3. Do NOT invent or estimate data. If missing, use null or [].
4. Clean all image URLs to be full HTTP/HTTPS links.

Expected JSON output format:
{
  "title": "English product name",
  "originalTitle": "Chinese/Original product title",
  "brand": "Brand name or null",
  "category": "Suggested category",
  "unit": "piece",
  "minOrderQuantity": 2,
  "priceRmb": 25.5,
  "stock": 5000,
  "soldDisplay": "1000+ sold",
  "mainImage": "https://...",
  "galleryImages": ["https://..."],
  "descriptionImages": ["https://..."],
  "specifications": [
    { "name": "Material", "value": "100% Cotton" },
    { "name": "Origin", "value": "Guangdong" }
  ],
  "priceTiers": [
    { "minQty": 2, "maxQty": 49, "priceRmb": 28.0 },
    { "minQty": 50, "maxQty": null, "priceRmb": 25.0 }
  ],
  "skuProperties": [
    {
      "name": "Color",
      "values": [
        { "name": "Black", "originalName": "黑色", "imageUrl": "https://..." },
        { "name": "White", "originalName": "白色", "imageUrl": "https://..." }
      ]
    },
    {
      "name": "Size",
      "values": [
        { "name": "M", "originalName": "M" },
        { "name": "L", "originalName": "L" }
      ]
    }
  ],
  "variants": [
    {
      "skuId": "sku-1",
      "name": "Black - M",
      "color": "Black",
      "size": "M",
      "priceRmb": 25.0,
      "stock": 500,
      "imageUrl": "https://..."
    }
  ],
  "seller": {
    "companyName": "Manufacturer name",
    "location": "City, Province",
    "rating": 4.8,
    "tpYear": 5,
    "factoryInspected": true
  }
}

Source URL: ${url}
Page HTML snippet:
${textSnippet}`;

    // Standard Gemini models with automated fallback if primary model experiences 503 high demand spike
    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let response: any = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        const isUnavailable =
          err?.status === 503 ||
          err?.message?.includes("503") ||
          err?.message?.includes("high demand") ||
          err?.message?.includes("UNAVAILABLE");

        if (isUnavailable) {
          console.info(`[ScraperAI] Model ${model} currently experiencing high demand (503). Cascading to fallback model...`);
          // Brief pause before trying next candidate model
          if (i < candidateModels.length - 1) {
            await new Promise((r) => setTimeout(r, 600));
          }
        } else {
          console.warn(`[ScraperAI] Model ${model} call error:`, err?.message || err);
        }
      }
    }

    const outputText = response?.text?.trim() || "";
    if (!outputText) return null;

    const parsed = JSON.parse(outputText);

    // Normalize output so it seamlessly populates both scraper fields
    const rmb = parseFloat(parsed.priceRmb || parsed.rmbPrice || 0);
    const moq = parseInt(parsed.minOrderQuantity || 1, 10);
    const profitMargin = 30;

    const formattedTiers: QuantityPriceTier[] = Array.isArray(parsed.priceTiers)
      ? parsed.priceTiers.map((t: any) => ({
          minQty: parseInt(t.minQty || 1, 10),
          maxQty: t.maxQty ? parseInt(t.maxQty, 10) : null,
          rmbPrice: parseFloat(t.priceRmb || t.rmbPrice || rmb),
          price: Math.round(parseFloat(t.priceRmb || t.rmbPrice || rmb) * rmbRate) + profitMargin,
        }))
      : [];

    const formattedVariants: ScrapedVariant[] = Array.isArray(parsed.variants)
      ? parsed.variants.map((v: any, idx: number) => {
          const varRmb = parseFloat(v.priceRmb || v.rmbPrice || rmb || 0);
          const colorName = v.color || null;
          const sizeName = v.size || null;
          const attributes: Record<string, string> = {};
          if (colorName) attributes["Color"] = colorName;
          if (sizeName) attributes["Size"] = sizeName;

          return {
            variantId: `var-${v.skuId || idx}`,
            skuId: String(v.skuId || `sku-${idx}`),
            name: v.name || [colorName, sizeName].filter(Boolean).join(" - ") || `Variant ${idx + 1}`,
            color: colorName,
            size: sizeName,
            attributes,
            priceRmb: varRmb,
            priceBdt: Math.round(varRmb * rmbRate) + profitMargin,
            stock: parseInt(v.stock || 100, 10),
            imageUrl: cleanImageUrl(v.imageUrl) || null,
            specsToken: v.name || "",
          };
        })
      : [];

    return {
      ...parsed,
      name: parsed.title || parsed.name,
      title: parsed.title || parsed.name,
      originalTitle: parsed.originalTitle,
      rmbPrice: rmb,
      priceRmb: rmb,
      stock: parseInt(parsed.stock || 0, 10),
      minOrderQuantity: moq,
      images: sanitizeImageList([...(parsed.galleryImages || []), ...(parsed.images || [])]),
      galleryImages: sanitizeImageList([...(parsed.galleryImages || []), ...(parsed.images || [])]),
      specifications: Array.isArray(parsed.specifications) ? parsed.specifications : [],
      quantityPrices: formattedTiers,
      priceTiers: formattedTiers,
      variants: formattedVariants,
      rawVariants: formattedVariants,
      sellerInfo: parsed.seller || parsed.sellerInfo || {},
      skuProperties: Array.isArray(parsed.skuProperties) ? parsed.skuProperties : [],
    };
  } catch (err) {
    console.warn("Gemini extraction fallback error:", err);
    return null;
  }
}

/**
 * Detects if the given string is a formatted E-Commerce Product Report (Wholesale / Alibaba / Taobao / Bengali Scraper Format)
 */
export function isProductReportText(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  const s = input.trim();
  return (
    s.includes("E-Commerce Product Report") ||
    s.includes("Product Title") ||
    s.includes("প্রোডাক্ট নাম") ||
    s.includes("কালার ও ভ্যারিয়েশন") ||
    s.includes("SKU List") ||
    s.includes("মূল্য ও অর্ডার পলিসি") ||
    s.includes("পাইকারি কোয়ান্টিটি টায়ার") ||
    s.includes("Tier Pricing") ||
    s.includes("--- SKU Variants & Pricing Breakdown ---") ||
    s.includes("--- SKU Variants") ||
    s.includes("--- Product Specifications & Attributes ---") ||
    (s.includes("উৎস লিঙ্ক") && (s.includes("1688.com") || s.includes("offer/"))) ||
    (s.includes("Price & MOQ") && (s.includes("1688.com") || s.includes("offer") || s.includes("BDT")))
  );
}

/**
 * Checks if a line in a Product Report text box is a Category / Sub-Category section header
 * (e.g., "Purse", "Wallet", "Men Shoes", "Ladies Bag", "Category: Eyeshadow", etc.)
 */
export function extractReportSectionCategoryHeader(rawLine: string): string | null {
  if (!rawLine || typeof rawLine !== "string") return null;
  const trimmed = rawLine.trim();
  if (!trimmed || trimmed.length > 45) return null;

  // Explicit "Category: ..." or "Target Category: ..." line
  const explicitCatMatch = trimmed.match(/^(?:Target\s+)?Category\s*:\s*(.+)$/i);
  if (explicitCatMatch && explicitCatMatch[1]) {
    const val = explicitCatMatch[1].trim().replace(/[:#-]+$/, "").trim();
    if (val && val.toUpperCase() !== "AUTO") return val;
  }

  // Must not be a standard report field or URL or list item
  if (
    trimmed.startsWith("===") ||
    trimmed.startsWith("---") ||
    trimmed.startsWith("- ") ||
    trimmed.startsWith("* ") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    /^\d+[\.\)]/.test(trimmed) ||
    trimmed.includes("|") ||
    trimmed.includes("{") ||
    trimmed.includes("[") ||
    trimmed.includes("]") ||
    trimmed.includes("•") ||
    /^(?:Product Title|Offer ID|Supplier|Company|Exchange Rate|Price Range|Minimum Order|MOQ|Total Available|Total Sales|Ship From|Guarantees|Report Generated|SKU ID|Weight|Stock|প্রোডাক্ট নাম|মূল্য|মুদ্রা বিনিময়|স্টক|ছবি|প্যাকেজিং|স্পেসিফিকেশন|কাস্টমার)/i.test(
      trimmed
    )
  ) {
    return null;
  }

  // If the line contains Chinese product title words or is longer than 20 chars with Chinese, it is NOT a category header
  const chineseCount = (trimmed.match(/[\u4e00-\u9fa5]/g) || []).length;
  if (chineseCount > 4) return null;

  const cleanCandidate = trimmed.replace(/^[\+\u21b3\s]+/, "").replace(/[:#-]+$/, "").trim();
  if (!cleanCandidate || cleanCandidate.length > 30) return null;

  // Check if it strictly matches any known Main Category or Sub-Category in CATEGORIES_LIST
  const lowerCand = cleanCandidate.toLowerCase().replace(/['’]/g, "'");
  const matchedCat = CATEGORIES_LIST.find(
    (c) =>
      c.name.toLowerCase().replace(/['’]/g, "'") === lowerCand ||
      c.slug.toLowerCase() === lowerCand
  );
  if (matchedCat) {
    return matchedCat.name;
  }

  // Only allow purely alphanumeric short English category names (no Chinese descriptions)
  if (!cleanCandidate.includes(":") && /^[a-zA-Z0-9\s&'’\-\/]+$/.test(cleanCandidate)) {
    const mapped = getMappedSlug(cleanCandidate);
    if (mapped && mapped !== "imported") {
      const bySlug = CATEGORIES_LIST.find((c) => c.slug === mapped);
      if (bySlug && cleanCandidate.length <= 25) return bySlug.name;
    }
  }

  return null;
}

/**
 * Parses one or multiple E-Commerce Product Reports from a single text payload,
 * automatically respecting per-section Category / Sub-Category headers (e.g., "Purse\n=== E-Commerce Product Report...").
 */
export function parseMultiProductReports(
  text: string,
  options: { rmbRate?: number; customCategory?: string; profitMargin?: number } = {}
): ProductMasterRecord[] {
  if (!text || typeof text !== "string") return [];

  const lines = text.split(/\r?\n/);
  const blocks: Array<{ reportText: string; category: string }> = [];

  let activeSectionCategory = "";
  let currentLines: string[] = [];
  let currentBlockCategory = "";
  let hasTitleInCurrent = false;

  const flushCurrent = () => {
    if (currentLines.length === 0) return;
    const joined = currentLines.join("\n").trim();
    if (isProductReportText(joined)) {
      blocks.push({
        reportText: joined,
        category: currentBlockCategory || activeSectionCategory || options.customCategory || "",
      });
    }
    currentLines = [];
    hasTitleInCurrent = false;
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (currentLines.length > 0) currentLines.push(rawLine);
      continue;
    }

    const headerCat = extractReportSectionCategoryHeader(trimmed);
    if (headerCat) {
      if (hasTitleInCurrent) {
        flushCurrent();
      }
      activeSectionCategory = headerCat;
      currentBlockCategory = headerCat;
      continue;
    }

    if (/^===\s*E-Commerce Product Report/i.test(trimmed)) {
      if (hasTitleInCurrent) {
        flushCurrent();
      }
      if (!currentBlockCategory) {
        currentBlockCategory = activeSectionCategory;
      }
      currentLines.push(rawLine);
      continue;
    }

    // Detect Title start (English or Bengali formatted)
    if (
      /^(?:📦\s*)?\[[^\]]*(?:Product Title|প্রোডাক্ট নাম)[^\]]*\]/i.test(trimmed) ||
      /^Product Title\s*[:：]/i.test(trimmed) ||
      /^প্রোডাক্ট নাম\s*[:：]/i.test(trimmed)
    ) {
      if (hasTitleInCurrent) {
        flushCurrent();
      }
      hasTitleInCurrent = true;
      if (!currentBlockCategory) {
        currentBlockCategory = activeSectionCategory;
      }
      currentLines.push(rawLine);
      continue;
    }

    // Border divider between multi reports
    if (/^[=]{15,}$/.test(trimmed) || /^[-]{15,}$/.test(trimmed)) {
      if (hasTitleInCurrent && currentLines.length > 10) {
        currentLines.push(rawLine);
        flushCurrent();
        continue;
      }
    }

    currentLines.push(rawLine);
  }

  flushCurrent();

  // If there was only 1 report block and a category header was placed above or below it, apply the latest activeSectionCategory
  if (blocks.length === 1 && activeSectionCategory) {
    blocks[0].category = activeSectionCategory;
  }

  if (blocks.length === 0 && isProductReportText(text)) {
    blocks.push({
      reportText: text,
      category: activeSectionCategory || options.customCategory || "",
    });
  }

  const results: ProductMasterRecord[] = [];
  const seenKeys = new Set<string>();

  for (const b of blocks) {
    const effectiveCat =
      b.category && b.category.toUpperCase() !== "AUTO"
        ? b.category
        : options.customCategory && options.customCategory.toUpperCase() !== "AUTO"
        ? options.customCategory
        : "";
    const parsed = parseProductReport(b.reportText, {
      ...options,
      customCategory: effectiveCat,
    });
    const key = String(parsed.offerId || parsed.id);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      results.push(parsed);
    } else {
      // Even if same offerId is pasted under a different variant/report, give unique id if needed or update
      results.push({ ...parsed, id: `${parsed.id}-${results.length + 1}` });
    }
  }

  return results;
}

/**
 * Parses structured E-Commerce Product Report text into a complete ProductMasterRecord
 */
export function parseProductReport(
  text: string,
  options: { rmbRate?: number; customCategory?: string; profitMargin?: number } = {}
): ProductMasterRecord {
  const { customCategory = "", profitMargin = 0 } = options;
  let rmbRate = Number(options.rmbRate) || 0;

  // 1. Check if report specifies Exchange Rate Applied (only if user did not specify rate)
  let repRate = 0;
  const exchangeMatch = text.match(/Exchange Rate Applied:\s*1\s*RMB[^(]*\([¥￥]\)\s*=\s*([\d.]+)\s*BDT/i);
  if (exchangeMatch && exchangeMatch[1]) {
    repRate = parseFloat(exchangeMatch[1]);
  } else {
    const bengaliExchangeMatch = text.match(/(?:মুদ্রা বিনিময় হার|Exchange Rate).*?(?:1|[১])\s*RMB.*?=\s*([\d.]+)\s*(?:টাকা|BDT)?/i);
    if (bengaliExchangeMatch && bengaliExchangeMatch[1]) {
      repRate = parseFloat(bengaliExchangeMatch[1]);
    }
  }
  if (!isNaN(repRate) && repRate > 0 && (!rmbRate || rmbRate <= 0 || !options.rmbRate)) {
    rmbRate = repRate;
  }
  if (!rmbRate || rmbRate <= 0) {
    rmbRate = 22.80;
  }

  // 2. Offer ID & Platform & Source URL
  let offerId: string | null = null;
  const offerMatch = text.match(/Offer ID(?:\s*\([^)]*\))?:\s*(\d+)/i);
  if (offerMatch && offerMatch[1]) {
    offerId = offerMatch[1].trim();
  }

  let importedUrl: string | null = null;
  const sourceMatch = text.match(/(?:🔗\s*)?(?:\[[^\]]*(?:Source|উৎস লিঙ্ক)[^\]]*\]|Source|উৎস লিঙ্ক)\s*[:：]?\s*(?:\r?\n\s*)?(https?:\/\/[^\s"'<>]+)/i);
  if (sourceMatch && sourceMatch[1]) {
    importedUrl = sourceMatch[1].trim();
  } else {
    const anyOfferUrlMatch = text.match(/(https?:\/\/(?:detail\.1688\.com\/offer|worldbuybd\.com\/product|item\.taobao\.com|aliexpress\.com\/item)[^\s"'<>]+)/i);
    if (anyOfferUrlMatch && anyOfferUrlMatch[1]) {
      importedUrl = anyOfferUrlMatch[1].trim();
    }
  }

  let platform: "wholesale" | "taobao" | "alibaba" | "aliexpress" | "generic" = "wholesale";
  if (importedUrl) {
    const meta = extractUrlMetadata(importedUrl);
    if (meta.offerId && !offerId) offerId = meta.offerId;
    if (meta.platform && meta.platform !== "generic") platform = meta.platform;
  }

  if (!offerId) {
    const genericIdMatch = text.match(/offer\/(\d+)/i) || text.match(/product\/(\d+)/i) || text.match(/id=(\d+)/i);
    if (genericIdMatch && genericIdMatch[1]) {
      offerId = genericIdMatch[1];
    }
  }

  const headerMatch = text.match(/=== E-Commerce Product Report \(([^)]+)\) ===/i);
  const headerText = headerMatch ? headerMatch[1].toLowerCase() : text.substring(0, 250).toLowerCase();
  if (headerText.includes("wholesale") || text.includes("1688.com")) platform = "wholesale";
  else if (headerText.includes("taobao")) platform = "taobao";
  else if (headerText.includes("aliexpress")) platform = "aliexpress";
  else if (headerText.includes("alibaba")) platform = "alibaba";

  // 3. Product Title (supports both single line and next-line titles, Bengali & English headers)
  let originalTitle = "";
  const bengaliTitleMatch = text.match(/(?:📦\s*)?(?:\[[^\]]*(?:Product Title|প্রোডাক্ট নাম)[^\]]*\]|Product Title|প্রোডাক্ট নাম)\s*[:：]?\s*(?:\r?\n\s*)?([^\r\n]+)/i);
  if (bengaliTitleMatch && bengaliTitleMatch[1]) {
    const candidate = bengaliTitleMatch[1].trim();
    if (candidate && !candidate.startsWith("[") && !candidate.startsWith("💰") && !candidate.startsWith("•")) {
      originalTitle = candidate;
    }
  }
  if (!originalTitle) {
    const standardTitleMatch = text.match(/Product Title:\s*(.+)/i);
    if (standardTitleMatch && standardTitleMatch[1]) {
      originalTitle = standardTitleMatch[1].trim();
    }
  }

  // 4. Supplier / Company & Location
  let supplierName = "";
  const supplierMatch = text.match(/(?:Supplier\s*\/\s*Company|供货商|Supplier|কোম্পানি|সাপ্লায়ার):\s*(.+)/i);
  if (supplierMatch && supplierMatch[1]) {
    supplierName = supplierMatch[1].trim();
  }

  let shipFrom = "";
  const shipMatch = text.match(/(?:Ship From|发货地|শিপিং):\s*(.+)/i);
  if (shipMatch && shipMatch[1]) {
    shipFrom = shipMatch[1].trim();
  }

  // Guarantees
  let guaranteesText = "";
  const guaranteesMatch = text.match(/Guarantees:\s*(.+)/i);
  if (guaranteesMatch && guaranteesMatch[1]) {
    guaranteesText = guaranteesMatch[1].trim();
  }

  // 5. Pricing
  let extractedPriceRmb = 0;
  let extractedPriceBdt = 0;

  // Dual format: • মূল্য (BDT): ৳85 (¥3.9) or মূল্য: ৳85
  const dualPriceMatch = text.match(/(?:•\s*)?(?:মূল্য(?:\s*\(BDT\))?|Price(?:\s*\(BDT\))?)\s*[:：]\s*(?:৳|BDT)?\s*([\d.]+)(?:\s*\([¥￥]?\s*([\d.]+)\))?/i);
  if (dualPriceMatch) {
    if (dualPriceMatch[1]) extractedPriceBdt = parseFloat(dualPriceMatch[1]);
    if (dualPriceMatch[2]) extractedPriceRmb = parseFloat(dualPriceMatch[2]);
  }

  if (extractedPriceRmb === 0) {
    const priceRangeMatch = text.match(/Price Range:\s*[¥￥]?\s*([\d.]+)(?:\s*-\s*([\d.]+))?/i);
    if (priceRangeMatch) {
      const p1 = parseFloat(priceRangeMatch[1]);
      const p2 = priceRangeMatch[2] ? parseFloat(priceRangeMatch[2]) : p1;
      extractedPriceRmb = !isNaN(p2) ? p2 : (!isNaN(p1) ? p1 : 0);
    }
  }

  if (extractedPriceRmb > 0 && extractedPriceBdt === 0) {
    extractedPriceBdt = Math.round(extractedPriceRmb * rmbRate);
  } else if (extractedPriceBdt > 0 && extractedPriceRmb === 0 && rmbRate > 0) {
    extractedPriceRmb = Number((extractedPriceBdt / rmbRate).toFixed(2));
  }

  // Minimum Order Quantity (MOQ)
  let moq = 1;
  const moqMatch = text.match(/(?:•\s*)?(?:সর্বনিম্ন অর্ডার\s*\(MOQ\)|Minimum Order Quantity\s*\(MOQ\)|MOQ)\s*[:：]\s*(?:Minimum order\s*)?(\d+)/i);
  if (moqMatch && moqMatch[1]) {
    moq = parseInt(moqMatch[1], 10) || 1;
  }

  // Stock
  let stock = 0;
  const stockMatch = text.match(/Total Available Stock:\s*(\d+)/i);
  if (stockMatch && stockMatch[1]) {
    stock = parseInt(stockMatch[1], 10) || 0;
  }

  // Total Sales & Reviews
  let soldDisplay = "0 sold";
  let reviewCount = 25;
  const salesMatch = text.match(/(?:•\s*)?(?:ফ্যাক্টরি বিক্রয় রেকর্ড|Total Sales Count|Sales Record)\s*[:：]\s*([^\r\n]+)/i);
  if (salesMatch && salesMatch[1]) {
    const sStr = salesMatch[1].trim();
    soldDisplay = sStr;
    const sDigits = sStr.replace(/,/g, "").match(/\d+/);
    if (sDigits) {
      reviewCount = parseInt(sDigits[0], 10) || 25;
    }
  }

  // Customer Reviews / Rating
  let rating = 4.9;
  let goodRate = "";
  let buyerCommentTags = "";
  const reviewSectionMatch = text.match(/(?:⭐\s*)?(?:\[[^\]]*(?:Customer Reviews|কাস্টমার রেটিং)[^\]]*\])([\s\S]*?)(?:📸|🔗|---|$)/i);
  if (reviewSectionMatch && reviewSectionMatch[1]) {
    const rLines = reviewSectionMatch[1].split("\n");
    for (const rLine of rLines) {
      const trimmed = rLine.trim();
      const scoreM = trimmed.match(/(?:রেটিং স্কোর|Rating)\s*[:：]\s*(?:★\s*)?([\d.]+)/i);
      if (scoreM && scoreM[1]) {
        const parsedR = parseFloat(scoreM[1]);
        if (!isNaN(parsedR) && parsedR > 0) rating = parsedR;
      }
      const goodM = trimmed.match(/(?:সন্তুষ্টির হার|Good Rate)\s*[:：]\s*([^\r\n]+)/i);
      if (goodM && goodM[1]) goodRate = goodM[1].trim();
      const tagM = trimmed.match(/(?:বায়ার কমেন্ট ট্যাগ|Buyer Tags|Comment Tags)\s*[:：]\s*([^\r\n]+)/i);
      if (tagM && tagM[1]) buyerCommentTags = tagM[1].trim();
    }
  }

  // Tier Pricing
  const quantityPriceTiers: QuantityPriceTier[] = [];
  const tierSectionMatch = text.match(/(?:📊\s*)?(?:\[[^\]]*Tier Pricing[^\]]*\]|Tier Pricing)([\s\S]*?)(?:🎨|📦|📋|⭐|📸|🔗|---|$)/i);
  if (tierSectionMatch && tierSectionMatch[1]) {
    const tierLines = tierSectionMatch[1].split("\n");
    for (const line of tierLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const m = trimmed.match(/[-•*]?\s*[≥>=]?\s*(\d+)(?:\s*[-–~]\s*(\d+))?\s*(?:pcs|pieces|units)?\s*[:：]\s*(?:৳|BDT)?\s*([\d.]+)(?:\s*\([¥￥]?\s*([\d.]+)\))?/i);
      if (m && m[1]) {
        const minQ = parseInt(m[1], 10);
        const maxQ = m[2] ? parseInt(m[2], 10) : null;
        let tBdt = m[3] ? parseFloat(m[3]) : 0;
        let tRmb = m[4] ? parseFloat(m[4]) : 0;
        if (tRmb > 0 && tBdt === 0) tBdt = Math.round(tRmb * rmbRate);
        if (tBdt > 0 && tRmb === 0 && rmbRate > 0) tRmb = Number((tBdt / rmbRate).toFixed(2));
        if (minQ > 0 && (tBdt > 0 || tRmb > 0)) {
          quantityPriceTiers.push({
            minQty: minQ,
            maxQty: maxQ,
            rmbPrice: tRmb || extractedPriceRmb,
            price: tBdt || extractedPriceBdt,
          });
        }
      }
    }
  }

  // 6. High-Resolution Product Images
  const images: string[] = [];
  const gallerySectionMatch = text.match(/(?:📸\s*)?(?:\[[^\]]*(?:Image Gallery|প্রোডাক্ট ছবির লিঙ্ক)[^\]]*\])([\s\S]*?)(?:🔗|Report Generated|---|$)/i);
  const imgSectionMatch = gallerySectionMatch || text.match(/--- High-Resolution Product Images ---([\s\S]*?)(?:Report Generated|🔗|$)/i);
  const imagesText = imgSectionMatch ? imgSectionMatch[1] : text;
  const urlRegex = /(https?:\/\/[^\s"'>\)]+\.(?:jpg|jpeg|png|webp|gif)(?:[^\s"'>\)]*)?|https?:\/\/cbu01\.alicdn\.com\/[^\s"'>\)]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(imagesText)) !== null) {
    const u = m[0].trim();
    if (!images.includes(u)) {
      images.push(u);
    }
  }

  const cleanedImages = sanitizeImageList(images);
  const mainImage = cleanedImages[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80";
  const descriptionImages = cleanedImages.slice(1);

  // 7. SKU Variants & Pricing Breakdown (supports both English and Bengali / SKU List format)
  const variants: ScrapedVariant[] = [];
  const colorToImgIndex = new Map<string, number>();

  const bengaliSkuSection = text.match(/(?:🎨\s*)?(?:\[[^\]]*(?:SKU List|কালার ও ভ্যারিয়েশন)[^\]]*\])([\s\S]*?)(?:📦|📋|⭐|📸|🔗|---|$)/i);
  const englishSkuSection = text.match(/--- SKU Variants & Pricing Breakdown ---([\s\S]*?)--- Product Specifications/i);
  const activeSkuText = bengaliSkuSection ? bengaliSkuSection[1] : (englishSkuSection ? englishSkuSection[1] : null);

  if (activeSkuText) {
    const lines = activeSkuText.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !/^\d+[\.\)]/.test(trimmedLine)) continue;

      const withoutNum = trimmedLine.replace(/^\d+[\.\)]\s*/, "");

      // Extract explicit Image URL
      let explicitVarImg = "";
      const imgM = withoutNum.match(/(?:ছবি|Image|Img)\s*[:：]\s*(https?:\/\/[^\s|]+)/i) ||
        withoutNum.match(/(https?:\/\/[^\s|"'<>]+\.(?:jpg|jpeg|png|webp|gif)[^\s|"'<>]*|https?:\/\/cbu01\.alicdn\.com\/[^\s|"'<>]+)/i);
      if (imgM) {
        explicitVarImg = imgM[1].trim();
      }

      // Extract Stock
      let varStock = stock || 100;
      const stockM = withoutNum.match(/(?:স্টক|Stock)\s*[:：]\s*(\d+)/i);
      if (stockM) {
        varStock = parseInt(stockM[1], 10);
      }

      // Extract Price
      let varBdt = extractedPriceBdt;
      let varRmb = extractedPriceRmb;
      const dualPriceM = withoutNum.match(/(?:৳|BDT)?\s*([\d.]+)\s*\([¥￥]?\s*([\d.]+)\)/i);
      if (dualPriceM) {
        varBdt = parseFloat(dualPriceM[1]);
        varRmb = parseFloat(dualPriceM[2]);
      } else {
        const bdtOnlyM = withoutNum.match(/(?:BDT Price|BDT|৳)\s*[:：]?\s*([\d.]+)/i);
        if (bdtOnlyM) varBdt = parseFloat(bdtOnlyM[1]);
        const rmbOnlyM = withoutNum.match(/(?:RMB Price|RMB|[¥￥])\s*[:：]?\s*([\d.]+)/i);
        if (rmbOnlyM) varRmb = parseFloat(rmbOnlyM[1]);
      }

      if (varRmb > 0 && varBdt === 0) varBdt = Math.round(varRmb * rmbRate);
      if (varBdt > 0 && varRmb === 0 && rmbRate > 0) varRmb = Number((varBdt / rmbRate).toFixed(2));

      // Extract SKU ID if any
      let varSkuId = "";
      const skuM = withoutNum.match(/SKU ID:\s*([a-zA-Z0-9_-]+)/i);
      if (skuM) varSkuId = skuM[1];

      // Extract variant name
      let rawVarName = withoutNum;
      // If there is '—' or '–' or '-' before price
      const dashIdx = rawVarName.search(/[\u2014\u2013\u2015—–]/);
      if (dashIdx !== -1) {
        rawVarName = rawVarName.substring(0, dashIdx).trim();
      } else {
        const pipeIdx = rawVarName.indexOf("|");
        if (pipeIdx !== -1) {
          const beforePipe = rawVarName.substring(0, pipeIdx).trim();
          rawVarName = beforePipe.replace(/\s*[-–—]\s*(?:৳|BDT|¥|￥)?\s*[\d.]+(?:\s*\([¥￥]?[\d.]+\))?$/, "").trim();
        }
      }
      rawVarName = decodeHtmlEntities(rawVarName);
      if (!rawVarName) rawVarName = `Variant ${variants.length + 1}`;

      const specTokens = rawVarName.split(">").map((t) => t.trim()).filter(Boolean);
      const colorName = specTokens[0] || rawVarName;
      const sizeName = specTokens.length > 1 ? specTokens.slice(1).join(" > ") : null;

      if (!colorToImgIndex.has(colorName.toLowerCase())) {
        colorToImgIndex.set(colorName.toLowerCase(), colorToImgIndex.size);
      }
      const colorIdx = colorToImgIndex.get(colorName.toLowerCase()) || 0;

      const attributes: Record<string, string> = {
        Color: colorName,
        ...(sizeName ? { Size: sizeName } : {}),
      };

      const assignedImg =
        cleanImageUrl(explicitVarImg) ||
        cleanedImages[colorIdx] ||
        cleanedImages[variants.length] ||
        mainImage;

      variants.push({
        variantId: `var-${offerId || uuidv4().substring(0, 6)}-${varSkuId || variants.length + 1}`,
        skuId: varSkuId || `sku-${offerId || "var"}-${variants.length + 1}`,
        name: rawVarName,
        color: colorName,
        size: sizeName,
        style: null,
        attributes,
        priceRmb: varRmb,
        priceBdt: varBdt,
        price: varBdt,
        stock: varStock,
        imageUrl: assignedImg,
        specsToken: rawVarName,
      });
    }
  }

  // 8. Product Specifications & Attributes (Packaging + Attributes + Rating Details)
  const specifications: ProductSpecification[] = [];
  let detectedCategory: string | null = null;
  let brand: string | null = null;
  let unit = "piece";

  // A. Packaging Specifications
  const pkgSection = text.match(/(?:📦\s*)?(?:\[[^\]]*(?:Packaging|প্যাকেজিং)[^\]]*\])([\s\S]*?)(?:📋|⭐|📸|🔗|---|$)/i);
  if (pkgSection && pkgSection[1]) {
    for (const pLine of pkgSection[1].split("\n")) {
      const trimmed = pLine.trim();
      if (!trimmed || (!trimmed.startsWith("•") && !trimmed.startsWith("-") && !trimmed.startsWith("*"))) continue;
      const colonIdx = trimmed.search(/[:：]/);
      if (colonIdx === -1) continue;
      const rawKey = trimmed.substring(1, colonIdx).trim();
      const rawVal = trimmed.substring(colonIdx + 1).trim();
      if (rawKey && rawVal) {
        specifications.push({ name: rawKey, value: rawVal });
      }
    }
  }

  // B. Product Specifications & Attributes
  const attrSection = text.match(/(?:📋\s*)?(?:\[[^\]]*(?:Attributes|স্পেসিফিকেশন|বৈশিষ্ট্য)[^\]]*\])([\s\S]*?)(?:⭐|📸|🔗|---|$)/i) ||
    text.match(/--- Product Specifications & Attributes ---([\s\S]*?)(?:--- High-Resolution|⭐|📸|🔗|$)/i);
  if (attrSection && attrSection[1]) {
    for (const aLine of attrSection[1].split("\n")) {
      const trimmed = aLine.trim();
      if (!trimmed || (!trimmed.startsWith("•") && !trimmed.startsWith("-") && !trimmed.startsWith("*"))) continue;
      const colonIdx = trimmed.search(/[:：]/);
      if (colonIdx === -1) continue;
      const rawKey = trimmed.substring(1, colonIdx).trim();
      const rawVal = trimmed.substring(colonIdx + 1).trim();
      if (rawKey && rawVal) {
        specifications.push({ name: rawKey, value: rawVal });
        if (/^(?:Brand\s*\(品牌\)|品牌|Brand)$/i.test(rawKey)) {
          if (!/无|None|No|不支持/i.test(rawVal)) brand = rawVal;
        } else if (/brand|品牌/i.test(rawKey) && !brand && !/Yes|No|有|无|支持/i.test(rawVal)) {
          brand = rawVal;
        }
        if (/category|产品类别|适用场景/i.test(rawKey) && !detectedCategory) {
          detectedCategory = rawVal;
        }
        if (/规格/i.test(rawKey)) {
          unit = rawVal;
        }
      }
    }
  }

  // C. Rating and Buyer Tags in Specifications
  if (goodRate) {
    specifications.push({ name: "Buyer Satisfaction Rate / সন্তুষ্টির হার", value: goodRate });
  }
  if (buyerCommentTags) {
    specifications.push({ name: "Buyer Review Tags / বায়ার কমেন্ট", value: buyerCommentTags });
  }

  // 9. If variants were empty, create at least 1 variant
  if (variants.length === 0) {
    const calcBdt = extractedPriceBdt || Math.round(extractedPriceRmb * rmbRate);
    variants.push({
      variantId: `var-${offerId || "default"}-standard`,
      skuId: `sku-${offerId || "def"}-standard`,
      name: originalTitle || "Standard",
      color: "Standard",
      size: null,
      style: null,
      attributes: { Specification: "Standard" },
      priceRmb: extractedPriceRmb,
      priceBdt: calcBdt,
      price: calcBdt,
      stock: stock > 0 ? stock : 100,
      imageUrl: mainImage,
      specsToken: "Standard",
    });
  }

  // Total stock
  const totalVariantStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  if (totalVariantStock > 0) {
    stock = totalVariantStock;
  } else if (stock <= 0) {
    stock = 100;
  }

  // 10. Pricing calculations
  const basePriceBdt = variants[0]?.priceBdt || extractedPriceBdt || Math.round(extractedPriceRmb * rmbRate);
  const originalPriceBdt = Math.round(basePriceBdt / 0.95);

  if (quantityPriceTiers.length === 0) {
    quantityPriceTiers.push(
      { minQty: moq, maxQty: moq * 5, rmbPrice: extractedPriceRmb, price: basePriceBdt },
      {
        minQty: moq * 5 + 1,
        maxQty: null,
        rmbPrice: Number((extractedPriceRmb * 0.95).toFixed(2)),
        price: Math.round(extractedPriceRmb * 0.95 * rmbRate),
      }
    );
  }

  // 11. Category Determination (respects explicit customCategory or section header line in text)
  let effectiveCustomCategory = customCategory;
  if (!effectiveCustomCategory || effectiveCustomCategory.toUpperCase() === "AUTO") {
    const firstNonEmptyLines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (firstNonEmptyLines.length > 0) {
      const topHeaderCat = extractReportSectionCategoryHeader(firstNonEmptyLines[0]);
      if (topHeaderCat) {
        effectiveCustomCategory = topHeaderCat;
      } else {
        const bottomHeaderCat = extractReportSectionCategoryHeader(firstNonEmptyLines[firstNonEmptyLines.length - 1]);
        if (bottomHeaderCat) {
          effectiveCustomCategory = bottomHeaderCat;
        }
      }
    }
  }
  const combinedTextForCat = `${originalTitle} ${detectedCategory || ""} ${specifications.map((s) => s.value).join(" ")}`;
  const finalCategory = autoClassifyCategory(combinedTextForCat, effectiveCustomCategory);
  const cleanedTitle = cleanEnglishTitle(originalTitle, finalCategory) || originalTitle || "Wholesale Imported Product";

  // Seller info
  const sellerInfo: SellerInfo = {
    name: supplierName || "Direct Wholesale Factory",
    companyName: supplierName || "Direct Wholesale Factory",
    location: shipFrom || "Guangdong, China",
    rating: rating || 4.8,
    province: shipFrom.includes("Guangdong") ? "Guangdong Province" : "Guangdong Province",
    city: shipFrom.includes("广州") ? "Guangzhou (广州市)" : "Guangzhou",
  };

  // SkuDetails structured into Color + Size (or Color) matching store product page
  const skuDetails: SkuDetails = syncSkuDetailsWithVariants(null, variants) || {
    properties: [
      {
        name: "颜色",
        values: variants.map((v) => ({
          name: v.name,
          originalName: v.specsToken,
          imageUrl: v.imageUrl || null,
        })),
      },
    ],
    variants: variants.map((v) => ({
      skuId: v.skuId,
      specs: v.specsToken || v.name,
      price: v.priceRmb,
      priceRmb: v.priceRmb,
      priceBdt: v.priceBdt || v.price,
      stock: v.stock,
      imageUrl: v.imageUrl || null,
    })),
  };

  const finalImportedUrl = importedUrl || (offerId ? `https://detail.1688.com/offer/${offerId}.html` : null);
  const uniqueRecordId = `wb-${platform}-${offerId || uuidv4().substring(0, 8)}`;

  const description = [
    `Guaranteed authentic ${originalTitle || "imported item"}.`,
    supplierName ? `Direct factory supply from ${supplierName}.` : "Direct factory wholesale supply.",
    shipFrom ? `Dispatched from ${shipFrom}.` : "Direct shipment from factory.",
    guaranteesText ? `Guarantees: ${guaranteesText}.` : "",
    buyerCommentTags ? `Buyer feedback: ${buyerCommentTags}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: uniqueRecordId,
    offerId,
    importedUrl: finalImportedUrl,
    platform,
    name: cleanedTitle,
    originalTitle,
    category: finalCategory,
    brand: brand || "Direct Factory Import",
    unit: unit || "piece",
    minOrderQuantity: moq,
    rmbPrice: extractedPriceRmb,
    price: basePriceBdt,
    originalPrice: originalPriceBdt,
    discount: 5,
    stock,
    soldDisplay,
    image: mainImage,
    images: cleanedImages,
    description,
    descriptionImages,
    videoUrl: null,
    specifications,
    quantityPrices: quantityPriceTiers,
    sellerInfo,
    skuDetails,
    variants,
    status: "published",
    isNew: true,
    isBestSeller: false,
    isTrending: true,
    rating: rating || 5.0,
    reviewCount: reviewCount || 25,
    createdAt: new Date().toISOString(),
    extractedMeta: {
      scrapedAt: new Date().toISOString(),
      variantCount: variants.length,
      hasTiers: quantityPriceTiers.length > 0,
      imageCount: cleanedImages.length,
      sourceDomain: `${platform}.com`,
    },
  };
}

/**
 * Master Extraction Function
 * Strictly constructs an isolated, independent ProductMasterRecord
 */
export async function extractProductData(options: {
  url?: string;
  htmlContent?: string;
  reportText?: string;
  rmbRate?: number;
  customCategory?: string;
  profitMargin?: number;
}): Promise<ProductMasterRecord> {
  const { url = "", htmlContent = "", reportText = "", customCategory = "", profitMargin = 30 } = options;
  const rmbRate = Number(options.rmbRate) || 22.80;

  // 1. Direct check: If reportText is provided, or url / htmlContent contains product report text format
  const incomingReport =
    reportText ||
    (isProductReportText(url) ? url : null) ||
    (isProductReportText(htmlContent) ? htmlContent : null);

  if (incomingReport) {
    return parseProductReport(incomingReport, {
      rmbRate,
      customCategory,
      profitMargin,
    });
  }

  let rawHtml = htmlContent;

  const urlMeta = extractUrlMetadata(url);

  // Fetch HTML if URL is provided and HTML is empty
  if (url && !rawHtml) {
    const fetchHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
    };

    if (urlMeta.platform === "wholesale") {
      fetchHeaders["Referer"] = "https://worldbuybd.com/";
    } else if (urlMeta.platform === "taobao") {
      fetchHeaders["Referer"] = "https://www.taobao.com/";
    }

    try {
      const resp = await fetch(url, { headers: fetchHeaders });
      rawHtml = await resp.text();
    } catch (err: any) {
      throw new Error(`Failed to fetch source page from URL: ${err.message}`);
    }
  }

  if (!rawHtml || rawHtml.trim().length === 0) {
    throw new Error("No HTML content available to extract data.");
  }

  // Check if rawHtml itself is a product report text
  if (isProductReportText(rawHtml)) {
    return parseProductReport(rawHtml, {
      rmbRate,
      customCategory,
      profitMargin,
    });
  }

  // Extract offerId from FE_GLOBALS or HTML scripts if missing from URL
  if (!urlMeta.offerId) {
    const globals = parseFeGlobals(rawHtml);
    if (globals.offerId) {
      urlMeta.offerId = globals.offerId;
    }
  }

  // --- Step 1: Attempt Deep JSON context parsing (Wholesale format) ---
  const jsonContext = parseSupplierJson(rawHtml);
  const $ = cheerio.load(rawHtml);

  // Intermediate containers (strictly isolated per function call)
  let extractedTitle = "";
  let extractedOriginalTitle: string | null = null;
  let extractedPriceRmb = 0;
  let extractedStock = 0;
  let extractedMoq = 1;
  let extractedSoldDisplay: string | null = null;
  let mainImage = "";
  let galleryImages: string[] = [];
  let descriptionImages: string[] = [];
  let videoUrl: string | null = null;
  let specifications: ProductSpecification[] = [];
  let quantityPriceTiers: QuantityPriceTier[] = [];
  let sellerInfo: SellerInfo = {};
  let skuProperties: SkuProperty[] = [];
  let rawVariants: ScrapedVariant[] = [];
  let detectedLeafCategory: string | null = null;

  // 1A. Try extracting from JSON context if present
  if (jsonContext) {
    const dataNode = jsonContext.result?.data || jsonContext.data || jsonContext;

    // Offer ID
    if (!urlMeta.offerId) {
      const oid = 
        dataNode.Root?.fields?.dataJson?.tempModel?.offerId ||
        dataNode.global?.globalData?.parametersMap?.offerId ||
        dataNode.gallery?.fields?.offerId ||
        dataNode.offerId;
      if (oid) urlMeta.offerId = String(oid);
    }

    // Title
    const titleObj = dataNode.productTitle || dataNode.title;
    if (typeof titleObj === "string") {
      extractedOriginalTitle = titleObj;
    } else if (titleObj?.fields?.title) {
      extractedOriginalTitle = titleObj.fields.title;
    } else if (titleObj?.title) {
      extractedOriginalTitle = titleObj.title;
    } else if (dataNode.Root?.fields?.dataJson?.tempModel?.offerTitle) {
      extractedOriginalTitle = dataNode.Root.fields.dataJson.tempModel.offerTitle;
    } else if (dataNode.gallery?.fields?.subject) {
      extractedOriginalTitle = dataNode.gallery.fields.subject;
    } else if (dataNode.subject) {
      extractedOriginalTitle = dataNode.subject;
    }

    // Leaf category
    if (dataNode.offerDetail?.leafCategoryName) {
      detectedLeafCategory = dataNode.offerDetail.leafCategoryName;
    }

    // Video URL
    if (dataNode.gallery?.fields?.video?.videoUrl) {
      videoUrl = dataNode.gallery.fields.video.videoUrl;
    } else if (dataNode.offerDetail?.wirelessVideo?.videoUrls?.android) {
      videoUrl = dataNode.offerDetail.wirelessVideo.videoUrls.android;
    } else if (dataNode.offerDetail?.wirelessVideo?.videoUrls?.ios) {
      videoUrl = dataNode.offerDetail.wirelessVideo.videoUrls.ios;
    }

    // Images
    const gallery = dataNode.gallery || dataNode.image;
    if (gallery?.fields?.offerImgList && Array.isArray(gallery.fields.offerImgList)) {
      galleryImages.push(...gallery.fields.offerImgList);
    }
    if (gallery?.fields?.mainImage && Array.isArray(gallery.fields.mainImage)) {
      galleryImages.push(...gallery.fields.mainImage);
    }
    if (gallery?.mainImage && Array.isArray(gallery.mainImage)) {
      galleryImages.push(...gallery.mainImage.map((m: any) => (typeof m === "string" ? m : m.fullPathImageURI || m.url)));
    }
    if (dataNode.Root?.fields?.dataJson?.images && Array.isArray(dataNode.Root.fields.dataJson.images)) {
      dataNode.Root.fields.dataJson.images.forEach((imgObj: any) => {
        if (imgObj.fullPathImageURI) galleryImages.push(imgObj.fullPathImageURI);
      });
    }
    if (dataNode.offerDetail?.imageList && Array.isArray(dataNode.offerDetail.imageList)) {
      dataNode.offerDetail.imageList.forEach((imgObj: any) => {
        if (imgObj.fullPathImageURI) galleryImages.push(imgObj.fullPathImageURI);
      });
    }

    // Prices & Price Tiers
    const mainPrice = dataNode.mainPrice;
    const finalPriceModel = mainPrice?.fields?.finalPriceModel?.tradeWithoutPromotion;
    const offerPriceRanges = finalPriceModel?.offerPriceRanges || mainPrice?.fields?.priceModel?.currentPrices || dataNode.global?.globalData?.model?.tradeModel?.disPriceRanges;

    if (Array.isArray(offerPriceRanges) && offerPriceRanges.length > 0) {
      offerPriceRanges.forEach((tier: any) => {
        const tierRmb = parseFloat(tier.price || tier.discountPrice || 0);
        const minQ = parseInt(tier.beginAmount || 1, 10);
        const maxQ = tier.endAmount && tier.endAmount > 0 ? parseInt(tier.endAmount, 10) : null;
        if (tierRmb > 0) {
          quantityPriceTiers.push({
            minQty: minQ,
            maxQty: maxQ,
            rmbPrice: tierRmb,
            price: Math.round(tierRmb * rmbRate) + profitMargin,
          });
        }
      });
    }

    // Base RMB Price
    if (finalPriceModel?.offerMinPrice) {
      extractedPriceRmb = parseFloat(finalPriceModel.offerMinPrice) || 0;
    } else if (finalPriceModel?.offerMaxPrice) {
      extractedPriceRmb = parseFloat(finalPriceModel.offerMaxPrice) || 0;
    } else if (quantityPriceTiers.length > 0) {
      extractedPriceRmb = quantityPriceTiers[0].rmbPrice;
    } else {
      const priceScale = mainPrice?.fields?.priceModel?.skuPriceScaleOriginal || mainPrice?.price;
      if (priceScale) {
        extractedPriceRmb = parseFloat(String(priceScale).replace(/[^0-9.]/g, "")) || 0;
      }
    }

    // MOQ
    if (finalPriceModel?.offerBeginAmount) {
      extractedMoq = parseInt(finalPriceModel.offerBeginAmount, 10) || 1;
    } else if (dataNode.global?.globalData?.model?.tradeModel?.beginAmount) {
      extractedMoq = parseInt(dataNode.global.globalData.model.tradeModel.beginAmount, 10) || 1;
    } else if (dataNode.tradeModel?.beginAmount) {
      extractedMoq = parseInt(dataNode.tradeModel.beginAmount, 10) || 1;
    }

    // Stock
    if (finalPriceModel?.canBookedAmountOriginal) {
      extractedStock = parseInt(finalPriceModel.canBookedAmountOriginal, 10) || 0;
    } else if (dataNode.global?.globalData?.model?.tradeModel?.canBookedAmount) {
      extractedStock = parseInt(dataNode.global.globalData.model.tradeModel.canBookedAmount, 10) || 0;
    } else if (dataNode.tradeModel?.canBookedAmount) {
      extractedStock = parseInt(dataNode.tradeModel.canBookedAmount, 10) || 0;
    }

    // Sold display
    if (dataNode.productTitle?.fields?.rateInfo?.goodRates) {
      extractedSoldDisplay = `${dataNode.productTitle.fields.rateInfo.goodRates}% Good Reviews`;
    }

    // Specifications
    // 1. featureAttributes
    if (Array.isArray(dataNode.offerDetail?.featureAttributes)) {
      dataNode.offerDetail.featureAttributes.forEach((attr: any) => {
        if (attr.name && attr.value) {
          specifications.push({ name: String(attr.name).trim(), value: String(attr.value).trim() });
        }
      });
    }
    // 2. CpvEnhance
    const normalCpv = dataNode.gallery?.fields?.CpvEnhance?.normalCpv;
    if (Array.isArray(normalCpv)) {
      normalCpv.forEach((cpv: any) => {
        if (cpv.name && Array.isArray(cpv.values) && cpv.values.length > 0) {
          const valStr = cpv.values.join(", ");
          if (!specifications.some(s => s.name === cpv.name)) {
            specifications.push({ name: cpv.name, value: valStr });
          }
        }
      });
    }
    // 3. pieceWeightScale (Dimensions & Weight)
    const packWeights = dataNode.productPackInfo?.fields?.pieceWeightScale?.pieceWeightScaleInfo;
    if (Array.isArray(packWeights) && packWeights.length > 0) {
      const p = packWeights[0];
      if (p.weight) specifications.push({ name: "Weight (g)", value: `${p.weight}g` });
      if (p.length && p.width && p.height) {
        specifications.push({ name: "Dimensions", value: `${p.length} x ${p.width} x ${p.height} cm` });
      }
    }

    // Seller Info
    const sellerModel = dataNode.sellerModel;
    const shopInfo = dataNode.productTitle?.fields?.shopInfo || dataNode.shopBaseInfo;
    const freightLocation = dataNode.shippingServices?.fields?.freightInfo?.location || dataNode.shippingServices?.fields?.location;

    sellerInfo = {
      name: shopInfo?.multiBrandStoreName || sellerModel?.loginId || null,
      companyName: shopInfo?.companyName || sellerModel?.companyName || null,
      location: freightLocation || null,
      rating: shopInfo?.sellerSlrServiceScore ? parseFloat(shopInfo.sellerSlrServiceScore) : 4.9,
      factoryInspected: !!(sellerModel?.sellerSign?.signs?.isFactoryDealer || shopInfo?.cardType === "factory"),
    };

    // SKU & Variants
    const skuModel = dataNode.Root?.fields?.dataJson?.skuModel || dataNode.skuModel || dataNode.sku;
    const optionImageLookup: Record<string, string> = {};

    if (skuModel) {
      const skuProps = skuModel.skuProps || skuModel.properties || dataNode.offerDetail?.skuProps;
      if (Array.isArray(skuProps)) {
        skuProps.forEach((sp: any) => {
          const propName = sp.prop || sp.name || "Option";
          const vals: SkuPropertyOption[] = [];
          const valList = Array.isArray(sp.value) ? sp.value : Array.isArray(sp.values) ? sp.values : [];
          valList.forEach((v: any) => {
            const vName = v.name || v.value;
            const vImg = cleanImageUrl(v.imageUrl || v.image);
            if (vName && vImg) {
              optionImageLookup[vName] = vImg;
            }
            vals.push({
              name: vName,
              originalName: v.originalName || vName,
              imageUrl: vImg || "",
            });
          });
          if (vals.length > 0) {
            skuProperties.push({ name: propName, values: vals });
          }
        });
      }

      const skuInfoMap = skuModel.skuInfoMap || dataNode.tradeModel?.skuMap || dataNode.global?.globalData?.model?.tradeModel?.skuMap;
      if (skuInfoMap) {
        const entries = Array.isArray(skuInfoMap) ? skuInfoMap : Object.entries(skuInfoMap);
        entries.forEach((entry: any, idx: number) => {
          let sSpecs = "";
          let skObj: any = {};

          if (Array.isArray(entry)) {
            sSpecs = entry[0];
            skObj = entry[1];
          } else {
            skObj = entry;
            sSpecs = skObj.specAttrs || skObj.specs || skObj.name || `Variant ${idx + 1}`;
          }

          const sPriceRmb = parseFloat(skObj.discountPrice || skObj.price || skObj.priceAmount || extractedPriceRmb || 0);
          const sStock = parseInt(skObj.canBookCount || skObj.stock || extractedStock || 100, 10);
          const sSkuId = String(skObj.skuId || skObj.specId || `${urlMeta.offerId || "sku"}-${idx}`);
          const sImage = cleanImageUrl(skObj.imageUrl || optionImageLookup[sSpecs] || (galleryImages[0] || ""));

          const attributes: Record<string, string> = {};
          if (typeof sSpecs === "string") {
            const parts = sSpecs.split(/[>&;]/).map((p: string) => p.trim()).filter(Boolean);
            if (parts.length >= 1) attributes["Color"] = parts[0];
            if (parts.length >= 2) attributes["Size"] = parts[1];
            if (parts.length >= 3) attributes["Option"] = parts.slice(2).join(" ");
          }

          rawVariants.push({
            variantId: `var-${sSkuId}`,
            skuId: sSkuId,
            name: sSpecs,
            color: attributes["Color"] || null,
            size: attributes["Size"] || null,
            attributes,
            priceRmb: sPriceRmb > 0 ? sPriceRmb : extractedPriceRmb,
            priceBdt: Math.round((sPriceRmb > 0 ? sPriceRmb : extractedPriceRmb) * rmbRate) + profitMargin,
            stock: sStock,
            imageUrl: sImage || null,
            specsToken: sSpecs,
          });
        });
      }
    }
  }


  // 1B. Cheerio fallback / enrichment for missing fields
  if (!extractedOriginalTitle) {
    extractedOriginalTitle =
      $('meta[property="og:title"]').attr("content") ||
      $("h1").first().text().trim() ||
      $(".d-title").text().trim() ||
      $(".title-text").text().trim() ||
      $("title").text().trim() ||
      "Imported Product";
  }

  if (extractedPriceRmb === 0) {
    const rawPriceText =
      $(".price").first().text().trim() ||
      $(".price-text").first().text().trim() ||
      $(".current-price").first().text().trim() ||
      $('span[class*="price"]').first().text().trim();
    if (rawPriceText) {
      extractedPriceRmb = parseFloat(rawPriceText.replace(/[^0-9.]/g, "")) || 0;
    }
  }

  if (galleryImages.length === 0) {
    const ogImg = $('meta[property="og:image"]').attr("content");
    if (ogImg) galleryImages.push(ogImg);

    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy");
      if (src && (src.includes("alicdn.com") || src.includes("cbu01") || src.includes("wholesale"))) {
        galleryImages.push(src);
      }
    });
  }

  // Specifications from tables or definition lists
  if (specifications.length === 0) {
    $(".obj-sku, .de-description, table tr, dl").each((_, el) => {
      const th = $(el).find("th, dt").first().text().trim();
      const td = $(el).find("td, dd").first().text().trim();
      if (th && td && th.length < 50 && td.length < 150) {
        specifications.push({ name: th, value: td });
      }
    });
  }

  // 1C. If critical data (title or price or variants) is still sparse, invoke Gemini AI fallback
  if ((!extractedOriginalTitle || extractedPriceRmb === 0 || rawVariants.length === 0) && process.env.GEMINI_API_KEY) {
    const aiData = await extractWithGeminiFallback(rawHtml, url, rmbRate);
    if (aiData) {
      if (!extractedOriginalTitle && aiData.originalTitle) extractedOriginalTitle = aiData.originalTitle;
      if (!extractedTitle && aiData.name) extractedTitle = aiData.name;
      if (extractedPriceRmb === 0 && aiData.rmbPrice) extractedPriceRmb = aiData.rmbPrice;
      if (extractedStock === 0 && aiData.stock) extractedStock = aiData.stock;
      if (extractedMoq === 1 && aiData.minOrderQuantity) extractedMoq = aiData.minOrderQuantity;
      if (galleryImages.length <= 1 && aiData.images && aiData.images.length > 0) {
        galleryImages = [...galleryImages, ...aiData.images];
      }
      if (specifications.length === 0 && aiData.specifications && Array.isArray(aiData.specifications)) {
        specifications = aiData.specifications;
      }
      if (quantityPriceTiers.length === 0 && aiData.quantityPrices && Array.isArray(aiData.quantityPrices)) {
        quantityPriceTiers = aiData.quantityPrices;
      }
      if (rawVariants.length === 0 && aiData.variants && Array.isArray(aiData.variants)) {
        rawVariants = aiData.variants;
      }
      if (!sellerInfo.companyName && aiData.sellerInfo) {
        sellerInfo = aiData.sellerInfo;
      }
      if (skuProperties.length === 0 && aiData.skuProperties && Array.isArray(aiData.skuProperties)) {
        skuProperties = aiData.skuProperties;
      }
    }
  }

  // --- Step 2: Clean, Deduplicate & Finalize Fields ---
  const cleanedGallery = sanitizeImageList(galleryImages);
  mainImage = cleanedGallery[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80";

  // Translate/Clean Title
  extractedTitle = cleanEnglishTitle(extractedOriginalTitle || "") || extractedOriginalTitle || "Wholesale Imported Product";

  // Default price tier if none found
  if (quantityPriceTiers.length === 0 && extractedPriceRmb > 0) {
    const bdt = Math.round(extractedPriceRmb * rmbRate) + profitMargin;
    quantityPriceTiers = [
      { minQty: extractedMoq, maxQty: extractedMoq * 5, rmbPrice: extractedPriceRmb, price: bdt },
      { minQty: extractedMoq * 5 + 1, maxQty: null, rmbPrice: Number((extractedPriceRmb * 0.95).toFixed(2)), price: Math.round(extractedPriceRmb * 0.95 * rmbRate) + profitMargin },
    ];
  }

  // If no variants extracted, construct a default single master variant
  if (rawVariants.length === 0) {
    const fallbackBdt = Math.round(extractedPriceRmb * rmbRate) + profitMargin;
    rawVariants.push({
      variantId: `var-${urlMeta.offerId || "default"}-standard`,
      skuId: `sku-${urlMeta.offerId || "def"}-standard`,
      name: "Standard / Default",
      color: "Standard",
      size: "One Size",
      attributes: { "Specification": "Standard" },
      priceRmb: extractedPriceRmb,
      priceBdt: fallbackBdt,
      stock: extractedStock > 0 ? extractedStock : 500,
      imageUrl: mainImage,
      specsToken: "Standard",
    });
  }

  // Calculate total stock from variants if variant stocks exist
  const variantTotalStock = rawVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
  if (variantTotalStock > 0) {
    extractedStock = variantTotalStock;
  } else if (extractedStock <= 0) {
    extractedStock = 1000;
  }

  // Category determination (combines title, original title, and specifications for accurate sub-category matching)
  const specsHint = specifications.map((s) => `${s.name} ${s.value}`).join(" ");
  const finalCategory = autoClassifyCategory(
    `${extractedTitle} ${extractedOriginalTitle || ""} ${specsHint}`,
    customCategory
  );

  const basePriceBdt = Math.round(extractedPriceRmb * rmbRate) + profitMargin;
  const originalPriceBdt = Math.round(basePriceBdt / 0.95);

  // Construct SkuDetails structure compatible with existing ProductDetail component
  let finalizedSkuDetails: SkuDetails | null = null;
  if (skuProperties.length > 0 || rawVariants.length > 0) {
    finalizedSkuDetails = syncSkuDetailsWithVariants(
      skuProperties.length > 0 ? { properties: skuProperties, variants: [] } : null,
      rawVariants
    );
  }

  // Platform auto-detection if generic
  if (urlMeta.platform === "generic" && (rawHtml.includes("supplier.factory") || rawHtml.includes("FE_GLOBALS") || jsonContext?.result?.data)) {
    urlMeta.platform = "wholesale";
  }

  // Assemble the pristine Master Record
  const uniqueRecordId = `wb-${urlMeta.platform}-${urlMeta.offerId || uuidv4().substring(0, 8)}`;

  const masterProduct: ProductMasterRecord = {
    id: uniqueRecordId,
    offerId: urlMeta.offerId,
    importedUrl: urlMeta.cleanUrl || (urlMeta.offerId ? `https://worldbuybd.com/product/${urlMeta.offerId}.html` : null),
    platform: urlMeta.platform,
    name: extractedTitle,
    originalTitle: extractedOriginalTitle,
    category: finalCategory,
    brand: "Imported Direct (Verified Factory)",
    unit: "piece",
    minOrderQuantity: extractedMoq,
    rmbPrice: extractedPriceRmb,
    price: basePriceBdt,
    originalPrice: originalPriceBdt,
    discount: 5,
    stock: extractedStock,
    soldDisplay: extractedSoldDisplay || "500+ sold",
    image: mainImage,
    images: cleanedGallery,
    description: `Direct import from ${urlMeta.platform.toUpperCase()} manufacturer. High-quality wholesale grade with verified factory inspection.`,
    descriptionImages: sanitizeImageList(descriptionImages),
    videoUrl: videoUrl || null,
    specifications,
    quantityPrices: quantityPriceTiers,
    sellerInfo,
    skuDetails: finalizedSkuDetails,
    variants: rawVariants,
    status: "published",
    isNew: true,
    isBestSeller: false,
    isTrending: true,
    rating: 4.8,
    reviewCount: 38,
    createdAt: new Date().toISOString(),
    extractedMeta: {
      scrapedAt: new Date().toISOString(),
      variantCount: rawVariants.length,
      hasTiers: quantityPriceTiers.length > 0,
      imageCount: cleanedGallery.length,
      sourceDomain: urlMeta.domain,
    },
  };


  return masterProduct;
}

/**
 * Checks whether a URL points to an Apify Dataset / Actor items endpoint or JSON feed
 */
export function isApifyDatasetUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.includes("api.apify.com/v2/datasets/") ||
    trimmed.includes("api.apify.com/v2/actor-runs/") ||
    trimmed.includes("api.apify.com/v2/acts/") ||
    (trimmed.includes("apify.com") && trimmed.includes("/items")) ||
    trimmed.includes("#catalog=")
  );
}

function decodeHtmlEntities(str?: string | null): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

function stripHtmlTags(html?: string | null): string {
  if (!html || typeof html !== "string") return "";
  return decodeHtmlEntities(html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " "));
}

/**
 * Normalizes a single Apify dataset item (1688 / Alibaba / Taobao / Wholesale / Generic)
 * into a complete, store-ready ProductMasterRecord with full SKU variants, price tiers, images, and specs.
 */
export function normalizeApifyItem(
  rawItem: any,
  options: { rmbRate?: number; customCategory?: string; index?: number } = {}
): ProductMasterRecord | null {
  if (!rawItem || typeof rawItem !== "object" || rawItem.error) return null;

  const item = rawItem.item || rawItem.product || rawItem.data || rawItem;
  if (!item || typeof item !== "object" || item.error) return null;

  const rmbRate = Number(options.rmbRate) > 0 ? Number(options.rmbRate) : 22.80;
  const customCategory = options.customCategory || "";

  // 1. Extract Offer ID & Source URL
  const sourceUrl = String(
    item.detailUrl ||
      item.product_url ||
      item.url ||
      item.productUrl ||
      item.detail_url ||
      item.itemUrl ||
      rawItem.detailUrl ||
      rawItem.url ||
      ""
  ).trim();

  const urlMeta = extractUrlMetadata(sourceUrl);
  const rawOfferId =
    item.offerId ||
    item.offer_id ||
    item.itemId ||
    item.productId ||
    rawItem.offerId ||
    rawItem.offer_id ||
    urlMeta.offerId ||
    (typeof item.id === "string" || typeof item.id === "number" ? String(item.id) : null);

  const offerId = rawOfferId ? String(rawOfferId).replace(/^wb-(?:1688|wholesale|alibaba|taobao)-/, "").trim() : null;

  // 2. Extract Title
  const rawTitle = String(
    item.title ||
      item.title_en ||
      item.name ||
      item.productName ||
      item.productTitle ||
      item.subject ||
      item.fullTitle ||
      rawItem.title ||
      rawItem.name ||
      ""
  ).trim();

  if (!rawTitle && !offerId && !item.images && !item.image) {
    return null;
  }

  // 3. Extract RMB / Base Price accurately (handles object `{ min, max, currency }`, numbers, strings, tiers, and skuDetails)
  let rmbPrice = 0;
  const priceObj = item.price ?? rawItem.price;
  const firstSkuVarRmb = item.skuDetails?.variants?.find((v: any) => (v?.priceRmb || (v?.price && v.price < 500)) > 0);

  if (item.rmbPrice && Number(item.rmbPrice) > 0 && Number(item.rmbPrice) < 1000) {
    rmbPrice = Number(item.rmbPrice);
  } else if (firstSkuVarRmb && typeof priceObj === "number" && priceObj > 400) {
    rmbPrice = Number(firstSkuVarRmb.priceRmb || firstSkuVarRmb.price) || 0;
  } else if (typeof priceObj === "number" && !isNaN(priceObj)) {
    rmbPrice = priceObj;
  } else if (typeof priceObj === "object" && priceObj !== null) {
    const candidate =
      priceObj.min ??
      priceObj.max ??
      priceObj.value ??
      priceObj.default_price ??
      priceObj.discountPrice ??
      priceObj.originalPrice ??
      0;
    rmbPrice = typeof candidate === "number" ? candidate : parseFloat(String(candidate).replace(/[^0-9.]/g, "")) || 0;
  } else if (typeof priceObj === "string") {
    const m = priceObj.match(/(\d+(?:\.\d+)?)/);
    if (m) rmbPrice = parseFloat(m[1]) || 0;
  }

  // Fallback to quantityPrices first tier
  if (rmbPrice <= 0 && Array.isArray(item.quantityPrices) && item.quantityPrices.length > 0) {
    const qp0 = item.quantityPrices[0];
    const qpVal = qp0?.rmbPrice ?? qp0?.price ?? 0;
    rmbPrice = typeof qpVal === "number" ? qpVal : parseFloat(String(qpVal).replace(/[^0-9.]/g, "")) || 0;
  }

  // Fallback to skuDetails.priceRange or variants
  if (rmbPrice <= 0 && item.skuDetails) {
    if (typeof item.skuDetails.priceRange === "string") {
      const pm = item.skuDetails.priceRange.match(/(\d+(?:\.\d+)?)/);
      if (pm) rmbPrice = parseFloat(pm[1]) || 0;
    }
    if (rmbPrice <= 0 && Array.isArray(item.skuDetails.variants)) {
      const vWithPrice = item.skuDetails.variants.find((v: any) => (v?.discountPrice || v?.price || v?.priceRmb) > 0);
      if (vWithPrice) {
        rmbPrice = parseFloat(vWithPrice.discountPrice || vWithPrice.price || vWithPrice.priceRmb) || 0;
      }
    }
  }

  // Fallback to other price fields
  if (rmbPrice <= 0) {
    const alt = item.sellingPrice || item.currentPrice || item.promotion_price || item.minPrice || item.salePrice || 15;
    rmbPrice = typeof alt === "number" ? alt : parseFloat(String(alt).replace(/[^0-9.]/g, "")) || 15;
  }

  // Check if price is already in BDT or in CNY/RMB
  const isCny =
    priceObj?.currency === "CNY" ||
    item.currency === "CNY" ||
    sourceUrl.includes("1688.com") ||
    sourceUrl.includes("taobao.com") ||
    sourceUrl.includes("tmall.com") ||
    sourceUrl.includes("alicdn.com") ||
    Boolean(item.offerId) ||
    Boolean(item.skuDetails) ||
    rmbPrice < 800;

  let basePriceBdt = 0;
  if (item.bdtPrice && Number(item.bdtPrice) > 0) {
    basePriceBdt = Math.round(Number(item.bdtPrice));
    if (!isCny && rmbPrice > 800) {
      rmbPrice = Number((basePriceBdt / rmbRate).toFixed(2));
    }
  } else if (isCny) {
    basePriceBdt = Math.round(rmbPrice * rmbRate);
  } else {
    basePriceBdt = Math.round(rmbPrice);
    rmbPrice = Number((basePriceBdt / rmbRate).toFixed(2));
  }

  if (basePriceBdt <= 0) basePriceBdt = 500;
  const discount = Number(item.discount) || 5;
  const originalPriceBdt = Number(item.originalPrice) > basePriceBdt
    ? Math.round(Number(item.originalPrice))
    : Math.round(basePriceBdt / (1 - discount / 100));

  // 4. Normalize Images
  const rawGallery: string[] = [];
  if (Array.isArray(item.images)) {
    item.images.forEach((img: any) => {
      const u = typeof img === "string" ? img : img?.url || img?.imgUrl || img?.imageUrl;
      if (u) rawGallery.push(u);
    });
  } else if (typeof item.image_urls === "string") {
    item.image_urls.split("|").forEach((s: string) => rawGallery.push(s.trim()));
  }
  if (Array.isArray(item.item_imgs)) {
    item.item_imgs.forEach((img: any) => {
      const u = typeof img === "string" ? img : img?.url;
      if (u) rawGallery.push(u);
    });
  }
  const singleImg =
    item.image ||
    item.main_image_url ||
    item.imageUrl ||
    item.thumbnail ||
    item.mainImage ||
    item.pic_url ||
    item.picUrl ||
    item.imgUrl ||
    "";
  if (singleImg) rawGallery.unshift(singleImg);

  // Also include SKU images in gallery if gallery is small
  if (Array.isArray(item.skuImages)) {
    item.skuImages.forEach((si: any) => {
      const u = si?.imgUrl || si?.imageUrl || si?.image;
      if (u) rawGallery.push(u);
    });
  }

  const cleanedImages = sanitizeImageList(rawGallery);
  const mainImage =
    cleanedImages[0] ||
    cleanImageUrl(singleImg) ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";

  const rawDescImages = Array.isArray(item.descriptionImages) ? item.descriptionImages : [];
  const descriptionImages = sanitizeImageList(rawDescImages);

  // 5. Normalize Quantity Price Tiers
  const quantityPrices: QuantityPriceTier[] = [];
  if (Array.isArray(item.quantityPrices) && item.quantityPrices.length > 0) {
    item.quantityPrices.forEach((qp: any) => {
      const minQty = parseInt(qp.minQty ?? qp.quantityMin ?? qp.beginAmount ?? 1, 10) || 1;
      const rawMax = qp.maxQty ?? qp.quantityMax ?? qp.endAmount ?? null;
      const maxQty = rawMax !== null && rawMax !== undefined && Number(rawMax) > 0 ? parseInt(String(rawMax), 10) : null;
      const tierRawPrice = parseFloat(qp.rmbPrice ?? qp.price ?? rmbPrice) || rmbPrice;
      const tierRmb = tierRawPrice > 800 && !isCny ? Number((tierRawPrice / rmbRate).toFixed(2)) : tierRawPrice;
      const tierBdt = Math.round(tierRmb * rmbRate);
      quantityPrices.push({
        minQty,
        maxQty,
        rmbPrice: tierRmb,
        price: tierBdt,
      });
    });
  }

  const minOrderQuantity =
    parseInt(item.minOrderQuantity || quantityPrices[0]?.minQty || 1, 10) || 1;

  if (quantityPrices.length === 0 && rmbPrice > 0) {
    quantityPrices.push({
      minQty: minOrderQuantity,
      maxQty: null,
      rmbPrice,
      price: basePriceBdt,
    });
  }

  // 6. Normalize Specifications
  const specifications: ProductSpecification[] = [];
  const rawSpecs = Array.isArray(item.specifications)
    ? item.specifications
    : Array.isArray(item.specs)
    ? item.specs
    : Array.isArray(item.attributes)
    ? item.attributes
    : null;

  if (Array.isArray(rawSpecs)) {
    rawSpecs.forEach((sp: any) => {
      const sName = decodeHtmlEntities(sp?.name || sp?.key || "");
      const sVal = decodeHtmlEntities(sp?.value || sp?.val || "");
      if (sName && sVal) {
        specifications.push({ name: sName, value: sVal });
      }
    });
  } else if (item.specifications && typeof item.specifications === "object") {
    Object.entries(item.specifications).forEach(([k, v]) => {
      if (k && v !== undefined && v !== null) {
        specifications.push({ name: decodeHtmlEntities(k), value: decodeHtmlEntities(String(v)) });
      }
    });
  }

  // 7. Normalize SKU Details & Variants
  const skuImageMap: Record<string, string> = {};
  if (Array.isArray(item.skuImages)) {
    item.skuImages.forEach((si: any) => {
      const k = decodeHtmlEntities(si?.name || "");
      const u = cleanImageUrl(si?.imgUrl || si?.imageUrl || si?.image);
      if (k && u) skuImageMap[k] = u;
    });
  }

  let normalizedSkuDetails: SkuDetails | null = null;
  const normalizedVariants: ScrapedVariant[] = [];

  if (item.skuDetails && typeof item.skuDetails === "object") {
    const rawProps = Array.isArray(item.skuDetails.properties) ? item.skuDetails.properties : [];
    const normProps: SkuProperty[] = rawProps
      .map((prop: any) => {
        const propName = decodeHtmlEntities(prop?.name || prop?.prop || "Option");
        const values: SkuPropertyOption[] = (Array.isArray(prop?.values) ? prop.values : Array.isArray(prop?.value) ? prop.value : [])
          .map((v: any) => {
            const vName = decodeHtmlEntities(v?.name || v?.value || "");
            const vOrig = decodeHtmlEntities(v?.originalName || vName);
            const vImg = cleanImageUrl(v?.imageUrl || v?.image || skuImageMap[vName] || skuImageMap[vOrig]) || null;
            if (vName && vImg) {
              skuImageMap[vName] = vImg;
              skuImageMap[vOrig] = vImg;
            }
            return {
              name: vName,
              originalName: vOrig,
              imageUrl: vImg,
            };
          })
          .filter((v: SkuPropertyOption) => Boolean(v.name));
        return { name: propName, values };
      })
      .filter((p: SkuProperty) => p.values.length > 0);

    const rawVars = Array.isArray(item.skuDetails.variants) ? item.skuDetails.variants : [];
    const normSkuVariants = rawVars.map((sv: any, idx: number) => {
      const decodedSpecs = decodeHtmlEntities(sv?.specs || sv?.name || `Option ${idx + 1}`);
      const specTokens = decodedSpecs.split(/[>|,;]/).map((s: string) => s.trim()).filter(Boolean);
      const rawVarPrice = parseFloat(sv?.discountPrice ?? sv?.price ?? sv?.priceRmb ?? sv?.originalPrice ?? 0);
      const varRmb = rawVarPrice > 0 ? (rawVarPrice > 800 && !isCny ? Number((rawVarPrice / rmbRate).toFixed(2)) : rawVarPrice) : rmbPrice;
      const varBdt = Math.round(varRmb * rmbRate);
      const varStock = sv?.stock !== null && sv?.stock !== undefined ? parseInt(String(sv.stock), 10) : 500;
      const matchedImgFromToken = specTokens.map((t: string) => skuImageMap[t]).find(Boolean);
      const colorPropIdx = normProps[0]?.values
        ? normProps[0].values.findIndex(
            (v) => v.name === specTokens[0] || v.originalName === specTokens[0]
          )
        : -1;
      const fallbackColorGalleryImg =
        colorPropIdx >= 0 && cleanedImages[colorPropIdx] ? cleanedImages[colorPropIdx] : mainImage;
      const varImg =
        cleanImageUrl(sv?.imageUrl || matchedImgFromToken || fallbackColorGalleryImg) || mainImage;
      const skuId = String(sv?.skuId || sv?.specId || `${offerId || "sku"}-${idx + 1}`);

      const attributes: Record<string, string> = {};
      if (specTokens.length >= 1) attributes["Color"] = specTokens[0];
      if (specTokens.length >= 2) attributes["Size"] = specTokens[1];

      normalizedVariants.push({
        variantId: `var-${skuId}`,
        skuId,
        name: specTokens.join(" - ") || decodedSpecs,
        color: specTokens[0] || null,
        size: specTokens[1] || null,
        style: specTokens[2] || null,
        attributes,
        priceRmb: varRmb,
        priceBdt: varBdt,
        price: varBdt,
        stock: isNaN(varStock) ? 500 : varStock,
        imageUrl: varImg,
        specsToken: decodedSpecs,
      });

      return {
        skuId,
        specs: decodedSpecs,
        price: varRmb,
        priceRmb: varRmb,
        priceBdt: varBdt,
        stock: isNaN(varStock) ? 500 : varStock,
        imageUrl: varImg,
      };
    });

    // If properties exist but variants array was empty, build variants from primary property
    if (normSkuVariants.length === 0 && normProps.length > 0) {
      normProps[0].values.forEach((val, idx) => {
        const skuId = `${offerId || "sku"}-${idx + 1}`;
        const vImg = val.imageUrl || mainImage;
        normSkuVariants.push({
          skuId,
          specs: val.originalName || val.name,
          price: rmbPrice,
          priceRmb: rmbPrice,
          priceBdt: basePriceBdt,
          stock: 500,
          imageUrl: vImg,
        });
        normalizedVariants.push({
          variantId: `var-${skuId}`,
          skuId,
          name: val.name,
          color: val.name,
          size: null,
          style: null,
          attributes: { [normProps[0].name]: val.name },
          priceRmb: rmbPrice,
          priceBdt: basePriceBdt,
          price: basePriceBdt,
          stock: 500,
          imageUrl: vImg,
          specsToken: val.originalName || val.name,
        });
      });
    }

    if (normProps.length > 0 || normSkuVariants.length > 0) {
      normalizedSkuDetails = {
        properties: normProps,
        variants: normSkuVariants,
      };
    }
  } else if (Array.isArray(item.skuImages) && item.skuImages.length > 0) {
    // Construct skuDetails from skuImages when skuDetails is missing
    const values: SkuPropertyOption[] = item.skuImages
      .map((si: any) => ({
        name: decodeHtmlEntities(si?.name || ""),
        originalName: decodeHtmlEntities(si?.name || ""),
        imageUrl: cleanImageUrl(si?.imgUrl || si?.imageUrl || si?.image) || mainImage,
      }))
      .filter((v: SkuPropertyOption) => Boolean(v.name));

    if (values.length > 0) {
      const skuVars = values.map((val, idx) => {
        const skuId = `${offerId || "sku"}-${idx + 1}`;
        normalizedVariants.push({
          variantId: `var-${skuId}`,
          skuId,
          name: val.name,
          color: val.name,
          size: null,
          style: null,
          attributes: { Color: val.name },
          priceRmb: rmbPrice,
          priceBdt: basePriceBdt,
          price: basePriceBdt,
          stock: 500,
          imageUrl: val.imageUrl || mainImage,
          specsToken: val.name,
        });
        return {
          skuId,
          specs: val.name,
          price: rmbPrice,
          priceRmb: rmbPrice,
          priceBdt: basePriceBdt,
          stock: 500,
          imageUrl: val.imageUrl || mainImage,
        };
      });

      normalizedSkuDetails = {
        properties: [{ name: "颜色", values }],
        variants: skuVars,
      };
    }
  }

  // Fallback to existing item.variants if present
  if (normalizedVariants.length === 0 && Array.isArray(item.variants) && item.variants.length > 0) {
    item.variants.forEach((v: any, idx: number) => {
      const skuId = String(v?.skuId || v?.id || `${offerId || "var"}-${idx + 1}`);
      const vRmb = parseFloat(v?.priceRmb ?? v?.rmbPrice ?? rmbPrice) || rmbPrice;
      const vBdt = Math.round(vRmb * rmbRate);
      const vName = decodeHtmlEntities(v?.name || v?.specs || `Variant ${idx + 1}`);
      const vImg = cleanImageUrl(v?.image || v?.imageUrl) || mainImage;
      normalizedVariants.push({
        variantId: `var-${skuId}`,
        skuId,
        name: vName,
        color: v?.color || vName,
        size: v?.size || null,
        style: null,
        attributes: v?.attributes || { Option: vName },
        priceRmb: vRmb,
        priceBdt: vBdt,
        price: vBdt,
        stock: parseInt(String(v?.stock ?? 500), 10) || 500,
        imageUrl: vImg,
        specsToken: vName,
      });
    });
  }

  // 8. Seller / Supplier Info
  const sup = item.supplier || item.sellerInfo || item.seller || {};
  const locationStr = [item.province || sup.province, item.city || sup.city, sup.address || item.shipping?.location]
    .filter(Boolean)
    .join(" ");

  const sellerInfo: SellerInfo = {
    name: sup.loginId || sup.name || sup.companyName || null,
    companyName: sup.companyName || sup.legalCompanyName || sup.name || null,
    location: locationStr || sup.location || null,
    province: item.province || null,
    city: item.city || null,
    rating: sup.scores?.goods || sup.scores?.composite || sup.rating || 4.8,
    responseRate: sup.stats?.responseRate ? `${Math.round(Number(sup.stats.responseRate) * 100)}%` : null,
    tpYear: sup.tpYear || null,
    factoryInspected: Boolean(sup.isFactoryInspected || sup.isSuperFactory || sup.flags?.isFactory),
    shopUrl: sup.shopUrl || sup.url || null,
  };

  // 9. Category Classification (supports Main Categories + Bag, Shoes, Jewelry Sub-Categories)
  const specsCategoryText = specifications
    .filter((s) => /category|type|style|bag|shoe|boot|jewelry|皮具|箱包|鞋|饰品|首饰|款式|类别|用途/i.test(s.name))
    .map((s) => s.value)
    .join(" ");

  const categoryHint = [
    item.subCategory,
    item.sub_category,
    item.sourceKeyword,
    item.category,
    item.categoryName,
    item.categoryPath,
    sup.mainCategory,
    specsCategoryText,
    rawTitle,
    item.title_en,
  ]
    .filter(Boolean)
    .join(" ");

  let finalCategory = "Shoes";
  if (
    customCategory &&
    customCategory.trim() &&
    customCategory.toUpperCase() !== "AUTO" &&
    customCategory !== "Imported & Scraped" &&
    customCategory !== "Scraped Products" &&
    customCategory !== "Imported"
  ) {
    finalCategory = autoClassifyCategory(categoryHint, customCategory.trim());
  } else if (item.subCategory || item.sub_category) {
    finalCategory = autoClassifyCategory(categoryHint, String(item.subCategory || item.sub_category));
  } else if (item.category && item.category !== "Imported" && item.category !== "Imported & Scraped" && item.category !== "Scraped Products") {
    finalCategory = autoClassifyCategory(categoryHint, item.category);
  } else if (item.sourceKeyword && getMappedSlug(item.sourceKeyword) !== "imported") {
    finalCategory = autoClassifyCategory(categoryHint, item.sourceKeyword);
  } else {
    finalCategory = autoClassifyCategory(categoryHint, "");
  }

  // 10. Clean English Title & Preserve Original Title
  const hasChinese = /[\u4e00-\u9fa5]/.test(rawTitle);
  const cleanedName = item.title_en
    ? String(item.title_en).trim()
    : hasChinese
    ? cleanEnglishTitle(rawTitle, finalCategory)
    : rawTitle || "Wholesale Imported Product";

  const brandName =
    sellerInfo.companyName ||
    sellerInfo.name ||
    item.brand ||
    specifications.find((s) => /品牌|brand/i.test(s.name))?.value ||
    "Direct Factory Import";

  const totalStock =
    parseInt(String(item.stock || 0), 10) ||
    normalizedVariants.reduce((acc, v) => acc + (v.stock || 0), 0) ||
    1500;

  const soldDisplay =
    item.soldDisplay ||
    (item.saledCountStr ? `${item.saledCountStr} sold` : null) ||
    (item.saledCount ? `${item.saledCount}+ sold` : "100+ sold");

  const descText =
    item.descriptionText ||
    stripHtmlTags(item.descriptionHtml) ||
    item.description ||
    `${cleanedName}. Direct wholesale factory supply from ${brandName}${locationStr ? ` (${locationStr})` : ""}.`;

  const recordId = offerId
    ? `wb-1688-${offerId}`
    : String(item.id || `wb-apify-${Date.now()}-${options.index ?? Math.floor(Math.random() * 10000)}`);

  return {
    id: recordId,
    offerId: offerId || recordId,
    importedUrl: sourceUrl || (offerId ? `https://detail.1688.com/offer/${offerId}.html` : null),
    platform: urlMeta.platform !== "generic" ? urlMeta.platform : "wholesale",
    name: cleanedName,
    originalTitle: rawTitle || cleanedName,
    category: finalCategory,
    brand: brandName,
    unit: item.unit || "piece",
    minOrderQuantity,
    rmbPrice,
    price: basePriceBdt,
    originalPrice: originalPriceBdt,
    discount,
    stock: totalStock,
    soldDisplay,
    image: mainImage,
    images: cleanedImages.length > 0 ? cleanedImages : [mainImage],
    description: cleanProductDescription(descText, cleanedName),
    descriptionHtml: cleanProductDescriptionHtml(item.descriptionHtml),
    descriptionImages,
    videoUrl: item.videoUrl || null,
    specifications,
    quantityPrices,
    sellerInfo,
    skuDetails: normalizedSkuDetails,
    variants: normalizedVariants,
    status: "published",
    isNew: true,
    isBestSeller: Boolean(item.isPromoted || (item.orderCount && item.orderCount > 50)),
    isTrending: true,
    rating: Number(item.reviewSummary?.rating || sellerInfo.rating || 4.8),
    reviewCount: Number(item.reviewSummary?.reviewCount || item.orderCount || 28),
    createdAt: item.createdAt || new Date().toISOString(),
    extractedMeta: {
      scrapedAt: item.scrapedAt || new Date().toISOString(),
      variantCount: normalizedVariants.length || 1,
      hasTiers: quantityPrices.length > 0,
      imageCount: cleanedImages.length || 1,
      sourceDomain: urlMeta.domain || "1688.com",
    },
  };
}

/**
 * Normalizes an entire Apify dataset payload (array or wrapper object) into ProductMasterRecord[]
 */
export function normalizeApifyDatasetItems(
  rawData: any,
  options: { rmbRate?: number; customCategory?: string } = {}
): ProductMasterRecord[] {
  let list: any[] = [];
  if (Array.isArray(rawData)) {
    list = rawData;
  } else if (rawData && typeof rawData === "object") {
    if (Array.isArray(rawData.items)) list = rawData.items;
    else if (Array.isArray(rawData.data)) list = rawData.data;
    else if (Array.isArray(rawData.products)) list = rawData.products;
    else if (Array.isArray(rawData.results)) list = rawData.results;
    else if (!rawData.error) list = [rawData];
  }

  const results: ProductMasterRecord[] = [];
  const seenIds = new Set<string>();

  list.forEach((rawItem, idx) => {
    const normalized = normalizeApifyItem(rawItem, { ...options, index: idx });
    if (normalized) {
      const key = String(normalized.offerId || normalized.id);
      if (!seenIds.has(key)) {
        seenIds.add(key);
        results.push(normalized);
      }
    }
  });

  return results;
}

/**
 * Loads local fallback Apify dataset items when an external Apify free-tier dataset has expired (record-not-found)
 */
function loadFallbackApifyDatasetItems(datasetUrl: string, customCategory?: string): { items: any[]; detectedCategory?: string } {
  try {
    // 1. Check dedicated Purse & Bags dataset map by dataset ID
    const datasetMapPath = path.join(process.cwd(), "data/apify_purse_bags_datasets.json");
    if (fs.existsSync(datasetMapPath)) {
      const datasetMap = JSON.parse(fs.readFileSync(datasetMapPath, "utf-8"));
      for (const [datasetId, entry] of Object.entries<any>(datasetMap)) {
        if (datasetUrl.includes(datasetId) && Array.isArray(entry?.items) && entry.items.length > 0) {
          return {
            items: entry.items,
            detectedCategory: entry.category || customCategory,
          };
        }
      }

      // If customCategory is Purse or Bags, return matching items from the Purse/Bags dataset map
      const lowerCat = (customCategory || "").toLowerCase().trim();
      if (lowerCat === "purse" || lowerCat === "bags" || lowerCat === "bag") {
        const targetCat = lowerCat === "purse" ? "Purse" : "Bags";
        const matchedItems: any[] = [];
        for (const entry of Object.values<any>(datasetMap)) {
          if (entry?.category === targetCat && Array.isArray(entry.items)) {
            matchedItems.push(...entry.items);
          }
        }
        if (matchedItems.length > 0) {
          return { items: matchedItems, detectedCategory: targetCat };
        }
      }
    }

    // 2. Check store data.json for matching category products before falling back to generic files
    const dbPath = path.join(process.cwd(), "data.json");
    if (fs.existsSync(dbPath) && customCategory && customCategory !== "AUTO") {
      const dbData = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      if (Array.isArray(dbData?.products)) {
        const catMatches = dbData.products.filter((p: any) =>
          matchesCategory(p.category, customCategory, p.name || p.originalTitle)
        );
        if (catMatches.length > 0) {
          return { items: catMatches.slice(0, 12), detectedCategory: customCategory };
        }
      }
    }

    const samplePath = path.join(process.cwd(), "sample_apify.json");
    const downloadedPath = path.join(process.cwd(), "downloaded_apify.json");
    let pool: any[] = [];

    if (fs.existsSync(samplePath)) {
      const s = JSON.parse(fs.readFileSync(samplePath, "utf-8"));
      if (Array.isArray(s)) pool = pool.concat(s);
    }
    if (fs.existsSync(downloadedPath)) {
      const d = JSON.parse(fs.readFileSync(downloadedPath, "utf-8"));
      if (Array.isArray(d)) pool = pool.concat(d);
    }

    if (pool.length === 0) return { items: [] };

    // Deduplicate pool by offerId
    const uniquePool: any[] = [];
    const seen = new Set<string>();
    for (const it of pool) {
      const oid = String(it?.offerId || it?.id || "");
      if (oid && !seen.has(oid)) {
        seen.add(oid);
        uniquePool.push(it);
      }
    }

    return { items: uniquePool };
  } catch (e) {
    console.warn("Fallback Apify dataset load warning:", e);
    return { items: [] };
  }
}

/**
 * Fetches an Apify Dataset URL (or #catalog= link) from the server and parses all items into ProductMasterRecord[]
 */
export async function fetchAndParseApifyDatasetUrl(
  url: string,
  options: { rmbRate?: number; customCategory?: string } = {}
): Promise<{
  products: ProductMasterRecord[];
  sourceUrl: string;
  usedFallbackCache?: boolean;
}> {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    throw new Error("Empty Apify Dataset URL");
  }

  // Handle #catalog= base64 link
  if (trimmed.includes("#catalog=")) {
    const base64Data = trimmed.split("#catalog=")[1];
    const decodedData = Buffer.from(decodeURIComponent(base64Data), "base64").toString("utf-8");
    const catalogJson = JSON.parse(decodedData);
    const products = normalizeApifyDatasetItems(catalogJson.items || catalogJson, options);
    return { products, sourceUrl: trimmed };
  }

  // Ensure format=json is present if it's an Apify dataset items URL
  let fetchUrl = trimmed;
  if (fetchUrl.includes("api.apify.com/v2/datasets/") && !fetchUrl.includes("/items")) {
    const [base, query] = fetchUrl.split("?");
    fetchUrl = `${base.replace(/\/$/, "")}/items${query ? `?${query}` : "?format=json&clean=true"}`;
  }

  let rawData: any = null;
  let usedFallbackCache = false;
  let effectiveCategory = options.customCategory;

  try {
    const resp = await fetch(fetchUrl, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (compatible; WorldBuyBD-Importer/2.0)",
      },
    });

    const text = await resp.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    if (resp.ok && parsed && !parsed.error) {
      rawData = parsed;
      if (!effectiveCategory || effectiveCategory === "AUTO") {
        const knownDataset = loadFallbackApifyDatasetItems(fetchUrl, options.customCategory);
        if (knownDataset.detectedCategory) {
          effectiveCategory = knownDataset.detectedCategory;
        }
      }
    } else if (parsed?.error?.type === "record-not-found" || resp.status === 404) {
      // If the Apify dataset ID expired on Apify's free-tier cloud, recover gracefully from local Apify dataset cache
      const fallback = loadFallbackApifyDatasetItems(fetchUrl, options.customCategory);
      if (fallback.items.length > 0) {
        rawData = fallback.items;
        if (!effectiveCategory || effectiveCategory === "AUTO") {
          effectiveCategory = fallback.detectedCategory;
        }
        usedFallbackCache = true;
      } else {
        throw new Error(parsed?.error?.message || `Apify Dataset not found (HTTP ${resp.status})`);
      }
    } else {
      throw new Error(parsed?.error?.message || `Failed to fetch Apify dataset (HTTP ${resp.status})`);
    }
  } catch (err: any) {
    const fallback = loadFallbackApifyDatasetItems(fetchUrl, options.customCategory);
    if (fallback.items.length > 0 && fetchUrl.includes("api.apify.com")) {
      rawData = fallback.items;
      if (!effectiveCategory || effectiveCategory === "AUTO") {
        effectiveCategory = fallback.detectedCategory;
      }
      usedFallbackCache = true;
    } else {
      throw err;
    }
  }

  const products = normalizeApifyDatasetItems(rawData, {
    ...options,
    customCategory: effectiveCategory,
  });
  return {
    products,
    sourceUrl: trimmed,
    usedFallbackCache,
  };
}
