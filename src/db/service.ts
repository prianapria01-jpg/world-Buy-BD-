import { db, isPostgresConfigured } from './index.ts';
import { products, categories, orders, users, subadmins, settings, banners, stockOutRefunds, auditLogs, invoices } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { getCanonicalCategoryName, getMappedSlug, getCategoryImage, syncSkuDetailsWithVariants } from '../utils/categories.ts';
import { buildSubOrdersFromItems, enrichOrderWithSubOrders } from '../utils/orderVariations.ts';
import { findAssignedMarketingForCustomer, normalizeCustomerPhone, getCustomerPhoneTail, extractOrderPhone, extractOrderUserId } from '../utils/customerMarketingSync.ts';

const DB_FILE = path.join(process.cwd(), 'data.json');
const PRODUCTS_BACKUP_FILE = path.join(process.cwd(), 'data', 'products.json');

let localDataCache: any = null;
let lastLocalDataMtime: number = 0;
let lastStatCheckTime: number = 0;
let pendingWriteTimer: NodeJS.Timeout | null = null;

// In-memory product catalog caches for sub-millisecond responses
let cachedFullProducts: any[] | null = null;
let cachedSummaryProducts: any[] | null = null;
let cachedProductLookupMap: Map<string, any> | null = null;
let cachedRmbRate: number = 0;

export function invalidateProductCache() {
  cachedFullProducts = null;
  cachedSummaryProducts = null;
  cachedProductLookupMap = null;
}

export function getLocalData(): any {
  try {
    const now = Date.now();
    // Avoid fs.statSync on every call; only stat at most once every 5 seconds if cache is already loaded
    if (localDataCache && now - lastStatCheckTime < 5000) {
      return localDataCache;
    }
    lastStatCheckTime = now;
    if (fs.existsSync(DB_FILE)) {
      const stats = fs.statSync(DB_FILE);
      if (localDataCache && stats.mtimeMs <= lastLocalDataMtime) {
        return localDataCache;
      }
      localDataCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      // Restore products from data/products.json backup if data.json products list is empty
      if ((!Array.isArray(localDataCache.products) || localDataCache.products.length === 0) && fs.existsSync(PRODUCTS_BACKUP_FILE)) {
        try {
          const backupProds = JSON.parse(fs.readFileSync(PRODUCTS_BACKUP_FILE, 'utf-8'));
          if (Array.isArray(backupProds) && backupProds.length > 0) {
            localDataCache.products = backupProds;
          }
        } catch {}
      }
      lastLocalDataMtime = stats.mtimeMs;
      invalidateProductCache();
      return localDataCache;
    }
  } catch (e) {
    console.error("Error reading data.json:", e);
    if (localDataCache) return localDataCache;
  }
  let fallbackProducts: any[] = [];
  if (fs.existsSync(PRODUCTS_BACKUP_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(PRODUCTS_BACKUP_FILE, 'utf-8'));
      if (Array.isArray(parsed)) fallbackProducts = parsed;
    } catch {}
  }
  localDataCache = { products: fallbackProducts, categories: [], orders: [], users: [], subadmins: [], settings: {}, banners: [], invoices: [] };
  return localDataCache;
}

export function saveLocalData(data: any, invalidateProducts = false) {
  try {
    localDataCache = data;
    lastStatCheckTime = Date.now();
    if (invalidateProducts) {
      invalidateProductCache();
    }
    if (pendingWriteTimer) {
      clearTimeout(pendingWriteTimer);
      pendingWriteTimer = null;
    }
    const serialized = JSON.stringify(localDataCache);
    fs.writeFileSync(DB_FILE, serialized, 'utf-8');
    try {
      const st = fs.statSync(DB_FILE);
      lastLocalDataMtime = st.mtimeMs;
    } catch {
      lastLocalDataMtime = Date.now() + 2000;
    }
    if (invalidateProducts && Array.isArray(localDataCache.products)) {
      try {
        const dataDir = path.dirname(PRODUCTS_BACKUP_FILE);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(PRODUCTS_BACKUP_FILE, JSON.stringify(localDataCache.products), 'utf-8');
      } catch (backupErr) {
        console.warn("Backup write to data/products.json warning:", backupErr);
      }
    }
  } catch (e) {
    console.error("Error writing to data.json:", e);
  }
}

export function toProductSummary(p: any): any {
  const itemCode =
    p.specifications && typeof p.specifications === 'object' && !Array.isArray(p.specifications)
      ? p.specifications['货号'] || p.specifications['Item No'] || p.specifications['Model'] || p.specifications['SKU']
      : undefined;

  return {
    id: p.id,
    offerId: p.offerId,
    name: p.name || p.title,
    title: p.title || p.name,
    originalTitle: p.originalTitle,
    category: getCanonicalCategoryName(p.category, p.name || p.title || p.originalTitle),
    brand: p.brand,
    price: p.price,
    rmbPrice: p.rmbPrice,
    originalPrice: p.originalPrice,
    discount: p.discount,
    image: p.image || (Array.isArray(p.images) ? p.images[0] : ''),
    images: Array.isArray(p.images) ? p.images.slice(0, 2) : p.image ? [p.image] : [],
    rating: p.rating,
    reviewCount: p.reviewCount ?? p.reviews,
    reviews: p.reviews ?? p.reviewCount,
    stock: p.stock,
    status: p.status === 'draft' ? 'draft' : 'published',
    minOrderQuantity: p.minOrderQuantity || 1,
    soldDisplay: p.soldDisplay,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    isTrending: p.isTrending,
    importedUrl: p.importedUrl,
    quantityPrices: p.quantityPrices,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    code: p.code,
    productCode: p.productCode,
    specifications: itemCode ? { '货号': itemCode } : undefined,
  };
}

export async function seedDatabaseIfEmpty() {
  if (isPostgresConfigured() && db) {
    try {
      const allProducts = await db.select().from(products);
      if (allProducts.length === 0) {
        console.log("Seeding initial data from data.json to PostgreSQL...");
        const data = getLocalData();
        if (data.products && data.products.length > 0) {
          for (const p of data.products) {
            await db.insert(products).values({
              offerId: String(p.offerId || p.id),
              name: p.name || p.title,
              description: p.description,
              price: p.price || 0,
              originalPrice: p.originalPrice,
              discount: p.discount,
              image: p.image,
              images: p.images || [],
              category: p.category,
              status: p.status,
              stock: p.stock || 100,
              minOrderQuantity: p.minOrderQuantity || 1,
              skuDetails: p.skuDetails,
              specifications: p.specifications || p.specs,
              videoUrl: p.videoUrl,
              descriptionHtml: p.descriptionHtml,
              descriptionImages: p.descriptionImages,
              sellerInfo: p.sellerInfo,
              quantityPrices: p.quantityPrices,
              soldDisplay: p.soldDisplay,
              brand: p.brand,
              reviewCount: p.reviewCount,
              rating: p.rating
            }).onConflictDoNothing();
          }
        }
        if (data.categories && data.categories.length > 0) {
          for (const c of data.categories) {
            await db.insert(categories).values({
              name: c.name,
              slug: c.slug || c.id,
              icon: c.icon,
              image: c.image
            }).onConflictDoNothing();
          }
        }
        console.log("Seeding complete.");
      }
    } catch (e) {
      console.warn("Postgres seeding skipped or failed:", e);
    }
  }
}

