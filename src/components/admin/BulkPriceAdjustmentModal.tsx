import React, { useState } from "react";
import { DollarSign, ArrowUpRight, ArrowDownRight, Percent, Tag, Check, AlertCircle, X, RefreshCw } from "lucide-react";
import { CATEGORIES_LIST } from "../../utils/categories";

interface BulkPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  totalProductsCount?: number;
}

export default function BulkPriceAdjustmentModal({ isOpen, onClose, onSuccess, totalProductsCount }: BulkPriceModalProps) {
  const [action, setAction] = useState<"increase" | "decrease">("decrease");
  const [type, setType] = useState<"amount" | "percent">("amount");
  const [value, setValue] = useState<string>("64");
  const [category, setCategory] = useState<string>("all");
  const [updateDiscount, setUpdateDiscount] = useState<boolean>(true);
  const [newDiscountPercent, setNewDiscountPercent] = useState<string>("3");

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setErrorMessage("Please enter a valid number");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/products/bulk-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          type,
          value: numValue,
          category,
          updateDiscount,
          newDiscountPercent: updateDiscount ? parseFloat(newDiscountPercent) || 3 : undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Successfully updated prices and discounts for ${data.updatedCount} products!`);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1800);
      } else {
        setErrorMessage(data.error || "Failed to update prices");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Server connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-charcoal">Bulk Price & Discount Control</h2>
              <p className="text-xs text-gray-500">Adjust prices and discounts for all products in one click</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Action: Increase or Decrease */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Select Action
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAction("decrease")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                  action === "decrease"
                    ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20"
                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-amber-600" />
                Decrease Price
              </button>

              <button
                type="button"
                onClick={() => setAction("increase")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                  action === "increase"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                Increase Price
              </button>
            </div>
          </div>

          {/* Type & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Adjustment Type
              </label>
              <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setType("amount")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    type === "amount" ? "bg-white text-charcoal shadow-xs" : "text-gray-500 hover:text-charcoal"
                  }`}
                >
                  Fixed Amount (BDT)
                </button>
                <button
                  type="button"
                  onClick={() => setType("percent")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    type === "percent" ? "bg-white text-charcoal shadow-xs" : "text-gray-500 hover:text-charcoal"
                  }`}
                >
                  Percentage (%)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Amount or Percentage (Value)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "amount" ? "e.g. 64" : "e.g. 5"}
                  className="w-full pl-8 pr-3 py-2 text-xs font-bold border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
                <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">
                  {type === "amount" ? "BDT " : "%"}
                </span>
              </div>
            </div>
          </div>

          {/* Category scope */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Target Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Categories (All Products{totalProductsCount ? ` - ${totalProductsCount}` : ""})</option>
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Discount sync section */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={updateDiscount}
                onChange={(e) => setUpdateDiscount(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-800">
                Update discount percentage simultaneously
              </span>
            </label>

            {updateDiscount && (
              <div className="flex items-center gap-3 pt-1">
                <div className="text-xs text-gray-600 font-medium">New Discount:</div>
                <div className="relative w-28">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={newDiscountPercent}
                    onChange={(e) => setNewDiscountPercent(e.target.value)}
                    className="w-full pl-3 pr-7 py-1.5 text-xs font-bold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-gray-400 font-bold">%</span>
                </div>
                <span className="text-xs text-gray-500">(Currently set to 3%)</span>
              </div>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Quick Presets:</span>
            <button
              type="button"
              onClick={() => {
                setAction("decrease");
                setType("amount");
                setValue("64");
                setUpdateDiscount(true);
                setNewDiscountPercent("3");
              }}
              className="text-[11px] font-semibold px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              -BDT 64 + 3% Discount
            </button>
            <button
              type="button"
              onClick={() => {
                setAction("increase");
                setType("amount");
                setValue("30");
                setUpdateDiscount(true);
                setNewDiscountPercent("3");
              }}
              className="text-[11px] font-semibold px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              +BDT 30 Adjustment
            </button>
            <button
              type="button"
              onClick={() => {
                setAction("decrease");
                setType("percent");
                setValue("5");
                setUpdateDiscount(true);
                setNewDiscountPercent("5");
              }}
              className="text-[11px] font-semibold px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              -5% Discount
            </button>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-charcoal hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Applying adjustments...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Apply to Products
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
