import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Briefcase,
  ShoppingBag,
  Truck,
  DollarSign,
  Package,
  ChevronLeft,
  ChevronDown,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  Phone,
  Mail,
  User,
  ExternalLink,
  Shield,
  ShieldCheck,
  Layers,
  ArrowRight,
  TrendingUp,
  Building2,
  MapPin,
  Anchor,
  Share2,
  Crown,
  Plane,
  Boxes,
  MessageSquare,
  Landmark,
  CheckSquare,
  Printer,
  RotateCcw,
  Check,
  Send,
  ShoppingCart,
  Eye,
  Table,
  Trash2,
  X,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Plus,
  AlertCircle,
  AlertTriangle,
  Edit3,
  Save,
  XCircle,
  UserCheck,
  PhoneCall,
  MessageCircle,
  Sparkles,
  UserPlus,
  Camera,
  Upload,
  Image as ImageIcon,
  Copy,
  Download
} from "lucide-react";
import StaffAvatar from "../../components/admin/StaffAvatar";
import {
  RoleDashboard,
  SupportTicket,
  SalesQuote,
  DeliveryDispatch,
  AccountsTransaction,
  PurchaseQCOrder
} from "../../types/roleDashboard";
import { DEFAULT_ROLE_DASHBOARDS } from "../../utils/roleDashboardsData";
import { useAuth } from "../../context/AuthContext";
import UnifiedOrderModal from "../../components/admin/UnifiedOrderModal";
import OrderProductInfoModal from "../../components/admin/OrderProductInfoModal";
import CSOrderAnalyticsChart from "../../components/admin/CSOrderAnalyticsChart";
import MarketingTargetCustomerTiers from "../../components/admin/MarketingTargetCustomerTiers";
import { buildInvoiceFromOrder, downloadCustomInvoicePdf } from "../../utils/customInvoice";
import { downloadInvoicePdf } from "../../utils/invoicePdf";
import CustomerPhoneSecureDisplay from "../../components/admin/CustomerPhoneSecureDisplay";
import { canViewCustomerPhone } from "../../utils/customerPrivacy";
import { canAccessProductSourceLink } from "../../utils/productPrivacy";
import { getProductPath } from "../../utils/productUrl";