// Banners
export async function getAllBanners() {
  if (isPostgresConfigured() && db) {
    try {
      return await db.select().from(banners).orderBy(banners.displayOrder);
    } catch (e) {
      console.warn("Postgres getAllBanners failed, using local:", e);
    }
  }
  const data = getLocalData();
  return (data.banners || []).sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

export async function createBanner(bannerData: any) {
  const data = getLocalData();
  data.banners = data.banners || [];
  const newBanner = { id: Date.now(), ...bannerData, createdAt: new Date().toISOString() };
  data.banners.push(newBanner);
  saveLocalData(data);

  if (isPostgresConfigured() && db) {
    try {
      const result = await db.insert(banners).values(bannerData).returning();
      return result[0];
    } catch (e) {
      console.warn("Postgres createBanner failed, stored locally:", e);
    }
  }
  return newBanner;
}

export async function updateBanner(id: number | string, bannerData: any) {
  const data = getLocalData();
  data.banners = data.banners || [];
  const idx = data.banners.findIndex((b: any) => String(b.id) === String(id));
  let updatedBanner = null;
  if (idx !== -1) {
    data.banners[idx] = { ...data.banners[idx], ...bannerData };
    updatedBanner = data.banners[idx];
    saveLocalData(data);
  }

  if (isPostgresConfigured() && db) {
    try {
      const numId = typeof id === 'number' ? id : parseInt(id, 10);
      if (!isNaN(numId)) {
        const result = await db.update(banners).set(bannerData).where(eq(banners.id, numId)).returning();
        return result[0] || updatedBanner;
      }
    } catch (e) {
      console.warn("Postgres updateBanner failed:", e);
    }
  }
  return updatedBanner;
}

export async function deleteBanner(id: number | string) {
  const data = getLocalData();
  if (data.banners) {
    data.banners = data.banners.filter((b: any) => String(b.id) !== String(id));
    saveLocalData(data);
  }
  if (isPostgresConfigured() && db) {
    try {
      const numId = typeof id === 'number' ? id : parseInt(id, 10);
      if (!isNaN(numId)) {
        await db.delete(banners).where(eq(banners.id, numId));
      }
    } catch (e) {
      console.warn("Postgres deleteBanner failed:", e);
    }
  }
}

// Settings
export async function getStoreSettings() {
  if (isPostgresConfigured() && db) {
    try {
      const allSettings = await db.select().from(settings);
      if (allSettings && allSettings.length > 0) {
        const result: any = {};
        allSettings.forEach(s => { result[s.key] = s.value; });
        return result;
      }
    } catch (e) {
      console.warn("Postgres getStoreSettings failed, using local:", e);
    }
  }
  const data = getLocalData();
  return data.settings || {};
}

export function recalculateProductPrice(p: any, rmbRate: number): any {
  const currentRate = Number(rmbRate) || 22.80;
  // Detect wholesale RMB price from variant or stored rmbPrice or prior calculation
  const varPrice = p.skuDetails?.variants?.find((v: any) => v && typeof v.price === 'number' && v.price > 0 && v.price < 500)?.price;
  const rmb = Number(p.rmbPrice) || varPrice || (p.price ? Number((p.price / 22.80).toFixed(2)) : 0);

  let pPrice = p.price;
  if (rmb > 0) {
    pPrice = Math.round(rmb * currentRate);
  } else if (pPrice === null || pPrice === undefined || isNaN(Number(pPrice))) {
    pPrice = 0;
  } else {
    pPrice = Number(pPrice);
  }

  const discount = typeof p.discount === 'number' && p.discount > 0 ? p.discount : 3;
  const pOrig = pPrice > 0 ? Math.round(pPrice / (1 - discount / 100)) : 0;

  let updatedQuantityPrices = p.quantityPrices;
  if (Array.isArray(p.quantityPrices)) {
    updatedQuantityPrices = p.quantityPrices.map((tier: any) => {
      const tierRmb = Number(tier.rmbPrice) || (tier.price ? Number((tier.price / 22.80).toFixed(2)) : rmb);
      return {
        ...tier,
        rmbPrice: tierRmb,
        price: tierRmb > 0 ? Math.round(tierRmb * currentRate) : tier.price
      };
    });
  }

  let updatedVariants = p.variants;
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    updatedVariants = p.variants.map((v: any) => {
      const vRmb = Number(v.priceRmb) || (typeof v.price === 'number' && v.price < 400 ? Number(v.price) : 0);
      const vBdt = vRmb > 0 
        ? Math.round(vRmb * currentRate) 
        : (typeof v.priceBdt === 'number' && v.priceBdt > 0 ? v.priceBdt : (typeof v.price === 'number' && v.price > 0 ? v.price : pPrice));
      return {
        ...v,
        priceRmb: vRmb > 0 ? vRmb : (v.priceRmb || undefined),
        priceBdt: vBdt,
        price: vBdt
      };
    });
  }

  let updatedSkuDetails =
    (Array.isArray(updatedVariants) && (updatedVariants.length > 0 || p.variantsEdited)) ||
    (Array.isArray(p.skuDetails?.variants) && p.skuDetails.variants.length > 0)
      ? syncSkuDetailsWithVariants(p.skuDetails, updatedVariants, Boolean(p.variantsEdited))
      : p.skuDetails;
  if (updatedSkuDetails && Array.isArray(updatedSkuDetails.variants)) {
    updatedSkuDetails = {
      ...updatedSkuDetails,
      variants: updatedSkuDetails.variants.map((sv: any) => {
        const svRmb = Number(sv.priceRmb ?? sv.price) || rmb;
        const svBdt = svRmb > 0 ? Math.round(svRmb * currentRate) : (sv.priceBdt || pPrice);
        return {
          ...sv,
          priceRmb: svRmb,
          priceBdt: svBdt,
          price: svRmb
        };
      })
    };
  }

  return {
    ...p,
    category: getCanonicalCategoryName(p.category, p.name || p.title || p.originalTitle),
    rmbPrice: rmb > 0 ? rmb : undefined,
    price: pPrice,
    originalPrice: pOrig,
    quantityPrices: updatedQuantityPrices,
    variants: updatedVariants,
    skuDetails: updatedSkuDetails,
    stock: Number(p.stock) || 0
  };
}

export async function updateStoreSettings(newSettings: any) {
  const data = getLocalData();
  data.settings = { ...(data.settings || {}), ...newSettings };

  const newRmbRate = newSettings.rmbRate !== undefined && newSettings.rmbRate !== null
    ? Number(newSettings.rmbRate)
    : undefined;

  if (newRmbRate && !isNaN(newRmbRate) && newRmbRate > 0) {
    data.settings.rmbRate = newRmbRate;
    // Automatically recalculate BDT prices for all stored products according to new RMB rate
    if (Array.isArray(data.products)) {
      data.products = data.products.map((p: any) => recalculateProductPrice(p, newRmbRate));
    }
  }

  saveLocalData(data, true);

  if (isPostgresConfigured() && db) {
    try {
      for (const key of Object.keys(newSettings)) {
        await db.insert(settings).values({ key, value: newSettings[key] }).onConflictDoUpdate({ target: settings.key, set: { value: newSettings[key] } });
      }
      if (newRmbRate && !isNaN(newRmbRate) && newRmbRate > 0 && Array.isArray(data.products)) {
        for (const p of data.products) {
          await db.update(products).set({ price: p.price, originalPrice: p.originalPrice }).where(eq(products.offerId, String(p.offerId || p.id)));
        }
      }
    } catch (e) {
      console.warn("Postgres updateStoreSettings failed, stored locally:", e);
    }
  }
  return data.settings;
}

export async function updateGlobalDiscount(discount: number) {
  const data = getLocalData();
  data.settings = data.settings || {};
  data.settings.globalDiscount = discount;
  saveLocalData(data, true);

  if (isPostgresConfigured() && db) {
    try {
      await db.insert(settings).values({ key: 'globalDiscount', value: discount }).onConflictDoUpdate({ target: settings.key, set: { value: discount } });
    } catch (e) {
      console.warn("Postgres updateGlobalDiscount failed, stored locally:", e);
    }
  }
}

// Products
export async function getAllProducts() {
  const data = getLocalData();
  const storeSettings = data.settings || {};
  const currentRmbRate = Number(storeSettings.rmbRate) || 22.80;

  if (cachedFullProducts && cachedRmbRate === currentRmbRate) {
    return cachedFullProducts;
  }

  let list: any[] = Array.isArray(data.products) ? data.products : [];
  if (list.length === 0 && isPostgresConfigured() && db) {
    try {
      const prods = await db.select().from(products).orderBy(desc(products.createdAt));
      if (prods && prods.length > 0) list = prods;
    } catch (e) {
      console.warn("Postgres getAllProducts failed, using local:", e);
    }
  }

  // Deduplicate products by id and offerId
  const seenIds = new Set<string>();
  const uniqueList: any[] = [];
  for (const p of list) {
    const pId = String(p?.id || "");
    const pOfferId = String(p?.offerId || "");
    if ((pId && seenIds.has(pId)) || (pOfferId && seenIds.has(pOfferId))) {
      continue;
    }
    if (pId) seenIds.add(pId);
    if (pOfferId) seenIds.add(pOfferId);
    uniqueList.push(p);
  }

  // Ensure every product dynamically reflects the active RMB rate and build fast O(1) lookup map
  const lookupMap = new Map<string, any>();
  const recalculated = uniqueList.map((p: any) => {
    const prod = recalculateProductPrice(p, currentRmbRate);
    if (prod.id) lookupMap.set(String(prod.id), prod);
    if (prod.offerId) lookupMap.set(String(prod.offerId), prod);
    return prod;
  });

  cachedFullProducts = recalculated;
  cachedProductLookupMap = lookupMap;
  cachedRmbRate = currentRmbRate;
  cachedSummaryProducts = recalculated.map(toProductSummary);

  return recalculated;
}

