import React, { useState } from "react";
import {
  Sliders,
  Save,
  Check,
  RotateCcw,
  Eye,
  Monitor,
  Smartphone,
  Columns,
  Maximize2,
  RefreshCw,
} from "lucide-react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import CustomizerControlsPanel from "../../components/admin/CustomizerControlsPanel";

export default function AdminWebsiteCustomizer() {
  const {
    hasUnsavedChanges,
    saveSettings,
    discardDraft,
  } = useSiteSettings();

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSplitPreview, setShowSplitPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewPath, setPreviewPath] = useState<string>("/");
  const [iframeKey, setIframeKey] = useState(0);

  const handleSaveAll = async () => {
    setSaving(true);
    setSavedSuccess(false);
    const ok = await saveSettings();
    setSaving(false);
    if (ok) {
      setSavedSuccess(true);
      setIframeKey((prev) => prev + 1);
      setTimeout(() => setSavedSuccess(false), 3500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Admin Studio Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Admin Website Customizer & CMS Studio
            </h1>
            <p className="text-xs text-slate-500">
              Control 100% of your website from inside the Admin Panel — colors, header, hero slides, sections, calculator rates, FAQs, footer & policy pages
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowSplitPreview(!showSplitPreview)}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition border ${
              showSplitPreview
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
            }`}
          >
            {showSplitPreview ? <Maximize2 className="w-4 h-4 text-amber-400" /> : <Columns className="w-4 h-4 text-primary" />}
            <span>{showSplitPreview ? "Full Editor View" : "Split Screen Live Preview"}</span>
          </button>

          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={discardDraft}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Discard</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition disabled:opacity-60"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved & Published!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{saving ? "Publishing..." : "Save & Publish All Changes"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All website customizations and RMB product pricing rules have been saved and published to the storefront!</span>
        </div>
      )}

      {/* Workspace: Either Full-Width Admin Editor OR Split-Screen Admin Editor + Live Preview */}
      {showSplitPreview ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left: Compact Customizer Controls inside Admin */}
          <div className="xl:col-span-5">
            <CustomizerControlsPanel compact={true} />
          </div>

          {/* Right: Live Storefront Preview inside Admin Panel */}
          <div className="xl:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl sticky top-4">
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-white">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">Admin Live Storefront Preview</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={previewPath}
                  onChange={(e) => setPreviewPath(e.target.value)}
                  className="bg-slate-800 text-white text-xs px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none"
                >
                  <option value="/">Home Page</option>
                  <option value="/shop">Shop Catalog</option>
                  <option value="/about">About Us</option>
                  <option value="/contact">Contact Us</option>
                  <option value="/privacy-policy">Privacy Policy</option>
                  <option value="/return-refund">Return & Refund</option>
                  <option value="/cancellation-policy">Cancellation Policy</option>
                </select>

                <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`p-1.5 rounded-md cursor-pointer ${
                      previewDevice === "desktop" ? "bg-primary text-white" : "text-slate-400 hover:text-white"
                    }`}
                    title="Desktop View"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`p-1.5 rounded-md cursor-pointer ${
                      previewDevice === "mobile" ? "bg-primary text-white" : "text-slate-400 hover:text-white"
                    }`}
                    title="Mobile View"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Refresh Preview"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 flex justify-center">
              <div
                className={`bg-white rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
                  previewDevice === "mobile" ? "w-[375px] h-[680px]" : "w-full h-[680px]"
                }`}
              >
                <iframe
                  key={`${iframeKey}-${previewPath}`}
                  src={previewPath}
                  title="Storefront Live Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CustomizerControlsPanel compact={false} />
      )}
    </div>
  );
}
