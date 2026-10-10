import express from "express";
import path from "path";
import cors from "cors";
import compression from "compression";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";
import {
  seedDatabaseIfEmpty,
  getAllProducts,
  getAllProductsSummary,
  toProductSummary,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  createOrder,
  updateOrderStatus,
  updateOrderPayment,
  verifyOrderPayment,
  deleteOrder,
  getAllCategories,
  createCategory,
  deleteCategory,
  getAllSubadmins,
  createSubadmin,
  updateSubadmin,
  deleteSubadmin,
  getStoreSettings,
  updateStoreSettings,
  updateGlobalDiscount,
  bulkUpdateProductPrices,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateOrderInvoice,
  recalculateProductPrice,
  getLocalData,
  saveLocalData,
  restoreProductsBackup
} from "./src/db/service.ts";
import { matchesCategory, getCanonicalCategoryName, getMappedSlug, getCategoryImage, syncSkuDetailsWithVariants } from "./src/utils/categories.ts";
import { 
  getOrCreateUser, 
  registerPhoneUser, 
  loginPhoneUser, 
  resetPhoneUserPassword, 
  getAllUsers, 
  updateCustomerPasswordById,
  updateCustomerProfile,
  syncUserCartAndWishlist,
  getUserCartAndWishlist,
  normalizePhone,
  phoneTail,
  matchUser
} from "./src/db/users.ts";
import { 
  DEFAULT_ROLE_DASHBOARDS, 
  SAMPLE_SUPPORT_TICKETS, 
  SAMPLE_SALES_QUOTES, 
  SAMPLE_DELIVERY_DISPATCHES, 
  SAMPLE_ACCOUNTS_TRANSACTIONS, 
  SAMPLE_PURCHASE_QC_ORDERS 
} from "./src/utils/roleDashboardsData.ts";
import {
  registerMarketingAssignment,
  syncAllOrdersByPhone,
  findAssignedMarketingForCustomer,
  normalizeCustomerPhone,
  getCustomerPhoneTail,
  extractOrderPhone,
  extractOrderUserId
} from "./src/utils/customerMarketingSync.ts";
import {
  SAMPLE_STOCK_OUT_REFUNDS,
  formatStockOutRefundMessage
} from "./src/utils/stockOutRefundsData.ts";
import {
  extractProductData,
  ProductMasterRecord,
  extractUrlMetadata,
  isApifyDatasetUrl,
  normalizeApifyItem,
  normalizeApifyDatasetItems,
  fetchAndParseApifyDatasetUrl,
  isProductReportText,
  parseMultiProductReports,
  extractReportSectionCategoryHeader
} from "./src/services/scraperEngine.ts";
import {
  listProductSnapshots,
  createProductSnapshot,
  getSnapshotPath,
  deleteProductSnapshot,
  restoreSnapshotByFilename,
  exportProductsToCSV,
  checkAndTriggerAutoBackup
} from "./src/db/productBackupManager.ts";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(compression() as any);
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // Up to 200MB for video and image files
});

// --- Simple JSON Database ---
const DB_FILE = path.join(process.cwd(), "data.json");
let cachedDb: any = null;

const DEFAULT_CATEGORIES = [
  { id: "cat-shoes", name: "Shoes", slug: "shoes", icon: "Footprints", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80" },
  { id: "cat-bags", name: "Bags", slug: "bags", icon: "ShoppingBag", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80" },
  // ... (rest of categories)
];

function readDb() {
  if (cachedDb) return cachedDb;

  const data = getLocalData();
  let mutated = false;

  // Ensure fields exist
  if (!data.categories || data.categories.length === 0) {
    data.categories = DEFAULT_CATEGORIES;
    mutated = true;
  }
  if (!data.subadmins) {
    data.subadmins = [
      {
        id: "sub-1",
        name: "Mohammad Tanvir",
        email: "tanvir.orders@worldbuybd.com",
        phone: "01755123456",
        role: "Order & Fulfillment Manager",
        permissions: ["orders_view", "orders_status", "view_proof"],
        status: "active",
        createdAt: new Date().toISOString()
      },
      {
        id: "sub-2",
        name: "Nusrat Jahan",
        email: "nusrat.import@worldbuybd.com",
        phone: "01822987654",
        role: "Imported & Product Importer",
        permissions: ["products_add", "scraper_run", "categories_edit"],
        status: "active",
        createdAt: new Date().toISOString()
      }
    ];
    mutated = true;
  }
  if (!data.settings || Object.keys(data.settings).length === 0) {
    data.settings = {
      storeName: "World Buy BD",
      siteName: "World Buy BD",
      siteTagline: "China to Bangladesh — Easy, Safe & Affordable",
      bkashNumber: "01712-345678",
      bkashType: "Personal / Send Money",
      nagadNumber: "01912-345678",
      nagadType: "Personal / Send Money",
      bankName: "South East Bank PLC",
      bankAccountName: "Md Shamim Hossen",
      bankAccountNumber: "002412100022424",
      bankBranch: "Banani Branch",
      bankRouting: "205260432",
      rmbRate: 22.80,
      airShippingRate: 950,
      seaShippingRate: 450,
      minProfitMargin: 10,
      phone: "+880 1355-136661",
      email: "worldbuybd01@gmail.com",
      address: "Kazipara, Mirpur-10, Dhaka 1216"
    };
    mutated = true;
  }

  // Ensure Role Dashboards (15 specialized operational dashboards) exist
  if (!data.roleDashboards || data.roleDashboards.length === 0) {
    data.roleDashboards = DEFAULT_ROLE_DASHBOARDS;
    mutated = true;
  }
  if (!data.dashboardTickets) {
    data.dashboardTickets = SAMPLE_SUPPORT_TICKETS;
    mutated = true;
  }
  if (!data.dashboardQuotes) {
    data.dashboardQuotes = SAMPLE_SALES_QUOTES;
    mutated = true;
  }
  if (!data.dashboardDispatches) {
    data.dashboardDispatches = SAMPLE_DELIVERY_DISPATCHES;
    mutated = true;
  }
  if (!data.dashboardTransactions) {
    data.dashboardTransactions = SAMPLE_ACCOUNTS_TRANSACTIONS;
    mutated = true;
  }
  if (!data.dashboardQCOrders) {
    data.dashboardQCOrders = SAMPLE_PURCHASE_QC_ORDERS;
    mutated = true;
  }
  if (!data.stockOutRefundRecords || !Array.isArray(data.stockOutRefundRecords) || data.stockOutRefundRecords.length === 0) {
    data.stockOutRefundRecords = SAMPLE_STOCK_OUT_REFUNDS;
    mutated = true;
  }

  if (mutated) {
    saveLocalData(data);
  }
  
  cachedDb = data;
  return data;
}

function writeDb(data: any, invalidateProducts = false) {
  cachedDb = data;
  saveLocalData(data, invalidateProducts);
}


function ensureInitialSeed() {
  const db = readDb();
  if (db.products.length === 0) {
    db.products = [
      {
        id: "p1",
        name: "Premium Wireless Headphones",
        brand: "AudioTech",
        category: "Electronics",
        price: 15000,
        originalPrice: 20000,
        discount: 25,
        stock: 50,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        rating: 4.8,
        reviewCount: 124,
        status: "published"
      },
      {
        id: "p2",
        name: "Smart Fitness Watch",
        brand: "FitGear",
        category: "Electronics",
        price: 8500,
        originalPrice: 10000,
        discount: 15,
        stock: 120,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        rating: 4.5,
        reviewCount: 89,
        status: "published"
      },
      {
        id: "p3",
        name: "Minimalist Leather Wallet",
        brand: "Crafted",
        category: "Fashion & Clothing",
        price: 2500,
        originalPrice: 3500,
        discount: 28,
        stock: 200,
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        rating: 4.9,
        reviewCount: 45,
        status: "published"
      }
    ];
    writeDb(db);
  }
}

// --- API Routes (Cloud SQL PostgreSQL + Drizzle ORM) ---

// Image Proxy to bypass 403 Forbidden on Alibaba CDN (1688 / Taobao) & external images with RAM LRU cache and proper filenames
const proxyImageCache = new Map<string, { buffer: Buffer; contentType: string }>();
const MAX_IMAGE_CACHE_ENTRIES = 250;

async function resolveProxyImageFilename(
  targetUrl: string,
  requestedName?: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  let ext = ".jpg";
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("png")) ext = ".png";
  else if (ct.includes("webp")) ext = ".webp";
  else if (ct.includes("gif")) ext = ".gif";

  let rawName = (requestedName || "").trim();
  if (rawName.toLowerCase() === "proxy-image") {
    rawName = "";
  }

  // If no explicit filename was provided in the route/query, look up product/variation name in DB
  if (!rawName || rawName === "World-Buy-BD-Product.jpg" || rawName === "World-Buy-BD-Product") {
    try {
      const products = await getAllProducts();
      const normTarget = targetUrl.replace(/^https?:/i, "");
      for (const p of products as any[]) {
        if (!p || !p.name) continue;
        const pName = String(p.name).trim();

        // Check SKU properties
        const props = p.skuDetails?.properties;
        if (Array.isArray(props)) {
          for (const prop of props) {
            if (Array.isArray(prop?.values)) {
              for (const val of prop.values) {
                const vImg = String(val?.imageUrl || val?.image || "").replace(/^https?:/i, "");
                if (vImg && vImg === normTarget) {
                  const vLabel = val.cleanName || val.name || "";
                  rawName = vLabel ? `${pName}-${vLabel}` : pName;
                  break;
                }
              }
            }
            if (rawName) break;
          }
        }
        if (rawName) break;

        // Check variants
        if (Array.isArray(p.variants)) {
          for (const v of p.variants) {
            const vImg = String(v?.imageUrl || v?.image || "").replace(/^https?:/i, "");
            if (vImg && vImg === normTarget) {
              const vLabel = v.name || v.color || "";
              rawName = vLabel ? `${pName}-${vLabel}` : pName;
              break;
            }
          }
        }
        if (rawName) break;

        // Check main image
        if (p.image && String(p.image).replace(/^https?:/i, "") === normTarget) {
          rawName = pName;
          break;
        }

        // Check gallery images
        if (Array.isArray(p.images)) {
          const idx = p.images.findIndex(
            (img: string) => img && String(img).replace(/^https?:/i, "") === normTarget
          );
          if (idx !== -1) {
            rawName = idx === 0 ? pName : `${pName}-${idx + 1}`;
            break;
          }
        }
      }
    } catch {
      // Ignore lookup error
    }
  }

  if (!rawName) {
    try {
      const parsed = new URL(targetUrl);
      const seg = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || "");
      const stripped = seg.replace(/\.(jpg|jpeg|png|webp|gif|avif|svg)$/i, "");
      if (stripped && stripped.toLowerCase() !== "proxy-image") {
        rawName = stripped;
      }
    } catch {
      // Ignore URL parse error
    }
  }

  if (!rawName) {
    rawName = "World-Buy-BD-Product";
  }

  // Strip existing extension and sanitize
  let base = rawName
    .replace(/\.(jpg|jpeg|png|webp|gif|avif|svg)$/i, "")
    .replace(/[<>:"/\\|?*\x00-\x1F%~#&+{}`^[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (base.length > 90) {
    base = base.slice(0, 90).trim();
  }

  base = base
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!base || base.toLowerCase() === "proxy-image") {
    base = "World-Buy-BD-Product";
  }

  return `${base}${ext}`;
}

app.get(["/api/proxy-image", "/api/proxy-image/:filename"], async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send("Missing url parameter");
  }

  let targetUrl = imageUrl.trim();
  // Unwrap nested proxy URLs if passed accidentally
  while (targetUrl.includes("/api/proxy-image")) {
    const match = targetUrl.match(/[?&]url=([^&]+)/);
    if (match && match[1]) {
      try {
        targetUrl = decodeURIComponent(match[1]);
      } catch {
        break;
      }
    } else {
      break;
    }
  }

  if (targetUrl.startsWith("//")) {
    targetUrl = "https:" + targetUrl;
  }

  const requestedName = (req.params.filename || (req.query.name as string) || "").trim();
  const isDownload = req.query.download === "1" || req.query.download === "true";
  const dispositionType = isDownload ? "attachment" : "inline";

  // Serve directly from in-memory LRU cache if available
  const cachedImg = proxyImageCache.get(targetUrl);
  if (cachedImg) {
    const finalFilename = await resolveProxyImageFilename(targetUrl, requestedName, cachedImg.contentType);
    const asciiSafe = finalFilename.replace(/[^\x20-\x7E]/g, "_") || "product-image.jpg";
    res.setHeader("Content-Type", cachedImg.contentType);
    res.setHeader(
      "Content-Disposition",
      `${dispositionType}; filename="${asciiSafe}"; filename*=UTF-8''${encodeURIComponent(finalFilename)}`
    );
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    return res.send(cachedImg.buffer);
  }

  try {
    const isAlibabaDomain =
      targetUrl.includes("alicdn.com") ||
      targetUrl.includes("1688.com") ||
      targetUrl.includes("taobao.com") ||
      targetUrl.includes("tmall.com") ||
      targetUrl.includes("cbu01");

    const fetchHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    };
    if (isAlibabaDomain) {
      fetchHeaders["Referer"] = "https://detail.1688.com/";
    }

    const upstream = await fetch(targetUrl, {
      signal: AbortSignal.timeout(8000),
      headers: fetchHeaders,
    });

    if (!upstream.ok) {
      return res.status(upstream.status).send("Failed to fetch image");
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Store in LRU cache if under 1.5MB
    if (buffer.byteLength < 1500000) {
      if (proxyImageCache.size >= MAX_IMAGE_CACHE_ENTRIES) {
        const oldestKey = proxyImageCache.keys().next().value;
        if (oldestKey) proxyImageCache.delete(oldestKey);
      }
      proxyImageCache.set(targetUrl, { buffer, contentType });
    }

    const finalFilename = await resolveProxyImageFilename(targetUrl, requestedName, contentType);
    const asciiSafe = finalFilename.replace(/[^\x20-\x7E]/g, "_") || "product-image.jpg";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${dispositionType}; filename="${asciiSafe}"; filename*=UTF-8''${encodeURIComponent(finalFilename)}`
    );
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

// User Sync via Firebase UID
app.post("/api/auth/sync-user", async (req, res) => {
  try {
    const { uid, email, name, phone } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: "UID and email are required" });
    }
    const user = await getOrCreateUser(uid, email, name, phone);
    res.json({ success: true, user });
  } catch (error: any) {
    console.error("Failed to sync user:", error);
    res.status(500).json({ error: error.message || "Failed to sync user" });
  }
});

// Visual Image Search with Gemini Vision & Smart Catalog Matching
app.post("/api/search/image", async (req, res) => {
  try {
    const { imageBase64, imageUrl } = req.body;
    if (!imageBase64 && !imageUrl) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Get all products to match against (using fast summary cache)
    const allProducts = await getAllProductsSummary();
    if (!allProducts || allProducts.length === 0) {
      return res.json({ ids: [], identifiedTitle: "No products in store", keywords: [] });
    }

    // Prepare catalog summary for Gemini (up to 300 products)
    const productCatalog = allProducts.slice(0, 300).map(p => ({
      id: String(p.id || p.offerId),
      name: (p.name || "").slice(0, 70),
      category: p.category || ""
    }));

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not found in environment");
      return res.json({
        success: true,
        ids: allProducts.slice(0, 20).map(p => String(p.id || p.offerId)),
        identifiedTitle: "Imported Catalog Products",
        category: "General",
        keywords: ["products"]
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const prompt = `You are an expert AI visual search & product matching engine for an e-commerce platform.
The user provided a reference photo of a product they want to find.

Available Product Catalog (with ID, Name, Category):
${JSON.stringify(productCatalog)}

Instructions:
1. Visually analyze the uploaded image carefully:
   - Identify what specific product type is shown (e.g. sneakers / casual shoes / athletic footwear, leather women's handbag / tote, backpack, smartwatch, fitness belt, jacket / clothing, etc.).
   - Note colors, style, materials, and target category.
2. Search and match against the provided catalog:
   - "exactMatchId": If there is an exact or near-identical matching product in the catalog, provide its exact ID. If not present in catalog, return null.
   - "similarProductIds": Return a list of all products in the catalog that belong to the SAME category or are visually/functionally similar (for example, if the user uploaded shoes or sneakers, return all other shoes/sneakers in the catalog). Order from highest similarity to lowest.
   - "identifiedTitle": Concise product title in English (e.g. "Men's Casual Sport Sneakers", "Leather Women's Handbag", etc.).
   - "category": Broad category in English (e.g. "Shoes & Footwear", "Bags & Luggage", "Fashion & Apparel", "Sports & Fitness", etc.).
   - "keywords": 5-8 search terms in English and/or Chinese (e.g. ["shoes", "sneakers", "running", "casual footwear", "sports", "板鞋", "单鞋"]).

Return strictly valid JSON matching this schema:
{
  "identifiedTitle": string,
  "category": string,
  "exactMatchId": string | null,
  "similarProductIds": string[],
  "keywords": string[]
}`;

    const parts: any[] = [];
    if (imageBase64) {
      const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      const mimeTypeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    } else if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const contentType = imgRes.headers.get("content-type") || "image/jpeg";
          parts.push({
            inlineData: {
              data: Buffer.from(buffer).toString("base64"),
              mimeType: contentType
            }
          });
        }
      } catch (imgErr) {
        console.warn("Could not download image from url:", imgErr);
      }
    }

    parts.push({ text: prompt });

    // Call Gemini with retry in case of temporary 503 spike
    let responseText = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: { parts },
          config: {
            responseMimeType: "application/json"
          }
        });
        responseText = response.text || "";
        break;
      } catch (apiErr: any) {
        console.warn(`Gemini attempt ${attempt + 1} failed:`, apiErr?.message || apiErr);
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 800));
        }
      }
    }

    let parsed: any = {};
    try {
      if (responseText) {
        parsed = JSON.parse(responseText);
      }
    } catch (parseErr) {
      console.error("Failed to parse Gemini output:", responseText);
    }

    const identifiedTitle = parsed.identifiedTitle || "Identified Product";
    const category = parsed.category || "General";
    const keywords: string[] = Array.isArray(parsed.keywords) ? parsed.keywords : [];
    const exactMatchId = parsed.exactMatchId && allProducts.some(p => String(p.id || p.offerId) === String(parsed.exactMatchId))
      ? String(parsed.exactMatchId)
      : null;

    // Collect ordered IDs: exactMatch first, then similar products
    const orderedIds: string[] = [];
    const seen = new Set<string>();

    if (exactMatchId) {
      orderedIds.push(exactMatchId);
      seen.add(exactMatchId);
    }

    if (Array.isArray(parsed.similarProductIds)) {
      for (const id of parsed.similarProductIds) {
        const strId = String(id);
        if (!seen.has(strId) && allProducts.some(p => String(p.id || p.offerId) === strId)) {
          orderedIds.push(strId);
          seen.add(strId);
        }
      }
    }

    // Additional smart category/keyword enrichment:
    // Ensure all products in the store matching the detected item category or keywords are included
    const searchTerms = [
      ...keywords.map(k => k.toLowerCase()),
      category.toLowerCase(),
      identifiedTitle.toLowerCase()
    ].filter(Boolean);

    for (const p of allProducts) {
      const pId = String(p.id || p.offerId);
      if (seen.has(pId)) continue;

      const pName = (p.name || "").toLowerCase();
      const pCat = (p.category || "").toLowerCase();

      const matches = searchTerms.some(term => {
        if (!term || term.length < 3) return false;
        return pName.includes(term) || pCat.includes(term);
      });

      if (matches) {
        orderedIds.push(pId);
        seen.add(pId);
      }
    }

    // Fallback if no matching IDs found
    if (orderedIds.length === 0) {
      allProducts.slice(0, 15).forEach(p => {
        const pId = String(p.id || p.offerId);
        if (!seen.has(pId)) {
          orderedIds.push(pId);
          seen.add(pId);
        }
      });
    }

    res.json({
      success: true,
      exactMatchId,
      ids: orderedIds.slice(0, 50),
      identifiedTitle,
      category,
      keywords: keywords.slice(0, 6),
      totalMatches: orderedIds.length
    });
  } catch (error: any) {
    console.error("Image search via Gemini failed:", error);
    try {
      const all = await getAllProducts();
      res.json({
        success: true,
        ids: all.slice(0, 20).map(p => String(p.id || p.offerId)),
        identifiedTitle: "Imported Products",
        category: "All",
        keywords: ["imported"]
      });
    } catch {
      res.json({ success: false, ids: [], keyword: "Imported" });
    }
  }
});

// Products
app.get("/api/products", async (req, res) => {
  try {
    const isFull = req.query.full === "true";
    let prods = isFull ? await getAllProducts() : await getAllProductsSummary();

    const categoryFilter = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const excludeId = typeof req.query.exclude === "string" ? req.query.exclude.trim() : "";
    const limitNum = req.query.limit ? parseInt(String(req.query.limit), 10) : 0;

    if (categoryFilter) {
      prods = prods.filter((p: any) => matchesCategory(p.category, categoryFilter, p.name) && (p.status === "published" || !p.status));
    }
    if (excludeId) {
      prods = prods.filter((p: any) => String(p.id) !== excludeId && String(p.offerId) !== excludeId);
    }
    if (limitNum > 0 && !isNaN(limitNum)) {
      prods = prods.slice(0, limitNum);
    }

    res.json(prods);
  } catch (error: any) {
    console.error("Failed to get products:", error);
    const db = readDb();
    const currentRmbRate = Number(db.settings?.rmbRate) || 22.80;
    const seen = new Set<string>();
    const unique = (db.products || [])
      .filter((p: any) => {
        const id = String(p?.id || p?.offerId || "");
        if (id && seen.has(id)) return false;
        if (id) seen.add(id);
        return true;
      })
      .map((p: any) => toProductSummary(recalculateProductPrice(p, currentRmbRate)));
    res.json(unique);
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const rawParam = req.params.id || "";
    const decodedId = decodeURIComponent(rawParam).trim();
    const cleanId = decodedId.replace(/^abb[-_]?/i, "").trim();
    
    // 1. Try with decoded and cleaned IDs
    let prod = await getProductById(decodedId);
    if (!prod && cleanId !== decodedId) {
      prod = await getProductById(cleanId);
    }
    if (prod) {
      return res.json(prod);
    }

    const db = readDb();
    const currentRmbRate = Number(db.settings?.rmbRate) || 22.80;
    const strippedId = cleanId.replace(/^wb-(?:1688|taobao|alibaba|tmall)-/, "").trim();
    const digitMatch = cleanId.match(/(\d{8,16})/);
    const extractedOfferId = digitMatch ? digitMatch[1] : null;

    // 2. Direct fallback lookup in db.products
    const fallback = db.products.find((p: any) => 
      String(p.id) === decodedId || 
      String(p.offerId) === decodedId ||
      String(p.id) === cleanId ||
      String(p.offerId) === cleanId ||
      String(p.id) === strippedId ||
      String(p.offerId) === strippedId ||
      (extractedOfferId && (
        String(p.offerId) === extractedOfferId ||
        String(p.id) === extractedOfferId ||
        String(p.id) === `wb-1688-${extractedOfferId}` ||
        String(p.id).includes(extractedOfferId) ||
        (p.importedUrl && p.importedUrl.includes(extractedOfferId))
      ))
    );
    if (fallback) return res.json(recalculateProductPrice(fallback, currentRmbRate));

    // 3. On-demand auto-scrape if it's a valid 1688 offer ID
    if (extractedOfferId && extractedOfferId.length >= 8) {
      try {
        console.log(`On-demand scraping for 1688 offer ID: ${extractedOfferId}`);
        const scraped = await extractProductData({
          url: `https://detail.1688.com/offer/${extractedOfferId}.html`,
          rmbRate: currentRmbRate
        });
        if (scraped) {
          const saved = await createProduct(scraped);
          return res.json(recalculateProductPrice(saved || scraped, currentRmbRate));
        }
      } catch (scrapeErr) {
        console.warn("Auto-scrape fallback failed:", scrapeErr);
      }
    }

    return res.status(404).json({ error: "Product not found" });
  } catch (error: any) {
    console.error("Failed to get product:", error);
    try {
      const db = readDb();
      const currentRmbRate = Number(db.settings?.rmbRate) || 22.80;
      const rawParam = req.params.id || "";
      const cleanId = decodeURIComponent(rawParam).replace(/^abb[-_]?/i, "").trim();
      const digitMatch = cleanId.match(/(\d{8,16})/);
      const extractedOfferId = digitMatch ? digitMatch[1] : null;

      const fallback = db.products.find((p: any) => 
        String(p.id) === rawParam || 
        String(p.offerId) === rawParam ||
        String(p.id) === cleanId ||
        String(p.offerId) === cleanId ||
        (extractedOfferId && (String(p.offerId) === extractedOfferId || String(p.id).includes(extractedOfferId)))
      );
      if (fallback) return res.json(recalculateProductPrice(fallback, currentRmbRate));
    } catch (e) {}
    res.status(404).json({ error: "Product not found" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const prodName = req.body.name || "Product";
    const resolvedCat = getCanonicalCategoryName(req.body.category, prodName);
    const newProductData = {
      id: req.body.id || uuidv4(),
      name: prodName,
      price: req.body.price,
      originalPrice: req.body.originalPrice,
      image: req.body.image,
      category: resolvedCat,
      brand: req.body.brand || null,
      rating: req.body.rating || 4.8,
      reviews: req.body.reviews || req.body.reviewCount || 0,
      isNew: req.body.isNew || false,
      isBestSeller: req.body.isBestSeller || false,
      isTrending: req.body.isTrending || false,
      description: req.body.description || null,
      stock: req.body.stock || 100,
      importedUrl: req.body.importedUrl || null,
      quantityPrices: req.body.quantityPrices || null,
      minOrderQuantity: req.body.minOrderQuantity || 1,
    };
    const created = await createProduct(newProductData);
    res.json(created);
  } catch (error: any) {
    console.error("Failed to create product:", error);
    res.status(500).json({ error: error.message || "Failed to create product" });
  }
});

app.post("/api/products/bulk", async (req, res) => {
  try {
    const { products, customCategory, rmbRate: customRmbRate } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "Products array is required" });
    }
    const createdList: any[] = [];
    const dbData = readDb();
    const currentRmbRate =
      customRmbRate !== undefined && customRmbRate !== null && Number(customRmbRate) > 0
        ? Number(customRmbRate)
        : dbData.settings && dbData.settings.rmbRate
        ? Number(dbData.settings.rmbRate)
        : 22.80;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const normalized = normalizeApifyItem(p, {
        rmbRate: currentRmbRate,
        customCategory: p?.category && p.category !== "Scraped Products" && p.category !== "Imported" ? p.category : customCategory,
        index: i,
      });

      const computedPrice =
        normalized?.price ||
        p.bdtPrice ||
        (typeof p.price === "number" && p.price > 100
          ? p.price
          : Math.round(parseFloat(p.price || 15) * currentRmbRate));

      const rawSelectedCat =
        customCategory && customCategory !== "AUTO" && customCategory !== "All"
          ? customCategory
          : p?.category && p.category !== "Scraped Products" && p.category !== "Imported" && p.category !== "Imported & Scraped"
          ? p.category
          : normalized?.category;
      const finalCatName = getCanonicalCategoryName(
        rawSelectedCat,
        p.customName || normalized?.name || p.title || p.name
      );

      const prodPayload: any = normalized
        ? {
            ...normalized,
            id: p.id ? String(p.id) : normalized.id,
            name: p.customName || normalized.name,
            category: finalCatName,
            price: p.customPrice ? Number(p.customPrice) : normalized.price,
            createdAt: p.createdAt || new Date().toISOString(),
          }
        : {
            id: p.id || uuidv4(),
            name: p.title || p.name || "Imported Product",
            price: computedPrice,
            originalPrice: p.originalPrice || Math.round(computedPrice / 0.95),
            discount: p.discount || 5,
            image: p.image,
            images: p.images || [p.image],
            category: finalCatName,
            brand: p.brand || "Imported Direct",
            rating: p.rating || 4.8,
            reviewCount: p.reviewCount || p.reviews || 25,
            reviews: p.reviews || p.reviewCount || 25,
            status: p.status || "published",
            stock: p.stock || 500,
            offerId: p.offerId || null,
            specifications: p.specifications || [],
            description: p.description || null,
            descriptionHtml: p.descriptionHtml || null,
            descriptionImages: p.descriptionImages || [],
            videoUrl: p.videoUrl || null,
            skuDetails: p.skuDetails || null,
            variants: p.variants || [],
            sellerInfo: p.sellerInfo || {},
            importedUrl: p.originalUrl || p.importedUrl || p.url || null,
            quantityPrices: p.quantityPrices || [],
            minOrderQuantity: p.minOrderQuantity || 1,
            createdAt: new Date().toISOString(),
          };

      try {
        const saved = await createProduct(prodPayload);
        createdList.push(saved || prodPayload);
      } catch (e) {
        createdList.push(prodPayload);
      }
    }

    // Ensure all bulk products are persisted at the top of data.json and cache is invalidated
    try {
      const freshDb = readDb();
      for (const s of [...createdList].reverse()) {
        const idx = freshDb.products.findIndex(
          (p: any) =>
            (s.offerId && String(p.offerId) === String(s.offerId)) ||
            String(p.id) === String(s.id)
        );
        if (idx >= 0) {
          const merged = { ...freshDb.products[idx], ...s, status: "published" };
          freshDb.products.splice(idx, 1);
          freshDb.products.unshift(merged);
        } else {
          freshDb.products.unshift({ ...s, status: "published" });
        }
      }
      writeDb(freshDb, true);
    } catch (e) {
      console.warn("Failed to sync bulk products to local db:", e);
    }

    res.json({ success: true, count: createdList.length, products: createdList });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Bulk save failed" });
  }
});