export async function getAllProductsSummary() {
  const data = getLocalData();
  const storeSettings = data.settings || {};
  const currentRmbRate = Number(storeSettings.rmbRate) || 22.80;

  if (cachedSummaryProducts && cachedRmbRate === currentRmbRate) {
    return cachedSummaryProducts;
  }

  await getAllProducts();
  return cachedSummaryProducts || [];
}

export async function getProductById(id: string) {
  if (!id) return null;
  const decodedId = decodeURIComponent(String(id).trim());
  const cleanId = decodedId.replace(/^abb-/, "").trim();
  const strippedId = cleanId.replace(/^wb-(?:1688|supplier|factory|taobao|alibaba|tmall|\d+)-/, "").trim();
  const digitMatch = cleanId.match(/(\d{8,16})/);
  const extractedOfferId = digitMatch ? digitMatch[1] : null;

  // Fast O(1) lookup in memory cache first
  if (!cachedProductLookupMap) {
    await getAllProducts();
  }
  if (cachedProductLookupMap) {
    const fastHit =
      cachedProductLookupMap.get(decodedId) ||
      cachedProductLookupMap.get(cleanId) ||
      cachedProductLookupMap.get(strippedId) ||
      (extractedOfferId ? cachedProductLookupMap.get(extractedOfferId) || cachedProductLookupMap.get(`wb-1688-${extractedOfferId}`) : undefined);
    if (fastHit) {
      return fastHit;
    }
  }

  let found: any = null;
  if (!found) {
    const data = getLocalData();
    const productList = data.products || [];
    
    // 1. Direct match
    found = productList.find((p: any) => 
      String(p.id) === decodedId || 
      String(p.offerId) === decodedId ||
      String(p.id) === cleanId ||
      String(p.offerId) === cleanId ||
      String(p.id) === strippedId ||
      String(p.offerId) === strippedId
    );

    // 2. Extracted numeric Offer ID match
    if (!found && extractedOfferId) {
      found = productList.find((p: any) =>
        String(p.offerId) === extractedOfferId ||
        String(p.id) === extractedOfferId ||
        String(p.id) === `wb-factory-${extractedOfferId}` ||
        String(p.id).includes(extractedOfferId) ||
        (p.importedUrl && p.importedUrl.includes(extractedOfferId))
      );
    }

    // 3. Suffix / Substring match for compound IDs
    if (!found) {
      found = productList.find((p: any) =>
        (p.id && (p.id.endsWith(strippedId) || strippedId.endsWith(p.id))) ||
        (p.offerId && (p.offerId.endsWith(strippedId) || strippedId.endsWith(p.offerId))) ||
        (p.importedUrl && cleanId.length > 10 && p.importedUrl.includes(cleanId))
      );
    }
  }
  if (!found && isPostgresConfigured() && db) {
    try {
      const candidates = [decodedId, cleanId, strippedId, extractedOfferId].filter(Boolean) as string[];
      for (const cand of candidates) {
        const result = await db.select().from(products).where(eq(products.offerId, cand));
        if (result.length > 0) {
          found = result[0];
          break;
        }
        const intId = parseInt(cand, 10);
        if (!isNaN(intId)) {
          const res2 = await db.select().from(products).where(eq(products.id, intId));
          if (res2.length > 0) {
            found = res2[0];
            break;
          }
        }
      }
    } catch (e) {
      console.warn("Postgres getProductById failed, using local:", e);
    }
  }
  if (found) {
    const storeSettings = getLocalData().settings || {};
    const currentRmbRate = Number(storeSettings.rmbRate) || 22.80;
    const recalc = recalculateProductPrice(found, currentRmbRate);
    if (cachedProductLookupMap) {
      cachedProductLookupMap.set(decodedId, recalc);
    }
    return recalc;
  }
  return null;
}

export async function createProduct(prodData: any) {
  const data = getLocalData();
  data.products = data.products || [];
  const canonicalCategory = getCanonicalCategoryName(
    prodData.category,
    prodData.name || prodData.title || prodData.originalTitle
  );
  const syncedSkuDetails = Array.isArray(prodData.variants)
    ? syncSkuDetailsWithVariants(prodData.skuDetails, prodData.variants)
    : prodData.skuDetails;

  const newProd = {
    id: prodData.id || `prod-${Date.now()}`,
    ...prodData,
    skuDetails: syncedSkuDetails,
    variants: Array.isArray(prodData.variants) ? prodData.variants : undefined,
    category: canonicalCategory,
    createdAt: prodData.createdAt || new Date().toISOString()
  };

  // Ensure the category exists in data.categories so custom categories appear automatically
  data.categories = data.categories || [];
  const catSlug = getMappedSlug(canonicalCategory);
  const catExists = data.categories.some(
    (c: any) =>
      c.name?.toLowerCase() === canonicalCategory.toLowerCase() ||
      c.slug?.toLowerCase() === catSlug.toLowerCase()
  );
  if (!catExists && canonicalCategory) {
    data.categories.push({
      id: `cat-${catSlug}-${Date.now()}`,
      name: canonicalCategory,
      slug: catSlug,
      icon: 'Tag',
      image: getCategoryImage(canonicalCategory)
    });
  }

  const isSameProduct = (p: any) =>
    (prodData.offerId && String(p.offerId) === String(prodData.offerId)) ||
    (prodData.id && String(p.id) === String(prodData.id)) ||
    (prodData.importedUrl && p.importedUrl && String(p.importedUrl) === String(prodData.importedUrl));

  const existingMatch = data.products.find(isSameProduct);
  let finalProd: any;

  if (existingMatch) {
    const merged = {
      ...existingMatch,
      ...newProd,
      id: existingMatch.id || newProd.id,
      variants: Array.isArray(prodData.variants) ? prodData.variants : existingMatch.variants,
      skuDetails: Array.isArray(prodData.variants) ? syncedSkuDetails : (newProd.skuDetails ?? existingMatch.skuDetails),
      deletedSkuKeys: Array.isArray(prodData.deletedSkuKeys)
        ? Array.from(new Set([...(existingMatch.deletedSkuKeys || []), ...prodData.deletedSkuKeys]))
        : existingMatch.deletedSkuKeys,
      variantsEdited: Boolean(prodData.variantsEdited || existingMatch.variantsEdited),
      category: canonicalCategory,
      status: newProd.status === 'draft' ? 'draft' : 'published'
    };
    // Remove all duplicate records for this product and place the updated record at the top
    data.products = [merged, ...data.products.filter((p: any) => !isSameProduct(p))];
    finalProd = merged;
  } else {
    finalProd = { ...newProd, status: newProd.status === 'draft' ? 'draft' : 'published' };
    data.products.unshift(finalProd);
  }
  
  saveLocalData(data, true);

  if (isPostgresConfigured() && db) {
    try {
      const offerKey = String(finalProd.offerId || finalProd.id);
      await db
        .insert(products)
        .values({
          offerId: offerKey,
          name: finalProd.name || 'Imported Product',
          description: finalProd.description || null,
          price: Number(finalProd.price) || 0,
          originalPrice: Number(finalProd.originalPrice) || 0,
          discount: Number(finalProd.discount) || 0,
          image: finalProd.image || null,
          images: finalProd.images || [],
          category: canonicalCategory,
          status: finalProd.status || 'published',
          stock: Number(finalProd.stock) || 100,
          minOrderQuantity: Number(finalProd.minOrderQuantity) || 1,
          skuDetails: finalProd.skuDetails || null,
          specifications: finalProd.specifications || [],
          videoUrl: finalProd.videoUrl || null,
          descriptionHtml: finalProd.descriptionHtml || null,
          descriptionImages: finalProd.descriptionImages || [],
          sellerInfo: finalProd.sellerInfo || {},
          quantityPrices: finalProd.quantityPrices || [],
          soldDisplay: finalProd.soldDisplay || null,
          brand: finalProd.brand || null,
          reviewCount: Number(finalProd.reviewCount) || 25,
          rating: String(finalProd.rating || 4.8)
        })
        .onConflictDoUpdate({
          target: products.offerId,
          set: {
            name: finalProd.name || 'Imported Product',
            price: Number(finalProd.price) || 0,
            originalPrice: Number(finalProd.originalPrice) || 0,
            category: canonicalCategory,
            stock: Number(finalProd.stock) || 100,
            minOrderQuantity: Number(finalProd.minOrderQuantity) || 1,
            skuDetails: finalProd.skuDetails || null,
            quantityPrices: finalProd.quantityPrices || [],
            updatedAt: new Date()
          }
        });
    } catch (e) {
      console.warn("Postgres createProduct upsert warning:", e);
    }
  }
  return finalProd;
}

