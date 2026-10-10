import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import { Product } from "../types";
import { Filter, ChevronRight, ChevronLeft, ArrowLeft, RefreshCw, X, Search, Tag, Sparkles, Layers, Boxes, Camera } from "lucide-react";
import { CATEGORIES_LIST, EXPANDABLE_MAIN_CATEGORIES, getParentCategoryInfo, matchesCategory, getCategoryIcon, getCategoryImage, mergeWithStoreCategories, getCanonicalCategoryName } from "../utils/categories";
import { cachedFetchJson, getSyncCached } from "../utils/apiCache";

const ITEMS_PER_PAGE = 20;

export default function Shop() {
  const initialCachedProducts = getSyncCached<Product[]>("/api/products");
  const [allProducts, setAllProducts] = useState<Product[]>(() =>
    Array.isArray(initialCachedProducts)
      ? initialCachedProducts.filter((p: any) => p.status === "published" || !p.status)
      : []
  );
  const [serverCategories, setServerCategories] = useState<any[]>([]);
  const categories = useMemo(
    () => mergeWithStoreCategories(serverCategories, allProducts),
    [serverCategories, allProducts]
  );
  const [loading, setLoading] = useState(!Array.isArray(initialCachedProducts));
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "";
  const searchParam = searchParams.get("search") || "";
  const idsParam = searchParams.get("ids") || "";
  const exactIdParam = searchParams.get("exactId") || "";
  const visualTitleParam = searchParams.get("visualTitle") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [sortBy, setSortBy] = useState<string>("Newest");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollState = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
    }
  };

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    checkScrollState();
    el.addEventListener("scroll", checkScrollState, { passive: true });
    window.addEventListener("resize", checkScrollState);
    return () => {
      el.removeEventListener("scroll", checkScrollState);
      window.removeEventListener("resize", checkScrollState);
    };
  }, [categories]);

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollDistance = Math.max(260, Math.floor(categoryScrollRef.current.clientWidth * 0.75));
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollDistance : scrollDistance,
        behavior: "smooth",
      });
      setTimeout(checkScrollState, 350);
    }
  };

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory("");
    }
  }, [categoryParam]);

  useEffect(() => {
    const loadProducts = (forceRefresh = false) => {
      cachedFetchJson<any[]>("/api/products", { forceRefresh })
        .then((data) => {
          if (Array.isArray(data)) {
            const published = data.filter((p: any) => p.status === "published" || !p.status);
            setAllProducts(published);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load products:", err);
          setLoading(false);
        });
    };

    loadProducts(false);

    const onProductsUpdated = () => {
      loadProducts(true);
    };
    window.addEventListener("products-updated", onProductsUpdated);

    cachedFetchJson<any[]>("/api/categories")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setServerCategories(data);
        }
      })
      .catch((err) => console.error("Failed to load categories:", err));

    return () => {
      window.removeEventListener("products-updated", onProductsUpdated);
    };
  }, []);

  const handleCategorySelect = (catName: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page"); // Reset page to 1
    if (selectedCategory === catName) {
      setSelectedCategory("");
      params.delete("category");
      params.delete("ids");
      params.delete("exactId");
      params.delete("visualTitle");
      setSearchParams(params);
    } else {
      setSelectedCategory(catName);
      params.set("category", catName);
      params.delete("ids");
      params.delete("exactId");
      params.delete("visualTitle");
      setSearchParams(params);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleClearCategory = () => {
    setSelectedCategory("");
    const params = new URLSearchParams(searchParams);
    params.delete("category");
    params.delete("page");
    params.delete("ids");
    params.delete("exactId");
    params.delete("visualTitle");
    params.delete("search");
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Count products per category
  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of categories) {
      map[cat.name] = allProducts.filter((p) => matchesCategory(p.category, cat.name, p.name)).length;
    }
    for (const mc of EXPANDABLE_MAIN_CATEGORIES) {
      map[mc.name] = allProducts.filter((p) => matchesCategory(p.category, mc.name, p.name)).length;
      for (const sub of mc.subCategories || []) {
        map[sub.name] = allProducts.filter((p) => matchesCategory(p.category, sub.name, p.name)).length;
      }
    }
    return map;
  }, [categories, allProducts]);

  const activeParentCategory = useMemo(
    () => (selectedCategory ? getParentCategoryInfo(selectedCategory) : null),
    [selectedCategory]
  );
  const [openDrawerMainCat, setOpenDrawerMainCat] = useState<string | null>(null);

  useEffect(() => {
    if (activeParentCategory) {
      setOpenDrawerMainCat(activeParentCategory.name);
    }
  }, [activeParentCategory]);

  // Group products by category when in default category-row view
  const categoryGroups = useMemo(() => {
    const productIndexMap = new Map<string, number>();
    allProducts.forEach((p, idx) => {
      if (p && p.id && !productIndexMap.has(p.id)) {
        productIndexMap.set(p.id, idx);
      }
    });

    const groups = categories
      .map((cat) => {
        const prods = allProducts.filter((p) => matchesCategory(p.category, cat.name, p.name));
        const newestIdx = prods.length > 0 ? (productIndexMap.get(prods[0].id) ?? 999999) : 999999;
        return {
          category: cat,
          products: prods,
          count: prods.length,
          newestIdx,
        };
      })
      .filter((group) => group.products.length > 0)
      .sort((a, b) => a.newestIdx - b.newestIdx);

    return groups;
  }, [categories, allProducts]);

  // Filtered products when a specific category or search is active
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        if (idsParam) {
          const idList = idsParam.split(",");
          const pId = String(p.id || "");
          const pOfferId = String(p.offerId || "");
          if (!idList.includes(pId) && !idList.includes(pOfferId)) return false;
        }

        if (searchParam) {
          const q = searchParam.toLowerCase();
          const searchTokens = q.split(/\s+/).filter(Boolean);
          const nameLower = p.name ? p.name.toLowerCase() : "";
          const matchesSearch =
            (p.offerId && p.offerId.toLowerCase().includes(q)) ||
            (p.id && p.id.toLowerCase().includes(q)) ||
            nameLower.includes(q) ||
            (searchTokens.length > 0 && searchTokens.some((token) => token.length > 2 && nameLower.includes(token)));
          if (!matchesSearch) return false;
        }

        if (selectedCategory) {
          if (selectedCategory.toLowerCase() !== "all" && !matchesCategory(p.category, selectedCategory, p.name)) {
            return false;
          }
        }
        if (minPrice && p.price < Number(minPrice)) return false;
        if (maxPrice && p.price > Number(maxPrice)) return false;
        return true;
      })
      .sort((a, b) => {
        if (idsParam) {
          const idList = idsParam.split(",");
          const aId = String(a.id || "");
          const aOfferId = String(a.offerId || "");
          const bId = String(b.id || "");
          const bOfferId = String(b.offerId || "");

          const aIdx1 = idList.indexOf(aId);
          const aIdx2 = idList.indexOf(aOfferId);
          const aIndex = (aIdx1 !== -1 && aIdx2 !== -1) ? Math.min(aIdx1, aIdx2) : (aIdx1 !== -1 ? aIdx1 : (aIdx2 !== -1 ? aIdx2 : 9999));

          const bIdx1 = idList.indexOf(bId);
          const bIdx2 = idList.indexOf(bOfferId);
          const bIndex = (bIdx1 !== -1 && bIdx2 !== -1) ? Math.min(bIdx1, bIdx2) : (bIdx1 !== -1 ? bIdx1 : (bIdx2 !== -1 ? bIdx2 : 9999));

          return aIndex - bIndex;
        }
        if (sortBy === "Price: Low to High") return a.price - b.price;
        if (sortBy === "Price: High to Low") return b.price - a.price;
        if (sortBy === "Best Rated") return (b.rating || 0) - (a.rating || 0);
        return 0; // Newest by default as backend returns desc(createdAt)
      });
  }, [allProducts, selectedCategory, minPrice, maxPrice, sortBy, searchParam, idsParam]);

  // Selected category object
  const currentCategoryObj = useMemo(() => {
    if (!selectedCategory) return null;
    if (selectedCategory.toLowerCase() === "all") {
      return {
        name: "All Products",
        IconComponent: Boxes,
      };
    }
    return categories.find((c) => matchesCategory(c.name, selectedCategory)) || {
      name: getCanonicalCategoryName(selectedCategory),
      IconComponent: getCategoryIcon(selectedCategory),
    };
  }, [selectedCategory, categories]);

  // Pagination calculation: 20 products per page
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  const handlePageChange = (newPage: number) => {
    const boundedPage = Math.max(1, Math.min(newPage, totalPages));
    const params = new URLSearchParams(searchParams);
    if (boundedPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(boundedPage));
    }
    setSearchParams(params);

    const section = document.getElementById("shop-products-section");
    if (section) {
      const yOffset = -70;
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    } else {
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  return (
    <div className="py-6 sm:py-8 max-w-[1520px] mx-auto px-3 sm:px-6">
      {/* Breadcrumb Navigation */}
      <div className="text-xs sm:text-sm text-text-secondary mb-5 flex items-center gap-2 flex-wrap">
        <button 
          onClick={handleClearCategory}
          className="hover:text-primary transition-colors cursor-pointer"
        >
          Home
        </button> 
        <span>/</span> 
        <button 
          onClick={handleClearCategory}
          className={`${!selectedCategory && !searchParam && !idsParam ? "text-charcoal font-bold" : "hover:text-primary transition-colors cursor-pointer"}`}
        >
          Shop
        </button>
        {selectedCategory && (
          <>
            {activeParentCategory && selectedCategory.toLowerCase() !== activeParentCategory.name.toLowerCase() && (
              <>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => handleCategorySelect(activeParentCategory.name)}
                  className="hover:text-[#cb1e46] font-semibold transition-colors cursor-pointer"
                >
                  {activeParentCategory.name}
                </button>
              </>
            )}
            <span>/</span>
            <span className="text-[#cb1e46] font-bold">
              {selectedCategory.toLowerCase() === "all" ? "All Products" : selectedCategory}
            </span>
          </>
        )}
        {searchParam && (
          <>
            <span>/</span>
            <span className="text-primary font-medium">Search: "{searchParam}"</span>
          </>
        )}
        {idsParam && (
          <>
            <span>/</span>
            <span className="text-primary font-bold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#cb1e46]" />
              <span>{visualTitleParam ? `Visual Match: ${visualTitleParam}` : "Visual Search Results"}</span>
            </span>
          </>
        )}
      </div>

      {/* Top Category Quick-Filter Bar with Scroll Container */}
      <div className="relative group mb-2.5">
        {/* Left Arrow Button Overlay (Desktop / Tablet) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            aria-label="Scroll left"
            className="absolute -left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 text-gray-700 shadow-md border border-gray-200 flex items-center justify-center hover:text-[#cb1e46] hover:bg-white hover:scale-105 transition-all cursor-pointer backdrop-blur-xs hidden sm:flex"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          ref={categoryScrollRef}
          onScroll={checkScrollState}
          className="overflow-x-auto pb-2 scroll-smooth scrollbar-none flex items-center gap-2 sm:gap-2.5 px-0.5"
        >
          {/* All 17 Expandable Main Categories with Sub-Categories */}
          {EXPANDABLE_MAIN_CATEGORIES.map((mainCat) => {
            const isMainActive =
              openDrawerMainCat === mainCat.name ||
              activeParentCategory?.name === mainCat.name;
            const MainIcon = mainCat.IconComponent || getCategoryIcon(mainCat.name);
            return (
              <button
                key={mainCat.id}
                type="button"
                onClick={() => {
                  setOpenDrawerMainCat((prev) => (prev === mainCat.name ? null : mainCat.name));
                  if (activeParentCategory?.name !== mainCat.name) {
                    handleCategorySelect(mainCat.name);
                  }
                }}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  isMainActive
                    ? "bg-[#cb1e46] text-white border-[#cb1e46] shadow-xs"
                    : "bg-red-50/70 text-[#cb1e46] border-red-200 hover:bg-red-100/80"
                }`}
              >
                <MainIcon className="w-3.5 h-3.5" />
                <span>{mainCat.name}</span>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isMainActive ? "rotate-90" : ""
                  }`}
                />
              </button>
            );
          })}

          {categories
            .filter(
              (cat) =>
                !EXPANDABLE_MAIN_CATEGORIES.some(
                  (mc) =>
                    mc.slug === cat.slug ||
                    mc.name.toLowerCase() === cat.name.toLowerCase() ||
                    (mc.subCategories || []).some(
                      (s) => s.slug === cat.slug || s.name.toLowerCase() === cat.name.toLowerCase()
                    )
                )
            )
            .map((cat) => {
            const IconComp = cat.IconComponent || Tag;
            const isSelected = Boolean(selectedCategory && matchesCategory(cat.name, selectedCategory));
            return (
              <button
                key={cat.id || cat.name}
                onClick={() => handleCategorySelect(cat.name)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[#cb1e46] text-white border-[#cb1e46] shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-red-200 hover:bg-red-50/50"
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button Overlay (Desktop / Tablet) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            aria-label="Scroll right"
            className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 text-gray-700 shadow-md border border-gray-200 flex items-center justify-center hover:text-[#cb1e46] hover:bg-white hover:scale-105 transition-all cursor-pointer backdrop-blur-xs hidden sm:flex"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expandable Sub-Categories Drawer when any Main Category is active */}
      {(openDrawerMainCat || activeParentCategory) && (() => {
        const currentMainName = openDrawerMainCat || activeParentCategory?.name || "Bag";
        const matchedMainObj =
          EXPANDABLE_MAIN_CATEGORIES.find(
            (mc) => mc.name.toLowerCase() === currentMainName.toLowerCase()
          ) || EXPANDABLE_MAIN_CATEGORIES[0];
        const currentSubs = matchedMainObj?.subCategories || [];

        return (
          <div className="mb-5 bg-gradient-to-r from-red-50/80 via-white to-red-50/40 border-2 border-[#cb1e46]/25 rounded-2xl p-3.5 sm:p-4 shadow-xs animate-fadeIn">
            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-red-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#cb1e46]"></span>
                <h3 className="text-xs sm:text-sm font-extrabold text-charcoal">
                  {currentMainName} Sub-Categories
                </h3>
                <span className="text-[11px] text-gray-500 hidden sm:inline">
                  — Click any sub-category to view products (20 products per page)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenDrawerMainCat(null)}
                  className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Close Sub-categories"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {currentSubs.map((sub) => {
                const SubIcon = sub.IconComponent || Tag;
                const isSubSelected =
                  Boolean(selectedCategory) &&
                  selectedCategory.toLowerCase() === sub.name.toLowerCase();

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleCategorySelect(sub.name)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border text-left ${
                      isSubSelected
                        ? "bg-[#cb1e46] text-white border-[#cb1e46] shadow-2xs scale-[1.02]"
                        : "bg-white text-gray-700 border-gray-200/90 hover:border-[#cb1e46] hover:bg-red-50/50 hover:text-[#cb1e46]"
                    }`}
                  >
                    <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubSelected ? "text-white" : "text-[#cb1e46]"}`} />
                    <span className="truncate">{sub.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Navigation Buttons Underneath */}
      <div className="flex items-center justify-between gap-3 mb-6 bg-slate-50/90 border border-slate-200/80 rounded-xl px-3 sm:px-4 py-2 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-[#cb1e46] shrink-0"></span>
          <span>Browse Categories</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            disabled={!canScrollLeft}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              canScrollLeft
                ? "bg-white text-slate-700 border-slate-300 hover:border-[#cb1e46] hover:text-[#cb1e46] shadow-xs active:scale-95"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
            }`}
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4 text-inherit" />
            <span>Prev</span>
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            disabled={!canScrollRight}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              canScrollRight
                ? "bg-[#cb1e46] text-white border-[#cb1e46] hover:bg-[#ad1537] shadow-xs active:scale-95"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
            }`}
            title="Scroll Right"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4 text-inherit" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-11 w-11 border-3 border-[#cb1e46] border-t-transparent mb-3"></div>
          <p className="text-xs text-gray-500 font-medium">Loading products, please wait...</p>
        </div>
      ) : selectedCategory ? (
        /* ==================== SINGLE CATEGORY FULL VIEW (20 Products Per Page) ==================== */
        <div id="shop-products-section">
          {/* Header Bar for Category with Back Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-border/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearCategory}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#cb1e46] bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-xl border border-gray-200 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2.5">
                {currentCategoryObj?.IconComponent && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#cb1e46] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <currentCategoryObj.IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-[#cb1e46] leading-tight">
                    {selectedCategory.toLowerCase() === "all" ? "All Store Products" : selectedCategory}
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">
                    Total {filteredProducts.length} Products Found
                    {totalPages > 1 && (
                      <span className="ml-1 text-[#cb1e46] font-bold">
                        • Page {safeCurrentPage} of {totalPages} (20 per page)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Sorting */}
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              <span className="text-xs text-text-secondary font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  handlePageChange(1);
                }}
                className="border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#cb1e46] bg-white cursor-pointer"
              >
                <option>Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Best Rated</option>
              </select>
            </div>
          </div>

          {/* Full Products Grid for this category: exactly 20 items per page */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <p className="text-sm font-semibold text-charcoal mb-2">No products found in this category</p>
              <p className="text-xs text-gray-400 mb-4">Please check other categories or browse our full catalog.</p>
              <button
                onClick={handleClearCategory}
                className="bg-[#cb1e46] text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition cursor-pointer"
              >
                Browse Categories
              </button>
            </div>
          ) : (
            <>
              {/* Quick page indicator summary */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3 px-1">
                <span>
                  Showing <strong className="text-gray-900 font-bold">{startIndex + 1}–{endIndex}</strong> of <strong className="text-gray-900 font-bold">{filteredProducts.length}</strong> products
                </span>
                {totalPages > 1 && (
                  <span className="text-xs font-semibold text-[#cb1e46] bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">
                    Page {safeCurrentPage} of {totalPages}
                  </span>
                )}
              </div>

              <div className="product-grid-standard">
                {paginatedProducts.map((product, pIdx) => (
                  <ProductCard key={`${product.id || "prod"}-${startIndex + pIdx}`} product={product} />
                ))}
              </div>

              {/* 20 Products Per Page Pagination Controls */}
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={filteredProducts.length}
                startIndex={startIndex}
                endIndex={endIndex}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
                itemName="Products in this category"
              />
            </>
          )}
        </div>
      ) : (searchParam || idsParam) ? (
        /* ==================== SEARCH & VISUAL SEARCH RESULTS VIEW (20 Products Per Page) ==================== */
        <div id="shop-products-section">
          {/* Visual Search Highlight Banner */}
          {idsParam && (
            <div className="bg-gradient-to-r from-red-50 via-white to-amber-50 border border-red-200/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#cb1e46] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-red-100 text-[#cb1e46] px-2 py-0.5 rounded-md">
                        AI Visual Search
                      </span>
                      {exactIdParam && (
                        <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          Exact Match Found
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                      {visualTitleParam ? visualTitleParam : "Matching & Similar Factory Products"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Matched directly with verified source manufacturers. Top exact match displayed first, followed by similar styles.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearCategory}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 shadow-2xs hover:border-[#cb1e46] transition cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Search</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-border/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearCategory}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#cb1e46] bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-xl border border-gray-200 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-charcoal">
                  {searchParam
                    ? `Search Results for "${searchParam}"`
                    : visualTitleParam
                    ? `Visual Search: ${visualTitleParam}`
                    : "Visual Image Search Results"}
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  {filteredProducts.length} Products Found
                  {totalPages > 1 && (
                    <span className="ml-1 text-[#cb1e46] font-bold">
                      • Page {safeCurrentPage} of {totalPages} (20 per page)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs text-text-secondary font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  handlePageChange(1);
                }}
                className="border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#cb1e46] bg-white cursor-pointer"
              >
                <option>Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Best Rated</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <p className="text-sm font-semibold text-charcoal mb-2">No matching products found</p>
              <p className="text-xs text-gray-500 mb-4">Try searching with a different image or browse all categories.</p>
              <button
                onClick={handleClearCategory}
                className="bg-[#cb1e46] text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition cursor-pointer"
              >
                Browse Categories
              </button>
            </div>
          ) : (
            <>
              {/* Quick page indicator summary */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3 px-1">
                <span>
                  Showing <strong className="text-gray-900 font-bold">{startIndex + 1}–{endIndex}</strong> of <strong className="text-gray-900 font-bold">{filteredProducts.length}</strong> results
                </span>
                {totalPages > 1 && (
                  <span className="text-xs font-semibold text-[#cb1e46] bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">
                    Page {safeCurrentPage} of {totalPages}
                  </span>
                )}
              </div>

              <div className="product-grid-standard">
                {paginatedProducts.map((product, pIdx) => {
                  const isExact = exactIdParam && (product.id === exactIdParam || product.offerId === exactIdParam);
                  const badge = isExact
                    ? "⭐ Exact Match"
                    : idsParam && (startIndex + pIdx) === 0
                    ? "⭐ Best Match"
                    : idsParam
                    ? "Similar Product"
                    : undefined;

                  return (
                    <div key={`${product.id || "prod"}-${startIndex + pIdx}`} className={isExact ? "relative ring-2 ring-[#cb1e46] rounded-2xl" : ""}>
                      <ProductCard product={product} badgeText={badge} />
                    </div>
                  );
                })}
              </div>

              {/* 20 Products Per Page Pagination Controls */}
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={filteredProducts.length}
                startIndex={startIndex}
                endIndex={endIndex}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
                itemName="Search Results"
              />
            </>
          )}
        </div>
      ) : (
        /* ==================== CATEGORY ROW VIEW (1 Row Per Category) ==================== */
        <div className="space-y-6 sm:space-y-8">
          {categoryGroups.map((group) => {
            const IconComp = group.category.IconComponent || Tag;
            // Display preview row of products (up to 5 items on desktop)
            const rowProducts = group.products.slice(0, 5);

            return (
              <div
                key={group.category.id || group.category.name}
                className="bg-white rounded-2xl border border-border/80 p-3.5 sm:p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                {/* Category Row Header: Left Name & Right View All */}
                <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(group.category.name)}
                    className="flex items-center gap-2.5 text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#cb1e46] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#cb1e46] group-hover:text-primary-dark transition-colors tracking-tight flex items-center gap-2">
                      <span>{group.category.name}</span>
                    </h2>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategorySelect(group.category.name)}
                    className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold text-gray-700 hover:text-[#cb1e46] px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-red-50/80 transition-all cursor-pointer group shrink-0"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#cb1e46] group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>

                {/* Preview Row of Products for this Category */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
                  {rowProducts.map((product, pIdx) => (
                    <ProductCard key={`${product.id || "prod"}-${pIdx}`} product={product} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