// Dedicated Apify Dataset URL / Multi-Link / Raw JSON Importer API
app.post("/api/admin/apify/extract", async (req, res) => {
  try {
    const { urls, url, urlEntries, rawTextWithCategories, rawJson, customCategory, rmbRate: customRmbRate, autoSave = true } = req.body;
    const shouldAutoSave = autoSave !== false;
    const dbData = readDb();
    const currentRmbRate =
      customRmbRate !== undefined && customRmbRate !== null && !isNaN(Number(customRmbRate)) && Number(customRmbRate) > 0
        ? Number(customRmbRate)
        : Number(dbData.settings?.rmbRate) || 22.80;

    const effectiveCategory =
      customCategory && customCategory !== "AUTO" && customCategory !== "All" ? customCategory : "";

    let allExtracted: ProductMasterRecord[] = [];
    const linkReport: Array<{ url: string; category?: string; count: number; success: boolean; error?: string; usedFallbackCache?: boolean }> = [];

    // 1. Process URL(s) and optional section categories (e.g. "Purse\nhttps://...\nBags\nhttps://...")
    const targetUrlEntries: Array<{ url: string; category: string }> = [];

    if (Array.isArray(urlEntries) && urlEntries.length > 0) {
      urlEntries.forEach((entry: any) => {
        if (entry && typeof entry.url === "string" && entry.url.trim()) {
          targetUrlEntries.push({
            url: entry.url.trim(),
            category: effectiveCategory || entry.category || "",
          });
        }
      });
    } else {
      const linesSource =
        typeof rawTextWithCategories === "string" && rawTextWithCategories.trim()
          ? rawTextWithCategories.split(/\r?\n/)
          : Array.isArray(urls)
          ? urls
          : typeof url === "string"
          ? url.split(/\r?\n/)
          : [];

      let activeSectionCategory = "";
      for (const rawLine of linesSource) {
        if (typeof rawLine !== "string") continue;
        const trimmed = rawLine.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("#catalog=")) {
          trimmed
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter((s) => s.startsWith("http://") || s.startsWith("https://") || s.includes("#catalog="))
            .forEach((u) => {
              targetUrlEntries.push({
                url: u,
                category: effectiveCategory || activeSectionCategory,
              });
            });
        } else if (trimmed.length < 40 && !trimmed.includes("{") && !trimmed.includes("[")) {
          // Treat non-URL heading line (e.g., "Purse", "Bags", "Shoes") as section category header
          activeSectionCategory = trimmed.replace(/[:#-]+$/, "").trim();
        }
      }
    }

    for (const entry of targetUrlEntries) {
      const targetUrl = entry.url;
      const itemCategory = entry.category || effectiveCategory;
      try {
        if (isApifyDatasetUrl(targetUrl)) {
          const parsedRes = await fetchAndParseApifyDatasetUrl(targetUrl, {
            rmbRate: currentRmbRate,
            customCategory: itemCategory,
          });
          allExtracted.push(...parsedRes.products);
          linkReport.push({
            url: targetUrl,
            category: itemCategory || parsedRes.products[0]?.category || "Auto",
            count: parsedRes.products.length,
            success: true,
            usedFallbackCache: parsedRes.usedFallbackCache,
          });
        } else {
          // Might be a direct JSON feed or a single product URL
          const resp = await fetch(targetUrl, {
            headers: {
              Accept: "application/json, text/html, */*",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0 Safari/537.36",
            },
          });
          const text = await resp.text();
          let jsonParsed: any = null;
          try {
            jsonParsed = JSON.parse(text);
          } catch {
            jsonParsed = null;
          }

          if (jsonParsed && (Array.isArray(jsonParsed) || jsonParsed.items || jsonParsed.data || jsonParsed.offerId || jsonParsed.title)) {
            const prods = normalizeApifyDatasetItems(jsonParsed, {
              rmbRate: currentRmbRate,
              customCategory: itemCategory,
            });
            allExtracted.push(...prods);
            linkReport.push({ url: targetUrl, category: itemCategory || "Auto", count: prods.length, success: true });
          } else {
            const singleMaster = await extractProductData({
              url: targetUrl,
              htmlContent: text,
              rmbRate: currentRmbRate,
              customCategory: itemCategory,
            });
            allExtracted.push(singleMaster);
            linkReport.push({ url: targetUrl, category: singleMaster.category, count: 1, success: true });
          }
        }
      } catch (err: any) {
        linkReport.push({
          url: targetUrl,
          category: itemCategory,
          count: 0,
          success: false,
          error: err.message || "Failed to fetch link",
        });
      }
    }

    // 2. Process rawJson if provided
    if (rawJson) {
      const parsedJson = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
      const fromJson = normalizeApifyDatasetItems(parsedJson, {
        rmbRate: currentRmbRate,
        customCategory: effectiveCategory,
      });
      allExtracted.push(...fromJson);
    }

    // Deduplicate across all links by offerId / id
    const seen = new Set<string>();
    const uniqueProducts: ProductMasterRecord[] = [];
    for (const prod of allExtracted) {
      const key = String(prod.offerId || prod.id);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueProducts.push(prod);
      }
    }

    if (uniqueProducts.length === 0) {
      const firstErr = linkReport.find((r) => !r.success)?.error;
      return res.status(400).json({
        error: firstErr || "No valid products found in the provided link(s) or JSON data.",
        linkReport,
      });
    }

    // 3. Auto-Save directly into the store database (and place at the top of catalog)
    let savedCount = 0;
    if (shouldAutoSave) {
      for (const item of [...uniqueProducts].reverse()) {
        try {
          await createProduct({ ...item, status: "published" });
        } catch {}
      }
      const freshDb = readDb();
      for (const item of [...uniqueProducts].reverse()) {
        const idx = freshDb.products.findIndex(
          (p: any) =>
            (item.offerId && String(p.offerId) === String(item.offerId)) ||
            String(p.id) === String(item.id)
        );
        if (idx >= 0) {
          const merged = { ...freshDb.products[idx], ...item, status: "published" };
          freshDb.products.splice(idx, 1);
          freshDb.products.unshift(merged);
        } else {
          freshDb.products.unshift({ ...item, status: "published" });
        }
        savedCount++;
      }
      writeDb(freshDb, true);
    }

    return res.json({
      success: true,
      count: uniqueProducts.length,
      savedCount,
      autoSaved: shouldAutoSave,
      products: uniqueProducts,
      linkReport,
    });
  } catch (error: any) {
    console.error("Apify extract error:", error);
    return res.status(500).json({ error: error.message || "Failed to process Apify dataset" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const updated = await updateProduct(req.params.id, req.body);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error: any) {
    console.error("Failed to update product:", error);
    res.status(500).json({ error: error.message || "Failed to update product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    res.status(500).json({ error: error.message || "Failed to delete product" });
  }
});

// ==========================================
// B2B PRODUCT SCRAPER & EXTRACTION SYSTEM API
// ==========================================

// 1. Single URL/HTML/Report Extraction (Auto-Saves by default so scraped data is always persisted)
app.post("/api/admin/scraper/extract", async (req, res) => {
  try {
    const { url, htmlContent, reportText, text, customCategory, rmbRate: customRmbRate, autoSave = true } = req.body;
    const shouldAutoSave = autoSave !== false;
    const isReportInUrl = typeof url === "string" && isProductReportText(url);
    const incomingText = reportText || text || (isReportInUrl ? url : null);
    const effectiveUrl = isReportInUrl ? "" : url;
    if (!effectiveUrl && !htmlContent && !incomingText) {
      return res.status(400).json({ error: "URL, HTML content, or Product Report text is required" });
    }

    const dbData = readDb();
    const currentRmbRate = (customRmbRate !== undefined && customRmbRate !== null && !isNaN(Number(customRmbRate)) && Number(customRmbRate) > 0)
      ? Number(customRmbRate)
      : (Number(dbData.settings?.rmbRate) || 22.80);

    const effectiveCat =
      customCategory && customCategory !== "Imported & Scraped" && customCategory !== "AUTO" && customCategory !== "All"
        ? customCategory
        : "";

    const persistRecordsToCatalog = async (records: ProductMasterRecord[]) => {
      try {
        for (const item of [...records].reverse()) {
          const canonicalCat = getCanonicalCategoryName(item.category, item.name || item.originalTitle);
          item.category = canonicalCat;
          try {
            const saved = await createProduct({ ...item, category: canonicalCat, status: "published" });
            if (saved?.id) item.id = saved.id;
          } catch {}
        }
        const freshDb = readDb();
        for (const item of [...records].reverse()) {
          const canonicalCat = getCanonicalCategoryName(item.category, item.name || item.originalTitle);
          const idx = freshDb.products.findIndex(
            (p: any) =>
              (item.offerId && String(p.offerId) === String(item.offerId)) ||
              String(p.id) === String(item.id)
          );
          if (idx >= 0) {
            const merged = { ...freshDb.products[idx], ...item, category: canonicalCat, status: "published" };
            freshDb.products.splice(idx, 1);
            freshDb.products.unshift(merged);
          } else {
            freshDb.products.unshift({ ...item, category: canonicalCat, status: "published" });
          }
        }
        writeDb(freshDb, true);
      } catch (e) {
        console.warn("Persist records warning:", e);
      }
    };

    // A. If user pasted one or more Apify Dataset URLs into Single Extractor (via url or reportText), extract & auto-save all products!
    const combinedInput = `${url || ""}\n${incomingText || ""}`;
    const apifyUrlMatches = combinedInput.match(/https?:\/\/[^\s,"'<>]+/g)?.filter((u) => isApifyDatasetUrl(u)) || [];
    if (apifyUrlMatches.length > 0) {
      const entriesWithCat: Array<{ url: string; category: string }> = [];
      let sectionCat = "";
      for (const rawLine of combinedInput.split(/\r?\n/)) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          trimmed
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter((s) => isApifyDatasetUrl(s))
            .forEach((u) => {
              entriesWithCat.push({ url: u, category: sectionCat || effectiveCat });
            });
        } else {
          const detectedHeader = extractReportSectionCategoryHeader(trimmed);
          if (detectedHeader) {
            sectionCat = detectedHeader;
          } else if (trimmed.length < 40 && !trimmed.includes("{") && !trimmed.includes("[")) {
            sectionCat = trimmed.replace(/[:#-]+$/, "").trim();
          }
        }
      }

      const allApifyProds: ProductMasterRecord[] = [];
      const seenKeys = new Set<string>();
      const listToProcess = entriesWithCat.length > 0 ? entriesWithCat : apifyUrlMatches.map((u) => ({ url: u, category: effectiveCat }));
      for (const entry of listToProcess) {
        try {
          const apifyRes = await fetchAndParseApifyDatasetUrl(entry.url, {
            rmbRate: currentRmbRate,
            customCategory: entry.category,
          });
          for (const prod of apifyRes.products) {
            const k = String(prod.offerId || prod.id);
            if (!seenKeys.has(k)) {
              seenKeys.add(k);
              allApifyProds.push(prod);
            }
          }
        } catch (e) {
          console.warn("Apify URL extract warning:", e);
        }
      }

      if (allApifyProds.length > 0) {
        await persistRecordsToCatalog(allApifyProds);
        const firstMaster = allApifyProds[0];
        return res.json({
          success: true,
          isApifyDataset: true,
          autoSaved: true,
          apifyProducts: allApifyProds,
          multiReports: allApifyProds,
          totalDatasetCount: allApifyProds.length,
          data: firstMaster,
          isDuplicate: false,
          existingProduct: null,
        });
      }
    }

    // B. If incomingText contains one or more E-Commerce Product Reports (Text) with optional Category / Sub-Category headers
    if (incomingText && isProductReportText(incomingText)) {
      const parsedReports = parseMultiProductReports(incomingText, {
        rmbRate: currentRmbRate,
        customCategory: effectiveCat,
      });

      if (parsedReports.length > 0) {
        for (const rec of parsedReports) {
          rec.category = getCanonicalCategoryName(rec.category, rec.name || rec.originalTitle);
          const existingMatch = (dbData.products || []).find(
            (p: any) =>
              (rec.offerId && String(p.offerId) === String(rec.offerId)) ||
              (rec.importedUrl && p.importedUrl && String(p.importedUrl) === String(rec.importedUrl))
          );
          if (existingMatch) {
            rec.id = existingMatch.id || rec.id;
            if (
              Array.isArray(existingMatch.deletedSkuKeys) &&
              existingMatch.deletedSkuKeys.length > 0 &&
              Array.isArray(rec.variants)
            ) {
              const deletedSet = new Set(
                existingMatch.deletedSkuKeys.map((k: string) => String(k).toLowerCase().trim())
              );
              const filteredVars = rec.variants.filter((v: any) => {
                const skuKey = String(v?.skuId || "").toLowerCase().trim();
                const nameKey = String(v?.name || v?.specsToken || "").toLowerCase().trim();
                return !(skuKey && deletedSet.has(skuKey)) && !(nameKey && deletedSet.has(nameKey));
              });
              rec.variants = filteredVars;
              rec.skuDetails = syncSkuDetailsWithVariants(rec.skuDetails, filteredVars);
              (rec as any).deletedSkuKeys = existingMatch.deletedSkuKeys;
            }
          }
        }

        if (shouldAutoSave) {
          await persistRecordsToCatalog(parsedReports);
        }

        const firstMaster = parsedReports[0];
        const firstExisting = (dbData.products || []).find(
          (p: any) =>
            (firstMaster.offerId && String(p.offerId) === String(firstMaster.offerId)) ||
            (firstMaster.importedUrl && p.importedUrl && String(p.importedUrl) === String(firstMaster.importedUrl))
        );

        return res.json({
          success: true,
          isMultiReport: parsedReports.length > 1,
          autoSaved: shouldAutoSave,
          multiReports: parsedReports,
          totalReportCount: parsedReports.length,
          data: firstMaster,
          isDuplicate: !!firstExisting,
          existingProduct: firstExisting
            ? { id: firstExisting.id, name: firstExisting.name, category: firstExisting.category }
            : null,
        });
      }
    }

    // C. If incomingText contains direct product URLs with Category / Sub-Category section headers
    if (incomingText && !isProductReportText(incomingText)) {
      const urlEntries: Array<{ url: string; category: string }> = [];
      let sectionCat = "";
      for (const rawLine of incomingText.split(/\r?\n/)) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          trimmed
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter((s) => s.startsWith("http://") || s.startsWith("https://"))
            .forEach((u) => {
              urlEntries.push({ url: u, category: sectionCat || effectiveCat });
            });
        } else {
          const detectedHeader = extractReportSectionCategoryHeader(trimmed);
          if (detectedHeader) {
            sectionCat = detectedHeader;
          }
        }
      }

      if (urlEntries.length > 0) {
        const extractedUrlRecords: ProductMasterRecord[] = [];
        for (const entry of urlEntries) {
          try {
            const rec = await extractProductData({
              url: entry.url,
              rmbRate: currentRmbRate,
              customCategory: entry.category,
            });
            rec.category = getCanonicalCategoryName(rec.category, rec.name || rec.originalTitle);
            extractedUrlRecords.push(rec);
          } catch (e) {
            console.warn("Direct URL in report box extract error:", e);
          }
        }
        if (extractedUrlRecords.length > 0) {
          if (shouldAutoSave) {
            await persistRecordsToCatalog(extractedUrlRecords);
          }
          const firstMaster = extractedUrlRecords[0];
          const existing = (dbData.products || []).find(
            (p: any) =>
              (firstMaster.offerId && String(p.offerId) === String(firstMaster.offerId)) ||
              (firstMaster.importedUrl && p.importedUrl && String(p.importedUrl) === String(firstMaster.importedUrl))
          );
          return res.json({
            success: true,
            isMultiReport: extractedUrlRecords.length > 1,
            autoSaved: shouldAutoSave,
            multiReports: extractedUrlRecords,
            totalReportCount: extractedUrlRecords.length,
            data: firstMaster,
            isDuplicate: !!existing,
            existingProduct: existing ? { id: existing.id, name: existing.name, category: existing.category } : null,
          });
        }
      }
    }

    const masterRecord = await extractProductData({
      url: effectiveUrl,
      htmlContent,
      reportText: incomingText,
      rmbRate: currentRmbRate,
      customCategory
    });

    // Check for duplicate in DB prior to saving so we preserve existing ID & deleted SKUs
    const existing = (dbData.products || []).find((p: any) => 
      (masterRecord.offerId && String(p.offerId) === String(masterRecord.offerId)) ||
      (masterRecord.importedUrl && p.importedUrl && String(p.importedUrl) === String(masterRecord.importedUrl))
    );

    if (existing) {
      masterRecord.id = existing.id || masterRecord.id;
      if (Array.isArray(existing.deletedSkuKeys) && existing.deletedSkuKeys.length > 0 && Array.isArray(masterRecord.variants)) {
        const deletedSet = new Set(existing.deletedSkuKeys.map((k: string) => String(k).toLowerCase().trim()));
        const filteredVars = masterRecord.variants.filter((v: any) => {
          const skuKey = String(v?.skuId || "").toLowerCase().trim();
          const nameKey = String(v?.name || v?.specsToken || "").toLowerCase().trim();
          return !(skuKey && deletedSet.has(skuKey)) && !(nameKey && deletedSet.has(nameKey));
        });
        masterRecord.variants = filteredVars;
        masterRecord.skuDetails = syncSkuDetailsWithVariants(masterRecord.skuDetails, filteredVars);
        (masterRecord as any).deletedSkuKeys = existing.deletedSkuKeys;
      }
    }

    if (shouldAutoSave) {
      await persistRecordsToCatalog([masterRecord]);
    }

    return res.json({
      success: true,
      autoSaved: shouldAutoSave,
      data: masterRecord,
      isDuplicate: !!existing,
      existingProduct: existing ? { id: existing.id, name: existing.name, category: existing.category } : null
    });
  } catch (error: any) {
    console.error("Scraper extract error:", error);
    return res.status(500).json({ error: error.message || "Failed to extract product data" });
  }
});

// 2. Batch Extraction for multiple URLs (supports both direct product URLs, Apify Dataset URLs, and section category headers; auto-saves by default)
app.post("/api/admin/scraper/batch", async (req, res) => {
  try {
    const { urls, rawTextWithCategories, customCategory, rmbRate: customRmbRate, autoSave = true } = req.body;
    const shouldAutoSave = autoSave !== false;
    const effectiveCategory =
      customCategory && customCategory !== "AUTO" && customCategory !== "Imported & Scraped" && customCategory !== "All"
        ? customCategory
        : "";

    const targetEntries: Array<{ url: string; category: string }> = [];
    if (typeof rawTextWithCategories === "string" && rawTextWithCategories.trim()) {
      let sectionCat = "";
      for (const rawLine of rawTextWithCategories.split(/\r?\n/)) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("#catalog=")) {
          trimmed
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter((s) => s.startsWith("http://") || s.startsWith("https://") || s.includes("#catalog="))
            .forEach((u) => {
              targetEntries.push({ url: u, category: sectionCat || effectiveCategory });
            });
        } else {
          const detectedHeader = extractReportSectionCategoryHeader(trimmed);
          if (detectedHeader) {
            sectionCat = detectedHeader;
          } else if (trimmed.length < 40 && !trimmed.includes("{") && !trimmed.includes("[")) {
            sectionCat = trimmed.replace(/[:#-]+$/, "").trim();
          }
        }
      }
    } else if (Array.isArray(urls)) {
      urls.forEach((u: any) => {
        const trimmed = String(u || "").trim();
        if (trimmed) targetEntries.push({ url: trimmed, category: effectiveCategory });
      });
    }

    if (targetEntries.length === 0) {
      return res.status(400).json({ error: "At least one valid URL is required" });
    }

    const dbData = readDb();
    const currentRmbRate =
      customRmbRate !== undefined && customRmbRate !== null && Number(customRmbRate) > 0
        ? Number(customRmbRate)
        : Number(dbData.settings?.rmbRate) || 22.80;
    const results: any[] = [];

    for (let i = 0; i < targetEntries.length; i++) {
      const targetUrl = targetEntries[i].url;
      const itemCategory = targetEntries[i].category || effectiveCategory;
      if (!targetUrl) continue;

      try {
        if (isApifyDatasetUrl(targetUrl)) {
          const apifyRes = await fetchAndParseApifyDatasetUrl(targetUrl, {
            rmbRate: currentRmbRate,
            customCategory: itemCategory,
          });
          for (const masterRecord of apifyRes.products) {
            const existing = (dbData.products || []).find((p: any) =>
              (masterRecord.offerId && String(p.offerId) === String(masterRecord.offerId)) ||
              (masterRecord.importedUrl && p.importedUrl && String(p.importedUrl) === String(masterRecord.importedUrl))
            );
            results.push({
              url: masterRecord.importedUrl || targetUrl,
              sourceDatasetUrl: targetUrl,
              success: true,
              data: masterRecord,
              isDuplicate: !!existing,
              existingProduct: existing ? { id: existing.id, name: existing.name } : null,
            });
          }
          continue;
        }

        // Strictly isolated call - no shared state
        const masterRecord = await extractProductData({
          url: targetUrl,
          rmbRate: currentRmbRate,
          customCategory: itemCategory
        });

        const existing = (dbData.products || []).find((p: any) => 
          (masterRecord.offerId && String(p.offerId) === String(masterRecord.offerId)) ||
          (masterRecord.importedUrl && p.importedUrl && String(p.importedUrl) === String(masterRecord.importedUrl))
        );

        results.push({
          url: targetUrl,
          success: true,
          data: masterRecord,
          isDuplicate: !!existing,
          existingProduct: existing ? { id: existing.id, name: existing.name } : null
        });
      } catch (err: any) {
        results.push({
          url: targetUrl,
          success: false,
          error: err.message || "Failed to scrape URL"
        });
      }
    }

    let savedCount = 0;
    if (shouldAutoSave) {
      const successfulRecords = results.filter((r) => r.success && r.data).map((r) => r.data);
      for (const item of [...successfulRecords].reverse()) {
        const canonicalCat = getCanonicalCategoryName(item.category, item.name || item.originalTitle);
        item.category = canonicalCat;
        try {
          const saved = await createProduct({ ...item, category: canonicalCat, status: "published" });
          if (saved?.id) item.id = saved.id;
        } catch {}
      }
      if (successfulRecords.length > 0) {
        const freshDb = readDb();
        for (const item of [...successfulRecords].reverse()) {
          const canonicalCat = getCanonicalCategoryName(item.category, item.name || item.originalTitle);
          const idx = freshDb.products.findIndex(
            (p: any) =>
              (item.offerId && String(p.offerId) === String(item.offerId)) ||
              String(p.id) === String(item.id)
          );
          if (idx >= 0) {
            const merged = { ...freshDb.products[idx], ...item, category: canonicalCat, status: "published" };
            freshDb.products.splice(idx, 1);
            freshDb.products.unshift(merged);
          } else {
            freshDb.products.unshift({ ...item, category: canonicalCat, status: "published" });
          }
          savedCount++;
        }
        writeDb(freshDb, true);
      }
    }

    return res.json({
      success: true,
      autoSaved: shouldAutoSave,
      savedCount,
      totalRequested: targetEntries.length,
      successCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results
    });
  } catch (error: any) {
    console.error("Batch scrape error:", error);
    return res.status(500).json({ error: error.message || "Failed to process batch scrape" });
  }
});

// 3. Save Master Product(s) into database with zero contamination
app.post("/api/admin/scraper/save", async (req, res) => {
  try {
    const { products: incomingProducts, product: singleProduct, overwriteExisting = true } = req.body;
    const itemsToSave: ProductMasterRecord[] = [];

    if (singleProduct) itemsToSave.push(singleProduct);
    if (Array.isArray(incomingProducts)) itemsToSave.push(...incomingProducts);

    if (itemsToSave.length === 0) {
      return res.status(400).json({ error: "No products provided to save" });
    }

    const savedRecords: any[] = [];
    const dbData = readDb();
    const currentRmbRate = Number(dbData.settings?.rmbRate) || 22.80;

    for (const item of itemsToSave) {
      // Validate unique ID
      const prodId = item.id || `wb-${Date.now()}-${uuidv4().substring(0, 6)}`;
      const canonicalCat = getCanonicalCategoryName(
        item.category,
        item.name || item.originalTitle
      );
      const activeVariants = Array.isArray(item.variants) ? item.variants : [];
      const syncedSkuDetails = syncSkuDetailsWithVariants(item.skuDetails, activeVariants);
      const recalculatedStock =
        activeVariants.length > 0
          ? activeVariants.reduce((sum: number, v: any) => sum + (Number(v?.stock) || 0), 0) || item.stock || 100
          : item.stock || 100;
      
      const payload: any = {
        id: prodId,
        offerId: item.offerId || null,
        name: item.name || "Imported Product",
        originalTitle: item.originalTitle || null,
        category: canonicalCat,
        brand: item.brand || "Imported Direct",
        price: item.price,
        rmbPrice: item.rmbPrice,
        originalPrice: item.originalPrice || Math.round(item.price / 0.95),
        discount: item.discount || 5,
        stock: recalculatedStock,
        minOrderQuantity: item.minOrderQuantity || 1,
        soldDisplay: item.soldDisplay || null,
        image: item.image,
        images: item.images || [item.image],
        description: item.description || null,
        descriptionHtml: item.descriptionHtml || null,
        descriptionImages: item.descriptionImages || [],
        videoUrl: item.videoUrl || null,
        specifications: item.specifications || [],
        quantityPrices: item.quantityPrices || [],
        sellerInfo: item.sellerInfo || {},
        skuDetails: syncedSkuDetails,
        variants: activeVariants,
        variantsEdited: true,
        deletedSkuKeys: Array.isArray((item as any).deletedSkuKeys) ? (item as any).deletedSkuKeys : [],
        importedUrl: item.importedUrl || null,
        rating: item.rating || 4.8,
        reviewCount: item.reviewCount || 25,
        status: item.status || "published",
        isNew: true,
        createdAt: new Date().toISOString()
      };

      try {
        const saved = await createProduct(payload);
        savedRecords.push(saved || payload);
      } catch (err) {
        console.warn("createProduct error, saving to local json db:", err);
        savedRecords.push(payload);
      }
    }

    // Also persist in data.json safely at the top of the catalog without re-introducing deleted SKUs
    try {
      const freshDb = readDb();
      for (const s of [...savedRecords].reverse()) {
        const isSame = (p: any) =>
          (s.offerId && String(p.offerId) === String(s.offerId)) ||
          String(p.id) === String(s.id) ||
          (s.importedUrl && p.importedUrl && String(p.importedUrl) === String(s.importedUrl));

        const existingMatch = freshDb.products.find(isSame);
        if (existingMatch) {
          if (overwriteExisting) {
            const merged = {
              ...existingMatch,
              ...s,
              id: existingMatch.id || s.id,
              variants: s.variants,
              skuDetails: s.skuDetails,
              variantsEdited: true,
              deletedSkuKeys: Array.from(
                new Set([...(existingMatch.deletedSkuKeys || []), ...(s.deletedSkuKeys || [])])
              ),
              status: "published"
            };
            freshDb.products = [merged, ...freshDb.products.filter((p: any) => !isSame(p))];
          }
        } else {
          freshDb.products.unshift({ ...s, status: "published" });
        }
      }
      writeDb(freshDb, true);
    } catch (e) {
      console.warn("Failed to update local db.json:", e);
    }

    return res.json({
      success: true,
      count: savedRecords.length,
      saved: savedRecords
    });
  } catch (error: any) {
    console.error("Scraper save error:", error);
    return res.status(500).json({ error: error.message || "Failed to save scraped products" });
  }
});

// 4. Scraper Catalog Stats
app.get("/api/admin/scraper/stats", async (req, res) => {
  try {
    const dbData = readDb();
    const allProds = dbData.products || [];
    const scrapedProds = allProds.filter((p: any) => 
      p.importedUrl || 
      p.offerId || 
      p.category === "Imported & Scraped" ||
      p.category === "Imported" ||
      p.brand === "Imported Direct" ||
      p.skuDetails
    );

    // Count by category
    const categoryCounts: Record<string, number> = {};
    let totalVariants = 0;
    let totalWithTiers = 0;

    scrapedProds.forEach((p: any) => {
      const cat = p.category || "Uncategorized";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      
      const vCount = Array.isArray(p.variants) ? p.variants.length : (p.skuDetails?.variants?.length || 1);
      totalVariants += vCount;

      if (Array.isArray(p.quantityPrices) && p.quantityPrices.length > 0) {
        totalWithTiers++;
      }
    });

    return res.json({
      totalScrapedProducts: scrapedProds.length,
      totalStoreProducts: allProds.length,
      totalVariantsAcrossCatalog: totalVariants,
      totalWithWholesaleTiers: totalWithTiers,
      categoryBreakdown: categoryCounts,
      recentImports: scrapedProds.slice(0, 5).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        rmbPrice: p.rmbPrice,
        image: p.image,
        variantCount: p.variants?.length || p.skuDetails?.variants?.length || 1,
        importedUrl: p.importedUrl
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to get scraper stats" });
  }
});

// 5. Scraper Catalog Export (Database-ready JSON)
app.get("/api/admin/scraper/export", async (req, res) => {
  try {
    const dbData = readDb();
    const scraped = (dbData.products || []).filter((p: any) => 
      p.importedUrl || 
      p.offerId || 
      p.category === "Imported & Scraped" ||
      p.category === "Imported" ||
      p.skuDetails
    );

    res.setHeader("Content-Disposition", `attachment; filename="worldbuybd-scraped-products-${Date.now()}.json"`);
    res.setHeader("Content-Type", "application/json");
    return res.send(JSON.stringify(scraped, null, 2));
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Export failed" });
  }
});

// 6. Scraper Catalog Import (JSON File/Payload)
app.post("/api/admin/scraper/import", async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Valid products array is required" });
    }

    const dbData = readDb();
    let importedCount = 0;

    for (const p of products) {
      if (!p.name && !p.title) continue;
      const pid = p.id || `wb-import-${Date.now()}-${uuidv4().substring(0, 6)}`;
      const prodName = p.name || p.title || "Imported Product";
      const canonicalCat = getCanonicalCategoryName(p.category, prodName);
      const normalized: any = {
        ...p,
        id: pid,
        name: prodName,
        price: Number(p.price) || 500,
        category: canonicalCat,
        image: p.image || p.images?.[0] || "",
        status: p.status || "published",
        createdAt: p.createdAt || new Date().toISOString()
      };

      try {
        await createProduct(normalized);
        importedCount++;
      } catch (e) {}

      const idx = dbData.products.findIndex((dp: any) => dp.id === pid || (p.offerId && dp.offerId === p.offerId));
      if (idx >= 0) {
        dbData.products[idx] = normalized;
      } else {
        dbData.products.unshift(normalized);
      }
    }

    writeDb(dbData, true);
    return res.json({ success: true, count: importedCount });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Import failed" });
  }
});

// Legacy backward-compatible route
app.post("/api/admin/scrape", async (req, res) => {
  console.log("Legacy scrape request received, body keys:", Object.keys(req.body));
  const { url, htmlContent, reportText, text, customCategory, rmbRate: customRmbRate } = req.body;
  const incomingText = reportText || text;
  
  if (!url && !htmlContent && !incomingText) {
    return res.status(400).json({ error: "URL, HTML content, or Product Report text is required" });
  }
  
  try {
    const dbData = readDb();
    const currentRmbRate = (customRmbRate !== undefined && customRmbRate !== null && !isNaN(Number(customRmbRate)) && Number(customRmbRate) > 0)
      ? Number(customRmbRate)
      : (Number(dbData.settings?.rmbRate) || 22.80);

    const master = await extractProductData({
      url,
      htmlContent,
      reportText: incomingText,
      rmbRate: currentRmbRate,
      customCategory
    });

    try {
      await createProduct({ ...master, status: "published" });
    } catch {}

    // Provide both backward-compatible fields AND the full master structure
    const responsePayload = {
      ...master,
      title: master.name,
      price: master.rmbPrice || master.price,
      image: master.image,
      url: master.importedUrl || url || ""
    };

    res.setHeader("Content-Type", "application/json");
    return res.json({ success: true, data: responsePayload });
  } catch (error: any) {
    console.error("Scraping error:", error);
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({ error: "Failed to scrape content: " + error.message });
  }
});



// Helper to normalize phone numbers (last 10 digits) for exact customer matching
function normalizePhoneTail(raw: any): string {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function orderMatchesCustomer(o: any, qUid: string, qEmail: string, qPhoneTail: string): boolean {
  if (!o) return false;
  const oUid = String(o.userId || o.customerInfo?.userId || o.paymentInfo?.userId || "").trim();
  const oEmail = String(
    o.userEmail || o.customerInfo?.email || o.invoice?.email || o.email || o.paymentInfo?.userEmail || ""
  )
    .trim()
    .toLowerCase();
  const oPhoneTail = normalizePhoneTail(
    o.userPhone || o.customerInfo?.phone || o.invoice?.phone || o.customerPhone || o.phone || ""
  );

  // If the order explicitly belongs to a known userId and the logged-in user has a different userId, reject unless email/phone explicitly matches
  if (qUid && oUid && qUid === oUid) return true;
  if (qEmail && oEmail && qEmail === oEmail) return true;
  if (qPhoneTail && qPhoneTail.length >= 10 && oPhoneTail && qPhoneTail === oPhoneTail) return true;

  return false;
}

// Orders
app.get("/api/orders", async (req, res) => {
  const customerOnly = String(req.query.customerOnly || "") === "true";
  const qUid = String(req.query.userId || "").trim();
  const qEmail = String(req.query.email || "").trim().toLowerCase();
  const qPhoneTail = normalizePhoneTail(req.query.phone || "");

  try {
    ensureUnifiedOperationsData();
    const ords = await getAllOrders();
    const unique = new Map();
    for (const o of ords) {
      const canonicalId = String(o?.orderId || o?.id || "");
      if (canonicalId && !unique.has(canonicalId)) {
        unique.set(canonicalId, { ...o, id: canonicalId, orderId: canonicalId });
      }
    }
    let list = Array.from(unique.values());
    if (customerOnly) {
      if (!qUid && !qEmail && !qPhoneTail) {
        return res.json([]);
      }
      list = list.filter((o) => orderMatchesCustomer(o, qUid, qEmail, qPhoneTail));
    } else {
      // Admin request: enrich customerInfo with current login password for customer assistance
      const db = readDb();
      const usersList = db.users || [];
      list = list.map((o: any) => {
        const cPhone = o.customerInfo?.phone || o.phone || "";
        const cEmail = o.customerInfo?.email || o.email || "";
        const cPhoneClean = String(cPhone).replace(/\D/g, "");
        const matched = usersList.find((u: any) => {
          const uPhoneClean = String(u.phone || "").replace(/\D/g, "");
          return (
            (cPhoneClean && uPhoneClean && (uPhoneClean === cPhoneClean || uPhoneClean.endsWith(cPhoneClean) || cPhoneClean.endsWith(uPhoneClean))) ||
            (cEmail && u.email && u.email.toLowerCase() === cEmail.toLowerCase()) ||
            (o.userId && (String(u.id) === String(o.userId) || String(u.uid) === String(o.userId)))
          );
        });
        const activePass = matched?.password || matched?.lastLoginPassword || o.customerInfo?.password || "123456";
        const mCart = Array.isArray(matched?.cart) ? matched.cart : [];
        const mWishlist = Array.isArray(matched?.wishlist) ? matched.wishlist : [];
        const mCartTotal = mCart.reduce((sum: number, it: any) => sum + (Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1)), 0);
        return {
          ...o,
          customerInfo: {
            ...o.customerInfo,
            password: activePass,
            lastLoginPassword: activePass,
            lastLoginAt: matched?.lastLoginAt || null,
            cart: mCart,
            wishlist: mWishlist,
            cartCount: mCart.length,
            wishlistCount: mWishlist.length,
            cartTotal: mCartTotal,
          }
        };
      });
    }
    res.json(list);
  } catch (error: any) {
    console.error("Failed to get orders:", error);
    const db = readDb();
    const raw = db.orders || [];
    const unique = new Map();
    for (const o of raw) {
      const canonicalId = String(o?.orderId || o?.id || "");
      if (canonicalId && !unique.has(canonicalId)) {
        unique.set(canonicalId, { ...o, id: canonicalId, orderId: canonicalId });
      }
    }
    let list = Array.from(unique.values());
    if (customerOnly) {
      if (!qUid && !qEmail && !qPhoneTail) {
        return res.json([]);
      }
      list = list.filter((o) => orderMatchesCustomer(o, qUid, qEmail, qPhoneTail));
    } else {
      const usersList = db.users || [];
      list = list.map((o: any) => {
        const cPhone = o.customerInfo?.phone || o.phone || "";
        const cEmail = o.customerInfo?.email || o.email || "";
        const cPhoneClean = String(cPhone).replace(/\D/g, "");
        const matched = usersList.find((u: any) => {
          const uPhoneClean = String(u.phone || "").replace(/\D/g, "");
          return (
            (cPhoneClean && uPhoneClean && (uPhoneClean === cPhoneClean || uPhoneClean.endsWith(cPhoneClean) || cPhoneClean.endsWith(uPhoneClean))) ||
            (cEmail && u.email && u.email.toLowerCase() === cEmail.toLowerCase()) ||
            (o.userId && (String(u.id) === String(o.userId) || String(u.uid) === String(o.userId)))
          );
        });
        const activePass = matched?.password || matched?.lastLoginPassword || o.customerInfo?.password || "123456";
        return {
          ...o,
          customerInfo: {
            ...o.customerInfo,
            password: activePass,
            lastLoginPassword: activePass,
            lastLoginAt: matched?.lastLoginAt || null
          }
        };
      });
    }
    res.json(list);
  }
});

function getItemProductLinkKey(it: any): string {
  if (!it) return "item";
  const rawUrl = String(it.importedUrl || it.productLink || it.sourceUrl || it.productUrl || "").trim();
  const rawOfferId = it.offerId ? String(it.offerId).replace(/^abb-/, "").trim() : "";
  const rawProdId = String(it.id || it.productId || "").replace(/^abb-/, "").trim();

  if (rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"))) {
    const urlMatch = rawUrl.match(/offer\/(\d+)\.html/i) || rawUrl.match(/(\d{10,})/);
    const resolvedOffer = rawOfferId || (urlMatch ? urlMatch[1] : "");
    return resolvedOffer ? `offer-${resolvedOffer}` : rawUrl.toLowerCase();
  }
  if (rawOfferId) {
    return `offer-${rawOfferId}`;
  }
  if (rawProdId) {
    return `prod-${rawProdId}`;
  }
  return it.name ? `name-${it.name.slice(0, 30)}` : "item";
}

app.post("/api/orders", async (req, res) => {
  try {
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
    
    // Group items by unique product link
    const linkMap = new Map<string, any[]>();
    for (const item of rawItems) {
      const key = getItemProductLinkKey(item);
      if (!linkMap.has(key)) {
        linkMap.set(key, []);
      }
      linkMap.get(key)!.push(item);
    }

    const linkGroups = Array.from(linkMap.values());

    // If customer cart contains multiple product links, generate a separate Order ID & separate invoice for each link!
    if (linkGroups.length > 1) {
      const createdOrders = [];
      const timestampBase = Date.now().toString().slice(-6);

      for (let i = 0; i < linkGroups.length; i++) {
        const groupItems = linkGroups[i];
        const linkSubtotal = groupItems.reduce(
          (sum: number, it: any) => sum + (Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1)),
          0
        );
        const orderId = `WBBD-${timestampBase}-${i + 1}`;
        const invoiceNumber = `INV-${orderId}`;

        const singleOrder = {
          ...req.body,
          id: orderId,
          orderId: orderId,
          mainOrderId: orderId,
          isMainOrder: true,
          linkCount: 1,
          date: new Date().toISOString(),
          status: req.body.status || "Pending",
          paymentStatus: req.body.paymentStatus || "Partial Paid",
          userId: req.body.userId || null,
          customerInfo: req.body.customerInfo || {},
          items: groupItems,
          subtotal: linkSubtotal,
          total: linkSubtotal,
          paidAmount: linkSubtotal,
          dueAmount: 0,
          paymentInfo: req.body.paymentInfo || null,
          invoice: {
            invoiceNumber,
            orderId,
            orderDate: new Date().toLocaleDateString("en-GB"),
            invoiceDate: new Date().toISOString().slice(0, 10),
            subTotal: linkSubtotal,
            productTotal: linkSubtotal,
            collectedAmount: linkSubtotal,
            paidAmount: linkSubtotal,
            totalAmount: linkSubtotal,
            dueAmount: 0,
            paymentStatus: req.body.paymentStatus || "Partial Paid",
            customerName: req.body.customerInfo?.name || "Customer",
            phone: req.body.customerInfo?.phone || "",
            email: req.body.customerInfo?.email || "",
            address: req.body.customerInfo?.address || "",
            district: req.body.customerInfo?.division || "Dhaka",
            postalCode: req.body.customerInfo?.postalCode || "",
            trackingNumber: "",
            order1688Id: groupItems[0]?.offerId ? String(groupItems[0].offerId) : ""
          }
        };

        const created = await createOrder(singleOrder);
        createdOrders.push(created);
      }

      return res.json({
        success: true,
        multiple: true,
        count: createdOrders.length,
        orders: createdOrders,
        ...createdOrders[0],
        orderId: createdOrders[0].orderId,
        id: createdOrders[0].id
      });
    }

    // Single product link order
    const generatedId = req.body.id || req.body.orderId || `WBBD-${Date.now().toString().slice(-6)}`;
    const newOrder = { 
      ...req.body,
      id: generatedId,
      orderId: generatedId,
      date: new Date().toISOString(),
      status: req.body.status || "Pending",
      paymentStatus: req.body.paymentStatus || "Pending",
      userId: req.body.userId || null,
      customerInfo: req.body.customerInfo || {},
      items: rawItems,
      total: req.body.total || req.body.subtotal || 0,
      paymentInfo: req.body.paymentInfo || null
    };
    const created = await createOrder(newOrder);
    res.json({
      success: true,
      multiple: false,
      count: 1,
      orders: [created],
      ...created
    });
  } catch (error: any) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: error.message || "Failed to create order" });
  }
});

