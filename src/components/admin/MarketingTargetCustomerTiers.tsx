import React, { useState, useMemo } from "react";
import {
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Phone,
  MessageCircle,
  Copy,
  Check,
  Search,
  Filter,
  Package,
  Layers,
  ChevronRight,
  ExternalLink,
  Edit3,
  Save,
  X,
  Sparkles,
  Info,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from "lucide-react";
import CustomerPhoneSecureDisplay from "./CustomerPhoneSecureDisplay";
import { canViewCustomerPhone } from "../../utils/customerPrivacy";

interface MarketingTargetCustomerTiersProps {
  orders: any[];
  onOpenOrderModal?: (order: any) => void;
  onOpenProductInfoModal?: (order: any) => void;
  onClose?: () => void;
}

export interface CustomerOrderRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address?: string;
  division?: string;
  amount: number;
  status: string;
  date: string;
  itemsCount: number;
  rawOrder: any;
  tierId: "tier_sub2k" | "tier_2k_5k" | "tier_5k_10k" | "tier_10k_50k" | "tier_50k_plus";
}

// Realistic sample customer orders representing each tier for seamless testing and demonstration
const DEFAULT_DEMO_MARKETING_ORDERS: any[] = [
  {
    id: "WBBD-99101",
    orderId: "WBBD-99101",
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: "Order Confirmed",
    total: 3450,
    subtotal: 3450,
    customerInfo: {
      name: "Tanjimul Hasan",
      phone: "01715889922",
      address: "House 14, Road 5, Uttara Sector 3, Dhaka",
      division: "Dhaka"
    },
    items: [{ name: "Korean Silk Blend Shirt", quantity: 3, price: 1150 }]
  },
  {
    id: "WBBD-99102",
    orderId: "WBBD-99102",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "Purchased",
    total: 4800,
    subtotal: 4800,
    customerInfo: {
      name: "Meherun Nesa",
      phone: "01819776633",
      address: "GEC Circle, Nasirabad, Chattogram",
      division: "Chattogram"
    },
    items: [{ name: "High-Waist Wide Leg Linen Trousers", quantity: 4, price: 1200 }]
  },
  {
    id: "WBBD-99103",
    orderId: "WBBD-99103",
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: "Order Confirmed",
    total: 7850,
    subtotal: 7850,
    customerInfo: {
      name: "Ashraful Islam",
      phone: "01912445566",
      address: "KDA Avenue, Shibbari, Khulna",
      division: "Khulna"
    },
    items: [{ name: "Thermal Windproof Winter Jacket", quantity: 2, price: 3925 }]
  },
  {
    id: "WBBD-99104",
    orderId: "WBBD-99104",
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: "Delivered",
    total: 9200,
    subtotal: 9200,
    customerInfo: {
      name: "Shahriar Kabir",
      phone: "01723112233",
      address: "Zindabazar, Sylhet City",
      division: "Sylhet"
    },
    items: [{ name: "Wireless Smart ANC Earbuds Wholesale", quantity: 5, price: 1840 }]
  },
  {
    id: "WBBD-99105",
    orderId: "WBBD-99105",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: "Shipped to Bangladesh",
    total: 28500,
    subtotal: 28500,
    customerInfo: {
      name: "Kazi Farhan Trading",
      phone: "01611998877",
      address: "Shop #24, New Super Market, Dhaka",
      division: "Dhaka"
    },
    items: [{ name: "Heavyweight Cotton Blank Hoodies", quantity: 30, price: 950 }]
  },
  {
    id: "WBBD-99106",
    orderId: "WBBD-99106",
    date: new Date(Date.now() - 86400000 * 6).toISOString(),
    status: "Order Confirmed",
    total: 42000,
    subtotal: 42000,
    customerInfo: {
      name: "Nusrat Jahan Boutique",
      phone: "01844223311",
      address: "Subidbazar, Sylhet",
      division: "Sylhet"
    },
    items: [{ name: "Embroidered Pakistani Lawn Fabrics", quantity: 20, price: 2100 }]
  },
  {
    id: "WBBD-99107",
    orderId: "WBBD-99107",
    date: new Date(Date.now() - 86400000 * 7).toISOString(),
    status: "Purchased",
    total: 85000,
    subtotal: 85000,
    customerInfo: {
      name: "Al-Amin Wholesale Hub",
      phone: "01711002299",
      address: "Chawkbazar Wholesale Market, Dhaka",
      division: "Dhaka"
    },
    items: [{ name: "High Torque Cordless Drill Kit 48V", quantity: 50, price: 1700 }]
  },
  {
    id: "WBBD-99108",
    orderId: "WBBD-99108",
    date: new Date(Date.now() - 86400000 * 8).toISOString(),
    status: "Order Confirmed",
    total: 125000,
    subtotal: 125000,
    customerInfo: {
      name: "TechnoWorld Bangladesh Ltd",
      phone: "01999887766",
      address: "IDB Bhaban, Rokeya Sarani, Agargaon, Dhaka",
      division: "Dhaka"
    },
    items: [{ name: "Gaming Mechanical Keyboards RGB Batch", quantity: 100, price: 1250 }]
  }
];

