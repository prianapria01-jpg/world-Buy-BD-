import fs from "fs";
import path from "path";
import { getLocalData, saveLocalData } from "./service.ts";

export interface BackupSnapshotMeta {
  filename: string;
  createdAt: string;
  productsCount: number;
  sizeBytes: number;
  sizeFormatted: string;
  note: string;
  type: "manual" | "auto";
  version: string;
}

const BACKUP_DIR = path.resolve(process.cwd(), "data/backups/products");

export function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * List all saved product snapshots sorted newest first
 */
export function listProductSnapshots(): BackupSnapshotMeta[] {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith(".json"));
  const snapshots: BackupSnapshotMeta[] = [];

  for (const file of files) {
    try {
      const fullPath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(fullPath);
      
      // Try to read meta header
      let productsCount = 0;
      let note = "";
      let type: "manual" | "auto" = file.includes("auto") ? "auto" : "manual";
      let version = "1.0";
      let createdAt = stats.mtime.toISOString();

      try {
        const raw = fs.readFileSync(fullPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && parsed.exportMeta) {
          productsCount = parsed.exportMeta.productsCount || (Array.isArray(parsed.products) ? parsed.products.length : 0);
          note = parsed.exportMeta.note || "";
          type = parsed.exportMeta.type === "auto" ? "auto" : type;
          version = parsed.exportMeta.version || "1.0";
          createdAt = parsed.exportMeta.exportedAt || createdAt;
        } else if (Array.isArray(parsed)) {
          productsCount = parsed.length;
        } else if (parsed && Array.isArray(parsed.products)) {
          productsCount = parsed.products.length;
        }
      } catch (err) {
        console.warn(`Could not parse snapshot file ${file}:`, err);
      }

      snapshots.push({
        filename: file,
        createdAt,
        productsCount,
        sizeBytes: stats.size,
        sizeFormatted: formatBytes(stats.size),
        note,
        type,
        version
      });
    } catch (e) {
      console.warn("Error reading backup stat for file:", file, e);
    }
  }

  // Sort newest first
  return snapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Create a new snapshot of current products
 */
export function createProductSnapshot(note: string = "", type: "manual" | "auto" = "manual"): BackupSnapshotMeta {
  ensureBackupDir();
  const data = getLocalData();
  const prods = Array.isArray(data.products) ? data.products : [];
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `products_${type}_${timestamp}_${prods.length}items.json`;
  const fullPath = path.join(BACKUP_DIR, filename);

  const payload = {
    exportMeta: {
      version: "1.0",
      type,
      exportedAt: new Date().toISOString(),
      productsCount: prods.length,
      note: note.trim() || (type === "auto" ? "Automated system backup snapshot" : "Manual product snapshot"),
      source: "World Buy BD Products Backup System",
      schema: "v1_full_products"
    },
    products: prods
  };

  fs.writeFileSync(fullPath, JSON.stringify(payload, null, 2), "utf-8");
  const stats = fs.statSync(fullPath);

  // Keep at most 30 recent snapshots to prevent unlimited disk growth
  cleanupOldSnapshots(30);

  return {
    filename,
    createdAt: payload.exportMeta.exportedAt,
    productsCount: prods.length,
    sizeBytes: stats.size,
    sizeFormatted: formatBytes(stats.size),
    note: payload.exportMeta.note,
    type,
    version: "1.0"
  };
}

/**
 * Clean up old snapshots keeping the top N newest
 */
export function cleanupOldSnapshots(keepCount: number = 30): void {
  try {
    ensureBackupDir();
    const snapshots = listProductSnapshots();
    if (snapshots.length > keepCount) {
      const toDelete = snapshots.slice(keepCount);
      for (const item of toDelete) {
        const fullPath = path.join(BACKUP_DIR, item.filename);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    }
  } catch (err) {
    console.warn("Cleanup old snapshots failed:", err);
  }
}

/**
 * Get snapshot file full path for download or inspection
 */
export function getSnapshotPath(filename: string): string | null {
  ensureBackupDir();
  // Prevent directory traversal
  const safeFilename = path.basename(filename);
  const fullPath = path.join(BACKUP_DIR, safeFilename);
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }
  return null;
}

/**
 * Delete a snapshot file
 */
export function deleteProductSnapshot(filename: string): boolean {
  ensureBackupDir();
  const safeFilename = path.basename(filename);
  const fullPath = path.join(BACKUP_DIR, safeFilename);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
}

/**
 * Restore products from a snapshot file
 */
