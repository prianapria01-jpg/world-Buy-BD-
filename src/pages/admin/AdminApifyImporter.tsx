import React, { useState, useEffect, useMemo } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Link as LinkIcon,
  Download,
  Loader2,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Sparkles,
  Trash2,
  ExternalLink,
  Layers,
  Tag,
  ShoppingBag,
  Plus,
  X
} from "lucide-react";
import { CATEGORIES_LIST, EXPANDABLE_MAIN_CATEGORIES, MAIN_CATEGORIES_LIST, mergeWithStoreCategories, getCanonicalCategoryName } from "../../utils/categories";
import { getSafeImageUrl } from "../../utils/imageUrl";
import { invalidateApiCache } from "../../utils/apiCache";

export default function AdminApifyImporter() {
  const [inputType, setInputType] = useState<"url" | "file" | "text">("url");
  const [urlsText, setUrlsText] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [textContent, setTextContent] = useState("");

  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const paramCat = searchParams.get("category");
    return paramCat ? paramCat : "AUTO";
  });
  const [storeCategories, setStoreCategories] = useState<any[]>(CATEGORIES_LIST);
  const [rmbRate, setRmbRate] = useState<number>(22.80);

  const [loading, setLoading] = useState(false);
  const [directUploading, setDirectUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [linkReport, setLinkReport] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ count: number; category: string } | null>(null);
  const [quickBuilderGroup, setQuickBuilderGroup] = useState<string>("Bag");

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of results) {
      const cat = getCanonicalCategoryName(item.category, item.name);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts);
  }, [results]);

  const handleInsertCategoryHeader = (catName: string) => {
    setSelectedCategory("AUTO");
    setUrlsText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return `${catName}\n`;
      return `${trimmed}\n\n${catName}\n`;
    });
  };

  useEffect(() => {
    try {
      const rawWs = localStorage.getItem("worldbuybd_apify_workspace_v2");
      if (rawWs) {
        const ws = JSON.parse(rawWs);
        if (Array.isArray(ws.results)) setResults(ws.results);
        if (Array.isArray(ws.linkReport)) setLinkReport(ws.linkReport);
        if (typeof ws.urlsText === "string") setUrlsText(ws.urlsText);
        if (ws.successInfo) setSuccessInfo(ws.successInfo);
      }
    } catch {}
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.rmbRate) {
          setRmbRate(Number(data.rmbRate) || 22.80);
        }
      })
      .catch(() => {});
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((cats) => {
        if (Array.isArray(cats)) {
          setStoreCategories(mergeWithStoreCategories(cats));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "worldbuybd_apify_workspace_v2",
        JSON.stringify({
          results,
          linkReport,
          urlsText,
          successInfo,
        })
      );
    } catch {}
  }, [results, linkReport, urlsText, successInfo]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        JSON.parse(content);
        setFileContent(content);
        setFileName(file.name);
        setError("");
      } catch {
        setError("Invalid JSON file. Please upload a valid Apify JSON dataset.");
        setFileContent("");
        setFileName("");
      }
    };
    reader.readAsText(file);
  };

  const buildPayload = (autoSave: boolean) => {
    const payload: any = {
      customCategory: selectedCategory,
      rmbRate: Number(rmbRate) || 22.80,
      autoSave
    };

    if (inputType === "url") {
      const cleanedUrls = urlsText
        .split(/[\n,\s]+/)
        .map((u) => u.trim())
        .filter((u) => u.startsWith("http://") || u.startsWith("https://") || u.includes("#catalog="));
      if (cleanedUrls.length === 0) {
        throw new Error("Please enter at least one valid Apify Dataset Link (e.g., https://api.apify.com/v2/datasets/.../items?format=json)");
      }
      payload.urls = cleanedUrls;
      payload.rawTextWithCategories = urlsText;
    } else if (inputType === "file") {
      if (!fileContent) throw new Error("Please select a valid JSON file");
      payload.rawJson = fileContent;
    } else {
      if (!textContent.trim()) throw new Error("Please paste valid JSON data");
      payload.rawJson = textContent.trim();
    }

    return payload;
  };

  // Extract, Auto-Save & Preview
  const handleExtractPreview = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    setLinkReport([]);
    setSuccessInfo(null);

    try {
      const payload = buildPayload(true);
      const res = await fetch("/api/admin/apify/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract products from link");
      }

      invalidateApiCache("/api/products");
      const uploadedProds = data.products || [];
      const uniqueCats = Array.from(new Set(uploadedProds.map((p: any) => p.category).filter(Boolean))) as string[];
      setSuccessInfo({
        count: data.savedCount || data.count || (uploadedProds.length ?? 0),
        category: selectedCategory !== "AUTO" ? selectedCategory : (uniqueCats.length === 1 ? uniqueCats[0] : uniqueCats.join(", ") || "Store Categories")
      });
      setResults(uploadedProds);
      setLinkReport(data.linkReport || []);
    } catch (err: any) {
      setError(err.message || "Error extracting Apify dataset");
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Direct Upload & Publish to Store
  const handleDirectUploadAndPublish = async () => {
    setDirectUploading(true);
    setError("");
    setSuccessInfo(null);

    try {
      const payload = buildPayload(true);
      const res = await fetch("/api/admin/apify/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload products");
      }

      invalidateApiCache("/api/products");
      const uploadedProds = data.products || [];
      const uniqueCats = Array.from(new Set(uploadedProds.map((p: any) => p.category).filter(Boolean))) as string[];
      setSuccessInfo({
        count: data.savedCount || data.count || (uploadedProds.length ?? 0),
        category: selectedCategory !== "AUTO" ? selectedCategory : (uniqueCats.length === 1 ? uniqueCats[0] : uniqueCats.join(", ") || "Store Categories")
      });
      setResults(uploadedProds);
      setLinkReport(data.linkReport || []);
    } catch (err: any) {
      setError(err.message || "Direct upload failed");
    } finally {
      setDirectUploading(false);
    }
  };

  // Save Previewed Products to Store
  const handleSavePreviewToStore = async () => {
    if (results.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: results,
          customCategory: selectedCategory,
          rmbRate: Number(rmbRate) || 22.80
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save products");

      invalidateApiCache("/api/products");
      setSuccessInfo({
        count: data.count || results.length,
        category: selectedCategory === "AUTO" ? "Auto-Classified Store Categories" : selectedCategory
      });
      setUrlsText("");
      setFileContent("");
      setFileName("");
      setTextContent("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResultItem = (idx: number, field: string, value: any) => {
    setResults((prev) => {
      const next = prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
      const updatedItem = next[idx];
      if (updatedItem?.id) {
        fetch(`/api/products/${updatedItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        })
          .then(() => invalidateApiCache("/api/products"))
          .catch(() => {});
      }
      return next;
    });
  };

  const handleRemoveResultItem = (idx: number) => {
    setResults((prev) => {
      const target = prev[idx];
      if (target?.id) {
        fetch(`/api/products/${target.id}`, { method: "DELETE" })
          .then(() => invalidateApiCache("/api/products"))
          .catch(() => {});
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleApplyCategoryToAllPreview = (newCat: string) => {
    setSelectedCategory(newCat);
    if (newCat !== "AUTO") {
      setResults((prev) => prev.map((item) => ({ ...item, category: newCat })));
    }
  };

  const isActionDisabled =
    loading ||
    directUploading ||
    (inputType === "url" ? !urlsText.trim() : inputType === "file" ? !fileContent : !textContent.trim());

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            APIFY DATASET & BULK LINK IMPORTER
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Apify Link & Dataset Product Uploader
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Paste one or multiple Apify Dataset Links (`https://api.apify.com/v2/datasets/.../items?...`) to upload complete products, SKU color variations, wholesale prices (RMB ➔ BDT), and images to the store with 1-click.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RouterLink
            to="/admin/products"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            Manage Products
          </RouterLink>
          <RouterLink
            to="/shop"
            target="_blank"
            className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            View Storefront
          </RouterLink>
        </div>
      </div>

      {/* Success Banner */}
      {successInfo && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-emerald-950">
                Successfully uploaded and published {successInfo.count} products to the store!
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Category: <span className="font-bold">{successInfo.category}</span> • All variations, wholesale tiers, and images have been saved to the database.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <RouterLink
              to="/admin/products"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              View Product List
            </RouterLink>
            <RouterLink
              to={
                successInfo.category && !successInfo.category.includes(",") && !successInfo.category.includes("Auto-Classified")
                  ? `/shop?category=${encodeURIComponent(successInfo.category)}`
                  : "/shop"
              }
              target="_blank"
              className="px-4 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Category in Store
            </RouterLink>
          </div>
        </div>
      )}

      {/* Main Input Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
        {/* Input Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
            <button
              type="button"
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                inputType === "url" ? "bg-primary text-white shadow-xs" : "text-gray-600 hover:text-charcoal"
              }`}
              onClick={() => setInputType("url")}
            >
              <LinkIcon className="w-4 h-4" />
              Apify Dataset Links (URL)
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                inputType === "file" ? "bg-primary text-white shadow-xs" : "text-gray-600 hover:text-charcoal"
              }`}
              onClick={() => setInputType("file")}
            >
              <FileJson className="w-4 h-4" />
              JSON File Upload
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                inputType === "text" ? "bg-primary text-white shadow-xs" : "text-gray-600 hover:text-charcoal"
              }`}
              onClick={() => setInputType("text")}
            >
              <Layers className="w-4 h-4" />
              Raw JSON Paste
            </button>
          </div>

          {/* Quick Sample Link Loader */}
          {inputType === "url" && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("Bags");
                  setUrlsText(
                    `https://api.apify.com/v2/datasets/5kGumsGqCkaaMzzAO/items?signature=MC4xNzkwOTM4MDAwMTM4LmxGb0tMVjNSczBNeFladXdwUEVt&format=json&clean=true\nhttps://api.apify.com/v2/datasets/PFUhlBorKePZAW6zc/items?signature=MC4xNzkwOTM4MTU1NzEyLkZVeWtKaFg5S2ZkSzZXdGxwY1V2&format=json&clean=true\nhttps://api.apify.com/v2/datasets/BJioXSZduKXZCBmbr/items?signature=MC4xNzkwOTM4MzE3OTU2LjFQSG9NZmlCNUsxeGlCU1Vmd1Ayeg&format=json&clean=true\nhttps://api.apify.com/v2/datasets/HL6bFlaCkQkQwS2UV/items?signature=MC4xNzkwOTM4NDE3MzcxLjFhQmZ5VjZvd0lNZmh4STdYc2xVdA&format=json&clean=true\nhttps://api.apify.com/v2/datasets/ElnZ0BPgCnpcg4fEr/items?signature=MC4xNzkwOTM4NTAwNDkzLnRaczREMjJGSjFwWjNFa2VpWnBx&format=json&clean=true`
                  );
                  setError("");
                }}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 transition cursor-pointer"
              >
                + Load 5 Bags Links
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("AUTO");
                  setUrlsText(
                    `Purse\nhttps://api.apify.com/v2/datasets/08aZWDEiJgWn5N6OD/items?signature=MC4xNzkwOTM3NDY0OTg3LmpjNEU2NGl1NWpja3IwR0dyajh4&format=json&clean=true\nhttps://api.apify.com/v2/datasets/LweuBvzXpG9e8u4Vc/items?signature=MC4xNzkwOTM3NTcxNjQ3LjE0bTRNRW9VYjNSbzhBNUZLWWl1TA&format=json&clean=true\nhttps://api.apify.com/v2/datasets/IWL0GKXC4wkKkJvpr/items?signature=MC4xNzkwOTM3NzM1NDk2LjFiUUNFQWZQYkFheDdaSVFyNGQweg&format=json&clean=true\nhttps://api.apify.com/v2/datasets/TBRKi8jRnNNzhwH14/items?signature=MC4xNzkwOTM3ODI4NzU4LjFhak9GTXRKa1RJRXRFYU9KenRORA&format=json&clean=true\nhttps://api.apify.com/v2/datasets/wIaOfFLz9soLqWnXf/items?signature=MC4xNzkwOTM3OTE3NzczLnF4ZVUza0lKYjdDTjNDWFVXdXlE&format=json&clean=true\n\nBags\nhttps://api.apify.com/v2/datasets/5kGumsGqCkaaMzzAO/items?signature=MC4xNzkwOTM4MDAwMTM4LmxGb0tMVjNSczBNeFladXdwUEVt&format=json&clean=true\nhttps://api.apify.com/v2/datasets/PFUhlBorKePZAW6zc/items?signature=MC4xNzkwOTM4MTU1NzEyLkZVeWtKaFg5S2ZkSzZXdGxwY1V2&format=json&clean=true\nhttps://api.apify.com/v2/datasets/BJioXSZduKXZCBmbr/items?signature=MC4xNzkwOTM4MzE3OTU2LjFQSG9NZmlCNUsxeGlCU1Vmd1Ayeg&format=json&clean=true\nhttps://api.apify.com/v2/datasets/HL6bFlaCkQkQwS2UV/items?signature=MC4xNzkwOTM4NDE3MzcxLjFhQmZ5VjZvd0lNZmh4STdYc2xVdA&format=json&clean=true\nhttps://api.apify.com/v2/datasets/ElnZ0BPgCnpcg4fEr/items?signature=MC4xNzkwOTM4NTAwNDkzLnRaczREMjJGSjFwWjNFa2VpWnBx&format=json&clean=true`
                  );
                  setError("");
                }}
                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl border border-indigo-200 transition cursor-pointer"
              >
                + Load Purse & Bags (10 Dataset Links)
              </button>
              {urlsText && (
                <button
                  type="button"
                  onClick={() => {
                    setUrlsText("");
                    setResults([]);
                    setLinkReport([]);
                    setError("");
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Configuration Bar: Category & RMB Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary" />
              Select Target Store Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleApplyCategoryToAllPreview(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-bold bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="AUTO">✨ Auto-Detect Category & Sub-Category</option>
              {EXPANDABLE_MAIN_CATEGORIES.map((mc) => (
                <optgroup key={mc.id} label={`📂 ${mc.name} — Main Category & ${(mc.subCategories || []).length} Sub-Categories`}>
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

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              💱 RMB to BDT Exchange Rate (1 RMB = BDT):
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-2.5 text-xs font-black text-gray-500">¥1 = BDT </span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={rmbRate}
                  onChange={(e) => setRmbRate(parseFloat(e.target.value) || 22.80)}
                  className="w-full pl-16 pr-4 py-2.5 text-xs sm:text-sm font-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <span className="text-[11px] text-gray-500 font-medium">
                All product and variation prices will convert to BDT at this rate
              </span>
            </div>
          </div>
        </div>

        {/* Input Box by Mode */}
        {inputType === "url" ? (
          <div className="space-y-3">
            {/* Quick Sub-Categories Section Builder for all 17 Main Categories */}
            <div className="bg-red-50/50 border border-red-200/80 rounded-2xl p-3.5">
              <div className="flex flex-col gap-2 mb-2.5">
                <span className="text-xs font-extrabold text-charcoal flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#cb1e46]" />
                  <span>Click a main category & sub-category to insert section headers for category-specific links:</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-red-200">
                  {EXPANDABLE_MAIN_CATEGORIES.map((mc) => {
                    const count = (mc.subCategories || []).length;
                    const active = quickBuilderGroup === mc.name;
                    return (
                      <button
                        key={mc.id}
                        type="button"
                        onClick={() => setQuickBuilderGroup(mc.name)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                          active
                            ? "bg-[#cb1e46] text-white shadow-2xs"
                            : "text-gray-700 hover:text-[#cb1e46] hover:bg-red-50"
                        }`}
                      >
                        {mc.name} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  EXPANDABLE_MAIN_CATEGORIES.find((mc) => mc.name === quickBuilderGroup)?.subCategories ||
                  EXPANDABLE_MAIN_CATEGORIES[0]?.subCategories ||
                  []
                ).map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleInsertCategoryHeader(sub.name)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border flex items-center gap-1 ${
                      selectedCategory === sub.name
                        ? "bg-[#cb1e46] text-white border-[#cb1e46]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-[#cb1e46] hover:text-[#cb1e46]"
                    }`}
                    title={`Insert "${sub.name}" section header`}
                  >
                    <Plus className="w-3 h-3 text-[#cb1e46]" />
                    <span>{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">
                Paste Apify Dataset Link(s) (one or more links, optionally grouped under category names):
              </label>
              <textarea
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                placeholder={`Purse\nhttps://api.apify.com/v2/datasets/08aZWDEiJgWn5N6OD/items?signature=...&format=json&clean=true\n\nBackpack\nhttps://api.apify.com/v2/datasets/5kGumsGqCkaaMzzAO/items?signature=...&format=json&clean=true`}
                rows={5}
                className="block w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono text-xs sm:text-sm bg-gray-50/50 focus:bg-white transition"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Write a category name (e.g., <strong>Purse</strong>, <strong>Wallet</strong>, <strong>Backpack</strong>, <strong>Travel Bag</strong>) and paste one or more links below it to automatically assign those products to that category!
              </p>
            </div>
          </div>
        ) : inputType === "file" ? (
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">
              Upload Apify JSON Dataset File:
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100/60 transition">
              <FileJson className="w-12 h-12 text-primary mb-3" />
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="block w-full max-w-sm text-xs sm:text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
              />
              {fileName && (
                <p className="text-emerald-700 font-bold text-xs mt-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Loaded: {fileName}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">
              Paste Apify Raw JSON Data:
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder='[{"offerId": "949496858896", "title": "...", "price": {"min": 53.5}, "images": [...]}]'
              className="block w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-primary font-mono text-xs bg-gray-50/50 focus:bg-white"
              rows={8}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs sm:text-sm flex items-center gap-2.5 font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Link Processing Summary Report */}
        {linkReport.length > 0 && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
            <div className="text-xs font-bold text-slate-700">Link Extraction Status:</div>
            {linkReport.map((rep, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-xl border border-slate-100">
                <span className="font-mono text-slate-600 truncate max-w-lg">{rep.url}</span>
                {rep.success ? (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                    ✓ {rep.count} products extracted
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-full">
                    ✕ {rep.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDirectUploadAndPublish}
            disabled={isActionDisabled}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer disabled:cursor-not-allowed"
          >
            {directUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
            {directUploading
              ? "Uploading products..."
              : "1-Click Direct Upload & Publish to Store"}
          </button>

          <button
            type="button"
            onClick={handleExtractPreview}
            disabled={isActionDisabled}
            className="bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {loading ? "Extracting data..." : "Extract & Preview"}
          </button>
        </div>
      </div>

      {/* Preview & Edit Extracted Products Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in">
          <div className="p-5 border-b border-gray-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10">
            <div>
              <h3 className="font-black text-base sm:text-lg text-charcoal">
                Extracted Products ({results.length} products found)
              </h3>
              <p className="text-xs text-gray-500">
                You can edit any product title, price, or category below before saving to the store.
              </p>
              {categoryBreakdown.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] font-bold text-gray-600">Products by Category:</span>
                  {categoryBreakdown.map(([cat, count]) => (
                    <span
                      key={cat}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-50 text-[#cb1e46] border border-red-200"
                    >
                      {cat}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSavePreviewToStore}
              disabled={loading || directUploading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-3 rounded-2xl font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Publish All {results.length} Products to Store
            </button>
          </div>

          <div className="overflow-x-auto max-h-[680px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/90 sticky top-0 z-10 border-b border-gray-200">
                <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Image</th>
                  <th className="px-4 py-3.5">Product Title & Offer ID</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Variants & Images</th>
                  <th className="px-4 py-3.5">Price (RMB / BDT)</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-xs">
                {results.map((product, idx) => {
                  const varCount =
                    product.skuDetails?.variants?.length ||
                    product.variants?.length ||
                    1;
                  const imgCount = Array.isArray(product.images) ? product.images.length : 1;

                  return (
                    <tr key={`${product.id || idx}-${idx}`} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-white p-1 flex items-center justify-center">
                          <img
                            src={getSafeImageUrl(product.image, undefined, product.name)}
                            alt={product.name}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-md">
                        <input
                          type="text"
                          value={product.name || ""}
                          onChange={(e) => handleUpdateResultItem(idx, "name", e.target.value)}
                          className="w-full font-bold text-charcoal bg-transparent border border-transparent hover:border-gray-300 focus:border-primary focus:bg-white rounded-lg px-2 py-1 text-xs transition"
                        />
                        {product.originalTitle && product.originalTitle !== product.name && (
                          <div className="text-[11px] text-gray-400 px-2 truncate max-w-sm">
                            {product.originalTitle}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1 px-2 text-[11px] text-gray-500">
                          {product.offerId && (
                            <span className="font-mono bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                              #{product.offerId}
                            </span>
                          )}
                          <span className="truncate max-w-[180px]">{product.brand}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <select
                          value={getCanonicalCategoryName(product.category, product.name)}
                          onChange={(e) => handleUpdateResultItem(idx, "category", e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-charcoal bg-white focus:outline-none focus:border-primary cursor-pointer"
                        >
                          {EXPANDABLE_MAIN_CATEGORIES.map((mc) => (
                            <optgroup key={mc.id} label={`📂 ${mc.name} & ${(mc.subCategories || []).length} Sub-Categories`}>
                              <option value={mc.name}>{mc.name} (Main)</option>
                              {(mc.subCategories || []).map((sub) => (
                                <option key={sub.id} value={sub.name}>
                                  ↳ {sub.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          <optgroup label="📦 Other Categories">
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
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 w-fit">
                            {varCount} SKU Variants
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {imgCount} Photos • MOQ: {product.minOrderQuantity || 1}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          {product.rmbPrice > 0 && (
                            <div className="text-[11px] font-bold text-amber-700">
                              RMB ¥{product.rmbPrice}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 font-bold">BDT </span>
                            <input
                              type="number"
                              value={product.price || 0}
                              onChange={(e) =>
                                handleUpdateResultItem(idx, "price", parseInt(e.target.value, 10) || 0)
                              }
                              className="w-24 px-2 py-1 border border-gray-200 rounded-lg font-black text-emerald-700 text-xs focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {product.id && (
                            <RouterLink
                              to={`/product/abb-${String(product.offerId || product.id).replace(/^abb-/, "")}`}
                              target="_blank"
                              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                              title="View Product Page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </RouterLink>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveResultItem(idx)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove from list"
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
        </div>
      )}
    </div>
  );
}
