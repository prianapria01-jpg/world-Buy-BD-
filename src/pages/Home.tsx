import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import OrderJourney from "../components/OrderJourney";
import LiveEditableSection from "../components/common/LiveEditableSection";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { Product } from "../types";
import { cachedFetchJson, getSyncCached, invalidateApiCache } from "../utils/apiCache";
import { matchesCategory, mergeWithStoreCategories, getCategoryIcon, EXPANDABLE_MAIN_CATEGORIES } from "../utils/categories";
import { getSafeImageUrl } from "../utils/imageUrl";
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  Plane,
  Ship,
  Sparkles,
  ChevronDown,
  Search,
  Star,
  Layers,
  X,
  ChevronRight,
  Calculator,
  Clipboard,
  MessageCircle,
  CheckCircle,
  Flame,
  Award,
  Video,
  Upload,
  Play,
  Loader2,
  Trash2,
} from "lucide-react";
import { ShowcaseVideoItem, getYouTubeEmbedUrl } from "./admin/AdminVideos";

const WORLD_BUY_CATEGORIES = EXPANDABLE_MAIN_CATEGORIES.map((mc) => ({
  name: mc.name,
  slug: mc.name,
  image: mc.image,
  itemCount: "",
  hasSubCategories: true,
  subCategories: mc.subCategories || [],
}));

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "wb-p1",
    name: "Non-Slip Silicone Grip Deadlift Wrist Support & Palm Protection Fitness Lifting Straps (Pair)",
    category: "Sports & Fitness",
    price: 191,
    originalPrice: 280,
    discount: 30,
    stock: 5116,
    image: "https://cbu01.alicdn.com/img/ibank/O1CN015QMHt02GWaqA9Fyh3_!!2220481779023-0-cib.jpg",
    rating: 4.9,
    reviewCount: 128,
    status: "published",
    offerId: "963357947517",
  },
  {
    id: "wb-p2",
    name: "Trendy GM Style Round Frame UV400 Driving Sunglasses for Men & Women",
    category: "Jewelry",
    price: 340,
    originalPrice: 550,
    discount: 38,
    stock: 3500,
    image: "https://cbu01.alicdn.com/img/ibank/O1CN010JqXg81uOQJ9Zk4aX_!!2217646549247-0-cib.jpg",
    rating: 4.8,
    reviewCount: 94,
    status: "published",
    offerId: "1080674739855",
  },
  {
    id: "wb-p3",
    name: "Smart Active Noise Cancelling Bluetooth 5.3 Over-Ear Stereo Headphones",
    category: "Electronics & Gadgets",
    price: 1850,
    originalPrice: 2400,
    discount: 23,
    stock: 120,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    reviewCount: 85,
    status: "published",
  },
  {
    id: "wb-p4",
    name: "Men's Breathable Ultra-Lightweight Shock Absorbing Athletic Running Shoes",
    category: "Shoes",
    price: 1450,
    originalPrice: 2100,
    discount: 31,
    stock: 80,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    reviewCount: 76,
    status: "published",
  },
  {
    id: "wb-p5",
    name: "Premium Waterproof Anti-Theft Laptop Backpack with USB Charging Port",
    category: "Bags",
    price: 1350,
    originalPrice: 1950,
    discount: 30,
    stock: 140,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    reviewCount: 112,
    status: "published",
  },
  {
    id: "wb-p6",
    name: "Multifunctional Precision 8-in-1 Cordless Electric Screwdriver Tool Kit",
    category: "Tools & Home Impr",
    price: 1250,
    originalPrice: 1800,
    discount: 30,
    stock: 90,
    image: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    reviewCount: 63,
    status: "published",
  },
  {
    id: "wb-p7",
    name: "Wireless Magnetic 15W Fast Charging 10,000mAh Power Bank",
    category: "Electronics & Gadgets",
    price: 1150,
    originalPrice: 1600,
    discount: 28,
    stock: 130,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80",
    rating: 4.8,
    reviewCount: 88,
    status: "published",
  },
  {
    id: "wb-p8",
    name: "Ergonomic Memory Foam Executive Lumbar Support Office Chair Cushion",
    category: "Home & Kitchen",
    price: 950,
    originalPrice: 1400,
    discount: 32,
    stock: 65,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    reviewCount: 37,
    status: "published",
  },
];

