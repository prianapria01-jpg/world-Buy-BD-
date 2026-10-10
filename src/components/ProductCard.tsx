import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Star, Zap, Check } from "lucide-react";
import { Product } from "../types";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { cleanEnglishTitle, getCanonicalCategoryName } from "../utils/categories";
import { getSafeImageUrl } from "../utils/imageUrl";
import { getProductPath } from "../utils/productUrl";

interface ProductCardProps {
  product: Product;
  badgeText?: string;
  key?: any;
}

function ProductCard({ product, badgeText }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const [isAdded, setIsAdded] = useState(false);

  const isWishlisted = isInWishlist(product.id) || (product.offerId ? isInWishlist(product.offerId) : false);

  // Discount calculation (+30 BDT product fee rule)
  const productFee = 30;
  const salePrice = (product.price || 1200) + productFee;
  const discountPercent = typeof product.discount === "number" && product.discount > 0 ? product.discount : 3;
  const originalPrice = product.originalPrice ? product.originalPrice + productFee : Math.round(salePrice / (1 - discountPercent / 100));
  const hasDiscount = originalPrice > salePrice;

  const rating = product.rating || 4.8;
  const reviewCount = product.reviewCount || 42;
  const categoryName = getCanonicalCategoryName(product.category, product.name);
  const title = cleanEnglishTitle(product.name, product.category);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ ...product, price: salePrice }, 1, undefined, salePrice);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const buyNowItem = {
      cartItemId: `bn-${product.id}-${Date.now()}`,
      id: product.id,
      name: product.name,
      price: salePrice,
      quantity: 1,
      image: product.image,
      stock: product.stock,
      offerId: product.offerId,
      importedUrl: product.importedUrl
    };
    navigate("/checkout", { state: { buyNowItems: [buyNowItem] } });
  };

  return (
    <div className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 hover:border-[#cb1e46]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
      {/* Top Image Container */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
        {/* Badges Container */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start pointer-events-none">
          {badgeText ? (
            <span className="bg-[#cb1e46] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wide">
              {badgeText}
            </span>
          ) : hasDiscount && discountPercent > 0 ? (
            <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs tracking-wide">
              -{discountPercent}%
            </span>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full backdrop-blur-md transition-all flex items-center justify-center cursor-pointer shadow-xs ${
            isWishlisted
              ? "bg-white text-[#cb1e46] opacity-100 shadow-md scale-105"
              : "bg-white/85 text-slate-400 hover:text-[#cb1e46] hover:bg-white hover:scale-110 active:scale-95"
          }`}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? "fill-[#cb1e46] text-[#cb1e46]" : ""}`} />
        </button>

        {/* Product Image Link */}
        <Link
          to={getProductPath(product)}
          className="w-full h-full block overflow-hidden"
        >
          <img
            src={getSafeImageUrl(product.image, undefined, title)}
            alt={title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getSafeImageUrl(
                "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
                undefined,
                title
              );
            }}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          />
        </Link>
      </div>

      {/* Content Details */}
      <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1 bg-white">
        <div>
          {/* Category & Rating Row */}
          <div className="flex items-center justify-between gap-1 mb-1.5 text-[11px]">
            <Link
              to={`/shop?category=${encodeURIComponent(categoryName)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 hover:text-[#cb1e46] transition-colors truncate max-w-[62%]"
              title={categoryName}
            >
              {categoryName}
            </Link>
            <div className="flex items-center gap-1 text-slate-600 shrink-0 font-medium text-[11px]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{rating}</span>
              <span className="text-slate-400 text-[10px]">({reviewCount})</span>
            </div>
          </div>

          {/* Title with uniform 2-line height */}
          <Link
            to={getProductPath(product)}
            className="block mb-2 group-hover:text-[#cb1e46] transition-colors"
            title={title}
          >
            <h3 className="text-xs sm:text-[13px] text-slate-800 font-semibold line-clamp-2 leading-snug min-h-[2.4rem] sm:min-h-[2.6rem]">
              {title}
            </h3>
          </Link>
        </div>

        {/* Pricing Row */}
        <div className="mt-auto pt-1">
          <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2">
            <span className="text-sm sm:text-base font-extrabold text-[#cb1e46] tracking-tight">
              BDT {Math.round(salePrice).toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-[11px] sm:text-xs text-slate-400 line-through font-normal">
                BDT {Math.round(originalPrice).toLocaleString()}
              </span>
            )}
            {hasDiscount && (
              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded leading-none">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Action Buttons: Ergonomic Quick-Cart Icon + Order Now Button */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`h-8 sm:h-9 w-8 sm:w-9 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer shrink-0 ${
                isAdded
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-[#cb1e46]/10 text-slate-700 hover:text-[#cb1e46]"
              }`}
              title={isAdded ? "Added to Cart!" : "Add to Cart"}
            >
              {isAdded ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="flex-1 h-8 sm:h-9 px-2 sm:px-3 bg-gradient-to-r from-[#cb1e46] to-[#b01438] hover:brightness-105 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:shadow-md"
              title="Buy Now"
            >
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="tracking-wide truncate">Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProductCard);
