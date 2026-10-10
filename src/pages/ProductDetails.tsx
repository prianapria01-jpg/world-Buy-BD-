import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Product } from "../types";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { matchesCategory, cleanEnglishTitle, syncSkuDetailsWithVariants } from "../utils/categories";
import { Star, Minus, Plus, ShoppingCart, Heart, Shield, Truck, Plane, Ship, Store, CheckCircle2, X, ExternalLink, Award, Check, Copy, Facebook, Phone, Download, AlertCircle, ArrowUpRight, ArrowRight, Sparkles, Building2, Trash2, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCw, Package, FileText, Sliders, ShieldCheck, Calculator, MessageSquare, Search, ThumbsUp, HelpCircle, Send, Scale, Clock, MapPin, Info, ChevronDown, ChevronUp } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { translateText } from "../utils/translate";
import { getSafeImageUrl, isSameImageUrl, downloadImageWithName } from "../utils/imageUrl";
import { getCleanProductCode, getProductPath, getFullProductUrl } from "../utils/productUrl";
import { cachedFetchJson, getSyncCached } from "../utils/apiCache";
import { cleanProductDescription, cleanProductDescriptionHtml } from "../utils/sanitizeDescription";

// Helper functions for precise variant & SKU spec matching across supplier formats
const normalizeSpecToken = (str: string): string => {
  if (!str) return '';
  return String(str)
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
};

const getVariantTokens = (variant: any): string[] => {
  if (!variant) return [];
  const specStr = variant.specs || variant.specsToken || variant.name || '';
  const normalized = normalizeSpecToken(specStr);
  return normalized.split(/[>;^|]/).map((s: string) => s.trim()).filter(Boolean);
};

const tokenMatchesTarget = (token: string, target: any): boolean => {
  if (!token || !target) return false;
  const cleanToken = normalizeSpecToken(token);
  const subToken = cleanToken.includes(':') 
    ? cleanToken.split(':').slice(1).join(':').trim() 
    : cleanToken;
  
  const candidates: string[] = [];
  if (typeof target === 'string') {
    candidates.push(normalizeSpecToken(target));
  } else if (target && typeof target === 'object') {
    if (target.originalName) candidates.push(normalizeSpecToken(target.originalName));
    if (target.name) candidates.push(normalizeSpecToken(target.name));
    if (target.cleanName) candidates.push(normalizeSpecToken(target.cleanName));
    if (target.value) candidates.push(normalizeSpecToken(target.value));
  }
  
  return candidates.some(c => {
    if (!c) return false;
    const cleanCand = c.trim();
    const subCand = cleanCand.includes(':')
      ? cleanCand.split(':').slice(1).join(':').trim()
      : cleanCand;
    return cleanToken === cleanCand || 
           subToken === cleanCand || 
           cleanToken === subCand ||
           subToken === subCand ||
           cleanToken.toLowerCase() === cleanCand.toLowerCase() || 
           subToken.toLowerCase() === cleanCand.toLowerCase() ||
           cleanToken.toLowerCase() === subCand.toLowerCase() ||
           subToken.toLowerCase() === subCand.toLowerCase();
  });
};

const findMatchingSku = (variantsList: any[], targets: any[], properties?: any[], allowFallback: boolean = false): any | null => {
  if (!variantsList || variantsList.length === 0 || !targets || targets.length === 0) return null;
  
  // 1. Direct SKU ID match (only when targeting a single specific SKU option that has its own distinct skuId)
  if (targets.length === 1 && targets[0] && typeof targets[0] === 'object') {
    const targetSkuId = targets[0].skuId || targets[0].id || targets[0].variantId;
    if (targetSkuId) {
      const matchesById = variantsList.filter((v: any) => v.skuId === targetSkuId || v.variantId === targetSkuId || v.id === targetSkuId);
      if (matchesById.length === 1) return matchesById[0];
    }
  }

  // 2. Exact token-level match for each target
  const exactMatch = variantsList.find((v: any) => {
    const tokens = getVariantTokens(v);
    if (tokens.length === 0) return false;
    return targets.every(target => tokens.some(t => tokenMatchesTarget(t, target)));
  });
  if (exactMatch) return exactMatch;

  // 3. Normalized full string equality
  if (targets.length === 1) {
    const t = targets[0];
    const targetNorms = typeof t === 'string'
      ? [normalizeSpecToken(t)]
      : [
          normalizeSpecToken(t?.originalName),
          normalizeSpecToken(t?.name),
          normalizeSpecToken(t?.cleanName),
          normalizeSpecToken(t?.value)
        ].filter(Boolean);

    const fullStringMatch = variantsList.find((v: any) => {
      const raw = normalizeSpecToken(v.specs || v.name || '');
      const subRaw = raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : raw;
      return targetNorms.some(tn => tn && (
        raw === tn ||
        subRaw === tn ||
        raw.toLowerCase() === tn.toLowerCase() ||
        subRaw.toLowerCase() === tn.toLowerCase()
      ));
    });
    if (fullStringMatch) return fullStringMatch;
  }

  // 4. 1:1 Index fallback for single-property products
  if (properties && properties.length === 1 && properties[0]?.values?.length === variantsList.length && targets.length === 1) {
    const t = targets[0];
    const tName = typeof t === 'string' ? t : (t?.originalName || t?.name);
    const idx = properties[0].values.findIndex((v: any) => {
      const vn = normalizeSpecToken(v.originalName || v.name);
      const tn = normalizeSpecToken(tName);
      return (vn && tn && vn === tn) || v.name === tName || v === t;
    });
    if (idx >= 0 && variantsList[idx]) {
      return variantsList[idx];
    }
  }

  return allowFallback ? (variantsList[0] || null) : null;
};

// Instant dictionary for common Chinese SKU property names, colors, and sizes
const SKU_TERM_DICTIONARY: Record<string, string> = {
  "颜色": "color",
  "颜色分类": "color",
  "镜框颜色": "Frame Color",
  "镜片颜色": "Lens Color",
  "规格型号": "color",
  "尺码": "Size",
  "尺寸": "Size",
  "规格": "Size",
  "适合身高": "Height / Size",
  "纯度": "Specification",
  "咖啡色": "Coffee",
  "咖啡": "Coffee",
  "啡色": "Coffee Brown",
  "深咖": "Dark Coffee",
  "深咖色": "Dark Coffee",
  "浅咖": "Light Coffee",
  "浅咖色": "Light Coffee",
  "焦糖色": "Caramel",
  "焦糖": "Caramel",
  "驼色": "Camel",
  "燕麦色": "Oatmeal",
  "鲨鱼灰": "Shark Gray",
  "大象灰": "Elephant Gray",
  "高级灰": "Premium Gray",
  "银灰色": "Silver Gray",
  "银灰": "Silver Gray",
  "麻灰": "Heather Gray",
  "花灰": "Melange Gray",
  "加白花灰": "Light Melange Gray",
  "中性灰": "Neutral Gray",
  "米灰色": "Beige Gray",
  "米灰": "Beige Gray",
  "奶灰色": "Cream Gray",
  "灰色": "Gray",
  "浅灰色": "Light Gray",
  "浅灰": "Light Gray",
  "深灰色": "Dark Gray",
  "深灰": "Dark Gray",
  "葡萄紫": "Grape Purple",
  "香芋紫": "Taro Purple",
  "蓝紫": "Blue Purple",
  "紫红色": "Purplish Red",
  "浅紫色": "Light Purple",
  "浅紫": "Light Purple",
  "深紫色": "Dark Purple",
  "深紫": "Dark Purple",
  "紫色": "Purple",
  "电光蓝": "Electric Blue",
  "深藏蓝": "Dark Navy",
  "藏青色": "Navy Blue",
  "藏青": "Navy Blue",
  "藏蓝色": "Navy Blue",
  "藏蓝": "Navy Blue",
  "深蓝色": "Dark Blue",
  "深蓝": "Dark Blue",
  "浅蓝色": "Light Blue",
  "浅蓝": "Light Blue",
  "淡蓝色": "Pale Blue",
  "淡蓝": "Pale Blue",
  "天蓝色": "Sky Blue",
  "天蓝": "Sky Blue",
  "灰蓝色": "Gray Blue",
  "灰蓝": "Gray Blue",
  "灰兰": "Gray Blue",
  "雾霾蓝": "Haze Blue",
  "牛仔蓝": "Denim Blue",
  "宝蓝色": "Royal Blue",
  "宝蓝": "Royal Blue",
  "蓝色": "Blue",
  "玫粉": "Rose Pink",
  "玫红": "Rose Red",
  "玫红色": "Rose Red",
  "浅粉": "Light Pink",
  "浅粉色": "Light Pink",
  "淡粉色": "Pale Pink",
  "淡粉": "Pale Pink",
  "深粉": "Dark Pink",
  "深粉色": "Dark Pink",
  "粉红色": "Pink",
  "粉红": "Pink",
  "甜蜜粉": "Sweet Pink",
  "豆沙粉": "Dusty Pink",
  "藕色": "Lotus Pink",
  "藕粉": "Lotus Pink",
  "粉色": "Pink",
  "浅肤色": "Light Nude",
  "深肤色": "Dark Nude",
  "肤色": "Nude / Skin",
  "酒红色": "Wine Red",
  "酒红": "Wine Red",
  "暗红": "Dark Red",
  "暗红色": "Dark Red",
  "大红": "Bright Red",
  "大红色": "Bright Red",
  "斯嘉丽红": "Scarlet Red",
  "浅红": "Light Red",
  "桔红色": "Orange Red",
  "桔红": "Orange Red",
  "红色": "Red",
  "小鸡黄": "Light Yellow",
  "淡黄色": "Pale Yellow",
  "淡黄": "Pale Yellow",
  "米黄色": "Cream Yellow",
  "米黄": "Cream Yellow",
  "土黄": "Ochre Yellow",
  "土黄色": "Ochre Yellow",
  "姜黄色": "Mustard Yellow",
  "姜黄": "Mustard Yellow",
  "霓虹黄": "Neon Yellow",
  "香槟色": "Champagne",
  "香槟": "Champagne",
  "黄色": "Yellow",
  "荧光橙": "Fluorescent Orange",
  "荧光绿": "Fluorescent Green",
  "黑金": "Black Gold",
  "蓝红色": "Blue Red",
  "蓝红": "Blue Red",
  "灰迷彩": "Gray Camouflage",
  "黑白色": "Black White",
  "黑白": "Black White",
  "迷彩": "Camouflage",
  "黑色": "Black",
  "白色": "White",
  "米白色": "Off-White",
  "米白": "Off-White",
  "米色": "Beige",
  "杏色": "Apricot",
  "浅杏": "Light Apricot",
  "浅杏色": "Light Apricot",
  "卡其色": "Khaki",
  "卡其": "Khaki",
  "卡色": "Khaki",
  "深棕色": "Dark Brown",
  "深棕": "Dark Brown",
  "浅棕色": "Light Brown",
  "浅棕": "Light Brown",
  "棕色": "Brown",
  "墨绿色": "Dark Green",
  "墨绿": "Dark Green",
  "军绿色": "Army Green",
  "军绿": "Army Green",
  "浅绿色": "Light Green",
  "浅绿": "Light Green",
  "薄荷绿": "Mint Green",
  "牛油果绿": "Avocado Green",
  "豆沙绿": "Sage Green",
  "灰绿": "Gray Green",
  "深绿色": "Dark Green",
  "深绿": "Dark Green",
  "果绿": "Apple Green",
  "绿色": "Green",
  "橙色": "Orange",
  "桔色": "Orange",
  "银色": "Silver",
  "金色": "Gold",
  "玫瑰金": "Rose Gold",
  "古铜色": "Bronze",
  "豹纹": "Leopard Print",
  "斑马纹": "Zebra Print",
  "蛇纹": "Snake Print",
  "棋盘格": "Checkerboard",
  "均码": "Free Size",
};

const COLOR_TOKEN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/米白色/g, "Off-White"],
  [/米白/g, "Off-White"],
  [/米灰色/g, "Beige Gray"],
  [/米灰/g, "Beige Gray"],
  [/奶灰色/g, "Cream Gray"],
  [/大象灰/g, "Elephant Gray"],
  [/鲨鱼灰/g, "Shark Gray"],
  [/深灰色|深灰/g, "Dark Gray"],
  [/浅灰色|浅灰/g, "Light Gray"],
  [/银灰色|银灰/g, "Silver Gray"],
  [/麻灰|花灰/g, "Heather Gray"],
  [/灰色/g, "Gray"],
  [/深棕色|深棕/g, "Dark Brown"],
  [/浅棕色|浅棕/g, "Light Brown"],
  [/奶牛棕/g, "Cow Print Brown"],
  [/棕色/g, "Brown"],
  [/咖啡色|咖啡|啡色/g, "Coffee"],
  [/卡其色|卡其|卡色/g, "Khaki"],
  [/香槟色|香槟/g, "Champagne"],
  [/酒红色|酒红/g, "Wine Red"],
  [/紫红色|紫红/g, "Purplish Red"],
  [/玫红色|玫红|玫粉/g, "Rose Pink"],
  [/粉红色|粉红/g, "Pink"],
  [/浅粉色|浅粉|淡粉色|淡粉/g, "Light Pink"],
  [/深粉色|深粉/g, "Dark Pink"],
  [/豆沙粉/g, "Dusty Pink"],
  [/粉色/g, "Pink"],
  [/桔红色|桔红/g, "Orange Red"],
  [/大红色|大红/g, "Bright Red"],
  [/暗红色|暗红/g, "Dark Red"],
  [/浅红/g, "Light Red"],
  [/红色/g, "Red"],
  [/藏青色|藏青|藏蓝色|藏蓝/g, "Navy Blue"],
  [/深蓝色|深蓝/g, "Dark Blue"],
  [/浅蓝色|浅蓝|淡蓝色|淡蓝/g, "Light Blue"],
  [/天蓝色|天蓝/g, "Sky Blue"],
  [/灰蓝色|灰蓝|灰兰/g, "Gray Blue"],
  [/雾霾蓝/g, "Haze Blue"],
  [/牛仔蓝/g, "Denim Blue"],
  [/宝蓝色|宝蓝/g, "Royal Blue"],
  [/学院蓝/g, "College Blue"],
  [/蓝色/g, "Blue"],
  [/墨绿色|墨绿|深绿色|深绿/g, "Dark Green"],
  [/军绿色|军绿/g, "Army Green"],
  [/薄荷绿/g, "Mint Green"],
  [/牛油果绿/g, "Avocado Green"],
  [/豆沙绿/g, "Sage Green"],
  [/灰绿/g, "Gray Green"],
  [/浅绿色|浅绿/g, "Light Green"],
  [/绿色/g, "Green"],
  [/香芋紫/g, "Taro Purple"],
  [/葡萄紫/g, "Grape Purple"],
  [/浅紫色|浅紫/g, "Light Purple"],
  [/深紫色|深紫/g, "Dark Purple"],
  [/紫色/g, "Purple"],
  [/淡黄色|淡黄|小鸡黄/g, "Light Yellow"],
  [/土黄色|土黄/g, "Ochre Yellow"],
  [/米黄色|米黄/g, "Cream Yellow"],
  [/霓虹黄/g, "Neon Yellow"],
  [/黄色/g, "Yellow"],
  [/浅杏色|浅杏/g, "Light Apricot"],
  [/杏色/g, "Apricot"],
  [/米色/g, "Beige"],
  [/驼色/g, "Camel"],
  [/藕色|藕粉/g, "Lotus Pink"],
  [/橙色|桔色/g, "Orange"],
  [/玫瑰金/g, "Rose Gold"],
  [/金色/g, "Gold"],
  [/银色/g, "Silver"],
  [/黑色/g, "Black"],
  [/白色/g, "White"],
  [/豹纹/g, "Leopard"],
  [/蛇纹/g, "Snake Print"],
  [/棋盘格/g, "Checkerboard"],
  [/荧光橙/g, "Fluorescent Orange"],
  [/荧光绿/g, "Fluorescent Green"],
  [/黑金/g, "Black Gold"],
  [/蓝红色|蓝红/g, "Blue Red"],
  [/灰迷彩|迷彩/g, "Gray Camo"],
  [/黑白色|黑白/g, "Black White"],
  [/三件套/g, " 3-Piece Set"],
  [/两件套/g, " 2-Piece Set"],
  [/大号/g, " Large "],
  [/中号/g, " Medium "],
  [/小号/g, " Small "],
  [/鱼子酱/g, " Caviar "],
  [/油蜡皮/g, " Waxed Leather "],
  [/麂皮/g, " Suede "],
  [/高品质/g, " "],
  [/爬爬服|连体衣/g, " Romper"],
];