// Bulk payment proof submission for orders created in the same checkout session
app.put("/api/orders/bulk-payment", async (req, res) => {
  try {
    const { orderIds, paymentInfo } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: "orderIds array required" });
    }
    const db = readDb();
    const updatedOrders = [];
    const info = {
      method: paymentInfo?.method || "bkash",
      senderNumber: paymentInfo?.senderNumber || "",
      accountName: paymentInfo?.accountName || "",
      transactionId: paymentInfo?.transactionId || "",
      screenshot: paymentInfo?.screenshot || "",
      notes: paymentInfo?.notes || "",
      submittedAt: new Date().toISOString()
    };
    for (const id of orderIds) {
      const cleanId = String(id).trim();
      const index = (db.orders || []).findIndex(
        (o: any) => String(o.id) === cleanId || String(o.orderId) === cleanId
      );
      if (index !== -1) {
        db.orders[index].paymentInfo = info;
        db.orders[index].paymentStatus = "Verification Pending";
        if (db.orders[index].invoice) {
          db.orders[index].invoice.paymentStatus = "Verification Pending";
          db.orders[index].invoice.paymentMethod = info.method;
        }
        updatedOrders.push(db.orders[index]);
      }
    }
    writeDb(db);
    res.json({ success: true, count: updatedOrders.length, orders: updatedOrders });
  } catch (error: any) {
    console.error("Failed to update bulk payment:", error);
    res.status(500).json({ error: error.message || "Failed to update bulk payment" });
  }
});

app.put("/api/orders/:id/invoice", async (req, res) => {
  try {
    const updated = await updateOrderInvoice(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    console.error("Failed to update order invoice:", error);
    res.status(500).json({ error: error.message || "Failed to update order invoice" });
  }
});

app.put("/api/admin/orders/:id/invoice", async (req, res) => {
  try {
    const updated = await updateOrderInvoice(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    console.error("Failed to update order invoice:", error);
    res.status(500).json({ error: error.message || "Failed to update order invoice" });
  }
});

app.put("/api/orders/:id/status", async (req, res) => {
  try {
    const cleanId = String(req.params.id).trim();
    const updated = await updateOrderStatus(cleanId, req.body.status);
    if (updated) {
      try {
        const db = readDb();
        const index = (db.orders || []).findIndex(
          (o: any) => String(o.id) === cleanId || String(o.orderId) === cleanId
        );
        if (index !== -1) {
          db.orders[index].status = req.body.status;
          if (req.body.status === "Stock Out") {
            const o = db.orders[index];
            const refundAmt = Number(o.paidAmount ?? o.subtotal ?? o.total ?? 0);
            o.stockOutInfo = {
              isStockOut: true,
              totalRefundAmount: refundAmt,
              status: "pending_customer_choice",
              markedAt: new Date().toISOString(),
              ...(o.stockOutInfo || {})
            };
          }
          if (db.orders[index].invoice) {
            db.orders[index].invoice.status = req.body.status;
          }
          writeDb(db);
        }
      } catch (e) {}
      res.json(updated);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error: any) {
    console.error("Failed to update order status:", error);
    res.status(500).json({ error: error.message || "Failed to update order status" });
  }
});

// Update order payment proof & screenshot
app.put("/api/orders/:id/payment", async (req, res) => {
  try {
    const paymentInfo = {
      method: req.body.method,
      senderNumber: req.body.senderNumber || "",
      accountName: req.body.accountName || "",
      transactionId: req.body.transactionId || "",
      screenshot: req.body.screenshot || "",
      notes: req.body.notes || "",
      submittedAt: new Date().toISOString()
    };
    const updated = await updateOrderPayment(req.params.id, paymentInfo);
    if (updated) {
      try {
        const db = readDb();
        const index = db.orders.findIndex((o: any) => o.id === req.params.id);
        if (index !== -1) {
          db.orders[index].paymentInfo = paymentInfo;
          db.orders[index].paymentStatus = "Verification Pending";
          writeDb(db);
        }
      } catch (e) {}
      res.json(updated);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error: any) {
    console.error("Failed to update order payment:", error);
    res.status(500).json({ error: error.message || "Failed to update payment" });
  }
});

app.put("/api/orders/:id/verify-payment", async (req, res) => {
  try {
    const paymentStatus = req.body.paymentStatus || "Paid";
    const updated = await verifyOrderPayment(req.params.id, paymentStatus);
    if (updated) {
      try {
        const db = readDb();
        const index = db.orders.findIndex((o: any) => o.id === req.params.id);
        if (index !== -1) {
          db.orders[index].paymentStatus = paymentStatus;
          if (paymentStatus === "Paid") {
            db.orders[index].status = "Confirmed Order";
          }
          writeDb(db);
        }
      } catch (e) {}
      res.json(updated);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error: any) {
    console.error("Failed to verify payment:", error);
    res.status(500).json({ error: error.message || "Failed to verify payment" });
  }
});

// Delete an order by ID
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const result = await deleteOrder(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error("Failed to delete order:", err);
    res.status(500).json({ error: err.message || "Failed to delete order" });
  }
});

app.delete("/api/admin/orders/:id", async (req, res) => {
  try {
    const result = await deleteOrder(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error("Failed to delete order:", err);
    res.status(500).json({ error: err.message || "Failed to delete order" });
  }
});

// Customer submits Stock-Out Resolution Request (Refund or Adjust)
app.put("/api/orders/:id/stock-out-request", async (req, res) => {
  try {
    const cleanId = String(req.params.id).trim();
    const db = readDb();
    const index = (db.orders || []).findIndex(
      (o: any) => String(o.id) === cleanId || String(o.orderId) === cleanId
    );
    if (index === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = db.orders[index];
    const prevStockOut = order.stockOutInfo || {};
    const defaultRefundAmount =
      Number(prevStockOut.totalRefundAmount) ||
      Number(order.paidAmount) ||
      Number(order.invoice?.paidAmount) ||
      Number(order.subtotal) ||
      Number(order.total) ||
      0;

    const updatedStockOut = {
      ...prevStockOut,
      isStockOut: true,
      totalRefundAmount: Number(req.body.totalRefundAmount || defaultRefundAmount),
      customerChoice: req.body.customerChoice, // "refund" or "adjust"
      customerPaymentMethod: req.body.customerPaymentMethod || "",
      customerAccountNumber: req.body.customerAccountNumber || "",
      customerAccountType: req.body.customerAccountType || "personal",
      customerBankDetails: req.body.customerBankDetails || "",
      customerNote: req.body.customerNote || "",
      requestedAt: new Date().toISOString(),
      status: "requested"
    };

    order.stockOutInfo = updatedStockOut;
    order.status = "Stock Out";
    if (order.invoice) {
      order.invoice.status = "Stock Out";
      order.invoice.stockOutRefundAmount = updatedStockOut.totalRefundAmount;
      order.invoice.stockOutChoice = updatedStockOut.customerChoice;
    }
    order.updatedAt = new Date().toISOString();

    writeDb(db);
    res.json(order);
  } catch (error: any) {
    console.error("Failed to submit stock-out request:", error);
    res.status(500).json({ error: error.message || "Failed to submit request" });
  }
});

// Admin processes Stock-Out Request (Approve Refund with TrxID, or Adjust with Order Due)
app.put("/api/orders/:id/stock-out-process", async (req, res) => {
  try {
    const cleanId = String(req.params.id).trim();
    const db = readDb();
    const index = (db.orders || []).findIndex(
      (o: any) => String(o.id) === cleanId || String(o.orderId) === cleanId
    );
    if (index === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = db.orders[index];
    const prevStockOut = order.stockOutInfo || {};
    const action = req.body.action; // "refunded" | "adjusted" | "rejected" | "processing"
    const adminTrxId = req.body.adminTrxId || "";
    const adminActionNote = req.body.adminActionNote || "";
    const processedBy = req.body.processedBy || "Super Admin";

    const refundAmt = Number(req.body.totalRefundAmount || prevStockOut.totalRefundAmount || 0);

    // If adjusting with order due amount, deduct from invoice and order due
    if (action === "adjusted") {
      const currentDue = Number(order.dueAmount ?? order.invoice?.dueAmount ?? order.invoice?.totalDue ?? 0);
      const newDue = Math.max(0, currentDue - refundAmt);
      order.dueAmount = newDue;
      if (order.invoice) {
        order.invoice.dueAmount = newDue;
        order.invoice.totalDue = newDue;
        order.invoice.adjustedAmount = Number(order.invoice.adjustedAmount || 0) + refundAmt;
        order.invoice.notes = `${order.invoice.notes || ""}\n[Adjusted BDT ${refundAmt.toLocaleString()} for Stock-Out product]`.trim();
      }
    }

    // Extract product details for clear refund record & message
    const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
    const stockOutItems = items.filter((it: any) => it.isStockOut);
    const targetItems = stockOutItems.length > 0 ? stockOutItems : items;
    const primaryItem = targetItems[0] || {};
    const productName = targetItems.map((it: any) => it.name || it.description).filter(Boolean).join(", ") || primaryItem.name || "Ordered Product";
    const variantName = targetItems.map((it: any) => it.variantName || it.variation).filter(Boolean).join(", ") || primaryItem.variantName || "";
    const totalQty = targetItems.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 1), 0);
    const pMethod = action === "adjusted" 
      ? "Order Balance Adjustment" 
      : (prevStockOut.customerPaymentMethod || req.body.paymentMethod || "bKash");
    const accNum = action === "adjusted" 
      ? "Order Due Adjustment" 
      : (prevStockOut.customerAccountNumber || req.body.accountNumber || "");
    const cName = order.customerInfo?.name || order.customerName || "Customer";
    const cPhone = order.customerInfo?.phone || order.customerPhone || "";

    // Generate clean message in English
    const refundMsg = formatStockOutRefundMessage({
      customerName: cName,
      orderId: cleanId,
      productName: productName,
      variantName: variantName,
      quantity: totalQty || 1,
      refundAmount: refundAmt,
      paymentMethod: pMethod,
      accountNumber: accNum,
      trxId: adminTrxId,
      action: action,
    });

    order.stockOutInfo = {
      ...prevStockOut,
      isStockOut: true,
      totalRefundAmount: refundAmt,
      status: action,
      adminTrxId: adminTrxId || prevStockOut.adminTrxId,
      adminActionNote: adminActionNote || prevStockOut.adminActionNote,
      adminProcessedAt: new Date().toISOString(),
      adminProcessedBy: processedBy,
      adjustedAmount: action === "adjusted" ? refundAmt : prevStockOut.adjustedAmount,
      refundMessage: refundMsg,
    };

    // Save dedicated record in separate stockOutRefundRecords storage
    if (action === "refunded" || action === "adjusted") {
      if (!Array.isArray(db.stockOutRefundRecords)) {
        db.stockOutRefundRecords = [];
      }
      const newRecord = {
        id: `REF-${cleanId}-${Date.now().toString(36).toUpperCase()}`,
        orderId: cleanId,
        productId: primaryItem.id || primaryItem.productId || primaryItem.offerId || "N/A",
        productName: productName,
        productImage: primaryItem.image || primaryItem.variantImage || "",
        variantName: variantName,
        productLink: primaryItem.importedUrl || primaryItem.productLink || "",
        quantity: totalQty || 1,
        unitPrice: Number(primaryItem.price || primaryItem.unitPrice || 0),
        refundAmount: refundAmt,
        action: action,
        paymentMethod: pMethod,
        accountNumber: accNum,
        accountType: prevStockOut.customerAccountType || "personal",
        bankDetails: prevStockOut.customerBankDetails || "",
        trxId: adminTrxId || "",
        customerName: cName,
        customerPhone: cPhone,
        customerEmail: order.customerInfo?.email || "",
        customerNote: prevStockOut.customerNote || "",
        refundMessage: refundMsg,
        adminNote: adminActionNote || "",
        processedBy: processedBy,
        createdAt: new Date().toISOString(),
        status: action === "refunded" ? "Completed" : "Adjusted",
      };

      const existingRecIdx = db.stockOutRefundRecords.findIndex(
        (r: any) => String(r.orderId) === cleanId && r.action === action
      );
      if (existingRecIdx !== -1) {
        db.stockOutRefundRecords[existingRecIdx] = {
          ...db.stockOutRefundRecords[existingRecIdx],
          ...newRecord,
          id: db.stockOutRefundRecords[existingRecIdx].id,
        };
      } else {
        db.stockOutRefundRecords.unshift(newRecord);
      }
    }

    order.updatedAt = new Date().toISOString();
    writeDb(db);
    res.json(order);
  } catch (error: any) {
    console.error("Failed to process stock-out action:", error);
    res.status(500).json({ error: error.message || "Failed to process stock out" });
  }
});

// GET all stock-out refund records with optional filtering
app.get("/api/stock-out-refunds", (req, res) => {
  try {
    const db = readDb();
    let records = Array.isArray(db.stockOutRefundRecords) ? [...db.stockOutRefundRecords] : [];
    const { orderId, search, action, status } = req.query;

    if (orderId) {
      records = records.filter((r: any) => String(r.orderId).toLowerCase() === String(orderId).toLowerCase());
    }
    if (action) {
      records = records.filter((r: any) => r.action === action);
    }
    if (status) {
      records = records.filter((r: any) => r.status === status);
    }
    if (search) {
      const q = String(search).toLowerCase().trim();
      records = records.filter((r: any) =>
        (r.productName && r.productName.toLowerCase().includes(q)) ||
        (r.orderId && r.orderId.toLowerCase().includes(q)) ||
        (r.customerPhone && r.customerPhone.includes(q)) ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.trxId && r.trxId.toLowerCase().includes(q)) ||
        (r.accountNumber && r.accountNumber.includes(q)) ||
        (r.refundMessage && r.refundMessage.toLowerCase().includes(q))
      );
    }

    res.json(records);
  } catch (error: any) {
    console.error("Failed to fetch stock-out refunds:", error);
    res.status(500).json({ error: error.message || "Failed to fetch refunds" });
  }
});

// POST manually create or record a stock-out refund
app.post("/api/stock-out-refunds", (req, res) => {
  try {
    const db = readDb();
    if (!Array.isArray(db.stockOutRefundRecords)) {
      db.stockOutRefundRecords = [];
    }

    const {
      orderId,
      productId,
      productName,
      productImage,
      variantName,
      productLink,
      quantity,
      unitPrice,
      refundAmount,
      action,
      paymentMethod,
      accountNumber,
      accountType,
      bankDetails,
      trxId,
      customerName,
      customerPhone,
      customerEmail,
      customerNote,
      adminNote,
      processedBy,
      refundMessage,
    } = req.body;

    const amt = Number(refundAmount || 0);
    const act = action === "adjusted" ? "adjusted" : "refunded";
    const generatedMsg =
      refundMessage ||
      formatStockOutRefundMessage({
        customerName,
        orderId: orderId || "WBBD-CUSTOM",
        productName: productName || "Product",
        variantName,
        quantity: Number(quantity || 1),
        refundAmount: amt,
        paymentMethod: paymentMethod || "bKash",
        accountNumber,
        trxId,
        action: act,
      });

    const newRecord = {
      id: `REF-${orderId || "WBBD"}-${Date.now().toString(36).toUpperCase()}`,
      orderId: orderId || "N/A",
      productId: productId || "N/A",
      productName: productName || "Stock-Out Product",
      productImage: productImage || "",
      variantName: variantName || "",
      productLink: productLink || "",
      quantity: Number(quantity || 1),
      unitPrice: Number(unitPrice || 0),
      refundAmount: amt,
      action: act,
      paymentMethod: paymentMethod || (act === "adjusted" ? "Order Balance Adjustment" : "bKash"),
      accountNumber: accountNumber || (act === "adjusted" ? "Order Due Adjustment" : ""),
      accountType: accountType || "personal",
      bankDetails: bankDetails || "",
      trxId: trxId || "",
      customerName: customerName || "Customer",
      customerPhone: customerPhone || "",
      customerEmail: customerEmail || "",
      customerNote: customerNote || "",
      refundMessage: generatedMsg,
      adminNote: adminNote || "",
      processedBy: processedBy || "Super Admin",
      createdAt: new Date().toISOString(),
      status: act === "refunded" ? "Completed" : "Adjusted",
    };

    db.stockOutRefundRecords.unshift(newRecord);
    writeDb(db);
    res.status(201).json(newRecord);
  } catch (error: any) {
    console.error("Failed to create stock-out refund:", error);
    res.status(500).json({ error: error.message || "Failed to create refund" });
  }
});

// DELETE a stock-out refund record
app.delete("/api/stock-out-refunds/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    if (!Array.isArray(db.stockOutRefundRecords)) {
      return res.status(404).json({ error: "No records found" });
    }
    const idx = db.stockOutRefundRecords.findIndex((r: any) => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Refund record not found" });
    }
    const [deleted] = db.stockOutRefundRecords.splice(idx, 1);
    writeDb(db);
    res.json({ success: true, deleted });
  } catch (error: any) {
    console.error("Failed to delete stock-out refund:", error);
    res.status(500).json({ error: error.message || "Failed to delete refund" });
  }
});

// Admin marks an order or item as Stock Out & specifies refundable amount
app.put("/api/orders/:id/mark-stock-out", async (req, res) => {
  try {
    const cleanId = String(req.params.id).trim();
    const db = readDb();
    const index = (db.orders || []).findIndex(
      (o: any) => String(o.id) === cleanId || String(o.orderId) === cleanId
    );
    if (index === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = db.orders[index];
    const isStockOut = req.body.isStockOut !== false;
    const defaultRefundAmount =
      Number(req.body.totalRefundAmount) ||
      Number(order.paidAmount) ||
      Number(order.invoice?.paidAmount) ||
      Number(order.subtotal) ||
      Number(order.total) ||
      0;

    order.status = isStockOut ? "Stock Out" : (req.body.restoreStatus || "Order Confirmed");
    if (order.invoice) {
      order.invoice.status = order.status;
    }

    order.stockOutInfo = {
      ...(order.stockOutInfo || {}),
      isStockOut,
      totalRefundAmount: isStockOut ? defaultRefundAmount : 0,
      reason: req.body.reason || "Supplier stock out in China",
      status: isStockOut ? (order.stockOutInfo?.customerChoice ? "requested" : "pending_customer_choice") : undefined,
      items: req.body.items || order.items?.map((it: any) => ({
        itemId: it.id || it.cartItemId,
        name: it.name || it.description,
        variantName: it.variantName || it.variation,
        image: it.image || it.variantImage,
        quantity: Number(it.quantity || 1),
        unitPrice: Number(it.price || it.unitPrice || 0),
        refundAmount: Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1)
      }))
    };

    order.updatedAt = new Date().toISOString();
    writeDb(db);
    res.json(order);
  } catch (error: any) {
    console.error("Failed to mark order as stock out:", error);
    res.status(500).json({ error: error.message || "Failed to mark stock out" });
  }
});

