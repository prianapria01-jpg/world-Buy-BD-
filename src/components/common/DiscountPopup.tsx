import React, { useState, useEffect } from "react";
import { X, Copy, Check, Sparkles, Tag, ArrowRight, ShieldCheck, Plane, Ship } from "lucide-react";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export interface PopupSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  couponCode: string;
  discountPercent: number;
  imageUrl: string;
  minOrderNotice: string;
  ctaText: string;
  ctaLink: string;
}

export const defaultPopupSettings: PopupSettings = {
  enabled: true,
  title: "Special Welcome Offer",
  subtitle: "Get a Flat 5% Discount on Your Order",
  couponCode: "WORLDBUY5",
  discountPercent: 5,
  imageUrl: "/assets/popup-banner.jpg",
  minOrderNotice: "Applicable on orders over BDT 2,000",
  ctaText: "Claim Discount Now",
  ctaLink: "/shop",
};

interface DiscountPopupProps {
  forceOpen?: boolean;
  onClosePreview?: () => void;
}

export default function DiscountPopup({ forceOpen = false, onClosePreview }: DiscountPopupProps) {
  const { settings: siteSettings, isLiveEditMode } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const popup = siteSettings.discountPopup || defaultPopupSettings;

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    if (isLiveEditMode || popup.enabled === false) {
      return;
    }

    const dismissedTime = localStorage.getItem("wbbd_popup_dismissed_at");
    if (dismissedTime) {
      const hoursPassed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60);
      if (hoursPassed < 24) {
        return;
      }
    }

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [forceOpen, popup.enabled, isLiveEditMode]);

  const handleClose = () => {
    setIsOpen(false);
    if (dontShowAgain) {
      localStorage.setItem("wbbd_popup_dismissed_at", Date.now().toString());
    }
    if (onClosePreview) {
      onClosePreview();
    }
  };

  const handleCopyCoupon = () => {
    if (!popup.couponCode) return;
    navigator.clipboard.writeText(popup.couponCode);
    localStorage.setItem("active_coupon", popup.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleAction = () => {
    handleCopyCoupon();
    handleClose();
    if (popup.ctaLink) {
      window.location.href = popup.ctaLink;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-sm sm:max-w-md rounded-2xl overflow-hidden bg-gradient-to-b from-[#0A2540] via-[#0B3B24] to-[#041D12] text-white shadow-2xl border border-white/20 transform transition-all scale-95 sm:scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/30 backdrop-blur-md transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
          aria-label="Close discount popup"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="relative w-full h-36 sm:h-48 overflow-hidden bg-[#0A2540] flex items-center justify-center">
          {popup.imageUrl && popup.imageUrl.trim() !== "" ? (
            <img
              src={popup.imageUrl}
              alt="Offer"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
              referrerPolicy="no-referrer"
            />
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-t from-[#041D12] via-transparent to-black/30" />

          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-xs font-bold text-emerald-300 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            <span>{siteSettings.siteName} Exclusive</span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
            <div className="flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-sky-400" />
              <span>Air Cargo {siteSettings.airDeliveryDays}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Ship className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sea Cargo {siteSettings.seaDeliveryDays}</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 text-center space-y-3">
          <div>
            <div className="inline-block mb-1 text-[10px] uppercase tracking-widest text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {popup.title || "Special Welcome Offer"}
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
              {popup.subtitle || "Get a Flat 5% Discount on Your Order"}
            </h2>
          </div>

          <div className="bg-black/40 border border-emerald-500/40 rounded-xl p-2.5 sm:p-3 max-w-[280px] sm:max-w-xs mx-auto shadow-inner">
            <div className="text-[10px] text-gray-300 uppercase tracking-wider mb-1.5 font-medium">
              Your Exclusive Coupon Code
            </div>
            <div className="flex items-center justify-between bg-white rounded-lg p-1 pl-2 border border-emerald-400 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono font-black text-sm sm:text-base text-[#0F3E7D] tracking-wider">
                  {popup.couponCode || "WORLDBUY5"}
                </span>
              </div>
              <button
                onClick={handleCopyCoupon}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            {popup.minOrderNotice && (
              <p className="text-[10px] text-emerald-300/90 mt-1.5 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {popup.minOrderNotice}
              </p>
            )}
          </div>

          <div className="pt-0.5">
            <button
              onClick={handleAction}
              className="w-full sm:w-3/4 mx-auto bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-slate-950 font-black text-sm py-2.5 px-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{popup.ctaText || "Claim Discount Now"}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 pt-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
              />
              <span>Don't show again today</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
