import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MAIN_CATEGORIES_LIST,
  getCategoryIcon,
  getMainCategoriesWithSubs,
  matchesCategory,
} from "../utils/categories";
import { LayoutGrid, ChevronRight, ChevronDown } from "lucide-react";
import { cachedFetchJson } from "../utils/apiCache";

export default function SidebarCategories() {
  const [categories, setCategories] = useState(MAIN_CATEGORIES_LIST);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    Promise.all([
      cachedFetchJson<any[]>("/api/categories").catch(() => []),
      cachedFetchJson<any[]>("/api/products").catch(() => []),
    ])
      .then(([catsData, prodsData]) => {
        setCategories(getMainCategoriesWithSubs(catsData, prodsData));
      })
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get("category");

  useEffect(() => {
    if (!currentCategory) return;
    for (const cat of categories) {
      if (
        cat.subCategories &&
        cat.subCategories.length > 0 &&
        (cat.name.toLowerCase() === currentCategory.toLowerCase() ||
          cat.subCategories.some((s) => s.name.toLowerCase() === currentCategory.toLowerCase()))
      ) {
        setExpandedSlug(cat.slug);
        break;
      }
    }
  }, [currentCategory, categories]);

  return (
    <div className="w-64 flex-shrink-0 hidden lg:block bg-white rounded-xl shadow-sm border border-border h-fit overflow-hidden sticky top-[80px]">
      <div className="p-4 bg-primary text-white flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
        <LayoutGrid className="w-5 h-5" />
        <span>Categories</span>
      </div>
      <div className="py-2 overflow-y-auto max-h-[calc(100vh-140px)]">
        <ul className="space-y-1">
          {categories.map((cat, idx) => {
            const Icon = cat.IconComponent || getCategoryIcon(cat.name);
            const hasSubs = Array.isArray(cat.subCategories) && cat.subCategories.length > 0;
            const isSubActive = Boolean(
              hasSubs &&
                currentCategory &&
                cat.subCategories!.some((s) => s.name.toLowerCase() === currentCategory.toLowerCase())
            );
            const isMainActive = Boolean(
              currentCategory &&
                (cat.name.toLowerCase() === currentCategory.toLowerCase() ||
                  (!hasSubs && matchesCategory(cat.name, currentCategory)))
            );
            const isExpanded = expandedSlug === cat.slug || isMainActive || isSubActive;

            return (
              <li key={cat.id || idx}>
                {hasSubs ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedSlug(expandedSlug === cat.slug ? null : cat.slug)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                        isMainActive || isSubActive
                          ? "text-primary bg-primary/5 font-bold border-l-4 border-primary"
                          : "text-charcoal hover:text-primary hover:bg-gray-50 border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isMainActive || isSubActive ? "text-primary" : "text-gray-400"}`} />
                        <span>{cat.name}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? "rotate-180 text-primary" : ""}`}
                      />
                    </button>

                    {isExpanded && (
                      <ul className="bg-slate-50/90 border-y border-slate-100 py-1.5 pl-8 pr-3 space-y-0.5">
                        {cat.subCategories!.map((sub) => {
                          const activeSub =
                            currentCategory && sub.name.toLowerCase() === currentCategory.toLowerCase();
                          return (
                            <li key={sub.id}>
                              <Link
                                to={`/shop?category=${encodeURIComponent(sub.name)}`}
                                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                                  activeSub
                                    ? "bg-primary text-white font-bold"
                                    : "text-slate-600 hover:text-primary hover:bg-white font-medium"
                                }`}
                              >
                                <span>{sub.name}</span>
                                <ChevronRight className="w-3 h-3 opacity-60" />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.name)}`}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      isMainActive
                        ? "text-primary bg-primary/5 font-semibold border-l-4 border-primary"
                        : "text-charcoal hover:text-primary hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isMainActive ? "text-primary" : "text-gray-400"}`} />
                      <span>{cat.name}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
