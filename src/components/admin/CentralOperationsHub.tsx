import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Users,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Package,
  Building2,
  Anchor,
  Boxes,
  AlertTriangle,
  FileText,
  Truck,
  XCircle,
  DollarSign,
  Shield,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  MessageSquare,
  ShoppingCart,
  Heart,
  Flame,
  Printer,
  Plus,
  Filter,
  Calendar,
  UserCheck,
  RefreshCw,
  Lock,
  Check,
  ArrowRight,
  Target
} from "lucide-react";
import UnifiedOrderModal from "./UnifiedOrderModal";
import AdminTopNavSubViews, { SubNavTab } from "./AdminTopNavSubViews";
import CustomerProfileModal from "./CustomerProfileModal";
import OrderProductInfoModal from "./OrderProductInfoModal";
import CSOrderAnalyticsChart from "./CSOrderAnalyticsChart";
import MarketingTargetCustomerTiers from "./MarketingTargetCustomerTiers";
import CustomerPhoneSecureDisplay from "./CustomerPhoneSecureDisplay";
import { canViewCustomerPhone } from "../../utils/customerPrivacy";
import { canAccessProductSourceLink } from "../../utils/productPrivacy";
import { getProductPath } from "../../utils/productUrl";

export type RBACDepartment =
  | "Admin"
  | "CS"
  | "Purchase"
  | "Marketing"
  | "Stock-Out"
  | "China Warehouse"
  | "BD Customs"
  | "BD Warehouse"
  | "Delivery"
  | "Invoices"
  | "Accounts"
  | "Daily Reports"
  | "Employees";

interface CentralOperationsHubProps {
  key?: React.Key;
  initialTab?: RBACDepartment;
  externalSubNav?: SubNavTab;
  onExternalSubNavChange?: (nav: SubNavTab) => void;
}