const instantTranslateSkuTerm = (raw: string, isColorOption: boolean = false): string => {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (SKU_TERM_DICTIONARY[trimmed]) return SKU_TERM_DICTIONARY[trimmed];

  // Pure numeric option in a Color property (e.g. "0", "1", "2")
  if (isColorOption && /^\d{1,2}$/.test(trimmed)) {
    return `Color Style #${trimmed}`;
  }

  // Handle cup sizes like "36/80A杯" -> "36/80A Cup"
  if (/^\d+\/\d+[A-Za-z]+杯$/.test(trimmed)) {
    return trimmed.replace(/杯$/, " Cup");
  }

  // Handle color-block combinations like "米白色拼黑色" or "黑配棕"
  if (/^[\u4e00-\u9fa5]+[拼配][\u4e00-\u9fa5]+$/.test(trimmed)) {
    const parts = trimmed.split(/[拼配]/);
    if (parts.length === 2) {
      const c1 = SKU_TERM_DICTIONARY[parts[0]] || SKU_TERM_DICTIONARY[`${parts[0]}色`] || parts[0];
      const c2 = SKU_TERM_DICTIONARY[parts[1]] || SKU_TERM_DICTIONARY[`${parts[1]}色`] || parts[1];
      if (!/[\u4e00-\u9fa5]/.test(`${c1}${c2}`)) {
        return `${c1} & ${c2}`;
      }
    }
  }

  // Handle numbered color codes like "16#杏色", "24#灰绿"
  const numCodeMatch = trimmed.match(/^(\d+#)\s*(.+)$/);
  if (numCodeMatch) {
    const prefix = numCodeMatch[1];
    const rest = numCodeMatch[2].trim();
    const mappedRest = SKU_TERM_DICTIONARY[rest] || SKU_TERM_DICTIONARY[`${rest}色`];
    if (mappedRest) return `${prefix} ${mappedRest}`;
  }

  // Apply token-level replacements if the string contains known Chinese color terms
  if (/[\u4e00-\u9fa5]/.test(trimmed)) {
    let working = trimmed
      .replace(/【/g, "[")
      .replace(/】/g, "]")
      .replace(/（/g, " (")
      .replace(/）/g, ")");
    for (const [regex, replacement] of COLOR_TOKEN_REPLACEMENTS) {
      working = working.replace(regex, replacement);
    }
    working = working.replace(/\s+/g, " ").trim();
    if (!/[\u4e00-\u9fa5]/.test(working)) {
      return working.replace(/^\[(.+)\]$/, "$1").trim();
    }
  }

  return trimmed;
};

// Accurate SKU/Variant BDT price resolver ensuring accurate rate and exact variant differences
const calculateVariantBdtPrice = (
  variantItem: any,
  fallbackBasePrice: number,
  rate: number,
  productBasePrice?: number
): number => {
  if (!variantItem) return fallbackBasePrice;
  const currentRate = Number(rate) || 20.90;

  // 1. If explicit priceRmb is present and valid, compute exact BDT price using currentRate
  const rmb = Number(variantItem.priceRmb);
  if (!isNaN(rmb) && rmb > 0) {
    return Number((rmb * currentRate).toFixed(2));
  }

  // 2. If price is in RMB range (<= 120 or decimal or much smaller than productBasePrice)
  const p = Number(variantItem.price);
  if (!isNaN(p) && p > 0) {
    if (p <= 120 || p % 1 !== 0 || (productBasePrice && productBasePrice > p * 5)) {
      return Number((p * currentRate).toFixed(2));
    }
  }

  // 3. If explicit priceBdt is present and valid
  const bdt = Number(variantItem.priceBdt);
  if (!isNaN(bdt) && bdt > 0) {
    return Number(bdt.toFixed(2));
  }

  if (!isNaN(p) && p > 0) {
    return Number(p.toFixed(2));
  }

  return fallbackBasePrice;
};


const RightSidebarContent = ({
  totalQuantity,
  totalPrice,
  partialPaymentPrice,
  fullPaymentDiscountPrice,
  shippingMethod,
  setShippingMethod,
  setShowShippingModal,
  product,
  isInWishlist,
  toggleWishlist,
  handleAddToCart,
  handleBuyNow,
  similarProducts,
  minOrderAmount = 2000,
  rmbRate = 22.80,
  discountPercent = 3,
  onCopyLink,
  onFacebookShare,
  onWhatsAppShare,
  onDownloadImage,
  isCopied
}: any) => (
  <div className="flex flex-col gap-4 w-full">
    {/* Social & Action Share Bar */}
    <div className="flex items-center gap-2 justify-end mb-1">
      <button 
        type="button"
        onClick={onCopyLink}
        title="Copy product link"
        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors bg-white shadow-2xs relative group cursor-pointer"
      >
        {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        {isCopied && (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-0.5 rounded shadow whitespace-nowrap">
            Link copied!
          </span>
        )}
      </button>
      <button 
        type="button"
        onClick={onFacebookShare}
        title="Share on Facebook"
        className="p-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#1877F2]/90 transition-colors shadow-2xs cursor-pointer"
      >
        <Facebook className="w-4 h-4 fill-current text-white" />
      </button>
      <button 
        type="button"
        onClick={onWhatsAppShare}
        title="Share on WhatsApp"
        className="p-2 bg-[#25D366] text-white rounded-lg hover:bg-[#25D366]/90 transition-colors shadow-2xs cursor-pointer"
      >
        <Phone className="w-4 h-4 fill-current text-white" />
      </button>
      <button 
        type="button"
        onClick={onDownloadImage}
        title="Download product photo"
        className="px-3.5 py-2 bg-[#12B8A6] text-white rounded-lg hover:bg-[#0D9488] flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-colors shadow-2xs cursor-pointer"
      >
        <Download className="w-4 h-4" /> Download Photo
      </button>
    </div>

    {/* Order Summary Card */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-base font-bold text-gray-900 pb-3 mb-3 border-b border-gray-100 flex items-center justify-between">
        <span>Order Summary</span>
        <span className="text-xs text-gray-500 font-semibold">{totalQuantity === 0 ? "0" : totalQuantity} Items selected</span>
      </h3>

      <div className="space-y-3 mb-4 text-sm">
        <div className="flex justify-between items-center text-gray-700">
          <span>Total Quantity:</span>
          <span className="font-bold text-gray-900 text-base">{totalQuantity === 0 ? "0" : totalQuantity} pcs</span>
        </div>
        <div className="flex justify-between items-center text-gray-700">
          <span>Subtotal Price:</span>
          <span className="font-bold text-gray-900 text-base">BDT {Math.round(totalPrice).toLocaleString()}</span>
        </div>
        
        {/* Full Payment Discount Row */}
        <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100/80">
          <span className="font-medium text-xs sm:text-sm">Full Pay Discount (-{discountPercent || 3}%):</span>
          <span className="font-bold text-sm sm:text-base text-emerald-700">
            -BDT {Math.round(totalPrice - fullPaymentDiscountPrice).toLocaleString()}
          </span>
        </div>

        {/* 100% Payment Option */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-gray-900 text-sm sm:text-base">Pay Now:</span>
            <span className="font-black text-red-600 text-lg sm:text-xl">
              BDT {Math.round(fullPaymentDiscountPrice).toLocaleString()}
            </span>
          </div>
          <span className="text-xs text-emerald-600 block mt-0.5">Includes {discountPercent || 3}% instant payment discount</span>
        </div>
      </div>

      {/* Minimum Order Warning Alert */}
      {totalQuantity > 0 && totalPrice < minOrderAmount && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 mb-4 text-xs sm:text-sm text-amber-900 shadow-2xs animate-in fade-in">
          <div className="font-bold flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Minimum Order: BDT {minOrderAmount.toLocaleString()}</span>
          </div>
          <p className="mt-1 text-xs text-amber-800 leading-normal">
            Add <strong className="font-bold text-red-600">BDT {(minOrderAmount - totalPrice).toLocaleString()}</strong> more to reach the factory minimum order limit.
          </p>
        </div>
      )}

      {/* Shipping Method Selector */}
      <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/70 mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-gray-800 text-xs sm:text-sm flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-primary" /> Shipping Method
          </span>
          <button 
            type="button"
            onClick={() => setShowShippingModal(true)}
            className="text-red-600 text-xs font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
          >
            Rates & Timeline <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            type="button"
            onClick={() => setShippingMethod('air')}
            className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
              shippingMethod === 'air'
                ? 'bg-white border-red-500 shadow-2xs ring-1 ring-red-500/20'
                : 'bg-white/60 border-gray-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
              <Plane className="w-3 h-3 text-red-600" /> By Air (Express)
            </div>
            <div className="text-xs font-bold text-red-600 mt-0.5">BDT 780-1200/kg</div>
            <div className="text-[10px] text-gray-500">10-15 Days</div>
          </button>

          <button
            type="button"
            onClick={() => setShippingMethod('sea')}
            className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
              shippingMethod === 'sea'
                ? 'bg-white border-red-500 shadow-2xs ring-1 ring-red-500/20'
                : 'bg-white/60 border-gray-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
              <Ship className="w-3 h-3 text-red-600" /> By Sea (Cargo)
            </div>
            <div className="text-xs font-bold text-red-600 mt-0.5">BDT 170-450/kg</div>
            <div className="text-[10px] text-gray-500">30-45 Days</div>
          </button>
        </div>

        <p className="text-[11px] text-gray-500 leading-snug">
          * Shipping charge is calculated based on exact product weight upon arrival at our Dhaka warehouse.
        </p>
      </div>

      {/* Shipping Charge Highlight Card (Red Dashed Border & Red Rate Text) */}
      <div className="border border-dashed border-red-500 rounded-xl p-3 bg-red-50/20 mb-4 relative">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-red-600" /> Shipping Charge
          </h4>
          <button 
            type="button"
            onClick={() => setShowShippingModal(true)}
            className="text-red-600 text-xs font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
          >
            Details <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        <p className="text-red-600 font-extrabold text-sm sm:text-base tracking-wide">
          {shippingMethod === 'air' ? 'BDT 780 / BDT 1,200 Per Kg' : 'BDT 170 / BDT 450 Per Kg'}
        </p>
        <p className="text-[10px] text-gray-500 mt-1.5 leading-tight">
          *** The stated product weight is an estimate. The actual shipping charge will be calculated by weighing the product upon arrival in Bangladesh.
        </p>
      </div>

      {/* Action Buttons - Removed as per user request */}
      {/* 
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => product && toggleWishlist(product)}
          className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            product && (isInWishlist(product.id) || (product.offerId && isInWishlist(product.offerId)))
              ? "bg-red-50 border-red-200 text-red-500"
              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
          title={product && isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-5 h-5 ${product && (isInWishlist(product.id) || (product.offerId && isInWishlist(product.offerId))) ? "fill-red-500 text-red-500" : ""}`} />
        </button>
        <button 
          onClick={handleAddToCart}
          className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-bold rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-98"
        >
          <ShoppingCart className="w-4 h-4" /> Add to Cart
        </button>
        <button 
          onClick={handleBuyNow}
          className="flex-1 h-12 bg-[#00A859] hover:bg-[#008f4c] text-white text-sm sm:text-base font-bold rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-98"
        >
          <Check className="w-4 h-4" /> Buy Now
        </button>
      </div> 
      */}

      {/* Trust Badges */}
      <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>100% Verified QC</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Doorstep Delivery</span>
        </div>
      </div>
    </div>

    {/* Suggestions Card */}
    {similarProducts && similarProducts.length > 0 && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-sm text-charcoal mb-3">Similar Wholesale Products</h3>
        <div className="space-y-3">
          {similarProducts.slice(0, 5).map((simProd: any, sIdx: number) => (
            <Link key={`${simProd.id || 'sim'}-${sIdx}`} to={getProductPath(simProd)} className="flex gap-3 group items-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                <img src={getSafeImageUrl(simProd.image, undefined, cleanEnglishTitle(simProd.name, simProd.category))} alt={cleanEnglishTitle(simProd.name, simProd.category)} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform" />
              </div>
              <div className="flex flex-col justify-between py-0.5 min-w-0 flex-1">
                <h4 className="text-xs text-gray-700 font-semibold line-clamp-2 leading-tight group-hover:text-[#12B8A6] transition-colors">
                  {cleanEnglishTitle(simProd.name, simProd.category)}
                </h4>
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-red-600">BDT {simProd.price}</span>
                    {simProd.originalPrice && <span className="text-[10px] text-gray-400 line-through">BDT {simProd.originalPrice}</span>}
                  </div>
                  {simProd.soldDisplay && <span className="text-[10px] text-[#12B8A6] font-medium">{simProd.soldDisplay}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )}
  </div>
);



const formatSpecs = (prod: any): { name: string; value: string }[] => {
  if (!prod) return [];
  const raw = prod.specifications || prod.specs;
  if (!raw) return [];
  let list: { name: string; value: string }[] = [];
  if (Array.isArray(raw)) {
    raw.forEach((item: any) => {
      if (!item) return;
      if (typeof item === "string") {
        list.push({ name: "Feature", value: item });
        return;
      }
      const name = String(item.name || item.key || item.label || "").trim();
      let val = item.value !== undefined ? item.value : (item.val || "");
      if (typeof val === "object" && val !== null) val = JSON.stringify(val);
      const value = String(val || "").trim();
      if (name && value && value !== ":{\"" && value !== ":{" && value !== "{") {
        list.push({ name, value });
      }
    });
  } else if (typeof raw === "object") {
    Object.entries(raw).forEach(([k, v]) => {
      const name = String(k || "").trim();
      let val = v;
      if (typeof val === "object" && val !== null) val = JSON.stringify(val);
      const value = String(val || "").trim();
      if (name && value && value !== ":{\"" && value !== ":{" && value !== "{") {
        list.push({ name, value });
      }
    });
  }
  return list;
};

const getFallbackCategorySpecs = (category: string = ""): { name: string; value: string }[] => {
  const cat = category.toLowerCase();
  if (cat.includes("cloth") || cat.includes("t-shirt") || cat.includes("shirt") || cat.includes("dress") || cat.includes("men") || cat.includes("women")) {
    return [
      { name: "Fabric Composition", value: "100% High-Grade Combed Cotton" },
      { name: "Sleeve & Cut", value: "Standard Regular Fit with Ribbed Detailing" },
      { name: "Quality Standard", value: "100% Pre-Shipment Factory Inspected" },
      { name: "Country of Origin", value: "Guangdong, China (Verified Direct Factory)" },
      { name: "Care Instructions", value: "Machine Wash Cold, Tumble Dry Low" }
    ];
  }
  if (cat.includes("bag") || cat.includes("backpack") || cat.includes("luggage")) {
    return [
      { name: "Material", value: "High-Density Waterproof Oxford Nylon" },
      { name: "Capacity", value: "Multi-compartment Ergonomic Storage" },
      { name: "Closure Type", value: "Reinforced Dual Smooth Zippers" },
      { name: "Quality Standard", value: "100% Pre-Shipment Factory Inspected" },
      { name: "Country of Origin", value: "Guangzhou, China (Direct Wholesale)" }
    ];
  }
  if (cat.includes("shoe") || cat.includes("sneaker") || cat.includes("footwear")) {
    return [
      { name: "Upper Material", value: "Breathable Mesh / Premium Synthetic Leather" },
      { name: "Sole Material", value: "Non-slip Wear-resistant Natural Rubber" },
      { name: "Insole", value: "Cushioned Shock-Absorbing Comfort EVA" },
      { name: "Quality Standard", value: "100% Pre-Shipment Factory Inspected" },
      { name: "Country of Origin", value: "Zhejiang / Guangdong, China" }
    ];
  }
  return [
    { name: "Quality Standard", value: "100% Pre-Shipment Factory Inspected" },
    { name: "Packaging", value: "Export Standard Protective Sealed Package" },
    { name: "Country of Origin", value: "China (Direct Wholesale Factory)" },
    { name: "Supply Type", value: "Direct Manufacturer Ready Stock" }
  ];
};

export default function ProductDetails() {
  const { id: rawId } = useParams();
  const id = getCleanProductCode(rawId);
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [showSellerStoreModal, setShowSellerStoreModal] = useState(false);
  const [showSimilarInline, setShowSimilarInline] = useState(false);
  const [sellerStoreSearch, setSellerStoreSearch] = useState("");
  const sellerStoreSectionRef = useRef<HTMLDivElement>(null);
  const inlineSellerStoreRef = useRef<HTMLDivElement>(null);

  const filteredSimilarProducts = useMemo(() => {
    if (!sellerStoreSearch.trim()) return similarProducts;
    const q = sellerStoreSearch.toLowerCase().trim();
    return similarProducts.filter((p: Product) => {
      const name = (p.name || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      return name.includes(q) || cat.includes(q) || brand.includes(q);
    });
  }, [similarProducts, sellerStoreSearch]);

  const handleVisitSellerStore = (openModal = false) => {
    setShowSimilarInline(true);
    if (openModal) {
      setShowSellerStoreModal(true);
    } else {
      setTimeout(() => {
        if (inlineSellerStoreRef.current) {
          inlineSellerStoreRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (sellerStoreSectionRef.current) {
          sellerStoreSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  
  const [shippingMethod, setShippingMethod] = useState<'air' | 'sea'>('air');
  const [showShippingInfo, setShowShippingInfo] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [variantImageOverride, setVariantImageOverride] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews' | 'seller'>('desc');
  const [specSearchQuery, setSpecSearchQuery] = useState("");
  const [shippingCalcWeight, setShippingCalcWeight] = useState<number>(1);
  const [shippingCalcCategory, setShippingCalcCategory] = useState<'standard' | 'sensitive' | 'apparel' | 'cosmetics' | 'watch' | 'battery' | 'food' | 'sunglasses'>('standard');
  const [shippingSubTab, setShippingSubTab] = useState<'all' | 'rates' | 'calculator' | 'process' | 'volumetric' | 'faq'>('all');
  const [shippingCalcMethod, setShippingCalcMethod] = useState<'air' | 'sea'>('air');
  const [shippingCalcDestination, setShippingCalcDestination] = useState<'dhaka' | 'outside'>('dhaka');
  const [volLength, setVolLength] = useState<number>(30);
  const [volWidth, setVolWidth] = useState<number>(20);
  const [volHeight, setVolHeight] = useState<number>(15);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewDistrict, setNewReviewDistrict] = useState("Dhaka");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");
  const [userReviews, setUserReviews] = useState<{ id: string; author: string; district: string; rating: number; date: string; comment: string; verified: boolean; helpfulCount: number }[]>([
    {
      id: "rev-1",
      author: "Tanvir Ahmed",
      district: "Dhaka (Mirpur)",
      rating: 5,
      date: "3 days ago",
      comment: "Product arrived directly from China factory in pristine condition. 100% authentic quality and export packaging was thoroughly secured. Air freight arrived in just 8 days.",
      verified: true,
      helpfulCount: 14
    },
    {
      id: "rev-2",
      author: "Rafiqul Islam",
      district: "Chittagong (GEC)",
      rating: 5,
      date: "1 week ago",
      comment: "Ordered 50 pieces for wholesale stock. Every piece was intact with zero defects. No customs or duty hassle, straightforward door-to-door delivery.",
      verified: true,
      helpfulCount: 9
    },
    {
      id: "rev-3",
      author: "Md. Ariful Haque",
      district: "Rajshahi",
      rating: 4,
      date: "2 weeks ago",
      comment: "Material finishing is high-grade. Real inspection photos were provided from Guangzhou warehouse before air freight dispatch.",
      verified: true,
      helpfulCount: 6
    },
    {
      id: "rev-4",
      author: "Farhana Yasmin",
      district: "Sylhet",
      rating: 5,
      date: "3 weeks ago",
      comment: "World Buy BD makes direct overseas procurement seamless. Accurate weight-based billing with zero hidden commissions.",
      verified: true,
      helpfulCount: 11
    }
  ]);
  
  const [variantSearchQuery, setVariantSearchQuery] = useState("");
  const [variantFilterMode, setVariantFilterMode] = useState<'all' | 'selected'>('all');
  
  // Translation state
  const [translatedTitle, setTranslatedTitle] = useState<string>("");
  const [translatedProps, setTranslatedProps] = useState<any>(null);
  const [translatedSpecs, setTranslatedSpecs] = useState<any>(null);
  
  // Format specifications with validation and category fallbacks
  const specsList = useMemo(() => {
    const rawSpecs = formatSpecs(product);
    return rawSpecs.length >= 3 
      ? rawSpecs 
      : [...rawSpecs, ...getFallbackCategorySpecs(product?.category).filter(fb => !rawSpecs.some(r => r.name.toLowerCase() === fb.name.toLowerCase()))];
  }, [product]);

  const [isTranslating, setIsTranslating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const displayTitle = translatedTitle || cleanEnglishTitle(product?.name, product?.category);

  // Quantity and variant selection state
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(0);
  const [variantQuantities, setVariantQuantities] = useState<Record<string, { quantity: number, price: number, skuName: string, skuId: string, image?: string, primaryOptionKey?: string }>>({});
  const [minOrderAmount, setMinOrderAmount] = useState<number>(2000);
  const [rmbRate, setRmbRate] = useState<number>(22.80);
  const [discountPercent, setDiscountPercent] = useState<number>(3);
  const [showMinOrderModal, setShowMinOrderModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 100% Full-Screen width and 100% Zoom Inspector states
  const [isFullWidth, setIsFullWidth] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('wb_product_fullwidth');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [zoomModalOpen, setZoomModalOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [imageRotation, setImageRotation] = useState<number>(0);



  const toggleFullWidth = () => {
    setIsFullWidth(prev => {
      const next = !prev;
      try { localStorage.setItem('wb_product_fullwidth', String(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    cachedFetchJson<any>("/api/settings")
      .then((data) => {
        if (data) {
          if (data.minOrderAmount) {
            setMinOrderAmount(Number(data.minOrderAmount));
          }
          if (data.rmbRate) {
            setRmbRate(Number(data.rmbRate));
          }
          if (data.globalDiscount !== undefined) {
            setDiscountPercent(Number(data.globalDiscount));
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setQuantity(1);
    setVariantQuantities({});
    setSelectedOptions({});
    setSelectedImage(0);
    setVariantImageOverride(null);
    setTranslatedTitle("");
    setTranslatedProps(null);
    setTranslatedSpecs(null);

    const applyInitialProductState = (prodData: any) => {
      if (!prodData) return;
      if (
        (Array.isArray(prodData.variants) && (prodData.variants.length > 0 || prodData.variantsEdited)) ||
        (Array.isArray(prodData.skuDetails?.variants) && prodData.skuDetails.variants.length > 0)
      ) {
        prodData.skuDetails = syncSkuDetailsWithVariants(
          prodData.skuDetails,
          prodData.variants,
          Boolean(prodData.variantsEdited)
        );
      }

      const primaryProp = prodData.skuDetails?.properties?.[0];
      const primaryVals = Array.isArray(primaryProp?.values) ? primaryProp.values : [];
      const firstGalleryImg = (Array.isArray(prodData.images) && prodData.images[0]) || prodData.image || "";

      if (primaryProp && primaryVals.length > 0) {
        const primaryPropKey = primaryProp.originalName || primaryProp.name || "primary";
        // Check if images[0] matches one of the color swatches directly
        let matchColorIdx = firstGalleryImg
          ? primaryVals.findIndex(
              (v: any) =>
                v?.imageUrl &&
                isSameImageUrl(v.imageUrl, firstGalleryImg)
            )
          : -1;

        // If not directly found, check if any variant matching firstGalleryImg identifies the color
        if (matchColorIdx < 0 && firstGalleryImg && Array.isArray(prodData.skuDetails?.variants)) {
          const matchedVariant = prodData.skuDetails.variants.find(
            (sv: any) => sv?.imageUrl && isSameImageUrl(sv.imageUrl, firstGalleryImg)
          );
          if (matchedVariant) {
            matchColorIdx = primaryVals.findIndex(
              (v: any) =>
                (v?.skuId && (v.skuId === matchedVariant.skuId || v.skuId === matchedVariant.variantId)) ||
                (v?.originalName && matchedVariant.specs?.includes(v.originalName)) ||
                (v?.name && matchedVariant.specs?.includes(v.name))
            );
          }
        }

        if (matchColorIdx >= 0) {
          const matchedVal = primaryVals[matchColorIdx];
          const optKey = String(matchedVal?.originalName || matchedVal?.name || `opt-${matchColorIdx}`);
          setSelectedOptions({
            [primaryPropKey]: optKey,
            [primaryProp.name]: optKey,
          });
          const safeColorImg = matchedVal?.imageUrl ? getSafeImageUrl(matchedVal.imageUrl, prodData.image) : null;
          setVariantImageOverride(safeColorImg);
        } else {
          const firstVal = primaryVals[0];
          const optKey = String(firstVal?.originalName || firstVal?.name || "opt-0");
          setSelectedOptions({
            [primaryPropKey]: optKey,
            [primaryProp.name]: optKey,
          });
          if (firstVal?.imageUrl) {
            setVariantImageOverride(getSafeImageUrl(firstVal.imageUrl, prodData.image));
          }
        }
      }

      setProduct(prodData);
      setLoading(false);

      const canonicalPath = getProductPath(prodData);
      if (typeof window !== "undefined" && window.location.pathname !== canonicalPath) {
        window.history.replaceState(null, "", canonicalPath + window.location.search);
      }
    };

    const productEndpoint = `/api/products/${id}`;
    const syncHit = getSyncCached<Product>(productEndpoint);
    if (syncHit && !(syncHit as any).error) {
      applyInitialProductState(syncHit);
    } else {
      setLoading(true);
    }

    cachedFetchJson<any>(productEndpoint)
      .then((data) => {
        if (data && data.error) {
          console.error("API returned error:", data.error);
          setProduct(null);
          setLoading(false);
        } else {
          applyInitialProductState(data);

          // Resolve similar products immediately from memory cache if available, or fetch lightweight filtered slice
          const cachedCatalog = getSyncCached<Product[]>("/api/products");
          if (Array.isArray(cachedCatalog) && cachedCatalog.length > 0) {
            const sameCat = cachedCatalog.filter(
              (p: Product) => matchesCategory(p.category, data.category) && p.id !== data.id && (p.status === "published" || !p.status)
            );
            const others = cachedCatalog.filter(
              (p: Product) => p.id !== data.id && (p.status === "published" || !p.status) && !sameCat.some(sc => sc.id === p.id)
            );
            setSimilarProducts([...sameCat, ...others].slice(0, 24));
          } else {
            cachedFetchJson<Product[]>(
              `/api/products?category=${encodeURIComponent(data.category || "")}&exclude=${encodeURIComponent(data.id || "")}&limit=24`
            )
              .then((sim) => {
                const list = Array.isArray(sim) ? sim : [];
                if (list.length >= 8) {
                  setSimilarProducts(list);
                } else {
                  cachedFetchJson<Product[]>("/api/products?limit=24")
                    .then((all) => {
                      if (Array.isArray(all)) {
                        const existingIds = new Set(list.map(p => p.id));
                        const extra = all.filter((p: Product) => p.id !== data.id && !existingIds.has(p.id));
                        setSimilarProducts([...list, ...extra].slice(0, 24));
                      } else {
                        setSimilarProducts(list);
                      }
                    })
                    .catch(() => {
                      setSimilarProducts(list);
                    });
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setProduct(null);
        setLoading(false);
      });
  }, [id]);
  
  
  useEffect(() => {
    let cancelled = false;
    const autoTranslate = async () => {
      if (!product) return;
      
      const containsChinese = /[\u4e00-\u9fa5]/;
      const tasks: Promise<void>[] = [];
      
      // 1. Auto translate title if it has Chinese
      if (containsChinese.test(product.name)) {
        tasks.push(
          translateText(product.name)
            .then((title) => {
              if (!cancelled && title) setTranslatedTitle(title);
            })
            .catch(() => {})
        );
      }

      // 2. Auto translate SKU options in parallel (with instant dictionary pre-fill)
      if (product.skuDetails && product.skuDetails.properties) {
        const props = product.skuDetails.properties;
        const preTranslatedProps = JSON.parse(JSON.stringify(props));
        const pendingItems: Array<{ targetObj: any; text: string }> = [];

        preTranslatedProps.forEach((p: any, pIdx: number) => {
          p.originalName = p.originalName || p.name;
          p.name = instantTranslateSkuTerm(p.name, false);
          if (containsChinese.test(p.name)) {
            pendingItems.push({ targetObj: p, text: p.name });
          }
          p.values.forEach((v: any) => {
            v.originalName = v.originalName || v.name;
            v.name = instantTranslateSkuTerm(v.name, pIdx === 0);
            if (containsChinese.test(v.name)) {
              pendingItems.push({ targetObj: v, text: v.name });
            }
          });
        });

        setTranslatedProps(preTranslatedProps);

        if (pendingItems.length > 0) {
          tasks.push(
            translateText(pendingItems.map((item) => item.text).join("\n"))
              .then((translatedJoined) => {
                if (cancelled) return;
                const translatedArray = translatedJoined.split("\n").map((s) => s.trim());
                pendingItems.forEach((item, idx) => {
                  if (translatedArray[idx]) {
                    item.targetObj.name = translatedArray[idx];
                  }
                });
                setTranslatedProps(JSON.parse(JSON.stringify(preTranslatedProps)));
              })
              .catch(() => {})
          );
        }
      }

      // 3. Auto translate Specs in parallel
      if (specsList && specsList.length > 0) {
        let specsNeedsTranslation = false;
        const specsTexts: string[] = [];
        specsList.forEach((s: any) => {
          const sName = String(s.name || "");
          const sVal = String(s.value || "");
          if (containsChinese.test(sName) || containsChinese.test(sVal)) specsNeedsTranslation = true;
          specsTexts.push(sName);
          specsTexts.push(sVal);
        });

        if (specsNeedsTranslation) {
          tasks.push(
            translateText(specsTexts.join(" | "))
              .then((translatedSpecsJoined) => {
                if (cancelled) return;
                const translatedSpecsArray = translatedSpecsJoined.split("|").map((s) => s.trim());
                const newSpecs = specsList.map((s: any, idx: number) => ({
                  originalName: s.name,
                  originalValue: s.value,
                  name: translatedSpecsArray[idx * 2] || s.name,
                  value: translatedSpecsArray[idx * 2 + 1] || s.value
                }));
                setTranslatedSpecs(newSpecs);
              })
              .catch(() => {
                if (!cancelled) setTranslatedSpecs(specsList);
              })
          );
        } else {
          setTranslatedSpecs(specsList);
        }
      }

      if (tasks.length > 0) {
        setIsTranslating(true);
        await Promise.all(tasks);
      }
      if (!cancelled) {
        setIsTranslating(false);
      }
    };

    autoTranslate();
    return () => {
      cancelled = true;
    };
  }, [product?.id]);


  const currentRate = Number(rmbRate) || 22.80;
  const productRmb = Number(product?.rmbPrice) || 
      product?.skuDetails?.variants?.find((v: any) => v && typeof v.price === 'number' && v.price > 0 && v.price < 500)?.price || 
      (product?.price ? Number((product.price / currentRate).toFixed(2)) : 0);

  const basePrice = productRmb > 0 
      ? Math.round(productRmb * currentRate)
      : Math.round(Number(product?.price) || 0);

  const hasRichSkus = product?.skuDetails && (translatedProps || product.skuDetails.properties) && product.skuDetails.variants;

  const { activeVariant, displayVariants } = useMemo(() => {
    let activeVar = product ? { id: 'default', name: 'Default', price: basePrice, stock: product.stock || 100, image: product.image } : { id: 'default', name: 'Default', price: basePrice, stock: 100, image: '' };
    let displayVars: any[] = [];
    
    if (hasRichSkus) {
      const properties = (translatedProps || product.skuDetails.properties);
      const variantsList = product.skuDetails.variants;
      
      const selectedOriginalValues = properties.map((p: any) => {
        const pKey = p.originalName || p.name;
        const currentSelected = selectedOptions[pKey] || selectedOptions[p.name] || p.values[0]?.originalName || p.values[0]?.name;
        const valObj = p.values.find((v: any, idx: number) => 
          String(v.originalName || v.name || `opt-${idx}`) === currentSelected ||
          v.name === currentSelected || 
          v.originalName === currentSelected || 
          v.cleanName === currentSelected
        );
        return valObj || currentSelected || p.values[0];
      });
      
      const matchedSku = findMatchingSku(variantsList, selectedOriginalValues, properties, true);
      
      const selectedValues = selectedOriginalValues.map((vObj: any) => (typeof vObj === 'object' ? (vObj?.cleanName || vObj?.name) : vObj));
      const specString = selectedValues.filter(Boolean).join(' - ');

      const matchedVarItem = product.variants?.find((pv: any) => 
        (matchedSku && (pv.skuId === matchedSku.skuId || pv.variantId === matchedSku.skuId)) ||
        (selectedOriginalValues[0]?.skuId && pv.skuId === selectedOriginalValues[0]?.skuId) ||
        (pv.name && specString && (pv.name === specString || pv.name.includes(specString) || specString.includes(pv.name))) ||
        (selectedOriginalValues[0]?.originalName && pv.name && (pv.name === selectedOriginalValues[0].originalName || pv.name.includes(selectedOriginalValues[0].originalName)))
      );
      
      if (matchedSku || matchedVarItem) {
        const targetObj = matchedVarItem || matchedSku;
        const skuPrice = calculateVariantBdtPrice(targetObj, basePrice, currentRate, product.price);
        
        activeVar = {
          id: matchedSku?.skuId || matchedVarItem?.skuId || matchedVarItem?.variantId || 'default',
          name: specString.replace(/&gt;/g, ' - ').replace(/&amp;/g, '&') || matchedVarItem?.name || 'Selected Option',
          price: skuPrice,
          stock: matchedSku?.stock ?? matchedVarItem?.stock ?? product.stock ?? 100,
          image: matchedSku?.imageUrl || matchedVarItem?.imageUrl || matchedVarItem?.image || product.image
        };
      } else {
         activeVar = {
           id: 'default',
           name: 'Select options',
           price: basePrice,
           stock: product.stock || 100,
           image: product.image
         };
      }
      
      if (properties.length > 0) {
        displayVars = properties[0].values.map((v: any, i: number) => {
          const matchedVariant = variantsList?.find((sv: any) => findMatchingSku([sv], [v], properties) && sv.imageUrl);
          const matchedVar = product.variants?.find((pv: any) => 
            (matchedVariant && (pv.skuId === matchedVariant.skuId || pv.variantId === matchedVariant.skuId)) ||
            (v.skuId && pv.skuId === v.skuId) ||
            pv.name === v.name ||
            pv.name === v.originalName
          );
          const img = v.imageUrl || matchedVariant?.imageUrl || matchedVar?.imageUrl || matchedVar?.image || (product.images && product.images[i]) || product.image;
          const targetObj = matchedVar || matchedVariant || v;
          const vPrice = calculateVariantBdtPrice(targetObj, basePrice, currentRate, product.price);
          
          return {
            id: v.name,
            skuId: matchedVariant?.skuId || matchedVar?.skuId || v.skuId || v.name,
            name: v.name,
            cleanName: v.cleanName || v.name,
            originalName: v.originalName || v.name,
            price: vPrice,
            stock: matchedVariant?.stock ?? matchedVar?.stock ?? v.stock ?? 100,
            image: getSafeImageUrl(img, product.image, `${cleanEnglishTitle(product.name, product.category)} - ${v.cleanName || v.name}`),
            isProperty: true,
            propName: properties[0].name
          };
        });
      }
    } else {
      if (product?.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        displayVars = product.variants.map((v: any, i: number) => {
          const vPrice = calculateVariantBdtPrice(v, basePrice, currentRate, product.price);
          const rawVid = String(v.id || v.skuId || v.variantId || `var-${i + 1}`);
          const vid = `var-${i + 1}-${rawVid}`;
          return {
            id: vid,
            skuId: v.skuId || v.variantId || vid,
            name: v.name || v.color || `Style ${i + 1}`,
            price: vPrice,
            stock: typeof v.stock === 'number' ? v.stock : 100,
            image: getSafeImageUrl(v.imageUrl || v.image || (product.images && product.images[i]) || product.image, product.image, `${cleanEnglishTitle(product.name, product.category)} - ${v.name || v.color || `Style ${i + 1}`}`)
          };
        });
      } else {
        const getDescriptiveOptionName = (idx: number, cat: string = "") => {
          const c = (cat || "").toLowerCase();
          if (c.includes("electr") || c.includes("gadget") || c.includes("game") || c.includes("phone")) {
            const names = ["Classic Black Edition", "Dual Tone Edition", "Glacier White Edition", "Pro Gaming Edition", "Compact Edition", "Special Edition"];
            return names[idx] || `Style ${idx + 1}`;
          }
          if (c.includes("cloth") || c.includes("shirt") || c.includes("t-shirt") || c.includes("dress") || c.includes("pant")) {
            const names = ["Color Style 1", "Color Style 2", "Color Style 3", "Color Style 4", "Color Style 5"];
            return names[idx] || `Color ${idx + 1}`;
          }
          if (c.includes("bag") || c.includes("shoe") || c.includes("footwear")) {
            const names = ["Black / Standard Style", "Grey / Contrast Style", "Navy / Accent Style", "Special Edition"];
            return names[idx] || `Style ${idx + 1}`;
          }
          return `Style / Option ${idx + 1}`;
        };

        const colorList = (product?.images && product.images.length > 1 && !(product as any)?.variantsEdited)
          ? product.images.map((im, i) => ({ name: getDescriptiveOptionName(i, product.category), diff: 0, image: im }))
          : [
              { name: "Standard Option", diff: 0, image: product?.image },
            ];
        
        displayVars = colorList.map((c, i) => ({
          id: `var-${i + 1}`,
          name: c.name,
          price: Math.max(1, basePrice + (c.diff || 0)),
          stock: product?.stock ? Math.max(10, product.stock - (i * 15)) : 150,
          image: getSafeImageUrl(c.image || product?.image, product?.image, `${cleanEnglishTitle(product?.name || "", product?.category)} - ${c.name}`)
        }));
      }
      const matchedFallbackVar = displayVars.find((dv: any) => dv.id === selectedVariantId) || displayVars[0];
      if (matchedFallbackVar) {
        activeVar = matchedFallbackVar;
      }
    }
    return { activeVariant: activeVar, displayVariants: displayVars, price: activeVar.price };
  }, [product, selectedOptions, selectedVariantId, rmbRate, translatedProps, basePrice, currentRate]);

  // Dynamic price range calculation across all variants for accurate low/high display
  const allVariantPrices = (() => {
    if (!product) return [0];
    const base = basePrice;
    const rate = currentRate;
    const list: any[] = (product.variants && product.variants.length > 0)
      ? product.variants
      : (product.skuDetails?.variants || []);
    
    const prices = list
      .map((v: any) => calculateVariantBdtPrice(v, base, rate, product.price))
      .filter((p: number) => !isNaN(p) && p > 0);
    
    return prices.length > 0 ? prices : [base];
  })();

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }


  if (!product) {
    return (
      <div className="container mx-auto px-4 py-32 text-center text-charcoal">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Link to="/shop" className="text-primary hover:underline">Return to Shop</Link>
      </div>
    );
  }
  const variants = displayVariants;
  const currentItemPrice = activeVariant.price;
  
  const minVariantPrice = Math.min(...allVariantPrices);
  const maxVariantPrice = Math.max(...allVariantPrices);
  const hasDynamicPriceRange = maxVariantPrice > minVariantPrice;
  
  const hasVariantsSelected = Object.keys(variantQuantities).length > 0;
  
  const totalQuantity: number = hasVariantsSelected 
    ? (Object.values(variantQuantities) as any[]).reduce((acc: number, v: any) => acc + v.quantity, 0)
    : (quantity || 0);

  // Wholesale Price Tiers (matching wholesale tier model)
  // ONLY products that actually have quantityPrices with at least 2 tiers have tier pricing!
  const hasTierPricing: boolean = Boolean(
    product.quantityPrices && 
    Array.isArray(product.quantityPrices) && 
    product.quantityPrices.length > 1
  );

  const effectiveQuantityPrices = (() => {
    if (!product.quantityPrices || !Array.isArray(product.quantityPrices) || product.quantityPrices.length < 2) {
      return [];
    }

    const rawTiers = product.quantityPrices as any[];
    const parsedTiers: Array<{
      quantityMin: number;
      quantityMax?: number;
      price: number;
      rmbPrice?: number;
      quantityRange?: string;
    }> = [];

    const moq = Math.max(1, Number(product.minOrderQuantity) || 1);

    for (let i = 0; i < rawTiers.length; i++) {
      const t = rawTiers[i];
      if (!t) continue;

      let rawMin = t.quantityMin ?? t.minQty ?? t.minOrderQuantity ?? t.beginAmount ?? t.amount ?? t.min;
      let rawMax = t.quantityMax ?? t.maxQty ?? t.endAmount ?? t.max;

      // Extract numbers from quantityRange if present (e.g. "1-5件", "≥6件", "2-9", "10+")
      if (t.quantityRange && typeof t.quantityRange === 'string') {
        const cleaned = t.quantityRange.replace(/[件副套个\s]/g, '');
        const rangeMatch = cleaned.match(/(\d+)\s*[-~至到]\s*(\d+)/);
        const geMatch = cleaned.match(/[≥>=+]?\s*(\d+)\s*[+以上]?/);
        if (rangeMatch) {
          if (rawMin === undefined || rawMin === null || isNaN(Number(rawMin))) {
            rawMin = parseInt(rangeMatch[1], 10);
          }
          if (rawMax === undefined || rawMax === null || isNaN(Number(rawMax))) {
            rawMax = parseInt(rangeMatch[2], 10);
          }
        } else if (geMatch) {
          if (rawMin === undefined || rawMin === null || isNaN(Number(rawMin))) {
            rawMin = parseInt(geMatch[1], 10);
          }
        }
      }

      let min = Number(rawMin);
      if (isNaN(min) || min <= 0) {
        min = i === 0 ? moq : (i === 1 ? Math.max(moq * 5 + 1, 5) : Math.max(moq * 20 + 1, 20));
      }

      const max = rawMax !== undefined && rawMax !== null && !isNaN(Number(rawMax)) ? Number(rawMax) : undefined;

      const tierRmb = Number(t.rmbPrice) || (t.price ? Number((t.price / (rmbRate || 22.80)).toFixed(2)) : productRmb);
      const tierPrice = tierRmb > 0 
        ? Math.round(tierRmb * (rmbRate || 22.80))
        : (Number(t.price) || activeVariant.price);

      parsedTiers.push({
        quantityMin: min,
        quantityMax: max,
        price: tierPrice,
        rmbPrice: tierRmb,
        quantityRange: t.quantityRange
      });
    }

    // Strictly ensure ascending minimums so Tier 2 never duplicates Tier 1 minimum!
    for (let i = 0; i < parsedTiers.length; i++) {
      if (i > 0) {
        const prev = parsedTiers[i - 1];
        if (parsedTiers[i].quantityMin <= prev.quantityMin) {
          const step = i === 1 ? Math.max(moq * 5, 5) : Math.max(moq * 15, 20);
          parsedTiers[i].quantityMin = prev.quantityMin + step;
        }
        if (!prev.quantityMax || prev.quantityMax >= parsedTiers[i].quantityMin) {
          prev.quantityMax = parsedTiers[i].quantityMin - 1;
        }
      }
    }

    return parsedTiers;
  })();

  let bulkMultiplier = 1;
  const firstTierPrice = effectiveQuantityPrices[0]?.price || 1;
  let activeTierPrice = firstTierPrice;
  let activeTierIndex = -1;

  if (hasTierPricing && effectiveQuantityPrices.length > 0) {
    activeTierIndex = 0;
    for (let i = 0; i < effectiveQuantityPrices.length; i++) {
      const tier = effectiveQuantityPrices[i];
      if (totalQuantity >= tier.quantityMin) {
        activeTierPrice = tier.price;
        activeTierIndex = i;
      }
    }
    bulkMultiplier = activeTierPrice / firstTierPrice;
  }
  
  const nextTier = effectiveQuantityPrices.find(t => t.quantityMin > totalQuantity);
  const nextTierMin = nextTier?.quantityMin;
    
  const totalPrice: number = hasVariantsSelected
    ? (Object.values(variantQuantities) as any[]).reduce((acc: number, v: any) => acc + (v.quantity * v.price * bulkMultiplier), 0)
    : Number((currentItemPrice * (quantity || 1)).toFixed(2));

  const updateQuantity = (change: number) => {
    setQuantity(prev => {
      const newVal = prev + change;
      if (newVal < 0) return 0;
      if (newVal > activeVariant.stock) return activeVariant.stock;
      return newVal;
    });
  };

  // Custom Payment Calculations Based on Request
  // 100% Payment: Total - discountPercent => Total * (1 - discountPercent / 100)
  // 80% Payment: 80% of Total
  const discountMultiplier = Math.max(0, 1 - (discountPercent / 100));
  const fullPaymentDiscountPrice = totalPrice > 0 ? totalPrice * discountMultiplier : 0;
  const partialPaymentPrice = totalPrice > 0 ? totalPrice * 0.8 : 0;

  const rmbPrice = productRmb > 0 ? productRmb : Number((currentItemPrice / (rmbRate || 22.80)).toFixed(2)); 

  const autoAdjustToMinOrder = () => {
    if (hasVariantsSelected) {
      const entries = Object.entries(variantQuantities) as [string, { quantity: number, price: number, skuName: string, skuId: string }][];
      if (entries.length > 0) {
        const [firstKey, firstVal] = entries[0];
        const otherSum = entries.slice(1).reduce((acc: number, [, val]) => acc + (val.quantity * val.price), 0);
        const remainingNeeded = Math.max(0, minOrderAmount - otherSum);
        const newQty = Math.max(1, Math.ceil(remainingNeeded / Math.max(1, firstVal.price)));
        setVariantQuantities(prev => ({
          ...prev,
          [firstKey]: { ...firstVal, quantity: newQty }
        }));
      }
    } else {
      const pricePerItem = Math.max(1, currentItemPrice);
      const neededQty = Math.max(1, Math.ceil(minOrderAmount / pricePerItem));
      setQuantity(neededQty);
    }
    setShowMinOrderModal(false);
  };

  const officialProductUrl = getFullProductUrl(product || id);
  const cleanProductCode = getCleanProductCode(product || id);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(officialProductUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(officialProductUrl)}`;
    window.open(url, "_blank", "width=600,height=500");
  };

  const handleWhatsAppShare = () => {
    const title = displayTitle;
    const text = `${title} - World Buy BD: ${officialProductUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const images = (product && product.images && product.images.length > 0) ? product.images : (product ? [product.image] : []);
  const displayImage = variantImageOverride || images[selectedImage];
  const activeImageDownloadName =
    activeVariant?.name &&
    activeVariant.name !== "Default Option" &&
    activeVariant.name !== "Select options" &&
    activeVariant.name !== "Standard Option"
      ? `${displayTitle} - ${activeVariant.name}`
      : selectedImage > 0
      ? `${displayTitle} - ${selectedImage + 1}`
      : displayTitle;

  const handleDownloadImage = async () => {
    const imageUrl = variantImageOverride || (images && images[selectedImage]) || product?.image;
    if (!imageUrl) return;
    await downloadImageWithName(imageUrl, activeImageDownloadName);
  };

  const handleAddToCart = () => {
    let effectiveTotalQty = totalQuantity;
    
    // Auto-select 1 if nothing has been selected yet
    if (effectiveTotalQty <= 0) {
      if (hasVariantsSelected) {
        const firstVariantKey = Object.keys(variantQuantities)[0];
        if (firstVariantKey) {
          setVariantQuantities(prev => ({
            ...prev,
            [firstVariantKey]: { ...prev[firstVariantKey], quantity: 1 }
          }));
          effectiveTotalQty = 1;
        }
      } else if (hasRichSkus) {
        const props = translatedProps || product.skuDetails.properties;
        const primaryProp = props?.[0];
        const primaryPropKey = primaryProp?.originalName || primaryProp?.name || 'primary';
        const getPrimaryOptKey = (v: any, i: number) => String(v?.originalName || v?.name || `opt-${i}`);
        const selectedKey = selectedOptions[primaryPropKey] || selectedOptions[primaryProp?.name] || getPrimaryOptKey(primaryProp?.values?.[0], 0);
        const activeIdx = Math.max(0, (primaryProp?.values || []).findIndex((v: any, i: number) => getPrimaryOptKey(v, i) === selectedKey || v.name === selectedKey || v.originalName === selectedKey));
        const activeVal = primaryProp?.values?.[activeIdx] || primaryProp?.values?.[0];
        const primaryOptKey = getPrimaryOptKey(activeVal, activeIdx);
        const hasMultipleProps = (props?.length || 0) >= 2;
        const matrixProp = hasMultipleProps ? props[props.length - 1] : null;
        const firstMatrixVal = matrixProp?.values?.[0];
        const rowKey = hasMultipleProps && firstMatrixVal
          ? `multi::${primaryOptKey}::0::${String(firstMatrixVal?.originalName || firstMatrixVal?.name || 'matrix-0')}`
          : `single::${activeIdx}::${primaryOptKey}`;
        const skuLabel = activeVariant.name !== 'Default Option' && activeVariant.name !== 'Select options'
          ? activeVariant.name
          : (activeVal?.cleanName || activeVal?.name || "Standard Option");
        const skuPrice = currentItemPrice;
        const skuImg = variantImageOverride || activeVariant.image || displayImage;

        addToCart(
          product,
          1,
          skuLabel,
          skuPrice,
          skuImg,
          activeVariant.id || rowKey
        );
        // Clear quantities on product page so link quantities reset
        setVariantQuantities({});
        setQuantity(0);
        setToastMessage(`✓ Added 1 item (${skuLabel}) to cart! Selected quantities reset.`);
        setTimeout(() => setToastMessage(null), 4000);
        return;
      } else {
        const targetVar = activeVariant || variants[0];
        const targetId = targetVar?.id || selectedVariantId || 'var-1';
        effectiveTotalQty = 1;
        addToCart(
          product, 
          1, 
          activeVariant.name !== 'Default Option' && activeVariant.name !== 'Select options' ? activeVariant.name : undefined, 
          currentItemPrice, 
          variantImageOverride || displayImage, 
          targetId
        );
        // Clear quantities on product page so link quantities reset
        setVariantQuantities({});
        setQuantity(0);
        setToastMessage(`✓ Added 1 item to cart! Selected quantities reset.`);
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }
    }
    
    let addedCount = 0;
    if (hasVariantsSelected) {
      Object.values(variantQuantities).forEach((v: any) => {
        if (v.quantity > 0) {
          addToCart(product, v.quantity, v.skuName, Number((v.price * bulkMultiplier).toFixed(2)), v.image || displayImage, v.skuId);
          addedCount += v.quantity;
        }
      });
      // Clear quantities on product page so link quantities reset as requested
      setVariantQuantities({});
      setQuantity(0);
    } else {
      const q = quantity > 0 ? quantity : 1;
      addToCart(product, q, activeVariant.name !== 'Default Option' && activeVariant.name !== 'Select options' ? activeVariant.name : undefined, currentItemPrice, variantImageOverride || displayImage, selectedVariantId);
      addedCount = q;
      // Clear quantity on product page
      setQuantity(0);
    }
    
    setToastMessage(`✓ Added ${addedCount} item${addedCount > 1 ? 's' : ''} to cart! Quantities cleared.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleBuyNow = () => {
    let effectiveTotalQty = totalQuantity;
    if (effectiveTotalQty <= 0) {
      setQuantity(1);
      effectiveTotalQty = 1;
    }

    const currentTotal = hasVariantsSelected
      ? (Object.values(variantQuantities) as any[]).reduce((acc: number, v: any) => acc + (v.quantity * v.price * bulkMultiplier), 0)
      : (currentItemPrice * (quantity || 1));

    if (currentTotal < minOrderAmount) {
      setShowMinOrderModal(true);
      return;
    }
    
    // Construct direct checkout item(s) without contaminating the global cart
    const buyNowItems: any[] = [];
    if (hasVariantsSelected) {
      Object.values(variantQuantities).forEach((v: any) => {
        if (v.quantity > 0) {
          buyNowItems.push({
            cartItemId: `bn-${product.id}-${v.skuId || v.skuName}-${Date.now()}`,
            id: product.id,
            name: displayTitle,
            price: Number((v.price * bulkMultiplier).toFixed(2)),
            quantity: v.quantity,
            variantName: v.skuName,
            skuId: v.skuId,
            image: v.image || displayImage,
            stock: product.stock,
            offerId: product.offerId,
            importedUrl: product.importedUrl
          });
        }
      });
    } else {
      buyNowItems.push({
        cartItemId: `bn-${product.id}-${Date.now()}`,
        id: product.id,
        name: displayTitle,
        price: currentItemPrice,
        quantity: quantity || 1,
        variantName: activeVariant.name !== 'Default Option' && activeVariant.name !== 'Select options' ? activeVariant.name : undefined,
        variantId: selectedVariantId,
        image: variantImageOverride || displayImage,
        stock: product.stock,
        offerId: product.offerId,
        importedUrl: product.importedUrl
      });
    }

    navigate("/checkout", { state: { buyNowItems } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cb1e46]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-500">
        <p className="text-xl font-bold mb-4">Product Not Found</p>
        <Link to="/" className="text-[#cb1e46] hover:underline font-bold">Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-4 sm:py-6">
      <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 transition-all duration-300">
        
        {/* Top Control Bar: Breadcrumb & View Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center text-[11px] sm:text-xs text-gray-500 gap-1 sm:gap-1.5">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-primary">Shop</Link>
            <span>/</span>
            <span className="text-charcoal truncate max-w-[150px] sm:max-w-md font-semibold">{displayTitle}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleFullWidth}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all border shadow-none cursor-pointer ${
                isFullWidth
                  ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              title="Toggle Full Width View"
            >
              {isFullWidth ? <Minimize2 className="w-3 h-3 text-red-600" /> : <Maximize2 className="w-3 h-3 text-gray-600" />}
              <span>{isFullWidth ? "Wide" : "Wide"}</span>
            </button>

            <button
              type="button"
              onClick={() => { setZoomModalOpen(true); setZoomLevel(1); }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-none cursor-pointer"
              title="Image Zoom"
            >
              <ZoomIn className="w-3 h-3 text-red-600" />
              <span>Zoom</span>
            </button>
          </div>
        </div>

        {/* Product Layout */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6 items-start">
          <div className="w-full xl:flex-1 min-w-0 flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-col md:flex-row lg:flex-row">
            
            {/* Image Gallery */}
            <div className="w-full md:w-5/12 lg:w-5/12 p-4 lg:p-6 border-b md:border-b-0 md:border-r border-gray-100 shrink-0">
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                {/* Vertical Thumbnails (Desktop/Tablet) / Horizontal on small mobile */}
                <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-[480px] scrollbar-none shrink-0 py-0.5">
                  {images.map((img, idx) => {
                    const thumbLabel = idx === 0 ? displayTitle : `${displayTitle} - ${idx + 1}`;
                    const safeThumb = getSafeImageUrl(img, product.image, thumbLabel);
                    const isCurrentlyActive = !showVideo && (
                      variantImageOverride 
                        ? isSameImageUrl(variantImageOverride, img)
                        : selectedImage === idx
                    );
                    return (
                      <button
                        key={idx}
                        onClick={() => { 
                          setSelectedImage(idx); 
                          setShowVideo(false);
                          const props = translatedProps || product.skuDetails?.properties;
                          const primaryProp = props?.[0];
                          if (primaryProp && Array.isArray(primaryProp.values)) {
                            // 1. Check direct color value image match
                            let matchColorIdx = primaryProp.values.findIndex(
                              (v: any) => v?.imageUrl && isSameImageUrl(v.imageUrl, img)
                            );
                            // 2. Check variant image match
                            if (matchColorIdx < 0 && Array.isArray(product.skuDetails?.variants)) {
                              const matchedVariant = product.skuDetails.variants.find(
                                (sv: any) => sv?.imageUrl && isSameImageUrl(sv.imageUrl, img)
                              );
                              if (matchedVariant) {
                                matchColorIdx = primaryProp.values.findIndex(
                                  (v: any) =>
                                    (v?.skuId && (v.skuId === matchedVariant.skuId || v.skuId === matchedVariant.variantId)) ||
                                    (v?.originalName && matchedVariant.specs?.includes(v.originalName)) ||
                                    (v?.name && matchedVariant.specs?.includes(v.name))
                                );
                              }
                            }
                            if (matchColorIdx >= 0) {
                              const matchedVal = primaryProp.values[matchColorIdx];
                              const primaryPropKey = primaryProp.originalName || primaryProp.name || 'primary';
                              const optKey = String(matchedVal?.originalName || matchedVal?.name || `opt-${matchColorIdx}`);
                              setSelectedOptions(prev => ({
                                ...prev,
                                [primaryPropKey]: optKey,
                                [primaryProp.name]: optKey
                              }));
                              const matchedImgUrl = matchedVal?.imageUrl || img;
                              setVariantImageOverride(getSafeImageUrl(matchedImgUrl, product.image));
                            } else {
                              setVariantImageOverride(null);
                            }
                          } else {
                            setVariantImageOverride(null);
                          }
                        }}
                        className={`w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl border-2 overflow-hidden bg-gray-50 transition-all cursor-pointer ${
                          isCurrentlyActive ? 'border-[#cb1e46] shadow-xs ring-2 ring-[#cb1e46]/20' : 'border-gray-200/90 hover:border-gray-300'
                        }`}
                      >
                        <img 
                          src={safeThumb} 
                          alt={thumbLabel} 
                          className="w-full h-full object-cover mix-blend-multiply" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getSafeImageUrl(product.image, undefined, thumbLabel);
                          }}
                        />
                      </button>
                    );
                  })}
                  {product.videoUrl && (
                    <button
                      onClick={() => setShowVideo(true)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl border-2 overflow-hidden bg-gray-100 flex items-center justify-center transition-all cursor-pointer ${showVideo ? 'border-[#cb1e46]' : 'border-gray-200/90 hover:border-gray-300'}`}
                    >
                      <span className="text-xs font-bold text-gray-500">Video</span>
                    </button>
                  )}
                </div>

                {/* Main Large Image */}
                <div 
                  onClick={() => {
                    if (!showVideo) {
                      setZoomModalOpen(true);
                      setZoomLevel(1);
                    }
                  }}
                  className="flex-1 relative aspect-square rounded-2xl overflow-hidden bg-[#fafafa] group border border-gray-100 cursor-zoom-in shadow-2xs flex items-center justify-center"
                >
                  {showVideo && product.videoUrl ? (
                    <video 
                      src={product.videoUrl} 
                      controls 
                      autoPlay 
                      muted 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img 
                      src={getSafeImageUrl(displayImage, product.image, activeImageDownloadName)} 
                      alt={activeImageDownloadName} 
                      className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getSafeImageUrl(product.image, undefined, activeImageDownloadName);
                      }}
                    />
                  )}

                  {!showVideo && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadImage();
                        }}
                        className="bg-white/95 hover:bg-white text-gray-800 hover:text-[#12B8A6] text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-md border border-gray-200/90 backdrop-blur-xs flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                        title="Download this image"
                      >
                        <Download className="w-3.5 h-3.5 text-[#12B8A6]" />
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomModalOpen(true);
                          setZoomLevel(1);
                        }}
                        className="bg-white/95 hover:bg-white text-gray-800 hover:text-[#cb1e46] text-xs font-bold px-3 py-1.5 rounded-lg shadow-md border border-gray-200/90 backdrop-blur-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                        title="100% Image Zoom & Inspector"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-[#cb1e46]" />
                        <span>100% Zoom</span>
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      product && toggleWishlist(product);
                    }}
                    className="absolute top-4 right-4 p-2.5 bg-white rounded-full shadow-md border border-gray-100 hover:text-red-500 transition-colors cursor-pointer z-10"
                    title={product && isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    aria-label="Toggle Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${product && (isInWishlist(product.id) || (product.offerId && isInWishlist(product.offerId))) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="w-full md:w-7/12 lg:w-7/12 p-6 lg:p-8 flex flex-col min-w-0">
              
              <div className="mb-3">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="bg-primary/10 text-primary px-1.5 py-0 rounded text-[9px] font-bold uppercase tracking-wider">{product.category}</span>
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0 rounded text-[9px] font-mono font-bold">
                    Code: abb-{cleanProductCode}
                  </span>
                  {product.minOrderQuantity > 1 && (
                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0 rounded text-[9px] font-bold">MOQ: {product.minOrderQuantity}</span>
                  )}
                  {product.soldDisplay && (
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0 rounded text-[9px] font-medium">{product.soldDisplay}</span>
                  )}
                </div>
                
                <h1 className="text-xs sm:text-sm font-bold text-charcoal leading-tight mb-1.5">
                  {displayTitle}
                </h1>
                
                {isTranslating && <div className="text-[9px] text-primary animate-pulse flex items-center gap-1 mb-1.5">Translating...</div>}
                
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-charcoal">{Number(product.rating || 4.5).toFixed(1)}</span>
                    <span>({product.reviewCount})</span>
                  </div>
                  <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">Genuine</span>
                  </div>
                </div>
              </div>

              {/* Price Display */}
              <div className="mb-3 p-2 rounded-lg bg-gray-50/80 border border-gray-100 flex flex-col gap-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-lg sm:text-xl font-black text-[#cb1e46]">
                      BDT {currentItemPrice.toLocaleString()}
                    </span>
                    {hasDynamicPriceRange && (
                      <span className="text-[9px] font-bold text-gray-700 bg-amber-50 border border-amber-200 text-amber-900 px-1 py-0 rounded">
                        BDT {minVariantPrice} - BDT {maxVariantPrice}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 line-through">
                      BDT {Math.round(currentItemPrice / 0.97).toLocaleString()}
                    </span>
                  </div>
              </div>

              {/* Rich SKU Options (Wholesale Style) */}
              {hasRichSkus ? (
                <div className="space-y-4 mb-6">
                  {(() => {
                    const props = translatedProps || product.skuDetails.properties;
                    if (!props || props.length === 0) return null;
                    
                    const hasMultipleProps = props.length >= 2;
                    const primaryProp = props[0];
                    const primaryPropKey = primaryProp.originalName || primaryProp.name || 'primary';
                    const matrixProp = hasMultipleProps ? props[props.length - 1] : null;
                    const getPrimaryOptKey = (v: any, i: number) => String(v?.originalName || v?.name || `opt-${i}`);
                    
                    // Helper to get accurately translated option label in English
                    const getOptionLabel = (valObj: any): string => {
                      if (!valObj) return "";
                      if (valObj.cleanName && !/[\u4e00-\u9fa5]/.test(valObj.cleanName)) {
                        return valObj.cleanName;
                      }
                      const translated = instantTranslateSkuTerm(valObj.name || valObj.originalName || "", true);
                      if (translated && !/[\u4e00-\u9fa5]/.test(translated)) {
                        return translated;
                      }
                      return valObj.cleanName || valObj.name || valObj.originalName || "";
                    };

                    // Helper to get authentic image for a SKU/color option without arbitrary gallery fallbacks
                    const getOptionRawImage = (valObj: any): string => {
                      if (valObj?.imageUrl) return valObj.imageUrl;
                      if (valObj?.image) return valObj.image;
                      // Match SKU variant in skuDetails
                      if (Array.isArray(product?.skuDetails?.variants)) {
                        const matched = product.skuDetails.variants.find((sv: any) => {
                          if (!sv?.imageUrl && !sv?.image) return false;
                          if (valObj?.skuId && (sv.skuId === valObj.skuId || sv.variantId === valObj.skuId)) return true;
                          const specs = String(sv.specs || sv.name || "");
                          const valOrig = valObj?.originalName;
                          const valName = valObj?.name;
                          const valClean = valObj?.cleanName;
                          if (valOrig && specs.includes(valOrig)) return true;
                          if (valName && specs.includes(valName)) return true;
                          if (valClean && specs.toLowerCase().includes(valClean.toLowerCase())) return true;
                          return false;
                        });
                        if (matched?.imageUrl || matched?.image) return matched.imageUrl || matched.image;
                      }
                      // Match variant in product.variants
                      if (Array.isArray(product?.variants)) {
                        const matched = product.variants.find((pv: any) => {
                          const vImg = pv?.imageUrl || pv?.image;
                          if (!vImg) return false;
                          if (valObj?.skuId && (pv.skuId === valObj.skuId || pv.variantId === valObj.skuId)) return true;
                          const pName = String(pv.name || pv.color || "");
                          const valOrig = valObj?.originalName;
                          const valName = valObj?.name;
                          const valClean = valObj?.cleanName;
                          if (valOrig && pName.includes(valOrig)) return true;
                          if (valName && pName.includes(valName)) return true;
                          if (valClean && pName.toLowerCase().includes(valClean.toLowerCase())) return true;
                          return false;
                        });
                        if (matched) return matched.imageUrl || matched.image;
                      }
                      return product?.image || "";
                    };

                    // Selected value for the primary property (usually Color)
                    const rawSelectedPrimary = selectedOptions[primaryPropKey] || selectedOptions[primaryProp.name];
                    const activePrimaryIdx = Math.max(
                      0,
                      primaryProp.values.findIndex((v: any, i: number) =>
                        getPrimaryOptKey(v, i) === rawSelectedPrimary ||
                        v.name === rawSelectedPrimary ||
                        v.originalName === rawSelectedPrimary
                      )
                    );
                    const activePrimaryValObj = primaryProp.values[activePrimaryIdx] || primaryProp.values[0];
                    const activePrimaryOptKey = getPrimaryOptKey(activePrimaryValObj, activePrimaryIdx);
                    const activePrimaryLabel = getOptionLabel(activePrimaryValObj);

                    const isColorProp =
                      primaryProp.name === '颜色' ||
                      primaryProp.originalName === '颜色' ||
                      primaryProp.name?.toLowerCase().includes('color') ||
                      primaryProp.name?.toLowerCase().includes('colour') ||
                      primaryProp.name?.toLowerCase() === 'model' ||
                      primaryProp.name?.toLowerCase() === 'option';
                    const primaryDisplayName = isColorProp ? 'color' : primaryProp.name;
                    const isSizeMatrix =
                      matrixProp &&
                      (matrixProp.name === '尺码' ||
                        matrixProp.originalName === '尺码' ||
                        matrixProp.name === '尺寸' ||
                        matrixProp.originalName === '尺寸' ||
                        matrixProp.name?.toLowerCase().includes('size'));
                    const matrixHeaderName = hasMultipleProps
                      ? (isSizeMatrix ? 'Size' : (matrixProp?.name || 'Size'))
                      : 'Color';

                    return (
                      <div className="space-y-4">
                        {/* 1. Selected Color Badge matching screenshot */}
                        <div>
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="text-xs sm:text-sm font-semibold text-slate-700 capitalize">
                              {primaryDisplayName} :
                            </span>
                            <span className="bg-[#fff0f4] text-[#cb1e46] border border-[#fecdd3] font-semibold text-xs sm:text-sm px-3 py-1 rounded-md shadow-2xs">
                              {activePrimaryLabel}
                            </span>
                          </div>

                          {/* 2. 8-Column Thumbnail Grid of All Colors/Options */}
                          <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 gap-1.5 sm:gap-2 mb-4">
                            {primaryProp.values.map((val: any, idx: number) => {
                              const valOptKey = getPrimaryOptKey(val, idx);
                              const isSelected = idx === activePrimaryIdx;
                              const rawImg = getOptionRawImage(val);
                              const valLabel = getOptionLabel(val);
                              const optTitle = `${displayTitle} - ${valLabel}`;
                              const safeImg = getSafeImageUrl(rawImg, product.image, optTitle);

                              // Strictly sum only the cart quantities added for this specific option
                              const totalCartQty = (Object.values(variantQuantities) as any[]).reduce(
                                (sum: number, item: any) => (item?.primaryOptionKey === valOptKey ? sum + (item.quantity || 0) : sum),
                                0
                              );
                              
                              return (
                                <button
                                  key={`${valOptKey}-${idx}`}
                                  type="button"
                                  onClick={() => { 
                                    setSelectedOptions(prev => ({
                                      ...prev,
                                      [primaryPropKey]: valOptKey,
                                      [primaryProp.name]: valOptKey
                                    })); 
                                    setVariantImageOverride(safeImg); 
                                    setShowVideo(false);
                                    const matchIdx = images.findIndex((imgUrl: string) => isSameImageUrl(imgUrl, rawImg));
                                    if (matchIdx !== -1) {
                                      setSelectedImage(matchIdx);
                                    }
                                  }}
                                  title={valLabel}
                                  className={`group relative aspect-square w-11 h-11 sm:w-12 sm:h-12 rounded-lg border-2 transition-all cursor-pointer bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0 ${
                                    isSelected 
                                      ? 'border-[#cb1e46] bg-[#fff0f4] ring-2 ring-[#cb1e46]/20 shadow-xs' 
                                      : 'border-gray-200/90 hover:border-gray-400 hover:shadow-2xs'
                                  }`}
                                >
                                  <img 
                                    src={safeImg} 
                                    className="w-full h-full object-cover rounded-md" 
                                    referrerPolicy="no-referrer" 
                                    alt={optTitle}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = getSafeImageUrl(product.image, undefined, optTitle);
                                    }}
                                  />
                                  {isSelected && (
                                    <div className="absolute top-1 left-1 w-4 h-4 bg-[#cb1e46] text-white rounded-full flex items-center justify-center shadow-xs z-10 pointer-events-none">
                                      <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                    </div>
                                  )}
                                  
                                  {totalCartQty > 0 && !isSelected && (
                                    <div className="absolute -top-1 -right-1 bg-[#cb1e46] text-white rounded-full text-[9px] font-bold shadow-xs w-4 h-4 flex items-center justify-center z-10">
                                      {totalCartQty}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3. Detailed Variant & Model Table (Color | Price | Quantity) */}
                        <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-2xs mt-3">
                          {/* Optional Filter & Search Bar for products with multiple models */}
                          {!hasMultipleProps && primaryProp.values.length > 3 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 text-xs">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setVariantFilterMode('all')}
                                  className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                                    variantFilterMode === 'all'
                                      ? 'bg-white text-[#cb1e46] shadow-2xs border border-slate-200'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  All Options ({primaryProp.values.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVariantFilterMode('selected')}
                                  className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                                    variantFilterMode === 'selected'
                                      ? 'bg-white text-[#cb1e46] shadow-2xs border border-slate-200'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  Selected ({activePrimaryLabel})
                                </button>
                              </div>
                              {primaryProp.values.length > 5 && (
                                <div className="relative w-full sm:w-48">
                                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder="Search options..."
                                    value={variantSearchQuery}
                                    onChange={(e) => setVariantSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#cb1e46]"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Table Header: 5 cols (Name) / 3 cols (Price) / 4 cols (Quantity) */}
                          <div className="grid grid-cols-12 items-center py-3 px-3 sm:px-5 bg-[#f8fafc] border-b border-slate-200/90 text-xs sm:text-sm font-bold text-slate-800 gap-1 sm:gap-2">
                            <div className="col-span-5 sm:col-span-5 text-left font-bold text-slate-800">
                              {matrixHeaderName}
                            </div>
                            <div className="col-span-3 sm:col-span-3 text-center font-bold text-slate-800">
                              Price
                            </div>
                            <div className="col-span-4 sm:col-span-4 text-right font-bold text-slate-800 pr-1">
                              Quantity
                            </div>
                          </div>

                          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                            {(() => {
                              let baseListWithIdx: Array<{ val: any; origIdx: number }> = [];
                              if (hasMultipleProps && matrixProp) {
                                const allMatrixWithIdx = matrixProp.values.map((v: any, i: number) => ({ val: v, origIdx: i }));
                                const availableForColor = allMatrixWithIdx.filter(({ val }) => {
                                  const matched = findMatchingSku(product.skuDetails.variants, [activePrimaryValObj, val], props, false);
                                  return Boolean(matched);
                                });
                                baseListWithIdx = availableForColor.length > 0 ? availableForColor : allMatrixWithIdx;
                              } else {
                                baseListWithIdx = variantFilterMode === 'selected'
                                  ? [{ val: activePrimaryValObj, origIdx: activePrimaryIdx }]
                                  : primaryProp.values.map((v: any, i: number) => ({ val: v, origIdx: i }));
                              }
                              
                              const filteredList = baseListWithIdx.filter(({ val }) => {
                                if (!variantSearchQuery.trim()) return true;
                                const q = variantSearchQuery.toLowerCase();
                                const name = String(getOptionLabel(val)).toLowerCase();
                                return name.includes(q);
                              });

                              return filteredList.map(({ val, origIdx }) => {
                                // Find the matching SKU for the current selected combination + this row
                                const currentSelection = hasMultipleProps 
                                  ? [activePrimaryValObj, val] 
                                  : [val];
                                
                                const matchedSku = findMatchingSku(product.skuDetails.variants, currentSelection, props, false);
                                const rowDisplayLabel = getOptionLabel(val);
                                const skuFriendlyName = hasMultipleProps 
                                  ? `${activePrimaryLabel} - ${rowDisplayLabel}`
                                  : rowDisplayLabel;

                                const matchedVar = product.variants?.find((pv: any) => 
                                  (matchedSku && (pv.skuId === matchedSku.skuId || pv.variantId === matchedSku.skuId)) ||
                                  (val.skuId && pv.skuId === val.skuId) ||
                                  pv.name === val.name ||
                                  pv.name === val.originalName ||
                                  pv.name === skuFriendlyName
                                );
                                const targetObj = matchedVar || matchedSku || val;
                                const skuPrice = calculateVariantBdtPrice(targetObj, currentItemPrice, currentRate, product.price);
                                const originalSkuPrice = skuPrice / 0.97;
                                const stock = matchedSku ? (matchedSku.stock ?? 86052) : (matchedVar?.stock ?? val?.stock ?? 86052);

                                // Strictly unique row key per option/row so selecting one row NEVER selects any other row
                                const rowPrimaryKey = hasMultipleProps ? activePrimaryOptKey : getPrimaryOptKey(val, origIdx);
                                const matrixOptKey = String(val?.originalName || val?.name || `row-${origIdx}`);
                                const rowKey = hasMultipleProps
                                  ? `multi::${rowPrimaryKey}::${origIdx}::${matrixOptKey}`
                                  : `single::${origIdx}::${rowPrimaryKey}`;
                                const actualSkuId = matchedSku?.skuId || matchedVar?.skuId || val?.skuId || rowKey;

                                const qty = variantQuantities[rowKey]?.quantity || 0;
                                const rowImgName = `${displayTitle} - ${skuFriendlyName}`;
                                const rawRowImg = hasMultipleProps
                                  ? (getOptionRawImage(activePrimaryValObj) || product.image)
                                  : getOptionRawImage(val);
                                const rowImg = getSafeImageUrl(rawRowImg, product.image, rowImgName);
                                
                                const isRowSelected = !hasMultipleProps && origIdx === activePrimaryIdx;

                                return (
                                  <div 
                                    key={rowKey} 
                                    className={`grid grid-cols-12 items-center py-3 sm:py-3.5 px-3 sm:px-5 transition-colors gap-1 sm:gap-2 ${
                                      isRowSelected ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50/50'
                                    }`}
                                  >
                                    <div className="col-span-5 sm:col-span-5 text-left pr-1 flex items-center gap-2 min-w-0">
                                      {!hasMultipleProps && (
                                        <img 
                                          src={rowImg} 
                                          alt={rowImgName}
                                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                                          referrerPolicy="no-referrer"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = getSafeImageUrl(product.image, undefined, rowImgName);
                                          }}
                                        />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <span
                                          className={`text-xs leading-snug line-clamp-2 block ${
                                            hasMultipleProps
                                              ? 'font-bold text-slate-800'
                                              : 'font-medium text-slate-900'
                                          }`}
                                          title={rowDisplayLabel}
                                        >
                                          {rowDisplayLabel}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="col-span-3 sm:col-span-3 text-center flex flex-col items-center justify-center px-0.5 whitespace-nowrap min-w-0">
                                      <div className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                                        BDT {Math.round(skuPrice).toLocaleString()}
                                      </div>
                                      <div className="text-[10px] text-slate-400 line-through leading-tight">
                                        BDT {Math.round(originalSkuPrice).toLocaleString()}
                                      </div>
                                    </div>
                                    <div className="col-span-4 sm:col-span-4 flex flex-col items-end justify-center min-w-0">
                                      {qty === 0 ? (
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            if (!hasMultipleProps) {
                                              setSelectedOptions(prev => ({
                                                ...prev,
                                                [primaryPropKey]: rowPrimaryKey,
                                                [primaryProp.name]: rowPrimaryKey
                                              }));
                                              setVariantImageOverride(rowImg);
                                            }
                                            setVariantQuantities(prev => ({
                                              ...prev,
                                              [rowKey]: { 
                                                quantity: 1, 
                                                price: skuPrice, 
                                                skuName: skuFriendlyName, 
                                                skuId: actualSkuId,
                                                image: rowImg,
                                                primaryOptionKey: rowPrimaryKey
                                              }
                                            }));
                                          }}
                                          className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-[#063337] hover:bg-[#0a484e] text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-40 cursor-pointer h-7 shrink-0"
                                          disabled={stock === 0}
                                        >
                                          <ShoppingCart className="w-3 h-3 stroke-[2.2]" />
                                          <span>Add</span>
                                        </button>
                                      ) : (
                                        <div className="inline-flex items-center border border-gray-300 rounded-lg bg-white shadow-xs overflow-hidden h-7 shrink-0">
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setVariantQuantities(prev => {
                                                const newQ = (prev[rowKey]?.quantity || 1) - 1;
                                                if (newQ <= 0) {
                                                  const newObj = {...prev};
                                                  delete newObj[rowKey];
                                                  return newObj;
                                                }
                                                return {
                                                  ...prev,
                                                  [rowKey]: { ...prev[rowKey], quantity: newQ }
                                                };
                                              });
                                            }}
                                            className="w-6 h-full flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold text-xs cursor-pointer select-none transition-colors"
                                            title="Decrease"
                                          >
                                            -
                                          </button>
                                          <input 
                                            type="number" 
                                            value={qty} 
                                            onChange={(e) => {
                                              const valNum = parseInt(e.target.value);
                                              if (!isNaN(valNum) && valNum >= 0 && valNum <= stock) {
                                                if (valNum === 0) {
                                                  setVariantQuantities(prev => {
                                                    const newObj = {...prev};
                                                    delete newObj[rowKey];
                                                    return newObj;
                                                  });
                                                } else {
                                                  setVariantQuantities(prev => ({
                                                    ...prev,
                                                    [rowKey]: { ...prev[rowKey], quantity: valNum }
                                                  }));
                                                }
                                              }
                                            }}
                                            className="w-7 sm:w-8 h-full text-center font-bold text-xs bg-transparent border-x border-gray-200 focus:outline-none p-0"
                                          />
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              if (qty < stock) {
                                                setVariantQuantities(prev => ({
                                                  ...prev,
                                                  [rowKey]: { ...prev[rowKey], quantity: qty + 1 }
                                                }));
                                              }
                                            }}
                                            className="w-6 h-full flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold text-xs cursor-pointer disabled:opacity-40 select-none transition-colors"
                                            disabled={qty >= stock}
                                            title="Increase"
                                          >
                                            +
                                          </button>
                                        </div>
                                      )}
                                      <span className="text-[10px] text-slate-400 font-normal mt-0.5 whitespace-nowrap text-right">
                                        Stock: {stock}
                                      </span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          {/* Matrix Wholesale Cart Summary */}
                          {Object.keys(variantQuantities).length > 0 && (
                            <div className="bg-red-50/70 border-t border-red-100 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 rounded-b-xl">
                              <div>
                                <span className="text-xs text-gray-500 font-medium">Selected Total Items:</span>
                                <div className="text-sm sm:text-base font-black text-gray-900">
                                  {totalQuantity} Items ({Object.keys(variantQuantities).length} Variants)
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-gray-500 font-medium">Total Price:</span>
                                <div className="text-base sm:text-lg font-black text-[#cb1e46]">
                                  BDT {totalPrice.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="mb-6 space-y-4">
                  {/* 1. Selected Color Badge for fallback variants */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">Color:</span>
                    <span className="bg-[#fff0f4] text-[#cb1e46] border border-[#fecdd3] font-semibold text-xs sm:text-sm px-3 py-1 rounded-md shadow-2xs">
                      {activeVariant?.name || "Standard Option"}
                    </span>
                  </div>

                  {/* 2. 8-Column Thumbnail Grid of All Variants */}
                  <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 gap-1.5 sm:gap-2 mb-4">
                    {variants.map((v: any, idx: number) => {
                      const activeVarId = selectedVariantId || variants[0]?.id;
                      const isSelected = activeVarId === v.id;
                      const vTitle = `${displayTitle} - ${v.name}`;
                      const safeImg = getSafeImageUrl(v.image, product.image, vTitle);
                      const vQty = variantQuantities[v.id]?.quantity || 0;

                      return (
                        <button
                          key={`${v.id || 'var'}-${idx}`}
                          type="button"
                          onClick={() => {
                            setSelectedVariantId(v.id);
                            setVariantImageOverride(safeImg);
                            setShowVideo(false);
                          }}
                          title={v.name}
                          className={`group relative aspect-square w-11 h-11 sm:w-12 sm:h-12 rounded-lg border-2 transition-all cursor-pointer bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#cb1e46] bg-[#fff0f4] ring-2 ring-[#cb1e46]/20 shadow-xs'
                              : 'border-gray-200/90 hover:border-gray-400 hover:shadow-2xs'
                          }`}
                        >
                          <img
                            src={safeImg}
                            alt={vTitle}
                            className="w-full h-full object-cover rounded-md"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getSafeImageUrl(product.image, undefined, vTitle);
                            }}
                          />
                          {isSelected && (
                            <div className="absolute top-1 left-1 w-4 h-4 bg-[#cb1e46] text-white rounded-full flex items-center justify-center shadow-xs z-10 pointer-events-none">
                              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                            </div>
                          )}
                          {vQty > 0 && !isSelected && (
                            <div className="absolute -top-1 -right-1 bg-[#cb1e46] text-white rounded-full text-[9px] font-bold shadow-xs w-4 h-4 flex items-center justify-center z-10">
                              {vQty}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* 3. Detailed Variant Table (Color | Price | Quantity) */}
                  <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-2xs">
                    {/* Filter & Search Bar for fallback variants if many */}
                    {variants.length > 3 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setVariantFilterMode('all')}
                            className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                              variantFilterMode === 'all'
                                ? 'bg-white text-[#cb1e46] shadow-2xs border border-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            All Variants ({variants.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setVariantFilterMode('selected')}
                            className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                              variantFilterMode === 'selected'
                                ? 'bg-white text-[#cb1e46] shadow-2xs border border-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Selected ({activeVariant?.name || "Default"})
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-12 items-center py-3.5 px-4 sm:px-6 bg-[#f8fafc] border-b border-slate-200/90 text-xs sm:text-sm font-bold text-slate-800">
                      <div className="col-span-6 text-left font-bold text-slate-800">Color / Option</div>
                      <div className="col-span-3 text-center font-bold text-slate-800">Price</div>
                      <div className="col-span-3 text-center sm:text-right font-bold text-slate-800">Quantity</div>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                      {(() => {
                        const activeVarId = selectedVariantId || variants[0]?.id;
                        const targetList = variantFilterMode === 'selected' 
                          ? (activeVariant ? [activeVariant] : [variants[0]]) 
                          : (variants.length > 0 ? variants : [activeVariant || { id: 'default', name: 'Default Option', price: currentItemPrice, stock: 100, image: product.image }]);

                        return targetList.map((targetV: any, idx: number) => {
                          if (!targetV) return null;
                          const vPrice = Number(targetV.price || currentItemPrice);
                          const originalPrice = (vPrice * 1.031);
                          const vStock = targetV.stock ?? 86052;
                          const vQty = variantQuantities[targetV.id]?.quantity || 0;
                          const targetVTitle = `${displayTitle} - ${targetV.name}`;
                          const vImg = getSafeImageUrl(targetV.image, product.image, targetVTitle);
                          const isRowSelected = activeVarId === targetV.id;

                          return (
                            <div 
                              key={`${targetV.id}-${idx}`} 
                              className={`grid grid-cols-12 items-center py-3.5 px-4 sm:px-6 transition-colors ${
                                isRowSelected ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50/50'
                              }`}
                            >
                              <div className="col-span-6 text-left pr-2 flex items-center gap-2.5">
                                <img
                                  src={vImg}
                                  alt={targetVTitle}
                                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = getSafeImageUrl(product.image, undefined, targetVTitle);
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs sm:text-sm font-normal text-slate-900 leading-snug line-clamp-2" title={targetV.name}>
                                    {targetV.name}
                                  </span>
                                </div>
                              </div>
                              <div className="col-span-3 text-center flex flex-col items-center justify-center">
                                <div className="text-xs sm:text-sm font-bold text-slate-900">
                                  BDT {vPrice.toFixed(2)}
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-400 line-through mt-0.5">
                                  BDT {originalPrice.toFixed(2)}
                                </div>
                              </div>
                              <div className="col-span-3 flex flex-col items-center sm:items-end justify-center">
                                {vQty === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedVariantId(targetV.id);
                                      setVariantQuantities(prev => ({
                                        ...prev,
                                        [targetV.id]: { quantity: 1, price: vPrice, skuName: targetV.name, skuId: targetV.id, image: targetV.image, primaryOptionKey: targetV.id }
                                      }));
                                      setVariantImageOverride(vImg);
                                    }}
                                    disabled={vStock === 0}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 bg-[#063337] hover:bg-[#0a484e] text-white rounded-full text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5 stroke-[2.2]" />
                                    <span>Add</span>
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center border border-gray-300 rounded-full bg-white shadow-2xs overflow-hidden h-7 sm:h-8">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextQ = Math.max(0, vQty - 1);
                                        setVariantQuantities(prev => {
                                          if (nextQ === 0) {
                                            const cp = { ...prev };
                                            delete cp[targetV.id];
                                            return cp;
                                          }
                                          return { ...prev, [targetV.id]: { quantity: nextQ, price: vPrice, skuName: targetV.name, skuId: targetV.id, image: targetV.image, primaryOptionKey: targetV.id } };
                                        });
                                      }}
                                      className="w-7 sm:w-8 h-full flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold text-sm cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      value={vQty}
                                      onChange={(e) => {
                                        const num = parseInt(e.target.value) || 0;
                                        setVariantQuantities(prev => {
                                          if (num <= 0) {
                                            const cp = { ...prev };
                                            delete cp[targetV.id];
                                            return cp;
                                          }
                                          return { ...prev, [targetV.id]: { quantity: num, price: vPrice, skuName: targetV.name, skuId: targetV.id, image: targetV.image, primaryOptionKey: targetV.id } };
                                        });
                                      }}
                                      className="w-8 sm:w-10 h-full text-center font-bold text-xs bg-transparent border-x border-gray-200 focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextQ = vQty + 1;
                                        setVariantQuantities(prev => ({
                                          ...prev,
                                          [targetV.id]: { quantity: nextQ, price: vPrice, skuName: targetV.name, skuId: targetV.id, image: targetV.image, primaryOptionKey: targetV.id }
                                        }));
                                      }}
                                      className="w-7 sm:w-8 h-full flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold text-sm cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                                <span className="text-[11px] text-slate-400 font-normal mt-1.5 text-center sm:text-right">
                                  Stock {vStock.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Matrix Wholesale Cart Summary */}
                    {Object.keys(variantQuantities).length > 0 && (
                      <div className="bg-red-50/70 border-t border-red-100 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 rounded-b-xl">
                        <div>
                          <span className="text-xs text-gray-500 font-medium">Selected Total Items:</span>
                          <div className="text-sm sm:text-base font-black text-gray-900">
                            {totalQuantity} Items ({Object.keys(variantQuantities).length} Variants)
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 font-medium">Total Price:</span>
                          <div className="text-base sm:text-lg font-black text-[#cb1e46]">
                            BDT {totalPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Inline Quick Action Bar inside Product Info */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => product && toggleWishlist(product)}
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    product && (isInWishlist(product.id) || (product.offerId && isInWishlist(product.offerId)))
                      ? "bg-red-50 border-red-200 text-red-500"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                  title={product && isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`w-5 h-5 ${product && (isInWishlist(product.id) || (product.offerId && isInWishlist(product.offerId))) ? "fill-red-500 text-red-500" : ""}`} />
                </button>
                <button 
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-bold rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-98"
                >
                  <ShoppingCart className="w-5 h-5" /> Add to Cart
                </button>
                <button 
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 h-12 bg-[#00A859] hover:bg-[#008f4c] text-white text-sm sm:text-base font-bold rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-98"
                >
                  <Check className="w-5 h-5" /> Buy Now
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Mobile & Tablet Right Sidebar (< xl) */}
        <div className="xl:hidden">
          <RightSidebarContent 
            totalQuantity={totalQuantity}
            totalPrice={totalPrice}
            partialPaymentPrice={partialPaymentPrice}
            fullPaymentDiscountPrice={fullPaymentDiscountPrice}
            shippingMethod={shippingMethod}
            setShippingMethod={setShippingMethod}
            setShowShippingModal={setShowShippingModal}
            product={product}
            isInWishlist={isInWishlist}
            toggleWishlist={toggleWishlist}
            handleAddToCart={handleAddToCart}
            handleBuyNow={handleBuyNow}
            similarProducts={similarProducts}
            minOrderAmount={minOrderAmount}
            rmbRate={rmbRate}
            discountPercent={discountPercent}
            onCopyLink={handleCopyLink}
            onFacebookShare={handleFacebookShare}
            onWhatsAppShare={handleWhatsAppShare}
            onDownloadImage={handleDownloadImage}
            isCopied={copiedLink}
          />
        </div>

        {/* Visit Seller Store Action Banner (Directly Above Description & Product Details) */}
        <div className="bg-gradient-to-r from-red-50 via-white to-amber-50/70 border border-red-200/90 rounded-2xl p-4 sm:p-5 mb-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#cb1e46] to-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#cb1e46] bg-red-100/80 px-2.5 py-0.5 rounded-md">
                  Verified Factory Supplier
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {product.sellerInfo?.location || "Guangdong / Zhejiang, China"}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 mt-1 flex items-center gap-2">
                <span>{product.sellerInfo?.name || product.brand || "Direct Factory Manufacturer"}</span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {product.sellerInfo?.rating || "4.9"}
                </span>
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Explore similar wholesale products and matching catalog from this seller in {product.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                setShowSimilarInline(prev => !prev);
                setTimeout(() => {
                  if (inlineSellerStoreRef.current) {
                    inlineSellerStoreRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 80);
              }}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-[#cb1e46] via-red-600 to-rose-600 hover:from-[#a81638] hover:to-red-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer transform active:scale-98 group"
            >
              <Store className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Visit Seller Store</span>
              <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                {similarProducts.length} Similar Items
              </span>
              {showSimilarInline ? (
                <ChevronUp className="w-4 h-4 ml-0.5" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-0.5 group-hover:translate-y-0.5 transition-transform" />
              )}
            </button>
          </div>
        </div>

        {/* Inline Similar Products Showcase directly above Description */}
        {showSimilarInline && (
          <div ref={inlineSellerStoreRef} className="bg-white rounded-2xl p-5 sm:p-7 mb-6 border-2 border-red-200/90 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100/80 text-[#cb1e46] flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                    <span>Seller Store: Similar Products</span>
                    <span className="text-xs bg-red-50 text-[#cb1e46] font-bold px-2 py-0.5 rounded-full border border-red-200">
                      {filteredSimilarProducts.length} Products Found
                    </span>
                  </h4>
                  <p className="text-xs text-gray-500">
                    Handpicked wholesale items similar to {displayTitle} in {product.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={sellerStoreSearch}
                    onChange={(e) => setSellerStoreSearch(e.target.value)}
                    placeholder="Search in store..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400"
                  />
                  {sellerStoreSearch && (
                    <button
                      type="button"
                      onClick={() => setSellerStoreSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSimilarInline(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                  title="Close Similar Products"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {filteredSimilarProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
                {filteredSimilarProducts.map((simProd) => (
                  <ProductCard key={simProd.id} product={simProd} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50/70 rounded-xl mt-5">
                <Package className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">No matching products found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term or browse the main catalog</p>
              </div>
            )}
          </div>
        )}

        {/* Product Detail System */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          {/* Modern Responsive Detail System Tabs */}
          <div className="bg-gray-50/70 border-b border-gray-200/80 px-2 sm:px-6 pt-2 flex items-center gap-1 sm:gap-2 overflow-x-auto hide-scrollbar">
            <button 
              type="button"
              className={`py-3.5 px-3 sm:px-5 text-xs sm:text-sm font-bold transition-all rounded-t-xl flex items-center gap-2 whitespace-nowrap border-b-2 cursor-pointer ${
                activeTab === 'desc' 
                  ? 'text-[#cb1e46] border-[#cb1e46] bg-white shadow-2xs' 
                  : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-white/60'
              }`}
              onClick={() => setActiveTab('desc')}
            >
              <FileText className={`w-4 h-4 ${activeTab === 'desc' ? 'text-[#cb1e46]' : 'text-gray-400'}`} />
              <span>Description</span>
            </button>

            <button 
              type="button"
              className={`py-3.5 px-3 sm:px-5 text-xs sm:text-sm font-bold transition-all rounded-t-xl flex items-center gap-2 whitespace-nowrap border-b-2 cursor-pointer ${
                activeTab === 'specs' 
                  ? 'text-[#cb1e46] border-[#cb1e46] bg-white shadow-2xs' 
                  : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-white/60'
              }`}
              onClick={() => setActiveTab('specs')}
            >
              <Sliders className={`w-4 h-4 ${activeTab === 'specs' ? 'text-[#cb1e46]' : 'text-gray-400'}`} />
              <span>Specifications</span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                {specsList.length + 8}
              </span>
            </button>

            <button 
              type="button"
              className={`py-3.5 px-3 sm:px-5 text-xs sm:text-sm font-bold transition-all rounded-t-xl flex items-center gap-2 whitespace-nowrap border-b-2 cursor-pointer ${
                activeTab === 'reviews' 
                  ? 'text-[#cb1e46] border-[#cb1e46] bg-white shadow-2xs' 
                  : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-white/60'
              }`}
              onClick={() => setActiveTab('reviews')}
            >
              <Star className={`w-4 h-4 ${activeTab === 'reviews' ? 'text-[#cb1e46] fill-[#cb1e46]' : 'text-gray-400'}`} />
              <span>Customer Reviews</span>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                {userReviews.length}
              </span>
            </button>

            <button 
              type="button"
              className={`py-3.5 px-3 sm:px-5 text-xs sm:text-sm font-bold transition-all rounded-t-xl flex items-center gap-2 whitespace-nowrap border-b-2 cursor-pointer ${
                activeTab === 'seller' 
                  ? 'text-[#cb1e46] border-[#cb1e46] bg-white shadow-2xs' 
                  : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-white/60'
              }`}
              onClick={() => setActiveTab('seller')}
            >
              <ShieldCheck className={`w-4 h-4 ${activeTab === 'seller' ? 'text-[#cb1e46]' : 'text-gray-400'}`} />
              <span>Supplier & Guarantee</span>
            </button>
          </div>
          
          <div className="p-4 sm:p-6 lg:p-10">
            {/* TAB 1: DESCRIPTION */}
            {activeTab === 'desc' && (
              <div className="space-y-8 animate-in fade-in duration-150">
                {/* Description Header & Visit Seller Store Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-[#cb1e46] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900">
                        Product Overview & Description
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        Direct wholesale specification & manufacturer details
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-gradient-to-r from-red-50/50 via-white to-orange-50/50 rounded-2xl border border-red-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">100% Authentic Factory Sourcing</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Sourced directly from verified source manufacturers and certified export factories.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Pre-Shipment Quality Inspection</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Every unit is meticulously verified and photo-inspected at our Guangzhou central warehouse.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Plane className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Air & Sea Freight Logistics</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Fast express air cargo (7-12 days) or cost-effective sea container freight (35-45 days).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Full Customs Clearance & Delivery</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Zero customs paperwork hassle — 100% cleared and delivered to your doorstep in Bangladesh.</p>
                    </div>
                  </div>
                </div>

                {/* Product Description Text */}
                <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#cb1e46]" />
                    <span>Product Overview & Description</span>
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {cleanProductDescription(product.description, displayTitle)}
                  </p>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200/60">
                    <div className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2.5 rounded-xl border border-gray-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Category:</strong> {product.category || "Wholesale Import"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2.5 rounded-xl border border-gray-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Brand/Factory:</strong> {product.brand || "Source Factory Direct"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2.5 rounded-xl border border-gray-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Stock:</strong> Factory Ready Stock</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2.5 rounded-xl border border-gray-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Packaging:</strong> Sealed Export Standard Box</span>
                    </div>
                  </div>
                </div>

                {/* Rich HTML Description */}
                {cleanProductDescriptionHtml(product.descriptionHtml) && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 prose prose-sm max-w-none text-gray-700 shadow-2xs">
                    <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#cb1e46]" />
                      <span>Factory Visual Details</span>
                    </h3>
                    <div 
                      className="space-y-4 overflow-hidden"
                      dangerouslySetInnerHTML={{ 
                        __html: cleanProductDescriptionHtml(product.descriptionHtml)!.replace(/<img /g, '<img style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px auto; display: block;" ') 
                      }} 
                    />
                  </div>
                )}

                {/* Description Images Strip */}
                {product.descriptionImages && product.descriptionImages.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#cb1e46]" />
                      <span>Product Feature & Sizing Gallery</span>
                    </h3>
                    <div className="flex flex-col gap-4">
                      {product.descriptionImages.map((imgUrl, i) => (
                        <div key={i} className="overflow-hidden rounded-xl border border-gray-100 shadow-2xs bg-gray-50">
                          <img 
                            src={getSafeImageUrl(imgUrl, product.image, `${displayTitle} - Detail ${i + 1}`)} 
                            alt={`${displayTitle} - Detail ${i + 1}`} 
                            className="w-full h-auto object-contain max-h-[900px] mx-auto" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Gallery Close-up Grid */}
                {images && images.length > 1 && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ZoomIn className="w-4 h-4 text-[#cb1e46]" />
                        <span>Product Photo Gallery & Close-ups ({images.length} Photos)</span>
                      </div>
                      <span className="text-xs text-gray-400 font-normal">Click image to inspect full size</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((img, idx) => (
                        <div 
                          key={idx} 
                          className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow group relative cursor-pointer"
                          onClick={() => { setSelectedImage(idx); setVariantImageOverride(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                          <img 
                            src={getSafeImageUrl(img, product.image, `${displayTitle} - Photo ${idx + 1}`)} 
                            alt={`${displayTitle} - Photo ${idx + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-2xs">
                            <ZoomIn className="w-4 h-4 text-white" />
                            <span>View Full Image</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wholesale Purchase & Import Guide */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>Important Direct Import & Procurement Guidelines:</span>
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
                    <li>Minimum Order Requirement: Wholesale factory order total must be at least BDT {minOrderAmount.toLocaleString()}.</li>
                    <li>Instant Payment Discount: Pay 100% advance to immediately receive an instant {discountPercent || 3}% discount.</li>
                    <li>Weight & Freight Calculation: Accurately calculated via calibrated digital scales upon parcel arrival at Guangzhou hub.</li>
                    <li>Doorstep Nationwide Delivery: Direct doorstep delivery across all 64 districts via reliable courier partners.</li>
                  </ul>
                </div>
              </div>
            )}
            
            {/* TAB 2: SPECIFICATIONS */}
            {activeTab === 'specs' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Search / Filter Bar for Specifications */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200/80">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Technical Specifications</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Factory parameters and material specifications</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search specifications..."
                      value={specSearchQuery}
                      onChange={(e) => setSpecSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#cb1e46] shadow-2xs"
                    />
                  </div>
                </div>

                {/* Section 1: Basic Product Information */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#cb1e46]" />
                    <span>Basic Product Information</span>
                  </h4>
                  <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50/60 transition-colors">
                          <td className="w-1/3 py-3 px-4 sm:px-6 font-semibold text-gray-600 bg-gray-50/40 border-r border-gray-100">Product Code / ID</td>
                          <td className="py-3 px-4 sm:px-6 font-bold text-gray-900 font-mono">#{product.offerId || product.id}</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60 transition-colors">
                          <td className="w-1/3 py-3 px-4 sm:px-6 font-semibold text-gray-600 bg-gray-50/40 border-r border-gray-100">Category</td>
                          <td className="py-3 px-4 sm:px-6 font-bold text-[#cb1e46]">{product.category}</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60 transition-colors">
                          <td className="w-1/3 py-3 px-4 sm:px-6 font-semibold text-gray-600 bg-gray-50/40 border-r border-gray-100">Brand / Manufacturer</td>
                          <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">{product.brand || "Direct Factory Import"}</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60 transition-colors">
                          <td className="w-1/3 py-3 px-4 sm:px-6 font-semibold text-gray-600 bg-gray-50/40 border-r border-gray-100">Stock Status</td>
                          <td className="py-3 px-4 sm:px-6 font-bold text-emerald-600">Ready Stock ({product.stock || 100}+ Units Available)</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60 transition-colors">
                          <td className="w-1/3 py-3 px-4 sm:px-6 font-semibold text-gray-600 bg-gray-50/40 border-r border-gray-100">Country of Origin</td>
                          <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">China (Guangdong / Zhejiang)</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60 transition-colors">
                          <td className="w-1/3 py-3 px-4 sm:px-6 font-semibold text-gray-600 bg-gray-50/40 border-r border-gray-100">Minimum Order (MOQ)</td>
                          <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">{product.minOrderQuantity || 1} Pcs</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60 transition-colors">
                          <td className="w-1/3 py-3 px-4 sm:px-6 font-semibold text-gray-600 bg-gray-50/40 border-r border-gray-100">Quality Control (QC)</td>
                          <td className="py-3 px-4 sm:px-6 font-bold text-emerald-600">100% Pre-Shipment Inspection Passed</td>
                        </tr>
                        <tr className="hover:bg-gray-50/60 transition-colors">
                          <td className="w-1/3 py-3 px-4 sm:px-6 font-semibold text-gray-600 bg-gray-50/40 border-r border-gray-100">Export Packaging</td>
                          <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">Export Standard Sealed Protective Packaging</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 2: Technical Parameters & Attributes */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#cb1e46]" />
                    <span>Technical & Material Parameters</span>
                  </h4>
                  <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <tbody className="divide-y divide-gray-100">
                        {(translatedSpecs && translatedSpecs.length > 0 ? translatedSpecs : specsList)
                          .filter((spec: any) => {
                            if (!specSearchQuery) return true;
                            const q = specSearchQuery.toLowerCase();
                            const sName = typeof spec === 'object' ? (spec.name || spec.key || '') : '';
                            const sVal = typeof spec === 'object' ? (spec.value || spec.val || '') : String(spec);
                            return String(sName).toLowerCase().includes(q) || String(sVal).toLowerCase().includes(q);
                          })
                          .map((spec: any, idx: number) => {
                            const sName = typeof spec === 'object' ? (spec.name || spec.key || `Specification ${idx + 1}`) : `Parameter ${idx + 1}`;
                            let sVal = typeof spec === 'object' ? (spec.value !== undefined ? spec.value : spec.val) : spec;
                            if (typeof sVal === 'object' && sVal !== null) sVal = JSON.stringify(sVal);
                            sVal = String(sVal || '').trim();
                            if (!sVal || sVal === ':{\"' || sVal === ':{"' || sVal === ':{}' || sVal === ':{\'}' || sVal === ':{"') return null;

                            return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50/70 transition-colors' : 'bg-gray-50/30 hover:bg-gray-50/70 transition-colors'}>
                                <td className="w-1/3 py-3 px-4 sm:px-6 font-semibold text-gray-600 bg-gray-50/40 border-r border-gray-100">{sName}</td>
                                <td className="py-3 px-4 sm:px-6 font-bold text-gray-900">{sVal}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: REVIEWS & RATINGS */}
            {activeTab === 'reviews' && (
              <div className="space-y-8 animate-in fade-in duration-150">
                {/* Rating Overview Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gradient-to-r from-amber-50/50 via-white to-red-50/30 rounded-2xl border border-amber-200/80 items-center">
                  <div className="text-center md:text-left">
                    <div className="flex items-baseline gap-2 justify-center md:justify-start">
                      <span className="text-4xl sm:text-5xl font-black text-gray-900">4.8</span>
                      <span className="text-sm text-gray-500 font-bold">/ 5.0</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 justify-center md:justify-start">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{userReviews.length} Verified Buyer Reviews</p>
                  </div>

                  {/* Rating Breakdown Bars */}
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="w-12 font-bold">5 Stars</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="w-8 text-right font-medium">85%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 font-bold">4 Stars</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: '12%' }}></div>
                      </div>
                      <span className="w-8 text-right font-medium">12%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 font-bold">3 Stars</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: '3%' }}></div>
                      </div>
                      <span className="w-8 text-right font-medium">3%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 font-bold">2 Stars</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-200 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                      <span className="w-8 text-right font-medium">0%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 font-bold">1 Star</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-200 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                      <span className="w-8 text-right font-medium">0%</span>
                    </div>
                  </div>

                  {/* Write a Review Button */}
                  <div className="flex justify-center md:justify-end">
                    <button
                      type="button"
                      onClick={() => setReviewModalOpen(true)}
                      className="px-5 py-3 bg-[#cb1e46] hover:bg-[#a81638] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Write a Review</span>
                    </button>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {userReviews.map((rev) => (
                    <div key={rev.id} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:border-gray-200 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-900">{rev.author}</h4>
                            <span className="text-[11px] text-gray-400 font-medium">({rev.district})</span>
                            {rev.verified && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Verified Buyer</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                  key={s} 
                                  className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} 
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-gray-400">{rev.date}</span>
                          </div>
                        </div>

                        <button 
                          type="button"
                          onClick={() => {
                            setUserReviews(prev => prev.map(r => r.id === rev.id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r));
                          }}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-gray-200/80 transition-colors cursor-pointer"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Helpful ({rev.helpfulCount})</span>
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-700 mt-3 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: SUPPLIER & GUARANTEE */}
            {activeTab === 'seller' && (
              <div className="space-y-8 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Manufacturer Profile */}
                  <div className="p-6 bg-white rounded-2xl border border-gray-200/90 shadow-2xs space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-[#cb1e46]">
                        <Store className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{product.sellerInfo?.name || "Verified Direct Manufacturer"}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Platinum Verified Factory</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <p className="text-gray-500 mb-0.5">Factory Location</p>
                        <p className="font-bold text-gray-900">{product.sellerInfo?.location || "Guangdong / Zhejiang, China"}</p>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <p className="text-gray-500 mb-0.5">Supplier Rating</p>
                        <p className="font-bold text-emerald-600">★ {product.sellerInfo?.rating || 4.9} / 5.0</p>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <p className="text-gray-500 mb-0.5">On-Time Delivery Score</p>
                        <p className="font-bold text-blue-600">{product.sellerInfo?.deliveryScore || "4.9"} (High)</p>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <p className="text-gray-500 mb-0.5">Response Rate</p>
                        <p className="font-bold text-gray-900">{product.sellerInfo?.responseRate || "98%"}</p>
                      </div>
                    </div>
                  </div>

                  {/* World Buy BD Guarantee Policy */}
                  <div className="p-6 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/40 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-4">
                    <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>World Buy BD Buyer Protection Guarantee</span>
                    </h4>

                    <div className="space-y-3 text-xs text-gray-700">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-gray-900">Transit Damage Protection:</strong>
                          <p className="text-gray-500 mt-0.5">If items are damaged during international freight, prompt compensation or replacement is covered.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-gray-900">Pre-Shipment Photo & QC:</strong>
                          <p className="text-gray-500 mt-0.5">Real photos are taken at Guangzhou warehouse to verify color, size, and quantity before flight or sea dispatch.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-gray-900">Precision Digital Weight Billing:</strong>
                          <p className="text-gray-500 mt-0.5">No hidden surprises; freight charges are calculated strictly based on calibrated gram-accurate weight scales.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-gray-900">Dedicated Procurement Support:</strong>
                          <p className="text-gray-500 mt-0.5">Our dedicated support helpline and WhatsApp team assist you continuously throughout the sourcing journey.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

          {/* Desktop Right Sidebar (xl+) */}
          <div className="w-full xl:w-[360px] 2xl:w-[380px] shrink-0 hidden xl:block xl:sticky xl:top-20">
            <div className="space-y-4">
              <RightSidebarContent 
                totalQuantity={totalQuantity}
                totalPrice={totalPrice}
                partialPaymentPrice={partialPaymentPrice}
                fullPaymentDiscountPrice={fullPaymentDiscountPrice}
                shippingMethod={shippingMethod}
                setShippingMethod={setShippingMethod}
                setShowShippingModal={setShowShippingModal}
                product={product}
                isInWishlist={isInWishlist}
                toggleWishlist={toggleWishlist}
                handleAddToCart={handleAddToCart}
                handleBuyNow={handleBuyNow}
                similarProducts={similarProducts}
                minOrderAmount={minOrderAmount}
                rmbRate={rmbRate}
                discountPercent={discountPercent}
                onCopyLink={handleCopyLink}
                onFacebookShare={handleFacebookShare}
                onWhatsAppShare={handleWhatsAppShare}
                onDownloadImage={handleDownloadImage}
                isCopied={copiedLink}
              />
            </div>
          </div>
        </div>
        
      </div>

      {/* Shipping Info Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-charcoal">Shipping Rates & Details</h3>
              <button 
                onClick={() => setShowShippingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-3 bg-blue-50/80 p-4 rounded-xl border border-blue-100">
                <Truck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 leading-relaxed">
                  Shipping costs depend on actual weight and item category verified at our China warehouse. Contact support for bulk container inquiries.
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <Plane className="w-5 h-5 text-primary" />
                  <h4 className="font-bold text-lg text-charcoal">Air Freight Shipping Rates (By Air)</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-primary/30 transition-colors shadow-sm">
                    <div className="inline-block bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs mb-3">Category A (Standard Items)</div>
                    <div className="text-xl font-black text-charcoal mb-2">BDT 780 <span className="text-sm font-medium text-gray-500">/ Kg</span></div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Shoes, bags, jewelry, tools, stickers, electronics, computer accessories, ceramics, metal, leather, rubber, plastic items, non-battery toys.
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-primary/30 transition-colors shadow-sm">
                    <div className="inline-block bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs mb-3">Category B (Sensitive Items)</div>
                    <div className="text-xl font-black text-charcoal mb-2">BDT 1,200 <span className="text-sm font-medium text-gray-500">/ Kg</span></div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Battery items, brand replica products, live seeds, chemicals, networking gear, magnets, or laser products.
                    </p>
                  </div>
                </div>

                <div className="mt-4 border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                  <div className="inline-block bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs mb-4">Category C (Special Item Rates)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">Apparel / Garments</span>
                      <span className="font-bold text-charcoal">BDT 750</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">Kitchen Knives</span>
                      <span className="font-bold text-charcoal">BDT 1,220</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">Packaged Foods</span>
                      <span className="font-bold text-charcoal">BDT 1,220</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">Liquid / Cosmetics</span>
                      <span className="font-bold text-charcoal">BDT 1,170</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">Battery / Power Banks</span>
                      <span className="font-bold text-charcoal">BDT 1,370</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">Hijab / Scarves</span>
                      <span className="font-bold text-charcoal">BDT 800</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">Powder Items</span>
                      <span className="font-bold text-charcoal">BDT 1,220</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">Sunglasses</span>
                      <span className="font-bold text-charcoal">BDT 3,500</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">CCTV Cameras</span>
                      <span className="font-bold text-charcoal">BDT 1,500</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">Smartwatches</span>
                      <span className="font-bold text-charcoal">BDT 1,220</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">Standard Watches</span>
                      <span className="font-bold text-charcoal">BDT 1,170</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">Bluetooth Earphones</span>
                      <span className="font-bold text-charcoal">BDT 1,220</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <Ship className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-lg text-charcoal">Sea Freight Shipping Rates (By Sea)</h4>
                </div>
                
                <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-black text-charcoal mb-1">BDT 250 - BDT 550 <span className="text-sm font-medium text-gray-500">/ Kg</span></div>
                      <p className="text-xs text-gray-600">Estimated Transit Time: 40-60 Days</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-sm text-blue-600">
                      <Ship className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setShowShippingModal(false)}
                  className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl transition shadow-sm hover:shadow cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimum Order Enforcement Modal */}
      {showMinOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center relative">
              <button
                onClick={() => setShowMinOrderModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <AlertCircle className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-xl font-black tracking-tight">
                Minimum Order Limit: BDT {minOrderAmount.toLocaleString()}
              </h3>
              <p className="text-xs text-amber-100 mt-1">
                Direct China-to-Bangladesh Factory Wholesale
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-2">
                <p className="leading-relaxed font-medium">
                  To order at factory wholesale rates, each shipment requires a minimum order total of <strong className="font-bold text-amber-900">BDT {minOrderAmount.toLocaleString()}</strong>.
                </p>
                <div className="border-t border-amber-200/80 pt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Selection:</span>
                    <span className="font-bold text-gray-900">BDT {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum Required:</span>
                    <span className="font-bold text-amber-800">BDT {minOrderAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-bold border-t border-amber-200/60 pt-1">
                    <span>Remaining to add:</span>
                    <span>BDT {Math.max(0, minOrderAmount - totalPrice).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.min(100, Math.round((totalPrice / minOrderAmount) * 100))}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((totalPrice / minOrderAmount) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={autoAdjustToMinOrder}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Auto-adjust quantity to meet BDT {minOrderAmount.toLocaleString()}
                </button>
                <button
                  onClick={() => setShowMinOrderModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  I'll adjust quantities manually
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900/95 backdrop-blur-sm text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">{toastMessage}</span>
            <span className="text-[11px] text-gray-300">Item saved in your World Buy BD cart</span>
          </div>
          <Link
            to="/cart"
            className="ml-3 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
          >
            View Cart
          </Link>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Write a Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#cb1e46] to-red-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Write a Product Review</h3>
                <p className="text-xs text-red-100 mt-0.5">Your review assists fellow wholesale buyers</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newReviewAuthor.trim() || !newReviewText.trim()) return;
                const newRev = {
                  id: `rev-${Date.now()}`,
                  author: newReviewAuthor.trim(),
                  district: newReviewDistrict.trim() || "Bangladesh",
                  rating: newReviewRating,
                  date: "Today",
                  comment: newReviewText.trim(),
                  verified: true,
                  helpfulCount: 0
                };
                setUserReviews(prev => [newRev, ...prev]);
                setReviewModalOpen(false);
                setNewReviewAuthor("");
                setNewReviewText("");
                setToastMessage("Your review has been successfully submitted!");
              }}
              className="p-6 space-y-4"
            >
              {/* Star Rating Select */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-7 h-7 ${star <= newReviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-amber-600">
                    {newReviewRating === 5 ? "Excellent (5/5)" : newReviewRating === 4 ? "Very Good (4/5)" : newReviewRating === 3 ? "Average (3/5)" : "Fair"}
                  </span>
                </div>
              </div>

              {/* Name & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#cb1e46]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">District / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka, Chittagong"
                    value={newReviewDistrict}
                    onChange={(e) => setNewReviewDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#cb1e46]"
                  />
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Your Review & Feedback *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your experience regarding product quality, packaging, and delivery..."
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#cb1e46] resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#cb1e46] hover:bg-[#a81638] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-screen / Dialog Modal: Seller Store & Similar Products */}
      {showSellerStoreModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-[#cb1e46] p-5 sm:p-6 text-white shrink-0 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shrink-0 shadow-inner">
                  <Store className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                      Verified Supplier
                    </span>
                    <span className="text-xs text-gray-300">
                      {product.sellerInfo?.location || "Guangdong / Zhejiang, China"}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white mt-1">
                    {product.sellerInfo?.name || product.brand || "Verified Factory Direct Store"}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-300 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {product.sellerInfo?.rating || "4.9"} Supplier Rating
                    </span>
                    <span>•</span>
                    <span>Category: <strong className="text-white">{product.category}</strong></span>
                    <span>•</span>
                    <span>{similarProducts.length} Similar Products Found</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSellerStoreModal(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filter Toolbar */}
            <div className="p-4 bg-gray-50 border-b border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in this seller's products..."
                  value={sellerStoreSearch}
                  onChange={(e) => setSellerStoreSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#cb1e46] shadow-2xs"
                />
                {sellerStoreSearch && (
                  <button
                    type="button"
                    onClick={() => setSellerStoreSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-500 w-full sm:w-auto text-right">
                Showing <strong>{filteredSimilarProducts.length}</strong> matching products
              </div>
            </div>

            {/* Modal Scrollable Products Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/40">
              {filteredSimilarProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredSimilarProducts.map((simProd) => (
                    <div
                      key={simProd.id}
                      onClick={() => {
                        setShowSellerStoreModal(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <ProductCard product={simProd} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-gray-800">No matching products found</h4>
                  <p className="text-xs text-gray-500 mt-1">Try searching for other keywords in {product.category}</p>
                  {sellerStoreSearch && (
                    <button
                      type="button"
                      onClick={() => setSellerStoreSearch("")}
                      className="mt-4 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-gray-200/80 flex items-center justify-between gap-3 shrink-0">
              <Link
                to={`/shop?category=${encodeURIComponent(product.category || "")}`}
                onClick={() => setShowSellerStoreModal(false)}
                className="text-xs font-bold text-[#cb1e46] hover:underline flex items-center gap-1.5"
              >
                <span>Browse all {product.category} products in Shop</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setShowSellerStoreModal(false)}
                className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 100% High-Resolution Image Zoom Inspector Modal */}
      {zoomModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-200"
          onClick={() => setZoomModalOpen(false)}
        >
          {/* Header Controls */}
          <div 
            className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/60 shrink-0 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-white font-bold text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                {displayTitle}
              </span>
              <span className="text-xs bg-white/10 text-white/80 px-2 py-0.5 rounded-full font-mono shrink-0">
                Image: {selectedImage + 1} / {images.length}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Zoom Out (-25%)"
              >
                <ZoomOut className="w-5 h-5" />
              </button>

              {/* 100% Reset / Zoom Level Button */}
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer border ${
                  zoomLevel === 1 
                    ? 'bg-[#cb1e46] text-white border-[#cb1e46]' 
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
                title="100% Actual Resolution (1:1)"
              >
                {Math.round(zoomLevel * 100)}% {zoomLevel === 1 ? '(100% Zoom)' : ''}
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(3, Number((prev + 0.25).toFixed(2))))}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Zoom In (+25%)"
              >
                <ZoomIn className="w-5 h-5" />
              </button>

              {/* Rotate */}
              <button
                type="button"
                onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {/* Download */}
              <button
                type="button"
                onClick={handleDownloadImage}
                className="px-3 py-1.5 bg-[#12B8A6] hover:bg-[#0D9488] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                title="Download Image"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setZoomModalOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-red-600/80 rounded-lg transition-colors cursor-pointer ml-1 sm:ml-2"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Canvas / Image Stage */}
          <div 
            className="flex-1 w-full overflow-auto flex items-center justify-center p-4 sm:p-8 cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="transition-transform duration-200 ease-out origin-center"
              style={{
                transform: `scale(${zoomLevel}) rotate(${imageRotation}deg)`,
                maxWidth: zoomLevel <= 1 ? "90vw" : "none",
                maxHeight: zoomLevel <= 1 ? "80vh" : "none"
              }}
            >
              <img
                src={getSafeImageUrl(displayImage, product.image, activeImageDownloadName)}
                alt={activeImageDownloadName}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl select-none"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getSafeImageUrl(product.image, undefined, activeImageDownloadName);
                }}
              />
            </div>
          </div>

          {/* Footer Gallery Thumbnails */}
          {images.length > 1 && (
            <div 
              className="flex items-center justify-center gap-2 sm:gap-3 p-3 bg-black/60 border-t border-white/10 overflow-x-auto shrink-0 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => {
                const thumbName = idx === 0 ? displayTitle : `${displayTitle} - ${idx + 1}`;
                const safeImg = getSafeImageUrl(img, product.image, thumbName);
                const isActive = (!variantImageOverride && selectedImage === idx) || isSameImageUrl(variantImageOverride, img);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImage(idx);
                      setVariantImageOverride(null);
                    }}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      isActive ? 'border-[#cb1e46] scale-105 shadow-md' : 'border-white/30 hover:border-white/70 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={safeImg}
                      alt={thumbName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
