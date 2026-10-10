import { useState, useEffect } from "react";
import { 
  Loader2, Play, ExternalLink, CheckCircle2, ShoppingBag, 
  Layers, Tag, RefreshCw, Trash2, Eye, Filter, Database,
  AlertTriangle, ArrowRight, Download, Upload, Box, ShieldCheck,
  Building2, Image as ImageIcon, ChevronDown, Check, X, Search,
  PlusCircle, Sparkles, Layers2, FileJson, Copy
} from "lucide-react";
import { Link } from "react-router-dom";
import { CATEGORIES_LIST, EXPANDABLE_MAIN_CATEGORIES, cleanEnglishTitle, matchesCategory, mergeWithStoreCategories, getCanonicalCategoryName, syncSkuDetailsWithVariants } from "../../utils/categories";
import { invalidateApiCache } from "../../utils/apiCache";
import { canAccessProductSourceLink } from "../../utils/productPrivacy";

export default function AdminScraper() {
  const [activeTab, setActiveTab] = useState<"single" | "bulk" | "catalog" | "backup">("single");

  // Single Scraper States
  const [url, setUrl] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [scrapeType, setScrapeType] = useState<"url" | "report" | "html">("report");
  const [reportActiveMainCategory, setReportActiveMainCategory] = useState<string>("Bag");
  const [multiReportResults, setMultiReportResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [existingProduct, setExistingProduct] = useState<any>(null);

  // Editable fields before saving
  const [preExtractCategory, setPreExtractCategory] = useState("AUTO");
  const [customTitle, setCustomTitle] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customRmbPrice, setCustomRmbPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Shoes");
  const [customCategory, setCustomCategory] = useState("");
  const [customMoq, setCustomMoq] = useState(1);

  // Batch Scraper States
  const [bulkUrlsText, setBulkUrlsText] = useState("");
  const [bulkCategory, setBulkCategory] = useState("AUTO");
  const [storeCategories, setStoreCategories] = useState<any[]>(CATEGORIES_LIST);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkSaving, setBulkSaving] = useState(false);

  // Scraped Products Catalog & Stats
  const [scrapedProducts, setScrapedProducts] = useState<any[]>([]);
  const [loadingScraped, setLoadingScraped] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingCatId, setUpdatingCatId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [rmbRate, setRmbRate] = useState<number>(22.80);

  // Inspect Modal
  const [inspectingProduct, setInspectingProduct] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Save feedback state
  const [lastSaved, setLastSaved] = useState<{ id: string; name: string; category: string } | null>(null);
  const [savingRate, setSavingRate] = useState(false);
  const [rateSavedSuccess, setRateSavedSuccess] = useState(false);

  // Load store settings and stats
  const loadStatsAndSettings = async () => {
    try {
      const sRes = await fetch("/api/admin/scraper/stats");
      if (sRes.ok) {
        const sData = await sRes.json();
        setStats(sData);
      }
      const confRes = await fetch("/api/settings");
      if (confRes.ok) {
        const cData = await confRes.json();
        if (cData.rmbRate) setRmbRate(Number(cData.rmbRate) || 22.80);
      }
      const catsRes = await fetch("/api/categories");
      if (catsRes.ok) {
        const catsData = await catsRes.json();
        if (Array.isArray(catsData)) {
          setStoreCategories(mergeWithStoreCategories(catsData));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch scraper stats:", e);
    }
  };

  const handleUpdateRmbRate = async (newRate: number) => {
    if (isNaN(newRate) || newRate <= 0) return;
    setSavingRate(true);
    try {
      const confRes = await fetch("/api/settings");
      const currentSettings = confRes.ok ? await confRes.json() : {};
      const updateRes = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...currentSettings, rmbRate: newRate })
      });
      if (updateRes.ok) {
        setRateSavedSuccess(true);
        setTimeout(() => setRateSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update RMB rate:", err);
    } finally {
      setSavingRate(false);
    }
  };

  // Load scraped / imported products from store
  const loadScrapedProducts = async () => {
    setLoadingScraped(true);
    try {
      const res = await fetch("/api/products?full=true");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const scraped = data.filter((p: any) => 
            p.importedUrl || 
            p.offerId ||
            p.category === "Imported" || 
            p.category === "Imported & Scraped" ||
            p.brand === "Imported Direct" ||
            p.skuDetails ||
            Array.isArray(p.variants)
          );
          setScrapedProducts(scraped);
        }
      }
    } catch (err) {
      console.error("Failed to load scraped products:", err);
    } finally {
      setLoadingScraped(false);
    }
  };

  useEffect(() => {
    try {
      const rawWorkspace = localStorage.getItem("worldbuybd_scraper_workspace_v2");
      if (rawWorkspace) {
        const ws = JSON.parse(rawWorkspace);
        if (ws.result) setResult(ws.result);
        if (Array.isArray(ws.multiReportResults)) setMultiReportResults(ws.multiReportResults);
        if (Array.isArray(ws.bulkResults)) setBulkResults(ws.bulkResults);
        if (ws.lastSaved) setLastSaved(ws.lastSaved);
        if (ws.scrapeType) setScrapeType(ws.scrapeType);
        if (typeof ws.url === "string") setUrl(ws.url);
        if (typeof ws.reportContent === "string") setReportContent(ws.reportContent);
        if (typeof ws.bulkUrlsText === "string") setBulkUrlsText(ws.bulkUrlsText);
        if (ws.preExtractCategory) setPreExtractCategory(ws.preExtractCategory);
        if (ws.selectedCategory) setSelectedCategory(ws.selectedCategory);
        if (ws.customTitle) setCustomTitle(ws.customTitle);
        if (ws.customPrice) setCustomPrice(ws.customPrice);
        if (ws.customRmbPrice) setCustomRmbPrice(ws.customRmbPrice);
        if (ws.customMoq) setCustomMoq(ws.customMoq);
      }
    } catch {}
    loadScrapedProducts();
    loadStatsAndSettings();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "worldbuybd_scraper_workspace_v2",
        JSON.stringify({
          result,
          multiReportResults,
          bulkResults,
          lastSaved,
          scrapeType,
          url,
          reportContent,
          bulkUrlsText,
          preExtractCategory,
          selectedCategory,
          customTitle,
          customPrice,
          customRmbPrice,
          customMoq,
        })
      );
    } catch {}
  }, [
    result,
    multiReportResults,
    bulkResults,
    lastSaved,
    scrapeType,
    url,
    reportContent,
    bulkUrlsText,
    preExtractCategory,
    selectedCategory,
    customTitle,
    customPrice,
    customRmbPrice,
    customMoq,
  ]);

  const isReportText = (text: string) => {
    if (!text || typeof text !== "string") return false;
    const s = text.trim();
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
  };

  const isStandaloneCategoryLine = (line: string) => {
    const t = line.trim();
    if (!t || t.length > 50) return false;
    if (
      t.startsWith("===") ||
      t.startsWith("---") ||
      t.startsWith("- ") ||
      t.startsWith("* ") ||
      t.startsWith("http://") ||
      t.startsWith("https://") ||
      /^\d+[\.\)]/.test(t) ||
      t.includes("|") ||
      t.includes("{") ||
      t.includes("[") ||
      /^(?:Product Title|Offer ID|Supplier|Company|Exchange Rate|Price Range|Minimum Order|MOQ|Total Available|Total Sales|Ship From|Guarantees|Report Generated|SKU ID|Weight|Stock)/i.test(t)
    ) {
      return false;
    }
    return true;
  };

  const handleInsertReportCategorySection = (catName: string) => {
    setPreExtractCategory(catName);
    setSelectedCategory(catName);

    setReportContent((prev) => {
      const trimmedAll = prev.trim();
      if (!trimmedAll) {
        return `${catName}\n`;
      }

      const lines = prev.replace(/\s+$/, "").split(/\r?\n/);
      const firstNonEmptyIdx = lines.findIndex((l) => l.trim().length > 0);
      const lastNonEmptyIdx = lines.length - 1;

      // If the last line is already a standalone category header (user clicked another sub-category button before pasting), replace it
      if (lastNonEmptyIdx >= 0 && isStandaloneCategoryLine(lines[lastNonEmptyIdx])) {
        const updated = [...lines];
        updated[lastNonEmptyIdx] = catName;
        return `${updated.join("\n")}\n`;
      }

      // If the user pasted a report first without a top category header, prepend the selected sub-category header at line 1
      if (firstNonEmptyIdx >= 0 && !isStandaloneCategoryLine(lines[firstNonEmptyIdx])) {
        return `${catName}\n${prev.trimStart()}`;
      }

      // Otherwise append a new sub-category section header at the bottom for the next report/dataset
      return `${prev.replace(/\s+$/, "")}\n\n${catName}\n`;
    });
  };

  // Single / Multi Report Extract Handler (always auto-saves by default so scraped data is persisted)
  const handleExtract = async (autoSaveToStore: boolean = true) => {
    const rawUrl = url.trim();
    const rawHtml = htmlContent.trim();
    const rawReport = reportContent.trim();

    const isReportInUrl = isReportText(rawUrl);
    const isReportInHtml = isReportText(rawHtml);

    let effectiveReport = "";
    let effectiveUrl = "";
    let effectiveHtml = "";

    if (scrapeType === "report") {
      effectiveReport = rawReport;
    } else if (scrapeType === "url") {
      if (isReportInUrl) {
        effectiveReport = rawUrl;
      } else {
        effectiveUrl = rawUrl;
      }
    } else if (scrapeType === "html") {
      if (isReportInHtml) {
        effectiveReport = rawHtml;
      } else {
        effectiveHtml = rawHtml;
      }
    }

    if (!effectiveUrl && !effectiveHtml && !effectiveReport) {
      alert("Please provide a product link, report text, or HTML code");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setMultiReportResults([]);
    setLastSaved(null);
    setIsDuplicate(false);
    setExistingProduct(null);

    try {
      const res = await fetch("/api/admin/scraper/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: effectiveUrl, 
          htmlContent: effectiveHtml,
          reportText: effectiveReport,
          rmbRate: Number(rmbRate) || 22.80,
          customCategory: preExtractCategory !== "AUTO" ? preExtractCategory : "",
          autoSave: autoSaveToStore
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract product data");
      }

      const master = data.data;
      setResult(master);
      setIsDuplicate(data.isDuplicate || false);
      setExistingProduct(data.existingProduct || null);

      // Populate editable fields
      setCustomTitle(master.name || "");
      setCustomPrice(String(master.price || 500));
      setCustomRmbPrice(String(master.rmbPrice || ""));
      setCustomMoq(master.minOrderQuantity || 1);

      if (master.category) {
        const canonical = getCanonicalCategoryName(master.category, master.name);
        setSelectedCategory(canonical);
      }

      const extractedList = Array.isArray(data.multiReports)
        ? data.multiReports
        : Array.isArray(data.apifyProducts)
        ? data.apifyProducts
        : [];

      if (extractedList.length > 0) {
        setMultiReportResults(extractedList);
      }

      if (data.autoSaved !== false) {
        invalidateApiCache();
        const totalCount = extractedList.length || 1;
        const uniqueCats = Array.from(new Set(extractedList.map((p: any) => p.category).filter(Boolean)));
        setLastSaved({
          id: master.id,
          name:
            totalCount > 1
              ? `${totalCount} Products Saved (${master.name})`
              : master.name,
          category: uniqueCats.length > 0 ? uniqueCats.join(", ") : (master.category || "Shoes")
        });
        loadScrapedProducts();
        loadStatsAndSettings();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Save Single Product to Store
  const handleSaveToStore = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const finalCat = selectedCategory === "OTHER" ? (customCategory.trim() || "Imported & Scraped") : selectedCategory;
      const parsedPriceBdt = parseFloat(customPrice) || result.price;
      const parsedPriceRmb = parseFloat(customRmbPrice) || result.rmbPrice;
      const activeVariants = Array.isArray(result.variants) ? result.variants : [];
      const syncedSkuDetails = syncSkuDetailsWithVariants(result.skuDetails, activeVariants);
      const updatedStock =
        activeVariants.length > 0
          ? activeVariants.reduce((sum: number, v: any) => sum + (Number(v?.stock) || 0), 0) || result.stock || 100
          : result.stock || 100;

      const payload = {
        ...result,
        id: existingProduct?.id || result.id,
        name: customTitle.trim() || result.name,
        price: parsedPriceBdt,
        rmbPrice: parsedPriceRmb,
        minOrderQuantity: Number(customMoq) || 1,
        category: finalCat,
        stock: updatedStock,
        variants: activeVariants,
        skuDetails: syncedSkuDetails,
        variantsEdited: true,
        deletedSkuKeys: Array.isArray(result.deletedSkuKeys) ? result.deletedSkuKeys : [],
      };

      const res = await fetch('/api/admin/scraper/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: payload, overwriteExisting: true })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save product");
      }
      
      const resData = await res.json();
      const savedProd = resData.saved && resData.saved[0] ? resData.saved[0] : payload;

      // Clear client-side API cache so ProductDetails and Shop immediately reflect deleted SKUs
      invalidateApiCache();

      setLastSaved({
        id: savedProd.id,
        name: savedProd.name,
        category: savedProd.category || finalCat
      });

      // Keep the updated product in view with the exact remaining variants so deleted SKUs never come back
      setResult({
        ...savedProd,
        variants: activeVariants,
        skuDetails: syncedSkuDetails,
        deletedSkuKeys: payload.deletedSkuKeys,
      });
      setIsDuplicate(true);
      setExistingProduct({ id: savedProd.id, name: savedProd.name, category: savedProd.category || finalCat });

      loadScrapedProducts();
      loadStatsAndSettings();
    } catch (err: any) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Batch Scrape Handler
  const handleBatchScrape = async () => {
    const urls = bulkUrlsText
      .split("\n")
      .map(u => u.trim())
      .filter(u => u.startsWith("http://") || u.startsWith("https://"));

    if (urls.length === 0) {
      alert("Please enter at least one valid product link (e.g. https://worldbuybd.com/product/...)");
      return;
    }

    setBulkLoading(true);
    setBulkResults([]);
    setBulkProgress({ current: 0, total: urls.length });

    try {
      const res = await fetch("/api/admin/scraper/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          urls,
          rawTextWithCategories: bulkUrlsText,
          customCategory: bulkCategory,
          autoSave: true
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch extraction failed");

      const batchList = data.results || [];
      setBulkResults(batchList);
      setBulkProgress({ current: urls.length, total: urls.length });

      const savedItems = batchList.filter((r: any) => r.success && r.data).map((r: any) => r.data);
      if (savedItems.length > 0) {
        invalidateApiCache();
        const firstItem = savedItems[0];
        setLastSaved({
          id: firstItem.id,
          name: `${savedItems.length} Batch Products Auto-Saved (${firstItem.name})`,
          category: firstItem.category || "Shoes",
        });
        loadScrapedProducts();
        loadStatsAndSettings();
      }
    } catch (err: any) {
      alert("Batch extraction error: " + err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Save All Successful Batch Products
  const handleSaveAllBatch = async () => {
    const successfulItems = bulkResults.filter(r => r.success && r.data).map(r => r.data);
    if (successfulItems.length === 0) {
      alert("No successful data available to save");
      return;
    }

    setBulkSaving(true);
    try {
      const res = await fetch('/api/admin/scraper/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: successfulItems, overwriteExisting: true })
      });

      if (!res.ok) throw new Error("Save failed");
      const resData = await res.json();

      invalidateApiCache();
      alert(`Congratulations! ${resData.count || successfulItems.length} products were successfully saved to database.`);
      setBulkResults([]);
      setBulkUrlsText("");
      loadScrapedProducts();
      loadStatsAndSettings();
      setActiveTab("catalog");
    } catch (err: any) {
      alert("Save error: " + err.message);
    } finally {
      setBulkSaving(false);
    }
  };

  // Inline category update for scraped products
  const handleUpdateCategory = async (productId: string, newCategory: string) => {
    setUpdatingCatId(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory })
      });
      if (res.ok) {
        setScrapedProducts(prev => 
          prev.map(p => (p.id === productId || p.offerId === productId) ? { ...p, category: newCategory } : p)
        );
        loadStatsAndSettings();
      }
    } catch (err) {
      console.error("Failed to update category:", err);
    } finally {
      setUpdatingCatId(null);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!productId) return;
    setScrapedProducts(prev => prev.filter(p => String(p.id) !== String(productId) && String(p.offerId) !== String(productId)));
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, { method: "DELETE" });
      invalidateApiCache();
      if (res.ok) {
        loadStatsAndSettings();
      } else {
        loadScrapedProducts();
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
      loadScrapedProducts();
    }
  };

  // Filtered Catalog
  const displayedCatalog = scrapedProducts.filter(p => {
    const matchesCat = !filterCategory || matchesCategory(p.category, filterCategory, p.name);
    const matchesSearch = !searchQuery.trim() || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.offerId?.includes(searchQuery) ||
      p.id?.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & RMB Currency Indicator */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-light px-3 py-1 rounded-full text-xs font-bold border border-primary/30">
            <Sparkles className="w-3.5 h-3.5" />
            WORLD BUY BD • B2B Enterprise Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Professional Product Extractor & Sourcing
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Extract and store complete structured product data (SKU, Variants, Price Tiers, Stock, Specs) from China wholesale suppliers as independent records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 flex items-center gap-3">
            <div>
              <span className="block text-[10px] text-slate-300 font-semibold uppercase tracking-wider">
                Active RMB Rate (1 RMB = BDT)
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-amber-400 font-black text-sm">¥1 = BDT </span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={rmbRate}
                  onChange={(e) => setRmbRate(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-0.5 bg-black/40 text-amber-300 font-black text-sm rounded-lg border border-amber-400/50 focus:outline-none focus:border-amber-300"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleUpdateRmbRate(rmbRate)}
              disabled={savingRate}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              title="Save this rate permanently so that entire website and future products calculate with this rate"
            >
              {savingRate ? "Saving..." : rateSavedSuccess ? "Saved ✓" : "Save Rate"}
            </button>
          </div>

          <Link
            to="/admin/settings"
            className="text-xs bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2.5 rounded-xl transition border border-white/20"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
            <span className="text-gray-400 text-xs font-semibold block">Total Extracted Products</span>
            <span className="text-xl font-black text-charcoal mt-1 block">{stats.totalScrapedProducts}  items</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
            <span className="text-gray-400 text-xs font-semibold block">Variants & SKUs</span>
            <span className="text-xl font-black text-indigo-600 mt-1 block">{stats.totalVariantsAcrossCatalog}  items</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
            <span className="text-gray-400 text-xs font-semibold block">Wholesale Price Tiers</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">{stats.totalWithWholesaleTiers}  items</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
            <span className="text-gray-400 text-xs font-semibold block">Covered Categories</span>
            <span className="text-xl font-black text-purple-600 mt-1 block">{Object.keys(stats.categoryBreakdown || {}).length}  items</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("single")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm rounded-t-2xl transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "single"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          Single Product Extractor
        </button>

        <button
          onClick={() => setActiveTab("bulk")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm rounded-t-2xl transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "bulk"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Layers2 className="w-4 h-4" />
          Bulk / Batch Extractor
        </button>

        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm rounded-t-2xl transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "catalog"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Database className="w-4 h-4" />
          Extracted Catalog & Variants Inspector ({scrapedProducts.length})
        </button>

        <button
          onClick={() => setActiveTab("backup")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm rounded-t-2xl transition border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === "backup"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <FileJson className="w-4 h-4" />
          Database Backup (JSON Export / Import)
        </button>
      </div>

      {/* Success Notification after Save */}
      {lastSaved && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">
                "{lastSaved.name.substring(0, 50)}..." Successfully saved to database!
              </p>
              <p className="text-[11px] text-emerald-700">
                Category: <span className="font-semibold">{lastSaved.category}</span> • Independent record created
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/shop?category=${encodeURIComponent(lastSaved.category)}`}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              View in Store
            </Link>
            <Link
              to={`/product/abb-${String((lastSaved as any).offerId || lastSaved.id).replace(/^abb-/, "")}`}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-200 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Product Page
            </Link>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: SINGLE URL / HTML SCRAPER                          */}
      {/* ======================================================== */}
      {activeTab === "single" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-charcoal flex items-center gap-2.5">
                <Tag className="w-5 h-5 text-primary" />
                1. Single Product Extraction
              </h2>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setScrapeType("url")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    scrapeType === "url" ? "bg-white text-primary shadow-xs" : "text-gray-500"
                  }`}
                >
                  By URL (Direct Link)
                </button>
                <button
                  onClick={() => setScrapeType("report")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    scrapeType === "report" ? "bg-white text-primary shadow-xs" : "text-gray-500"
                  }`}
                >
                  Product Report (Text)
                </button>
                <button
                  onClick={() => setScrapeType("html")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    scrapeType === "html" ? "bg-white text-primary shadow-xs" : "text-gray-500"
                  }`}
                >
                  By HTML (Source Code)
                </button>
              </div>
            </div>

            {/* Target Category + Exchange rate quick bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-indigo-950 whitespace-nowrap flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  Target Category:
                </span>
                <select
                  value={preExtractCategory}
                  onChange={(e) => setPreExtractCategory(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white text-charcoal font-bold rounded-xl border border-indigo-200 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="AUTO">✨ Auto-Detect Category</option>
                  {EXPANDABLE_MAIN_CATEGORIES.map((mc) => (
                    <optgroup key={mc.id} label={`📂 ${mc.name}`}>
                      <option value={mc.name}>{mc.name} (Main Category - Auto Sub-Categorize)</option>
                      {(mc.subCategories || []).map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          ↳ {sub.name} (Sub-Category of {mc.name})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <optgroup label="📦 Other Store Categories">
                    {storeCategories
                      .filter(
                        (cat) =>
                          !EXPANDABLE_MAIN_CATEGORIES.some(
                            (mc) =>
                              mc.slug === cat.slug ||
                              mc.name.toLowerCase() === cat.name.toLowerCase() ||
                              (mc.subCategories || []).some(
                                (s) => s.slug === cat.slug || s.name.toLowerCase() === cat.name.toLowerCase()
                              )
                          )
                      )
                      .map((cat) => (
                        <option key={cat.id || cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-900">💱 Rate:</span>
                  <span className="text-gray-600">1 RMB =</span>
                  <div className="flex items-center gap-1">
                    <span className="font-black text-amber-950">BDT </span>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={rmbRate}
                      onChange={(e) => setRmbRate(parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 bg-white text-charcoal font-black rounded-lg border border-amber-300 focus:outline-none focus:border-primary text-center shadow-2xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateRmbRate(rmbRate)}
                    disabled={savingRate}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {savingRate ? "..." : rateSavedSuccess ? "Saved ✓" : "Save Default"}
                  </button>
                </div>
              </div>
            </div>

            {scrapeType === "url" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Paste direct product URL (or paste product report text):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUrl(val);
                      if (isReportText(val)) {
                        setReportContent(val);
                      }
                    }}
                    placeholder="https://worldbuybd.com/product/1051902541578.html or paste product report"
                    className="w-full p-3.5 pr-28 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition"
                  />
                  <button
                    onClick={() => handleExtract(true)}
                    disabled={loading || !url.trim()}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {loading ? "Extracting..." : "Extract & Save"}
                  </button>
                </div>
                {isReportText(url) && (
                  <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                    <span>✨ Product report automatically detected! Click to extract complete data and variants.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setReportContent(url);
                        setScrapeType("report");
                      }}
                      className="underline font-bold hover:text-emerald-950"
                    >
                      Go to Report View
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-1">
                  Tip: Providing a product URL with Offer ID or pasting an E-Commerce Product Report will automatically capture all variants, price tiers, specifications, and images.
                </p>
              </div>
            )}

            {scrapeType === "report" && (
              <div className="space-y-4">
                {/* Category & Sub-Category Quick Section Builder built directly into Product Report (Text) */}
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      Category & Sub-Category Quick Section Builder:
                    </span>
                    <div className="flex items-center gap-2">
                      {preExtractCategory && preExtractCategory !== "AUTO" && (
                        <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold shadow-2xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Selected Target: {preExtractCategory}
                        </span>
                      )}
                      <span className="text-[11px] text-indigo-700 font-semibold hidden sm:inline">
                        1. Select Main Category ➔ 2. Click Sub-Category to assign & insert header
                      </span>
                    </div>
                  </div>

                  {/* Step 1: Main Categories Bar */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                      Step 1 — Select Main Category:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {EXPANDABLE_MAIN_CATEGORIES.map((mc) => {
                        const isSelected = reportActiveMainCategory === mc.name;
                        return (
                          <button
                            key={mc.id}
                            type="button"
                            onClick={() => setReportActiveMainCategory(mc.name)}
                            className={`px-3 py-1.5 text-xs font-black rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                                : "bg-white hover:bg-indigo-100 text-indigo-950 border-indigo-200"
                            }`}
                          >
                            <span>{mc.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Sub-Categories of Selected Main Category */}
                  {(() => {
                    const activeMc =
                      EXPANDABLE_MAIN_CATEGORIES.find((m) => m.name === reportActiveMainCategory) ||
                      EXPANDABLE_MAIN_CATEGORIES[0];
                    if (!activeMc) return null;
                    return (
                      <div className="p-3 bg-white rounded-xl border border-indigo-200/80 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-black text-indigo-900 flex items-center gap-1.5">
                            ↳ Step 2 — Click <span className="underline">{activeMc.name}</span> Sub-Category to Insert Section Header:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleInsertReportCategorySection(activeMc.name)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                              preExtractCategory === activeMc.name
                                ? "bg-indigo-600 text-white border-indigo-700"
                                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                            }`}
                          >
                            + All {activeMc.name} (Auto Sub-Categorize)
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(activeMc.subCategories || []).map((sub) => {
                            const isSubSelected = preExtractCategory === sub.name;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => handleInsertReportCategorySection(sub.name)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer shadow-2xs flex items-center gap-1 ${
                                  isSubSelected
                                    ? "bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300"
                                    : "bg-indigo-50/70 hover:bg-indigo-600 hover:text-white text-indigo-900 border-indigo-200"
                                }`}
                              >
                                + {sub.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Label + Sample / Clear Actions */}
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Paste E-Commerce Product Report text, Multi-Section Reports, or Dataset Links below:
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const targetHeader =
                          preExtractCategory && preExtractCategory !== "AUTO" ? `${preExtractCategory}\n` : "Purse\n";
                        if (!preExtractCategory || preExtractCategory === "AUTO") {
                          setPreExtractCategory("Purse");
                          setSelectedCategory("Purse");
                        }
                        setReportContent(`${targetHeader}=== E-Commerce Product Report (Wholesale / Alibaba) ===
Product Title: 欧美时尚复古单肩斜跨女包高级感百搭手提小方包零钱包女
Offer ID: 1051902541578
Supplier / Company: 广州市皮具箱包有限公司
Exchange Rate Applied: 1 RMB (¥) = ${rmbRate} BDT
Price Range: ¥18.50-19.50
Minimum Order Quantity (MOQ): 1 pcs
Total Available Stock: 120 pcs
Total Sales Count: 350
Ship From: Guangdong Province, China广州市
--- SKU Variants & Pricing Breakdown ---
1. Black (黑色) | RMB Price: ¥19.50 | BDT Price: BDT ${Math.round(19.5 * rmbRate)} BDT | Weight: 250g | Stock: 60 pcs | SKU ID: 6083662648973
2. Brown (棕色) | RMB Price: ¥19.50 | BDT Price: BDT ${Math.round(19.5 * rmbRate)} BDT | Weight: 250g | Stock: 60 pcs | SKU ID: 6083662648974
--- Product Specifications & Attributes ---
- Product Category (产品类别): 女式手提包 / 零钱包
- Material (材质): PU Leather
- Origin (产地): China
--- High-Resolution Product Images ---
1. https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80
2. https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80
Report Generated via Web Scraper & AI Extractor`);
                      }}
                      className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                    >
                      Load Sample Report
                    </button>
                    {reportContent.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setReportContent("");
                          setMultiReportResults([]);
                        }}
                        className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                      >
                        Clear Box
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder={`Click a Main Category above ➔ then click any Sub-Category button (e.g. + Purse, + Wallet, + Men Shoes) to insert its header ➔ paste your E-Commerce Product Report or Links right below it!\n\nExample:\nPurse\n=== E-Commerce Product Report (Wholesale / Alibaba) ===\nProduct Title: ...\nOffer ID: ...\n--- SKU Variants & Pricing Breakdown ---\n...\n\nWallet\n=== E-Commerce Product Report (Wholesale / Alibaba) ===\nProduct Title: ...`}
                  className="w-full h-56 p-3.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-mono leading-relaxed"
                />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <span className="text-[11px] text-gray-500">
                    ✅ Supports single or multiple Product Reports separated by Sub-Category headers. Data is automatically mapped to the exact Main Category & Sub-Category.
                  </span>
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => handleExtract(true)}
                      disabled={loading || !reportContent.trim()}
                      className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      Process & Auto-Save Report
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExtract(true)}
                      disabled={loading || !reportContent.trim()}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm ring-2 ring-emerald-500/20"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      1-Click Extract & Save to Store
                    </button>
                  </div>
                </div>

                {/* Multi-Section Extracted Products Summary Table if multiple reports/products were extracted */}
                {multiReportResults.length > 1 && (
                  <div className="mt-4 p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {multiReportResults.length} Products Extracted & Assigned to Exact Sub-Categories!
                        </h4>
                        <p className="text-[11px] text-emerald-800">
                          Click any row to inspect/edit its variants below, or change its Sub-Category directly in the table.
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto bg-white rounded-xl border border-emerald-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-emerald-50 text-emerald-950 font-bold border-b border-emerald-200">
                          <tr>
                            <th className="p-2.5">Image</th>
                            <th className="p-2.5">Product Title</th>
                            <th className="p-2.5">Assigned Sub-Category</th>
                            <th className="p-2.5">Price</th>
                            <th className="p-2.5">Variants</th>
                            <th className="p-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {multiReportResults.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-slate-50">
                              <td className="p-2.5">
                                <img src={item.image} alt="" className="w-9 h-9 rounded-lg object-cover border" />
                              </td>
                              <td className="p-2.5 font-bold text-gray-800 max-w-xs truncate">{item.name}</td>
                              <td className="p-2.5">
                                <select
                                  value={getCanonicalCategoryName(item.category, item.name)}
                                  onChange={(e) => {
                                    const newCat = e.target.value;
                                    setMultiReportResults((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, category: newCat } : r))
                                    );
                                    if (item.id) {
                                      handleUpdateCategory(item.id, newCat);
                                    }
                                  }}
                                  className="px-2 py-1 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-950 bg-indigo-50/50"
                                >
                                  {EXPANDABLE_MAIN_CATEGORIES.map((mc) => (
                                    <optgroup key={mc.id} label={`📂 ${mc.name}`}>
                                      <option value={mc.name}>{mc.name} (Main)</option>
                                      {(mc.subCategories || []).map((sub) => (
                                        <option key={sub.id} value={sub.name}>
                                          ↳ {sub.name}
                                        </option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2.5 font-bold text-emerald-700">
                                ¥{item.rmbPrice} / BDT {item.price}
                              </td>
                              <td className="p-2.5 font-mono text-gray-600">
                                {item.variants?.length || 1} SKUs
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResult(item);
                                    setCustomTitle(item.name || "");
                                    setCustomPrice(String(item.price || 500));
                                    setCustomRmbPrice(String(item.rmbPrice || ""));
                                    setCustomMoq(item.minOrderQuantity || 1);
                                    setSelectedCategory(getCanonicalCategoryName(item.category, item.name));
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition cursor-pointer"
                                >
                                  Inspect / Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {scrapeType === "html" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Paste complete HTML source code of product page:
                </label>
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="<!DOCTYPE html><html>... Wholesale window.context or HTML code ..."
                  className="w-full h-36 p-3 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:bg-white font-mono"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleExtract(true)}
                    disabled={loading || !htmlContent.trim()}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    Process & Save HTML
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step helper when result is not yet extracted */}
            {!result && !loading && (
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-950">
                <span className="text-base">💡</span>
                <span>
                  <strong>Simple 3 Steps:</strong> 1. Paste text or link ➔ 2. purple <strong>"Extract"</strong> button ➔ 3. immediately preview card and large green <strong>"Save & Publish to Store"</strong> button will appear.
                </span>
              </div>
            )}
          </div>

          {/* Master Record Preview & Verification Inspector */}
          {result && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-indigo-100 space-y-6 animate-in fade-in">
              {/* Duplicate Banner if exists */}
              {isDuplicate && (
                <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex items-center gap-3 text-amber-800 text-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">Warning: Product was previously saved!</span>
                    <span>
                      This Offer ID / URL is already saved in database (Product ID: {existingProduct?.id}). Saving will update existing data.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-full uppercase">
                      Source: {result.platform}
                    </span>
                    {result.offerId && (
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-mono rounded-full">
                        Offer ID: {result.offerId}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Independent Record
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-charcoal">
                    Extracted Master Product Preview
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveToStore}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ring-2 ring-emerald-500/30"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    {saving ? "Saving to database..." : isDuplicate ? "Save & Update in Store" : "Save & Publish to Store (Save & Publish to Store)"}
                  </button>
                  <button
                    onClick={() => setResult(null)}
                    disabled={saving}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Grid: Main Info + Pricing Config */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Product Media Preview */}
                <div className="space-y-3">
                  <div className="w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-gray-200 relative group">
                    <img 
                      src={result.image} 
                      alt="Product Master" 
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                      {result.images?.length || 1} items Image
                    </div>
                  </div>

                  {/* Thumbnail Row */}
                  {result.images && result.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {result.images.slice(0, 6).map((imgUrl: string, idx: number) => (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt="Thumbnail"
                          onClick={() => setPreviewImage(imgUrl)}
                          className="w-14 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                        />
                      ))}
                    </div>
                  )}

                  {/* Product Video Badge if available */}
                  {result.videoUrl && (
                    <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold">Product Video Available</span>
                      </div>
                      <a
                        href={result.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 underline font-semibold text-[11px]"
                      >
                        Watch Video
                      </a>
                    </div>
                  )}

                  {/* Supplier Info */}
                  {result.sellerInfo && result.sellerInfo.companyName && (

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Manufacturer / Factory
                      </span>
                      <p className="font-bold text-gray-800">{result.sellerInfo.companyName}</p>
                      {result.sellerInfo.location && (
                        <p className="text-gray-500 text-[11px]">Location: {result.sellerInfo.location}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Editable Core Attributes */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Product Title
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary font-medium"
                    />
                    {result.originalTitle && result.originalTitle !== customTitle && (
                      <p className="text-[11px] text-gray-400 mt-1 truncate">
                        Original Chinese Title: {result.originalTitle}
                      </p>
                    )}
                  </div>

                  {/* Pricing Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Price RMB (¥)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={customRmbPrice}
                        onChange={(e) => {
                          setCustomRmbPrice(e.target.value);
                          const val = parseFloat(e.target.value) || 0;
                          setCustomPrice(String(Math.round(val * rmbRate) + 30));
                        }}
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Selling Price (BDT)
                      </label>
                      <input
                        type="number"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="w-full p-2.5 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-black text-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Minimum Order Quantity (MOQ)
                      </label>
                      <input
                        type="number"
                        value={customMoq}
                        onChange={(e) => setCustomMoq(parseInt(e.target.value, 10) || 1)}
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary font-bold"
                      />
                    </div>
                  </div>

                  {/* Category Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Select Store Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2.5 text-xs font-bold bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                    >
                      {EXPANDABLE_MAIN_CATEGORIES.map((mc) => (
                        <optgroup key={mc.id} label={`📂 ${mc.name}`}>
                          <option value={mc.name}>{mc.name} (Main Category)</option>
                          {(mc.subCategories || []).map((sub) => (
                            <option key={sub.id} value={sub.name}>
                              ↳ {sub.name} (Sub-Category of {mc.name})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <optgroup label="📦 Other Store Categories">
                        {storeCategories
                          .filter(
                            (cat) =>
                              !EXPANDABLE_MAIN_CATEGORIES.some(
                                (mc) =>
                                  mc.slug === cat.slug ||
                                  mc.name.toLowerCase() === cat.name.toLowerCase() ||
                                  (mc.subCategories || []).some(
                                    (s) => s.slug === cat.slug || s.name.toLowerCase() === cat.name.toLowerCase()
                                  )
                              )
                          )
                          .map((cat) => (
                            <option key={cat.id || cat.name} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                      </optgroup>
                      <option value="OTHER">+ Add New Category (Custom)</option>
                    </select>

                    {selectedCategory === "OTHER" && (
                      <input
                        type="text"
                        placeholder="Enter category name..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="mt-2 w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                      />
                    )}
                  </div>

                  {/* Wholesale Tiered Quantity Pricing */}
                  {result.quantityPrices && result.quantityPrices.length > 0 && (
                    <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                      <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5" /> Wholesale Volume Price Tiers:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {result.quantityPrices.map((tier: any, idx: number) => (
                          <div key={idx} className="bg-white p-2 rounded-lg border border-emerald-200 text-xs">
                            <span className="text-gray-500 text-[10px] block">
                              Qty: {tier.minQty}{tier.maxQty ? ` - ${tier.maxQty}` : "+"} pcs
                            </span>
                            <span className="font-bold text-emerald-700">
                              ¥{tier.rmbPrice} (BDT {tier.price})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Isolated Variants Table */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-charcoal flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Variants & SKU List ({result.variants?.length || 0} Variants)
                  </h4>
                  <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
                    Variant Isolation: 100% Guaranteed
                  </span>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-3">Image</th>
                        <th className="p-3">SKU ID</th>
                        <th className="p-3">Variant Name</th>
                        <th className="p-3">Color</th>
                        <th className="p-3">Size / Options</th>
                        <th className="p-3">Price (RMB / BDT)</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.variants?.map((v: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-3">
                            {v.imageUrl ? (
                              <img 
                                src={v.imageUrl} 
                                alt={v.name} 
                                className="w-9 h-9 object-cover rounded-lg border border-gray-200 cursor-pointer"
                                onClick={() => setPreviewImage(v.imageUrl)}
                              />
                            ) : (
                              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-[10px]">
                                No img
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-mono text-gray-600">{v.skuId}</td>
                          <td className="p-3 font-bold text-gray-800">{v.name}</td>
                          <td className="p-3 text-gray-600">{v.color || "-"}</td>
                          <td className="p-3 text-gray-600">{v.size || v.attributes?.Option || "-"}</td>
                          <td className="p-3 font-semibold text-emerald-700">
                            ¥{v.priceRmb} / BDT {v.priceBdt}
                          </td>
                          <td className="p-3 text-gray-600 font-mono">{v.stock} pcs</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setResult((prev: any) => {
                                  if (!prev) return prev;
                                  const targetVar = prev.variants?.[idx];
                                  const nextVariants = (prev.variants || []).filter((_: any, i: number) => i !== idx);
                                  const nextSkuDetails = syncSkuDetailsWithVariants(prev.skuDetails, nextVariants);
                                  const newlyDeletedKeys = [
                                    targetVar?.skuId,
                                    targetVar?.name,
                                    targetVar?.specsToken,
                                    targetVar?.specs,
                                  ]
                                    .filter(Boolean)
                                    .map((k) => String(k).trim());
                                  const nextDeletedSkuKeys = Array.from(
                                    new Set([...(prev.deletedSkuKeys || []), ...newlyDeletedKeys])
                                  );
                                  const nextStock =
                                    nextVariants.length > 0
                                      ? nextVariants.reduce((s: number, item: any) => s + (Number(item?.stock) || 0), 0)
                                      : 0;
                                  const updatedRecord = {
                                    ...prev,
                                    variants: nextVariants,
                                    skuDetails: nextSkuDetails,
                                    deletedSkuKeys: nextDeletedSkuKeys,
                                    variantsEdited: true,
                                    stock: nextStock || prev.stock,
                                  };
                                  // Auto-persist variant deletion to database immediately
                                  fetch("/api/admin/scraper/save", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ product: updatedRecord, overwriteExisting: true }),
                                  })
                                    .then(() => {
                                      invalidateApiCache();
                                      loadScrapedProducts();
                                    })
                                    .catch(() => {});
                                  return updatedRecord;
                                });
                              }}
                              className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition cursor-pointer"
                              title="Delete SKU"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Technical Specifications Table */}
              {result.specifications && result.specifications.length > 0 && (
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-charcoal">
                    Product Specifications & Parameters ({result.specifications.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {result.specifications.map((spec: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
                        <span className="text-gray-400 font-medium block text-[10px]">{spec.name}</span>
                        <span className="font-bold text-gray-800 block truncate">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="pt-6 border-t-2 border-dashed border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200">
                <div>
                  <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    All product data and variants ready!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Clicking below will save and publish product to your store catalog.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    disabled={saving}
                    className="px-4 py-3 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-2xl border border-gray-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToStore}
                    disabled={saving}
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ring-4 ring-emerald-500/20"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                    {saving ? "Saving..." : isDuplicate ? "Save & Update in Store" : "Save & Publish to Store (Save & Publish to Store)"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BATCH / BULK URL SCRAPER                           */}
      {/* ======================================================== */}
      {activeTab === "bulk" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-5">
            <div>
              <h2 className="text-lg font-black text-charcoal flex items-center gap-2.5">
                <Layers2 className="w-5 h-5 text-primary" />
                Batch Extraction Engine
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Paste multiple product links together (one link per line). Each product will be processed independently.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">
                Product Links List (one per line):
              </label>
              <textarea
                value={bulkUrlsText}
                onChange={(e) => setBulkUrlsText(e.target.value)}
                placeholder="https://worldbuybd.com/product/701886884877.html&#10;https://worldbuybd.com/product/701886884878.html&#10;https://worldbuybd.com/product/701886884879.html"
                className="w-full h-44 p-3.5 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:border-primary font-mono"
              />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">Target Store Category:</span>
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="p-2 text-xs font-bold bg-white border border-gray-200 rounded-xl"
                  >
                    <option value="AUTO">✨ Auto-Detect / Per-Section Category</option>
                    {EXPANDABLE_MAIN_CATEGORIES.map((mc) => (
                      <optgroup key={mc.id} label={`📂 ${mc.name}`}>
                        <option value={mc.name}>{mc.name} (Main - Auto Sub-Categorize)</option>
                        {(mc.subCategories || []).map((sub) => (
                          <option key={sub.id} value={sub.name}>
                            ↳ {sub.name} (Sub-Category of {mc.name})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <optgroup label="📦 Other Store Categories">
                      {storeCategories
                        .filter(
                          (cat) =>
                            !EXPANDABLE_MAIN_CATEGORIES.some(
                              (mc) =>
                                mc.slug === cat.slug ||
                                mc.name.toLowerCase() === cat.name.toLowerCase() ||
                                (mc.subCategories || []).some(
                                  (s) => s.slug === cat.slug || s.name.toLowerCase() === cat.name.toLowerCase()
                                )
                            )
                        )
                        .map((cat) => (
                          <option key={cat.id || cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                <button
                  onClick={handleBatchScrape}
                  disabled={bulkLoading || !bulkUrlsText.trim()}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-black rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  {bulkLoading ? `Extracting (${bulkProgress.current}/${bulkProgress.total})...` : "Start Batch Extraction"}
                </button>
              </div>
            </div>
          </div>

          {/* Batch Results Table */}
          {bulkResults.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-black text-charcoal">
                    Batch Extraction Results ({bulkResults.filter(r => r.success).length} Succeeded)
                  </h3>
                  <p className="text-xs text-gray-500">Review from the table below and save all together</p>
                </div>

                <button
                  onClick={handleSaveAllBatch}
                  disabled={bulkSaving || bulkResults.filter(r => r.success).length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {bulkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  {bulkSaving ? "Saving..." : "Save All to Database"}
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Image</th>
                      <th className="p-3">Title</th>
                      <th className="p-3">Price (RMB / BDT)</th>
                      <th className="p-3">Variant Count</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bulkResults.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3">
                          {item.success ? (
                            item.isDuplicate ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                                Already Saved
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                                Success
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {item.data?.image ? (
                            <img src={item.data.image} alt="preview" className="w-9 h-9 object-cover rounded-lg border" />
                          ) : (
                            <span className="text-gray-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-gray-800 max-w-xs truncate">
                          {item.data?.name || item.error || item.url}
                        </td>
                        <td className="p-3 font-semibold text-emerald-700">
                          {item.data ? `¥${item.data.rmbPrice} / BDT ${item.data.price}` : "-"}
                        </td>
                        <td className="p-3 font-mono text-gray-600">
                          {item.data ? `${item.data.variants?.length || 1} items` : "-"}
                        </td>
                        <td className="p-3 text-gray-600">
                          {item.data ? (
                            <select
                              value={getCanonicalCategoryName(item.data.category, item.data.name)}
                              onChange={(e) => {
                                const newCat = e.target.value;
                                setBulkResults((prev) =>
                                  prev.map((r, i) => (i === idx && r.data ? { ...r, data: { ...r.data, category: newCat } } : r))
                                );
                                if (item.data?.id) {
                                  handleUpdateCategory(item.data.id, newCat);
                                }
                              }}
                              className="px-2 py-1 border border-gray-200 rounded-lg text-xs font-bold text-charcoal bg-white"
                            >
                              {storeCategories.map((cat) => (
                                <option key={cat.id || cat.name} value={cat.name}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3">
                          <a href={item.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CATALOG & VARIANT MATRIX INSPECTOR                */}
      {/* ======================================================== */}
      {activeTab === "catalog" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-black text-charcoal flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Extracted Catalog Saved in Database ({displayedCatalog.length} items)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                View variants, price, stock, and shop/product links
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="p-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              >
                <option value="">All Categories</option>
                {CATEGORIES_LIST.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={loadScrapedProducts}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loadingScraped ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {loadingScraped ? (
            <div className="py-12 flex justify-center items-center gap-2 text-gray-500 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Loading products...
            </div>
          ) : displayedCatalog.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No products found. Add products from the Single Product Extractor tab.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price (BDT)</th>
                    <th className="p-3">Variants</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Source</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedCatalog.map((prod) => {
                    const variantCount = Array.isArray(prod.variants) && prod.variants.length > 0 
                      ? prod.variants.length 
                      : (prod.skuDetails?.variants?.length || 1);
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-11 h-11 object-cover rounded-xl border border-gray-200 flex-shrink-0 cursor-pointer"
                              onClick={() => setPreviewImage(prod.image)}
                            />
                            <div className="max-w-xs">
                              <p className="font-bold text-gray-900 truncate">{prod.name}</p>
                              <span className="text-[10px] text-gray-400 font-mono">
                                ID: {prod.offerId || prod.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <select
                            value={prod.category || "Imported & Scraped"}
                            onChange={(e) => handleUpdateCategory(prod.id, e.target.value)}
                            disabled={updatingCatId === prod.id}
                            className="p-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                          >
                            {CATEGORIES_LIST.map((cat) => (
                              <option key={cat.id} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 font-black text-emerald-700">
                          BDT {prod.price}
                          {prod.rmbPrice && (
                            <span className="block text-[10px] text-gray-400 font-normal">
                              ¥{prod.rmbPrice}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => setInspectingProduct(prod)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            <Layers className="w-3 h-3" />
                            {variantCount} items Variants
                          </button>
                        </td>
                        <td className="p-3 font-mono text-gray-600">{prod.stock || 100} pcs</td>
                        <td className="p-3">
                          {prod.importedUrl && canAccessProductSourceLink() ? (
                            <a
                              href={prod.importedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1 text-[11px] font-semibold"
                            >
                              Direct Source <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : prod.importedUrl ? (
                            <span className="text-gray-400 text-[11px] italic">Protected</span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">Local</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/product/abb-${String(prod.offerId || prod.id).replace(/^abb-/, "")}`}
                              className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition"
                              title="View Product Page"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DATABASE BACKUP (JSON EXPORT / IMPORT)             */}
      {/* ======================================================== */}
      {activeTab === "backup" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-base font-black text-charcoal flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600" />
              Database Backup & JSON Export
            </h3>
            <p className="text-xs text-gray-500">
              Download all extracted products, variants, images, and specifications as a structured JSON file.
            </p>
            <div className="pt-2">
              <a
                href="/api/admin/scraper/export"
                download
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-3 rounded-xl transition shadow-xs"
              >
                <Download className="w-4 h-4" />
                Download Full Catalog JSON
              </a>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-base font-black text-charcoal flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Import from JSON File (Database Import)
            </h3>
            <p className="text-xs text-gray-500">
              Upload previously backed up JSON file to restore or add products.
            </p>
            <label className="border-2 border-dashed border-gray-200 hover:border-primary p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition bg-gray-50">
              <Upload className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-xs font-bold text-gray-700">Select JSON File</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (evt) => {
                    try {
                      const json = JSON.parse(evt.target?.result as string);
                      const prods = Array.isArray(json) ? json : json.products;
                      if (!Array.isArray(prods)) throw new Error("Invalid JSON format");
                      
                      const res = await fetch("/api/admin/scraper/import", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ products: prods })
                      });
                      if (res.ok) {
                        alert("Import completed successfully!");
                        loadScrapedProducts();
                        loadStatsAndSettings();
                      } else {
                        throw new Error("Import failed");
                      }
                    } catch (err: any) {
                      alert("Error reading file: " + err.message);
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Inspect Product Variants Modal */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Variant Inspector • {inspectingProduct.category}
                </span>
                <h3 className="text-base font-black text-charcoal mt-0.5">
                  {inspectingProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectingProduct(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Variants table */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">
                  Individual SKU & Variant List ({(inspectingProduct.variants || inspectingProduct.skuDetails?.variants || []).length} SKUs):
                </span>
                <span className="text-[11px] text-gray-500">
                  Delete unwanted SKUs and click "Save & Update in Store"
                </span>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-2.5">Image</th>
                      <th className="p-2.5">SKU ID</th>
                      <th className="p-2.5">Name / Specs</th>
                      <th className="p-2.5">Price (RMB / BDT)</th>
                      <th className="p-2.5">Stock</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(inspectingProduct.variants || inspectingProduct.skuDetails?.variants || []).map((v: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-2.5">
                          {v.imageUrl ? (
                            <img src={v.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded text-center leading-8 text-[10px] text-gray-400">
                              -
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-gray-600">{v.skuId || `sku-${idx}`}</td>
                        <td className="p-2.5 font-bold text-gray-800">{v.name || v.specs}</td>
                        <td className="p-2.5 font-semibold text-emerald-700">
                          {v.priceRmb ? `¥${v.priceRmb}` : ""} / BDT {v.priceBdt || v.price}
                        </td>
                        <td className="p-2.5 font-mono text-gray-600">{v.stock || 100} pcs</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectingProduct((prev: any) => {
                                if (!prev) return prev;
                                const baseList = Array.isArray(prev.variants) && prev.variants.length > 0
                                  ? prev.variants
                                  : (prev.skuDetails?.variants || []);
                                const targetVar = baseList[idx];
                                const nextVariants = baseList.filter((_: any, i: number) => i !== idx);
                                const nextSkuDetails = syncSkuDetailsWithVariants(prev.skuDetails, nextVariants);
                                const newlyDeleted = [targetVar?.skuId, targetVar?.name, targetVar?.specsToken, targetVar?.specs]
                                  .filter(Boolean)
                                  .map((k) => String(k).trim());
                                return {
                                  ...prev,
                                  variants: nextVariants,
                                  skuDetails: nextSkuDetails,
                                  variantsEdited: true,
                                  deletedSkuKeys: Array.from(new Set([...(prev.deletedSkuKeys || []), ...newlyDeleted])),
                                };
                              });
                            }}
                            className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition cursor-pointer"
                            title="Delete SKU"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Wholesale Tiers */}
            {inspectingProduct.quantityPrices && inspectingProduct.quantityPrices.length > 0 && (
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                <span className="text-xs font-bold text-emerald-900">Wholesale Price Tiers:</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {inspectingProduct.quantityPrices.map((tier: any, idx: number) => (
                    <div key={idx} className="bg-white p-2 rounded-lg border border-emerald-200">
                      <span className="text-gray-500 text-[10px] block">
                        {tier.minQty}{tier.maxQty ? ` - ${tier.maxQty}` : "+"} pcs
                      </span>
                      <span className="font-bold text-emerald-700">BDT {tier.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const prodToEdit = inspectingProduct;
                  setInspectingProduct(null);
                  setResult(prodToEdit);
                  setCustomTitle(prodToEdit.name || "");
                  setCustomPrice(String(prodToEdit.price || 500));
                  setCustomRmbPrice(String(prodToEdit.rmbPrice || ""));
                  setCustomMoq(prodToEdit.minOrderQuantity || 1);
                  setSelectedCategory(getCanonicalCategoryName(prodToEdit.category, prodToEdit.name));
                  setIsDuplicate(true);
                  setExistingProduct({ id: prodToEdit.id, name: prodToEdit.name, category: prodToEdit.category });
                  setActiveTab("single");
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Edit in Extractor
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingProduct(null)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    if (!inspectingProduct) return;
                    setSaving(true);
                    try {
                      const activeVariants = Array.isArray(inspectingProduct.variants)
                        ? inspectingProduct.variants
                        : (inspectingProduct.skuDetails?.variants || []);
                      const syncedSku = syncSkuDetailsWithVariants(inspectingProduct.skuDetails, activeVariants);
                      const payload = {
                        ...inspectingProduct,
                        variants: activeVariants,
                        skuDetails: syncedSku,
                        variantsEdited: true,
                      };
                      const res = await fetch('/api/admin/scraper/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ product: payload, overwriteExisting: true })
                      });
                      if (!res.ok) throw new Error("Failed to update product SKUs");
                      invalidateApiCache();
                      await loadScrapedProducts();
                      await loadStatsAndSettings();
                      setInspectingProduct(null);
                    } catch (err: any) {
                      alert("Save failed: " + err.message);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save & Update in Store"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-3xl p-3 shadow-2xl">
            <img src={previewImage} alt="Full preview" className="max-w-full max-h-[80vh] object-contain rounded-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-5 right-5 bg-black/60 hover:bg-black text-white p-2 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