export default function CentralOperationsHub({
  initialTab = "Admin",
  externalSubNav,
  onExternalSubNavChange
}: CentralOperationsHubProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stockOuts, setStockOuts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalSubNav, setInternalSubNav] = useState<SubNavTab>("all_orders");

  const activeSubNav = externalSubNav !== undefined ? externalSubNav : internalSubNav;
  const setActiveSubNav = (nav: SubNavTab) => {
    setInternalSubNav(nav);
    if (onExternalSubNavChange) {
      onExternalSubNavChange(nav);
    }
  };

  // Detect logged-in user role & allow Admin to preview/switch RBAC roles
  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("admin_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isSuperAdminAccount =
    !storedUser ||
    storedUser.role?.toLowerCase() === "admin" ||
    storedUser.role === "Super Admin";

  const mapUserRoleToDept = (r?: string): RBACDepartment => {
    if (!r) return "Admin";
    const lower = r.toLowerCase();
    if (lower.includes("cs") || lower.includes("support")) return "CS";
    if (lower.includes("purchase") || lower.includes("sourcing")) return "Purchase";
    if (lower.includes("market") || lower.includes("sales") || lower.includes("kam")) return "Marketing";
    if (lower.includes("china")) return "China Warehouse";
    if (lower.includes("custom")) return "BD Customs";
    if (lower.includes("bd warehouse") || lower.includes("bd wh")) return "BD Warehouse";
    if (lower.includes("deliver") || lower.includes("fulfill")) return "Delivery";
    if (lower.includes("account") || lower.includes("ledger")) return "Accounts";
    return "Admin";
  };

  const [currentRole, setCurrentRole] = useState<string>(() => {
    if (storedUser?.defaultRole) return storedUser.defaultRole;
    return isSuperAdminAccount ? "Admin" : mapUserRoleToDept(storedUser?.role);
  });
  const [activeTab, setActiveTab] = useState<RBACDepartment>(() => {
    if (storedUser?.defaultRole) return storedUser.defaultRole as RBACDepartment;
    return isSuperAdminAccount ? initialTab : mapUserRoleToDept(storedUser?.role);
  });
  const [selectedMarketingEmpId, setSelectedMarketingEmpId] = useState<string>("all");

  // Global Central Search & Order Filters
  const [globalSearch, setGlobalSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderDateFilter, setOrderDateFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedOrderModalTab, setSelectedOrderModalTab] = useState<"pipeline" | "timeline" | "invoice">("pipeline");
  const [selectedProductInfoOrder, setSelectedProductInfoOrder] = useState<any | null>(null);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<any | null>(null);
  const [showTablePasswords, setShowTablePasswords] = useState<Record<string, boolean>>({});
  const [copiedPassId, setCopiedPassId] = useState<string | null>(null);

  const toggleShowTablePassword = (id: string) => {
    setShowTablePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyTablePassword = (pass: string, id: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedPassId(id);
    setTimeout(() => setCopiedPassId(null), 2500);
  };

  const [marketingCartFilter, setMarketingCartFilter] = useState<"all" | "cart_only" | "wishlist_only" | "both">("all");
  const [marketingSearch, setMarketingSearch] = useState("");
  const [previewCartModalCust, setPreviewCartModalCust] = useState<any | null>(null);

  // CS Live Orders Chart & Category Filter State
  const [csChartFilterStatus, setCsChartFilterStatus] = useState<string>("all");
  // Marketing Target & Customer Order Value Brackets Modal
  const [showMarketingTiersModal, setShowMarketingTiersModal] = useState(false);
  // Purchase Department Direct China Courier & Notes Drafts
  const [purchaseCourierDrafts, setPurchaseCourierDrafts] = useState<Record<string, number>>({});
  const [purchaseNotesDrafts, setPurchaseNotesDrafts] = useState<Record<string, string>>({});
  const [savedPurchaseActionMsg, setSavedPurchaseActionMsg] = useState<{ id: string; msg: string } | null>(null);

  // Category detection helper for CS Shipping Rate Determination
  const getOrderCategoryInfo = (ord: any) => {
    const rawCat = ord.items?.[0]?.category || ord.category || ord.items?.[0]?.productCategory || "General Clothing & Shoes";
    const catLower = String(rawCat).toLowerCase();

    if (catLower.includes("elect") || catLower.includes("gadget") || catLower.includes("beauty") || catLower.includes("cosmetic") || catLower.includes("watch")) {
      return {
        name: rawCat,
        group: "Category B: Electronics, Gadgets, Cosmetics",
        defaultRate: 1200,
        badgeColor: "bg-purple-100 text-purple-800 border-purple-200"
      };
    }
    if (catLower.includes("battery") || catLower.includes("power") || catLower.includes("sens") || catLower.includes("liquid") || catLower.includes("chemical")) {
      return {
        name: rawCat,
        group: "Category C: Battery, Sensitive & Chemical",
        defaultRate: 1450,
        badgeColor: "bg-red-100 text-red-800 border-red-200"
      };
    }
    if (catLower.includes("sea") || catLower.includes("heavy") || catLower.includes("machine") || catLower.includes("bulk")) {
      return {
        name: rawCat,
        group: "Sea Cargo: Bulk & Heavy Parcels",
        defaultRate: 450,
        badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200"
      };
    }
    return {
      name: rawCat,
      group: "Category A: General Clothing, Shoes, Bags",
      defaultRate: 780,
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    };
  };

  const openOrderWithTab = (ord: any, tab: "pipeline" | "timeline" | "invoice" = "pipeline") => {
    setSelectedOrderModalTab(tab);
    setSelectedOrder(ord);
  };

  // Daily Delivery & History Report Filters
  const [reportDate, setReportDate] = useState("2026-09-27");
  const [reportRangeStart, setReportRangeStart] = useState("2026-09-20");
  const [reportRangeEnd, setReportRangeEnd] = useState("2026-09-27");
  const [reportPeriodMode, setReportPeriodMode] = useState<"daily" | "weekly" | "monthly" | "custom">("daily");
  const [historySearch, setHistorySearch] = useState("");
  const [historyDeliveryStatus, setHistoryDeliveryStatus] = useState("all");
  const [historyPaymentStatus, setHistoryPaymentStatus] = useState("all");
  const [historyEmployeeFilter, setHistoryEmployeeFilter] = useState("all");

  // Stock-Out Modal State
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [stockOutForm, setStockOutForm] = useState({
    orderId: "WBBD-10030",
    customerName: "",
    productName: "",
    productImage: "",
    productLink: "",
    orderedQty: 10,
    availableQty: 5,
    stockOutQty: 5,
    reason: "Out of stock at supplier factory",
    resolutionStatus: "Pending Customer Decision",
    notes: ""
  });

  // New Employee Modal State
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empForm, setEmpForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CS",
    permissions: ["customers_view", "orders_view"]
  });

  // Purchase Department 1688 Order ID & Tracking Number Upload State
  const [purchaseDrafts, setPurchaseDrafts] = useState<
    Record<string, { order1688Id: string; trackingNumber: string }>
  >({});
  const [savedPurchaseOrderId, setSavedPurchaseOrderId] = useState<string | null>(null);
  const [csShippingDrafts, setCsShippingDrafts] = useState<Record<string, number>>({});
  const [deliveryWeightDrafts, setDeliveryWeightDrafts] = useState<Record<string, number>>({});
  const [savedRoleActionMsg, setSavedRoleActionMsg] = useState<string | null>(null);

  const getOrderWeightKg = (ord: any): number => {
    const raw =
      ord.weightKg ??
      ord.invoice?.weightKg ??
      ord.weight ??
      ord.invoice?.weightApx ??
      "0";
    return parseFloat(String(raw).replace(/[^0-9.]/g, "")) || 0;
  };

  const getOrder1688Id = (ord: any): string =>
    String(
      ord?.order1688Id ||
        ord?.purchaseInfo?.order1688Id ||
        ord?.purchaseInfo?.orderSupplierId ||
        ord?.invoice?.order1688Id ||
        ""
    );

  const getOrderTrackingNo = (ord: any): string =>
    String(
      ord?.trackingNumber ||
        ord?.purchaseInfo?.trackingNumber ||
        ord?.chinaWarehouseInfo?.chinaAwb ||
        ord?.deliveryInfo?.trackingNumber ||
        ord?.invoice?.trackingNumber ||
        ""
    );

  const getOrderShippingRate = (ord: any): number => {
    return Number(
      csShippingDrafts[ord.id] ??
      ord.shippingRatePerKg ??
      ord.invoice?.shippingRatePerKg ??
      ord.invoice?.shippingRate ??
      780
    );
  };

  const renderOrderIdCell = (ord: any) => {
    const mainId = ord.mainOrderId || ord.orderId || ord.id;
    const subOrders = Array.isArray(ord.subOrders) ? ord.subOrders : [];
    return (
      <div>
        <span
          onClick={() => openOrderWithTab(ord, "pipeline")}
          className="font-mono font-bold text-primary block cursor-pointer hover:underline text-xs"
        >
          {mainId}
        </span>
        {subOrders.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-1">
            {subOrders.map((sub: any) => (
              <span
                key={sub.subOrderId}
                className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded"
                title={`${sub.subOrderId} - ${sub.productName}`}
              >
                {sub.subOrderId}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderOrderProductsCell = (ord: any) => {
    const rawItems = Array.isArray(ord.items) && ord.items.length > 0 ? ord.items : [
      {
        name: ord.productName || "Imported Wholesale Product",
        image: ord.productImage || ord.image || "",
        quantity: ord.totalQuantity || ord.quantity || 1,
        price: ord.price || ord.total || 0,
        variation: ord.variation || ord.variantName || ""
      }
    ];

    const totalQty = rawItems.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 1), 0);

    return (
      <div className="flex items-center gap-2.5 min-w-[180px] max-w-[240px]">
        {rawItems[0]?.image && (
          <img
            src={rawItems[0].image || "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80"}
            alt=""
            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-white cursor-pointer hover:opacity-90 transition"
            referrerPolicy="no-referrer"
            onClick={() => setSelectedProductInfoOrder(ord)}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80";
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div
            className="font-bold text-slate-800 line-clamp-1 text-xs cursor-pointer hover:text-blue-700 transition"
            title={rawItems[0]?.name}
            onClick={() => setSelectedProductInfoOrder(ord)}
          >
            {rawItems[0]?.name || "Import Product"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>{rawItems.length} টি আইটেম</span>
            <span>•</span>
            <span className="font-mono font-bold text-slate-700">{totalQty} pcs</span>
          </div>
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setSelectedProductInfoOrder(ord)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 text-[10px] font-black transition cursor-pointer shadow-2xs group"
              title="আইবাটন: প্রোডাক্টের সম্পূর্ণ বিবরণ, কত পিস, কত টাকা ও সোর্সিং লিংক দেখুন"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 group-hover:bg-white text-white group-hover:text-blue-600 flex items-center justify-center text-[9px] font-black font-serif italic">i</span>
              <span>প্রোডাক্ট বিস্তারিত</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const fetchHubData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/operations-hub");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setCustomers(data.customers || []);
        setInvoices(data.invoices || []);
        setStockOuts(data.stockOutCases || []);
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Error loading operations hub:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, []);

  // Unified Order Updater
  const handleUnifiedUpdate = async (orderId: string, payload: any) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/unified-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          updatedBy: `${currentRole} (${storedUser?.name || "Authorized Staff"})`
        })
      });
      if (res.ok) {
        await fetchHubData();
        const data = await res.json();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  };

  // Purchase Department Direct China Courier & Notes Handlers
  const handleSavePurchaseCourier = async (orderId: string, val: number) => {
    const targetOrd = orders.find(o => o.id === orderId || o.orderId === orderId);
    await handleUnifiedUpdate(orderId, {
      chinaCourierCharge: val,
      chinaCourierBill: val,
      invoice: {
        ...(targetOrd?.invoice || {}),
        chinaCourierCharge: val,
        chinaCourier: val
      },
      timelineNote: `China Courier Bill updated to BDT ${val} by Purchase Department`
    });
    setSavedPurchaseActionMsg({ id: orderId, msg: `চায়না কুরিয়ার বিল BDT ${val} সংরক্ষিত!` });
    setTimeout(() => setSavedPurchaseActionMsg(null), 3000);
  };

  const handleSavePurchaseNote = async (orderId: string, note: string) => {
    await handleUnifiedUpdate(orderId, {
      purchaseNote: note,
      timelineNote: `Purchase Dept Note: ${note}`
    });
    setSavedPurchaseActionMsg({ id: orderId, msg: `নোট সংরক্ষিত!` });
    setTimeout(() => setSavedPurchaseActionMsg(null), 3000);
  };

  // Assign Customer to Marketing Employee
  const handleAssignCustomer = async (customer: any, empId: string) => {
    const mktEmp = employees.find(e => e.id === empId);
    if (!mktEmp) return;
    try {
      await fetch(`/api/admin/customers/${customer.id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: customer.phone,
          assignedMarketingId: mktEmp.id,
          assignedMarketingName: mktEmp.name
        })
      });
      await fetchHubData();
    } catch (err) {
      console.error("Error assigning customer:", err);
    }
  };

  // Save Stock-Out Case
  const handleSaveStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const matchedOrd = orders.find(o => o.id.toLowerCase() === stockOutForm.orderId.trim().toLowerCase());
      const payload = {
        ...stockOutForm,
        customerName: stockOutForm.customerName || matchedOrd?.customerInfo?.name || "Customer",
        customerPhone: matchedOrd?.customerInfo?.phone || "",
        productName: stockOutForm.productName || matchedOrd?.items?.[0]?.name || "Ordered Product",
        productImage: stockOutForm.productImage || matchedOrd?.items?.[0]?.image || "",
        productLink: stockOutForm.productLink || matchedOrd?.items?.[0]?.importedUrl || "/shop",
        stockOutQty: Math.max(0, Number(stockOutForm.orderedQty) - Number(stockOutForm.availableQty))
      };
      const res = await fetch("/api/admin/stock-outs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowStockOutModal(false);
        await fetchHubData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name || !empForm.phone) return;
    try {
      const res = await fetch("/api/admin/subadmins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...empForm,
          department: empForm.role,
          status: "active"
        })
      });
      if (res.ok) {
        setShowEmpModal(false);
        setEmpForm({
          name: "",
          email: "",
          phone: "",
          password: "",
          role: "CS",
          permissions: ["customers_view", "orders_view", "orders_confirm"]
        });
        await fetchHubData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleEmployeeStatus = async (emp: any) => {
    const newStatus = emp.status === "active" ? "inactive" : "active";
    await fetch(`/api/subadmins/${emp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    await fetchHubData();
  };

  // ============================================================================
  // 19. MAIN ADMIN DASHBOARD 17 VISUAL CLICKABLE STATISTICS
  // ============================================================================
  const stats = useMemo(() => {
    const todayStr = "2026-09-27";
    const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "Order Placed");
    const confirmedOrders = orders.filter(o => o.status === "Order Confirmed" || o.status === "Confirmed Order");
    const inPurchase = orders.filter(
      o =>
        o.status === "Order Confirmed" ||
        o.status === "Confirmed Order" ||
        o.status === "Pending Purchase" ||
        o.status === "Purchased"
    );
    const inChinaWH = orders.filter(
      o => o.status === "Received in China Warehouse" || o.status === "Shipped to China Warehouse"
    );
    const inBDCustoms = orders.filter(o => o.status === "Received in BD Customs");
    const inBDWH = orders.filter(o => o.status === "Received in BD Warehouse");
    const readyForDelivery = orders.filter(
      o => o.status === "Ready for Delivery" || o.status === "Invoice Ready" || o.status === "Invoice Generated"
    );
    const assignedForDelivery = orders.filter(o => o.status === "Assigned to Delivery");
    const deliveredOrders = orders.filter(o => o.status === "Delivered");
    const deliveredToday = deliveredOrders.filter(
      o =>
        (o.deliveryInfo?.deliveredAt || "").includes(todayStr) ||
        (o.date || "").includes(todayStr)
    );
    const pendingDelivery = orders.filter(
      o =>
        o.status === "Received in BD Warehouse" ||
        o.status === "Invoice Processing" ||
        o.status === "Invoice Generated" ||
        o.status === "Ready for Delivery" ||
        o.status === "Assigned to Delivery"
    );
    const cancelledOrders = orders.filter(o => o.status === "Cancelled");
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.invoice?.totalAmount ?? o.total) || 0), 0);
    const pendingPayments = orders.filter(o => o.paymentStatus !== "Paid");

    const stockOutOrderCount = orders.filter(
      o => o.status === "Stock Out" || o.purchaseInfo?.status === "Stock Out"
    ).length;

    return {
      totalCustomers: customers.length,
      totalOrders: orders.length,
      pendingOrders: pendingOrders.length,
      confirmedOrders: confirmedOrders.length,
      ordersInPurchase: inPurchase.length,
      ordersInChinaWH: inChinaWH.length,
      ordersInBDCustoms: inBDCustoms.length,
      ordersInBDWH: inBDWH.length,
      stockOutOrders: Math.max(stockOuts.length, stockOutOrderCount),
      totalInvoices: invoices.length,
      readyForDelivery: readyForDelivery.length,
      assignedForDelivery: assignedForDelivery.length,
      deliveredToday: deliveredToday.length,
      pendingDelivery: pendingDelivery.length,
      cancelledOrders: cancelledOrders.length,
      totalRevenue,
      pendingPayments: pendingPayments.length
    };
  }, [orders, customers, invoices, stockOuts]);

  // Global Central Search Filter (Main Order ID / Sub-Order ID / Product Link / Invoice Number / Customer / Phone / Items)
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const q = globalSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(o.id || "").toLowerCase().includes(q) ||
        String(o.orderId || "").toLowerCase().includes(q) ||
        String(o.mainOrderId || "").toLowerCase().includes(q) ||
        (Array.isArray(o.subOrders) && o.subOrders.some((s: any) => 
          String(s.subOrderId || "").toLowerCase().includes(q) ||
          String(s.productLink || "").toLowerCase().includes(q) ||
          String(s.productName || "").toLowerCase().includes(q)
        )) ||
        String(o.invoice?.invoiceNumber || "").toLowerCase().includes(q) ||
        String(o.customerInfo?.name || "").toLowerCase().includes(q) ||
        String(o.customerInfo?.phone || "").toLowerCase().includes(q) ||
        String(o.customerInfo?.email || "").toLowerCase().includes(q) ||
        (o.items || []).some((it: any) => 
          String(it.name || "").toLowerCase().includes(q) ||
          String(it.subOrderId || "").toLowerCase().includes(q) ||
          String(it.productLink || "").toLowerCase().includes(q) ||
          String(it.importedUrl || "").toLowerCase().includes(q)
        );

      const matchesStatus =
        orderStatusFilter === "all" ||
        o.status === orderStatusFilter ||
        (orderStatusFilter === "Pending" && (o.status === "Pending" || o.status === "Order Placed")) ||
        (orderStatusFilter === "Order Confirmed" && (o.status === "Order Confirmed" || o.status === "Confirmed Order"));

      const matchesDate = !orderDateFilter || (o.date || "").slice(0, 10) === orderDateFilter;

      const matchesCsChartFilter =
        activeTab !== "CS" ||
        csChartFilterStatus === "all" ||
        (csChartFilterStatus === "pending" && (o.status === "Pending" || o.status === "Order Placed" || !o.status)) ||
        (csChartFilterStatus === "confirmed" && (o.status !== "Pending" && o.status !== "Order Placed" && o.status)) ||
        o.status === csChartFilterStatus;

      return matchesSearch && matchesStatus && matchesDate && matchesCsChartFilter;
    });
  }, [orders, globalSearch, orderStatusFilter, orderDateFilter, activeTab, csChartFilterStatus]);

  // ============================================================================
  // 13 & 14. AUTOMATIC DAILY DELIVERY & INVOICE REPORTING SYSTEM
  // ============================================================================
  const dailyReportMetrics = useMemo(() => {
    const matchesPeriod = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = dateStr.slice(0, 10);
      if (reportPeriodMode === "daily") return d === reportDate;
      if (reportPeriodMode === "weekly") return d >= "2026-09-20" && d <= "2026-09-27";
      if (reportPeriodMode === "monthly") return d.startsWith(reportDate.slice(0, 7));
      return d >= reportRangeStart && d <= reportRangeEnd;
    };

    const relevantOrders = orders.filter(
      o =>
        matchesPeriod(o.invoice?.invoiceDate) ||
        matchesPeriod(o.deliveryInfo?.scheduledDate) ||
        matchesPeriod(o.deliveryInfo?.deliveredAt) ||
        matchesPeriod(o.date)
    );

    const invoicesGenerated = relevantOrders.filter(o => !!o.invoice?.invoiceNumber).length;
    const readyForDelivery = relevantOrders.filter(
      o =>
        o.status === "Ready for Delivery" ||
        o.status === "Invoice Ready" ||
        o.deliveryInfo?.status === "Ready for Delivery"
    ).length;
    const assignedForDelivery = relevantOrders.filter(
      o =>
        o.status === "Assigned to Delivery" ||
        o.deliveryInfo?.status === "Assigned to Delivery" ||
        !!o.deliveryInfo?.trackingNumber
    ).length;
    const productsScheduledQty = relevantOrders.reduce(
      (sum, o) => sum + (Number(o.totalQuantity) || 1),
      0
    );
    const deliveredOrders = relevantOrders.filter(
      o => o.status === "Delivered" || o.deliveryInfo?.status === "Delivered"
    );
    const productsDeliveredQty = deliveredOrders.reduce(
      (sum, o) => sum + (Number(o.totalQuantity) || 1),
      0
    );
    const pendingDeliveries = relevantOrders.filter(
      o =>
        o.status !== "Delivered" &&
        o.status !== "Cancelled" &&
        o.status !== "Returned"
    ).length;
    const cancelledDeliveries = relevantOrders.filter(o => o.status === "Cancelled").length;
    const returnedDeliveries = relevantOrders.filter(o => o.status === "Returned").length;
    const totalInvoiceAmount = relevantOrders.reduce(
      (sum, o) => sum + (Number(o.invoice?.totalAmount ?? o.total) || 0),
      0
    );
    const totalCollectedAmount = relevantOrders.reduce(
      (sum, o) =>
        sum +
        (Number(
          o.invoice?.collectedAmount ??
            (o.paymentStatus === "Paid" ? o.total : 0)
        ) || 0),
      0
    );

    return {
      invoicesGenerated,
      readyForDelivery,
      assignedForDelivery,
      productsScheduledQty,
      ordersDelivered: deliveredOrders.length,
      productsDeliveredQty,
      pendingDeliveries,
      cancelledDeliveries,
      returnedDeliveries,
      totalInvoiceAmount,
      totalCollectedAmount,
      records: relevantOrders
    };
  }, [orders, reportDate, reportPeriodMode, reportRangeStart, reportRangeEnd]);

  // Role-Based Allowed Department Tabs
  const departmentTabs: { id: RBACDepartment; label: string; badge?: number }[] = [
    { id: "Admin", label: "Overview", badge: stats.totalOrders },
    { id: "CS", label: "Customer Service", badge: stats.pendingOrders },
    { id: "Purchase", label: "Purchased", badge: stats.ordersInPurchase },
    { id: "Stock-Out", label: "Stock Out", badge: stats.stockOutOrders },
    { id: "Marketing", label: "Marketing", badge: stats.totalCustomers },
    { id: "China Warehouse", label: "China WH", badge: stats.ordersInChinaWH },
    { id: "BD Customs", label: "BD Customs", badge: stats.ordersInBDCustoms },
    { id: "BD Warehouse", label: "BD Warehouse", badge: stats.ordersInBDWH },
    { id: "Delivery", label: "Delivery", badge: stats.readyForDelivery },
    { id: "Invoices", label: "Invoices", badge: stats.totalInvoices },
    { id: "Accounts", label: "Accounts", badge: stats.totalInvoices },
    { id: "Daily Reports", label: "Reports & History" },
    { id: "Employees", label: "Staff & RBAC", badge: employees.length }
  ];

  // Enforce RBAC visibility based on selected role:
  // - All employees can view Customer Orders ("Admin" Overview + their Department Tab)
  // - ONLY Admin has access to "Delivery" and "Order Confirm"
  const isTabAllowedForRole = (tab: RBACDepartment, role: string): boolean => {
    if (role === "Admin") return true;
    
    // Departments:
    // CS: Shipping assignment, confirm order
    // Purchase: Stock Out, China WH, China Courier
    // Marketing: BD Warehouse receive
    // Delivery: Assigned to Delivery
    
    if (tab === "Admin") return true; // Everyone views orders
    
    if (role === "CS") return tab === "CS" || tab === "Invoices";
    if (role === "Purchase") return tab === "Purchase" || tab === "Stock-Out" || tab === "China Warehouse";
    if (role === "Marketing") return tab === "Marketing" || tab === "China Warehouse" || tab === "BD Warehouse";
    if (role === "Delivery") return tab === "Delivery";
    
    if (role === "China Warehouse") return tab === "China Warehouse";
    if (role === "BD Customs") return tab === "BD Customs";
    if (role === "BD Warehouse") return tab === "BD Warehouse";
    if (role === "Accounts") return tab === "Accounts" || tab === "Invoices" || tab === "Daily Reports";
    return false;
  };

  const handleRoleChange = (newRole: string) => {
    setCurrentRole(newRole);
    if (newRole === "Admin") {
      setActiveTab("Admin");
    } else {
      setActiveTab(newRole as RBACDepartment);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-9 w-9 border-2 border-primary border-t-transparent"></div>
        <span className="text-xs font-bold">Loading World Buy BD Centralized Operations & RBAC Hub...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans pb-10">
      {/* ===================================================================== */}
      {/* TOP BAR: RBAC ROLE CONTROLLER & GLOBAL CENTRAL SEARCH SYSTEM          */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Global Search Input */}
          <div className="relative flex-1 max-w-2xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Search by Order ID (e.g. WBBD-10025), Invoice No, Customer Name, Phone, or Product..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:bg-white focus:border-primary"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* RBAC Role Switcher & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-slate-500 text-xs">Department:</span>
              {isSuperAdminAccount ? (
                <select
                  value={currentRole}
                  onChange={e => handleRoleChange(e.target.value)}
                  className="bg-transparent text-slate-900 font-semibold text-xs outline-none cursor-pointer"
                >
                  <option value="Admin">Admin (Full Control: Order Confirm & Delivery)</option>
                  <option value="CS">Customer Service (CS)</option>
                  <option value="Purchase">Purchase & Sourcing (1688 ID & Tracking)</option>
                  <option value="Marketing">Marketing</option>
                  <option value="China Warehouse">China Warehouse</option>
                  <option value="BD Customs">BD Customs</option>
                  <option value="BD Warehouse">BD Warehouse</option>
                  <option value="Accounts">Accounts & Billing</option>
                </select>
              ) : (
                <span className="font-semibold text-slate-900 text-xs">{currentRole}</span>
              )}
            </div>

            <button
              onClick={fetchHubData}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Instant Global Search Connected Pipeline Result Preview */}
        {globalSearch.trim() && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">
                Search Results ({filteredOrders.length} orders found)
              </span>
              <span className="text-slate-500">
                Click any order to view details or update invoice charges
              </span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {filteredOrders.map(ord => (
                <div
                  key={ord.id}
                  onClick={() => openOrderWithTab(ord, "pipeline")}
                  className="p-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 cursor-pointer transition text-xs"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-primary">{ord.mainOrderId || ord.orderId || ord.id}</span>
                    {ord.subOrders && ord.subOrders.length > 0 && (
                      <div className="flex items-center gap-1">
                        {ord.subOrders.map((sub: any) => (
                          <span key={sub.subOrderId} className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded" title={sub.productName}>
                            {sub.subOrderId}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="text-slate-300">·</span>
                    <span className="font-semibold text-slate-900">{ord.customerInfo?.name} ({ord.customerInfo?.phone})</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600">{ord.items?.[0]?.name?.slice(0, 36)} ({ord.totalQuantity || 1} pcs)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        openOrderWithTab(ord, "invoice");
                      }}
                      className="px-2.5 py-1 rounded bg-primary text-white font-semibold text-[11px] hover:bg-primary-dark cursor-pointer"
                    >
                      Update Courier / Weight / Invoice
                    </button>
                    <span className="text-xs font-semibold text-slate-700">{ord.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department Navigation Tabs (RBAC Filtered) */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {departmentTabs
              .filter(t => isTabAllowedForRole(t.id, currentRole))
              .map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setActiveSubNav("all_orders");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === tab.id && activeSubNav === "all_orders"
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-[11px] font-mono ${
                        activeTab === tab.id && activeSubNav === "all_orders"
                          ? "text-slate-300"
                          : "text-slate-400"
                      }`}
                    >
                      ({tab.badge})
                    </span>
                  )}
                </button>
              ))}
          </div>

          {/* Clean Sub-Views Selector */}
          {externalSubNav === undefined && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              {[
                { id: "all_orders", label: "All Orders" },
                { id: "client", label: "Clients" },
                { id: "bank_payment", label: "Bank Payments" },
                { id: "bd_warehouse_invoice", label: "BD WH Invoices" },
                { id: "delivered_invoice", label: "Delivered Invoices" }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubNav(sub.id as SubNavTab)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    activeSubNav === sub.id
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Render Dedicated Sub-Navigation View when selected */}
      {activeSubNav !== "all_orders" && (
        <AdminTopNavSubViews
          activeSubNav={activeSubNav}
          orders={orders}
          customers={customers}
          invoices={invoices}
          employees={employees}
          currentRole={currentRole}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          onRefresh={fetchHubData}
          onUpdateOrder={handleUnifiedUpdate}
        />
      )}

      {/* ===================================================================== */}
      {/* 1. ADMIN MASTER DASHBOARD & CLEAN KPI METRICS                         */}
      {/* ===================================================================== */}
      {activeTab === "Admin" && activeSubNav === "all_orders" && (
        <div className="space-y-5">
          {/* Primary Executive KPI Row (6 Clean Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Orders", value: stats.totalOrders, sub: `${stats.pendingOrders} pending confirm`, onClick: () => setOrderStatusFilter("all") },
              { label: "Total Revenue", value: `BDT ${stats.totalRevenue.toLocaleString()}`, sub: `${stats.totalInvoices} invoices`, onClick: () => setActiveTab("Invoices") },
              { label: "In Sourcing / China WH", value: stats.ordersInPurchase + stats.ordersInChinaWH, sub: `${stats.ordersInChinaWH} in China WH`, onClick: () => setActiveTab("China Warehouse") },
              { label: "Customs & BD WH", value: stats.ordersInBDCustoms + stats.ordersInBDWH, sub: `${stats.ordersInBDWH} in BD WH`, onClick: () => setActiveTab("BD Warehouse") },
              { label: "Ready for Delivery", value: stats.readyForDelivery + stats.assignedForDelivery, sub: `${stats.deliveredToday} delivered`, onClick: () => setActiveTab("Delivery") },
              { label: "Total Customers", value: stats.totalCustomers, sub: `${stats.stockOutOrders} stock-out alerts`, onClick: () => setActiveTab("Marketing") }
            ].map((card, i) => (
              <div
                key={i}
                onClick={card.onClick}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition flex flex-col justify-between"
              >
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono mt-1.5">
                  {card.value}
                </div>
                <span className="text-[11px] text-slate-400 mt-1">{card.sub}</span>
              </div>
            ))}
          </div>

          {/* Central Order Tracking Table with Direct Post-Order Invoice Charge Upload */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Orders & Customer Invoice Management ({filteredOrders.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click <strong>Update Courier / Weight / Invoice</strong> on any order to upload China Courier Bill, Parcel Weight (KG), and Shipping Charge.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {orderStatusFilter !== "all" && (
                  <button
                    onClick={() => setOrderStatusFilter("all")}
                    className="text-xs font-semibold text-primary hover:underline px-2 py-1 cursor-pointer"
                  >
                    Reset Filter ({orderStatusFilter}) ✕
                  </button>
                )}
                <input
                  type="date"
                  value={orderDateFilter}
                  onChange={e => setOrderDateFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700"
                />
                <select
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium bg-white text-slate-700"
                >
                  <option value="all">All Pipeline Stages</option>
                  <option value="Pending">Order Placed / Pending</option>
                  <option value="Order Confirmed">Order Confirmed</option>
                  <option value="Purchased">Purchased</option>
                  <option value="Stock Out">Stock Out</option>
                  <option value="Received in China Warehouse">Received in China Warehouse</option>
                  <option value="Received in BD Customs">Received in BD Customs</option>
                  <option value="Received in BD Warehouse">Received in BD Warehouse</option>
                  <option value="Invoice Generated">Invoice Generated</option>
                  <option value="Ready for Delivery">Ready for Delivery</option>
                  <option value="Assigned to Delivery">Assigned to Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold">Order ID, 1688 ID & Tracking</th>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Products</th>
                    <th className="py-3 px-4 font-semibold">Final Invoice Calculation (Weight × Rate + Courier - Partial Paid)</th>
                    <th className="py-3 px-4 font-semibold">Order Stage (Admin Confirm/Delivery)</th>
                    <th className="py-3 px-4 font-semibold text-right">Invoice & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredOrders.map(ord => {
                    const inv = ord.invoice || {};
                    const subVal = Number(inv.subTotal ?? ord.subtotal ?? ord.total ?? 0);
                    const discVal = Number(inv.discount ?? ord.discountAmount ?? 0);
                    const courierFee = Number(inv.chinaCourier ?? inv.chinaCourierCharge ?? ord.chinaCourierBill ?? 0);
                    const shipFee = Number(inv.shippingCharge ?? ord.shippingCharge ?? 0);
                    const weightLabel = inv.weightApx || inv.weight || ord.weight || `${inv.weightKg || 0} KG`;
                    const ratePerKg = Number(inv.shippingRatePerKg ?? ord.shippingRatePerKg ?? 780);
                    const grandTotalVal = Math.max(0, subVal - discVal) + courierFee + shipFee;
                    const partialPaidVal = Number(inv.paidAmount ?? ord.paidAmount ?? Math.max(0, subVal - discVal));
                    const finalDueVal = Math.max(0, grandTotalVal - partialPaidVal);
                    const ord1688 = getOrder1688Id(ord);
                    const ordTrack = getOrderTrackingNo(ord);

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <span
                            onClick={() => openOrderWithTab(ord, "pipeline")}
                            className="font-mono font-bold text-slate-900 text-xs cursor-pointer hover:text-primary block"
                          >
                            {ord.mainOrderId || ord.orderId || ord.id}
                          </span>
                          {ord.subOrders && ord.subOrders.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                              {ord.subOrders.map((sub: any) => (
                                <span key={sub.subOrderId} className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded" title={sub.productName}>
                                  {sub.subOrderId}
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {new Date(ord.date).toLocaleDateString("en-GB")}
                          </span>
                          {ord1688 && (
                            <span className="inline-block mt-1 mr-1 px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-mono font-bold">
                              1688 ID: {ord1688}
                            </span>
                          )}
                          {ordTrack && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-mono font-bold">
                              Tracking: {ordTrack}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{ord.customerInfo?.name}</div>
                          <div className="font-mono text-slate-600">{ord.customerInfo?.phone}</div>
                          {(ord.customerInfo?.email || ord.userEmail) && (
                            <div className="text-[11px] text-slate-500">{ord.customerInfo?.email || ord.userEmail}</div>
                          )}
                          {ord.customerInfo?.address && (
                            <div className="text-[11px] text-slate-400 max-w-[190px] truncate" title={ord.customerInfo.address}>
                              {ord.customerInfo.address} {ord.customerInfo.division ? `(${ord.customerInfo.division})` : ""}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {renderOrderProductsCell(ord)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div className="text-slate-600">
                            Product: <strong className="text-slate-900">BDT {subVal.toLocaleString()}</strong> · Partial Paid: <strong className="text-emerald-700">-BDT {partialPaidVal.toLocaleString()}</strong>
                          </div>
                          <div className="text-slate-600 mt-0.5">
                            {weightLabel} × BDT {ratePerKg} = <strong className="text-indigo-700">BDT {shipFee.toLocaleString()}</strong> + Courier <strong className="text-blue-700">BDT {courierFee.toLocaleString()}</strong>
                          </div>
                          <div className="text-red-600 font-bold mt-0.5">
                            Final Payable: BDT {finalDueVal.toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {currentRole === "Admin" ? (
                            <div className="space-y-1">
                              <select
                                value={ord.status}
                                onChange={e => handleUnifiedUpdate(ord.id, { status: e.target.value })}
                                className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-white text-slate-800 cursor-pointer w-full"
                              >
                                <option value="Order Placed">Order Placed</option>
                                <option value="Order Confirmed">Order Confirmed (Admin)</option>
                                <option value="Purchased">Purchased</option>
                                <option value="Stock Out">Stock Out</option>
                                <option value="Received in China Warehouse">Received in China Warehouse</option>
                                <option value="Shipped to Bangladesh">Shipped to Bangladesh</option>
                                <option value="Received in BD Customs">Received in BD Customs</option>
                                <option value="Received in BD Warehouse">Received in BD Warehouse</option>
                                <option value="Invoice Generated">Invoice Generated</option>
                                <option value="Ready for Delivery">Ready for Delivery (Admin)</option>
                                <option value="Assigned to Delivery">Assigned to Delivery (Admin)</option>
                                <option value="Delivered">Delivered (Admin)</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs">
                                {ord.status}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                Confirm & Delivery: Admin Only
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => openOrderWithTab(ord, "invoice")}
                              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                              title="Update China Courier Bill, Parcel Weight (KG) & Shipping Charge"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Update Courier / Weight / Invoice</span>
                            </button>
                            <button
                              onClick={() => openOrderWithTab(ord, "pipeline")}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. CS (CUSTOMER SERVICE) DASHBOARD — APPLIED SHIPPING & ROLES (#2)    */}
      {/* ===================================================================== */}
      {activeTab === "CS" && (
        <div className="space-y-4">
          {/* Integrated Interactive CS Live Order Status & Confirmation Chart System */}
          <CSOrderAnalyticsChart
            orders={orders}
            onFilterStatus={(st) => setCsChartFilterStatus(st)}
            selectedFilterStatus={csChartFilterStatus}
            onOpenOrderModal={(ord) => setSelectedOrder(ord)}
          />

          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-sky-200 text-sky-900 text-[10px] font-black uppercase">
                  CS Department
                </span>
                <span className="text-xs font-bold text-sky-800">
                  প্রডাক্টের ক্যাটাগরি অনুযায়ী শিপিং চার্জ নির্ধারণ ও অর্ডার কনফার্মেশন
                </span>
              </div>
              <h2 className="text-lg font-bold text-sky-950 mt-0.5">
                কাস্টমার সার্ভিস ড্যাশবোর্ড — প্রডাক্ট ক্যাটাগরিভিত্তিক শিপিং ও অর্ডার ট্র্যাকিং
              </h2>
              <p className="text-xs text-sky-800 mt-0.5">
                <strong>CS একসেস নিয়মাবলী:</strong> প্রডাক্টের ক্যাটাগরি (Shoes, Bags, Clothing, Electronics, etc.) যাচাই করে শিপিং রেট (BDT/KG) নির্ধারণ করুন। পেন্ডিং অর্ডার কনফার্মেশন, চায়না ওয়ারহাউজ রিসিভ, বিডি ওয়ারহাউজ রিসিভ ও স্টক-আউট রিপোর্ট করার ক্ষমতা CS-এর রয়েছে।
              </p>
            </div>
            {savedRoleActionMsg && (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs">
                ✓ {savedRoleActionMsg}
              </span>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700">
                অর্ডার তালিকা ({filteredOrders.length} টি প্রদর্শিত হচ্ছে {csChartFilterStatus !== "all" ? `— ফিল্টার: ${csChartFilterStatus}` : ""})
              </span>
              {csChartFilterStatus !== "all" && (
                <button
                  onClick={() => setCsChartFilterStatus("all")}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  সব অর্ডার দেখুন (Reset Chart Filter)
                </button>
              )}
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Customer Info</th>
                  <th className="py-3 px-4">Ordered Products, Specs & Qty</th>
                  <th className="py-3 px-4">1688 ID & Tracking (Purchase Only)</th>
                  <th className="py-3 px-4">Order Status Transition</th>
                  <th className="py-3 px-4 text-right">CS Category Shipping & Confirmation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(ord => {
                  const isPendingConfirm = ord.status === "Pending" || ord.status === "Order Placed";
                  const ord1688 = getOrder1688Id(ord);
                  const ordTrack = getOrderTrackingNo(ord);
                  const catInfo = getOrderCategoryInfo(ord);
                  const currentRate = csShippingDrafts[ord.id] !== undefined ? csShippingDrafts[ord.id] : (getOrderShippingRate(ord) || catInfo.defaultRate);

                  return (
                    <tr key={ord.id} className="hover:bg-gray-50/80 transition align-top">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-primary block">{ord.mainOrderId || ord.orderId || ord.id}</span>
                        {ord.subOrders && ord.subOrders.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-1">
                            {ord.subOrders.map((sub: any) => (
                              <span key={sub.subOrderId} className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded" title={sub.productName}>
                                {sub.subOrderId}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="text-[11px] text-gray-500 font-mono block mt-0.5">
                          {new Date(ord.date).toLocaleDateString("en-GB")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-charcoal">{ord.customerInfo?.name}</div>
                        <CustomerPhoneSecureDisplay
                          order={ord}
                          viewerDepartment="purchase"
                          isMasterAdmin={isSuperAdminAccount}
                        />
                        <div className="text-[11px] text-gray-400 max-w-[180px] line-clamp-2" title={ord.customerInfo?.address}>
                          {ord.customerInfo?.address}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderOrderProductsCell(ord)}
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${catInfo.badgeColor}`}>
                            🏷️ {catInfo.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            (রিকমেন্ডেড: BDT {catInfo.defaultRate}/KG)
                          </span>
                        </div>
                        <div className="font-bold text-emerald-800 text-xs mt-1">
                          Partial Paid: BDT {(ord.paidAmount ?? ord.subtotal ?? ord.total ?? 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="font-mono text-[11px]">
                          <span className="text-gray-500">1688 ID: </span>
                          {ord1688 ? (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 font-bold">
                              {ord1688}
                            </span>
                          ) : (
                            <span className="text-gray-400">Pending Purchase</span>
                          )}
                        </div>
                        <div className="font-mono text-[11px]">
                          <span className="text-gray-500">Tracking: </span>
                          {ordTrack ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-bold" title="Set exclusively by Purchase Department">
                              {ordTrack}
                            </span>
                          ) : (
                            <span className="text-gray-400">Pending (Purchase Only)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isPendingConfirm ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {ord.status}
                          </span>

                          {/* CS Allowed Status Transitions: Received in China WH, Received in BD WH, Stock Out */}
                          {!isPendingConfirm && (
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">Update Status:</label>
                              <select
                                value={ord.status}
                                onChange={e => {
                                  handleUnifiedUpdate(ord.id, {
                                    status: e.target.value,
                                    timelineNote: `Status updated to "${e.target.value}" by ${currentRole} Department`
                                  });
                                  setSavedRoleActionMsg(`Order ${ord.id} updated to ${e.target.value}`);
                                  setTimeout(() => setSavedRoleActionMsg(null), 3000);
                                }}
                                className="border border-sky-300 rounded px-2 py-1 text-xs font-semibold bg-sky-50/70 text-sky-950 cursor-pointer"
                              >
                                {currentRole === "Admin" ? (
                                  <>
                                    <option value="Order Placed">Order Placed</option>
                                    <option value="Order Confirmed">Order Confirmed</option>
                                    <option value="Purchased">Purchased</option>
                                    <option value="Stock Out">Stock Out</option>
                                    <option value="Received in China Warehouse">Received in China Warehouse</option>
                                    <option value="Shipped to Bangladesh">Shipped to Bangladesh</option>
                                    <option value="Received in BD Customs">Received in BD Customs</option>
                                    <option value="Received in BD Warehouse">Received in BD Warehouse</option>
                                    <option value="Invoice Generated">Invoice Generated</option>
                                    <option value="Ready for Delivery">Ready for Delivery</option>
                                    <option value="Assigned to Delivery">Assigned to Delivery</option>
                                    <option value="Delivered">Delivered</option>
                                  </>
                                ) : (
                                  <>
                                    <option value={ord.status}>{ord.status}</option>
                                    <option value="Received in China Warehouse">Received in China Warehouse</option>
                                    <option value="Received in BD Warehouse">Received in BD Warehouse</option>
                                    <option value="Stock Out">Stock Out</option>
                                  </>
                                )}
                              </select>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="space-y-2 inline-block text-left w-full min-w-[210px]">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              ক্যাটাগরি শিপিং রেট / KG:
                            </label>
                            <select
                              value={currentRate}
                              onChange={e => setCsShippingDrafts(prev => ({ ...prev, [ord.id]: Number(e.target.value) }))}
                              className="border border-emerald-300 rounded px-1.5 py-1 text-xs font-mono font-bold bg-white w-full"
                            >
                              <option value={780}>BDT 780 / KG — Cat A (পোশাক, জুতা, ব্যাগ)</option>
                              <option value={1200}>BDT 1,200 / KG — Cat B (ইলেকট্রনিক্স, গ্যাজেট, বিউটি)</option>
                              <option value={1450}>BDT 1,450 / KG — Cat C (ব্যাটারি, সেনসিটিভ পণ্য)</option>
                              <option value={450}>BDT 450 / KG — Sea Cargo (ভারী পণ্য/বাল্ক)</option>
                              <option value={650}>BDT 650 / KG — Air Economy</option>
                              <option value={950}>BDT 950 / KG — Air Express</option>
                            </select>
                          </div>
                          <button
                            onClick={async () => {
                              await handleUnifiedUpdate(ord.id, {
                                status: "Order Confirmed",
                                shippingRatePerKg: currentRate,
                                invoice: {
                                  ...(ord.invoice || {}),
                                  shippingRatePerKg: currentRate,
                                  shippingRate: currentRate
                                },
                                timelineNote: `Order confirmed by CS with applied category rate BDT ${currentRate}/KG (${catInfo.name})`
                              });
                              setSavedRoleActionMsg(`Order ${ord.id} confirmed with BDT ${currentRate}/KG!`);
                              setTimeout(() => setSavedRoleActionMsg(null), 3000);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-2xs transition"
                          >
                            ✓ {isPendingConfirm ? "কনফার্ম করুন (Confirm Order)" : "শিপিং রেট আপডেট করুন"}
                          </button>
                          <div className="flex justify-end">
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="text-[11px] text-slate-600 hover:text-primary font-semibold underline cursor-pointer"
                            >
                              View Order Details
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. PURCHASE DASHBOARD (#3)                                            */}
      {/* ===================================================================== */}
      {activeTab === "Purchase" && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-purple-950">
                3. Purchase Department Dashboard — 1688 Order ID & Tracking Number Upload System
              </h2>
              <p className="text-xs text-purple-700 mt-0.5">
                Upload <strong>1688 Order ID</strong> and <strong>Tracking Number</strong> here after purchasing. Once uploaded, both appear across <strong>CS & all staff dashboards</strong>, while the <strong>Customer Dashboard displays only the Tracking Number</strong>.
              </p>
            </div>
            <button
              onClick={() => setShowStockOutModal(true)}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              + Report Stock-Out / Product Issue
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                  <th className="py-3 px-4">Order ID & Customer</th>
                  <th className="py-3 px-4">Product, Specs & Image</th>
                  <th className="py-3 px-4">Upload 1688 ID & Tracking</th>
                  <th className="py-3 px-4">চায়না কুরিয়ার বিল (China Courier Bill)</th>
                  <th className="py-3 px-4">পারসেজ নোট (Notes)</th>
                  <th className="py-3 px-4">Purchase Status (চায়না WH / স্টক-আউট)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(ord => {
                  const current1688 =
                    purchaseDrafts[ord.id]?.order1688Id !== undefined
                      ? purchaseDrafts[ord.id].order1688Id
                      : getOrder1688Id(ord);
                  const currentTracking =
                    purchaseDrafts[ord.id]?.trackingNumber !== undefined
                      ? purchaseDrafts[ord.id].trackingNumber
                      : getOrderTrackingNo(ord);
                  const currentCourierBill =
                    purchaseCourierDrafts[ord.id] !== undefined
                      ? purchaseCourierDrafts[ord.id]
                      : Number(ord.invoice?.chinaCourierCharge ?? ord.invoice?.chinaCourier ?? ord.chinaCourierBill ?? 0);
                  const currentNote =
                    purchaseNotesDrafts[ord.id] !== undefined
                      ? purchaseNotesDrafts[ord.id]
                      : String(ord.purchaseInfo?.purchaseNote || ord.purchaseNote || "");

                  return (
                    <tr key={ord.id} className="hover:bg-gray-50 align-top">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-primary block">{ord.mainOrderId || ord.orderId || ord.id}</span>
                        {ord.subOrders && ord.subOrders.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-1">
                            {ord.subOrders.map((sub: any) => (
                              <span key={sub.subOrderId} className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded" title={sub.productName}>
                                {sub.subOrderId}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="font-semibold text-charcoal block mt-0.5">{ord.customerInfo?.name}</span>
                        <CustomerPhoneSecureDisplay
                          order={ord}
                          viewerDepartment="china warehouse"
                          isMasterAdmin={isSuperAdminAccount}
                        />
                        {savedPurchaseActionMsg && savedPurchaseActionMsg.id === ord.id && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ {savedPurchaseActionMsg.msg}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderOrderProductsCell(ord)}
                        <div className="font-bold text-charcoal text-[11px] mt-1">{ord.totalQuantity || 1} pcs • BDT {(ord.total || 0).toLocaleString()}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {/* Only Purchase Department and Admin can edit 1688 ID and Tracking Number */}
                        {currentRole === "Admin" || currentRole === "Purchase" ? (
                          <div className="space-y-1.5 min-w-[210px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-purple-800 w-16 shrink-0">1688 ID:</span>
                              <input
                                type="text"
                                value={current1688}
                                onChange={e =>
                                  setPurchaseDrafts(prev => ({
                                    ...prev,
                                    [ord.id]: {
                                      order1688Id: e.target.value,
                                      trackingNumber: currentTracking
                                    }
                                  }))
                                }
                                placeholder="Enter 1688 Order ID"
                                className="w-full border border-purple-300 rounded px-2 py-1 text-xs font-mono font-bold text-purple-950 bg-white focus:border-purple-600 focus:outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-blue-800 w-16 shrink-0">Tracking:</span>
                              <input
                                type="text"
                                value={currentTracking}
                                onChange={e =>
                                  setPurchaseDrafts(prev => ({
                                    ...prev,
                                    [ord.id]: {
                                      order1688Id: current1688,
                                      trackingNumber: e.target.value
                                    }
                                  }))
                                }
                                placeholder="Enter Tracking Number"
                                className="w-full border border-blue-300 rounded px-2 py-1 text-xs font-mono font-bold text-blue-950 bg-white focus:border-blue-600 focus:outline-none"
                              />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-0.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  await handleUnifiedUpdate(ord.id, {
                                    order1688Id: current1688.trim(),
                                    trackingNumber: currentTracking.trim(),
                                    status:
                                      ord.status === "Pending" || ord.status === "Order Placed" || ord.status === "Order Confirmed"
                                        ? "Purchased"
                                        : ord.status,
                                    purchaseInfo: {
                                      ...(ord.purchaseInfo || {}),
                                      status:
                                        ord.purchaseInfo?.status === "Pending Purchase" || !ord.purchaseInfo?.status
                                          ? "Purchased"
                                          : ord.purchaseInfo.status,
                                      order1688Id: current1688.trim(),
                                      orderSupplierId: current1688.trim(),
                                      trackingNumber: currentTracking.trim(),
                                      purchasedAt: new Date().toISOString()
                                    },
                                    timelineNote: `Uploaded 1688 Order ID (${current1688.trim() || "N/A"}) & Tracking Number (${currentTracking.trim() || "N/A"})`
                                  });
                                  setSavedPurchaseOrderId(ord.id);
                                  setTimeout(() => setSavedPurchaseOrderId(null), 3000);
                                }}
                                className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-800 text-white font-bold text-[10px] cursor-pointer transition shadow-2xs"
                              >
                                Save 1688 & Track
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 min-w-[180px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <div className="text-[11px] font-mono">
                              <span className="text-gray-500 font-bold">1688 ID: </span>
                              <span className="font-bold text-purple-900">{current1688 || "Pending Upload"}</span>
                            </div>
                            <div className="text-[11px] font-mono">
                              <span className="text-gray-500 font-bold">Tracking: </span>
                              <span className="font-bold text-blue-900">{currentTracking || "Pending Upload"}</span>
                            </div>
                          </div>
                        )}
                      </td>
                      {/* China Courier Bill Column */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-slate-500">BDT</span>
                            <input
                              type="number"
                              min="0"
                              value={currentCourierBill}
                              onChange={e =>
                                setPurchaseCourierDrafts(prev => ({
                                  ...prev,
                                  [ord.id]: Number(e.target.value)
                                }))
                              }
                              placeholder="Courier Bill"
                              className="w-24 border border-emerald-300 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-900 bg-white focus:border-emerald-600 focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSavePurchaseCourier(ord.id, currentCourierBill)}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded cursor-pointer transition shadow-2xs"
                          >
                            Save Bill
                          </button>
                        </div>
                      </td>
                      {/* Notes Column */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={currentNote}
                            onChange={e =>
                              setPurchaseNotesDrafts(prev => ({
                                ...prev,
                                [ord.id]: e.target.value
                              }))
                            }
                            placeholder="Add purchase notes..."
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 bg-white focus:border-purple-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePurchaseNote(ord.id, currentNote)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] rounded cursor-pointer transition shadow-2xs"
                          >
                            Save Note
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 min-w-[180px]">
                        <div className="space-y-1.5">
                          <select
                            value={ord.purchaseInfo?.status || ord.status || "Pending Purchase"}
                            onChange={e => {
                              const nextPurStatus = e.target.value;
                              const nextOrdStatus =
                                nextPurStatus === "Received in China Warehouse"
                                  ? "Received in China Warehouse"
                                  : nextPurStatus === "Stock Out"
                                  ? "Stock Out"
                                  : nextPurStatus === "Purchased"
                                  ? "Purchased"
                                  : ord.status;
                              handleUnifiedUpdate(ord.id, {
                                status: nextOrdStatus,
                                order1688Id: current1688.trim(),
                                trackingNumber: currentTracking.trim(),
                                purchaseInfo: {
                                  ...ord.purchaseInfo,
                                  status: nextPurStatus,
                                  order1688Id: current1688.trim(),
                                  orderSupplierId: current1688.trim(),
                                  trackingNumber: currentTracking.trim(),
                                  purchasedAt: new Date().toISOString()
                                },
                                timelineNote: `Purchase status updated to "${nextPurStatus}"`
                              });
                            }}
                            className="border border-purple-300 rounded-lg px-2 py-1 text-xs font-bold bg-purple-50 text-purple-900 cursor-pointer w-full"
                          >
                            <option value="Pending Purchase">Pending Purchase</option>
                            <option value="Purchased">Purchased</option>
                            <option value="Stock Out">Stock Out</option>
                            <option value="Received in China Warehouse">Received in China Warehouse</option>
                          </select>

                          {/* Quick 1-click status actions */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                handleUnifiedUpdate(ord.id, {
                                  status: "Received in China Warehouse",
                                  purchaseInfo: {
                                    ...(ord.purchaseInfo || {}),
                                    status: "Received in China Warehouse"
                                  },
                                  chinaWarehouseInfo: {
                                    ...(ord.chinaWarehouseInfo || {}),
                                    receivedAt: new Date().toISOString()
                                  },
                                  timelineNote: "Marked as Received in China Warehouse by Purchase Department"
                                });
                                setSavedPurchaseActionMsg({ id: ord.id, msg: "Received in China WH!" });
                                setTimeout(() => setSavedPurchaseActionMsg(null), 3000);
                              }}
                              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] rounded cursor-pointer transition border border-amber-300"
                            >
                              ✓ Received in China WH
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStockOutForm({
                                  ...stockOutForm,
                                  orderId: ord.id,
                                  customerName: ord.customerInfo?.name || "",
                                  productName: ord.items?.[0]?.name || "",
                                  productImage: ord.items?.[0]?.image || "",
                                  productLink: ord.items?.[0]?.importedUrl || "/shop",
                                  orderedQty: ord.totalQuantity || 1,
                                  availableQty: 0,
                                  stockOutQty: ord.totalQuantity || 1
                                });
                                setShowStockOutModal(true);
                              }}
                              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-900 font-bold text-[10px] rounded cursor-pointer transition border border-red-300"
                            >
                              ⚠️ Stock Out
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-100 text-charcoal font-bold text-[11px] hover:bg-gray-200 cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. MARKETING DASHBOARD & CUSTOMER ASSIGNMENT (#4)                     */}
      {/* ===================================================================== */}
      {activeTab === "Marketing" && (
        <div className="space-y-4">
          {/* Top KPI Cards for Cart & Wishlist Insights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Customers</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">{customers.length} users</div>
              <span className="text-[10px] text-slate-400">Registered & buyer accounts</span>
            </div>

            <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-800 uppercase block">Active Carts</span>
                <ShoppingCart className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-xl font-black text-sky-950 mt-0.5">
                {customers.filter(c => c.cart && c.cart.length > 0).length} users
              </div>
              <span className="text-[10px] font-bold text-sky-700">
                Total Value: Tk {customers.reduce((sum, c) => sum + (Number(c.cartTotal) || 0), 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800 uppercase block">Wishlists</span>
                <Heart className="w-4 h-4 text-rose-600 fill-rose-500" />
              </div>
              <div className="text-xl font-black text-rose-950 mt-0.5">
                {customers.filter(c => c.wishlist && c.wishlist.length > 0).length} users
              </div>
              <span className="text-[10px] text-rose-600 font-semibold">Saved & favorited products</span>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 uppercase block">Hot Leads</span>
                <Flame className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-black text-amber-950 mt-0.5">
                {customers.filter(c => c.cart?.length > 0 && c.wishlist?.length > 0).length} users
              </div>
              <span className="text-[10px] text-amber-700 font-semibold">Both Cart & Wishlist active</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-emerald-950">
                4. Marketing Dashboard — Customer Profiles, Cart/Wishlist & Assignments
              </h2>
              <p className="text-xs text-emerald-700 mt-0.5">
                Review products left in customer carts and wishlists, then follow up via WhatsApp and phone to close sales.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name, phone or product..."
                  value={marketingSearch}
                  onChange={(e) => setMarketingSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-emerald-300 bg-white text-slate-800 font-medium w-48 sm:w-56 outline-none focus:border-emerald-600"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={marketingCartFilter}
                onChange={e => setMarketingCartFilter(e.target.value as any)}
                className="border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold bg-white text-emerald-950 cursor-pointer"
              >
                <option value="all">All Customers ({customers.length})</option>
                <option value="cart_only">🛒 Cart Products Only ({customers.filter(c => c.cart?.length > 0).length})</option>
                <option value="wishlist_only">❤️ Wishlist Only ({customers.filter(c => c.wishlist?.length > 0).length})</option>
                <option value="both">🔥 Both Cart & Wishlist ({customers.filter(c => c.cart?.length > 0 && c.wishlist?.length > 0).length})</option>
              </select>
            <button
              type="button"
              onClick={() => setShowMarketingTiersModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Target className="w-4 h-4" />
              <span>🎯 মার্কেটিং টার্গেট ও কাস্টমার ব্র্যাকেট দেখুন</span>
            </button>

              <select
                value={selectedMarketingEmpId}
                onChange={e => setSelectedMarketingEmpId(e.target.value)}
                className="border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold bg-white text-emerald-950 cursor-pointer"
              >
                <option value="all">All Marketing Employees</option>
                {employees
                  .filter(e => e.role === "Marketing" || e.department === "Marketing" || e.role === "Sales Person")
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                  <th className="py-3 px-4">Customer Profile</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 bg-amber-50/80 text-amber-900 border-x border-amber-200">
                    <div className="flex items-center gap-1.5 font-bold">
                      <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                      <span>Login Password</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 bg-sky-50/90 text-sky-950 border-x border-sky-200 min-w-[220px]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShoppingCart className="w-3.5 h-3.5 text-sky-700" />
                      <span>Cart & Wishlist Products</span>
                    </div>
                  </th>
                  <th className="py-3 px-4">Order History & Activity</th>
                  <th className="py-3 px-4">Assigned Marketing Employee</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers
                  .filter(c => {
                    const matchesEmp = selectedMarketingEmpId === "all" || c.assignedMarketingId === selectedMarketingEmpId;
                    if (!matchesEmp) return false;

                    const hasCart = Array.isArray(c.cart) && c.cart.length > 0;
                    const hasWishlist = Array.isArray(c.wishlist) && c.wishlist.length > 0;

                    if (marketingCartFilter === "cart_only" && !hasCart) return false;
                    if (marketingCartFilter === "wishlist_only" && !hasWishlist) return false;
                    if (marketingCartFilter === "both" && (!hasCart || !hasWishlist)) return false;

                    if (marketingSearch.trim()) {
                      const term = marketingSearch.toLowerCase().trim();
                      const nameMatch = (c.name || "").toLowerCase().includes(term);
                      const phoneMatch = (c.phone || "").toLowerCase().includes(term);
                      const cartProdMatch = (c.cart || []).some((item: any) => (item.name || "").toLowerCase().includes(term));
                      const wishProdMatch = (c.wishlist || []).some((item: any) => (item.name || "").toLowerCase().includes(term));
                      return nameMatch || phoneMatch || cartProdMatch || wishProdMatch;
                    }

                    return true;
                  })
                  .map(cust => {
                    const activePass = cust.password || cust.lastLoginPassword || "123456";
                    const isPassVisible = Boolean(showTablePasswords[cust.id]);
                    const cleanPhone = String(cust.phone || "").replace(/^0/, "").replace(/[^0-9]/g, "");
                    const isCustPhoneVisible = canViewCustomerPhone({
                      customer: cust,
                      viewerDepartment: currentRole === "Admin" ? "admin" : currentRole?.toLowerCase(),
                      viewerRole: currentRole,
                      viewerStaff: storedUser ? { id: storedUser.id, name: storedUser.name, email: storedUser.email } : undefined,
                      isMasterAdmin: isSuperAdminAccount || currentRole === "Admin"
                    });
                    const waMsg = `Hello ${cust.name || "Customer"}, your World Buy BD login password is: ${activePass}. You can log in directly using this password.`;

                    const cartItems = Array.isArray(cust.cart) ? cust.cart : [];
                    const wishlistItems = Array.isArray(cust.wishlist) ? cust.wishlist : [];
                    const cartTotal = cust.cartTotal || cartItems.reduce((sum: number, it: any) => sum + (Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1)), 0);

                    return (
                      <tr key={cust.id} className="hover:bg-gray-50">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-charcoal text-sm">{cust.name}</div>
                          <div className="font-mono text-[11px] text-gray-400">ID: {cust.id}</div>
                          {cust.lastLoginAt && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Login: {new Date(cust.lastLoginAt).toLocaleDateString("en-US")}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <CustomerPhoneSecureDisplay
                            customer={cust}
                            phone={cust.phone}
                            viewerDepartment={currentRole === "Admin" ? "admin" : currentRole?.toLowerCase()}
                            viewerRole={currentRole}
                            viewerStaff={storedUser ? { id: storedUser.id, name: storedUser.name, email: storedUser.email } : undefined}
                            isMasterAdmin={isSuperAdminAccount || currentRole === "Admin"}
                          />
                          <div className="text-gray-500">{cust.email || "—"}</div>
                          <div className="text-[11px] text-gray-400">{cust.address}</div>
                        </td>
                        <td className="py-3.5 px-4 bg-amber-50/30 border-x border-amber-100">
                          {isSuperAdminAccount || currentRole === "Admin" ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs sm:text-sm bg-white px-2.5 py-1 rounded-md border border-amber-300 text-slate-900 shadow-2xs select-all">
                                  {isPassVisible ? activePass : "••••••••"}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleShowTablePassword(cust.id)}
                                    title={isPassVisible ? "Hide password" : "Show password"}
                                    className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-amber-100 cursor-pointer transition"
                                  >
                                    {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-700" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyTablePassword(activePass, cust.id)}
                                    title="Copy password"
                                    className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer transition"
                                  >
                                    {copiedPassId === cust.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  {cleanPhone && isCustPhoneVisible && (
                                    <a
                                      href={`https://wa.me/880${cleanPhone}?text=${encodeURIComponent(waMsg)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Send password to customer on WhatsApp"
                                      className="p-1 rounded text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 cursor-pointer transition"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                              {copiedPassId === cust.id && (
                                <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                                  ✓ Password Copied!
                                </span>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs py-1">
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                শুধুমাত্র এডমিন অ্যাক্সেস
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Customer Cart & Wishlist Column */}
                        <td className="py-3.5 px-4 bg-sky-50/25 border-x border-sky-100">
                          <div className="space-y-1.5">
                            {cartItems.length > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewCartModalCust({ ...cust, viewType: "cart" })}
                                  className="inline-flex items-center gap-1.5 bg-sky-100 hover:bg-sky-200 text-sky-950 border border-sky-300 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs"
                                  title="Click to view cart items"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5 text-sky-700" />
                                  <span>Cart ({cartItems.length})</span>
                                  <span className="bg-white px-1.5 py-0.5 rounded text-[10px] text-sky-900 border border-sky-200">
                                    Tk {cartTotal.toLocaleString()}
                                  </span>
                                </button>

                                {cleanPhone && isCustPhoneVisible && (
                                  <a
                                    href={`https://wa.me/880${cleanPhone}?text=${encodeURIComponent(`Hello ${cust.name || "Customer"}, you have ${cartItems.length} item(s) in your World Buy BD cart (Total Tk ${cartTotal.toLocaleString()}). We are available to assist you in completing your order.`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Send cart reminder on WhatsApp"
                                    className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 cursor-pointer transition"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            ) : null}

                            {wishlistItems.length > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewCartModalCust({ ...cust, viewType: "wishlist" })}
                                  className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs"
                                  title="Click to view wishlist items"
                                >
                                  <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-500" />
                                  <span>Wishlist ({wishlistItems.length})</span>
                                </button>

                                {cleanPhone && isCustPhoneVisible && (
                                  <a
                                    href={`https://wa.me/880${cleanPhone}?text=${encodeURIComponent(`Hello ${cust.name || "Customer"}, your wishlisted ${wishlistItems.length} item(s) on World Buy BD currently have special promotions available!`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Send wishlist offer on WhatsApp"
                                    className="p-1 rounded-md bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 cursor-pointer transition"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            ) : null}

                            {cartItems.length === 0 && wishlistItems.length === 0 && (
                              <span className="text-slate-400 text-[11px] italic">No products saved</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-emerald-800">
                            {(cust.orders || []).length} Orders | Total Spent: BDT {(cust.totalSpent || 0).toLocaleString()}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(cust.orders || []).map((co: any) => (
                              <span
                                key={co.id}
                                onClick={() => {
                                  const fullOrd = orders.find(o => o.id === co.id);
                                  if (fullOrd) setSelectedOrder(fullOrd);
                                }}
                                className="px-2 py-0.5 rounded bg-gray-100 hover:bg-primary hover:text-white font-mono text-[10px] font-bold cursor-pointer transition"
                              >
                                {co.id} ({co.status})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {(isSuperAdminAccount || currentRole === "Admin") ? (
                            <select
                              value={cust.assignedMarketingId || ""}
                              onChange={e => handleAssignCustomer(cust, e.target.value)}
                              className="border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-900 cursor-pointer"
                              title="Assign Marketing Manager (Main Admin only)"
                            >
                              <option value="">-- মার্কেটিং অফিসার নির্বাচন করুন --</option>
                              {employees
                                .filter(e => e.role === "Marketing" || e.department === "Marketing" || e.role === "Sales Person")
                                .map(emp => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.name}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs inline-block">
                                {cust.assignedMarketingName || "নট অ্যাসাইনড"}
                              </span>
                              <span className="text-[10px] text-slate-400 italic">
                                (এসাইন করার অধিকার শুধু মেইন এডমিনের)
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedCustomerProfile(cust)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Password & Profile</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. STOCK-OUT / PRODUCT AVAILABILITY MANAGEMENT (#5)                   */}
      {/* ===================================================================== */}
      {activeTab === "Stock-Out" && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-red-950">
                5. Stock-Out / Product Availability Management
              </h2>
              <p className="text-xs text-red-700 mt-0.5">
                Monitor all confirmed products that became unavailable or out of stock, including Ordered Qty, Available Qty, Stock-Out Qty, Reason & Resolution Status.
              </p>
            </div>
            <button
              onClick={() => setShowStockOutModal(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Record Stock-Out Case
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                  <th className="py-3 px-4">Order ID & Customer</th>
                  <th className="py-3 px-4">Product & Source Link</th>
                  <th className="py-3 px-4">Ordered / Available / Stock-Out</th>
                  <th className="py-3 px-4">Date/Time & Reason</th>
                  <th className="py-3 px-4">Resolution Status & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stockOuts.map(so => (
                  <tr key={so.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4">
                      <span
                        onClick={() => {
                          const ord = orders.find(o => o.id === so.orderId);
                          if (ord) setSelectedOrder(ord);
                        }}
                        className="font-mono font-black text-primary cursor-pointer hover:underline block"
                      >
                        {so.orderId}
                      </span>
                      <span className="font-bold text-charcoal">{so.customerName}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {so.productImage && (
                          <img src={so.productImage} alt="" className="w-10 h-10 rounded object-cover border" referrerPolicy="no-referrer" />
                        )}
                        <div>
                          <div className="font-bold text-charcoal max-w-xs">{so.productName}</div>
                          {canAccessProductSourceLink({ isMasterAdmin: isSuperAdminAccount || currentRole === "Admin", viewerDepartment: currentRole }) ? (
                            <a
                              href={so.productLink || "/shop"}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                            >
                              Product Link <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium inline-flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>সোর্স লিঙ্ক সুরক্ষিত</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>Ordered: <strong>{so.orderedQty} pcs</strong></div>
                      <div className="text-emerald-700">Available: <strong>{so.availableQty} pcs</strong></div>
                      <div className="text-red-600 font-black">Stock-Out: {so.stockOutQty} pcs</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-gray-500">{so.dateTime}</div>
                      <div className="font-semibold text-red-800 mt-0.5">{so.reason}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={so.resolutionStatus}
                        onChange={async e => {
                          await fetch("/api/admin/stock-outs", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...so, resolutionStatus: e.target.value })
                          });
                          await fetchHubData();
                        }}
                        className="border border-red-300 rounded-lg px-2.5 py-1 text-xs font-bold bg-red-50 text-red-900 mb-1"
                      >
                        <option value="Pending Customer Decision">Pending Customer Decision</option>
                        <option value="Partial Shipped / Refund Adjusted">Partial Shipped / Refund Adjusted</option>
                        <option value="Replaced with Alternative Supplier">Replaced with Alternative Supplier</option>
                        <option value="Full Refund Processed">Full Refund Processed</option>
                      </select>
                      <div className="text-[11px] text-gray-500">{so.notes}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. CHINA WAREHOUSE DASHBOARD (#6)                                     */}
      {/* ===================================================================== */}
      {activeTab === "China Warehouse" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h2 className="text-lg font-bold text-amber-950">
              6. China Warehouse Dashboard — Status: Received in China Warehouse
            </h2>
            <p className="text-xs text-amber-800 mt-0.5">
              Record Order ID, Customer, Product, Ordered Quantity, Received Quantity, Missing/Damaged Quantity, Receiving Date & Warehouse Notes.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                  <th className="py-3 px-4">Order ID & Customer</th>
                  <th className="py-3 px-4">Product & Ordered Qty</th>
                  <th className="py-3 px-4">Received & Missing/Damaged Qty</th>
                  <th className="py-3 px-4">Receiving Date & Warehouse Notes</th>
                  <th className="py-3 px-4 text-right">China WH Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4">
                      {renderOrderIdCell(ord)}
                      <span className="font-bold text-charcoal block mt-0.5">{ord.customerInfo?.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {renderOrderProductsCell(ord)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 block">Received Qty</label>
                          <input
                            type="number"
                            defaultValue={ord.chinaWarehouseInfo?.receivedQty ?? ord.totalQuantity ?? 1}
                            onBlur={e =>
                              handleUnifiedUpdate(ord.id, {
                                chinaWarehouseInfo: {
                                  ...ord.chinaWarehouseInfo,
                                  receivedQty: Number(e.target.value)
                                }
                              })
                            }
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-red-500 block">Missing/Damaged</label>
                          <input
                            type="number"
                            defaultValue={ord.chinaWarehouseInfo?.missingDamagedQty ?? 0}
                            onBlur={e =>
                              handleUnifiedUpdate(ord.id, {
                                chinaWarehouseInfo: {
                                  ...ord.chinaWarehouseInfo,
                                  missingDamagedQty: Number(e.target.value)
                                }
                              })
                            }
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-xs font-bold text-red-600"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-gray-500 mb-1">
                        Date: {ord.chinaWarehouseInfo?.receivedAt ? new Date(ord.chinaWarehouseInfo.receivedAt).toLocaleDateString() : "Not received yet"}
                      </div>
                      <input
                        type="text"
                        placeholder="Add China Warehouse notes..."
                        defaultValue={ord.chinaWarehouseInfo?.notes || ""}
                        onBlur={e =>
                          handleUnifiedUpdate(ord.id, {
                            chinaWarehouseInfo: {
                              ...ord.chinaWarehouseInfo,
                              notes: e.target.value
                            }
                          })
                        }
                        className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right space-y-1">
                      <button
                        onClick={() =>
                          handleUnifiedUpdate(ord.id, {
                            status: "Received in China Warehouse",
                            chinaWarehouseInfo: {
                              ...ord.chinaWarehouseInfo,
                              received: true,
                              receivedAt: new Date().toISOString(),
                              receivedQty: ord.chinaWarehouseInfo?.receivedQty || ord.totalQuantity || 1
                            },
                            timelineNote: "Products received & verified in China Warehouse"
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs block ml-auto cursor-pointer"
                      >
                        ✓ Mark Received in China WH
                      </button>
                      <button
                        onClick={() =>
                          handleUnifiedUpdate(ord.id, {
                            status: "Shipped to Bangladesh",
                            timelineNote: "Shipment dispatched from China Warehouse to Bangladesh"
                          })
                        }
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px] block ml-auto cursor-pointer"
                      >
                        ✈ Mark Shipped to BD
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. BD CUSTOMS DASHBOARD (#7)                                          */}
      {/* ===================================================================== */}
      {activeTab === "BD Customs" && (
        <div className="space-y-4">
          <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4">
            <h2 className="text-lg font-bold text-cyan-950">
              7. BD Customs Dashboard — Status: Received in BD Customs
            </h2>
            <p className="text-xs text-cyan-800 mt-0.5">
              Update Bangladesh customs arrival, shipment reference, and customs clearance status.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                  <th className="py-3 px-4">Order ID & Customer</th>
                  <th className="py-3 px-4">Product & Qty</th>
                  <th className="py-3 px-4">Shipment Ref & Clearance Status</th>
                  <th className="py-3 px-4">Customs Notes</th>
                  <th className="py-3 px-4 text-right">Customs Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4">
                      {renderOrderIdCell(ord)}
                      <span className="font-bold text-charcoal block mt-0.5">{ord.customerInfo?.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {renderOrderProductsCell(ord)}
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <input
                        type="text"
                        placeholder="Shipment Ref (e.g. DAC-CUST-901)"
                        defaultValue={ord.bdCustomsInfo?.shipmentRef || ""}
                        onBlur={e =>
                          handleUnifiedUpdate(ord.id, {
                            bdCustomsInfo: { ...ord.bdCustomsInfo, shipmentRef: e.target.value }
                          })
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                      />
                      <select
                        value={ord.bdCustomsInfo?.clearanceStatus || "Pending"}
                        onChange={e =>
                          handleUnifiedUpdate(ord.id, {
                            bdCustomsInfo: { ...ord.bdCustomsInfo, clearanceStatus: e.target.value }
                          })
                        }
                        className="border border-cyan-300 rounded px-2 py-1 text-xs font-bold bg-cyan-50 text-cyan-900 w-full"
                      >
                        <option value="Pending">Pending Arrival</option>
                        <option value="Under Customs Assessment">Under Customs Assessment</option>
                        <option value="Cleared">Cleared from BD Customs</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        placeholder="Customs notes..."
                        defaultValue={ord.bdCustomsInfo?.notes || ""}
                        onBlur={e =>
                          handleUnifiedUpdate(ord.id, {
                            bdCustomsInfo: { ...ord.bdCustomsInfo, notes: e.target.value }
                          })
                        }
                        className="border border-gray-300 rounded px-2.5 py-1.5 text-xs w-full"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() =>
                          handleUnifiedUpdate(ord.id, {
                            status: "Received in BD Customs",
                            bdCustomsInfo: {
                              ...ord.bdCustomsInfo,
                              received: true,
                              receivedAt: new Date().toISOString(),
                              clearanceStatus: "Under Customs Assessment"
                            },
                            timelineNote: "Shipment received in BD Customs"
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs cursor-pointer"
                      >
                        ✓ Mark Received in BD Customs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. BD WAREHOUSE DASHBOARD (#8)                                        */}
      {/* ===================================================================== */}
      {activeTab === "BD Warehouse" && (
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
            <h2 className="text-lg font-bold text-teal-950">
              8. BD Warehouse Dashboard — Status: Received in BD Warehouse
            </h2>
            <p className="text-xs text-teal-800 mt-0.5">
              Update Received Date, Order ID, Customer, Product, Quantity, Package Info, Damage/Missing Info & Warehouse Notes.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                  <th className="py-3 px-4">Order ID & Customer</th>
                  <th className="py-3 px-4">Product & Qty</th>
                  <th className="py-3 px-4">Package Info & Damage/Missing</th>
                  <th className="py-3 px-4">BD Warehouse Notes</th>
                  <th className="py-3 px-4 text-right">BD WH Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4">
                      {renderOrderIdCell(ord)}
                      <span className="font-bold text-charcoal block mt-0.5">{ord.customerInfo?.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {renderOrderProductsCell(ord)}
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <input
                        type="text"
                        placeholder="Package Info (e.g. 1 Carton 5.5 KG)"
                        defaultValue={ord.bdWarehouseInfo?.packageInfo || ""}
                        onBlur={e =>
                          handleUnifiedUpdate(ord.id, {
                            bdWarehouseInfo: { ...ord.bdWarehouseInfo, packageInfo: e.target.value }
                          })
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                      />
                      <input
                        type="text"
                        placeholder="Damage / Missing Info"
                        defaultValue={ord.bdWarehouseInfo?.damageMissingInfo || "None"}
                        onBlur={e =>
                          handleUnifiedUpdate(ord.id, {
                            bdWarehouseInfo: { ...ord.bdWarehouseInfo, damageMissingInfo: e.target.value }
                          })
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        placeholder="BD Warehouse rack/shelf notes..."
                        defaultValue={ord.bdWarehouseInfo?.notes || ""}
                        onBlur={e =>
                          handleUnifiedUpdate(ord.id, {
                            bdWarehouseInfo: { ...ord.bdWarehouseInfo, notes: e.target.value }
                          })
                        }
                        className="border border-gray-300 rounded px-2.5 py-1.5 text-xs w-full"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() =>
                          handleUnifiedUpdate(ord.id, {
                            status: "Received in BD Warehouse",
                            bdWarehouseInfo: {
                              ...ord.bdWarehouseInfo,
                              received: true,
                              receivedAt: new Date().toISOString(),
                              receivedQty: ord.totalQuantity || 1
                            },
                            timelineNote: "Checked into Bangladesh Warehouse"
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer"
                      >
                        ✓ Mark Received in BD WH
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9 & 12. DELIVERY DASHBOARD & COMPLETION WORKFLOW (#9, #12)            */}
      {/* ===================================================================== */}
      {activeTab === "Delivery" && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <h2 className="text-lg font-bold text-emerald-950">
              9 & 12. Delivery Department Dashboard — Invoice Generation, Courier & Delivery Completion
            </h2>
            <p className="text-xs text-emerald-800 mt-0.5">
              Workflow: <strong>Received in BD Warehouse → Invoice Processing → Invoice Ready → Ready for Delivery → Assigned to Delivery → Delivered</strong>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                  <th className="py-3 px-4">Order ID & Invoice</th>
                  <th className="py-3 px-4">Customer Info</th>
                  <th className="py-3 px-4">Ordered Products, Specs & Qty</th>
                  <th className="py-3 px-4">Parcel Weight (Delivery Only) & Courier</th>
                  <th className="py-3 px-4">Delivery Workflow Status</th>
                  <th className="py-3 px-4 text-right">Invoice & Completion Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(ord => {
                  const canEditWeight = currentRole === "Admin" || currentRole === "Delivery";
                  const currentKg = deliveryWeightDrafts[ord.id] !== undefined ? deliveryWeightDrafts[ord.id] : getOrderWeightKg(ord);
                  const isDelivered = ord.status === "Delivered" || ord.deliveryInfo?.status === "Delivered";

                  return (
                    <tr key={ord.id} className="hover:bg-gray-50 align-top">
                      <td className="py-3.5 px-4">
                        {renderOrderIdCell(ord)}
                        <span className="text-[11px] font-mono text-emerald-700 font-bold block mt-0.5">
                          {ord.invoice?.invoiceNumber || "Invoice Pending"}
                        </span>
                        <span className="block font-bold text-charcoal mt-0.5">
                          BDT {(ord.invoice?.totalAmount ?? ord.total ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-charcoal">{ord.customerInfo?.name}</div>
                        <CustomerPhoneSecureDisplay
                          order={ord}
                          viewerDepartment="warehouse"
                          isMasterAdmin={isSuperAdminAccount}
                        />
                        <div className="text-[11px] text-gray-400 max-w-xs">{ord.customerInfo?.address}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderOrderProductsCell(ord)}
                      </td>
                      <td className="py-3.5 px-4 space-y-1.5">
                        {/* Only Delivery Department and Admin can edit Parcel Weight */}
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                            Parcel Weight (KG) {!canEditWeight && <span className="text-amber-700 font-normal">(Delivery Dept Only)</span>}:
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              disabled={!canEditWeight}
                              value={currentKg}
                              onChange={e => setDeliveryWeightDrafts(prev => ({ ...prev, [ord.id]: Number(e.target.value) }))}
                              className={`border rounded px-2 py-1 text-xs font-mono font-bold w-20 ${
                                !canEditWeight
                                  ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                                  : "bg-white text-slate-900 border-emerald-300 focus:border-emerald-600 focus:outline-none"
                              }`}
                            />
                            <span className="text-xs font-bold text-slate-700">KG</span>
                            {canEditWeight && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const rate = Number(ord.shippingRatePerKg || ord.invoice?.shippingRatePerKg || 780);
                                  const shipCharge = Math.round(currentKg * rate);
                                  await handleUnifiedUpdate(ord.id, {
                                    weightKg: currentKg,
                                    weight: `${currentKg} KG`,
                                    invoice: {
                                      ...(ord.invoice || {}),
                                      weightKg: currentKg,
                                      weight: `${currentKg} KG`,
                                      weightApx: `${currentKg} KG`,
                                      shippingCharge: shipCharge,
                                      adminChargesUploaded: true
                                    },
                                    timelineNote: `Delivery Dept updated Parcel Weight: ${currentKg} KG (Shipping BDT ${shipCharge})`
                                  });
                                  setSavedRoleActionMsg(`Saved weight ${currentKg} KG for Order ${ord.id}!`);
                                  setTimeout(() => setSavedRoleActionMsg(null), 3000);
                                }}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer transition shadow-2xs"
                              >
                                Save Weight
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Courier (e.g. Steadfast / Pathao)"
                          defaultValue={ord.deliveryInfo?.courierName || "Steadfast Courier"}
                          onBlur={e =>
                            handleUnifiedUpdate(ord.id, {
                              deliveryInfo: { ...ord.deliveryInfo, courierName: e.target.value }
                            })
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                        />
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="Tracking No"
                            defaultValue={ord.deliveryInfo?.trackingNumber || ""}
                            onBlur={e =>
                              handleUnifiedUpdate(ord.id, {
                                deliveryInfo: { ...ord.deliveryInfo, trackingNumber: e.target.value }
                              })
                            }
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-1/2 font-mono"
                          />
                          <input
                            type="text"
                            placeholder="Delivery Staff"
                            defaultValue={ord.deliveryInfo?.deliveryEmployee || "Delivery Team"}
                            onBlur={e =>
                              handleUnifiedUpdate(ord.id, {
                                deliveryInfo: { ...ord.deliveryInfo, deliveryEmployee: e.target.value }
                              })
                            }
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-1/2"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={ord.status}
                          onChange={e => {
                            const nextSt = e.target.value;
                            const nowDate = new Date().toISOString().slice(0, 10);
                            const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                            handleUnifiedUpdate(ord.id, {
                              status: nextSt,
                              deliveryInfo: {
                                ...ord.deliveryInfo,
                                status: nextSt,
                                deliveredAt: nextSt === "Delivered" ? nowDate : ord.deliveryInfo?.deliveredAt,
                                deliveredTime: nextSt === "Delivered" ? nowTime : ord.deliveryInfo?.deliveredTime
                              },
                              timelineNote:
                                nextSt === "Delivered"
                                  ? `Delivered on ${nowDate} at ${nowTime} via ${ord.deliveryInfo?.courierName || "Courier"}`
                                  : `Delivery workflow updated to ${nextSt}`
                            });
                          }}
                          className="border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-950 cursor-pointer w-full"
                        >
                          {currentRole === "Admin" ? (
                            <>
                              <option value="Order Placed">Order Placed</option>
                              <option value="Order Confirmed">Order Confirmed</option>
                              <option value="Purchased">Purchased</option>
                              <option value="Stock Out">Stock Out</option>
                              <option value="Received in China Warehouse">Received in China Warehouse</option>
                              <option value="Received in BD Customs">Received in BD Customs</option>
                              <option value="Received in BD Warehouse">Received in BD Warehouse</option>
                              <option value="Invoice Generated">Invoice Generated</option>
                              <option value="Ready for Delivery">Ready for Delivery</option>
                              <option value="Assigned to Delivery">Assigned to Delivery</option>
                              <option value="Delivered">Delivered (Admin)</option>
                            </>
                          ) : (
                            <>
                              {ord.status === "Delivered" ? (
                                <option value="Delivered" disabled>Delivered (Admin Confirmation Only)</option>
                              ) : (
                                <option value={ord.status}>{ord.status}</option>
                              )}
                              <option value="Ready for Delivery">Ready for Delivery</option>
                              <option value="Assigned to Delivery">Assigned to Delivery</option>
                            </>
                          )}
                        </select>
                        {ord.deliveryInfo?.deliveredAt && (
                          <div className="text-[10px] text-emerald-700 font-bold mt-1">
                            Delivered: {ord.deliveryInfo.deliveredAt} {ord.deliveryInfo.deliveredTime}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white font-bold text-xs hover:bg-primary-dark cursor-pointer inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Generate / Print Invoice
                        </button>
                        {currentRole === "Admin" && !isDelivered && (
                          <button
                            onClick={() => {
                              const nowDate = new Date().toISOString().slice(0, 10);
                              const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                              handleUnifiedUpdate(ord.id, {
                                status: "Delivered",
                                deliveryInfo: {
                                  ...ord.deliveryInfo,
                                  status: "Delivered",
                                  deliveredAt: nowDate,
                                  deliveredTime: nowTime
                                },
                                timelineNote: `Delivery completed on ${nowDate} at ${nowTime}`
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                          >
                            ✓ Mark Delivered
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 10 & 11. INVOICE MANAGEMENT & ACCOUNTS DASHBOARD (#10, #11)           */}
      {/* ===================================================================== */}
      {(activeTab === "Invoices" || activeTab === "Accounts") && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-indigo-950">
                {activeTab === "Accounts"
                  ? "11. Accounts Department Dashboard — Financial & Invoice Records"
                  : "10. Centralized Invoice Management System"}
              </h2>
              <p className="text-xs text-indigo-800 mt-0.5">
                <strong>Accounts Access:</strong> View complete customer order details with photos, financial ledger, and final delivery status.
                <span className="ml-1 text-slate-600 font-semibold">(Status modification restricted to Admin & Operations).</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                  <th className="py-3 px-4">Invoice No & Date</th>
                  <th className="py-3 px-4">Order ID & Customer</th>
                  <th className="py-3 px-4">Ordered Products, Specs & Qty</th>
                  <th className="py-3 px-4">Financial Ledger Breakdown</th>
                  <th className="py-3 px-4">Payment & Final Delivery Status</th>
                  <th className="py-3 px-4 text-right">Invoice Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(ord => {
                  const inv = ord.invoice || {
                    invoiceNumber: `INV-${ord.id}`,
                    invoiceDate: (ord.date || "").slice(0, 10),
                    productTotal: ord.total || 0,
                    shippingCharge: 0,
                    discount: 0,
                    totalAmount: ord.total || 0,
                    collectedAmount: ord.paymentStatus === "Paid" ? ord.total : 0
                  };
                  const isDelivered = ord.status === "Delivered" || ord.deliveryInfo?.status === "Delivered";

                  return (
                    <tr key={ord.id} className="hover:bg-gray-50 align-top">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-indigo-700 block">{inv.invoiceNumber}</span>
                        <span className="text-[11px] text-gray-400">Invoice Date: {inv.invoiceDate}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderOrderIdCell(ord)}
                        <div className="font-bold text-charcoal mt-0.5">{ord.customerInfo?.name}</div>
                        <CustomerPhoneSecureDisplay
                          order={ord}
                          viewerDepartment="delivery"
                          isMasterAdmin={isSuperAdminAccount}
                        />
                        <div className="text-[11px] text-gray-400 max-w-[180px] line-clamp-1">{ord.customerInfo?.address}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderOrderProductsCell(ord)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div>Products ({ord.totalQuantity || 1} pcs): <strong>BDT {(inv.productTotal || ord.total || 0).toLocaleString()}</strong></div>
                        <div className="text-[11px] text-gray-500">
                          Shipping: BDT {inv.shippingCharge || 0} | China Courier: BDT {inv.chinaCourier || 0}
                        </div>
                        <div className="font-black text-emerald-800">
                          Total Invoice: BDT {(inv.totalAmount || ord.total || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono">
                          Paid: BDT {(inv.paidAmount ?? inv.collectedAmount ?? 0).toLocaleString()} | Due: BDT {(inv.totalDue ?? 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          Payment: {ord.paymentStatus || "Pending"}
                        </span>
                        <div>
                          {isDelivered ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                              ✓ Delivered {ord.deliveryInfo?.deliveredAt ? `(${ord.deliveryInfo.deliveredAt})` : ""}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {ord.status}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Status change restricted (Admin only)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openOrderWithTab(ord, "invoice")}
                          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View / Print Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 13 & 14. DAILY DELIVERY & INVOICE REPORTING + HISTORY SEARCH          */}
      {/* ===================================================================== */}
      {activeTab === "Daily Reports" && (
        <div className="space-y-6">
          {/* Date & Report Mode Selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-charcoal">
                13. Automatic Daily Delivery & Invoice Reporting System
              </h2>
              <p className="text-xs text-gray-500">
                Real-time automated calculation from order and invoice statuses — zero manual counting required.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["daily", "weekly", "monthly", "custom"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setReportPeriodMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                    reportPeriodMode === mode
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {mode} Report
                </button>
              ))}

              {reportPeriodMode === "daily" && (
                <input
                  type="date"
                  value={reportDate}
                  onChange={e => setReportDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold"
                />
              )}

              {reportPeriodMode === "custom" && (
                <div className="flex items-center gap-1.5 text-xs">
                  <input
                    type="date"
                    value={reportRangeStart}
                    onChange={e => setReportRangeStart(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={reportRangeEnd}
                    onChange={e => setReportRangeEnd(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Automated Daily Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Invoices Generated", val: dailyReportMetrics.invoicesGenerated, bg: "bg-indigo-50 border-indigo-200 text-indigo-900" },
              { label: "Ready for Delivery", val: dailyReportMetrics.readyForDelivery, bg: "bg-sky-50 border-sky-200 text-sky-900" },
              { label: "Assigned for Delivery", val: dailyReportMetrics.assignedForDelivery, bg: "bg-purple-50 border-purple-200 text-purple-900" },
              { label: "Products Scheduled (Qty)", val: `${dailyReportMetrics.productsScheduledQty} pcs`, bg: "bg-teal-50 border-teal-200 text-teal-900" },
              { label: "Total Orders Delivered", val: dailyReportMetrics.ordersDelivered, bg: "bg-emerald-50 border-emerald-200 text-emerald-900" },
              { label: "Total Products Delivered", val: `${dailyReportMetrics.productsDeliveredQty} pcs`, bg: "bg-green-50 border-green-200 text-green-900" },
              { label: "Pending Deliveries", val: dailyReportMetrics.pendingDeliveries, bg: "bg-amber-50 border-amber-200 text-amber-900" },
              { label: "Cancelled Deliveries", val: dailyReportMetrics.cancelledDeliveries, bg: "bg-red-50 border-red-200 text-red-900" },
              { label: "Returned Deliveries", val: dailyReportMetrics.returnedDeliveries, bg: "bg-rose-50 border-rose-200 text-rose-900" },
              { label: "Total Invoice Amount", val: `BDT ${dailyReportMetrics.totalInvoiceAmount.toLocaleString()}`, bg: "bg-emerald-100 border-emerald-300 text-emerald-950" },
              { label: "Total Collected Amount", val: `BDT ${dailyReportMetrics.totalCollectedAmount.toLocaleString()}`, bg: "bg-lime-100 border-lime-300 text-lime-950" }
            ].map((item, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl border ${item.bg}`}>
                <div className="text-[11px] font-bold opacity-80">{item.label}</div>
                <div className="text-xl font-black mt-1">{item.val}</div>
              </div>
            ))}
          </div>

          {/* 14. Historical Delivery Search & Filter */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 space-y-3 bg-gray-50/50">
              <h3 className="font-bold text-sm text-charcoal">
                14. Delivery History & Multi-Filter Search
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <input
                  type="text"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Search Invoice No, Order ID, Customer or Phone..."
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                />
                <select
                  value={historyDeliveryStatus}
                  onChange={e => setHistoryDeliveryStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="all">All Delivery Statuses</option>
                  <option value="Ready for Delivery">Ready for Delivery</option>
                  <option value="Assigned to Delivery">Assigned to Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <select
                  value={historyPaymentStatus}
                  onChange={e => setHistoryPaymentStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial Paid">Partial Paid</option>
                  <option value="Pending">Pending</option>
                </select>
                <input
                  type="text"
                  value={historyEmployeeFilter === "all" ? "" : historyEmployeeFilter}
                  onChange={e => setHistoryEmployeeFilter(e.target.value || "all")}
                  placeholder="Filter by Delivery Employee / Courier..."
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                  <th className="py-3 px-4">Invoice & Order ID</th>
                  <th className="py-3 px-4">Customer & Phone</th>
                  <th className="py-3 px-4">Delivery Employee & Courier</th>
                  <th className="py-3 px-4">Delivery Date & Time</th>
                  <th className="py-3 px-4">Amount & Payment</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dailyReportMetrics.records
                  .filter(r => {
                    const q = historySearch.toLowerCase();
                    const matchQ =
                      !q ||
                      r.id.toLowerCase().includes(q) ||
                      (r.invoice?.invoiceNumber || "").toLowerCase().includes(q) ||
                      (r.customerInfo?.name || "").toLowerCase().includes(q) ||
                      (r.customerInfo?.phone || "").toLowerCase().includes(q);
                    const matchDel =
                      historyDeliveryStatus === "all" ||
                      r.status === historyDeliveryStatus ||
                      r.deliveryInfo?.status === historyDeliveryStatus;
                    const matchPay =
                      historyPaymentStatus === "all" || r.paymentStatus === historyPaymentStatus;
                    const matchEmp =
                      historyEmployeeFilter === "all" ||
                      (r.deliveryInfo?.deliveryEmployee || "").toLowerCase().includes(historyEmployeeFilter.toLowerCase()) ||
                      (r.deliveryInfo?.courierName || "").toLowerCase().includes(historyEmployeeFilter.toLowerCase());
                    return matchQ && matchDel && matchPay && matchEmp;
                  })
                  .map(rec => (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-indigo-700 block">
                          {rec.invoice?.invoiceNumber || `INV-${rec.id}`}
                        </span>
                        <span className="font-mono text-gray-500">{rec.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-charcoal">{rec.customerInfo?.name}</div>
                        <CustomerPhoneSecureDisplay
                          order={rec}
                          viewerDepartment="delivery"
                          isMasterAdmin={isSuperAdminAccount}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal">{rec.deliveryInfo?.deliveryEmployee || "Arifur Rahman"}</div>
                        <div className="text-gray-500">{rec.deliveryInfo?.courierName} ({rec.deliveryInfo?.trackingNumber || "N/A"})</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {rec.deliveryInfo?.deliveredAt || (rec.date || "").slice(0, 10)} {rec.deliveryInfo?.deliveredTime || ""}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-charcoal">BDT {(rec.invoice?.totalAmount ?? rec.total ?? 0).toLocaleString()}</div>
                        <span className="text-[10px] font-bold text-emerald-700">{rec.paymentStatus}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          {rec.deliveryInfo?.status || rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 16 & 17. ROLE-BASED ACCESS CONTROL & EMPLOYEE MANAGEMENT              */}
      {/* ===================================================================== */}
      {activeTab === "Employees" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-charcoal">
                16 & 17. Employee Accounts & Role-Based Access Control (RBAC)
              </h2>
              <p className="text-xs text-gray-500">
                Create employee accounts, assign departmental roles (Admin, CS, Purchase, Marketing, China WH, BD Customs, BD WH, Delivery, Accounts), and manage permissions.
              </p>
            </div>
            <button
              onClick={() => setShowEmpModal(true)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Employee Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map(emp => (
              <div key={emp.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-charcoal">{emp.name}</h3>
                      <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[11px] mt-0.5">
                        Role: {emp.role}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleEmployeeStatus(emp)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                        emp.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {emp.status === "active" ? "Active" : "Disabled"}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 border-y border-gray-100 py-2.5 mb-3">
                    <div><strong>Email:</strong> {emp.email || "N/A"}</div>
                    <div><strong>Phone:</strong> {emp.phone}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(emp.permissions || []).map((p: string) => (
                      <span key={p} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-semibold">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleRoleChange(mapUserRoleToDept(emp.role))}
                  className="w-full py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-bold text-charcoal cursor-pointer"
                >
                  Switch to {emp.role} View →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODALS: UNIFIED ORDER RECORD, CUSTOMER PROFILE, STOCK-OUT, EMPLOYEE   */}
      {/* ===================================================================== */}
      {selectedOrder && (
        <UnifiedOrderModal
          order={selectedOrder}
          currentRole={currentRole}
          isMarketingView={currentRole === "Marketing"}
          hideCustomerPassword={currentRole === "Marketing"}
          initialSubTab={selectedOrderModalTab}
          onClose={() => setSelectedOrder(null)}
          onUpdateOrder={handleUnifiedUpdate}
        />
      )}

      {selectedProductInfoOrder && (
        <OrderProductInfoModal
          order={selectedProductInfoOrder}
          department={currentRole}
          onClose={() => setSelectedProductInfoOrder(null)}
        />
      )}

      {selectedCustomerProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-charcoal">{selectedCustomerProfile.name}</h3>
                <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap mt-0.5">
                  <span>ফোন:</span>
                  <CustomerPhoneSecureDisplay
                    customer={selectedCustomerProfile}
                    phone={selectedCustomerProfile.phone}
                    viewerDepartment={currentRole === "Admin" ? "admin" : currentRole?.toLowerCase()}
                    viewerRole={currentRole}
                    viewerStaff={storedUser ? { id: storedUser.id, name: storedUser.name, email: storedUser.email } : undefined}
                    isMasterAdmin={isSuperAdminAccount || currentRole === "Admin"}
                    showActions={true}
                  />
                  <span>| অ্যাসাইনড মার্কেটিং: <strong>{selectedCustomerProfile.assignedMarketingName || "নট অ্যাসাইনড"}</strong></span>
                </div>
              </div>
              <button onClick={() => setSelectedCustomerProfile(null)} className="text-gray-400 hover:text-charcoal text-sm font-bold">
                Close ✕
              </button>
            </div>
            <div className="text-xs space-y-2">
              <p><strong>Email:</strong> {selectedCustomerProfile.email || "N/A"}</p>
              <p><strong>Delivery Address:</strong> {selectedCustomerProfile.address}</p>
              <p><strong>Total Lifetime Value:</strong> BDT {(selectedCustomerProfile.totalSpent || 0).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase text-gray-500 mb-2">Customer Order History</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(selectedCustomerProfile.orders || []).map((o: any) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      const full = orders.find(ord => ord.id === o.id);
                      setSelectedCustomerProfile(null);
                      if (full) setSelectedOrder(full);
                    }}
                    className="p-3 rounded-xl border border-gray-200 hover:border-primary flex justify-between items-center text-xs cursor-pointer"
                  >
                    <div>
                      <span className="font-mono font-bold text-primary">{o.id}</span>
                      <span className="text-gray-400 ml-2">{new Date(o.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">BDT {(o.total || 0).toLocaleString()}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showStockOutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleSaveStockOut} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-3 text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-red-900">Record Stock-Out / Product Availability Issue</h3>
              <button type="button" onClick={() => setShowStockOutModal(false)} className="text-gray-400 hover:text-charcoal font-bold">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Order ID</label>
                <input
                  type="text"
                  required
                  value={stockOutForm.orderId}
                  onChange={e => setStockOutForm({ ...stockOutForm, orderId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={stockOutForm.customerName}
                  onChange={e => setStockOutForm({ ...stockOutForm, customerName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="font-bold block mb-1">Product Name</label>
              <input
                type="text"
                required
                value={stockOutForm.productName}
                onChange={e => setStockOutForm({ ...stockOutForm, productName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold block mb-1">Ordered Qty</label>
                <input
                  type="number"
                  value={stockOutForm.orderedQty}
                  onChange={e => setStockOutForm({ ...stockOutForm, orderedQty: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Available Qty</label>
                <input
                  type="number"
                  value={stockOutForm.availableQty}
                  onChange={e => setStockOutForm({ ...stockOutForm, availableQty: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold block mb-1 text-red-600">Stock-Out Qty</label>
                <input
                  type="number"
                  readOnly
                  value={Math.max(0, stockOutForm.orderedQty - stockOutForm.availableQty)}
                  className="w-full border rounded-lg px-3 py-2 bg-red-50 text-red-700 font-bold"
                />
              </div>
            </div>
            <div>
              <label className="font-bold block mb-1">Reason</label>
              <input
                type="text"
                value={stockOutForm.reason}
                onChange={e => setStockOutForm({ ...stockOutForm, reason: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Notes</label>
              <textarea
                value={stockOutForm.notes}
                onChange={e => setStockOutForm({ ...stockOutForm, notes: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowStockOutModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 font-bold">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold">Save Stock-Out Record</button>
            </div>
          </form>
        </div>
      )}

      {showEmpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleCreateEmployee} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3 text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-charcoal">Create Departmental Employee Account</h3>
              <button type="button" onClick={() => setShowEmpModal(false)} className="text-gray-400 hover:text-charcoal font-bold">✕</button>
            </div>
            <div>
              <label className="font-bold block mb-1">Employee Name</label>
              <input
                type="text"
                required
                value={empForm.name}
                onChange={e => setEmpForm({ ...empForm, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={empForm.phone}
                  onChange={e => setEmpForm({ ...empForm, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Email</label>
                <input
                  type="email"
                  value={empForm.email}
                  onChange={e => setEmpForm({ ...empForm, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Department Role</label>
                <select
                  value={empForm.role}
                  onChange={e => setEmpForm({ ...empForm, role: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 bg-white font-bold"
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="CS">CS (Customer Service)</option>
                  <option value="Purchase">Purchase Department</option>
                  <option value="Marketing">Marketing Department</option>
                  <option value="China Warehouse">China Warehouse</option>
                  <option value="BD Customs">BD Customs</option>
                  <option value="BD Warehouse">BD Warehouse</option>
                  <option value="Delivery">Delivery Department</option>
                  <option value="Accounts">Accounts Department</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Login Password</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={empForm.password}
                  onChange={e => setEmpForm({ ...empForm, password: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowEmpModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 font-bold">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white font-bold">Create Account</button>
            </div>
          </form>
        </div>
      )}

      {selectedCustomerProfile && (
        <CustomerProfileModal
          customer={selectedCustomerProfile}
          onClose={() => setSelectedCustomerProfile(null)}
        />
      )}

      {/* Instant Preview Modal for Customer Cart & Wishlist */}
      {previewCartModalCust && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    previewCartModalCust.viewType === "cart" ? "bg-sky-100 text-sky-700" : "bg-rose-100 text-rose-600"
                  }`}>
                    {previewCartModalCust.viewType === "cart" ? (
                      <ShoppingCart className="w-4 h-4" />
                    ) : (
                      <Heart className="w-4 h-4 fill-rose-500" />
                    )}
                  </div>
                  <h3 className="font-bold text-base text-slate-900">
                    {previewCartModalCust.name || "Customer"}'s {previewCartModalCust.viewType === "cart" ? "Shopping Cart" : "Wishlist"}
                  </h3>
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  Phone: {previewCartModalCust.phone || "N/A"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCartModalCust(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Tab switch between Cart & Wishlist */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setPreviewCartModalCust({ ...previewCartModalCust, viewType: "cart" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  previewCartModalCust.viewType === "cart"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Cart Products ({previewCartModalCust.cart?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewCartModalCust({ ...previewCartModalCust, viewType: "wishlist" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  previewCartModalCust.viewType === "wishlist"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Wishlist ({previewCartModalCust.wishlist?.length || 0})</span>
              </button>
            </div>

            {/* Content List */}
            {previewCartModalCust.viewType === "cart" ? (
              <div className="space-y-3">
                {previewCartModalCust.cart && previewCartModalCust.cart.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-xs bg-sky-50 p-2.5 rounded-xl border border-sky-200 text-sky-950 font-bold">
                      <span>Total Items: {previewCartModalCust.cart.length}</span>
                      <span>
                        Total Cart Value: Tk {previewCartModalCust.cart.reduce((s: number, it: any) => s + (Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1)), 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {previewCartModalCust.cart.map((item: any, idx: number) => {
                        const price = Number(item.price || item.unitPrice || 0);
                        const qty = Number(item.quantity || 1);
                        const cleanP = String(previewCartModalCust.phone || "").replace(/^0/, "").replace(/[^0-9]/g, "");
                        const waMsg = `Hello ${previewCartModalCust.name || "Customer"}, you have '${item.name || "Product"}' in your World Buy BD cart. Do you need any assistance placing your order?`;

                        {(() => {
                          const itemProdPath = getProductPath(item);
                          return (
                            <div
                              key={idx}
                              className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <a
                                  href={itemProdPath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 block"
                                  title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                >
                                  <img
                                    src={item.image || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200"}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0 hover:scale-105 transition"
                                  />
                                </a>
                                <div className="min-w-0">
                                  <a
                                    href={itemProdPath}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-slate-900 hover:text-primary transition line-clamp-1 flex items-center gap-1"
                                  >
                                    <span>{item.name || "Product"}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                                  </a>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {item.variantName && <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 mr-1.5">{item.variantName}</span>}
                                    <span className="font-semibold">Tk {price.toLocaleString()} × {qty}</span>
                                    <span className="font-bold text-sky-800 ml-1.5">= Tk {(price * qty).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              {cleanP && (
                                <a
                                  href={`https://wa.me/880${cleanP}?text=${encodeURIComponent(waMsg)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Contact customer on WhatsApp regarding this item"
                                  className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shrink-0 cursor-pointer"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          );
                        })()}
                      })}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No products in cart
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {previewCartModalCust.wishlist && previewCartModalCust.wishlist.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {previewCartModalCust.wishlist.map((item: any, idx: number) => {
                      const price = Number(item.price || item.unitPrice || 0);
                      const cleanP = String(previewCartModalCust.phone || "").replace(/^0/, "").replace(/[^0-9]/g, "");
                      const waMsg = `Hello ${previewCartModalCust.name || "Customer"}, your wishlisted item '${item.name || "Product"}' on World Buy BD currently has special promotions!`;

                      return (
                        <div
                          key={idx}
                          className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          {(() => {
                            const wishPath = getProductPath(item);
                            return (
                              <div className="flex items-center gap-3 min-w-0">
                                <a
                                  href={wishPath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 block group"
                                  title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                >
                                  <img
                                    src={item.image || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200"}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0 group-hover:scale-105 group-hover:border-primary transition"
                                  />
                                </a>
                                <div className="min-w-0">
                                  <a
                                    href={wishPath}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-slate-900 hover:text-primary transition line-clamp-1 flex items-center gap-1 group"
                                  >
                                    <span>{item.name || "Product"}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-primary shrink-0 transition" />
                                  </a>
                                  <div className="text-[11px] text-rose-700 font-bold mt-0.5">
                                    Tk {price.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {cleanP && (
                            <a
                              href={`https://wa.me/880${cleanP}?text=${encodeURIComponent(waMsg)}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Send wishlist offer on WhatsApp"
                              className="p-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shrink-0 cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No products in wishlist
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerProfile(previewCartModalCust);
                  setPreviewCartModalCust(null);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>View Full Profile & Password</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewCartModalCust(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marketing Target, Achievement & Customer Value Brackets Modal System */}
      {showMarketingTiersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-300">
            <MarketingTargetCustomerTiers
              orders={orders}
              onClose={() => setShowMarketingTiersModal(false)}
              onOpenOrderModal={ord => setSelectedOrder(ord)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
