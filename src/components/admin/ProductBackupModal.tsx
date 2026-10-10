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
  X,
  Layers,
  ArrowRight
} from "lucide-react";

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

interface ProductBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsUpdated?: () => void;
}

export default function ProductBackupModal({
  isOpen,
  onClose,
  onProductsUpdated,
}: ProductBackupModalProps) {
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

  // Feedback message
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
      loadSnapshots();
      loadCategories();
      setStatusMessage(null);
    }
  }, [isOpen]);

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

    // Trigger download via hidden anchor
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
      if (onProductsUpdated) onProductsUpdated();
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
      if (onProductsUpdated) onProductsUpdated();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "ফাইল আপলোড করে রিস্টোর করতে সমস্যা হয়েছে।"
      });
    } finally {
      setRestoringUpload(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary-light border border-white/20">
              <Database className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Product Data Backup & Download Hub
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Snapshot System
                </span>
              </div>
              <p className="text-xs text-slate-300">
                ওয়েবসাইটের পুরো প্রডাক্ট ডাটা এক ক্লিকে ডাউনলোড, সুরক্ষিত স্ন্যাপশট সংরক্ষণ ও রিস্টোর করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">মোট প্রডাক্ট:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs">
                {stats?.totalProducts ?? "..."} টি
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">ক্যাটাগরি:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs">
                {stats?.totalCategories ?? "..."} টি
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">সংরক্ষিত ব্যাকআপ:</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 shadow-2xs">
                {stats?.snapshotsCount ?? snapshots.length} টি ফাইল ({stats?.totalBackupsSize ?? "..."})
              </span>
            </div>
            {stats?.lastBackupDate && (
              <div className="hidden sm:flex items-center gap-1.5 text-gray-500">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>সর্বশেষ ব্যাকআপ: {new Date(stats.lastBackupDate).toLocaleDateString()} {new Date(stats.lastBackupDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => { loadStats(); loadSnapshots(); }}
            className="text-xs font-semibold text-gray-600 hover:text-indigo-600 flex items-center gap-1 transition cursor-pointer"
            title="Refresh Stats"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStats || loadingSnapshots ? "animate-spin text-indigo-600" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-white gap-2 pt-2">
          <button
            onClick={() => setActiveTab("download")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "download"
                ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. ডাউনলোড ও এক্সপোর্ট (Download & Export)</span>
          </button>
          <button
            onClick={() => setActiveTab("snapshots")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "snapshots"
                ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. সংরক্ষিত স্ন্যাপশট ও হিস্ট্রি (Server Snapshots)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-extrabold">
              {snapshots.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("restore")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "restore"
                ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>3. ফাইল আপলোড ও রিস্টোর (Upload & Restore)</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center justify-between border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : statusMessage.type === "error"
                ? "bg-red-50 text-red-900 border-red-200"
                : "bg-blue-50 text-blue-900 border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-gray-400 hover:text-gray-600 text-sm p-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: DOWNLOAD & EXPORT */}
          {activeTab === "download" && (
            <div className="space-y-6">
              
              {/* Category Filter for Download */}
              <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ডাউনলোড ফিল্টার (Filter by Category)</span>
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    পুরো ওয়েবসাইটের সব প্রডাক্ট অথবা নির্দিষ্ট ক্যাটাগরি বেছে নিয়ে ডাউনলোড করতে পারেন
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full sm:w-60 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-indigo-600 shadow-2xs"
                  >
                    <option value="all">📂 পুরো ওয়েবসাইট (All {stats?.totalProducts || ""} Products)</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id || cat.slug} value={cat.name}>
                        ↳ {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Download Option Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Full JSON Backup */}
                <div className="p-5 rounded-2xl border-2 border-indigo-100 bg-linear-to-b from-indigo-50/40 to-white hover:border-indigo-300 transition shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <FileJson className="w-5 h-5" />
                      </span>
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-800">
                        সম্পূর্ণ ডাটাবেজ
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      Full Products Backup (JSON)
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      সম্পূর্ণ প্রোডাক্টের সমস্ত তথ্য: ছবি, ভ্যারিয়েন্ট, স্পেসিফিকেশন, পাইকারি দাম, SKU ও মূল লিংক সহ কাঁচা JSON ডাটা। ভবিষ্যতে সম্পূর্ণ ওয়েবসাইট রিস্টোর করার জন্য এটি আদর্শ।
                    </p>
                    <ul className="text-[11px] text-slate-500 space-y-1 mb-5">
                      <li className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>১০০% ডেটা ইন্টিগ্রিটি ও রিস্টোরেবল ফরম্যাট</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ভ্যারিয়েন্ট কালার, সাইজ ও মাল্টিপল ইমেজ সহ</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleDownload("json")}
                    disabled={downloadingJson}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`w-4 h-4 ${downloadingJson ? "animate-bounce" : ""}`} />
                    <span>{downloadingJson ? "ডাউনলোড হচ্ছে..." : "JSON ব্যাকআপ ডাউনলোড করুন"}</span>
                  </button>
                </div>

                {/* 2. Excel / CSV Export */}
                <div className="p-5 rounded-2xl border-2 border-emerald-100 bg-linear-to-b from-emerald-50/40 to-white hover:border-emerald-300 transition shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <FileSpreadsheet className="w-5 h-5" />
                      </span>
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                        এক্সেল ও স্প্রেডশিট
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      Excel / CSV Spreadsheet Export
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      Microsoft Excel বা Google Sheets-এ দেখার উপযোগী সাজানো স্প্রেডশিট। প্রোডাক্ট কোড, নাম, ক্যাটাগরি, বিক্রয়মূল্য (৳), স্টক, রেটিং ও মূল সাপ্লায়ার লিংক টেবিল আকারে থাকবে।
                    </p>
                    <ul className="text-[11px] text-slate-500 space-y-1 mb-5">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>UTF-8 BOM যুক্ত (বাংলা ও ইংরেজি কোনো অস্পষ্টতা ছাড়া ওপেন হয়)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ইনভেন্টরি অডিট ও প্রিন্ট করার জন্য সেরা</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleDownload("csv")}
                    disabled={downloadingCsv}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`w-4 h-4 ${downloadingCsv ? "animate-bounce" : ""}`} />
                    <span>{downloadingCsv ? "ডাউনলোড হচ্ছে..." : "Excel / CSV ফাইল ডাউনলোড করুন"}</span>
                  </button>
                </div>

              </div>

              {/* Information Note */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">সুরক্ষা পরামর্শ:</span> নিয়মিত বিরতিতে ব্যাকআপ ডাউনলোড করে আপনার কম্পিউটার বা গুগল ড্রাইভে সংরক্ষণ করুন। এতে যেকোনো সময় যেকোনো যান্ত্রিক বা মানবীয় ভুলের কারণে ডেটা মুছে গেলে মাত্র ৫ সেকেন্ডে সব ফেরত আনা যাবে।
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SERVER SNAPSHOTS & HISTORY */}
          {activeTab === "snapshots" && (
            <div className="space-y-6">
              
              {/* Take New Snapshot Form */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-700" />
                      <span>সার্ভারে তাত্ক্ষণিক নতুন ব্যাকআপ স্ন্যাপশট তৈরি করুন</span>
                    </h3>
                    <p className="text-[11px] text-indigo-800/80 mt-0.5">
                      একটি স্ন্যাপশট তৈরি করলে বর্তমান সকল প্রডাক্ট সার্ভারের নিরাপদ ব্যাকআপ ডিরেক্টরিতে স্থায়ীভাবে রেকর্ড হয়ে যাবে
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    দৈনিক অটো-ব্যাকআপ সক্রিয়
                  </span>
                </div>

                <form onSubmit={handleCreateSnapshot} className="flex flex-col sm:flex-row gap-2.5 mt-3">
                  <input
                    type="text"
                    placeholder="ঐচ্ছিক নোট লিখুন (যেমন: ঈদের অফারের আগের প্রডাক্ট ক্যাটালগ ব্যাকআপ)..."
                    value={newSnapshotNote}
                    onChange={(e) => setNewSnapshotNote(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs border border-indigo-200 rounded-xl bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    disabled={creatingSnapshot}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{creatingSnapshot ? "সংরক্ষণ হচ্ছে..." : "এখনই ব্যাকআপ তৈরি করুন"}</span>
                  </button>
                </form>
              </div>

              {/* Restore Mode Selection */}
              <div className="flex items-center justify-between px-1 text-xs">
                <h4 className="font-bold text-slate-800">
                  সংরক্ষিত ব্যাকআপ তালিকা ({snapshots.length} টি)
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-[11px]">রিস্টোর মেথড:</span>
                  <label className="flex items-center gap-1 text-[11px] text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="merge"
                      checked={restoreMode === "merge"}
                      onChange={() => setRestoreMode("merge")}
                      className="text-indigo-600"
                    />
                    <span>নিরাপদ মার্জ (Merge)</span>
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-700 cursor-pointer ml-2">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="replace"
                      checked={restoreMode === "replace"}
                      onChange={() => setRestoreMode("replace")}
                      className="text-indigo-600"
                    />
                    <span className="text-amber-800 font-semibold">সম্পূর্ণ প্রতিস্থাপন (Replace)</span>
                  </label>
                </div>
              </div>

              {/* Snapshots Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">তারিখ ও সময়</th>
                        <th className="py-2.5 px-3">ধরন</th>
                        <th className="py-2.5 px-3">নোট / বিবরণ</th>
                        <th className="py-2.5 px-3 text-center">প্রডাক্ট সংখ্যা</th>
                        <th className="py-2.5 px-3 text-right">সাইজ</th>
                        <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {snapshots.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">
                            সার্ভারে এখনও কোনো ব্যাকআপ ফাইল নেই। উপরের বাটনে ক্লিক করে প্রথম ব্যাকআপ তৈরি করুন।
                          </td>
                        </tr>
                      ) : (
                        snapshots.map((snap) => (
                          <tr key={snap.filename} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-900 font-medium">
                              <div>{new Date(snap.createdAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {new Date(snap.createdAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
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
                            <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate" title={snap.note}>
                              {snap.note || snap.filename}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                {snap.productsCount} টি
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-500 font-mono text-[11px]">
                              {snap.sizeFormatted}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Download */}
                                <a
                                  href={`/api/admin/backup/products/snapshots/${encodeURIComponent(snap.filename)}`}
                                  download={snap.filename}
                                  className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                                  title="Download snapshot file"
                                >
                                  <Download className="w-3.5 h-3.5" />
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
                                    className={`w-3.5 h-3.5 ${
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
                                  <Trash2 className="w-3.5 h-3.5" />
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
              <div className="p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-slate-50/50 flex flex-col items-center justify-center text-center transition">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  কম্পিউটার থেকে ব্যাকআপ JSON ফাইল আপলোড করুন
                </h3>
                <p className="text-xs text-gray-500 max-w-md mb-4">
                  পূর্বে ডাউনলোড করা যেকোনো প্রোডাক্ট ব্যাকআপ <code className="bg-gray-200 px-1 py-0.5 rounded font-mono text-[11px]">.json</code> ফাইল সিলেক্ট করুন।
                </p>

                <label className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition">
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
                  <div className="mt-4 p-3 bg-white border border-gray-200 rounded-xl text-xs w-full max-w-md text-left flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="font-bold text-slate-900 truncate">{uploadFile.name}</div>
                      <div className="text-[11px] text-gray-500">
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
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Restore Confirmation and Options */}
              {uploadFile && uploadPreviewCount !== null && (
                <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950">
                        রিস্টোর অপশন নির্বাচন করুন:
                      </h4>
                      <p className="text-[11px] text-indigo-800/80 mt-0.5">
                        আপনি কি বিদ্যমান প্রডাক্ট অক্ষুণ্ণ রেখে নতুনগুলো যোগ করতে চান নাকি সম্পূর্ণ তালিকা প্রতিস্থাপন করতে চান?
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label
                      className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                        restoreMode === "merge"
                          ? "border-indigo-600 bg-white shadow-2xs"
                          : "border-gray-200 bg-white/60 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="uploadRestoreMode"
                        value="merge"
                        checked={restoreMode === "merge"}
                        onChange={() => setRestoreMode("merge")}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">নিরাপদ মার্জ (Safe Merge)</div>
                        <div className="text-[11px] text-gray-500 leading-normal mt-0.5">
                          বিদ্যমান প্রডাক্ট সুরক্ষিত থাকবে, শুধুমাত্র নতুনগুলো যুক্ত ও আপডেট হবে।
                        </div>
                      </div>
                    </label>

                    <label
                      className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                        restoreMode === "replace"
                          ? "border-amber-600 bg-white shadow-2xs"
                          : "border-gray-200 bg-white/60 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="uploadRestoreMode"
                        value="replace"
                        checked={restoreMode === "replace"}
                        onChange={() => setRestoreMode("replace")}
                        className="mt-0.5 text-amber-600"
                      />
                      <div>
                        <div className="font-bold text-amber-950">সম্পূর্ণ প্রতিস্থাপন (Replace All)</div>
                        <div className="text-[11px] text-gray-500 leading-normal mt-0.5">
                          বর্তমান প্রডাক্ট তালিকা মুছে আপলোডকৃত ব্যাকআপ ফাইল দিয়ে সম্পূর্ণ নতুনভাবে প্রতিস্থাপন করবে।
                        </div>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={handleUploadAndRestore}
                    disabled={restoringUpload}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
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

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>অটো-ব্যাকআপ ডিরেক্টরি: <code className="font-mono text-[10px] bg-gray-200 px-1 py-0.5 rounded">data/backups/products/</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold transition cursor-pointer"
          >
            বন্ধ করুন (Close)
          </button>
        </div>

      </div>
    </div>
  );
}
