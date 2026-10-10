import React, { useState, useMemo } from "react";
import {
  Users,
  Landmark,
  Crown,
  ShoppingBag,
  FileText,
  CheckCircle2,
  Search,
  Plus,
  Eye,
  Printer,
  Check,
  X,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Truck,
  Boxes,
  DollarSign,
  Award,
  UserCheck,
  Calendar,
  CreditCard,
  Smartphone,
  Building2,
  AlertCircle,
  KeyRound,
  EyeOff,
  Copy,
  MessageSquare
} from "lucide-react";
import UnifiedOrderModal from "./UnifiedOrderModal";

export type SubNavTab =
  | "client"
  | "bank_payment"
  | "valuable_clients"
  | "all_orders"
  | "my_orders"
  | "bd_warehouse_invoice"
  | "delivered_invoice";

interface AdminTopNavSubViewsProps {
  activeSubNav: SubNavTab;
  orders: any[];
  customers: any[];
  invoices: any[];
  employees: any[];
  currentRole: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => Promise<void>;
  onUpdateOrder: (orderId: string, payload: any) => Promise<void>;
}

export default function AdminTopNavSubViews({
  activeSubNav,
  orders,
  customers,
  invoices,
  employees,
  currentRole,
  searchQuery,
  onSearchChange,
  onRefresh,
  onUpdateOrder
}: AdminTopNavSubViewsProps) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);
  const [showClientModalPass, setShowClientModalPass] = useState(true);
  const [copiedClientModalPass, setCopiedClientModalPass] = useState(false);

  const handleCopyClientPassword = (pwd: string, clientId: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedClientId(clientId);
    setTimeout(() => setCopiedClientId(null), 2500);
  };

  // Bank Payment filters & modal
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentVerifyFilter, setPaymentVerifyFilter] = useState("all");
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    orderId: orders[0]?.id || "WBBD-10026",
    method: "bank",
    bankName: "South East Bank PLC",
    senderNumber: "",
    transactionId: "",
    amount: 15000,
    notes: "Bank deposit slip verified"
  });

  // My Orders employee selector
  const marketingAndStaff = useMemo(
    () => employees.filter(e => e.role === "Marketing" || e.role === "CS" || e.role === "Admin"),
    [employees]
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string>("emp-mkt-1");

  // BD Warehouse Receiving Invoice Quick Editor Modal
  const [editingWarehouseOrder, setEditingWarehouseOrder] = useState<any | null>(null);
  const [whInvoiceForm, setWhInvoiceForm] = useState({
    packageInfo: "1 Master Carton (6.5 KG)",
    receivedQty: 20,
    damageMissingInfo: "0 missing, 0 damaged",
    productTotal: 25000,
    shippingCharge: 3200,
    otherCharges: 300,
    discount: 0,
    collectedAmount: 18000,
    paymentStatus: "Partial Paid",
    notes: "Received in BD Warehouse & Invoice Ready"
  });

  // Delivered Invoice date filter
  const [deliveredDateFilter, setDeliveredDateFilter] = useState("");

  // Filtered Clients
  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customers.filter(c => {
      if (!q) return true;
      return (
        String(c.name || "").toLowerCase().includes(q) ||
        String(c.phone || "").toLowerCase().includes(q) ||
        String(c.email || "").toLowerCase().includes(q) ||
        String(c.id || "").toLowerCase().includes(q) ||
        String(c.assignedMarketingName || "").toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery]);

  // Valuable Clients (Sorted by Total Spend Descending)
  const valuableClients = useMemo(() => {
    return [...filteredClients]
      .sort((a, b) => (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0))
      .map((c, index) => {
        const spent = Number(c.totalSpent) || 0;
        const tier =
          spent >= 40000
            ? { name: "Platinum VIP", badge: "bg-purple-100 text-purple-900 border-purple-300" }
            : spent >= 25000
            ? { name: "Gold Client", badge: "bg-amber-100 text-amber-900 border-amber-300" }
            : { name: "Silver Valued", badge: "bg-sky-100 text-sky-900 border-sky-300" };
        return { ...c, rank: index + 1, tier };
      });
  }, [filteredClients]);

  // Assign Customer to Marketing Employee
  const handleAssignClientMarketing = async (client: any, empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    await fetch(`/api/admin/customers/${client.id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: client.phone,
        assignedMarketingId: emp.id,
        assignedMarketingName: emp.name
      })
    });
    await onRefresh();
  };

  // Add / Record Bank Payment
  const handleRecordBankPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrder = orders.find(o => String(o.id).toLowerCase() === bankForm.orderId.trim().toLowerCase());
    if (!targetOrder) return;

    const currentCollected = Number(targetOrder.invoice?.collectedAmount || 0) + Number(bankForm.amount || 0);
    const totalOrd = Number(targetOrder.invoice?.totalAmount || targetOrder.total || 0);
    const nextPayStatus = currentCollected >= totalOrd ? "Paid" : "Partial Paid";

    await onUpdateOrder(targetOrder.id, {
      paymentStatus: nextPayStatus,
      timelineNote: `Bank/MFS Payment recorded: BDT ${Number(bankForm.amount).toLocaleString()} via ${bankForm.method.toUpperCase()} (TrxID: ${bankForm.transactionId || "N/A"})`,
      invoice: {
        ...(targetOrder.invoice || {}),
        invoiceNumber: targetOrder.invoice?.invoiceNumber || `INV-${targetOrder.id}`,
        orderId: targetOrder.id,
        customerName: targetOrder.customerInfo?.name || "Customer",
        phone: targetOrder.customerInfo?.phone || "",
        totalAmount: totalOrd,
        collectedAmount: currentCollected,
        dueAmount: Math.max(0, totalOrd - currentCollected),
        paymentStatus: nextPayStatus
      }
    });

    await fetch(`/api/orders/${targetOrder.id}/verify-payment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: nextPayStatus })
    }).catch(() => {});

    setShowAddBankModal(false);
    await onRefresh();
  };

  // Open BD Warehouse Receiving Invoice Editor
  const openWhInvoiceEditor = (ord: any) => {
    setEditingWarehouseOrder(ord);
    setWhInvoiceForm({
      packageInfo: ord.bdWarehouseInfo?.packageInfo || "1 Master Carton (5.5 KG)",
      receivedQty: ord.bdWarehouseInfo?.receivedQty || ord.totalQuantity || 20,
      damageMissingInfo: ord.bdWarehouseInfo?.damageMissingInfo || "None (0 damaged)",
      productTotal: ord.invoice?.productTotal ?? ord.total ?? 0,
      shippingCharge: ord.invoice?.shippingCharge ?? 2500,
      otherCharges: ord.invoice?.otherCharges ?? 0,
      discount: ord.invoice?.discount ?? 0,
      collectedAmount: ord.invoice?.collectedAmount ?? (ord.paymentStatus === "Paid" ? ord.total : 0),
      paymentStatus: ord.invoice?.paymentStatus || ord.paymentStatus || "Pending",
      notes: ord.bdWarehouseInfo?.notes || "Received at BD Warehouse & Receiving Invoice Generated"
    });
  };

  const handleSaveWhReceivingInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouseOrder) return;
    const totalAmt =
      Number(whInvoiceForm.productTotal || 0) +
      Number(whInvoiceForm.shippingCharge || 0) +
      Number(whInvoiceForm.otherCharges || 0) -
      Number(whInvoiceForm.discount || 0);
    const dueAmt = Math.max(0, totalAmt - Number(whInvoiceForm.collectedAmount || 0));

    await onUpdateOrder(editingWarehouseOrder.id, {
      status: "Ready for Delivery",
      paymentStatus: whInvoiceForm.paymentStatus,
      timelineNote: `BD Warehouse Receiving Invoice INV-${editingWarehouseOrder.id} generated (${whInvoiceForm.packageInfo}). Marked Ready for Delivery.`,
      bdWarehouseInfo: {
        ...(editingWarehouseOrder.bdWarehouseInfo || {}),
        received: true,
        receivedAt: editingWarehouseOrder.bdWarehouseInfo?.receivedAt || new Date().toISOString(),
        receivedQty: Number(whInvoiceForm.receivedQty),
        packageInfo: whInvoiceForm.packageInfo,
        damageMissingInfo: whInvoiceForm.damageMissingInfo,
        notes: whInvoiceForm.notes
      },
      invoice: {
        invoiceNumber: editingWarehouseOrder.invoice?.invoiceNumber || `INV-${editingWarehouseOrder.id}`,
        orderId: editingWarehouseOrder.id,
        invoiceDate: new Date().toISOString().slice(0, 10),
        customerName: editingWarehouseOrder.customerInfo?.name || "Customer",
        phone: editingWarehouseOrder.customerInfo?.phone || "",
        email: editingWarehouseOrder.customerInfo?.email || "",
        address: editingWarehouseOrder.customerInfo?.address || "",
        productTotal: Number(whInvoiceForm.productTotal),
        shippingCharge: Number(whInvoiceForm.shippingCharge),
        otherCharges: Number(whInvoiceForm.otherCharges),
        discount: Number(whInvoiceForm.discount),
        totalAmount: totalAmt,
        collectedAmount: Number(whInvoiceForm.collectedAmount),
        dueAmount: dueAmt,
        paymentStatus: whInvoiceForm.paymentStatus,
        deliveryStatus: "Ready for Delivery"
      }
    });
    setEditingWarehouseOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* 1. CLIENT DIRECTORY & ASSIGNED ACCOUNTS VIEW ("client")             */}
      {/* =================================================================== */}
      {activeSubNav === "client" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-bold text-charcoal">
                  Client Directory & Marketing Account Assignment ({filteredClients.length} Clients)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                View complete client profiles, phone numbers, order counts, lifetime spend, and assign clients to Marketing executives.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                Total Registered Clients: {customers.length}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                    <th className="py-3.5 px-4 font-bold">Client ID & Name</th>
                    <th className="py-3.5 px-4 font-bold">Phone & Email</th>
                    <th className="py-3.5 px-4 font-bold">Login Password</th>
                    <th className="py-3.5 px-4 font-bold">Delivery Address</th>
                    <th className="py-3.5 px-4 font-bold">Total Orders</th>
                    <th className="py-3.5 px-4 font-bold">Total Order Value</th>
                    <th className="py-3.5 px-4 font-bold">Assigned Marketing KAM</th>
                    <th className="py-3.5 px-4 font-bold text-right">Client Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold text-red-600 block">{client.id}</span>
                        <span className="font-bold text-charcoal text-sm">{client.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-charcoal flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {client.phone || "N/A"}
                        </div>
                        <div className="text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {client.email || "No email"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/80 w-fit">
                          <KeyRound className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {revealedPasswords[client.id] ? (client.password || client.lastLoginPassword || "123456") : "••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRevealedPasswords(prev => ({ ...prev, [client.id]: !prev[client.id] }))}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            title={revealedPasswords[client.id] ? "Hide password" : "Show password"}
                          >
                            {revealedPasswords[client.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyClientPassword(client.password || client.lastLoginPassword || "123456", client.id)}
                            className="p-1 text-slate-400 hover:text-emerald-700 cursor-pointer"
                            title="Copy password"
                          >
                            {copiedClientId === client.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-gray-600">
                        {client.address || "Dhaka, Bangladesh"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
                          {(client.orders || []).length} Orders
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                        BDT {(client.totalSpent || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={client.assignedMarketingId || ""}
                          onChange={e => handleAssignClientMarketing(client, e.target.value)}
                          className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white text-charcoal cursor-pointer"
                        >
                          {employees
                            .filter(e => e.role === "Marketing" || e.role === "Admin")
                            .map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedClient(client)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Client Profile & Orders
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. BANK PAYMENT & MFS VERIFICATION LEDGER ("bank_payment")          */}
      {/* =================================================================== */}
      {activeSubNav === "bank_payment" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-bold text-charcoal">
                  Bank Payment, Deposit Slip & MFS Verification System
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Verify Bank Deposits, bKash, Nagad & Rocket transactions and automatically sync collected balance with Accounts & Orders.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={paymentMethodFilter}
                onChange={e => setPaymentMethodFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold bg-white"
              >
                <option value="all">All Channels (Bank / bKash / Nagad)</option>
                <option value="bank">Bank Deposit / Transfer</option>
                <option value="bkash">bKash Payment</option>
                <option value="nagad">Nagad Payment</option>
              </select>
              <select
                value={paymentVerifyFilter}
                onChange={e => setPaymentVerifyFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold bg-white"
              >
                <option value="all">All Payment Statuses</option>
                <option value="Paid">Verified / Paid</option>
                <option value="Partial Paid">Partial Paid</option>
                <option value="Pending">Pending Verification</option>
              </select>
              <button
                onClick={() => setShowAddBankModal(true)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + Record Bank / MFS Deposit
              </button>
            </div>
          </div>

          {/* Bank Payment KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-500 font-bold">Total Order Invoice Value</span>
              <div className="text-xl font-black text-charcoal mt-1">
                BDT {orders.reduce((s, o) => s + (Number(o.total) || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-700 font-bold">Total Verified / Collected</span>
              <div className="text-xl font-black text-emerald-900 mt-1">
                BDT{" "}
                {orders
                  .reduce(
                    (s, o) =>
                      s +
                      (Number(
                        o.invoice?.collectedAmount ??
                          (o.paymentStatus === "Paid" ? o.total : 0)
                      ) || 0),
                    0
                  )
                  .toLocaleString()}
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <span className="text-xs text-amber-700 font-bold">Pending / Partial Payments</span>
              <div className="text-xl font-black text-amber-900 mt-1">
                {orders.filter(o => o.paymentStatus !== "Paid").length} Orders
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <span className="text-xs text-blue-700 font-bold">Bank Deposit Orders</span>
              <div className="text-xl font-black text-blue-900 mt-1">
                {orders.filter(o => (o.paymentInfo?.method || o.customerInfo?.payment) === "bank").length} Transfers
              </div>
            </div>
          </div>

          {/* Bank & Payment Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                    <th className="py-3.5 px-4 font-bold">Order ID & Date</th>
                    <th className="py-3.5 px-4 font-bold">Client Name & Phone</th>
                    <th className="py-3.5 px-4 font-bold">Payment Channel</th>
                    <th className="py-3.5 px-4 font-bold">Sender / Account & TrxID</th>
                    <th className="py-3.5 px-4 font-bold">Order Total</th>
                    <th className="py-3.5 px-4 font-bold">Collected / Due</th>
                    <th className="py-3.5 px-4 font-bold">Payment Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Verify / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders
                    .filter(o => {
                      const method = (o.paymentInfo?.method || o.customerInfo?.payment || "bkash").toLowerCase();
                      const matchMethod = paymentMethodFilter === "all" || method === paymentMethodFilter;
                      const matchStatus =
                        paymentVerifyFilter === "all" ||
                        (paymentVerifyFilter === "Pending"
                          ? o.paymentStatus !== "Paid" && o.paymentStatus !== "Partial Paid"
                          : o.paymentStatus === paymentVerifyFilter);
                      const q = searchQuery.trim().toLowerCase();
                      const matchQ =
                        !q ||
                        String(o.id).toLowerCase().includes(q) ||
                        String(o.customerInfo?.name || "").toLowerCase().includes(q) ||
                        String(o.customerInfo?.phone || "").toLowerCase().includes(q) ||
                        String(o.paymentInfo?.transactionId || "").toLowerCase().includes(q);
                      return matchMethod && matchStatus && matchQ;
                    })
                    .map(ord => {
                      const method = (ord.paymentInfo?.method || ord.customerInfo?.payment || "bkash").toUpperCase();
                      const collected = Number(
                        ord.invoice?.collectedAmount ?? (ord.paymentStatus === "Paid" ? ord.total : 0)
                      );
                      const due = Math.max(0, Number(ord.total || 0) - collected);
                      return (
                        <tr key={ord.id} className="hover:bg-gray-50/80 transition">
                          <td className="py-3.5 px-4">
                            <span
                              onClick={() => setSelectedOrder(ord)}
                              className="font-mono font-black text-red-600 cursor-pointer hover:underline block"
                            >
                              {ord.id}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {new Date(ord.date).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-charcoal">{ord.customerInfo?.name}</div>
                            <div className="font-mono text-gray-500">{ord.customerInfo?.phone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-md font-bold text-[11px] inline-flex items-center gap-1 ${
                                method === "BANK"
                                  ? "bg-blue-100 text-blue-800"
                                  : method === "BKASH"
                                  ? "bg-pink-100 text-pink-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {method === "BANK" ? <Building2 className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                              {method}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-charcoal">
                              TrxID: {ord.paymentInfo?.transactionId || "SLIP-VERIFIED"}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              From: {ord.paymentInfo?.senderNumber || ord.customerInfo?.phone}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-charcoal">
                            BDT {(ord.total || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-emerald-700">Paid: BDT {collected.toLocaleString()}</div>
                            {due > 0 && <div className="text-[11px] font-bold text-red-600">Due: BDT {due.toLocaleString()}</div>}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                ord.paymentStatus === "Paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : ord.paymentStatus === "Partial Paid"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {ord.paymentStatus || "Pending"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            {ord.paymentStatus !== "Paid" && (
                              <button
                                onClick={() =>
                                  onUpdateOrder(ord.id, {
                                    paymentStatus: "Paid",
                                    timelineNote: "Bank/MFS Payment verified & approved as Paid",
                                    invoice: {
                                      ...(ord.invoice || {}),
                                      invoiceNumber: ord.invoice?.invoiceNumber || `INV-${ord.id}`,
                                      orderId: ord.id,
                                      totalAmount: ord.total,
                                      collectedAmount: ord.total,
                                      dueAmount: 0,
                                      paymentStatus: "Paid"
                                    }
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                              >
                                ✓ Approve Paid
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-charcoal font-semibold text-xs cursor-pointer"
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
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. VALUABLE CLIENTS VIP LEADERBOARD ("valuable_clients")            */}
      {/* =================================================================== */}
      {activeSubNav === "valuable_clients" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-50 via-white to-red-50 rounded-2xl p-5 border border-amber-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-charcoal">
                  Valuable Clients — VIP Importers & High-Volume Buyers Leaderboard
                </h2>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Automatically ranked by lifetime order volume, total purchase value, and repeat orders for priority KAM retention.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {valuableClients.slice(0, 3).map(vip => (
              <div
                key={vip.id}
                className="bg-white rounded-2xl p-5 border-2 border-amber-300/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-900">
                      #{vip.rank} Top Client
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${vip.tier.badge}`}>
                      ★ {vip.tier.name}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-charcoal mt-3">{vip.name}</h3>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">{vip.phone}</p>
                  <p className="text-xs text-gray-500">{vip.address}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Lifetime Spend</span>
                    <span className="text-lg font-black text-emerald-700">
                      BDT {(vip.totalSpent || 0).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedClient(vip)}
                    className="px-3 py-1.5 rounded-xl bg-charcoal hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                  >
                    View Orders ({(vip.orders || []).length})
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                  <th className="py-3.5 px-4 font-bold">Rank</th>
                  <th className="py-3.5 px-4 font-bold">Valuable Client</th>
                  <th className="py-3.5 px-4 font-bold">VIP Loyalty Tier</th>
                  <th className="py-3.5 px-4 font-bold">Total Orders</th>
                  <th className="py-3.5 px-4 font-bold">Total Order Value</th>
                  <th className="py-3.5 px-4 font-bold">Assigned KAM</th>
                  <th className="py-3.5 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {valuableClients.map(c => (
                  <tr key={c.id} className="hover:bg-amber-50/30 transition">
                    <td className="py-3.5 px-4 font-black text-amber-700">#{c.rank}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-charcoal">{c.name}</div>
                      <div className="font-mono text-gray-500">{c.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.tier.badge}`}>
                        {c.tier.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">{(c.orders || []).length} Orders</td>
                    <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                      BDT {(c.totalSpent || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700">
                      {c.assignedMarketingName || "Radowan Ahmed (Marketing)"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedClient(c)}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
                      >
                        View VIP History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. MY ORDERS — ASSIGNED EXECUTIVE ORDERS ("my_orders")              */}
      {/* =================================================================== */}
      {activeSubNav === "my_orders" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-bold text-charcoal">
                  My Orders — Assigned Executive & Account Orders Queue
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Track and manage orders assigned specifically to your Marketing / CS / Admin account.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600">Viewing Account Queue:</span>
              <select
                value={selectedStaffId}
                onChange={e => setSelectedStaffId(e.target.value)}
                className="border border-red-400 rounded-xl px-3 py-2 text-xs font-bold bg-white text-charcoal cursor-pointer"
              >
                <option value="all">All Assigned Staff Orders ({orders.length})</option>
                {marketingAndStaff.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                  <th className="py-3.5 px-4 font-bold">Order ID & Date</th>
                  <th className="py-3.5 px-4 font-bold">Assigned Client</th>
                  <th className="py-3.5 px-4 font-bold">Products & Qty</th>
                  <th className="py-3.5 px-4 font-bold">Assigned Executive</th>
                  <th className="py-3.5 px-4 font-bold">Order Amount</th>
                  <th className="py-3.5 px-4 font-bold">Current Stage</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders
                  .filter(o => {
                    const matchStaff =
                      selectedStaffId === "all" || o.assignedMarketingId === selectedStaffId;
                    const q = searchQuery.trim().toLowerCase();
                    const matchQ =
                      !q ||
                      String(o.id).toLowerCase().includes(q) ||
                      String(o.customerInfo?.name || "").toLowerCase().includes(q) ||
                      String(o.customerInfo?.phone || "").toLowerCase().includes(q);
                    return matchStaff && matchQ;
                  })
                  .map(ord => (
                    <tr key={ord.id} className="hover:bg-gray-50 transition">
                      <td className="py-3.5 px-4">
                        <span
                          onClick={() => setSelectedOrder(ord)}
                          className="font-mono font-black text-red-600 cursor-pointer hover:underline block"
                        >
                          {ord.id}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(ord.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-charcoal">{ord.customerInfo?.name}</div>
                        <div className="font-mono text-gray-500">{ord.customerInfo?.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-charcoal max-w-xs truncate">
                          {ord.items?.[0]?.name || "Imported Product"}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Total Qty: <strong>{ord.totalQuantity || 1} pcs</strong>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                          {ord.assignedMarketingName || "Radowan Ahmed (Marketing)"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-charcoal">
                        BDT {(ord.total || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-bold text-[11px]">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Open Timeline
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. BD WAREHOUSE RECEIVING INVOICE ("bd_warehouse_invoice")          */}
      {/* =================================================================== */}
      {activeSubNav === "bd_warehouse_invoice" && (
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-teal-700" />
                <h2 className="text-lg font-bold text-teal-950">
                  BD Warehouse Receiving Invoice & Dispatch Preparation System
                </h2>
              </div>
              <p className="text-xs text-teal-800 mt-0.5">
                Manage orders received in Bangladesh Warehouse, verify package weight/cartons, generate Receiving Invoices, and mark Ready for Delivery.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                    <th className="py-3.5 px-4 font-bold">Order ID & Invoice</th>
                    <th className="py-3.5 px-4 font-bold">Client Details</th>
                    <th className="py-3.5 px-4 font-bold">BD Warehouse Package Info</th>
                    <th className="py-3.5 px-4 font-bold">Received / Damage Info</th>
                    <th className="py-3.5 px-4 font-bold">Receiving Invoice Total</th>
                    <th className="py-3.5 px-4 font-bold">Current Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Receiving Invoice Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders
                    .filter(o => {
                      const q = searchQuery.trim().toLowerCase();
                      return (
                        !q ||
                        String(o.id).toLowerCase().includes(q) ||
                        String(o.customerInfo?.name || "").toLowerCase().includes(q) ||
                        String(o.customerInfo?.phone || "").toLowerCase().includes(q)
                      );
                    })
                    .map(ord => {
                      const hasInv = !!ord.invoice?.invoiceNumber;
                      return (
                        <tr key={ord.id} className="hover:bg-teal-50/30 transition">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-black text-teal-800 block">{ord.id}</span>
                            <span className="font-mono text-[11px] text-emerald-700 font-bold">
                              {ord.invoice?.invoiceNumber || `INV-${ord.id} (Pending)`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-charcoal">{ord.customerInfo?.name}</div>
                            <div className="font-mono text-gray-500">{ord.customerInfo?.phone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-charcoal">
                              {ord.bdWarehouseInfo?.packageInfo || "1 Standard Carton"}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Received Date:{" "}
                              {ord.bdWarehouseInfo?.receivedAt
                                ? new Date(ord.bdWarehouseInfo.receivedAt).toLocaleDateString()
                                : "Awaiting Check-In"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-emerald-700">
                              Received Qty: {ord.bdWarehouseInfo?.receivedQty || ord.totalQuantity || 1} pcs
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {ord.bdWarehouseInfo?.damageMissingInfo || "0 damaged"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-black text-charcoal">
                              BDT {(ord.invoice?.totalAmount ?? ord.total ?? 0).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Shipping: BDT {(ord.invoice?.shippingCharge ?? 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                hasInv
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => openWhInvoiceEditor(ord)}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer"
                            >
                              {hasInv ? "Edit Receiving Invoice" : "+ Generate Receiving Invoice"}
                            </button>
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-charcoal font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print
                            </button>
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

      {/* =================================================================== */}
      {/* 6. DELIVERED INVOICE ARCHIVE & SETTLEMENT ("delivered_invoice")     */}
      {/* =================================================================== */}
      {activeSubNav === "delivered_invoice" && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-emerald-950">
                  Delivered Invoices & Final Delivery Completion Ledger
                </h2>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Complete archive of delivered orders, final settled invoices, courier tracking records, delivery dates/times, and collected payments.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={deliveredDateFilter}
                onChange={e => setDeliveredDateFilter(e.target.value)}
                className="border border-emerald-300 rounded-xl px-3 py-2 text-xs bg-white font-bold"
              />
              {deliveredDateFilter && (
                <button
                  onClick={() => setDeliveredDateFilter("")}
                  className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 cursor-pointer"
                >
                  All Dates
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase">
                    <th className="py-3.5 px-4 font-bold">Delivered Invoice No</th>
                    <th className="py-3.5 px-4 font-bold">Order ID</th>
                    <th className="py-3.5 px-4 font-bold">Client Name & Phone</th>
                    <th className="py-3.5 px-4 font-bold">Courier & Tracking</th>
                    <th className="py-3.5 px-4 font-bold">Delivered Date & Time</th>
                    <th className="py-3.5 px-4 font-bold">Invoice Total / Collected</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Print / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders
                    .filter(o => {
                      const q = searchQuery.trim().toLowerCase();
                      const matchQ =
                        !q ||
                        String(o.id).toLowerCase().includes(q) ||
                        String(o.invoice?.invoiceNumber || "").toLowerCase().includes(q) ||
                        String(o.customerInfo?.name || "").toLowerCase().includes(q) ||
                        String(o.customerInfo?.phone || "").toLowerCase().includes(q);
                      const matchDate =
                        !deliveredDateFilter ||
                        (o.deliveryInfo?.deliveredAt || o.invoice?.invoiceDate || o.date || "").slice(0, 10) ===
                          deliveredDateFilter;
                      return matchQ && matchDate;
                    })
                    .map(ord => {
                      const isDelivered = ord.status === "Delivered";
                      const invNo = ord.invoice?.invoiceNumber || `INV-${ord.id}`;
                      const totalAmt = Number(ord.invoice?.totalAmount ?? ord.total ?? 0);
                      const collectedAmt = Number(
                        ord.invoice?.collectedAmount ?? (ord.paymentStatus === "Paid" ? totalAmt : 0)
                      );
                      return (
                        <tr key={ord.id} className="hover:bg-emerald-50/30 transition">
                          <td className="py-3.5 px-4 font-mono font-black text-emerald-700">
                            {invNo}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-charcoal">
                            {ord.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-charcoal">{ord.customerInfo?.name}</div>
                            <div className="font-mono text-gray-500">{ord.customerInfo?.phone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-charcoal">
                              {ord.deliveryInfo?.courierName || "Steadfast Courier"}
                            </div>
                            <div className="font-mono text-[11px] text-gray-500">
                              {ord.deliveryInfo?.trackingNumber || "SF-BD-TRACK"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-charcoal">
                              {ord.deliveryInfo?.deliveredAt || new Date(ord.date).toISOString().slice(0, 10)}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {ord.deliveryInfo?.deliveredTime || "04:15 PM"} • By{" "}
                              {ord.deliveryInfo?.deliveryEmployee || "Arifur Rahman"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-black text-charcoal">Total: BDT {totalAmt.toLocaleString()}</div>
                            <div className="font-bold text-emerald-700 text-[11px]">
                              Collected: BDT {collectedAmt.toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isDelivered
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            {!isDelivered && (
                              <button
                                onClick={() =>
                                  onUpdateOrder(ord.id, {
                                    status: "Delivered",
                                    paymentStatus: "Paid",
                                    timelineNote: "Marked Delivered with Final Delivered Invoice",
                                    deliveryInfo: {
                                      ...(ord.deliveryInfo || {}),
                                      status: "Delivered",
                                      deliveredAt: new Date().toISOString().slice(0, 10),
                                      deliveredTime: new Date().toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })
                                    }
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                              >
                                ✓ Mark Delivered
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Invoice & Print
                            </button>
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

      {/* =================================================================== */}
      {/* MODALS: CLIENT PROFILE, RECORD BANK DEPOSIT, BD WH INVOICE, ORDER   */}
      {/* =================================================================== */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-red-600">{selectedClient.id}</span>
                <h3 className="text-lg font-black text-charcoal">{selectedClient.name} — Complete Client History</h3>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-gray-50 p-4 rounded-xl">
              <div>
                <span className="text-gray-400 font-bold block">Phone Number</span>
                <span className="font-mono font-bold text-charcoal text-sm">{selectedClient.phone}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">Assigned Marketing KAM</span>
                <span className="font-bold text-emerald-700">{selectedClient.assignedMarketingName}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">Total Order Volume</span>
                <span className="font-black text-charcoal text-sm">
                  BDT {(selectedClient.totalSpent || 0).toLocaleString()} ({(selectedClient.orders || []).length} Orders)
                </span>
              </div>
            </div>

            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">
              All Orders Placed by {selectedClient.name}
            </h4>
            <div className="space-y-2">
              {orders
                .filter(
                  o =>
                    o.customerInfo?.phone === selectedClient.phone ||
                    o.customerInfo?.id === selectedClient.id
                )
                .map(ord => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-2 hover:bg-gray-50"
                  >
                    <div>
                      <span className="font-mono font-black text-red-600 text-sm">{ord.id}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(ord.date).toLocaleDateString()}
                      </span>
                      <div className="text-xs font-semibold text-charcoal mt-0.5">
                        {ord.items?.[0]?.name} ({ord.totalQuantity || 1} pcs)
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <div className="font-black text-charcoal">BDT {(ord.total || 0).toLocaleString()}</div>
                        <span className="text-[11px] text-emerald-700 font-bold">{ord.status}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedClient(null);
                          setSelectedOrder(ord);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-charcoal text-white text-xs font-bold cursor-pointer"
                      >
                        Inspect Order
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {showAddBankModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-charcoal">Record Bank / MFS Payment Deposit</h3>
              <button onClick={() => setShowAddBankModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRecordBankPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-600 block mb-1">Select Connected Order ID</label>
                <select
                  value={bankForm.orderId}
                  onChange={e => setBankForm({ ...bankForm, orderId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono font-bold bg-white"
                >
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.id} — {o.customerInfo?.name} (BDT {o.total?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Payment Channel</label>
                  <select
                    value={bankForm.method}
                    onChange={e => setBankForm({ ...bankForm, method: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="bank">Bank Deposit</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Deposit Amount (BDT)</label>
                  <input
                    type="number"
                    value={bankForm.amount}
                    onChange={e => setBankForm({ ...bankForm, amount: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-gray-600 block mb-1">Bank Slip / Transaction Reference ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DBBL-SLIP-994120 or BK992018X"
                  value={bankForm.transactionId}
                  onChange={e => setBankForm({ ...bankForm, transactionId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-gray-600 block mb-1">Sender Account / Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 01712345678 or A/C 104-22910"
                  value={bankForm.senderNumber}
                  onChange={e => setBankForm({ ...bankForm, senderNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
              >
                Verify & Sync Deposit with Order & Accounts
              </button>
            </form>
          </div>
        </div>
      )}

      {editingWarehouseOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-teal-700">
                  Order ID: {editingWarehouseOrder.id}
                </span>
                <h3 className="text-base font-bold text-charcoal">
                  BD Warehouse Receiving Invoice Generator
                </h3>
              </div>
              <button onClick={() => setEditingWarehouseOrder(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveWhReceivingInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Package / Weight Info</label>
                  <input
                    type="text"
                    value={whInvoiceForm.packageInfo}
                    onChange={e => setWhInvoiceForm({ ...whInvoiceForm, packageInfo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Received Quantity (pcs)</label>
                  <input
                    type="number"
                    value={whInvoiceForm.receivedQty}
                    onChange={e => setWhInvoiceForm({ ...whInvoiceForm, receivedQty: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Product Subtotal (BDT)</label>
                  <input
                    type="number"
                    value={whInvoiceForm.productTotal}
                    onChange={e => setWhInvoiceForm({ ...whInvoiceForm, productTotal: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Shipping / Weight Charge (BDT)</label>
                  <input
                    type="number"
                    value={whInvoiceForm.shippingCharge}
                    onChange={e => setWhInvoiceForm({ ...whInvoiceForm, shippingCharge: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Collected Amount (BDT)</label>
                  <input
                    type="number"
                    value={whInvoiceForm.collectedAmount}
                    onChange={e => setWhInvoiceForm({ ...whInvoiceForm, collectedAmount: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Payment Status</label>
                  <select
                    value={whInvoiceForm.paymentStatus}
                    onChange={e => setWhInvoiceForm({ ...whInvoiceForm, paymentStatus: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partial Paid">Partial Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
              >
                Save BD Warehouse Receiving Invoice & Mark Ready for Delivery
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <UnifiedOrderModal
          order={selectedOrder}
          currentRole={currentRole}
          isMarketingView={currentRole === "Marketing"}
          hideCustomerPassword={currentRole === "Marketing"}
          onClose={() => setSelectedOrder(null)}
          onUpdateOrder={onUpdateOrder}
        />
      )}
    </div>
  );
}