const FlashSaleCountdown = React.memo(function FlashSaleCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 11,
    minutes: 42,
    seconds: 29,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-200 font-medium hidden sm:inline">Offer Ends In:</span>
      <div className="flex items-center gap-1 text-center font-mono">
        <div className="bg-white/15 backdrop-blur-md px-2 py-0.5 rounded min-w-[38px]">
          <span className="text-sm font-bold text-white">{String(timeLeft.hours).padStart(2, "0")}</span>
          <span className="block text-[8px] uppercase tracking-wider text-slate-200">HRS</span>
        </div>
        <span className="text-xs font-bold text-amber-300">:</span>
        <div className="bg-white/15 backdrop-blur-md px-2 py-0.5 rounded min-w-[38px]">
          <span className="text-sm font-bold text-white">{String(timeLeft.minutes).padStart(2, "0")}</span>
          <span className="block text-[8px] uppercase tracking-wider text-slate-200">MIN</span>
        </div>
        <span className="text-xs font-bold text-amber-300">:</span>
        <div className="bg-white/15 backdrop-blur-md px-2 py-0.5 rounded min-w-[38px]">
          <span className="text-sm font-bold text-white">{String(timeLeft.seconds).padStart(2, "0")}</span>
          <span className="block text-[8px] uppercase tracking-wider text-slate-200">SEC</span>
        </div>
      </div>
    </div>
  );
});

