import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import CentralOperationsHub from "../../components/admin/CentralOperationsHub";
import { Video, Upload, Loader2, CheckCircle2, AlertCircle, ExternalLink, Briefcase } from "lucide-react";
import { uploadVideoFileChunked } from "../../utils/videoUploader";

export default function AdminDashboard() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleInstantDashboardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(1);
    setStatusMsg(null);
    setErrorMsg(null);

    const cleanTitle =
      file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim() ||
      "Product Showcase Video";

    try {
      await uploadVideoFileChunked({
        file,
        autoPublish: true,
        title: cleanTitle,
        subtitle: "Direct factory and warehouse product quality review",
        category: "Bag",
        productLink: "/shop",
        priceText: "Order at Wholesale Price",
        onProgress: (pct) => setProgress(pct),
      });
      setStatusMsg(`Video "${cleanTitle}" uploaded and published to the homepage successfully!`);
    } catch (err: any) {
      setErrorMsg("Video upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-5">
      {/* Staff Desks Navigation (Exclusive to Admin Dashboard) */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 border border-slate-800 shadow-md flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">STAFF DESKS NAVIGATION:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            to="/admin/role-dashboards"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            🏢 All Desks
          </Link>
          <Link
            to="/admin/role-dashboards/cs-1"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            🎧 CS (Customer Support)
          </Link>
          <Link
            to="/admin/role-dashboards/pur-1"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            🛒 Purchase (Procurement)
          </Link>
          <Link
            to="/admin/role-dashboards/del-1"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            🚚 Delivery (Logistics)
          </Link>
          <Link
            to="/admin/role-dashboards/kam-1"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            🎯 Marketing (KAM)
          </Link>
          <Link
            to="/admin/role-dashboards/acc-1"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            💰 Accounts (Finance)
          </Link>
        </div>
      </div>

      {/* Compact Executive Quick Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            Executive Operations & Order Pipeline
          </h1>
          <p className="text-xs text-slate-500">
            Manage customer orders, upload post-order invoice charges (China Courier Bill, Weight, Shipping), and oversee departmental workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/admin/orders"
            className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>Update Order Invoices (Courier / Weight / Shipping)</span>
          </Link>

          <Link
            to="/admin/role-dashboards/kam-1"
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            title="Marketing Sales Targets & Customer Brackets (Main Admin Exclusive)"
          >
            <span>🎯 Sales Targets & Customer Brackets</span>
          </Link>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
            onChange={handleInstantDashboardUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading ({progress}%)...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>+ Upload Homepage Video</span>
              </>
            )}
          </button>

          <Link
            to="/admin/role-dashboards"
            className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
          >
            Staff Desks →
          </Link>
        </div>
      </div>

      {uploading && (
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
          <Link
            to="/"
            target="_blank"
            className="underline text-emerald-800 flex items-center gap-1 shrink-0"
          >
            <span>View on Homepage</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Centralized Role-Based Operations & Master Admin Dashboard */}
      <CentralOperationsHub initialTab="Admin" />
    </div>
  );
}
