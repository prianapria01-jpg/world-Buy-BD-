import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Package,
  Settings,
  LogOut,
  CheckCircle2,
  LayoutGrid,
  List,
  CreditCard,
  PhoneCall,
  Heart,
  ShoppingCart,
  Trash2,
  Eye,
  Download,
  FileText,
  Truck,
  Scale,
  MapPin,
  Mail,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  RefreshCw,
  Banknote,
  Sparkles,
  CheckCircle,
  MessageSquare,
  MessageCircle,
  Edit3,
  X
} from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import StaffAvatar from "../components/admin/StaffAvatar";
import InvoiceModal from "../components/InvoiceModal";
import {
  buildInvoiceFromOrder,
  downloadCustomInvoicePdf,
  buildSubOrderInvoice
} from "../utils/customInvoice";
import { getSafeImageUrl, DEFAULT_PRODUCT_FALLBACK } from "../utils/imageUrl";
import { enrichOrderWithSubOrders } from "../utils/orderVariations";
import { getProductPath } from "../utils/productUrl";

function normalizePhoneTail(raw: any): string {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export default function CustomerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const initialTab =
    queryParams.get("tab") ||
    (location.pathname.includes("wishlist") ? "wishlist" : "dashboard");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedSubId, setCopiedSubId] = useState<string | null>(null);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSubId(label);
    setTimeout(() => setCopiedSubId(null), 2500);
  };

  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { state: { from: location } });
    }
  }, [authLoading, user, navigate, location]);

  // Per-Customer Isolated Storage Key
  const userStorageKey = useMemo(() => {
    if (!user) return "";
    return String(user.uid || user.email || user.phoneNumber || "").trim();
  }, [user]);

  const [customerProfile, setCustomerProfile] = useState<{
    name: string;
    phone: string;
    email: string;
    address: string;
    division: string;
    postalCode: string;
  }>({
    name: "",
    phone: "",
    email: "",
    address: "",
    division: "Dhaka",
    postalCode: "",
  });

  // Load saved profile for ONLY this logged-in user
  useEffect(() => {
    if (!user || !userStorageKey) return;
    let saved: any = {};
    try {
      const raw = localStorage.getItem(`customer_profile_${userStorageKey}`);
      if (raw) saved = JSON.parse(raw);
    } catch {}

    const resolvedPhone = saved.phone || user.phoneNumber || user.phone || "";
    const resolvedName = saved.name || user.displayName || user.name || (user.email ? user.email.split("@")[0] : "Customer");
    const resolvedEmail = saved.email || user.email || "";
    const resolvedAddress = saved.address || user.address || "";
    const resolvedDivision = saved.division || user.division || "Dhaka";
    const resolvedPostalCode = saved.postalCode || user.postalCode || "";

    setCustomerProfile({
      name: resolvedName,
      phone: resolvedPhone,
      email: resolvedEmail,
      address: resolvedAddress,
      division: resolvedDivision,
      postalCode: resolvedPostalCode,
    });

    // Also fetch fresh saved profile from backend if available
    fetch(`/api/customer/profile?identifier=${encodeURIComponent(userStorageKey)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          const u = data.user;
          setCustomerProfile((prev) => ({
            name: u.name || u.displayName || prev.name,
            phone: u.phone || u.phoneNumber || prev.phone,
            email: u.email || prev.email,
            address: u.address || prev.address,
            division: u.division || prev.division,
            postalCode: u.postalCode || prev.postalCode,
          }));
        }
      })
      .catch(() => {});
  }, [user, userStorageKey]);

  // Stock-Out Form States (strictly per order ID)
  const [stockOutForms, setStockOutForms] = useState<Record<string, {
    choice: "refund" | "adjust";
    paymentMethod: "bkash" | "nagad" | "rocket" | "bank";
    accountNumber: string;
    accountType: "personal" | "agent" | "bank_acc";
    bankDetails: string;
    note: string;
    submitting: boolean;
    isEditing: boolean;
  }>>({});
  const [stockOutFilter, setStockOutFilter] = useState<"all" | "action_needed" | "pending" | "completed">("all");
  const [refundLogs, setRefundLogs] = useState<any[]>([]);

  const fetchRefundLogs = () => {
    fetch("/api/stock-out-refunds")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRefundLogs(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchRefundLogs();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (location.pathname.includes("wishlist")) {
      setActiveTab("wishlist");
    }
  }, [location.search, location.pathname]);

  // Strict client-side verification so one customer NEVER sees another customer's order
  const orderBelongsToCurrentUser = (order: any): boolean => {
    if (!user || !order) return false;
    const myUid = String(user.uid || "").trim();
    const myEmail = String(user.email || customerProfile.email || "").trim().toLowerCase();
    const myPhoneTail = normalizePhoneTail(user.phoneNumber || customerProfile.phone || "");

    const oUid = String(order.userId || order.customerInfo?.userId || order.paymentInfo?.userId || "").trim();
    const oEmail = String(
      order.userEmail || order.customerInfo?.email || order.invoice?.email || order.email || ""
    )
      .trim()
      .toLowerCase();
    const oPhoneTail = normalizePhoneTail(
      order.userPhone || order.customerInfo?.phone || order.invoice?.phone || order.customerPhone || order.phone || ""
    );

    if (myUid && oUid && myUid === oUid) return true;
    if (myEmail && oEmail && myEmail === oEmail) return true;
    if (myPhoneTail && myPhoneTail.length >= 10 && oPhoneTail && myPhoneTail === oPhoneTail) return true;

    return false;
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let savedProf: any = {};
    try {
      const raw = localStorage.getItem(`customer_profile_${userStorageKey}`);
      if (raw) savedProf = JSON.parse(raw);
    } catch {}

    const qUid = encodeURIComponent(user.uid || "");
    const qEmail = encodeURIComponent(user.email || savedProf.email || "");
    const qPhone = encodeURIComponent(user.phoneNumber || savedProf.phone || "");

    fetch(`/api/orders?customerOnly=true&userId=${qUid}&email=${qEmail}&phone=${qPhone}`)
      .then((res) => res.json())
      .then((ordersData) => {
        const raw = Array.isArray(ordersData) ? ordersData : [];
        const unique = new Map();
        for (const o of raw) {
          if (!orderBelongsToCurrentUser(o)) continue;
          const canonicalId = String(o?.mainOrderId || o?.orderId || o?.id || "").trim();
          if (canonicalId && !unique.has(canonicalId)) {
            unique.set(canonicalId, enrichOrderWithSubOrders({
              ...o,
              id: canonicalId,
              orderId: canonicalId,
              mainOrderId: canonicalId,
            }));
          }
        }
        const myOrders = Array.from(unique.values());
        setOrders(myOrders);

        // Enrich customer profile from their latest order if any field wasn't set yet
        if (myOrders.length > 0) {
          const latestInfo = myOrders[0].customerInfo || {};
          const latestMarketingStaff = myOrders.find((o: any) => o.assignedMarketingStaff?.name)?.assignedMarketingStaff;
          setCustomerProfile((prev) => ({
            name: prev.name || latestInfo.name || "Customer",
            phone: prev.phone || latestInfo.phone || "",
            email: prev.email || latestInfo.email || "",
            address: prev.address || latestInfo.address || "",
            division: prev.division || latestInfo.division || "Dhaka",
            postalCode: prev.postalCode || latestInfo.postalCode || "",
            assignedMarketingStaff: latestMarketingStaff || (prev as any).assignedMarketingStaff,
          }));
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setOrders([]);
        setLoading(false);
      });

    // Also fetch saved profile from backend database to get assigned marketing officer if assigned by admin
    const profileLookupId = user.phoneNumber || user.email || user.uid || savedProf.phone || savedProf.email;
    if (profileLookupId) {
      fetch(`/api/customer/profile?identifier=${encodeURIComponent(profileLookupId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setCustomerProfile((prev: any) => ({
              ...prev,
              name: prev.name || data.user.name || data.user.fullName || "Customer",
              phone: prev.phone || data.user.phone || data.user.phoneNumber || "",
              email: prev.email || data.user.email || "",
              address: prev.address || data.user.address || "",
              division: prev.division || data.user.division || "Dhaka",
              postalCode: prev.postalCode || data.user.postalCode || "",
              assignedMarketingStaff: data.user.assignedMarketingStaff || prev.assignedMarketingStaff,
            }));
          }
        })
        .catch(() => {});
    }
  }, [user, authLoading, userStorageKey]);

  // Dedicated Marketing & Key Account Manager for this customer
  const assignedMarketingStaff = useMemo(() => {
    // 1. Check orders (most recent assigned first)
    const fromOrders = orders.find((o: any) => o?.assignedMarketingStaff?.name)?.assignedMarketingStaff;
    if (fromOrders) return fromOrders;

    // 2. Check saved customer profile
    if ((customerProfile as any)?.assignedMarketingStaff?.name) {
      return (customerProfile as any).assignedMarketingStaff;
    }

    // 3. Check auth user object
    if ((user as any)?.assignedMarketingStaff?.name) {
      return (user as any).assignedMarketingStaff;
    }

    return null;
  }, [orders, customerProfile, user]);

  const [hideMarketingBanner, setHideMarketingBanner] = useState(() => {
    return localStorage.getItem("hide_mkt_banner") === "true";
  });

  const renderDedicatedAccountManagerBanner = () => {
    if (hideMarketingBanner) return null;

    const cleanPhone = assignedMarketingStaff?.phone
      ? String(assignedMarketingStaff.phone).replace(/\D/g, "").slice(-10)
      : "";

    if (assignedMarketingStaff?.name) {
      return (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-indigo-800/60 relative overflow-hidden">
          {/* Subtle background decorative element */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <button
            type="button"
            onClick={() => {
              setHideMarketingBanner(true);
              localStorage.setItem("hide_mkt_banner", "true");
            }}
            className="absolute top-3 right-3 z-20 text-white/50 hover:text-white p-1 rounded-full cursor-pointer transition"
            title="ব্যানারটি সরান / লুকান"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Left: Manager Photo & Info */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative shrink-0">
                <StaffAvatar
                  name={assignedMarketingStaff.name}
                  avatar={assignedMarketingStaff.avatar}
                  size="2xl"
                  statusBadge={true}
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-900 shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  Active
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>আপনার পার্সোনাল মার্কেটিং ও অ্যাকাউন্ট ম্যানেজার</span>
                  </span>
                  {assignedMarketingStaff.code && (
                    <span className="bg-white/10 text-indigo-200 border border-white/15 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      {assignedMarketingStaff.code}
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white">
                  {assignedMarketingStaff.name}
                </h3>

                <p className="text-xs text-indigo-200 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span>মার্কেটিং ও বিজনেস অ্যাকাউন্ট ম্যানেজার</span>
                  <span>•</span>
                  <span className="font-mono text-white font-bold">📞 {assignedMarketingStaff.phone}</span>
                  {assignedMarketingStaff.email && (
                    <>
                      <span>•</span>
                      <span className="text-slate-300">✉️ {assignedMarketingStaff.email}</span>
                    </>
                  )}
                </p>

                <p className="text-[11px] text-slate-300 max-w-xl leading-relaxed pt-0.5">
                  আপনার সকল অর্ডার ট্র্যাকিং, চায়না ফ্যাক্টরি থেকে স্পেশাল সোর্সিং, হোলসেল বা বাল্ক রেট এবং পেমেন্ট সংক্রান্ত সহায়তার জন্য সরাসরি আপনার নির্ধারিত কর্মকর্তার সাথে যোগাযোগ করুন।
                </p>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
              {cleanPhone && (
                <a
                  href={`https://wa.me/880${cleanPhone}?text=${encodeURIComponent(
                    `হ্যালো ${assignedMarketingStaff.name}, আমি World Buy BD এর কাস্টমার (${customerProfile.name || "Customer"})। আমার অর্ডার #${orders[0]?.id || ""} সংক্রান্ত তথ্যের জন্য যোগাযোগ করছি।`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer flex-1 sm:flex-none"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp চ্যাট</span>
                </a>
              )}

              {assignedMarketingStaff.phone && (
                <a
                  href={`tel:${assignedMarketingStaff.phone}`}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer flex-1 sm:flex-none"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>সরাসরি কল</span>
                </a>
              )}

              {assignedMarketingStaff.email && (
                <a
                  href={`mailto:${assignedMarketingStaff.email}`}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold px-3 py-2.5 rounded-xl hidden md:flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="ইমেইল পাঠান"
                >
                  <Mail className="w-4 h-4 text-indigo-300" />
                </a>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Friendly welcoming notice if no manager is assigned yet
    return (
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-800 relative">
        <button
          type="button"
          onClick={() => {
            setHideMarketingBanner(true);
            localStorage.setItem("hide_mkt_banner", "true");
          }}
          className="absolute top-3 right-3 z-20 text-white/50 hover:text-white p-1 rounded-full cursor-pointer transition"
          title="ব্যানারটি সরান / লুকান"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  World Buy BD একাউন্ট রিলেশনশিপ ডেস্ক
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                আপনার অর্ডারের জন্য ডেডিকেটেড মার্কেটিং ম্যানেজার নির্ধারণ করা হবে
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                অর্ডার নিশ্চিতকরণের সাথে সাথে আমাদের মার্কেটিং টিম থেকে একজন নির্দিষ্ট অ্যাকাউন্ট ম্যানেজার আপনার সাথে যোগাযোগ করবেন। যেকোনো জরুরি প্রয়োজনে আমাদের সেন্ট্রাল হেল্পলাইনে যোগাযোগ করতে পারেন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://wa.me/8801355136661"
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>সাপোর্ট WhatsApp</span>
            </a>
            <a
              href="tel:+8801355136661"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-300" />
              <span>01355-136661</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userStorageKey) return;
    try {
      localStorage.setItem(`customer_profile_${userStorageKey}`, JSON.stringify(customerProfile));
      const currentPhoneUser = localStorage.getItem("phone_user");
      if (currentPhoneUser) {
        try {
          const parsed = JSON.parse(currentPhoneUser);
          localStorage.setItem("phone_user", JSON.stringify({ ...parsed, ...customerProfile }));
        } catch {}
      }
      showToast("Your personal details have been saved!");
      // Sync to backend
      await fetch("/api/customer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: userStorageKey, ...customerProfile })
      });
    } catch {
      showToast("Personal details saved locally!");
    }
  };

  // Stock-Out Helper functions & Data calculation
  const getStockOutRefundAmount = (order: any): number => {
    if (order.stockOutInfo?.totalRefundAmount !== undefined && Number(order.stockOutInfo.totalRefundAmount) >= 0) {
      return Number(order.stockOutInfo.totalRefundAmount);
    }
    const stockOutItems = (order.items || []).filter((it: any) => it.isStockOut);
    if (stockOutItems.length > 0) {
      return stockOutItems.reduce((sum: number, it: any) => {
        const price = Number(it.refundAmount || (Number(it.unitPrice || it.price || 0) * Number(it.stockOutQuantity || it.quantity || 1)));
        return sum + price;
      }, 0);
    }
    return Number(order.paidAmount ?? order.invoice?.paidAmount ?? order.subtotal ?? order.total ?? 0);
  };

  const isOrderStockOut = (order: any): boolean => {
    return (
      order.status === "Stock Out" ||
      order.stockOutInfo?.isStockOut === true ||
      (Array.isArray(order.items) && order.items.some((it: any) => it.isStockOut))
    );
  };

  const stockOutOrders = useMemo(() => {
    return orders.filter((o) => isOrderStockOut(o));
  }, [orders]);

  const stockOutCount = stockOutOrders.length;

  const totalStockOutRefundAmount = useMemo(() => {
    return stockOutOrders.reduce((sum, o) => sum + getStockOutRefundAmount(o), 0);
  }, [stockOutOrders]);

  const stockOutNeedsActionCount = useMemo(() => {
    return stockOutOrders.filter((o) => !o.stockOutInfo?.customerChoice).length;
  }, [stockOutOrders]);

  const getFormForOrder = (order: any) => {
    const id = String(order.mainOrderId || order.orderId || order.id);
    const existing = stockOutForms[id];
    if (existing) return existing;
    return {
      choice: ((order.stockOutInfo?.customerChoice as any) || "refund") as "refund" | "adjust",
      paymentMethod: ((order.stockOutInfo?.customerPaymentMethod as any) || "bkash") as "bkash" | "nagad" | "rocket" | "bank",
      accountNumber: order.stockOutInfo?.customerAccountNumber || customerProfile.phone || "",
      accountType: ((order.stockOutInfo?.customerAccountType as any) || "personal") as "personal" | "agent" | "bank_acc",
      bankDetails: order.stockOutInfo?.customerBankDetails || "",
      note: order.stockOutInfo?.customerNote || "",
      submitting: false,
      isEditing: false,
    };
  };

  const updateFormForOrder = (orderId: string, updates: Partial<any>) => {
    setStockOutForms((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || getFormForOrder({ id: orderId })),
        ...updates,
      },
    }));
  };

  const handleStockOutSubmit = async (order: any) => {
    const canonicalId = String(order.mainOrderId || order.orderId || order.id);
    const form = getFormForOrder(order);
    const refundAmt = getStockOutRefundAmount(order);

    if (form.choice === "refund" && !form.accountNumber.trim()) {
      showToast("Please enter your bKash, Nagad, or account number for refund.");
      return;
    }

    updateFormForOrder(canonicalId, { submitting: true });

    try {
      const res = await fetch(`/api/orders/${canonicalId}/stock-out-request`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerChoice: form.choice,
          customerPaymentMethod: form.paymentMethod,
          customerAccountNumber: form.accountNumber.trim(),
          customerAccountType: form.accountType,
          customerBankDetails: form.bankDetails.trim(),
          customerNote: form.note.trim(),
          totalRefundAmount: refundAmt,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) =>
          prev.map((o) => {
            const oId = String(o.mainOrderId || o.orderId || o.id);
            if (oId === canonicalId) {
              return {
                ...o,
                ...updated,
                status: "Stock Out",
                stockOutInfo: {
                  ...(o.stockOutInfo || {}),
                  ...(updated.stockOutInfo || {}),
                  isStockOut: true,
                  customerChoice: form.choice,
                  customerPaymentMethod: form.paymentMethod,
                  customerAccountNumber: form.accountNumber.trim(),
                  customerAccountType: form.accountType,
                  customerBankDetails: form.bankDetails.trim(),
                  customerNote: form.note.trim(),
                  totalRefundAmount: refundAmt,
                  status: "requested",
                  requestedAt: new Date().toISOString(),
                },
              };
            }
            return o;
          })
        );
        updateFormForOrder(canonicalId, { submitting: false, isEditing: false });
        showToast(
          form.choice === "refund"
            ? "Refund request submitted successfully! Our admin team will verify and send the funds shortly."
            : "Balance adjustment request submitted successfully! It will be adjusted against your invoice."
        );
      } else {
        showToast("Failed to submit claim. Please try again.");
        updateFormForOrder(canonicalId, { submitting: false });
      }
    } catch (e) {
      console.error(e);
      showToast("Network issue. Please try again.");
      updateFormForOrder(canonicalId, { submitting: false });
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "orders", label: "My Orders", icon: Package },
    { id: "stockout", label: "Stock-Out & Refunds", icon: AlertOctagon, badge: stockOutNeedsActionCount },
    { id: "old_orders", label: "Order History", icon: List },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "settings", label: "My Profile", icon: Settings },
  ];

  const waitingCount = orders.filter((o) =>
    ["Pending", "Order Placed", "Waiting For Verification"].includes(o.status)
  ).length;
  const processingCount = orders.filter((o) =>
    [
      "Order Confirmed",
      "Confirmed Order",
      "Processing",
      "Purchased",
      "Shipped to China Warehouse",
      "Received in China Warehouse",
      "In Warehouse",
      "Shipped from China",
      "Shipped to Bangladesh",
      "Received in BD Customs",
      "Customs Clearance",
      "Received in BD Warehouse",
      "Invoice Generated",
      "Ready for Delivery",
      "Assigned to Delivery",
    ].includes(o.status)
  ).length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  const formatOrderTableDate = (rawDate: any, fallback: string) => {
    if (!rawDate) return fallback || new Date().toLocaleDateString("en-GB");
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return String(rawDate);
  };

  const getStatusBadgeStyle = (statusStr: string) => {
    const s = String(statusStr || "Pending");
    if (s === "Stock Out") {
      return "bg-red-100 text-red-800 border-red-300";
    }
    if (s === "Purchased") {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
    if (s === "Delivered") {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (s === "Order Confirmed" || s === "Confirmed Order") {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    if (s === "Cancelled") {
      return "bg-slate-200 text-slate-700 border-slate-300";
    }
    return "bg-amber-50 text-amber-800 border-amber-200";
  };

  const renderOrderCards = (orderList: any[]) => {
    if (loading) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
          Loading your orders...
        </div>
      );
    }

    if (orderList.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold">You have not placed any orders yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Browse our catalog and place an order to track your shipments and invoices here.
          </p>
          <button
            onClick={() => navigate("/shop")}
            className="mt-4 bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition cursor-pointer"
          >
            Start Shopping
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {orderList.map((order, idx) => {
          const inv = buildInvoiceFromOrder(order, order.invoice);
          const displayDate = formatOrderTableDate(
            order.date || order.createdAt,
            inv.orderDate
          );
          const productPrice = Math.round(Number(inv.productSubtotal ?? inv.subTotal ?? 0));
          const hasAdminUploadedCharges = Boolean(
            order.adminChargesUploaded ||
              inv.adminChargesUploaded ||
              Number(order.chinaCourierCharge || inv.chinaCourier || 0) > 0 ||
              Number(order.weightKg || 0) > 0 ||
              parseFloat(String(inv.weightApx || "0").replace(/[^0-9.]/g, "")) > 0
          );
          const chinaCourier = hasAdminUploadedCharges
            ? Math.round(Number(inv.chinaCourier ?? 0))
            : 0;
          const weightNum = hasAdminUploadedCharges
            ? parseFloat(String(inv.weightApx || "0").replace(/[^0-9.]/g, "")) || 0
            : 0;
          const shippingRatePerKg = Math.round(
            Number(order.shippingRatePerKg ?? inv.shippingRatePerKg ?? 780)
          );
          const shippingCharge = hasAdminUploadedCharges
            ? Math.round(
                weightNum > 0
                  ? weightNum * shippingRatePerKg
                  : Number(inv.shippingCharge ?? 0)
              )
            : 0;
          const discount = Math.round(Number(inv.discount ?? 0));
          const netProductPrice = Math.max(0, productPrice - discount);
          const paidAmount = Math.round(Number(inv.paidAmount ?? netProductPrice));
          const grandTotal = netProductPrice + shippingCharge + chinaCourier;
          const dueAmount = Math.max(0, grandTotal - paidAmount);
          const rawStatus = String(order.status || inv.status || "Pending").trim();
          const currentStatus =
            !rawStatus || rawStatus === "Order Placed" ? "Pending" : rawStatus;
          const customerTrackingNo =
            inv.trackingNumber ||
            order.trackingNumber ||
            order.chinaWarehouseInfo?.trackingNumber ||
            order.purchaseInfo?.chinaTrackingNumber ||
            "";
          const isDetailsOpen = expandedOrderId === inv.orderId;
          const firstItemThumb = getSafeImageUrl(
            inv.items?.[0]?.image,
            DEFAULT_PRODUCT_FALLBACK,
            inv.items?.[0]?.description || "Product"
          );

          return (
            <div
              key={`${inv.orderId}-${idx}`}
              className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden hover:border-slate-300 transition"
            >
              {/* Primary Order Summary Row with Right-Side "View Details" Button */}
              <div className="bg-slate-900 text-white px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  {(() => {
                    const firstItemPath = getProductPath(inv.items?.[0] || order.items?.[0] || order);
                    return (
                      <a
                        href={firstItemPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group shrink-0 block"
                        title="প্রোডাক্ট পেজ দেখুন / Open Product Page"
                      >
                        <img
                          src={firstItemThumb}
                          alt="Order item"
                          className="w-11 h-11 rounded-lg object-cover border border-slate-700 bg-white group-hover:border-primary group-hover:scale-105 transition"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK;
                          }}
                        />
                        <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition">
                          <ExternalLink className="w-3.5 h-3.5 text-white" />
                        </span>
                      </a>
                    );
                  })()}
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                      Order ID
                    </span>
                    <span className="font-mono font-black text-sm text-amber-300">
                      {order.orderId || order.id || inv.orderId}
                    </span>
                  </div>
                  {order.subOrders && order.subOrders.length > 0 && (
                    <>
                      <span className="text-slate-700 hidden sm:inline">|</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                          Sub-Orders ({order.subOrders.length} Links)
                        </span>
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          {order.subOrders.map((sub: any) => (
                            <span 
                              key={sub.subOrderId} 
                              className="font-mono text-[10px] font-bold text-sky-300 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded"
                              title={`Sub-Order: ${sub.subOrderId} (${sub.productName})`}
                            >
                              {sub.subOrderId}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  <span className="text-slate-700 hidden sm:inline">|</span>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Product Summary
                    </span>
                    <a
                      href={getProductPath(inv.items?.[0] || order.items?.[0] || order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-white hover:text-amber-300 hover:underline line-clamp-1 max-w-[200px] flex items-center gap-1 group"
                      title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                    >
                      <span className="truncate">{inv.items?.[0]?.description || "Ordered Product"} ({inv.totalProductQty} pcs)</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-300 shrink-0" />
                    </a>
                  </div>
                  <span className="text-slate-700 hidden sm:inline">|</span>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Assigned Shipping Rate
                    </span>
                    <span className="font-mono font-bold text-xs text-sky-300">
                      BDT {shippingRatePerKg.toLocaleString()} / KG
                    </span>
                  </div>
                  <span className="text-slate-700 hidden sm:inline">|</span>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Tracking Number
                    </span>
                    <span className="font-mono font-bold text-xs text-emerald-300">
                      {customerTrackingNo || "Pending Upload"}
                    </span>
                  </div>
                  <span className="text-slate-700 hidden sm:inline">|</span>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Order Date
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {displayDate}
                    </span>
                  </div>

                  {order.assignedMarketingStaff && (
                    <>
                      <span className="text-slate-700 hidden sm:inline">|</span>
                      <div className="flex items-center gap-2">
                        <StaffAvatar
                          name={order.assignedMarketingStaff.name}
                          avatar={order.assignedMarketingStaff.avatar}
                          size="xs"
                        />
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-indigo-300 block font-bold">
                            মার্কেটিং ম্যানেজার
                          </span>
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{order.assignedMarketingStaff.name}</span>
                            <span className="text-slate-400 font-mono text-[10px]">({order.assignedMarketingStaff.phone})</span>
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right-side Status Badge & View Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(
                      currentStatus
                    )}`}
                  >
                    {currentStatus === "Stock Out" ? "⚠ Stock Out" : currentStatus}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedOrderId((prev) =>
                        prev === inv.orderId ? null : inv.orderId
                      )
                    }
                    className={`px-4 py-1.5 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                      isDetailsOpen
                        ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                        : "bg-primary hover:bg-primary-dark text-white"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isDetailsOpen ? "Hide Details" : "View"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(order)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Invoice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadCustomInvoicePdf(inv, "customer")}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                    title="Download PDF Invoice"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stock-Out Alert Banner with Direct Refund / Adjust Button */}
              {isOrderStockOut(order) && (
                <div className="bg-rose-50 border-b-2 border-rose-200 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 shrink-0">
                      <AlertOctagon className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-rose-900 text-xs">
                          ⚠ Products in this order are out of stock!
                        </span>
                        <span className="bg-rose-600 text-white font-mono font-bold text-[11px] px-2 py-0.5 rounded-full">
                          Refund / Adjustment Due: BDT {getStockOutRefundAmount(order).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        {order.stockOutInfo?.status === "refunded"
                          ? `✅ Refund successfully completed (TrxID: ${order.stockOutInfo.adminTrxId || "N/A"})`
                          : order.stockOutInfo?.status === "adjusted"
                          ? `✅ Balance successfully adjusted against due`
                          : order.stockOutInfo?.customerChoice === "refund"
                          ? `⏳ Cash refund request submitted (${order.stockOutInfo.customerPaymentMethod?.toUpperCase()}: ${order.stockOutInfo.customerAccountNumber}) - Verification pending`
                          : order.stockOutInfo?.customerChoice === "adjust"
                          ? `⏳ Order balance adjustment request submitted - Verification pending`
                          : `Submit a claim for Cash Refund (bKash/Nagad/Bank) or Order Balance Adjustment.`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("stockout");
                      setStockOutFilter("all");
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>View Refund / Adjust Options</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Expanded Details Drawer when Customer clicks "View" Button */}
              {isDetailsOpen && (
                <>
                  {/* Order Status Pipeline Strip (Pending -> Admin Updated Statuses) */}
                  <div className="bg-slate-50 px-4 sm:px-5 py-2.5 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                    <span className="font-bold text-slate-500 mr-1 shrink-0">Order Status:</span>
                    {[
                      "Pending",
                      "Order Confirmed",
                      "Purchased",
                      "Stock Out",
                      "Received in China Warehouse",
                      "Received in BD Warehouse",
                      "Delivered",
                    ].map((st, sIdx, arr) => {
                      const isCurrent = currentStatus === st;
                      const isStockOutStep = st === "Stock Out";
                      return (
                        <React.Fragment key={st}>
                          <span
                            className={`px-2 py-0.5 rounded font-semibold whitespace-nowrap border ${
                              isCurrent
                                ? isStockOutStep
                                  ? "bg-red-600 text-white border-red-600 font-bold"
                                  : "bg-slate-900 text-white border-slate-900 font-bold"
                                : isStockOutStep
                                ? "bg-red-50/60 text-red-400 border-red-100"
                                : "bg-white text-slate-500 border-slate-200"
                            }`}
                          >
                            {st}
                          </span>
                          {sIdx < arr.length - 1 && (
                            <span className="text-slate-300 shrink-0">→</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Main Order Body: Products + Assigned Product Shipping Rate + Complete Invoice Charges */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left 7 Columns: Ordered Products & Assigned Shipping Rate */}
                    <div className="lg:col-span-7 space-y-4">
                      {order.subOrders && order.subOrders.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <Layers className="w-4 h-4 text-primary" />
                              Individual Orders & Products by Links ({order.subOrders.length} Links)
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Order ID: {order.orderId || order.id || inv.orderId}
                            </span>
                          </div>

                          {order.subOrders.map((sub: any, sIdx: number) => {
                            const subRate = Number(sub.shippingRatePerKg || shippingRatePerKg || 780);
                            const subStatus = sub.status || currentStatus;
                            const subTracking = sub.trackingNumber || customerTrackingNo || "";
                            return (
                              <div key={sub.subOrderId || sIdx} className="border-2 border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs transition">
                                {/* Sub-Order Header Bar */}
                                <div className="bg-slate-900 text-white px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                                      Link #{sIdx + 1}
                                    </span>
                                    <div>
                                      <span className="text-[10px] uppercase text-slate-400 block leading-none">
                                        Sub-Order ID
                                      </span>
                                      <span className="font-mono font-black text-amber-300 text-sm">
                                        {sub.subOrderId}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(sub.subOrderId, sub.subOrderId)}
                                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono inline-flex items-center gap-1 transition cursor-pointer"
                                      title="Copy Sub-Order ID"
                                    >
                                      {copiedSubId === sub.subOrderId ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span className="text-emerald-400 font-bold">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3 text-slate-300" />
                                          <span>Copy ID</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeStyle(subStatus)}`}>
                                      {subStatus}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => downloadCustomInvoicePdf(buildSubOrderInvoice(order, sub.subOrderId), "customer")}
                                      className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] inline-flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span>Invoice</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Link Meta Sub-bar */}
                                <div className="bg-slate-50 px-3.5 py-1.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                                  <div className="flex items-center gap-3">
                                    <span>
                                      Total Quantity: <strong className="text-slate-900 font-mono">{sub.totalPieces} pcs</strong>
                                    </span>
                                    <span>•</span>
                                    <span className="text-indigo-700 font-mono font-bold">
                                      Assigned Shipping Rate: BDT {subRate.toLocaleString()} / KG
                                    </span>
                                  </div>
                                  {subTracking && (
                                    <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      Tracking: {subTracking}
                                    </span>
                                  )}
                                </div>

                                {/* Variations list for this link */}
                                <div className="divide-y divide-slate-100">
                                  {(sub.items || []).map((it: any, iIdx: number) => {
                                    const thumb = getSafeImageUrl(
                                      it.image || it.variantImage || sub.productImage,
                                      DEFAULT_PRODUCT_FALLBACK,
                                      it.name || it.description
                                    );
                                    const itPrice = Number(it.price || it.unitPrice || 0);
                                    const itQty = Number(it.quantity || 1);
                                    const itemPath = getProductPath(
                                      it.productId || it.offerId || it.id || it.productLink || it.importedUrl || it.sourceUrl || sub.productLink || sub.offerId || sub.subOrderId
                                    );
                                    return (
                                      <div key={iIdx} className="p-3 flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <a
                                            href={itemPath}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="relative group shrink-0 block"
                                            title="প্রোডাক্ট পেজ দেখুন / Open Product Page"
                                          >
                                            <img
                                              src={thumb}
                                              alt={it.name || it.description}
                                              className="w-12 h-12 rounded-lg border border-slate-200 object-cover shrink-0 bg-white group-hover:border-primary group-hover:scale-105 transition"
                                              referrerPolicy="no-referrer"
                                              onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK;
                                              }}
                                            />
                                            <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition">
                                              <ExternalLink className="w-3 h-3 text-white" />
                                            </span>
                                          </a>
                                          <div className="min-w-0">
                                            <a
                                              href={itemPath}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="font-bold text-slate-900 line-clamp-1 hover:text-primary hover:underline inline-flex items-center gap-1 group"
                                              title="প্রোডাক্ট পেজ দেখুন / Open Product Page"
                                            >
                                              <span>{it.name || it.description || sub.productName}</span>
                                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-primary shrink-0 transition" />
                                            </a>
                                            {(it.variantName || it.variation) && (
                                              <div className="text-[11px] text-slate-500 mt-0.5">
                                                Variation: <strong className="text-slate-700">{it.variantName || it.variation}</strong>
                                              </div>
                                            )}
                                            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                              Qty: <strong>{itQty} pcs</strong> × BDT {itPrice.toLocaleString()}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className="font-mono font-bold text-slate-900">
                                            BDT {(itPrice * itQty).toLocaleString()}
                                          </div>
                                          <span className="text-[10px] text-slate-400 font-mono block">
                                            {sub.subOrderId}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Link Subtotal Footer */}
                                <div className="bg-slate-50/80 px-3.5 py-2 border-t border-slate-200 flex justify-between items-center text-xs">
                                  <span className="text-slate-600 font-medium">
                                    Subtotal for {sub.subOrderId} ({sub.totalPieces} pcs):
                                  </span>
                                  <span className="font-mono font-black text-slate-900 text-sm">
                                    BDT {Number(sub.subtotal || 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
                            <span>Ordered Products ({inv.totalProductQty} pcs)</span>
                            <span className="text-indigo-700 font-mono">
                              Assigned Shipping Rate: BDT {shippingRatePerKg.toLocaleString()} / KG
                            </span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {inv.items.map((it, iIdx) => {
                              const thumb = getSafeImageUrl(
                                it.image,
                                DEFAULT_PRODUCT_FALLBACK,
                                it.description
                              );
                              const itemShippingRate = Math.round(
                                Number((it as any).shippingRatePerKg || shippingRatePerKg || 780)
                              );
                              const singleItemPath = getProductPath(
                                (it as any).productId || (it as any).offerId || (it as any).id || (it as any).productLink || (it as any).importedUrl || it.description
                              );
                              return (
                                <div
                                  key={iIdx}
                                  className="p-3 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <a
                                      href={singleItemPath}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="relative group shrink-0 block"
                                      title="প্রোডাক্ট পেজ দেখুন / Open Product Page"
                                    >
                                      <img
                                        src={thumb}
                                        alt={it.description}
                                        className="w-12 h-12 rounded-lg border border-slate-200 object-cover shrink-0 bg-white group-hover:border-primary group-hover:scale-105 transition"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src =
                                            DEFAULT_PRODUCT_FALLBACK;
                                        }}
                                      />
                                      <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition">
                                        <ExternalLink className="w-3 h-3 text-white" />
                                      </span>
                                    </a>
                                    <div className="min-w-0">
                                      <a
                                        href={singleItemPath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-slate-900 line-clamp-1 hover:text-primary hover:underline inline-flex items-center gap-1 group"
                                        title="প্রোডাক্ট পেজ দেখুন / Open Product Page"
                                      >
                                        <span>{it.description}</span>
                                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-primary shrink-0 transition" />
                                      </a>
                                      {it.variation && (
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                          Variation: <strong className="text-slate-700">{it.variation}</strong>
                                        </div>
                                      )}
                                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                        Qty: <strong>{it.quantity} pcs</strong> × BDT{" "}
                                        {Number(it.unitPrice || 0).toLocaleString()}
                                      </div>
                                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-mono font-bold">
                                        <Truck className="w-3 h-3" />
                                        <span>
                                          Assigned Product Shipping Charge: BDT {itemShippingRate.toLocaleString()} / KG
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="font-mono font-bold text-slate-900 whitespace-nowrap">
                                    BDT {Number(it.totalPrice || 0).toLocaleString()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Customer & Delivery Details for this Order */}
                      <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Customer Name & Phone
                          </span>
                          <div className="font-bold text-slate-900 mt-0.5">
                            {order.customerInfo?.name || inv.customerName}
                          </div>
                          <div className="font-mono text-slate-600">
                            {order.customerInfo?.phone || inv.phone}
                          </div>
                          {(order.customerInfo?.email || inv.email) && (
                            <div className="text-slate-500 text-[11px]">
                              {order.customerInfo?.email || inv.email}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Shipping Address
                          </span>
                          <div className="font-medium text-slate-800 mt-0.5">
                            {order.customerInfo?.address || inv.address}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Division: {order.customerInfo?.division || inv.district || "Dhaka"}
                            {order.customerInfo?.postalCode
                              ? ` • Post Code: ${order.customerInfo.postalCode}`
                              : ""}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right 5 Columns: Complete Financial & Logistics Charges Breakdown */}
                    <div className="lg:col-span-5 bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col justify-between text-xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                            Order Payment & Logistics Breakdown
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Weight: {hasAdminUploadedCharges ? `${weightNum} KG` : "Pending"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1 px-2.5 rounded bg-blue-50/70 border border-blue-200 text-blue-900">
                          <span className="font-semibold">Tracking Number:</span>
                          <span className="font-mono font-bold">
                            {customerTrackingNo || "Pending Upload"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1 px-2.5 rounded bg-indigo-50/70 border border-indigo-200 text-indigo-900">
                          <span className="font-semibold">Assigned Shipping Charge Rate:</span>
                          <span className="font-mono font-bold">
                            BDT {shippingRatePerKg.toLocaleString()} / KG
                          </span>
                        </div>

                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>Product Price (100% Upfront):</span>
                          <span className="font-mono font-bold text-slate-900">
                            BDT {productPrice.toLocaleString()}
                          </span>
                        </div>

                        {discount > 0 && (
                          <div className="flex justify-between py-0.5 text-emerald-700">
                            <span>Discount:</span>
                            <span className="font-mono font-bold">
                              - BDT {discount.toLocaleString()}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center py-1 px-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                          <span className="font-semibold">Partial Paid (Customer Paid):</span>
                          <span className="font-mono font-bold">
                            - BDT {paidAmount.toLocaleString()}
                          </span>
                        </div>

                        <div className="border-t border-slate-200 pt-1.5 mt-1 space-y-1.5">
                          <div className="flex justify-between py-0.5 text-slate-700">
                            <span>Product Weight:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {hasAdminUploadedCharges ? `${weightNum} KG` : "Not uploaded yet (0 KG)"}
                            </span>
                          </div>

                          <div className="flex justify-between py-0.5 text-slate-700">
                            <span>
                              Shipping Charge ({weightNum} KG × BDT {shippingRatePerKg}):
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {hasAdminUploadedCharges
                                ? `+ BDT ${shippingCharge.toLocaleString()}`
                                : "Not uploaded yet (BDT 0)"}
                            </span>
                          </div>

                          <div className="flex justify-between py-0.5 text-slate-700">
                            <span>China Courier Charge:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {hasAdminUploadedCharges
                                ? `+ BDT ${chinaCourier.toLocaleString()}`
                                : "Not uploaded yet (BDT 0)"}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-[11px] text-slate-500">
                          <span>Total Bill (Product + Shipping + Courier):</span>
                          <span className="font-mono font-bold text-slate-800">
                            BDT {grandTotal.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-900 text-white shadow-2xs">
                          <div>
                            <span className="font-bold block text-xs">Final Invoice Payable:</span>
                            <span className="text-[10px] text-slate-300 block">
                              (Weight × Shipping Rate + China Courier - Partial Paid)
                            </span>
                          </div>
                          <span className="font-mono font-black text-sm text-amber-300">
                            BDT {dueAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Payment:{" "}
                          <strong className="text-slate-800 uppercase">
                            {order.paymentMethod || inv.paymentMethod || "Online"}
                          </strong>{" "}
                          ({inv.paymentStatus})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(order)}
                          className="text-primary font-bold hover:underline cursor-pointer"
                        >
                          Open Printable Invoice →
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500 text-sm">
        Loading your account...
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-100px)] pb-16">
      {/* Top Banner (Header Area) — Shows ONLY Logged-In Customer's Own Details */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="py-6 flex flex-col md:flex-row justify-between items-center gap-6">
            {/* User Info Left */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-16 h-16 bg-slate-900 text-white text-2xl font-bold rounded-xl flex items-center justify-center shrink-0">
                {(customerProfile.name || user?.email || "C").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-lg text-slate-900">
                    {customerProfile.name || "Customer"}
                  </h2>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified Account
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 mb-2.5">
                  <span className="flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                    {customerProfile.phone || "Phone not set"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {customerProfile.email || "Email not set"}
                  </span>
                  {customerProfile.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {customerProfile.address} ({customerProfile.division})
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {stockOutCount > 0 && (
                    <button
                      onClick={() => setActiveTab("stockout")}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs animate-pulse"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Stock-Out Refunds & Adjustments ({stockOutCount})
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" />
                    My Orders ({orders.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Edit My Details
                  </button>
                </div>
              </div>
            </div>

            {/* Nav Icons Right */}
            <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <div className="flex flex-nowrap justify-start md:justify-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 min-w-max">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex flex-col items-center justify-center min-w-[76px] px-2 h-[66px] rounded-lg transition cursor-pointer ${
                      activeTab === item.id
                        ? "bg-white shadow-2xs border border-slate-200/80 text-primary font-bold"
                        : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                    }`}
                  >
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="absolute top-1 right-1.5 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                        {item.badge}
                      </span>
                    )}
                    <item.icon className="w-5 h-5 mb-1.5 stroke-[1.75px]" />
                    <span className="text-[10px] font-semibold leading-none text-center truncate max-w-full">
                      {item.label}
                    </span>
                  </button>
                ))}
                <button
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                  className="flex flex-col items-center justify-center w-[72px] h-[66px] rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                >
                  <LogOut className="w-5 h-5 mb-1.5 stroke-[1.75px]" />
                  <span className="text-[10px] font-semibold leading-none">
                    Logout
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-7xl mt-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Top Stock-Out Alert Banner if any orders are stock out */}
            {stockOutOrders.length > 0 && (
              <div className="bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 rounded-2xl p-0.5 shadow-md">
                <div className="bg-white rounded-[14px] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                      <AlertOctagon className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Stock-Out Alert
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          Products out-of-stock in {stockOutOrders.length} order(s)
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                        Total Refund / Adjustment Due: <span className="text-rose-600 font-mono">BDT {totalStockOutRefundAmount.toLocaleString()} BDT</span>
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Items are out of stock at supplier. You can claim a full cash refund (bKash/Nagad/Bank) or adjust against pending invoice dues.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => setActiveTab("stockout")}
                      className="w-full md:w-auto bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <span>Claim Refund or Adjust</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Marketing & Key Account Manager for this Customer */}
            {renderDedicatedAccountManagerBanner()}

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Order Placed / Pending
                </span>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
                  {waitingCount}
                </div>
                <span className="text-[11px] text-amber-600 font-medium mt-1">
                  Awaiting confirmation
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Purchased & In Transit
                </span>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
                  {processingCount}
                </div>
                <span className="text-[11px] text-blue-600 font-medium mt-1">
                  Active shipments
                </span>
              </div>

              <div 
                onClick={() => setActiveTab("stockout")}
                className="bg-white p-4 rounded-xl border border-red-200 hover:border-red-400 hover:shadow-sm cursor-pointer transition flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Stock Out
                  </span>
                  {stockOutCount > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                      Action Needed
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-red-600 font-mono mt-2">
                  {stockOutCount}
                </div>
                <span className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1 group-hover:underline">
                  View Refund / Adjust →
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Delivered Orders
                </span>
                <div className="text-2xl font-bold text-emerald-700 font-mono mt-2">
                  {deliveredCount}
                </div>
                <span className="text-[11px] text-emerald-600 font-medium mt-1">
                  Completed deliveries
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between col-span-2 lg:col-span-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">
                    Import Support
                  </span>
                  <a
                    href="tel:+8801355136661"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg transition"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Hotline: +880 1355-136661 (10 AM - 8 PM) for order & invoice help.
                </p>
              </div>
            </div>

            {/* Registered Customer Profile Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      My Registered Account Details
                    </h3>
                    <p className="text-xs text-slate-500">
                      These details are verified and automatically applied to your direct imports and parcel shipments.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl border border-blue-200 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit My Details</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Full Name */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Customer Name
                    </span>
                    <strong className="text-sm font-bold text-slate-900 block truncate">
                      {customerProfile.name || "Customer"}
                    </strong>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium mt-2 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verified Account Owner
                  </span>
                </div>

                {/* Mobile Phone Number */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Registered Phone
                    </span>
                    <strong className="text-sm font-bold text-slate-900 font-mono block truncate">
                      {customerProfile.phone || user?.phoneNumber || "Phone not set"}
                    </strong>
                  </div>
                  <span className="text-[10px] text-cyan-600 font-medium mt-2 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" /> 1 Number = 1 Account
                  </span>
                </div>

                {/* Email Address */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Email Address
                    </span>
                    <strong className="text-sm font-bold text-slate-900 block truncate">
                      {customerProfile.email || "No email specified"}
                    </strong>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 block">
                    Order confirmation & receipts
                  </span>
                </div>

                {/* Delivery Address */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Delivery Address
                    </span>
                    <strong className="text-sm font-bold text-slate-900 block truncate">
                      {customerProfile.address || "Address not specified"}
                    </strong>
                  </div>
                  <span className="text-[10px] text-slate-600 mt-2 block">
                    {customerProfile.division} {customerProfile.postalCode ? `(Zip: ${customerProfile.postalCode})` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Orders & Complete Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> My Orders & Invoices ({orders.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing only your personal orders, complete product details, courier bills, parcel weight, shipping charges, and invoices.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  View All My Orders ({orders.length})
                </button>
              </div>

              {renderOrderCards(orders.slice(0, 5))}
            </div>
          </div>
        )}

        {/* Orders & Old Orders Tab */}
        {(activeTab === "orders" || activeTab === "old_orders") && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  My Orders & Complete Invoice Breakdown
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track your Order status (Order Placed → Order Confirmed → Purchased → Stock Out / Warehouse → Delivered) and download official invoices.
                </p>
              </div>
              <div className="text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 px-3.5 py-2 rounded-lg">
                Total Orders: {orders.length}
              </div>
            </div>

            {/* Dedicated Marketing & Account Manager banner for fast customer support */}
            {renderDedicatedAccountManagerBanner()}

            {renderOrderCards(orders)}
          </div>
        )}

        {/* My Profile / Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              My Personal & Delivery Details
            </h2>
            <p className="text-xs text-slate-500 mb-5 pb-3 border-b border-slate-100">
              Your personal information is strictly private to your account and automatically used for your orders and invoices.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerProfile.name}
                    onChange={(e) =>
                      setCustomerProfile((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerProfile.phone}
                    onChange={(e) =>
                      setCustomerProfile((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customerProfile.email}
                    onChange={(e) =>
                      setCustomerProfile((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Detailed Delivery Address
                  </label>
                  <textarea
                    rows={2}
                    value={customerProfile.address}
                    onChange={(e) =>
                      setCustomerProfile((prev) => ({ ...prev, address: e.target.value }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Division
                  </label>
                  <select
                    value={customerProfile.division}
                    onChange={(e) =>
                      setCustomerProfile((prev) => ({ ...prev, division: e.target.value }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:border-primary focus:outline-none"
                  >
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chattogram">Chattogram</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Barishal">Barishal</option>
                    <option value="Rangpur">Rangpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={customerProfile.postalCode}
                    onChange={(e) =>
                      setCustomerProfile((prev) => ({
                        ...prev,
                        postalCode: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-lg transition cursor-pointer"
                >
                  Save My Details
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stock-Out & Refund / Adjustment Hub Tab */}
        {activeTab === "stockout" && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 border border-rose-900/40 shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold mb-3">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Direct Refund & Balance Adjustment System</span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                  Stock-Out Claims & Refund Resolution Center
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
                  If any item is out-of-stock from supplier, you can claim a 100% <strong>Cash Refund (bKash/Nagad/Bank)</strong> or <strong>Adjust with Order Balance</strong>.
                </p>
              </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Stock-Out Orders</span>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                  {stockOutOrders.length}
                </div>
                <span className="text-[11px] text-slate-400">Total Affected Orders</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20">
                <span className="text-xs font-semibold text-rose-700">Total Refundable Amount</span>
                <div className="text-2xl font-black text-rose-600 font-mono mt-1">
                  BDT {totalStockOutRefundAmount.toLocaleString()}
                </div>
                <span className="text-[11px] text-rose-500 font-medium">Eligible for full refund or adjust</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20">
                <span className="text-xs font-semibold text-amber-700">Action Needed</span>
                <div className="text-2xl font-bold text-amber-600 font-mono mt-1">
                  {stockOutNeedsActionCount}
                </div>
                <span className="text-[11px] text-amber-600 font-medium">Selection Pending</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20">
                <span className="text-xs font-semibold text-emerald-700">Resolved Claims</span>
                <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
                  {stockOutOrders.filter((o) => o.stockOutInfo?.status === "refunded" || o.stockOutInfo?.status === "adjusted").length}
                </div>
                <span className="text-[11px] text-emerald-600 font-medium">Paid or Adjusted</span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 mr-1 pl-1">Filter:</span>
              <button
                type="button"
                onClick={() => setStockOutFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  stockOutFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Stock-Out ({stockOutOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setStockOutFilter("action_needed")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  stockOutFilter === "action_needed"
                    ? "bg-rose-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Action Needed ({stockOutNeedsActionCount})
              </button>
              <button
                type="button"
                onClick={() => setStockOutFilter("pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  stockOutFilter === "pending"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Pending Verification ({stockOutOrders.filter((o) => o.stockOutInfo?.status === "requested").length})
              </button>
              <button
                type="button"
                onClick={() => setStockOutFilter("completed")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  stockOutFilter === "completed"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Resolved ({stockOutOrders.filter((o) => o.stockOutInfo?.status === "refunded" || o.stockOutInfo?.status === "adjusted").length})
              </button>
            </div>

            {/* Stock-Out Orders Listing */}
            {stockOutOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  You have no stock-out products currently!
                </h3>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                  All your orders are processing smoothly. If any item is out of stock at the factory, you will immediately see a notification here and can claim a refund.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Package className="w-4 h-4" />
                    <span>View My Orders</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {stockOutOrders
                  .filter((order) => {
                    if (stockOutFilter === "action_needed") return !order.stockOutInfo?.customerChoice;
                    if (stockOutFilter === "pending") return order.stockOutInfo?.status === "requested";
                    if (stockOutFilter === "completed") {
                      return order.stockOutInfo?.status === "refunded" || order.stockOutInfo?.status === "adjusted";
                    }
                    return true;
                  })
                  .map((order) => {
                    const canonicalId = String(order.mainOrderId || order.orderId || order.id);
                    const form = getFormForOrder(order);
                    const refundAmt = getStockOutRefundAmount(order);
                    const hasSubmitted = Boolean(order.stockOutInfo?.customerChoice) && !form.isEditing;
                    const stockOutStatus = order.stockOutInfo?.status || "pending_customer_choice";

                    return (
                      <div
                        key={canonicalId}
                        className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden shadow-xs transition"
                      >
                        {/* Order Header Strip */}
                        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-amber-300 text-sm">
                              Order #{canonicalId}
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-300">
                              {formatOrderTableDate(order.date || order.createdAt, "Recent")}
                            </span>
                            {order.subOrders && order.subOrders.length > 0 && (
                              <span className="text-slate-400">
                                ({order.subOrders.length} sub-orders / links)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Status Badge */}
                            {stockOutStatus === "refunded" ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ✅ Refund Completed
                              </span>
                            ) : stockOutStatus === "adjusted" ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                ✅ Balance Adjusted
                              </span>
                            ) : order.stockOutInfo?.customerChoice ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                ⏳ Verification Pending ({order.stockOutInfo.customerChoice === "refund" ? "Refund" : "Adjustment"})
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                                ⚠ Claim Refund / Adjust (Action Needed)
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(order)}
                              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Invoice</span>
                            </button>
                          </div>
                        </div>

                        {/* Order Body */}
                        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                          {/* Left: Product Info & Refund Amount */}
                          <div className="lg:col-span-6 space-y-4">
                            <div>
                              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                                Stock-Out Products & Details
                              </span>
                              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden">
                                {(order.items || []).map((it: any, iIdx: number) => {
                                  const thumb = getSafeImageUrl(
                                    it.image || it.variantImage,
                                    DEFAULT_PRODUCT_FALLBACK,
                                    it.name || it.description
                                  );
                                  const itPrice = Number(it.price || it.unitPrice || 0);
                                  const itQty = Number(it.quantity || 1);
                                  const itPath = getProductPath(
                                    it.productId || it.offerId || it.id || it.productLink || it.importedUrl || it.sourceUrl || it.name
                                  );
                                  return (
                                    <div key={iIdx} className="p-3 flex items-center justify-between gap-3 text-xs">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <a
                                          href={itPath}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="relative group shrink-0 block"
                                          title="প্রোডাক্ট পেজ দেখুন / Open Product Page"
                                        >
                                          <img
                                            src={thumb}
                                            alt={it.name || it.description}
                                            className="w-12 h-12 rounded-lg border border-slate-200 object-cover bg-white shrink-0 group-hover:border-primary group-hover:scale-105 transition"
                                            onError={(e) => {
                                              (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK;
                                            }}
                                          />
                                          <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition">
                                            <ExternalLink className="w-3 h-3 text-white" />
                                          </span>
                                        </a>
                                        <div className="min-w-0">
                                          <a
                                            href={itPath}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-slate-900 line-clamp-1 hover:text-primary hover:underline inline-flex items-center gap-1 group"
                                            title="প্রোডাক্ট পেজ দেখুন / Open Product Page"
                                          >
                                            <span>{it.name || it.description || "Product"}</span>
                                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-primary shrink-0 transition" />
                                          </a>
                                          {(it.variantName || it.variation) && (
                                            <div className="text-[11px] text-slate-500 mt-0.5">
                                              Variation: <strong className="text-slate-700">{it.variantName || it.variation}</strong>
                                            </div>
                                          )}
                                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                            Quantity: <strong>{itQty} pcs</strong> × BDT {itPrice.toLocaleString()}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 block mb-1">
                                          Stock Out
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 text-xs">
                                          BDT {(itPrice * itQty).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Refundable Amount Display Box */}
                            <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-rose-200 rounded-xl p-4 sm:p-5 text-slate-900">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs uppercase tracking-wider font-bold text-rose-700">
                                  Total Refund / Adjustment Due:
                                </span>
                                <span className="text-[11px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                                  100% Guaranteed
                                </span>
                              </div>
                              <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono mt-1">
                                BDT {refundAmt.toLocaleString()}
                              </div>
                              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                                This amount will be refunded directly to your preferred payment method or adjusted against your order balance.
                              </p>
                            </div>
                          </div>

                          {/* Right: Request Options & Submission / Status */}
                          <div className="lg:col-span-6 bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 flex flex-col justify-between">
                            {!hasSubmitted ? (
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span>Choose your preferred settlement method:</span>
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Select your preference and submit your request
                                  </p>
                                </div>

                                {/* 2 Choice Options */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Option 1: Cash Refund */}
                                  <div
                                    onClick={() => updateFormForOrder(canonicalId, { choice: "refund" })}
                                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                                      form.choice === "refund"
                                        ? "border-rose-600 bg-rose-50/60 shadow-xs"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="radio"
                                        name={`choice-${canonicalId}`}
                                        checked={form.choice === "refund"}
                                        onChange={() => updateFormForOrder(canonicalId, { choice: "refund" })}
                                        className="mt-0.5 text-rose-600 focus:ring-rose-600 cursor-pointer"
                                      />
                                      <div>
                                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                                          <Banknote className="w-3.5 h-3.5 text-rose-600" />
                                          <span>1. Cash Refund</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                          Receive full refund directly into your bKash, Nagad, Rocket or Bank account.
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded mt-2 self-start">
                                      Cash Refund
                                    </span>
                                  </div>

                                  {/* Option 2: Order Balance Adjustment */}
                                  <div
                                    onClick={() => updateFormForOrder(canonicalId, { choice: "adjust" })}
                                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                                      form.choice === "adjust"
                                        ? "border-indigo-600 bg-indigo-50/60 shadow-xs"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="radio"
                                        name={`choice-${canonicalId}`}
                                        checked={form.choice === "adjust"}
                                        onChange={() => updateFormForOrder(canonicalId, { choice: "adjust" })}
                                        className="mt-0.5 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                      />
                                      <div>
                                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                                          <Scale className="w-3.5 h-3.5 text-indigo-600" />
                                          <span>2. Adjust Balance</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                          Adjust this amount against remaining shipping/order balance or future orders.
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded mt-2 self-start">
                                      Adjust Balance
                                    </span>
                                  </div>
                                </div>

                                {/* Conditional Sub-form */}
                                {form.choice === "refund" ? (
                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                        Select refund payment method:
                                      </label>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                          { id: "bkash", label: "bKash" },
                                          { id: "nagad", label: "Nagad" },
                                          { id: "rocket", label: "Rocket" },
                                          { id: "bank", label: "Bank Transfer" },
                                        ].map((m) => (
                                          <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => updateFormForOrder(canonicalId, { paymentMethod: m.id })}
                                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                                              form.paymentMethod === m.id
                                                ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                          >
                                            {m.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        {form.paymentMethod === "bank" ? "Bank Account Number:" : "Mobile Number:"}
                                      </label>
                                      <input
                                        type="text"
                                        value={form.accountNumber}
                                        onChange={(e) => updateFormForOrder(canonicalId, { accountNumber: e.target.value })}
                                        placeholder={form.paymentMethod === "bank" ? "Account No..." : "01XXXXXXXXX"}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-rose-600 outline-none"
                                      />
                                    </div>

                                    {form.paymentMethod !== "bank" ? (
                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                          Account Type:
                                        </label>
                                        <div className="flex gap-2">
                                          {[
                                            { id: "personal", label: "Personal" },
                                            { id: "agent", label: "Agent" },
                                            { id: "bank_acc", label: "Merchant" },
                                          ].map((t) => (
                                            <label key={t.id} className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                              <input
                                                type="radio"
                                                name={`accType-${canonicalId}`}
                                                checked={form.accountType === t.id}
                                                onChange={() => updateFormForOrder(canonicalId, { accountType: t.id })}
                                                className="text-rose-600 focus:ring-rose-600"
                                              />
                                              <span>{t.label}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                          Bank Name, Branch & Account Holder Name:
                                        </label>
                                        <input
                                          type="text"
                                          value={form.bankDetails}
                                          onChange={(e) => updateFormForOrder(canonicalId, { bankDetails: e.target.value })}
                                          placeholder="e.g. DBBL, Mirpur Branch, Name: John Doe"
                                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-rose-600 outline-none"
                                        />
                                      </div>
                                    )}

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Additional Note (Optional):
                                      </label>
                                      <input
                                        type="text"
                                        value={form.note}
                                        onChange={(e) => updateFormForOrder(canonicalId, { note: e.target.value })}
                                        placeholder="Any special instructions or details..."
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-rose-600 outline-none"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-white p-4 rounded-xl border border-indigo-200 space-y-3">
                                    <div className="flex items-start gap-2.5">
                                      <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                      <div className="text-xs text-slate-700 leading-relaxed">
                                        <strong className="text-slate-900 block font-bold mb-0.5">
                                          How Balance Adjustment Works:
                                        </strong>
                                        This amount of BDT {refundAmt.toLocaleString()} will be deducted from your remaining order dues or courier charges, or adjusted against future orders.
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Adjustment Note (Optional):
                                      </label>
                                      <input
                                        type="text"
                                        value={form.note}
                                        onChange={(e) => updateFormForOrder(canonicalId, { note: e.target.value })}
                                        placeholder="e.g., Please adjust with remaining courier / shipping dues..."
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:bg-white focus:border-indigo-600 outline-none"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="pt-2 flex items-center justify-between gap-3">
                                  {form.isEditing && (
                                    <button
                                      type="button"
                                      onClick={() => updateFormForOrder(canonicalId, { isEditing: false })}
                                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={form.submitting}
                                    onClick={() => handleStockOutSubmit(order)}
                                    className={`flex-1 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                                      form.submitting ? "opacity-60 cursor-not-allowed" : ""
                                    }`}
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>
                                      {form.submitting
                                        ? "Submitting claim..."
                                        : form.choice === "refund"
                                        ? "Submit Refund Claim"
                                        : "Submit Adjustment Claim"}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Already submitted state */
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>Your Submitted Claim Details:</span>
                                  </h4>
                                  {stockOutStatus !== "refunded" && stockOutStatus !== "adjusted" && (
                                    <button
                                      type="button"
                                      onClick={() => updateFormForOrder(canonicalId, { isEditing: true })}
                                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                                    >
                                      Change / Edit
                                    </button>
                                  )}
                                </div>

                                <div className="bg-white rounded-xl p-4 border border-slate-200 text-xs space-y-2.5">
                                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Selected Settlement:</span>
                                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                      {order.stockOutInfo?.customerChoice === "refund"
                                        ? "💳 Cash Refund"
                                        : "⚖️ Order Balance Adjustment"}
                                    </span>
                                  </div>

                                  {order.stockOutInfo?.customerChoice === "refund" && (
                                    <>
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Payment Method:</span>
                                        <span className="font-bold text-rose-600 uppercase font-mono">
                                          {order.stockOutInfo?.customerPaymentMethod || "bKash"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Account / Mobile Number:</span>
                                        <span className="font-mono font-bold text-slate-900">
                                          {order.stockOutInfo?.customerAccountNumber || "N/A"}
                                        </span>
                                      </div>
                                      {order.stockOutInfo?.customerAccountType && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-500">Account Type:</span>
                                          <span className="font-semibold text-slate-700 capitalize">
                                            {order.stockOutInfo.customerAccountType}
                                          </span>
                                        </div>
                                      )}
                                      {order.stockOutInfo?.customerBankDetails && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-500">Bank Details:</span>
                                          <span className="font-semibold text-slate-700">
                                            {order.stockOutInfo.customerBankDetails}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {order.stockOutInfo?.customerNote && (
                                    <div className="border-t border-slate-100 pt-2">
                                      <span className="text-slate-500 block mb-0.5">Your Note:</span>
                                      <p className="text-slate-700 italic bg-slate-50 p-2 rounded">
                                        "{order.stockOutInfo.customerNote}"
                                      </p>
                                    </div>
                                  )}

                                  <div className="text-[11px] text-slate-400 font-mono border-t border-slate-100 pt-2">
                                    Claim Submitted At: {new Date(order.stockOutInfo?.requestedAt || order.date).toLocaleString()}
                                  </div>
                                </div>

                                {/* Status Progress Card */}
                                {stockOutStatus === "refunded" ? (
                                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 text-xs space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span>Refund Successfully Completed!</span>
                                    </div>
                                    <p className="text-slate-700">
                                      A total of <strong>BDT {refundAmt.toLocaleString()}</strong> has been sent to your account.
                                    </p>
                                    {order.stockOutInfo?.adminTrxId && (
                                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-emerald-200">
                                        <span className="text-slate-500 font-medium">TrxID:</span>
                                        <span className="font-mono font-bold text-emerald-700 text-sm select-all">
                                          {order.stockOutInfo.adminTrxId}
                                        </span>
                                      </div>
                                    )}
                                    {order.stockOutInfo?.adminActionNote && (
                                      <div className="text-[11px] text-slate-600">
                                        Admin Note: <em>{order.stockOutInfo.adminActionNote}</em>
                                      </div>
                                    )}
                                    {order.stockOutInfo?.refundMessage && (
                                      <div className="bg-white p-3 rounded-lg border border-emerald-300 mt-2 text-xs space-y-1">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                          <span className="flex items-center gap-1 text-emerald-800">
                                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Saved Refund Confirmation Message:</span>
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyText(order.stockOutInfo.refundMessage, `cust-msg-${canonicalId}`)}
                                            className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-bold"
                                          >
                                            {copiedSubId === `cust-msg-${canonicalId}` ? (
                                              <>
                                                <Check className="w-3 h-3 text-emerald-600" />
                                                <span>Copied!</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3 h-3" />
                                                <span>Copy Message</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                        <p className="text-slate-800 italic bg-slate-50 p-2 rounded text-[11px] leading-relaxed">
                                          "{order.stockOutInfo.refundMessage}"
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : stockOutStatus === "adjusted" ? (
                                  <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4 text-xs space-y-2">
                                    <div className="flex items-center gap-2 text-indigo-800 font-bold">
                                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                      <span>Balance Successfully Adjusted!</span>
                                    </div>
                                    <p className="text-slate-700 leading-relaxed">
                                      A total of <strong>BDT {refundAmt.toLocaleString()}</strong> has been deducted and adjusted against your invoice due balance.
                                    </p>
                                    {order.stockOutInfo?.adminActionNote && (
                                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-indigo-200">
                                        Admin Note: <em>{order.stockOutInfo.adminActionNote}</em>
                                      </div>
                                    )}
                                    {order.stockOutInfo?.refundMessage && (
                                      <div className="bg-white p-3 rounded-lg border border-indigo-300 mt-2 text-xs space-y-1">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                          <span className="flex items-center gap-1 text-indigo-800">
                                            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Saved Adjustment Confirmation Message:</span>
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyText(order.stockOutInfo.refundMessage, `cust-msg-${canonicalId}`)}
                                            className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-bold"
                                          >
                                            {copiedSubId === `cust-msg-${canonicalId}` ? (
                                              <>
                                                <Check className="w-3 h-3 text-emerald-600" />
                                                <span>Copied!</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3 h-3" />
                                                <span>Copy Message</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                        <p className="text-slate-800 italic bg-slate-50 p-2 rounded text-[11px] leading-relaxed">
                                          "{order.stockOutInfo.refundMessage}"
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-xs space-y-2">
                                    <div className="flex items-center gap-2 text-amber-800 font-bold">
                                      <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                                      <span>Admin Verification Pending</span>
                                    </div>
                                    <p className="text-slate-700 leading-relaxed">
                                      Your claim has been received by our admin team. Our accounts team will verify and send your cash refund or adjust against dues shortly.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Dedicated Saved Stock-Out Refund & Message History Section */}
            {refundLogs.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-emerald-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      <span>Saved Stock-Out Refund & Message History</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      All previously completed stock-out product refunds, amounts, and confirmation records.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit">
                    Total Records: {refundLogs.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {refundLogs.map((rec) => {
                    const isAdjusted = rec.action === "adjusted";
                    return (
                      <div
                        key={rec.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {(() => {
                            const recPath = getProductPath(rec.productId || rec.offerId || rec.id || rec.productName);
                            return (
                              <a
                                href={recPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative group shrink-0 block"
                                title="প্রোডাক্ট পেজ দেখুন / Open Product Page"
                              >
                                <img
                                  src={rec.productImage || DEFAULT_PRODUCT_FALLBACK}
                                  alt={rec.productName}
                                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 bg-white shrink-0 group-hover:border-primary group-hover:scale-105 transition"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK;
                                  }}
                                />
                                <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition">
                                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                                </span>
                              </a>
                            );
                          })()}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-slate-900">
                                Order #{rec.orderId}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isAdjusted ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {isAdjusted ? "Balance Adjusted" : "Direct Refund Completed"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(rec.createdAt).toLocaleDateString("bn-BD")}
                              </span>
                            </div>

                            <a
                              href={getProductPath(rec.productId || rec.offerId || rec.id || rec.productName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-slate-800 line-clamp-1 hover:text-primary hover:underline inline-flex items-center gap-1 group"
                              title="প্রোডাক্ট পেজ দেখুন / Open Product Page"
                            >
                              <span>{rec.productName}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-primary shrink-0 transition" />
                            </a>
                            {rec.variantName && (
                              <div className="text-[11px] text-slate-500">
                                Variant: <strong className="text-slate-700">{rec.variantName}</strong>
                              </div>
                            )}

                            {/* Saved Message box */}
                            {rec.refundMessage && (
                              <div className="bg-white p-2.5 rounded border border-slate-200 text-slate-700 mt-2 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                  <span>Saved Confirmation Message:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(rec.refundMessage, `cust-log-${rec.id}`)}
                                    className="text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                                  >
                                    {copiedSubId === `cust-log-${rec.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    <span>Copy</span>
                                  </button>
                                </div>
                                <p className="italic text-[11px] leading-relaxed">
                                  "{rec.refundMessage}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Amount & TrxID pill */}
                        <div className="md:text-right shrink-0 bg-white md:bg-transparent p-3 md:p-0 rounded-lg border md:border-0 border-slate-200 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Refund Amount:</span>
                          <div className="text-lg font-black text-emerald-600 font-mono">
                            BDT {Number(rec.refundAmount || 0).toLocaleString()}
                          </div>
                          <div className="text-slate-600 text-[11px] font-semibold">
                            {rec.paymentMethod}
                          </div>
                          {rec.trxId && (
                            <div className="font-mono text-[11px] text-slate-500">
                              TrxID: <strong className="text-slate-800">{rec.trxId}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === "wishlist" && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 min-h-[360px]">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                My Wishlist ({wishlist.length})
              </h2>
              <Link
                to="/shop"
                className="text-xs text-primary font-bold hover:underline"
              >
                Continue Shopping →
              </Link>
            </div>

            {wishlist.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Heart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Your wishlist is empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlist.map((item) => (
                  <div
                    key={item.id}
                    className="border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between relative bg-white"
                  >
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-2.5 right-2.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <Link
                        to={getProductPath(item)}
                        className="block aspect-square overflow-hidden rounded-lg bg-slate-50 mb-3 p-3 group"
                      >
                        <img
                          src={getSafeImageUrl(item.image, DEFAULT_PRODUCT_FALLBACK, item.name)}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain group-hover:scale-105 transition"
                        />
                      </Link>
                      <Link to={getProductPath(item)}>
                        <h4 className="font-semibold text-slate-900 text-xs line-clamp-2 hover:text-primary">
                          {item.name}
                        </h4>
                      </Link>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        BDT {Number(item.price || 0).toLocaleString()}
                      </span>
                      <button
                        onClick={() => {
                          addToCart(item);
                          showToast("Added to cart!");
                        }}
                        className="bg-primary hover:bg-primary-dark text-white p-2 rounded-lg transition cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceModal
          order={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