export default function Home() {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const [products, setProducts] = useState<Product[]>(() => {
    const cached = getSyncCached<Product[]>("/api/products");
    return Array.isArray(cached) && cached.length > 0 ? cached : [];
  });
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("All");
  const [importUrlInput, setImportUrlInput] = useState("");

  // Shipping Cost Calculator State
  const [calcWeight, setCalcWeight] = useState<number>(2.5);
  const [calcShippingType, setCalcShippingType] = useState<"air" | "sea">("air");
  const [calcGoodsType, setCalcGoodsType] = useState<"normal" | "sensitive">("normal");

  // Request a Product Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    name: "",
    phone: "",
    email: "",
    productTitle: "",
    productUrl: "",
    estimatedQuantity: "1",
    shippingPreference: "air",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [openHeroMainCat, setOpenHeroMainCat] = useState<string | null>(null);

  // Homepage Video Showcase States
  const [showcaseVideos, setShowcaseVideos] = useState<ShowcaseVideoItem[]>([]);

  const loadShowcaseVideos = () => {
    fetch("/api/videos")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setShowcaseVideos(data.filter((v: ShowcaseVideoItem) => v.active !== false));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadShowcaseVideos();
    const onVideosUpdated = () => loadShowcaseVideos();
    window.addEventListener("videos-updated", onVideosUpdated);
    return () => window.removeEventListener("videos-updated", onVideosUpdated);
  }, []);

  const heroSlides = useMemo(() => {
    return Array.isArray(settings.heroSlides) && settings.heroSlides.length > 0
      ? settings.heroSlides
      : [
          {
            id: "s1",
            badge: settings.heroBadge,
            title: settings.heroTitle,
            subtitle: settings.heroSubtitle,
            ctaText: settings.heroCtaText,
            ctaLink: settings.heroCtaLink,
            image: settings.heroBannerImage1,
          },
        ];
  }, [settings]);

  const activeBannerIdx = currentBanner % heroSlides.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const fetchCatalog = (force = false) => {
      cachedFetchJson<any[]>("/api/products", { forceRefresh: force })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const published = data.filter((p: any) => p.status === "published" || !p.status);
            const seen = new Set<string>();
            const uniqueProducts: Product[] = [];
            for (const p of published) {
              const key = p.offerId ? `offer-${p.offerId}` : p.id || p.name;
              if (!seen.has(key)) {
                seen.add(key);
                uniqueProducts.push(p);
              }
            }
            setProducts(uniqueProducts.length > 0 ? uniqueProducts : SAMPLE_PRODUCTS);
          } else {
            setProducts(SAMPLE_PRODUCTS);
          }
        })
        .catch(() => {
          setProducts(SAMPLE_PRODUCTS);
        });
    };

    fetchCatalog(false);

    const onProductsUpdated = () => {
      fetchCatalog(true);
    };
    window.addEventListener("products-updated", onProductsUpdated);
    return () => window.removeEventListener("products-updated", onProductsUpdated);
  }, [settings.rmbRate]);

  // Dynamic Shipping Rate Calculation from SiteSettings
  const calculatedShippingCost = useMemo(() => {
    const weight = Math.max(0.1, Number(calcWeight) || 1);
    const airNorm = Number(settings.airNormalRate) || 780;
    const airSens = Number(settings.airSensitiveRate) || 1200;
    const seaNorm = Number(settings.seaNormalRate) || 250;
    const seaSens = Number(settings.seaSensitiveRate) || 350;

    let perKgRate = airNorm;
    if (calcShippingType === "air") {
      perKgRate = calcGoodsType === "sensitive" ? airSens : airNorm;
    } else {
      perKgRate = calcGoodsType === "sensitive" ? seaSens : seaNorm;
    }

    const freightCost = Math.round(weight * perKgRate);
    return {
      perKgRate,
      freightCost,
      customsTax: 0,
      handlingFee: 0,
      totalCost: freightCost,
      deliveryTime:
        calcShippingType === "air"
          ? settings.airDeliveryDays || "7-12 Days"
          : settings.seaDeliveryDays || "35-45 Days",
    };
  }, [calcWeight, calcShippingType, calcGoodsType, settings]);

  const handleLinkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = importUrlInput.trim();
    if (!url) return;

    // If user pasted one or more Apify Dataset URLs, auto-upload them to the store and navigate to their category!
    if (url.includes("api.apify.com/v2/datasets/") || url.includes("#catalog=")) {
      try {
        const res = await fetch("/api/admin/apify/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawTextWithCategories: url,
            autoSave: true,
          }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.products) && data.products.length > 0) {
          invalidateApiCache("/api/products");
          const firstCat = data.products[0]?.category || "Bags";
          navigate(`/shop?category=${encodeURIComponent(firstCat)}`);
          return;
        }
      } catch (err) {
        console.error("Apify auto-import error:", err);
      }
    }

    const match = url.match(/offer\/(\d+)\.html/) || url.match(/(\d{10,14})/);
    if (match && match[1]) {
      const offerId = match[1];
      navigate(`/product/abb-${offerId}`);
    } else if (url.startsWith("http://") || url.startsWith("https://")) {
      setRequestForm((prev) => ({ ...prev, productUrl: url }));
      setShowRequestModal(true);
    } else {
      navigate(`/shop?search=${encodeURIComponent(url)}`);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setImportUrlInput(text);
        }
      }
    } catch {}
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.phone || !requestForm.name) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sourcing-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: requestForm.name,
          phone: requestForm.phone,
          productUrl: requestForm.productUrl || requestForm.productTitle,
          shippingMethod: requestForm.shippingPreference,
          goodsType: "normal",
          weight: "1",
          quantity: requestForm.estimatedQuantity,
          notes: `${requestForm.productTitle ? `Title: ${requestForm.productTitle}. ` : ""}${requestForm.notes}`,
        }),
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
          setShowRequestModal(false);
          setRequestForm({
            name: "",
            phone: "",
            email: "",
            productTitle: "",
            productUrl: "",
            estimatedQuantity: "1",
            shippingPreference: "air",
            notes: "",
          });
        }, 2200);
      }
    } catch (err) {
      console.error("Error submitting sourcing request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setTimeout(() => {
        setNewsletterSubscribed(false);
        setNewsletterEmail("");
      }, 3500);
    }
  };

  const storeCategories = useMemo(() => {
    return mergeWithStoreCategories(null, products);
  }, [products]);

  const categoryProductSections = useMemo(() => {
    const list = products.length > 0 ? products : SAMPLE_PRODUCTS;
    const productIndexMap = new Map<string, number>();
    list.forEach((p, idx) => {
      if (p && p.id && !productIndexMap.has(p.id)) {
        productIndexMap.set(p.id, idx);
      }
    });

    return storeCategories
      .map((cat) => {
        const catProds = list.filter((p) => matchesCategory(p.category, cat.name, p.name));
        const newestIdx = catProds.length > 0 ? (productIndexMap.get(catProds[0].id) ?? 999999) : 999999;
        return {
          category: cat,
          products: catProds,
          count: catProds.length,
          newestIdx,
        };
      })
      .filter((sec) => sec.products.length > 0)
      .sort((a, b) => a.newestIdx - b.newestIdx);
  }, [storeCategories, products]);

  const [visibleMixedCount, setVisibleMixedCount] = useState(20);

  // Interleave products round-robin across all categories so the homepage always shows diverse product types
  const mixedDiverseProducts = useMemo(() => {
    const list = products.length > 0 ? products : SAMPLE_PRODUCTS;
    if (categoryProductSections.length <= 1) return list;

    const buckets = categoryProductSections.map((sec) => [...sec.products]);
    const usedIds = new Set<string>();
    const mixed: Product[] = [];

    let addedInRound = true;
    let round = 0;
    while (addedInRound && round < 500) {
      addedInRound = false;
      for (const bucket of buckets) {
        if (round < bucket.length) {
          const item = bucket[round];
          const key = String(item.id || `${item.name}-${round}`);
          if (!usedIds.has(key)) {
            usedIds.add(key);
            mixed.push(item);
            addedInRound = true;
          }
        }
      }
      round++;
    }

    for (const item of list) {
      const key = String(item.id || item.name);
      if (!usedIds.has(key)) {
        usedIds.add(key);
        mixed.push(item);
      }
    }

    return mixed;
  }, [products, categoryProductSections]);

  const flashSaleList = useMemo(() => {
    return mixedDiverseProducts.length >= 4
      ? mixedDiverseProducts.slice(0, 4)
      : SAMPLE_PRODUCTS.slice(0, 4);
  }, [mixedDiverseProducts]);

  const factoryWholesaleList = useMemo(() => {
    return mixedDiverseProducts.length >= 12
      ? mixedDiverseProducts.slice(4, 12)
      : mixedDiverseProducts.slice(0, 8);
  }, [mixedDiverseProducts]);

  const trustIcons = [ShieldCheck, Plane, Ship, Truck];

  return (
    <div className="min-h-screen relative text-slate-800 font-sans text-xs">
      <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-2 pb-14 space-y-6 sm:space-y-8">
        {/* 1. HERO SOURCING HUB */}
        <LiveEditableSection
          sectionId="hero"
          label="Hero Carousel & Link Search"
          visible={settings.showHeroSection}
        >
          <section className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
              {/* Left Column: Quick Category Sourcing Menu */}
              <div className="hidden lg:flex lg:col-span-3 bg-white rounded-lg shadow-2xs border border-gray-200 p-2.5 h-full flex-col justify-between">
                <div className="border-b border-gray-100 pb-2 mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wide">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>Categories</span>
                  </div>
                  <Link to="/shop" className="text-[11px] font-semibold text-primary hover:underline">
                    View All
                  </Link>
                </div>

                <div className="space-y-0.5 overflow-y-auto max-h-[340px] pr-1">
                  {WORLD_BUY_CATEGORIES.map((cat, idx) => {
                    if (cat.hasSubCategories && cat.subCategories) {
                      const isHeroOpen = openHeroMainCat === cat.name;
                      return (
                        <div key={idx} className="rounded-md border border-transparent">
                          <div
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] font-bold transition group ${
                              isHeroOpen
                                ? "bg-primary/10 text-primary"
                                : "text-slate-800 hover:text-primary hover:bg-red-50/50"
                            }`}
                          >
                            <Link
                              to={`/shop?category=${encodeURIComponent(cat.slug || cat.name)}`}
                              className="flex items-center gap-2 truncate flex-1 hover:text-primary transition"
                            >
                              <img
                                src={getSafeImageUrl(cat.image, undefined, cat.name)}
                                alt={cat.name}
                                className="w-5 h-5 rounded object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                              />
                              <span className="truncate">{cat.name}</span>
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenHeroMainCat(isHeroOpen ? null : cat.name);
                              }}
                              className="p-1 hover:bg-primary/20 rounded cursor-pointer shrink-0"
                              title={`Toggle ${cat.name} sub-categories`}
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-primary transition-transform ${
                                  isHeroOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>

                          {isHeroOpen && (
                            <div className="mt-1 mb-1.5 ml-2 pl-2 border-l-2 border-primary/30 space-y-0.5 bg-slate-50/80 rounded-r-lg py-1.5 pr-1">
                              {cat.subCategories.map((sub) => (
                                <Link
                                  key={sub.id}
                                  to={`/shop?category=${encodeURIComponent(sub.name)}`}
                                  className="flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium text-slate-700 hover:text-primary hover:bg-white transition"
                                >
                                  <span className="truncate">{sub.name}</span>
                                  <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={idx}
                        to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                        className="flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] font-medium text-slate-700 hover:text-primary hover:bg-red-50/50 transition group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <img
                            src={getSafeImageUrl(cat.image, undefined, cat.name)}
                            alt={cat.name}
                            className="w-5 h-5 rounded object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition" />
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-gray-100 mt-1.5">
                  <div className="p-2 rounded-md bg-teal-50/70 border border-teal-100 flex items-center gap-2">
                    <Award className="w-4 h-4 text-secondary flex-shrink-0" />
                    <div className="text-[10px] leading-tight">
                      <p className="font-bold text-slate-900">Verified Factory Direct</p>
                      <p className="text-slate-500">Genuine manufacturer supplies</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Column: Hero Banner Carousel & Instant URL Search */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-3">
                {(() => {
                  const currentSlide = heroSlides[activeBannerIdx];
                  const isPromoImageOnly = Boolean(currentSlide?.imageOnly || !currentSlide?.title?.trim());
                  return (
                    <div className="relative rounded-xl overflow-hidden shadow-2xs min-h-[260px] sm:min-h-[290px] flex flex-col justify-end text-white group/hero bg-slate-900">
                      {isPromoImageOnly ? (
                        <Link
                          to={currentSlide?.ctaLink || "/shop"}
                          className="absolute inset-0 z-0 block cursor-pointer"
                        >
                          <img
                            src={getSafeImageUrl(currentSlide?.image, undefined, currentSlide?.title || "World-Buy-BD-Banner")}
                            alt="Promotional Banner"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/hero:scale-[1.01]"
                          />
                        </Link>
                      ) : (
                        <>
                          <div className="absolute inset-0 z-0">
                            <img
                              src={getSafeImageUrl(currentSlide?.image, undefined, currentSlide?.title || "World-Buy-BD-Banner")}
                              alt={currentSlide?.title || "Hero Banner"}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-secondary/80 to-secondary/40" />
                          </div>

                          <div className="relative z-10 space-y-2 p-5 sm:p-6">
                            {currentSlide?.badge && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold tracking-wide uppercase">
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>{currentSlide.badge}</span>
                              </div>
                            )}

                            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-snug drop-shadow-xs">
                              {currentSlide?.title}
                            </h1>

                            {currentSlide?.subtitle && (
                              <p className="text-[11px] sm:text-xs text-slate-100 max-w-md leading-relaxed drop-shadow-2xs">
                                {currentSlide.subtitle}
                              </p>
                            )}

                            <div className="pt-1.5 flex flex-wrap items-center gap-2.5">
                              <Link
                                to={currentSlide?.ctaLink || "/shop"}
                                className="px-4 py-2 rounded-md bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition hover:-translate-y-0.5 cursor-pointer"
                              >
                                <span>{currentSlide?.ctaText || "Browse Products"}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                type="button"
                                onClick={() => setShowRequestModal(true)}
                                className="px-3.5 py-2 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs border border-white/30 transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Custom Sourcing Quote</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Left / Right Slider Arrows on Hover */}
                      {heroSlides.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentBanner((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition cursor-pointer"
                            aria-label="Previous Slide"
                          >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentBanner((prev) => (prev + 1) % heroSlides.length);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition cursor-pointer"
                            aria-label="Next Slide"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Carousel Dots */}
                      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/45 backdrop-blur-md px-2 py-1 rounded-full">
                        {heroSlides.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentBanner(i)}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                              activeBannerIdx === i ? "w-4 bg-primary" : "w-1.5 bg-white/60"
                            }`}
                            aria-label={`Slide ${i + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Direct Product Link / SKU Search Box */}
                <div className="bg-white rounded-lg p-3 shadow-2xs border border-gray-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Search className="w-3.5 h-3.5 text-primary" />
                      <span>{settings.linkSearchHeading}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="text-[11px] font-semibold text-primary hover:text-primary-dark flex items-center gap-1 cursor-pointer"
                    >
                      <Clipboard className="w-3 h-3" />
                      <span>Paste</span>
                    </button>
                  </div>

                  <form onSubmit={handleLinkImportSubmit} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={importUrlInput}
                        onChange={(e) => setImportUrlInput(e.target.value)}
                        placeholder={settings.linkSearchPlaceholder}
                        className="w-full pl-3 pr-7 py-2 bg-slate-50 border border-gray-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-primary focus:bg-white transition"
                      />
                      {importUrlInput && (
                        <button
                          type="button"
                          onClick={() => setImportUrlInput("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-md transition shadow-2xs flex-shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Search</span>
                    </button>
                  </form>

                  <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-gray-100 text-[10px] text-slate-500 overflow-x-auto">
                    <span className="font-semibold text-slate-700 flex-shrink-0">Sample SKUs:</span>
                    <button
                      type="button"
                      onClick={() => setImportUrlInput("963357947517")}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded transition flex-shrink-0 cursor-pointer"
                    >
                      #963357947517 (Fitness Straps)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportUrlInput("1080674739855")}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded transition flex-shrink-0 cursor-pointer"
                    >
                      #1080674739855 (GM Sunglasses)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Customer Service & Quick Action Hub */}
              <div className="lg:col-span-3">
                <LiveEditableSection sectionId="quickhub" label="Quick Service Cards" className="h-full">
                  <div className="space-y-2.5 flex flex-col justify-between h-full">
                    {/* Quick Order & Invoice Status Card */}
                    <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800 shadow-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded">
                          Order & Invoice Hub
                        </span>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h3 className="text-xs font-bold text-white">
                        Order Tracking & Invoice Download
                      </h3>
                      <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                        View your order item details, weight, shipping charges, and official 2-part invoice.
                      </p>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <Link
                          to="/dashboard?tab=orders"
                          className="flex-1 text-center py-1.5 px-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-[11px] transition"
                        >
                          My Orders & Invoices
                        </Link>
                        <Link
                          to="/track-order"
                          className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 transition"
                        >
                          Track Now
                        </Link>
                      </div>
                    </div>

                    <div
                      onClick={() => setShowRequestModal(true)}
                      className="bg-white rounded-xl p-3 border border-gray-200 hover:border-primary hover:shadow-2xs transition cursor-pointer group"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 group-hover:text-primary transition">
                            {settings.quickCard1Title}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{settings.quickCard1Desc}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary mt-1">
                            <span>{settings.quickCard1Cta}</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href="#shipping-calc"
                      className="bg-white rounded-xl p-3 border border-gray-200 hover:border-secondary hover:shadow-2xs transition cursor-pointer group block"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-white flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 group-hover:text-secondary transition">
                            {settings.quickCard2Title}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{settings.quickCard2Desc}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary mt-1">
                            <span>{settings.quickCard2Cta}</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </a>

                    <a
                      href={`https://wa.me/${(settings.whatsappNumber || "8801616045789").replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl p-3 bg-secondary text-white flex items-center justify-between hover:opacity-95 shadow-2xs transition"
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-300" />
                        <div className="text-left">
                          <p className="text-xs font-bold leading-tight">{settings.quickCard4Title}</p>
                          <p className="text-[10px] text-slate-200">{settings.quickCard4Desc}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </LiveEditableSection>
              </div>
            </div>
          </section>
        </LiveEditableSection>

        {/* 2. CORE VALUE PROPOSITION & TRUST BADGES GRID */}
        <LiveEditableSection
          sectionId="trust"
          label="4 Trust Badges"
          visible={settings.showTrustBadges}
        >
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(settings.trustBadges || []).slice(0, 4).map((badge, idx) => {
              const Icon = trustIcons[idx % trustIcons.length];
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-2xs flex items-center gap-3 hover:border-primary/40 transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{badge.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </section>
        </LiveEditableSection>

        {/* 3. PRODUCT & FACTORY VIDEO SHOWCASE SECTION */}
        <LiveEditableSection
          sectionId="videos"
          label="Product & Factory Videos"
          visible={settings.showCategoriesShowcase && showcaseVideos.length > 0}
        >
          <section id="video-showcase" className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-6 bg-primary rounded-full" />
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" />
                    <span>Live Product & Factory Video Showcase</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Watch real product videos and quality inspections directly from our global factory partners and warehouses
                  </p>
                </div>
              </div>

              <Link
                to="/shop"
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>View All Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {showcaseVideos.map((vid) => {
                const ytEmbed = getYouTubeEmbedUrl(vid.videoUrl);
                return (
                  <div
                    key={vid.id}
                    className="rounded-xl border border-gray-200 hover:border-primary/50 bg-slate-50/50 hover:bg-white shadow-2xs hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-full aspect-video bg-slate-950 relative overflow-hidden">
                        {ytEmbed ? (
                          <iframe
                            src={ytEmbed}
                            title={vid.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={vid.videoUrl}
                            poster={vid.thumbnailUrl || undefined}
                            controls
                            preload="metadata"
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-bold text-primary truncate">
                            {vid.category || "Factory Direct"}
                          </span>
                          {vid.priceText && (
                            <span className="font-semibold text-emerald-700 truncate">
                              {vid.priceText}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-primary transition">
                          {vid.title}
                        </h3>

                        {vid.subtitle && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {vid.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-3.5 pb-3 pt-1 flex items-center justify-between gap-2">
                      <Link
                        to={vid.productLink || `/shop?category=${encodeURIComponent(vid.category || "All")}`}
                        className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-primary text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <span>Explore Category Products</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </LiveEditableSection>

        {/* 4. FLASH SALE / HOT DEALS */}
        <LiveEditableSection
          sectionId="flashsale"
          label="Flash Sale Banner"
          visible={settings.showFlashSale}
        >
          <section id="flash-sale" className="relative">
            <div className="rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-2xs bg-gradient-to-r from-slate-900 via-secondary to-accent text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4 border-b border-white/10 pb-3.5 relative z-10">
                <div className="flex items-center gap-2.5 text-center md:text-left">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-xs flex-shrink-0">
                    <Flame className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-primary text-white px-2 py-0.5 rounded-full">
                        {settings.flashSaleTag}
                      </span>
                      <span className="text-[10px] text-amber-300 font-medium">{settings.flashSaleSubtitle}</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                      {settings.flashSaleTitle}
                    </h2>
                  </div>
                </div>

                <FlashSaleCountdown />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
                {flashSaleList.map((product, pIdx) => (
                  <ProductCard
                    key={`flash-${product.id || "prod"}-${pIdx}`}
                    product={product}
                    badgeText="HOT DEAL"
                  />
                ))}
              </div>
            </div>
          </section>
        </LiveEditableSection>

        {/* 5. DIRECT FACTORY WHOLESALE CATALOG */}
        <LiveEditableSection
          sectionId="trust"
          label="Wholesale Catalog Section"
          visible={settings.showWholesaleSection}
        >
          <section className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-6 bg-primary rounded-full" />
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    {settings.wholesaleSectionTitle}
                  </h2>
                  <p className="text-[11px] text-slate-500">{settings.wholesaleSectionSubtitle}</p>
                </div>
              </div>
              <Link
                to="/shop"
                className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {factoryWholesaleList.map((product, pIdx) => (
                <ProductCard key={`factory-${product.id || "prod"}-${pIdx}`} product={product} badgeText="WHOLESALE" />
              ))}
            </div>
          </section>
        </LiveEditableSection>

        {/* 6. MIXED MULTI-CATEGORY PRODUCTS SHOWCASE (ALL TYPES OF PRODUCTS) */}
        <LiveEditableSection
          sectionId="trust"
          label="Homepage Mixed Products"
          visible={settings.showTrendingSection}
        >
          <section className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-2xs space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {mixedDiverseProducts.slice(0, visibleMixedCount).map((product, pIdx) => (
                <ProductCard key={`mixed-${product.id || "prod"}-${pIdx}`} product={product} />
              ))}
            </div>

            {mixedDiverseProducts.length > visibleMixedCount && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleMixedCount((prev) => prev + 20)}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>Load More Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </section>
        </LiveEditableSection>

        {/* 7. CATEGORY-WISE UPLOADED PRODUCTS SHOWCASE */}
        {categoryProductSections.length > 0 && (
          <div className="space-y-6">
            {categoryProductSections.map((group) => {
              const IconComp = group.category.IconComponent || getCategoryIcon(group.category.name);
              return (
                <section
                  key={group.category.id || group.category.name}
                  className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                            {group.category.name}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-primary border border-red-100">
                            {group.count} Products
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Explore direct import products in {group.category.name}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/shop?category=${encodeURIComponent(group.category.name)}`}
                      className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <span>View All</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {group.products.slice(0, 5).map((product, pIdx) => (
                      <ProductCard
                        key={`home-cat-${group.category.slug}-${product.id || "prod"}-${pIdx}`}
                        product={product}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* 8. INTERACTIVE CHINA-TO-BD SHIPPING COST CALCULATOR */}
        <LiveEditableSection
          sectionId="calculator"
          label="Shipping Rate Calculator"
          visible={settings.showShippingCalculator}
        >
          <section id="shipping-calc" className="relative">
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-2xs">
              <div className="max-w-2xl mx-auto text-center mb-5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {settings.calcBadge}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
                  {settings.calcTitle}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-lg mx-auto">{settings.calcSubtitle}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                <div className="lg:col-span-7 space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wide">
                      1. Select Freight Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCalcShippingType("air")}
                        className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition cursor-pointer ${
                          calcShippingType === "air"
                            ? "border-primary bg-primary/5 text-slate-900 ring-1 ring-primary"
                            : "border-gray-200 hover:border-gray-300 bg-white text-slate-600"
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded ${
                            calcShippingType === "air" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Plane className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Express Air Cargo</div>
                          <div className="text-[10px] text-slate-500">
                            {settings.airDeliveryDays} (BDT {settings.airNormalRate}/KG)
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCalcShippingType("sea")}
                        className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition cursor-pointer ${
                          calcShippingType === "sea"
                            ? "border-secondary bg-teal-50/40 text-slate-900 ring-1 ring-secondary"
                            : "border-gray-200 hover:border-gray-300 bg-white text-slate-600"
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded ${
                            calcShippingType === "sea" ? "bg-secondary text-white" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Ship className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Economy Sea Cargo</div>
                          <div className="text-[10px] text-slate-500">
                            {settings.seaDeliveryDays} (BDT {settings.seaNormalRate}/KG)
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wide">
                      2. Goods Type
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCalcGoodsType("normal")}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                          calcGoodsType === "normal"
                            ? "border-secondary bg-secondary text-white"
                            : "border-gray-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        General Cargo (Apparel, Shoes, Bags)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcGoodsType("sensitive")}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                          calcGoodsType === "sensitive"
                            ? "border-secondary bg-secondary text-white"
                            : "border-gray-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Sensitive (Battery, Liquid, Powder)
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        3. Estimated Weight: <span className="text-primary font-bold">{calcWeight} KG</span>
                      </label>
                      <div className="flex items-center gap-1 text-[11px]">
                        <input
                          type="number"
                          min="0.1"
                          step="0.5"
                          value={calcWeight}
                          onChange={(e) => setCalcWeight(Math.max(0.1, Number(e.target.value)))}
                          className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-center font-bold text-xs"
                        />
                        <span className="font-semibold text-slate-500">KG</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="100"
                      step="0.5"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>

                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-secondary text-white rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                      Estimated Total Freight
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                      Tax Included
                    </span>
                  </div>

                  <div className="space-y-1.5 py-1">
                    <div className="flex justify-between text-xs text-slate-200">
                      <span>Per KG Rate:</span>
                      <span className="font-bold text-white">BDT {calculatedShippingCost.perKgRate} / KG</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-200">
                      <span>Delivery Duration:</span>
                      <span className="font-bold text-emerald-300">{calculatedShippingCost.deliveryTime}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-200">
                      <span>Customs & Duty:</span>
                      <span className="font-bold text-emerald-300">100% Free</span>
                    </div>
                  </div>

                  <div className="border-t border-white/15 pt-2.5">
                    <div className="text-[10px] text-slate-300 uppercase font-semibold">Total Estimated Cost</div>
                    <div className="text-xl sm:text-2xl font-black text-amber-300">
                      BDT {calculatedShippingCost.totalCost.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{settings.calcDisclaimer}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRequestModal(true)}
                    className="w-full py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-md shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Request Product Sourcing</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </LiveEditableSection>

        {/* 8. HOW IT WORKS (4 EASY STEPS) */}
        <LiveEditableSection
          sectionId="howitworks"
          label="How It Works (4 Steps)"
          visible={settings.showHowItWorks}
        >
          <section id="how-it-works" className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-2xs space-y-4">
            <div className="max-w-xl mx-auto text-center">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full">
                {settings.howItWorksBadge}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
                {settings.howItWorksTitle}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{settings.howItWorksSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
              {(settings.howItWorksSteps || []).map((st, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80 relative">
                  <div className="w-7 h-7 rounded bg-primary text-white font-bold text-xs flex items-center justify-center mb-2">
                    {st.step || idx + 1}
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">{st.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </LiveEditableSection>

        {/* 9. ORDER JOURNEY TRACKING VISUALIZER */}
        <LiveEditableSection
          sectionId="sections"
          label="Order Journey Visualizer"
          visible={settings.showOrderJourney}
        >
          <section className="space-y-2">
            <OrderJourney />
          </section>
        </LiveEditableSection>

        {/* 10. VERIFIED CUSTOMER REVIEWS */}
        <LiveEditableSection
          sectionId="testimonials"
          label="Customer Testimonials"
          visible={settings.showTestimonials}
        >
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {settings.testimonialsTitle}
                </h2>
                <p className="text-[11px] text-slate-500">{settings.testimonialsSubtitle}</p>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-bold text-slate-800">{settings.testimonialsRatingText}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
              {(settings.testimonials || []).map((rev, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3.5 border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed italic">"{rev.comment}"</p>
                  <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    <div>
                      <h4 className="font-bold text-slate-900">{rev.name}</h4>
                      <p className="text-[10px] text-slate-400">{rev.location}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700">{rev.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </LiveEditableSection>

        {/* 11. FREQUENTLY ASKED QUESTIONS (FAQ) */}
        <LiveEditableSection
          sectionId="faq"
          label="FAQ Section"
          visible={settings.showFaqSection}
        >
          <section id="faq" className="space-y-3">
            <div className="max-w-xl mx-auto text-center">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full">
                {settings.faqBadge}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">{settings.faqTitle}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{settings.faqSubtitle}</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-2">
              {(settings.faqs || []).map((faq, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-900 hover:text-primary transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        openFaq === idx ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-3.5 pb-3 pt-1 text-[11px] text-slate-600 leading-relaxed border-t border-gray-100 bg-slate-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </LiveEditableSection>

        {/* 12. NEWSLETTER SUBSCRIPTION BANNER */}
        <LiveEditableSection
          sectionId="newsletter"
          label="Newsletter Banner"
          visible={settings.showNewsletter}
        >
          <section className="bg-gradient-to-r from-secondary to-slate-900 rounded-xl p-5 text-white shadow-2xs">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <h3 className="text-sm sm:text-base font-bold">{settings.newsletterTitle}</h3>
              <p className="text-[11px] text-slate-200 max-w-md mx-auto">{settings.newsletterSubtitle}</p>

              <form onSubmit={handleNewsletterSubmit} className="flex max-w-sm mx-auto gap-2 pt-1">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="flex-1 px-3 py-1.5 rounded-md bg-white text-slate-800 text-xs placeholder-slate-400 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary-dark text-white font-bold text-xs transition cursor-pointer flex-shrink-0"
                >
                  {newsletterSubscribed ? "Subscribed!" : settings.newsletterButtonText || "Subscribe"}
                </button>
              </form>
            </div>
          </section>
        </LiveEditableSection>
      </div>

      {/* CUSTOM SOURCING REQUEST MODAL */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-5 shadow-xl border border-gray-200 relative text-xs max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-3">
                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Custom Sourcing Quote</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Request Factory Sourcing</h3>
                <p className="text-[11px] text-slate-500">
                  Provide product details or supplier links. Our Guangzhou sourcing desk will negotiate the lowest price.
                </p>
              </div>

              {submitSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Request Submitted Successfully!</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Our team will contact you via WhatsApp / Phone shortly with wholesale quotation.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={requestForm.name}
                        onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                        placeholder="Full Name"
                        className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs focus:outline-hidden focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={requestForm.phone}
                        onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                        placeholder="e.g. 01712345678"
                        className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs focus:outline-hidden focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                      Product Link or Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={requestForm.productUrl}
                      onChange={(e) => setRequestForm({ ...requestForm, productUrl: e.target.value })}
                      placeholder="e.g. Paste link or product name"
                      className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                        Estimated Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={requestForm.estimatedQuantity}
                        onChange={(e) => setRequestForm({ ...requestForm, estimatedQuantity: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs focus:outline-hidden focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                        Shipping Mode
                      </label>
                      <select
                        value={requestForm.shippingPreference}
                        onChange={(e) => setRequestForm({ ...requestForm, shippingPreference: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs focus:outline-hidden focus:border-primary"
                      >
                        <option value="air">Air Cargo ({settings.airDeliveryDays})</option>
                        <option value="sea">Sea Cargo ({settings.seaDeliveryDays})</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                      Additional Notes / Specifications
                    </label>
                    <textarea
                      rows={2}
                      value={requestForm.notes}
                      onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                      placeholder="Colors, sizes, or specific factory requirements..."
                      className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <span>Submit Sourcing Request</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
