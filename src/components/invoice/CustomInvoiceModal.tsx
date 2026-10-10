import React, { useState } from "react";
import { X, Printer, Download, Save, Edit3, Eye, Plus, Trash2, Layers } from "lucide-react";
import {
  CustomInvoiceData,
  InvoiceItem,
  buildInvoiceFromOrder,
  downloadCustomInvoicePdf,
} from "../../utils/customInvoice";
import { CustomInvoiceView } from "./CustomInvoiceView";
import { getSafeImageUrl, DEFAULT_PRODUCT_FALLBACK } from "../../utils/imageUrl";

interface CustomInvoiceModalProps {
  order: any;
  existingInvoice?: any;
  isAdmin?: boolean;
  hide1688?: boolean;
  onClose: () => void;
  onSaved?: (updatedInvoice: CustomInvoiceData) => void;
}

export const CustomInvoiceModal: React.FC<CustomInvoiceModalProps> = ({
  order,
  existingInvoice,
  isAdmin = false,
  hide1688,
  onClose,
  onSaved,
}) => {
  const isStaffRestricted = React.useMemo(() => {
    if (hide1688) return true;
    try {
      const staff = localStorage.getItem("admin_logged_in_staff");
      if (staff) {
        const parsed = JSON.parse(staff);
        const dept = String(parsed?.department || parsed?.role || "").toLowerCase();
        return (
          dept === "support" ||
          dept === "cs" ||
          dept === "sales" ||
          dept === "marketing" ||
          dept === "delivery" ||
          dept === "accounts" ||
          dept === "finance"
        );
      }
    } catch {}
    return false;
  }, [hide1688]);

  const initialInvoice = buildInvoiceFromOrder(order, existingInvoice);
  const [invoice, setInvoice] = useState<CustomInvoiceData>(initialInvoice);
  const [activeTab, setActiveTab] = useState<"preview" | "edit">(isAdmin ? "edit" : "preview");
  const [copyMode, setCopyMode] = useState<"both" | "customer" | "office">("both");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [ratePerKg, setRatePerKg] = useState<number>(Number(initialInvoice.shippingRatePerKg || 780));

  const parseWeightNumber = (w: string | number | undefined) => {
    if (w === undefined || w === null) return 0;
    const n = parseFloat(String(w).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  const handleWeightOrRateChange = (newWeightStr: string, newRate: number, autoCalcShipping = true) => {
    const kg = parseWeightNumber(newWeightStr);
    const calcShip = autoCalcShipping && kg > 0 && newRate > 0 ? Math.round(kg * newRate) : Number(invoice.shippingCharge || 0);
    setRatePerKg(newRate);
    setInvoice((prev) => {
      const sub = Number(prev.subTotal || 0);
      const china = Number(prev.chinaCourier || 0);
      const disc = Number(prev.discount || 0);
      const grand = Math.max(0, sub - disc) + china + calcShip;
      const paid = Number(prev.paidAmount || 0);
      const due = Math.max(0, grand - paid);
      return {
        ...prev,
        weightApx: newWeightStr,
        weight: newWeightStr,
        weightKg: kg,
        shippingRatePerKg: newRate,
        shippingRate: newRate,
        shippingCharge: calcShip,
        grandTotal: grand,
        totalDue: due,
        dueAmount: due,
        paymentNow: due,
      };
    });
  };

  const handleFieldChange = (field: keyof CustomInvoiceData, value: any) => {
    setInvoice((prev) => {
      const updated: CustomInvoiceData = { ...prev, [field]: value };
      if (
        field === "chinaCourier" ||
        field === "shippingCharge" ||
        field === "discount" ||
        field === "subTotal" ||
        field === "paidAmount"
      ) {
        const sub = Number(updated.subTotal || 0);
        const china = Number(updated.chinaCourier || 0);
        const ship = Number(updated.shippingCharge || 0);
        const disc = Number(updated.discount || 0);
        const grand = Math.max(0, sub - disc) + china + ship;
        const paid = Number(updated.paidAmount || 0);
        const due = Math.max(0, grand - paid);

        updated.grandTotal = grand;
        updated.totalDue = due;
        updated.paymentNow = due;
      }
      return updated;
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoice((prev) => {
      const newItems = [...prev.items];
      const item = { ...newItems[index], [field]: value };

      if (field === "quantity" || field === "unitPrice") {
        const q = field === "quantity" ? Number(value) : Number(item.quantity || 1);
        const p = field === "unitPrice" ? Number(value) : Number(item.unitPrice || 0);
        item.totalPrice = q * p;
        item.rate = p;
        item.amount = q * p;
      }
      newItems[index] = item;

      const sub = newItems.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);
      const totalQty = newItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
      const disc = Number(prev.discount || 0);
      const grand = Math.max(0, sub - disc) + Number(prev.chinaCourier || 0) + Number(prev.shippingCharge || 0);
      const due = Math.max(0, grand - Number(prev.paidAmount || 0));

      return {
        ...prev,
        items: newItems,
        subTotal: sub,
        totalProductQty: totalQty,
        grandTotal: grand,
        totalDue: due,
        paymentNow: due,
      };
    });
  };

  const addItemRow = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          no: prev.items.length + 1,
          image: "",
          description: "New Product",
          variation: "",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
    }));
  };

  const removeItemRow = (index: number) => {
    setInvoice((prev) => {
      const newItems = prev.items
        .filter((_, i) => i !== index)
        .map((item, idx) => ({ ...item, no: idx + 1 }));
      const sub = newItems.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);
      const totalQty = newItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
      const disc = Number(prev.discount || 0);
      const grand = Math.max(0, sub - disc) + Number(prev.chinaCourier || 0) + Number(prev.shippingCharge || 0);
      const due = Math.max(0, grand - Number(prev.paidAmount || 0));
      return {
        ...prev,
        items: newItems,
        subTotal: sub,
        totalProductQty: totalQty,
        grandTotal: grand,
        totalDue: due,
        paymentNow: due,
      };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadCustomInvoicePdf(invoice);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const orderIdToSave = order?.id || invoice.orderId;
      const payloadToSave: CustomInvoiceData = {
        ...invoice,
        adminChargesUploaded: true,
      };
      const response = await fetch(`/api/admin/orders/${orderIdToSave}/invoice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSave),
      });

      if (!response.ok) {
        throw new Error("Failed to save invoice");
      }

      setInvoice(payloadToSave);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onSaved) onSaved(payloadToSave);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] my-auto overflow-hidden border border-slate-300">
        {/* Top Control Bar */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Order ID:</span>
                <span className="font-mono font-black text-sm text-primary bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {invoice.orderId}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-bold text-slate-500 uppercase">Invoice:</span>
                <span className="font-mono font-bold text-xs text-slate-800">
                  {invoice.invoiceNumber}
                </span>
              </div>
            </div>
            {saveSuccess && (
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-md font-bold">
                ✓ Invoice Saved
              </span>
            )}
          </div>

          {/* Copy Selector & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 2-Part Copy Switcher */}
            {activeTab === "preview" && (
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCopyMode("both")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    copyMode === "both"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Both Copies (Customer + Office)
                </button>
                <button
                  type="button"
                  onClick={() => setCopyMode("customer")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    copyMode === "customer"
                      ? "bg-primary text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Customer Copy
                </button>
                <button
                  type="button"
                  onClick={() => setCopyMode("office")}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    copyMode === "office"
                      ? "bg-slate-800 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Office Copy
                </button>
              </div>
            )}

            {isAdmin && (
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("preview")}
                  type="button"
                  className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === "preview"
                      ? "bg-white text-primary shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab("edit")}
                  type="button"
                  className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === "edit"
                      ? "bg-white text-primary shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Invoice
                </button>
              </div>
            )}

            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print
            </button>

            <button
              onClick={handleDownloadPdf}
              type="button"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Download 2-Part PDF Invoice"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>

            {isAdmin && (
              <button
                onClick={handleSave}
                disabled={saving}
                type="button"
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save"}
              </button>
            )}

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1">
          {activeTab === "preview" ? (
            <div className="flex justify-center">
              <CustomInvoiceView invoice={invoice} copyMode={copyMode} hide1688={isStaffRestricted} />
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto bg-white p-5 sm:p-7 rounded-xl border border-slate-200 shadow-xs text-xs">
              <div className="border-b border-slate-200 pb-3 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Update Customer Invoice: China Courier Bill, Weight & Shipping Charges
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter the China Courier Bill, Parcel Weight (KG), and Shipping Charge below and click <strong>Save Invoice</strong>. Changes update the customer's invoice immediately.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save & Update Customer Invoice"}
                </button>
              </div>

              {/* TOP HIGHLIGHTED CARD: China Courier Bill, Weight (KG), Shipping Charge & Payment */}
              <div className="bg-slate-50 p-5 rounded-xl border-2 border-primary/20 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <span className="font-bold text-sm text-slate-900">
                    1. Post-Order Final Invoice Calculator (Weight × Shipping Rate + China Courier - Partial Paid)
                  </span>
                  <span className="text-[11px] text-primary font-bold">
                    Auto-Calculates: (Weight × Shipping Rate) + China Courier + Product Price - Partial Paid = Final Payable
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {/* Product Weight (KG) */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1">
                      Product Weight (KG)
                    </label>
                    <input
                      type="text"
                      value={invoice.weightApx}
                      onChange={(e) => handleWeightOrRateChange(e.target.value, ratePerKg, true)}
                      placeholder="e.g. 1.5 KG"
                      className="w-full border border-slate-300 focus:border-primary focus:outline-none rounded-lg p-2 text-sm font-mono font-bold text-slate-900 bg-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Auto-multiplies with Shipping Rate
                    </span>
                  </div>

                  {/* Shipping Charge Rate (Per KG) */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1">
                      Shipping Rate (BDT / KG)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={ratePerKg}
                      onChange={(e) => handleWeightOrRateChange(invoice.weightApx, Number(e.target.value), true)}
                      placeholder="780"
                      className="w-full border border-slate-300 focus:border-primary focus:outline-none rounded-lg p-2 text-sm font-mono font-bold text-slate-900 bg-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Total Shipping: <strong className="text-slate-900 font-mono">BDT {Number(invoice.shippingCharge || 0).toLocaleString()}</strong>
                    </span>
                  </div>

                  {/* Total Shipping Charge (Auto-calculated or Override) */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1">
                      Total Shipping (Weight × Rate)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={invoice.shippingCharge}
                      onChange={(e) => handleFieldChange("shippingCharge", Number(e.target.value))}
                      placeholder="0"
                      className="w-full border border-slate-300 focus:border-primary focus:outline-none rounded-lg p-2 text-sm font-mono font-bold text-slate-900 bg-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Auto-calculated from Weight × Rate
                    </span>
                  </div>

                  {/* China Courier Bill */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-800 mb-1">
                      (+) China Courier Bill (BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={invoice.chinaCourier}
                      onChange={(e) => handleFieldChange("chinaCourier", Number(e.target.value))}
                      placeholder="0"
                      className="w-full border border-slate-300 focus:border-primary focus:outline-none rounded-lg p-2 text-sm font-mono font-bold text-slate-900 bg-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Added to total shipping cost
                    </span>
                  </div>

                  {/* Partial Paid (BDT) */}
                  <div className="bg-white p-3.5 rounded-lg border border-emerald-200">
                    <label className="block font-bold text-emerald-800 mb-1">
                      (-) Partial Paid (100% Product)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={invoice.paidAmount}
                      onChange={(e) => handleFieldChange("paidAmount", Number(e.target.value))}
                      placeholder="0"
                      className="w-full border border-emerald-300 focus:border-emerald-600 focus:outline-none rounded-lg p-2 text-sm font-mono font-bold text-emerald-800 bg-emerald-50/40"
                    />
                    <span className="text-[10px] text-emerald-600 mt-1 block">
                      Subtracted from Grand Total
                    </span>
                  </div>
                </div>

                {/* Live Financial Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 border-t border-slate-200 text-xs">
                  <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Product Price</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      BDT {Number(invoice.subTotal || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Weight × Shipping + Courier</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      + BDT {(Number(invoice.chinaCourier || 0) + Number(invoice.shippingCharge || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Discount (BDT)</span>
                    <input
                      type="number"
                      min="0"
                      value={invoice.discount || 0}
                      onChange={(e) => handleFieldChange("discount", Number(e.target.value))}
                      className="w-full border-b border-slate-300 font-mono font-bold text-slate-900 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="bg-slate-900 text-white px-3 py-2 rounded-lg">
                    <span className="text-[10px] text-slate-300 block">Grand Total Bill</span>
                    <span className="font-mono font-black text-white text-sm">
                      BDT {Number(invoice.grandTotal || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 font-semibold block">(-) Partial Paid</span>
                    <span className="font-mono font-black text-emerald-800 text-sm">
                      - BDT {Number(invoice.paidAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    <span className="text-[10px] text-red-600 font-bold block">Final Invoice Payable</span>
                    <span className="font-mono font-black text-red-700 text-sm">
                      BDT {Number(invoice.totalDue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order ID, Invoice No, Tracking Number, 1688 Order ID, Status */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${isStaffRestricted ? "lg:grid-cols-4" : "lg:grid-cols-5"} gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200`}>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order ID</label>
                  <input
                    type="text"
                    value={invoice.orderId}
                    onChange={(e) => handleFieldChange("orderId", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-primary bg-white"
                  />
                </div>
                {!isStaffRestricted && (
                  <div>
                    <label className="block font-bold text-purple-800 mb-1">1688 Order ID (Office)</label>
                    <input
                      type="text"
                      value={invoice.order1688Id || ""}
                      onChange={(e) => handleFieldChange("order1688Id", e.target.value)}
                      placeholder="e.g. 1688-394857291"
                      className="w-full border border-purple-300 rounded-lg p-2 font-mono font-bold text-purple-900 bg-white"
                    />
                  </div>
                )}
                <div>
                  <label className="block font-bold text-blue-800 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={invoice.trackingNumber || ""}
                    onChange={(e) => handleFieldChange("trackingNumber", e.target.value)}
                    placeholder="e.g. SF1492837492"
                    className="w-full border border-blue-300 rounded-lg p-2 font-mono font-bold text-blue-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={invoice.invoiceNumber}
                    onChange={(e) => handleFieldChange("invoiceNumber", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order Status</label>
                  <select
                    value={invoice.status}
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold bg-white cursor-pointer"
                  >
                    <option value="Order Placed">Order Placed</option>
                    <option value="Order Confirmed">Order Confirmed</option>
                    <option value="Purchased">Purchased</option>
                    <option value="Stock Out">Stock Out</option>
                    <option value="Received in China Warehouse">Received in China Warehouse</option>
                    <option value="Shipped to Bangladesh">Shipped to Bangladesh</option>
                    <option value="Received in BD Customs">Received in BD Customs</option>
                    <option value="Received in BD Warehouse">Received in BD Warehouse</option>
                    <option value="Ready for Delivery">Ready for Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 border-b pb-1 text-sm">
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={invoice.customerName}
                      onChange={(e) => handleFieldChange("customerName", e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={invoice.phone}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="text"
                      value={invoice.email || ""}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Delivery Address</label>
                    <input
                      type="text"
                      value={invoice.address}
                      onChange={(e) => handleFieldChange("address", e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Ordered Products Table Editor */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Ordered Products List (Name, Image, Quantity, Price)
                  </h4>
                  <button
                    onClick={addItemRow}
                    type="button"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-300 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Row
                  </button>
                </div>

                <div className="border border-slate-300 rounded-xl overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <tr>
                        <th className="p-2 text-center w-10">#</th>
                        <th className="p-2 w-44">Image URL</th>
                        <th className="p-2">Product Name</th>
                        <th className="p-2 w-32">Variation / Spec</th>
                        <th className="p-2 text-center w-20">Qty</th>
                        <th className="p-2 text-right w-28">Unit BDT</th>
                        <th className="p-2 text-right w-28">Total</th>
                        <th className="p-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {invoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-center font-mono">{item.no || idx + 1}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={
                                  item.image
                                    ? getSafeImageUrl(item.image, DEFAULT_PRODUCT_FALLBACK, item.description)
                                    : DEFAULT_PRODUCT_FALLBACK
                                }
                                alt={item.description || "thumb"}
                                className="w-8 h-8 rounded object-contain border bg-white shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <input
                                type="text"
                                value={item.image || ""}
                                onChange={(e) => handleItemChange(idx, "image", e.target.value)}
                                placeholder="https://..."
                                className="w-full border border-slate-300 rounded p-1 text-[11px]"
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                              className="w-full border border-slate-300 rounded p-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.variation || ""}
                              onChange={(e) => handleItemChange(idx, "variation", e.target.value)}
                              placeholder="Color / Size"
                              className="w-full border border-slate-300 rounded p-1"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                              className="w-16 border border-slate-300 rounded text-center font-mono p-1"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                              className="w-24 border border-slate-300 rounded text-right font-mono p-1"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            BDT {Number(item.totalPrice || 0).toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            {invoice.items.length > 1 && (
                              <button
                                onClick={() => removeItemRow(idx)}
                                type="button"
                                className="text-slate-400 hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial & Logistics Fields: Weight, China Courier, Shipping Charge, Paid Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wide">
                    Logistics & Charges
                  </h4>

                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-slate-700">Total Quantity:</label>
                    <input
                      type="number"
                      value={invoice.totalProductQty}
                      onChange={(e) => handleFieldChange("totalProductQty", Number(e.target.value))}
                      className="w-32 border border-slate-300 rounded-md p-1.5 text-right font-mono bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-slate-700">Parcel Weight:</label>
                    <input
                      type="text"
                      value={invoice.weightApx}
                      onChange={(e) => handleFieldChange("weightApx", e.target.value)}
                      placeholder="e.g. 1.50 KG"
                      className="w-32 border border-slate-300 rounded-md p-1.5 text-right font-mono bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-slate-700">China Courier Bill (BDT):</label>
                    <input
                      type="number"
                      value={invoice.chinaCourier}
                      onChange={(e) => handleFieldChange("chinaCourier", Number(e.target.value))}
                      className="w-32 border border-slate-300 rounded-md p-1.5 text-right font-mono bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-slate-700">Shipping Charge (BDT):</label>
                    <input
                      type="number"
                      value={invoice.shippingCharge}
                      onChange={(e) => handleFieldChange("shippingCharge", Number(e.target.value))}
                      className="w-32 border border-slate-300 rounded-md p-1.5 text-right font-mono bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-slate-700">Discount (BDT):</label>
                    <input
                      type="number"
                      value={invoice.discount || 0}
                      onChange={(e) => handleFieldChange("discount", Number(e.target.value))}
                      className="w-32 border border-slate-300 rounded-md p-1.5 text-right font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wide">
                    Payment & Due Summary
                  </h4>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-700">Product Sub Total:</span>
                    <span className="font-mono font-bold text-slate-900">
                      BDT {Number(invoice.subTotal || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="font-bold text-slate-900">Grand Total:</span>
                    <span className="font-mono font-black text-sm text-primary">
                      BDT {Number(invoice.grandTotal || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="font-bold text-emerald-800">Paid Amount (BDT):</label>
                    <input
                      type="number"
                      value={invoice.paidAmount}
                      onChange={(e) => handleFieldChange("paidAmount", Number(e.target.value))}
                      className="w-32 border border-emerald-400 rounded-md p-1.5 text-right font-mono font-bold text-emerald-800 bg-emerald-50"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="font-bold text-red-700">Due / Payable (BDT):</label>
                    <input
                      type="number"
                      value={invoice.totalDue}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setInvoice((prev) => ({ ...prev, totalDue: val, paymentNow: val }));
                      }}
                      className="w-32 border border-red-300 rounded-md p-1.5 text-right font-mono font-bold text-red-700 bg-red-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Payment Status</label>
                      <select
                        value={invoice.paymentStatus || "Unpaid"}
                        onChange={(e) => handleFieldChange("paymentStatus", e.target.value)}
                        className="w-full border border-slate-300 rounded-md p-1.5 bg-white font-bold"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Partial Paid">Partial Paid</option>
                        <option value="Verification Pending">Verification Pending</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Payment Method</label>
                      <input
                        type="text"
                        value={invoice.paymentMethod || ""}
                        onChange={(e) => handleFieldChange("paymentMethod", e.target.value)}
                        placeholder="bKash / Nagad / Bank"
                        className="w-full border border-slate-300 rounded-md p-1.5 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs cursor-pointer"
                >
                  Preview Invoice
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Invoice Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomInvoiceModal;
