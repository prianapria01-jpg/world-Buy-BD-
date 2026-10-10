import React, { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Settings, Save, Check, Smartphone, Building, DollarSign, Truck, Phone, Mail, Image as ImageIcon, ShoppingBag, Sliders, ArrowRight, Database, ShieldCheck, Download, Upload, CheckCircle2, AlertCircle, FileJson, RefreshCw, Sparkles, Globe, Search, ExternalLink, Terminal, Copy, UploadCloud } from "lucide-react";

import BannerManager from "../../components/admin/BannerManager";
import DiscountPopupManager from "../../components/admin/DiscountPopupManager";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2500);
    } catch {}
  };

  const { isMarketingUser, currentUserRole } = React.useMemo(() => {
    let role = "admin";
    let isMarketing = false;
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("admin_user") : null;
      if (userStr) {
        const parsed = JSON.parse(userStr);
        role = String(parsed?.role || "").toLowerCase();
        if (role.includes("marketing") || role === "sales person") {
          isMarketing = true;
        }
      }
      const dept = typeof window !== "undefined" ? localStorage.getItem("admin_department_role") : null;
      if (dept === "marketing") {
        isMarketing = true;
      }
    } catch {}
    return { isMarketingUser: isMarketing, currentUserRole: role };
  }, []);

  const [settings, setSettings] = useState({
    bkashNumber: "01712-345678",
    bkashType: "Personal (Send Money)",
    nagadNumber: "01912-345678",
    nagadType: "Personal (Send Money)",
    bankName: "South East Bank PLC",
    bankAccountName: "Md Shamim Hossen",
    bankAccountNumber: "002412100022424",
    bankBranch: "Banani Branch",
    bankRouting: "205260432",
    rmbRate: 22.80,
    airShippingRate: 950,
    seaShippingRate: 450,
    minOrderAmount: 2000,
    phone: "+880 1355-136661",
    email: "worldbuybd01@gmail.com",
    logoUrl: "",
    heroBannerImage1: "",
    heroBannerImage2: "",
    apkDownloadUrl: "",
    playStoreUrl: "",
    googleSearchConsoleVerification: ""
  });

  const [restoringBackup, setRestoringBackup] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dbStats, setDbStats] = useState<{ productsCount: number } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          // Ensure no null/undefined values for text inputs
          const sanitizedData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, value ?? ""])
          );
          setSettings(prev => ({ ...prev, ...sanitizedData }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/products/summary")
      .then(r => r.json())
      .then(p => {
        const pLen = Array.isArray(p) ? p.length : (p.products?.length || 0);
        setDbStats({ productsCount: pLen });
      })
      .catch(() => {});
  }, []);

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoringBackup(true);
    setRestoreMessage(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      let prodsList: any[] = [];
      if (Array.isArray(parsed)) {
        prodsList = parsed;
      } else if (parsed && Array.isArray(parsed.products)) {
        prodsList = parsed.products;
      }

      if (prodsList.length === 0) {
        throw new Error("No valid products found in the uploaded backup file.");
      }

      const res = await fetch("/api/admin/backup/restore-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: prodsList })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Restore failed");

      setRestoreMessage({
        type: "success",
        text: `✓ Successfully restored and synced ${data.count} products to the database (Total products: ${data.totalProducts})!`
      });
      setDbStats({ productsCount: data.totalProducts });
    } catch (err: any) {
      setRestoreMessage({
        type: "error",
        text: err.message || "Failed to process backup file."
      });
    } finally {
      setRestoringBackup(false);
      e.target.value = "";
    }
  };

  const handleChange = (field: string, val: any) => {
    setSettings(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-role": currentUserRole
        },
        body: JSON.stringify({ ...settings, rmbRate: Number(settings.rmbRate), airShippingRate: Number(settings.airShippingRate), seaShippingRate: Number(settings.seaShippingRate), userRole: currentUserRole })
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to save settings: Admin access required.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isMarketingUser) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldCheck className="w-7 h-7 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">🚫 Access Restricted</h2>
        <div className="text-sm font-semibold text-rose-700 bg-rose-50 p-4 rounded-xl border border-rose-200 mb-4 text-left space-y-1">
          <p className="font-bold">⚠️ Restricted to Main Admin only.</p>
          <p className="text-xs text-rose-600">
            ব্যাংক অ্যাকাউন্ট বিবরণী, মোবাইল ব্যাংকিং এবং স্টোর সেটিংস দেখার বা পরিবর্তনের এক্সেস শুধু প্রধান অ্যাডমিনের জন্য সংরক্ষিত। মার্কেটিং ডিপার্টমেন্ট বা মার্কেটিং কর্মকর্তাদের এর কোনো এক্সেস নেই।
          </p>
        </div>
        <p className="text-xs text-gray-500 mb-6">
          Access to bank credentials, exchange rates, and financial settings is strictly restricted to Main Admin. Marketing staff cannot view or edit these details.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/admin"
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
            <Settings className="w-7 h-7 text-primary" />
            Store & Payment Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure bKash, Nagad, bank account details, RMB exchange rate and contact information
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md disabled:opacity-70"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              Saved successfully!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </>
          )}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2.5 shadow-xs animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span><strong>Success!</strong> Settings and store product prices updated automatically according to the new RMB rate.</span>
        </div>
      )}

      {/* 0. MASTER WEBSITE CUSTOMIZER STUDIO CALLOUT */}
      <div className="bg-gradient-to-r from-slate-900 via-[#014144] to-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
            <Sliders className="w-3 h-3" />
            <span>100% Visual Website Control</span>
          </div>
          <h2 className="text-base font-bold text-white">
            Master Website Customizer & Live On-Page Editor
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Change colors, theme presets, header links, hero carousel slides, section visibility, shipping calculator rates, FAQs, testimonials, footer, and policy pages in real-time.
          </p>
        </div>
        <Link
          to="/admin/customizer"
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center gap-2 shrink-0 shadow-sm transition"
        >
          <span>Open Website Customizer</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 1. MOBILE BANKING (BKASH & NAGAD) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-charcoal flex items-center gap-2 border-b border-gray-100 pb-3">
          <Smartphone className="w-5 h-5 text-[#D12053]" />
          Mobile Banking Settings (bKash & Nagad)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 p-4 bg-pink-50/40 border border-pink-100 rounded-xl">
            <div className="font-bold text-sm text-[#D12053]">bKash Account</div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">bKash Mobile Number *</label>
              <input
                type="text"
                required
                value={settings.bkashNumber}
                onChange={(e) => handleChange("bkashNumber", e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono font-bold text-charcoal bg-white focus:border-[#D12053] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Account Type</label>
              <input
                type="text"
                value={settings.bkashType}
                onChange={(e) => handleChange("bkashType", e.target.value)}
                placeholder="Personal / Merchant"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white focus:border-[#D12053] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3 p-4 bg-orange-50/40 border border-orange-100 rounded-xl">
            <div className="font-bold text-sm text-[#F7931E]">Nagad Account</div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nagad Mobile Number *</label>
              <input
                type="text"
                required
                value={settings.nagadNumber}
                onChange={(e) => handleChange("nagadNumber", e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono font-bold text-charcoal bg-white focus:border-[#F7931E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Account Type</label>
              <input
                type="text"
                value={settings.nagadType}
                onChange={(e) => handleChange("nagadType", e.target.value)}
                placeholder="Personal / Merchant"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white focus:border-[#F7931E] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. BANK ACCOUNT DETAILS */}
      <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-xs space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
          <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Bank Account Details
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Admin Only
            </span>
            <span className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              Restricted from Marketing
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Name *</label>
            <input
              type="text"
              required
              value={settings.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Account Holder Name *</label>
            <input
              type="text"
              required
              value={settings.bankAccountName}
              onChange={(e) => handleChange("bankAccountName", e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Account Number *</label>
            <input
              type="text"
              required
              value={settings.bankAccountNumber}
              onChange={(e) => handleChange("bankAccountNumber", e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono font-bold bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Branch & Routing Number</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={settings.bankBranch}
                onChange={(e) => handleChange("bankBranch", e.target.value)}
                placeholder="Branch Name"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white focus:border-blue-600 focus:outline-none"
              />
              <input
                type="text"
                value={settings.bankRouting}
                onChange={(e) => handleChange("bankRouting", e.target.value)}
                placeholder="Routing No"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CURRENCY & SHIPPING */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
          <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Currency Exchange & Shipping Rates
          </h2>
          <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
            ⚡ Changing the RMB rate automatically recalculates prices for all products
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Currency Conversion Rate (1 RMB = how many BDT)?</label>
            <input
              type="number"
              step="0.1"
              value={settings.rmbRate}
              onChange={(e) => handleChange("rmbRate", e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-bold bg-white focus:border-primary focus:outline-none"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">Default rate: 22.80 BDT (1 RMB = 22.80 BDT)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Air Freight Rate (Per KG BDT )</label>
            <input
              type="number"
              value={settings.airShippingRate}
              onChange={(e) => handleChange("airShippingRate", e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-bold bg-white focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Sea Freight Rate (Per KG BDT )</label>
            <input
              type="number"
              value={settings.seaShippingRate}
              onChange={(e) => handleChange("seaShippingRate", e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-bold bg-white focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              Minimum Order Amount (Min Order Amount - BDT )
            </label>
            <input
              type="number"
              value={settings.minOrderAmount}
              onChange={(e) => handleChange("minOrderAmount", Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-bold text-primary bg-white focus:border-primary focus:outline-none"
            />
            <span className="text-[10px] text-gray-400 mt-1 block">Default: BDT 2,000 (minimum order requirement)</span>
          </div>
        </div>
      </div>

      {/* 4. LOGO MANAGER */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-charcoal flex items-center gap-2 border-b border-gray-100 pb-3">
          <ImageIcon className="w-5 h-5 text-primary" />
          Store Logo Settings
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 border border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
            {settings.logoUrl && settings.logoUrl.trim() !== "" ? (
              <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-gray-400 text-xs">No Logo</span>
            )}
          </div>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const formData = new FormData();
                  formData.append("image", e.target.files[0]);
                  const res = await fetch("/api/admin/banners/upload", {
                    method: "POST",
                    body: formData,
                  });
                  const data = await res.json();
                  if (data.url) {
                    handleChange("logoUrl", data.url);
                    // Save immediately
                    const saveRes = await fetch("/api/settings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...settings, logoUrl: data.url })
                    });
                    if (saveRes.ok) {
                      alert("Logo updated successfully!");
                    }
                  }
                }
              }}
              className="text-xs"
            />
            <p className="text-[10px] text-gray-500">Upload a clean transparent PNG/SVG logo</p>
          </div>
        </div>
      </div>

      {/* 5. HERO BANNER MANAGER */}
      <BannerManager />

      {/* 6. DISCOUNT POPUP MANAGER */}
      <DiscountPopupManager />

      {/* 7. DATA BACKUP & DATABASE SAFETY CENTER */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Data Backup & Database Safety Center</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Ensure your store products, customers, and order records are securely backed up and protected across redeployments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Firestore Cloud Active
            </span>
          </div>
        </div>

        {/* Database Persistence Status Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Live Cloud Persistence Status:</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            All your products, customer accounts, and order records are saved in real-time to <strong>Firebase Cloud Firestore</strong> (<code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono text-slate-900">ai-studio-worldbuybd-e349a71e-eec5-43cb-9efd-605e4d0b060a</code>) and the server persistent storage. <strong>Your data remains completely safe and preserved even after deploying or modifying codebase.</strong>
          </p>
          {dbStats && (
            <div className="pt-2 flex items-center gap-4 text-slate-700 font-semibold border-t border-slate-200/80">
              <span>Active products currently in database: <strong className="text-emerald-700 font-mono text-sm">{dbStats.productsCount} items</strong></span>
            </div>
          )}
        </div>

        {/* Action Controls: Download Backup & Restore */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Export / Download Box */}
          <div className="border border-sky-200 bg-sky-50/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sky-950 font-bold text-sm">
              <Download className="w-4 h-4 text-sky-700" />
              <span>1. Download Data Backup (Export Backup)</span>
            </div>
            <p className="text-xs text-slate-600">
              For offline safety, you can download a full store database backup or export all product catalogs in JSON format.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                to="/admin/product-backup"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Product Backup Hub (Snapshots & Download)</span>
              </Link>
              <a
                href="/api/admin/backup/products/download/json"
                download="worldbuybd_products_backup.json"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Products Backup (JSON)</span>
              </a>
              <a
                href="/api/admin/backup/products/download/csv"
                download="worldbuybd_products_spreadsheet.csv"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel / CSV Spreadsheet</span>
              </a>
              <a
                href="/api/admin/backup/full"
                download="worldbuybd_full_backup.json"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Full Database Backup</span>
              </a>
            </div>
          </div>

          {/* Import / Restore Box */}
          <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
              <Upload className="w-4 h-4 text-amber-700" />
              <span>2. Restore Products Backup (Restore / Import)</span>
            </div>
            <p className="text-xs text-slate-600">
              Select a previously exported products JSON backup file to import and sync products directly into the database.
            </p>
            <div>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{restoringBackup ? "Restoring..." : "Upload & Restore Backup File"}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  disabled={restoringBackup}
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Restore Result Message */}
        {restoreMessage && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              restoreMessage.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-rose-50 border-rose-300 text-rose-800"
            }`}
          >
            {restoreMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{restoreMessage.text}</span>
          </div>
        )}
      </div>

      {/* 8. GOOGLE INDEXING & SEARCH CONSOLE (SEO) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>Google Search Indexing & SEO Console</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              গুগল সার্চে আপনার ওয়েবসাইট এবং সমস্ত প্রোডাক্ট পেজ দ্রুত ইনডেক্স ও প্রদর্শন করানোর ব্যবস্থা।
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Googlebot Indexing Enabled</span>
          </div>
        </div>

        {/* 4 Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Robots.txt</span>
            </div>
            <p className="text-[10px] text-slate-500">Googlebot ও সার্চ ক্রলারদের জন্য উন্মুক্ত</p>
            <a href="/robots.txt" target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5">
              View robots.txt ↗
            </a>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sitemap.xml</span>
            </div>
            <p className="text-[10px] text-slate-500">সমস্ত পেজ ও প্রোডাক্ট স্বয়ংক্রিয়ভাবে তালিকাভুক্ত</p>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5">
              View sitemap.xml ↗
            </a>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Meta Directives</span>
            </div>
            <p className="text-[10px] text-slate-500">index, follow, max-image-preview</p>
            <span className="text-[10px] text-emerald-700 font-bold">100% Active</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Schema.org</span>
            </div>
            <p className="text-[10px] text-slate-500">WebSite, Store & Sitelinks Search</p>
            <span className="text-[10px] text-emerald-700 font-bold">Rich Snippet Ready</span>
          </div>
        </div>

        {/* Verification Token Field */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-700">
            Google Search Console Verification Token / HTML Tag (গুগল ভেরিফিকেশন কোড)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={settings.googleSearchConsoleVerification || ""}
              onChange={(e) => {
                let val = e.target.value.trim();
                // If user pasted whole meta tag: <meta name="google-site-verification" content="XYZ" />
                const match = val.match(/content=["']([^"']+)["']/i);
                if (match) val = match[1];
                handleChange("googleSearchConsoleVerification", val);
              }}
              placeholder='উদা: yZ8... অথবা পুরো <meta name="google-site-verification" content="..." /> ট্যাগ পেস্ট করুন'
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white focus:border-blue-600 focus:outline-none font-mono"
            />
          </div>
          <p className="text-[11px] text-gray-500">
            Google Search Console-এ সাইট ভেরিফাই করার জন্য প্রাপ্ত HTML Tag বা Verification Token এখানে দিয়ে <strong>Save Changes</strong> করুন।
          </p>
        </div>

        {/* Action Buttons & 3-Step Guide */}
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-blue-600" />
              <span>গুগলে ওয়েবসাইট ইনডেক্স করার সহজ ৩টি ধাপ:</span>
            </h4>
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
            >
              <span>Open Google Search Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <ol className="list-decimal list-inside text-xs text-blue-950 space-y-1.5 leading-relaxed pl-1">
            <li>
              <strong>Google Search Console</strong> লিংকে গিয়ে লগইন করুন এবং আপনার সাইটের URL (যেমন: <code className="bg-white px-1 py-0.5 rounded text-[11px] border border-blue-200">https://worldbuybd.web.app</code> বা আপনার নিজস্ব ডোমেইন) দিন।
            </li>
            <li>
              ভেরিফিকেশন অপশন থেকে <strong>"HTML Tag"</strong> সিলেক্ট করে কোডটি কপি করে উপরের বক্সে বসান এবং উপরে থাকা <strong>"Save Changes"</strong> বাটনে ক্লিক করে সেভ করুন। এরপর গুগলের ভেরিফাই বাটনে চাপ দিন।
            </li>
            <li>
              ভেরিফিকেশন সফল হলে Search Console-এর বামপাশের মেনু থেকে <strong>"Sitemaps"</strong> অপশনে যান, বক্সে শুধু <code className="bg-white px-1 py-0.5 rounded text-[11px] border border-blue-200">sitemap.xml</code> লিখে <strong>Submit</strong> চাপুন। গুগল স্বয়ংক্রিয়ভাবে সমস্ত পেজ ও প্রোডাক্ট ইনডেক্স করে নেবে।
            </li>
          </ol>
        </div>
      </div>

      {/* 9. GITHUB & FIREBASE HOSTING DOMAIN PUBLISHING */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              <span>GitHub & Firebase Domain Publishing (worldbuybd.web.app)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              GitHub রিপোজিটরি ও Firebase Hosting ব্যবহার করে নিজস্ব ডোমেইনে ওয়েবসাইট লাইভ পাবলিশ করার পূর্ণাঙ্গ গাইড।
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>CI/CD Workflow Ready</span>
          </div>
        </div>

        {/* Live Domains Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Primary Live Domain</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Active</span>
            </div>
            <a
              href="https://worldbuybd.web.app"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono font-bold text-blue-600 hover:underline flex items-center gap-1 break-all"
            >
              https://worldbuybd.web.app
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
            <p className="text-[10px] text-gray-500">Firebase Hosting Free Subdomain</p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Backup Firebase Domain</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">Mirror</span>
            </div>
            <a
              href="https://worldbuybd.firebaseapp.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono font-bold text-blue-600 hover:underline flex items-center gap-1 break-all"
            >
              https://worldbuybd.firebaseapp.com
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
            <p className="text-[10px] text-gray-500">Automatic SSL Secured</p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Custom Domain</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">Optional</span>
            </div>
            <span className="text-xs font-mono font-bold text-charcoal block">
              worldbuybd.com (বা নিজস্ব ডোমেন)
            </span>
            <p className="text-[10px] text-gray-500">Firebase Console থেকে কাস্টম ডোমেন কানেক্ট করা যায়</p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4">
          {/* Step 1: Push to GitHub */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-black">১</span>
                <span>GitHub-এ প্রজেক্ট আপলোড (Git Push) করার কমান্ড:</span>
              </h3>
              <button
                type="button"
                onClick={() => copyToClipboard(`git init\ngit branch -M main\ngit add .\ngit commit -m "feat: WorldBuyBD website deploy"\ngit remote add origin https://github.com/YOUR_USERNAME/worldbuybd.git\ngit push -u origin main`, "git")}
                className="text-xs font-bold text-slate-700 hover:text-black flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-100 transition cursor-pointer"
              >
                {copiedCmd === "git" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd === "git" ? "Copied!" : "Copy Commands"}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
{`git init
git branch -M main
git add .
git commit -m "feat: WorldBuyBD website deploy"
git remote add origin https://github.com/YOUR_USERNAME/worldbuybd.git
git push -u origin main`}
            </pre>
            <p className="text-[11px] text-slate-600">
              * আপনার GitHub অ্যাকাউন্টে একটি রিপোজিটরি খুলে উপরের <code>YOUR_USERNAME</code>-এর জায়গায় আপনার গিটহাব ইউজারনেম বসিয়ে টার্মিনালে রান করুন।
            </p>
          </div>

          {/* Step 2: GitHub Actions CI/CD */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
            <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">২</span>
              <span>GitHub Actions দিয়ে অটোমেটিক ডিপ্লয় (CI/CD):</span>
            </h3>
            <p className="text-xs text-indigo-900 leading-relaxed">
              প্রজেক্টের <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-[11px]">.github/workflows/firebase-hosting-deploy.yml</code> ফাইলটি ইতিমধ্যে তৈরি করা আছে। আপনি GitHub রিপোজিটরির <strong>Settings &gt; Secrets and variables &gt; Actions</strong>-এ গিয়ে <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-[11px]">FIREBASE_TOKEN</code> যোগ করে দিলে প্রতিবার কোড পুশ করলেই স্বয়ংক্রিয়ভাবে সাইট লাইভ হয়ে যাবে।
            </p>
          </div>

          {/* Step 3: Fast Manual Deploy */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-black">৩</span>
                <span>টার্মিনাল থেকে সরাসরি ডিপ্লয় করার কমান্ড:</span>
              </h3>
              <button
                type="button"
                onClick={() => copyToClipboard(`npm run build && npx firebase-tools deploy --only hosting`, "deploy")}
                className="text-xs font-bold text-slate-700 hover:text-black flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-100 transition cursor-pointer"
              >
                {copiedCmd === "deploy" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd === "deploy" ? "Copied!" : "Copy Command"}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
npm run build && npx firebase-tools deploy --only hosting
            </pre>
            <p className="text-[11px] text-slate-600">
              আপনার কম্পিউটার থেকে এই ১টি কমান্ড দিলেই সম্পূর্ণ ওয়েবসাইট বিল্ড হয়ে <strong>worldbuybd.web.app</strong>-এ লাইভ হয়ে যাবে!
            </p>
          </div>

          {/* Step 4: Custom Domain */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-black">৪</span>
              <span>নিজস্ব ডোমেন (যেমন: worldbuybd.com) যুক্ত করার নিয়ম:</span>
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed">
              Firebase Console &gt; Hosting &gt; <strong>"Add custom domain"</strong>-এ ক্লিক করে আপনার ডোমেন দিন। এরপর আপনার ডোমেন প্রোভাইডার (Namecheap, GoDaddy ইত্যাদি)-তে ফায়ারবেসের দেওয়া DNS <strong>A Record</strong> যুক্ত করলেই নিজস্ব ডোমেনে ওয়েবসাইট লাইভ হবে এবং ফ্রি SSL একটিভ হয়ে যাবে।
            </p>
            <div className="pt-1">
              <a
                href="https://console.firebase.google.com/project/awesome-almanac-1vxch/hosting"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition"
              >
                <span>Firebase Hosting Console খুলুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 10. OFFICIAL MOBILE APP & APK CONFIGURATION */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <span>Mobile App & APK Management</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure 1-click PWA mobile app installation and direct APK download links for customers.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>PWA Engine Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Direct Android APK Download URL (Optional)
            </label>
            <input
              type="url"
              value={settings.apkDownloadUrl || ""}
              onChange={(e) => handleChange("apkDownloadUrl", e.target.value)}
              placeholder="https://drive.google.com/... or https://yourdomain.com/app.apk"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            />
            <span className="text-[10px] text-gray-400 mt-1 block">
              If provided, customers can download the Android APK file directly from the "Install App" prompt.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Google Play Store App URL
            </label>
            <input
              type="url"
              value={settings.playStoreUrl || ""}
              onChange={(e) => handleChange("playStoreUrl", e.target.value)}
              placeholder="https://play.google.com/store/apps/details?id=com.worldbuybd..."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            />
            <span className="text-[10px] text-gray-400 mt-1 block">
              Enter your Google Play Store listing URL when available.
            </span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Generate Android APK for Play Store</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              This website is built to modern PWA standards. You can easily package and generate signed APK files using PWABuilder.
            </p>
          </div>
          <a
            href="https://www.pwabuilder.com"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap transition shadow-xs"
          >
            Open PWABuilder ↗
          </a>
        </div>
      </div>
    </form>
  );
}
