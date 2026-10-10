import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { 
  Trash2, 
  Minus, 
  Plus, 
  Check, 
  AlertCircle, 
  ShoppingBag,
  Info
} from "lucide-react";
import { getSafeImageUrl } from "../utils/imageUrl";

interface VariationSpec {
  label: string;
  value: string;
}

function parseVariationSpecs(variantName?: string): VariationSpec[] {
  if (!variantName || variantName.trim() === "") {
    return [{ label: "Variation", value: "Default Specification" }];
  }

  // Split by common delimiters: / or ; or ,
  const parts = variantName
    .split(/[/;,]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [{ label: "Variation", value: variantName }];
  }

  return parts.map((part, idx) => {
    if (part.includes(":")) {
      const [k, ...v] = part.split(":");
      return {
        label: k.trim(),
        value: v.join(":").trim()
      };
    }
    // Smart labels based on index if no key was provided
    if (idx === 0) return { label: "Color", value: part };
    if (idx === 1) return { label: "Suitable for height", value: part };
    return { label: `Spec ${idx + 1}`, value: part };
  });
}

function generateCartId(productId?: string, offerId?: string): string {
  const cleanId = String(offerId || productId || "123456").replace(/^abb-/, "").replace(/[^0-9A-Za-z]/g, "");
  const mid = cleanId.slice(-6).padStart(6, "0");
  return `#WBBD_CLI_CRT-Q8R8H5Y1W1-${mid}-74422`;
}

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [minOrderAmount, setMinOrderAmount] = useState<number>(2000);
  const [discountPercent, setDiscountPercent] = useState<number>(3);
  const navigate = useNavigate();

  // Selected item IDs for checkout
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(cart.map((item) => item.cartItemId || item.id));
  });

  // Keep selection in sync when cart changes
  useEffect(() => {
    setSelectedIds((prev) => {
      const updated = new Set<string>();
      cart.forEach((item) => {
        const id = item.cartItemId || item.id;
        // Keep existing selection or default to selected for new items
        if (prev.size === 0 || prev.has(id)) {
          updated.add(id);
        }
      });
      return updated.size === 0 ? new Set(cart.map((i) => i.cartItemId || i.id)) : updated;
    });
  }, [cart]);

  // Fetch settings for minimum order and global discount
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.minOrderAmount) {
            setMinOrderAmount(Number(data.minOrderAmount));
          }
          if (data.globalDiscount !== undefined) {
            setDiscountPercent(Number(data.globalDiscount));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Group cart items by Product (using offerId or id)
  const productGroups = useMemo(() => {
    const groups: { [key: string]: typeof cart } = {};
    cart.forEach((item) => {
      const groupKey = String(item.offerId || item.id);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    return Object.values(groups);
  }, [cart]);

  // Selection helpers
  const allSelected = cart.length > 0 && cart.every((item) => selectedIds.has(item.cartItemId || item.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cart.map((item) => item.cartItemId || item.id)));
    }
  };

  const isProductGroupSelected = (items: typeof cart) => {
    return items.every((item) => selectedIds.has(item.cartItemId || item.id));
  };

  const toggleProductGroup = (items: typeof cart) => {
    const isSelected = isProductGroupSelected(items);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      items.forEach((item) => {
        const id = item.cartItemId || item.id;
        if (isSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      });
      return next;
    });
  };

  const toggleItemSelection = (cartItemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cartItemId)) {
        next.delete(cartItemId);
      } else {
        next.add(cartItemId);
      }
      return next;
    });
  };

  const removeSelectedItems = () => {
    selectedIds.forEach((id) => {
      removeFromCart(id);
    });
  };

  const removeProductGroup = (items: typeof cart) => {
    items.forEach((item) => {
      removeFromCart(item.cartItemId || item.id);
    });
  };

  // Calculations for selected items
  const selectedItems = useMemo(() => {
    return cart.filter((item) => selectedIds.has(item.cartItemId || item.id));
  }, [cart, selectedIds]);

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  }, [selectedItems]);

  const discountAmount = useMemo(() => {
    return Number((selectedSubtotal * (discountPercent / 100)).toFixed(2));
  }, [selectedSubtotal, discountPercent]);

  const grandTotal = useMemo(() => {
    return Math.max(0, Number((selectedSubtotal - discountAmount).toFixed(2)));
  }, [selectedSubtotal, discountAmount]);

  const isBelowMinOrder = selectedSubtotal < minOrderAmount && selectedItems.length > 0;

  const handleProceedCheckout = () => {
    if (selectedItems.length === 0) return;
    navigate("/checkout", { state: { buyNowItems: selectedItems } });
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-[#cb1e46] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Your Cart is Empty</h2>
          <p className="text-slate-500 text-sm mb-6">
            Looks like you haven't added anything to your cart yet. Browse our China wholesale catalog to discover great deals!
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#cb1e46] hover:bg-[#b01438] text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 font-sans">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side: Cart Items List */}
        <div className="flex-1 w-full">
          {/* Top Bar: Select All & Delete All Selected (matching screenshot pink bar) */}
          <div className="bg-[#fff0f4] border border-pink-100 rounded-xl px-4 py-3 flex items-center justify-between mb-4 shadow-2xs">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <button
                type="button"
                onClick={toggleSelectAll}
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  allSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "border-2 border-slate-300 bg-white"
                }`}
              >
                {allSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
              <span className="text-xs sm:text-sm font-bold text-slate-800">Select all</span>
            </label>

            <button
              type="button"
              onClick={removeSelectedItems}
              disabled={selectedIds.size === 0}
              className="text-rose-500 hover:text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed p-1 transition cursor-pointer"
              title="Remove selected items"
            >
              <Trash2 className="w-5 h-5 stroke-[1.8]" />
            </button>
          </div>

          {/* Product Group Cards */}
          <div className="space-y-4">
            {productGroups.map((groupItems, gIdx) => {
              const primaryItem = groupItems[0];
              const isGroupChecked = isProductGroupSelected(groupItems);
              const groupTotalQty = groupItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
              const groupTotalPrice = groupItems.reduce(
                (acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1),
                0
              );
              const cartRefId = generateCartId(primaryItem.id, primaryItem.offerId);

              return (
                <div
                  key={`cart-group-${primaryItem.id}-${gIdx}`}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden"
                >
                  {/* Product Header Row */}
                  <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-white">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Group Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleProductGroup(groupItems)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1 transition cursor-pointer ${
                          isGroupChecked
                            ? "bg-slate-900 text-white shadow-xs"
                            : "border-2 border-slate-300 bg-white"
                        }`}
                      >
                        {isGroupChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Product Main Image */}
                      <img
                        src={getSafeImageUrl(primaryItem.image, undefined, primaryItem.name)}
                        alt={primaryItem.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-md bg-slate-50 border border-slate-100 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80";
                        }}
                      />

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="text-[11px] font-mono text-slate-400 mb-0.5 tracking-tight truncate">
                          Cart ID: {cartRefId}
                        </div>
                        <Link
                          to={`/product/abb-${primaryItem.offerId || primaryItem.id}`}
                          className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-[#cb1e46] transition line-clamp-2 leading-snug"
                        >
                          {primaryItem.name}
                        </Link>
                      </div>
                    </div>

                    {/* Delete Product Group Button */}
                    <button
                      type="button"
                      onClick={() => removeProductGroup(groupItems)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition cursor-pointer shrink-0"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
                    </button>
                  </div>

                  {/* Variations / Sub-Items List */}
                  <div className="divide-y divide-slate-100">
                    {groupItems.map((item) => {
                      const itemId = item.cartItemId || item.id;
                      const isItemChecked = selectedIds.has(itemId);
                      const unitPrice = Number(item.price) || 0;
                      const qty = Number(item.quantity) || 1;
                      const itemTotal = unitPrice * qty;
                      // Calculated original price based on standard 3% or item originalPrice
                      const originalUnitPrice = item.originalPrice
                        ? Number(item.originalPrice)
                        : Math.round(unitPrice / (1 - discountPercent / 100));
                      const originalItemTotal = originalUnitPrice * qty;

                      const specs = parseVariationSpecs(item.variantName);

                      return (
                        <div
                          key={itemId}
                          className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                            isItemChecked ? "bg-white" : "bg-slate-50/40 opacity-80"
                          }`}
                        >
                          {/* Left: Spec Thumbnail & Attributes */}
                          <div className="flex items-center gap-3">
                            {/* Checkbox for individual variant if multiple */}
                            {groupItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => toggleItemSelection(itemId)}
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer ${
                                  isItemChecked
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "border border-slate-300 bg-white"
                                }`}
                              >
                                {isItemChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </button>
                            )}

                            {/* Variant Image */}
                            <img
                              src={getSafeImageUrl(item.variantImage || item.image, undefined, item.name)}
                              alt="Variant"
                              className="w-10 h-10 object-cover rounded-md bg-slate-50 border border-slate-100 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80";
                              }}
                            />

                            {/* Specs Text */}
                            <div className="text-xs text-slate-600 space-y-0.5">
                              {specs.map((spec, sIdx) => (
                                <div key={sIdx} className="leading-tight">
                                  <span className="text-slate-500 font-medium">{spec.label}</span>
                                  <span className="text-slate-400 mx-1">:</span>
                                  <span className="text-slate-800 font-semibold">{spec.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: Price, Strikethrough & Multiplier */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                            <div className="flex items-baseline gap-1.5 sm:justify-end">
                              <span className="text-sm font-bold text-slate-900">
                                BDT {itemTotal.toFixed(2)}
                              </span>
                            </div>

                            {/* Strikethrough original price */}
                            <div className="text-[11px] text-slate-400 line-through">
                              BDT {originalItemTotal.toFixed(2)}
                            </div>

                            {/* Multiplier breakdown (e.g., 6 X 237.51) and stepper */}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-semibold text-slate-700 font-mono">
                                {qty} X {unitPrice.toFixed(2)}
                              </span>

                              {/* Compact Quantity Stepper */}
                              <div className="flex items-center border border-slate-200 rounded-md bg-slate-50 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(itemId, Math.max(1, qty - 1))}
                                  className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-200 transition cursor-pointer"
                                  title="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-7 text-center text-xs font-bold text-slate-800 bg-white">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuantity(itemId, Math.min(item.stock || 9999, qty + 1))
                                  }
                                  className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-200 transition cursor-pointer"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Variant remove button if multiple variants */}
                              {groupItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(itemId)}
                                  className="text-slate-400 hover:text-rose-500 p-1 transition"
                                  title="Remove variant"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Subtotal Footer of this Product Card */}
                  <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-3">
                    <span className="border border-slate-700 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded">
                      {groupTotalQty} Items
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      BDT {groupTotalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-between items-center">
            <Link
              to="/shop"
              className="text-xs font-bold text-slate-600 hover:text-[#cb1e46] transition flex items-center gap-1.5"
            >
              <span>← Continue Shopping</span>
            </Link>
            <button
              type="button"
              onClick={() => clearCart()}
              className="text-xs text-slate-400 hover:text-rose-600 transition"
            >
              Clear Entire Cart
            </button>
          </div>
        </div>

        {/* Right Side: Cart Summary Panel (Exact match to screenshot) */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 sticky top-24">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-5 text-center">
              Cart Summary
            </h2>

            {/* Breakdown lines */}
            <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Product Price</span>
                <span className="font-semibold text-slate-900 font-mono">
                  BDT {selectedSubtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">
                  Discount ( - {discountPercent}%)
                </span>
                <span className="font-semibold text-[#cb1e46] font-mono">
                  - BDT {discountAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900 text-sm sm:text-base">Grand Total</span>
                <span className="font-extrabold text-slate-900 text-base sm:text-lg font-mono">
                  BDT {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Pay on delivery Dashed Box (exact match to screenshot) */}
            <div className="border border-dashed border-teal-500/50 rounded-xl p-3 text-center my-4 bg-teal-50/20">
              <div className="text-[11px] text-slate-500 font-medium mb-0.5">Pay on delivery</div>
              <div className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                <span>Grand Total + Shipping & Courier Charges</span>
                <span
                  title="International freight shipping & local courier charge will be collected on physical delivery in Bangladesh."
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-slate-400 text-slate-500 text-[10px] cursor-help hover:border-slate-600"
                >
                  i
                </span>
              </div>
            </div>

            {/* Minimum Order Enforcement if below requirement */}
            {isBelowMinOrder && (
              <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Minimum Order: BDT {minOrderAmount.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Please add another{" "}
                  <strong className="text-[#cb1e46]">
                    BDT {(minOrderAmount - selectedSubtotal).toFixed(2)}
                  </strong>{" "}
                  worth of products to proceed.
                </p>
              </div>
            )}

            {/* Action Button: Go to Checkout */}
            {isBelowMinOrder ? (
              <button
                type="button"
                disabled
                className="w-full bg-slate-300 text-slate-500 font-bold py-3 rounded-xl transition text-sm cursor-not-allowed shadow-none"
              >
                Go to Checkout
              </button>
            ) : (
              <button
                type="button"
                onClick={handleProceedCheckout}
                disabled={selectedItems.length === 0}
                className="w-full bg-[#cb1e46] hover:bg-[#b01438] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition text-sm shadow-xs hover:shadow-md cursor-pointer"
              >
                Go to Checkout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