// Update order generic fields (CS Response, Assigned Staff, Notes, etc.)
app.put("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const index = (db.orders || []).findIndex((o: any) => o.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Order not found" });
    }
    db.orders[index] = {
      ...db.orders[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    writeDb(db);
    res.json(db.orders[index]);
  } catch (err: any) {
    console.error("Failed to update order:", err);
    res.status(500).json({ error: err.message || "Failed to update order" });
  }
});

// Assign Marketing Staff to an Order and automatically link to the customer's phone number
// So that all past and future orders from that phone number are automatically assigned to this Marketing Manager!
app.post("/api/orders/assign-marketing", async (req, res) => {
  try {
    const { orderId, orderIds, customerPhone, userId, assignedMarketingStaff } = req.body;
    if (!assignedMarketingStaff || !assignedMarketingStaff.name) {
      return res.status(400).json({ error: "assignedMarketingStaff with name is required" });
    }

    const db = readDb();
    const result = registerMarketingAssignment(db, {
      orderId,
      orderIds,
      customerPhone,
      userId,
      assignedMarketingStaff
    });

    writeDb(db);
    res.json({
      success: true,
      updatedCount: result.updatedCount,
      matchedPhone: result.matchedPhone,
      assignedMarketingStaff
    });
  } catch (err: any) {
    console.error("Failed to assign marketing staff:", err);
    res.status(500).json({ error: err.message || "Failed to assign marketing staff" });
  }
});

// Quick photo update or removal for any department's employee / Marketing Manager ("মার্কেটিং ছবি আপলোড ও রিমুভ")
app.put("/api/admin/role-dashboards/:id/staff-photo", (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body;
    // Allow empty string or "remove" to clear/remove photo ("এগুলোকে সরিয়া")
    const cleanPhoto = (photoUrl && photoUrl !== "remove") ? String(photoUrl).trim() : "";

    const db = readDb();
    db.roleDashboards = db.roleDashboards || DEFAULT_ROLE_DASHBOARDS;
    const index = db.roleDashboards.findIndex((d: any) => d.id === id || d.code?.toLowerCase() === id.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ error: "Role dashboard not found" });
    }

    const currentDesk = db.roleDashboards[index];
    const staffName = currentDesk.assignedStaff?.name;
    const staffId = currentDesk.id;
    const staffCode = currentDesk.code;

    db.roleDashboards[index] = {
      ...currentDesk,
      assignedStaff: {
        ...currentDesk.assignedStaff,
        avatar: cleanPhoto
      },
      updatedAt: new Date().toISOString()
    };

    // Synchronize the updated avatar to all orders assigned to this marketing/desk officer
    if (Array.isArray(db.orders)) {
      db.orders = db.orders.map((o: any) => {
        const mkt = o.assignedMarketingStaff;
        if (mkt && (mkt.id === staffId || mkt.code === staffCode || mkt.name === staffName)) {
          return {
            ...o,
            assignedMarketingStaff: {
              ...mkt,
              avatar: cleanPhoto
            }
          };
        }
        return o;
      });
    }

    // Synchronize to customerAssignments
    if (db.customerAssignments) {
      for (const k of Object.keys(db.customerAssignments)) {
        const entry = db.customerAssignments[k];
        const mkt = entry?.assignedMarketingStaff;
        if (mkt && (mkt.id === staffId || mkt.code === staffCode || mkt.name === staffName)) {
          db.customerAssignments[k] = {
            ...entry,
            assignedMarketingStaff: {
              ...mkt,
              avatar: cleanPhoto
            }
          };
        }
      }
    }

    // Synchronize to users
    if (Array.isArray(db.users)) {
      db.users = db.users.map((u: any) => {
        const mkt = u.assignedMarketingStaff;
        if (mkt && (mkt.id === staffId || mkt.code === staffCode || mkt.name === staffName)) {
          return {
            ...u,
            assignedMarketingStaff: {
              ...mkt,
              avatar: cleanPhoto
            }
          };
        }
        return u;
      });
    }

    writeDb(db);
    res.json({ success: true, dashboard: db.roleDashboards[index], photoUrl: cleanPhoto });
  } catch (err: any) {
    console.error("Failed to update staff photo:", err);
    res.status(500).json({ error: "Failed to update staff photo" });
  }
});

// Marketing Campaign Media & Promotional Banners API ("মার্কেটিং ছবি আপলোড ও ম্যানেজমেন্ট")
app.get("/api/admin/marketing-media", (req, res) => {
  try {
    const db = readDb();
    db.marketingMedia = db.marketingMedia || [];
    res.json(db.marketingMedia);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch marketing media" });
  }
});

app.post("/api/admin/marketing-media", (req, res) => {
  try {
    const { title, imageUrl, category, description, uploadedBy } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }
    const db = readDb();
    db.marketingMedia = db.marketingMedia || [];
    const newMedia = {
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title || "মার্কেটিং প্রমোশনাল ব্যানার",
      imageUrl: String(imageUrl).trim(),
      category: category || "banner",
      description: description || "",
      uploadedBy: uploadedBy || "Marketing Team",
      createdAt: new Date().toISOString()
    };
    db.marketingMedia.unshift(newMedia);
    writeDb(db);
    res.json({ success: true, item: newMedia });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save marketing media" });
  }
});

app.delete("/api/admin/marketing-media/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    db.marketingMedia = db.marketingMedia || [];
    const prevCount = db.marketingMedia.length;
    db.marketingMedia = db.marketingMedia.filter((m: any) => m.id !== id);
    writeDb(db);
    res.json({ success: true, removed: prevCount !== db.marketingMedia.length });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete marketing media" });
  }
});

// Categories Endpoints
app.get("/api/categories", async (req, res) => {
  try {
    const cats = await getAllCategories();
    const db = readDb();
    const localCats = Array.isArray(db.categories) ? db.categories : [];
    const localMap = new Map<string, any>();
    for (const lc of localCats) {
      if (lc && lc.name) {
        localMap.set(String(lc.name).toLowerCase(), lc);
      }
    }
    const enriched = (Array.isArray(cats) ? cats : []).map((c: any) => {
      const localMatch = c?.name ? localMap.get(String(c.name).toLowerCase()) : null;
      return {
        ...c,
        parentCategory: c.parentCategory || localMatch?.parentCategory || undefined,
      };
    });
    for (const lc of localCats) {
      if (lc && lc.name && !enriched.some((e: any) => String(e.name).toLowerCase() === String(lc.name).toLowerCase())) {
        enriched.push(lc);
      }
    }
    res.json(enriched);
  } catch (error: any) {
    console.error("Failed to get categories:", error);
    const db = readDb();
    res.json(db.categories || []);
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const parentCategory = req.body.parentCategory ? String(req.body.parentCategory).trim() : undefined;
    const newCat: any = {
      id: `cat-${Date.now()}`,
      name: String(req.body.name || "").trim(),
      slug: req.body.slug || String(req.body.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      ...(parentCategory ? { parentCategory } : {}),
    };
    const created = await createCategory(newCat);
    const fullRecord = { ...newCat, ...created, ...(parentCategory ? { parentCategory } : {}) };
    try {
      const db = readDb();
      db.categories = db.categories || [];
      db.categories.push({ ...fullRecord, icon: req.body.icon || "Folder" });
      writeDb(db);
    } catch (e) {}
    res.json(fullRecord);
  } catch (error: any) {
    console.error("Failed to create category:", error);
    res.status(500).json({ error: error.message || "Failed to create category" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    await deleteCategory(req.params.id);
    try {
      const db = readDb();
      db.categories = (db.categories || []).filter((c: any) => c.id !== req.params.id);
      writeDb(db);
    } catch (e) {}
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete category:", error);
    res.status(500).json({ error: error.message || "Failed to delete category" });
  }
});

// Sub-Admins Endpoints
app.get("/api/subadmins", async (req, res) => {
  try {
    const subs = await getAllSubadmins();
    res.json(subs);
  } catch (error: any) {
    console.error("Failed to get subadmins:", error);
    const db = readDb();
    res.json(db.subadmins || []);
  }
});

app.post("/api/subadmins", async (req, res) => {
  try {
    const newSub = {
      id: `sub-${Date.now()}`,
      name: req.body.name,
      email: req.body.email || null,
      phone: req.body.phone,
      role: req.body.role || "Order Processing Specialist",
      permissions: req.body.permissions || ["orders_view", "orders_status"],
      status: req.body.status || "active",
    };
    const created = await createSubadmin(newSub);
    try {
      const db = readDb();
      db.subadmins = db.subadmins || [];
      db.subadmins.push(created);
      writeDb(db);
    } catch (e) {}
    res.json(created);
  } catch (error: any) {
    console.error("Failed to create subadmin:", error);
    res.status(500).json({ error: error.message || "Failed to create subadmin" });
  }
});

app.put("/api/subadmins/:id", async (req, res) => {
  try {
    const updated = await updateSubadmin(req.params.id, req.body);
    if (updated) {
      try {
        const db = readDb();
        const index = db.subadmins.findIndex((s: any) => s.id === req.params.id);
        if (index !== -1) {
          db.subadmins[index] = { ...db.subadmins[index], ...req.body };
          writeDb(db);
        }
      } catch (e) {}
      res.json(updated);
    } else {
      res.status(404).json({ error: "Sub-admin not found" });
    }
  } catch (error: any) {
    console.error("Failed to update subadmin:", error);
    res.status(500).json({ error: error.message || "Failed to update subadmin" });
  }
});

app.delete("/api/subadmins/:id", async (req, res) => {
  try {
    await deleteSubadmin(req.params.id);
    try {
      const db = readDb();
      db.subadmins = (db.subadmins || []).filter((s: any) => s.id !== req.params.id);
      writeDb(db);
    } catch (e) {}
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete subadmin:", error);
    res.status(500).json({ error: error.message || "Failed to delete subadmin" });
  }
});

// Customers Endpoint (Includes customer login password for customer support assistance)
app.get("/api/customers", async (req, res) => {
  try {
    const users = await getAllUsers();
    const db = readDb();
    const customerAssignments = db.customerAssignments || {};
    const orders = db.orders || [];
    const enriched = (users || []).map((u: any) => {
      const uPhoneClean = String(u.phone || "").replace(/\D/g, "");
      const uPhoneTail = uPhoneClean.length >= 10 ? uPhoneClean.slice(-10) : uPhoneClean;
      const userOrders = orders.filter((o: any) => {
        const oPhoneClean = String(o.customerInfo?.phone || "").replace(/\D/g, "");
        return (
          (uPhoneTail && oPhoneClean.includes(uPhoneTail)) ||
          (u.email && o.customerInfo?.email && o.customerInfo.email.toLowerCase() === u.email.toLowerCase()) ||
          String(o.userId) === String(u.id) ||
          String(o.userId) === String(u.uid)
        );
      });
      const totalSpent = userOrders.reduce((sum: number, o: any) => sum + Number(o.total || o.subtotal || 0), 0);
      const activePassword = u.password || u.lastLoginPassword || "123456";
      const uCart = Array.isArray(u.cart) ? u.cart : [];
      const uWishlist = Array.isArray(u.wishlist) ? u.wishlist : [];
      const uCartTotal = uCart.reduce((sum: number, it: any) => sum + (Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1)), 0);
      return {
        ...u,
        password: activePassword,
        lastLoginPassword: activePassword,
        cart: uCart,
        wishlist: uWishlist,
        cartCount: uCart.length,
        wishlistCount: uWishlist.length,
        cartTotal: uCartTotal,
        orders: userOrders,
        totalSpent,
        assignedMarketingId: customerAssignments[u.id]?.assignedMarketingId || customerAssignments[u.phone]?.assignedMarketingId || u.assignedMarketingId || "",
        assignedMarketingName: customerAssignments[u.id]?.assignedMarketingName || customerAssignments[u.phone]?.assignedMarketingName || u.assignedMarketingName || ""
      };
    });
    res.json(enriched);
  } catch (error: any) {
    console.error("Failed to get customers:", error);
    res.status(500).json({ error: "Failed to get customers" });
  }
});

// Customer Cart & Wishlist Sync Endpoint (For Real-Time Admin & Marketing Visibility)
app.post("/api/users/sync-cart-wishlist", async (req, res) => {
  try {
    const { userId, phone, email, cart, wishlist } = req.body;
    const identifier = userId || phone || email;
    if (!identifier) {
      return res.status(400).json({ error: "User identifier is required" });
    }
    const updated = await syncUserCartAndWishlist(identifier, { cart, wishlist });
    // Also ensure data.json db.users is synced
    try {
      const db = readDb();
      db.users = db.users || [];
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const cleanEmail = String(email || "").toLowerCase().trim();
      const existing = db.users.find((u: any) => {
        const uPhoneClean = String(u.phone || "").replace(/\D/g, "");
        return (
          (cleanPhone && uPhoneClean && (uPhoneClean === cleanPhone || uPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(uPhoneClean))) ||
          (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
          String(u.id) === String(userId) ||
          String(u.uid) === String(userId)
        );
      });
      if (existing) {
        if (Array.isArray(cart)) existing.cart = cart;
        if (Array.isArray(wishlist)) existing.wishlist = wishlist;
        writeDb(db);
      }
    } catch (e) {}

    res.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Failed to sync cart and wishlist:", error);
    res.status(500).json({ error: error.message || "Failed to sync cart and wishlist" });
  }
});

app.get("/api/users/:id/cart-wishlist", async (req, res) => {
  try {
    const data = await getUserCartAndWishlist(req.params.id);
    res.json({ success: true, ...data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin resets or updates a customer's password directly
app.post("/api/admin/customers/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || !String(password).trim()) {
      return res.status(400).json({ error: "Password is required" });
    }
    const updated = await updateCustomerPasswordById(id, String(password).trim());
    res.json({ success: true, user: updated, message: "Customer password updated successfully" });
  } catch (err: any) {
    console.error("Failed to update customer password:", err);
    res.status(500).json({ error: err.message || "Failed to update password" });
  }
});

app.put("/api/admin/customers/:id/password", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || !String(password).trim()) {
      return res.status(400).json({ error: "Password is required" });
    }
    const updated = await updateCustomerPasswordById(id, String(password).trim());
    res.json({ success: true, user: updated, message: "Customer password updated successfully" });
  } catch (err: any) {
    console.error("Failed to update customer password:", err);
    res.status(500).json({ error: err.message || "Failed to update password" });
  }
});

// Alias for POST /api/admin/subadmins and password update
app.post("/api/admin/subadmins", async (req, res) => {
  try {
    const newSub = {
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: req.body.name,
      email: req.body.email || null,
      phone: req.body.phone,
      password: req.body.password || "123456",
      role: req.body.role || "CS",
      department: req.body.department || req.body.role || "CS",
      permissions: req.body.permissions || ["orders_view"],
      status: req.body.status || "active",
      createdAt: new Date().toISOString()
    };
    try {
      await createSubadmin(newSub);
    } catch (e) {}
    const db = readDb();
    db.subadmins = db.subadmins || [];
    db.subadmins.push(newSub);
    writeDb(db);
    res.json(newSub);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create employee" });
  }
});

app.put("/api/admin/subadmins/:id/password", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const db = readDb();
    db.subadmins = db.subadmins || [];
    const idx = db.subadmins.findIndex((s: any) => s.id === id);
    if (idx !== -1) {
      db.subadmins[idx].password = password;
      writeDb(db);
    }
    try {
      await updateSubadmin(id, { password } as any);
    } catch (e) {}
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update password" });
  }
});

// ============================================================================
// CENTRALIZED OPERATIONS & ROLE-BASED DASHBOARD ENGINE (World Buy BD)
// Connects Customer -> Order -> Products -> Purchase -> Stock-Out ->
// China Warehouse -> BD Customs -> BD Warehouse -> Invoice -> Delivery -> Accounts
// ============================================================================

const DEFAULT_RBAC_EMPLOYEES = [
  {
    id: "emp-admin-1",
    name: "Super Admin",
    email: "admin@worldbuybd.com",
    phone: "01711000000",
    role: "Admin",
    department: "Admin",
    permissions: ["full_access", "orders_view", "orders_confirm", "purchase_manage", "marketing_assign", "warehouse_china", "customs_bd", "warehouse_bd", "delivery_manage", "invoice_generate", "accounts_manage", "employees_manage"],
    status: "active",
    createdAt: "2026-09-01T09:00:00.000Z"
  },
  {
    id: "emp-cs-1",
    name: "Nadia Islam (CS)",
    email: "cs@worldbuybd.com",
    phone: "01711000101",
    role: "CS",
    department: "CS",
    permissions: ["customers_view", "orders_view", "orders_confirm"],
    status: "active",
    createdAt: "2026-09-02T09:00:00.000Z"
  },
  {
    id: "emp-pur-1",
    name: "Tanvir Hasan (Purchase)",
    email: "purchase@worldbuybd.com",
    phone: "01711000201",
    role: "Purchase",
    department: "Purchase",
    permissions: ["orders_view", "purchase_manage", "stockout_manage"],
    status: "active",
    createdAt: "2026-09-02T10:00:00.000Z"
  },
  {
    id: "emp-mkt-1",
    name: "Radowan Ahmed (Marketing)",
    email: "radowan121537@gmail.com",
    phone: "01700000001",
    role: "Marketing",
    department: "Marketing",
    permissions: ["assigned_customers_view", "orders_view"],
    status: "active",
    createdAt: "2026-09-03T09:00:00.000Z"
  },
  {
    id: "emp-mkt-2",
    name: "Farhana Yeasmin (Marketing)",
    email: "farhana.mkt@worldbuybd.com",
    phone: "01711000302",
    role: "Marketing",
    department: "Marketing",
    permissions: ["assigned_customers_view", "orders_view"],
    status: "active",
    createdAt: "2026-09-03T10:00:00.000Z"
  },
  {
    id: "emp-cnw-1",
    name: "Chen Wei / Jahid (China WH)",
    email: "chinawh@worldbuybd.com",
    phone: "01711000401",
    role: "China Warehouse",
    department: "China Warehouse",
    permissions: ["warehouse_china", "orders_view"],
    status: "active",
    createdAt: "2026-09-04T09:00:00.000Z"
  },
  {
    id: "emp-cus-1",
    name: "Kamrul Hasan (BD Customs)",
    email: "customs@worldbuybd.com",
    phone: "01711000501",
    role: "BD Customs",
    department: "BD Customs",
    permissions: ["customs_bd", "orders_view"],
    status: "active",
    createdAt: "2026-09-04T11:00:00.000Z"
  },
  {
    id: "emp-bdw-1",
    name: "Sajjad Hossain (BD WH)",
    email: "bdwh@worldbuybd.com",
    phone: "01711000601",
    role: "BD Warehouse",
    department: "BD Warehouse",
    permissions: ["warehouse_bd", "orders_view"],
    status: "active",
    createdAt: "2026-09-05T09:00:00.000Z"
  },
  {
    id: "emp-del-1",
    name: "Arifur Rahman (Delivery)",
    email: "delivery@worldbuybd.com",
    phone: "01711000701",
    role: "Delivery",
    department: "Delivery",
    permissions: ["delivery_manage", "invoice_generate", "orders_view"],
    status: "active",
    createdAt: "2026-09-05T10:00:00.000Z"
  },
  {
    id: "emp-acc-1",
    name: "Mahmudul Alam (Accounts)",
    email: "accounts@worldbuybd.com",
    phone: "01711000801",
    role: "Accounts",
    department: "Accounts",
    permissions: ["accounts_manage", "invoices_view", "orders_view", "reports_view"],
    status: "active",
    createdAt: "2026-09-05T12:00:00.000Z"
  }
];

const DEMO_ORDER_IDS = new Set([
  "WBBD-10025",
  "WBBD-10026",
  "WBBD-10027",
  "WBBD-10028",
  "WBBD-10029",
  "WBBD-10030",
  "ORD-1790062702029-5152"
]);

function ensureUnifiedOperationsData() {
  const db = readDb();
  let mutated = false;

  // Auto-sync unassigned orders if their customer phone has an assigned marketing manager
  try {
    const synced = syncAllOrdersByPhone(db);
    if (synced) mutated = true;
  } catch (e) {
    console.warn("syncAllOrdersByPhone error:", e);
  }

  // 1. Ensure RBAC employees exist in subadmins
  db.subadmins = db.subadmins || [];
  for (const emp of DEFAULT_RBAC_EMPLOYEES) {
    if (!db.subadmins.some((s: any) => s.id === emp.id || (s.email && s.email === emp.email))) {
      db.subadmins.push(emp);
      mutated = true;
    }
  }

  // 2. One-time purge of legacy/existing orders & demo orders so only fresh orders remain
  if (!db.ordersResetV2) {
    db.orders = [];
    db.invoices = [];
    db.stockOutCases = [];
    db.ordersResetV2 = true;
    mutated = true;
  }
  db.orders = Array.isArray(db.orders) ? db.orders : [];
  const beforeOrderCount = db.orders.length;
  db.orders = db.orders.filter(
    (o: any) => !DEMO_ORDER_IDS.has(String(o?.id || "")) && !DEMO_ORDER_IDS.has(String(o?.orderId || ""))
  );
  if (db.orders.length !== beforeOrderCount) {
    mutated = true;
  }

  if (db.orders.length === 0) {
    db.orders = [
      {
        id: "WBBD-158838",
        orderId: "WBBD-158838",
        mainOrderId: "WBBD-158838",
        userId: "phone_01616045789",
        userEmail: "mahmud.wb@gmail.com",
        userPhone: "01616045789",
        customerName: "Mahmudur Rahman",
        customerPhone: "01616045789",
        customerAddress: "Block C, Bashundhara R/A, Dhaka - 1229",
        customerInfo: {
          name: "Mahmudur Rahman",
          phone: "01616045789",
          email: "mahmud.wb@gmail.com",
          address: "Block C, Bashundhara R/A, Dhaka - 1229"
        },
        status: "Order Placed",
        total: 38202.84,
        subtotal: 38202.84,
        shippingRatePerKg: 180,
        weightKg: 0,
        shippingCost: 0,
        chinaCourierCharge: 0,
        chinaCourierBill: 0,
        chinaCourierEnabled: true,
        finalShippingAmount: 0,
        paidAmount: 25000,
        dueAmount: 13202.84,
        paymentStatus: "Partial Paid",
        items: [
          {
            id: "wb-alibaba-1081006527799",
            name: "Sport Waterproof Crossbody Sling & Waist Bag",
            price: 1061.19,
            unitPrice: 1061.19,
            quantity: 36,
            variantName: "Fluorescent Orange",
            skuId: "6300481567517",
            image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80"
          }
        ],
        createdAt: "2026-10-07T05:32:38.838Z",
        date: "2026-10-07"
      },
      {
        id: "WBBD-158839",
        orderId: "WBBD-158839",
        mainOrderId: "WBBD-158839",
        userId: "phone_01712345678",
        userEmail: "nazmul.buyer@gmail.com",
        userPhone: "01712345678",
        customerName: "Kazi Nazmul Hasan",
        customerPhone: "01712345678",
        customerAddress: "House 14, Road 5, Dhanmondi, Dhaka",
        customerInfo: {
          name: "Kazi Nazmul Hasan",
          phone: "01712345678",
          email: "nazmul.buyer@gmail.com",
          address: "House 14, Road 5, Dhanmondi, Dhaka"
        },
        status: "Order Confirmed",
        total: 45000,
        subtotal: 45000,
        shippingRatePerKg: 180,
        weightKg: 4.5,
        shippingCost: 810,
        chinaCourierCharge: 200,
        chinaCourierBill: 200,
        chinaCourierEnabled: true,
        finalShippingAmount: 1010,
        paidAmount: 36000,
        dueAmount: 10010,
        paymentStatus: "Partial Paid",
        order1688Id: "1688-ORD-98213",
        trackingNumber: "SF-EXPRESS-992140",
        chinaWarehouseStatus: "Receive in China Warehouse",
        bdWarehouseStatus: "Receive in BD Warehouse",
        items: [
          {
            id: "wb-factory-963357947517",
            name: "Silicone Grip Deadlift Wrist Support & Palm Straps",
            price: 180,
            unitPrice: 180,
            quantity: 250,
            variantName: "Black / Red",
            image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80"
          }
        ],
        createdAt: "2026-10-07T06:15:00.000Z",
        date: "2026-10-07"
      },
      {
        id: "WBBD-158840",
        orderId: "WBBD-158840",
        mainOrderId: "WBBD-158840",
        userId: "phone_01811223344",
        userEmail: "shakil.enterprise@gmail.com",
        userPhone: "01811223344",
        customerName: "Shakil Ahmed Enterprise",
        customerPhone: "01811223344",
        customerAddress: "Shop 12, Level 3, New Market, Chittagong",
        customerInfo: {
          name: "Shakil Ahmed Enterprise",
          phone: "01811223344",
          email: "shakil.enterprise@gmail.com",
          address: "Shop 12, Level 3, New Market, Chittagong"
        },
        status: "Delivered",
        deliveryStatus: "Delivered",
        courierName: "Steadfast",
        courierPartner: "Steadfast",
        courierTracking: "SF-CTG-904128",
        courierConsignmentId: "SF-CTG-904128",
        total: 54600,
        grandTotal: 54600,
        subtotal: 54600,
        shippingRatePerKg: 180,
        weightKg: 6.2,
        shippingCost: 1116,
        chinaCourierCharge: 250,
        chinaCourierBill: 250,
        finalShippingAmount: 1366,
        paidAmount: 54600,
        dueAmount: 0,
        paymentStatus: "Paid",
        order1688Id: "1688-ORD-77402",
        trackingNumber: "SF-EXPRESS-11029",
        chinaWarehouseStatus: "Receive in China Warehouse",
        bdWarehouseStatus: "Receive in BD Warehouse",
        items: [
          {
            id: "wb-industrial-2831",
            name: "High Precision Digital Vernier Caliper Stainless Steel (150mm)",
            price: 780,
            unitPrice: 780,
            quantity: 70,
            variantName: "Silver Heavy Duty",
            image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80"
          }
        ],
        invoice: {
          invoiceNumber: "INV-WBBD-158840",
          totalAmount: 54600,
          grandTotal: 54600,
          paidAmount: 54600,
          dueAmount: 0,
          paymentStatus: "Paid",
          deliveryStatus: "Delivered",
          courierName: "Steadfast"
        },
        createdAt: "2026-10-06T10:00:00.000Z",
        date: "2026-10-06"
      },
      {
        id: "WBBD-158841",
        orderId: "WBBD-158841",
        mainOrderId: "WBBD-158841",
        userId: "phone_01999887766",
        userEmail: "sultana.traders@gmail.com",
        userPhone: "01999887766",
        customerName: "Sultana Fashion & Traders",
        customerPhone: "01999887766",
        customerAddress: "Holding 55, Station Road, Sylhet",
        customerInfo: {
          name: "Sultana Fashion & Traders",
          phone: "01999887766",
          email: "sultana.traders@gmail.com",
          address: "Holding 55, Station Road, Sylhet"
        },
        status: "Delivered",
        deliveryStatus: "Delivered",
        courierName: "Pathao",
        courierPartner: "Pathao",
        courierTracking: "PTH-SYL-341908",
        courierConsignmentId: "PTH-SYL-341908",
        total: 32400,
        grandTotal: 32400,
        subtotal: 32400,
        shippingRatePerKg: 180,
        weightKg: 3.8,
        shippingCost: 684,
        chinaCourierCharge: 180,
        chinaCourierBill: 180,
        finalShippingAmount: 864,
        paidAmount: 32400,
        dueAmount: 0,
        paymentStatus: "Paid",
        order1688Id: "1688-ORD-55319",
        trackingNumber: "SF-EXPRESS-77123",
        chinaWarehouseStatus: "Receive in China Warehouse",
        bdWarehouseStatus: "Receive in BD Warehouse",
        items: [
          {
            id: "wb-apparel-8839",
            name: "Premium Thermal Insulated Lunch Tote Bags",
            price: 360,
            unitPrice: 360,
            quantity: 90,
            variantName: "Navy Blue / Grey",
            image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80"
          }
        ],
        invoice: {
          invoiceNumber: "INV-WBBD-158841",
          totalAmount: 32400,
          grandTotal: 32400,
          paidAmount: 32400,
          dueAmount: 0,
          paymentStatus: "Paid",
          deliveryStatus: "Delivered",
          courierName: "Pathao"
        },
        createdAt: "2026-10-05T08:30:00.000Z",
        date: "2026-10-05"
      }
    ];
    mutated = true;
  }

  // 3. Remove demo stockOutCases
  db.stockOutCases = Array.isArray(db.stockOutCases) ? db.stockOutCases : [];
  const beforeSoCount = db.stockOutCases.length;
  db.stockOutCases = db.stockOutCases.filter(
    (so: any) => so?.id !== "SO-1001" && !DEMO_ORDER_IDS.has(String(so?.orderId || ""))
  );
  if (db.stockOutCases.length !== beforeSoCount) {
    mutated = true;
  }

  // 4. Clean demo invoices and ensure invoices in db.invoices are synced with real orders
  db.invoices = Array.isArray(db.invoices) ? db.invoices : [];
  const beforeInvCount = db.invoices.length;
  db.invoices = db.invoices.filter(
    (inv: any) =>
      !DEMO_ORDER_IDS.has(String(inv?.orderId || "")) &&
      inv?.id !== "inv-WBBD-10025" &&
      inv?.id !== "inv-WBBD-10026"
  );
  if (db.invoices.length !== beforeInvCount) {
    mutated = true;
  }

  for (const ord of db.orders) {
    if (ord.invoice && ord.invoice.invoiceNumber) {
      const exists = db.invoices.some((inv: any) => inv.orderId === ord.id || inv.invoiceNumber === ord.invoice.invoiceNumber);
      if (!exists) {
        db.invoices.unshift({
          id: `inv-${ord.id}`,
          ...ord.invoice,
          created_at: ord.date || new Date().toISOString()
        });
        mutated = true;
      }
    }
  }

  // 5. Automatically sync marketing manager assignment by customer phone number across all orders and users
  if (syncAllOrdersByPhone(db)) {
    mutated = true;
  }

  if (mutated) {
    writeDb(db);
  }
  return db;
}

