import React, { useState, useEffect } from "react";
import { useSiteSettings } from "../../context/SiteSettingsContext";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  theme?: "light" | "dark";
  className?: string;
  imgClassName?: string;
}

export default function BrandLogo({
  size = "md",
  showTagline = false,
  theme = "light",
  className = "",
  imgClassName = "",
}: BrandLogoProps) {
  const { settings } = useSiteSettings();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [settings.logoUrl]);

  const sizeMap = {
    xs: { h: "h-8 sm:h-9", logoH: "h-8 w-8 sm:h-9 sm:w-9", text: "text-sm", tag: "text-[8px]" },
    sm: { h: "h-11 md:h-12", logoH: "h-11 w-11 md:h-12 md:w-12", text: "text-base", tag: "text-[9px]" },
    md: { h: "h-14 sm:h-16 md:h-20", logoH: "h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20", text: "text-xl md:text-2xl", tag: "text-xs" },
    lg: { h: "h-20 sm:h-24 md:h-28", logoH: "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28", text: "text-2xl md:text-3xl", tag: "text-sm" },
    xl: { h: "h-28 sm:h-32 md:h-36", logoH: "h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36", text: "text-3xl md:text-4xl", tag: "text-base" },
  };

  const current = sizeMap[size] || sizeMap.md;
  const isDark = theme === "dark";
  const activeLogo = settings.logoUrl && settings.logoUrl.trim() !== "" ? settings.logoUrl : "/assets/logo.png";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {!imageError ? (
        <img
          src={activeLogo}
          alt={`${settings.siteName || "World Buy BD"} Logo`}
          className={`object-contain transition-transform duration-300 hover:scale-105 ${current.h} w-auto ${imgClassName}`}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex items-center gap-2.5">
          <div
            className={`${current.logoH} rounded-xl bg-gradient-to-tr from-[#0A2540] via-[#0F3E7D] to-[#185ADB] p-2 flex items-center justify-center shadow-sm text-white relative overflow-hidden group`}
          >
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
            >
              <path
                d="M10 25 C 35 25, 65 38, 90 48 C 75 52, 60 55, 45 55 C 60 59, 78 63, 85 70 C 65 72, 45 70, 25 60 C 40 65, 55 68, 65 75 C 45 75, 25 68, 15 50 Z"
                fill="url(#falconGrad)"
              />
              <path d="M70 42 C 85 40, 95 45, 96 49 C 90 53, 80 52, 70 48 Z" fill="#38BDF8" />
              <circle cx="85" cy="46" r="1.5" fill="#FFFFFF" />
              <defs>
                <linearGradient id="falconGrad" x1="10" y1="25" x2="90" y2="75" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60A5FA" />
                  <stop offset="0.5" stopColor="#2563EB" />
                  <stop offset="1" stopColor="#1E3A8A" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex flex-col leading-tight">
            <span
              className={`font-black tracking-tight uppercase ${current.text} ${
                isDark
                  ? "text-white drop-shadow-sm"
                  : "bg-gradient-to-r from-[#0A2540] via-[#0F3E7D] to-[#185ADB] bg-clip-text text-transparent"
              }`}
            >
              {settings.siteName || "WORLD BUY BD"}
            </span>
            {showTagline && (
              <span
                className={`font-semibold tracking-widest uppercase ${current.tag} ${
                  isDark ? "text-blue-200/80" : "text-slate-500"
                }`}
              >
                {settings.siteTagline || "BUY SMART, DELIVER WORLDWIDE"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
