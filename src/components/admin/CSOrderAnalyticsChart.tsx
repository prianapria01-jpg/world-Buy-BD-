import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  Package,
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  AlertCircle,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  Filter,
  Check,
  ChevronRight
} from "lucide-react";

interface CSOrderAnalyticsChartProps {
  orders: any[];
  onFilterStatus?: (status: string) => void;
  selectedFilterStatus?: string;
  onOpenOrderModal?: (order: any) => void;
}

export default function CSOrderAnalyticsChart({
  orders = [],
  onFilterStatus,
  selectedFilterStatus = "all",
  onOpenOrderModal
}: CSOrderAnalyticsChartProps) {
  const [chartViewMode, setChartViewMode] = useState<"bar" | "gauge" | "status_breakdown">("bar");

  // Status Categorization Helper
  const isOrderConfirmed = (status: string) => {
    const s = String(status || "").toLowerCase();
    return [
      "order confirmed",
      "confirmed",
      "purchased",
      "received in china warehouse",
      "shipped to bangladesh",
      "received in bd customs",
      "received in bd warehouse",
      "invoice generated",
      "ready for delivery",
      "assigned to delivery",
      "delivered"
    ].includes(s);
  };

  const isOrderPending = (status: string) => {
    const s = String(status || "").toLowerCase();
    return s === "pending" || s === "order placed" || !status;
  };

  // Helper to extract total amount from an order
  const getOrderAmount = (o: any) => {
    const val = Number(o.total ?? o.subtotal ?? o.invoice?.grandTotal ?? o.invoice?.subTotal ?? o.price ?? 0);
    return isNaN(val) ? 0 : val;
  };

  // Calculate live statistics
  const stats = useMemo(() => {
    const totalOrdersCount = orders.length;
    let totalOrderValue = 0;
    let confirmedCount = 0;
    let confirmedValue = 0;
    let pendingCount = 0;
    let pendingValue = 0;
    let deliveredCount = 0;
    let deliveredValue = 0;
    let stockOutCount = 0;

    const statusCounts: Record<string, { count: number; amount: number }> = {};

    orders.forEach((o) => {
      const amt = getOrderAmount(o);
      totalOrderValue += amt;
      const rawStatus = o.status || "Pending";

      if (!statusCounts[rawStatus]) {
        statusCounts[rawStatus] = { count: 0, amount: 0 };
      }
      statusCounts[rawStatus].count += 1;
      statusCounts[rawStatus].amount += amt;

      if (isOrderConfirmed(rawStatus)) {
        confirmedCount++;
        confirmedValue += amt;
      } else if (isOrderPending(rawStatus)) {
        pendingCount++;
        pendingValue += amt;
      }

      if (rawStatus === "Delivered") {
        deliveredCount++;
        deliveredValue += amt;
      } else if (rawStatus === "Stock Out") {
        stockOutCount++;
      }
    });

    const confirmationRate = totalOrdersCount > 0 ? Math.round((confirmedCount / totalOrdersCount) * 100) : 0;
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalOrderValue / totalOrdersCount) : 0;

    return {
      totalOrdersCount,
      totalOrderValue,
      confirmedCount,
      confirmedValue,
      pendingCount,
      pendingValue,
      deliveredCount,
      deliveredValue,
      stockOutCount,
      confirmationRate,
      avgOrderValue,
      statusCounts
    };
  }, [orders]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-6 p-5 sm:p-6 mb-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md font-bold">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                CS Desk Analytics
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                লাইভ অর্ডার ও কনফার্মেশন মনিটরিং
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              কাস্টমার সাপোর্ট (CS) অর্ডার ও কনফার্মেশন চার্ট সিস্টেম
            </h2>
          </div>
        </div>

        {/* Chart View Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartViewMode("bar")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              chartViewMode === "bar"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>বার চার্ট</span>
          </button>
          <button
            type="button"
            onClick={() => setChartViewMode("gauge")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              chartViewMode === "gauge"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>গেজ / ডোনাট</span>
          </button>
          <button
            type="button"
            onClick={() => setChartViewMode("status_breakdown")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              chartViewMode === "status_breakdown"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>সব স্ট্যাটাস</span>
          </button>
        </div>
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Orders Placed */}
        <div 
          onClick={() => onFilterStatus && onFilterStatus("all")}
          className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 rounded-2xl border-2 border-blue-200 p-4.5 shadow-2xs hover:border-blue-400 transition cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">
              মোট অর্ডার পড়েছে
            </span>
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700 group-hover:scale-110 transition">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {stats.totalOrdersCount} <span className="text-xs font-sans text-slate-500 font-bold">টি অর্ডার</span>
            </div>
            <div className="text-xs font-mono font-bold text-blue-700 mt-1">
              মোট টাকা: BDT {stats.totalOrderValue.toLocaleString()}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-blue-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>গড় অর্ডার: BDT {stats.avgOrderValue.toLocaleString()}</span>
            <span className="text-blue-600 font-bold">ক্লিক করে সবগুলো দেখুন →</span>
          </div>
        </div>

        {/* Card 2: Confirmed Orders */}
        <div 
          onClick={() => onFilterStatus && onFilterStatus("confirmed")}
          className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 rounded-2xl border-2 border-emerald-200 p-4.5 shadow-2xs hover:border-emerald-400 transition cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
              অর্ডার কনফার্ম হয়েছে
            </span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 group-hover:scale-110 transition">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              {stats.confirmedCount} <span className="text-xs font-sans text-emerald-600 font-bold">টি ({stats.confirmationRate}%)</span>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-800 mt-1">
              কনফার্মড টাকা: BDT {stats.confirmedValue.toLocaleString()}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-emerald-100 text-[10px] text-emerald-700 font-bold flex items-center justify-between">
            <span>সফল কনফার্মেশন হার: {stats.confirmationRate}%</span>
            <span>ফিল্টার করুন →</span>
          </div>
        </div>

        {/* Card 3: Pending Orders (বাকি আছে) */}
        <div 
          onClick={() => onFilterStatus && onFilterStatus("pending")}
          className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 rounded-2xl border-2 border-amber-200 p-4.5 shadow-2xs hover:border-amber-400 transition cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
              কনফার্ম বাকি আছে (Pending)
            </span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700 group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
              {stats.pendingCount} <span className="text-xs font-sans text-amber-600 font-bold">টি অর্ডার</span>
            </div>
            <div className="text-xs font-mono font-bold text-amber-800 mt-1">
              পেন্ডিং টাকা: BDT {stats.pendingValue.toLocaleString()}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-100 text-[10px] text-amber-800 font-bold flex items-center justify-between">
            <span>কাস্টমার যোগাযোগ জরুরি</span>
            <span>ফিল্টার করুন →</span>
          </div>
        </div>

        {/* Card 4: Delivered / Completed */}
        <div 
          onClick={() => onFilterStatus && onFilterStatus("delivered")}
          className="bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40 rounded-2xl border-2 border-purple-200 p-4.5 shadow-2xs hover:border-purple-400 transition cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide">
              সফল ডেলিভারি (Delivered)
            </span>
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700 group-hover:scale-110 transition">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-purple-800 font-mono">
              {stats.deliveredCount} <span className="text-xs font-sans text-purple-600 font-bold">টি ডেলিভার্ড</span>
            </div>
            <div className="text-xs font-mono font-bold text-purple-700 mt-1">
              ডেলিভারি টাকা: BDT {stats.deliveredValue.toLocaleString()}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-purple-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>স্টক আউট: {stats.stockOutCount} টি</span>
            <span className="text-purple-700 font-bold">ফিল্টার করুন →</span>
          </div>
        </div>
      </div>

      {/* Interactive Visual Chart Options */}
      <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 sm:p-5">
        {chartViewMode === "bar" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>অর্ডার ভলিউম ও টাকা ভিত্তিক তুলনামূলক বার চার্ট</span>
                </h3>
                <p className="text-xs text-slate-500">
                  মোট অর্ডার, কনফার্ম হওয়া অর্ডার এবং বাকি থাকা পেন্ডিং অর্ডারের লাইভ অনুপাত
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> মোট অর্ডার
                </span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> কনফার্মড
                </span>
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> বাকি (Pending)
                </span>
              </div>
            </div>

            {/* Horizontal Bar Breakdown */}
            <div className="space-y-3.5">
              {/* Row 1: Total Placed */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>মোট অর্ডার পড়েছে (Total Orders):</span>
                  </span>
                  <span className="font-mono">
                    {stats.totalOrdersCount} টি | BDT {stats.totalOrderValue.toLocaleString()} (100%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-xl h-4 overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-xl transition-all duration-500" style={{ width: "100%" }} />
                </div>
              </div>

              {/* Row 2: Confirmed Orders */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>কনফার্ম হয়েছে (Confirmed Orders):</span>
                  </span>
                  <span className="font-mono">
                    {stats.confirmedCount} টি | BDT {stats.confirmedValue.toLocaleString()} ({stats.confirmationRate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-xl h-4 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-xl transition-all duration-500"
                    style={{ width: `${Math.max(stats.confirmationRate, stats.confirmedCount > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Row 3: Pending Orders */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-amber-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    <span>কনফার্মেশন বাকি আছে (Pending Confirmation):</span>
                  </span>
                  <span className="font-mono">
                    {stats.pendingCount} টি | BDT {stats.pendingValue.toLocaleString()} ({stats.totalOrdersCount > 0 ? Math.round((stats.pendingCount / stats.totalOrdersCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-xl h-4 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-xl transition-all duration-500"
                    style={{ width: `${Math.max(stats.totalOrdersCount > 0 ? (stats.pendingCount / stats.totalOrdersCount) * 100 : 0, stats.pendingCount > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Row 4: Delivered */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-purple-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span>সফল ডেলিভারি (Delivered):</span>
                  </span>
                  <span className="font-mono">
                    {stats.deliveredCount} টি | BDT {stats.deliveredValue.toLocaleString()} ({stats.totalOrdersCount > 0 ? Math.round((stats.deliveredCount / stats.totalOrdersCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-xl h-4 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-600 h-full rounded-xl transition-all duration-500"
                    style={{ width: `${Math.max(stats.totalOrdersCount > 0 ? (stats.deliveredCount / stats.totalOrdersCount) * 100 : 0, stats.deliveredCount > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {chartViewMode === "gauge" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* SVG Donut Chart */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="text-slate-200 stroke-current"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Confirmed Slice */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="text-emerald-500 stroke-current transition-all duration-1000"
                    strokeWidth="12"
                    strokeDasharray={238.76}
                    strokeDashoffset={238.76 - (238.76 * (stats.confirmedCount / (stats.totalOrdersCount || 1)))}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                {/* Center Content */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black font-mono text-slate-900">
                    {stats.confirmationRate}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    কনফার্মেশন রেশিও
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>কনফার্মড ({stats.confirmedCount})</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span>পেন্ডিং ({stats.pendingCount})</span>
                </span>
              </div>
            </div>

            {/* Gauge Key Metrics */}
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">টোটাল অর্ডার মূল্যায়ন</span>
                <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                  BDT {stats.totalOrderValue.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  CS টিম দ্বারা সর্বমোট {stats.totalOrdersCount} টি অর্ডার প্রসেসিংয়ের আওতায় আনা হয়েছে।
                </p>
              </div>

              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">কনফার্মড ভলিউম</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    BDT {stats.confirmedValue.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg">
                  {stats.confirmedCount} টি অর্ডার
                </span>
              </div>

              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-950 block">বাকি থাকা পেন্ডিং ভলিউম</span>
                  <span className="text-lg font-black text-amber-700 font-mono">
                    BDT {stats.pendingValue.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs font-bold bg-amber-500 text-white px-2.5 py-1 rounded-lg">
                  {stats.pendingCount} টি অর্ডার
                </span>
              </div>
            </div>
          </div>
        )}

        {chartViewMode === "status_breakdown" && (
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
              সকল অর্ডারের স্ট্যাটাস অনুযায়ী বিস্তারিত তালিকা:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(Object.entries(stats.statusCounts) as [string, { count: number; amount: number }][]).map(([statusName, val]) => (
                <div
                  key={statusName}
                  onClick={() => onFilterStatus && onFilterStatus(statusName)}
                  className="bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-400 transition cursor-pointer flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-[150px]">
                      {statusName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">
                      BDT {val.amount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono">
                    {val.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Filter Buttons for Orders Table below */}
      {onFilterStatus && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>টেবিল ফিল্টার:</span>
            </span>
            {[
              { id: "all", label: `সবগুলো (${stats.totalOrdersCount})` },
              { id: "confirmed", label: `কনফার্মড (${stats.confirmedCount})` },
              { id: "pending", label: `বাকি / পেন্ডিং (${stats.pendingCount})` },
              { id: "delivered", label: `ডেলিভার্ড (${stats.deliveredCount})` },
              { id: "Stock Out", label: `স্টক আউট (${stats.stockOutCount})` }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilterStatus(f.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedFilterStatus === f.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            ফিল্টারে ক্লিক করলে নিচের তালিকা স্বয়ংক্রিয়ভাবে ফিল্টার হবে
          </span>
        </div>
      )}
    </div>
  );
}
