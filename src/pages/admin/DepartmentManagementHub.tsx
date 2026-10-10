import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Headphones,
  TrendingUp,
  ShoppingBag,
  Truck,
  DollarSign,
  Crown,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Clock,
  Printer,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Save,
  Check,
  X,
  RefreshCw,
  Eye,
  ArrowRight,
  Package,
  History,
  Lock,
  Percent,
  Sliders,
  AlertTriangle,
  Camera,
  User,
  Upload,
  Trash2
} from "lucide-react";
import StaffAvatar from "../../components/admin/StaffAvatar";
import { getProductPath } from "../../utils/productUrl";
import { DEFAULT_ROLE_DASHBOARDS } from "../../utils/roleDashboardsData";

export type DeptRole = "main_admin" | "cs" | "marketing" | "purchase" | "delivery" | "accounts";

export default function DepartmentManagementHub() {
  // Current active department role
  const [activeRole, setActiveRole] = useState<DeptRole>(() => {
    try {
      const saved = localStorage.getItem("admin_department_role");
      if (saved && ["main_admin", "cs", "marketing", "purchase", "delivery", "accounts"].includes(saved)) {
        return saved as DeptRole;
      }
      const adminUser = localStorage.getItem("admin_user");
      if (adminUser) {
        const parsed = JSON.parse(adminUser);
        const r = String(parsed?.role || "").toLowerCase();
        if (r === "admin" || r === "super_admin") return "main_admin";
        if (r.includes("cs") || r.includes("support")) return "cs";
        if (r.includes("market") || r.includes("sales")) return "marketing";
        if (r.includes("purchase")) return "purchase";
        if (r.includes("delivery")) return "delivery";
        if (r.includes("account")) return "accounts";
      }
    } catch {}
    return "main_admin";
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Notifications
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Return Modal state (Delivery)
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<any | null>(null);
  const [returnReason, setReturnReason] = useState("Customer unavailable");
  const [returnNote, setReturnNote] = useState("");

  // Invoice Modal state
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Delivery daily report date filter
  const [deliveryReportDate, setDeliveryReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deliveryReportData, setDeliveryReportData] = useState<any | null>(null);

  // Accounts report
  const [accountsReportData, setAccountsReportData] = useState<any | null>(null);

  // Revenue Analytics state (Main Admin)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"today" | "last7Days" | "last15Days" | "last30Days" | "last1Year" | "custom">("today");
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [revenueAnalytics, setRevenueAnalytics] = useState<any | null>(null);

  // Local draft states for fast editing
  const [draftEdits, setDraftEdits] = useState<Record<string, any>>({});

  // Department Staff Desks & Photos
  const [roleDashboards, setRoleDashboards] = useState<any[]>(DEFAULT_ROLE_DASHBOARDS);
  const [editingPhotoDesk, setEditingPhotoDesk] = useState<any | null>(null);
  const [photoSavingId, setPhotoSavingId] = useState<string | null>(null);
  const [customPhotoUrlInput, setCustomPhotoUrlInput] = useState("");

  // Fetch all initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [ordRes, invRes, repDelRes, repAccRes, revRes, dashRes] = await Promise.all([
        fetch("/api/orders").then(r => r.json()).catch(() => []),
        fetch("/api/admin/invoices").then(r => r.json()).catch(() => []),
        fetch(`/api/admin/delivery-report?date=${deliveryReportDate}`).then(r => r.json()).catch(() => null),
        fetch("/api/admin/accounts-report").then(r => r.json()).catch(() => null),
        fetch(`/api/admin/revenue-analytics?startDate=${customStartDate}&endDate=${customEndDate}`).then(r => r.json()).catch(() => null),
        fetch("/api/admin/role-dashboards").then(r => r.json()).catch(() => DEFAULT_ROLE_DASHBOARDS)
      ]);

      setOrders(Array.isArray(ordRes) ? ordRes : []);
      setInvoices(Array.isArray(invRes) ? invRes : []);
      setDeliveryReportData(repDelRes);
      setAccountsReportData(repAccRes);
      setRevenueAnalytics(revRes);
      if (Array.isArray(dashRes) && dashRes.length > 0) {
        setRoleDashboards(dashRes);
      }

      if (activeRole === "main_admin") {
        fetchAuditLogs();
      }
    } catch (e) {
      console.error("Failed to load department data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStaffPhoto = async (deskId: string, newPhoto: string) => {
    try {
      setPhotoSavingId(deskId);
      const res = await fetch(`/api/admin/role-dashboards/${deskId}/staff-photo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: newPhoto })
      });
      if (res.ok) {
        setRoleDashboards(prev =>
          prev.map(d =>
            d.id === deskId
              ? { ...d, assignedStaff: { ...d.assignedStaff, avatar: newPhoto } }
              : d
          )
        );
        showToast("success", "কর্মকর্তার ছবি সফলভাবে আপডেট করা হয়েছে!");
        setEditingPhotoDesk(null);
        setCustomPhotoUrlInput("");
      } else {
        showToast("error", "ছবি সংরক্ষণ করতে সমস্যা হয়েছে");
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to update staff photo");
    } finally {
      setPhotoSavingId(null);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const logs = await fetch("/api/admin/audit-logs?limit=150").then(r => r.json());
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, [deliveryReportDate, customStartDate, customEndDate]);

  useEffect(() => {
    try {
      localStorage.setItem("admin_department_role", activeRole);
    } catch {}
    if (activeRole === "main_admin") {
      fetchAuditLogs();
    }
  }, [activeRole]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Central API updater with active department role enforcement
  const updateOrderWorkflow = async (orderId: string, updates: Record<string, any>) => {
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/department-workflow-update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-department": activeRole,
          "x-user-role": activeRole,
          "x-user-name": `${activeRole.toUpperCase()} Staff`
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to update order workflow");
        return false;
      }

      showToast("success", "Updated successfully & financials recalculated!");
      loadData();
      return true;
    } catch (err: any) {
      showToast("error", err.message || "Network error updating order");
      return false;
    }
  };

  // Generate Invoice on Server
  const handleGenerateInvoice = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/generate-invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-department": activeRole,
          "x-user-role": activeRole,
        },
        body: JSON.stringify({
          generatedBy: `${activeRole.toUpperCase()} Officer`
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to generate invoice");
        return;
      }
      showToast("success", `Invoice ${data.invoice?.invoiceNumber} generated! Order is now 'Prepare to Delivery'.`);
      setSelectedInvoice(data.invoice);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to generate invoice");
    }
  };

  // Submit Return Modal (Delivery)
  const handleSubmitReturn = async () => {
    if (!selectedOrderForReturn) return;
    if (returnReason === "Other" && !returnNote.trim()) {
      showToast("error", "Custom note is required when Return Reason is 'Other'");
      return;
    }

    const oid = selectedOrderForReturn.orderId || selectedOrderForReturn.id;
    const ok = await updateOrderWorkflow(oid, {
      status: "Returned",
      deliveryStatus: "Returned",
      returnReason,
      returnNote: returnNote.trim(),
      returnedAt: new Date().toISOString(),
      timelineNote: `Order returned by customer: ${returnReason}. Note: ${returnNote}`
    });

    if (ok) {
      setShowReturnModal(false);
      setSelectedOrderForReturn(null);
      setReturnNote("");
    }
  };

  // Filtered Orders for the UI
  const filteredOrders = useMemo(() => {
    let list = orders;

    // Role-specific smart filtering view
    if (activeRole === "cs") {
      // CS focuses on orders needing confirmation & shipping rate
      if (statusFilter === "pending_cs") {
        list = list.filter(o => !o.status || o.status === "Pending" || o.status === "Order Placed");
      }
    } else if (activeRole === "marketing") {
      // Marketing sees CS-confirmed orders awaiting China or BD warehouse receipt
      if (statusFilter === "needs_china_wh") {
        list = list.filter(o => o.status === "Order Confirmed" || o.status === "Purchased");
      } else if (statusFilter === "needs_bd_wh") {
        list = list.filter(o => o.status === "Received in China Warehouse" || o.chinaWarehouseStatus === "Receive in China Warehouse");
      }
    } else if (activeRole === "purchase") {
      // Purchase sees CS Confirmed orders needing 1688 ordering, tracking & courier bill
      if (statusFilter === "needs_sourcing") {
        list = list.filter(o => !o.order1688Id || o.status === "Order Confirmed");
      }
    } else if (activeRole === "delivery") {
      // Delivery focuses on BD Warehouse received / weight update / dispatch
      if (statusFilter === "needs_weight") {
        list = list.filter(o => !o.weightKg || Number(o.weightKg) === 0);
      }
    }

    if (statusFilter !== "all" && !["pending_cs", "needs_china_wh", "needs_bd_wh", "needs_sourcing", "needs_weight"].includes(statusFilter)) {
      list = list.filter(o => String(o.status || "").toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(o => {
        const id = String(o.orderId || o.id || "").toLowerCase();
        const cName = String(o.customerInfo?.name || o.customerName || o.customer || "").toLowerCase();
        const cPhone = String(o.customerInfo?.phone || o.customerPhone || o.phone || "").toLowerCase();
        const trk = String(o.trackingNumber || "").toLowerCase();
        const ord1688 = String(o.order1688Id || "").toLowerCase();
        return id.includes(q) || cName.includes(q) || cPhone.includes(q) || trk.includes(q) || ord1688.includes(q);
      });
    }

    return list;
  }, [orders, activeRole, statusFilter, searchQuery]);

  // Roles definition
  const ROLES_INFO: Record<DeptRole, { label: string; bangla: string; icon: any; color: string; desc: string }> = {
    main_admin: {
      label: "Main Admin",
      bangla: "মেইন এডমিন (Full Access)",
      icon: Crown,
      color: "bg-purple-600 text-white",
      desc: "Full management access to all departments, financial analytics, and system audit logs."
    },
    cs: {
      label: "CS Department",
      bangla: "কাস্টমার সাপোর্ট (Order Confirm & Rate)",
      icon: Headphones,
      color: "bg-blue-600 text-white",
      desc: "Order confirmation and dynamic shipping rate per KG configuration. Restricted from other fields."
    },
    marketing: {
      label: "Marketing Department",
      bangla: "মার্কেটিং ও ট্রানজিট (Warehouse Receipts)",
      icon: TrendingUp,
      color: "bg-amber-600 text-white",
      desc: "Receive in China Warehouse & BD Warehouse. View-only on other fields. Bank accounts & settings are strictly restricted to Main Admin."
    },
    purchase: {
      label: "Purchase Department",
      bangla: "পারচেজ ও সোর্সিং (1688 ID, Tracking, Bill)",
      icon: ShoppingBag,
      color: "bg-emerald-600 text-white",
      desc: "1688 Order ID, Tracking Number, Purchased/Stock Out, and China Courier Bill management."
    },
    delivery: {
      label: "Delivery Department",
      bangla: "ডেলিভারি ও লজিস্টিকস (Weight & Dispatch)",
      icon: Truck,
      color: "bg-rose-600 text-white",
      desc: "Actual weight (KG) check, shipping calculation, invoice dispatch, and return management."
    },
    accounts: {
      label: "Accounts Department",
      bangla: "একাউন্টস ও ফাইন্যান্স (Invoices & Due)",
      icon: DollarSign,
      color: "bg-indigo-600 text-white",
      desc: "Financial reporting, invoice tracking, and undelivered orders audit with reason review."
    }
  };

  const currentRoleMeta = ROLES_INFO[activeRole];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Notification Toast */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 ${
            toastMsg.type === "success"
              ? "bg-emerald-600 text-white border border-emerald-500"
              : "bg-rose-600 text-white border border-rose-500"
          }`}
        >
          {toastMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner & Unified Role Switcher */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-primary text-white shadow-xs">
                <Shield className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>World Buy BD Department Management System</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded uppercase tracking-wider">
                    Strict RBAC
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Order Workflow • Automated Shipping Engine • Multi-Role Enforced Permissions • Audit Logs
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Sync DB</span>
            </button>
            <div className="px-3 py-1.5 bg-slate-800 text-emerald-400 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span>Database Connected</span>
            </div>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Department Role (Switch to operate or test permissions):
            </span>
            <span className="text-[11px] text-slate-400">
              Active: <strong className="text-white">{currentRoleMeta.label}</strong> ({currentRoleMeta.bangla})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {(Object.keys(ROLES_INFO) as DeptRole[]).map(roleKey => {
              const meta = ROLES_INFO[roleKey];
              const isActive = activeRole === roleKey;
              const Icon = meta.icon;
              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => {
                    setActiveRole(roleKey);
                    setStatusFilter("all");
                  }}
                  className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? "bg-slate-800 border-primary ring-2 ring-primary/40 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-slate-500"}`} />
                    {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <div>
                    <span className={`text-xs font-bold block ${isActive ? "text-white" : "text-slate-300"}`}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {meta.bangla}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Permission Banner */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
              <span className="text-slate-300">{currentRoleMeta.desc}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0 ml-2">
              Backend Rule: {activeRole === "main_admin" ? "FULL ADMIN ACCESS" : "STRICT ENFORCEMENT"}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DEPARTMENT STAFF & PROFILE PHOTO MANAGEMENT SYSTEM            */}
      {/* ============================================================== */}
      {(() => {
        const deptFilter =
          activeRole === "cs"
            ? ["support"]
            : activeRole === "marketing"
            ? ["sales"]
            : activeRole === "delivery"
            ? ["delivery"]
            : activeRole === "accounts"
            ? ["accounts"]
            : activeRole === "purchase"
            ? ["purchase"]
            : ["support", "sales", "delivery", "accounts", "purchase"];

        const visibleDesks = roleDashboards.filter(d => deptFilter.includes(d.department));

        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>ডিপার্টমেন্ট কর্মকর্তা ও ছবি ব্যবস্থাপনা (Staff Profile Photo System)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {visibleDesks.length} জন কর্মকর্তা
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    প্রতিটি ডিপার্টমেন্টের কর্মচারীর ছবি যুক্ত করুন বা পরিবর্তন করুন। ছবির ওপর ক্লিক করে সরাসরি ফাইল আপলোড করতে পারেন।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/admin/role-dashboards"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>সকল স্টাফ ডেস্ক হাব</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Grid of Department Staff */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {visibleDesks.map(desk => {
                return (
                  <div
                    key={desk.id}
                    className="p-3.5 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xs transition bg-slate-50/50 flex items-start gap-3.5 relative group"
                  >
                    {/* Staff Photo Avatar with Direct Upload Click */}
                    <div className="relative shrink-0 flex flex-col items-center">
                      <StaffAvatar
                        name={desk.assignedStaff?.name || desk.title}
                        avatar={desk.assignedStaff?.avatar}
                        size="lg"
                        editable={true}
                        onPhotoChange={(newPhoto) => handleUpdateStaffPhoto(desk.id, newPhoto)}
                        statusBadge={true}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPhotoDesk(desk);
                          setCustomPhotoUrlInput(desk.assignedStaff?.avatar || "");
                        }}
                        className="mt-1 text-[9px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                        title="URL দিয়ে ছবি যুক্ত করুন"
                      >
                        <Camera className="w-2.5 h-2.5" />
                        <span>ছবি বদলান</span>
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-xs font-bold text-slate-900 truncate">
                          {desk.assignedStaff?.name || "Staff Member"}
                        </strong>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                          {desk.code}
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-slate-600 truncate mt-0.5">
                        {desk.title}
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono mt-1 space-y-0.5">
                        <div>📞 {desk.assignedStaff?.phone}</div>
                        <div className="truncate">✉️ {desk.assignedStaff?.email}</div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-gray-200/70 flex items-center justify-between">
                        <span className="text-[10px] capitalize px-2 py-0.5 rounded font-bold bg-white border border-gray-200 text-slate-700">
                          {desk.department} Dept
                        </span>

                        <Link
                          to={`/admin/role-dashboards/${desk.id}`}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <span>ডেস্কে যান</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Quick Photo URL Edit Modal */}
      {editingPhotoDesk && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>কর্মকর্তার ছবি আপডেট ({editingPhotoDesk.assignedStaff?.name})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPhotoDesk(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <StaffAvatar
                  name={editingPhotoDesk.assignedStaff?.name || "Staff"}
                  avatar={customPhotoUrlInput || editingPhotoDesk.assignedStaff?.avatar}
                  size="xl"
                />
                <div className="text-xs">
                  <strong className="block text-slate-900 font-bold">{editingPhotoDesk.assignedStaff?.name}</strong>
                  <span className="text-slate-500 font-mono text-[11px] block">{editingPhotoDesk.code} • {editingPhotoDesk.department}</span>
                  <span className="text-emerald-600 text-[10px] font-semibold mt-1 block">কম্পিউটার/মোবাইল থেকে সরাসরি বা অনলাইনে লিংক দিয়ে ছবি দেওয়া যাবে</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  অনলাইন ছবির লিংক (Image URL):
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... অথবা যেকোনো ইমেজ লিংক"
                  value={customPhotoUrlInput.startsWith("data:") ? "" : customPhotoUrlInput}
                  onChange={(e) => setCustomPhotoUrlInput(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                {editingPhotoDesk.assignedStaff?.avatar ? (
                  <button
                    type="button"
                    disabled={Boolean(photoSavingId)}
                    onClick={() => handleUpdateStaffPhoto(editingPhotoDesk.id, "remove")}
                    className="px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="ছবি মুছে ইনিশিয়াল সেট করুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ছবি সরান (Remove)</span>
                  </button>
                ) : (
                  <div></div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPhotoDesk(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(photoSavingId) || !customPhotoUrlInput}
                    onClick={() => handleUpdateStaffPhoto(editingPhotoDesk.id, customPhotoUrlInput)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{photoSavingId ? "সংরক্ষণ হচ্ছে..." : "ছবি সেভ করুন"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENT SPECIFIC HIGHLIGHTS & DASHBOARDS */}

      {/* 1. DELIVERY DASHBOARD SPECIAL CARDS (When Delivery or Main Admin is active) */}
      {(activeRole === "delivery" || activeRole === "main_admin") && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-600" />
                <span>Delivery Department Real-Time KPI Cards</span>
              </h2>
              <p className="text-xs text-gray-500">Live counts directly computed from database records</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Daily Report Date:</span>
              <input
                type="date"
                value={deliveryReportDate}
                onChange={e => setDeliveryReportDate(e.target.value)}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg bg-gray-50 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-xl">
              <span className="text-[11px] font-bold text-sky-700 uppercase block">1. Ready for Delivery</span>
              <span className="text-2xl font-black text-sky-950 block mt-1">
                {deliveryReportData?.counts?.readyForDelivery ?? 0}
              </span>
              <span className="text-[10px] text-sky-600">Invoices ready for courier</span>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl">
              <span className="text-[11px] font-bold text-indigo-700 uppercase block">2. Given to Delivery</span>
              <span className="text-2xl font-black text-indigo-950 block mt-1">
                {deliveryReportData?.counts?.givenToDelivery ?? 0}
              </span>
              <span className="text-[10px] text-indigo-600">Assigned to courier transit</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
              <span className="text-[11px] font-bold text-emerald-700 uppercase block">3. Delivered</span>
              <span className="text-2xl font-black text-emerald-950 block mt-1">
                {deliveryReportData?.counts?.delivered ?? 0}
              </span>
              <span className="text-[10px] text-emerald-600">Successfully completed</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
              <span className="text-[11px] font-bold text-amber-700 uppercase block">4. Delivery Pending</span>
              <span className="text-2xl font-black text-amber-950 block mt-1">
                {deliveryReportData?.counts?.deliveryPending ?? 0}
              </span>
              <span className="text-[10px] text-amber-600">Awaiting processing</span>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl">
              <span className="text-[11px] font-bold text-rose-700 uppercase block">5. Returned</span>
              <span className="text-2xl font-black text-rose-950 block mt-1">
                {deliveryReportData?.counts?.returned ?? 0}
              </span>
              <span className="text-[10px] text-rose-600">Customer returns with reason</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACCOUNTS DASHBOARD FINANCIAL METRICS (When Accounts or Main Admin is active) */}
      {(activeRole === "accounts" || activeRole === "main_admin") && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <span>Accounts Department Financial & Invoice Ledger</span>
              </h2>
              <p className="text-xs text-gray-500">Live invoice counts, collected payments & pending dues</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Invoices</span>
              <strong className="text-lg font-black text-slate-900 block mt-0.5">
                {accountsReportData?.totalInvoices ?? 0}
              </strong>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
              <span className="text-[10px] text-emerald-700 uppercase font-bold block">Delivered Invoices</span>
              <strong className="text-lg font-black text-emerald-950 block mt-0.5">
                {accountsReportData?.deliveredInvoices ?? 0}
              </strong>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
              <span className="text-[10px] text-rose-700 uppercase font-bold block">Undelivered</span>
              <strong className="text-lg font-black text-rose-950 block mt-0.5">
                {accountsReportData?.undeliveredInvoices ?? 0}
              </strong>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <span className="text-[10px] text-amber-700 uppercase font-bold block">Pending Invoices</span>
              <strong className="text-lg font-black text-amber-950 block mt-0.5">
                {accountsReportData?.pendingInvoices ?? 0}
              </strong>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
              <span className="text-[10px] text-purple-700 uppercase font-bold block">Returned</span>
              <strong className="text-lg font-black text-purple-950 block mt-0.5">
                {accountsReportData?.returnedInvoices ?? 0}
              </strong>
            </div>
            <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl">
              <span className="text-[10px] text-teal-700 uppercase font-bold block">Paid Amount</span>
              <strong className="text-lg font-black text-teal-950 block mt-0.5 font-mono">
                BDT {(accountsReportData?.paidAmount ?? 0).toLocaleString()}
              </strong>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
              <span className="text-[10px] text-rose-700 uppercase font-bold block">Due Amount</span>
              <strong className="text-lg font-black text-rose-950 block mt-0.5 font-mono">
                BDT {(accountsReportData?.dueAmount ?? 0).toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Undelivered Invoices Table */}
          {accountsReportData?.undeliveredList && accountsReportData.undeliveredList.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Undelivered Invoices Record (Delivery Pending or Returned with Reasons):</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Invoice & Order</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Delivery Not Completed Reason</th>
                      <th className="py-2.5 px-3">Audit Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {accountsReportData.undeliveredList.map((und: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{und.invoiceNumber} ({und.orderId})</td>
                        <td className="py-2 px-3 font-medium text-slate-700">{und.customerName} - {und.customerPhone}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${und.status === "Returned" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                            {und.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-rose-700">{und.reason}</td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">{und.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MAIN ADMIN REVENUE ANALYTICS & AUDIT LOGS (When Main Admin is active) */}
      {activeRole === "main_admin" && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>Main Admin Live Revenue Analytics</span>
              </h2>
              <p className="text-xs text-gray-500">Real-time aggregation from Supabase & PostgreSQL orders database</p>
            </div>

            {/* Time Period Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold flex-wrap">
              {(["today", "last7Days", "last15Days", "last30Days", "last1Year", "custom"] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAnalyticsPeriod(p)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer capitalize ${
                    analyticsPeriod === p ? "bg-white text-slate-900 font-bold shadow-xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {p === "last7Days" ? "Last 7 Days" : p === "last15Days" ? "Last 15 Days" : p === "last30Days" ? "Last 30 Days" : p === "last1Year" ? "Last 1 Year" : p}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {analyticsPeriod === "custom" && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center gap-3 flex-wrap text-xs">
              <span className="font-bold text-purple-900">Custom Date Range:</span>
              <div className="flex items-center gap-1.5">
                <label className="text-gray-600">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-gray-600">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {/* Analytics KPI Display Cards */}
          {(() => {
            const currentStats =
              analyticsPeriod === "custom"
                ? revenueAnalytics?.custom || revenueAnalytics?.today
                : revenueAnalytics?.[analyticsPeriod] || revenueAnalytics?.today;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl">
                  <span className="text-[10px] text-purple-700 uppercase font-bold block">Total Orders</span>
                  <strong className="text-lg font-black text-purple-950 block mt-0.5">
                    {currentStats?.totalOrders ?? 0}
                  </strong>
                </div>
                <div className="bg-indigo-50/70 border border-indigo-200 p-3 rounded-xl">
                  <span className="text-[10px] text-indigo-700 uppercase font-bold block">Total Order Value</span>
                  <strong className="text-lg font-black text-indigo-950 block mt-0.5 font-mono">
                    BDT {(currentStats?.totalOrderValue ?? 0).toLocaleString()}
                  </strong>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">Paid Amount</span>
                  <strong className="text-lg font-black text-emerald-950 block mt-0.5 font-mono">
                    BDT {(currentStats?.paidAmount ?? 0).toLocaleString()}
                  </strong>
                </div>
                <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-xl">
                  <span className="text-[10px] text-rose-700 uppercase font-bold block">Due Amount</span>
                  <strong className="text-lg font-black text-rose-950 block mt-0.5 font-mono">
                    BDT {(currentStats?.dueAmount ?? 0).toLocaleString()}
                  </strong>
                </div>
                <div className="bg-sky-50/70 border border-sky-200 p-3 rounded-xl">
                  <span className="text-[10px] text-sky-700 uppercase font-bold block">Shipping Revenue</span>
                  <strong className="text-lg font-black text-sky-950 block mt-0.5 font-mono">
                    BDT {(currentStats?.shippingRevenue ?? 0).toLocaleString()}
                  </strong>
                </div>
                <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl">
                  <span className="text-[10px] text-amber-700 uppercase font-bold block">Product Revenue</span>
                  <strong className="text-lg font-black text-amber-950 block mt-0.5 font-mono">
                    BDT {(currentStats?.productRevenue ?? 0).toLocaleString()}
                  </strong>
                </div>
                <div className="bg-purple-100 border border-purple-300 p-3 rounded-xl">
                  <span className="text-[10px] text-purple-800 uppercase font-bold block">Total Revenue</span>
                  <strong className="text-lg font-black text-purple-950 block mt-0.5 font-mono">
                    BDT {(currentStats?.totalRevenue ?? 0).toLocaleString()}
                  </strong>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ORDERS DIRECTORY & DEPARTMENT WORKFLOW CONTROLS */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Table Filter & Search Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Orders Directory ({filteredOrders.length} Orders)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
              Role: {activeRole.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order, phone, 1688 ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl bg-white w-48 focus:outline-none focus:border-primary"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-xl px-2.5 py-1.5 bg-white font-medium focus:outline-none focus:border-primary"
            >
              <option value="all">All Orders</option>
              {activeRole === "cs" && <option value="pending_cs">Pending CS Confirmation</option>}
              {activeRole === "marketing" && <option value="needs_china_wh">Awaiting China WH</option>}
              {activeRole === "marketing" && <option value="needs_bd_wh">Awaiting BD WH</option>}
              {activeRole === "purchase" && <option value="needs_sourcing">Needs 1688 Upload</option>}
              {activeRole === "delivery" && <option value="needs_weight">Needs Weight Check</option>}
              <option value="Order Placed">Order Placed</option>
              <option value="Order Confirmed">Order Confirmed</option>
              <option value="Purchased">Purchased</option>
              <option value="Stock Out">Stock Out</option>
              <option value="Received in China Warehouse">Received in China WH</option>
              <option value="Received in BD Warehouse">Received in BD WH</option>
              <option value="Prepare to Delivery">Prepare to Delivery</option>
              <option value="Ready for Delivery">Ready for Delivery</option>
              <option value="Given to Delivery">Given to Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Returned">Returned</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Status & Pipeline</th>
                <th className="py-3 px-4">CS Shipping Rate</th>
                <th className="py-3 px-4">Warehouse Receipts (Marketing)</th>
                <th className="py-3 px-4">1688 & Courier Bill (Purchase)</th>
                <th className="py-3 px-4">Actual Weight & Delivery</th>
                <th className="py-3 px-4 text-right">Financials & Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No orders matching selected criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const oid = String(order.orderId || order.id || "");
                  const isMainAdmin = activeRole === "main_admin";
                  const isCS = activeRole === "cs" || isMainAdmin;
                  const isMarketing = activeRole === "marketing" || isMainAdmin;
                  const isPurchase = activeRole === "purchase" || isMainAdmin;
                  const isDelivery = activeRole === "delivery" || isMainAdmin;
                  const isAccounts = activeRole === "accounts" || isMainAdmin;

                  const draft = draftEdits[oid] || {};
                  const currentRate = draft.shippingRatePerKg ?? order.shippingRatePerKg ?? 780;
                  const currentWeight = draft.weightKg ?? order.weightKg ?? 0;
                  const current1688 = draft.order1688Id ?? order.order1688Id ?? "";
                  const currentTracking = draft.trackingNumber ?? order.trackingNumber ?? "";
                  const currentCourierBill = draft.chinaCourierBill ?? order.chinaCourierBill ?? 0;
                  const currentCourierEnabled = draft.chinaCourierEnabled ?? (order.chinaCourierEnabled !== false);

                  // Computed Financials
                  const shippingCost = Math.round(Number(currentWeight) * Number(currentRate) * 100) / 100;
                  const finalCourierBill = currentCourierEnabled ? Number(currentCourierBill) : 0;
                  const finalShipping = shippingCost + finalCourierBill;
                  const productTotal = Number(order.subtotal || order.total || 0);
                  const grandTotal = productTotal + finalShipping;
                  const paid = Number(order.paidAmount || 0);
                  const due = Math.max(0, grandTotal - paid);

                  return (
                    <tr key={oid} className="hover:bg-slate-50/80 transition align-top">
                      {/* 1. Order ID & Date & Product Link */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{oid}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{order.createdAt || order.date || "Recent"}</span>
                        {order.items && order.items[0] && (
                          <div className="mt-2 flex items-center gap-2">
                            {order.items[0].image && (
                              <a
                                href={getProductPath(order.items[0])}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block shrink-0 group relative"
                                title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                              >
                                <img
                                  src={order.items[0].image}
                                  alt="Product"
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 group-hover:border-primary transition"
                                />
                                <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition">
                                  <ExternalLink className="w-2.5 h-2.5 text-white" />
                                </span>
                              </a>
                            )}
                            <div className="min-w-0">
                              <a
                                href={getProductPath(order.items[0])}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-slate-900 hover:text-primary hover:underline line-clamp-1 max-w-[130px] inline-flex items-center gap-0.5 group"
                                title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                              >
                                <span>{order.items[0].name || "Product"}</span>
                                <ExternalLink className="w-2 h-2 text-slate-400 group-hover:text-primary shrink-0 transition" />
                              </a>
                              <span className="text-[10px] text-slate-500 block">
                                {order.items.length} Product(s)
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 2. Customer */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{order.customerInfo?.name || order.customerName || "Customer"}</span>
                        <span className="font-mono text-slate-600 block text-[11px]">{order.customerInfo?.phone || order.phone || ""}</span>
                        <span className="text-[10px] text-slate-400 block line-clamp-1 max-w-[140px]">{order.customerInfo?.address || ""}</span>
                      </td>

                      {/* 3. Status & Pipeline */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.status === "Delivered" ? "bg-emerald-100 text-emerald-800" :
                          order.status === "Returned" ? "bg-rose-100 text-rose-800" :
                          order.status === "Stock Out" ? "bg-purple-100 text-purple-800" :
                          order.status === "Order Confirmed" ? "bg-blue-100 text-blue-800" :
                          "bg-sky-100 text-sky-800"
                        }`}>
                          {order.status || "Order Placed"}
                        </span>

                        {/* CS Confirm Action */}
                        {isCS && (order.status === "Order Placed" || order.status === "Pending" || !order.status) && (
                          <div className="mt-1.5">
                            <button
                              type="button"
                              onClick={() => updateOrderWorkflow(oid, {
                                status: "Order Confirmed",
                                shippingRatePerKg: currentRate,
                                timelineNote: `CS confirmed order with shipping rate ${currentRate} BDT/KG`
                              })}
                              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3 h-3" />
                              <span>CS Confirm Order</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 4. CS Shipping Rate (Only CS or Main Admin can edit) */}
                      <td className="py-3 px-4">
                        {isCS ? (
                          <div className="space-y-1 min-w-[110px]">
                            <div className="flex items-center gap-1">
                              <select
                                value={currentRate}
                                onChange={e => {
                                  const r = Number(e.target.value);
                                  setDraftEdits(prev => ({
                                    ...prev,
                                    [oid]: { ...prev[oid], shippingRatePerKg: r }
                                  }));
                                }}
                                className="px-1.5 py-1 text-xs font-mono font-bold border border-blue-300 rounded bg-blue-50/60"
                              >
                                <option value={100}>100 ৳/KG</option>
                                <option value={150}>150 ৳/KG</option>
                                <option value={180}>180 ৳/KG</option>
                                <option value={450}>450 ৳/KG (Sea)</option>
                                <option value={650}>650 ৳/KG (Eco)</option>
                                <option value={780}>780 ৳/KG (Air)</option>
                                <option value={950}>950 ৳/KG (Exp)</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => updateOrderWorkflow(oid, {
                                  shippingRatePerKg: currentRate,
                                  timelineNote: `CS updated shipping rate to ${currentRate} BDT/KG`
                                })}
                                className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                                title="Save CS Shipping Rate"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[9px] text-blue-700 font-semibold block">
                              CS Shipping Rate Control
                            </span>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-1.5 rounded border border-gray-200 text-slate-700">
                            <span className="font-mono font-bold block">{order.shippingRatePerKg || 780} ৳/KG</span>
                            <span className="text-[9px] text-gray-400 block">🔒 CS Rate Locked</span>
                          </div>
                        )}
                      </td>

                      {/* 5. Marketing Warehouse Receipts (Only Marketing or Main Admin can edit) */}
                      <td className="py-3 px-4">
                        {isMarketing ? (
                          <div className="space-y-1.5 min-w-[150px]">
                            <button
                              type="button"
                              onClick={() => updateOrderWorkflow(oid, {
                                chinaWarehouseStatus: "Receive in China Warehouse",
                                status: "Received in China Warehouse",
                                timelineNote: "Marketing verified receipt in China Warehouse"
                              })}
                              className={`w-full px-2 py-1 rounded text-[10px] font-bold text-left flex items-center justify-between cursor-pointer border transition ${
                                order.chinaWarehouseStatus === "Receive in China Warehouse" || order.status === "Received in China Warehouse"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-white hover:bg-amber-50 text-slate-700 border-gray-200"
                              }`}
                            >
                              <span>1. Receive in China WH</span>
                              {(order.chinaWarehouseStatus === "Receive in China Warehouse" || order.status === "Received in China Warehouse") && <Check className="w-3 h-3 text-amber-700" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => updateOrderWorkflow(oid, {
                                bdWarehouseStatus: "Receive in BD Warehouse",
                                status: "Received in BD Warehouse",
                                timelineNote: "Marketing verified receipt in BD Warehouse"
                              })}
                              className={`w-full px-2 py-1 rounded text-[10px] font-bold text-left flex items-center justify-between cursor-pointer border transition ${
                                order.bdWarehouseStatus === "Receive in BD Warehouse" || order.status === "Received in BD Warehouse"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-white hover:bg-amber-50 text-slate-700 border-gray-200"
                              }`}
                            >
                              <span>2. Receive in BD WH</span>
                              {(order.bdWarehouseStatus === "Receive in BD Warehouse" || order.status === "Received in BD Warehouse") && <Check className="w-3 h-3 text-amber-700" />}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-1.5 rounded border border-gray-200 text-slate-600 text-[11px] space-y-1">
                            <div>China WH: <strong>{order.chinaWarehouseStatus || "Pending"}</strong></div>
                            <div>BD WH: <strong>{order.bdWarehouseStatus || "Pending"}</strong></div>
                            <span className="text-[9px] text-gray-400 block">🔒 Marketing Controls Only</span>
                          </div>
                        )}
                      </td>

                      {/* 6. Purchase 1688 ID, Tracking & Courier Bill (Only Purchase or Main Admin) */}
                      <td className="py-3 px-4">
                        {isPurchase ? (
                          <div className="space-y-1.5 min-w-[170px]">
                            <div>
                              <input
                                type="text"
                                placeholder="1688 Order ID..."
                                value={current1688}
                                onChange={e => {
                                  const v = e.target.value;
                                  setDraftEdits(prev => ({
                                    ...prev,
                                    [oid]: { ...prev[oid], order1688Id: v }
                                  }));
                                }}
                                className="w-full px-2 py-0.5 text-[11px] font-mono border border-emerald-300 rounded bg-emerald-50/40"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Tracking Number..."
                                value={currentTracking}
                                onChange={e => {
                                  const v = e.target.value;
                                  setDraftEdits(prev => ({
                                    ...prev,
                                    [oid]: { ...prev[oid], trackingNumber: v }
                                  }));
                                }}
                                className="w-full px-2 py-0.5 text-[11px] font-mono border border-emerald-300 rounded bg-emerald-50/40"
                              />
                            </div>

                            {/* China Courier Bill with Enabled/Disabled Toggle */}
                            <div className="p-1.5 rounded bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-1 text-[10px]">
                              <span className="font-bold text-emerald-900">China Courier:</span>
                              <input
                                type="number"
                                placeholder="৳ Bill"
                                value={currentCourierBill}
                                onChange={e => {
                                  const b = Number(e.target.value);
                                  setDraftEdits(prev => ({
                                    ...prev,
                                    [oid]: { ...prev[oid], chinaCourierBill: b }
                                  }));
                                }}
                                className="w-14 px-1 py-0.5 font-mono border rounded bg-white"
                              />
                              <label className="flex items-center gap-1 font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={currentCourierEnabled}
                                  onChange={e => {
                                    const en = e.target.checked;
                                    setDraftEdits(prev => ({
                                      ...prev,
                                      [oid]: { ...prev[oid], chinaCourierEnabled: en }
                                    }));
                                  }}
                                />
                                <span>{currentCourierEnabled ? "Active" : "Off"}</span>
                              </label>
                            </div>

                            <div className="flex items-center gap-1 pt-0.5">
                              <button
                                type="button"
                                onClick={() => updateOrderWorkflow(oid, {
                                  purchaseStatus: "Purchased",
                                  status: "Purchased",
                                  order1688Id: current1688,
                                  trackingNumber: currentTracking,
                                  chinaCourierBill: currentCourierBill,
                                  chinaCourierEnabled: currentCourierEnabled,
                                  timelineNote: `Purchase confirmed 1688 ID & Tracking`
                                })}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
                              >
                                Save Purchase
                              </button>
                              <button
                                type="button"
                                onClick={() => updateOrderWorkflow(oid, {
                                  stockOutStatus: "Stock Out",
                                  status: "Stock Out",
                                  timelineNote: "Marked as Stock Out by Purchase"
                                })}
                                className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] cursor-pointer"
                              >
                                Stock Out
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-1.5 rounded border border-gray-200 text-slate-700 text-[11px] space-y-1">
                            <div>1688: <strong className="font-mono text-emerald-800">{order.order1688Id || "Pending"}</strong></div>
                            <div>Track: <strong className="font-mono text-blue-800">{order.trackingNumber || "Pending"}</strong></div>
                            <div>Courier Bill: <strong className="font-mono">{order.chinaCourierEnabled !== false ? `BDT ${order.chinaCourierBill || 0}` : "Disabled (0 ৳)"}</strong></div>
                            <span className="text-[9px] text-gray-400 block">🔒 Purchase Controls Only</span>
                          </div>
                        )}
                      </td>

                      {/* 7. Actual Weight & Delivery (Only Delivery or Main Admin) */}
                      <td className="py-3 px-4">
                        {isDelivery ? (
                          <div className="space-y-1.5 min-w-[150px]">
                            <div className="flex items-center gap-1">
                              <label className="text-[10px] font-bold text-rose-900">Weight (KG):</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={currentWeight}
                                onChange={e => {
                                  const w = Number(e.target.value);
                                  setDraftEdits(prev => ({
                                    ...prev,
                                    [oid]: { ...prev[oid], weightKg: w }
                                  }));
                                }}
                                className="w-16 px-1.5 py-0.5 border border-rose-300 rounded font-mono font-bold bg-rose-50/50"
                              />
                              <button
                                type="button"
                                onClick={() => updateOrderWorkflow(oid, {
                                  weightKg: currentWeight,
                                  timelineNote: `Delivery checked actual weight: ${currentWeight} KG`
                                })}
                                className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Save
                              </button>
                            </div>

                            {/* Status transitions */}
                            <div className="space-y-1 pt-1 border-t border-gray-200">
                              <button
                                type="button"
                                onClick={() => updateOrderWorkflow(oid, {
                                  deliveryStatus: "Ready for Delivery",
                                  status: "Ready for Delivery",
                                  timelineNote: "Marked Ready for Delivery"
                                })}
                                className="w-full px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] text-left"
                              >
                                Ready for Delivery
                              </button>
                              <button
                                type="button"
                                onClick={() => updateOrderWorkflow(oid, {
                                  deliveryStatus: "Given to Delivery",
                                  status: "Given to Delivery",
                                  timelineNote: "Parcel dispatched / Given to delivery"
                                })}
                                className="w-full px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] text-left"
                              >
                                Given to Delivery
                              </button>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateOrderWorkflow(oid, {
                                    deliveryStatus: "Delivered",
                                    status: "Delivered",
                                    timelineNote: "Order successfully delivered to customer"
                                  })}
                                  className="flex-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                                >
                                  Delivered
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrderForReturn(order);
                                    setShowReturnModal(true);
                                  }}
                                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px]"
                                >
                                  Returned...
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-1.5 rounded border border-gray-200 text-slate-700 text-[11px] space-y-1">
                            <div>Weight: <strong className="font-mono text-rose-800">{order.weightKg ? `${order.weightKg} KG` : "Pending"}</strong></div>
                            <div>Delivery: <strong>{order.deliveryStatus || order.status || "Pending"}</strong></div>
                            {order.returnReason && (
                              <div className="text-rose-700 text-[10px] font-bold">
                                Return Reason: {order.returnReason}
                              </div>
                            )}
                            <span className="text-[9px] text-gray-400 block">🔒 Delivery Controls Only</span>
                          </div>
                        )}
                      </td>

                      {/* 8. Server-Calculated Financials & Invoice */}
                      <td className="py-3 px-4 text-right">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <div>Product: <strong className="text-slate-800">BDT {productTotal.toLocaleString()}</strong></div>
                          <div>Shipping: <strong className="text-sky-700">BDT {finalShipping.toLocaleString()}</strong></div>
                          <div className="text-xs font-bold text-slate-900">Total: BDT {grandTotal.toLocaleString()}</div>
                          <div>Paid: <span className="text-emerald-700">BDT {paid.toLocaleString()}</span></div>
                          <div className="font-bold text-rose-700">Due: BDT {due.toLocaleString()}</div>
                        </div>

                        {/* Invoice Actions */}
                        <div className="mt-2 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleGenerateInvoice(oid)}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-black text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-primary" />
                            <span>Gen Invoice</span>
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

      {/* RETURN MODAL (DELIVERY REQUIREMENT) */}
      {showReturnModal && selectedOrderForReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2 text-rose-700">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">
                  Record Parcel Return — {selectedOrderForReturn.orderId || selectedOrderForReturn.id}
                </h3>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Return Reason (Mandatory):
                </label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium bg-white focus:outline-none focus:border-rose-600"
                >
                  <option value="Customer unavailable">Customer unavailable</option>
                  <option value="Customer refused">Customer refused</option>
                  <option value="Wrong address">Wrong address</option>
                  <option value="Product damaged">Product damaged</option>
                  <option value="Product mismatch">Product mismatch</option>
                  <option value="Customer changed mind">Customer changed mind</option>
                  <option value="Other">Other (Custom Note Required)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Return Notes & Inspection Details {returnReason === "Other" && <span className="text-rose-600">*</span>}:
                </label>
                <textarea
                  rows={3}
                  value={returnNote}
                  onChange={e => setReturnNote(e.target.value)}
                  placeholder="Enter specific return reason or customer note..."
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                This will transition the order status to <strong>RETURNED</strong> and notify Accounts & Main Admin with the recorded reason.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReturn}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Confirm Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE PREVIEW MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Tax Invoice — {selectedInvoice.invoiceNumber}</h3>
                <span className="text-xs text-gray-400">Order Ref: {selectedInvoice.orderId}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-400 font-sans block uppercase">Customer:</span>
                  <strong className="text-slate-900 block">{selectedInvoice.customerInfo?.name || "Customer"}</strong>
                  <span className="text-slate-600 block">{selectedInvoice.customerInfo?.phone}</span>
                  <span className="text-slate-500 block text-[10px] font-sans">{selectedInvoice.customerInfo?.address}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-sans block uppercase">Date & Status:</span>
                  <span className="text-slate-800 block">{selectedInvoice.createdDate?.slice(0, 10)}</span>
                  <span className="text-emerald-700 font-bold block">{selectedInvoice.paymentStatus || "Paid/Due"}</span>
                  <span className="text-sky-700 font-bold block">{selectedInvoice.deliveryStatus || "Ready"}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 text-[10px] uppercase font-sans text-gray-600">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedInvoice.items || []).map((it: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2">{it.name || "Item"}</td>
                        <td className="p-2 text-center">{it.quantity || 1}</td>
                        <td className="p-2 text-right">BDT {(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Step-by-Step Financial Breakdown */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span>Product Subtotal:</span>
                  <strong>BDT {selectedInvoice.productTotal?.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-blue-700">
                  <span>CS Shipping Rate:</span>
                  <span>{selectedInvoice.shippingRate} BDT/KG</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Actual Product Weight:</span>
                  <span>{selectedInvoice.productWeight}</span>
                </div>
                <div className="flex justify-between text-indigo-700">
                  <span>Shipping Cost (Weight × Rate):</span>
                  <strong>BDT {selectedInvoice.shippingCost?.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>China Courier Bill ({selectedInvoice.chinaCourierEnabled ? "Enabled" : "Disabled"}):</span>
                  <strong>BDT {selectedInvoice.chinaCourierBill?.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-slate-200">
                  <span>Final Shipping Amount:</span>
                  <span>BDT {selectedInvoice.finalShippingAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-300">
                  <span>Grand Total:</span>
                  <span>BDT {selectedInvoice.grandTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Partial Paid:</span>
                  <span>BDT {selectedInvoice.paidAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-800 font-bold text-sm">
                  <span>Final Due on Delivery:</span>
                  <span>BDT {selectedInvoice.dueAmount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. AUDIT LOGS MODAL / SECTION FOR MAIN ADMIN */}
      {activeRole === "main_admin" && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <span>Department Operational Audit Logs (Main Admin Only)</span>
              </h2>
              <p className="text-xs text-gray-500">Chronological history of every field modified across departments</p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
            >
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="py-2 px-3">Date & Time</th>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3">Changed By</th>
                  <th className="py-2 px-3">Order Ref</th>
                  <th className="py-2 px-3">Action / Field</th>
                  <th className="py-2 px-3">Old Value</th>
                  <th className="py-2 px-3">New Value</th>
                  <th className="py-2 px-3">Audit Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-gray-400">
                      No audit log entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50 text-[11px]">
                      <td className="py-1.5 px-3 font-mono text-gray-500">{log.createdAt ? new Date(log.createdAt).toLocaleString() : "Just now"}</td>
                      <td className="py-1.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                          {log.department}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{log.changedBy}</td>
                      <td className="py-1.5 px-3 font-mono text-primary font-bold">{log.orderId || "-"}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-700">{log.action || log.field}</td>
                      <td className="py-1.5 px-3 font-mono text-rose-700 truncate max-w-[120px]">{log.oldValue || "-"}</td>
                      <td className="py-1.5 px-3 font-mono text-emerald-700 font-bold truncate max-w-[120px]">{log.newValue || "-"}</td>
                      <td className="py-1.5 px-3 text-slate-500">{log.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
