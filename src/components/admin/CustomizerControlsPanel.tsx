import React, { useState } from "react";
import {
  Palette,
  Layout,
  Sparkles,
  Sliders,
  ShieldCheck,
  Flame,
  Calculator,
  HelpCircle,
  MessageSquare,
  Mail,
  Bell,
  CreditCard,
  Globe,
  FileText,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Image as ImageIcon,
  Video,
  Loader2,
} from "lucide-react";
import {
  useSiteSettings,
  CustomizerSectionId,
  THEME_PRESETS,
} from "../../context/SiteSettingsContext";
import { uploadVideoFileChunked } from "../../utils/videoUploader";
import { ShowcaseVideoItem } from "../../pages/admin/AdminVideos";

export const CUSTOMIZER_TABS: {
  id: CustomizerSectionId;
  label: string;
  icon: React.FC<{ className?: string }>;
  desc: string;
}[] = [
  { id: "videos", label: "Product Videos", icon: Video, desc: "Upload and manage homepage showcase videos" },
  { id: "theme", label: "Theme & Colors", icon: Palette, desc: "Brand colors, presets, background & maintenance mode" },
  { id: "header", label: "Header & Navbar", icon: Layout, desc: "Logo, announcement bar, search & menu links" },
  { id: "hero", label: "Hero Carousel", icon: Sparkles, desc: "Main banner slides, headlines, images & link search" },
  { id: "quickhub", label: "Quick Service Cards", icon: Sliders, desc: "4 right-side action cards next to hero banner" },
  { id: "sections", label: "Section Visibility", icon: Eye, desc: "Show or hide any section on the homepage" },
  { id: "trust", label: "Trust Badges", icon: ShieldCheck, desc: "4 core value proposition badges & catalog headings" },
  { id: "flashsale", label: "Flash Sale Banner", icon: Flame, desc: "Flash sale title, subtitle & tag" },
  { id: "calculator", label: "Shipping Calculator", icon: Calculator, desc: "Air & Sea per-KG rates, delivery days & labels" },
  { id: "howitworks", label: "How It Works", icon: Layout, desc: "4-step China-to-Bangladesh buying guide" },
  { id: "testimonials", label: "Customer Reviews", icon: MessageSquare, desc: "Verified customer testimonials & ratings" },
  { id: "faq", label: "FAQ Accordion", icon: HelpCircle, desc: "Frequently asked questions and answers" },
  { id: "newsletter", label: "Newsletter Box", icon: Mail, desc: "Subscription call-to-action banner" },
  { id: "popup", label: "Welcome Popup", icon: Bell, desc: "Promotional discount modal & coupon code" },
  { id: "payments", label: "Payment & Currency", icon: CreditCard, desc: "RMB rate, bKash, Nagad, Bank & order minimums" },
  { id: "footer", label: "Footer & Socials", icon: Globe, desc: "Addresses, hotline, WhatsApp, social links & copyright" },
  { id: "pages", label: "Policy & Info Pages", icon: FileText, desc: "Edit About Us, Contact, Privacy, Return & Cancellation" },
  { id: "backup", label: "Backup & Reset", icon: Download, desc: "Export/Import JSON config or restore defaults" },
];

interface CustomizerControlsPanelProps {
  compact?: boolean;
}

