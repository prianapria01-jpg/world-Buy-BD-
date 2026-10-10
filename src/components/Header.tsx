import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Menu,
  Camera,
  X,
  ChevronDown,
  LayoutGrid,
  LogIn,
  Sparkles,
  Phone,
  ArrowRight,
  ChevronRight,
  Smartphone,
  Download
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { MAIN_CATEGORIES_LIST, getMainCategoriesWithSubs } from "../utils/categories";
import { cachedFetchJson, invalidateApiCache } from "../utils/apiCache";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import BrandLogo from "./common/BrandLogo";
import LiveEditableSection from "./common/LiveEditableSection";
import InstallAppModal from "./common/InstallAppModal";

export default function Header() {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedMainCat, setExpandedMainCat] = useState<string | null>(null);
  const [mainCategories, setMainCategories] = useState(MAIN_CATEGORIES_LIST);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    cachedFetchJson<any[]>("/api/categories")
      .then((cats) => {
        if (Array.isArray(cats)) {
          setMainCategories(getMainCategoriesWithSubs(cats));
        }
      })
      .catch(() => {});
  }, []);

  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSearchingImage, setIsSearchingImage] = useState(false);

  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleInstallApp = () => {
    setShowInstallModal(true);
  };

  const dropdownRef = useRef<HTMLLIElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        navigate("/admin");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    // Secret Admin Panel access code via search bar
    const lowerSearch = trimmed.toLowerCase();
    if (lowerSearch === "#admin" || lowerSearch === "/admin" || lowerSearch === "admin123") {
      setSearchTerm("");
      setMobileMenuOpen(false);
      navigate("/admin");
      return;
    }

    if (trimmed.includes("api.apify.com/v2/datasets/") || trimmed.includes("#catalog=")) {
      try {
        const res = await fetch("/api/admin/apify/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawTextWithCategories: trimmed,
            autoSave: true,
          }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.products) && data.products.length > 0) {
          invalidateApiCache("/api/products");
          const firstCat = data.products[0]?.category || "Bags";
          setSearchTerm("");
          setMobileMenuOpen(false);
          navigate(`/shop?category=${encodeURIComponent(firstCat)}`);
          return;
        }
      } catch (err) {
        console.error("Header Apify import failed:", err);
      }
    }

    navigate(`/shop?search=${encodeURIComponent(trimmed)}`);
    setMobileMenuOpen(false);
  };

  const handleImageSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedImage) {
      setIsSearchingImage(true);
      try {
        const payload = uploadedImage.startsWith("http")
          ? { imageUrl: uploadedImage }
          : { imageBase64: uploadedImage };

        const response = await fetch("/api/search/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        setShowImageSearchModal(false);
        const queryParams = new URLSearchParams();
        if (data.ids && data.ids.length > 0) {
          queryParams.set("ids", data.ids.join(","));
        }
        if (data.exactMatchId) {
          queryParams.set("exactId", data.exactMatchId);
        }
        if (data.identifiedTitle) {
          queryParams.set("visualTitle", data.identifiedTitle);
        } else if (data.category) {
          queryParams.set("visualTitle", data.category);
        }

        if (queryParams.toString()) {
          navigate(`/shop?${queryParams.toString()}`);
        } else {
          navigate(`/shop?search=Imported`);
        }
      } catch (error) {
        console.error("Image search failed:", error);
        setShowImageSearchModal(false);
        navigate(`/shop?search=Imported`);
      } finally {
        setUploadedImage(null);
        setIsSearchingImage(false);
      }
    }
  };

  const handleSelectSample = async (url: string) => {
    setIsSearchingImage(true);
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImage(reader.result as string);
          setIsSearchingImage(false);
        };
        reader.readAsDataURL(blob);
      } else {
        setUploadedImage(url);
        setIsSearchingImage(false);
      }
    } catch {
      setUploadedImage(url);
      setIsSearchingImage(false);
    }
  };

  const SAMPLE_IMAGES = [
    { label: "👟 Sports Sneakers", url: "https://cbu01.alicdn.com/img/ibank/O1CN01oEukB72LptYFJV52U_!!2220375669742-0-cib.jpg" },
    { label: "👞 Casual Board Shoes", url: "https://cbu01.alicdn.com/img/ibank/O1CN01xW1XzGA12oB1chua_!!2222992875295-0-cib.jpg" },
    { label: "👜 Women's Bag", url: "https://cbu01.alicdn.com/img/ibank/O1CN01POgv0V1vOFi0gpgaZ_!!2210907516162-0-cib.jpg" },
    { label: "🏋️ Fitness Grip Belt", url: "https://cbu01.alicdn.com/img/ibank/O1CN015QMHt02GWaqA9Fyh3_!!2220481779023-0-cib.jpg" },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const activeNavItems = (settings.navItems || []).filter((item) => item.enabled !== false);

  return (
    <LiveEditableSection sectionId="header" label="Header, Logo & Announcement Bar">
      {/* Optional Maintenance Mode Banner */}
      {settings.maintenanceMode && (
        <div className="bg-amber-500 text-slate-950 text-xs font-bold px-4 py-2 text-center">
          ⚠️ {settings.maintenanceMessage}
        </div>
      )}

      {/* Customizable Top Announcement Bar */}
      {settings.showAnnouncementBar && (
        <div
          style={{
            backgroundColor: settings.announcementBgColor || "#014144",
            color: settings.announcementTextColor || "#FFFFFF",
          }}
          className="text-[11px] py-1.5 px-4 border-b border-white/10"
        >
          <div className="w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium truncate">{settings.announcementText}</div>
            <div className="flex items-center gap-4 shrink-0">
              {settings.hotlinePhone && (
                <a
                  href={`tel:${settings.hotlinePhone.replace(/\s+/g, "")}`}
                  className="hidden sm:flex items-center gap-1 hover:opacity-85 font-semibold"
                >
                  <Phone className="w-3 h-3" />
                  <span>{settings.hotlinePhone}</span>
                </a>
              )}
              {settings.announcementLinkText && (
                <Link
                  to={settings.announcementLinkUrl || "/account"}
                  className="font-bold underline hover:opacity-90 flex items-center gap-0.5"
                >
                  <span>{settings.announcementLinkText}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
              <button
                type="button"
                onClick={handleInstallApp}
                className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition"
                title="Install World Buy BD Mobile App"
              >
                <Smartphone className="w-3 h-3" />
                <span>Install App</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-md py-1" : "bg-white border-b border-border/80"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
          {/* Left: Mobile Toggle & Brand Logo */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-slate-800 hover:text-primary p-1.5 rounded-lg border border-slate-200 cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <Link to="/" className="flex items-center">
                <BrandLogo size={isScrolled ? "sm" : "md"} showTagline={false} />
              </Link>
            </div>

            {/* Right Mobile Actions */}
            <div className="flex items-center space-x-2 md:hidden">
              <Link
                to="/wishlist"
                className="text-slate-700 hover:text-primary transition relative p-2 rounded-lg hover:bg-slate-100"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 bg-pink text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                className="text-slate-700 hover:text-primary transition relative p-2 rounded-lg hover:bg-slate-100"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to={user ? "/account" : "/login"}
                className="text-slate-700 hover:text-primary transition p-2 rounded-lg hover:bg-slate-100"
                aria-label="Account"
              >
                {user ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              </Link>
            </div>
          </div>

          {/* Center: Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative w-full flex items-center shadow-xs">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={settings.headerSearchPlaceholder || "Search products from China by name, ID, or keywords..."}
              className="w-full pl-4 pr-24 py-2 sm:py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary rounded-xl focus:outline-hidden focus:ring-3 focus:ring-primary/10 transition text-sm text-slate-800 placeholder:text-slate-400"
            />
            <div className="absolute right-12 top-0 h-full flex items-center pr-1">
              <button
                type="button"
                onClick={() => setShowImageSearchModal(true)}
                title="Search by image / photo"
                className="text-slate-400 hover:text-primary transition p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-secondary text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer shadow-xs"
              aria-label="Search button"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right: Desktop Action Icons */}
          <div className="hidden md:flex items-center space-x-5">
            <Link
              to="/wishlist"
              className="flex items-center gap-2 text-slate-600 hover:text-primary transition group relative p-1.5 rounded-lg hover:bg-slate-50"
            >
              <div className="relative">
                <Heart className="w-5 h-5 group-hover:text-pink transition" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-pink text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold hidden lg:inline">Wishlist</span>
            </Link>

            <Link
              to="/cart"
              className="flex items-center gap-2 text-slate-600 hover:text-primary transition group relative p-1.5 rounded-lg hover:bg-slate-50"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 group-hover:text-primary transition" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold hidden lg:inline">Cart</span>
            </Link>

            {user ? (
              <Link
                to="/account"
                className="flex items-center gap-2 text-slate-700 hover:text-primary bg-slate-100 hover:bg-primary-light px-3 py-1.5 rounded-xl transition text-xs font-semibold"
              >
                <User className="w-4 h-4 text-primary" />
                <span className="truncate max-w-[90px]">Account</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white px-3.5 py-1.5 rounded-xl transition text-xs font-semibold shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Desktop Main Navigation Bar */}
        <nav className="hidden md:flex items-center justify-between border-t border-slate-100 bg-white/80 backdrop-blur-xs px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
          <ul className="flex items-center space-x-1 lg:space-x-4">
            <li className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                onMouseEnter={() => setShowCategoryDropdown(true)}
                className="flex items-center gap-2 py-2.5 px-3 text-xs font-bold text-slate-800 hover:text-primary hover:bg-slate-50 rounded-lg transition cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4 text-primary" />
                <span>All Categories</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    showCategoryDropdown ? "rotate-180 text-primary" : "text-slate-400"
                  }`}
                />
              </button>

              {showCategoryDropdown && (
                <div
                  onMouseLeave={() => setShowCategoryDropdown(false)}
                  className="absolute left-0 top-full mt-1 w-[680px] bg-white border border-slate-100 shadow-2xl rounded-2xl p-5 grid grid-cols-3 gap-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="col-span-3 pb-2 mb-1 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Explore China Wholesale Categories
                    </span>
                    <Link
                      to="/shop"
                      onClick={() => setShowCategoryDropdown(false)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View All Products →
                    </Link>
                  </div>
                  {mainCategories.map((cat) => {
                    const hasSubs = Array.isArray(cat.subCategories) && cat.subCategories.length > 0;
                    const isExpanded = expandedMainCat === cat.slug;
                    return (
                      <div key={cat.id} className={hasSubs && isExpanded ? "col-span-3 bg-slate-50/90 border border-primary/20 rounded-2xl p-3" : ""}>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              if (hasSubs) {
                                setExpandedMainCat(isExpanded ? null : cat.slug);
                              } else {
                                setShowCategoryDropdown(false);
                                navigate(`/shop?category=${encodeURIComponent(cat.name)}`);
                              }
                            }}
                            className="flex-1 flex items-center justify-between p-2 rounded-xl hover:bg-primary-light/60 group transition text-left cursor-pointer"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-100">
                                {cat.image && cat.image.trim() !== "" ? (
                                  <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                                    No Img
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-700 group-hover:text-primary truncate block">
                                  {cat.name}
                                </span>
                              </div>
                            </div>
                            {hasSubs && (
                              <ChevronDown
                                className={`w-4 h-4 text-primary transition-transform shrink-0 ml-1 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            )}
                          </button>
                          {hasSubs && isExpanded && (
                            <Link
                              to={`/shop?category=${encodeURIComponent(cat.name)}`}
                              onClick={() => setShowCategoryDropdown(false)}
                              className="text-[11px] font-bold text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-lg transition shrink-0 ml-2"
                            >
                              All {cat.name} →
                            </Link>
                          )}
                        </div>

                        {hasSubs && isExpanded && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {cat.subCategories!.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/shop?category=${encodeURIComponent(sub.name)}`}
                                onClick={() => setShowCategoryDropdown(false)}
                                className="flex items-center gap-2 p-2 rounded-xl bg-white hover:bg-primary hover:text-white border border-slate-200/80 text-slate-700 text-xs font-semibold transition group/sub shadow-2xs"
                              >
                                <ChevronRight className="w-3 h-3 text-primary group-hover/sub:text-white shrink-0" />
                                <span className="truncate">{sub.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </li>

            {/* Dynamic Navigation Links from SiteSettings */}
            {activeNavItems.map((item) => (
              <li key={item.id}>
                {item.path.startsWith("#") || item.path.includes("#") ? (
                  <a
                    href={item.path}
                    className="block py-2.5 px-3 text-xs font-semibold text-slate-700 hover:text-primary transition rounded-lg hover:bg-slate-50"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.path}
                    className="block py-2.5 px-3 text-xs font-semibold text-slate-700 hover:text-primary transition rounded-lg hover:bg-slate-50"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {settings.showFlashSaleBadge && (
            <div className="flex items-center space-x-3">
              <a
                href="#flash-sale"
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-gradient-to-r from-pink/10 to-primary/10 text-primary hover:text-primary-dark text-xs font-bold transition border border-primary/20"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink animate-spin" />
                <span>{settings.flashSaleBadgeText || "Flash Sale"}</span>
              </a>
            </div>
          )}
        </nav>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3 shadow-xl max-h-[85vh] overflow-y-auto">
            <ul className="space-y-1">
              {activeNavItems.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 text-sm font-semibold text-slate-800 hover:text-primary border-b border-slate-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}

              <li className="border-b border-slate-100 py-2.5">
                <button
                  onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  className="flex items-center justify-between w-full text-sm font-bold text-primary py-1"
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    <span>Shop By Category</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileCategoriesOpen ? "rotate-180" : ""}`} />
                </button>

                {mobileCategoriesOpen && (
                  <div className="grid grid-cols-2 gap-2 pt-2.5">
                    {mainCategories.map((cat) => {
                      const hasSubs = Array.isArray(cat.subCategories) && cat.subCategories.length > 0;
                      const isExpanded = expandedMainCat === cat.slug;
                      return (
                        <div key={cat.id} className={hasSubs && isExpanded ? "col-span-2 bg-slate-50 rounded-xl p-2.5 border border-primary/20" : ""}>
                          <button
                            type="button"
                            onClick={() => {
                              if (hasSubs) {
                                setExpandedMainCat(isExpanded ? null : cat.slug);
                              } else {
                                setMobileMenuOpen(false);
                                navigate(`/shop?category=${encodeURIComponent(cat.name)}`);
                              }
                            }}
                            className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 hover:bg-primary-light text-xs text-slate-700 font-semibold truncate text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {cat.image && cat.image.trim() !== "" ? (
                                <img src={cat.image} alt={cat.name} className="w-5 h-5 rounded-md object-cover shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-md bg-slate-100 shrink-0" />
                              )}
                              <span className="truncate">{cat.name}</span>
                            </div>
                            {hasSubs && (
                              <ChevronDown className={`w-3.5 h-3.5 text-primary shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            )}
                          </button>

                          {hasSubs && isExpanded && (
                            <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-2 gap-1.5">
                              <Link
                                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="col-span-2 text-center py-1.5 px-2 rounded-lg bg-primary text-white text-xs font-bold"
                              >
                                View All {cat.name}
                              </Link>
                              {cat.subCategories!.map((sub) => (
                                <Link
                                  key={sub.id}
                                  to={`/shop?category=${encodeURIComponent(sub.name)}`}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium hover:border-primary hover:text-primary truncate"
                                >
                                  <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                                  <span className="truncate">{sub.name}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            </ul>

            {/* Mobile App Install CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleInstallApp();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer hover:opacity-95 transition"
              >
                <Smartphone className="w-4 h-4" />
                <span>📱 Install Mobile App</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Hotline: {settings.hotlinePhone}</span>
            </div>
          </div>
        )}

        {/* Visual Image Search Modal */}
        {showImageSearchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
              <button
                onClick={() => setShowImageSearchModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">China Visual Image Search</h3>
                  <p className="text-xs text-slate-500">Find identical factory products from Alibaba / Taobao</p>
                </div>
              </div>

              <form onSubmit={handleImageSearchSubmit} className="space-y-4">
                <div
                  onClick={() => !uploadedImage && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition ${
                    uploadedImage
                      ? "border-emerald-300 bg-emerald-50/30"
                      : "border-slate-200 hover:border-primary/60 cursor-pointer bg-slate-50 hover:bg-primary-light/20"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {uploadedImage ? (
                    <div className="flex flex-col items-center">
                      <div className="relative mb-2">
                        <img
                          src={uploadedImage}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-xl shadow-md border-2 border-white"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedImage(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-xs cursor-pointer"
                          title="Remove Image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" /> Image Ready for Visual Search
                      </span>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">Click to upload or drag photo here</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, or WEBP (Shoes, bags, clothes, gadgets)</p>
                    </div>
                  )}
                </div>

                {!uploadedImage && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Or try with instant sample products:</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SAMPLE_IMAGES.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSample(sample.url)}
                          className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-white hover:border-primary hover:bg-red-50/40 text-left transition cursor-pointer group"
                        >
                          <img src={sample.url} alt={sample.label} className="w-7 h-7 rounded-md object-cover shrink-0" />
                          <span className="text-[11px] font-medium text-slate-700 group-hover:text-primary truncate">
                            {sample.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSearchingImage || !uploadedImage}
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSearchingImage ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing Image & Finding Matches...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Find Exact & Similar Products</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Official Mobile App Install & Download Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </LiveEditableSection>
  );
}
