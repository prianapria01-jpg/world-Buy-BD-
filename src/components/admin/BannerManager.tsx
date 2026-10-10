import React, { useState, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Image as ImageIcon,
  Upload,
  Eye,
  Type,
  ExternalLink,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useSiteSettings, HeroSlideItem } from "../../context/SiteSettingsContext";

export default function BannerManager() {
  const { settings, saveSettings, uploadImage } = useSiteSettings();
  const [editingSlide, setEditingSlide] = useState<HeroSlideItem | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickUploadRef = useRef<HTMLInputElement>(null);

  const slides = Array.isArray(settings.heroSlides) ? settings.heroSlides : [];

  const persistSlides = async (newSlides: HeroSlideItem[]) => {
    setSavingBanner(true);
    await saveSettings({ heroSlides: newSlides });
    setSavingBanner(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // 1-Click Direct Promotional Image Upload
  const handleQuickPromoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadedUrl = await uploadImage(file);
      const newPromoSlide: HeroSlideItem = {
        id: `promo-${Date.now()}`,
        image: uploadedUrl,
        imageOnly: true, // Default to clean full promotional image without text covering it
        badge: "",
        title: "",
        subtitle: "",
        ctaText: "Shop Now",
        ctaLink: "/shop",
      };
      await persistSlides([newPromoSlide, ...slides]);
    } catch (err) {
      console.error("Failed to upload promotional banner:", err);
    } finally {
      setUploading(false);
      if (quickUploadRef.current) quickUploadRef.current.value = "";
    }
  };

  const handleAddNew = () => {
    setEditingIndex(null);
    setEditingSlide({
      id: `promo-${Date.now()}`,
      image: "",
      imageOnly: true,
      badge: "",
      title: "",
      subtitle: "",
      ctaText: "Shop Now",
      ctaLink: "/shop",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (slide: HeroSlideItem, idx: number) => {
    setEditingIndex(idx);
    setEditingSlide({ ...slide });
    setIsModalOpen(true);
  };

  const handleDelete = async (idx: number) => {
    const next = slides.filter((_, i) => i !== idx);
    await persistSlides(next);
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    const temp = next[idx];
    next[idx] = next[target];
    next[target] = temp;
    await persistSlides(next);
  };

  const handleToggleImageOnly = async (idx: number) => {
    const next = [...slides];
    next[idx] = { ...next[idx], imageOnly: !next[idx].imageOnly };
    await persistSlides(next);
  };

  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSlide) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setEditingSlide({ ...editingSlide, image: url });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide || !editingSlide.image.trim()) return;

    const next = [...slides];
    if (editingIndex !== null && editingIndex >= 0 && editingIndex < next.length) {
      next[editingIndex] = editingSlide;
    } else {
      next.unshift(editingSlide);
    }
    setIsModalOpen(false);
    await persistSlides(next);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Homepage Promotional Hero Banners ({slides.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload promotional offer graphics (Full Image Mode) or banners with custom text overlays
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Instant 1-Click Promotional Image Upload */}
          <input
            type="file"
            accept="image/*"
            ref={quickUploadRef}
            onChange={handleQuickPromoUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading || savingBanner}
            onClick={() => quickUploadRef.current?.click()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition disabled:opacity-60"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? "Uploading Image..." : "Quick Upload Promo Image"}</span>
          </button>

          <button
            type="button"
            onClick={handleAddNew}
            className="bg-primary hover:bg-primary-dark text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Banner</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Promotional hero banners updated live on homepage!</span>
        </div>
      )}

      {slides.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-500 text-xs">
          No promotional banners added yet. Click "Quick Upload Promo Image" to add your first promotional banner.
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => {
            const isFullGraphic = Boolean(slide.imageOnly || !slide.title?.trim());
            return (
              <div
                key={slide.id || idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 border border-gray-200 rounded-xl bg-slate-50/50 hover:bg-white transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-36 h-20 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 shrink-0 relative">
                    {slide.image ? (
                      <img src={slide.image} alt="Promotional Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                        No Image
                      </div>
                    )}
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isFullGraphic
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isFullGraphic ? "🖼️ Full Promotional Image (No Text Overlay)" : "📝 Image + Text Overlay"}
                      </span>
                      {slide.ctaLink && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5 truncate">
                          <ExternalLink className="w-3 h-3" /> {slide.ctaLink}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 truncate">
                      {isFullGraphic
                        ? "Clean Promotional Graphic Banner (100% Full Image View)"
                        : slide.title || "Untitled Slide"}
                    </h4>
                    {!isFullGraphic && slide.subtitle && (
                      <p className="text-[11px] text-slate-500 truncate">{slide.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleImageOnly(idx)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                      isFullGraphic
                        ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                    }`}
                    title="Switch between Full Promotional Image vs Text Overlay"
                  >
                    {isFullGraphic ? (
                      <>
                        <Type className="w-3.5 h-3.5" />
                        <span>Add Text</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Image Only</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, -1)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === slides.length - 1}
                    onClick={() => handleMove(idx, 1)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEdit(slide, idx)}
                    className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                    title="Edit Banner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {slides.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Promotional Banner Modal */}
      {isModalOpen && editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="font-bold text-sm">
                {editingIndex !== null ? `Edit Promotional Banner #${editingIndex + 1}` : "Add New Promotional Banner"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Image Upload / URL */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Promotional Banner Image (Upload or Paste URL) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingSlide.image}
                    onChange={(e) => setEditingSlide({ ...editingSlide, image: e.target.value })}
                    placeholder="https://... or upload from device"
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleModalFileUpload}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? "Uploading..." : "Upload Photo"}</span>
                  </button>
                </div>

                {editingSlide.image && (
                  <div className="mt-3 h-40 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                    <img src={editingSlide.image} alt="Banner Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Banner Mode Selector */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-emerald-950">
                    Show as Clean Promotional Image Only (Recommended for Graphic Banners)
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    When enabled, no dark tint or text buttons will cover your promotional banner image.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(editingSlide.imageOnly)}
                  onChange={(e) => setEditingSlide({ ...editingSlide, imageOnly: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                />
              </div>

              {/* Target Link when clicking the banner */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Click Link (Where customers go when clicking the banner)
                </label>
                <input
                  type="text"
                  value={editingSlide.ctaLink}
                  onChange={(e) => setEditingSlide({ ...editingSlide, ctaLink: e.target.value })}
                  placeholder="/shop or /flash-sale or product link"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              {/* Optional Text Overlay Fields (Only if imageOnly is unchecked) */}
              {!editingSlide.imageOnly && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Top Badge Text</label>
                    <input
                      type="text"
                      value={editingSlide.badge}
                      onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                      placeholder="e.g. SPECIAL OFFER"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={editingSlide.ctaText}
                      onChange={(e) => setEditingSlide({ ...editingSlide, ctaText: e.target.value })}
                      placeholder="Shop Now"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Title</label>
                    <input
                      type="text"
                      value={editingSlide.title}
                      onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                      placeholder="Main Banner Headline"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle Description</label>
                    <textarea
                      rows={2}
                      value={editingSlide.subtitle}
                      onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModalSave}
                className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Save Promotional Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
