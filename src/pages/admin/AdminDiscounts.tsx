import { useState, useEffect, type FormEvent } from "react";
import { Save, Plus, Trash2, Check, ArrowDownRight, ArrowUpRight, DollarSign, Percent, RefreshCw, AlertCircle } from "lucide-react";
import { CATEGORIES_LIST } from "../../utils/categories";

export default function AdminDiscounts() {
  const [globalDiscount, setGlobalDiscount] = useState("3");
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [discountSavedSuccess, setDiscountSavedSuccess] = useState(false);

  // Bulk Price adjustment state
  const [action, setAction] = useState<"increase" | "decrease">("decrease");
  const [type, setType] = useState<"amount" | "percent">("amount");
  const [value, setValue] = useState<string>("64");
  const [category, setCategory] = useState<string>("all");
  const [updateDiscount, setUpdateDiscount] = useState<boolean>(true);
  const [newDiscountPercent, setNewDiscountPercent] = useState<string>("3");
  const [adjustingPrice, setAdjustingPrice] = useState(false);
  const [priceSuccessMsg, setPriceSuccessMsg] = useState<string | null>(null);
  const [priceErrorMsg, setPriceErrorMsg] = useState<string | null>(null);

  const [coupons, setCoupons] = useState([
    { id: 1, code: "NEWUSER20", type: "percentage", value: 20, status: "active" },
    { id: 2, code: "FLAT50", type: "fixed", value: 50, status: "inactive" },
  ]);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.globalDiscount !== undefined) {
          setGlobalDiscount(String(data.globalDiscount));
          setNewDiscountPercent(String(data.globalDiscount));
        }
      })
      .catch(() => {});
  }, []);

  const handleApplyGlobalDiscount = async () => {
    if (!globalDiscount) return;
    setSavingDiscount(true);
    try {
      const res = await fetch("/api/discounts/apply-global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percentage: Number(globalDiscount) })
      });
      if (res.ok) {
        setDiscountSavedSuccess(true);
        setTimeout(() => setDiscountSavedSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to apply global discount:", error);
      alert("Failed to apply global discount");
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleBulkAdjustPrice = async (e: FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setPriceErrorMsg("Please enter a valid number");
      return;
    }

    setAdjustingPrice(true);
    setPriceErrorMsg(null);
    setPriceSuccessMsg(null);

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
        setPriceSuccessMsg(`Successfully updated prices and discounts for ${data.updatedCount} products!`);
        setTimeout(() => setPriceSuccessMsg(null), 4000);
      } else {
        setPriceErrorMsg(data.error || "Failed to update prices");
      }
    } catch (err: any) {
      setPriceErrorMsg(err.message || "Server connection error");
    } finally {
      setAdjustingPrice(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Discount & Price Controls</h1>
        <p className="text-xs text-gray-500 mt-1">Adjust all product prices in one click and manage store discounts</p>
      </div>

      {/* Bulk Price & Discount Control Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-linear-to-r from-amber-50/50 to-orange-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-charcoal">Global Price Adjustment</h2>
              <p className="text-xs text-gray-500">Increase or decrease product prices by fixed amount or percentage across categories</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleBulkAdjustPrice} className="p-6 space-y-5">
          {priceSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              {priceSuccessMsg}
            </div>
          )}

          {priceErrorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              {priceErrorMsg}
            </div>
          )}

          {/* Action selection */}
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
                Amount or % (Value)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "amount" ? "e.g. 64" : "e.g. 5"}
                  className="w-full pl-8 pr-3 py-2 text-xs font-bold border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
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
              <option value="all">All Categories (All Products)</option>
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
                <div className="text-xs text-gray-600 font-medium">New Discounts:</div>
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

          {/* Preset Buttons */}
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

          <div className="pt-2 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={adjustingPrice}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition disabled:opacity-60 cursor-pointer"
            >
              {adjustingPrice ? (
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

      {/* Global Store Discount Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6">
        <h2 className="text-base font-bold text-charcoal mb-1">Global Store Discount</h2>
        <p className="text-xs text-gray-500 mb-4">Configure global discount percentage across store</p>
        
        <div className="flex items-end gap-4 max-w-md">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Rate (%)</label>
            <div className="relative">
              <input 
                type="number" 
                min="0"
                max="100"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(e.target.value)}
                className="w-full pl-3 pr-7 py-2 text-sm font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">%</span>
            </div>
          </div>
          <button 
            onClick={handleApplyGlobalDiscount}
            disabled={savingDiscount}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            {discountSavedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Saved successfully!
              </>
            ) : savingDiscount ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Apply Discount
              </>
            )}
          </button>
        </div>
      </div>

      {/* Coupon Codes */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-charcoal">Coupon Codes</h2>
            <p className="text-xs text-gray-500">Manage promotional codes and special vouchers</p>
          </div>
          <button className="bg-gray-100 hover:bg-gray-200 text-charcoal px-3 py-1.5 rounded-xl text-xs font-bold flex items-center transition">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Coupon
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
                <th className="py-3 px-4 font-semibold">Code</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Value</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold">{coupon.code}</td>
                  <td className="py-3 px-4 capitalize">{coupon.type}</td>
                  <td className="py-3 px-4">{coupon.type === 'percentage' ? `${coupon.value}%` : `BDT ${coupon.value}`}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${coupon.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                      {coupon.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