export async function updateProduct(id: string, updateData: any) {
  const data = getLocalData();
  data.products = data.products || [];
  const idx = data.products.findIndex((p: any) => String(p.id) === String(id) || String(p.offerId) === String(id));
  let updatedProd = null;
  const normalizedUpdate = { ...updateData };
  if (normalizedUpdate.category) {
    normalizedUpdate.category = getCanonicalCategoryName(
      normalizedUpdate.category,
      normalizedUpdate.name || (idx !== -1 ? data.products[idx]?.name : '')
    );
  }
  if (Array.isArray(normalizedUpdate.variants)) {
    normalizedUpdate.skuDetails = syncSkuDetailsWithVariants(
      normalizedUpdate.skuDetails ?? (idx !== -1 ? data.products[idx]?.skuDetails : null),
      normalizedUpdate.variants
    );
    normalizedUpdate.variantsEdited = true;
  }
  if (idx !== -1) {
    data.products[idx] = { ...data.products[idx], ...normalizedUpdate, updatedAt: new Date().toISOString() };
    updatedProd = data.products[idx];
    saveLocalData(data, true);
  }

  if (isPostgresConfigured() && db) {
    try {
      const intId = parseInt(id, 10);
      if (!isNaN(intId)) {
        const result = await db.update(products).set({ ...normalizedUpdate, updatedAt: new Date() }).where(eq(products.id, intId)).returning();
        return result[0] || updatedProd;
      } else {
        const result = await db.update(products).set({ ...normalizedUpdate, updatedAt: new Date() }).where(eq(products.offerId, id)).returning();
        return result[0] || updatedProd;
      }
    } catch (e) {
      console.warn("Postgres updateProduct failed:", e);
    }
  }
  return updatedProd;
}

export async function bulkUpdateProductPrices(options: {
  action: "increase" | "decrease";
  type: "amount" | "percent";
  value: number;
  category?: string;
  updateDiscount?: boolean;
  newDiscountPercent?: number;
}) {
  const data = getLocalData();
  data.products = data.products || [];
  let updatedCount = 0;

  for (let i = 0; i < data.products.length; i++) {
    const p = data.products[i];
    if (options.category && options.category !== "" && options.category !== "all") {
      if (p.category !== options.category) continue;
    }

    let currentPrice = typeof p.price === "number" ? p.price : parseFloat(p.price || 0);
    let delta = 0;
    if (options.type === "amount") {
      delta = options.value;
    } else {
      delta = Math.round((currentPrice * options.value) / 100);
    }

    if (options.action === "increase") {
      currentPrice = currentPrice + delta;
    } else {
      currentPrice = Math.max(1, currentPrice - delta);
    }

    p.price = Math.round(currentPrice);

    if (options.updateDiscount && options.newDiscountPercent !== undefined) {
      p.discount = options.newDiscountPercent;
    }

    const currentDiscount = typeof p.discount === "number" ? p.discount : 3;
    const discountFactor = Math.max(0.01, 1 - (currentDiscount / 100));
    p.originalPrice = Math.round(p.price / discountFactor);
    p.updatedAt = new Date().toISOString();
    updatedCount++;
  }

  saveLocalData(data, true);
  return { success: true, updatedCount };
}

export async function deleteProduct(id: string) {
  if (!id) return;
  const decodedId = decodeURIComponent(String(id).trim());
  const cleanId = decodedId.replace(/^abb[-_]?/i, "").trim();
  const strippedId = cleanId.replace(/^wb-(?:1688|supplier|factory|taobao|alibaba|tmall|\d+)-/i, "").trim();
  const matchSet = new Set([decodedId, cleanId, strippedId].filter(Boolean));

  const data = getLocalData();
  if (Array.isArray(data.products)) {
    data.products = data.products.filter((p: any) => {
      const pId = String(p?.id || "").trim();
      const pOfferId = String(p?.offerId || "").trim();
      const pStripped = pId.replace(/^wb-(?:1688|supplier|factory|taobao|alibaba|tmall|\d+)-/i, "").trim();
      if (matchSet.has(pId) || matchSet.has(pOfferId) || (pStripped && matchSet.has(pStripped))) {
        return false;
      }
      return true;
    });
    saveLocalData(data, true);
  }

  if (isPostgresConfigured() && db) {
    try {
      for (const cand of matchSet) {
        await db.delete(products).where(eq(products.offerId, cand));
        const intId = Number(cand);
        if (Number.isInteger(intId) && intId > 0 && intId <= 2147483647) {
          await db.delete(products).where(eq(products.id, intId));
        }
      }
    } catch (e) {
      console.warn("Postgres deleteProduct failed:", e);
    }
  }
}

// Orders
const DEMO_ORDER_IDS = new Set([
  "WBBD-10025",
  "WBBD-10026",
  "WBBD-10027",
  "WBBD-10028",
  "WBBD-10029",
  "WBBD-10030",
  "ORD-1790062702029-5152"
]);