export default function CustomizerControlsPanel({ compact = false }: CustomizerControlsPanelProps) {
  const {
    settings,
    activeEditSection,
    setActiveEditSection,
    updateDraft,
    uploadImage,
    resetToDefaults,
    saveSettings,
  } = useSiteSettings();

  const isMarketing = React.useMemo(() => {
    try {
      const uStr = localStorage.getItem("admin_user");
      if (uStr) {
        const u = JSON.parse(uStr);
        const r = String(u.role || "").toLowerCase();
        if (r.includes("marketing") || r === "sales person") return true;
      }
      const dept = localStorage.getItem("admin_department_role");
      if (dept === "marketing") return true;
    } catch {}
    return false;
  }, []);

  const visibleTabs = React.useMemo(() => {
    if (!isMarketing) return CUSTOMIZER_TABS;
    return CUSTOMIZER_TABS.filter(tab => tab.id !== "payments");
  }, [isMarketing]);

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [activePolicyTab, setActivePolicyTab] = useState<"about" | "contact" | "privacy" | "return" | "cancel">("about");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Video upload & management state inside Customizer
  const [customizerVideos, setCustomizerVideos] = useState<ShowcaseVideoItem[]>([]);
  const [vidTitle, setVidTitle] = useState("");
  const [vidUrl, setVidUrl] = useState("");
  const [vidCat, setVidCat] = useState("Bag");
  const [vidUploading, setVidUploading] = useState(false);
  const [vidProgress, setVidProgress] = useState(0);
  const [vidStatusMsg, setVidStatusMsg] = useState<string | null>(null);

  const loadCustomizerVideos = async () => {
    try {
      const r = await fetch("/api/videos");
      if (r.ok) {
        const d = await r.json();
        if (Array.isArray(d)) setCustomizerVideos(d);
      }
    } catch {}
  };

  React.useEffect(() => {
    if (activeEditSection === "videos") {
      loadCustomizerVideos();
    }
  }, [activeEditSection]);

  const handleCustomizerVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVidUploading(true);
    setVidProgress(1);
    setVidStatusMsg(null);
    const defaultTitle =
      vidTitle.trim() ||
      file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim() ||
      "Product Showcase Video";
    try {
      const res = await uploadVideoFileChunked({
        file,
        autoPublish: true,
        title: defaultTitle,
        category: vidCat,
        productLink: `/shop?category=${encodeURIComponent(vidCat)}`,
        onProgress: (pct) => setVidProgress(pct),
      });
      if (Array.isArray(res.videos)) {
        setCustomizerVideos(res.videos);
      } else {
        await loadCustomizerVideos();
      }
      setVidTitle("");
      setVidUrl("");
      setVidStatusMsg(`Video "${defaultTitle}" uploaded and published successfully!`);
      window.dispatchEvent(new Event("videos-updated"));
    } catch (err: any) {
      setVidStatusMsg("Upload failed: " + (err.message || "Error"));
    } finally {
      setVidUploading(false);
      setVidProgress(0);
    }
  };

  const handleCustomizerAddVideoUrl = async () => {
    if (!vidUrl.trim()) return;
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: vidTitle.trim() || "Product Showcase Video",
          videoUrl: vidUrl.trim(),
          category: vidCat,
          productLink: `/shop?category=${encodeURIComponent(vidCat)}`,
          active: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data.videos)) setCustomizerVideos(data.videos);
        else await loadCustomizerVideos();
        setVidTitle("");
        setVidUrl("");
        setVidStatusMsg("Video link added to homepage successfully!");
        window.dispatchEvent(new Event("videos-updated"));
      }
    } catch {}
  };

  const handleCustomizerDeleteVideo = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && Array.isArray(data.videos)) {
        setCustomizerVideos(data.videos);
        window.dispatchEvent(new Event("videos-updated"));
      }
    } catch {}
  };

  const handleFileUpload = async (file: File, onUrlReady: (url: string) => void, fieldKey: string) => {
    try {
      setUploadingField(fieldKey);
      const url = await uploadImage(file);
      onUrlReady(url);
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingField(null);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worldbuybd-site-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || "{}"));
        updateDraft(parsed);
        await saveSettings(parsed);
        setImportStatus("Configuration imported and applied!");
        setTimeout(() => setImportStatus(null), 3500);
      } catch {
        setImportStatus("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-primary transition";
  const labelCls = "block text-[11px] font-bold text-slate-700 mb-1";

  return (
    <div className={`flex ${compact ? "flex-col" : "flex-col lg:flex-row"} gap-4`}>
      {/* Section Selector Navigation */}
      <div className={`${compact ? "w-full overflow-x-auto flex gap-1.5 pb-2 border-b border-slate-200" : "w-full lg:w-60 shrink-0 space-y-1"}`}>
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeEditSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveEditSection(tab.id)}
              className={`flex items-center gap-2.5 text-left transition cursor-pointer ${
                compact
                  ? `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
                      active ? "bg-primary text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`
                  : `w-full px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80"
                    }`
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="truncate">
                <div>{tab.label}</div>
                {!compact && (
                  <div className={`text-[10px] font-normal truncate ${active ? "text-white/80" : "text-slate-400"}`}>
                    {tab.desc}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Section Editor Body */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-5 min-w-0">
        {/* 0. PRODUCT VIDEOS UPLOAD & MANAGER */}
        {activeEditSection === "videos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  <span>Homepage Video Upload & Management</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select a video file from your device to automatically upload and publish to the homepage
                </p>
              </div>
              <a
                href="/admin/videos"
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-primary transition"
              >
                Full Video Panel →
              </a>
            </div>

            {vidStatusMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                {vidStatusMsg}
              </div>
            )}

            <div className="p-4 rounded-xl bg-red-50/50 border-2 border-dashed border-primary/40 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className={labelCls}>Video Title (Optional)</label>
                  <input
                    type="text"
                    value={vidTitle}
                    onChange={(e) => setVidTitle(e.target.value)}
                    placeholder="e.g., Premium Bag Quality Review"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <input
                    type="text"
                    value={vidCat}
                    onChange={(e) => setVidCat(e.target.value)}
                    placeholder="Bag / Shoes / Watches"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <label className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black cursor-pointer inline-flex items-center gap-2 shadow-xs">
                  {vidUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading video ({vidProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>1-Click Upload Video File from Device</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                    className="hidden"
                    disabled={vidUploading}
                    onChange={handleCustomizerVideoFile}
                  />
                </label>
              </div>

              {vidUploading && (
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${vidProgress}%` }}
                  />
                </div>
              )}

              <div className="pt-2 border-t border-primary/15 flex items-center gap-2">
                <input
                  type="text"
                  value={vidUrl}
                  onChange={(e) => setVidUrl(e.target.value)}
                  placeholder="Or paste a direct video link (MP4 / YouTube)..."
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={handleCustomizerAddVideoUrl}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                >
                  Add Link
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">
                Current Videos ({customizerVideos.length}):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {customizerVideos.map((v) => (
                  <div
                    key={v.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 truncate">{v.title}</div>
                      <div className="text-[10px] text-primary font-semibold">{v.category || "All"}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCustomizerDeleteVideo(v.id)}
                      className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 shrink-0 cursor-pointer"
                      title="Delete Video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 1. THEME & COLORS */}
        {activeEditSection === "theme" && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">1-Click Color Theme Presets</h3>
              <p className="text-xs text-slate-500">Select a curated color palette or pick custom brand colors below</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      updateDraft({
                        primaryColor: preset.primaryColor,
                        primaryDarkColor: preset.primaryDarkColor,
                        secondaryColor: preset.secondaryColor,
                        accentColor: preset.accentColor,
                        pinkColor: preset.primaryColor,
                        bgColor: preset.bgColor,
                        announcementBgColor: preset.announcementBgColor,
                      })
                    }
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-primary bg-slate-50/60 hover:bg-white transition cursor-pointer text-left"
                  >
                    <span className="text-xs font-bold text-slate-800 truncate pr-2">{preset.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: preset.primaryColor }} />
                      <span className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: preset.secondaryColor }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              <div>
                <label className={labelCls}>Primary Brand Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => updateDraft({ primaryColor: e.target.value, pinkColor: e.target.value })}
                    className="w-9 h-9 rounded cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => updateDraft({ primaryColor: e.target.value, pinkColor: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Primary Hover/Dark</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primaryDarkColor}
                    onChange={(e) => updateDraft({ primaryDarkColor: e.target.value })}
                    className="w-9 h-9 rounded cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={settings.primaryDarkColor}
                    onChange={(e) => updateDraft({ primaryDarkColor: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Secondary / Deep Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => updateDraft({ secondaryColor: e.target.value })}
                    className="w-9 h-9 rounded cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => updateDraft({ secondaryColor: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Page Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.bgColor}
                    onChange={(e) => updateDraft({ bgColor: e.target.value })}
                    className="w-9 h-9 rounded cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={settings.bgColor}
                    onChange={(e) => updateDraft({ bgColor: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Typography Font Family</label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => updateDraft({ fontFamily: e.target.value })}
                  className={inputCls}
                >
                  <option value="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif">Plus Jakarta Sans (Modern E-Commerce)</option>
                  <option value="'Inter', system-ui, -apple-system, sans-serif">Inter (Crisp & Neutral)</option>
                  <option value="'Poppins', system-ui, -apple-system, sans-serif">Poppins (Geometric & Bold)</option>
                  <option value="system-ui, -apple-system, sans-serif">System Native UI (Fastest)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-amber-900">Storefront Maintenance Mode</div>
                  <div className="text-[11px] text-amber-700">Temporarily show a maintenance notice banner to visitors</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => updateDraft({ maintenanceMode: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
              </label>
              {settings.maintenanceMode && (
                <div>
                  <label className={labelCls}>Maintenance Banner Message</label>
                  <input
                    type="text"
                    value={settings.maintenanceMessage}
                    onChange={(e) => updateDraft({ maintenanceMessage: e.target.value })}
                    className={inputCls}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. HEADER & NAVBAR */}
        {activeEditSection === "header" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Website Brand Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => updateDraft({ siteName: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Brand Tagline</label>
                <input
                  type="text"
                  value={settings.siteTagline}
                  onChange={(e) => updateDraft({ siteTagline: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="flex-1 space-y-2 w-full">
                <label className={labelCls}>Logo Image URL or Upload</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={settings.logoUrl}
                    onChange={(e) => updateDraft({ logoUrl: e.target.value })}
                    placeholder="/assets/logo.png or https://..."
                    className={inputCls}
                  />
                  <label className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 hover:bg-primary-dark">
                    {uploadingField === "logo" ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, (url) => updateDraft({ logoUrl: url }), "logo");
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Top Announcement Bar */}
            <div className="p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Top Announcement Bar</span>
                <input
                  type="checkbox"
                  checked={settings.showAnnouncementBar}
                  onChange={(e) => updateDraft({ showAnnouncementBar: e.target.checked })}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Announcement Text</label>
                  <input
                    type="text"
                    value={settings.announcementText}
                    onChange={(e) => updateDraft({ announcementText: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Action Link Label</label>
                  <input
                    type="text"
                    value={settings.announcementLinkText}
                    onChange={(e) => updateDraft({ announcementLinkText: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Action Link URL</label>
                  <input
                    type="text"
                    value={settings.announcementLinkUrl}
                    onChange={(e) => updateDraft({ announcementLinkUrl: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Bar Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.announcementBgColor}
                      onChange={(e) => updateDraft({ announcementBgColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.announcementBgColor}
                      onChange={(e) => updateDraft({ announcementBgColor: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Bar Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.announcementTextColor}
                      onChange={(e) => updateDraft({ announcementTextColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.announcementTextColor}
                      onChange={(e) => updateDraft({ announcementTextColor: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Flash Sale Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Header Search Input Placeholder</label>
                <input
                  type="text"
                  value={settings.headerSearchPlaceholder}
                  onChange={(e) => updateDraft({ headerSearchPlaceholder: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Right Navbar Badge Text</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.showFlashSaleBadge}
                    onChange={(e) => updateDraft({ showFlashSaleBadge: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  <input
                    type="text"
                    value={settings.flashSaleBadgeText}
                    onChange={(e) => updateDraft({ flashSaleBadgeText: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Navigation Menu Items */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Navigation Menu Links</label>
                <button
                  type="button"
                  onClick={() =>
                    updateDraft({
                      navItems: [
                        ...settings.navItems,
                        { id: `nav-${Date.now()}`, label: "New Link", path: "/shop", enabled: true },
                      ],
                    })
                  }
                  className="text-xs font-bold text-primary flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Menu Item
                </button>
              </div>
              <div className="space-y-2">
                {settings.navItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => {
                        const next = [...settings.navItems];
                        next[idx] = { ...item, enabled: e.target.checked };
                        updateDraft({ navItems: next });
                      }}
                      className="w-4 h-4 accent-primary"
                    />
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => {
                        const next = [...settings.navItems];
                        next[idx] = { ...item, label: e.target.value };
                        updateDraft({ navItems: next });
                      }}
                      placeholder="Menu Label"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={item.path}
                      onChange={(e) => {
                        const next = [...settings.navItems];
                        next[idx] = { ...item, path: e.target.value };
                        updateDraft({ navItems: next });
                      }}
                      placeholder="/path or #section"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => updateDraft({ navItems: settings.navItems.filter((_, i) => i !== idx) })}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. HERO CAROUSEL & LINK SEARCH */}
        {activeEditSection === "hero" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Promotional Hero Banner Slides ({settings.heroSlides.length})</h3>
                <p className="text-xs text-slate-500">Upload full promotional banner images or customize slides with text overlays</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingField === "quick-promo" ? "Uploading..." : "Upload Promotional Image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        handleFileUpload(
                          f,
                          (url) => {
                            updateDraft({
                              heroSlides: [
                                {
                                  id: `promo-${Date.now()}`,
                                  image: url,
                                  imageOnly: true,
                                  badge: "",
                                  title: "",
                                  subtitle: "",
                                  ctaText: "Shop Now",
                                  ctaLink: "/shop",
                                },
                                ...settings.heroSlides,
                              ],
                            });
                          },
                          "quick-promo"
                        );
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    updateDraft({
                      heroSlides: [
                        ...settings.heroSlides,
                        {
                          id: `slide-${Date.now()}`,
                          imageOnly: true,
                          badge: "",
                          title: "",
                          subtitle: "",
                          ctaText: "Explore Now",
                          ctaLink: "/shop",
                          image: "https://images.unsplash.com/photo-1577563935244-124b172a6b4b?auto=format&fit=crop&w=1200&q=80",
                        },
                      ],
                    })
                  }
                  className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Slide
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {settings.heroSlides.map((slide, idx) => (
                <div key={slide.id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Banner Slide #{idx + 1}</span>
                      <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(slide.imageOnly)}
                          onChange={(e) => {
                            const next = [...settings.heroSlides];
                            next[idx] = { ...slide, imageOnly: e.target.checked };
                            updateDraft({ heroSlides: next });
                          }}
                          className="w-3.5 h-3.5 accent-emerald-600"
                        />
                        <span>Promotional Image Only (No Text Overlay)</span>
                      </label>
                    </div>
                    {settings.heroSlides.length > 1 && (
                      <button
                        type="button"
                        onClick={() => updateDraft({ heroSlides: settings.heroSlides.filter((_, i) => i !== idx) })}
                        className="text-xs text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Slide
                      </button>
                    )}
                  </div>

                  {/* Banner Image Preview + Upload */}
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {slide.image && (
                      <img
                        src={slide.image}
                        alt={`Slide ${idx + 1}`}
                        className="w-32 h-20 rounded-lg object-cover border border-slate-300 shrink-0 bg-white"
                      />
                    )}
                    <div className="flex-1 w-full space-y-2">
                      <label className={labelCls}>Promotional Banner Image URL or Upload</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={slide.image}
                          onChange={(e) => {
                            const next = [...settings.heroSlides];
                            next[idx] = { ...slide, image: e.target.value };
                            updateDraft({ heroSlides: next });
                          }}
                          placeholder="Paste image URL or click Upload..."
                          className={inputCls}
                        />
                        <label className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingField === `slide-${idx}` ? "Uploading..." : "Upload Photo"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                handleFileUpload(
                                  f,
                                  (url) => {
                                    const next = [...settings.heroSlides];
                                    next[idx] = { ...slide, image: url };
                                    updateDraft({ heroSlides: next });
                                  },
                                  `slide-${idx}`
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className={slide.imageOnly ? "sm:col-span-2" : ""}>
                      <label className={labelCls}>Click Destination Link (URL when customer clicks banner)</label>
                      <input
                        type="text"
                        value={slide.ctaLink}
                        onChange={(e) => {
                          const next = [...settings.heroSlides];
                          next[idx] = { ...slide, ctaLink: e.target.value };
                          updateDraft({ heroSlides: next });
                        }}
                        placeholder="/shop or /flash-sale"
                        className={inputCls}
                      />
                    </div>

                    {!slide.imageOnly && (
                      <>
                        <div>
                          <label className={labelCls}>Button Text</label>
                          <input
                            type="text"
                            value={slide.ctaText}
                            onChange={(e) => {
                              const next = [...settings.heroSlides];
                              next[idx] = { ...slide, ctaText: e.target.value };
                              updateDraft({ heroSlides: next });
                            }}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Top Kicker Badge</label>
                          <input
                            type="text"
                            value={slide.badge}
                            onChange={(e) => {
                              const next = [...settings.heroSlides];
                              next[idx] = { ...slide, badge: e.target.value };
                              updateDraft({ heroSlides: next });
                            }}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Headline Title</label>
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => {
                              const next = [...settings.heroSlides];
                              next[idx] = { ...slide, title: e.target.value };
                              updateDraft({ heroSlides: next });
                            }}
                            className={inputCls}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Subtitle Description</label>
                          <textarea
                            rows={2}
                            value={slide.subtitle}
                            onChange={(e) => {
                              const next = [...settings.heroSlides];
                              next[idx] = { ...slide, subtitle: e.target.value };
                              updateDraft({ heroSlides: next });
                            }}
                            className={inputCls}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Direct Product Link Box Heading</label>
                <input
                  type="text"
                  value={settings.linkSearchHeading}
                  onChange={(e) => updateDraft({ linkSearchHeading: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Direct Link Box Placeholder</label>
                <input
                  type="text"
                  value={settings.linkSearchPlaceholder}
                  onChange={(e) => updateDraft({ linkSearchPlaceholder: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. QUICK SERVICE CARDS */}
        {activeEditSection === "quickhub" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Right-Side Quick Service Hub (3 Cards)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-primary">Card 1: Sourcing Request</div>
                <input
                  type="text"
                  value={settings.quickCard1Title}
                  onChange={(e) => updateDraft({ quickCard1Title: e.target.value })}
                  placeholder="Title"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={settings.quickCard1Desc}
                  onChange={(e) => updateDraft({ quickCard1Desc: e.target.value })}
                  placeholder="Description"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={settings.quickCard1Cta}
                  onChange={(e) => updateDraft({ quickCard1Cta: e.target.value })}
                  placeholder="CTA Text"
                  className={inputCls}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-secondary">Card 2: Shipping Calculator Jump</div>
                <input
                  type="text"
                  value={settings.quickCard2Title}
                  onChange={(e) => updateDraft({ quickCard2Title: e.target.value })}
                  placeholder="Title"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={settings.quickCard2Desc}
                  onChange={(e) => updateDraft({ quickCard2Desc: e.target.value })}
                  placeholder="Description"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={settings.quickCard2Cta}
                  onChange={(e) => updateDraft({ quickCard2Cta: e.target.value })}
                  placeholder="CTA Text"
                  className={inputCls}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-teal-800">Card 3: WhatsApp Support Button</div>
                <input
                  type="text"
                  value={settings.quickCard4Title}
                  onChange={(e) => updateDraft({ quickCard4Title: e.target.value })}
                  placeholder="Title"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={settings.quickCard4Desc}
                  onChange={(e) => updateDraft({ quickCard4Desc: e.target.value })}
                  placeholder="Subtitle"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. HOMEPAGE SECTION VISIBILITY */}
        {activeEditSection === "sections" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Homepage Section Visibility Controls</h3>
            <p className="text-xs text-slate-500">Toggle any section ON or OFF instantly across the storefront</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: "showAnnouncementBar", label: "Top Announcement Bar" },
                { key: "showHeroSection", label: "Hero Sourcing Hub & Carousel" },
                { key: "showTrustBadges", label: "4 Core Trust Badges" },
                { key: "showFlashSale", label: "Flash Deals & Countdown Banner" },
                { key: "showShippingCalculator", label: "Interactive Shipping Rate Calculator" },
                { key: "showCategoriesShowcase", label: "Top 12 Sourcing Categories Grid" },
                { key: "showWholesaleSection", label: "Direct Factory Wholesale Catalog" },
                { key: "showTrendingSection", label: "Trending Collection & Filter Tabs" },
                { key: "showHowItWorks", label: "How Buying From China Works (4 Steps)" },
                { key: "showOrderJourney", label: "Order Journey Tracking Visualizer" },
                { key: "showTestimonials", label: "Verified Customer Testimonials" },
                { key: "showFaqSection", label: "Frequently Asked Questions (FAQ)" },
                { key: "showNewsletter", label: "Newsletter Subscription Banner" },
                { key: "showFloatingWhatsapp", label: "Floating WhatsApp Button" },
              ].map((item) => {
                const isEnabled = Boolean((settings as any)[item.key]);
                return (
                  <label
                    key={item.key}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      isEnabled ? "bg-emerald-50/40 border-emerald-200" : "bg-slate-50 border-slate-200 opacity-70"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => updateDraft({ [item.key]: e.target.checked } as any)}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. TRUST BADGES & CATALOG HEADINGS */}
        {activeEditSection === "trust" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">4 Core Value & Trust Badges</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {settings.trustBadges.map((badge, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700">Trust Badge #{idx + 1}</div>
                  <input
                    type="text"
                    value={badge.title}
                    onChange={(e) => {
                      const next = [...settings.trustBadges];
                      next[idx] = { ...badge, title: e.target.value };
                      updateDraft({ trustBadges: next });
                    }}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    value={badge.desc}
                    onChange={(e) => {
                      const next = [...settings.trustBadges];
                      next[idx] = { ...badge, desc: e.target.value };
                      updateDraft({ trustBadges: next });
                    }}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase">Catalog Section Headings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Categories Section Title</label>
                  <input
                    type="text"
                    value={settings.categoriesSectionTitle}
                    onChange={(e) => updateDraft({ categoriesSectionTitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Categories Section Subtitle</label>
                  <input
                    type="text"
                    value={settings.categoriesSectionSubtitle}
                    onChange={(e) => updateDraft({ categoriesSectionSubtitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Wholesale Section Title</label>
                  <input
                    type="text"
                    value={settings.wholesaleSectionTitle}
                    onChange={(e) => updateDraft({ wholesaleSectionTitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Wholesale Section Subtitle</label>
                  <input
                    type="text"
                    value={settings.wholesaleSectionSubtitle}
                    onChange={(e) => updateDraft({ wholesaleSectionSubtitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Trending Section Title</label>
                  <input
                    type="text"
                    value={settings.trendingSectionTitle}
                    onChange={(e) => updateDraft({ trendingSectionTitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Trending Section Subtitle</label>
                  <input
                    type="text"
                    value={settings.trendingSectionSubtitle}
                    onChange={(e) => updateDraft({ trendingSectionSubtitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. FLASH SALE BANNER */}
        {activeEditSection === "flashsale" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Flash Sale Banner Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Flash Sale Tag</label>
                <input
                  type="text"
                  value={settings.flashSaleTag}
                  onChange={(e) => updateDraft({ flashSaleTag: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Secondary Kicker Text</label>
                <input
                  type="text"
                  value={settings.flashSaleSubtitle}
                  onChange={(e) => updateDraft({ flashSaleSubtitle: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Main Flash Sale Heading</label>
                <input
                  type="text"
                  value={settings.flashSaleTitle}
                  onChange={(e) => updateDraft({ flashSaleTitle: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}

        {/* 8. SHIPPING CALCULATOR */}
        {activeEditSection === "calculator" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">China-to-Bangladesh Freight Calculator</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Top Badge Text</label>
                <input
                  type="text"
                  value={settings.calcBadge}
                  onChange={(e) => updateDraft({ calcBadge: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Calculator Heading</label>
                <input
                  type="text"
                  value={settings.calcTitle}
                  onChange={(e) => updateDraft({ calcTitle: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Calculator Subtitle</label>
                <input
                  type="text"
                  value={settings.calcSubtitle}
                  onChange={(e) => updateDraft({ calcSubtitle: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Air General Cargo Rate (BDT / KG)</label>
                <input
                  type="number"
                  value={settings.airNormalRate}
                  onChange={(e) => updateDraft({ airNormalRate: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Air Sensitive Cargo Rate (BDT / KG)</label>
                <input
                  type="number"
                  value={settings.airSensitiveRate}
                  onChange={(e) => updateDraft({ airSensitiveRate: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Sea General Cargo Rate (BDT / KG)</label>
                <input
                  type="number"
                  value={settings.seaNormalRate}
                  onChange={(e) => updateDraft({ seaNormalRate: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Sea Sensitive Cargo Rate (BDT / KG)</label>
                <input
                  type="number"
                  value={settings.seaSensitiveRate}
                  onChange={(e) => updateDraft({ seaSensitiveRate: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Air Delivery Duration Label</label>
                <input
                  type="text"
                  value={settings.airDeliveryDays}
                  onChange={(e) => updateDraft({ airDeliveryDays: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Sea Delivery Duration Label</label>
                <input
                  type="text"
                  value={settings.seaDeliveryDays}
                  onChange={(e) => updateDraft({ seaDeliveryDays: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Bottom Footnote / Disclaimer</label>
                <input
                  type="text"
                  value={settings.calcDisclaimer}
                  onChange={(e) => updateDraft({ calcDisclaimer: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}

        {/* 9. HOW IT WORKS */}
        {activeEditSection === "howitworks" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">How Buying From China Works (4 Steps)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Section Badge</label>
                <input
                  type="text"
                  value={settings.howItWorksBadge}
                  onChange={(e) => updateDraft({ howItWorksBadge: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Section Heading</label>
                <input
                  type="text"
                  value={settings.howItWorksTitle}
                  onChange={(e) => updateDraft({ howItWorksTitle: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Section Subtitle</label>
                <input
                  type="text"
                  value={settings.howItWorksSubtitle}
                  onChange={(e) => updateDraft({ howItWorksSubtitle: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {settings.howItWorksSteps.map((st, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-primary">Step {st.step}</div>
                  <input
                    type="text"
                    value={st.title}
                    onChange={(e) => {
                      const next = [...settings.howItWorksSteps];
                      next[idx] = { ...st, title: e.target.value };
                      updateDraft({ howItWorksSteps: next });
                    }}
                    className={inputCls}
                  />
                  <textarea
                    rows={2}
                    value={st.desc}
                    onChange={(e) => {
                      const next = [...settings.howItWorksSteps];
                      next[idx] = { ...st, desc: e.target.value };
                      updateDraft({ howItWorksSteps: next });
                    }}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. CUSTOMER TESTIMONIALS */}
        {activeEditSection === "testimonials" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Customer Testimonials</h3>
              <button
                type="button"
                onClick={() =>
                  updateDraft({
                    testimonials: [
                      ...settings.testimonials,
                      {
                        name: "New Customer",
                        location: "Dhaka",
                        role: "Verified Buyer",
                        comment: "Great wholesale pricing and smooth delivery!",
                        rating: 5,
                      },
                    ],
                  })
                }
                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Review
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Section Title</label>
                <input
                  type="text"
                  value={settings.testimonialsTitle}
                  onChange={(e) => updateDraft({ testimonialsTitle: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Rating Summary Text</label>
                <input
                  type="text"
                  value={settings.testimonialsRatingText}
                  onChange={(e) => updateDraft({ testimonialsRatingText: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="space-y-3">
              {settings.testimonials.map((rev, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Review #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => updateDraft({ testimonials: settings.testimonials.filter((_, i) => i !== idx) })}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={rev.name}
                      onChange={(e) => {
                        const next = [...settings.testimonials];
                        next[idx] = { ...rev, name: e.target.value };
                        updateDraft({ testimonials: next });
                      }}
                      placeholder="Name"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={rev.location}
                      onChange={(e) => {
                        const next = [...settings.testimonials];
                        next[idx] = { ...rev, location: e.target.value };
                        updateDraft({ testimonials: next });
                      }}
                      placeholder="City"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={rev.role}
                      onChange={(e) => {
                        const next = [...settings.testimonials];
                        next[idx] = { ...rev, role: e.target.value };
                        updateDraft({ testimonials: next });
                      }}
                      placeholder="Badge"
                      className={inputCls}
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={rev.comment}
                    onChange={(e) => {
                      const next = [...settings.testimonials];
                      next[idx] = { ...rev, comment: e.target.value };
                      updateDraft({ testimonials: next });
                    }}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. FAQ ACCORDION */}
        {activeEditSection === "faq" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Frequently Asked Questions ({settings.faqs.length})</h3>
              <button
                type="button"
                onClick={() =>
                  updateDraft({
                    faqs: [...settings.faqs, { q: "New Question?", a: "Detailed answer here." }],
                  })
                }
                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add FAQ
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>FAQ Section Title</label>
                <input
                  type="text"
                  value={settings.faqTitle}
                  onChange={(e) => updateDraft({ faqTitle: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>FAQ Subtitle</label>
                <input
                  type="text"
                  value={settings.faqSubtitle}
                  onChange={(e) => updateDraft({ faqSubtitle: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="space-y-2.5">
              {settings.faqs.map((f, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Q #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => updateDraft({ faqs: settings.faqs.filter((_, i) => i !== idx) })}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                  <input
                    type="text"
                    value={f.q}
                    onChange={(e) => {
                      const next = [...settings.faqs];
                      next[idx] = { ...f, q: e.target.value };
                      updateDraft({ faqs: next });
                    }}
                    className={inputCls}
                  />
                  <textarea
                    rows={2}
                    value={f.a}
                    onChange={(e) => {
                      const next = [...settings.faqs];
                      next[idx] = { ...f, a: e.target.value };
                      updateDraft({ faqs: next });
                    }}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 12. NEWSLETTER */}
        {activeEditSection === "newsletter" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Newsletter Banner</h3>
            <div>
              <label className={labelCls}>Heading</label>
              <input
                type="text"
                value={settings.newsletterTitle}
                onChange={(e) => updateDraft({ newsletterTitle: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Subtitle</label>
              <input
                type="text"
                value={settings.newsletterSubtitle}
                onChange={(e) => updateDraft({ newsletterSubtitle: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Subscribe Button Label</label>
              <input
                type="text"
                value={settings.newsletterButtonText}
                onChange={(e) => updateDraft({ newsletterButtonText: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* 13. WELCOME DISCOUNT POPUP */}
        {activeEditSection === "popup" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-900">Enable Welcome Discount Popup</div>
                <div className="text-[11px] text-slate-500">Displays promotional coupon modal to visitors</div>
              </div>
              <input
                type="checkbox"
                checked={settings.discountPopup.enabled}
                onChange={(e) =>
                  updateDraft({
                    discountPopup: { ...settings.discountPopup, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Popup Badge Title</label>
                <input
                  type="text"
                  value={settings.discountPopup.title}
                  onChange={(e) =>
                    updateDraft({ discountPopup: { ...settings.discountPopup, title: e.target.value } })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Main Offer Headline</label>
                <input
                  type="text"
                  value={settings.discountPopup.subtitle}
                  onChange={(e) =>
                    updateDraft({ discountPopup: { ...settings.discountPopup, subtitle: e.target.value } })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Coupon Code</label>
                <input
                  type="text"
                  value={settings.discountPopup.couponCode}
                  onChange={(e) =>
                    updateDraft({ discountPopup: { ...settings.discountPopup, couponCode: e.target.value } })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Minimum Order Notice</label>
                <input
                  type="text"
                  value={settings.discountPopup.minOrderNotice}
                  onChange={(e) =>
                    updateDraft({ discountPopup: { ...settings.discountPopup, minOrderNotice: e.target.value } })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>CTA Button Text</label>
                <input
                  type="text"
                  value={settings.discountPopup.ctaText}
                  onChange={(e) =>
                    updateDraft({ discountPopup: { ...settings.discountPopup, ctaText: e.target.value } })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Banner Image URL</label>
                <input
                  type="text"
                  value={settings.discountPopup.imageUrl}
                  onChange={(e) =>
                    updateDraft({ discountPopup: { ...settings.discountPopup, imageUrl: e.target.value } })
                  }
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}

        {/* 14. PAYMENTS, CURRENCY & ORDER RULES */}
        {activeEditSection === "payments" && (
          isMarketing ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Access Restricted</h4>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                Bank account details and payment gateway settings are restricted to the Main Admin. This section is inaccessible to marketing and unauthorized roles.
              </p>
            </div>
          ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
              <h3 className="text-sm font-bold text-slate-900">Currency Exchange, Payment Gateways & Bank Accounts</h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  🔒 Admin Only
                </span>
                <span className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
                  Marketing Restricted
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
              <div>
                <label className={labelCls}>RMB to BDT Rate (1 RMB = ?)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.rmbRate}
                  onChange={(e) => updateDraft({ rmbRate: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Min Order Amount (BDT)</label>
                <input
                  type="number"
                  value={settings.minOrderAmount}
                  onChange={(e) => updateDraft({ minOrderAmount: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Domestic Delivery Fee (BDT)</label>
                <input
                  type="number"
                  value={settings.deliveryCharge}
                  onChange={(e) => updateDraft({ deliveryCharge: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>bKash Number</label>
                <input
                  type="text"
                  value={settings.bkashNumber}
                  onChange={(e) => updateDraft({ bkashNumber: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>bKash Account Type</label>
                <input
                  type="text"
                  value={settings.bkashType}
                  onChange={(e) => updateDraft({ bkashType: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Nagad Number</label>
                <input
                  type="text"
                  value={settings.nagadNumber}
                  onChange={(e) => updateDraft({ nagadNumber: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Nagad Account Type</label>
                <input
                  type="text"
                  value={settings.nagadType}
                  onChange={(e) => updateDraft({ nagadType: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Bank Name</label>
                <input
                  type="text"
                  value={settings.bankName}
                  onChange={(e) => updateDraft({ bankName: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Bank Account Holder</label>
                <input
                  type="text"
                  value={settings.bankAccountName}
                  onChange={(e) => updateDraft({ bankAccountName: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Bank Account Number</label>
                <input
                  type="text"
                  value={settings.bankAccountNumber}
                  onChange={(e) => updateDraft({ bankAccountNumber: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Bank Branch & Routing</label>
                <input
                  type="text"
                  value={settings.bankBranch}
                  onChange={(e) => updateDraft({ bankBranch: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        ))}

        {/* 15. FOOTER & SOCIALS */}
        {activeEditSection === "footer" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Footer, Contact Info & Social Media Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelCls}>Footer Brand Description</label>
                <textarea
                  rows={2}
                  value={settings.footerAbout}
                  onChange={(e) => updateDraft({ footerAbout: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Helpline Phone Number</label>
                <input
                  type="text"
                  value={settings.hotlinePhone}
                  onChange={(e) => updateDraft({ hotlinePhone: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>WhatsApp Number (Digits only)</label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => updateDraft({ whatsappNumber: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Official Support Email</label>
                <input
                  type="text"
                  value={settings.supportEmail}
                  onChange={(e) => updateDraft({ supportEmail: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>China Warehouse Info</label>
                <input
                  type="text"
                  value={settings.chinaWarehouseInfo}
                  onChange={(e) => updateDraft({ chinaWarehouseInfo: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Bangladesh Office Address</label>
                <input
                  type="text"
                  value={settings.officeAddress}
                  onChange={(e) => updateDraft({ officeAddress: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Facebook URL</label>
                <input
                  type="text"
                  value={settings.socialFacebook}
                  onChange={(e) => updateDraft({ socialFacebook: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Instagram URL</label>
                <input
                  type="text"
                  value={settings.socialInstagram}
                  onChange={(e) => updateDraft({ socialInstagram: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>YouTube URL</label>
                <input
                  type="text"
                  value={settings.socialYoutube}
                  onChange={(e) => updateDraft({ socialYoutube: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Copyright Line</label>
                <input
                  type="text"
                  value={settings.footerCopyright}
                  onChange={(e) => updateDraft({ footerCopyright: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}

        {/* 16. INFO & POLICY PAGES CMS */}
        {activeEditSection === "pages" && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
              {[
                { id: "about", label: "About Us" },
                { id: "contact", label: "Contact Us" },
                { id: "privacy", label: "Privacy Policy" },
                { id: "return", label: "Return & Refund" },
                { id: "cancel", label: "Cancellation Policy" },
              ].map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setActivePolicyTab(pt.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    activePolicyTab === pt.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>

            {activePolicyTab === "about" && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Page Heading</label>
                  <input
                    type="text"
                    value={settings.aboutPageTitle}
                    onChange={(e) => updateDraft({ aboutPageTitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Introduction Paragraph</label>
                  <textarea
                    rows={3}
                    value={settings.aboutPageIntro}
                    onChange={(e) => updateDraft({ aboutPageIntro: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Bullet Points (One per line)</label>
                  <textarea
                    rows={5}
                    value={settings.aboutPageWhyBullets.join("\n")}
                    onChange={(e) => updateDraft({ aboutPageWhyBullets: e.target.value.split("\n") })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Closing Statement</label>
                  <textarea
                    rows={2}
                    value={settings.aboutPageClosing}
                    onChange={(e) => updateDraft({ aboutPageClosing: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {activePolicyTab === "contact" && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Contact Page Title</label>
                  <input
                    type="text"
                    value={settings.contactPageTitle}
                    onChange={(e) => updateDraft({ contactPageTitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Right Card Heading</label>
                  <input
                    type="text"
                    value={settings.contactPageCtaTitle}
                    onChange={(e) => updateDraft({ contactPageCtaTitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Right Card Message</label>
                  <textarea
                    rows={2}
                    value={settings.contactPageCtaText}
                    onChange={(e) => updateDraft({ contactPageCtaText: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Email Button Label</label>
                  <input
                    type="text"
                    value={settings.contactPageButtonText}
                    onChange={(e) => updateDraft({ contactPageButtonText: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {activePolicyTab === "privacy" && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Privacy Policy Title</label>
                  <input
                    type="text"
                    value={settings.privacyPageTitle}
                    onChange={(e) => updateDraft({ privacyPageTitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Intro Summary</label>
                  <textarea
                    rows={3}
                    value={settings.privacyPageIntro}
                    onChange={(e) => updateDraft({ privacyPageIntro: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {activePolicyTab === "return" && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Return & Refund Page Title</label>
                  <input
                    type="text"
                    value={settings.returnPageTitle}
                    onChange={(e) => updateDraft({ returnPageTitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Intro Policy Notice</label>
                  <textarea
                    rows={3}
                    value={settings.returnPageIntro}
                    onChange={(e) => updateDraft({ returnPageIntro: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Authorized Return Hub Address</label>
                  <textarea
                    rows={3}
                    value={settings.returnHubAddress}
                    onChange={(e) => updateDraft({ returnHubAddress: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {activePolicyTab === "cancel" && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Cancellation Policy Title</label>
                  <input
                    type="text"
                    value={settings.cancellationPageTitle}
                    onChange={(e) => updateDraft({ cancellationPageTitle: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Intro Paragraph</label>
                  <textarea
                    rows={2}
                    value={settings.cancellationPageIntro}
                    onChange={(e) => updateDraft({ cancellationPageIntro: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Prohibited Items List (One item per line)</label>
                  <textarea
                    rows={6}
                    value={settings.prohibitedItemsList.join("\n")}
                    onChange={(e) => updateDraft({ prohibitedItemsList: e.target.value.split("\n") })}
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 17. BACKUP, EXPORT & RESET */}
        {activeEditSection === "backup" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Configuration Backup, Restore & Reset</h3>
            {importStatus && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{importStatus}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleExportJson}
                className="p-4 rounded-xl border border-slate-200 hover:border-primary bg-slate-50 hover:bg-white text-left space-y-1.5 transition cursor-pointer"
              >
                <Download className="w-5 h-5 text-primary" />
                <div className="text-xs font-bold text-slate-900">Export Website Config</div>
                <p className="text-[11px] text-slate-500">Download full JSON backup of all website settings</p>
              </button>

              <label className="p-4 rounded-xl border border-slate-200 hover:border-primary bg-slate-50 hover:bg-white text-left space-y-1.5 transition cursor-pointer block">
                <Upload className="w-5 h-5 text-emerald-600" />
                <div className="text-xs font-bold text-slate-900">Import Config JSON</div>
                <p className="text-[11px] text-slate-500">Restore a previously saved configuration file</p>
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => {
                  resetToDefaults();
                }}
                className="p-4 rounded-xl border border-red-200 hover:border-red-400 bg-red-50/40 hover:bg-red-50 text-left space-y-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-5 h-5 text-red-600" />
                <div className="text-xs font-bold text-red-900">Reset to Factory Defaults</div>
                <p className="text-[11px] text-red-600">Restore default World Buy BD colors, texts & banners</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