export default function RoleDashboardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<any | null>(null);
  const [selectedProductInfoOrder, setSelectedProductInfoOrder] = useState<any | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<"pipeline" | "timeline" | "invoice">("pipeline");
  const [isDownloadingInvoiceId, setIsDownloadingInvoiceId] = useState<string | null>(null);

  const isMasterAdmin = React.useMemo(() => {
    // 1. Only routes starting with /admin can be Main Admin panel
    if (typeof window === "undefined" || !window.location.pathname.startsWith("/admin")) {
      return false;
    }

    try {
      const adminUser = localStorage.getItem("admin_user");
      if (adminUser) {
        const parsed = JSON.parse(adminUser);
        const role = String(parsed?.role || "").toLowerCase();
        const email = String(parsed?.email || "").toLowerCase();
        if (
          role === "admin" ||
          role === "super_admin" ||
          email === "mdm859219@gmail.com" ||
          email === "radowan121537@gmail.com"
        ) {
          return true;
        }
        if (role === "subadmin" || role === "staff" || role.includes("marketing") || role === "sales person") {
          return false;
        }
      }

      const savedStaff = localStorage.getItem("admin_logged_in_staff");
      if (savedStaff) {
        const parsed = JSON.parse(savedStaff);
        const role = String(parsed?.role || "").toLowerCase();
        if (role === "admin" || role === "super_admin") return true;
        if (role === "staff" || role === "subadmin") return false;
      }
    } catch {}

    const authRole = String((authUser as any)?.role || "").toLowerCase();
    const authEmail = String((authUser as any)?.email || "").toLowerCase();
    if (
      authRole === "admin" ||
      authRole === "super_admin" ||
      authEmail === "mdm859219@gmail.com" ||
      authEmail === "radowan121537@gmail.com"
    ) {
      return true;
    }

    // Default to false: Never expose Main Admin controls or systems to other dashboards
    return false;
  }, [authUser]);

  const [allDashboards, setAllDashboards] = useState<RoleDashboard[]>(DEFAULT_ROLE_DASHBOARDS);
  const [dashboard, setDashboard] = useState<RoleDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseEdits, setPurchaseEdits] = useState<
    Record<
      string,
      {
        order1688Id: string;
        trackingNumber: string;
        status: string;
        chinaCourierCharge?: number;
        notes?: string;
      }
    >
  >({});
  const [csChargeEdits, setCsChargeEdits] = useState<
    Record<
      string,
      {
        shippingRatePerKg: number;
        weightKg: number;
        chinaCourierCharge: number;
        paidAmount: number;
        shippingCategory?: string;
      }
    >
  >({});
  const [showMarketingTiersModal, setShowMarketingTiersModal] = useState(false);
  const [showCsAnalyticsChart, setShowCsAnalyticsChart] = useState(true);
  const [savedOrderMsg, setSavedOrderMsg] = useState<string | null>(null);
  const [courierDrafts, setCourierDrafts] = useState<
    Record<string, { partner: string; tracking: string }>
  >({});
  const [savingCourierId, setSavingCourierId] = useState<string | null>(null);

  // Accounts Invoices Audit & Delivery Tracking State
  const [invoicesAuditList, setInvoicesAuditList] = useState<any[]>([]);
  const [activeAuditTab, setActiveAuditTab] = useState<"all" | "pending" | "delivered">("all");
  const [auditSearchTerm, setAuditSearchTerm] = useState("");
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [pendingNoteDrafts, setPendingNoteDrafts] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [noteSavedMsg, setNoteSavedMsg] = useState<string | null>(null);

  // New Invoice Manual Form State
  const [newInvNumber, setNewInvNumber] = useState("");
  const [newInvOrderId, setNewInvOrderId] = useState("");
  const [newInvCustomer, setNewInvCustomer] = useState("");
  const [newInvPhone, setNewInvPhone] = useState("");
  const [newInvAddress, setNewInvAddress] = useState("");
  const [newInvProduct, setNewInvProduct] = useState("");
  const [newInvQty, setNewInvQty] = useState(1);
  const [newInvAmount, setNewInvAmount] = useState(0);
  const [newInvDate, setNewInvDate] = useState(new Date().toISOString().split("T")[0]);
  const [newInvStatus, setNewInvStatus] = useState<"Pending" | "Delivered">("Pending");
  const [newInvDelayNote, setNewInvDelayNote] = useState("");
  const [newInvCourier, setNewInvCourier] = useState("");
  const [newInvTracking, setNewInvTracking] = useState("");
  const [savingNewInvoice, setSavingNewInvoice] = useState(false);

  // Operational Data for this dashboard
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [quotes, setQuotes] = useState<SalesQuote[]>([]);
  const [dispatches, setDispatches] = useState<DeliveryDispatch[]>([]);
  const [transactions, setTransactions] = useState<AccountsTransaction[]>([]);
  const [qcOrders, setQcOrders] = useState<PurchaseQCOrder[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Marketing & Sales Orders Hub State
  const [marketingSubTab, setMarketingSubTab] = useState<"all_orders" | "my_orders" | "quotes" | "targets" | "media">("all_orders");
  const [marketingSearch, setMarketingSearch] = useState("");
  const [marketingStatusFilter, setMarketingStatusFilter] = useState("all");
  const [assignModalOrder, setAssignModalOrder] = useState<any | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedKamFilterForAdmin, setSelectedKamFilterForAdmin] = useState<string>("all");

  // Marketing Media (Campaign Banners, Flyers, Promo Images) State
  const [marketingMediaList, setMarketingMediaList] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaCategory, setMediaCategory] = useState("banner");
  const [mediaDescription, setMediaDescription] = useState("");
  const [mediaImageUrl, setMediaImageUrl] = useState("");
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaSuccessMsg, setMediaSuccessMsg] = useState<string | null>(null);

  // Marketing Officer Photo Modal State
  const [showOfficerPhotoModal, setShowOfficerPhotoModal] = useState(false);
  const [customPhotoInput, setCustomPhotoInput] = useState("");
  const [officerPhotoSaving, setOfficerPhotoSaving] = useState(false);

  const fetchMarketingMedia = async () => {
    try {
      setLoadingMedia(true);
      const res = await fetch("/api/admin/marketing-media");
      if (res.ok) {
        const data = await res.json();
        setMarketingMediaList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to load marketing media:", e);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (dashboard?.department === "sales" || marketingSubTab === "media") {
      fetchMarketingMedia();
    }
  }, [dashboard?.department, marketingSubTab]);

  const handleDeskOfficerPhotoChange = async (newPhoto: string) => {
    if (!dashboard) return;
    try {
      setOfficerPhotoSaving(true);
      const cleanPhoto = newPhoto && newPhoto !== "remove" ? newPhoto : "";
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/staff-photo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: cleanPhoto })
      });
      if (res.ok) {
        setDashboard(prev => prev ? {
          ...prev,
          assignedStaff: { ...prev.assignedStaff, avatar: cleanPhoto }
        } : null);
        setShowOfficerPhotoModal(false);
        setSavedOrderMsg(cleanPhoto ? "মার্কেটিং অফিসারের ছবি সফলভাবে আপডেট করা হয়েছে!" : "ছবি মুছে ফেলা হয়েছে এবং ইনিশিয়াল আভাটার সেট করা হয়েছে!");
        setTimeout(() => setSavedOrderMsg(null), 3000);
      }
    } catch (err) {
      console.error("Failed to update officer photo:", err);
    } finally {
      setOfficerPhotoSaving(false);
    }
  };

  const handleAddMarketingMedia = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mediaImageUrl) {
      alert("অনুগ্রহ করে একটি ছবি নির্বাচন করুন অথবা অনলাইন লিংক দিন");
      return;
    }
    try {
      setMediaUploading(true);
      const res = await fetch("/api/admin/marketing-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: mediaTitle || "মার্কেটিং প্রমোশনাল ব্যানার",
          imageUrl: mediaImageUrl,
          category: mediaCategory,
          description: mediaDescription,
          uploadedBy: dashboard?.assignedStaff?.name || "Marketing Team"
        })
      });
      if (res.ok) {
        setMediaTitle("");
        setMediaImageUrl("");
        setMediaDescription("");
        setMediaSuccessMsg("মার্কেটিং ছবি সফলভাবে আপলোড করা হয়েছে!");
        setTimeout(() => setMediaSuccessMsg(null), 3000);
        await fetchMarketingMedia();
      }
    } catch (err) {
      console.error("Failed to save marketing media:", err);
      alert("ছবি সেভ করতে সমস্যা হয়েছে");
    } finally {
      setMediaUploading(false);
    }
  };

  const handleDeleteMarketingMedia = async (mediaId: string) => {
    if (!window.confirm("আপনি কি নিশ্চিত এই মার্কেটিং ছবিটি মুছে/সরিয়ে ফেলতে চান?")) return;
    try {
      const res = await fetch(`/api/admin/marketing-media/${mediaId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setMarketingMediaList(prev => prev.filter(m => m.id !== mediaId));
        setMediaSuccessMsg("মার্কেটিং ছবিটি সফলভাবে সরানো হয়েছে!");
        setTimeout(() => setMediaSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete media:", err);
    }
  };

  const handleAssignMarketingStaff = async (order: any, staffDashboard: RoleDashboard) => {
    try {
      setIsAssigning(true);
      const canonicalOrderId = String(order?.orderId || order?.id || "").trim();
      const payload = {
        orderId: canonicalOrderId,
        customerPhone: order.customerInfo?.phone || order.customerPhone || "",
        userId: order.userId || order.customerInfo?.userId || "",
        assignedMarketingStaff: {
          id: staffDashboard.id,
          code: staffDashboard.code,
          name: staffDashboard.assignedStaff.name,
          phone: staffDashboard.assignedStaff.phone,
          email: staffDashboard.assignedStaff.email,
          avatar: staffDashboard.assignedStaff.avatar,
          assignedAt: new Date().toISOString(),
          assignedBy: isMasterAdmin ? "Main Admin" : (dashboard?.assignedStaff?.name || "Marketing Staff")
        }
      };

      const res = await fetch("/api/orders/assign-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setOrders(prev =>
          prev.map(o => {
            const oid = String(o?.orderId || o?.id || "").trim();
            const oPhone = o.customerInfo?.phone || o.customerPhone || "";
            const cTail = payload.customerPhone ? payload.customerPhone.replace(/\D/g, "").slice(-10) : "";
            const oTail = oPhone ? oPhone.replace(/\D/g, "").slice(-10) : "";
            const matchesPhone = Boolean(cTail && oTail && (oTail === cTail || oTail.endsWith(cTail)));
            if (oid === canonicalOrderId || matchesPhone) {
              return {
                ...o,
                assignedMarketingStaff: payload.assignedMarketingStaff,
                assignedMarketingId: payload.assignedMarketingStaff.id,
                assignedMarketingName: payload.assignedMarketingStaff.name
              };
            }
            return o;
          })
        );
        setAssignModalOrder(null);
        setSavedOrderMsg(`অর্ডারটি সফলভাবে ${staffDashboard.assignedStaff.name} (${staffDashboard.code})-এর নামে অ্যাসাইন করা হয়েছে!`);
        setTimeout(() => setSavedOrderMsg(null), 3500);
      } else {
        alert("অ্যাসাইন করতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন।");
      }
    } catch (err) {
      console.error("Failed to assign marketing staff:", err);
      alert("Error assigning marketing staff");
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter Marketing Orders
  const allMarketingOrders = React.useMemo(() => {
    return orders.filter(o => {
      if (marketingStatusFilter !== "all" && o.status !== marketingStatusFilter) return false;
      if (marketingSearch.trim()) {
        const q = marketingSearch.trim().toLowerCase();
        const oid = String(o.orderId || o.id || "").toLowerCase();
        const cName = String(o.customerInfo?.name || o.customerName || "").toLowerCase();
        const cPhone = String(o.customerInfo?.phone || o.customerPhone || "").toLowerCase();
        const staffName = String(o.assignedMarketingStaff?.name || "").toLowerCase();
        return oid.includes(q) || cName.includes(q) || cPhone.includes(q) || staffName.includes(q);
      }
      return true;
    });
  }, [orders, marketingStatusFilter, marketingSearch]);

  const myAssignedOrders = React.useMemo(() => {
    return orders.filter(o => {
      if (isMasterAdmin && selectedKamFilterForAdmin !== "all") {
        return (
          o.assignedMarketingStaff?.id === selectedKamFilterForAdmin ||
          o.assignedMarketingStaff?.code?.toLowerCase() === selectedKamFilterForAdmin.toLowerCase()
        );
      }
      const matchesDesk = Boolean(
        (dashboard?.id && o.assignedMarketingStaff?.id === dashboard.id) ||
        (dashboard?.code && o.assignedMarketingStaff?.code === dashboard.code) ||
        (dashboard?.assignedStaff?.name && o.assignedMarketingStaff?.name === dashboard.assignedStaff.name)
      );

      if (isMasterAdmin && selectedKamFilterForAdmin === "all") {
        return Boolean(o.assignedMarketingStaff?.name);
      }

      return matchesDesk;
    }).filter(o => {
      if (marketingStatusFilter !== "all" && o.status !== marketingStatusFilter) return false;
      if (marketingSearch.trim()) {
        const q = marketingSearch.trim().toLowerCase();
        const oid = String(o.orderId || o.id || "").toLowerCase();
        const cName = String(o.customerInfo?.name || o.customerName || "").toLowerCase();
        const cPhone = String(o.customerInfo?.phone || o.customerPhone || "").toLowerCase();
        return oid.includes(q) || cName.includes(q) || cPhone.includes(q);
      }
      return true;
    });
  }, [orders, dashboard, isMasterAdmin, selectedKamFilterForAdmin, marketingStatusFilter, marketingSearch]);

  // Seamless merge of orders and manual invoices
  const allInvoices = React.useMemo(() => {
    const list = [...invoicesAuditList];
    orders.forEach((o: any) => {
      const oid = String(o.orderId || o.id || "");
      const invNum = o.invoice?.invoiceNumber || o.invoiceNumber || `WB-INV-${oid.slice(-6)}`;
      const alreadyInList = list.some(
        (item: any) => (item.orderId && String(item.orderId) === oid) || item.invoiceNumber === invNum
      );
      if (!alreadyInList) {
        const isDelivered = o.status === "Delivered" || o.deliveryStatus === "Delivered" || o.deliveryInfo?.status === "Delivered";
        list.push({
          id: `ord-inv-${oid}`,
          orderId: oid,
          invoiceNumber: invNum,
          customerName: o.customerInfo?.name || o.customerName || "Customer",
          customerPhone: o.customerInfo?.phone || o.customerPhone || "",
          customerAddress: o.customerInfo?.address || o.customerAddress || "",
          productName: o.items?.[0]?.name || o.productName || "Import Product",
          quantity: o.items?.[0]?.quantity || o.totalQuantity || 1,
          totalAmount: Number(o.grandTotal ?? o.total ?? o.totalAmount ?? o.subtotal ?? 0),
          receivedDate: o.invoiceReceivedDate || o.invoice?.date || o.date || new Date().toISOString().split("T")[0],
          deliveryStatus: isDelivered ? "Delivered" : "Pending",
          deliveryDelayNote: o.deliveryDelayNote || o.accountsDelayNote || o.pendingReason || "",
          courierPartner: o.courierPartner || o.courierName || o.deliveryCourier || "",
          trackingNumber: o.courierTracking || o.deliveryInfo?.trackingNumber || "",
          isManual: false,
          rawOrder: o
        });
      }
    });

    // Sort by latest
    list.sort((a: any, b: any) => {
      const dateA = new Date(a.receivedDate || a.updatedAt || 0).getTime();
      const dateB = new Date(b.receivedDate || b.updatedAt || 0).getTime();
      return dateB - dateA;
    });

    return list;
  }, [invoicesAuditList, orders]);

  // Accounts Real-Time Statistics & Courier Performance
  const accountsStats = React.useMemo(() => {
    // 1. Total Invoices Received
    const invoicesReceivedCount = allInvoices.length;

    // 2. Invoices Delivered
    const deliveredInvoices = allInvoices.filter((i: any) => i.deliveryStatus === "Delivered");
    const invoicesDeliveredCount = deliveredInvoices.length;

    // 3. Invoices Pending Delivery
    const pendingInvoices = allInvoices.filter((i: any) => i.deliveryStatus !== "Delivered");
    const invoicesPendingCount = pendingInvoices.length;

    // 4. Total Amount of Delivered Products (BDT)
    const totalDeliveredAmount = deliveredInvoices.reduce((sum: number, i: any) => {
      const amt = Number(i.totalAmount || 0);
      return sum + amt;
    }, 0);

    // Delivered orders for backwards-compatibility courier table
    const deliveredOrders = orders.filter(
      (o: any) => o.status === "Delivered" || o.deliveryStatus === "Delivered" || o.deliveryInfo?.status === "Delivered"
    );

    // Courier breakdown
    const courierBreakdown: Record<string, { count: number; totalAmount: number }> = {
      "Steadfast": { count: 0, totalAmount: 0 },
      "Pathao": { count: 0, totalAmount: 0 },
      "Sundarban Courier Service": { count: 0, totalAmount: 0 },
      "Other": { count: 0, totalAmount: 0 }
    };

    for (const o of deliveredOrders) {
      const cName = o.courierName || o.courierPartner || o.deliveryCourier || o.deliveryInfo?.courier || "Other";
      let key = "Other";
      if (/steadfast/i.test(cName)) key = "Steadfast";
      else if (/pathao/i.test(cName)) key = "Pathao";
      else if (/sundarban/i.test(cName)) key = "Sundarban Courier Service";
      else key = cName || "Other";

      if (!courierBreakdown[key]) {
        courierBreakdown[key] = { count: 0, totalAmount: 0 };
      }
      courierBreakdown[key].count += 1;
      courierBreakdown[key].totalAmount += Number(o.grandTotal ?? o.total ?? o.totalAmount ?? o.subtotal ?? 0);
    }

    return {
      invoicesReceivedCount,
      invoicesDeliveredCount,
      invoicesPendingCount,
      totalDeliveredAmount,
      deliveredOrders,
      courierBreakdown
    };
  }, [orders]);

  // Marketing Real-Time Target & Customer Bracket Statistics
  const marketingStats = React.useMemo(() => {
    const targetAmount = 5000000; // BDT 50,00,000 monthly target
    const confirmedOrders = orders.filter((o: any) => {
      const s = String(o.status || "").toLowerCase();
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
    });

    const totalAchieved = confirmedOrders.reduce((sum: number, o: any) => {
      return sum + Number(o.grandTotal ?? o.total ?? o.totalAmount ?? o.subtotal ?? 0);
    }, 0);

    const percentAchieved = targetAmount > 0 ? Math.min(100, Math.round((totalAchieved / targetAmount) * 100)) : 0;
    const remainingTarget = Math.max(0, targetAmount - totalAchieved);

    // Customer tier brackets calculation
    const customerMap: Record<string, { name: string; phone: string; address: string; totalSpent: number; orderCount: number }> = {};
    for (const o of confirmedOrders) {
      const phone = o.customerInfo?.phone || o.phone || "Unknown";
      const name = o.customerInfo?.name || o.customer || "Customer";
      const address = o.customerInfo?.address || o.address || "";
      const amt = Number(o.grandTotal ?? o.total ?? o.totalAmount ?? o.subtotal ?? 0);
      if (!customerMap[phone]) {
        customerMap[phone] = { name, phone, address, totalSpent: 0, orderCount: 0 };
      }
      customerMap[phone].totalSpent += amt;
      customerMap[phone].orderCount += 1;
    }

    const customersList = Object.values(customerMap);
    const tier2kTo50k = customersList.filter(c => c.totalSpent >= 2000 && c.totalSpent <= 50000);
    const tier5kTo50k = customersList.filter(c => c.totalSpent >= 5000 && c.totalSpent <= 50000);
    const tier50kPlus = customersList.filter(c => c.totalSpent > 50000);

    return {
      targetAmount,
      totalAchieved,
      percentAchieved,
      remainingTarget,
      confirmedCount: confirmedOrders.length,
      totalCustomersCount: customersList.length,
      tier2kTo50kCount: tier2kTo50k.length,
      tier2kTo50kTotal: tier2kTo50k.reduce((s, c) => s + c.totalSpent, 0),
      tier5kTo50kCount: tier5kTo50k.length,
      tier5kTo50kTotal: tier5kTo50k.reduce((s, c) => s + c.totalSpent, 0),
      tier50kPlusCount: tier50kPlus.length,
      tier50kPlusTotal: tier50kPlus.reduce((s, c) => s + c.totalSpent, 0),
    };
  }, [orders]);

  // Search & Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = React.useMemo(() => {
    let result = orders;

    if (filterStatus && filterStatus !== "all") {
      if (filterStatus === "confirmed") {
        result = result.filter((o: any) => {
          const s = String(o.status || "").toLowerCase();
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
        });
      } else if (filterStatus === "pending") {
        result = result.filter((o: any) => {
          const s = String(o.status || "").toLowerCase();
          return s === "pending" || s === "order placed" || !o.status;
        });
      } else if (filterStatus === "delivered") {
        result = result.filter((o: any) => o.status === "Delivered");
      } else {
        result = result.filter((o: any) => o.status === filterStatus);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((o: any) => {
        const oid = String(o.orderId || o.id || o.mainOrderId || "").toLowerCase();
        const custName = String(o.customerInfo?.name || o.customer || "").toLowerCase();
        const custPhone = String(o.customerInfo?.phone || o.phone || "").toLowerCase();
        const tracking = String(o.trackingNumber || o.chinaWarehouseInfo?.trackingNumber || "").toLowerCase();
        const order1688 = String(o.order1688Id || "").toLowerCase();
        return (
          oid.includes(q) ||
          custName.includes(q) ||
          custPhone.includes(q) ||
          tracking.includes(q) ||
          order1688.includes(q)
        );
      });
    }

    return result;
  }, [orders, searchQuery, filterStatus]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [orderSearchId, setOrderSearchId] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<any | null>(null);

  // Form states for new records
  const [ticketForm, setTicketForm] = useState({
    customerName: "",
    customerPhone: "",
    orderId: "",
    subject: "",
    details: "",
    priority: "medium",
    type: "inquiry",
    refundAmount: 0,
    refundMethod: "bKash"
  });

  const [quoteForm, setQuoteForm] = useState({
    clientName: "",
    clientCompany: "",
    clientPhone: "",
    productName: "",
    quantity: 10,
    rmbUnitPrice: 20,
    rmbTotal: 200,
    bdtTotal: 6000,
    shippingType: "air" as "air" | "sea",
    cbmWeight: "10 KG",
    offeredDiscountPct: 5,
    notes: ""
  });

  const [dispatchForm, setDispatchForm] = useState({
    orderId: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    chinaAwb: "",
    courierName: "Steadfast" as any,
    trackingNumber: "",
    stage: "china_warehouse" as any,
    weightKg: 1.5,
    codAmount: 2500,
    notes: ""
  });

  const [txForm, setTxForm] = useState({
    type: "income" as any,
    account: "bKash" as any,
    amountBDT: 5000,
    amountRMB: 0,
    exchangeRate: 22.8,
    category: "Customer Advance Deposit",
    description: "",
    referenceNo: ""
  });

  const [qcForm, setQcForm] = useState({
    orderId: "",
    offerId: "",
    supplierName: "",
    orderSupplierId: "",
    productTitle: "",
    quantity: 1,
    agreedPriceRMB: 25,
    supplierAlipayId: "",
    settlementStatus: "unpaid" as any,
    qcStatus: "pending_arrival" as any,
    chinaTrackingNo: "",
    notes: ""
  });

  // Fetch Dashboard and Records
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const targetId = id || "cs-1";

      const [listRes, detailRes, ordersRes, auditRes] = await Promise.all([
        fetch("/api/admin/role-dashboards").catch(() => null),
        fetch(`/api/admin/role-dashboards/${targetId}`).catch(() => null),
        fetch("/api/orders").catch(() => null),
        fetch("/api/admin/accounts/invoices-audit").catch(() => null)
      ]);

      if (listRes && listRes.ok) {
        const listData = await listRes.json();
        if (Array.isArray(listData) && listData.length > 0) {
          setAllDashboards(listData);
        }
      }

      let liveOrders: any[] = [];
      if (ordersRes && ordersRes.ok) {
        const oData = await ordersRes.json();
        if (Array.isArray(oData)) liveOrders = oData;
      }

      if (auditRes && auditRes.ok) {
        const aData = await auditRes.json();
        if (Array.isArray(aData)) {
          setInvoicesAuditList(aData);
        }
      }

      if (detailRes && detailRes.ok) {
        const data = await detailRes.json();
        setDashboard(data.dashboard);
        setTickets(data.tickets || []);
        setQuotes(data.quotes || []);
        setDispatches(data.dispatches || []);
        setTransactions(data.transactions || []);
        setQcOrders(data.qcOrders || []);
        setOrders(liveOrders.length > 0 ? liveOrders : data.orders || []);
      } else {
        // Fallback from static
        const matched = DEFAULT_ROLE_DASHBOARDS.find(d => d.id === targetId || d.code.toLowerCase() === targetId.toLowerCase()) || DEFAULT_ROLE_DASHBOARDS[0];
        setDashboard(matched);
        if (liveOrders.length > 0) setOrders(liveOrders);
      }
    } catch (err) {
      console.error("Error loading dashboard details:", err);
    } finally {
      setLoading(false);
    }
  };

  // Accounts: Save / Update Pending Delivery Delay Reason Note
  const handleSavePendingNote = async (item: any, noteVal?: string) => {
    const itemId = String(item.id || item.orderId || item.invoiceNumber);
    const noteToSave = noteVal !== undefined ? noteVal : (pendingNoteDrafts[itemId] ?? item.deliveryDelayNote ?? "");
    setSavingNoteId(itemId);
    try {
      const res = await fetch(`/api/admin/accounts/invoices-audit/${encodeURIComponent(itemId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: item.orderId,
          invoiceNumber: item.invoiceNumber,
          deliveryDelayNote: noteToSave
        })
      });
      if (res.ok) {
        setNoteSavedMsg(`✓ ইনভয়েস ${item.invoiceNumber}: বিলম্ব নোট সেভ হয়েছে`);
        setTimeout(() => setNoteSavedMsg(null), 3000);
        setInvoicesAuditList(prev =>
          prev.map(inv => (inv.id === itemId || inv.invoiceNumber === item.invoiceNumber ? { ...inv, deliveryDelayNote: noteToSave } : inv))
        );
        fetchDashboardData();
      } else {
        alert("নোট সেভ করতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving pending note");
    } finally {
      setSavingNoteId(null);
    }
  };

  // Accounts: One-Click Mark Invoice as Delivered
  const handleMarkInvoiceDelivered = async (item: any) => {
    const itemId = String(item.id || item.orderId || item.invoiceNumber);
    setSavingNoteId(itemId);
    try {
      const res = await fetch(`/api/admin/accounts/invoices-audit/${encodeURIComponent(itemId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: item.orderId,
          invoiceNumber: item.invoiceNumber,
          deliveryStatus: "Delivered"
        })
      });
      if (res.ok) {
        setNoteSavedMsg(`✓ ইনভয়েস ${item.invoiceNumber}: ডেলিভারি সম্পন্ন মার্ক করা হয়েছে`);
        setTimeout(() => setNoteSavedMsg(null), 3000);
        setInvoicesAuditList(prev =>
          prev.map(inv => (inv.id === itemId || inv.invoiceNumber === item.invoiceNumber ? { ...inv, deliveryStatus: "Delivered" } : inv))
        );
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNoteId(null);
    }
  };

  // Accounts: Log / Write Received Invoice
  const handleCreateInvoiceAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvNumber.trim()) {
      alert("অনুগ্রহ করে ইনভয়েস নম্বর লিখুন");
      return;
    }
    setSavingNewInvoice(true);
    try {
      const res = await fetch("/api/admin/accounts/invoices-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: newInvNumber,
          orderId: newInvOrderId,
          customerName: newInvCustomer,
          customerPhone: newInvPhone,
          customerAddress: newInvAddress,
          productName: newInvProduct,
          quantity: newInvQty,
          totalAmount: newInvAmount,
          receivedDate: newInvDate,
          deliveryStatus: newInvStatus,
          deliveryDelayNote: newInvDelayNote,
          courierPartner: newInvCourier,
          trackingNumber: newInvTracking
        })
      });
      if (res.ok) {
        setShowAddInvoiceModal(false);
        setNoteSavedMsg(`✓ ইনভয়েস ${newInvNumber} সফলভাবে এন্ট্রি হয়েছে`);
        setTimeout(() => setNoteSavedMsg(null), 3000);
        // Reset form
        setNewInvNumber("");
        setNewInvOrderId("");
        setNewInvCustomer("");
        setNewInvPhone("");
        setNewInvAddress("");
        setNewInvProduct("");
        setNewInvQty(1);
        setNewInvAmount(0);
        setNewInvDelayNote("");
        fetchDashboardData();
      } else {
        alert("ইনভয়েস এন্ট্রি সেভ করতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      console.error(err);
      alert("Error logging invoice");
    } finally {
      setSavingNewInvoice(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [id]);

  // Order Lookup Quick Helper
  const handleOrderLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSearchId.trim()) return;
    const term = orderSearchId.trim().toLowerCase();
    const found = orders.find(
      o =>
        o.id?.toLowerCase() === term ||
        o.orderId?.toLowerCase() === term ||
        o.mainOrderId?.toLowerCase() === term ||
        (Array.isArray(o.subOrders) && o.subOrders.some((s: any) => s.subOrderId?.toLowerCase() === term))
    );
    if (found) {
      setSearchedOrder(found);
    } else {
      alert(`Order ID "${orderSearchId}" not found.`);
      setSearchedOrder(null);
    }
  };

  // Operational Submissions
  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboard) return;
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketForm)
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setShowAddModal(false);
        setTicketForm({
          customerName: "",
          customerPhone: "",
          orderId: "",
          subject: "",
          details: "",
          priority: "medium",
          type: "inquiry",
          refundAmount: 0,
          refundMethod: "bKash"
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTicketStatus = async (ticket: SupportTicket, newStatus: any) => {
    if (!dashboard) return;
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ticket, status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboard) return;
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteForm)
      });
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes || []);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboard) return;
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dispatchForm)
      });
      if (res.ok) {
        const data = await res.json();
        setDispatches(data.dispatches || []);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDispatchStage = async (disp: DeliveryDispatch, newStage: any) => {
    if (!dashboard) return;
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...disp, stage: newStage })
      });
      if (res.ok) {
        const data = await res.json();
        setDispatches(data.dispatches || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboard) return;
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/ledger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txForm)
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveQC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboard) return;
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/qc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(qcForm)
      });
      if (res.ok) {
        const data = await res.json();
        setQcOrders(data.qcOrders || []);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateQCStatus = async (qc: PurchaseQCOrder, newStatus: any) => {
    if (!dashboard) return;
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/qc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...qc, qcStatus: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setQcOrders(data.qcOrders || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDispatch = async (dispatchId: string) => {
    if (!dashboard || !window.confirm("Are you sure you want to delete this dispatch record from Staff Desks?")) return;
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/dispatch/${dispatchId}`, { method: "DELETE" });
      if (res.ok) {
        setDispatches(prev => prev.filter(d => d.id !== dispatchId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!dashboard || !window.confirm("Are you sure you want to delete this quotation from Staff Desks?")) return;
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/quotes/${quoteId}`, { method: "DELETE" });
      if (res.ok) {
        setQuotes(prev => prev.filter(q => q.id !== quoteId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!dashboard || !window.confirm("Are you sure you want to delete this transaction record from Staff Desks?")) return;
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/ledger/${txId}`, { method: "DELETE" });
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t.id !== txId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQC = async (qcId: string) => {
    if (!dashboard || !window.confirm("Are you sure you want to delete this QC record from Staff Desks?")) return;
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}/qc/${qcId}`, { method: "DELETE" });
      if (res.ok) {
        setQcOrders(prev => prev.filter(q => q.id !== qcId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCurrentDesk = async () => {
    if (!dashboard) return;
    if (!window.confirm(`Are you sure you want to delete "${dashboard.title}" (${dashboard.code}) from Staff Desks?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/role-dashboards/${dashboard.id}`, { method: "DELETE" });
      if (res.ok) {
        navigate("/admin/role-dashboards");
      } else {
        alert("Failed to delete desk");
      }
    } catch (err) {
      console.error("Error deleting desk:", err);
      alert("Error deleting desk");
    }
  };

  const handleSavePurchaseOrderTracking = async (order: any, customStatus?: string) => {
    const oid = String(order.orderId || order.id || "");
    const draft = purchaseEdits[oid] || {
      order1688Id: order.order1688Id || order.purchaseInfo?.supplierOrderId || order.invoice?.order1688Id || "",
      trackingNumber:
        order.trackingNumber ||
        order.chinaWarehouseInfo?.trackingNumber ||
        order.purchaseInfo?.chinaTrackingNumber ||
        order.invoice?.trackingNumber ||
        "",
      status: customStatus || (order.status === "Stock Out" ? "Stock Out" : (order.status || "Purchased")),
      chinaCourierCharge: Number(order.chinaCourierCharge ?? order.invoice?.chinaCourier ?? 0),
      notes: order.purchaseNotes || order.notes || "",
    };

    const targetStatus = customStatus || draft.status || "Purchased";
    const courierBill = Math.round(Number(draft.chinaCourierCharge || 0));

    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(oid)}/unified-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          order1688Id: draft.order1688Id,
          trackingNumber: draft.trackingNumber,
          chinaCourierCharge: courierBill,
          chinaCourier: courierBill,
          purchaseNotes: draft.notes,
          invoice: {
            ...(order.invoice || {}),
            order1688Id: draft.order1688Id,
            trackingNumber: draft.trackingNumber,
            chinaCourier: courierBill,
            chinaCourierCharge: courierBill,
          },
          purchaseInfo: {
            ...(order.purchaseInfo || {}),
            supplierOrderId: draft.order1688Id,
            order1688Id: draft.order1688Id,
            chinaTrackingNumber: draft.trackingNumber,
            chinaCourierCharge: courierBill,
            purchaseStatus: targetStatus,
            notes: draft.notes,
          },
          chinaWarehouseInfo: {
            ...(order.chinaWarehouseInfo || {}),
            trackingNumber: draft.trackingNumber,
            status: targetStatus === "Received in China Warehouse" ? "Received in China Warehouse" : undefined,
          },
          timelineNote: `Purchase Dept updated Order ${oid}: Status "${targetStatus}", 1688 ID "${draft.order1688Id || 'N/A'}", Tracking "${draft.trackingNumber || 'N/A'}", China Courier ৳${courierBill}, Note: "${draft.notes || 'None'}"`,
        }),
      });
      if (res.ok) {
        setSavedOrderMsg(`✓ পারসেজ তথ্য ও স্ট্যাটাস (${targetStatus}) সেভ হয়েছে (Order ${oid})`);
        setTimeout(() => setSavedOrderMsg(null), 3500);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCourier = async (order: any, partnerVal?: string, trackingVal?: string) => {
    const oid = String(order.orderId || order.id || "");
    const partner = partnerVal !== undefined ? partnerVal : (courierDrafts[oid]?.partner ?? order.courierPartner ?? order.courierName ?? "");
    const tracking = trackingVal !== undefined ? trackingVal : (courierDrafts[oid]?.tracking ?? order.courierTracking ?? order.deliveryInfo?.trackingNumber ?? "");

    setSavingCourierId(oid);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(oid)}/unified-update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-department": isMasterAdmin ? "main_admin" : (dashboard?.department || "accounts"),
          "x-user-role": isMasterAdmin ? "main_admin" : (dashboard?.department || "accounts")
        },
        body: JSON.stringify({
          courierName: partner,
          courierPartner: partner,
          deliveryCourier: partner,
          courierTracking: tracking,
          courierConsignmentId: tracking,
          deliveryInfo: {
            ...(order.deliveryInfo || {}),
            courier: partner,
            courierPartner: partner,
            trackingNumber: tracking,
            consignmentId: tracking
          },
          timelineNote: `Courier indicated as "${partner || "Not Assigned"}" (Tracking: ${tracking || "N/A"}) by ${dashboard?.title || (isMasterAdmin ? "Main Admin" : "Accounts")}`
        })
      });
      if (res.ok) {
        setSavedOrderMsg(`✓ Order ${oid}: কুরিয়ার "${partner || 'আপডেট'}" সফলভাবে সেভ করা হয়েছে`);
        setTimeout(() => setSavedOrderMsg(null), 3500);
        fetchDashboardData();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to update courier");
      }
    } catch (err) {
      console.error("Courier update error:", err);
    } finally {
      setSavingCourierId(null);
    }
  };

  const handleAdminConfirmOrder = async (order: any, nextStatus: string) => {
    const oid = String(order.orderId || order.id || "");
    const nowDate = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(oid)}/unified-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          ...(nextStatus === "Delivered"
            ? {
                deliveryInfo: {
                  ...(order.deliveryInfo || {}),
                  status: "Delivered",
                  deliveredAt: nowDate,
                  deliveredTime: nowTime,
                },
              }
            : {}),
          timelineNote: `Status updated to "${nextStatus}" by ${dashboard?.title || "Authorized Staff"}`,
        }),
      });
      if (res.ok) {
        setSavedOrderMsg(`Order ${oid} updated to ${nextStatus}`);
        setTimeout(() => setSavedOrderMsg(null), 3500);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCsConfirmOrder = async (order: any, rate: number, categoryName?: string) => {
    const oid = String(order.orderId || order.id || "");
    const defaultWeight =
      parseFloat(String(order.weight || order.invoice?.weightApx || "0").replace(/[^0-9.]/g, "")) || 0;
    const shipCharge = Math.round(defaultWeight * rate);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(oid)}/unified-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Order Confirmed",
          shippingRatePerKg: rate,
          shippingCategory: categoryName || "Standard",
          shippingCharge: shipCharge,
          invoice: {
            ...(order.invoice || {}),
            shippingRatePerKg: rate,
            shippingRate: rate,
            shippingCategory: categoryName || "Standard",
            shippingCharge: shipCharge,
          },
          timelineNote: `Order confirmed by CS with category "${categoryName || 'General'}" & rate BDT ${rate}/KG`,
        }),
      });
      if (res.ok) {
        setSavedOrderMsg(`✓ Order ${oid} confirmed with BDT ${rate}/KG (${categoryName || 'Standard'})!`);
        setTimeout(() => setSavedOrderMsg(null), 3500);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveDeliveryWeight = async (order: any, weightKg: number) => {
    const oid = String(order.orderId || order.id || "");
    const rate = Number(order.shippingRatePerKg || order.invoice?.shippingRatePerKg || 780);
    const shipCharge = Math.round(weightKg * rate);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(oid)}/unified-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg,
          weight: `${weightKg} KG`,
          invoice: {
            ...(order.invoice || {}),
            weightKg,
            weight: `${weightKg} KG`,
            weightApx: `${weightKg} KG`,
            shippingCharge: shipCharge,
            adminChargesUploaded: true,
          },
          timelineNote: `Delivery Dept updated Parcel Weight: ${weightKg} KG (Shipping BDT ${shipCharge})`,
        }),
      });
      if (res.ok) {
        setSavedOrderMsg(`Saved weight ${weightKg} KG for Order ${oid}`);
        setTimeout(() => setSavedOrderMsg(null), 3500);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadInvoiceWithPhotos = async (order: any) => {
    const oid = String(order.orderId || order.id || "");
    try {
      setIsDownloadingInvoiceId(oid);
      const built = buildInvoiceFromOrder(order, order.invoice);
      await downloadCustomInvoicePdf(built, "both");
    } catch (err) {
      console.error("Failed to download invoice PDF:", err);
    } finally {
      setIsDownloadingInvoiceId(null);
    }
  };

  const handleSaveCsOrAdminCharges = async (order: any) => {
    const oid = String(order.orderId || order.id || "");
    const prodSub = Math.round(Number(order.subtotal ?? order.invoice?.subTotal ?? order.total ?? 0));
    const disc = Math.round(Number(order.discountAmount ?? order.invoice?.discount ?? 0));
    const defaultPaid = Math.round(
      Number(order.paidAmount ?? order.invoice?.paidAmount ?? Math.max(0, prodSub - disc))
    );
    const defaultWeight =
      parseFloat(String(order.weight || order.invoice?.weightApx || "0").replace(/[^0-9.]/g, "")) || 0;
    const defaultRate = Number(order.shippingRatePerKg ?? order.invoice?.shippingRatePerKg ?? 780);
    const defaultCourier = Number(order.chinaCourierCharge ?? order.invoice?.chinaCourier ?? 0);

    const draft = csChargeEdits[oid] || {
      shippingRatePerKg: defaultRate,
      weightKg: defaultWeight,
      chinaCourierCharge: defaultCourier,
      paidAmount: defaultPaid,
    };

    const dept = String(dashboard?.department || "").toLowerCase();
    const isDeliveryRole = dept === "delivery" || isMasterAdmin;
    const effectiveWeight = isDeliveryRole ? Number(draft.weightKg || defaultWeight) : defaultWeight;
    const shipCharge = Math.round(effectiveWeight * Number(draft.shippingRatePerKg || 780));
    const courierBill = Math.round(Number(draft.chinaCourierCharge || 0));
    const partialPaid = Math.round(Number(draft.paidAmount || 0));

    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(oid)}/unified-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingRatePerKg: Number(draft.shippingRatePerKg || 780),
          ...(isDeliveryRole ? {
            weightKg: effectiveWeight,
            weight: `${effectiveWeight} KG`,
          } : {}),
          shippingCharge: shipCharge,
          chinaCourierCharge: courierBill,
          paidAmount: partialPaid,
          adminChargesUploaded: true,
          timelineNote: `Charges updated by ${dashboard?.title || "Staff"} (Rate: BDT ${draft.shippingRatePerKg}/KG${isDeliveryRole ? `, Weight: ${effectiveWeight}KG` : ""})`
        }),
      });
      if (res.ok) {
        setSavedOrderMsg(
          `Updated Order ${oid}: Shipping Rate BDT ${draft.shippingRatePerKg}/KG${isDeliveryRole ? `, Weight ${effectiveWeight}KG` : ""}, Shipping BDT ${shipCharge}, Courier BDT ${courierBill}`
        );
        setTimeout(() => setSavedOrderMsg(null), 4000);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !dashboard) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold mt-3">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Super Admin Top Control & Switcher Bar */}
      <div className="bg-charcoal text-white rounded-2xl p-4 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-800">
        <div className="flex items-center gap-3">
          {isMasterAdmin ? (
            <Link
              to="/admin/role-dashboards"
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="Return to Role Dashboards Control Center"
            >
              <ChevronLeft className="w-4 h-4" />
              Admin Control Center
            </Link>
          ) : (
            <div className="p-2 bg-gray-800 text-gray-300 rounded-xl flex items-center gap-1.5 text-xs font-bold border border-gray-700">
              <Briefcase className="w-4 h-4 text-primary" />
              Staff Desk
            </div>
          )}

          <div className="h-6 w-px bg-gray-700 hidden sm:block"></div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-black bg-primary text-white rounded">
                {dashboard.code}
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide">
                {dashboard.banglaTitle}
              </h2>
              {isMasterAdmin ? (
                <span className="px-2 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold uppercase tracking-wider">
                  Main Admin
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[9px] bg-slate-700 text-slate-300 rounded font-bold uppercase tracking-wider">
                  Staff Workspace
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">{dashboard.title}</p>
          </div>
        </div>

        {/* Top Controls: Switch Dashboard & Delete Desk Restricted to Main Admin Only */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {isMasterAdmin ? (
            <>
              {/* Main Admin Only: Switch Dashboard Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden lg:inline">Switch Dashboard:</span>
                <select
                  value={dashboard.id}
                  onChange={e => navigate(`/admin/role-dashboards/${e.target.value}`)}
                  className="bg-gray-800 text-white text-xs border border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:border-primary font-medium"
                >
                  <optgroup label={`🎧 Customer Support (${allDashboards.filter(d => d.department === "support").length})`}>
                    {allDashboards.filter(d => d.department === "support").map(d => (
                      <option key={d.id} value={d.id}>{d.code}: {d.banglaTitle}</option>
                    ))}
                  </optgroup>
                  <optgroup label={`💼 Sales / KAM (${allDashboards.filter(d => d.department === "sales").length})`}>
                    {allDashboards.filter(d => d.department === "sales").map(d => (
                      <option key={d.id} value={d.id}>{d.code}: {d.banglaTitle}</option>
                    ))}
                  </optgroup>
                  <optgroup label={`🚚 Delivery & Logistics (${allDashboards.filter(d => d.department === "delivery").length})`}>
                    {allDashboards.filter(d => d.department === "delivery").map(d => (
                      <option key={d.id} value={d.id}>{d.code}: {d.banglaTitle}</option>
                    ))}
                  </optgroup>
                  <optgroup label={`💰 Accounts & Finance (${allDashboards.filter(d => d.department === "accounts").length})`}>
                    {allDashboards.filter(d => d.department === "accounts").map(d => (
                      <option key={d.id} value={d.id}>{d.code}: {d.banglaTitle}</option>
                    ))}
                  </optgroup>
                  <optgroup label={`🛒 Purchase & Sourcing (${allDashboards.filter(d => d.department === "purchase").length})`}>
                    {allDashboards.filter(d => d.department === "purchase").map(d => (
                      <option key={d.id} value={d.id}>{d.code}: {d.banglaTitle}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Main Admin Only: Delete Desk Button */}
              <button
                type="button"
                onClick={handleDeleteCurrentDesk}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title={`Delete ${dashboard.code} from Staff Desks`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete Desk</span>
              </button>
            </>
          ) : (
            /* Staff View: Switcher and Delete are completely hidden! */
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-xl text-xs font-semibold border border-gray-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Assigned Desk: {dashboard.code}</span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-gray-400 block font-semibold">Assigned Officer</span>
              <span className="text-xs font-bold text-white">{dashboard.assignedStaff.name}</span>
            </div>
            <StaffAvatar
              name={dashboard.assignedStaff.name}
              avatar={dashboard.assignedStaff.avatar}
              size="md"
              editable={true}
              onPhotoChange={handleDeskOfficerPhotoChange}
              statusBadge={true}
            />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CS ORDER ANALYTICS & PENDING CHART (CS DESKS & ANALYTICS)     */}
      {/* ============================================================== */}
      {(dashboard.department === "support" || (dashboard.department !== "sales" && dashboard.department !== "purchase" && dashboard.department !== "delivery" && showCsAnalyticsChart)) && (
        <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🎧 CS অর্ডার অ্যানালিটিক্স — মোট অর্ডার, কনফার্মড ও পেন্ডিং চার্ট</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  {orders.length} Total Orders
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {dashboard.department === "support" && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ নতুন সাপোর্ট টিকেট</span>
                </button>
              )}
              {dashboard.department !== "support" && (
                <button
                  type="button"
                  onClick={() => setShowCsAnalyticsChart(!showCsAnalyticsChart)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold px-2 py-1 rounded bg-slate-100 cursor-pointer"
                >
                  ✕ চার্ট লুকান
                </button>
              )}
            </div>
          </div>
          <CSOrderAnalyticsChart
            orders={orders}
            selectedFilterStatus={filterStatus}
            onFilterStatus={(st) => setFilterStatus(st)}
            onOpenOrderModal={(o) => {
              setSelectedOrderForModal(o);
              setModalInitialTab("pipeline");
            }}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* ALL EMPLOYEE DESKS: CUSTOMER ORDERS & 1688 / TRACKING VIEW     */}
      {/* (EXCLUDED FOR MARKETING / SALES DASHBOARDS)                    */}
      {/* ============================================================== */}
      {dashboard.department !== "sales" && !String(dashboard?.id || "").toLowerCase().includes("marketing") && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2 flex-wrap">
                <Package className="w-4 h-4 text-amber-400" />
                <span>
                  Customer Orders Directory — 1688 Order ID & Tracking Number ({filteredOrders.length} {searchQuery || filterStatus !== "all" ? `of ${orders.length} Orders` : "Orders"})
                </span>
                {filterStatus !== "all" && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30 text-[10px] font-bold">
                    Filter: {filterStatus}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-300 mt-1">
                ডিপার্টমেন্টস: <span className="text-white font-semibold">CA · Delivery · Accounts · Purchase</span>
              </p>
            </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {filterStatus !== "all" && (
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold cursor-pointer flex items-center gap-1 border border-white/20"
              >
                <span>Clear Filter ({filterStatus})</span>
                <span>✕</span>
              </button>
            )}
            {savedOrderMsg && (
              <span className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold">
                ✓ {savedOrderMsg}
              </span>
            )}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order ID, phone, 1688..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer Info</th>
                <th className="py-3 px-4">Ordered Products</th>
                <th className="py-3 px-4">1688 ID & Tracking (Purchase Only)</th>
                <th className="py-3 px-4">Parcel Weight & Invoice Breakdown</th>
                <th className="py-3 px-4 min-w-[190px]">Courier Partner (কুরিয়ার সার্ভিস)</th>
                <th className="py-3 px-4">Status & Department Access</th>
                <th className="py-3 px-4 text-right">Actions & Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {searchQuery ? `No orders found matching "${searchQuery}".` : "No customer orders found yet."}
                  </td>
                </tr>
              ) : (
                filteredOrders.slice(0, 50).map((o: any) => {
                  const oid = String(o.orderId || o.id || "");
                  const saved1688 =
                    o.order1688Id || o.purchaseInfo?.supplierOrderId || o.invoice?.order1688Id || "";
                  const savedTracking =
                    o.trackingNumber ||
                    o.chinaWarehouseInfo?.trackingNumber ||
                    o.purchaseInfo?.chinaTrackingNumber ||
                    o.invoice?.trackingNumber ||
                    "";
                  const draft = purchaseEdits[oid] || {
                    order1688Id: saved1688,
                    trackingNumber: savedTracking,
                    status: o.status === "Stock Out" ? "Stock Out" : "Purchased",
                    chinaCourierCharge: Number(o.chinaCourierCharge ?? o.invoice?.chinaCourier ?? 0),
                    notes: o.purchaseNotes || o.notes || "",
                  };
                  const weightStr = o.weight || o.invoice?.weightApx || "0 KG";
                  const savedWeightNum = parseFloat(String(weightStr).replace(/[^0-9.]/g, "")) || 0;
                  const savedRatePerKg = Number(o.shippingRatePerKg ?? o.invoice?.shippingRatePerKg ?? 780);
                  const savedCourierBill = Math.round(
                    Number(o.chinaCourierCharge ?? o.invoice?.chinaCourier ?? 0)
                  );
                  const prodSub = Math.round(Number(o.subtotal ?? o.invoice?.subTotal ?? o.total ?? 0));
                  const disc = Math.round(Number(o.discountAmount ?? o.invoice?.discount ?? 0));
                  const savedPartialPaid = Math.round(
                    Number(o.paidAmount ?? o.invoice?.paidAmount ?? Math.max(0, prodSub - disc))
                  );
                  const chargeDraft = csChargeEdits[oid] || {
                    shippingRatePerKg: savedRatePerKg,
                    weightKg: savedWeightNum,
                    chinaCourierCharge: savedCourierBill,
                    paidAmount: savedPartialPaid,
                  };

                  const deptStr = String(dashboard?.department || "").toLowerCase();
                  const isPurchaseDept = deptStr === "purchase" || isMasterAdmin;
                  const isDeliveryDept = deptStr === "delivery" || isMasterAdmin;
                  const isCsDept = deptStr === "support" || deptStr === "cs" || isMasterAdmin;
                  const isMarketingDept = deptStr === "sales" || deptStr === "marketing" || isMasterAdmin;
                  const isAccountsDept = deptStr === "accounts" || deptStr === "finance";

                  const weightNum = Number(chargeDraft.weightKg || savedWeightNum);
                  const ratePerKg = Number(chargeDraft.shippingRatePerKg || savedRatePerKg);
                  const shipCharge = Math.round(weightNum * ratePerKg);
                  const courierBill = Math.round(Number(chargeDraft.chinaCourierCharge || 0));
                  const partialPaid = Math.round(Number(chargeDraft.paidAmount || savedPartialPaid));
                  const finalDue = Math.max(0, prodSub - disc + shipCharge + courierBill - partialPaid);

                  const isPendingConfirm = o.status === "Pending" || o.status === "Order Placed";
                  const isDelivered = o.status === "Delivered" || o.deliveryInfo?.status === "Delivered";

                  // Extract order items
                  const rawItems = Array.isArray(o.items) && o.items.length > 0 ? o.items : [
                    {
                      name: o.productName || "Imported Wholesale Product",
                      image: o.productImage || o.image || "",
                      quantity: o.totalQuantity || o.quantity || 1,
                      price: o.price || o.total || 0,
                      variation: o.variation || o.variantName || ""
                    }
                  ];

                  return (
                    <tr key={oid} className="hover:bg-slate-50/80 transition align-top">
                      {/* 1. Order ID & Date */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span 
                            onClick={() => {
                              setSelectedProductInfoOrder(o);
                            }}
                            className="cursor-pointer text-primary hover:underline block"
                            title="Click to view product details"
                          >
                            {o.mainOrderId || o.orderId || oid}
                          </span>
                          {/* Quick Info (i) Icon Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedProductInfoOrder(o)}
                            className="w-4.5 h-4.5 rounded-full bg-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white flex items-center justify-center text-[10px] font-black font-serif italic transition cursor-pointer shrink-0 shadow-2xs"
                            title="আইবাটন: প্রোডাক্ট বিস্তারিত, কত পিস, কত টাকা ও সোর্সিং লিংক"
                          >
                            i
                          </button>
                        </div>
                        {o.subOrders && o.subOrders.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-1">
                            {o.subOrders.map((sub: any) => (
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
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {o.date || ""}
                        </div>
                      </td>

                      {/* 2. Customer Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {o.customerInfo?.name || o.customer || "Customer"}
                        </div>
                        <CustomerPhoneSecureDisplay
                          order={o}
                          viewerDepartment={deptStr}
                          viewerStaff={{ id: dashboard?.id, code: dashboard?.code, name: dashboard?.assignedStaff?.name }}
                          isMasterAdmin={isMasterAdmin}
                        />
                        <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[150px]">
                          {o.customerInfo?.address || ""}
                        </div>

                        {/* Customer Cart Indicator */}
                        {o.customerInfo?.cart && o.customerInfo.cart.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductInfoOrder(o);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-1.5 py-0.5 rounded cursor-pointer transition"
                              title="Click to view items in customer cart"
                            >
                              <ShoppingCart className="w-3 h-3 text-sky-600" />
                              <span>Cart ({o.customerInfo.cart.length})</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 3. Ordered Products (Compact view - details inside i-button modal) */}
                      <td className="py-3 px-4">
                        {(() => {
                          const itemProductPath = getProductPath(rawItems[0] || o);
                          return (
                            <div className="flex items-center gap-2.5 min-w-[190px] max-w-[260px]">
                              {rawItems[0]?.image && (
                                <a
                                  href={itemProductPath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative group shrink-0 block"
                                  title="প্রোডাক্ট পেজ খুলুন / Open Store Product Page"
                                >
                                  <img
                                    src={rawItems[0].image || "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80"}
                                    alt=""
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-white group-hover:scale-105 group-hover:border-primary transition"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80";
                                    }}
                                  />
                                  <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition">
                                    <ExternalLink className="w-3 h-3 text-white" />
                                  </span>
                                </a>
                              )}
                              <div className="flex-1 min-w-0">
                                <a
                                  href={itemProductPath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-slate-800 line-clamp-1 text-xs hover:text-blue-700 hover:underline inline-flex items-center gap-1 group cursor-pointer"
                                  title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                >
                                  <span>{rawItems[0]?.name || "Import Product"}</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-700 shrink-0 transition" />
                                </a>
                                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span>{rawItems.length} টি আইটেম</span>
                                  <span>•</span>
                                  <span className="font-mono font-bold text-slate-700">
                                    {rawItems.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 1), 0)} pcs
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedProductInfoOrder(o)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 text-[10px] font-black transition cursor-pointer shadow-2xs group"
                                    title="আইবাটন: প্রোডাক্টের সম্পূর্ণ বিবরণ, কত পিস, কত টাকা ও সোর্সিং লিংক দেখুন"
                                  >
                                    <span className="w-3.5 h-3.5 rounded-full bg-blue-600 group-hover:bg-white text-white group-hover:text-blue-600 flex items-center justify-center text-[9px] font-black font-serif italic">i</span>
                                    <span>প্রোডাক্ট বিস্তারিত</span>
                                  </button>
                                  <a
                                    href={itemProductPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-200 transition"
                                    title="প্রোডাক্ট পেজ খুলুন / Open Store Product Page"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                                    <span>পেজ লিংক</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 4. 1688 ID & Tracking Number (Purchase Department Only) */}
                      <td className="py-3 px-4">
                        {isPurchaseDept ? (
                          <div className="space-y-1.5 min-w-[220px] bg-purple-50/40 p-2 rounded-xl border border-purple-200">
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="text-[9px] font-bold text-purple-900 block mb-0.5">1688 Order ID:</label>
                                <input
                                  type="text"
                                  placeholder="1688 ID..."
                                  value={draft.order1688Id}
                                  onChange={(e) =>
                                    setPurchaseEdits((prev) => ({
                                      ...prev,
                                      [oid]: { ...draft, order1688Id: e.target.value },
                                    }))
                                  }
                                  className="w-full px-2 py-1 text-[11px] font-mono border border-purple-300 rounded bg-white focus:outline-none focus:border-purple-600"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-blue-900 block mb-0.5">চায়না ট্র্যাকিং:</label>
                                <input
                                  type="text"
                                  placeholder="China Tracking..."
                                  value={draft.trackingNumber}
                                  onChange={(e) =>
                                    setPurchaseEdits((prev) => ({
                                      ...prev,
                                      [oid]: { ...draft, trackingNumber: e.target.value },
                                    }))
                                  }
                                  className="w-full px-2 py-1 text-[11px] font-mono border border-blue-300 rounded bg-white focus:outline-none focus:border-blue-600"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="text-[9px] font-bold text-amber-900 block mb-0.5">চায়না কুরিয়ার বিল (৳):</label>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Courier ৳..."
                                  value={draft.chinaCourierCharge || ""}
                                  onChange={(e) =>
                                    setPurchaseEdits((prev) => ({
                                      ...prev,
                                      [oid]: { ...draft, chinaCourierCharge: Number(e.target.value) },
                                    }))
                                  }
                                  className="w-full px-2 py-1 text-[11px] font-mono border border-amber-300 rounded bg-white focus:outline-none focus:border-amber-600 font-bold text-amber-900"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-slate-700 block mb-0.5">পারসেজ স্ট্যাটাস:</label>
                                <select
                                  value={draft.status}
                                  onChange={(e) =>
                                    setPurchaseEdits((prev) => ({
                                      ...prev,
                                      [oid]: { ...draft, status: e.target.value },
                                    }))
                                  }
                                  className="w-full px-1.5 py-1 text-[10px] font-bold border border-slate-300 rounded bg-white text-slate-800"
                                >
                                  <option value="Purchased">Purchased</option>
                                  <option value="Received in China Warehouse">Received in China WH</option>
                                  <option value="Stock Out">Stock Out</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-700 block mb-0.5">পারসেজ নোট (Internal Notes):</label>
                              <input
                                type="text"
                                placeholder="সাপ্লায়ার নোট, স্টক আউট কারণ ইত্যাদি..."
                                value={draft.notes || ""}
                                onChange={(e) =>
                                  setPurchaseEdits((prev) => ({
                                    ...prev,
                                    [oid]: { ...draft, notes: e.target.value },
                                  }))
                                }
                                className="w-full px-2 py-1 text-[10px] border border-slate-300 rounded bg-white focus:outline-none focus:border-purple-600"
                              />
                            </div>

                            {/* Quick Action Buttons for Purchase Dept */}
                            <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-purple-200/60">
                              <button
                                type="button"
                                onClick={() => handleSavePurchaseOrderTracking(o, "Received in China Warehouse")}
                                className="px-1.5 py-0.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-[9px] font-bold cursor-pointer transition shadow-2xs"
                                title="Mark Received in China Warehouse"
                              >
                                🏢 Receive China WH
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSavePurchaseOrderTracking(o, "Stock Out")}
                                className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold cursor-pointer transition shadow-2xs"
                                title="Mark as Stock Out"
                              >
                                ⚠️ Stock Out
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSavePurchaseOrderTracking(o)}
                                className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-800 text-white text-[9px] font-bold cursor-pointer transition shadow-2xs ml-auto"
                                title="Save all purchase details"
                              >
                                💾 সেভ করুন
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 min-w-[180px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <div className="text-[11px]">
                              <span className="text-slate-500 font-semibold">1688 ID: </span>
                              <span className="font-mono font-bold text-purple-700">
                                {saved1688 || "Pending Upload"}
                              </span>
                            </div>
                            <div className="text-[11px]">
                              <span className="text-slate-500 font-semibold">Tracking: </span>
                              <span className="font-mono font-bold text-blue-700">
                                {savedTracking || "Pending Upload"}
                              </span>
                            </div>
                            {savedCourierBill > 0 && (
                              <div className="text-[10px] text-amber-800 font-bold">
                                China Courier: ৳{savedCourierBill}
                              </div>
                            )}
                            <span className="text-[9px] text-amber-700 font-medium block">
                              🔒 Tracking & Courier editable by Purchase Dept
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 5. Parcel Weight & Invoice Breakdown */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="space-y-1.5 min-w-[220px]">
                          {/* Parcel Weight Input - ONLY Delivery Dept and Admin can edit */}
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <label className="text-[9px] font-sans font-bold text-slate-700 block mb-0.5">
                              Parcel Weight (KG) {!isDeliveryDept && <span className="text-amber-700 font-normal">(Delivery Dept Only)</span>}:
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="0.05"
                                min="0"
                                disabled={!isDeliveryDept}
                                value={weightNum}
                                onChange={(e) =>
                                  setCsChargeEdits((prev) => ({
                                    ...prev,
                                    [oid]: { ...chargeDraft, weightKg: Number(e.target.value) },
                                  }))
                                }
                                className={`border rounded px-2 py-0.5 text-xs font-mono font-bold w-16 ${
                                  !isDeliveryDept
                                    ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                                    : "bg-white text-slate-900 border-emerald-300 focus:border-emerald-600 focus:outline-none"
                                }`}
                              />
                              <span className="text-[11px] font-bold text-slate-700">KG</span>
                              {isDeliveryDept && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveDeliveryWeight(o, weightNum)}
                                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[10px] font-bold cursor-pointer"
                                >
                                  Save Weight
                                </button>
                              )}
                            </div>
                          </div>

                          {/* CS Order Confirmation / Shipping Rate by Category — CS Dept & Admin */}
                          {(isCsDept || isMasterAdmin) && (
                            <div className="bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 space-y-1.5">
                              <label className="text-[9px] font-sans font-bold text-emerald-900 block">
                                প্রোডাক্ট ক্যাটাগরি অনুসারে শিপিং রেট (CS Dept):
                              </label>
                              <div className="space-y-1">
                                <select
                                  value={ratePerKg}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const catName = e.target.options[e.target.selectedIndex].getAttribute("data-cat") || "Standard";
                                    setCsChargeEdits((prev) => ({
                                      ...prev,
                                      [oid]: { ...chargeDraft, shippingRatePerKg: val, shippingCategory: catName },
                                    }));
                                  }}
                                  className="w-full border border-emerald-300 rounded px-1.5 py-1 text-[10px] font-bold bg-white text-slate-800"
                                >
                                  <option value={750} data-cat="পোশাক / গার্মেন্টস">👗 পোশাক / গার্মেন্টস — ৳750/KG</option>
                                  <option value={780} data-cat="ব্যাগ ও জুতো">👠 ব্যাগ ও জুতো — ৳780/KG</option>
                                  <option value={850} data-cat="ইলেকট্রনিক্স ও গ্যাজেট">⚡ ইলেকট্রনিক্স ও গ্যাজেট — ৳850/KG</option>
                                  <option value={950} data-cat="কসমেটিক্স ও লিকুইড">💄 কসমেটিক্স ও লিকুইড — ৳950/KG</option>
                                  <option value={650} data-cat="ভারী আইটেম / মেশিনারি">🏗️ ভারী পণ্য / মেশিনারি — ৳650/KG</option>
                                  <option value={450} data-cat="সমুদ্র পথ (Sea Freight)">🚢 সমুদ্র পথ (Sea Freight) — ৳450/KG</option>
                                  <option value={980} data-cat="এয়ার এক্সপ্রেস">✈️ এয়ার এক্সপ্রেস — ৳980/KG</option>
                                </select>
                                <div className="flex items-center justify-between gap-1">
                                  <input
                                    type="number"
                                    min="100"
                                    value={ratePerKg}
                                    onChange={(e) =>
                                      setCsChargeEdits((prev) => ({
                                        ...prev,
                                        [oid]: { ...chargeDraft, shippingRatePerKg: Number(e.target.value) },
                                      }))
                                    }
                                    className="w-20 px-1.5 py-0.5 text-[10px] font-mono font-bold border border-emerald-300 rounded bg-white"
                                    title="Custom rate per kg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleCsConfirmOrder(o, ratePerKg, chargeDraft.shippingCategory)}
                                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[10px] font-bold cursor-pointer transition shadow-2xs flex-1 text-center"
                                  >
                                    {isPendingConfirm ? "✓ অর্ডার কনফার্ম" : "✓ রেট আপডেট"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-600">
                            <div>Partial Paid: <strong className="text-emerald-700">BDT {partialPaid.toLocaleString()}</strong></div>
                            <div>{weightNum}KG × BDT {ratePerKg} = <strong className="text-indigo-700">BDT {shipCharge.toLocaleString()}</strong></div>
                            {courierBill > 0 && <div>China Courier: <strong className="text-amber-700">BDT {courierBill.toLocaleString()}</strong></div>}
                            <div className="font-bold text-rose-600 mt-0.5">Final Invoice: BDT {finalDue.toLocaleString()}</div>
                          </div>
                        </div>
                      </td>

                      {/* 6. Courier Partner & Consignment Tracking (Admin & Accounts Access) */}
                      <td className="py-3 px-4 min-w-[190px]">
                        {(() => {
                          const activeCourier = courierDrafts[oid]?.partner ?? o.courierPartner ?? o.courierName ?? o.deliveryCourier ?? o.deliveryInfo?.courier ?? "";
                          const activeTracking = courierDrafts[oid]?.tracking ?? o.courierTracking ?? o.courierConsignmentId ?? o.deliveryInfo?.trackingNumber ?? "";
                          const canManageCourier = isAccountsDept || isMasterAdmin || isDeliveryDept;

                          return (
                            <div className="space-y-1.5">
                              {canManageCourier ? (
                                <div className="space-y-1.5">
                                  <select
                                    value={activeCourier}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCourierDrafts(prev => ({
                                        ...prev,
                                        [oid]: { ...(prev[oid] || { tracking: activeTracking }), partner: val }
                                      }));
                                      handleSaveCourier(o, val, activeTracking);
                                    }}
                                    className="w-full border border-slate-300 rounded px-1.5 py-1 text-[11px] font-bold bg-white text-slate-800 cursor-pointer focus:outline-none focus:border-indigo-600 shadow-2xs"
                                  >
                                    <option value="">-- কুরিয়ার নির্বাচন করুন --</option>
                                    <option value="Steadfast">Steadfast (স্টেডফাস্ট)</option>
                                    <option value="Pathao">Pathao (পাঠাও)</option>
                                    <option value="Sundarban Courier Service">Sundarban (সুন্দরবন কুরিয়ার)</option>
                                    <option value="RedX">RedX (রেডএক্স)</option>
                                    <option value="SA Paribahan">SA Paribahan (এস এ পরিবহন)</option>
                                    <option value="eCourier">eCourier (ই-কুরিয়ার)</option>
                                    <option value="Paperfly">Paperfly (পেপারফ্লাই)</option>
                                    <option value="Office Delivery">Office Delivery (অফিস ডেলিভারি)</option>
                                  </select>

                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      placeholder="কনসাইনমেন্ট নং"
                                      value={activeTracking}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCourierDrafts(prev => ({
                                          ...prev,
                                          [oid]: { ...(prev[oid] || { partner: activeCourier }), tracking: val }
                                        }));
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleSaveCourier(o, activeCourier, activeTracking);
                                        }
                                      }}
                                      className="w-full border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs"
                                    />
                                    <button
                                      type="button"
                                      disabled={savingCourierId === oid}
                                      onClick={() => handleSaveCourier(o, activeCourier, activeTracking)}
                                      className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold cursor-pointer transition shrink-0 disabled:opacity-50"
                                      title="কুরিয়ার তথ্য সেভ করুন"
                                    >
                                      {savingCourierId === oid ? "..." : "Save"}
                                    </button>
                                  </div>

                                  {activeCourier && (
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        /steadfast/i.test(activeCourier)
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                          : /pathao/i.test(activeCourier)
                                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                                          : /sundarban/i.test(activeCourier)
                                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                                          : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                      }`}>
                                        <Truck className="w-2.5 h-2.5" />
                                        <span>{activeCourier}</span>
                                      </span>
                                      {activeTracking && (
                                        <span className="font-mono text-[9px] text-slate-600 font-semibold">
                                          #{activeTracking}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  {activeCourier ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                        <Truck className="w-3 h-3 text-slate-500" />
                                        <span>{activeCourier}</span>
                                      </span>
                                      {activeTracking && (
                                        <div className="font-mono text-[10px] text-slate-600 font-bold">
                                          TRK: {activeTracking}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">
                                      কুরিয়ার নির্ধারিত হয়নি
                                    </span>
                                  )}
                                  <span className="block text-[9px] text-slate-400 mt-0.5">
                                    🔒 এক্সেস: এডমিন ও একাউন্টস
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 7. Order Status Transition & Departmental Access */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1.5 ${
                          isDelivered ? "bg-emerald-100 text-emerald-800" : isPendingConfirm ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
                        }`}>
                          {o.status || "Pending"}
                        </span>

                        {isAccountsDept ? (
                          <div className="text-[10px] text-slate-500">
                            {isDelivered ? "✓ Delivered" : o.status}
                            <span className="block text-[9px] text-slate-400 mt-0.5">🔒 Status read-only</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <select
                              value={o.status}
                              onChange={(e) => handleAdminConfirmOrder(o, e.target.value)}
                              className="w-full border border-slate-300 rounded px-1.5 py-1 text-[11px] font-bold bg-white text-slate-800 cursor-pointer"
                            >
                              {isMasterAdmin ? (
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
                              ) : isDeliveryDept ? (
                                <>
                                  <option value={o.status}>{o.status}</option>
                                  <option value="Received in China Warehouse">Received in China Warehouse</option>
                                  <option value="Received in BD Warehouse">Received in BD Warehouse</option>
                                  <option value="Ready for Delivery">Ready for Delivery</option>
                                  <option value="Assigned to Delivery">Assigned to Delivery</option>
                                </>
                              ) : (
                                <>
                                  <option value={o.status}>{o.status}</option>
                                  <option value="Received in China Warehouse">Received in China Warehouse</option>
                                  <option value="Received in BD Warehouse">Received in BD Warehouse</option>
                                  <option value="Stock Out">Stock Out</option>
                                </>
                              )}
                            </select>
                            {isDeliveryDept && !isMasterAdmin && (
                              <span className="block text-[9px] text-amber-700 font-semibold mt-1 leading-tight">
                                🔒 এক্সেস &quot;Assigned to Delivery&quot; পর্যন্ত। &quot;Delivered&quot; শুধুমাত্র Main Admin করতে পারবেন।
                              </span>
                            )}
                            {isMasterAdmin && (
                              <div className="flex gap-1 mt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAdminConfirmOrder(o, "Order Confirmed")}
                                  className="px-1.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdminConfirmOrder(o, "Delivered")}
                                  className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold cursor-pointer"
                                >
                                  Delivered
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 7. Actions & Invoice Download with Photos */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {/* Dedicated i-Button for Product Details */}
                          <button
                            type="button"
                            onClick={() => setSelectedProductInfoOrder(o)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-900 font-bold text-[10px] inline-flex items-center gap-1.5 cursor-pointer transition shadow-2xs group"
                            title="আইবাটন: প্রোডাক্টের বিস্তারিত, কত পিস, কত টাকা ও সোর্সিং লিংক (i-button)"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center text-[9px] font-black font-serif italic">i</span>
                            <span>প্রোডাক্ট বিস্তারিত</span>
                          </button>

                          <button
                            type="button"
                            disabled={isDownloadingInvoiceId === oid}
                            onClick={() => handleDownloadInvoiceWithPhotos(o)}
                            className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition shadow-2xs disabled:opacity-50"
                            title="Download PDF invoice containing product photos"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{isDownloadingInvoiceId === oid ? "Generating..." : "Download Invoice"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ============================================================== */}
      {/* 2. SALES / KEY ACCOUNT MANAGERS (KAM-1 to KAM-5)              */}
      {/* ============================================================== */}
      {dashboard.department === "sales" && (
        <div className="space-y-5">
          {/* Top Sub-Navigation Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMarketingSubTab("all_orders")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  marketingSubTab === "all_orders"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>All Orders (সকল কাস্টমার অর্ডার)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  marketingSubTab === "all_orders" ? "bg-white text-rose-600" : "bg-gray-200 text-gray-800"
                }`}>
                  {orders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMarketingSubTab("my_orders")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  marketingSubTab === "my_orders"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>My Orders (আমার অ্যাসাইনকৃত অর্ডার)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  marketingSubTab === "my_orders" ? "bg-white text-indigo-600" : "bg-gray-200 text-gray-800"
                }`}>
                  {myAssignedOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMarketingSubTab("quotes")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  marketingSubTab === "quotes"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>B2B Quotes ({quotes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMarketingSubTab("targets")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  marketingSubTab === "targets"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Target className="w-3.5 h-3.5 text-rose-400" />
                <span>Sales Target & KPI</span>
              </button>

              <button
                type="button"
                onClick={() => setMarketingSubTab("media")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  marketingSubTab === "media"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-purple-600" />
                <span>মার্কেটিং ছবি ও ব্যানার (Media & Banners)</span>
                {marketingMediaList.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    marketingSubTab === "media" ? "bg-white text-purple-600" : "bg-purple-100 text-purple-800"
                  }`}>
                    {marketingMediaList.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 hidden sm:inline">
                মার্কেটিং ডেস্ক: <strong className="text-gray-800">{dashboard.code}</strong> • {dashboard.assignedStaff.name}
              </span>
            </div>
          </div>

          {/* TAB 1: ALL ORDERS (সকল কাস্টমার অর্ডার) */}
          {marketingSubTab === "all_orders" && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="অর্ডার নং, কাস্টমারের নাম, ফোন নম্বর বা অফিসার দিয়ে খুঁজুন..."
                      value={marketingSearch}
                      onChange={e => setMarketingSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-rose-500 bg-gray-50/50"
                    />
                  </div>

                  <select
                    value={marketingStatusFilter}
                    onChange={e => setMarketingStatusFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-rose-500 font-semibold"
                  >
                    <option value="all">সকল স্ট্যাটাস (All Status)</option>
                    <option value="Order Placed">Order Placed</option>
                    <option value="Order Confirmed">Order Confirmed</option>
                    <option value="Purchased">Purchased</option>
                    <option value="Received in China Warehouse">In China Hub</option>
                    <option value="Shipped to Bangladesh">Shipped to BD</option>
                    <option value="Received in BD Customs">BD Customs</option>
                    <option value="Received in BD Warehouse">BD Warehouse</option>
                    <option value="Invoice Generated">Invoice Generated</option>
                    <option value="Assigned to Delivery">Assigned to Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 font-bold">
                    মোট: {orders.length}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                    অ্যাসাইনকৃত: {orders.filter(o => o.assignedMarketingStaff?.name).length}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-100">
                    বাকি: {orders.filter(o => !o.assignedMarketingStaff?.name).length}
                  </span>
                </div>
              </div>

              {/* All Orders Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/60">
                  <div className="flex items-center gap-2 font-bold text-xs text-charcoal">
                    <ShoppingCart className="w-4 h-4 text-rose-600" />
                    <span>সকল কাস্টমার অর্ডার তালিকা ({allMarketingOrders.length} টি)</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                      <tr>
                        <th className="py-3 px-4">অর্ডার নং ও সময়</th>
                        <th className="py-3 px-4">কাস্টমার তথ্য</th>
                        <th className="py-3 px-4">আইটেম ও প্রোডাক্ট</th>
                        <th className="py-3 px-4">মোট টাকা</th>
                        <th className="py-3 px-4">স্ট্যাটাস</th>
                        <th className="py-3 px-4">অ্যাসাইনকৃত মার্কেটিং ম্যানেজার</th>
                        <th className="py-3 px-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allMarketingOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-gray-400">
                            কোনো অর্ডার পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        allMarketingOrders.map((o: any) => {
                          const oid = String(o.orderId || o.id || "");
                          const cPhone = o.customerInfo?.phone || o.customerPhone || "";
                          const cleanPhone = String(cPhone).replace(/\D/g, "").slice(-10);
                          const assigned = o.assignedMarketingStaff;
                          const totalAmt = Number(o.total || o.grandTotal || o.totalAmount || 0);

                          return (
                            <tr key={oid} className="hover:bg-gray-50/80 transition">
                              <td className="py-3.5 px-4 font-mono">
                                <div className="font-bold text-charcoal">{oid}</div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {o.date || o.createdAt?.slice(0, 10) || "N/A"}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-charcoal">
                                  {o.customerInfo?.name || o.customerName || "Customer"}
                                </div>
                                <CustomerPhoneSecureDisplay
                                  order={o}
                                  phone={cPhone}
                                  viewerDepartment={dashboard?.department || "sales"}
                                  viewerStaff={{ id: dashboard?.id, code: dashboard?.code, name: dashboard?.assignedStaff?.name }}
                                  isMasterAdmin={isMasterAdmin}
                                  showActions={true}
                                />
                              </td>

                              <td className="py-3.5 px-4">
                                {(() => {
                                  const rawItem = o.items?.[0] || o;
                                  const prodPath = getProductPath(rawItem);
                                  return (
                                    <div className="flex items-center gap-2.5">
                                      {o.items?.[0]?.image && (
                                        <a
                                          href={prodPath}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="relative group shrink-0 block"
                                          title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                        >
                                          <img
                                            src={o.items[0].image}
                                            alt="Product"
                                            className="w-11 h-11 object-cover rounded-xl border border-slate-200 shrink-0 bg-white group-hover:scale-105 group-hover:border-rose-500 transition shadow-2xs"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80";
                                            }}
                                          />
                                          <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition">
                                            <ExternalLink className="w-3.5 h-3.5 text-white" />
                                          </span>
                                        </a>
                                      )}
                                      <div className="min-w-0">
                                        <a
                                          href={prodPath}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-bold text-charcoal hover:text-rose-600 hover:underline line-clamp-1 max-w-[210px] inline-flex items-center gap-1 group cursor-pointer text-xs"
                                          title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                        >
                                          <span>{o.items?.[0]?.name || "Import Product"}</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-rose-600 shrink-0 transition" />
                                        </a>
                                        <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                          <span>{o.items?.length || 1} টি আইটেম • Qty: {o.items?.[0]?.quantity || 1}</span>
                                          <a
                                            href={prodPath}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] font-bold text-rose-700 hover:text-rose-900 hover:underline inline-flex items-center gap-0.5 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200"
                                            title="প্রোডাক্ট লিংক ওপেন করুন"
                                          >
                                            <ExternalLink className="w-2.5 h-2.5" />
                                            <span>প্রোডাক্ট লিংক</span>
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>

                              <td className="py-3.5 px-4 font-mono font-bold text-charcoal">
                                <div>BDT {totalAmt.toLocaleString()}</div>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                  o.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}>
                                  {o.paymentStatus || "Pending"}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 block w-max">
                                  {o.status}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                {assigned ? (
                                  <div className="flex items-center justify-between gap-2 bg-indigo-50/60 border border-indigo-100 rounded-xl p-2 max-w-[240px]">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <StaffAvatar
                                        name={assigned.name}
                                        avatar={assigned.avatar}
                                        size="sm"
                                      />
                                      <div className="truncate">
                                        <div className="font-bold text-[11px] text-indigo-950 truncate">
                                          {assigned.name}
                                        </div>
                                        <div className="text-[10px] text-indigo-600 font-mono">
                                          {assigned.code} • {assigned.phone}
                                        </div>
                                      </div>
                                    </div>
                                    {isMasterAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => setAssignModalOrder(o)}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline shrink-0 cursor-pointer"
                                        title="Reassign Marketing Manager (Main Admin only)"
                                      >
                                        Reassign
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      নট অ্যাসাইনড
                                    </span>
                                    {isMasterAdmin ? (
                                      <button
                                        type="button"
                                        onClick={() => setAssignModalOrder(o)}
                                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                        title="Assign Marketing Manager (Main Admin only)"
                                      >
                                        <UserPlus className="w-3 h-3" />
                                        <span>অ্যাসাইন করুন</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">
                                        (মেইন এডমিন করবেন)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {(() => {
                                    const rawItem = o.items?.[0] || o;
                                    const prodPath = getProductPath(rawItem);
                                    return (
                                      <a
                                        href={prodPath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                        title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                      >
                                        <ExternalLink className="w-3 h-3 text-rose-600" />
                                        <span>প্রোডাক্ট লিংক</span>
                                      </a>
                                    );
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => setSelectedProductInfoOrder(o)}
                                    className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                    title="প্রোডাক্ট বিস্তারিত"
                                  >
                                    <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-serif font-black italic">i</span>
                                    <span>ডিটেলস</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForModal(o)}
                                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                    title="সম্পূর্ণ অর্ডার ও পাইপলাইন"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>পাইপলাইন</span>
                                  </button>
                                </div>
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
          )}

          {/* TAB 2: MY ORDERS (আমার অ্যাসাইন করা অর্ডার) */}
          {marketingSubTab === "my_orders" && (
            <div className="space-y-4">
              {/* Officer Stats Banner */}
              <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-rose-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-700/40">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <StaffAvatar
                      name={dashboard.assignedStaff.name}
                      avatar={dashboard.assignedStaff.avatar}
                      size="xl"
                      statusBadge={true}
                      editable={true}
                      onPhotoChange={handleDeskOfficerPhotoChange}
                      className="ring-4 ring-white/20"
                    />
                    <div>
                      <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold inline-flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        মার্কেটিং ও কী একাউন্ট ম্যানেজার ডেস্ক ({dashboard.code})
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        {dashboard.assignedStaff.name} — মাই অর্ডার হাব
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-3">
                        <span>📞 {dashboard.assignedStaff.phone}</span>
                        <span>✉️ {dashboard.assignedStaff.email}</span>
                      </p>
                    </div>
                  </div>

                  {isMasterAdmin && (
                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10 self-stretch md:self-auto">
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">
                        এডমিন ফিল্টার: নির্দিষ্ট অফিসারের অর্ডার দেখুন
                      </label>
                      <select
                        value={selectedKamFilterForAdmin}
                        onChange={e => setSelectedKamFilterForAdmin(e.target.value)}
                        className="w-full text-xs bg-slate-900 text-white border border-slate-700 rounded-xl px-3 py-1.5 font-bold focus:outline-none"
                      >
                        <option value="all">সকল অ্যাসাইনকৃত কাস্টমার অর্ডার</option>
                        {allDashboards
                          .filter(d => d.department === "sales")
                          .map(kd => (
                            <option key={kd.id} value={kd.id}>
                              {kd.code}: {kd.assignedStaff.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* KPI Metrics for this Officer */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                    <span className="text-[10px] text-slate-300 font-semibold block">মোট অ্যাসাইনকৃত অর্ডার</span>
                    <span className="text-xl sm:text-2xl font-black text-white block mt-0.5">
                      {myAssignedOrders.length} টি
                    </span>
                  </div>

                  <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-3.5 border border-emerald-400/30">
                    <span className="text-[10px] text-emerald-200 font-semibold block">অ্যাসাইনকৃত মোট ভলিউম</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-300 block mt-0.5">
                      BDT {myAssignedOrders.reduce((acc, o) => acc + Number(o.total || o.grandTotal || 0), 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/30">
                    <span className="text-[10px] text-amber-200 font-semibold block">ইন-প্রসেস / অ্যাক্টিভ অর্ডার</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-300 block mt-0.5">
                      {myAssignedOrders.filter(o => o.status !== "Delivered").length} টি
                    </span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                    <span className="text-[10px] text-slate-300 font-semibold block">সফলভাবে ডেলিভার্ড</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-0.5">
                      {myAssignedOrders.filter(o => o.status === "Delivered").length} টি
                    </span>
                  </div>
                </div>
              </div>

              {/* My Orders Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-gray-50/60">
                  <div className="flex items-center gap-2 font-bold text-xs text-charcoal">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>আমার দায়িত্বপ্রাপ্ত কাস্টমার ও অর্ডার তালিকা ({myAssignedOrders.length} টি)</span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="অর্ডার নং, নাম বা ফোন..."
                      value={marketingSearch}
                      onChange={e => setMarketingSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                      <tr>
                        <th className="py-3 px-4">অর্ডার নং</th>
                        <th className="py-3 px-4">কাস্টমার ও সরাসরি যোগাযোগ</th>
                        <th className="py-3 px-4">প্রোডাক্ট ও আইটেম বিস্তারিত</th>
                        <th className="py-3 px-4">মূল্য ও পেমেন্ট</th>
                        <th className="py-3 px-4">অর্ডার স্ট্যাটাস</th>
                        <th className="py-3 px-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {myAssignedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400">
                            এই ম্যানেজারের নামে এখনো কোনো কাস্টমার অর্ডার অ্যাসাইন করা হয়নি। <br />
                            <button
                              type="button"
                              onClick={() => setMarketingSubTab("all_orders")}
                              className="text-indigo-600 hover:underline font-bold mt-2 text-xs"
                            >
                              &quot;All Orders&quot; ট্যাব থেকে অর্ডার অ্যাসাইন করুন →
                            </button>
                          </td>
                        </tr>
                      ) : (
                        myAssignedOrders.map((o: any) => {
                          const oid = String(o.orderId || o.id || "");
                          const cPhone = o.customerInfo?.phone || o.customerPhone || "";
                          const cleanPhone = String(cPhone).replace(/\D/g, "").slice(-10);
                          const totalAmt = Number(o.total || o.grandTotal || o.totalAmount || 0);

                          return (
                            <tr key={oid} className="hover:bg-indigo-50/20 transition">
                              <td className="py-3.5 px-4 font-mono">
                                <div className="font-bold text-charcoal">{oid}</div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {o.date || o.createdAt?.slice(0, 10) || "N/A"}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-charcoal text-sm">
                                  {o.customerInfo?.name || o.customerName || "Customer"}
                                </div>
                                <div className="mt-1">
                                  <CustomerPhoneSecureDisplay
                                    order={o}
                                    phone={cPhone}
                                    viewerDepartment={dashboard?.department || "sales"}
                                    viewerStaff={{ id: dashboard?.id, code: dashboard?.code, name: dashboard?.assignedStaff?.name }}
                                    isMasterAdmin={isMasterAdmin}
                                    showActions={true}
                                  />
                                </div>
                                <div className="text-[10px] text-gray-400 line-clamp-1 mt-1 max-w-[220px]">
                                  {o.customerInfo?.address || o.customerAddress || "No address specified"}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                {(() => {
                                  const rawItem = o.items?.[0] || o;
                                  const prodPath = getProductPath(rawItem);
                                  return (
                                    <div className="flex items-start gap-2.5">
                                      {o.items?.[0]?.image && (
                                        <a
                                          href={prodPath}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="relative group shrink-0 block"
                                          title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                        >
                                          <img
                                            src={o.items[0].image}
                                            alt="Product"
                                            className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0 bg-white group-hover:scale-105 group-hover:border-indigo-500 transition shadow-2xs"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80";
                                            }}
                                          />
                                          <span className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition">
                                            <ExternalLink className="w-3.5 h-3.5 text-white" />
                                          </span>
                                        </a>
                                      )}
                                      <div>
                                        <a
                                          href={prodPath}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-bold text-charcoal hover:text-indigo-600 hover:underline line-clamp-1 max-w-[220px] inline-flex items-center gap-1 group cursor-pointer text-xs"
                                          title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                        >
                                          <span>{o.items?.[0]?.name || "Import Product"}</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-600 shrink-0 transition" />
                                        </a>
                                        <div className="text-[11px] text-gray-600 mt-0.5">
                                          মোট আইটেম: <strong>{o.items?.length || 1} টি</strong> • মোট পিস: <strong>{o.items?.[0]?.quantity || 1} Pcs</strong>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                          {o.items?.[0]?.variantName && (
                                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                              ভ্যারিয়েশন: {o.items[0].variantName}
                                            </span>
                                          )}
                                          <a
                                            href={prodPath}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline inline-flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200"
                                            title="প্রোডাক্ট লিংক ওপেন করুন"
                                          >
                                            <ExternalLink className="w-2.5 h-2.5" />
                                            <span>প্রোডাক্ট লিংক</span>
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>

                              <td className="py-3.5 px-4 font-mono">
                                <div className="font-black text-charcoal text-sm">
                                  BDT {totalAmt.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-emerald-700 mt-0.5 font-bold">
                                  পেইড: BDT {Number(o.paidAmount || 0).toLocaleString()}
                                </div>
                                <div className="text-[10px] text-rose-600 font-bold">
                                  বাকি: BDT {Number(o.dueAmount || Math.max(0, totalAmt - Number(o.paidAmount || 0))).toLocaleString()}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 block w-max">
                                  {o.status}
                                </span>
                                <div className="text-[9px] text-gray-400 mt-1">
                                  অ্যাসাইন: {o.assignedMarketingStaff?.assignedAt?.slice(0, 10) || "Recent"}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex flex-col items-end gap-1.5">
                                  {(() => {
                                    const rawItem = o.items?.[0] || o;
                                    const prodPath = getProductPath(rawItem);
                                    return (
                                      <a
                                        href={prodPath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                        title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                      >
                                        <ExternalLink className="w-3 h-3 text-indigo-600" />
                                        <span>প্রোডাক্ট লিংক</span>
                                      </a>
                                    );
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => setSelectedProductInfoOrder(o)}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                  >
                                    <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-serif font-black italic">i</span>
                                    <span>প্রোডাক্ট বিস্তারিত</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForModal(o)}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>অর্ডার টাইমলাইন</span>
                                  </button>

                                  {isMasterAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => setAssignModalOrder(o)}
                                      className="text-[10px] text-gray-500 hover:text-charcoal underline"
                                      title="Change Marketing Officer (Main Admin only)"
                                    >
                                      অফিসার পরিবর্তন করুন
                                    </button>
                                  )}
                                </div>
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
          )}

          {/* TAB 3: B2B QUOTES */}
          {marketingSubTab === "quotes" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/60">
                <div className="flex items-center gap-2 font-bold text-xs text-charcoal">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  B2B Client Quotes & Sourcing List ({quotes.length} Active)
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + New B2B Quote
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Quote No</th>
                      <th className="py-3 px-4">Client & Company</th>
                      <th className="py-3 px-4">Product & Quantity</th>
                      <th className="py-3 px-4">Total RMB</th>
                      <th className="py-3 px-4">Total BDT</th>
                      <th className="py-3 px-4">Shipping Mode</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quotes.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400">
                          No quotes found. Click &quot;New B2B Quote&quot; to add one.
                        </td>
                      </tr>
                    ) : (
                      quotes.map(q => (
                        <tr key={q.id} className="hover:bg-gray-50/80 transition">
                          <td className="py-3.5 px-4 font-bold text-charcoal font-mono">{q.quoteNo}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-charcoal">{q.clientName}</div>
                            <div className="text-[11px] text-gray-500">{q.clientCompany || q.clientPhone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            {(() => {
                              const qProdPath = getProductPath((q as any).productUrl || (q as any).productId || (q as any).offerId || q.productName);
                              return (
                                <div>
                                  <a
                                    href={qProdPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-charcoal hover:text-emerald-700 hover:underline inline-flex items-center gap-1 group cursor-pointer text-xs"
                                    title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                  >
                                    <span>{q.productName}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-700 shrink-0 transition" />
                                  </a>
                                  <div className="text-[11px] text-gray-500">Qty: {q.quantity} Pcs</div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-700">¥ {q.rmbTotal}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">BDT  {q.bdtTotal.toLocaleString()}</td>
                          <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-gray-600">
                            {q.shippingType} ({q.cbmWeight || "N/A"})
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              q.status === "accepted" ? "bg-emerald-100 text-emerald-800" :
                              q.status === "negotiating" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
                            }`}>
                              {q.status.replace(/_/g, " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteQuote(q.id)}
                              className="p-1.5 text-xs text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg transition"
                              title="Delete this quote from staff desks"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: TARGETS & KPI */}
          {marketingSubTab === "targets" && (
            <div className="space-y-5">
              {/* Target & Achieved Amount (কর টাকা টার্গেট ও কত টাকা এচিভ) */}
              <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-rose-800/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-bold inline-flex items-center gap-1.5 mb-2">
                      <Target className="w-3.5 h-3.5 text-rose-400" />
                      মার্কেটিং সেলস টার্গেট ও রিয়েল-টাইম পারফরম্যান্স
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      টার্গেট টাকা বনাম অর্জিত আয় ড্যাশবোর্ড
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      মোট কনফার্মড ও ডেলিভার্ড অর্ডারের ডাটা থেকে স্বয়ংক্রিয়ভাবে হিসাবকৃত
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMarketingTiersModal(true)}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition cursor-pointer flex items-center gap-2 group self-start md:self-auto"
                  >
                    <Target className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    <span>🎯 মার্কেটিং টার্গেট ও কাস্টমার ব্র্যাকেট দেখুন</span>
                  </button>
                </div>

                {/* Target vs Achieved KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <span className="text-[11px] text-slate-300 font-semibold block">মাসিক টার্গেট (Target)</span>
                    <span className="text-lg sm:text-2xl font-black text-white block mt-1">
                      BDT {marketingStats.targetAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-rose-300 block mt-1 font-medium">নির্ধারিত সেলস টার্গেট</span>
                  </div>

                  <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-4 border border-emerald-400/30">
                    <span className="text-[11px] text-emerald-200 font-semibold block">কত টাকা এচিভ (Achieved)</span>
                    <span className="text-lg sm:text-2xl font-black text-emerald-300 block mt-1">
                      BDT {marketingStats.totalAchieved.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-300 block mt-1 font-bold">
                      ✓ {marketingStats.confirmedCount} টি কনফার্মড অর্ডার থেকে
                    </span>
                  </div>

                  <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-4 border border-amber-400/30">
                    <span className="text-[11px] text-amber-200 font-semibold block">টার্গেট অগ্রগতি (Progress)</span>
                    <span className="text-lg sm:text-2xl font-black text-amber-300 block mt-1">
                      {marketingStats.percentAchieved}%
                    </span>
                    <div className="w-full bg-black/40 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, marketingStats.percentAchieved)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <span className="text-[11px] text-slate-300 font-semibold block">বাকি টার্গেট (Shortfall)</span>
                    <span className="text-lg sm:text-2xl font-black text-rose-300 block mt-1">
                      BDT {marketingStats.remainingTarget.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-300 block mt-1 font-medium">লক্ষ্যমাত্রা পূরণে বাকি</span>
                  </div>
                </div>

                {/* 3 Requested Customer Purchase Brackets */}
                <div className="mt-5 pt-5 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span>কাস্টমার ক্রয় ব্র্যাকেট (Customer Order Value Brackets)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowMarketingTiersModal(true)}
                      className="text-xs text-rose-300 hover:text-white font-bold underline cursor-pointer"
                    >
                      সকল ব্র্যাকেট বিস্তারিত ও কাস্টমার তালিকা →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Bracket 1: 2,000 - 50,000 */}
                    <div 
                      onClick={() => setShowMarketingTiersModal(true)}
                      className="bg-white/10 hover:bg-white/15 p-3.5 rounded-2xl border border-white/10 cursor-pointer transition group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                          🥉 ২,০০০ - ৫০,০০০ টাকা
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-black">
                          {marketingStats.tier2kTo50kCount} জন
                        </span>
                      </div>
                      <div className="text-sm font-black text-white mt-1.5">
                        BDT {marketingStats.tier2kTo50kTotal.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-300 block mt-1 group-hover:underline">
                        কাস্টমার তথ্য ও WhatsApp দেখুন →
                      </span>
                    </div>

                    {/* Bracket 2: 5,000 - 50,000 */}
                    <div 
                      onClick={() => setShowMarketingTiersModal(true)}
                      className="bg-white/10 hover:bg-white/15 p-3.5 rounded-2xl border border-white/10 cursor-pointer transition group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-300 group-hover:text-sky-200">
                          🥈 ৫,০০০ - ৫০,০০০ টাকা
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 font-black">
                          {marketingStats.tier5kTo50kCount} জন
                        </span>
                      </div>
                      <div className="text-sm font-black text-white mt-1.5">
                        BDT {marketingStats.tier5kTo50kTotal.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-300 block mt-1 group-hover:underline">
                        কাস্টমার তথ্য ও WhatsApp দেখুন →
                      </span>
                    </div>

                    {/* Bracket 3: 50,000+ */}
                    <div 
                      onClick={() => setShowMarketingTiersModal(true)}
                      className="bg-white/10 hover:bg-white/15 p-3.5 rounded-2xl border border-white/10 cursor-pointer transition group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                          🥇 ৫০,০০০+ টাকা (VIP)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-black">
                          {marketingStats.tier50kPlusCount} জন
                        </span>
                      </div>
                      <div className="text-sm font-black text-white mt-1.5">
                        BDT {marketingStats.tier50kPlusTotal.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-300 block mt-1 group-hover:underline">
                        কাস্টমার তথ্য ও WhatsApp দেখুন →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MARKETING PHOTOS & MEDIA HUB (মার্কেটিং ছবি ও ব্যানার আপলোড ও ম্যানেজমেন্ট) */}
          {marketingSubTab === "media" && (
            <div className="space-y-6">
              {mediaSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{mediaSuccessMsg}</span>
                </div>
              )}

              {/* Grid 2 Columns: Left = Officer Profile Photo Card, Right = Upload New Marketing Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Officer Photo Card */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-purple-600" />
                          <span>মার্কেটিং অফিসারের প্রোফাইল ছবি</span>
                        </h4>
                        <span className="text-[11px] text-gray-500">
                          {dashboard.code} • {dashboard.assignedStaff.name}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        সক্রিয় কর্মকর্তা
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="relative">
                        <StaffAvatar
                          name={dashboard.assignedStaff.name}
                          avatar={dashboard.assignedStaff.avatar}
                          size="2xl"
                          statusBadge={true}
                          className="ring-4 ring-purple-100 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomPhotoInput(dashboard?.assignedStaff?.avatar || "");
                            setShowOfficerPhotoModal(true);
                          }}
                          className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer transition"
                          title="ছবি আপলোড বা এডিট করুন"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <strong className="text-base font-bold text-gray-900 mt-3 block">
                        {dashboard.assignedStaff.name}
                      </strong>
                      <span className="text-xs text-gray-500 block mt-0.5 font-mono">
                        📞 {dashboard.assignedStaff.phone}
                      </span>

                      <p className="text-[11px] text-gray-500 mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 max-w-xs leading-relaxed">
                        ℹ️ এই ছবি কাস্টমারের অ্যাকাউন্ট ড্যাশবোর্ডে <strong>"আপনার পার্সোনাল মার্কেটিং ম্যানেজার"</strong> হিসেবে এবং সকল অর্ডারে সরাসরি প্রদর্শিত হবে।
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    {dashboard.assignedStaff?.avatar ? (
                      <button
                        type="button"
                        onClick={() => handleDeskOfficerPhotoChange("remove")}
                        className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="ছবি মুছে ফেলে প্রাথমিক ইনিশিয়াল সেট করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ছবি সরান (Remove)</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-amber-700 font-semibold">
                        অফিসারের কোনো ছবি নেই (ইনিশিয়াল সক্রিয়)
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setCustomPhotoInput(dashboard?.assignedStaff?.avatar || "");
                        setShowOfficerPhotoModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ml-auto"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{dashboard.assignedStaff?.avatar ? "ছবি পরিবর্তন" : "ছবি আপলোড"}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Upload Marketing Campaign Banner Form */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div>
                      <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-purple-600" />
                        <span>নতুন মার্কেটিং ব্যানার বা প্রমোশনাল ছবি আপলোড করুন</span>
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        ফেসবুক, হোয়াটসঅ্যাপ বা ওয়েবসাইটের জন্য মার্কেটিং ব্যানার ও পোস্টার সংরক্ষণ করুন
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                      Marketing Hub
                    </span>
                  </div>

                  <form onSubmit={handleAddMarketingMedia} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          ব্যানার বা ছবির শিরোনাম (Title):
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: ঈদ স্পেশাল ডিসকাউন্ট ব্যানার"
                          value={mediaTitle}
                          onChange={e => setMediaTitle(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          ক্যাম্পেইন ক্যাটাগরি (Category):
                        </label>
                        <select
                          value={mediaCategory}
                          onChange={e => setMediaCategory(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500 bg-white font-semibold"
                        >
                          <option value="banner">ওয়েবসাইট ব্যানার (Website Banner)</option>
                          <option value="promo">ডিসকাউন্ট প্রমোশন (Promo Offer)</option>
                          <option value="whatsapp">হোয়াটসঅ্যাপ মার্কেটিং (WhatsApp Campaign)</option>
                          <option value="wholesale">হোলসেল ও বি২বি অফার (B2B Wholesale)</option>
                          <option value="social">ফেসবুক ও সোশ্যাল পোস্ট (Social Media)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        ছবি নির্বাচন করুন (কম্পিউটার/মোবাইল থেকে সরাসরি বা অনলাইনে লিংক দিন):
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch gap-2">
                        <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 flex items-center justify-center gap-2 cursor-pointer shrink-0 transition">
                          <Upload className="w-3.5 h-3.5 text-purple-600" />
                          <span>ফাইল পছন্দ করুন</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                alert("ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const b64 = ev.target?.result as string;
                                if (b64) setMediaImageUrl(b64);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>

                        <input
                          type="text"
                          placeholder="অথবা সরাসরি ছবির ইমেজ URL লিংক পেস্ট করুন..."
                          value={mediaImageUrl.startsWith("data:") ? "✓ লোকাল ডিভাইস থেকে ছবি নির্বাচন করা হয়েছে" : mediaImageUrl}
                          onChange={e => !e.target.value.startsWith("✓") && setMediaImageUrl(e.target.value)}
                          className="flex-1 text-xs border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500 font-mono"
                        />

                        {mediaImageUrl && (
                          <button
                            type="button"
                            onClick={() => setMediaImageUrl("")}
                            className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                          >
                            মুছুন
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Image Preview Box if image selected */}
                    {mediaImageUrl && (
                      <div className="relative rounded-2xl overflow-hidden border border-purple-200 bg-slate-50 max-h-48 flex items-center justify-center p-2">
                        <img
                          src={mediaImageUrl}
                          alt="Preview"
                          className="max-h-44 object-contain rounded-xl"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        বিবরণ বা ক্যাপশন (Optional Note / Campaign Offer):
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: ১০,০০০ টাকার বেশি অর্ডারে ফ্রি শিপিং ব্যানার"
                        value={mediaDescription}
                        onChange={e => setMediaDescription(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={mediaUploading || !mediaImageUrl}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{mediaUploading ? "আপলোড হচ্ছে..." : "মার্কেটিং ছবি সংরক্ষণ করুন"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* 3. Marketing Campaign Media Gallery */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                  <div>
                    <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                      <ImageIcon className="w-4.5 h-4.5 text-purple-600" />
                      <span>মার্কেটিং ব্যানার ও ছবির গ্যালারি ({marketingMediaList.length} টি ছবি)</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      নিচের ছবিগুলো থেকে সরাসরি লিংক কপি করতে পারেন অথবা অপ্রয়োজনীয় ছবি মুছে ফেলতে পারেন
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchMarketingMedia}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>রিফ্রেশ</span>
                  </button>
                </div>

                {loadingMedia ? (
                  <div className="py-16 text-center text-gray-400 text-xs font-semibold">
                    মার্কেটিং ছবি লোড হচ্ছে...
                  </div>
                ) : marketingMediaList.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200 my-4">
                    <Camera className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <strong className="text-sm text-gray-700 block">কোনো মার্কেটিং ছবি বা ব্যানার পাওয়া যায়নি</strong>
                    <span className="text-xs text-gray-400 block mt-1">
                      উপরের ফর্ম ব্যবহার করে আপনার প্রথম ক্যাম্পেইন ব্যানার বা প্রোডাক্টের মার্কেটিং ছবি আপলোড করুন।
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                    {marketingMediaList.map((media) => (
                      <div
                        key={media.id}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                      >
                        <div className="relative aspect-video bg-slate-100 overflow-hidden flex items-center justify-center">
                          <img
                            src={media.imageUrl}
                            alt={media.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-bold backdrop-blur-xs">
                            {media.category}
                          </span>
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <strong className="text-xs font-bold text-gray-900 block truncate" title={media.title}>
                              {media.title}
                            </strong>
                            {media.description && (
                              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                                {media.description}
                              </p>
                            )}
                            <span className="text-[10px] text-gray-400 block mt-1">
                              {new Date(media.createdAt).toLocaleDateString("bn-BD")}
                            </span>
                          </div>

                          <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(media.imageUrl);
                                alert("ছবির লিংক কপি করা হয়েছে!");
                              }}
                              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                              title="ছবির URL কপি করুন"
                            >
                              <Copy className="w-3 h-3" />
                              <span className="hidden sm:inline">লিংক</span>
                            </button>

                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(`মার্কেটিং অফার: ${media.title}\nছবি দেখুন: ${media.imageUrl}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                              title="হোয়াটসঅ্যাপে শেয়ার করুন"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDeleteMarketingMedia(media.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                              title="এই ছবিটি মুছে ফেলুন (সরিয়ে দিন)"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>সরান</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Marketing Officer Photo Upload & Remove Modal */}
      {showOfficerPhotoModal && dashboard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    মার্কেটিং অফিসারের ছবি আপডেট
                  </h3>
                  <span className="text-xs text-gray-500 font-mono">
                    {dashboard.code} • {dashboard.assignedStaff.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOfficerPhotoModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Photo Preview & Current Status */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <StaffAvatar
                  name={dashboard.assignedStaff.name}
                  avatar={customPhotoInput || dashboard.assignedStaff.avatar}
                  size="xl"
                  className="ring-2 ring-purple-300"
                />
                <div className="text-xs flex-1">
                  <strong className="block text-gray-900 font-bold">{dashboard.assignedStaff.name}</strong>
                  <span className="text-gray-500 font-mono text-[11px] block">{dashboard.code} • {dashboard.department}</span>
                  <span className="text-emerald-600 text-[10px] font-semibold mt-1 block">
                    {customPhotoInput ? "✓ নতুন ছবি প্রিভিউ হচ্ছে" : dashboard.assignedStaff.avatar ? "✓ বর্তমান ছবি সক্রিয়" : "ছবি দেওয়া নেই (ইনিশিয়াল সক্রিয়)"}
                  </span>
                </div>
              </div>

              {/* Direct File Upload */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ১. কম্পিউটার বা মোবাইল থেকে ছবি বেছে নিন:
                </label>
                <label className="w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl border-2 border-dashed border-purple-300 flex items-center justify-center gap-2 cursor-pointer transition text-xs font-bold">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <span>গ্যালারি বা ফাইল থেকে ছবি সিলেক্ট করুন</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        alert("ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const b64 = ev.target?.result as string;
                        if (b64) setCustomPhotoInput(b64);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>

              {/* Image URL input */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ২. অথবা অনলাইন ছবির লিংক দিন (Image URL):
                </label>
                <input
                  type="text"
                  placeholder="https://... ছবির ওয়েব লিংক"
                  value={customPhotoInput.startsWith("data:") ? "" : customPhotoInput}
                  onChange={e => setCustomPhotoInput(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                💡 <strong>কাস্টমার ড্যাশবোর্ড সিঙ্ক:</strong> ছবি সেভ করার সাথে সাথে এই কর্মকর্তার আন্ডারে থাকা সব কাস্টমার তাদের ড্যাশবোর্ডে ও অর্ডারে এই ছবি দেখতে পাবে।
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                {/* Remove Photo button */}
                <button
                  type="button"
                  disabled={officerPhotoSaving}
                  onClick={() => handleDeskOfficerPhotoChange("remove")}
                  className="px-3 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="ছবি মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ছবি সরান (Remove)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOfficerPhotoModal(false)}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 cursor-pointer"
                  >
                    বাতিল
                  </button>

                  <button
                    type="button"
                    disabled={officerPhotoSaving || !customPhotoInput}
                    onClick={() => handleDeskOfficerPhotoChange(customPhotoInput)}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{officerPhotoSaving ? "সংরক্ষণ হচ্ছে..." : "ছবি সেভ করুন"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Marketing Staff Modal */}
      {assignModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-charcoal">
                    মার্কেটিং ও একাউন্ট ম্যানেজার অ্যাসাইন করুন
                  </h3>
                  <p className="text-xs text-gray-500">
                    অর্ডার নং: <span className="font-mono font-bold text-charcoal">{String(assignModalOrder.orderId || assignModalOrder.id || "")}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOrder(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Details Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500 block text-[10px]">কাস্টমারের নাম:</span>
                  <strong className="text-charcoal">{assignModalOrder.customerInfo?.name || assignModalOrder.customerName || "Customer"}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">ফোন নম্বর:</span>
                  <strong className="text-charcoal font-mono">{assignModalOrder.customerInfo?.phone || assignModalOrder.customerPhone || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">অর্ডারের মোট মূল্য:</span>
                  <strong className="text-emerald-700 font-mono">BDT {Number(assignModalOrder.total || assignModalOrder.grandTotal || 0).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">বর্তমান স্ট্যাটাস:</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                    {assignModalOrder.status}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-700 mb-2">
              কাকে অ্যাসাইন করতে চান? নিচে থেকে মার্কেটিং অফিসার নির্বাচন করুন:
            </p>

            {/* List of Marketing Staff */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {allDashboards
                .filter(d => d.department === "sales")
                .map(staffDesk => {
                  const isCurrentAssigned =
                    assignModalOrder.assignedMarketingStaff?.id === staffDesk.id ||
                    assignModalOrder.assignedMarketingStaff?.name === staffDesk.assignedStaff.name;

                  const assignedCount = orders.filter(
                    o => o.assignedMarketingStaff?.id === staffDesk.id || o.assignedMarketingStaff?.name === staffDesk.assignedStaff.name
                  ).length;

                  return (
                    <div
                      key={staffDesk.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isCurrentAssigned
                          ? "bg-indigo-50/60 border-indigo-300"
                          : "bg-white hover:bg-slate-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <StaffAvatar
                          name={staffDesk.assignedStaff.name}
                          avatar={staffDesk.assignedStaff.avatar}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-charcoal">
                              {staffDesk.assignedStaff.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold font-mono">
                              {staffDesk.code}
                            </span>
                            {isCurrentAssigned && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>📞 {staffDesk.assignedStaff.phone}</span>
                            <span>• {assignedCount} Orders Assigned</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isAssigning}
                        onClick={() => handleAssignMarketingStaff(assignModalOrder, staffDesk)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                          isCurrentAssigned
                            ? "bg-slate-200 hover:bg-slate-300 text-slate-800"
                            : "bg-rose-600 hover:bg-rose-700 text-white shadow-2xs"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isCurrentAssigned ? "Reassign" : "Assign"}</span>
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                অ্যাসাইন করার সাথে সাথে কাস্টমারের ড্যাশবোর্ডে অফিসারের ছবি ও ফোন নম্বর প্রদর্শিত হবে।
              </span>
              <button
                type="button"
                onClick={() => setAssignModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. DELIVERY & LOGISTICS (DEL-1, DEL-2, DEL-3)                  */}
      {/* ============================================================== */}
      {dashboard.department === "delivery" && (
        isMasterAdmin ? (
          <div className="space-y-5">
          {/* Dispatches Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/60">
              <div className="flex items-center gap-2 font-bold text-xs text-charcoal">
                <Truck className="w-4 h-4 text-amber-600" />
                Parcel Tracking & Delivery Dispatch List ({dispatches.length})
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                + New Parcel Dispatch
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer & Address</th>
                    <th className="py-3 px-4">China AWB / Flight</th>
                    <th className="py-3 px-4">Courier & Tracking</th>
                    <th className="py-3 px-4">Weight (KG)</th>
                    <th className="py-3 px-4">COD Amount</th>
                    <th className="py-3 px-4">Logistics Stage</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dispatches.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        No dispatches found. Click &quot;New Parcel Dispatch&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    dispatches.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-charcoal font-mono">{d.orderId}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-charcoal">{d.customerName}</div>
                          <div className="text-[11px] text-gray-500 line-clamp-1">{d.customerAddress}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[11px]">
                          <div className="font-mono font-bold text-sky-700">{d.chinaAwb || "N/A"}</div>
                          <div className="text-gray-400 text-[10px]">{d.flightSeaBatch}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-charcoal block">{d.courierName || "Unassigned"}</span>
                          <span className="text-[11px] font-mono text-gray-500">{d.trackingNumber || "No Tracking"}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-charcoal">{d.weightKg || 1} KG</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700 font-mono">
                          BDT  {d.codAmount?.toLocaleString() || 0}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={d.stage}
                            onChange={e => handleUpdateDispatchStage(d, e.target.value)}
                            className="text-[11px] font-bold border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary"
                          >
                            <option value="china_warehouse">China Warehouse</option>
                            <option value="customs_transit">Customs Transit</option>
                            <option value="bd_hub_qc">BD Hub QC</option>
                            <option value="packaging_done">Packaging Done</option>
                            <option value="courier_assigned">Courier Assigned</option>
                            <option value="delivered">Delivered (Complete)</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteDispatch(d.id)}
                            className="p-1.5 text-xs text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg transition"
                            title="Delete this dispatch from staff desks"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
          <div className="bg-slate-900/5 border border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-200">
              <ShieldCheck className="w-7 h-7 text-slate-600" />
            </div>
            <h4 className="text-base font-bold text-slate-800">মেইন অ্যাডমিন প্যানেলে সংরক্ষিত (Main Admin Exclusive)</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              পার্সেল ট্র্যাকিং ও ডেলিভারি ডিসপ্যাচ ম্যানেজমেন্ট সিস্টেম শুধুমাত্র মেইন অ্যাডমিন প্যানেলের মধ্যে সংরক্ষিত। অন্য কোনো ড্যাশবোর্ডে এর অ্যাক্সেস নেই।
            </p>
          </div>
        )
      )}

      {/* ============================================================== */}
      {/* 4. ACCOUNTS & FINANCIAL INTELLIGENCE (ACC-1)                   */}
      {/* ============================================================== */}
      {dashboard.department === "accounts" && (() => {
        // Filter invoices based on active tab and search query
        const displayedInvoices = allInvoices.filter((inv: any) => {
          if (activeAuditTab === "pending" && inv.deliveryStatus === "Delivered") return false;
          if (activeAuditTab === "delivered" && inv.deliveryStatus !== "Delivered") return false;
          if (auditSearchTerm.trim()) {
            const term = auditSearchTerm.trim().toLowerCase();
            const matchInv = (inv.invoiceNumber || "").toLowerCase().includes(term);
            const matchOrder = (inv.orderId || "").toLowerCase().includes(term);
            const matchName = (inv.customerName || "").toLowerCase().includes(term);
            const matchPhone = (inv.customerPhone || "").toLowerCase().includes(term);
            const matchNote = (inv.deliveryDelayNote || "").toLowerCase().includes(term);
            const matchCourier = (inv.courierPartner || "").toLowerCase().includes(term);
            const matchTracking = (inv.trackingNumber || "").toLowerCase().includes(term);
            return matchInv || matchOrder || matchName || matchPhone || matchNote || matchCourier || matchTracking;
          }
          return true;
        });

        const pendingPresetReasons = [
          "কাস্টমার ফোন ধরেনি",
          "ভুল/অসম্পূর্ণ ঠিকানা",
          "কুরিয়ার ট্রানজিট বিলম্ব",
          "বকেয়া পেমেন্ট বাকি",
          "কাস্টমার রিসিডিউল চেয়েছে",
          "চায়না থেকে হাবে আসেনি"
        ];

        return (
          <div className="space-y-5">
            {/* Accounts Header Bar & New Invoice Button */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold border border-indigo-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>ইনভয়েস রিসিভ ও ডেলিভারি অডিট রেজিস্টার</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold uppercase">
                      Accounts Desk
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    কতটি ইনভয়েস রিসিভ হয়েছে, কয়টি ডেলিভারি সম্পন্ন এবং পেন্ডিং অর্ডারের ডেলিভারি না হওয়ার কারণ নোট সংরক্ষণ করুন।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = `WB-INV-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;
                    setNewInvNumber(nextNum);
                    setNewInvOrderId("");
                    setNewInvCustomer("");
                    setNewInvPhone("");
                    setNewInvAddress("");
                    setNewInvProduct("");
                    setNewInvQty(1);
                    setNewInvAmount(0);
                    setNewInvDate(new Date().toISOString().split("T")[0]);
                    setNewInvStatus("Pending");
                    setNewInvDelayNote("");
                    setNewInvCourier("Steadfast");
                    setNewInvTracking("");
                    setShowAddInvoiceModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ নতুন ইনভয়েস রিসিভ লিখুন</span>
                </button>
              </div>
            </div>

            {/* Notification / Toast Message */}
            {noteSavedMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{noteSavedMsg}</span>
              </div>
            )}

            {/* Financial KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div 
                onClick={() => setActiveAuditTab("all")}
                className={`bg-white rounded-2xl border p-4 shadow-xs cursor-pointer transition ${
                  activeAuditTab === "all" ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="text-xs text-slate-500 font-semibold block">মোট ইনভয়েস রিসিভড</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {accountsStats.invoicesReceivedCount} <span className="text-xs font-normal text-slate-400">টি</span>
                </span>
                <span className="text-[10px] text-blue-600 font-bold block mt-1">Total Invoices Received</span>
              </div>

              <div 
                onClick={() => setActiveAuditTab("delivered")}
                className={`bg-white rounded-2xl border p-4 shadow-xs cursor-pointer transition ${
                  activeAuditTab === "delivered" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-emerald-200 hover:border-emerald-300"
                } bg-emerald-50/20`}
              >
                <span className="text-xs text-emerald-800 font-semibold block">ডেলিভারি সম্পন্ন ইনভয়েস</span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">
                  {accountsStats.invoicesDeliveredCount} <span className="text-xs font-normal text-emerald-600">টি</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">Successfully Delivered</span>
              </div>

              <div 
                onClick={() => setActiveAuditTab("pending")}
                className={`bg-white rounded-2xl border p-4 shadow-xs cursor-pointer transition ${
                  activeAuditTab === "pending" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-amber-200 hover:border-amber-300"
                } bg-amber-50/20`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-800 font-semibold block">পেন্ডিং ডেলিভারি</span>
                  {accountsStats.invoicesPendingCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  )}
                </div>
                <span className="text-2xl font-black text-amber-700 mt-1 block">
                  {accountsStats.invoicesPendingCount} <span className="text-xs font-normal text-amber-600">টি</span>
                </span>
                <span className="text-[10px] text-amber-600 font-bold block mt-1">Pending Delivery / Transit</span>
              </div>

              <div className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-xs bg-indigo-50/20">
                <span className="text-xs text-indigo-800 font-semibold block">মোট ডেলিভারিকৃত পণ্যের মূল্য</span>
                <span className="text-xl sm:text-2xl font-black text-indigo-700 mt-1 block">
                  ৳ {accountsStats.totalDeliveredAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-indigo-600 font-bold block mt-1">Total Delivered BDT</span>
              </div>
            </div>

            {/* Invoices List & Notes Audit Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              {/* Filter Tabs & Search Bar */}
              <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 text-white">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveAuditTab("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeAuditTab === "all"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>সব ইনভয়েস ({accountsStats.invoicesReceivedCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAuditTab("pending")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeAuditTab === "pending"
                        ? "bg-amber-400 text-slate-900 shadow-xs"
                        : "bg-amber-950/60 text-amber-300 hover:bg-amber-900/60 border border-amber-800/40"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>পেন্ডিং ও কারণ নোট ({accountsStats.invoicesPendingCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAuditTab("delivered")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeAuditTab === "delivered"
                        ? "bg-emerald-400 text-slate-900 shadow-xs"
                        : "bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/40"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ডেলিভারি সম্পন্ন ({accountsStats.invoicesDeliveredCount})</span>
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative min-w-[260px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ইনভয়েস নং, কাস্টমার, ফোন বা নোট খুঁজুন..."
                    value={auditSearchTerm}
                    onChange={(e) => setAuditSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Invoice & Date</th>
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Product & Qty</th>
                      <th className="py-3 px-4">Amount (BDT)</th>
                      <th className="py-3 px-4 min-w-[180px]">Courier Partner</th>
                      <th className="py-3 px-4 min-w-[300px]">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>কেন ডেলিভারি হয়নি সেটার নোট (Pending Delay Reason)</span>
                        </span>
                      </th>
                      <th className="py-3 px-4 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          কোনো ইনভয়েস রেকর্ড পাওয়া যায়নি। &quot;+ নতুন ইনভয়েস রিসিভ লিখুন&quot; বাটনে ক্লিক করে নতুন ইনভয়েস যুক্ত করতে পারেন।
                        </td>
                      </tr>
                    ) : (
                      displayedInvoices.map((inv: any) => {
                        const invKey = String(inv.id || inv.orderId || inv.invoiceNumber);
                        const isDelivered = inv.deliveryStatus === "Delivered";
                        const activeNote = pendingNoteDrafts[invKey] !== undefined ? pendingNoteDrafts[invKey] : (inv.deliveryDelayNote || "");
                        const isSaving = savingNoteId === invKey;
                        const canManageCourier = dashboard?.department === "accounts" || isMasterAdmin;
                        const activeCourier = courierDrafts[invKey]?.partner ?? inv.courierPartner ?? "";
                        const activeTracking = courierDrafts[invKey]?.tracking ?? inv.trackingNumber ?? "";

                        return (
                          <tr key={invKey} className={`hover:bg-slate-50/80 transition align-top ${isDelivered ? "bg-white" : "bg-amber-50/10"}`}>
                            {/* 1. Invoice & Date */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-slate-900 text-xs">{inv.invoiceNumber}</div>
                              {inv.orderId && (
                                <div className="text-[10px] text-slate-500 font-mono">Order: {inv.orderId}</div>
                              )}
                              <div className="text-[10px] text-slate-400 mt-0.5">{inv.receivedDate}</div>
                              <div className="mt-1">
                                {isDelivered ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    <Check className="w-3 h-3" />
                                    <span>Delivered</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                    <Clock className="w-3 h-3" />
                                    <span>Pending</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 2. Customer Details */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{inv.customerName || "Customer"}</div>
                              {inv.customerPhone && (
                                <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{inv.customerPhone}</span>
                                </div>
                              )}
                              {inv.customerAddress && (
                                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 max-w-[180px]">
                                  {inv.customerAddress}
                                </div>
                              )}
                            </td>

                            {/* 3. Product & Qty */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800 line-clamp-2 max-w-[180px]">
                                {inv.productName || "Import Goods"}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Qty: {inv.quantity || 1} pcs
                              </div>
                            </td>

                            {/* 4. Total Amount */}
                            <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                              ৳ {Number(inv.totalAmount || 0).toLocaleString()}
                            </td>

                            {/* 5. Courier Partner */}
                            <td className="py-3.5 px-4">
                              {canManageCourier ? (
                                <div className="space-y-1">
                                  <select
                                    value={activeCourier}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCourierDrafts(prev => ({
                                        ...prev,
                                        [invKey]: { ...(prev[invKey] || { tracking: activeTracking }), partner: val }
                                      }));
                                      if (inv.rawOrder) {
                                        handleSaveCourier(inv.rawOrder, val, activeTracking);
                                      } else {
                                        fetch(`/api/admin/accounts/invoices-audit/${encodeURIComponent(invKey)}`, {
                                          method: "PUT",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ courierPartner: val, trackingNumber: activeTracking })
                                        }).then(() => fetchDashboardData());
                                      }
                                    }}
                                    className="w-full border border-slate-300 rounded px-2 py-1 text-[11px] font-bold bg-white text-slate-800 cursor-pointer focus:outline-none focus:border-indigo-600 shadow-2xs"
                                  >
                                    <option value="">-- কুরিয়ার নির্বাচন --</option>
                                    <option value="Steadfast">Steadfast (স্টেডফাস্ট)</option>
                                    <option value="Pathao">Pathao (পাঠাও)</option>
                                    <option value="Sundarban Courier Service">Sundarban (সুন্দরবন)</option>
                                    <option value="RedX">RedX (রেডএক্স)</option>
                                    <option value="SA Paribahan">SA Paribahan (এস এ পরিবহন)</option>
                                    <option value="Office Delivery">Office Delivery (অফিস)</option>
                                  </select>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      placeholder="কনসাইনমেন্ট নং..."
                                      value={activeTracking}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCourierDrafts(prev => ({
                                          ...prev,
                                          [invKey]: { ...(prev[invKey] || { partner: activeCourier }), tracking: val }
                                        }));
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          if (inv.rawOrder) {
                                            handleSaveCourier(inv.rawOrder, activeCourier, activeTracking);
                                          } else {
                                            fetch(`/api/admin/accounts/invoices-audit/${encodeURIComponent(invKey)}`, {
                                              method: "PUT",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ courierPartner: activeCourier, trackingNumber: activeTracking })
                                            }).then(() => fetchDashboardData());
                                          }
                                        }
                                      }}
                                      className="w-full border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (inv.rawOrder) {
                                          handleSaveCourier(inv.rawOrder, activeCourier, activeTracking);
                                        } else {
                                          fetch(`/api/admin/accounts/invoices-audit/${encodeURIComponent(invKey)}`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ courierPartner: activeCourier, trackingNumber: activeTracking })
                                          }).then(() => fetchDashboardData());
                                        }
                                      }}
                                      className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold cursor-pointer transition shrink-0"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <span className="font-bold text-slate-800">{activeCourier || "Unassigned"}</span>
                                  <span className="font-mono text-[10px] text-slate-500 block">{activeTracking || "-"}</span>
                                </div>
                              )}
                            </td>

                            {/* 6. কেন ডেলিভারি হয়নি সেটার নোট (Pending Delay Reason Note) */}
                            <td className="py-3 px-4">
                              {isDelivered ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>ডেলিভারি সম্পন্ন হয়েছে</span>
                                  </div>
                                  {inv.deliveryDelayNote && (
                                    <p className="text-[10px] text-slate-400 italic">
                                      পূর্বের নোট: {inv.deliveryDelayNote}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1.5 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      <span>দেরির কারণ / নোট লিখুন:</span>
                                    </label>
                                    <button
                                      type="button"
                                      disabled={isSaving}
                                      onClick={() => handleMarkInvoiceDelivered(inv)}
                                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1"
                                      title="ডেলিভারি সম্পন্ন হলে ক্লিক করুন"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>✓ মার্ক ডেলিভারড</span>
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="কেন ডেলিভারি হয়নি (যেমন: ফোন বন্ধ, ঠিকানা ভুল, কুরিয়ার বিলম্ব)..."
                                      value={activeNote}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setPendingNoteDrafts(prev => ({ ...prev, [invKey]: val }));
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSavePendingNote(inv, activeNote);
                                      }}
                                      className="w-full px-2 py-1.5 text-xs border border-amber-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-amber-600 shadow-2xs"
                                    />
                                    <button
                                      type="button"
                                      disabled={isSaving}
                                      onClick={() => handleSavePendingNote(inv, activeNote)}
                                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                                    >
                                      {isSaving ? (
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <>
                                          <Save className="w-3 h-3" />
                                          <span>সেভ</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {/* Quick Preset Buttons for Rapid Note Entry */}
                                  <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-amber-200/60">
                                    <span className="text-[9px] text-amber-800 font-semibold mr-0.5">দ্রুত সিলেক্ট:</span>
                                    {pendingPresetReasons.map((reason, rIdx) => (
                                      <button
                                        key={rIdx}
                                        type="button"
                                        onClick={() => {
                                          setPendingNoteDrafts(prev => ({ ...prev, [invKey]: reason }));
                                          handleSavePendingNote(inv, reason);
                                        }}
                                        className="text-[9px] px-1.5 py-0.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded transition cursor-pointer"
                                      >
                                        + {reason}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* 7. Action / Invoice Print */}
                            <td className="py-3 px-4 text-right">
                              {inv.rawOrder ? (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadInvoiceWithPhotos(inv.rawOrder)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Invoice</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    alert(`ইনভয়েস নং: ${inv.invoiceNumber}\nকাস্টমার: ${inv.customerName}\nটাকার পরিমাণ: ৳ ${Number(inv.totalAmount).toLocaleString()}\nস্ট্যাটাস: ${inv.deliveryStatus}\nবিলম্ব নোট: ${inv.deliveryDelayNote || 'নেই'}`);
                                  }}
                                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition border border-slate-300"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View</span>
                                </button>
                              )}
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
      })()}

      {/* ============================================================== */}
      {/* 5. PURCHASE & SOURCING (PUR-1, PUR-2, PUR-3)                  */}
      {/* ============================================================== */}
      {dashboard.department === "purchase" && (
        <div className="space-y-5">
          {/* QC Orders Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/60">
              <div className="flex items-center gap-2 font-bold text-xs text-charcoal">
                <ShoppingBag className="w-4 h-4 text-purple-600" />
                Procurement, QC & Supplier Settlement List ({qcOrders.length})
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                + New Procurement QC
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Supplier Order & Factory</th>
                    <th className="py-3 px-4">Product & Quantity</th>
                    <th className="py-3 px-4">China Price (RMB)</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">QC Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {qcOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        No procurement records found. Click &quot;New Procurement QC&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    qcOrders.map(qc => (
                      <tr key={qc.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-charcoal font-mono">{qc.orderId}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-purple-700">{qc.orderSupplierId || "Not Linked"}</div>
                          <div className="text-[11px] text-gray-500">{qc.supplierName}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-charcoal">{qc.productTitle}</div>
                          <div className="text-[11px] text-gray-500">Qty: {qc.quantity} Pcs</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                          ¥ {qc.agreedPriceRMB}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            qc.settlementStatus === "settled" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {qc.settlementStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={qc.qcStatus}
                            onChange={e => handleUpdateQCStatus(qc, e.target.value)}
                            className={`text-[11px] font-bold rounded-lg px-2 py-1 border focus:outline-none ${
                              qc.qcStatus === "passed" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                              qc.qcStatus === "rejected_defect" ? "bg-rose-50 text-rose-800 border-rose-200" :
                              "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <option value="pending_arrival">Pending Arrival</option>
                            <option value="inspecting">Inspecting</option>
                            <option value="passed">Passed (Approved)</option>
                            <option value="rejected_defect">Rejected (Defect)</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateQCStatus(qc, qc.qcStatus === "passed" ? "rejected_defect" : "passed")}
                              className="px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10 rounded-lg transition"
                            >
                              Status
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQC(qc.id)}
                              className="p-1.5 text-xs text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg transition"
                              title="Delete this QC record from staff desks"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS: ADD NEW OPERATIONAL ITEM                               */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-gray-200 shadow-xl my-8">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-charcoal text-white mr-2">
                  {dashboard.code}
                </span>
                <h3 className="text-lg font-bold text-charcoal inline">
                  {dashboard.department === "support" && "Create New Customer Support Ticket"}
                  {dashboard.department === "sales" && "Create New B2B Sales Quote"}
                  {dashboard.department === "delivery" && "Create New Parcel Dispatch & Tracking Entry"}
                  {dashboard.department === "purchase" && "Create New Procurement & QC Entry"}
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-charcoal text-xl font-bold">
                &times;
              </button>
            </div>

            {/* Support Ticket Form */}
            {dashboard.department === "support" && (
              <form onSubmit={handleSaveTicket} className="space-y-3 mt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={ticketForm.customerName}
                      onChange={e => setTicketForm({ ...ticketForm, customerName: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                      placeholder="Customer Name"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={ticketForm.customerPhone}
                      onChange={e => setTicketForm({ ...ticketForm, customerPhone: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary font-mono"
                      placeholder="017xxxxxxxx"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Order ID (Optional)</label>
                    <input
                      type="text"
                      value={ticketForm.orderId}
                      onChange={e => setTicketForm({ ...ticketForm, orderId: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary font-mono"
                      placeholder="e.g. 10248"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Priority</label>
                    <select
                      value={ticketForm.priority}
                      onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white"
                    >
                      <option value="low">Low (সাধারণ)</option>
                      <option value="medium">Medium (মাঝারি)</option>
                      <option value="high">High (জরুরি)</option>
                      <option value="urgent">Urgent (অতি জরুরি)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Subject / Issue Topic *</label>
                  <input
                    type="text"
                    required
                    value={ticketForm.subject}
                    onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                    placeholder="e.g. Delivery delay inquiry / Address modification"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Details / Notes</label>
                  <textarea
                    rows={3}
                    value={ticketForm.details}
                    onChange={e => setTicketForm({ ...ticketForm, details: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                    placeholder="Describe customer complaint or inquiry details..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-xs">
                    Save Support Ticket
                  </button>
                </div>
              </form>
            )}

            {/* Sales Quote Form */}
            {dashboard.department === "sales" && (
              <form onSubmit={handleSaveQuote} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    value={quoteForm.clientName}
                    onChange={e => setQuoteForm({ ...quoteForm, clientName: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                    placeholder="Client Name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Company / Store Name</label>
                    <input
                      type="text"
                      value={quoteForm.clientCompany}
                      onChange={e => setQuoteForm({ ...quoteForm, clientCompany: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                      placeholder="Style House BD"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={quoteForm.clientPhone}
                      onChange={e => setQuoteForm({ ...quoteForm, clientPhone: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                      placeholder="017xxxxxxxx"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Product Name & Description</label>
                  <input
                    type="text"
                    required
                    value={quoteForm.productName}
                    onChange={e => setQuoteForm({ ...quoteForm, productName: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                    placeholder="e.g. PU Leather Shoulder Bag (50 Pcs)"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Quantity (Qty)</label>
                    <input
                      type="number"
                      required
                      value={quoteForm.quantity}
                      onChange={e => setQuoteForm({ ...quoteForm, quantity: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Total RMB</label>
                    <input
                      type="number"
                      required
                      value={quoteForm.rmbTotal}
                      onChange={e => setQuoteForm({ ...quoteForm, rmbTotal: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Total BDT Quote</label>
                    <input
                      type="number"
                      required
                      value={quoteForm.bdtTotal}
                      onChange={e => setQuoteForm({ ...quoteForm, bdtTotal: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs">
                    Save Quote
                  </button>
                </div>
              </form>
            )}

            {/* Delivery Dispatch Form */}
            {dashboard.department === "delivery" && (
              <form onSubmit={handleSaveDispatch} className="space-y-3 mt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Order Number</label>
                    <input
                      type="text"
                      required
                      value={dispatchForm.orderId}
                      onChange={e => setDispatchForm({ ...dispatchForm, orderId: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary font-mono"
                      placeholder="WB-99105"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">China AWB Tracking</label>
                    <input
                      type="text"
                      value={dispatchForm.chinaAwb}
                      onChange={e => setDispatchForm({ ...dispatchForm, chinaAwb: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary font-mono"
                      placeholder="CZ-991823"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Customer Name & Phone</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Name"
                      value={dispatchForm.customerName}
                      onChange={e => setDispatchForm({ ...dispatchForm, customerName: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Mobile Number"
                      value={dispatchForm.customerPhone}
                      onChange={e => setDispatchForm({ ...dispatchForm, customerPhone: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Delivery Address</label>
                  <textarea
                    rows={2}
                    required
                    value={dispatchForm.customerAddress}
                    onChange={e => setDispatchForm({ ...dispatchForm, customerAddress: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                    placeholder="House, Road, Area, District..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Courier</label>
                    <select
                      value={dispatchForm.courierName}
                      onChange={e => setDispatchForm({ ...dispatchForm, courierName: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white"
                    >
                      <option value="Steadfast">Steadfast</option>
                      <option value="Pathao">Pathao</option>
                      <option value="RedX">RedX</option>
                      <option value="Sundarban">Sundarban</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Weight (KG)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={dispatchForm.weightKg}
                      onChange={e => setDispatchForm({ ...dispatchForm, weightKg: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">COD Amount (BDT)</label>
                    <input
                      type="number"
                      value={dispatchForm.codAmount}
                      onChange={e => setDispatchForm({ ...dispatchForm, codAmount: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs">
                    Save Dispatch Entry
                  </button>
                </div>
              </form>
            )}

            {/* Purchase QC Form */}
            {dashboard.department === "purchase" && (
              <form onSubmit={handleSaveQC} className="space-y-3 mt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Order Number</label>
                    <input
                      type="text"
                      required
                      value={qcForm.orderId}
                      onChange={e => setQcForm({ ...qcForm, orderId: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 font-mono"
                      placeholder="WB-99106"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Supplier Order ID</label>
                    <input
                      type="text"
                      value={qcForm.orderSupplierId}
                      onChange={e => setQcForm({ ...qcForm, orderSupplierId: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 font-mono"
                      placeholder="ORD-SUP-88219"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Supplier / Factory Name</label>
                  <input
                    type="text"
                    required
                    value={qcForm.supplierName}
                    onChange={e => setQcForm({ ...qcForm, supplierName: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2"
                    placeholder="Guangzhou Fashion Co."
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={qcForm.productTitle}
                    onChange={e => setQcForm({ ...qcForm, productTitle: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2"
                    placeholder="Product Name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Quantity (Pcs)</label>
                    <input
                      type="number"
                      required
                      value={qcForm.quantity}
                      onChange={e => setQcForm({ ...qcForm, quantity: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">China Price (RMB)</label>
                    <input
                      type="number"
                      required
                      value={qcForm.agreedPriceRMB}
                      onChange={e => setQcForm({ ...qcForm, agreedPriceRMB: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs">
                    Save Procurement Entry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Unified Order Modal */}
      {selectedOrderForModal && (
        <UnifiedOrderModal
          order={selectedOrderForModal}
          currentRole={
            (dashboard?.department === "sales" || String(dashboard?.id || "").toLowerCase().includes("marketing"))
              ? "Marketing"
              : isMasterAdmin
              ? "Admin"
              : String(dashboard?.department || "").toLowerCase() === "purchase"
              ? "Purchase"
              : String(dashboard?.department || "").toLowerCase() === "delivery"
              ? "Delivery"
              : String(dashboard?.department || "").toLowerCase() === "accounts"
              ? "Accounts"
              : "CS"
          }
          isMarketingView={dashboard?.department === "sales" || String(dashboard?.id || "").toLowerCase().includes("marketing")}
          hideCustomerPassword={dashboard?.department === "sales" || String(dashboard?.id || "").toLowerCase().includes("marketing")}
          initialSubTab={modalInitialTab}
          onClose={() => setSelectedOrderForModal(null)}
          onUpdateOrder={async (orderId, payload) => {
            try {
              const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/unified-update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...payload,
                  updatedBy: `${dashboard?.title || "Staff"} (Role Workspace)`
                }),
              });
              if (res.ok) {
                const data = await res.json();
                if (selectedOrderForModal && (selectedOrderForModal.id === orderId || selectedOrderForModal.orderId === orderId)) {
                  setSelectedOrderForModal(data.order);
                }
                fetchDashboardData();
              }
            } catch (err) {
              console.error("Failed to update order from modal:", err);
            }
          }}
        />
      )}

      {/* Product Info & Sourcing Modal (আইবাটন - Details) */}
      {selectedProductInfoOrder && (
        <OrderProductInfoModal
          order={selectedProductInfoOrder}
          department={dashboard?.department}
          showFullWorkspace={false}
          onClose={() => setSelectedProductInfoOrder(null)}
        />
      )}

      {/* Marketing Target & Customer Tiers Modal */}
      {showMarketingTiersModal && isMasterAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            <MarketingTargetCustomerTiers
              orders={orders}
              onClose={() => setShowMarketingTiersModal(false)}
              onOpenOrderModal={(o) => {
                setSelectedOrderForModal(o);
                setModalInitialTab("pipeline");
              }}
              onOpenProductInfoModal={(o) => setSelectedProductInfoOrder(o)}
            />
          </div>
        </div>
      )}

      {/* Log / Write New Received Invoice Modal */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold border border-indigo-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    নতুন ইনভয়েস রিসিভ এন্ট্রি লিখুন
                  </h3>
                  <p className="text-xs text-slate-500">
                    একাউন্টস সেকশনে প্রাপ্ত ইনভয়েসের তথ্য ও প্রাথমিক ডেলিভারি স্ট্যাটাস সংরক্ষণ করুন।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddInvoiceModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceAudit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ইনভয়েস নম্বর (Invoice #) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="WB-INV-XXXX"
                    value={newInvNumber}
                    onChange={(e) => setNewInvNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    অর্ডার আইডি (Order ID - Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10248..."
                    value={newInvOrderId}
                    onChange={(e) => setNewInvOrderId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কাস্টমার নাম (Customer Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Customer Full Name"
                    value={newInvCustomer}
                    onChange={(e) => setNewInvCustomer(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর (Phone)
                  </label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={newInvPhone}
                    onChange={(e) => setNewInvPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ডেলিভারি ঠিকানা (Address)
                </label>
                <input
                  type="text"
                  placeholder="House, Road, Area, Thana, District..."
                  value={newInvAddress}
                  onChange={(e) => setNewInvAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পণ্য বিবরণ (Product Item)
                  </label>
                  <input
                    type="text"
                    placeholder="Product title / name"
                    value={newInvProduct}
                    onChange={(e) => setNewInvProduct(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পরিমাণ (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newInvQty}
                    onChange={(e) => setNewInvQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ইনভয়েস মূল্য (Amount ৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={newInvAmount}
                    onChange={(e) => setNewInvAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600 font-mono font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    রিসিভ তারিখ (Date Received)
                  </label>
                  <input
                    type="date"
                    value={newInvDate}
                    onChange={(e) => setNewInvDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ডেলিভারি স্ট্যাটাস (Delivery Status)
                  </label>
                  <select
                    value={newInvStatus}
                    onChange={(e) => setNewInvStatus(e.target.value as "Pending" | "Delivered")}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600 bg-white font-bold"
                  >
                    <option value="Pending">⏳ Pending (পেন্ডিং)</option>
                    <option value="Delivered">✓ Delivered (ডেলিভারি সম্পন্ন)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কুরিয়ার পার্টনার
                  </label>
                  <select
                    value={newInvCourier}
                    onChange={(e) => setNewInvCourier(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="Steadfast">Steadfast (স্টেডফাস্ট)</option>
                    <option value="Pathao">Pathao (পাঠাও)</option>
                    <option value="Sundarban Courier Service">Sundarban (সুন্দরবন)</option>
                    <option value="RedX">RedX (রেডএক্স)</option>
                    <option value="SA Paribahan">SA Paribahan (এস এ পরিবহন)</option>
                    <option value="Office Delivery">Office Delivery (অফিস)</option>
                  </select>
                </div>
              </div>

              {/* Pending Reason Note */}
              {newInvStatus === "Pending" && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>কেন ডেলিভারি হয়নি সেটার নোট (Pending Delivery Reason Note)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="দেরির কারণ লিখুন (যেমন: কাস্টমার ফোন ধরেনি, ঠিকানা পরিবর্তন, কুরিয়ার বিলম্ব)..."
                    value={newInvDelayNote}
                    onChange={(e) => setNewInvDelayNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl focus:outline-none focus:border-amber-600 bg-white"
                  />
                  <div className="flex items-center gap-1 flex-wrap mt-1.5">
                    {["কাস্টমার ফোন ধরেনি", "ভুল ঠিকানা", "কুরিয়ার বিলম্ব", "বকেয়া পেমেন্ট", "রিসিডিউল"].map((tag, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => setNewInvDelayNote(tag)}
                        className="text-[9px] px-1.5 py-0.5 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded transition cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewInvoice}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingNewInvoice ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>সেভ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>ইনভয়েস সেভ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
