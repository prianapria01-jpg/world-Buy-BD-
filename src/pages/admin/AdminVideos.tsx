import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  Upload,
  Trash2,
  Edit3,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Play,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { EXPANDABLE_MAIN_CATEGORIES } from "../../utils/categories";
import { invalidateApiCache } from "../../utils/apiCache";
import { uploadVideoFileChunked } from "../../utils/videoUploader";

export interface ShowcaseVideoItem {
  id: string;
  title: string;
  subtitle?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category?: string;
  productLink?: string;
  priceText?: string;
  active: boolean;
  createdAt?: string;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?rel=0`;
  }
  return null;
}

export default function AdminVideos() {
  const [videos, setVideos] = useState<ShowcaseVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoPublishOnSelect, setAutoPublishOnSelect] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("Bag");
  const [productLink, setProductLink] = useState("/shop?category=Bag");
  const [priceText, setPriceText] = useState("");
  const [active, setActive] = useState(true);

  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const thumbInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setErrorMsg(null);
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  const showError = (msg: string) => {
    setToast(null);
    setErrorMsg(msg);
  };

  const loadVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/videos");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setVideos(data);
        }
      }
    } catch (e) {
      console.error("Failed to load videos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setVideoUrl("");
    setThumbnailUrl("");
    setCategory("Bag");
    setProductLink("/shop?category=Bag");
    setPriceText("");
    setActive(true);
  };

  const processVideoFile = async (file: File) => {
    if (!file) return;
    setUploadingVideo(true);
    setUploadProgress(1);
    setErrorMsg(null);

    const defaultTitle =
      title.trim() ||
      file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim() ||
      "Product Showcase Video";

    const shouldAutoPublish = autoPublishOnSelect && !editingId;

    try {
      const result = await uploadVideoFileChunked({
        file,
        autoPublish: shouldAutoPublish,
        title: defaultTitle,
        subtitle: subtitle.trim() || "Direct factory and warehouse product quality review",
        category: category.trim() || "Bag",
        productLink:
          productLink.trim() || `/shop?category=${encodeURIComponent(category.trim() || "Bag")}`,
        priceText: priceText.trim() || "Order at Wholesale Price",
        thumbnailUrl: thumbnailUrl.trim(),
        onProgress: (pct) => setUploadProgress(pct),
      });

      setVideoUrl(result.url);
      if (!title.trim()) {
        setTitle(defaultTitle);
      }

      if (result.autoPublished) {
        if (Array.isArray(result.videos)) {
          setVideos(result.videos);
        } else {
          await loadVideos();
        }
        showToast(
          `Video "${defaultTitle}" uploaded and published to the homepage successfully!`
        );
      } else {
        showToast(
          "Video file uploaded successfully! Click Save & Publish Video below to finalize."
        );
      }
    } catch (err: any) {
      showError("Video upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploadingVideo(false);
      setUploadProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processVideoFile(file);
  };

  const handleDropVideo = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processVideoFile(file);
    }
  };

  const handleThumbFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thumbnail upload failed");
      setThumbnailUrl(data.url);
      showToast("Cover / thumbnail image uploaded successfully!");
    } catch (err: any) {
      showError("Thumbnail upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploadingThumb(false);
      if (thumbInputRef.current) thumbInputRef.current.value = "";
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      showError("Please select and upload a video file or provide a video link first!");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        title: title.trim() || "Product Showcase Video",
        subtitle: subtitle.trim() || "Direct factory and warehouse product quality review",
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        category: category.trim() || "All",
        productLink:
          productLink.trim() || `/shop?category=${encodeURIComponent(category.trim() || "All")}`,
        priceText: priceText.trim() || "Order at Wholesale Price",
        active,
      };

      const endpoint = editingId ? `/api/admin/videos/${editingId}` : "/api/admin/videos";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save video");

      if (Array.isArray(data.videos)) {
        setVideos(data.videos);
      } else {
        await loadVideos();
      }
      invalidateApiCache("/api/videos");
      showToast(
        editingId
          ? "Video updated successfully!"
          : "New video added and published to the homepage successfully!"
      );
      resetForm();
    } catch (err: any) {
      showError("Failed to save video: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (v: ShowcaseVideoItem) => {
    setEditingId(v.id);
    setTitle(v.title || "");
    setSubtitle(v.subtitle || "");
    setVideoUrl(v.videoUrl || "");
    setThumbnailUrl(v.thumbnailUrl || "");
    setCategory(v.category || "Bag");
    setProductLink(v.productLink || "/shop");
    setPriceText(v.priceText || "");
    setActive(v.active !== false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleActive = async (v: ShowcaseVideoItem) => {
    try {
      const res = await fetch(`/api/admin/videos/${v.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !v.active }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.videos)) {
        setVideos(data.videos);
        invalidateApiCache("/api/videos");
        showToast(
          !v.active
            ? "Video enabled on homepage!"
            : "Video hidden from homepage!"
        );
      }
    } catch (e) {
      console.error("Failed to toggle video status:", e);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.videos)) {
        setVideos(data.videos);
        invalidateApiCache("/api/videos");
        if (editingId === id) resetForm();
        showToast("Video deleted successfully!");
      }
    } catch (e) {
      console.error("Failed to delete video:", e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-secondary to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/15 text-amber-300 text-xs font-bold">
            <Video className="w-3.5 h-3.5" />
            <span>Homepage Video Showcase Manager</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Homepage Video Upload & Management Panel
          </h1>
          <p className="text-xs text-slate-200 max-w-2xl">
            Upload video files of any size directly from your mobile or computer with 1-click, or add direct video links (MP4 / YouTube).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-black flex items-center gap-1.5 shadow-xs transition"
          >
            <span>View Videos on Homepage</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{toast}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 hover:text-rose-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload / Edit Form Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <span>
              {editingId ? "Edit Video Information" : "Upload or Add New Video"}
            </span>
          </h2>

          <div className="flex items-center gap-3">
            {!editingId && (
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPublishOnSelect}
                  onChange={(e) => setAutoPublishOnSelect(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <span>Auto-Save & Publish upon file selection (1-Click Auto Publish)</span>
              </label>
            )}

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Edit</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveVideo} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Video File Upload & Inputs */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Direct Video File Upload Box (Supports Drag & Drop + Chunked Upload) */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDropVideo}
              className={`p-5 rounded-2xl border-2 border-dashed transition space-y-4 ${
                isDragging
                  ? "bg-emerald-50 border-emerald-500"
                  : "bg-red-50/50 border-primary/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-primary" />
                    1. Upload Video File Directly from Mobile or Computer:
                  </span>
                  <p className="text-xs text-slate-600">
                    Select any MP4, WebM, or MOV video file or drag and drop it here.
                  </p>
                </div>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                  onChange={handleVideoFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                  className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-60 flex-shrink-0"
                >
                  {uploadingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading ({uploadProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Select Video File</span>
                    </>
                  )}
                </button>
              </div>

              {uploadingVideo && (
                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between text-xs font-bold text-primary">
                    <span>Uploading video file to server...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Or Direct Video URL Input */}
              <div className="pt-2 border-t border-primary/15">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Or Paste Direct Video Link (MP4 Link / Factory Video / YouTube Link):
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://.../video.mp4 or https://www.youtube.com/watch?v=..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 2. Title & Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Video Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Premium Leather Bag Factory Review"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subtitle / Short Description (Optional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g., 100% Authentic Direct Factory Collection"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* 3. Category, Price Badge & Target Link */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category or Sub-Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategory(val);
                    if (
                      !productLink ||
                      productLink === "/shop" ||
                      productLink.startsWith("/shop?category=")
                    ) {
                      setProductLink(`/shop?category=${encodeURIComponent(val)}`);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary"
                >
                  <option value="All">All Categories</option>
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
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Offer / Price Tag (Optional)
                </label>
                <input
                  type="text"
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
                  placeholder="e.g., Starting from BDT 450 / Wholesale Rate"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product or Shop Link (CTA URL)
                </label>
                <input
                  type="text"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  placeholder="/shop?category=Bag or /product/..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>

            {/* 4. Optional Thumbnail Upload */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Video Cover / Thumbnail Image (Optional):
                </label>
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="Paste thumbnail image URL or upload from the button on the right..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  disabled={uploadingThumb}
                  className="px-3.5 py-2 rounded-lg bg-white hover:bg-gray-100 text-slate-800 border border-gray-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {uploadingThumb ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span>Upload Cover Image</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span>Display this video on the homepage (Active)</span>
              </label>

              <button
                type="submit"
                disabled={saving || uploadingVideo}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>
                  {editingId ? "Save Changes" : "Save & Publish Video"}
                </span>
              </button>
            </div>
          </div>

          {/* Right 5 Cols: Live Video Preview */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                Live Video Preview
              </span>
              {category && (
                <span className="text-[11px] text-amber-300 font-semibold">
                  {category}
                </span>
              )}
            </div>

            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center relative">
              {videoUrl ? (
                getYouTubeEmbedUrl(videoUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(videoUrl)!}
                    title={title || "Video Preview"}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    poster={thumbnailUrl || undefined}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-400">
                  <Video className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-xs font-semibold">
                    No video selected yet
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Select a video file or paste a video link on the left
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {title || "Video title will appear here"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {subtitle || "Short description"}
                </p>
              </div>
              {priceText && (
                <span className="text-[11px] text-amber-300 flex-shrink-0">
                  {priceText}
                </span>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Uploaded Videos List */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              All Homepage Showcase Videos ({videos.length})
            </h3>
            <p className="text-xs text-slate-500">
              Edit, hide, or delete any video from this list
            </p>
          </div>
          <button
            type="button"
            onClick={loadVideos}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Loading videos...</span>
          </div>
        ) : videos.length === 0 ? (
          <div className="py-12 text-center space-y-2 text-slate-400">
            <Video className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">No videos found</p>
            <p className="text-xs">Upload a new video using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {videos.map((item) => {
              const ytEmbed = getYouTubeEmbedUrl(item.videoUrl);
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition ${
                    item.active !== false
                      ? "bg-white border-gray-200 shadow-2xs"
                      : "bg-gray-50 border-gray-200 opacity-70"
                  }`}
                >
                  <div>
                    <div className="w-full aspect-video bg-slate-950 relative overflow-hidden">
                      {ytEmbed ? (
                        <iframe
                          src={ytEmbed}
                          title={item.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={item.videoUrl}
                          poster={item.thumbnailUrl || undefined}
                          controls
                          preload="metadata"
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="font-bold text-primary truncate">
                          {item.category || "All"}
                        </span>
                        {item.priceText && (
                          <span className="font-semibold text-emerald-700 truncate">
                            {item.priceText}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-3.5 py-2.5 bg-slate-50 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                        item.active !== false
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {item.active !== false ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 rounded-lg bg-white hover:bg-indigo-50 text-indigo-600 border border-gray-200 transition cursor-pointer"
                        title="Edit Video"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(item.id)}
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-gray-200 transition cursor-pointer"
                        title="Delete Video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