export async function getAllOrders() {
  const data = getLocalData();
  if (!data.ordersResetV2) {
    data.orders = [];
    data.invoices = [];
    data.stockOutCases = [];
    data.ordersResetV2 = true;
    saveLocalData(data);
  }
  const rawOrders = Array.isArray(data.orders) ? data.orders : [];
  const unique = new Map<string, any>();

  for (const o of rawOrders) {
    if (o && (o.id || o.orderId)) {
      const canonicalId = String(o.orderId || o.id);
      if (DEMO_ORDER_IDS.has(canonicalId)) continue;
      const isUploaded = Boolean(
        o.adminChargesUploaded === true ||
          o.invoice?.adminChargesUploaded === true ||
          Number(o.chinaCourierBill || o.chinaCourierCharge || o.invoice?.chinaCourier || 0) > 0
      );
      const cleanShipping = isUploaded ? Number(o.shippingCharge ?? o.invoice?.shippingCharge ?? 0) : 0;
      const cleanCourier = isUploaded ? Number(o.chinaCourierBill ?? o.chinaCourierCharge ?? o.invoice?.chinaCourier ?? 0) : 0;
      const cleanWeight = isUploaded ? (o.weight || o.invoice?.weightApx || "0 KG") : "0 KG";
      unique.set(canonicalId, {
        ...o,
        id: canonicalId,
        orderId: canonicalId,
        status: o.status || "Pending",
        adminChargesUploaded: isUploaded,
        shippingRatePerKg: Number(o.shippingRatePerKg ?? o.invoice?.shippingRatePerKg ?? 780),
        shippingCharge: cleanShipping,
        chinaCourierBill: cleanCourier,
        chinaCourierCharge: cleanCourier,
        weight: cleanWeight,
        invoice: o.invoice
          ? {
              ...o.invoice,
              status: o.status || o.invoice.status || "Pending",
              adminChargesUploaded: isUploaded,
              shippingRatePerKg: Number(o.shippingRatePerKg ?? o.invoice?.shippingRatePerKg ?? 780),
              shippingCharge: cleanShipping,
              chinaCourier: cleanCourier,
              chinaCourierCharge: cleanCourier,
              weight: cleanWeight,
              weightApx: cleanWeight,
            }
          : undefined,
      });
    }
  }

  if (isPostgresConfigured() && db) {
    try {
      const ords = await db.select().from(orders).orderBy(desc(orders.createdAt));
      if (ords && ords.length > 0) {
        for (const pgOrd of ords) {
          const canonicalId = String(pgOrd.orderId || pgOrd.id);
          if (!canonicalId || DEMO_ORDER_IDS.has(canonicalId)) continue;
          const existing = unique.get(canonicalId);
          const pgMeta: any = pgOrd.paymentInfo && typeof pgOrd.paymentInfo === 'object' ? pgOrd.paymentInfo : {};
          const pgUploaded = Boolean(
            pgMeta.adminChargesUploaded === true ||
              pgMeta.invoice?.adminChargesUploaded === true ||
              Number(pgMeta.chinaCourierBill || pgMeta.invoice?.chinaCourier || 0) > 0
          );
          if (existing) {
            unique.set(canonicalId, {
              ...pgOrd,
              ...existing,
              id: canonicalId,
              orderId: canonicalId
            });
          } else {
            unique.set(canonicalId, {
              ...pgOrd,
              id: canonicalId,
              orderId: canonicalId,
              status: pgOrd.status || "Pending",
              userId: pgMeta.userId || null,
              userEmail: pgMeta.userEmail || pgMeta.customerInfo?.email || "",
              userPhone: pgMeta.userPhone || pgOrd.customerPhone || "",
              date: pgOrd.createdAt ? new Date(pgOrd.createdAt).toISOString() : new Date().toISOString(),
              total: Number(pgOrd.totalPrice) || 0,
              subtotal: pgMeta.subtotal ?? Number(pgOrd.totalPrice) ?? 0,
              adminChargesUploaded: pgUploaded,
              shippingRatePerKg: Number(pgMeta.shippingRatePerKg ?? pgMeta.invoice?.shippingRatePerKg ?? 780),
              shippingCharge: pgUploaded ? Number(pgMeta.shippingCharge ?? 0) : 0,
              chinaCourierBill: pgUploaded ? Number(pgMeta.chinaCourierBill ?? 0) : 0,
              discountAmount: pgMeta.discountAmount ?? 0,
              weight: pgUploaded ? (pgMeta.weight || "0 KG") : "0 KG",
              paidAmount: pgMeta.paidAmount ?? Number(pgOrd.totalPrice) ?? 0,
              invoice: pgMeta.invoice || undefined,
              customerInfo: pgMeta.customerInfo || {
                name: pgOrd.customerName || "Customer",
                phone: pgOrd.customerPhone || "",
                email: pgMeta.userEmail || "",
                address: pgOrd.customerAddress || "",
                division: pgMeta.division || "Dhaka",
                postalCode: pgMeta.postalCode || ""
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn("Postgres getAllOrders failed, using local:", e);
    }
  }

  return Array.from(unique.values()).map(o => {
    const enriched = enrichOrderWithSubOrders(o);
    if (!enriched.assignedMarketingStaff?.name && !enriched.assignedMarketingName) {
      const p = extractOrderPhone(enriched);
      const uid = extractOrderUserId(enriched);
      const matched = findAssignedMarketingForCustomer(data, p, uid);
      if (matched) {
        enriched.assignedMarketingStaff = matched.assignedMarketingStaff;
        enriched.assignedMarketingId = matched.assignedMarketingId;
        enriched.assignedMarketingName = matched.assignedMarketingName;
      }
    }
    return enriched;
  });
}

export async function createOrder(orderData: any) {
  const data = getLocalData();
  data.orders = data.orders || [];

  const canonicalId = String(
    orderData.orderId ||
    orderData.id ||
    `WBBD-${Date.now().toString().slice(-6)}`
  );
  const nowIso = orderData.date || orderData.createdAt || new Date().toISOString();
  const items = Array.isArray(orderData.items) ? orderData.items : [];
  const subOrders = buildSubOrdersFromItems(items, canonicalId, orderData);
  const subTotal =
    Number(orderData.subtotal) ||
    items.reduce((acc: number, it: any) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const shippingRatePerKg = Number(orderData.shippingRatePerKg ?? 780);
  const adminChargesUploaded = Boolean(orderData.adminChargesUploaded === true);
  const weightVal = adminChargesUploaded
    ? orderData.weight || (orderData.weightKg ? `${orderData.weightKg} KG` : "0 KG")
    : "0 KG";
  const weightNum = adminChargesUploaded
    ? parseFloat(String(weightVal).replace(/[^0-9.]/g, "")) || 0
    : 0;
  const shippingCharge = adminChargesUploaded
    ? Number(
        orderData.shippingCharge ??
          (weightNum > 0 && shippingRatePerKg > 0 ? Math.round(weightNum * shippingRatePerKg) : 0)
      )
    : 0;
  const chinaCourierBill = adminChargesUploaded
    ? Number(orderData.chinaCourierBill ?? orderData.chinaCourier ?? orderData.chinaCourierCharge ?? 0)
    : 0;
  const discountAmount = Number(orderData.discountAmount ?? orderData.discount ?? 0);
  const grandTotal =
    Math.max(0, subTotal - discountAmount) + shippingCharge + chinaCourierBill;

  // Customer pays 100% of product price upfront -> treated as Partial Paid
  const defaultProductPaid = Math.max(0, subTotal - discountAmount);
  const paidAmount =
    orderData.paidAmount !== undefined
      ? Number(orderData.paidAmount)
      : orderData.paymentInfo?.paidAmount !== undefined
      ? Number(orderData.paymentInfo.paidAmount)
      : defaultProductPaid;
  const resolvedPaymentStatus =
    orderData.paymentStatus && orderData.paymentStatus !== "Unpaid" && orderData.paymentStatus !== "Paid"
      ? orderData.paymentStatus
      : paidAmount > 0
      ? "Partial Paid"
      : "Unpaid";

  const invoiceNumber = orderData.invoice?.invoiceNumber || `INV-${canonicalId}`;
  const customerInfoObj = {
    name: orderData.customerInfo?.name || orderData.customerName || "Customer",
    phone: orderData.customerInfo?.phone || orderData.customerPhone || orderData.userPhone || "",
    email: orderData.customerInfo?.email || orderData.userEmail || "",
    address: orderData.customerInfo?.address || orderData.customerAddress || "",
    division: orderData.customerInfo?.division || orderData.customerInfo?.district || "Dhaka",
    postalCode: orderData.customerInfo?.postalCode || "",
    payment: orderData.paymentMethod || orderData.customerInfo?.payment || "bkash",
    userId: orderData.userId || orderData.customerInfo?.userId || ""
  };

  // Auto-assign Marketing Manager (KAM) based on customer phone number
  const customerPhoneRaw = customerInfoObj.phone || orderData.userPhone || orderData.customerPhone || "";
  const autoMarketing = findAssignedMarketingForCustomer(
    data,
    customerPhoneRaw,
    orderData.userId || customerInfoObj.userId
  );
  const resolvedMarketingStaff = orderData.assignedMarketingStaff || autoMarketing?.assignedMarketingStaff || null;
  const resolvedMarketingId = orderData.assignedMarketingId || resolvedMarketingStaff?.id || autoMarketing?.assignedMarketingId || "";
  const resolvedMarketingName = orderData.assignedMarketingName || resolvedMarketingStaff?.name || autoMarketing?.assignedMarketingName || "";

  const newOrder = {
    ...orderData,
    id: canonicalId,
    orderId: canonicalId,
    mainOrderId: canonicalId,
    isMainOrder: true,
    linkCount: subOrders.length,
    subOrders: subOrders.map((so: any) => ({
      ...so,
      ...(resolvedMarketingStaff ? {
        assignedMarketingStaff: resolvedMarketingStaff,
        assignedMarketingId: resolvedMarketingId,
        assignedMarketingName: resolvedMarketingName
      } : {})
    })),
    assignedMarketingStaff: resolvedMarketingStaff,
    assignedMarketingId: resolvedMarketingId,
    assignedMarketingName: resolvedMarketingName,
    items: items.map((it: any) => {
      const sub = subOrders.find(s => s.linkKey === it.linkKey || s.items.some((si: any) => si === it || (si.cartItemId && si.cartItemId === it.cartItemId)));
      return {
        ...it,
        subOrderId: it.subOrderId || sub?.subOrderId || `${canonicalId}-L1`,
        mainOrderId: canonicalId,
        productLink: it.productLink || sub?.productLink || ""
      };
    }),
    userId: orderData.userId || customerInfoObj.userId || null,
    userEmail: (orderData.userEmail || customerInfoObj.email || "").toString().trim().toLowerCase(),
    userPhone: (orderData.userPhone || customerInfoObj.phone || "").toString().trim(),
    customerInfo: customerInfoObj,
    date: nowIso,
    createdAt: nowIso,
    status: orderData.status || "Pending",
    adminChargesUploaded,
    subtotal: subTotal,
    shippingCharge,
    chinaCourierBill,
    discountAmount,
    weight: weightVal,
    weightKg: weightNum,
    shippingRatePerKg,
    paidAmount,
    dueAmount: Math.max(0, grandTotal - paidAmount),
    paymentStatus: resolvedPaymentStatus,
    total: grandTotal,
    invoice: orderData.invoice || {
      invoiceNumber,
      orderId: canonicalId,
      orderDate: new Date(nowIso).toLocaleDateString("en-GB"),
      invoiceDate: nowIso.slice(0, 10),
      trackingNumber: orderData.trackingNumber || "",
      order1688Id: orderData.order1688Id || "",
      adminChargesUploaded,
      customerName: customerInfoObj.name,
      phone: customerInfoObj.phone,
      email: customerInfoObj.email,
      address: customerInfoObj.address,
      district: customerInfoObj.division,
      postalCode: customerInfoObj.postalCode,
      subTotal,
      productTotal: subTotal,
      chinaCourier: chinaCourierBill,
      shippingRate: shippingRatePerKg,
      shippingRatePerKg,
      shippingCharge,
      weight: String(weightVal),
      weightApx: String(weightVal),
      weightKg: weightNum,
      discount: discountAmount,
      grandTotal,
      totalAmount: grandTotal,
      paidAmount,
      collectedAmount: paidAmount,
      totalDue: Math.max(0, grandTotal - paidAmount),
      dueAmount: Math.max(0, grandTotal - paidAmount),
      paymentNow: Math.max(0, grandTotal - paidAmount),
      paymentMethod: orderData.paymentMethod || customerInfoObj.payment || "bKash",
      paymentStatus: resolvedPaymentStatus,
      status: orderData.status || "Pending",
      ...(resolvedMarketingStaff ? {
        assignedMarketingId: resolvedMarketingId,
        assignedMarketingName: resolvedMarketingName
      } : {})
    }
  };

  data.orders.unshift(newOrder);

  // Permanently remember this customer's phone assignment for future orders
  if (resolvedMarketingStaff && customerPhoneRaw) {
    const normP = normalizeCustomerPhone(customerPhoneRaw);
    const tailP = getCustomerPhoneTail(customerPhoneRaw);
    data.customerAssignments = data.customerAssignments || {};
    if (normP) {
      data.customerAssignments[normP] = {
        assignedMarketingId: resolvedMarketingId,
        assignedMarketingName: resolvedMarketingName,
        assignedMarketingStaff: resolvedMarketingStaff
      };
    }
    if (tailP) {
      data.customerAssignments[tailP] = {
        assignedMarketingId: resolvedMarketingId,
        assignedMarketingName: resolvedMarketingName,
        assignedMarketingStaff: resolvedMarketingStaff
      };
    }
    if (Array.isArray(data.users)) {
      data.users = data.users.map((u: any) => {
        const uPhone = String(u.phone || u.phoneNumber || "").trim();
        const uTail = getCustomerPhoneTail(uPhone);
        if (tailP && uTail && (uTail === tailP || (tailP.length >= 10 && uTail.endsWith(tailP.slice(-10))))) {
          return {
            ...u,
            assignedMarketingStaff: resolvedMarketingStaff,
            assignedMarketingId: resolvedMarketingId,
            assignedMarketingName: resolvedMarketingName,
            updatedAt: new Date().toISOString()
          };
        }
        return u;
      });
    }
  }
  data.invoices = Array.isArray(data.invoices) ? data.invoices : [];
  if (!data.invoices.some((inv: any) => inv.orderId === canonicalId)) {
    data.invoices.unshift({
      id: `inv-${canonicalId}`,
      ...newOrder.invoice,
      created_at: nowIso
    });
  }
  saveLocalData(data);

  if (isPostgresConfigured() && db) {
    try {
      await db.insert(orders).values({
        orderId: canonicalId,
        customerName: customerInfoObj.name,
        customerPhone: customerInfoObj.phone,
        customerAddress: customerInfoObj.address,
        totalPrice: Math.round(grandTotal),
        paymentMethod: newOrder.paymentMethod || customerInfoObj.payment || "bkash",
        paymentStatus: newOrder.paymentStatus || "Unpaid",
        status: newOrder.status || "Pending",
        items: newOrder.items || [],
        paymentInfo: {
          ...(newOrder.paymentInfo || {}),
          userId: newOrder.userId,
          userEmail: newOrder.userEmail,
          userPhone: newOrder.userPhone,
          customerInfo: customerInfoObj,
          subtotal: subTotal,
          shippingCharge,
          chinaCourierBill,
          discountAmount,
          weight: weightVal,
          paidAmount,
          invoice: newOrder.invoice,
          mainOrderId: canonicalId,
          subOrders: newOrder.subOrders,
          linkCount: newOrder.linkCount
        }
      });
    } catch (e) {
      console.warn("Postgres createOrder failed, stored locally:", e);
    }
  }
  return newOrder;
}

export async function updateOrderStatus(id: string, status: string) {
  const data = getLocalData();
  data.orders = data.orders || [];
  const cleanId = String(id).trim();

  // Check if updating an individual subOrderId (e.g. WBBD-123456-L1)
  const isSubOrderId = cleanId.includes("-L");
  if (isSubOrderId) {
    const mainId = cleanId.replace(/-L\d+.*$/, "");
    const parentIdx = data.orders.findIndex(
      (o: any) => String(o.id).trim() === mainId || String(o.orderId).trim() === mainId
    );
    if (parentIdx !== -1) {
      if (Array.isArray(data.orders[parentIdx].subOrders)) {
        const subIdx = data.orders[parentIdx].subOrders.findIndex((s: any) => String(s.subOrderId).trim() === cleanId);
        if (subIdx !== -1) {
          data.orders[parentIdx].subOrders[subIdx].status = status;
        }
      }
      if (data.orders[parentIdx].subOrders?.every((s: any) => s.status === status)) {
        data.orders[parentIdx].status = status;
        if (data.orders[parentIdx].invoice) data.orders[parentIdx].invoice.status = status;
      }
      saveLocalData(data);
      return data.orders[parentIdx];
    }
  }

  const idx = data.orders.findIndex(
    (o: any) => String(o.id).trim() === cleanId || String(o.orderId).trim() === cleanId
  );
  let updatedOrder = null;
  if (idx !== -1) {
    data.orders[idx].status = status;
    if (data.orders[idx].invoice) {
      data.orders[idx].invoice.status = status;
    }
    if (Array.isArray(data.orders[idx].subOrders)) {
      data.orders[idx].subOrders.forEach((s: any) => {
        s.status = status;
      });
    }
    updatedOrder = data.orders[idx];
    saveLocalData(data);
  }

  if (isPostgresConfigured() && db) {
    try {
      const intId = parseInt(id, 10);
      if (!isNaN(intId)) {
        const result = await db.update(orders).set({ status }).where(eq(orders.id, intId)).returning();
        return result[0] || updatedOrder || { id, status };
      }
    } catch (e) {
      console.warn("Postgres updateOrderStatus failed:", e);
    }
  }
  return updatedOrder || { id, status };
}

export async function updateOrderPayment(id: string, paymentInfo: any) {
  const data = getLocalData();
  data.orders = data.orders || [];
  const idx = data.orders.findIndex((o: any) => String(o.id) === String(id));
  let updatedOrder = null;
  if (idx !== -1) {
    data.orders[idx].paymentInfo = paymentInfo;
    data.orders[idx].paymentStatus = 'Verification Pending';
    updatedOrder = data.orders[idx];
    saveLocalData(data);
  }

  if (isPostgresConfigured() && db) {
    try {
      const intId = parseInt(id, 10);
      if (!isNaN(intId)) {
        const result = await db.update(orders).set({ paymentInfo, paymentStatus: 'Verification Pending' }).where(eq(orders.id, intId)).returning();
        return result[0] || updatedOrder || { id, paymentInfo, paymentStatus: 'Verification Pending' };
      }
    } catch (e) {
      console.warn("Postgres updateOrderPayment failed:", e);
    }
  }
  return updatedOrder || { id, paymentInfo, paymentStatus: 'Verification Pending' };
}

export async function verifyOrderPayment(id: string, paymentStatus: string) {
  const newStatus = paymentStatus === 'Verified' ? 'Confirmed Order' : 'Payment Failed';
  const data = getLocalData();
  data.orders = data.orders || [];
  const idx = data.orders.findIndex((o: any) => String(o.id) === String(id));
  let updatedOrder = null;
  if (idx !== -1) {
    data.orders[idx].paymentStatus = paymentStatus;
    data.orders[idx].status = newStatus;
    updatedOrder = data.orders[idx];
    saveLocalData(data);
  }

  if (isPostgresConfigured() && db) {
    try {
      const intId = parseInt(id, 10);
      if (!isNaN(intId)) {
        const result = await db.update(orders).set({ paymentStatus, status: newStatus }).where(eq(orders.id, intId)).returning();
        return result[0] || updatedOrder || { id, paymentStatus, status: newStatus };
      }
    } catch (e) {
      console.warn("Postgres verifyOrderPayment failed:", e);
    }
  }
  return updatedOrder || { id, paymentStatus, status: newStatus };
}

export async function updateOrderInvoice(id: string, invoiceData: any) {
  const data = getLocalData();
  data.orders = data.orders || [];
  const cleanId = String(id).trim();
  const idx = data.orders.findIndex(
    (o: any) => String(o.id).trim() === cleanId || String(o.orderId).trim() === cleanId
  );
  let updatedOrder = null;
  if (idx !== -1) {
    const existingOrder = data.orders[idx];
    const subTotal = Number(invoiceData.subTotal ?? invoiceData.productSubtotal ?? existingOrder.subtotal ?? 0);
    const chinaCourier = Number(invoiceData.chinaCourier ?? invoiceData.chinaCourierCharge ?? 0);
    const weightStr = String(invoiceData.weightApx ?? invoiceData.weight ?? existingOrder.weight ?? "0 KG");
    const weightNum = parseFloat(weightStr.replace(/[^0-9.]/g, "")) || 0;
    const shippingRatePerKg = Number(
      invoiceData.shippingRatePerKg ?? invoiceData.shippingRate ?? existingOrder.shippingRatePerKg ?? 780
    );
    const shippingCharge = Number(
      invoiceData.shippingCharge !== undefined
        ? invoiceData.shippingCharge
        : weightNum > 0 && shippingRatePerKg > 0
        ? Math.round(weightNum * shippingRatePerKg)
        : 0
    );
    const discount = Number(invoiceData.discount ?? 0);
    const grandTotal = Number(
      invoiceData.grandTotal ?? Math.max(0, subTotal - discount) + chinaCourier + shippingCharge
    );
    const defaultPartialPaid = Math.max(0, subTotal - discount);
    const paidAmount = Number(
      invoiceData.paidAmount ?? existingOrder.paidAmount ?? defaultPartialPaid
    );
    const totalDue = Math.max(0, grandTotal - paidAmount);
    const trackingNumber =
      invoiceData.trackingNumber !== undefined
        ? String(invoiceData.trackingNumber)
        : existingOrder.trackingNumber || existingOrder.purchaseInfo?.trackingNumber || "";
    const order1688Id =
      invoiceData.order1688Id !== undefined
        ? String(invoiceData.order1688Id)
        : existingOrder.order1688Id || existingOrder.purchaseInfo?.order1688Id || existingOrder.purchaseInfo?.orderSupplierId || "";

    const syncedInvoice = {
      ...(existingOrder.invoice || {}),
      ...invoiceData,
      orderId: existingOrder.orderId || existingOrder.id,
      adminChargesUploaded: Boolean(
        invoiceData.adminChargesUploaded ?? (chinaCourier > 0 || shippingCharge > 0 || weightNum > 0)
      ),
      trackingNumber,
      order1688Id,
      subTotal,
      productSubtotal: subTotal,
      productTotal: subTotal,
      chinaCourier,
      chinaCourierCharge: chinaCourier,
      shippingRate: shippingRatePerKg,
      shippingRatePerKg,
      shippingCharge,
      discount,
      weight: weightStr,
      weightApx: weightStr,
      weightKg: weightNum,
      grandTotal,
      totalAmount: grandTotal,
      paidAmount,
      collectedAmount: paidAmount,
      totalDue,
      dueAmount: totalDue,
      paymentNow: totalDue,
      updatedAt: new Date().toISOString(),
    };

    data.orders[idx] = {
      ...existingOrder,
      adminChargesUploaded: Boolean(
        invoiceData.adminChargesUploaded ?? (chinaCourier > 0 || shippingCharge > 0 || weightNum > 0)
      ),
      trackingNumber,
      order1688Id,
      subtotal: subTotal,
      chinaCourierBill: chinaCourier,
      chinaCourierCharge: chinaCourier,
      shippingRatePerKg,
      shippingCharge,
      deliveryCharge: shippingCharge,
      discountAmount: discount,
      weight: weightStr,
      weightKg: weightNum,
      total: grandTotal,
      paidAmount,
      dueAmount: totalDue,
      items: Array.isArray(existingOrder.items)
        ? existingOrder.items.map((it: any) => ({
            ...it,
            shippingRatePerKg,
          }))
        : existingOrder.items,
      status: invoiceData.status || existingOrder.status || "Pending",
      paymentStatus: invoiceData.paymentStatus || existingOrder.paymentStatus || "Partial Paid",
      purchaseInfo: {
        ...(existingOrder.purchaseInfo || {}),
        ...(order1688Id ? { order1688Id, orderSupplierId: order1688Id } : {}),
        ...(trackingNumber ? { trackingNumber } : {}),
      },
      chinaWarehouseInfo: {
        ...(existingOrder.chinaWarehouseInfo || {}),
        ...(trackingNumber ? { chinaAwb: trackingNumber } : {}),
      },
      deliveryInfo: {
        ...(existingOrder.deliveryInfo || {}),
        ...(trackingNumber ? { trackingNumber } : {}),
      },
      customerInfo: {
        ...(existingOrder.customerInfo || {}),
        name: invoiceData.customerName || existingOrder.customerInfo?.name || "Customer",
        phone: invoiceData.phone || existingOrder.customerInfo?.phone || "",
        email: invoiceData.email ?? existingOrder.customerInfo?.email ?? "",
        address: invoiceData.address || existingOrder.customerInfo?.address || "",
      },
      invoice: syncedInvoice,
      updatedAt: new Date().toISOString(),
    };

    updatedOrder = data.orders[idx];
    saveLocalData(data);
  }

  // Also maintain data.invoices
  data.invoices = data.invoices || [];
  const invIdx = data.invoices.findIndex(
    (inv: any) => String(inv.orderId) === cleanId || String(inv.id) === String(invoiceData.id)
  );
  if (invIdx !== -1) {
    data.invoices[invIdx] = {
      ...data.invoices[invIdx],
      ...(updatedOrder?.invoice || invoiceData),
      orderId: cleanId,
      updatedAt: new Date().toISOString(),
    };
  } else {
    data.invoices.push({
      id: invoiceData.id || `INV-${Date.now()}`,
      ...(updatedOrder?.invoice || invoiceData),
      orderId: cleanId,
      createdAt: new Date().toISOString(),
    });
  }
  saveLocalData(data);

  return updatedOrder || { id: cleanId, invoice: invoiceData };
}

export async function deleteOrder(id: string) {
  const data = getLocalData();
  if (Array.isArray(data.orders)) {
    data.orders = data.orders.filter(
      (o: any) => String(o.id) !== String(id) && String(o.orderId) !== String(id)
    );
  }
  if (Array.isArray(data.invoices)) {
    data.invoices = data.invoices.filter(
      (inv: any) => String(inv.orderId) !== String(id) && String(inv.id) !== `inv-${id}`
    );
  }
  if (Array.isArray(data.stockOutCases)) {
    data.stockOutCases = data.stockOutCases.filter(
      (so: any) => String(so.orderId) !== String(id)
    );
  }
  saveLocalData(data);

  if (isPostgresConfigured() && db) {
    try {
      await db.delete(orders).where(eq(orders.orderId, String(id)));
      const intId = parseInt(id, 10);
      if (!isNaN(intId)) {
        await db.delete(orders).where(eq(orders.id, intId));
      }
    } catch (e) {
      console.warn("Postgres deleteOrder failed:", e);
    }
  }
  return { success: true, deletedId: id };
}

// Categories
export async function getAllCategories() {
  if (isPostgresConfigured() && db) {
    try {
      const cats = await db.select().from(categories);
      if (cats && cats.length > 0) return cats;
    } catch (e) {
      console.warn("Postgres getAllCategories failed, using local:", e);
    }
  }
  const data = getLocalData();
  return data.categories || [];
}

export async function createCategory(catData: any) {
  const data = getLocalData();
  data.categories = data.categories || [];
  const newCat = {
    id: catData.id || `cat-${Date.now()}`,
    name: catData.name,
    slug: catData.slug || catData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    icon: catData.icon || 'Folder',
    image: catData.image || ''
  };
  data.categories.push(newCat);
  saveLocalData(data);

  if (isPostgresConfigured() && db) {
    try {
      const result = await db.insert(categories).values(catData).returning();
      return result[0] || newCat;
    } catch (e) {
      console.warn("Postgres createCategory failed, using local:", e);
    }
  }
  return newCat;
}

export async function deleteCategory(id: string) {
  const data = getLocalData();
  if (data.categories) {
    data.categories = data.categories.filter((c: any) => String(c.id) !== String(id) && String(c.slug) !== String(id));
    saveLocalData(data);
  }

  if (isPostgresConfigured() && db) {
    try {
      const intId = parseInt(id, 10);
      if (!isNaN(intId)) {
        await db.delete(categories).where(eq(categories.id, intId));
      }
    } catch (e) {
      console.warn("Postgres deleteCategory failed:", e);
    }
  }
}

// Subadmins
export async function getAllSubadmins() {
  if (isPostgresConfigured() && db) {
    try {
      const subs = await db.select().from(subadmins);
      if (subs && subs.length > 0) return subs;
    } catch (e) {
      console.warn("Postgres getAllSubadmins failed, using local:", e);
    }
  }
  const data = getLocalData();
  return data.subadmins || [];
}

export async function createSubadmin(subData: any) {
  const data = getLocalData();
  data.subadmins = data.subadmins || [];
  const newSub = {
    id: subData.id || `sub-${Date.now()}`,
    ...subData,
    createdAt: subData.createdAt || new Date().toISOString()
  };
  data.subadmins.push(newSub);
  saveLocalData(data);

  if (isPostgresConfigured() && db) {
    try {
      const result = await db.insert(subadmins).values(subData).returning();
      return result[0] || newSub;
    } catch (e) {
      console.warn("Postgres createSubadmin failed:", e);
    }
  }
  return newSub;
}

export async function updateSubadmin(id: string, subData: any) {
  const data = getLocalData();
  data.subadmins = data.subadmins || [];
  const idx = data.subadmins.findIndex((s: any) => String(s.id) === String(id));
  let updatedSub = null;
  if (idx !== -1) {
    data.subadmins[idx] = { ...data.subadmins[idx], ...subData };
    updatedSub = data.subadmins[idx];
    saveLocalData(data);
  }

  if (isPostgresConfigured() && db) {
    try {
      const intId = parseInt(id, 10);
      if (!isNaN(intId)) {
        const result = await db.update(subadmins).set(subData).where(eq(subadmins.id, intId)).returning();
        return result[0] || updatedSub;
      }
    } catch (e) {
      console.warn("Postgres updateSubadmin failed:", e);
    }
  }
  return updatedSub;
}

export async function deleteSubadmin(id: string) {
  const data = getLocalData();
  if (data.subadmins) {
    data.subadmins = data.subadmins.filter((s: any) => String(s.id) !== String(id));
    saveLocalData(data);
  }

  if (isPostgresConfigured() && db) {
    try {
      const intId = parseInt(id, 10);
      if (!isNaN(intId)) {
        await db.delete(subadmins).where(eq(subadmins.id, intId));
      }
    } catch (e) {
      console.warn("Postgres deleteSubadmin failed:", e);
    }
  }
}

// Invoices
export async function getAllInvoices() {
  const data = getLocalData();
  return data.invoices || [];
}

export async function createInvoice(invoiceData: any) {
  const data = getLocalData();
  data.invoices = data.invoices || [];
  const newInvoice = { id: invoiceData.id || `INV-${Date.now()}`, ...invoiceData, createdAt: new Date().toISOString() };
  data.invoices.push(newInvoice);
  saveLocalData(data);
  return newInvoice;
}

export async function updateInvoice(id: string, updateData: any) {
  const data = getLocalData();
  data.invoices = data.invoices || [];
  const idx = data.invoices.findIndex((inv: any) => String(inv.id) === String(id));
  if (idx !== -1) {
    data.invoices[idx] = { ...data.invoices[idx], ...updateData };
    saveLocalData(data);
    return data.invoices[idx];
  }
  return updateData;
}

export async function deleteInvoice(id: string) {
  const data = getLocalData();
  if (data.invoices) {
    data.invoices = data.invoices.filter((inv: any) => String(inv.id) !== String(id));
    saveLocalData(data);
  }
}

// Backup & Restoration
export async function restoreProductsBackup(incomingProducts: any[], mode: 'merge' | 'replace' = 'merge') {
  const data = getLocalData();
  data.products = Array.isArray(data.products) ? data.products : [];
  
  if (mode === 'replace') {
    const valid = incomingProducts.filter((p: any) => p && (p.name || p.title));
    data.products = valid.map((item: any, idx: number) => {
      const key = String(item.id || item.offerId || item.importedUrl || `prod-${Date.now()}-${idx}`);
      return { ...item, id: item.id || key };
    });
    saveLocalData(data, true);
    return { restoredCount: data.products.length, totalProducts: data.products.length };
  }

  const existingMap = new Map();
  for (const p of data.products) {
    const key = String(p.id || p.offerId || p.importedUrl || "");
    if (key) existingMap.set(key, p);
  }

  let restoredCount = 0;
  for (const item of incomingProducts) {
    if (!item || (!item.name && !item.title)) continue;
    const key = String(item.id || item.offerId || item.importedUrl || `prod-${Date.now()}-${restoredCount}`);
    item.id = item.id || key;
    existingMap.set(key, item);
    restoredCount++;
  }

  data.products = Array.from(existingMap.values());
  saveLocalData(data, true);

  return { restoredCount, totalProducts: data.products.length };
}

// Audit Logs
export async function createAuditLog(logData: {
  orderId?: string;
  action: string;
  department: string;
  changedBy: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
}) {
  const data = getLocalData();
  data.auditLogs = Array.isArray(data.auditLogs) ? data.auditLogs : [];
  const newLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...logData,
    createdAt: new Date().toISOString()
  };
  data.auditLogs.unshift(newLog); // Newest first
  if (data.auditLogs.length > 2000) {
    data.auditLogs = data.auditLogs.slice(0, 2000);
  }
  saveLocalData(data);

  if (isPostgresConfigured() && db) {
    try {
      await db.insert(auditLogs).values({
        orderId: logData.orderId || null,
        action: logData.action,
        department: logData.department,
        changedBy: logData.changedBy,
        field: logData.field || null,
        oldValue: logData.oldValue ? String(logData.oldValue) : null,
        newValue: logData.newValue ? String(logData.newValue) : null,
        notes: logData.notes || null,
      });
    } catch (e) {
      console.warn("SQL audit log insert error:", e);
    }
  }

  return newLog;
}

export async function getAuditLogs(filter?: { orderId?: string; department?: string; limit?: number }) {
  const data = getLocalData();
  let logs = Array.isArray(data.auditLogs) ? data.auditLogs : [];
  if (filter?.orderId) {
    logs = logs.filter((l: any) => String(l.orderId) === String(filter.orderId));
  }
  if (filter?.department) {
    logs = logs.filter((l: any) => String(l.department).toLowerCase() === String(filter.department).toLowerCase());
  }
  if (filter?.limit && filter.limit > 0) {
    logs = logs.slice(0, filter.limit);
  }
  return logs;
}