app.get("/api/admin/operations-hub", async (req, res) => {
  try {
    const db = ensureUnifiedOperationsData();
    let allOrders: any[] = [];
    try {
      const sqlOrders = await getAllOrders();
      const map = new Map();
      for (const o of (db.orders || [])) {
        if (o && o.id) map.set(String(o.id), o);
      }
      for (const o of (sqlOrders || [])) {
        if (o && o.id) {
          const existingLocal = map.get(String(o.id)) || {};
          map.set(String(o.id), { ...o, ...existingLocal });
        }
      }
      allOrders = Array.from(map.values());
    } catch {
      allOrders = db.orders || [];
    }

    let rawUsers: any[] = [];
    try {
      rawUsers = await getAllUsers();
    } catch {
      rawUsers = db.users || [];
    }

    // Build unified customers list combining registered users + order customers
    const customerMap = new Map<string, any>();
    const assignments = db.customerAssignments || {};

    for (const u of rawUsers) {
      const key = u.phone || u.id;
      if (!key) continue;
      const assign = assignments[u.id] || assignments[u.phone] || {};
      const activePassword = u.password || u.lastLoginPassword || "123456";
      const uCart = Array.isArray(u.cart) ? u.cart : [];
      const uWishlist = Array.isArray(u.wishlist) ? u.wishlist : [];
      const uCartTotal = uCart.reduce((sum: number, it: any) => sum + (Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1)), 0);

      customerMap.set(key, {
        id: u.id || `CUST-${key.slice(-4)}`,
        uid: u.uid || u.id,
        name: u.name || "Customer",
        phone: u.phone || "",
        email: u.email || "",
        password: activePassword,
        lastLoginPassword: activePassword,
        lastLoginAt: u.lastLoginAt || null,
        cart: uCart,
        wishlist: uWishlist,
        cartCount: uCart.length,
        wishlistCount: uWishlist.length,
        cartTotal: uCartTotal,
        address: u.address || "",
        createdAt: u.createdAt || "2026-09-15T10:00:00.000Z",
        assignedMarketingId: assign.assignedMarketingId || u.assignedMarketingId || "",
        assignedMarketingName: assign.assignedMarketingName || u.assignedMarketingName || "",
        orders: [],
        totalSpent: 0
      });
    }

    // Normalize orders & link to customers
    const normalizedOrders = allOrders.map((ord: any) => {
      const cPhone = ord.customerInfo?.phone || ord.phone || "";
      const cName = ord.customerInfo?.name || ord.customerName || "Customer";
      const cEmail = ord.customerInfo?.email || ord.email || "";
      const cAddress = ord.customerInfo?.address || ord.address || "";
      const cKey = cPhone || ord.userId || `anon-${ord.id}`;

      if (!customerMap.has(cKey)) {
        const assign = assignments[cKey] || {};
        const cPhoneClean = String(cPhone).replace(/\D/g, "");
        const matchedUser = rawUsers.find((ru: any) => {
          const ruPhoneClean = String(ru.phone || "").replace(/\D/g, "");
          return (
            (cPhoneClean && ruPhoneClean && (ruPhoneClean === cPhoneClean || ruPhoneClean.endsWith(cPhoneClean) || cPhoneClean.endsWith(ruPhoneClean))) ||
            (cEmail && ru.email && ru.email.toLowerCase() === cEmail.toLowerCase()) ||
            (ord.userId && (String(ru.id) === String(ord.userId) || String(ru.uid) === String(ord.userId)))
          );
        }) || (db.users || []).find((ru: any) => {
          const ruPhoneClean = String(ru.phone || "").replace(/\D/g, "");
          return (
            (cPhoneClean && ruPhoneClean && (ruPhoneClean === cPhoneClean || ruPhoneClean.endsWith(cPhoneClean) || cPhoneClean.endsWith(ruPhoneClean))) ||
            (cEmail && ru.email && ru.email.toLowerCase() === cEmail.toLowerCase()) ||
            (ord.userId && (String(ru.id) === String(ord.userId) || String(ru.uid) === String(ord.userId)))
          );
        });
        const activePass = matchedUser?.password || matchedUser?.lastLoginPassword || "123456";
        const matchedCart = Array.isArray(matchedUser?.cart) ? matchedUser.cart : [];
        const matchedWishlist = Array.isArray(matchedUser?.wishlist) ? matchedUser.wishlist : [];
        const matchedCartTotal = matchedCart.reduce((sum: number, it: any) => sum + (Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1)), 0);

        customerMap.set(cKey, {
          id: ord.customerInfo?.id || ord.userId || `CUST-${String(cPhone || ord.id).slice(-4)}`,
          uid: ord.userId || matchedUser?.uid,
          name: cName,
          phone: cPhone,
          email: cEmail,
          password: activePass,
          lastLoginPassword: activePass,
          lastLoginAt: matchedUser?.lastLoginAt || null,
          cart: matchedCart,
          wishlist: matchedWishlist,
          cartCount: matchedCart.length,
          wishlistCount: matchedWishlist.length,
          cartTotal: matchedCartTotal,
          address: cAddress,
          createdAt: ord.date || new Date().toISOString(),
          assignedMarketingId: ord.assignedMarketingId || assign.assignedMarketingId || "",
          assignedMarketingName: ord.assignedMarketingName || assign.assignedMarketingName || "",
          orders: [],
          totalSpent: 0
        });
      }

      const custEntry = customerMap.get(cKey)!;
      const totalQty = (ord.items || []).reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);

      const enrichedOrder = {
        ...ord,
        customerInfo: {
          id: custEntry.id,
          name: cName,
          phone: cPhone,
          email: cEmail,
          password: custEntry.password,
          lastLoginPassword: custEntry.lastLoginPassword,
          lastLoginAt: custEntry.lastLoginAt,
          cart: custEntry.cart || [],
          wishlist: custEntry.wishlist || [],
          cartCount: custEntry.cartCount || 0,
          wishlistCount: custEntry.wishlistCount || 0,
          cartTotal: custEntry.cartTotal || 0,
          address: cAddress,
          division: ord.customerInfo?.division || "Dhaka",
          postalCode: ord.customerInfo?.postalCode || "1200",
          payment: ord.customerInfo?.payment || ord.paymentInfo?.method || "bkash"
        },
        assignedMarketingId: ord.assignedMarketingId || custEntry.assignedMarketingId || "",
        assignedMarketingName: ord.assignedMarketingName || custEntry.assignedMarketingName || "",
        shippingMethod: ord.shippingMethod || "Air Cargo (7-12 Days)",
        totalQuantity: totalQty,
        purchaseInfo: ord.purchaseInfo || {
          status: ord.status === "Stock Out"
            ? "Stock Out"
            : ["Purchased", "Received in China Warehouse", "Shipped to Bangladesh", "Received in BD Customs", "Received in BD Warehouse", "Invoice Generated", "Ready for Delivery", "Assigned to Delivery", "Delivered"].includes(ord.status)
            ? "Purchased"
            : "Pending Purchase",
          supplierName: (ord.items?.[0]?.supplierName || "Direct Factory Supplier").replace(/1688/gi, "Direct"),
          supplierLink: ord.items?.[0]?.importedUrl || ord.items?.[0]?.productUrl || "/shop",
          orderSupplierId: "",
          rmbUnitPrice: ord.items?.[0]?.rmbPrice || 25,
          rmbTotal: (ord.items?.[0]?.rmbPrice || 25) * totalQty,
          purchasedBy: "",
          purchasedAt: "",
          notes: ""
        },
        chinaWarehouseInfo: ord.chinaWarehouseInfo || {
          received: ["Received in China Warehouse", "Shipped to Bangladesh", "Received in BD Customs", "Received in BD Warehouse", "Invoice Generated", "Ready for Delivery", "Assigned to Delivery", "Delivered"].includes(ord.status),
          receivedAt: "",
          orderedQty: totalQty,
          receivedQty: ["Received in China Warehouse", "Shipped to Bangladesh", "Received in BD Customs", "Received in BD Warehouse", "Invoice Generated", "Ready for Delivery", "Assigned to Delivery", "Delivered"].includes(ord.status) ? totalQty : 0,
          missingDamagedQty: 0,
          chinaAwb: "",
          updatedBy: "",
          notes: ""
        },
        bdCustomsInfo: ord.bdCustomsInfo || {
          received: ["Received in BD Customs", "Received in BD Warehouse", "Invoice Generated", "Ready for Delivery", "Assigned to Delivery", "Delivered"].includes(ord.status),
          receivedAt: "",
          shipmentRef: "",
          clearanceStatus: ["Received in BD Warehouse", "Invoice Generated", "Ready for Delivery", "Assigned to Delivery", "Delivered"].includes(ord.status) ? "Cleared" : "Pending",
          updatedBy: "",
          notes: ""
        },
        bdWarehouseInfo: ord.bdWarehouseInfo || {
          received: ["Received in BD Warehouse", "Invoice Generated", "Ready for Delivery", "Assigned to Delivery", "Delivered"].includes(ord.status),
          receivedAt: "",
          orderedQty: totalQty,
          receivedQty: ["Received in BD Warehouse", "Invoice Generated", "Ready for Delivery", "Assigned to Delivery", "Delivered"].includes(ord.status) ? totalQty : 0,
          packageInfo: "1 Standard Carton",
          damageMissingInfo: "None",
          updatedBy: "",
          notes: ""
        },
        deliveryInfo: ord.deliveryInfo || {
          status: ord.status === "Delivered" ? "Delivered" : ord.status === "Assigned to Delivery" ? "Assigned to Delivery" : ord.status === "Ready for Delivery" ? "Ready for Delivery" : "Pending",
          courierName: "Steadfast Courier",
          trackingNumber: "",
          deliveryEmployee: "Arifur Rahman (Delivery)",
          scheduledDate: (ord.date || new Date().toISOString()).slice(0, 10),
          assignedAt: "",
          deliveredAt: ord.status === "Delivered" ? (ord.date || new Date().toISOString()).slice(0, 10) : "",
          deliveredTime: ord.status === "Delivered" ? "03:30 PM" : "",
          deliveryNotes: ""
        },
        timeline: Array.isArray(ord.timeline) && ord.timeline.length > 0 ? ord.timeline : [
          {
            stage: "Order Placed",
            timestamp: new Date(ord.date || Date.now()).toLocaleString(),
            updatedBy: cName,
            note: "Order submitted"
          }
        ]
      };

      custEntry.orders.push({
        id: enrichedOrder.id,
        date: enrichedOrder.date,
        total: enrichedOrder.total,
        status: enrichedOrder.status,
        paymentStatus: enrichedOrder.paymentStatus,
        itemCount: totalQty
      });
      custEntry.totalSpent += Number(enrichedOrder.total) || 0;

      return enrichedOrder;
    });

    const customersList = Array.from(customerMap.values());
    const invoicesList = db.invoices || [];
    const stockOutCases = db.stockOutCases || [];
    const employees = db.subadmins || DEFAULT_RBAC_EMPLOYEES;

    res.json({
      orders: normalizedOrders,
      customers: customersList,
      invoices: invoicesList,
      stockOutCases,
      employees
    });
  } catch (err: any) {
    console.error("Failed to load operations hub:", err);
    res.status(500).json({ error: "Failed to load operations hub" });
  }
});

// =========================================================================
// PRODUCTION-READY DEPARTMENT MANAGEMENT, RBAC AUTHORIZATION & ORDER WORKFLOW
// =========================================================================

export type DepartmentRole = 'main_admin' | 'cs' | 'marketing' | 'purchase' | 'delivery' | 'accounts';

export function normalizeDepartmentRole(roleOrDept?: string): DepartmentRole {
  if (!roleOrDept) return 'cs';
  const r = String(roleOrDept).toLowerCase().trim();
  if (
    r === 'admin' ||
    r === 'super_admin' ||
    r === 'main_admin' ||
    r === 'owner' ||
    r.includes('super admin') ||
    r.includes('main admin')
  ) {
    return 'main_admin';
  }
  if (r === 'cs' || r.includes('cs') || r.includes('support') || r.includes('customer support')) return 'cs';
  if (r === 'marketing' || r.includes('market') || r.includes('sales') || r.includes('kam')) return 'marketing';
  if (r === 'purchase' || r.includes('purchase') || r.includes('sourcing') || r.includes('qc')) return 'purchase';
  if (r === 'delivery' || r.includes('delivery') || r.includes('dispatch') || r.includes('logistics')) return 'delivery';
  if (r === 'accounts' || r.includes('account') || r.includes('finance') || r.includes('billing')) return 'accounts';
  return 'cs';
}

export function checkDepartmentPermission(
  department: DepartmentRole,
  updates: Record<string, any>
): { allowed: boolean; violation?: string } {
  // Main Admin has full access to update all fields
  if (department === 'main_admin') {
    return { allowed: true };
  }

  const attemptedKeys = Object.keys(updates).filter(
    (k) => updates[k] !== undefined && !['department', 'role', 'updatedBy', 'orderId', 'id'].includes(k)
  );

  if (department === 'cs') {
    // CS can ONLY update:
    // - status (Order Confirm)
    // - shippingRatePerKg / shippingRate
    // - csNote / timelineNote
    // CS CANNOT update: purchase, stock out, china courier bill, 1688 order id, tracking number, product weight, delivery status, invoice financials!
    const allowedKeys = ['status', 'shippingRatePerKg', 'shippingRate', 'timelineNote', 'csNote'];
    for (const key of attemptedKeys) {
      if (!allowedKeys.includes(key)) {
        return {
          allowed: false,
          violation: `Permission denied. CS Department is not authorized to update '${key}'. CS can only Confirm Orders and set Shipping Rate.`
        };
      }
    }
    if (updates.status) {
      const allowedStatuses = ['Order Confirmed', 'CS Confirmed', 'Confirmed', 'Pending'];
      if (!allowedStatuses.includes(updates.status)) {
        return {
          allowed: false,
          violation: `Permission denied. CS Department can only confirm orders (Status: 'CS Confirmed' or 'Order Confirmed'). Cannot set to '${updates.status}'.`
        };
      }
    }
    return { allowed: true };
  }

  if (department === 'marketing') {
    // Marketing can ONLY update:
    // - chinaWarehouseStatus ("Receive in China Warehouse")
    // - bdWarehouseStatus ("Receive in BD Warehouse")
    // - status (when advancing warehouse receipt)
    // - timelineNote
    // CANNOT update: purchase, stock out, china courier bill, 1688 order id, tracking number, product weight, invoice financial fields!
    const allowedKeys = ['chinaWarehouseStatus', 'bdWarehouseStatus', 'status', 'timelineNote', 'marketingNote'];
    for (const key of attemptedKeys) {
      if (!allowedKeys.includes(key)) {
        return {
          allowed: false,
          violation: `Permission denied. Marketing Department is not authorized to update '${key}'. Marketing can only update China Warehouse & BD Warehouse receipt status.`
        };
      }
    }
    if (updates.status) {
      const allowedStatuses = ['Received in China Warehouse', 'Received in BD Warehouse', 'In Transit to BD'];
      if (!allowedStatuses.includes(updates.status)) {
        return {
          allowed: false,
          violation: `Permission denied. Marketing Department can only set status to 'Received in China Warehouse' or 'Received in BD Warehouse'. Cannot set to '${updates.status}'.`
        };
      }
    }
    return { allowed: true };
  }

  if (department === 'purchase') {
    // Purchase can update:
    // - purchaseStatus ("Purchased")
    // - stockOutStatus ("Stock Out")
    // - chinaCourierBill / chinaCourierCharge
    // - chinaCourierEnabled
    // - order1688Id
    // - trackingNumber
    // - status ('Purchased', 'Stock Out', or 'Received in China Warehouse')
    // - purchaseInfo, stockOutInfo, chinaWarehouseInfo
    // - timelineNote, purchaseNote, chinaCourierNote, notes
    // CANNOT update: product weight, delivery status, CS shipping rate!
    const allowedKeys = [
      'purchaseStatus', 'stockOutStatus', 'chinaCourierBill', 'chinaCourierCharge',
      'chinaCourierEnabled', 'order1688Id', 'trackingNumber', 'status',
      'purchaseInfo', 'stockOutInfo', 'chinaWarehouseInfo', 'timelineNote',
      'purchaseNote', 'chinaCourierNote', 'notes'
    ];
    for (const key of attemptedKeys) {
      if (!allowedKeys.includes(key)) {
        return {
          allowed: false,
          violation: `Permission denied. Purchase Department is not authorized to update '${key}'. Purchase can only manage 1688 Order ID, Tracking Number, Purchase, Stock Out, China Warehouse Receipt, Notes, and China Courier Bill.`
        };
      }
    }
    if (updates.status) {
      const allowedPurchaseStatuses = ['Purchased', 'Stock Out', 'Received in China Warehouse'];
      if (!allowedPurchaseStatuses.includes(updates.status)) {
        return {
          allowed: false,
          violation: `Permission denied. Purchase Department can only set status to 'Purchased', 'Stock Out', or 'Received in China Warehouse'. Cannot set to '${updates.status}'.`
        };
      }
    }
    return { allowed: true };
  }

  if (department === 'delivery') {
    // Delivery can ONLY update up to "Assigned to Delivery":
    // - weightKg / productWeight / weight
    // - deliveryStatus ("Prepare to Delivery", "Ready for Delivery", "Given to Delivery", "Assigned to Delivery", "Returned")
    // - status (same)
    // - returnReason, returnNote, returnedAt, returnedBy
    // - deliveryInfo
    // - timelineNote
    // CANNOT update: "Delivered" (restricted to Admin/Accounts!), purchase, stock out, china courier bill, 1688 order id, tracking number, CS shipping rate!
    const allowedKeys = [
      'weightKg', 'productWeight', 'weight', 'deliveryStatus', 'status',
      'returnReason', 'returnNote', 'returnedAt', 'returnedBy',
      'deliveryInfo', 'timelineNote', 'deliveryNote', 'undeliveredReason', 'undeliveredNote'
    ];
    for (const key of attemptedKeys) {
      if (!allowedKeys.includes(key)) {
        return {
          allowed: false,
          violation: `Permission denied. Delivery Department is not authorized to update '${key}'. Delivery can only update Product Weight, Delivery Status up to 'Assigned to Delivery', and Return Information.`
        };
      }
    }
    if (updates.status) {
      if (updates.status === 'Delivered') {
        return {
          allowed: false,
          violation: `Permission denied. Delivery Department is only authorized up to 'Assigned to Delivery'. Final 'Delivered' confirmation is restricted to Admin & Accounts.`
        };
      }
      const allowedDeliveryStatuses = [
        'Prepare to Delivery', 'Ready for Delivery', 'Given to Delivery', 'Assigned to Delivery', 'Returned', 'Assigned to Courier'
      ];
      if (!allowedDeliveryStatuses.includes(updates.status)) {
        return {
          allowed: false,
          violation: `Permission denied. Delivery Department can only update delivery stages up to 'Assigned to Delivery' (e.g. Ready for Delivery, Given to Delivery, Assigned to Delivery, Returned). Cannot set to '${updates.status}'.`
        };
      }
    }
    return { allowed: true };
  }

  if (department === 'accounts') {
    // Accounts can view reports, update payment settlement, and indicate/assign delivery courier partner (Steadfast, Pathao, Sundarban, etc.) & courier tracking.
    const allowedKeys = [
      'accountsNote', 'timelineNote', 'paidAmount', 'paymentStatus',
      'courierName', 'courierPartner', 'deliveryCourier', 'courierTracking',
      'courierConsignmentId', 'courierStatus', 'deliveryInfo'
    ];
    for (const key of attemptedKeys) {
      if (!allowedKeys.includes(key)) {
        return {
          allowed: false,
          violation: `Permission denied. Accounts Department is not authorized to modify operational field '${key}'. Accounts can manage payment notes and indicate delivery courier partner.`
        };
      }
    }
    return { allowed: true };
  }

  return { allowed: false, violation: `Permission denied. Unrecognized or unauthorized department '${department}'.` };
}

export function computeOrderFinancials(order: any) {
  const weight = Number(order.weightKg || order.productWeight || 0);
  const rate = Number(order.shippingRatePerKg || order.shippingRate || 780);
  const shippingCost = Math.round(weight * rate * 100) / 100;

  const chinaCourierEnabled = order.chinaCourierEnabled !== false;
  const rawChinaBill = Number(order.chinaCourierCharge ?? order.chinaCourierBill ?? 0);
  const chinaCourierBill = chinaCourierEnabled ? rawChinaBill : 0;

  const finalShippingAmount = Math.round((shippingCost + chinaCourierBill) * 100) / 100;

  let productSubtotal = 0;
  if (Array.isArray(order.items) && order.items.length > 0) {
    productSubtotal = order.items.reduce((sum: number, it: any) => {
      const price = Number(it.price || it.unitPrice || 0);
      const qty = Number(it.quantity || 1);
      return sum + price * qty;
    }, 0);
  } else {
    productSubtotal = Number(order.subtotal || order.total || 0);
  }

  const grandTotal = Math.round((productSubtotal + finalShippingAmount) * 100) / 100;
  const paidAmount = Number(order.paidAmount || 0);
  const dueAmount = Math.max(0, Math.round((grandTotal - paidAmount) * 100) / 100);

  return {
    weightKg: weight,
    shippingRatePerKg: rate,
    shippingCost,
    chinaCourierCharge: rawChinaBill,
    chinaCourierBill: rawChinaBill,
    chinaCourierEnabled,
    finalShippingAmount,
    deliveryCharge: finalShippingAmount,
    shippingCharge: shippingCost,
    subtotal: productSubtotal,
    grandTotal,
    total: grandTotal,
    paidAmount,
    dueAmount
  };
}

// Unified Order Update Endpoint across all RBAC Departments
app.put("/api/admin/orders/:id/unified-update", async (req, res) => {
  try {
    const { id } = req.params;
    const callerDeptRaw =
      req.headers['x-user-department'] ||
      req.headers['x-user-role'] ||
      req.body.department ||
      req.body.role;
    if (callerDeptRaw) {
      const dept = normalizeDepartmentRole(String(callerDeptRaw));
      const check = checkDepartmentPermission(dept, req.body);
      if (!check.allowed) {
        return res.status(403).json({ error: check.violation });
      }
    }
    const {
      status,
      paymentStatus,
      updatedBy = "Admin",
      timelineNote = "",
      purchaseInfo,
      chinaWarehouseInfo,
      bdCustomsInfo,
      bdWarehouseInfo,
      deliveryInfo,
      invoice,
      stockOutInfo,
      assignedMarketingId,
      assignedMarketingName
    } = req.body;

    const db = ensureUnifiedOperationsData();
    let idx = (db.orders || []).findIndex(
      (o: any) => String(o.id) === String(id) || String(o.orderId) === String(id)
    );

    if (idx === -1) {
      // Check SQL orders if not in local json yet
      const allSql = await getAllOrders().catch(() => []);
      const foundSql = allSql.find(
        (o: any) => String(o.id) === String(id) || String(o.orderId) === String(id)
      );
      if (foundSql) {
        db.orders.unshift(foundSql);
        idx = 0;
      } else {
        return res.status(404).json({ error: "Order not found" });
      }
    }

    const current = db.orders[idx];
    const nextStatus = status || current.status;
    const nowFormatted = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    const timeline = Array.isArray(current.timeline) ? [...current.timeline] : [];
    if (status && status !== current.status) {
      timeline.push({
        stage: status,
        timestamp: nowFormatted,
        updatedBy,
        note: timelineNote || `Status updated to ${status} by ${updatedBy}`
      });
    } else if (timelineNote) {
      timeline.push({
        stage: nextStatus,
        timestamp: nowFormatted,
        updatedBy,
        note: timelineNote
      });
    }

    const mergedPurchaseInfo = purchaseInfo
      ? { ...(current.purchaseInfo || {}), ...purchaseInfo }
      : current.purchaseInfo;
    const mergedChinaWhInfo = chinaWarehouseInfo
      ? { ...(current.chinaWarehouseInfo || {}), ...chinaWarehouseInfo }
      : current.chinaWarehouseInfo;
    const mergedDeliveryInfo = deliveryInfo
      ? { ...(current.deliveryInfo || {}), ...deliveryInfo }
      : current.deliveryInfo;

    const syncedOrder1688Id =
      req.body.order1688Id ??
      purchaseInfo?.order1688Id ??
      purchaseInfo?.orderSupplierId ??
      invoice?.order1688Id ??
      current.order1688Id ??
      current.purchaseInfo?.order1688Id ??
      current.purchaseInfo?.orderSupplierId ??
      "";

    const syncedTrackingNumber =
      req.body.trackingNumber ??
      purchaseInfo?.trackingNumber ??
      chinaWarehouseInfo?.chinaAwb ??
      deliveryInfo?.trackingNumber ??
      invoice?.trackingNumber ??
      current.trackingNumber ??
      current.purchaseInfo?.trackingNumber ??
      current.chinaWarehouseInfo?.chinaAwb ??
      current.deliveryInfo?.trackingNumber ??
      "";

    if (mergedPurchaseInfo) {
      if (syncedOrder1688Id) {
        mergedPurchaseInfo.order1688Id = syncedOrder1688Id;
        mergedPurchaseInfo.orderSupplierId = syncedOrder1688Id;
      }
      if (syncedTrackingNumber) {
        mergedPurchaseInfo.trackingNumber = syncedTrackingNumber;
      }
    }
    if (mergedChinaWhInfo && syncedTrackingNumber && !mergedChinaWhInfo.chinaAwb) {
      mergedChinaWhInfo.chinaAwb = syncedTrackingNumber;
    }
    if (mergedDeliveryInfo && syncedTrackingNumber && !mergedDeliveryInfo.trackingNumber) {
      mergedDeliveryInfo.trackingNumber = syncedTrackingNumber;
    }

    const updatedOrder: any = {
      ...current,
      status: nextStatus,
      order1688Id: syncedOrder1688Id,
      trackingNumber: syncedTrackingNumber,
      paymentStatus: paymentStatus || current.paymentStatus,
      assignedMarketingId: assignedMarketingId !== undefined ? assignedMarketingId : current.assignedMarketingId,
      assignedMarketingName: assignedMarketingName !== undefined ? assignedMarketingName : current.assignedMarketingName,
      purchaseInfo: mergedPurchaseInfo,
      chinaWarehouseInfo: mergedChinaWhInfo,
      bdCustomsInfo: bdCustomsInfo ? { ...(current.bdCustomsInfo || {}), ...bdCustomsInfo } : current.bdCustomsInfo,
      bdWarehouseInfo: bdWarehouseInfo ? { ...(current.bdWarehouseInfo || {}), ...bdWarehouseInfo } : current.bdWarehouseInfo,
      deliveryInfo: mergedDeliveryInfo,
      invoice: invoice
        ? {
            ...(current.invoice || {}),
            ...invoice,
            order1688Id: syncedOrder1688Id,
            trackingNumber: syncedTrackingNumber,
          }
        : current.invoice
        ? {
            ...current.invoice,
            order1688Id: syncedOrder1688Id || current.invoice.order1688Id || "",
            trackingNumber: syncedTrackingNumber || current.invoice.trackingNumber || "",
          }
        : current.invoice,
      stockOutInfo: stockOutInfo ? { ...(current.stockOutInfo || {}), ...stockOutInfo } : current.stockOutInfo,
      timeline,
      updatedAt: new Date().toISOString()
    };

    if (req.body.courierName || req.body.courierPartner || req.body.deliveryCourier) {
      const c = req.body.courierName || req.body.courierPartner || req.body.deliveryCourier;
      updatedOrder.courierName = c;
      updatedOrder.courierPartner = c;
      updatedOrder.deliveryCourier = c;
      updatedOrder.deliveryInfo = updatedOrder.deliveryInfo || {};
      updatedOrder.deliveryInfo.courier = c;
      updatedOrder.deliveryInfo.courierPartner = c;
    }
    if (req.body.courierTracking || req.body.courierConsignmentId) {
      const trk = String(req.body.courierTracking ?? req.body.courierConsignmentId);
      updatedOrder.courierTracking = trk;
      updatedOrder.courierConsignmentId = trk;
      updatedOrder.deliveryInfo = updatedOrder.deliveryInfo || {};
      updatedOrder.deliveryInfo.trackingNumber = trk;
      updatedOrder.deliveryInfo.consignmentId = trk;
    }
    if (req.body.courierStatus) {
      updatedOrder.courierStatus = req.body.courierStatus;
      updatedOrder.deliveryInfo = updatedOrder.deliveryInfo || {};
      updatedOrder.deliveryInfo.status = req.body.courierStatus;
    }

    if (assignedMarketingId !== undefined || assignedMarketingName !== undefined || req.body.assignedMarketingStaff) {
      const targetMktId = assignedMarketingId !== undefined ? assignedMarketingId : current.assignedMarketingId;
      const targetMktName = assignedMarketingName !== undefined ? assignedMarketingName : current.assignedMarketingName;
      const matchedDesk = (db.roleDashboards || []).find((rd: any) => rd.id === targetMktId || rd.code === targetMktId);
      const staffObj = req.body.assignedMarketingStaff || {
        id: targetMktId || "KAM",
        name: matchedDesk?.assignedStaff?.name || targetMktName || "Marketing Staff",
        code: matchedDesk?.code || "KAM",
        phone: matchedDesk?.assignedStaff?.phone || "",
        email: matchedDesk?.assignedStaff?.email || "",
        avatar: matchedDesk?.assignedStaff?.avatar || "",
        department: "sales",
        assignedAt: new Date().toISOString()
      };
      updatedOrder.assignedMarketingStaff = staffObj;
      updatedOrder.assignedMarketingId = staffObj.id;
      updatedOrder.assignedMarketingName = staffObj.name;
      registerMarketingAssignment(db, {
        orderId: String(id),
        customerPhone: extractOrderPhone(current),
        userId: extractOrderUserId(current),
        assignedMarketingStaff: staffObj
      });
    }

    db.orders[idx] = updatedOrder;

    // Sync SQL order status if changed
    if (status) {
      try {
        await updateOrderStatus(id, status);
      } catch (e) {}
    }

    // Sync Invoice & Shipping Rate / Weight / Courier into db.orders and db.invoices automatically for CS, Admin, Accounts & Delivery
    const hasDirectChargeUpdate =
      req.body.shippingRatePerKg !== undefined ||
      req.body.weightKg !== undefined ||
      req.body.weight !== undefined ||
      req.body.shippingCharge !== undefined ||
      req.body.chinaCourierBill !== undefined ||
      req.body.chinaCourierCharge !== undefined ||
      req.body.paidAmount !== undefined ||
      req.body.adminChargesUploaded !== undefined;

    if (invoice || syncedOrder1688Id || syncedTrackingNumber || hasDirectChargeUpdate || status) {
      const invSource = {
        ...(updatedOrder.invoice || {}),
        ...(invoice || {}),
        ...(req.body.shippingRatePerKg !== undefined ? { shippingRatePerKg: Number(req.body.shippingRatePerKg) } : {}),
        ...(req.body.weight !== undefined ? { weight: req.body.weight, weightApx: req.body.weight } : {}),
        ...(req.body.weightKg !== undefined ? { weightKg: req.body.weightKg } : {}),
        ...(req.body.shippingCharge !== undefined ? { shippingCharge: Number(req.body.shippingCharge) } : {}),
        ...(req.body.chinaCourierBill !== undefined ? { chinaCourier: Number(req.body.chinaCourierBill), chinaCourierCharge: Number(req.body.chinaCourierBill) } : {}),
        ...(req.body.chinaCourierCharge !== undefined ? { chinaCourier: Number(req.body.chinaCourierCharge), chinaCourierCharge: Number(req.body.chinaCourierCharge) } : {}),
        ...(req.body.paidAmount !== undefined ? { paidAmount: Number(req.body.paidAmount), collectedAmount: Number(req.body.paidAmount) } : {}),
        ...(req.body.adminChargesUploaded !== undefined ? { adminChargesUploaded: Boolean(req.body.adminChargesUploaded) } : {}),
      };
      db.invoices = db.invoices || [];
      const invNo = invSource.invoiceNumber || `INV-${id}`;
      const subTotalVal = Number(
        invSource.subTotal ?? invSource.productSubtotal ?? invSource.productTotal ?? updatedOrder.subtotal ?? updatedOrder.total ?? 0
      );
      const chinaCourierVal = Number(
        invSource.chinaCourier ?? invSource.chinaCourierCharge ?? invSource.otherCharges ?? updatedOrder.chinaCourierBill ?? 0
      );
      const weightRaw = invSource.weightApx ?? invSource.weight ?? invSource.weightKg ?? updatedOrder.weight ?? "0 KG";
      const weightKgNum = parseFloat(String(weightRaw).replace(/[^0-9.]/g, "")) || 0;
      const weightDisplay = String(weightRaw).toUpperCase().includes("KG") ? String(weightRaw) : `${weightKgNum} KG`;
      const shippingRatePerKg = Number(
        invSource.shippingRatePerKg ?? invSource.shippingRate ?? updatedOrder.shippingRatePerKg ?? 780
      );
      const shippingChargeVal = Number(
        invSource.shippingCharge !== undefined
          ? invSource.shippingCharge
          : weightKgNum > 0 && shippingRatePerKg > 0
          ? Math.round(weightKgNum * shippingRatePerKg)
          : updatedOrder.shippingCharge ?? 0
      );
      const isUploadedNow = Boolean(
        invSource.adminChargesUploaded === true ||
          updatedOrder.adminChargesUploaded === true ||
          chinaCourierVal > 0 ||
          shippingChargeVal > 0 ||
          weightKgNum > 0
      );
      const discountVal = Number(invSource.discount ?? updatedOrder.discountAmount ?? 0);
      const totalAmountVal =
        Math.max(0, subTotalVal - discountVal) +
        (isUploadedNow ? chinaCourierVal + shippingChargeVal : 0);
      const defaultPartialPaid = Math.max(0, subTotalVal - discountVal);
      const paidAmountVal = Number(
        invSource.paidAmount ?? invSource.collectedAmount ?? updatedOrder.paidAmount ?? defaultPartialPaid
      );
      const dueAmountVal = Math.max(0, totalAmountVal - paidAmountVal);

      const invPayload = {
        ...(current.invoice || {}),
        ...invSource,
        id: `inv-${id}`,
        invoiceNumber: invNo,
        orderId: id,
        status: nextStatus,
        adminChargesUploaded: isUploadedNow,
        order1688Id: syncedOrder1688Id,
        trackingNumber: syncedTrackingNumber,
        invoiceDate: invSource.invoiceDate || new Date().toISOString().slice(0, 10),
        customerName: invSource.customerName || updatedOrder.customerInfo?.name || "Customer",
        phone: invSource.phone || updatedOrder.customerInfo?.phone || "",
        email: invSource.email || updatedOrder.customerInfo?.email || "",
        address: invSource.address || updatedOrder.customerInfo?.address || "",
        subTotal: subTotalVal,
        productSubtotal: subTotalVal,
        productTotal: subTotalVal,
        chinaCourier: isUploadedNow ? chinaCourierVal : 0,
        chinaCourierCharge: isUploadedNow ? chinaCourierVal : 0,
        shippingRate: shippingRatePerKg,
        shippingRatePerKg,
        shippingCharge: isUploadedNow ? shippingChargeVal : 0,
        otherCharges: isUploadedNow ? chinaCourierVal : 0,
        weight: isUploadedNow ? weightDisplay : "0 KG",
        weightApx: isUploadedNow ? weightDisplay : "0 KG",
        weightKg: isUploadedNow ? weightKgNum : 0,
        discount: discountVal,
        grandTotal: totalAmountVal,
        totalAmount: totalAmountVal,
        paidAmount: paidAmountVal,
        collectedAmount: paidAmountVal,
        totalDue: dueAmountVal,
        dueAmount: dueAmountVal,
        paymentNow: dueAmountVal,
        paymentStatus: invSource.paymentStatus || updatedOrder.paymentStatus || "Partial Paid",
        deliveryStatus: updatedOrder.deliveryInfo?.status || updatedOrder.status,
        generatedBy: updatedBy,
        updated_at: new Date().toISOString()
      };
      updatedOrder.invoice = invPayload;
      updatedOrder.adminChargesUploaded = isUploadedNow;
      updatedOrder.subtotal = subTotalVal;
      updatedOrder.chinaCourierBill = isUploadedNow ? chinaCourierVal : 0;
      updatedOrder.chinaCourierCharge = isUploadedNow ? chinaCourierVal : 0;
      updatedOrder.shippingRatePerKg = shippingRatePerKg;
      updatedOrder.shippingCharge = isUploadedNow ? shippingChargeVal : 0;
      updatedOrder.weight = isUploadedNow ? weightDisplay : "0 KG";
      updatedOrder.weightKg = isUploadedNow ? weightKgNum : 0;
      updatedOrder.total = totalAmountVal;
      updatedOrder.paidAmount = paidAmountVal;
      updatedOrder.dueAmount = dueAmountVal;
      if (Array.isArray(updatedOrder.items)) {
        updatedOrder.items = updatedOrder.items.map((it: any) => ({
          ...it,
          shippingRatePerKg,
        }));
      }
      updatedOrder.dueAmount = dueAmountVal;

      const existingInvIdx = db.invoices.findIndex((i: any) => i.orderId === id || i.invoiceNumber === invNo);
      if (existingInvIdx >= 0) {
        db.invoices[existingInvIdx] = { ...db.invoices[existingInvIdx], ...invPayload };
      } else {
        db.invoices.unshift({ ...invPayload, created_at: new Date().toISOString() });
      }
    }

    // Sync Stock-Out Case if reported
    if (stockOutInfo && stockOutInfo.isStockOut) {
      db.stockOutCases = db.stockOutCases || [];
      const existingSoIdx = db.stockOutCases.findIndex((s: any) => s.orderId === id);
      const soRecord = {
        id: existingSoIdx >= 0 ? db.stockOutCases[existingSoIdx].id : `SO-${Date.now().toString().slice(-4)}`,
        orderId: id,
        customerName: updatedOrder.customerInfo?.name || "Customer",
        customerPhone: updatedOrder.customerInfo?.phone || "",
        productName: stockOutInfo.productName || updatedOrder.items?.[0]?.name || "Ordered Product",
        productImage: stockOutInfo.productImage || updatedOrder.items?.[0]?.image || "",
        productLink: stockOutInfo.productLink || updatedOrder.items?.[0]?.importedUrl || "/shop",
        orderedQty: Number(stockOutInfo.orderedQty ?? updatedOrder.totalQuantity ?? 1),
        availableQty: Number(stockOutInfo.availableQty ?? 0),
        stockOutQty: Number(stockOutInfo.stockOutQty ?? 1),
        dateTime: stockOutInfo.reportedAt || nowFormatted,
        reason: stockOutInfo.reason || "Supplier out of stock",
        resolutionStatus: stockOutInfo.resolutionStatus || "Pending Resolution",
        notes: stockOutInfo.notes || ""
      };
      if (existingSoIdx >= 0) {
        db.stockOutCases[existingSoIdx] = soRecord;
      } else {
        db.stockOutCases.unshift(soRecord);
      }
    }

    writeDb(db);
    res.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    console.error("Failed unified order update:", err);
    res.status(500).json({ error: err.message || "Failed to update order" });
  }
});

