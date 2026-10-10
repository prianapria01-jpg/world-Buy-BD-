import React, { useState } from "react";
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  MoreVertical,
  Monitor,
  ExternalLink,
  ShieldCheck,
  Zap,
  HardDrive,
  Info,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { useSiteSettings } from "../../context/SiteSettingsContext";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const { settings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<"android" | "ios" | "pc" | "faq" | "playstore">(
    isIOS ? "ios" : "android"
  );
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle direct PWA install
  const handleDirectInstall = async () => {
    setIsInstalling(true);
    setInstallStatus(null);
    try {
      const accepted = await install();
      if (accepted) {
        setInstallStatus("success");
      } else {
        setInstallStatus("dismissed");
      }
    } catch {
      setInstallStatus("error");
    } finally {
      setIsInstalling(false);
    }
  };

  // Generate and download a standalone offline web app launcher file (.html)
  const handleDownloadLauncher = () => {
    const appUrl = window.location.origin;
    const launcherHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>World Buy BD - Official App Launcher</title>
  <meta name="theme-color" content="#16a34a">
  <link rel="icon" type="image/jpeg" href="${appUrl}/assets/logo.jpg">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: #0f172a; color: #fff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 32px 24px; max-width: 420px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .logo { width: 88px; height: 88px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); margin-bottom: 20px; object-fit: cover; border: 2px solid #16a34a; }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 8px; color: #f8fafc; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
    .btn { display: block; width: 100%; background: #16a34a; color: #fff; text-decoration: none; padding: 14px 20px; border-radius: 14px; font-weight: 700; font-size: 15px; margin-bottom: 12px; transition: 0.2s; border: none; cursor: pointer; }
    .btn:hover { background: #15803d; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(22, 163, 74, 0.15); color: #4ade80; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .footer-note { font-size: 11px; color: #64748b; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${appUrl}/assets/logo.jpg" alt="World Buy BD" class="logo" onerror="this.src='${appUrl}/pwa-192x192.png'">
    <div class="badge">⚡ Official App Launcher</div>
    <h1>World Buy BD</h1>
    <p>China to Bangladesh — Easy, Safe & Affordable Shopping Platform</p>
    <a href="${appUrl}" class="btn" target="_self">🚀 Open World Buy BD App</a>
    <div class="footer-note">Save this file to your mobile or computer to quickly launch World Buy BD with one tap!</div>
  </div>
  <script>
    // Auto-launch if possible
    setTimeout(() => {
      window.location.href = "${appUrl}";
    }, 1500);
  </script>
</body>
</html>`;

    const blob = new Blob([launcherHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "WorldBuyBD-App-Launcher.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setInstallStatus("launcher_downloaded");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden relative">
        
        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 sm:p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <img
              src="/assets/logo.jpg"
              alt="World Buy BD Logo"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg bg-white shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/pwa-192x192.png";
              }}
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-xs mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Official Mobile App (PWA)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">World Buy BD App</h2>
              <p className="text-xs sm:text-sm text-emerald-50 opacity-90 line-clamp-1">
                Fast, safe, and direct wholesale e-commerce mobile application
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-sm">
          
          {/* Status Alert if any */}
          {installStatus === "success" && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Congratulations! The app was successfully installed on your device. Check your home screen.</span>
            </div>
          )}
          {installStatus === "launcher_downloaded" && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-800 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
              <span>'WorldBuyBD-App-Launcher.html' downloaded! Open it to launch the app directly.</span>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="space-y-2.5">
            {isInstallable && (
              <button
                type="button"
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
              >
                <Smartphone className="w-5 h-5" />
                <span>{isInstalling ? "Installing..." : "🚀 1-Click Install App (Direct Install)"}</span>
              </button>
            )}

            {/* Custom APK Download if Store Configured */}
            {(settings as any).apkDownloadUrl && (
              <a
                href={(settings as any).apkDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                <span>📥 Download Android APK File Directly</span>
              </a>
            )}

            {/* Always Available Offline App Launcher Download */}
            <button
              type="button"
              onClick={handleDownloadLauncher}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download Desktop & Mobile Shortcut Launcher (.html Launcher)</span>
            </button>
          </div>

          {/* Clear PWA Technology Explanation Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Why no bulky APK installation is required:</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              World Buy BD is built with Google's official <strong>Progressive Web App (PWA)</strong> standard. It saves directly onto your home screen without consuming excessive phone memory or requiring updates.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-snug">
                  <span className="font-bold text-slate-800 block">100% Virus Free & Secure</span>
                  <span className="text-slate-500">Runs directly through secure verified sandbox</span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                <HardDrive className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-snug">
                  <span className="font-bold text-slate-800 block">Zero Storage Overhead</span>
                  <span className="text-slate-500">Instant launch with zero device slowdown</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs for Device Instructions */}
          <div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("android")}
                className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "android"
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>📱 Android</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ios")}
                className={`flex-1 min-w-[85px] py-2 px-3 rounded-xl transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "ios"
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🍏 iPhone</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pc")}
                className={`flex-1 min-w-[85px] py-2 px-3 rounded-xl transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "pc"
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>💻 PC / Mac</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("playstore")}
                className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "playstore"
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>📦 Play Store APK</span>
              </button>
            </div>

            {/* Tab 1: Android Instructions */}
            {activeTab === "android" && (
              <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 space-y-3.5">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>How to install on Android phone:</span>
                </div>
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      Open your phone's <strong>Chrome</strong> browser and tap the <strong>three dots (⋮)</strong> menu in the upper right.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong> from the menu options.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      Tap <strong>"Install"</strong>. The World Buy BD app icon will be added to your home screen and run in seamless full-screen mode!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: iPhone / iOS Instructions */}
            {activeTab === "ios" && (
              <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 space-y-3.5">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span>How to install on iPhone / iPad (Safari):</span>
                </div>
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      Open the website in Safari and tap the <strong>Share</strong> button (box with upward arrow) at the bottom.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      Scroll down and tap <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      Tap <strong>"Add"</strong> in the top right corner. The app will be placed directly on your iPhone home screen!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: PC / Desktop Instructions */}
            {activeTab === "pc" && (
              <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 space-y-3.5">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <span>How to install on Windows / Mac PC:</span>
                </div>
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      Click the <strong>Install (⊕)</strong> icon on the far right of Google Chrome or Microsoft Edge address bar.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      Click <strong>"Install"</strong>. A standalone desktop shortcut will be created in your Start Menu and Desktop.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Play Store / APK Generation Guide */}
            {activeTab === "playstore" && (
              <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 space-y-3.5">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>How to package as signed APK / AAB for Google Play Store:</span>
                </div>
                <p className="text-xs text-slate-600">
                  This website is 100% PWA compliant (with Manifest, Service Worker, and 512x512 icons). You can create signed Google Play Store APK/AAB packages in 2 minutes:
                </p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-800">Method 1: PWABuilder (Official Microsoft / Google Tool - Free)</div>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                    <li>
                      Visit{" "}
                      <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline inline-flex items-center gap-0.5">
                        pwabuilder.com <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>Enter your website URL and click <strong>"Start"</strong>.</li>
                    <li>Under <strong>"Package for Stores"</strong>, choose <strong>"Android"</strong> to download the signed APK and AAB for Google Play Store!</li>
                  </ol>
                </div>
                <div className="text-[11px] text-slate-500">
                  * In Admin Settings, paste your direct APK link to allow visitors to download APK directly from this modal.
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Fast, Secure & Always Updated</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
