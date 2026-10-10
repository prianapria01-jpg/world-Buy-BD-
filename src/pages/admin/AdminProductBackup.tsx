import React, { useState, useEffect } from "react";
import {
  Download,
  Upload,
  Database,
  FileJson,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  Plus,
  ShieldCheck,
  Layers,
  ArrowRight,
  ExternalLink,
  Package,
  HardDrive,
  Calendar,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";

interface SnapshotMeta {
  filename: string;
  createdAt: string;
  productsCount: number;
  sizeBytes: number;
  sizeFormatted: string;
  note: string;
  type: "manual" | "auto";
  version: string;
}

interface BackupStats {
  totalProducts: number;
  totalCategories: number;
  snapshotsCount: number;
  latestSnapshot: SnapshotMeta | null;
  totalBackupsSize: string;
  lastBackupDate: string | null;
}

export default function AdminProductBackup() {
  const [activeTab, setActiveTab] = useState<"download" | "snapshots" | "restore">("download");
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Download options
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Snapshot creation
  const [newSnapshotNote, setNewSnapshotNote] = useState("");
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  // Restore state
  const [restoringFilename, setRestoringFilename] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewCount, setUploadPreviewCount] = useState<number | null>(null);
  const [restoringUpload, setRestoringUpload] = useState(false);

  // Status message
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadStats();
    loadSnapshots();
    loadCategories();
  }, []);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/backup/products/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn("Failed to load backup stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadSnapshots = async () => {
    setLoadingSnapshots(true);
    try {
      const res = await fetch("/api/admin/backup/products/snapshots");
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch (err) {
      console.warn("Failed to load snapshots:", err);
    } finally {
      setLoadingSnapshots(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Failed to load categories:", err);
    }
  };

  const handleDownload = (format: "json" | "csv") => {
    if (format === "json") setDownloadingJson(true);
    if (format === "csv") setDownloadingCsv(true);

    const catParam = selectedCategory && selectedCategory !== "all" 
      ? `?category=${encodeURIComponent(selectedCategory)}` 
      : "";
    const url = `/api/admin/backup/products/download/${format}${catParam}`;

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingJson(false);
      setDownloadingCsv(false);
      setStatusMessage({
        type: "success",
        text: format === "json" 
          ? "সম্পূর্ণ প্রডাক্ট JSON ব্যাকআপ সফলভাবে ডাউনলোড শুরু হয়েছে!" 
          : "প্রডাক্ট Excel / CSV স্প্রেডশিট সফলভাবে ডাউনলোড শুরু হয়েছে!"
      });
    }, 1200);
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSnapshot(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/backup/products/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newSnapshotNote.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create backup snapshot");

      setStatusMessage({
        type: "success",
        text: `সার্ভারে নতুন ব্যাকআপ স্ন্যাপশট সংরক্ষিত হয়েছে! মোট প্রডাক্ট: ${data.snapshot.productsCount} টি (${data.snapshot.sizeFormatted})`
      });
      setNewSnapshotNote("");
      loadStats();
      loadSnapshots();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "ব্যাকআপ স্ন্যাপশট তৈরিতে সমস্যা হয়েছে।"
      });
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleDeleteSnapshot = async (filename: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${filename}" ব্যাকআপ ফাইলটি সার্ভার থেকে মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/backup/products/snapshots/${encodeURIComponent(filename)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete snapshot");

      setStatusMessage({
        type: "info",
        text: "ব্যাকআপ ফাইলটি সার্ভার থেকে সফলভাবে মুছে ফেলা হয়েছে।"
      });
      loadStats();
      loadSnapshots();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "ব্যাকআপ মুছে ফেলতে সমস্যা হয়েছে।"
      });
    }
  };

  const handleRestoreFromSnapshot = async (filename: string) => {
    const confirmPrompt = window.confirm(
      `সতর্কতা: আপনি কি নিশ্চিত যে এই ব্যাকআপ স্ন্যাপশট (${filename}) থেকে প্রডাক্ট রিস্টোর করতে চান?\n\nরিস্টোরের আগে স্বয়ংক্রিয়ভাবে একটি সুরক্ষামূলক ব্যাকআপ তৈরি করা হবে।`
    );
    if (!confirmPrompt) return;

    setRestoringFilename(filename);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/backup/products/restore-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, mode: restoreMode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore snapshot");

      setStatusMessage({
        type: "success",
        text: `সফলভাবে রিস্টোর সম্পন্ন হয়েছে! মোট ${data.totalProducts} টি প্রডাক্ট বর্তমানে সক্রিয় রয়েছে।`
      });
      loadStats();
      loadSnapshots();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "স্ন্যাপশট থেকে রিস্টোর করতে সমস্যা হয়েছে।"
      });
    } finally {
      setRestoringFilename(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        let count = 0;
        if (Array.isArray(parsed)) {
          count = parsed.length;
        } else if (parsed && Array.isArray(parsed.products)) {
          count = parsed.products.length;
        }
        setUploadPreviewCount(count);
      } catch {
        setUploadPreviewCount(null);
        setStatusMessage({
          type: "error",
          text: "নির্বাচিত ফাইলটি সঠিক JSON ফরম্যাটে নেই। অনুগ্রহ করে একটি বৈধ ব্যাকআপ JSON ফাইল নির্বাচন করুন।"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleUploadAndRestore = async () => {
    if (!uploadFile) return;

    setRestoringUpload(true);
    setStatusMessage(null);
    try {
      const text = await uploadFile.text();
      const parsed = JSON.parse(text);
      let prodsList: any[] = [];

      if (Array.isArray(parsed)) {
        prodsList = parsed;
      } else if (parsed && Array.isArray(parsed.products)) {
        prodsList = parsed.products;
      }

      if (prodsList.length === 0) {
        throw new Error("আপলোড করা ব্যাকআপ ফাইলে কোনো প্রডাক্ট পাওয়া যায়নি।");
      }

      const res = await fetch("/api/admin/backup/restore-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: prodsList, mode: restoreMode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore products");

      setStatusMessage({
        type: "success",
        text: `ব্যাকআপ ফাইল সফলভাবে রিস্টোর হয়েছে! মোট প্রডাক্ট: ${data.totalProducts} টি (${restoreMode === "replace" ? "সম্পূর্ণ প্রতিস্থাপিত" : "মার্জ ও আপডেট"})`
      });
      setUploadFile(null);
      setUploadPreviewCount(null);
      loadStats();
      loadSnapshots();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "ফাইল আপলোড করে রিস্টোর করতে সমস্যা হয়েছে।"
      });
    } finally {
      setRestoringUpload(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Product Backup & Download System
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live & Automated
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ওয়েবসাইটের পুরো প্রডাক্ট ডাটা নিরাপদে ব্যাকআপ রাখা, JSON ও Excel/CSV ফরম্যাটে ডাউনলোড এবং রিস্টোর করার কেন্দ্রীয় হাব
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/admin/products"
            className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Package className="w-4 h-4 text-gray-500" />
            <span>প্রডাক্ট ম্যানেজমেন্ট</span>
          </Link>
          <button
            onClick={() => { loadStats(); loadSnapshots(); }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStats || loadingSnapshots ? "animate-spin text-indigo-600" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">লাইভ প্রডাক্ট সংখ্যা</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {stats?.totalProducts ?? "..."}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle className="w-3 h-3" />
              <span>ডাটাবেজে সক্রিয়</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">মোট ক্যাটাগরি</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {stats?.totalCategories ?? "..."}
            </div>
            <span className="text-[11px] text-gray-500 mt-1">
              ক্যাটালগ সেকশন
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">সংরক্ষিত স্ন্যাপশট</span>
            <div className="text-2xl font-bold text-indigo-700 mt-1">
              {stats?.snapshotsCount ?? snapshots.length} টি
            </div>
            <span className="text-[11px] text-indigo-600 font-semibold mt-1">
              সাইজ: {stats?.totalBackupsSize ?? "..."}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">সর্বশেষ ব্যাকআপ</span>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {stats?.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleDateString() : "আজকের"}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {stats?.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleTimeString() : "দৈনিক অটো-ব্যাকআপ"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-slate-50/50 gap-2 pt-3">
          <button
            onClick={() => setActiveTab("download")}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "download"
                ? "border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>১. ডাউনলোড ও এক্সপোর্ট (Download & Export)</span>
          </button>
          <button
            onClick={() => setActiveTab("snapshots")}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "snapshots"
                ? "border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>২. সার্ভারে স্ন্যাপশট ও হিস্ট্রি (Server Snapshots)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold">
              {snapshots.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("restore")}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "restore"
                ? "border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>৩. ফাইল আপলোড ও রিস্টোর (Upload & Restore)</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`mx-6 mt-5 p-3.5 rounded-xl text-xs flex items-center justify-between border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : statusMessage.type === "error"
                ? "bg-red-50 text-red-900 border-red-200"
                : "bg-blue-50 text-blue-900 border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusMessage.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-semibold">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-gray-400 hover:text-gray-600 text-base font-bold px-2 py-0.5"
            >
              ×
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 space-y-6">
          
          {/* TAB 1: DOWNLOAD & EXPORT */}
          {activeTab === "download" && (
            <div className="space-y-6">
              
              {/* Category Filter */}
              <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>ক্যাটাগরি ভিত্তিক ডাউনলোড ফিল্টার (Category Filter)</span>
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    ডিফল্টভাবে সমস্ত প্রডাক্ট ডাউনলোড হবে, অথবা নির্দিষ্ট ক্যাটাগরি বেছে নিতে পারেন
                  </p>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-72 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-600 shadow-2xs"
                >
                  <option value="all">📂 সম্পূর্ণ ওয়েবসাইট (সকল {stats?.totalProducts || ""} টি প্রডাক্ট)</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id || cat.slug} value={cat.name}>
                      ↳ {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Full JSON Backup Card */}
                <div className="p-6 rounded-2xl border-2 border-indigo-100 bg-linear-to-b from-indigo-50/40 to-white hover:border-indigo-300 transition shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <FileJson className="w-6 h-6" />
                      </span>
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">
                        সম্পূর্ণ ডেটাবেজ ব্যাকআপ
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5">
                      Full Products Backup (JSON Format)
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      প্রডাক্টের প্রতিটি ফিল্ড, মাল্টিপল গ্যালারি ইমেজ, কালার/সাইজ ভ্যারিয়েন্ট, পাইকারি রেঞ্জ, চায়না ১৬৮৮ এর মূল সোর্স আইডি ও টেকনিক্যাল স্পেসিফিকেশন সহ সম্পূর্ণ ব্যাকআপ ফাইল।
                    </p>
                    <div className="space-y-2 mb-6 text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>১-ক্লিকে পুনরায় যেকোনো ডিভাইসে রিস্টোর করার উপযোগী</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>সম্পূর্ণ হাই-রেজোলিউশন ইমেজ লিংক সংরক্ষিত</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload("json")}
                    disabled={downloadingJson}
                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`w-4 h-4 ${downloadingJson ? "animate-bounce" : ""}`} />
                    <span>{downloadingJson ? "ডাউনলোড হচ্ছে..." : "সম্পূর্ণ JSON ব্যাকআপ ডাউনলোড করুন"}</span>
                  </button>
                </div>

                {/* 2. Excel / CSV Spreadsheet Card */}
                <div className="p-6 rounded-2xl border-2 border-emerald-100 bg-linear-to-b from-emerald-50/40 to-white hover:border-emerald-300 transition shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <FileSpreadsheet className="w-6 h-6" />
                      </span>
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                        স্প্রেডশিট ও রিপোর্টিং
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5">
                      Excel / CSV Spreadsheet Export
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      Microsoft Excel, LibreOffice বা Google Sheets-এ ওপেন করে ইনভেন্টরি পর্যবেক্ষণ, স্টক হিসেব ও অফলাইন প্রাইস চেকের জন্য তৈরি করা স্প্রেডশিট।
                    </p>
                    <div className="space-y-2 mb-6 text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>UTF-8 BOM যুক্ত - এক্সেল এ বাংলা ফন্ট নিখুঁত দেখায়</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>আইডি, নাম, ক্যাটাগরি, মূল্য (৳), স্টক ও সরবরাহকারী লিংক সহ কলাম</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload("csv")}
                    disabled={downloadingCsv}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`w-4 h-4 ${downloadingCsv ? "animate-bounce" : ""}`} />
                    <span>{downloadingCsv ? "ডাউনলোড হচ্ছে..." : "Excel / CSV স্প্রেডশিট ডাউনলোড করুন"}</span>
                  </button>
                </div>

              </div>

              {/* Guide Box */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 text-xs text-indigo-950 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">স্বয়ংক্রিয় ব্যাকআপ সুরক্ষা:</span> সার্ভার প্রতিদিন একটি করে ব্যাকআপ স্ন্যাপশট স্বয়ংক্রিয়ভাবে সংরক্ষণ করে। এছাড়াও আপনি যখনই কোনো বড় আপডেট বা প্রোডাক্ট ডিলিট করবেন, তার আগে এই পৃষ্ঠা থেকে একটি ম্যানুয়াল স্ন্যাপশট নিয়ে রাখা বুদ্ধিমানের কাজ।
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SERVER SNAPSHOTS & HISTORY */}
          {activeTab === "snapshots" && (
            <div className="space-y-6">
              
              {/* Snapshot Creator */}
              <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-700" />
                      <span>সার্ভারে তাত্ক্ষণিক ব্যাকআপ স্ন্যাপশট সংরক্ষণ করুন</span>
                    </h3>
                    <p className="text-xs text-indigo-800/80 mt-1">
                      বর্তমান ডেটাবেজের সকল প্রডাক্ট নিয়ে সার্ভারে একটি টাইমস্ট্যাম্পড কপি রেকর্ড করে রাখবে
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    অটোমেটেড ব্যাকআপ সক্রিয়
                  </span>
                </div>

                <form onSubmit={handleCreateSnapshot} className="flex flex-col sm:flex-row gap-3 mt-4">
                  <input
                    type="text"
                    placeholder="ঐচ্ছিক নোট লিখুন (যেমন: নতুন প্রোডাক্ট আপলোডের আগের ব্যাকআপ)..."
                    value={newSnapshotNote}
                    onChange={(e) => setNewSnapshotNote(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs border border-indigo-200 rounded-xl bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    disabled={creatingSnapshot}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{creatingSnapshot ? "সংরক্ষণ হচ্ছে..." : "এখনই স্ন্যাপশট সেভ করুন"}</span>
                  </button>
                </form>
              </div>

              {/* Table Header and Mode Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1 text-xs">
                <div>
                  <h4 className="font-bold text-slate-850 text-sm">
                    সার্ভারে সংরক্ষিত স্ন্যাপশট হিস্ট্রি ({snapshots.length} টি ফাইল)
                  </h4>
                  <p className="text-gray-500 text-[11px]">
                    যেকোনো সময় পূর্বের যেকোনো তারিখে সংরক্ষিত ব্যাকআপ থেকে ওয়েবসাইট রিস্টোর বা ডাউনলোড করতে পারেন
                  </p>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-gray-200">
                  <span className="text-gray-500 font-semibold text-[11px]">রিস্টোর মেথড:</span>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="restoreModePage"
                      value="merge"
                      checked={restoreMode === "merge"}
                      onChange={() => setRestoreMode("merge")}
                      className="text-indigo-600"
                    />
                    <span>নিরাপদ মার্জ</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="restoreModePage"
                      value="replace"
                      checked={restoreMode === "replace"}
                      onChange={() => setRestoreMode("replace")}
                      className="text-indigo-600"
                    />
                    <span className="text-amber-800 font-bold">সম্পূর্ণ প্রতিস্থাপন</span>
                  </label>
                </div>
              </div>

              {/* Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">সংরক্ষণ সময়</th>
                        <th className="py-3 px-3">ধরন</th>
                        <th className="py-3 px-4">নোট / বিবরণ</th>
                        <th className="py-3 px-3 text-center">প্রডাক্ট সংখ্যা</th>
                        <th className="py-3 px-3 text-right">সাইজ</th>
                        <th className="py-3 px-4 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {snapshots.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-gray-500">
                            সার্ভারে এখনও কোনো সংরক্ষিত স্ন্যাপশট ফাইল নেই। উপরের ফর্ম ব্যবহার করে একটি স্ন্যাপশট তৈরি করুন।
                          </td>
                        </tr>
                      ) : (
                        snapshots.map((snap) => (
                          <tr key={snap.filename} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 whitespace-nowrap text-slate-900 font-medium">
                              <div className="font-bold">{new Date(snap.createdAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {new Date(snap.createdAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  snap.type === "auto"
                                    ? "bg-slate-100 text-slate-700 border-slate-200"
                                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                }`}
                              >
                                {snap.type === "auto" ? "🤖 Auto" : "👤 Manual"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 max-w-sm truncate" title={snap.note}>
                              {snap.note || snap.filename}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                                {snap.productsCount} টি
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-gray-500 font-mono text-[11px]">
                              {snap.sizeFormatted}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                {/* Download */}
                                <a
                                  href={`/api/admin/backup/products/snapshots/${encodeURIComponent(snap.filename)}`}
                                  download={snap.filename}
                                  className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                                  title="Download snapshot JSON"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                {/* Restore */}
                                <button
                                  type="button"
                                  onClick={() => handleRestoreFromSnapshot(snap.filename)}
                                  disabled={restoringFilename === snap.filename}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                  title="Restore website products from this snapshot"
                                >
                                  <RefreshCw
                                    className={`w-4 h-4 ${
                                      restoringFilename === snap.filename ? "animate-spin text-emerald-700" : ""
                                    }`}
                                  />
                                </button>
                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSnapshot(snap.filename)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Delete snapshot"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: UPLOAD & RESTORE */}
          {activeTab === "restore" && (
            <div className="space-y-6">
              
              <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-slate-50/50 flex flex-col items-center justify-center text-center transition">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  কম্পিউটার বা ড্রাইভ থেকে ব্যাকআপ JSON ফাইল আপলোড করুন
                </h3>
                <p className="text-xs text-gray-500 max-w-lg mb-5">
                  পূর্বে ডাউনলোড করা ব্যাকআপ <code className="bg-gray-200 px-1 py-0.5 rounded font-mono text-[11px]">.json</code> ফাইল সিলেক্ট করুন। সিস্টেম স্বয়ংক্রিয়ভাবে প্রডাক্ট শনাক্ত করবে।
                </p>

                <label className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>ফাইল নির্বাচন করুন (Choose File)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {uploadFile && (
                  <div className="mt-5 p-4 bg-white border border-gray-200 rounded-xl text-xs w-full max-w-md text-left flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="font-bold text-slate-900 truncate">{uploadFile.name}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        সাইজ: {(uploadFile.size / 1024).toFixed(1)} KB
                        {uploadPreviewCount !== null && (
                          <span className="ml-2 font-bold text-indigo-700">
                            · {uploadPreviewCount} টি প্রডাক্ট শনাক্ত হয়েছে
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { setUploadFile(null); setUploadPreviewCount(null); }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {uploadFile && uploadPreviewCount !== null && (
                <div className="p-6 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-5">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-950">
                      রিস্টোর অপশন নির্বাচন করুন:
                    </h4>
                    <p className="text-xs text-indigo-800/80 mt-1">
                      আপনি কীভাবে আপলোডকৃত ডাটাবেজ প্রডাক্ট আপডেট করতে চান?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <label
                      className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                        restoreMode === "merge"
                          ? "border-indigo-600 bg-white shadow-2xs"
                          : "border-gray-200 bg-white/60 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="uploadRestoreModePage"
                        value="merge"
                        checked={restoreMode === "merge"}
                        onChange={() => setRestoreMode("merge")}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">নিরাপদ মার্জ (Safe Merge)</div>
                        <div className="text-[11px] text-gray-500 leading-normal mt-1">
                          বিদ্যমান সমস্ত প্রডাক্ট সংরক্ষিত থাকবে। আপলোডকৃত ফাইলের নতুনগুলো যুক্ত হবে এবং মিল থাকা প্রডাক্ট আপডেট হবে।
                        </div>
                      </div>
                    </label>

                    <label
                      className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                        restoreMode === "replace"
                          ? "border-amber-600 bg-white shadow-2xs"
                          : "border-gray-200 bg-white/60 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="uploadRestoreModePage"
                        value="replace"
                        checked={restoreMode === "replace"}
                        onChange={() => setRestoreMode("replace")}
                        className="mt-0.5 text-amber-600"
                      />
                      <div>
                        <div className="font-bold text-amber-950">সম্পূর্ণ প্রতিস্থাপন (Replace All)</div>
                        <div className="text-[11px] text-gray-500 leading-normal mt-1">
                          বর্তমান প্রডাক্ট ক্যাটালগ মুছে আপলোডকৃত ব্যাকআপ দিয়ে সম্পূর্ণ নতুনভাবে ডাটাবেজ প্রতিস্থাপন করা হবে।
                        </div>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={handleUploadAndRestore}
                    disabled={restoringUpload}
                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${restoringUpload ? "animate-spin" : ""}`} />
                    <span>
                      {restoringUpload
                        ? "রিস্টোর হচ্ছে..."
                        : `নিশ্চিত করুন: ${uploadPreviewCount} টি প্রডাক্ট রিস্টোর করুন`}
                    </span>
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