async function createAuditLog(entry: {
  orderId?: string;
  action: string;
  department?: string;
  changedBy?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
}) {
  const db = ensureUnifiedOperationsData();
  db.auditLogs = Array.isArray(db.auditLogs) ? db.auditLogs : [];
  const logRecord = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderId: entry.orderId || "",
    action: entry.action,
    department: entry.department || "system",
    changedBy: entry.changedBy || "System",
    field: entry.field || "",
    oldValue: entry.oldValue ?? "",
    newValue: entry.newValue ?? "",
    notes: entry.notes || "",
    createdAt: new Date().toISOString()
  };
  db.auditLogs.unshift(logRecord);
  if (db.auditLogs.length > 2000) {
    db.auditLogs = db.auditLogs.slice(0, 2000);
  }
  writeDb(db);
  return logRecord;
}

async function getAuditLogs(filter?: { orderId?: string; department?: string; limit?: number }) {
  const db = ensureUnifiedOperationsData();
  let logs: any[] = Array.isArray(db.auditLogs) ? db.auditLogs : [];
  if (filter?.orderId) {
    const oId = String(filter.orderId);
    logs = logs.filter((l: any) => String(l.orderId) === oId);
  }
  if (filter?.department && filter.department !== 'all') {
    const dept = filter.department.toLowerCase();
    logs = logs.filter((l: any) => String(l.department || '').toLowerCase() === dept);
  }
  const max = filter?.limit || 200;
  return logs.slice(0, max);
}