export default function MarketingTargetCustomerTiers({
  orders = [],
  onOpenOrderModal,
  onOpenProductInfoModal,
  onClose
}: MarketingTargetCustomerTiersProps) {
  // Target state with localStorage persistence
  const [targetAmount, setTargetAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("marketing_monthly_target");
      if (saved) return Number(saved) || 1500000;
    } catch {}
    return 1500000;
  });

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState(String(targetAmount));
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [copiedAllPhones, setCopiedAllPhones] = useState(false);

  // Save new target
  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(targetDraft);
    if (!isNaN(val) && val > 0) {
      setTargetAmount(val);
      try {
        localStorage.setItem("marketing_monthly_target", String(val));
      } catch {}
    }
    setIsEditingTarget(false);
  };

  // Helper to extract total amount from an order
  const getOrderAmount = (o: any) => {
    const val = Number(o.total ?? o.subtotal ?? o.invoice?.grandTotal ?? o.invoice?.subTotal ?? o.price ?? 0);
    return isNaN(val) ? 0 : val;
  };

  // Combine live orders with sample benchmark orders if orders count is low for demonstration
  const combinedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return DEFAULT_DEMO_MARKETING_ORDERS;
    // If fewer than 5 orders exist, enrich with demo benchmark orders to populate all tiers
    if (orders.length < 5) {
      const existingIds = new Set(orders.map(o => String(o.id || o.orderId)));
      const extras = DEFAULT_DEMO_MARKETING_ORDERS.filter(d => !existingIds.has(String(d.id || d.orderId)));
      return [...orders, ...extras];
    }
    return orders;
  }, [orders]);

  // Map each order to our CustomerOrderRecord format with tier attribution
  const customerRecords: CustomerOrderRecord[] = useMemo(() => {
    return combinedOrders.map((o, idx) => {
      const amt = getOrderAmount(o);
      const name = o.customerInfo?.name || o.customer || o.clientName || "Valued Customer";
      const phone = o.customerInfo?.phone || o.phone || o.clientPhone || `0170000000${idx}`;
      const email = o.customerInfo?.email || o.userEmail || o.email || "";
      const address = o.customerInfo?.address || o.address || "";
      const division = o.customerInfo?.division || o.division || "Dhaka";
      const orderId = String(o.mainOrderId || o.orderId || o.id || `ORD-${idx + 1}`);

      let tierId: CustomerOrderRecord["tierId"] = "tier_sub2k";
      if (amt >= 2000 && amt < 5000) {
        tierId = "tier_2k_5k";
      } else if (amt >= 5000 && amt < 10000) {
        tierId = "tier_5k_10k";
      } else if (amt >= 10000 && amt < 50000) {
        tierId = "tier_10k_50k";
      } else if (amt >= 50000) {
        tierId = "tier_50k_plus";
      }

      const itemsCount = Array.isArray(o.items)
        ? o.items.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 1), 0)
        : (Number(o.totalQuantity) || 1);

      return {
        id: String(o.id || orderId),
        orderId,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        address,
        division,
        amount: amt,
        status: o.status || "Pending",
        date: o.date ? new Date(o.date).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB"),
        itemsCount,
        rawOrder: o,
        tierId
      };
    });
  }, [combinedOrders]);

  // Aggregate tier metrics
  const tierSummary = useMemo(() => {
    let totalAchieved = 0;
    const uniqueCustomerPhoneSet = new Set<string>();

    const tiers = {
      tier_2k_5k: { label: "৳২,০০০ - ৳৫,০০০", min: 2000, max: 5000, count: 0, customers: new Set<string>(), amount: 0, records: [] as CustomerOrderRecord[] },
      tier_5k_10k: { label: "৳৫,০০০ - ৳১০,০০০", min: 5000, max: 10000, count: 0, customers: new Set<string>(), amount: 0, records: [] as CustomerOrderRecord[] },
      tier_10k_50k: { label: "৳১০,০০০ - ৳৫০,০০০", min: 10000, max: 50000, count: 0, customers: new Set<string>(), amount: 0, records: [] as CustomerOrderRecord[] },
      tier_50k_plus: { label: "৳৫০,০০০ - ৳১,০০,০০০+", min: 50000, max: Infinity, count: 0, customers: new Set<string>(), amount: 0, records: [] as CustomerOrderRecord[] },
      tier_sub2k: { label: "৳২,০০০ এর নিচে", min: 0, max: 2000, count: 0, customers: new Set<string>(), amount: 0, records: [] as CustomerOrderRecord[] }
    };

    // User Requested Brackets:
    // 1. 2000 থেকে 50000 টাকা কত জন কাস্টমার
    // 2. 5000 থেকে 50000 টাকা কত জন কাস্টমার
    // 3. 50000 থেকে 1 লক্ষ টাকার উপরে কত জন কাস্টমার
    const bracket_2k_50k = {
      label: "৳২,০০০ থেকে ৳৫০,০০০",
      count: 0,
      customers: new Set<string>(),
      amount: 0,
      records: [] as CustomerOrderRecord[]
    };
    const bracket_5k_50k = {
      label: "৳৫,০০০ থেকে ৳৫০,০০০",
      count: 0,
      customers: new Set<string>(),
      amount: 0,
      records: [] as CustomerOrderRecord[]
    };
    const bracket_50k_100k_plus = {
      label: "৳৫০,০০০ থেকে ১ লক্ষ+ টাকা",
      count: 0,
      customers: new Set<string>(),
      amount: 0,
      records: [] as CustomerOrderRecord[]
    };

    customerRecords.forEach((rec) => {
      totalAchieved += rec.amount;
      uniqueCustomerPhoneSet.add(rec.customerPhone);

      const t = tiers[rec.tierId];
      if (t) {
        t.count++;
        t.customers.add(rec.customerPhone);
        t.amount += rec.amount;
        t.records.push(rec);
      }

      if (rec.amount >= 2000 && rec.amount <= 50000) {
        bracket_2k_50k.count++;
        bracket_2k_50k.customers.add(rec.customerPhone);
        bracket_2k_50k.amount += rec.amount;
        bracket_2k_50k.records.push(rec);
      }

      if (rec.amount >= 5000 && rec.amount <= 50000) {
        bracket_5k_50k.count++;
        bracket_5k_50k.customers.add(rec.customerPhone);
        bracket_5k_50k.amount += rec.amount;
        bracket_5k_50k.records.push(rec);
      }

      if (rec.amount >= 50000) {
        bracket_50k_100k_plus.count++;
        bracket_50k_100k_plus.customers.add(rec.customerPhone);
        bracket_50k_100k_plus.amount += rec.amount;
        bracket_50k_100k_plus.records.push(rec);
      }
    });

    const remainingGap = Math.max(0, targetAmount - totalAchieved);
    const progressPct = targetAmount > 0 ? Math.min(100, Math.round((totalAchieved / targetAmount) * 100 * 10) / 10) : 0;
    const uniqueCustomersCount = uniqueCustomerPhoneSet.size;
    const avgOrderValue = customerRecords.length > 0 ? Math.round(totalAchieved / customerRecords.length) : 0;

    return {
      totalAchieved,
      remainingGap,
      progressPct,
      uniqueCustomersCount,
      avgOrderValue,
      tiers,
      bracket_2k_50k,
      bracket_5k_50k,
      bracket_50k_100k_plus
    };
  }, [customerRecords, targetAmount]);

  // Filtered customer list for the interactive directory
  const filteredCustomers = useMemo(() => {
    let list = customerRecords;

    if (selectedTier === "bracket_2k_50k") {
      list = list.filter((c) => c.amount >= 2000 && c.amount <= 50000);
    } else if (selectedTier === "bracket_5k_50k") {
      list = list.filter((c) => c.amount >= 5000 && c.amount <= 50000);
    } else if (selectedTier === "bracket_50k_100k_plus") {
      list = list.filter((c) => c.amount >= 50000);
    } else if (selectedTier !== "all") {
      list = list.filter((c) => c.tierId === selectedTier);
    }

    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.customerPhone.toLowerCase().includes(q) ||
          c.orderId.toLowerCase().includes(q) ||
          (c.division && c.division.toLowerCase().includes(q))
      );
    }

    return list;
  }, [customerRecords, selectedTier, customerSearch]);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleCopyAllPhones = () => {
    const phones = filteredCustomers
      .filter((c) => canViewCustomerPhone({ order: c.rawOrder, customer: c, viewerDepartment: "marketing" }))
      .map((c) => c.customerPhone)
      .filter(Boolean);

    if (phones.length === 0) {
      alert("অ্যাসাইনকৃত কোনো কাস্টমার নম্বর কপি করার অনুমতি নেই। শুধু সংশ্লিষ্ট ম্যানেজারের অ্যাসাইনকৃত কাস্টমার দেখা ও কপি করা যাবে।");
      return;
    }

    const uniquePhones = Array.from(new Set(phones)).join(", ");
    navigator.clipboard.writeText(uniquePhones);
    setCopiedAllPhones(true);
    setTimeout(() => setCopiedAllPhones(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-6 p-5 sm:p-6 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 text-white flex items-center justify-center shadow-md font-bold">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                Marketing & Sales Hub
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                টার্গেট ট্র্যাকার ও কাস্টমার অর্ডার ভ্যালু টায়ারস
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              মার্কেটিং টার্গেট, এচিভমেন্ট ও কাস্টমার টায়ার অ্যানালাইসিস
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditingTarget ? (
            <button
              type="button"
              onClick={() => {
                setTargetDraft(String(targetAmount));
                setIsEditingTarget(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>টার্গেট পরিবর্তন</span>
            </button>
          ) : (
            <form onSubmit={handleSaveTarget} className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-300">
              <span className="text-xs font-bold text-slate-500 pl-2">BDT</span>
              <input
                type="number"
                min="1000"
                step="10000"
                value={targetDraft}
                onChange={(e) => setTargetDraft(e.target.value)}
                className="w-28 px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTarget(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 transition cursor-pointer border border-rose-200 flex items-center gap-1.5 font-bold text-xs"
              title="Close modal"
            >
              <X className="w-4 h-4" />
              <span>বন্ধ করুন (Close)</span>
            </button>
          )}
        </div>
      </div>

      {/* Target & Achievement KPI Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Target Amount */}
        <div className="bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/40 rounded-2xl border-2 border-indigo-200 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-900">
            <span className="text-[11px] font-bold uppercase tracking-wide">মাসিক সেলস টার্গেট</span>
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-indigo-950 font-mono">
              BDT {targetAmount.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-indigo-600 mt-1">
              ধার্যকৃত বিক্রয় লক্ষ্যমাত্রা
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-indigo-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>সময়সীমা: চলতি মাস</span>
            <span className="text-indigo-700 font-bold">100% Target</span>
          </div>
        </div>

        {/* KPI 2: Achieved Amount */}
        <div className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 rounded-2xl border-2 border-emerald-200 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-900">
            <span className="text-[11px] font-bold uppercase tracking-wide">কত টাকা এচিভ করেছে</span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              BDT {tierSummary.totalAchieved.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-emerald-800 mt-1 flex items-center gap-1">
              <span className="font-bold">{tierSummary.progressPct}% এচিভড</span>
              <span className="text-[11px] text-slate-500">({customerRecords.length} টি অর্ডারে)</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-emerald-100 text-[10px] text-emerald-800 font-bold flex items-center justify-between">
            <span>গড় অর্ডার: BDT {tierSummary.avgOrderValue.toLocaleString()}</span>
            <span>✓ অর্জিত হয়েছে</span>
          </div>
        </div>

        {/* KPI 3: Remaining Gap */}
        <div className="bg-gradient-to-br from-rose-50/80 via-white to-rose-50/40 rounded-2xl border-2 border-rose-200 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-rose-900">
            <span className="text-[11px] font-bold uppercase tracking-wide">কত টাকা বাকি আছে</span>
            <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
              BDT {tierSummary.remainingGap.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-rose-700 mt-1">
              টার্গেট পূরণ হতে বাকি
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-rose-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>টার্গেট সম্পূর্ণ হতে বাকি:</span>
            <span className="text-rose-600 font-bold">{Math.max(0, 100 - tierSummary.progressPct)}%</span>
          </div>
        </div>

        {/* KPI 4: Unique Customers */}
        <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 rounded-2xl border-2 border-amber-200 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] font-bold uppercase tracking-wide">কয়টা কাস্টমার থেকে অর্ডার</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-800 font-mono">
              {tierSummary.uniqueCustomersCount} <span className="text-xs font-sans text-amber-700 font-bold">জন ক্রেতা</span>
            </div>
            <div className="text-xs font-semibold text-amber-900 mt-1">
              মোট অর্ডার পেয়েছেন: {customerRecords.length} টি
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-100 text-[10px] text-slate-600 flex items-center justify-between">
            <span>সক্রিয় বায়ার্স কভারেজ</span>
            <span className="text-amber-800 font-bold">মার্কেটিং ফানেল</span>
          </div>
        </div>
      </div>

      {/* Target Progress Bar */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>মাসিক সেলস টার্গেট প্রগ্রেস: {tierSummary.progressPct}% সম্পন্ন</span>
          </span>
          <span className="font-mono text-slate-600">
            BDT {tierSummary.totalAchieved.toLocaleString()} / BDT {targetAmount.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, tierSummary.progressPct)}%` }}
          />
        </div>
      </div>

      {/* User Prompt Requested Order Value Brackets */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border-2 border-emerald-300 rounded-3xl p-4.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-600 text-white font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                নির্দিষ্ট কাস্টমার অর্ডার ভ্যালু ব্র্যাকেট (Customer Order Value Brackets)
              </h3>
              <p className="text-[11px] text-slate-600 font-medium">
                ২০০০–৫০০০০ টাকা, ৫০০০–৫০০০০ টাকা ও ৫০ হাজার–১ লক্ষ+ টাকার অর্ডারের কাস্টমার সংখ্যা ও ভ্যালু
              </p>
            </div>
          </div>
          {selectedTier !== "all" && (
            <button
              onClick={() => setSelectedTier("all")}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline self-start sm:self-auto cursor-pointer"
            >
              সব কাস্টমার রিসেট করুন (Show All)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Bracket 1: 2,000 - 50,000 BDT */}
          <div
            onClick={() => setSelectedTier(selectedTier === "bracket_2k_50k" ? "all" : "bracket_2k_50k")}
            className={`p-3.5 rounded-2xl border-2 transition cursor-pointer ${
              selectedTier === "bracket_2k_50k"
                ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-300"
                : "bg-white/90 border-blue-200 hover:border-blue-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                ব্র্যাকেট ১
              </span>
              <span className="text-xs font-bold text-blue-800 font-mono">
                {tierSummary.bracket_2k_50k.count} টি অর্ডার
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-500">২,০০০ থেকে ৫০,০০০ টাকা</div>
              <div className="text-xl font-black text-blue-900 font-mono mt-0.5">
                {tierSummary.bracket_2k_50k.customers.size} জন কাস্টমার
              </div>
              <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                মোট: BDT {tierSummary.bracket_2k_50k.amount.toLocaleString()}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-blue-600 font-bold flex items-center justify-between">
              <span>{selectedTier === "bracket_2k_50k" ? "✓ নির্বাচিত" : "ক্লিক করে তালিকা দেখুন"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bracket 2: 5,000 - 50,000 BDT */}
          <div
            onClick={() => setSelectedTier(selectedTier === "bracket_5k_50k" ? "all" : "bracket_5k_50k")}
            className={`p-3.5 rounded-2xl border-2 transition cursor-pointer ${
              selectedTier === "bracket_5k_50k"
                ? "bg-white border-emerald-600 shadow-md ring-2 ring-emerald-300"
                : "bg-white/90 border-emerald-200 hover:border-emerald-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                ব্র্যাকেট ২
              </span>
              <span className="text-xs font-bold text-emerald-800 font-mono">
                {tierSummary.bracket_5k_50k.count} টি অর্ডার
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-500">৫,০০০ থেকে ৫০,০০০ টাকা</div>
              <div className="text-xl font-black text-emerald-900 font-mono mt-0.5">
                {tierSummary.bracket_5k_50k.customers.size} জন কাস্টমার
              </div>
              <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                মোট: BDT {tierSummary.bracket_5k_50k.amount.toLocaleString()}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-emerald-600 font-bold flex items-center justify-between">
              <span>{selectedTier === "bracket_5k_50k" ? "✓ নির্বাচিত" : "ক্লিক করে তালিকা দেখুন"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bracket 3: 50,000 - 100,000+ BDT */}
          <div
            onClick={() => setSelectedTier(selectedTier === "bracket_50k_100k_plus" ? "all" : "bracket_50k_100k_plus")}
            className={`p-3.5 rounded-2xl border-2 transition cursor-pointer ${
              selectedTier === "bracket_50k_100k_plus"
                ? "bg-white border-amber-600 shadow-md ring-2 ring-amber-300"
                : "bg-white/90 border-amber-200 hover:border-amber-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                ব্র্যাকেট ৩ (হাই-ভ্যালু / হোলসেল)
              </span>
              <span className="text-xs font-bold text-amber-800 font-mono">
                {tierSummary.bracket_50k_100k_plus.count} টি অর্ডার
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-500">৫০,০০০ থেকে ১ লক্ষ+ টাকা</div>
              <div className="text-xl font-black text-amber-900 font-mono mt-0.5">
                {tierSummary.bracket_50k_100k_plus.customers.size} জন কাস্টমার
              </div>
              <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                মোট: BDT {tierSummary.bracket_50k_100k_plus.amount.toLocaleString()}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-amber-600 font-bold flex items-center justify-between">
              <span>{selectedTier === "bracket_50k_100k_plus" ? "✓ নির্বাচিত" : "ক্লিক করে তালিকা দেখুন"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Customer Order Value Tiers Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>অর্ডার ভ্যালু টায়ারস (Order Value Tiers Breakdown)</span>
          </h3>
          <span className="text-xs text-slate-500">
            যেকোনো টায়ারে ক্লিক করে সরাসরি সেই কাস্টমারদের তালিকা দেখুন
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Tier 1: ৳২,০০০ - ৳৫,০০০ */}
          <div
            onClick={() => setSelectedTier(selectedTier === "tier_2k_5k" ? "all" : "tier_2k_5k")}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden ${
              selectedTier === "tier_2k_5k"
                ? "bg-sky-50/90 border-sky-500 shadow-md ring-2 ring-sky-300"
                : "bg-white border-slate-200 hover:border-sky-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-black uppercase">
                Tier 1
              </span>
              <span className="text-xs font-mono font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                {tierSummary.tiers.tier_2k_5k.count} Orders
              </span>
            </div>
            <div className="mt-2.5">
              <h4 className="text-sm font-black text-slate-900">৳২,০০০ থেকে ৳৫,০০০</h4>
              <div className="text-lg font-black text-sky-700 font-mono mt-0.5">
                {tierSummary.tiers.tier_2k_5k.customers.size} জন কাস্টমার
              </div>
              <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                মোট: BDT {tierSummary.tiers.tier_2k_5k.amount.toLocaleString()}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-sky-600 font-bold flex items-center justify-between">
              <span>{selectedTier === "tier_2k_5k" ? "✓ নির্বাচিত" : "ক্লিক করে কাস্টমার দেখুন"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Tier 2: ৳৫,০০০ - ৳১০,০০০ */}
          <div
            onClick={() => setSelectedTier(selectedTier === "tier_5k_10k" ? "all" : "tier_5k_10k")}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden ${
              selectedTier === "tier_5k_10k"
                ? "bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-300"
                : "bg-white border-slate-200 hover:border-emerald-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                Tier 2
              </span>
              <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {tierSummary.tiers.tier_5k_10k.count} Orders
              </span>
            </div>
            <div className="mt-2.5">
              <h4 className="text-sm font-black text-slate-900">৳৫,০০০ থেকে ৳১০,০০০</h4>
              <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                {tierSummary.tiers.tier_5k_10k.customers.size} জন কাস্টমার
              </div>
              <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                মোট: BDT {tierSummary.tiers.tier_5k_10k.amount.toLocaleString()}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-emerald-600 font-bold flex items-center justify-between">
              <span>{selectedTier === "tier_5k_10k" ? "✓ নির্বাচিত" : "ক্লিক করে কাস্টমার দেখুন"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Tier 3: ৳১০,০০০ - ৳৫০,০০০ */}
          <div
            onClick={() => setSelectedTier(selectedTier === "tier_10k_50k" ? "all" : "tier_10k_50k")}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden ${
              selectedTier === "tier_10k_50k"
                ? "bg-purple-50/90 border-purple-500 shadow-md ring-2 ring-purple-300"
                : "bg-white border-slate-200 hover:border-purple-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                Tier 3
              </span>
              <span className="text-xs font-mono font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                {tierSummary.tiers.tier_10k_50k.count} Orders
              </span>
            </div>
            <div className="mt-2.5">
              <h4 className="text-sm font-black text-slate-900">৳১০,০০০ থেকে ৳৫০,০০০</h4>
              <div className="text-lg font-black text-purple-700 font-mono mt-0.5">
                {tierSummary.tiers.tier_10k_50k.customers.size} জন কাস্টমার
              </div>
              <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                মোট: BDT {tierSummary.tiers.tier_10k_50k.amount.toLocaleString()}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-purple-600 font-bold flex items-center justify-between">
              <span>{selectedTier === "tier_10k_50k" ? "✓ নির্বাচিত" : "ক্লিক করে কাস্টমার দেখুন"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Tier 4: ৳৫০,০০০ - ৳১,০০,০০০+ */}
          <div
            onClick={() => setSelectedTier(selectedTier === "tier_50k_plus" ? "all" : "tier_50k_plus")}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden ${
              selectedTier === "tier_50k_plus"
                ? "bg-amber-50/90 border-amber-500 shadow-md ring-2 ring-amber-300"
                : "bg-white border-slate-200 hover:border-amber-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                Tier 4 (VIP / Bulk)
              </span>
              <span className="text-xs font-mono font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {tierSummary.tiers.tier_50k_plus.count} Orders
              </span>
            </div>
            <div className="mt-2.5">
              <h4 className="text-sm font-black text-slate-900">৳৫০,০০০ থেকে ৳১,০০,০০০+</h4>
              <div className="text-lg font-black text-amber-800 font-mono mt-0.5">
                {tierSummary.tiers.tier_50k_plus.customers.size} জন কাস্টমার
              </div>
              <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                মোট: BDT {tierSummary.tiers.tier_50k_plus.amount.toLocaleString()}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-amber-700 font-bold flex items-center justify-between">
              <span>{selectedTier === "tier_50k_plus" ? "✓ নির্বাচিত" : "ক্লিক করে কাস্টমার দেখুন"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Directory by Tier (নাম ও নাম্বার সহকারে তালিকা) */}
      <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>কাস্টমার ডিরেক্টরি (নাম, মোবাইল নম্বর ও অর্ডার বিবরণী)</span>
            </h3>
            <p className="text-xs text-slate-500">
              নির্বাচিত টায়ারের ক্রেতাদের সরাসরি কল, হোয়াটসঅ্যাপ ও বিস্তারিত দেখার সুবিধা
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyAllPhones}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
              title="Copy all phone numbers for marketing SMS"
            >
              {copiedAllPhones ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedAllPhones ? "সব নাম্বার কপি হয়েছে!" : "সব নাম্বার কপি করুন"}</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tier Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedTier("all")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                selectedTier === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              সবগুলো টায়ার ({customerRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier("tier_2k_5k")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                selectedTier === "tier_2k_5k"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              ৳২,০০০ - ৳৫,০০০ ({tierSummary.tiers.tier_2k_5k.count})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier("tier_5k_10k")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                selectedTier === "tier_5k_10k"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              ৳৫,০০০ - ৳১০,০০০ ({tierSummary.tiers.tier_5k_10k.count})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier("tier_10k_50k")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                selectedTier === "tier_10k_50k"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              ৳১০,০০০ - ৳৫০,০০০ ({tierSummary.tiers.tier_10k_50k.count})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier("tier_50k_plus")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                selectedTier === "tier_50k_plus"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              ৳৫০,০০০ - ৳১,০০,০০০+ ({tierSummary.tiers.tier_50k_plus.count})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="নাম বা মোবাইল নম্বর খুঁজুন..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 shadow-2xs"
            />
            {customerSearch && (
              <button
                type="button"
                onClick={() => setCustomerSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Customer Records Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">কাস্টমারের নাম ও ঠিকানা</th>
                <th className="py-3 px-4">মোবাইল নম্বর ও যোগাযোগ</th>
                <th className="py-3 px-4">অর্ডার আইডি ও তারিখ</th>
                <th className="py-3 px-4">অর্ডারের পরিমাণ (BDT)</th>
                <th className="py-3 px-4">অর্ডার টায়ার</th>
                <th className="py-3 px-4">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    {customerSearch
                      ? `"${customerSearch}" দিয়ে কোনো কাস্টমার পাওয়া যায়নি।`
                      : "এই টায়ারে বর্তমানে কোনো অর্ডার নেই।"}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const cleanPhone = String(cust.customerPhone).replace(/^0/, "").replace(/[^0-9]/g, "");
                  const waMsg = `Hello ${cust.customerName}, regarding your order ${cust.orderId} at World Buy BD:`;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition align-top">
                      {/* 1. Name & Address */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {cust.customerName}
                        </div>
                        {cust.address && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]" title={cust.address}>
                            {cust.address}
                          </div>
                        )}
                        <span className="text-[10px] font-semibold text-slate-400">
                          {cust.division || "Dhaka"}
                        </span>
                      </td>

                      {/* 2. Phone Number with Call & WhatsApp */}
                      <td className="py-3 px-4">
                        <CustomerPhoneSecureDisplay
                          order={cust.rawOrder}
                          customer={cust}
                          phone={cust.customerPhone}
                          viewerDepartment="marketing"
                          showActions={true}
                        />
                      </td>

                      {/* 3. Order ID & Date */}
                      <td className="py-3 px-4">
                        <span
                          onClick={() => onOpenProductInfoModal && onOpenProductInfoModal(cust.rawOrder)}
                          className="font-mono font-bold text-primary hover:underline cursor-pointer block"
                          title="Click to view product details"
                        >
                          {cust.orderId}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {cust.date} · {cust.itemsCount} pcs
                        </span>
                      </td>

                      {/* 4. Order Amount */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <span className="text-sm font-black text-slate-900">
                          BDT {cust.amount.toLocaleString()}
                        </span>
                      </td>

                      {/* 5. Order Tier Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${
                            cust.tierId === "tier_50k_plus"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : cust.tierId === "tier_10k_50k"
                              ? "bg-purple-100 text-purple-900 border border-purple-200"
                              : cust.tierId === "tier_5k_10k"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                              : "bg-sky-100 text-sky-900 border border-sky-200"
                          }`}
                        >
                          {cust.tierId === "tier_50k_plus"
                            ? "৳৫০k-১০০k+"
                            : cust.tierId === "tier_10k_50k"
                            ? "৳১০k-৫০k"
                            : cust.tierId === "tier_5k_10k"
                            ? "৳৫k-১০k"
                            : "৳২k-৫k"}
                        </span>
                      </td>

                      {/* 6. Order Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            cust.status === "Delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : cust.status === "Stock Out"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {cust.status}
                        </span>
                      </td>

                      {/* 7. Action Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenProductInfoModal && onOpenProductInfoModal(cust.rawOrder)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 text-[10px] font-black transition cursor-pointer shadow-2xs group inline-flex items-center gap-1"
                          title="View product specifications, quantity & tracking details"
                        >
                          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 group-hover:bg-white text-white group-hover:text-blue-600 flex items-center justify-center text-[9px] font-black font-serif italic">
                            i
                          </span>
                          <span>বিস্তারিত</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
