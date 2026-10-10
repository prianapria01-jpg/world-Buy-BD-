import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Image as ImageIcon, Upload, Trash2, Eye, Check, AlertCircle, Save } from "lucide-react";
import DiscountPopup, { defaultPopupSettings, type PopupSettings } from "../common/DiscountPopup";

export default function DiscountPopupManager() {
  const [settings, setSettings] = useState<PopupSettings>(defaultPopupSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data && data.discountPopup) {
        setSettings((prev) => ({ ...prev, ...data.discountPopup }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const res = await fetch("/api/admin/banners/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setSettings((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        alert(data.error || "Image upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleResetImage = () => {
    setSettings((prev) => ({ ...prev, imageUrl: "/assets/popup-banner.jpg" }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const currentRes = await fetch("/api/settings");
      const currentData = await currentRes.json();

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentData,
          discountPopup: settings,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Failed to save popup settings");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-xs text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-charcoal">
              Storefront Discount Popup Settings
            </h2>
            <p className="text-xs text-gray-500">
              Manage the special discount and coupon popup displayed when customers open the store.
            </p>
          </div>
        </div>

        {/* Master ON / OFF Switch */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-700">
            {settings.enabled ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active (ON)
              </span>
            ) : (
              <span className="text-gray-400">Inactive (OFF)</span>
            )}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.enabled ? "bg-emerald-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Texts and Codes */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Popup Title
            </label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              placeholder="e.g. Special Wholesale Offer"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-medium bg-white focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Subtitle / Offer Headline
            </label>
            <input
              type="text"
              value={settings.subtitle}
              onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
              placeholder="e.g. Use coupon at checkout to get an extra discount"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-medium bg-white focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Coupon Code
              </label>
              <input
                type="text"
                value={settings.couponCode}
                onChange={(e) =>
                  setSettings({ ...settings, couponCode: e.target.value.toUpperCase() })
                }
                placeholder="WORLDBUY5"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono font-bold text-primary bg-white focus:border-primary focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Discount Percentage (%)
              </label>
              <input
                type="number"
                value={settings.discountPercent}
                onChange={(e) =>
                  setSettings({ ...settings, discountPercent: Number(e.target.value) })
                }
                placeholder="5"
                min="1"
                max="100"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-bold bg-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Conditions / Minimum Order Note
            </label>
            <input
              type="text"
              value={settings.minOrderNotice}
              onChange={(e) => setSettings({ ...settings, minOrderNotice: e.target.value })}
              placeholder="Applicable on orders above BDT 2,000"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Button Action Text
            </label>
            <input
              type="text"
              value={settings.ctaText}
              onChange={(e) => setSettings({ ...settings, ctaText: e.target.value })}
              placeholder="Claim Offer"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Image / Banner Upload and Preview */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-gray-700">
            Popup Banner Image
          </label>

          <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center bg-gray-50 flex flex-col items-center justify-center min-h-[190px]">
            {settings.imageUrl ? (
              <div className="relative w-full max-h-44 rounded-xl overflow-hidden shadow-xs border border-gray-200">
                <img
                  src={settings.imageUrl}
                  alt="Discount Popup Banner Preview"
                  className="w-full h-44 object-cover"
                />
                <button
                  type="button"
                  onClick={handleResetImage}
                  title="Reset to default banner"
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-md transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2 py-6">
                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-xs text-gray-500">No image uploaded</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploading ? "Uploading..." : "Upload New Banner Image"}
              </button>

              <button
                type="button"
                onClick={handleResetImage}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
              >
                Default Banner
              </button>
            </div>
            <span className="text-[10px] text-gray-400 mt-2 block">
              Recommended size: 800x600 or 1:1 ratio
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition"
        >
          <Eye className="w-4 h-4 text-slate-500" />
          Popup Live Preview
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {saveSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <Check className="w-4 h-4 stroke-[3]" /> Successfully saved!
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Popup Settings"}
          </button>
        </div>
      </div>

      {/* Live Preview Modal Overlay */}
      {previewOpen && (
        <DiscountPopup
          forceOpen={true}
          onClosePreview={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