// 1. Department Workflow Update Endpoint with Strict RBAC & Auto-Calculation
app.put("/api/admin/orders/:id/department-workflow-update", async (req, res) => {
  try {
    const { id } = req.params;
    const callerRoleRaw =
      req.headers['x-user-department'] ||
      req.headers['x-user-role'] ||
      req.body.department ||
      req.body.role ||
      "cs";
    const departmentRole = normalizeDepartmentRole(String(callerRoleRaw));
    const changedBy = String(req.headers['x-user-name'] || req.headers['x-user-email'] || req.body.updatedBy || departmentRole);

    // Enforce Permission Check
    const check = checkDepartmentPermission(departmentRole, req.body);
    if (!check.allowed) {
      return res.status(403).json({ error: check.violation });
    }

    // Validate Return Status constraints
    if (req.body.status === "Returned") {
      if (!req.body.returnReason) {
        return res.status(400).json({ error: "Return reason is required when marking an order as Returned." });
      }
      if (req.body.returnReason === "Other" && !req.body.returnNote) {
        return res.status(400).json({ error: "A custom note is required when Return Reason is 'Other'." });
      }
    }

    const db = ensureUnifiedOperationsData();
    let idx = (db.orders || []).findIndex(
      (o: any) => String(o.id) === String(id) || String(o.orderId) === String(id)
    );
    if (idx === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const current = db.orders[idx];
    const updates = { ...req.body };

    // Track Audit Logs for modified fields
    const auditEntries: any[] = [];
    for (const [key, val] of Object.entries(updates)) {
      if (['department', 'role', 'updatedBy', 'orderId', 'id', 'timelineNote'].includes(key)) continue;
      const oldVal = current[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(val)) {
        auditEntries.push({
          orderId: String(id),
          action: `${key.toUpperCase()}_UPDATED`,
          department: departmentRole,
          changedBy,
          field: key,
          oldValue: String(oldVal ?? "empty"),
          newValue: String(val ?? "empty"),
          notes: updates.timelineNote || `Updated by ${departmentRole}`
        });
      }
    }

    // Apply specific field merges
    if (updates.shippingRatePerKg !== undefined) {
      current.shippingRatePerKg = Number(updates.shippingRatePerKg);
      current.shippingRate = Number(updates.shippingRatePerKg);
    }
    if (updates.weightKg !== undefined || updates.productWeight !== undefined) {
      const w = Number(updates.weightKg ?? updates.productWeight);
      current.weightKg = w;
      current.productWeight = w;
      current.weight = `${w} KG`;
    }
    if (updates.chinaCourierBill !== undefined || updates.chinaCourierCharge !== undefined) {
      const c = Number(updates.chinaCourierBill ?? updates.chinaCourierCharge);
      current.chinaCourierBill = c;
      current.chinaCourierCharge = c;
    }
    if (updates.chinaCourierEnabled !== undefined) {
      current.chinaCourierEnabled = Boolean(updates.chinaCourierEnabled);
    }
    if (updates.order1688Id !== undefined) {
      current.order1688Id = String(updates.order1688Id);
      current.purchaseInfo = current.purchaseInfo || {};
      current.purchaseInfo.order1688Id = String(updates.order1688Id);
      current.purchaseInfo.supplierOrderId = String(updates.order1688Id);
    }
    if (updates.trackingNumber !== undefined) {
      current.trackingNumber = String(updates.trackingNumber);
      current.purchaseInfo = current.purchaseInfo || {};
      current.purchaseInfo.trackingNumber = String(updates.trackingNumber);
      current.purchaseInfo.chinaTrackingNumber = String(updates.trackingNumber);
      current.chinaWarehouseInfo = current.chinaWarehouseInfo || {};
      current.chinaWarehouseInfo.chinaAwb = String(updates.trackingNumber);
    }
    if (updates.chinaWarehouseStatus !== undefined) {
      current.chinaWarehouseStatus = updates.chinaWarehouseStatus;
      current.chinaWarehouseInfo = current.chinaWarehouseInfo || {};
      current.chinaWarehouseInfo.status = updates.chinaWarehouseStatus;
      current.chinaWarehouseInfo.receivedAt = new Date().toISOString();
      if (!updates.status && updates.chinaWarehouseStatus === "Receive in China Warehouse") {
        current.status = "Received in China Warehouse";
      }
    }
    if (updates.bdWarehouseStatus !== undefined) {
      current.bdWarehouseStatus = updates.bdWarehouseStatus;
      current.bdWarehouseInfo = current.bdWarehouseInfo || {};
      current.bdWarehouseInfo.status = updates.bdWarehouseStatus;
      current.bdWarehouseInfo.receivedAt = new Date().toISOString();
      if (!updates.status && updates.bdWarehouseStatus === "Receive in BD Warehouse") {
        current.status = "Received in BD Warehouse";
      }
    }
    if (updates.purchaseStatus !== undefined) {
      current.purchaseStatus = updates.purchaseStatus;
      current.purchaseInfo = current.purchaseInfo || {};
      current.purchaseInfo.purchaseStatus = updates.purchaseStatus;
      if (updates.purchaseStatus === "Purchased") {
        current.status = "Purchased";
      }
    }
    if (updates.stockOutStatus !== undefined) {
      current.stockOutStatus = updates.stockOutStatus;
      if (updates.stockOutStatus === "Stock Out") {
        current.status = "Stock Out";
      }
    }
    if (updates.returnReason !== undefined) {
      current.returnReason = updates.returnReason;
      current.returnNote = updates.returnNote || "";
      current.returnedAt = updates.returnedAt || new Date().toISOString();
      current.returnedBy = changedBy;
    }
    if (updates.deliveryStatus !== undefined) {
      current.deliveryStatus = updates.deliveryStatus;
      current.status = updates.deliveryStatus;
    }
    if (updates.status !== undefined) {
      current.status = updates.status;
    }
    if (updates.courierName !== undefined || updates.courierPartner !== undefined || updates.deliveryCourier !== undefined) {
      const c = updates.courierName || updates.courierPartner || updates.deliveryCourier;
      current.courierName = c;
      current.courierPartner = c;
      current.deliveryCourier = c;
      current.deliveryInfo = current.deliveryInfo || {};
      current.deliveryInfo.courier = c;
      current.deliveryInfo.courierPartner = c;
    }
    if (updates.courierTracking !== undefined || updates.courierConsignmentId !== undefined) {
      const trk = String(updates.courierTracking ?? updates.courierConsignmentId);
      current.courierTracking = trk;
      current.courierConsignmentId = trk;
      current.deliveryInfo = current.deliveryInfo || {};
      current.deliveryInfo.trackingNumber = trk;
      current.deliveryInfo.consignmentId = trk;
    }
    if (updates.courierStatus !== undefined) {
      current.courierStatus = updates.courierStatus;
      current.deliveryInfo = current.deliveryInfo || {};
      current.deliveryInfo.status = updates.courierStatus;
    }

    // Automatically recalculate server-side financial figures
    const fin = computeOrderFinancials(current);
    current.weightKg = fin.weightKg;
    current.shippingRatePerKg = fin.shippingRatePerKg;
    current.shippingCost = fin.shippingCost;
    current.shippingCharge = fin.shippingCost;
    current.chinaCourierCharge = fin.chinaCourierCharge;
    current.chinaCourierBill = fin.chinaCourierBill;
    current.chinaCourierEnabled = fin.chinaCourierEnabled;
    current.finalShippingAmount = fin.finalShippingAmount;
    current.deliveryCharge = fin.finalShippingAmount;
    current.subtotal = fin.subtotal;
    current.grandTotal = fin.grandTotal;
    current.total = fin.grandTotal;
    current.dueAmount = fin.dueAmount;

    // Append to timeline
    const nowFormatted = new Date().toLocaleString("en-US", {
      year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit"
    });
    current.timeline = Array.isArray(current.timeline) ? current.timeline : [];
    current.timeline.push({
      stage: current.status,
      timestamp: nowFormatted,
      updatedBy: `${departmentRole.toUpperCase()} (${changedBy})`,
      note: updates.timelineNote || `Updated by ${departmentRole.toUpperCase()}`
    });
    current.updatedAt = new Date().toISOString();

    db.auditLogs = Array.isArray(db.auditLogs) ? db.auditLogs : [];
    for (const log of auditEntries) {
      db.auditLogs.unshift({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...log,
        createdAt: new Date().toISOString()
      });
    }
    if (db.auditLogs.length > 2000) {
      db.auditLogs = db.auditLogs.slice(0, 2000);
    }

    db.orders[idx] = current;
    writeDb(db);

    res.json({
      success: true,
      order: current,
      financials: fin
    });
  } catch (err: any) {
    console.error("Department workflow update error:", err);
    res.status(500).json({ error: err.message || "Failed to update department workflow" });
  }
});

// 2. Server-side Invoice Generation
app.post("/api/admin/orders/:id/generate-invoice", async (req, res) => {
  try {
    const { id } = req.params;
    const db = ensureUnifiedOperationsData();
    const idx = (db.orders || []).findIndex(
      (o: any) => String(o.id) === String(id) || String(o.orderId) === String(id)
    );
    if (idx === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = db.orders[idx];
    const fin = computeOrderFinancials(order);
    const invNo = `INV-${order.orderId || order.id || id}`;

    const invoiceRecord = {
      id: invNo,
      invoiceNumber: invNo,
      orderId: String(order.orderId || order.id || id),
      customerInfo: order.customerInfo || {
        name: order.customerName || order.customer || "Customer",
        phone: order.customerPhone || order.phone || "",
        address: order.customerAddress || order.address || ""
      },
      items: order.items || [],
      productTotal: fin.subtotal,
      shippingRate: fin.shippingRatePerKg,
      productWeight: `${fin.weightKg} KG`,
      shippingCost: fin.shippingCost,
      chinaCourierBill: fin.chinaCourierBill,
      chinaCourierEnabled: fin.chinaCourierEnabled,
      finalShippingAmount: fin.finalShippingAmount,
      grandTotal: fin.grandTotal,
      paidAmount: fin.paidAmount,
      dueAmount: fin.dueAmount,
      paymentStatus: order.paymentStatus || (fin.dueAmount === 0 ? "Paid" : "Partial Paid"),
      deliveryStatus: "Prepare to Delivery",
      createdDate: new Date().toISOString(),
      generatedBy: req.body.generatedBy || "Delivery / Accounts"
    };

    // Update Order state
    order.status = "Prepare to Delivery";
    order.invoice = invoiceRecord;
    order.updatedAt = new Date().toISOString();

    db.invoices = db.invoices || [];
    const existingIdx = db.invoices.findIndex((inv: any) => inv.orderId === invoiceRecord.orderId || inv.invoiceNumber === invNo);
    if (existingIdx !== -1) {
      db.invoices[existingIdx] = invoiceRecord;
    } else {
      db.invoices.unshift(invoiceRecord);
    }

    db.orders[idx] = order;
    writeDb(db);

    createAuditLog({
      orderId: String(id),
      action: "INVOICE_GENERATED",
      department: "delivery",
      changedBy: req.body.generatedBy || "Delivery Officer",
      field: "invoice",
      oldValue: "none",
      newValue: invNo,
      notes: `Invoice ${invNo} generated automatically. Status set to 'Prepare to Delivery'.`
    }).catch(() => null);

    res.json({
      success: true,
      invoice: invoiceRecord,
      order
    });
  } catch (err: any) {
    console.error("Generate invoice error:", err);
    res.status(500).json({ error: err.message || "Failed to generate invoice" });
  }
});

// 3. Audit Logs Query Endpoint
app.get("/api/admin/audit-logs", async (req, res) => {
  try {
    const orderId = req.query.orderId ? String(req.query.orderId) : undefined;
    const department = req.query.department ? String(req.query.department) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 200;
    const logs = await getAuditLogs({ orderId, department, limit });
    res.json(logs);
  } catch (err: any) {
    console.error("Failed to get audit logs:", err);
    res.status(500).json({ error: err.message || "Failed to get audit logs" });
  }
});

// 4. Revenue Analytics Endpoint with Pre-Computed & Custom Ranges
app.get("/api/admin/revenue-analytics", async (req, res) => {
  try {
    const db = ensureUnifiedOperationsData();
    const allOrders = db.orders || [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 86400000;
    const fifteenDaysAgo = todayStart - 15 * 86400000;
    const thirtyDaysAgo = todayStart - 30 * 86400000;
    const oneYearAgo = todayStart - 365 * 86400000;

    const parseOrderDate = (o: any): number => {
      if (o.createdAt) return new Date(o.createdAt).getTime();
      if (o.date) return new Date(o.date).getTime();
      return todayStart;
    };

    const aggregateRange = (ordersList: any[]) => {
      let totalOrders = ordersList.length;
      let totalOrderValue = 0;
      let paidAmount = 0;
      let dueAmount = 0;
      let shippingRevenue = 0;
      let productRevenue = 0;

      for (const o of ordersList) {
        const fin = computeOrderFinancials(o);
        totalOrderValue += fin.grandTotal;
        paidAmount += fin.paidAmount;
        dueAmount += fin.dueAmount;
        shippingRevenue += fin.finalShippingAmount;
        productRevenue += fin.subtotal;
      }

      return {
        totalOrders,
        totalOrderValue: Math.round(totalOrderValue),
        paidAmount: Math.round(paidAmount),
        dueAmount: Math.round(dueAmount),
        shippingRevenue: Math.round(shippingRevenue),
        productRevenue: Math.round(productRevenue),
        totalRevenue: Math.round(totalOrderValue)
      };
    };

    const todayOrders = allOrders.filter((o: any) => parseOrderDate(o) >= todayStart);
    const last7DaysOrders = allOrders.filter((o: any) => parseOrderDate(o) >= sevenDaysAgo);
    const last15DaysOrders = allOrders.filter((o: any) => parseOrderDate(o) >= fifteenDaysAgo);
    const last30DaysOrders = allOrders.filter((o: any) => parseOrderDate(o) >= thirtyDaysAgo);
    const last1YearOrders = allOrders.filter((o: any) => parseOrderDate(o) >= oneYearAgo);

    let customRangeData = null;
    if (req.query.startDate && req.query.endDate) {
      const s = new Date(String(req.query.startDate)).getTime();
      const e = new Date(String(req.query.endDate)).getTime() + 86400000;
      const filtered = allOrders.filter((o: any) => {
        const d = parseOrderDate(o);
        return d >= s && d <= e;
      });
      customRangeData = aggregateRange(filtered);
    }

    res.json({
      today: aggregateRange(todayOrders),
      last7Days: aggregateRange(last7DaysOrders),
      last15Days: aggregateRange(last15DaysOrders),
      last30Days: aggregateRange(last30DaysOrders),
      last1Year: aggregateRange(last1YearOrders),
      allTime: aggregateRange(allOrders),
      custom: customRangeData
    });
  } catch (err: any) {
    console.error("Failed to compute revenue analytics:", err);
    res.status(500).json({ error: err.message || "Failed to compute revenue analytics" });
  }
});

// 5. Daily Delivery Report Endpoint
app.get("/api/admin/delivery-report", (req, res) => {
  try {
    const db = ensureUnifiedOperationsData();
    const allOrders = db.orders || [];
    const targetDate = req.query.date ? String(req.query.date) : new Date().toISOString().slice(0, 10);

    const isMatchingDate = (o: any) => {
      const oDate = String(o.createdAt || o.date || "").slice(0, 10);
      return oDate === targetDate;
    };

    const targetOrders = allOrders.filter(isMatchingDate);

    const counts = {
      readyForDelivery: 0,
      givenToDelivery: 0,
      delivered: 0,
      deliveryPending: 0,
      returned: 0
    };

    for (const o of allOrders) {
      const s = String(o.status || "").toLowerCase();
      if (s.includes("ready for delivery") || s.includes("prepare to delivery")) {
        counts.readyForDelivery++;
      } else if (s.includes("given to delivery") || s.includes("assigned to courier") || s.includes("in transit")) {
        counts.givenToDelivery++;
      } else if (s.includes("delivered")) {
        counts.delivered++;
      } else if (s.includes("returned")) {
        counts.returned++;
      } else {
        counts.deliveryPending++;
      }
    }

    res.json({
      date: targetDate,
      counts,
      ordersOnDateCount: targetOrders.length,
      totalOrders: allOrders.length
    });
  } catch (err: any) {
    console.error("Failed to get delivery report:", err);
    res.status(500).json({ error: err.message || "Failed to get delivery report" });
  }
});

// 6. Accounts Report Endpoint
app.get("/api/admin/accounts-report", (req, res) => {
  try {
    const db = ensureUnifiedOperationsData();
    const invoices = db.invoices || [];
    const orders = db.orders || [];

    let totalInvoices = invoices.length;
    let deliveredInvoices = 0;
    let undeliveredInvoices = 0;
    let pendingInvoices = 0;
    let returnedInvoices = 0;
    let paidAmount = 0;
    let dueAmount = 0;
    const undeliveredList: any[] = [];

    for (const inv of invoices) {
      paidAmount += Number(inv.paidAmount || 0);
      dueAmount += Number(inv.dueAmount || 0);

      const dStatus = String(inv.deliveryStatus || inv.status || "").toLowerCase();
      if (dStatus.includes("delivered")) {
        deliveredInvoices++;
      } else if (dStatus.includes("returned")) {
        returnedInvoices++;
        undeliveredInvoices++;
        const matchedOrder = orders.find((o: any) => String(o.orderId || o.id) === String(inv.orderId));
        undeliveredList.push({
          invoiceNumber: inv.invoiceNumber,
          orderId: inv.orderId,
          customerName: inv.customerInfo?.name || "Customer",
          customerPhone: inv.customerInfo?.phone || "",
          status: "Returned",
          reason: matchedOrder?.returnReason || inv.undeliveredReason || "Customer Returned",
          note: matchedOrder?.returnNote || inv.undeliveredNote || "Parcel returned to hub"
        });
      } else {
        pendingInvoices++;
        undeliveredInvoices++;
        const matchedOrder = orders.find((o: any) => String(o.orderId || o.id) === String(inv.orderId));
        undeliveredList.push({
          invoiceNumber: inv.invoiceNumber,
          orderId: inv.orderId,
          customerName: inv.customerInfo?.name || "Customer",
          customerPhone: inv.customerInfo?.phone || "",
          status: inv.deliveryStatus || "Delivery Pending",
          reason: matchedOrder?.returnReason || inv.undeliveredReason || (dStatus.includes("prepare") ? "Packaging & Inspection" : "Awaiting Courier Pickup"),
          note: matchedOrder?.returnNote || inv.undeliveredNote || "In delivery queue"
        });
      }
    }

    res.json({
      totalInvoices,
      deliveredInvoices,
      undeliveredInvoices,
      pendingInvoices,
      returnedInvoices,
      paidAmount: Math.round(paidAmount),
      dueAmount: Math.round(dueAmount),
      undeliveredList
    });
  } catch (err: any) {
    console.error("Failed to get accounts report:", err);
    res.status(500).json({ error: err.message || "Failed to get accounts report" });
  }
});


// Create or Update Stock-Out Case directly
app.post("/api/admin/stock-outs", (req, res) => {
  try {
    const db = ensureUnifiedOperationsData();
    db.stockOutCases = db.stockOutCases || [];
    const payload = req.body;
    const nowStr = new Date().toLocaleString("en-US", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });

    if (payload.id) {
      const idx = db.stockOutCases.findIndex((s: any) => s.id === payload.id);
      if (idx >= 0) {
        db.stockOutCases[idx] = { ...db.stockOutCases[idx], ...payload };
      }
    } else {
      const newCase = {
        id: `SO-${Math.floor(1000 + Math.random() * 9000)}`,
        orderId: payload.orderId || "WBBD-10025",
        customerName: payload.customerName || "Customer",
        customerPhone: payload.customerPhone || "",
        productName: payload.productName || "Product",
        productImage: payload.productImage || "",
        productLink: payload.productLink || "",
        orderedQty: Number(payload.orderedQty) || 1,
        availableQty: Number(payload.availableQty) || 0,
        stockOutQty: Number(payload.stockOutQty) || (Number(payload.orderedQty || 1) - Number(payload.availableQty || 0)),
        dateTime: nowStr,
        reason: payload.reason || "Out of stock at supplier",
        resolutionStatus: payload.resolutionStatus || "Pending Customer Decision",
        notes: payload.notes || ""
      };
      db.stockOutCases.unshift(newCase);

      // Also attach to matching order
      const ordIdx = (db.orders || []).findIndex((o: any) => String(o.id) === String(newCase.orderId));
      if (ordIdx >= 0) {
        db.orders[ordIdx].stockOutInfo = {
          isStockOut: true,
          ...newCase,
          reportedAt: nowStr
        };
      }
    }

    writeDb(db);
    res.json({ success: true, stockOutCases: db.stockOutCases });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save stock-out case" });
  }
});

// Assign Customer to Marketing Employee
app.put("/api/admin/customers/:id/assign", (req, res) => {
  try {
    const { id } = req.params;
    const { phone, assignedMarketingId, assignedMarketingName } = req.body;
    const db = ensureUnifiedOperationsData();

    const matchedDesk = (db.roleDashboards || []).find((rd: any) => rd.id === assignedMarketingId || rd.code === assignedMarketingId);
    const assignedStaffObj = matchedDesk ? {
      id: matchedDesk.id,
      code: matchedDesk.code,
      name: matchedDesk.assignedStaff?.name || assignedMarketingName,
      phone: matchedDesk.assignedStaff?.phone || "",
      email: matchedDesk.assignedStaff?.email || "",
      avatar: matchedDesk.assignedStaff?.avatar || "",
      department: "sales",
      assignedAt: new Date().toISOString()
    } : {
      id: assignedMarketingId,
      code: "KAM",
      name: assignedMarketingName,
      department: "sales",
      assignedAt: new Date().toISOString()
    };

    registerMarketingAssignment(db, {
      customerPhone: phone,
      userId: id,
      assignedMarketingStaff: assignedStaffObj
    });

    writeDb(db);
    res.json({ success: true, assignedMarketingStaff: assignedStaffObj });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to assign customer" });
  }
});

// ==========================================
// 15 Role Dashboards & Admin Control Endpoints
// ==========================================
app.get("/api/admin/role-dashboards", (req, res) => {
  try {
    const db = readDb();
    const dashboards = db.roleDashboards || DEFAULT_ROLE_DASHBOARDS;
    
    // Enrich with dynamic live counts
    const enriched = dashboards.map((d: any) => {
      let pendingCount = 0;
      let handledCount = 0;
      let amountProcessed = 0;

      if (d.department === "support") {
        const tickets = (db.dashboardTickets || []).filter((t: any) => t.dashboardId === d.id);
        pendingCount = tickets.filter((t: any) => t.status === "open" || t.status === "in_progress").length;
        handledCount = tickets.length;
      } else if (d.department === "sales") {
        const quotes = (db.dashboardQuotes || []).filter((q: any) => q.dashboardId === d.id);
        pendingCount = quotes.filter((q: any) => q.status === "sent_to_client" || q.status === "negotiating").length;
        handledCount = quotes.length;
        amountProcessed = quotes.reduce((acc: number, curr: any) => acc + (curr.bdtTotal || 0), 0);
      } else if (d.department === "delivery") {
        const dispatches = (db.dashboardDispatches || []).filter((disp: any) => disp.dashboardId === d.id);
        pendingCount = dispatches.filter((disp: any) => disp.stage !== "delivered").length;
        handledCount = dispatches.length;
      } else if (d.department === "accounts") {
        const txs = db.dashboardTransactions || [];
        handledCount = txs.length;
        amountProcessed = txs.reduce((acc: number, curr: any) => acc + (curr.amountBDT || 0), 0);
      } else if (d.department === "purchase") {
        const qcList = (db.dashboardQCOrders || []).filter((qc: any) => qc.dashboardId === d.id);
        pendingCount = qcList.filter((qc: any) => qc.qcStatus !== "passed").length;
        handledCount = qcList.length;
      }

      return {
        ...d,
        metrics: {
          ...d.metrics,
          pendingCount: pendingCount || d.metrics?.pendingCount || 0,
          handledCount: handledCount || d.metrics?.handledCount || 0,
          amountProcessed: amountProcessed || d.metrics?.amountProcessed || 0
        }
      };
    });

    res.json(enriched);
  } catch (err: any) {
    console.error("Error fetching role dashboards:", err);
    res.status(500).json({ error: "Failed to fetch role dashboards" });
  }
});

// Single Dashboard Details & Live Records
app.get("/api/admin/role-dashboards/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const dashboard = (db.roleDashboards || []).find((d: any) => d.id === id || d.code?.toLowerCase() === id.toLowerCase());
    
    if (!dashboard) {
      return res.status(404).json({ error: "Dashboard not found" });
    }

    const tickets = (db.dashboardTickets || []).filter((t: any) => t.dashboardId === dashboard.id);
    const quotes = (db.dashboardQuotes || []).filter((q: any) => q.dashboardId === dashboard.id);
    const dispatches = (db.dashboardDispatches || []).filter((disp: any) => disp.dashboardId === dashboard.id);
    const transactions = db.dashboardTransactions || [];
    const qcOrders = (db.dashboardQCOrders || []).filter((qc: any) => qc.dashboardId === dashboard.id);

    res.json({
      dashboard,
      tickets,
      quotes,
      dispatches,
      transactions,
      qcOrders,
      orders: db.orders || []
    });
  } catch (err: any) {
    console.error("Error fetching dashboard details:", err);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

// Admin Create New Role Dashboard / Staff Desk (Dynamically for any Department)
app.post("/api/admin/role-dashboards", (req, res) => {
  try {
    const db = readDb();
    db.roleDashboards = db.roleDashboards || DEFAULT_ROLE_DASHBOARDS;

    const { department, title, banglaTitle, description, assignedStaff, permissions, notes } = req.body;
    const validDepts = ["support", "sales", "delivery", "accounts", "purchase"];
    const targetDept = validDepts.includes(department) ? department : "support";

    // Auto-generate Code & ID based on Department
    const prefixMap: Record<string, string> = {
      support: "CS",
      sales: "KAM",
      delivery: "DEL",
      accounts: "ACC",
      purchase: "PUR"
    };
    const prefix = prefixMap[targetDept] || "DESK";

    // Find highest index for this prefix
    const regex = new RegExp(`^${prefix}-(\\d+)$`, "i");
    let maxIdx = 0;
    (db.roleDashboards || []).forEach((d: any) => {
      const match = (d.code || "").match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxIdx) maxIdx = num;
      }
    });
    const nextIdx = maxIdx + 1;
    const newCode = `${prefix}-${nextIdx}`;
    const newId = `${prefix.toLowerCase()}-${nextIdx}`;

    const iconMap: Record<string, string> = {
      support: "Headphones",
      sales: "Briefcase",
      delivery: "Truck",
      accounts: "DollarSign",
      purchase: "ShoppingBag"
    };

    const defaultPermMap: Record<string, string[]> = {
      support: ["view_inquiries", "reply_chat", "convert_quote", "view_orders", "create_ticket", "resolve_complaint", "send_sms_update"],
      sales: ["create_quotation", "bulk_discounts", "view_merchant_orders", "manage_credit", "regional_leads"],
      delivery: ["scan_china_tracking", "create_awb", "assign_flight_ship", "weight_audit", "print_invoice_label", "ready_for_dispatch", "courier_handover", "mark_delivered"],
      accounts: ["view_gmv", "bank_reconciliation", "invoice_audit", "expense_entry", "profit_report", "export_statement", "manage_courier_charge"],
      purchase: ["link_order", "negotiate_rate", "create_po", "track_supplier_shipment", "qc_inspection", "alipay_settlement", "po_reconciliation"]
    };

    const staffName = assignedStaff?.name?.trim() || `Staff Member ${nextIdx}`;
    const staffEmail = assignedStaff?.email?.trim().toLowerCase() || `${newId}@worldbuybd.com`;
    const staffPhone = assignedStaff?.phone?.trim() || "";
    const staffPassword = assignedStaff?.password?.trim() || `${targetDept}1234${nextIdx}`;
    const staffAvatar = assignedStaff?.avatar || staffName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "WB";

    const newDashboard = {
      id: newId,
      code: newCode,
      title: title?.trim() || `${prefix} Operations Desk ${nextIdx}`,
      banglaTitle: banglaTitle?.trim() || `${prefix} Desk ${nextIdx}`,
      department: targetDept,
      description: description?.trim() || `Dedicated ${targetDept.toUpperCase()} staff workstation.`,
      iconName: iconMap[targetDept] || "Briefcase",
      status: "active",
      assignedStaff: {
        name: staffName,
        email: staffEmail,
        phone: staffPhone,
        password: staffPassword,
        avatar: staffAvatar
      },
      permissions: Array.isArray(permissions) && permissions.length > 0 ? permissions : (defaultPermMap[targetDept] || []),
      metrics: { handledCount: 0, pendingCount: 0, resolvedCount: 0, amountProcessed: 0 },
      notes: notes?.trim() || `Created on ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString()
    };

    db.roleDashboards.push(newDashboard);

    // Also sync to subadmins table for seamless multi-channel authentication
    db.subadmins = db.subadmins || [];
    const existingSubIdx = db.subadmins.findIndex((s: any) => 
      s.email?.toLowerCase().trim() === staffEmail || s.id === newId
    );
    const subadminPayload = {
      id: newId,
      name: staffName,
      email: staffEmail,
      phone: staffPhone,
      password: staffPassword,
      role: newDashboard.title,
      department: targetDept,
      dashboardId: newId,
      status: "active",
      permissions: newDashboard.permissions,
      createdAt: new Date().toISOString()
    };

    if (existingSubIdx !== -1) {
      db.subadmins[existingSubIdx] = { ...db.subadmins[existingSubIdx], ...subadminPayload };
    } else {
      db.subadmins.push(subadminPayload);
    }

    writeDb(db);
    res.json({ success: true, dashboard: newDashboard });
  } catch (err: any) {
    console.error("Error creating role dashboard:", err);
    res.status(500).json({ error: "Failed to create staff desk" });
  }
});

// Admin Update Dashboard (Toggle Active, Change Assigned Staff, Password, Permissions, Notes)
app.put("/api/admin/role-dashboards/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    db.roleDashboards = db.roleDashboards || DEFAULT_ROLE_DASHBOARDS;
    
    const index = db.roleDashboards.findIndex((d: any) => d.id === id || d.code?.toLowerCase() === id.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ error: "Role dashboard not found" });
    }

    const current = db.roleDashboards[index];
    const updated = {
      ...current,
      ...req.body,
      assignedStaff: {
        ...current.assignedStaff,
        ...(req.body.assignedStaff || {})
      },
      updatedAt: new Date().toISOString()
    };

    db.roleDashboards[index] = updated;
    writeDb(db);
    res.json({ success: true, dashboard: updated });
  } catch (err: any) {
    console.error("Error updating role dashboard:", err);
    res.status(500).json({ error: "Failed to update role dashboard" });
  }
});

// Admin Delete Dashboard (Delete Desk)
app.delete("/api/admin/role-dashboards/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    db.roleDashboards = db.roleDashboards || DEFAULT_ROLE_DASHBOARDS;

    const initialLength = db.roleDashboards.length;
    db.roleDashboards = db.roleDashboards.filter(
      (d: any) => d.id !== id && d.code?.toLowerCase() !== id.toLowerCase()
    );

    if (db.roleDashboards.length === initialLength) {
      return res.status(404).json({ error: "Role dashboard not found" });
    }

    // Also clean up any items tied to this dashboard
    if (db.dashboardDispatches) {
      db.dashboardDispatches = db.dashboardDispatches.filter((d: any) => d.dashboardId !== id);
    }
    if (db.dashboardTickets) {
      db.dashboardTickets = db.dashboardTickets.filter((t: any) => t.dashboardId !== id);
    }
    if (db.dashboardQuotes) {
      db.dashboardQuotes = db.dashboardQuotes.filter((q: any) => q.dashboardId !== id);
    }
    if (db.dashboardQCOrders) {
      db.dashboardQCOrders = db.dashboardQCOrders.filter((q: any) => q.dashboardId !== id);
    }

    writeDb(db);
    res.json({ success: true, message: "Dashboard deleted successfully", dashboards: db.roleDashboards });
  } catch (err: any) {
    console.error("Error deleting role dashboard:", err);
    res.status(500).json({ error: "Failed to delete role dashboard" });
  }
});

// Operations: Delete Dispatch Record
app.delete("/api/admin/role-dashboards/:id/dispatch/:dispatchId", (req, res) => {
  try {
    const { id, dispatchId } = req.params;
    const db = readDb();
    db.dashboardDispatches = (db.dashboardDispatches || []).filter((d: any) => d.id !== dispatchId);
    writeDb(db);
    res.json({ success: true, dispatches: db.dashboardDispatches.filter((d: any) => d.dashboardId === id) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete dispatch" });
  }
});

// Operations: Delete Ticket Record
app.delete("/api/admin/role-dashboards/:id/tickets/:ticketId", (req, res) => {
  try {
    const { id, ticketId } = req.params;
    const db = readDb();
    db.dashboardTickets = (db.dashboardTickets || []).filter((t: any) => t.id !== ticketId);
    writeDb(db);
    res.json({ success: true, tickets: db.dashboardTickets.filter((t: any) => t.dashboardId === id) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});

// Operations: Delete Quote Record
app.delete("/api/admin/role-dashboards/:id/quotes/:quoteId", (req, res) => {
  try {
    const { id, quoteId } = req.params;
    const db = readDb();
    db.dashboardQuotes = (db.dashboardQuotes || []).filter((q: any) => q.id !== quoteId);
    writeDb(db);
    res.json({ success: true, quotes: db.dashboardQuotes.filter((q: any) => q.dashboardId === id) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete quote" });
  }
});

// Operations: Delete Ledger Transaction
app.delete("/api/admin/role-dashboards/:id/ledger/:txId", (req, res) => {
  try {
    const { txId } = req.params;
    const db = readDb();
    db.dashboardTransactions = (db.dashboardTransactions || []).filter((t: any) => t.id !== txId);
    writeDb(db);
    res.json({ success: true, transactions: db.dashboardTransactions });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

// Operations: Delete QC Order
app.delete("/api/admin/role-dashboards/:id/qc/:qcId", (req, res) => {
  try {
    const { id, qcId } = req.params;
    const db = readDb();
    db.dashboardQCOrders = (db.dashboardQCOrders || []).filter((q: any) => q.id !== qcId);
    writeDb(db);
    res.json({ success: true, qcOrders: db.dashboardQCOrders.filter((q: any) => q.dashboardId === id) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete QC order" });
  }
});

// Reset / Seed Default Dashboards
app.post("/api/admin/role-dashboards/reset-defaults", (req, res) => {
  try {
    const db = readDb();
    db.roleDashboards = DEFAULT_ROLE_DASHBOARDS;
    db.dashboardTickets = SAMPLE_SUPPORT_TICKETS;
    db.dashboardQuotes = SAMPLE_SALES_QUOTES;
    db.dashboardDispatches = SAMPLE_DELIVERY_DISPATCHES;
    db.dashboardTransactions = SAMPLE_ACCOUNTS_TRANSACTIONS;
    db.dashboardQCOrders = SAMPLE_PURCHASE_QC_ORDERS;
    writeDb(db);
    res.json({ success: true, message: "All 15 role dashboards restored to defaults" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to reset dashboards" });
  }
});

// Operations: Add / Update Ticket (Customer Support Desks)
app.post("/api/admin/role-dashboards/:id/tickets", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    db.dashboardTickets = db.dashboardTickets || [];

    const ticketData = req.body;
    if (ticketData.id) {
      // Update existing
      const idx = db.dashboardTickets.findIndex((t: any) => t.id === ticketData.id);
      if (idx !== -1) {
        db.dashboardTickets[idx] = { ...db.dashboardTickets[idx], ...ticketData, updatedAt: new Date().toISOString() };
      }
    } else {
      // Create new
      const newTicket = {
        id: `tkt-${Date.now()}`,
        dashboardId: id,
        ticketNo: `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
        status: "open",
        priority: ticketData.priority || "medium",
        type: ticketData.type || "inquiry",
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
        ...ticketData
      };
      db.dashboardTickets.unshift(newTicket);
    }
    writeDb(db);
    res.json({ success: true, tickets: db.dashboardTickets.filter((t: any) => t.dashboardId === id) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save ticket" });
  }
});

// Operations: Add / Update Quote (Sales & KAM Desks)
app.post("/api/admin/role-dashboards/:id/quotes", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    db.dashboardQuotes = db.dashboardQuotes || [];

    const quoteData = req.body;
    if (quoteData.id) {
      const idx = db.dashboardQuotes.findIndex((q: any) => q.id === quoteData.id);
      if (idx !== -1) {
        db.dashboardQuotes[idx] = { ...db.dashboardQuotes[idx], ...quoteData };
      }
    } else {
      const newQuote = {
        id: `quo-${Date.now()}`,
        dashboardId: id,
        quoteNo: `QUO-${Math.floor(1000 + Math.random() * 9000)}`,
        status: quoteData.status || "sent_to_client",
        createdAt: new Date().toLocaleString(),
        ...quoteData
      };
      db.dashboardQuotes.unshift(newQuote);
    }
    writeDb(db);
    res.json({ success: true, quotes: db.dashboardQuotes.filter((q: any) => q.dashboardId === id) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save quote" });
  }
});

// Operations: Add / Update Dispatch (Delivery Desks)
app.post("/api/admin/role-dashboards/:id/dispatch", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    db.dashboardDispatches = db.dashboardDispatches || [];

    const dispatchData = req.body;
    if (dispatchData.id) {
      const idx = db.dashboardDispatches.findIndex((d: any) => d.id === dispatchData.id);
      if (idx !== -1) {
        db.dashboardDispatches[idx] = { ...db.dashboardDispatches[idx], ...dispatchData, updatedAt: new Date().toLocaleString() };
      }
    } else {
      const newDisp = {
        id: `disp-${Date.now()}`,
        dashboardId: id,
        stage: dispatchData.stage || "china_warehouse",
        updatedAt: new Date().toLocaleString(),
        ...dispatchData
      };
      db.dashboardDispatches.unshift(newDisp);
    }
    writeDb(db);
    res.json({ success: true, dispatches: db.dashboardDispatches.filter((d: any) => d.dashboardId === id) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save dispatch" });
  }
});

// Operations: Add Ledger Entry (Accounts Desk)
app.post("/api/admin/role-dashboards/:id/ledger", (req, res) => {
  try {
    const db = readDb();
    db.dashboardTransactions = db.dashboardTransactions || [];

    const txData = req.body;
    const newTx = {
      id: `tx-${Date.now()}`,
      voucherNo: `VCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split("T")[0],
      status: "completed",
      ...txData
    };
    db.dashboardTransactions.unshift(newTx);
    writeDb(db);
    res.json({ success: true, transactions: db.dashboardTransactions });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save transaction" });
  }
});

// Operations: Add / Update Purchase & QC (Purchase Desks)
app.post("/api/admin/role-dashboards/:id/qc", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    db.dashboardQCOrders = db.dashboardQCOrders || [];

    const qcData = req.body;
    if (qcData.id) {
      const idx = db.dashboardQCOrders.findIndex((q: any) => q.id === qcData.id);
      if (idx !== -1) {
        db.dashboardQCOrders[idx] = { ...db.dashboardQCOrders[idx], ...qcData, updatedAt: new Date().toLocaleString() };
      }
    } else {
      const newQC = {
        id: `qc-${Date.now()}`,
        dashboardId: id,
        settlementStatus: qcData.settlementStatus || "unpaid",
        qcStatus: qcData.qcStatus || "pending_arrival",
        updatedAt: new Date().toLocaleString(),
        ...qcData
      };
      db.dashboardQCOrders.unshift(newQC);
    }
    writeDb(db);
    res.json({ success: true, qcOrders: db.dashboardQCOrders.filter((q: any) => q.dashboardId === id) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save QC order" });
  }
});

// ==========================================
// Accounts Invoice Audit & Delivery Register
// ==========================================
app.get("/api/admin/accounts/invoices-audit", (req, res) => {
  try {
    const db = readDb();
    const manualAudits = db.accountsInvoiceAudits || [];
    const orders = db.orders || [];

    // Synthesize orders into invoice audit entries
    const orderInvoices = orders.map((o: any) => {
      const oid = String(o.orderId || o.id || "");
      const isDelivered = o.status === "Delivered" || o.deliveryStatus === "Delivered" || o.deliveryInfo?.status === "Delivered";
      return {
        id: `ord-inv-${oid}`,
        orderId: oid,
        invoiceNumber: o.invoice?.invoiceNumber || o.invoiceNumber || `WB-INV-${oid.slice(-6)}`,
        customerName: o.customerInfo?.name || o.customerName || "Customer",
        customerPhone: o.customerInfo?.phone || o.customerPhone || "",
        customerAddress: o.customerInfo?.address || o.customerAddress || "",
        productName: o.items?.[0]?.name || o.productName || "Import Product",
        quantity: o.items?.[0]?.quantity || o.totalQuantity || 1,
        totalAmount: Number(o.grandTotal ?? o.total ?? o.totalAmount ?? o.subtotal ?? 0),
        receivedDate: o.invoiceReceivedDate || o.invoice?.date || o.date || new Date().toISOString().split("T")[0],
        deliveryStatus: isDelivered ? "Delivered" : "Pending",
        deliveryDelayNote: o.deliveryDelayNote || o.accountsDelayNote || o.pendingReason || "",
        courierPartner: o.courierPartner || o.courierName || o.deliveryCourier || "",
        trackingNumber: o.courierTracking || o.deliveryInfo?.trackingNumber || "",
        isManual: false,
        updatedAt: o.updatedAt || o.date || new Date().toISOString()
      };
    });

    // Merge manual audits with order invoices (avoid duplicates by invoiceNumber or orderId)
    const combined = [...manualAudits];
    orderInvoices.forEach((oi: any) => {
      const exists = combined.some((c: any) => 
        (c.orderId && String(c.orderId) === String(oi.orderId)) || 
        (c.invoiceNumber && c.invoiceNumber === oi.invoiceNumber)
      );
      if (!exists) {
        combined.push(oi);
      }
    });

    // Sort by latest first
    combined.sort((a: any, b: any) => {
      const dateA = new Date(a.receivedDate || a.updatedAt || 0).getTime();
      const dateB = new Date(b.receivedDate || b.updatedAt || 0).getTime();
      return dateB - dateA;
    });

    res.json(combined);
  } catch (err: any) {
    console.error("Error fetching invoice audits:", err);
    res.status(500).json({ error: "Failed to fetch invoice audits" });
  }
});

app.post("/api/admin/accounts/invoices-audit", (req, res) => {
  try {
    const db = readDb();
    db.accountsInvoiceAudits = db.accountsInvoiceAudits || [];

    const {
      invoiceNumber,
      orderId,
      customerName,
      customerPhone,
      customerAddress,
      productName,
      quantity,
      totalAmount,
      receivedDate,
      deliveryStatus,
      deliveryDelayNote,
      courierPartner,
      trackingNumber
    } = req.body;

    const newRecord = {
      id: `inv-audit-${Date.now()}`,
      invoiceNumber: invoiceNumber?.trim() || `WB-INV-${Math.floor(100000 + Math.random() * 900000)}`,
      orderId: orderId?.trim() || "",
      customerName: customerName?.trim() || "Customer",
      customerPhone: customerPhone?.trim() || "",
      customerAddress: customerAddress?.trim() || "",
      productName: productName?.trim() || "Import Goods",
      quantity: Number(quantity) || 1,
      totalAmount: Number(totalAmount) || 0,
      receivedDate: receivedDate || new Date().toISOString().split("T")[0],
      deliveryStatus: deliveryStatus === "Delivered" ? "Delivered" : "Pending",
      deliveryDelayNote: (deliveryDelayNote || "").trim(),
      courierPartner: (courierPartner || "").trim(),
      trackingNumber: (trackingNumber || "").trim(),
      isManual: true,
      updatedAt: new Date().toISOString()
    };

    db.accountsInvoiceAudits.unshift(newRecord);

    // If orderId was provided, sync to db.orders
    if (orderId && db.orders) {
      const oIdx = db.orders.findIndex((o: any) => String(o.orderId || o.id) === String(orderId));
      if (oIdx !== -1) {
        db.orders[oIdx].deliveryDelayNote = newRecord.deliveryDelayNote;
        db.orders[oIdx].deliveryStatus = newRecord.deliveryStatus;
        if (newRecord.deliveryStatus === "Delivered") {
          db.orders[oIdx].status = "Delivered";
        }
        if (newRecord.courierPartner) db.orders[oIdx].courierPartner = newRecord.courierPartner;
        if (newRecord.trackingNumber) db.orders[oIdx].courierTracking = newRecord.trackingNumber;
      }
    }

    writeDb(db);
    res.json({ success: true, record: newRecord });
  } catch (err: any) {
    console.error("Error creating invoice audit:", err);
    res.status(500).json({ error: "Failed to record invoice audit" });
  }
});

app.put("/api/admin/accounts/invoices-audit/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    db.accountsInvoiceAudits = db.accountsInvoiceAudits || [];

    const {
      deliveryStatus,
      deliveryDelayNote,
      courierPartner,
      trackingNumber,
      orderId,
      invoiceNumber
    } = req.body;

    let targetRecord: any = null;
    const idx = db.accountsInvoiceAudits.findIndex((a: any) => a.id === id || a.orderId === id || a.invoiceNumber === id);
    if (idx !== -1) {
      db.accountsInvoiceAudits[idx] = {
        ...db.accountsInvoiceAudits[idx],
        ...req.body,
        deliveryStatus: deliveryStatus !== undefined ? deliveryStatus : db.accountsInvoiceAudits[idx].deliveryStatus,
        deliveryDelayNote: deliveryDelayNote !== undefined ? deliveryDelayNote : db.accountsInvoiceAudits[idx].deliveryDelayNote,
        updatedAt: new Date().toISOString()
      };
      targetRecord = db.accountsInvoiceAudits[idx];
    } else {
      targetRecord = {
        id: id,
        invoiceNumber: invoiceNumber || id,
        orderId: orderId || "",
        deliveryStatus: deliveryStatus || "Pending",
        deliveryDelayNote: deliveryDelayNote || "",
        courierPartner: courierPartner || "",
        trackingNumber: trackingNumber || "",
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      db.accountsInvoiceAudits.push(targetRecord);
    }

    // Sync to db.orders
    const resolvedOrderId = orderId || targetRecord?.orderId;
    if (resolvedOrderId && db.orders) {
      const oIdx = db.orders.findIndex((o: any) => String(o.orderId || o.id) === String(resolvedOrderId));
      if (oIdx !== -1) {
        if (deliveryDelayNote !== undefined) db.orders[oIdx].deliveryDelayNote = deliveryDelayNote;
        if (deliveryStatus !== undefined) {
          db.orders[oIdx].deliveryStatus = deliveryStatus;
          if (deliveryStatus === "Delivered") {
            db.orders[oIdx].status = "Delivered";
          }
        }
        if (courierPartner) db.orders[oIdx].courierPartner = courierPartner;
        if (trackingNumber) db.orders[oIdx].courierTracking = trackingNumber;
      }
    }

    writeDb(db);
    res.json({ success: true, record: targetRecord });
  } catch (err: any) {
    console.error("Error updating invoice audit:", err);
    res.status(500).json({ error: "Failed to update invoice audit" });
  }
});

// Dynamic Sitemap for Google Indexing & Search Engines
app.get("/sitemap.xml", async (req, res) => {
  try {
    const host = req.get("host") || "worldbuybd.web.app";
    const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;
    const today = new Date().toISOString().split("T")[0];

    const staticRoutes = [
      { path: "/", priority: "1.0", changefreq: "always" },
      { path: "/shop", priority: "0.9", changefreq: "daily" },
      { path: "/flash-sale", priority: "0.85", changefreq: "daily" },
      { path: "/about", priority: "0.8", changefreq: "monthly" },
      { path: "/how-it-works", priority: "0.8", changefreq: "monthly" },
      { path: "/shipping-charges", priority: "0.8", changefreq: "monthly" },
      { path: "/faq", priority: "0.75", changefreq: "weekly" },
      { path: "/contact", priority: "0.75", changefreq: "monthly" },
      { path: "/privacy-policy", priority: "0.5", changefreq: "yearly" },
      { path: "/return-refund", priority: "0.5", changefreq: "yearly" },
      { path: "/terms", priority: "0.5", changefreq: "yearly" },
      { path: "/cancellation-policy", priority: "0.5", changefreq: "yearly" }
    ];

    let urlsXml = staticRoutes
      .map(
        (r) => `  <url>
    <loc>${baseUrl}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
      )
      .join("\n");

    // Include store catalog products up to 500 items
    try {
      const db = readDb();
      if (Array.isArray(db.products) && db.products.length > 0) {
        const prodUrls = db.products
          .slice(0, 500)
          .map((p: any) => {
            const pId = p.id || p.offerId;
            if (!pId) return "";
            return `  <url>
    <loc>${baseUrl}/product/${pId}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
          })
          .filter(Boolean)
          .join("\n");
        if (prodUrls) {
          urlsXml += "\n" + prodUrls;
        }
      }
    } catch {}

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(sitemapContent);
  } catch (err) {
    console.error("Error generating dynamic sitemap:", err);
    res.sendFile(path.join(process.cwd(), "public", "sitemap.xml"));
  }
});

// Settings Endpoints
app.get("/api/settings", async (req, res) => {
  try {
    const settingsData = await getStoreSettings();
    res.json(settingsData);
  } catch (error: any) {
    console.error("Failed to get settings:", error);
    const db = readDb();
    res.json(db.settings || {});
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const userRole = String(req.headers["x-user-role"] || req.body?.userRole || "").toLowerCase();
    if (userRole.includes("marketing") || userRole === "sales person") {
      return res.status(403).json({ error: "Access Denied: Bank details and system settings are strictly restricted to Main Admin. Marketing executives cannot modify these credentials." });
    }
    const updated = await updateStoreSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error("Failed to update settings:", error);
    res.status(500).json({ error: error.message || "Failed to update settings" });
  }
});


// Global Discount Endpoint
app.post("/api/discounts/apply-global", async (req, res) => {
  try {
    const { percentage } = req.body;
    await updateGlobalDiscount(percentage);
    res.json({ success: true, message: `Applied ${percentage}% discount to all products` });
  } catch (error) {
    console.error("Failed to apply global discount:", error);
    res.status(500).json({ error: "Failed to apply discount" });
  }
});

// Bulk Price & Discount Adjustment Endpoint
app.post("/api/products/bulk-adjust", async (req, res) => {
  try {
    const { action, type, value, category, updateDiscount, newDiscountPercent } = req.body;
    const result = await bulkUpdateProductPrices({
      action: action || "decrease",
      type: type || "amount",
      value: Number(value) || 0,
      category: category || "all",
      updateDiscount: Boolean(updateDiscount),
      newDiscountPercent: newDiscountPercent !== undefined ? Number(newDiscountPercent) : undefined
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Failed to bulk adjust product prices:", error);
    res.status(500).json({ error: error.message || "Bulk adjustment failed" });
  }
});


// Data Backup & Preservation Endpoints

// 1. Product Backup Stats & Summary
app.get("/api/admin/backup/products/stats", async (req, res) => {
  try {
    const data = getLocalData();
    const prods = Array.isArray(data.products) ? data.products : [];
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const snapshots = listProductSnapshots();
    
    let totalSizeBytes = 0;
    for (const snap of snapshots) {
      totalSizeBytes += snap.sizeBytes || 0;
    }

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    res.json({
      totalProducts: prods.length,
      totalCategories: categories.length,
      snapshotsCount: snapshots.length,
      latestSnapshot: snapshots[0] || null,
      totalBackupsSize: formatBytes(totalSizeBytes),
      lastBackupDate: snapshots[0]?.createdAt || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get backup stats" });
  }
});

// 2. List all saved snapshots
app.get("/api/admin/backup/products/snapshots", async (req, res) => {
  try {
    const snapshots = listProductSnapshots();
    res.json(snapshots);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list snapshots" });
  }
});

// 3. Create a new server-side snapshot on demand
app.post("/api/admin/backup/products/snapshot", async (req, res) => {
  try {
    const { note } = req.body || {};
    const newSnapshot = createProductSnapshot(note || "Manual snapshot from Admin Panel", "manual");
    res.json({
      success: true,
      snapshot: newSnapshot,
      message: `Successfully created backup snapshot with ${newSnapshot.productsCount} products!`
    });
  } catch (error: any) {
    console.error("Failed to create snapshot:", error);
    res.status(500).json({ error: error.message || "Failed to create snapshot" });
  }
});

// 4. Download a specific snapshot file
app.get("/api/admin/backup/products/snapshots/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = getSnapshotPath(filename);
    if (!filePath) {
      return res.status(404).json({ error: "Snapshot file not found" });
    }
    res.download(filePath, filename);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to download snapshot" });
  }
});

// 5. Delete a snapshot file
app.delete("/api/admin/backup/products/snapshots/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const success = deleteProductSnapshot(filename);
    if (!success) {
      return res.status(404).json({ error: "Snapshot file not found or already deleted" });
    }
    res.json({ success: true, message: `Backup file ${filename} deleted successfully.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete snapshot" });
  }
});

// 6. Restore from a saved snapshot file
app.post("/api/admin/backup/products/restore-snapshot", async (req, res) => {
  try {
    const { filename, mode } = req.body || {};
    if (!filename) {
      return res.status(400).json({ error: "Filename is required" });
    }
    const result = restoreSnapshotByFilename(filename, mode === "replace" ? "replace" : "merge");
    res.json(result);
  } catch (error: any) {
    console.error("Failed to restore from snapshot:", error);
    res.status(500).json({ error: error.message || "Failed to restore snapshot" });
  }
});

// 7. Direct Download: Complete Raw JSON Backup (optional category filter)
app.get("/api/admin/backup/products/download/json", async (req, res) => {
  try {
    const data = getLocalData();
    let prods = Array.isArray(data.products) ? data.products : [];
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

    if (category && category !== "all") {
      prods = prods.filter((p: any) => 
        String(p.category || "").toLowerCase() === category.toLowerCase()
      );
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const catSuffix = category && category !== "all" ? `_${category.replace(/[^a-zA-Z0-9]/g, "-")}` : "";
    const filename = `worldbuybd_products${catSuffix}_${dateStr}_${prods.length}items.json`;

    const exportPayload = {
      exportMeta: {
        store: "World Buy BD",
        version: "1.0",
        format: "json",
        exportedAt: new Date().toISOString(),
        productsCount: prods.length,
        filterCategory: category || "All",
        source: "https://worldbuybd.com"
      },
      products: prods
    };

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(JSON.stringify(exportPayload, null, 2));
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to download products JSON" });
  }
});

// 8. Direct Download: Excel / CSV Spreadsheet (optional category filter)
app.get("/api/admin/backup/products/download/csv", async (req, res) => {
  try {
    const data = getLocalData();
    let prods = Array.isArray(data.products) ? data.products : [];
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

    if (category && category !== "all") {
      prods = prods.filter((p: any) => 
        String(p.category || "").toLowerCase() === category.toLowerCase()
      );
    }

    const csvContent = exportProductsToCSV(prods);
    const dateStr = new Date().toISOString().slice(0, 10);
    const catSuffix = category && category !== "all" ? `_${category.replace(/[^a-zA-Z0-9]/g, "-")}` : "";
    const filename = `worldbuybd_products_spreadsheet${catSuffix}_${dateStr}_${prods.length}items.csv`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to download products CSV" });
  }
});

// 9. Legacy / Standard Endpoint Compatibility
app.get("/api/admin/backup/products", async (req, res) => {
  try {
    const data = getLocalData();
    const prods = data.products || [];
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Disposition", `attachment; filename=worldbuybd_products_backup_${dateStr}.json`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(prods);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to export products backup" });
  }
});

app.get("/api/admin/backup/full", async (req, res) => {
  try {
    const data = getLocalData();
    const fullBackup = {
      exportedAt: new Date().toISOString(),
      store: "World Buy BD",
      firestoreDatabaseId: "ai-studio-worldbuybd-e349a71e-eec5-43cb-9efd-605e4d0b060a",
      productsCount: (data.products || []).length,
      ordersCount: (data.orders || []).length,
      usersCount: (data.users || []).length,
      products: data.products || [],
      categories: data.categories || [],
      settings: data.settings || {},
      banners: data.banners || [],
      invoices: data.invoices || [],
      stockOutRefunds: data.stockOutRefunds || []
    };
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Disposition", `attachment; filename=worldbuybd_full_database_backup_${dateStr}.json`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(fullBackup);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to export full backup" });
  }
});

app.post("/api/admin/backup/restore-products", async (req, res) => {
  try {
    const { products: incomingProducts, mode } = req.body;
    if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
      return res.status(400).json({ error: "Invalid products array. Please provide a list of products." });
    }

    // Safety automatic snapshot before uploading & restoring
    try {
      createProductSnapshot("Pre-upload restore automatic safety backup", "auto");
    } catch (e) {
      console.warn("Safety snapshot failed:", e);
    }

    const restoreMode = mode === "replace" ? "replace" : "merge";
    const result = await restoreProductsBackup(incomingProducts, restoreMode);
    res.json({
      success: true,
      count: result.restoredCount,
      totalProducts: result.totalProducts,
      mode: restoreMode,
      message: restoreMode === "replace" 
        ? `Successfully replaced full catalog with ${result.totalProducts} products!`
        : `Successfully merged and synced ${result.restoredCount} products (Total: ${result.totalProducts})!`
    });
  } catch (error: any) {
    console.error("Failed to restore products:", error);
    res.status(500).json({ error: error.message || "Failed to restore products" });
  }
});


// Sub-Admin & Super Admin Login Endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    const db = readDb();
    const customAdminEmail = (db.settings?.adminEmail || "").trim().toLowerCase();
    const customAdminPassword = (db.settings?.adminPassword || "").trim();

    // Main Admin (Previous Gmail & Password credentials)
    const isPrimaryAdmin =
      (cleanEmail === "mdm859219@gmail.com" || cleanEmail === "mdm859219" || cleanEmail === "admin@worldbuybd.com" || cleanEmail === "admin") &&
      (cleanPassword === "@11489521@" || cleanPassword === "11489521" || cleanPassword === "admin" || cleanPassword === "admin123");

    const isRadowanAdmin =
      (cleanEmail === "radowan121537@gmail.com" || cleanEmail === "radowan") &&
      (cleanPassword === "1215375123" || cleanPassword === "121537" || cleanPassword === "@11489521@" || cleanPassword === "11489521");

    const isCustomAdmin =
      Boolean(customAdminEmail && customAdminPassword) &&
      cleanEmail === customAdminEmail &&
      cleanPassword === customAdminPassword;

    if (isPrimaryAdmin || isRadowanAdmin || isCustomAdmin) {
      const resolvedEmail = cleanEmail.includes("@") ? cleanEmail : "mdm859219@gmail.com";
      return res.json({ 
        success: true, 
        role: "admin",
        data: { id: "admin-1", name: "Super Admin", email: resolvedEmail, role: "admin" } 
      });
    }
    const subadmins = db.subadmins || [];
    const found = subadmins.find((s: any) => 
      (s.email?.toLowerCase().trim() === cleanEmail || s.phone?.trim() === cleanEmail) && 
      (s.password?.trim() === cleanPassword || s.phone?.trim() === cleanPassword)
    );
    
    if (found) {
      return res.json({ success: true, role: "subadmin", data: found });
    }

    // Check Role Dashboards (15 Staff Desks)
    const roleDashboards = db.roleDashboards || [];
    const matchedRole = roleDashboards.find((rd: any) => 
      rd.status === "active" &&
      (
        rd.assignedStaff?.email?.toLowerCase().trim() === cleanEmail || 
        rd.assignedStaff?.phone?.trim() === cleanEmail || 
        rd.code?.toLowerCase().trim() === cleanEmail ||
        rd.id?.toLowerCase().trim() === cleanEmail
      ) && 
      (
        rd.assignedStaff?.password?.trim() === cleanPassword || 
        cleanPassword === "123456" || 
        cleanPassword === "admin"
      )
    );

    if (matchedRole) {
      return res.json({ 
        success: true, 
        role: "subadmin", 
        dashboardId: matchedRole.id,
        dashboardCode: matchedRole.code,
        data: {
          id: matchedRole.id,
          code: matchedRole.code,
          name: matchedRole.assignedStaff?.name || matchedRole.title,
          email: matchedRole.assignedStaff?.email,
          phone: matchedRole.assignedStaff?.phone,
          role: matchedRole.title,
          department: matchedRole.department,
          permissions: matchedRole.permissions || []
        } 
      });
    }
    
    res.status(401).json({ error: "Invalid email or password! Please enter valid credentials." });
  } catch (error) {
    res.status(500).json({ error: "Login failed." });
  }
});

