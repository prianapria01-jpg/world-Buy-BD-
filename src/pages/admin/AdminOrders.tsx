import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  ExternalLink, 
  Smartphone, 
  Building, 
  CreditCard,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Package,
  FileText,
  Layers,
  Link2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertOctagon,
  ArrowRight,
  Send,
  Check,
  Copy,
  Banknote,
  Scale,
  RefreshCw,
  PhoneCall,
  MessageSquare,
  KeyRound,
  ShoppingCart,
  Heart,
  Lock
} from "lucide-react";
import CustomInvoiceModal from "../../components/invoice/CustomInvoiceModal";
import CustomInvoiceView from "../../components/invoice/CustomInvoiceView";
import { buildInvoiceFromOrder, downloadCustomInvoicePdf } from "../../utils/customInvoice";
import OrderLinkVariationsView from "../../components/admin/OrderLinkVariationsView";
import CentralOperationsHub, { RBACDepartment } from "../../components/admin/CentralOperationsHub";
import { SubNavTab } from "../../components/admin/AdminTopNavSubViews";
import { 
  groupOrderItemsByLink, 
  groupAllOrdersByLink, 
  generateTenVariationsDemoOrder 
} from "../../utils/orderVariations";
import StockOutRefundRecordsView from "../../components/admin/StockOutRefundRecordsView";
import OrderProductInfoModal from "../../components/admin/OrderProductInfoModal";
import StaffAvatar from "../../components/admin/StaffAvatar";
import { DEFAULT_ROLE_DASHBOARDS } from "../../utils/roleDashboardsData";
import { getCurrentAdminUser, canViewCustomerPhone, canAssignMarketingStaff } from "../../utils/customerPrivacy";
import { canAccessProductSourceLink } from "../../utils/productPrivacy";
import CustomerPhoneSecureDisplay from "../../components/admin/CustomerPhoneSecureDisplay";
import { getProductPath } from "../../utils/productUrl";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedProductInfoOrder, setSelectedProductInfoOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [marketingFilter, setMarketingFilter] = useState("all");
  const [marketingStaffList, setMarketingStaffList] = useState<any[]>([]);
  const [assignModalOrder, setAssignModalOrder] = useState<any | null>(null);
  const [applyToCustomerOrders, setApplyToCustomerOrders] = useState(true);
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [copiedPassOrderId, setCopiedPassOrderId] = useState<string | null>(null);
  const [orderModalCustItemTab, setOrderModalCustItemTab] = useState<"cart" | "wishlist">("cart");
  const [viewMode, setViewMode] = useState<"rbac_hub" | "orders" | "links" | "stockout_requests" | "refund_records">("orders");
  const [hubInitialTab, setHubInitialTab] = useState<RBACDepartment>("Admin");
  const [subNavTab, setSubNavTab] = useState<SubNavTab>("all_orders");
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [quickEditOrderId, setQuickEditOrderId] = useState<string | null>(null);
  const [autoCalculateShipping, setAutoCalculateShipping] = useState(true);
  const [quickForm, setQuickForm] = useState<{
    chinaCourier: number;
    weightKg: string;
    ratePerKg: number;
    shippingCharge: number;
    discount: number;
    paidAmount: number;
    order1688Id: string;
    trackingNumber: string;
    status: string;
  }>({
    chinaCourier: 0,
    weightKg: "0 KG",
    ratePerKg: 780,
    shippingCharge: 0,
    discount: 0,
    paidAmount: 0,
    order1688Id: "",
    trackingNumber: "",
    status: "Pending",
  });
  const [savingQuickId, setSavingQuickId] = useState<string | null>(null);
  const [quickSavedBanner, setQuickSavedBanner] = useState<string | null>(null);

  const currentAdminUser = React.useMemo(() => getCurrentAdminUser(), []);
  const isMasterAdmin = currentAdminUser.isMasterAdmin;

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openQuickChargesEditor = (order: any) => {
    if (quickEditOrderId === order.id) {
      setQuickEditOrderId(null);
      return;
    }
    const inv = buildInvoiceFromOrder(order, order.invoice);
    setQuickEditOrderId(order.id);
    setQuickForm({
      chinaCourier: Number(inv.chinaCourier || 0),
      weightKg: String(inv.weightApx || inv.weight || "0 KG"),
      ratePerKg: Number(inv.shippingRatePerKg || 780),
      shippingCharge: Number(inv.shippingCharge || 0),
      discount: Number(inv.discount || 0),
      paidAmount: Number(inv.paidAmount ?? Math.max(0, Number(inv.subTotal || 0) - Number(inv.discount || 0))),
      order1688Id: String(
        inv.order1688Id ||
          order.order1688Id ||
          order.purchaseInfo?.order1688Id ||
          order.purchaseInfo?.orderSupplierId ||
          ""
      ),
      trackingNumber: String(
        inv.trackingNumber ||
          order.trackingNumber ||
          order.purchaseInfo?.trackingNumber ||
          order.chinaWarehouseInfo?.chinaAwb ||
          order.deliveryInfo?.trackingNumber ||
          ""
      ),
      status: String(order.status || inv.status || "Pending"),
    });
  };

  const handleSaveQuickCharges = async (order: any) => {
    setSavingQuickId(order.id);
    try {
      const inv = buildInvoiceFromOrder(order, order.invoice);
      const sub = Number(inv.subTotal || 0);
      const rateVal = Number(quickForm.ratePerKg || 780);
      const kgNum = parseFloat(String(quickForm.weightKg || "0").replace(/[^0-9.]/g, "")) || 0;
      const china = Number(quickForm.chinaCourier || 0);
      const ship = kgNum > 0 ? Math.round(kgNum * rateVal) : Number(quickForm.shippingCharge || 0);
      const disc = Number(quickForm.discount || 0);
      const grand = Math.max(0, sub - disc) + china + ship;
      const paid = Number(quickForm.paidAmount || 0);
      const due = Math.max(0, grand - paid);

      const updatedInvoice = {
        ...inv,
        adminChargesUploaded: true,
        order1688Id: quickForm.order1688Id,
        trackingNumber: quickForm.trackingNumber,
        chinaCourier: china,
        chinaCourierCharge: china,
        weight: quickForm.weightKg,
        weightApx: quickForm.weightKg,
        shippingRate: rateVal,
        shippingRatePerKg: rateVal,
        shippingCharge: ship,
        discount: disc,
        grandTotal: grand,
        paidAmount: paid,
        totalDue: due,
        dueAmount: due,
        paymentNow: due,
        status: quickForm.status,
      };

      const targetId = order.orderId || order.id;
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(targetId)}/invoice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedInvoice),
      });

      if (res.ok) {
        const savedOrder = await res.json();
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id || o.orderId === targetId
              ? {
                  ...o,
                  ...savedOrder,
                  adminChargesUploaded: true,
                  shippingRatePerKg: rateVal,
                  order1688Id: quickForm.order1688Id,
                  trackingNumber: quickForm.trackingNumber,
                  total: grand,
                  chinaCourierBill: china,
                  chinaCourierCharge: china,
                  shippingCharge: ship,
                  weight: quickForm.weightKg,
                  paidAmount: paid,
                  dueAmount: due,
                  status: quickForm.status,
                  invoice: updatedInvoice,
                }
              : o
          )
        );
        setQuickSavedBanner(
          `Updated Order ${targetId}: Weight ${quickForm.weightKg} × BDT ${quickForm.ratePerKg} = BDT ${ship}, China Courier BDT ${china}, Partial Paid BDT ${paid} → Final Invoice Payable: BDT ${due.toLocaleString()}`
        );
        setTimeout(() => setQuickSavedBanner(null), 4500);
        setQuickEditOrderId(null);
      }
    } catch (e) {
      console.error("Failed to save invoice charges:", e);
    } finally {
      setSavingQuickId(null);
    }
  };

  const handleCreateDemoOrder = async () => {
    try {
      const demo = generateTenVariationsDemoOrder();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demo)
      });
      if (res.ok) {
        loadOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  // Stock-Out Management State & Helpers
  const [stockOutModalOrder, setStockOutModalOrder] = useState<any | null>(null);
  const [stockOutFilterTab, setStockOutFilterTab] = useState<"all" | "pending_refund" | "pending_adjust" | "awaiting_customer" | "completed">("all");
  const [stockOutProcessForm, setStockOutProcessForm] = useState<{
    action: "refunded" | "adjusted" | "rejected";
    adminTrxId: string;
    adminActionNote: string;
    customRefundAmount: number;
    submitting: boolean;
  }>({
    action: "refunded",
    adminTrxId: "",
    adminActionNote: "",
    customRefundAmount: 0,
    submitting: false,
  });

  const isStockOutOrder = (order: any): boolean => {
    return (
      order?.status === "Stock Out" ||
      order?.stockOutInfo?.isStockOut === true ||
      (Array.isArray(order?.items) && order.items.some((it: any) => it.isStockOut))
    );
  };

  const getStockOutRefundAmount = (order: any): number => {
    if (order?.stockOutInfo?.totalRefundAmount !== undefined && Number(order.stockOutInfo.totalRefundAmount) >= 0) {
      return Number(order.stockOutInfo.totalRefundAmount);
    }
    const stockOutItems = (order?.items || []).filter((it: any) => it.isStockOut);
    if (stockOutItems.length > 0) {
      return stockOutItems.reduce((sum: number, it: any) => {
        const price = Number(it.refundAmount || (Number(it.unitPrice || it.price || 0) * Number(it.stockOutQuantity || it.quantity || 1)));
        return sum + price;
      }, 0);
    }
    return Number(order?.paidAmount ?? order?.invoice?.paidAmount ?? order?.subtotal ?? order?.total ?? 0);
  };

  const stockOutOrdersList = orders.filter(isStockOutOrder);
  const stockOutOrdersCount = stockOutOrdersList.length;
  const pendingStockOutRequestsCount = stockOutOrdersList.filter(
    (o) => o.stockOutInfo?.customerChoice && (o.stockOutInfo?.status === "requested" || !o.stockOutInfo?.status)
  ).length;

  const filteredStockOutOrders = stockOutOrdersList.filter((o) => {
    if (stockOutFilterTab === "pending_refund") {
      return o.stockOutInfo?.customerChoice === "refund" && o.stockOutInfo?.status === "requested";
    }
    if (stockOutFilterTab === "pending_adjust") {
      return o.stockOutInfo?.customerChoice === "adjust" && o.stockOutInfo?.status === "requested";
    }
    if (stockOutFilterTab === "awaiting_customer") {
      return !o.stockOutInfo?.customerChoice;
    }
    if (stockOutFilterTab === "completed") {
      return o.stockOutInfo?.status === "refunded" || o.stockOutInfo?.status === "adjusted";
    }
    return true;
  });

  const handleOpenStockOutModal = (order: any) => {
    const defaultRefund = getStockOutRefundAmount(order);
    const prefAction = order.stockOutInfo?.customerChoice === "adjust" ? "adjusted" : "refunded";
    setStockOutProcessForm({
      action: (order.stockOutInfo?.status === "adjusted" || order.stockOutInfo?.status === "refunded") ? order.stockOutInfo.status : prefAction,
      adminTrxId: order.stockOutInfo?.adminTrxId || "",
      adminActionNote: order.stockOutInfo?.adminActionNote || "",
      customRefundAmount: defaultRefund,
      submitting: false,
    });
    setStockOutModalOrder(order);
  };

  const handleProcessStockOut = async () => {
    if (!stockOutModalOrder) return;
    const canonicalId = String(stockOutModalOrder.mainOrderId || stockOutModalOrder.orderId || stockOutModalOrder.id);
    setStockOutProcessForm((prev) => ({ ...prev, submitting: true }));

    try {
      const res = await fetch(`/api/orders/${canonicalId}/stock-out-process`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: stockOutProcessForm.action,
          adminTrxId: stockOutProcessForm.adminTrxId.trim(),
          adminActionNote: stockOutProcessForm.adminActionNote.trim(),
          totalRefundAmount: stockOutProcessForm.customRefundAmount,
          processedBy: currentRole === "admin" ? "Super Admin" : "Accounts Admin",
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) =>
          prev.map((o) => {
            const oId = String(o.mainOrderId || o.orderId || o.id);
            if (oId === canonicalId) {
              return { ...o, ...updated };
            }
            return o;
          })
        );
        setQuickSavedBanner(
          stockOutProcessForm.action === "refunded"
            ? `Order ${canonicalId}: Refund marked as completed! TrxID: ${stockOutProcessForm.adminTrxId || "N/A"}`
            : `Order ${canonicalId}: BDT ${stockOutProcessForm.customRefundAmount} adjusted from order due amount!`
        );
        setTimeout(() => setQuickSavedBanner(null), 4500);
        setStockOutModalOrder(null);
      } else {
        alert("Failed to process stock-out resolution.");
      }
    } catch (e) {
      console.error(e);
      alert("Error processing stock-out resolution.");
    } finally {
      setStockOutProcessForm((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Sub-Admins list and current viewing role
  const [subadmins, setSubadmins] = useState<any[]>([]);
  const [currentRole, setCurrentRole] = useState("admin"); // 'admin' or 'subadmin-id'

  const statuses = [
    "Pending",
    "Order Placed",
    "Order Confirmed",
    "Confirmed Order",
    "Purchased",
    "Stock Out",
    "Shipped to China Warehouse",
    "Received in China Warehouse",
    "Shipped to Bangladesh",
    "Received in BD Customs",
    "Received in BD Warehouse",
    "Invoice Generated",
    "Ready for Delivery",
    "Assigned to Delivery",
    "Delivered"
  ];

  // Employees have view access to customer orders, but ONLY Super Admin has access to Order Confirm & Delivery statuses
  const allowedSubadminStatuses = [
    "Pending",
    "Order Placed",
    "Purchased",
    "Stock Out",
    "Shipped to China Warehouse",
    "Received in China Warehouse",
    "Received in BD Customs",
    "Received in BD Warehouse"
  ];

  const loadOrders = () => {
    setLoading(true);
    fetch("/api/orders")
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        const unique = new Map();
        for (const o of arr) {
          if (o && o.id && !unique.has(String(o.id))) {
            unique.set(String(o.id), o);
          }
        }
        setOrders(Array.from(unique.values()));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadSubadmins = () => {
    fetch("/api/subadmins")
      .then(res => res.json())
      .then(data => setSubadmins(data || []))
      .catch(() => {});
  };

  const loadMarketingStaff = () => {
    fetch("/api/admin/role-dashboards")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const salesStaff = data.filter((d: any) => d.department === "sales");
          setMarketingStaffList(salesStaff.length > 0 ? salesStaff : DEFAULT_ROLE_DASHBOARDS.filter(d => d.department === "sales"));
        } else {
          setMarketingStaffList(DEFAULT_ROLE_DASHBOARDS.filter(d => d.department === "sales"));
        }
      })
      .catch(() => {
        setMarketingStaffList(DEFAULT_ROLE_DASHBOARDS.filter(d => d.department === "sales"));
      });
  };

  useEffect(() => {
    loadOrders();
    loadSubadmins();
    loadMarketingStaff();
  }, []);

  const handleAssignMarketing = async (staffDesk: any, applyToAll = applyToCustomerOrders) => {
    if (!assignModalOrder) return;
    try {
      setAssigningLoading(true);
      const oid = String(assignModalOrder.mainOrderId || assignModalOrder.orderId || assignModalOrder.id || "");
      const cPhone = assignModalOrder.customerInfo?.phone || assignModalOrder.customerPhone || "";
      const uid = assignModalOrder.userId || assignModalOrder.customerInfo?.userId || "";

      const assignedStaffPayload = {
        id: staffDesk.id,
        code: staffDesk.code,
        name: staffDesk.assignedStaff.name,
        phone: staffDesk.assignedStaff.phone,
        email: staffDesk.assignedStaff.email,
        avatar: staffDesk.assignedStaff.avatar,
        department: "sales",
        assignedAt: new Date().toISOString(),
        assignedBy: "Main Admin"
      };

      const res = await fetch("/api/orders/assign-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: oid,
          customerPhone: cPhone,
          userId: uid,
          assignedMarketingStaff: assignedStaffPayload
        })
      });

      if (res.ok) {
        setOrders(prev =>
          prev.map(o => {
            const matchesId = String(o.mainOrderId || o.orderId || o.id || "") === oid;
            const cTail = cPhone ? cPhone.replace(/\D/g, "").slice(-10) : "";
            const oPhone = o.customerInfo?.phone || o.customerPhone || "";
            const oTail = oPhone ? oPhone.replace(/\D/g, "").slice(-10) : "";
            const matchesPhone = Boolean(cTail && oTail && (oTail === cTail || oTail.endsWith(cTail)));
            const matchesCustomer = matchesPhone || Boolean(uid && (o.userId === uid || o.customerInfo?.userId === uid));
            if (matchesId || matchesCustomer) {
              return {
                ...o,
                assignedMarketingStaff: assignedStaffPayload,
                assignedMarketingId: assignedStaffPayload.id,
                assignedMarketingName: assignedStaffPayload.name
              };
            }
            return o;
          })
        );
        setQuickSavedBanner(`সফলভাবে ${staffDesk.assignedStaff.name} (${staffDesk.code})-কে এই কাস্টমারের স্থায়ী মার্কেটিং ম্যানেজার হিসেবে নির্ধারণ করা হয়েছে! এই নাম্বারের সকল বর্তমান ও ভবিষ্যত অর্ডার অটো ওনার নামেই যাবে।`);
        setTimeout(() => setQuickSavedBanner(null), 5000);
        setAssignModalOrder(null);
      } else {
        alert("অ্যাসাইন করতে সমস্যা হয়েছে");
      }
    } catch (err) {
      console.error(err);
      alert("নেটওয়ার্ক এরর");
    } finally {
      setAssigningLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const verifyPayment = async (id: string, paymentStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/verify-payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === id ? updated : o));
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder(updated);
        }
        setQuickSavedBanner(paymentStatus === "Paid" ? `Payment verified for Order ${id}!` : `Payment status updated to ${paymentStatus} for Order ${id}`);
        setTimeout(() => setQuickSavedBanner(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.filter((o) => String(o.id) !== String(id) && String(o.orderId) !== String(id))
        );
        if (selectedOrder && (selectedOrder.id === id || selectedOrder.orderId === id)) {
          setSelectedOrder(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !term ||
      (o.id && o.id.toLowerCase().includes(term)) ||
      (o.orderId && o.orderId.toLowerCase().includes(term)) ||
      (o.mainOrderId && o.mainOrderId.toLowerCase().includes(term)) ||
      (Array.isArray(o.subOrders) && o.subOrders.some((s: any) => 
        (s.subOrderId && s.subOrderId.toLowerCase().includes(term)) ||
        (s.productLink && s.productLink.toLowerCase().includes(term)) ||
        (s.productName && s.productName.toLowerCase().includes(term))
      )) ||
      (o.customerInfo?.name || "").toLowerCase().includes(term) ||
      (o.customerInfo?.phone || "").toLowerCase().includes(term) ||
      (o.paymentInfo?.transactionId || "").toLowerCase().includes(term);

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || 
      (paymentFilter === "proof_submitted" && (o.paymentStatus === "Verification Pending" || o.paymentInfo?.screenshot)) ||
      (paymentFilter === "paid" && o.paymentStatus === "Paid") ||
      (paymentFilter === "unpaid" && (!o.paymentStatus || o.paymentStatus === "Unpaid"));

    const matchesMarketing = 
      marketingFilter === "all" ||
      (marketingFilter === "assigned" && Boolean(o.assignedMarketingStaff?.name)) ||
      (marketingFilter === "unassigned" && !o.assignedMarketingStaff?.name) ||
      (o.assignedMarketingStaff?.id === marketingFilter ||
        o.assignedMarketingStaff?.code?.toLowerCase() === marketingFilter.toLowerCase() ||
        o.assignedMarketingStaff?.name === marketingFilter);

    return matchesSearch && matchesStatus && matchesPayment && matchesMarketing;
  });

  return (
    <div className="flex flex-col space-y-5">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Orders & Customer Invoice Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update China Courier Bill, Parcel Weight (KG), Shipping Charges, Payment Verification, and Customer Invoices
          </p>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
          <UserCheck className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-slate-600">View Role:</span>
          <select 
            value={currentRole} 
            onChange={e => setCurrentRole(e.target.value)}
            className="border-0 bg-transparent text-xs font-semibold text-slate-900 focus:ring-0 focus:outline-none cursor-pointer"
          >
            <option value="admin">Super Admin (Full Control)</option>
            {subadmins.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {pendingStockOutRequestsCount > 0 && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white text-xs font-bold flex items-center justify-between gap-3 shadow-sm border border-rose-500">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-full bg-white/20 animate-pulse">
              <AlertOctagon className="w-4 h-4 text-white" />
            </span>
            <span>
              Customers submitted refund or balance adjustment claims for <strong>{pendingStockOutRequestsCount}</strong> stock-out product(s)!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setViewMode("stockout_requests")}
            className="px-3 py-1.5 rounded-lg bg-white text-rose-700 hover:bg-rose-50 font-black text-xs shadow-2xs transition cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span>View Claims & Messages →</span>
          </button>
        </div>
      )}

      {quickSavedBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{quickSavedBanner}</span>
          </div>
          <button type="button" onClick={() => setQuickSavedBanner(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 flex flex-col flex-1 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
          <div className="relative flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Search by Order ID, Customer Phone or Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700">
                <X className="w-3.5 h-3.5"/>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-primary"
            >
              <option value="all">All Order Statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-primary"
            >
              <option value="all">All Payment Statuses</option>
              <option value="proof_submitted">Receipt Submitted</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>

            <select
              value={marketingFilter}
              onChange={(e) => setMarketingFilter(e.target.value)}
              className="border border-indigo-200 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-900 bg-indigo-50/60 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">সকল মার্কেটিং ({orders.length})</option>
              <option value="assigned">অ্যাসাইনকৃত ({orders.filter(o => o.assignedMarketingStaff?.name).length})</option>
              <option value="unassigned">বাকি / নট অ্যাসাইনড ({orders.filter(o => !o.assignedMarketingStaff?.name).length})</option>
              {marketingStaffList.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.code}: {staff.assignedStaff?.name || staff.title}
                </option>
              ))}
            </select>

            <button 
              onClick={loadOrders}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Clean Segmented View Switcher */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-4 py-2.5 bg-slate-50 gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              onClick={() => setViewMode("orders")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "orders" 
                  ? "bg-white text-slate-900 shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Orders & Invoice Charges ({filteredOrders.length})</span>
            </button>

            <button
              onClick={() => setViewMode("stockout_requests")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer relative ${
                viewMode === "stockout_requests" 
                  ? "bg-rose-600 text-white shadow-2xs font-bold" 
                  : "text-rose-700 bg-rose-50 hover:bg-rose-100"
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Stock-Out & Requests ({stockOutOrdersCount})</span>
              {pendingStockOutRequestsCount > 0 && (
                <span className="bg-white text-rose-700 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-2xs animate-pulse">
                  {pendingStockOutRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode("refund_records")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "refund_records" 
                  ? "bg-emerald-600 text-white shadow-2xs font-bold" 
                  : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Refund Records & History</span>
            </button>

            <button
              onClick={() => setViewMode("links")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "links" 
                  ? "bg-white text-slate-900 shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Purchase Sheet by Source Link ({groupAllOrdersByLink(filteredOrders).length})</span>
            </button>

            <button
              onClick={() => setViewMode("rbac_hub")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "rbac_hub" 
                  ? "bg-white text-slate-900 shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Departmental Hub</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateDemoOrder}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <span>+ Sample Order</span>
            </button>
          </div>
        </div>

        {/* Content Area: RBAC Hub OR Orders Table OR Link-Grouped Purchase Sheet */}
        <div className="flex-1 overflow-auto">
          {viewMode === "rbac_hub" ? (
            <div className="p-4 sm:p-6 bg-slate-50 min-h-full">
              <CentralOperationsHub
                key={hubInitialTab}
                initialTab={hubInitialTab}
                externalSubNav={subNavTab}
                onExternalSubNavChange={setSubNavTab}
              />
            </div>
          ) : loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : viewMode === "links" ? (
            /* Purchase Sheet: Grouped strictly by Product Source Link */
            <div className="p-4 sm:p-6 bg-slate-50 min-h-full">
              <div className="mb-4 bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-charcoal flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-emerald-600" />
                    Product & Variations Purchase Sheet by Source Link
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    View all ordered variations and quantities grouped under each source link for consolidated factory purchasing.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full w-fit">
                  Total Source Links: {groupAllOrdersByLink(filteredOrders).length} items
                </span>
              </div>

              <OrderLinkVariationsView 
                groups={groupAllOrdersByLink(filteredOrders)} 
                showOrderMeta={true}
              />
            </div>
          ) : viewMode === "stockout_requests" ? (
            /* DEDICATED STOCK-OUT & CLAIMS RESOLUTION CENTER */
            <div className="p-4 sm:p-6 bg-slate-50 min-h-full space-y-5">
              {/* Header Box */}
              <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-rose-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold mb-2">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Customer Refund & Adjustment Management Center</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    Stock-Out & Customer Claims Resolution Center
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Stock-out items from China suppliers/1688 are listed here. Review and resolve customer claims for Cash Refunds (bKash/Nagad/Bank) or Order Balance Adjustments.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white/10 px-3.5 py-2 rounded-xl text-right">
                    <span className="text-[10px] text-rose-300 uppercase tracking-wider font-bold block">Pending Claims</span>
                    <span className="text-xl font-black text-rose-400 font-mono">{pendingStockOutRequestsCount} items</span>
                  </div>
                  <div className="bg-white/10 px-3.5 py-2 rounded-xl text-right">
                    <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold block">Total Refund Eligible</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      BDT {stockOutOrdersList.reduce((sum, o) => sum + getStockOutRefundAmount(o), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-Filters Bar */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 mr-1 pl-1">Filter:</span>
                  <button
                    type="button"
                    onClick={() => setStockOutFilterTab("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      stockOutFilterTab === "all"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    All Stock-Out ({stockOutOrdersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockOutFilterTab("pending_refund")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      stockOutFilterTab === "pending_refund"
                        ? "bg-rose-600 text-white"
                        : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash Refund Claim ({stockOutOrdersList.filter(o => o.stockOutInfo?.customerChoice === "refund" && o.stockOutInfo?.status === "requested").length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockOutFilterTab("pending_adjust")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      stockOutFilterTab === "pending_adjust"
                        ? "bg-indigo-600 text-white"
                        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Adjustment Claim ({stockOutOrdersList.filter(o => o.stockOutInfo?.customerChoice === "adjust" && o.stockOutInfo?.status === "requested").length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockOutFilterTab("awaiting_customer")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      stockOutFilterTab === "awaiting_customer"
                        ? "bg-amber-600 text-white"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    Customer Selection Pending ({stockOutOrdersList.filter(o => !o.stockOutInfo?.customerChoice).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockOutFilterTab("completed")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      stockOutFilterTab === "completed"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    Completed ({stockOutOrdersList.filter(o => o.stockOutInfo?.status === "refunded" || o.stockOutInfo?.status === "adjusted").length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode("refund_records")}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-200" />
                  <span>View Saved Refund & Message History →</span>
                </button>
              </div>

              {/* Cards List */}
              {filteredStockOutOrders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No Stock-Out Claims Found</h4>
                  <p className="text-slate-500 text-xs mt-1">There are no pending refund or adjustment requests matching this filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStockOutOrders.map((order: any) => {
                    const canonicalId = String(order.mainOrderId || order.orderId || order.id);
                    const refundAmt = getStockOutRefundAmount(order);
                    const choice = order.stockOutInfo?.customerChoice;
                    const status = order.stockOutInfo?.status || "pending_customer_choice";
                    const isCompleted = status === "refunded" || status === "adjusted";
                    const firstItem = order.items?.[0] || {};
                    const sourceUrl = firstItem.importedUrl || firstItem.productLink || (firstItem.offerId ? `https://detail.1688.com/offer/${firstItem.offerId}.html` : "");

                    return (
                      <div key={canonicalId} className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden shadow-xs transition">
                        {/* Top Order Strip */}
                        <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-amber-300 text-sm">#{canonicalId}</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-300">{new Date(order.date || order.createdAt).toLocaleDateString("en-GB")}</span>
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-200 font-semibold">{order.customerInfo?.name || "Customer"} ({order.customerInfo?.phone})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {choice === "refund" ? (
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                status === "refunded" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                              }`}>
                                {status === "refunded" ? "✅ Cash Refund Completed" : "🔴 Cash Refund Request"}
                              </span>
                            ) : choice === "adjust" ? (
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                status === "adjusted" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse"
                              }`}>
                                {status === "adjusted" ? "✅ Balance Adjustment Completed" : "🔵 Balance Adjustment Request"}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                ⏳ Customer Selection Pending
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setInvoiceOrder(order)}
                              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-amber-400" />
                              <span>Invoice</span>
                            </button>
                          </div>
                        </div>

                        {/* Body: Left = Product, Right = Claim & Message & Action */}
                        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                          {/* Product Details (Col 5) */}
                          <div className="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-200 pb-4 lg:pb-0 lg:pr-5">
                            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                              Stock-Out Product & Order Details
                            </span>
                            <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <img
                                src={firstItem.image || firstItem.variantImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120"}
                                alt={firstItem.name || "Product"}
                                className="w-14 h-14 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                              />
                              <div className="min-w-0 flex-1 text-xs">
                                <h4 className="font-bold text-slate-900 line-clamp-2 leading-tight">
                                  {firstItem.name || firstItem.description || "Product"}
                                </h4>
                                {firstItem.variantName && (
                                  <div className="text-[11px] text-slate-500 mt-1">
                                    Variant: <strong className="text-slate-700">{firstItem.variantName}</strong>
                                  </div>
                                )}
                                <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                                  Qty: <strong>{firstItem.quantity || 1} pcs</strong> • Total: <strong>BDT {Number(order.total || order.subtotal || 0).toLocaleString()}</strong>
                                </div>
                                {sourceUrl && canAccessProductSourceLink({ isMasterAdmin, viewerDepartment: currentAdminUser.department, role: currentRole }) && (
                                  <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold mt-1.5"
                                  >
                                    <span>1688 / Supplier Product Link</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Customer Direct Contact */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                              <div className="font-bold text-slate-800 flex items-center justify-between">
                                <span>Customer Information:</span>
                                <span className="text-[10px] text-slate-500">{order.customerInfo?.division || "Dhaka"}</span>
                              </div>
                              <div className="text-slate-600 font-semibold">{order.customerInfo?.name}</div>
                              <CustomerPhoneSecureDisplay
                                order={order}
                                viewerDepartment={currentAdminUser.department}
                                isMasterAdmin={isMasterAdmin}
                                showActions={true}
                              />
                            </div>
                          </div>

                          {/* Right: Claim Details, Message & Resolution (Col 7) */}
                          <div className="lg:col-span-7 space-y-3">
                            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                              Customer Claim, Message & Resolution
                            </span>

                            {choice ? (
                              <div className="space-y-3">
                                {/* Claim Highlight Box */}
                                <div className={`p-4 rounded-xl border-2 ${
                                  choice === "refund"
                                    ? "bg-rose-50/70 border-rose-300 text-rose-950"
                                    : "bg-indigo-50/70 border-indigo-300 text-indigo-950"
                                }`}>
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      {choice === "refund" ? (
                                        <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                                          <Banknote className="w-4 h-4" />
                                        </div>
                                      ) : (
                                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                                          <Scale className="w-4 h-4" />
                                        </div>
                                      )}
                                      <div>
                                        <strong className="text-xs uppercase tracking-wide block">
                                          {choice === "refund" ? "1. Cash Refund Claim" : "2. Balance Adjustment Claim"}
                                        </strong>
                                        <span className="text-[11px] text-slate-600">
                                          {choice === "refund" ? "Customer requested cash refund" : "Customer requested balance adjustment with order due"}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Claimed Amount</span>
                                      <span className="text-xl font-black font-mono text-rose-600">
                                        BDT  {refundAmt.toLocaleString()} <span className="text-xs">BDT</span>
                                      </span>
                                    </div>
                                  </div>

                                  {/* Account Details if Refund */}
                                  {choice === "refund" && (
                                    <div className="text-xs space-y-1 mb-2 bg-white/70 p-2.5 rounded-lg border border-rose-200">
                                      <div>
                                        <span className="text-slate-500">Payment Method:</span>{" "}
                                        <strong className="uppercase text-rose-700 font-bold">{order.stockOutInfo?.customerPaymentMethod || "bKash"}</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Account Number:</span>{" "}
                                        <strong className="font-mono text-sm text-slate-900 font-bold">{order.stockOutInfo?.customerAccountNumber || "Not provided"}</strong>{" "}
                                        <span className="text-[11px] text-slate-600">({order.stockOutInfo?.customerAccountType || "Personal"})</span>
                                      </div>
                                      {order.stockOutInfo?.customerBankDetails && (
                                        <div className="text-slate-700">
                                          <span className="text-slate-500">Bank Details:</span> {order.stockOutInfo.customerBankDetails}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Customer Message */}
                                  <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-2xs space-y-1 text-xs">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                      <span>Customer Message:</span>
                                    </div>
                                    <p className="text-slate-800 text-xs italic pl-2 border-l-2 border-primary py-0.5 leading-relaxed bg-slate-50 rounded-r">
                                      "{order.stockOutInfo?.customerNote || "No additional message provided by customer."}"
                                    </p>
                                    {order.stockOutInfo?.requestedAt && (
                                      <div className="text-[10px] text-slate-400 text-right pt-0.5">
                                        Claim Submitted At: {new Date(order.stockOutInfo.requestedAt).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Admin Resolution Section */}
                                {isCompleted ? (
                                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span>{status === "refunded" ? "Refund completed successfully" : "Adjusted against order due balance"}</span>
                                      </div>
                                      {order.stockOutInfo?.adminTrxId && (
                                        <div className="font-mono text-[11px] text-slate-700">TrxID: {order.stockOutInfo.adminTrxId}</div>
                                      )}
                                      {order.stockOutInfo?.adminActionNote && (
                                        <div className="text-[11px] text-slate-600 italic">Note: {order.stockOutInfo.adminActionNote}</div>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenStockOutModal(order)}
                                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-emerald-300 rounded hover:bg-emerald-100 transition cursor-pointer"
                                    >
                                      Edit / Modify
                                    </button>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5 text-xs">
                                    <strong className="block text-slate-700">Admin Action (Resolve):</strong>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenStockOutModal(order)}
                                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{choice === "refund" ? "Approve Refund & Enter TrxID" : "Approve Balance Adjustment"}</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-3">
                                <p className="leading-relaxed">
                                  ⏳ Customer has not submitted their preference yet. Two options (Refund or Adjust) are displayed on customer dashboard.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleOpenStockOutModal(order)}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
                                >
                                  <Scale className="w-3.5 h-3.5" />
                                  <span>Resolve Manually via Phone/WhatsApp</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : viewMode === "refund_records" ? (
            <div className="p-4 sm:p-6 bg-slate-50 min-h-full">
              <StockOutRefundRecordsView
                onRefreshOrders={loadOrders}
                onOpenOrderModal={(orderId) => {
                  const match = orders.find(o => String(o.id) === orderId || String(o.orderId) === orderId);
                  if (match) setSelectedOrder(match);
                }}
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr className="text-slate-600 text-xs border-b border-slate-200">
                  <th className="px-5 py-3 font-semibold">Order ID & Items</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Invoice Breakdown (Weight • Courier • Shipping)</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Order Status</th>
                  <th className="px-4 py-3 font-semibold">মার্কেটিং ম্যানেজার</th>
                  <th className="px-5 py-3 font-semibold text-right">Invoice & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredOrders.map((order: any, idx: number) => {
                  const hasProof = !!order.paymentInfo?.screenshot || !!order.paymentInfo?.transactionId;
                  const isPaid = order.paymentStatus === "Paid";
                  const method = order.paymentInfo?.method || order.customerInfo?.payment || "online";
                  const inv = buildInvoiceFromOrder(order, order.invoice);

                  const linkGroups = groupOrderItemsByLink(order.items || [], {
                    orderId: order.id,
                    customerName: order.customerInfo?.name,
                    status: order.status,
                    orderDate: order.date
                  });
                  const totalVariationsCount = linkGroups.reduce((acc, g) => acc + g.totalVariationsCount, 0);
                  const totalPiecesCount = linkGroups.reduce((acc, g) => acc + g.totalPieces, 0);
                  const isExpanded = !!expandedOrderIds[order.id];
                  const isQuickEditing = quickEditOrderId === order.id;

                  return (
                    <React.Fragment key={`${order.id || "order"}-${idx}`}>
                      <tr className={`hover:bg-slate-50/80 transition ${isQuickEditing ? "bg-amber-50/30" : isExpanded ? "bg-emerald-50/20" : ""}`}>
                        <td className="px-5 py-4 font-mono text-slate-900">
                          <div className="flex items-center gap-3">
                            {order.items && order.items.length > 0 && (() => {
                              const firstProdPath = getProductPath(order.items[0] || order);
                              return (
                                <div className="relative group shrink-0">
                                  <a
                                    href={firstProdPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                    className="block"
                                  >
                                    <img
                                      src={order.items[0].image || undefined}
                                      alt="product"
                                      className="w-11 h-11 object-cover rounded-lg border border-slate-200 cursor-pointer group-hover:border-primary group-hover:scale-105 transition"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition">
                                      <ExternalLink className="w-3.5 h-3.5 text-white" />
                                    </span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedProductInfoOrder(order)}
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center text-[8px] font-serif font-black shadow-2xs z-10"
                                    title="আইবাটন: প্রোডাক্ট বিস্তারিত"
                                  >
                                    i
                                  </button>
                                </div>
                              );
                            })()}
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="cursor-pointer hover:text-primary font-bold text-sm" onClick={() => setSelectedOrder(order)}>
                                  {order.mainOrderId || order.orderId || order.id}
                                </span>
                                {order.items?.[0] && (
                                  <a
                                    href={getProductPath(order.items[0] || order)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-400 hover:text-primary transition"
                                    title="প্রোডাক্ট পেজ খুলুন / Open Store Product Page"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                {/* Quick i-button */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedProductInfoOrder(order)}
                                  className="w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white flex items-center justify-center text-[9px] font-serif font-black transition cursor-pointer shrink-0 shadow-2xs"
                                  title="আইবাটন: প্রোডাক্টের বিস্তারিত, কত পিস, কত টাকা ও সোর্সিং লিংক"
                                >
                                  i
                                </button>
                                {order.subOrders && order.subOrders.length > 0 && (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-sans">
                                    {order.subOrders.length} Links
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-sans block mt-0.5">
                                {new Date(order.date).toLocaleDateString("en-GB")} · {totalPiecesCount} pcs ({totalVariationsCount} var)
                              </span>
                              {/* Sub-Orders badges */}
                              {order.subOrders && order.subOrders.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap mt-1">
                                  {order.subOrders.map((sub: any) => (
                                    <span 
                                      key={sub.subOrderId}
                                      className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded"
                                      title={`Sub-Order: ${sub.subOrderId} (${sub.productName})`}
                                    >
                                      {sub.subOrderId}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {inv.order1688Id && (
                                <span className="inline-block mt-1 mr-1 px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-mono font-bold">
                                  1688 ID: {inv.order1688Id}
                                </span>
                              )}
                              {inv.trackingNumber && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-mono font-bold">
                                  Tracking: {inv.trackingNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900 text-xs">{order.customerInfo?.name || "Customer"}</div>
                          <CustomerPhoneSecureDisplay
                            order={order}
                            viewerDepartment={currentAdminUser.department}
                            isMasterAdmin={isMasterAdmin}
                          />
                          {(order.customerInfo?.email || order.userEmail) && (
                            <div className="text-[11px] text-slate-500">{order.customerInfo?.email || order.userEmail}</div>
                          )}
                          {order.customerInfo?.address && (
                            <div className="text-[11px] text-slate-500 max-w-[200px] truncate" title={order.customerInfo.address}>
                              {order.customerInfo.address} {order.customerInfo.division ? `(${order.customerInfo.division})` : ""}
                            </div>
                          )}
                        </td>

                        {/* Live Invoice Charges Breakdown Column */}
                        <td className="px-4 py-4">
                          <div className="space-y-1 font-mono text-[11px]">
                            <div className="flex items-center gap-2 text-slate-600">
                              <span>Product: <strong className="text-slate-900">BDT {Number(inv.subTotal || 0).toLocaleString()}</strong></span>
                              <span>·</span>
                              <span>Partial Paid: <strong className="text-emerald-700">- BDT {Number(inv.paidAmount || 0).toLocaleString()}</strong></span>
                            </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <span>Assigned Shipping Rate: <strong className="text-indigo-700">BDT {Number(order.shippingRatePerKg ?? inv.shippingRatePerKg ?? 780).toLocaleString()} / KG</strong></span>
                                <span>·</span>
                                <span>Weight × Rate: <strong className="text-indigo-700">{inv.weightApx || "0 KG"} × BDT {inv.shippingRatePerKg || 780} = BDT {Number(inv.shippingCharge || 0).toLocaleString()}</strong></span>
                              </div>
                            <div className="flex items-center gap-2 pt-0.5">
                              <span>+ China Courier: <strong className="text-blue-700">BDT {Number(inv.chinaCourier || 0).toLocaleString()}</strong></span>
                              <span className="text-slate-400">→</span>
                              <span className="font-bold text-red-600 text-xs">Final Payable: BDT {Number(inv.totalDue || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </td>

                        {/* Payment Verification Column */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Paid (BDT {Number(inv.paidAmount || 0).toLocaleString()})
                              </span>
                            ) : hasProof ? (
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:underline cursor-pointer"
                              >
                                Verify Receipt
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                <Clock className="w-3.5 h-3.5" /> Unpaid
                              </span>
                            )}

                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <span className="uppercase font-semibold">{method}</span>
                              {order.paymentInfo?.transactionId && (
                                <span className="font-mono text-slate-400">({order.paymentInfo.transactionId})</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Order Status */}
                        <td className="px-4 py-4">
                          <select 
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            className="text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-300 bg-white text-slate-800 focus:border-primary outline-none cursor-pointer"
                          >
                            {(currentRole === "admin" ? statuses : allowedSubadminStatuses).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>

                        {/* Assigned Marketing Officer Column */}
                        <td className="px-4 py-4">
                          {order.assignedMarketingStaff?.name ? (
                            <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-2 max-w-[220px]">
                              <StaffAvatar
                                name={order.assignedMarketingStaff.name}
                                avatar={order.assignedMarketingStaff.avatar}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-[11px] text-indigo-950 truncate">
                                  {order.assignedMarketingStaff.name}
                                </div>
                                <div className="text-[10px] text-indigo-600 font-mono truncate">
                                  {order.assignedMarketingStaff.code || "KAM"} • {order.assignedMarketingStaff.phone}
                                </div>
                              </div>
                              {isMasterAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setAssignModalOrder(order)}
                                  className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 underline shrink-0 cursor-pointer"
                                  title="Change Marketing Officer (Main Admin only)"
                                >
                                  বদলান
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                                নট অ্যাসাইনড
                              </span>
                              {isMasterAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => setAssignModalOrder(order)}
                                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Assign Marketing Manager (Main Admin only)"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  <span>অ্যাসাইন</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">
                                  (মেইন এডমিন করবেন)
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Quick Product Info (i) Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedProductInfoOrder(order)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border border-blue-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs group"
                              title="আইবাটন: প্রোডাক্ট বিস্তারিত, কত পিস, কত টাকা ও সোর্সিং লিংক (i-button)"
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center text-[9px] font-serif font-black italic">i</span>
                              <span>প্রোডাক্ট বিস্তারিত</span>
                            </button>

                            <button
                              onClick={() => openQuickChargesEditor(order)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer ${
                                isQuickEditing
                                  ? "bg-slate-900 text-white"
                                  : "bg-primary hover:bg-primary-dark text-white"
                              }`}
                              title="Upload China Courier Bill, Parcel Weight (KG), and Shipping Charge"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{isQuickEditing ? "Close Editor" : "Update Courier / Weight / Shipping"}</span>
                            </button>

                            <button 
                              onClick={() => setInvoiceOrder(order)}
                              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                              title="Open full 2-part invoice editor & PDF print"
                            >
                              Full Invoice
                            </button>

                            {/* Quick Stock Out / Claim button */}
                            {order.status === "Stock Out" ? (
                              <button
                                type="button"
                                onClick={() => handleOpenStockOutModal(order)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                                  order.stockOutInfo?.customerChoice
                                    ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                                    : "bg-rose-600 hover:bg-rose-700 text-white"
                                }`}
                                title="Manage Stock-Out Claim / Resolution"
                              >
                                <AlertOctagon className="w-3.5 h-3.5" />
                                <span>{order.stockOutInfo?.customerChoice ? "Resolve Claim" : "Stock-Out"}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Mark order ${order.orderId || order.id} as Stock Out? Customer can choose Refund or Adjust on their dashboard.`)) {
                                    updateStatus(order.id, "Stock Out");
                                  }
                                }}
                                className="px-2 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                                title="Mark as Stock Out"
                              >
                                <AlertOctagon className="w-3 h-3 text-rose-500" />
                                <span>Stock Out</span>
                              </button>
                            )}

                            <button
                              onClick={() => toggleExpandOrder(order.id)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                              title="View product variations"
                            >
                              <span>Variations</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Details
                            </button>

                            <button
                              onClick={() => handleDeleteOrder(order.orderId || order.id)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition cursor-pointer"
                              title="Delete order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* INLINE QUICK EDITOR FOR CHINA COURIER BILL, WEIGHT (KG), AND SHIPPING CHARGE */}
                      {isQuickEditing && (
                        <tr>
                          <td colSpan={6} className="p-4 sm:p-5 bg-slate-50 border-y-2 border-primary/30">
                            <div className="max-w-5xl space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <h4 className="font-bold text-sm text-slate-900">
                                    Update Customer Invoice Charges — Order {order.orderId || order.id} ({order.customerInfo?.name})
                                  </h4>
                                  <p className="text-xs text-slate-500">
                                    Enter the China Courier Bill, Parcel Weight (KG), and Shipping Charge below. Saving immediately updates the Customer's Invoice.
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setInvoiceOrder(order)}
                                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Open Printable Invoice
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setQuickEditOrderId(null)}
                                    className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    1. Product Weight (KG)
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={quickForm.weightKg}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const kg = parseFloat(val.replace(/[^0-9.]/g, ""));
                                        setQuickForm((prev) => {
                                          const newForm = { ...prev, weightKg: val };
                                          if (autoCalculateShipping) {
                                            newForm.shippingCharge = !isNaN(kg) && kg >= 0 ? Math.round(kg * prev.ratePerKg) : prev.shippingCharge;
                                          }
                                          return newForm;
                                        });
                                      }}
                                      placeholder="e.g. 1.5 KG"
                                      className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:border-primary focus:outline-none"
                                    />
                                    <label className="flex items-center gap-1 text-[10px] whitespace-nowrap text-slate-600 font-semibold cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={autoCalculateShipping} 
                                        onChange={(e) => setAutoCalculateShipping(e.target.checked)}
                                        className="accent-primary"
                                      />
                                      Auto-calc
                                    </label>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-indigo-800 mb-1">
                                    2. Product Shipping Rate / KG
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={quickForm.ratePerKg}
                                    onChange={(e) => {
                                      const rate = Number(e.target.value);
                                      const kg = parseFloat(String(quickForm.weightKg).replace(/[^0-9.]/g, ""));
                                      const autoShip = !isNaN(kg) && kg >= 0 ? Math.round(kg * rate) : quickForm.shippingCharge;
                                      setQuickForm((prev) => ({
                                        ...prev,
                                        ratePerKg: rate,
                                        shippingCharge: autoShip,
                                      }));
                                    }}
                                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:border-primary focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    3. Total Shipping (Weight × Rate)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={quickForm.shippingCharge}
                                    onChange={(e) =>
                                      setQuickForm((prev) => ({ ...prev, shippingCharge: Number(e.target.value) }))
                                    }
                                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:border-primary focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    4. (+) China Courier Bill
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={quickForm.chinaCourier}
                                    onChange={(e) =>
                                      setQuickForm((prev) => ({ ...prev, chinaCourier: Number(e.target.value) }))
                                    }
                                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:border-primary focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                                    5. (-) Partial Paid (BDT)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={quickForm.paidAmount}
                                    onChange={(e) =>
                                      setQuickForm((prev) => ({ ...prev, paidAmount: Number(e.target.value) }))
                                    }
                                    className="w-full border border-emerald-300 bg-emerald-50/40 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-emerald-900 focus:border-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-purple-800 mb-1">
                                    6. 1688 Order ID
                                  </label>
                                  <input
                                    type="text"
                                    value={quickForm.order1688Id}
                                    onChange={(e) =>
                                      setQuickForm((prev) => ({ ...prev, order1688Id: e.target.value }))
                                    }
                                    placeholder="e.g. 1688-394857"
                                    className="w-full border border-purple-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-purple-900 focus:border-primary focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-blue-800 mb-1">
                                    7. Tracking Number
                                  </label>
                                  <input
                                    type="text"
                                    value={quickForm.trackingNumber}
                                    onChange={(e) =>
                                      setQuickForm((prev) => ({ ...prev, trackingNumber: e.target.value }))
                                    }
                                    placeholder="e.g. SF1492837"
                                    className="w-full border border-blue-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-blue-900 focus:border-primary focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* Live Calculation & Save Bar */}
                              {(() => {
                                const prodSub = Number(inv.subTotal || 0);
                                const newGrand =
                                  Math.max(0, prodSub - Number(quickForm.discount || 0)) +
                                  Number(quickForm.chinaCourier || 0) +
                                  Number(quickForm.shippingCharge || 0);
                                const newDue = Math.max(0, newGrand - Number(quickForm.paidAmount || 0));

                                return (
                                  <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white px-4 py-3 rounded-xl">
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                                      <span>Product: <strong>BDT {prodSub.toLocaleString()}</strong></span>
                                      <span>+ Shipping ({quickForm.weightKg} × BDT {quickForm.ratePerKg}): <strong>BDT {Number(quickForm.shippingCharge || 0).toLocaleString()}</strong></span>
                                      <span>+ China Courier: <strong>BDT {Number(quickForm.chinaCourier || 0).toLocaleString()}</strong></span>
                                      <span>- Partial Paid: <strong className="text-emerald-400">BDT {Number(quickForm.paidAmount || 0).toLocaleString()}</strong></span>
                                      <span>= Final Invoice Payable: <strong className="text-amber-300 text-sm">BDT {newDue.toLocaleString()}</strong></span>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={savingQuickId === order.id}
                                      onClick={() => handleSaveQuickCharges(order)}
                                      className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                    >
                                      {savingQuickId === order.id ? "Saving..." : "Save & Update Customer Invoice"}
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Inline Expanded Drawer for Variations of this Order */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-4 sm:p-5 bg-slate-50 border-y border-slate-200">
                            <div className="space-y-3 max-w-5xl">
                              <div className="flex items-center justify-between">
                                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-emerald-600" />
                                  <span>Order {order.id} Source Links & Variations Breakdown:</span>
                                </div>
                                <button 
                                  onClick={() => toggleExpandOrder(order.id)}
                                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded cursor-pointer"
                                >
                                  Close ✕
                                </button>
                              </div>
                              <OrderLinkVariationsView groups={linkGroups} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ======================================================= */}
      {/* ORDER DETAILS & PAYMENT SCREENSHOT VERIFICATION MODAL  */}
      {/* ======================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 border border-gray-100 overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-charcoal text-white p-5 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary text-white font-bold px-2 py-0.5 rounded">
                    {selectedOrder.id}
                  </span>
                  <span className="text-xs text-gray-300">
                    {new Date(selectedOrder.date).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-1">Order & Payment Details</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Edit & Print Invoice
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
              {/* Payment Proof Section */}
              <div className="bg-purple-50/70 border-2 border-purple-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-700" />
                    <h4 className="font-bold text-sm text-purple-900">
                      Payment Proof & Verification
                    </h4>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    selectedOrder.paymentStatus === "Paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    Status: {selectedOrder.paymentStatus || "Unpaid"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2 bg-white p-3.5 rounded-lg border border-purple-100">
                    <div>
                      <span className="text-gray-500 block">Payment Method:</span>
                      <span className="font-bold text-charcoal uppercase text-sm">
                        {selectedOrder.paymentInfo?.method || selectedOrder.customerInfo?.payment || "Online"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Sender Mobile / Account No:</span>
                      <span className="font-semibold text-charcoal">
                        {selectedOrder.paymentInfo?.senderNumber || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Transaction ID (TrxID):</span>
                      <span className="font-mono font-bold text-purple-800 text-sm bg-purple-50 px-2 py-0.5 rounded inline-block">
                        {selectedOrder.paymentInfo?.transactionId || "Not entered"}
                      </span>
                    </div>
                    {selectedOrder.paymentInfo?.submittedAt && (
                      <div>
                        <span className="text-gray-500 block">Submitted At:</span>
                        <span className="text-gray-700">
                          {new Date(selectedOrder.paymentInfo.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Screenshot Thumbnail */}
                  <div className="bg-white p-3.5 rounded-lg border border-purple-100 flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-gray-700 mb-2 block w-full text-left">
                      Uploaded Payment Screenshot:
                    </span>
                    {selectedOrder.paymentInfo?.screenshot ? (
                      <div className="relative group cursor-pointer" onClick={() => setImageModalUrl(selectedOrder.paymentInfo.screenshot)}>
                        <img 
                          src={selectedOrder.paymentInfo.screenshot} 
                          alt="Payment Screenshot" 
                          className="max-h-40 max-w-full rounded border object-contain shadow-xs group-hover:opacity-90"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold rounded transition">
                          Click to Enlarge
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                        No screenshot uploaded
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Buttons */}
                <div className="mt-4 pt-3 border-t border-purple-200 flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => verifyPayment(selectedOrder.id, "Paid")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Verify & Mark Paid
                  </button>
                  <button
                    onClick={() => verifyPayment(selectedOrder.id, "Verification Pending")}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
                  >
                    Keep Under Verification
                  </button>
                  <button
                    onClick={() => verifyPayment(selectedOrder.id, "Unpaid")}
                    className="border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-2 rounded-lg transition"
                  >
                    Cancel / Mark Unpaid
                  </button>
                </div>
              </div>

              {/* Customer & Shipping Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h4 className="font-bold text-charcoal text-sm">Customer Information</h4>
                    <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-bold">
                      Login Credentials
                    </span>
                  </div>
                  <p><strong className="text-gray-600">Name:</strong> {selectedOrder.customerInfo?.name}</p>
                  <div>
                    <strong className="text-gray-600">Phone Number:</strong>{" "}
                    <CustomerPhoneSecureDisplay
                      order={selectedOrder}
                      viewerDepartment={currentAdminUser.department}
                      isMasterAdmin={isMasterAdmin}
                      showActions={true}
                    />
                  </div>
                  <p><strong className="text-gray-600">Email:</strong> {selectedOrder.customerInfo?.email || "N/A"}</p>

                  {/* Customer Login Password Assist Box - Admin Only */}
                  {isMasterAdmin ? (
                    <div className="mt-2.5 pt-2 border-t border-amber-200 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-amber-800 font-bold block uppercase flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                          <span>Customer Login Password:</span>
                        </span>
                        <span className="font-mono font-black text-slate-900 text-sm select-all">
                          {selectedOrder.customerInfo?.password || selectedOrder.customerInfo?.lastLoginPassword || "123456"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const pass = selectedOrder.customerInfo?.password || selectedOrder.customerInfo?.lastLoginPassword || "123456";
                          navigator.clipboard.writeText(pass);
                          setCopiedPassOrderId(selectedOrder.id);
                          setTimeout(() => setCopiedPassOrderId(null), 2500);
                        }}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        title="Copy password"
                      >
                        {copiedPassOrderId === selectedOrder.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>কাস্টমার লগইন পাসওয়ার্ড:</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        সুরক্ষিত (শুধুমাত্র এডমিন অ্যাক্সেস)
                      </span>
                    </div>
                  )}

                  {/* Customer Cart & Wishlist Box */}
                  {(() => {
                    const custCart: any[] = Array.isArray(selectedOrder.customerInfo?.cart) ? selectedOrder.customerInfo.cart : [];
                    const custWishlist: any[] = Array.isArray(selectedOrder.customerInfo?.wishlist) ? selectedOrder.customerInfo.wishlist : [];
                    const canViewCustPhone = canViewCustomerPhone({
                      order: selectedOrder,
                      viewerDepartment: currentAdminUser.department,
                      isMasterAdmin: isMasterAdmin
                    });
                    const cleanPhone = canViewCustPhone ? String(selectedOrder.customerInfo?.phone || "").replace(/^0/, "").replace(/[^0-9]/g, "") : "";
                    const cartTotal = custCart.reduce((s: number, it: any) => s + (Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1)), 0);

                    return (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5 text-sky-600" />
                            <span>Customer Cart & Wishlist:</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setOrderModalCustItemTab("cart")}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                orderModalCustItemTab === "cart"
                                  ? "bg-sky-600 text-white shadow-2xs"
                                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                              }`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Cart ({custCart.length})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setOrderModalCustItemTab("wishlist")}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                orderModalCustItemTab === "wishlist"
                                  ? "bg-rose-600 text-white shadow-2xs"
                                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                              }`}
                            >
                              <Heart className="w-3.5 h-3.5" />
                              <span>Wishlist ({custWishlist.length})</span>
                            </button>
                          </div>
                        </div>

                        {orderModalCustItemTab === "cart" ? (
                          custCart.length > 0 ? (
                            <div className="space-y-1.5 bg-sky-50/60 p-2 rounded-lg border border-sky-200 max-h-44 overflow-y-auto">
                              <div className="flex items-center justify-between text-[11px] font-bold text-sky-900 pb-1 border-b border-sky-200">
                                <span>Cart Items: {custCart.length}</span>
                                <span>Total: Tk {cartTotal.toLocaleString()}</span>
                              </div>
                              {custCart.map((it: any, idx: number) => {
                                const itemPrice = Number(it.price || it.unitPrice || 0);
                                const itemQty = Number(it.quantity || 1);
                                const waMsg = `Hello ${selectedOrder.customerInfo?.name || "Customer"}, you have '${it.name || "Product"}' in your World Buy BD cart. Do you need any assistance placing your order?`;
                                return (
                                  <div key={idx} className="flex items-center justify-between gap-2 bg-white p-1.5 rounded border border-gray-200 text-[11px]">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <a
                                        href={getProductPath(it)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 block"
                                      >
                                        <img
                                          src={it.image || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200"}
                                          alt=""
                                          className="w-8 h-8 rounded object-cover border border-gray-200 shrink-0 hover:scale-105 transition"
                                        />
                                      </a>
                                      <div className="min-w-0">
                                        <a
                                          href={getProductPath(it)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="font-bold text-gray-800 hover:text-sky-700 line-clamp-1 flex items-center gap-1"
                                        >
                                          <span>{it.name}</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                        </a>
                                        <div className="text-[10px] text-gray-500 font-mono">
                                          Tk {itemPrice.toLocaleString()} × {itemQty} = Tk {(itemPrice * itemQty).toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                    {cleanPhone && (
                                      <a
                                        href={`https://wa.me/880${cleanPhone}?text=${encodeURIComponent(waMsg)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Notify customer via WhatsApp"
                                        className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white shrink-0 cursor-pointer"
                                      >
                                        <MessageSquare className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-2 text-center text-[10px] text-gray-400 italic bg-white rounded border border-dashed border-gray-200">
                              No products in cart
                            </div>
                          )
                        ) : (
                          custWishlist.length > 0 ? (
                            <div className="space-y-1.5 bg-rose-50/60 p-2 rounded-lg border border-rose-200 max-h-44 overflow-y-auto">
                              <div className="text-[11px] font-bold text-rose-900 pb-1 border-b border-rose-200">
                                Wishlist Items: {custWishlist.length}
                              </div>
                              {custWishlist.map((it: any, idx: number) => {
                                const itemPrice = Number(it.price || it.unitPrice || 0);
                                const waMsg = `Hello ${selectedOrder.customerInfo?.name || "Customer"}, your wishlisted item '${it.name || "Product"}' on World Buy BD currently has special offers!`;
                                return (
                                  <div key={idx} className="flex items-center justify-between gap-2 bg-white p-1.5 rounded border border-gray-200 text-[11px]">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <a
                                        href={getProductPath(it)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 block"
                                      >
                                        <img
                                          src={it.image || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200"}
                                          alt=""
                                          className="w-8 h-8 rounded object-cover border border-gray-200 shrink-0 hover:scale-105 transition"
                                        />
                                      </a>
                                      <div className="min-w-0">
                                        <a
                                          href={getProductPath(it)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="font-bold text-gray-800 hover:text-rose-700 line-clamp-1 flex items-center gap-1"
                                        >
                                          <span>{it.name}</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                        </a>
                                        <div className="text-[10px] text-gray-500 font-mono">
                                          Tk {itemPrice.toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                    {cleanPhone && (
                                      <a
                                        href={`https://wa.me/880${cleanPhone}?text=${encodeURIComponent(waMsg)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Notify customer via WhatsApp"
                                        className="p-1 rounded bg-rose-500 hover:bg-rose-600 text-white shrink-0 cursor-pointer"
                                      >
                                        <MessageSquare className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-2 text-center text-[10px] text-gray-400 italic bg-white rounded border border-dashed border-gray-200">
                              No products in wishlist
                            </div>
                          )
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-2">
                  <h4 className="font-bold text-charcoal text-sm mb-2">Delivery Address</h4>
                  <p><strong className="text-gray-600">Address:</strong> {selectedOrder.customerInfo?.address}</p>
                  <p><strong className="text-gray-600">Division:</strong> {selectedOrder.customerInfo?.division}</p>
                  <p><strong className="text-gray-600">Postal Code:</strong> {selectedOrder.customerInfo?.postalCode}</p>
                </div>
              </div>

              {/* Ordered Items Grouped by Source Link & Variations */}
              <div>
                <div className="mb-3">
                  <h4 className="font-bold text-sm sm:text-base text-charcoal flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Ordered Products & Source Link Variations List
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Detailed breakdown of variations and ordered pieces per source link
                  </p>
                </div>

                <OrderLinkVariationsView 
                  groups={groupOrderItemsByLink(selectedOrder.items || [], {
                    orderId: selectedOrder.id,
                    customerName: selectedOrder.customerInfo?.name,
                    status: selectedOrder.status,
                    orderDate: selectedOrder.date
                  })} 
                />

                <div className="mt-4 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex justify-between items-center text-xs sm:text-sm font-bold text-charcoal">
                  <span>Grand Total Bill (including items & shipping):</span>
                  <span className="text-base text-emerald-800 font-extrabold">BDT {Number(selectedOrder.total || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Admin Complete Logistics & Financial Breakdown + 2-Part Invoice (Customer + Office Copy) */}
              {(() => {
                const adminInv = buildInvoiceFromOrder(selectedOrder, selectedOrder.invoice);
                return (
                  <div className="space-y-4 pt-2 border-t border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-charcoal flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Complete Financial Breakdown & 2-Part Invoice (Customer + Office Copy)
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInvoiceOrder(selectedOrder)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Edit Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadCustomInvoicePdf(adminInv, "both")}
                          className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Download 2-Part Invoice (PDF)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                        <span className="text-[10px] font-bold text-slate-500 block">Product Price</span>
                        <span className="text-sm font-black text-slate-900 mt-0.5 block">
                          BDT {Number(adminInv.productSubtotal ?? adminInv.subTotal ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
                        <span className="text-[10px] font-bold text-blue-700 block">China Courier Fee</span>
                        <span className="text-sm font-black text-blue-950 mt-0.5 block">
                          BDT {Number(adminInv.chinaCourierCharge ?? adminInv.chinaCourier ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5">
                        <span className="text-[10px] font-bold text-indigo-700 block">Shipping Charge</span>
                        <span className="text-sm font-black text-indigo-950 mt-0.5 block">
                          BDT {Number(adminInv.shippingCharge ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                        <span className="text-[10px] font-bold text-amber-800 block">Weight</span>
                        <span className="text-sm font-black text-amber-950 mt-0.5 block">
                          {adminInv.weightKg ?? adminInv.weightApx ?? "0.50"} kg
                        </span>
                      </div>
                      <div className="bg-slate-900 text-white rounded-xl p-2.5">
                        <span className="text-[10px] font-bold text-slate-300 block">Grand Total</span>
                        <span className="text-sm font-black text-white mt-0.5 block">
                          BDT {Number(adminInv.grandTotal ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                        <span className="text-[10px] font-bold text-emerald-700 block">Paid Amount</span>
                        <span className="text-sm font-black text-emerald-800 mt-0.5 block">
                          BDT {Number(adminInv.paidAmount ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5">
                        <span className="text-[10px] font-bold text-orange-700 block">Due Balance</span>
                        <span className="text-sm font-black text-orange-700 mt-0.5 block">
                          BDT {Number(adminInv.dueAmount ?? adminInv.totalDue ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                      <CustomInvoiceView data={adminInv} copyMode="both" />
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-charcoal font-semibold rounded-lg text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Full-Screen Zoom Modal */}
      {imageModalUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs" onClick={() => setImageModalUrl(null)}>
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-xl p-2 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setImageModalUrl(null)} 
              className="absolute top-3 right-3 bg-charcoal text-white p-1.5 rounded-full hover:bg-primary transition shadow"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={imageModalUrl} alt="Payment Screenshot Zoom" className="max-h-[85vh] max-w-full object-contain rounded" />
          </div>
        </div>
      )}

      {/* Custom Invoice Modal for Admin */}
      {invoiceOrder && (
        <CustomInvoiceModal
          order={invoiceOrder}
          existingInvoice={invoiceOrder.invoice}
          isAdmin={true}
          onClose={() => setInvoiceOrder(null)}
          onSaved={(updated) => {
            loadOrders();
            if (selectedOrder && selectedOrder.id === invoiceOrder.id) {
              setSelectedOrder({ ...selectedOrder, invoice: updated });
            }
          }}
        />
      )}

      {/* Stock-Out Case & Customer Claim Resolution Modal for Admin */}
      {stockOutModalOrder && (
        <div className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-bold">
                  <AlertOctagon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Stock-Out Resolution: {stockOutModalOrder.mainOrderId || stockOutModalOrder.orderId || stockOutModalOrder.id}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Customer: {stockOutModalOrder.customerInfo?.name} ({stockOutModalOrder.customerInfo?.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStockOutModalOrder(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Product and Order Summary */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={stockOutModalOrder.items?.[0]?.image || stockOutModalOrder.items?.[0]?.variantImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120"}
                    alt="Product"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 line-clamp-1">
                      {stockOutModalOrder.items?.[0]?.name || stockOutModalOrder.items?.[0]?.description || "Product"}
                    </h4>
                    {stockOutModalOrder.items?.[0]?.variantName && (
                      <span className="text-[11px] text-slate-500 block">
                        Variant: <strong>{stockOutModalOrder.items[0].variantName}</strong>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">
                      Qty: {stockOutModalOrder.items?.[0]?.quantity || 1} pcs • Total: BDT {Number(stockOutModalOrder.total || stockOutModalOrder.subtotal || 0).toLocaleString()} BDT
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-rose-600 block">Refund Eligible</span>
                  <span className="text-base font-black font-mono text-rose-600">
                    Tk {getStockOutRefundAmount(stockOutModalOrder).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Customer Claim & Message Box */}
              {stockOutModalOrder.stockOutInfo?.customerChoice ? (
                <div className={`p-4 rounded-xl border-2 space-y-2 ${
                  stockOutModalOrder.stockOutInfo.customerChoice === "refund"
                    ? "bg-rose-50/70 border-rose-300 text-rose-950"
                    : "bg-indigo-50/70 border-indigo-300 text-indigo-950"
                }`}>
                  <div className="flex items-center justify-between border-b border-black/10 pb-2">
                    <span className="font-bold text-xs uppercase flex items-center gap-1.5">
                      {stockOutModalOrder.stockOutInfo.customerChoice === "refund" ? (
                        <>
                          <Banknote className="w-4 h-4 text-rose-600" />
                          <span>1. Cash Refund Claim</span>
                        </>
                      ) : (
                        <>
                          <Scale className="w-4 h-4 text-indigo-600" />
                          <span>2. Balance Adjustment Claim</span>
                        </>
                      )}
                    </span>
                    <span className="font-bold font-mono text-sm text-rose-700">
                      Tk {Number(stockOutModalOrder.stockOutInfo.totalRefundAmount || getStockOutRefundAmount(stockOutModalOrder)).toLocaleString()} BDT
                    </span>
                  </div>

                  {stockOutModalOrder.stockOutInfo.customerChoice === "refund" && (
                    <div className="bg-white/80 p-2.5 rounded-lg border border-rose-200 text-xs space-y-1">
                      <div>
                        <span className="text-slate-500">Payment Method:</span>{" "}
                        <strong className="uppercase text-rose-700 font-bold">{stockOutModalOrder.stockOutInfo.customerPaymentMethod || "bKash"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Account Number:</span>{" "}
                        <strong className="font-mono text-sm text-slate-900 font-bold">{stockOutModalOrder.stockOutInfo.customerAccountNumber || "N/A"}</strong>{" "}
                        <span className="text-[11px] text-slate-600">({stockOutModalOrder.stockOutInfo.customerAccountType || "Personal"})</span>
                      </div>
                      {stockOutModalOrder.stockOutInfo.customerBankDetails && (
                        <div>
                          <span className="text-slate-500">Bank Details:</span> {stockOutModalOrder.stockOutInfo.customerBankDetails}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer Message */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-300 text-xs space-y-1">
                    <div className="flex items-center gap-1 font-bold text-slate-700">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      <span>Customer Message:</span>
                    </div>
                    <p className="italic text-slate-800 bg-slate-50 p-2 rounded border-l-2 border-primary">
                      "{stockOutModalOrder.stockOutInfo.customerNote || "No additional message provided by customer."}"
                    </p>
                    {stockOutModalOrder.stockOutInfo.requestedAt && (
                      <div className="text-[10px] text-slate-400 text-right">
                        Submitted: {new Date(stockOutModalOrder.stockOutInfo.requestedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  Customer has not submitted their preference yet. You may communicate with the customer and resolve manually here.
                </div>
              )}

              {/* Admin Action Resolution Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>Admin Action & Approval:</span>
                  <span className="text-[11px] font-normal text-slate-500">Super Admin / Accounts</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Action:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStockOutProcessForm(prev => ({ ...prev, action: "refunded" }))}
                      className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        stockOutProcessForm.action === "refunded"
                          ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Send Cash Refund</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockOutProcessForm(prev => ({ ...prev, action: "adjusted" }))}
                      className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        stockOutProcessForm.action === "adjusted"
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Adjust Due Balance</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Refund or Adjustment Amount (BDT):
                    </label>
                    <input
                      type="number"
                      value={stockOutProcessForm.customRefundAmount}
                      onChange={(e) => setStockOutProcessForm(prev => ({ ...prev, customRefundAmount: Number(e.target.value) }))}
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs bg-white font-bold text-rose-600"
                    />
                  </div>

                  {stockOutProcessForm.action === "refunded" && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Bank / bKash Transaction ID (TrxID) *:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9K28JA10..."
                        value={stockOutProcessForm.adminTrxId}
                        onChange={(e) => setStockOutProcessForm(prev => ({ ...prev, adminTrxId: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs bg-white"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Admin Note / Message to Customer:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Refund sent successfully to bKash number / adjusted against invoice balance..."
                    value={stockOutProcessForm.adminActionNote}
                    onChange={(e) => setStockOutProcessForm(prev => ({ ...prev, adminActionNote: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setStockOutModalOrder(null)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={stockOutProcessForm.submitting}
                    onClick={handleProcessStockOut}
                    className={`px-5 py-2 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                      stockOutProcessForm.action === "refunded"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {stockOutProcessForm.submitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {stockOutProcessForm.submitting
                        ? "Processing..."
                        : stockOutProcessForm.action === "refunded"
                        ? `Complete Refund (Tk ${stockOutProcessForm.customRefundAmount.toLocaleString()})`
                        : `Adjust Due (Tk ${stockOutProcessForm.customRefundAmount.toLocaleString()})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Info & Sourcing Modal (আইবাটন - Details) */}
      {selectedProductInfoOrder && (
        <OrderProductInfoModal
          order={selectedProductInfoOrder}
          onClose={() => setSelectedProductInfoOrder(null)}
          onOpenFullPipeline={(o) => setSelectedOrder(o)}
        />
      )}

      {/* Marketing Account Manager Assignment Modal */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    মার্কেটিং ও কী অ্যাকাউন্ট ম্যানেজার অ্যাসাইন করুন
                  </h3>
                  <p className="text-xs text-slate-500">
                    অর্ডার: <strong className="font-mono text-slate-800">#{assignModalOrder.mainOrderId || assignModalOrder.orderId || assignModalOrder.id}</strong> • কাস্টমার: <strong className="text-slate-800">{assignModalOrder.customerInfo?.name || "Customer"}</strong> ({assignModalOrder.customerInfo?.phone || "N/A"})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Currently Assigned Notice */}
            {assignModalOrder.assignedMarketingStaff?.name && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <StaffAvatar
                    name={assignModalOrder.assignedMarketingStaff.name}
                    avatar={assignModalOrder.assignedMarketingStaff.avatar}
                    size="sm"
                  />
                  <div>
                    <span className="text-[10px] text-indigo-700 font-bold block">বর্তমানে নির্ধারিত অফিসার:</span>
                    <strong className="text-indigo-950 font-black">
                      {assignModalOrder.assignedMarketingStaff.name} ({assignModalOrder.assignedMarketingStaff.code || "KAM"})
                    </strong>
                    <span className="text-[10px] text-indigo-600 font-mono block">
                      📞 {assignModalOrder.assignedMarketingStaff.phone}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                  Assigned
                </span>
              </div>
            )}

            {/* Selection List of Marketing / Sales Staff */}
            <div className="space-y-2 mb-4 max-h-[320px] overflow-y-auto pr-1">
              <label className="text-xs font-bold text-slate-700 block">
                অফিসার নির্বাচন করুন (Select Marketing Officer):
              </label>

              {marketingStaffList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-slate-200 rounded-2xl">
                  কোনো সেলস বা মার্কেটিং অফিসার পাওয়া যায়নি।
                </div>
              ) : (
                marketingStaffList.map((staffDesk) => {
                  const isCurrent =
                    assignModalOrder.assignedMarketingStaff?.id === staffDesk.id ||
                    assignModalOrder.assignedMarketingStaff?.code === staffDesk.code ||
                    assignModalOrder.assignedMarketingStaff?.name === staffDesk.assignedStaff?.name;

                  return (
                    <div
                      key={staffDesk.id}
                      onClick={() => handleAssignMarketing(staffDesk, applyToCustomerOrders)}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                        isCurrent
                          ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-300/60 shadow-xs"
                          : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StaffAvatar
                          name={staffDesk.assignedStaff?.name || staffDesk.title}
                          avatar={staffDesk.assignedStaff?.avatar}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-xs font-bold text-slate-900 truncate">
                              {staffDesk.assignedStaff?.name}
                            </strong>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                              {staffDesk.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            📞 {staffDesk.assignedStaff?.phone} • {staffDesk.assignedStaff?.email}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-sm">
                            {staffDesk.title}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isCurrent ? (
                          <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow-2xs">
                            <Check className="w-3.5 h-3.5" />
                            <span>অ্যাসাইন করা আছে</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={assigningLoading}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition cursor-pointer border border-indigo-200"
                          >
                            অ্যাসাইন করুন →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Checkbox: Apply to all orders of this customer */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between mb-4 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={applyToCustomerOrders}
                  onChange={(e) => setApplyToCustomerOrders(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>এই কাস্টমারের ফোন নাম্বারে স্থায়ীভাবে নির্ধারণ করুন (পরবর্তী সকল অর্ডার স্বয়ংক্রিয়ভাবে ওনার নামেই অ্যাসাইন হবে)</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hidden sm:inline">স্বয়ংক্রিয় অটো-লিঙ্ক</span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignModalOrder(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
