import React, { useState } from "react";
import { Lock, ExternalLink, Copy, Check } from "lucide-react";
import { canAccessProductSourceLink } from "../../utils/productPrivacy";

interface ProductSourceLinkDisplayProps {
  url?: string;
  offerId?: string | number;
  label?: string;
  viewerDepartment?: string;
  role?: string;
  isMasterAdmin?: boolean;
  compact?: boolean;
  className?: string;
}

export default function ProductSourceLinkDisplay({
  url,
  offerId,
  label = "1688 Source Link",
  viewerDepartment,
  role,
  isMasterAdmin,
  compact = false,
  className = ""
}: ProductSourceLinkDisplayProps) {
  const [copied, setCopied] = useState(false);

  const resolvedUrl =
    url ||
    (offerId ? `https://detail.1688.com/offer/${String(offerId).replace(/^abb-/, "")}.html` : "");

  const hasAccess = canAccessProductSourceLink({
    isMasterAdmin,
    viewerDepartment,
    role
  });

  if (!resolvedUrl) {
    return null;
  }

  // If user does not have access (not Main Admin and not Purchase department):
  if (!hasAccess) {
    if (compact) {
      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-medium ${className}`}
          title="Product source link is restricted to Main Admin and Purchase Department"
        >
          <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
          <span>Source Link Protected</span>
        </span>
      );
    }

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-800 text-[11px] font-medium ${className}`}>
        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Source Link Protected (Main Admin & Purchase Dept Only)</span>
      </div>
    );
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(resolvedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-bold"
          title={resolvedUrl}
        >
          <span>{label}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="p-0.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          title="Copy Link"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs ${className}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] uppercase shrink-0">
          1688 Source
        </span>
        <span className="font-mono text-slate-600 truncate text-[11px]" title={resolvedUrl}>
          {resolvedUrl}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-700">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-500" />
              <span>Copy Link</span>
            </>
          )}
        </button>
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-2xs"
        >
          <span>Open on 1688</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