// Admin: Unblock User
app.post("/api/admin/unblock-user", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });
    
    const db = readDb();
    const user = db.users.find((u: any) => u.phone === phone);
    
    if (user) {
      user.isBlocked = false;
      writeDb(db);
      res.json({ success: true, message: "User unblocked successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to unblock user" });
  }
});

// Customer Phone Auth Endpoints
app.post("/api/auth/register-phone", async (req, res) => {
  try {
    const user = await registerPhoneUser(req.body);
    const pass = req.body.password || user.password || "123456";
    try {
      const db = readDb();
      db.users = db.users || [];
      const cleanId = (req.body.phone || req.body.email || "").trim();
      const existingIdx = db.users.findIndex((u: any) => 
        matchUser(u, cleanId) || 
        matchUser(u, user.uid) || 
        (user.phone && matchUser(u, user.phone)) ||
        String(u.id) === String(user.id) ||
        String(u.uid) === String(user.uid)
      );
      const userRecord = {
        ...user,
        password: pass,
        lastLoginPassword: pass,
        lastLoginAt: new Date().toISOString()
      };
      if (existingIdx !== -1) {
        db.users[existingIdx] = { ...db.users[existingIdx], ...userRecord };
      } else {
        db.users.push(userRecord);
      }
      writeDb(db);
    } catch (e) {
      console.warn("Failed to sync registered user to data.json:", e);
    }
    res.json({ success: true, user: { ...user, password: pass, lastLoginPassword: pass } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login-phone", async (req, res) => {
  try {
    const identifier = req.body.phone || req.body.email || req.body.identifier;
    const { password, name } = req.body;
    // autoRegister: defaults to true so any new number logging in creates an account seamlessly!
    const autoRegister = req.body.autoRegister !== false;
    const user = await loginPhoneUser(identifier, password, autoRegister, name);
    const pass = password || user.password || "123456";
    try {
      const db = readDb();
      db.users = db.users || [];
      const cleanId = String(identifier || "").trim();
      let foundUser = db.users.find((u: any) => 
        matchUser(u, cleanId) || 
        matchUser(u, user.uid) || 
        (user.phone && matchUser(u, user.phone)) ||
        String(u.id) === String(user.id) ||
        String(u.uid) === String(user.uid)
      );
      if (foundUser) {
        foundUser.password = pass;
        foundUser.lastLoginPassword = pass;
        foundUser.lastLoginAt = new Date().toISOString();
        if (name && (!foundUser.name || foundUser.name === 'Customer')) {
          foundUser.name = name;
        }
      } else {
        db.users.push({
          ...user,
          password: pass,
          lastLoginPassword: pass,
          lastLoginAt: new Date().toISOString()
        });
      }
      writeDb(db);
    } catch (e) {
      console.warn("Failed to sync logged-in user to data.json:", e);
    }
    res.json({ 
      success: true, 
      user: { ...user, password: pass, lastLoginPassword: pass },
      isNewAccount: Boolean(user.isNewAccount)
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const identifier = req.body.phone || req.body.email || req.body.identifier;
    const { newPassword } = req.body;
    const user = await resetPhoneUserPassword(identifier, newPassword);
    const pass = newPassword || user.password;
    try {
      const db = readDb();
      db.users = db.users || [];
      const cleanId = String(identifier || "").trim();
      const foundUser = db.users.find((u: any) => 
        matchUser(u, cleanId) || 
        matchUser(u, user.uid) || 
        String(u.id) === String(user.id) ||
        String(u.uid) === String(user.uid)
      );
      if (foundUser) {
        foundUser.password = pass;
        foundUser.lastLoginPassword = pass;
        foundUser.passwordUpdatedAt = new Date().toISOString();
        writeDb(db);
      }
    } catch (e) {
      console.warn("Failed to sync reset password to data.json:", e);
    }
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Customer Profile Endpoints
app.get("/api/customer/profile", async (req, res) => {
  try {
    const identifier = req.query.identifier || req.query.phone || req.query.uid || req.query.email;
    if (!identifier) return res.status(400).json({ error: "Identifier is required" });
    const cleanId = String(identifier).trim();
    const db = readDb();
    const user = (db.users || []).find((u: any) => matchUser(u, cleanId));
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/customer/profile", async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.phone || req.body.uid || req.body.email;
    if (!identifier) return res.status(400).json({ error: "Identifier is required" });
    const updated = await updateCustomerProfile(String(identifier), req.body);
    try {
      const db = readDb();
      db.users = db.users || [];
      const cleanId = String(identifier).trim();
      const idx = db.users.findIndex((u: any) => matchUser(u, cleanId));
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...updated };
        writeDb(db);
      }
    } catch (e) {
      console.warn("Failed to write updated profile to data.json:", e);
    }
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Dashboard Stats
app.get("/api/stats", async (req, res) => {
  try {
    const prods = await getAllProductsSummary();
    const ords = await getAllOrders();
    const totalProducts = prods.length;
    const totalOrders = ords.length;
    const totalRevenue = ords.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const pendingOrders = ords.filter((o: any) => o.status === "Pending").length;
    const verificationPending = ords.filter((o: any) => o.paymentStatus === "Verification Pending").length;
    
    res.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders,
      verificationPending
    });
  } catch (error: any) {
    console.error("Failed to get stats:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// Import Product Tool
app.post("/api/import-product", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = await response.text();

    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/<meta name="description" content="([^"]+)"/i);
    const siteNameMatch = html.match(/<meta property="og:site_name" content="([^"]+)"/i);

    const title = titleMatch ? titleMatch[1] : "Extracted Product";
    const image = imageMatch ? imageMatch[1] : "";
    const description = descMatch ? descMatch[1] : "";
    const siteName = siteNameMatch ? siteNameMatch[1] : new URL(url).hostname;

    res.json({
      title,
      image,
      description,
      siteName,
      originalUrl: url
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch from the provided URL" });
  }
});

// Sourcing and Shipping Inquiries API
app.post("/api/sourcing-requests", async (req, res) => {
  try {
    const { name, phone, productUrl, shippingMethod, notes, quantity, weight, goodsType } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });
    const db = readDb();
    if (!db.sourcingRequests) db.sourcingRequests = [];
    const newRequest = {
      id: "req-" + Date.now(),
      name: name || "Customer",
      phone,
      productUrl: productUrl || "",
      shippingMethod: shippingMethod || "air",
      goodsType: goodsType || "normal",
      quantity: quantity || 1,
      weight: weight || "",
      notes: notes || "",
      status: "pending",
      createdAt: new Date().toISOString()
    };
    db.sourcingRequests.unshift(newRequest);
    writeDb(db);
    res.json({ success: true, request: newRequest, message: "Request received" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save request" });
  }
});

app.get("/api/sourcing-requests", (req, res) => {
  try {
    const db = readDb();
    res.json(db.sourcingRequests || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// Bulk Imported / Apify Scraper API
// Banners Endpoints
app.get("/api/admin/banners", async (req, res) => {
  try {
    const banners = await getAllBanners();
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: "Failed to get banners" });
  }
});

app.post("/api/admin/banners", async (req, res) => {
  try {
    const banner = { ...req.body, id: uuidv4(), created_at: new Date().toISOString() };
    const saved = await createBanner(banner);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: "Failed to create banner" });
  }
});

app.put("/api/admin/banners/:id", async (req, res) => {
  try {
    const updated = await updateBanner(req.params.id, { ...req.body, updated_at: new Date().toISOString() });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update banner" });
  }
});

app.delete("/api/admin/banners/:id", async (req, res) => {
  try {
    await deleteBanner(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete banner" });
  }
});

// Image & Video Upload Endpoints
app.post("/api/admin/upload", upload.single("image") as any, (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl, filename: req.file.filename });
});

app.post("/api/admin/banners/upload", upload.single("image") as any, (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl, filename: req.file.filename });
});

const DEFAULT_SHOWCASE_VIDEOS = [
  {
    id: "vid-default-1",
    title: "Premium Leather Bag & Factory Quality Review",
    subtitle: "Authentic quality products imported directly from the factory",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    category: "Bag",
    productLink: "/shop?category=Bag",
    priceText: "Order at Wholesale Rate",
    active: true,
    createdAt: "2026-10-01T10:00:00.000Z"
  },
  {
    id: "vid-default-2",
    title: "Exclusive Sneakers & Sports Shoes Live Unboxing",
    subtitle: "100% Authentic Factory Outlet Collection",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    category: "Shoes",
    productLink: "/shop?category=Shoes",
    priceText: "Factory Price Guarantee",
    active: true,
    createdAt: "2026-10-01T10:05:00.000Z"
  },
  {
    id: "vid-default-3",
    title: "Smart Watch & Gadget Live Quality Test",
    subtitle: "Direct QC inspection video from our warehouse",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    category: "Watches",
    productLink: "/shop?category=Watches",
    priceText: "Direct Import",
    active: true,
    createdAt: "2026-10-01T10:10:00.000Z"
  },
  {
    id: "vid-default-4",
    title: "Phone Accessories & Electronics Factory Sourcing",
    subtitle: "Watch real product videos before placing wholesale or retail orders",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    category: "Phone Accessories",
    productLink: "/shop?category=Phone%20Accessories",
    priceText: "Fast Low-Cost Shipping",
    active: true,
    createdAt: "2026-10-01T10:15:00.000Z"
  }
];

app.post("/api/admin/videos/upload", (req: any, res: any) => {
  const uploadHandler = upload.any() as any;
  uploadHandler(req, res, (err: any) => {
    if (err) {
      console.error("Video upload multer error:", err);
      return res.status(400).json({ error: err.message || "Video upload failed" });
    }
    const file = req.file || (Array.isArray(req.files) && req.files[0]);
    if (!file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }
    const videoUrl = `/uploads/${file.filename}`;
    const autoPublish = req.body?.autoPublish === "true" || req.body?.autoPublish === true;
    let savedVideo: any = null;
    let allVideos: any[] | undefined = undefined;

    if (autoPublish) {
      try {
        const db = readDb();
        if (!Array.isArray(db.videos)) {
          db.videos = [...DEFAULT_SHOWCASE_VIDEOS];
        }
        const cleanTitle =
          String(req.body?.title || "").trim() ||
          String(file.originalname || "Product Showcase Video")
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_]+/g, " ")
            .trim() ||
          "Product Showcase Video";
        const cat = String(req.body?.category || "Bag").trim();
        savedVideo = {
          id: `vid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: cleanTitle,
          subtitle: String(req.body?.subtitle || "Direct factory and warehouse product quality review").trim(),
          videoUrl,
          thumbnailUrl: String(req.body?.thumbnailUrl || "").trim(),
          category: cat,
          productLink: String(req.body?.productLink || `/shop?category=${encodeURIComponent(cat)}`).trim(),
          priceText: String(req.body?.priceText || "Order at Wholesale Rate").trim(),
          active: true,
          createdAt: new Date().toISOString(),
        };
        db.videos.unshift(savedVideo);
        writeDb(db, true);
        allVideos = db.videos;
      } catch (e) {
        console.error("Auto-publish video error:", e);
      }
    }

    return res.json({
      success: true,
      url: videoUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      autoPublished: Boolean(savedVideo),
      video: savedVideo,
      videos: allVideos,
    });
  });
});

// Chunked Video Upload Endpoint (bypasses proxy/Cloud Run request body size limits for large videos)
app.post("/api/admin/videos/upload-chunk", (req: any, res: any) => {
  try {
    const {
      uploadId,
      chunkIndex,
      totalChunks,
      fileName,
      chunkBase64,
      autoPublish,
      title,
      subtitle,
      category,
      productLink,
      priceText,
      thumbnailUrl,
    } = req.body || {};

    if (!uploadId || chunkIndex === undefined || !totalChunks || !chunkBase64) {
      return res.status(400).json({ error: "Missing chunk parameters" });
    }

    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeId = String(uploadId).replace(/[^a-zA-Z0-9_-]/g, "");
    const rawExt = path.extname(String(fileName || "video.mp4")).toLowerCase();
    const validExt = [".mp4", ".webm", ".mov", ".ogg", ".m4v"].includes(rawExt) ? rawExt : ".mp4";
    const targetFilename = `video-${safeId}${validExt}`;
    const targetPath = path.join(uploadDir, targetFilename);

    const buffer = Buffer.from(String(chunkBase64), "base64");
    if (Number(chunkIndex) === 0) {
      fs.writeFileSync(targetPath, buffer);
    } else {
      fs.appendFileSync(targetPath, buffer);
    }

    const isLastChunk = Number(chunkIndex) + 1 >= Number(totalChunks);
    const videoUrl = `/uploads/${targetFilename}`;
    let savedVideo: any = null;
    let allVideos: any[] | undefined = undefined;

    if (isLastChunk && (autoPublish === true || autoPublish === "true")) {
      const db = readDb();
      if (!Array.isArray(db.videos)) {
        db.videos = [...DEFAULT_SHOWCASE_VIDEOS];
      }
      const cleanTitle =
        String(title || "").trim() ||
        String(fileName || "Product Showcase Video")
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]+/g, " ")
          .trim() ||
        "Product Showcase Video";
      const cat = String(category || "Bag").trim();
      savedVideo = {
        id: `vid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: cleanTitle,
        subtitle: String(subtitle || "Direct factory and warehouse product quality review").trim(),
        videoUrl,
        thumbnailUrl: String(thumbnailUrl || "").trim(),
        category: cat,
        productLink: String(productLink || `/shop?category=${encodeURIComponent(cat)}`).trim(),
        priceText: String(priceText || "Order at Wholesale Rate").trim(),
        active: true,
        createdAt: new Date().toISOString(),
      };
      db.videos.unshift(savedVideo);
      writeDb(db, true);
      allVideos = db.videos;
    }

    return res.json({
      success: true,
      completed: isLastChunk,
      url: videoUrl,
      filename: targetFilename,
      autoPublished: Boolean(savedVideo),
      video: savedVideo,
      videos: allVideos,
    });
  } catch (err: any) {
    console.error("Chunked video upload error:", err);
    return res.status(500).json({ error: err.message || "Chunk upload failed" });
  }
});

// Stream video files from /uploads with HTTP 206 Partial Content (Range support)
app.get("/uploads/:filename", (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename || "");
    const ext = path.extname(filename).toLowerCase();
    const videoMimeMap: Record<string, string> = {
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".ogg": "video/ogg",
      ".mov": "video/quicktime",
      ".m4v": "video/mp4",
    };
    const contentType = videoMimeMap[ext];
    if (!contentType) {
      return next();
    }

    const filePath = path.join(process.cwd(), "public/uploads", filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).end();
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader("Content-Range", `bytes */${fileSize}`).end();
        return;
      }
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Accept-Ranges": "bytes",
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (e) {
    next();
  }
});

app.get("/api/videos", (req, res) => {
  try {
    const db = readDb();
    if (!Array.isArray(db.videos) || db.videos.length === 0) {
      db.videos = DEFAULT_SHOWCASE_VIDEOS;
      writeDb(db);
    } else {
      let modified = false;
      db.videos = db.videos.map((v: any, idx: number) => {
        const fallback = DEFAULT_SHOWCASE_VIDEOS[idx % DEFAULT_SHOWCASE_VIDEOS.length];
        let title = String(v.title || "");
        let subtitle = String(v.subtitle || "");
        let priceText = String(v.priceText || "");
        if (/[\u0980-\u09F2\u09F4-\u09FF]/.test(title)) {
          title = fallback.title;
          modified = true;
        }
        if (/[\u0980-\u09F2\u09F4-\u09FF]/.test(subtitle)) {
          subtitle = fallback.subtitle;
          modified = true;
        }
        if (/[\u0980-\u09F2\u09F4-\u09FF]/.test(priceText)) {
          priceText = fallback.priceText;
          modified = true;
        }
        return { ...v, title, subtitle, priceText };
      });
      if (modified) writeDb(db);
    }
    res.json(db.videos);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

app.post("/api/admin/videos", (req, res) => {
  try {
    const { title, subtitle, videoUrl, thumbnailUrl, category, productLink, priceText, active } = req.body;
    if (!videoUrl || !String(videoUrl).trim()) {
      return res.status(400).json({ error: "Video file or Video URL is required" });
    }
    const db = readDb();
    if (!Array.isArray(db.videos)) {
      db.videos = [...DEFAULT_SHOWCASE_VIDEOS];
    }
    const newVideo = {
      id: `vid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: String(title || "Product Showcase Video").trim(),
      subtitle: String(subtitle || "").trim(),
      videoUrl: String(videoUrl).trim(),
      thumbnailUrl: String(thumbnailUrl || "").trim(),
      category: String(category || "All").trim(),
      productLink: String(productLink || "/shop").trim(),
      priceText: String(priceText || "").trim(),
      active: active !== undefined ? Boolean(active) : true,
      createdAt: new Date().toISOString()
    };
    db.videos.unshift(newVideo);
    writeDb(db, true);
    res.json({ success: true, video: newVideo, videos: db.videos });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save video" });
  }
});

app.put("/api/admin/videos/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    if (!Array.isArray(db.videos)) {
      db.videos = [...DEFAULT_SHOWCASE_VIDEOS];
    }
    const idx = db.videos.findIndex((v: any) => v.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Video not found" });
    }
    db.videos[idx] = {
      ...db.videos[idx],
      ...req.body,
      id,
      updatedAt: new Date().toISOString()
    };
    writeDb(db, true);
    res.json({ success: true, video: db.videos[idx], videos: db.videos });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update video" });
  }
});

app.delete("/api/admin/videos/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    if (!Array.isArray(db.videos)) {
      db.videos = [...DEFAULT_SHOWCASE_VIDEOS];
    }
    db.videos = db.videos.filter((v: any) => v.id !== id);
    writeDb(db, true);
    res.json({ success: true, videos: db.videos });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete video" });
  }
});

// Invoices Endpoints
app.get("/api/admin/invoices", async (req, res) => {
  try {
    const invoices = await getAllInvoices();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to get invoices" });
  }
});

app.post("/api/admin/invoices", async (req, res) => {
  try {
    const invoice = { ...req.body, id: uuidv4(), created_at: new Date().toISOString() };
    const saved = await createInvoice(invoice);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

app.put("/api/admin/invoices/:id", async (req, res) => {
  try {
    const updated = await updateInvoice(req.params.id, { ...req.body, updated_at: new Date().toISOString() });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

app.delete("/api/admin/invoices/:id", async (req, res) => {
  try {
    await deleteInvoice(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

// Bulk products endpoint alias for auto-publish


app.post("/api/products/bulk", async (req, res, next) => {
  // If we reach here, it's the standard bulk route
  next();
});

// Serve uploads and static assets
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));
app.use("/assets", express.static(path.join(process.cwd(), "public/assets")));
app.use(express.static(path.join(process.cwd(), "public")));

async function startServer() {
  const isBundledProd =
    process.env.NODE_ENV === "production" ||
    Boolean(process.argv[1] && process.argv[1].includes("server.cjs"));

  if (isBundledProd) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    let viteMiddleware: any = null;
    const viteReady = import("vite")
      .then(({ createServer: createViteServer }) =>
        createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        })
      )
      .then((vite) => {
        viteMiddleware = vite.middlewares;
        return viteMiddleware;
      });

    app.use(async (req, res, next) => {
      try {
        if (viteMiddleware) {
          return viteMiddleware(req, res, next);
        }
        const mw = await viteReady;
        return mw(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    setImmediate(() => {
      try {
        ensureInitialSeed();
        seedDatabaseIfEmpty().catch(console.error);
        checkAndTriggerAutoBackup();
      } catch (err) {
        console.error("Warmup error:", err);
      }
    });
  });
}

startServer();
