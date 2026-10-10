import React, { useState, useEffect, useMemo } from "react";
import {
  Banknote,
  Search,
  Filter,
  Copy,
  Check,
  ExternalLink,
  PhoneCall,
  MessageSquare,
  Printer,
  Trash2,
  Calendar,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Plus,
  X,
  FileText,
  Clock,
  Sparkles,
  Scale,
  CreditCard,
  User,
  Package
} from "lucide-react";
import { StockOutRefundRecord } from "../../types";
import { canAccessProductSourceLink } from "../../utils/productPrivacy";

interface StockOutRefundRecordsViewProps {
  onRefreshOrders?: () => void;
  onOpenOrderModal?: (orderId: string) => void;
}

export default function StockOutRefundRecordsView({
  onRefreshOrders,
  onOpenOrderModal
}: StockOutRefundRecordsViewProps) {
  const [records, setRecords] = useState<StockOutRefundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [printingRecord, setPrintingRecord] = useState<StockOutRefundRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // New Record Form State
  const [newForm, setNewForm] = useState({
    orderId: "",
    productName: "",
    productImage: "",
    variantName: "",
    quantity: 1,
    unitPrice: 0,
    refundAmount: 0,
    action: "refunded" as "refunded" | "adjusted",
    paymentMethod: "bKash",
    accountNumber: "",
    accountType: "Personal",
    trxId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerNote: "",
    adminNote: "",
    processedBy: "Super Admin"
  });
  const [submittingNew, setSubmittingNew] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stock-out-refunds");
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to load stock-out refunds:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleCopyText = (text: string, id: string, isMessage = false) => {
    navigator.clipboard.writeText(text);
    if (isMessage) {
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2500);
    } else {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this refund record?")) return;
    try {
      const res = await fetch(`/api/stock-out-refunds/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete refund record:", e);
    }
  };

  const handleCreateNewRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.productName || !newForm.refundAmount) {
      alert("Please provide the product name and refund amount.");
      return;
    }
    setSubmittingNew(true);
    try {
      const res = await fetch("/api/stock-out-refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm)
      });
      if (res.ok) {
        const created = await res.json();
        setRecords(prev => [created, ...prev]);
        setShowAddModal(false);
        setNewForm({
          orderId: "",
          productName: "",
          productImage: "",
          variantName: "",
          quantity: 1,
          unitPrice: 0,
          refundAmount: 0,
          action: "refunded",
          paymentMethod: "bKash",
          accountNumber: "",
          accountType: "Personal",
          trxId: "",
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          customerNote: "",
          adminNote: "",
          processedBy: "Super Admin"
        });
      } else {
        alert("Failed to create refund record.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving refund record.");
    } finally {
      setSubmittingNew(false);
    }
  };

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Query filter
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        r.productName?.toLowerCase().includes(q) ||
        r.orderId?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.customerPhone?.includes(q) ||
        r.accountNumber?.includes(q) ||
        r.trxId?.toLowerCase().includes(q) ||
        r.refundMessage?.toLowerCase().includes(q);

      // Method filter
      const matchMethod =
        methodFilter === "all" ||
        (r.paymentMethod || "").toLowerCase().includes(methodFilter.toLowerCase());

      // Action filter
      const matchAction =
        actionFilter === "all" ||
        r.action === actionFilter;

      return matchQuery && matchMethod && matchAction;
    });
  }, [records, searchQuery, methodFilter, actionFilter]);

  // Aggregate Stats
  const totalRefundAmount = useMemo(() => {
    return records.reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0);
  }, [records]);

  const cashRefundsCount = useMemo(() => {
    return records.filter(r => r.action === "refunded").length;
  }, [records]);

  const adjustedRefundsCount = useMemo(() => {
    return records.filter(r => r.action === "adjusted").length;
  }, [records]);

  const cashRefundTotal = useMemo(() => {
    return records
      .filter(r => r.action === "refunded")
      .reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0);
  }, [records]);

  const adjustedRefundTotal = useMemo(() => {
    return records
      .filter(r => r.action === "adjusted")
      .reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0);
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-emerald-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <Banknote className="w-3.5 h-3.5" />
              <span>Stock-Out Refund & Message Registry</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Stock-Out Refund Records & Messages
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Permanent records and notification messages for items stocked out at China suppliers and refunded or adjusted for customers. Transparently track <strong>which product</strong> and <strong>how much refund</strong> was issued.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Refund Entry</span>
            </button>
            <button
              onClick={fetchRecords}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-white/10 border border-white/10 rounded-xl p-3.5">
            <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-bold block">
              Total Refunded Amount
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
              Tk {totalRefundAmount.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Total settlements</span>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-xl p-3.5">
            <span className="text-[11px] text-blue-300 uppercase tracking-wider font-bold block">
              Total Refunded Items
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
              {records.length} items
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Total saved records</span>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-xl p-3.5">
            <span className="text-[11px] text-rose-300 uppercase tracking-wider font-bold block">
              Cash Refunds (bKash/Nagad)
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-300 font-mono mt-1">
              Tk {cashRefundTotal.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{cashRefundsCount} direct cash orders</span>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-xl p-3.5">
            <span className="text-[11px] text-indigo-300 uppercase tracking-wider font-bold block">
              Invoice Due Adjustments
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-300 font-mono mt-1">
              Tk {adjustedRefundTotal.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{adjustedRefundsCount} adjusted orders</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name, order ID (#WBBD-...), phone, or TrxID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">Type:</span>
            <button
              onClick={() => setActionFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                actionFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setActionFilter("refunded")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1 ${
                actionFilter === "refunded" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash Refund ({cashRefundsCount})</span>
            </button>
            <button
              onClick={() => setActionFilter("adjusted")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1 ${
                actionFilter === "adjusted" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Due Adjusted ({adjustedRefundsCount})</span>
            </button>
          </div>
        </div>

        {/* Method Sub-Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-semibold">Payment Method:</span>
          {["all", "bkash", "nagad", "rocket", "bank", "adjustment"].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition cursor-pointer ${
                methodFilter === m
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {m === "all" ? "All Methods" : m}
            </button>
          ))}
          <span className="ml-auto text-[11px] font-bold text-slate-500">
            Showing: {filteredRecords.length} records
          </span>
        </div>
      </div>

      {/* Records Cards List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Loading refund records...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">No Refund Records Found</h4>
          <p className="text-slate-500 text-xs mt-1">
            {searchQuery
              ? `No records found matching "${searchQuery}".`
              : "No stock-out refund records at present. Click above to add an entry."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const isAdjusted = record.action === "adjusted";
            const formattedDate = record.createdAt
              ? new Date(record.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              : "N/A";

            return (
              <div
                key={record.id}
                className="bg-white border-2 border-slate-200 hover:border-emerald-300 rounded-2xl overflow-hidden shadow-xs transition"
              >
                {/* Strip: Order Header & Badges */}
                <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded font-mono font-bold text-xs">
                      {record.id}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="font-mono text-slate-200 font-bold">
                      Order: #{record.orderId}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-300 flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdjusted ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                        <Scale className="w-3 h-3" />
                        <span>Due Balance Adjusted</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Cash Refund Completed</span>
                      </span>
                    )}

                    <button
                      onClick={() => setPrintingRecord(record)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                      title="Print voucher slip"
                    >
                      <Printer className="w-3 h-3 text-amber-300" />
                      <span>Voucher</span>
                    </button>

                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Body: 3 Distinct Columns */}
                <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Col 1 (4 cols): Which Product */}
                  <div className="lg:col-span-4 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-200 pb-4 lg:pb-0 lg:pr-5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-primary" />
                      <span>Refunded Product</span>
                    </span>

                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <img
                        src={record.productImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120"}
                        alt={record.productName}
                        onClick={() => record.productImage && setPreviewImage(record.productImage)}
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200 bg-white shrink-0 cursor-pointer hover:opacity-90 transition"
                      />
                      <div className="min-w-0 flex-1 text-xs">
                        <h4 className="font-bold text-slate-900 line-clamp-2 leading-tight">
                          {record.productName}
                        </h4>
                        {record.variantName && (
                          <div className="text-[11px] text-slate-600 mt-1">
                            Variant: <strong className="text-slate-800 font-bold">{record.variantName}</strong>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                          Quantity: <strong>{record.quantity} pcs</strong>
                          {record.unitPrice > 0 && ` • Rate: Tk ${record.unitPrice.toLocaleString()}`}
                        </div>
                        {record.productLink && canAccessProductSourceLink() && (
                          <a
                            href={record.productLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold mt-1"
                          >
                            <span>Supplier Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Customer Info Card */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>Customer Details:</span>
                      </div>
                      <div className="font-bold text-slate-900">{record.customerName || "Customer"}</div>
                      <div className="font-mono text-slate-700">{record.customerPhone || "N/A"}</div>
                      <div className="flex items-center gap-2 pt-1">
                        {record.customerPhone && (
                          <>
                            <a
                              href={`tel:${record.customerPhone}`}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 transition"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                            <a
                              href={`https://wa.me/880${record.customerPhone.replace(/^0/, "").replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 transition"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Col 2 (3 cols): Refunded Amount */}
                  <div className="lg:col-span-3 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-200 pb-4 lg:pb-0 lg:pr-5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Refund Amount Details</span>
                    </span>

                    {/* Big Amount Card */}
                    <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-xl text-emerald-950 space-y-1">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                        Total Refunded
                      </span>
                      <div className="text-2xl font-black text-emerald-700 font-mono">
                        Tk {Number(record.refundAmount || 0).toLocaleString()}
                        <span className="text-xs font-bold text-emerald-900 ml-1">BDT</span>
                      </div>
                      <div className="text-[11px] text-emerald-800 font-semibold pt-1">
                        Method: <strong className="uppercase">{record.paymentMethod}</strong>
                      </div>
                    </div>

                    {/* Account / TrxID Details */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                      {record.accountNumber && (
                        <div>
                          <span className="text-slate-500 block text-[11px]">Recipient Account/Phone:</span>
                          <div className="flex items-center justify-between font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 mt-0.5">
                            <span>{record.accountNumber}</span>
                            <button
                              onClick={() => handleCopyText(record.accountNumber!, `acc-${record.id}`)}
                              className="text-slate-400 hover:text-emerald-600 p-0.5"
                              title="Copy number"
                            >
                              {copiedId === `acc-${record.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {record.trxId && (
                        <div>
                          <span className="text-slate-500 block text-[11px]">Transaction ID (TrxID):</span>
                          <div className="flex items-center justify-between font-mono font-bold text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-300 mt-0.5">
                            <span>{record.trxId}</span>
                            <button
                              onClick={() => handleCopyText(record.trxId!, `trx-${record.id}`)}
                              className="text-slate-400 hover:text-emerald-600 p-0.5"
                              title="Copy TrxID"
                            >
                              {copiedId === `trx-${record.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                        Processed by: <strong className="text-slate-700">{record.processedBy || "Admin"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Col 3 (5 cols): Saved Confirmation Message */}
                  <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Saved Confirmation Message</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Saved
                        </span>
                      </div>

                      {/* The Official Saved Message Box */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-300 shadow-2xs mt-2 relative group">
                        <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                          {record.refundMessage || "No message saved."}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <button
                            onClick={() => handleCopyText(record.refundMessage, `msg-${record.id}`, true)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            {copiedMsgId === `msg-${record.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Message</span>
                              </>
                            )}
                          </button>

                          {record.customerPhone && (
                            <a
                              href={`https://wa.me/880${record.customerPhone.replace(/^0/, "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(record.refundMessage)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Send on WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Admin Note if present */}
                      {record.adminNote && (
                        <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 mt-2 text-xs text-amber-900">
                          <span className="font-bold text-[11px] block text-amber-800">Admin Note:</span>
                          <p className="italic text-slate-700 text-[11px] mt-0.5">{record.adminNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Add Refund Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  Add New Stock-Out Refund Record
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record manual or offline refund details and save notification message
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRefund} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Order ID (#)</label>
                  <input
                    type="text"
                    placeholder="e.g. WBBD-10026"
                    value={newForm.orderId}
                    onChange={(e) => setNewForm({ ...newForm, orderId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Refund Type</label>
                  <select
                    value={newForm.action}
                    onChange={(e) => setNewForm({ ...newForm, action: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="refunded">Cash Refund</option>
                    <option value="adjusted">Invoice Due Adjust</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter stocked-out product name"
                  value={newForm.productName}
                  onChange={(e) => setNewForm({ ...newForm, productName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Variant (Color / Size)</label>
                  <input
                    type="text"
                    placeholder="e.g. Black Silicone / XL"
                    value={newForm.variantName}
                    onChange={(e) => setNewForm({ ...newForm, variantName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newForm.quantity}
                    onChange={(e) => setNewForm({ ...newForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-emerald-800 block mb-1">Refund Amount (BDT Tk) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Amount in BDT"
                    value={newForm.refundAmount || ""}
                    onChange={(e) => setNewForm({ ...newForm, refundAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-emerald-50 border-2 border-emerald-400 rounded-lg font-mono font-bold text-emerald-800 text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={newForm.paymentMethod}
                    onChange={(e) => setNewForm({ ...newForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Order Balance Adjustment">Order Balance Adjustment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recipient Account / Phone</label>
                  <input
                    type="text"
                    placeholder="017xxxxxxxx"
                    value={newForm.accountNumber}
                    onChange={(e) => setNewForm({ ...newForm, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transaction ID (TrxID)</label>
                  <input
                    type="text"
                    placeholder="e.g. BK9X84M291Q"
                    value={newForm.trxId}
                    onChange={(e) => setNewForm({ ...newForm, trxId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Customer full name"
                    value={newForm.customerName}
                    onChange={(e) => setNewForm({ ...newForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Phone Number</label>
                  <input
                    type="text"
                    placeholder="01xxxxxxxxx"
                    value={newForm.customerPhone}
                    onChange={(e) => setNewForm({ ...newForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Note / Remarks</label>
                <input
                  type="text"
                  placeholder="Note or reason for stock-out"
                  value={newForm.adminNote}
                  onChange={(e) => setNewForm({ ...newForm, adminNote: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNew}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
                >
                  {submittingNew ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Record & Message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Voucher Modal */}
      {printingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Stock-Out Refund Voucher Slip
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setPrintingRecord(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border border-slate-300 p-5 rounded-xl space-y-4 bg-slate-50/50 text-xs">
              <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900">WORLD BUY BD</h2>
                  <p className="text-[11px] text-slate-500">Cross-Border Sourcing & Refund Settlement</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {printingRecord.id}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(printingRecord.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Customer Details:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{printingRecord.customerName}</div>
                  <div className="font-mono text-slate-700">{printingRecord.customerPhone}</div>
                  <div className="text-slate-500">Order: #{printingRecord.orderId}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Refund Payment:</span>
                  <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                    Tk {printingRecord.refundAmount.toLocaleString()} BDT
                  </div>
                  <div className="text-slate-700 font-semibold">{printingRecord.paymentMethod}</div>
                  {printingRecord.trxId && (
                    <div className="font-mono text-slate-600">TrxID: {printingRecord.trxId}</div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Refunded Product:</span>
                <div className="font-bold text-slate-900 mt-1">{printingRecord.productName}</div>
                {printingRecord.variantName && (
                  <div className="text-slate-600 text-[11px]">Variant: {printingRecord.variantName}</div>
                )}
                <div className="text-slate-600 text-[11px]">Quantity: {printingRecord.quantity} pcs</div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Saved Confirmation Message:</span>
                <p className="bg-white p-2.5 rounded border border-slate-200 mt-1 text-slate-800 text-[11px] leading-relaxed">
                  {printingRecord.refundMessage}
                </p>
              </div>

              <div className="border-t border-slate-300 pt-3 flex justify-between text-[10px] text-slate-400">
                <span>Processed by: {printingRecord.processedBy}</span>
                <span>Signed & Verified (World Buy BD Accounts)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-lg w-full bg-white p-2 rounded-2xl">
            <img src={previewImage} alt="Product" className="w-full h-auto rounded-xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