export function restoreSnapshotByFilename(filename: string, mode: "merge" | "replace" = "merge"): {
  success: boolean;
  restoredCount: number;
  totalProducts: number;
  message: string;
} {
  const fullPath = getSnapshotPath(filename);
  if (!fullPath) {
    throw new Error("Specified snapshot file was not found.");
  }

  const raw = fs.readFileSync(fullPath, "utf-8");
  const parsed = JSON.parse(raw);
  let incomingProducts: any[] = [];

  if (Array.isArray(parsed)) {
    incomingProducts = parsed;
  } else if (parsed && Array.isArray(parsed.products)) {
    incomingProducts = parsed.products;
  }

  if (incomingProducts.length === 0) {
    throw new Error("Snapshot file contains no valid products.");
  }

  // Safety snapshot before restore
  try {
    createProductSnapshot("Pre-restore automatic fallback safeguard", "auto");
  } catch (e) {
    console.warn("Pre-restore safeguard snapshot failed:", e);
  }

  const data = getLocalData();
  data.products = Array.isArray(data.products) ? data.products : [];

  if (mode === "replace") {
    // Sanitize incoming
    const valid = incomingProducts.filter((p: any) => p && (p.name || p.title));
    data.products = valid.map((item: any, idx: number) => {
      const key = String(item.id || item.offerId || item.importedUrl || `prod-${Date.now()}-${idx}`);
      return { ...item, id: item.id || key };
    });
    saveLocalData(data, true);
    return {
      success: true,
      restoredCount: data.products.length,
      totalProducts: data.products.length,
      message: `Full catalog replaced with ${data.products.length} products from snapshot!`
    };
  } else {
    // Merge mode
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

    return {
      success: true,
      restoredCount,
      totalProducts: data.products.length,
      message: `Successfully merged and synced ${restoredCount} products from snapshot (Total: ${data.products.length})`
    };
  }
}

/**
 * Convert products array to UTF-8 BOM CSV for Excel / Google Sheets
 */
export function exportProductsToCSV(productsList: any[]): string {
  const headers = [
    "Product ID",
    "1688 Offer ID",
    "Product Name",
    "Category",
    "Brand",
    "Unit",
    "Price BDT (Tk)",
    "Original Price BDT (Tk)",
    "RMB Price (¥)",
    "Discount (%)",
    "Stock Qty",
    "Min Order Qty",
    "Sold Display",
    "Rating",
    "Primary Image URL",
    "Total Images",
    "Variants Count",
    "Product URL / Source",
    "Status",
    "Created At"
  ];

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    // Replace double quotes with escaped double quotes
    str = str.replace(/"/g, '""');
    // If string has commas, newlines, or quotes, wrap in quotes
    return `"${str}"`;
  };

  const rows = [headers.join(",")];

  for (const p of productsList) {
    if (!p) continue;
    const variantsCount = Array.isArray(p.variants) 
      ? p.variants.length 
      : Array.isArray(p.skuDetails) 
        ? p.skuDetails.length 
        : 0;

    const imagesCount = Array.isArray(p.images) ? p.images.length : (p.image ? 1 : 0);

    const row = [
      escapeCSV(p.id || ""),
      escapeCSV(p.offerId || ""),
      escapeCSV(p.name || p.title || "Unnamed Product"),
      escapeCSV(p.category || "Uncategorized"),
      escapeCSV(p.brand || "Direct Factory Import"),
      escapeCSV(p.unit || "piece"),
      escapeCSV(p.price || 0),
      escapeCSV(p.originalPrice || p.price || 0),
      escapeCSV(p.rmbPrice || 0),
      escapeCSV(p.discount || 0),
      escapeCSV(p.stock !== undefined ? p.stock : 999),
      escapeCSV(p.minOrderQuantity || 1),
      escapeCSV(p.soldDisplay || "0+ sold"),
      escapeCSV(p.rating || 4.8),
      escapeCSV(p.image || (Array.isArray(p.images) && p.images[0]) || ""),
      escapeCSV(imagesCount),
      escapeCSV(variantsCount),
      escapeCSV(p.importedUrl || `https://detail.1688.com/offer/${p.offerId || ""}.html`),
      escapeCSV(p.status || "active"),
      escapeCSV(p.createdAt || new Date().toISOString())
    ];

    rows.push(row.join(","));
  }

  // Prepend UTF-8 BOM so Excel opens Bangla and English characters properly without encoding issues
  return "\uFEFF" + rows.join("\r\n");
}

/**
 * Auto-backup trigger: checks if any snapshot was taken in the last 24h, if not creates one
 */
export function checkAndTriggerAutoBackup(): void {
  try {
    ensureBackupDir();
    const snapshots = listProductSnapshots();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const recentSnapshot = snapshots.find(s => (now - new Date(s.createdAt).getTime()) < oneDayMs);
    if (!recentSnapshot) {
      console.log("[Auto-Backup] No recent product backup found in last 24 hours. Creating automated snapshot...");
      const newSnap = createProductSnapshot("Automated daily system safeguard backup", "auto");
      console.log(`[Auto-Backup] Created ${newSnap.filename} with ${newSnap.productsCount} products.`);
    }
  } catch (err) {
    console.warn("[Auto-Backup] Check error:", err);
  }
}
