import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Headphones,
  ShoppingBag,
  Truck,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Settings,
  Search,
  RotateCcw,
  Key,
  Mail,
  Phone,
  Shield,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
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
  Trash2,
  Lock,
  Plus,
  Camera,
  Upload
} from "lucide-react";
import StaffAvatar from "../../components/admin/StaffAvatar";
import { RoleDashboard, DashboardDepartment } from "../../types/roleDashboard";
import { DEFAULT_ROLE_DASHBOARDS } from "../../utils/roleDashboardsData";

export default function AdminRoleDashboards() {
  const [dashboards, setDashboards] = useState<RoleDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | DashboardDepartment>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for editing dashboard & staff
  const [editingDashboard, setEditingDashboard] = useState<RoleDashboard | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Create New Staff Desk State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStaffDept, setNewStaffDept] = useState<DashboardDepartment>("support");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffTitle, setNewStaffTitle] = useState("");
  const [newStaffBanglaTitle, setNewStaffBanglaTitle] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffPhoto, setNewStaffPhoto] = useState("");
  const [newStaffNotes, setNewStaffNotes] = useState("");
  const [createdStaffResult, setCreatedStaffResult] = useState<any | null>(null);
  const [creatingStaff, setCreatingStaff] = useState(false);

  const navigate = useNavigate();

  const handleQuickUpdatePhoto = async (id: string, photoUrl: string) => {
    try {
      const res = await fetch(`/api/admin/role-dashboards/${id}/staff-photo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl })
      });
      if (res.ok) {
        setDashboards(prev =>
          prev.map(d =>
            d.id === id
              ? { ...d, assignedStaff: { ...d.assignedStaff, avatar: photoUrl } }
              : d
          )
        );
      }
    } catch (err) {
      console.error("Failed to update staff photo:", err);
    }
  };

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/role-dashboards");
      if (res.ok) {
        const data = await res.json();
        setDashboards(Array.isArray(data) && data.length > 0 ? data : DEFAULT_ROLE_DASHBOARDS);
      } else {
        setDashboards(DEFAULT_ROLE_DASHBOARDS);
      }
    } catch (err) {
      console.error("Error loading role dashboards:", err);
      setDashboards(DEFAULT_ROLE_DASHBOARDS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: "active" | "inactive") => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/admin/role-dashboards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setDashboards(prev =>
          prev.map(d => (d.id === id ? { ...d, status: newStatus } : d))
        );
      }
    } catch (err) {
      console.error("Failed to toggle dashboard status:", err);
    }
  };

  const handleResetDefaults = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/role-dashboards/reset-defaults", { method: "POST" });
      if (res.ok) {
        await fetchDashboards();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDashboard) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/role-dashboards/${editingDashboard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingDashboard)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        await fetchDashboards();
        setEditingDashboard(null);
      }
    } catch (err) {
      console.error("Error updating dashboard:", err);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/role-dashboards/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDashboards(prev => prev.filter(d => d.id !== id));
        if (editingDashboard?.id === id) {
          setEditingDashboard(null);
        }
        setDeleteConfirmId(null);
      } else {
        alert("Failed to delete dashboard");
      }
    } catch (err) {
      console.error("Error deleting dashboard:", err);
      alert("Error deleting dashboard");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateModal = (preselectedDept?: DashboardDepartment) => {
    const dept = preselectedDept || (activeTab !== "all" ? activeTab : "support");
    setNewStaffDept(dept);
    const existingCount = dashboards.filter(d => d.department === dept).length + 1;
    const deptPrefix: Record<string, string> = {
      support: "CS",
      sales: "KAM",
      delivery: "DEL",
      accounts: "ACC",
      purchase: "PUR"
    };
    const prefix = deptPrefix[dept] || "STAFF";
    
    setNewStaffTitle(`${prefix} Operations Desk ${existingCount}`);
    setNewStaffBanglaTitle(`${prefix} অপারেশনাল ডেস্ক ${existingCount}`);
    setNewStaffName("");
    setNewStaffEmail(`${prefix.toLowerCase()}${existingCount}@worldbuybd.com`);
    setNewStaffPhone("");
    setNewStaffPassword(`${dept}1234${existingCount}`);
    setNewStaffNotes(`Created for ${dept.toUpperCase()} department operations`);
    setCreatedStaffResult(null);
    setShowCreateModal(true);
  };

  const handleDeptChange = (dept: DashboardDepartment) => {
    setNewStaffDept(dept);
    const existingCount = dashboards.filter(d => d.department === dept).length + 1;
    const deptPrefix: Record<string, string> = {
      support: "CS",
      sales: "KAM",
      delivery: "DEL",
      accounts: "ACC",
      purchase: "PUR"
    };
    const prefix = deptPrefix[dept] || "STAFF";
    setNewStaffTitle(`${prefix} Operations Desk ${existingCount}`);
    setNewStaffBanglaTitle(`${prefix} অপারেশনাল ডেস্ক ${existingCount}`);
    setNewStaffEmail(`${prefix.toLowerCase()}${existingCount}@worldbuybd.com`);
    setNewStaffPassword(`${dept}1234${existingCount}`);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) {
      alert("অনুগ্রহ করে স্টাফের নাম লিখুন");
      return;
    }

    try {
      setCreatingStaff(true);
      const res = await fetch("/api/admin/role-dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: newStaffDept,
          title: newStaffTitle,
          banglaTitle: newStaffBanglaTitle,
          assignedStaff: {
            name: newStaffName,
            email: newStaffEmail,
            phone: newStaffPhone,
            password: newStaffPassword,
            avatar: newStaffPhoto || undefined
          },
          notes: newStaffNotes
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedStaffResult(data.dashboard);
        await fetchDashboards();
      } else {
        alert(data.error || "Failed to create staff desk");
      }
    } catch (err) {
      console.error("Error creating staff desk:", err);
      alert("Error creating staff desk");
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleCopyLink = (codeOrId: string) => {
    const url = `${window.location.origin}/portal/${codeOrId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(codeOrId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Helper icon renderer
  const getDepartmentIcon = (dept: DashboardDepartment) => {
    switch (dept) {
      case "support":
        return <Headphones className="w-5 h-5 text-sky-600" />;
      case "sales":
        return <Briefcase className="w-5 h-5 text-emerald-600" />;
      case "delivery":
        return <Truck className="w-5 h-5 text-amber-600" />;
      case "accounts":
        return <DollarSign className="w-5 h-5 text-indigo-600" />;
      case "purchase":
        return <ShoppingBag className="w-5 h-5 text-purple-600" />;
    }
  };

  const getDepartmentBadgeStyle = (dept: DashboardDepartment) => {
    switch (dept) {
      case "support":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "sales":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "delivery":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "accounts":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "purchase":
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  const filteredDashboards = dashboards.filter(d => {
    const matchesTab = activeTab === "all" || d.department === activeTab;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      d.code.toLowerCase().includes(term) ||
      d.title.toLowerCase().includes(term) ||
      d.banglaTitle.toLowerCase().includes(term) ||
      d.assignedStaff.name.toLowerCase().includes(term) ||
      d.assignedStaff.email.toLowerCase().includes(term) ||
      d.assignedStaff.phone.toLowerCase().includes(term);

    return matchesTab && matchesSearch;
  });

  const departmentCounts = {
    all: dashboards.length,
    support: dashboards.filter(d => d.department === "support").length,
    sales: dashboards.filter(d => d.department === "sales").length,
    delivery: dashboards.filter(d => d.department === "delivery").length,
    accounts: dashboards.filter(d => d.department === "accounts").length,
    purchase: dashboards.filter(d => d.department === "purchase").length,
  };

  const activeCount = dashboards.filter(d => d.status === "active").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-charcoal">
                Operational Role & Specialized Dashboards Control
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Manage all {dashboards.length} specialized desks directly from the admin panel.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-dark text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Add a new staff member or specialized desk to any department"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন স্টাফ / ডেস্ক যোগ করুন</span>
          </button>
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="Restore all dashboards to default"
          >
            <RotateCcw className="w-4 h-4" />
            Default Restore
          </button>
          <div className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            {activeCount} / {dashboards.length} Dashboards Active
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => setActiveTab("all")} 
          className={`cursor-pointer bg-white rounded-xl p-3.5 border transition ${activeTab === "all" ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
        >
          <div className="text-[11px] font-semibold text-gray-500 flex items-center justify-between">
            All Desks
            <Briefcase className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-black text-charcoal mt-1">{departmentCounts.all}  items</div>
          <span className="text-[10px] text-emerald-600 font-bold">{departmentCounts.all} Specialized Desks</span>
        </div>

        <div 
          onClick={() => setActiveTab("support")} 
          className={`cursor-pointer bg-white rounded-xl p-3.5 border transition ${activeTab === "support" ? "border-sky-500 ring-2 ring-sky-500/20 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
        >
          <div className="text-[11px] font-semibold text-gray-500 flex items-center justify-between">
            CS / কাস্টমার সাপোর্ট
            <Headphones className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-black text-charcoal mt-1">{departmentCounts.support} ডেক্স</div>
          <span className="text-[10px] text-sky-600 font-bold">
            CS চার্ট · শিপিং রেট · কনফার্ম
          </span>
        </div>

        <div 
          onClick={() => setActiveTab("sales")} 
          className={`cursor-pointer bg-white rounded-xl p-3.5 border transition ${activeTab === "sales" ? "border-rose-500 ring-2 ring-rose-500/20 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
        >
          <div className="text-[11px] font-semibold text-gray-500 flex items-center justify-between">
            Marketing / সেলস
            <Building2 className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-charcoal mt-1">{departmentCounts.sales} ডেক্স</div>
          <span className="text-[10px] text-rose-600 font-bold">টার্গেট vs এচিভড · কাস্টমার ব্র্যাকেট</span>
        </div>

        <div 
          onClick={() => setActiveTab("delivery")} 
          className={`cursor-pointer bg-white rounded-xl p-3.5 border transition ${activeTab === "delivery" ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
        >
          <div className="text-[11px] font-semibold text-gray-500 flex items-center justify-between">
            Delivery / ডেলিভারি
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-charcoal mt-1">{departmentCounts.delivery} ডেক্স</div>
          <span className="text-[10px] text-emerald-600 font-bold">Assigned to Delivery পর্যন্ত এক্সেস</span>
        </div>

        <div 
          onClick={() => setActiveTab("accounts")} 
          className={`cursor-pointer bg-white rounded-xl p-3.5 border transition ${activeTab === "accounts" ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
        >
          <div className="text-[11px] font-semibold text-gray-500 flex items-center justify-between">
            Accounts & Finance
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-charcoal mt-1">{departmentCounts.accounts} ডেক্স</div>
          <span className="text-[10px] text-indigo-600 font-bold">ACC-1 Complete Ledger</span>
        </div>

        <div 
          onClick={() => setActiveTab("purchase")} 
          className={`cursor-pointer bg-white rounded-xl p-3.5 border transition ${activeTab === "purchase" ? "border-purple-500 ring-2 ring-purple-500/20 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
        >
          <div className="text-[11px] font-semibold text-gray-500 flex items-center justify-between">
            Purchase / পারসেজ
            <ShoppingBag className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-charcoal mt-1">{departmentCounts.purchase} ডেক্স</div>
          <span className="text-[10px] text-purple-600 font-bold">Stock Out · China WH · কুরিয়ার বিল · নোট</span>
        </div>
      </div>


      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Department Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "all", label: `সকল ডেক্স (${departmentCounts.all})` },
            { id: "support", label: `🎧 CS / সাপোর্ট (${departmentCounts.support})` },
            { id: "purchase", label: `🛒 Purchase / পারসেজ (${departmentCounts.purchase})` },
            { id: "delivery", label: `🚚 Delivery / ডেলিভারি (${departmentCounts.delivery})` },
            { id: "sales", label: `🎯 Marketing / সেলস (${departmentCounts.sales})` },
            { id: "accounts", label: `💰 Accounts (${departmentCounts.accounts})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by code, title, or staff name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Active Tab Department Quick Helper & Add Staff Button */}
      {activeTab !== "all" && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
              {getDepartmentIcon(activeTab)}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                {activeTab === "support" && "🎧 কাস্টমার সাপোর্ট (CS) ডিপার্টমেন্ট"}
                {activeTab === "purchase" && "🛒 পারসেজ ও সোর্সিং (Purchase) ডিপার্টমেন্ট"}
                {activeTab === "delivery" && "🚚 ডেলিভারি ও লজিস্টিকস (Delivery) ডিপার্টমেন্ট"}
                {activeTab === "sales" && "🎯 মার্কেটিং ও সেলস (Sales) ডিপার্টমেন্ট"}
                {activeTab === "accounts" && "💰 একাউন্টস ও ফিন্যান্স (Accounts) ডিপার্টমেন্ট"}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeTab === "support" && "এই ডিপার্টমেন্টে নতুন স্টাফ যোগ করলে সে বিদ্যমান CS ড্যাশবোর্ডের সব সুবিধা (অর্ডার ট্র্যাকিং, কমপ্লেন, রিফান্ড ও টিকেট) পাবে।"}
                {activeTab === "purchase" && "এই ডিপার্টমেন্টে নতুন স্টাফ যোগ করলে সে বিদ্যমান Purchase ড্যাশবোর্ডের সব সুবিধা (১৬৮৮ ট্র্যাকিং, সাপ্লায়ার বিল ও কিউসি) পাবে।"}
                {activeTab === "delivery" && "এই ডিপার্টমেন্টে নতুন স্টাফ যোগ করলে সে বিদ্যমান Delivery ড্যাশবোর্ডের সব সুবিধা (হাব পার্সেল ট্র্যাকিং ও কুরিয়ার হ্যান্ডওভার) পাবে।"}
                {activeTab === "sales" && "এই ডিপার্টমেন্টে নতুন স্টাফ যোগ করলে সে বিদ্যমান Sales ড্যাশবোর্ডের সব সুবিধা (টার্গেট অগ্রগতি ও বি২বি কোটেশন) পাবে।"}
                {activeTab === "accounts" && "এই ডিপার্টমেন্টে নতুন স্টাফ যোগ করলে সে বিদ্যমান Accounts ড্যাশবোর্ডের সব সুবিধা (ইনভয়েস রিসিভ, ডেলিভারি ও পেন্ডিং বিলম্ব নোট) পাবে।"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenCreateModal(activeTab)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ এই ডিপার্টমেন্টে নতুন স্টাফ যোগ করুন</span>
          </button>
        </div>
      )}

      {/* Grid of Dashboards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold mt-3">Loading dashboards...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDashboards.map(d => (
            <div
              key={d.id}
              className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between hover:shadow-md ${
                d.status === "active" ? "border-gray-200" : "border-gray-200 bg-gray-50/70 opacity-80"
              }`}
            >
              <div className="p-5">
                {/* Top Bar: Code, Dept Icon & Active Switch */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-charcoal text-white shadow-xs">
                      {d.code}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg border flex items-center gap-1 ${getDepartmentBadgeStyle(d.department)}`}>
                      {getDepartmentIcon(d.department)}
                      {d.department.toUpperCase()}
                    </span>
                  </div>

                  {/* Toggle Active / Inactive Button */}
                  <button
                    onClick={() => handleToggleStatus(d.id, d.status)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition flex items-center gap-1.5 ${
                      d.status === "active"
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                    title={d.status === "active" ? "Click to deactivate" : "Click to activate"}
                  >
                    <span className={`w-2 h-2 rounded-full ${d.status === "active" ? "bg-emerald-600" : "bg-gray-400"}`}></span>
                    {d.status === "active" ? "Active" : "Inactive"}
                  </button>
                </div>

                {/* Dashboard Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-charcoal leading-snug">
                    {d.banglaTitle}
                  </h3>
                  <p className="text-xs text-primary font-medium mt-0.5">{d.title}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {d.description}
                  </p>
                </div>

                {/* Live Activity Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                  <div className="text-center border-r border-gray-200">
                    <span className="text-[10px] text-gray-500 font-semibold block">Items Handled</span>
                    <span className="text-sm font-black text-charcoal">{d.metrics?.handledCount || 0}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-gray-500 font-semibold block">Pending / Active</span>
                    <span className="text-sm font-black text-amber-600">{d.metrics?.pendingCount || 0}</span>
                  </div>
                </div>

                {/* Assigned Staff Box */}
                <div className="mt-4 p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Assigned Desk Officer
                    </span>
                    <button
                      onClick={() => setEditingDashboard(d)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 mt-2">
                    <StaffAvatar
                      name={d.assignedStaff.name}
                      avatar={d.assignedStaff.avatar}
                      size="md"
                      editable={true}
                      onPhotoChange={(newPhoto) => handleQuickUpdatePhoto(d.id, newPhoto)}
                    />
                    <div className="overflow-hidden flex-1">
                      <div className="text-xs font-bold text-charcoal truncate">
                        {d.assignedStaff.name}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {d.assignedStaff.phone}</span>
                        <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" /> {d.assignedStaff.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopyLink(d.id)}
                  className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-charcoal bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-1.5"
                  title="Copy staff direct portal access link"
                >
                  {copiedId === d.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      <span>Link</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDeleteConfirmId(d.id)}
                    className="p-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                    title="Delete desk from staff desks"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setEditingDashboard(d)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition"
                  >
                    Settings
                  </button>

                  <Link
                    to={`/admin/role-dashboards/${d.id}`}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>Open Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dashboard & Staff Modal */}
      {editingDashboard && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-gray-200 shadow-xl my-8">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-charcoal text-white mr-2">
                  {editingDashboard.code}
                </span>
                <h3 className="text-lg font-bold text-charcoal inline">
                  {editingDashboard.banglaTitle}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Assigned Staff, Login Access & Permission Control
                </p>
              </div>
              <button
                onClick={() => setEditingDashboard(null)}
                className="text-gray-400 hover:text-charcoal text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 mt-4">
              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-charcoal block">Dashboard Status</span>
                  <span className="text-[11px] text-gray-500">When inactive, staff cannot log in to dashboard</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingDashboard({
                      ...editingDashboard,
                      status: editingDashboard.status === "active" ? "inactive" : "active"
                    })
                  }
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    editingDashboard.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {editingDashboard.status === "active" ? "✓ Active" : "✕ Inactive"}
                </button>
              </div>

              {/* Staff Details */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Staff Info & Login Credentials
                </h4>

                {/* Employee Photo Upload & URL */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    <StaffAvatar
                      name={editingDashboard.assignedStaff.name}
                      avatar={editingDashboard.assignedStaff.avatar}
                      size="xl"
                      editable={true}
                      onPhotoChange={(newPhoto) =>
                        setEditingDashboard({
                          ...editingDashboard,
                          assignedStaff: { ...editingDashboard.assignedStaff, avatar: newPhoto }
                        })
                      }
                    />
                    <span className="block text-[9px] text-center text-slate-500 mt-1 font-semibold">
                      ক্লিক করে ছবি বদলান
                    </span>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <label className="text-xs font-bold text-gray-800 block">
                      কর্মকর্তার ছবি (Employee Profile Photo)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="ছবির অনলাইন লিংক (URL) লিখুন..."
                        value={editingDashboard.assignedStaff.avatar?.startsWith("data:") ? "" : (editingDashboard.assignedStaff.avatar || "")}
                        onChange={e =>
                          setEditingDashboard({
                            ...editingDashboard,
                            assignedStaff: { ...editingDashboard.assignedStaff, avatar: e.target.value }
                          })
                        }
                        className="flex-1 text-xs border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary font-mono"
                      />
                      {editingDashboard.assignedStaff.avatar && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingDashboard({
                              ...editingDashboard,
                              assignedStaff: { ...editingDashboard.assignedStaff, avatar: "" }
                            })
                          }
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition"
                        >
                          রিমুভ
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      কম্পিউটার বা মোবাইল থেকে আপলোড করতে বামের গোল ছবিতে ক্লিক করুন অথবা সরাসরি লিংক পেস্ট করুন।
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Staff Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDashboard.assignedStaff.name}
                    onChange={e =>
                      setEditingDashboard({
                        ...editingDashboard,
                        assignedStaff: { ...editingDashboard.assignedStaff, name: e.target.value }
                      })
                    }
                    className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={editingDashboard.assignedStaff.phone}
                      onChange={e =>
                        setEditingDashboard({
                          ...editingDashboard,
                          assignedStaff: { ...editingDashboard.assignedStaff, phone: e.target.value }
                        })
                      }
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Staff Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={editingDashboard.assignedStaff.email}
                      onChange={e =>
                        setEditingDashboard({
                          ...editingDashboard,
                          assignedStaff: { ...editingDashboard.assignedStaff, email: e.target.value }
                        })
                      }
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1 flex items-center justify-between">
                    <span>Access Password</span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-primary hover:underline text-[11px] font-bold flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showPassword ? "Hide" : "Show Password"}
                    </button>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={editingDashboard.assignedStaff.password}
                    onChange={e =>
                      setEditingDashboard({
                        ...editingDashboard,
                        assignedStaff: { ...editingDashboard.assignedStaff, password: e.target.value }
                      })
                    }
                    className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Staff can log in directly using this email/phone and password.
                  </p>
                </div>
              </div>

              {/* Department Notes */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Admin Notes & Guidelines
                </label>
                <textarea
                  rows={2}
                  value={editingDashboard.notes || ""}
                  onChange={e =>
                    setEditingDashboard({ ...editingDashboard, notes: e.target.value })
                  }
                  className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="Guidelines and targets for this desk..."
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${editingDashboard.title} (${editingDashboard.code}) from Staff Desks?`)) {
                      handleDeleteDashboard(editingDashboard.id);
                    }
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-300 rounded-xl transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Desk
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDashboard(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-xs transition flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        Successfully saved!
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-charcoal">
              Delete Desk from Staff Desks?
            </h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Are you sure you want to delete this desk (
              <span className="font-bold text-charcoal font-mono">
                {dashboards.find(d => d.id === deleteConfirmId)?.code || deleteConfirmId}
              </span>
              )? This will remove it from the staff desks roster. You can restore default desks anytime with the &quot;Default Restore&quot; button.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDashboard(deleteConfirmId)}
                disabled={saving}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {saving ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Staff Desk Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-charcoal">
                    নতুন স্টাফ / অপারেশনাল ডেস্ক যোগ করুন
                  </h3>
                  <p className="text-xs text-gray-500">
                    যে ডিপার্টমেন্ট নির্বাচন করবেন, নতুন স্টাফ স্বয়ংক্রিয়ভাবে সেই ডিপার্টমেন্টের সম্পূর্ণ ফিচার ও সিস্টেম পাবে।
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreatedStaffResult(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {createdStaffResult ? (
              <div className="space-y-4 py-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-black text-emerald-900">
                    সফলভাবে নতুন স্টাফ ও ডেস্ক সক্রিয় করা হয়েছে!
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    ডেস্ক কোড: <strong className="font-mono">{createdStaffResult.code}</strong> ({createdStaffResult.title})
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex justify-between items-center">
                    <span>স্টাফ লগইন তথ্য (Staff Login Credentials):</span>
                    <span className="uppercase text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                      Active Desk
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">স্টাফের নাম:</span>
                      <strong>{createdStaffResult.assignedStaff?.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ডিপার্টমেন্ট:</span>
                      <strong className="capitalize">{createdStaffResult.department}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">লগইন ইমেইল / ইউজার:</span>
                      <strong className="font-mono text-primary">{createdStaffResult.assignedStaff?.email}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">পাসওয়ার্ড:</span>
                      <strong className="font-mono">{createdStaffResult.assignedStaff?.password}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 block text-[10px] mb-1">স্টাফ সরাসরি ডিরেক্ট পোর্টাল লিংক:</span>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                      <span className="font-mono text-[11px] text-slate-600 truncate flex-1">
                        {`${window.location.origin}/portal/${createdStaffResult.id}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(createdStaffResult.id)}
                        className="text-xs text-primary font-bold hover:underline shrink-0 flex items-center gap-1"
                      >
                        {copiedId === createdStaffResult.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedStaffResult(null);
                      handleOpenCreateModal(newStaffDept);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                  >
                    + আরও স্টাফ যোগ করুন
                  </button>
                  <Link
                    to={`/admin/role-dashboards/${createdStaffResult.id}`}
                    className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>ডেস্কে প্রবেশ করুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateStaff} className="space-y-4">
                {/* 1. Department Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    ১. ডিপার্টমেন্ট নির্বাচন করুন (Select Department) *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { key: "support", name: "CS / সাপোর্ট", icon: Headphones, color: "border-sky-500 bg-sky-50 text-sky-800", active: "ring-2 ring-sky-500 bg-sky-50" },
                      { key: "sales", name: "Sales / সেলস", icon: Briefcase, color: "border-rose-500 bg-rose-50 text-rose-800", active: "ring-2 ring-rose-500 bg-rose-50" },
                      { key: "delivery", name: "Delivery / লজিস্টিকস", icon: Truck, color: "border-emerald-500 bg-emerald-50 text-emerald-800", active: "ring-2 ring-emerald-500 bg-emerald-50" },
                      { key: "accounts", name: "Accounts / একাউন্টস", icon: DollarSign, color: "border-indigo-500 bg-indigo-50 text-indigo-800", active: "ring-2 ring-indigo-500 bg-indigo-50" },
                      { key: "purchase", name: "Purchase / পার্সেজ", icon: ShoppingBag, color: "border-purple-500 bg-purple-50 text-purple-800", active: "ring-2 ring-purple-500 bg-purple-50" },
                    ].map(d => {
                      const Icon = d.icon;
                      const isSelected = newStaffDept === d.key;
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => handleDeptChange(d.key as DashboardDepartment)}
                          className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                            isSelected
                              ? `${d.color} ${d.active} font-bold shadow-xs`
                              : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                          }`}
                        >
                          <Icon className="w-5 h-5 mb-0.5" />
                          <span className="text-[11px] leading-tight">{d.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Department System Description Note */}
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">এই ডিপার্টমেন্টের সুবিধা: </strong>
                      {newStaffDept === "support" && "কাস্টমার সাপোর্ট টিকেট, লাইভ অর্ডার ট্র্যাকিং, কমপ্লেন ও রিফান্ড ম্যানেজমেন্টের সম্পূর্ণ সিস্টেম।"}
                      {newStaffDept === "sales" && "বি২বি সেলস কোটেশন, হোলসেল নেগোসিয়েশন, বালক ডিসকাউন্ট ও কাস্টমার ব্র্যাকেট সিস্টেম।"}
                      {newStaffDept === "delivery" && "চায়না হাব স্ক্যানিং, বাংলাদেশ হাব প্যাকেজিং, স্টেডফাস্ট/পাঠাও কুরিয়ার বুকিং ও কনসাইনমেন্ট ট্র্যাকিং।"}
                      {newStaffDept === "accounts" && "ইনভয়েস রিসিভড, ডেলিভারি ও পেন্ডিং ট্র্যাকিং, পেন্ডিং বিলম্ব নোট, লেজার অডিট ও কুরিয়ার রিপোর্ট সিস্টেম।"}
                      {newStaffDept === "purchase" && "১৬৮৮ অর্ডার আইডি ট্র্যাকিং, চায়না সাপ্লায়ার কুরিয়ার বিল ও কিউসি ইন্সপেকশন সিস্টেম।"}
                    </div>
                  </div>
                </div>

                {/* 2. Employee Photo */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative shrink-0">
                    <StaffAvatar
                      name={newStaffName || "New Staff"}
                      avatar={newStaffPhoto}
                      size="lg"
                      editable={true}
                      onPhotoChange={(newPhoto) => setNewStaffPhoto(newPhoto)}
                    />
                    <span className="block text-[9px] text-center text-slate-500 mt-1 font-semibold">
                      ছবি আপলোড
                    </span>
                  </div>
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-gray-800 block">
                      কর্মকর্তার ছবি (Profile Photo)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="ছবির সরাসরি লিংক (URL) লিখুন..."
                        value={newStaffPhoto.startsWith("data:") ? "" : newStaffPhoto}
                        onChange={(e) => setNewStaffPhoto(e.target.value)}
                        className="flex-1 text-xs border border-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary font-mono"
                      />
                      {newStaffPhoto && (
                        <button
                          type="button"
                          onClick={() => setNewStaffPhoto("")}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition"
                        >
                          মুছুন
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Staff Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      স্টাফের নাম (Staff Full Name) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: Tanvir Ahmed"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ডেস্ক টাইটেল (Desk Designation / Title)
                    </label>
                    <input
                      type="text"
                      placeholder="Desk Title..."
                      value={newStaffTitle}
                      onChange={(e) => setNewStaffTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      লগইন ইমেইল (Staff Login Email) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="staff@worldbuybd.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      মোবাইল নম্বর (Phone Number)
                    </label>
                    <input
                      type="text"
                      placeholder="017XXXXXXXX"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      পাসওয়ার্ড (Access Password) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Password..."
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      বাংলা পদবী (Bangla Title)
                    </label>
                    <input
                      type="text"
                      placeholder="ডেস্ক বাংলা নাম..."
                      value={newStaffBanglaTitle}
                      onChange={(e) => setNewStaffBanglaTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কাজের বিবরণ বা নির্দেশনা নোট (Notes / Instructions)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="এই স্টাফের কাজের দায়িত্ব, নির্দেশ বা স্পেশালাইজেশন..."
                    value={newStaffNotes}
                    onChange={(e) => setNewStaffNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingStaff}
                    className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {creatingStaff ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        তৈরি হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        ডেস্ক তৈরি ও সক্রিয় করুন
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
