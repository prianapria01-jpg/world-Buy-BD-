import React, { useState } from "react";
import {
  X,
  ExternalLink,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  FileText,
  Printer,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Banknote,
  Scale,
  RefreshCw,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Building2,
  Anchor,
  Boxes,
  DollarSign,
  ArrowDown,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Heart,
  ShoppingCart,
  MessageSquare,
  Lock
} from "lucide-react";
import CustomInvoiceView from "../invoice/CustomInvoiceView";
import { buildInvoiceFromOrder, downloadCustomInvoicePdf } from "../../utils/customInvoice";
import { enrichOrderWithSubOrders } from "../../utils/orderVariations";
import { getProductPath } from "../../utils/productUrl";
import CustomerPhoneSecureDisplay from "./CustomerPhoneSecureDisplay";
import { canViewCustomerPhone, getCurrentAdminUser } from "../../utils/customerPrivacy";
import { canAccessProductSourceLink } from "../../utils/productPrivacy";

export const ORDER_TIMELINE_STAGES = [
  "Order Placed",
  "Order Confirmed",
  "Purchased",
  "Stock Out",
  "Received in China Warehouse",
  "Shipped to Bangladesh",
  "Received in BD Customs",
  "Received in BD Warehouse",
  "Invoice Generated",
  "Ready for Delivery",
  "Assigned to Delivery",
  "Delivered"
];

interface UnifiedOrderModalProps {
  order: any;
  currentRole: string;
  initialSubTab?: "pipeline" | "timeline" | "invoice" | "stockout";
  isMarketingView?: boolean;
  hideCustomerPassword?: boolean;
  onClose: () => void;
  onUpdateOrder: (orderId: string, payload: any) => Promise<void>;
}

export default function UnifiedOrderModal({
  order,
  currentRole,
  initialSubTab = "pipeline",
  isMarketingView,
  hideCustomerPassword,
  onClose,
  onUpdateOrder
}: UnifiedOrderModalProps) {
  const safeOrder = enrichOrderWithSubOrders(order);
  const [activeSubTab, setActiveSubTab] = useState<"pipeline" | "timeline" | "invoice" | "stockout">(initialSubTab);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCustPassword, setShowCustPassword] = useState(false);
  const [copiedCustPassword, setCopiedCustPassword] = useState(false);
  const [activeCustItemTab, setActiveCustItemTab] = useState<"cart" | "wishlist">("cart");

  const isMarketingContext =
    Boolean(isMarketingView) ||
    Boolean(hideCustomerPassword) ||
    String(currentRole || "").toLowerCase() === "marketing" ||
    String(currentRole || "").toLowerCase() === "sales";

  const currentAdminUser = getCurrentAdminUser();
  const isMasterAdmin =
    Boolean(currentAdminUser.isMasterAdmin) ||
    String(currentRole || "").toLowerCase() === "admin" ||
    String(currentRole || "").toLowerCase() === "super_admin";
  const canViewPhone = canViewCustomerPhone({ order, viewerDepartment: currentRole, isMasterAdmin });
  const canAccessSourceLink = canAccessProductSourceLink({ viewerDepartment: currentRole, isMasterAdmin });

  // Invoice Editor state (for Delivery / Admin / Accounts)
  const existingInv = safeOrder.invoice || {};
  const canonicalOrderId = String(safeOrder.orderId || safeOrder.id || "");
  const initialBuilt = buildInvoiceFromOrder(safeOrder, existingInv);

  const [invForm, setInvForm] = useState({
    invoiceNumber: initialBuilt.invoiceNumber || `INV-${canonicalOrderId}`,
    invoiceDate: existingInv.invoiceDate || new Date().toISOString().slice(0, 10),
    order1688Id:
      initialBuilt.order1688Id ||
      order.order1688Id ||
      order.purchaseInfo?.order1688Id ||
      order.purchaseInfo?.orderSupplierId ||
      "",
    trackingNumber:
      initialBuilt.trackingNumber ||
      order.trackingNumber ||
      order.purchaseInfo?.trackingNumber ||
      order.chinaWarehouseInfo?.chinaAwb ||
      order.deliveryInfo?.trackingNumber ||
      "",
    productTotal: Number(initialBuilt.subTotal || 0),
    chinaCourierCharge: Number(initialBuilt.chinaCourier || 0),
    shippingCharge: Number(initialBuilt.shippingCharge || 0),
    weightKg: Number(initialBuilt.weightKg || 0),
    ratePerKg: Number(initialBuilt.shippingRatePerKg || 780),
    otherCharges: Number(existingInv.otherCharges || 0),
    discount: Number(initialBuilt.discount || 0),
    collectedAmount: Number(initialBuilt.paidAmount || Math.max(0, Number(initialBuilt.subTotal || 0) - Number(initialBuilt.discount || 0))),
    paymentMethod: initialBuilt.paymentMethod || "bKash / Nagad / Bank",
    paymentStatus: initialBuilt.paymentStatus || order.paymentStatus || "Partial Paid",
    notes: existingInv.notes || "Thank you for importing with World Buy BD.",
    deliveryNotes: order.deliveryInfo?.deliveryNotes || ""
  });

  const computedTotal =
    Math.max(0, Number(invForm.productTotal || 0) - Number(invForm.discount || 0)) +
    Number(invForm.chinaCourierCharge || 0) +
    Number(invForm.shippingCharge || 0) +
    Number(invForm.otherCharges || 0);
  const computedDue = Math.max(0, computedTotal - Number(invForm.collectedAmount || 0));

  const canManageInvoice = currentRole === "Admin" || currentRole === "Delivery" || currentRole === "Accounts" || currentRole === "Purchase";
  const canEditTracking = currentRole === "Admin" || currentRole === "Purchase";
  const canEditWeight = currentRole === "Admin" || currentRole === "Delivery";

  // Stock Out processing states for Admin
  const [modalStockOutAction, setModalStockOutAction] = useState<"refunded" | "adjusted">(
    safeOrder.stockOutInfo?.customerChoice === "adjust" ? "adjusted" : "refunded"
  );
  const [modalTrxId, setModalTrxId] = useState(safeOrder.stockOutInfo?.adminTrxId || "");
  const [modalAdminNote, setModalAdminNote] = useState(safeOrder.stockOutInfo?.adminActionNote || "");
  const [processingStockOut, setProcessingStockOut] = useState(false);
  const [stockOutMsg, setStockOutMsg] = useState<string | null>(null);

  const handleProcessStockOutInModal = async (actionType: "refunded" | "adjusted") => {
    setProcessingStockOut(true);
    try {
      const canonicalId = String(safeOrder.mainOrderId || safeOrder.orderId || safeOrder.id);
      const refundAmt = Number(safeOrder.stockOutInfo?.totalRefundAmount ?? safeOrder.paidAmount ?? safeOrder.total ?? 0);
      const res = await fetch(`/api/orders/${canonicalId}/stock-out-process`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          adminTrxId: modalTrxId.trim(),
          adminActionNote: modalAdminNote.trim(),
          totalRefundAmount: refundAmt,
          processedBy: currentRole === "admin" ? "Super Admin" : "Accounts Team",
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStockOutMsg(
          actionType === "refunded"
            ? "Refund successfully marked as completed!"
            : "Amount successfully adjusted from order due balance!"
        );
        await onUpdateOrder(canonicalId, updated);
      } else {
        alert("Failed to process stock-out action.");
      }
    } catch (e) {
      console.error(e);
      alert("Error processing stock-out resolution.");
    } finally {
      setProcessingStockOut(false);
    }
  };

  const handleMarkOrderStockOut = async () => {
    if (!confirm("Are you sure you want to mark this order as Stock Out? The customer will immediately see this on their dashboard and can choose Refund or Adjust.")) {
      return;
    }
    setProcessingStockOut(true);
    try {
      const canonicalId = String(safeOrder.mainOrderId || safeOrder.orderId || safeOrder.id);
      const res = await fetch(`/api/orders/${canonicalId}/mark-stock-out`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Product Out of Stock at 1688 / Supplier",
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStockOutMsg("Order successfully marked as Stock Out! Customer can now submit refund or adjustment request.");
        await onUpdateOrder(canonicalId, updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingStockOut(false);
    }
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const weightDisplay = `${Number(invForm.weightKg || 0)} KG`;
      const invoicePayload = {
        ...existingInv,
        invoiceNumber: invForm.invoiceNumber,
        orderId: canonicalOrderId,
        order1688Id: invForm.order1688Id,
        trackingNumber: invForm.trackingNumber,
        invoiceDate: invForm.invoiceDate,
        customerName: order.customerInfo?.name || "Customer",
        phone: order.customerInfo?.phone || "",
        email: order.customerInfo?.email || "",
        address: order.customerInfo?.address || "",
        adminChargesUploaded: Boolean(
          Number(invForm.chinaCourierCharge || 0) > 0 ||
            Number(invForm.shippingCharge || 0) > 0 ||
            Number(invForm.weightKg || 0) > 0
        ),
        subTotal: Number(invForm.productTotal),
        productTotal: Number(invForm.productTotal),
        productSubtotal: Number(invForm.productTotal),
        chinaCourier: Number(invForm.chinaCourierCharge),
        chinaCourierCharge: Number(invForm.chinaCourierCharge),
        shippingCharge: Number(invForm.shippingCharge),
        shippingRate: Number(invForm.ratePerKg || 780),
        shippingRatePerKg: Number(invForm.ratePerKg || 780),
        weight: weightDisplay,
        weightApx: weightDisplay,
        weightKg: Number(invForm.weightKg),
        otherCharges: Number(invForm.otherCharges),
        discount: Number(invForm.discount),
        totalAmount: computedTotal,
        grandTotal: computedTotal,
        collectedAmount: Number(invForm.collectedAmount),
        paidAmount: Number(invForm.collectedAmount),
        totalDue: computedDue,
        dueAmount: computedDue,
        paymentNow: computedDue,
        paymentMethod: invForm.paymentMethod,
        paymentStatus: invForm.paymentStatus,
        deliveryStatus: order.deliveryInfo?.status || order.status
      };

      await fetch(`/api/admin/orders/${encodeURIComponent(canonicalOrderId)}/invoice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoicePayload)
      }).catch(() => {});

      await onUpdateOrder(order.id, {
        status: order.status === "Received in BD Warehouse" ? "Invoice Generated" : order.status,
        paymentStatus: invForm.paymentStatus,
        order1688Id: invForm.order1688Id,
        trackingNumber: invForm.trackingNumber,
        purchaseInfo: {
          ...(order.purchaseInfo || {}),
          ...(invForm.order1688Id ? { order1688Id: invForm.order1688Id, orderSupplierId: invForm.order1688Id } : {}),
          ...(invForm.trackingNumber ? { trackingNumber: invForm.trackingNumber } : {})
        },
        updatedBy: `${currentRole} Department`,
        timelineNote: `Invoice ${invForm.invoiceNumber} updated: Weight ${weightDisplay} × BDT ${invForm.ratePerKg} = BDT ${invForm.shippingCharge}, China Courier BDT ${invForm.chinaCourierCharge}, Final Payable BDT ${computedDue.toLocaleString()}`,
        invoice: invoicePayload
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } finally {
      setSaving(false);
    }
  };

  const liveInvoiceData = buildInvoiceFromOrder(order, {
    ...existingInv,
    orderId: canonicalOrderId,
    invoiceNumber: invForm.invoiceNumber,
    orderDate: invForm.invoiceDate,
    order1688Id: invForm.order1688Id,
    trackingNumber: invForm.trackingNumber,
    adminChargesUploaded: Boolean(
      Number(invForm.chinaCourierCharge || 0) > 0 ||
        Number(invForm.shippingCharge || 0) > 0 ||
        Number(invForm.weightKg || 0) > 0
    ),
    productSubtotal: Number(invForm.productTotal || 0),
    chinaCourierCharge: Number(invForm.chinaCourierCharge || 0),
    shippingRatePerKg: Number(invForm.ratePerKg || 780),
    shippingCharge: Number(invForm.shippingCharge || 0),
    weightKg: Number(invForm.weightKg || 0),
    discount: Number(invForm.discount || 0),
    grandTotal: computedTotal,
    totalAmount: computedTotal,
    paidAmount: Number(invForm.collectedAmount || 0),
    collectedAmount: Number(invForm.collectedAmount || 0),
    dueAmount: computedDue,
    paymentMethod: invForm.paymentMethod,
    paymentStatus: invForm.paymentStatus,
    notes: invForm.notes,
  });

  const handlePrintInvoice = () => {
    downloadCustomInvoicePdf(liveInvoiceData);
  };

  // Determine reached stage index in the 11-stage timeline
  const getStageStatus = (stageName: string) => {
    const timelineArr: any[] = Array.isArray(order.timeline) ? order.timeline : [];
    const matched = timelineArr.find(
      t => t.stage?.toLowerCase() === stageName.toLowerCase() ||
      (stageName === "Order Confirmed" && t.stage === "Confirmed Order")
    );
    if (matched) return { completed: true, timestamp: matched.timestamp, updatedBy: matched.updatedBy, note: matched.note };

    const stageOrderMap: Record<string, number> = {
      "Pending": 0,
      "Order Placed": 0,
      "Order Confirmed": 1,
      "Confirmed Order": 1,
      "Pending Purchase": 1,
      "Purchased": 2,
      "Stock Out": 3,
      "Received in China Warehouse": 4,
      "Shipped to Bangladesh": 5,
      "Received in BD Customs": 6,
      "Received in BD Warehouse": 7,
      "Invoice Processing": 7,
      "Invoice Generated": 8,
      "Invoice Ready": 8,
      "Ready for Delivery": 9,
      "Assigned to Delivery": 10,
      "Delivered": 11
    };
    const currentIdx = stageOrderMap[order.status] ?? 0;
    const targetIdx = ORDER_TIMELINE_STAGES.indexOf(stageName);
    if (stageName === "Stock Out" && order.status !== "Stock Out" && !order.stockOutInfo) {
      return { completed: false, timestamp: "", updatedBy: "", note: "" };
    }
    return {
      completed: targetIdx <= currentIdx,
      timestamp: targetIdx <= currentIdx ? "Completed" : "",
      updatedBy: "",
      note: ""
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-5xl w-full overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md bg-primary text-white font-mono text-xs font-black">
                Order ID: {order.id}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                {order.status}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-gray-200 text-xs font-semibold">
                Payment: {order.paymentStatus || "Pending"}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold mt-1.5 text-white">
              Centralized Connected Order Record — Customer to Final Delivery
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab("pipeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "pipeline" ? "bg-primary text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Details & Pipeline</span>
            </button>
            <button
              onClick={() => setActiveSubTab("timeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "timeline" ? "bg-primary text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Order Timeline (11 Stages)</span>
            </button>
            <button
              onClick={() => setActiveSubTab("invoice")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeSubTab === "invoice" ? "bg-emerald-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Invoice & Print
            </button>
            <button
              onClick={() => setActiveSubTab("stockout")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "stockout"
                  ? "bg-rose-600 text-white shadow-xs"
                  : (safeOrder.status === "Stock Out" || safeOrder.stockOutInfo?.isStockOut)
                  ? "bg-rose-500/30 text-rose-200 hover:bg-rose-500/40 border border-rose-400/40"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>Stock Out & Refund</span>
              {safeOrder.stockOutInfo?.customerChoice && safeOrder.stockOutInfo?.status === "requested" && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white transition ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {activeSubTab === "pipeline" && (
            <>
              {/* Connected Flow Banner */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Single Order ID Master Connection ({order.id})
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                  {[
                    { label: "Customer", done: true },
                    { label: "Order & Products", done: true },
                    { label: "Purchased", done: order.purchaseInfo?.status && order.purchaseInfo.status !== "Pending Purchase" },
                    { label: "Stock Out", done: order.status === "Stock Out" || order.purchaseInfo?.status === "Stock Out" },
                    { label: "China WH", done: !!order.chinaWarehouseInfo?.received },
                    { label: "BD Customs", done: !!order.bdCustomsInfo?.received },
                    { label: "BD WH", done: !!order.bdWarehouseInfo?.received },
                    { label: "Invoice", done: !!order.invoice?.invoiceNumber },
                    { label: "Delivery", done: order.status === "Delivered" },
                    { label: "Accounts", done: order.paymentStatus === "Paid" }
                  ].map((step, i, arr) => (
                    <React.Fragment key={step.label}>
                      <span
                        className={`px-2.5 py-1 rounded-lg border ${
                          step.done
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "bg-gray-100 border-gray-200 text-gray-500"
                        }`}
                      >
                        {step.done ? "✓ " : ""}{step.label}
                      </span>
                      {i < arr.length - 1 && <span className="text-gray-400">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* 1. Customer & Marketing Assignment + Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-sm text-charcoal flex items-center gap-1.5">
                      <User className="w-4 h-4 text-primary" />
                      1. Customer Information
                    </h3>
                    <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                      Assigned MKT: {order.assignedMarketingName || "Unassigned"}
                    </span>
                  </div>
                  <p><strong className="text-gray-500">Customer Name:</strong> <span className="font-bold text-charcoal">{order.customerInfo?.name}</span></p>
                  <div className="flex items-center gap-2 flex-wrap py-0.5">
                    <strong className="text-gray-500">Phone:</strong>
                    <CustomerPhoneSecureDisplay
                      order={order}
                      viewerDepartment={currentRole}
                      isMasterAdmin={isMasterAdmin}
                      showActions={true}
                    />
                  </div>
                  <p><strong className="text-gray-500">Email:</strong> {order.customerInfo?.email || order.userEmail || "N/A"}</p>
                  <p><strong className="text-gray-500">Delivery Address:</strong> {order.customerInfo?.address}</p>
                  <p><strong className="text-gray-500">Division & Post Code:</strong> {order.customerInfo?.division || "Dhaka"} {order.customerInfo?.postalCode ? `(${order.customerInfo.postalCode})` : ""}</p>

                  {/* Customer Login Password Assist Box - Admin Only (Hidden in Marketing Dashboard/Pipeline) */}
                  {!isMarketingContext && (
                    isMasterAdmin ? (
                      <div className="mt-2.5 pt-2 border-t border-amber-200 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-amber-800 font-bold block uppercase flex items-center gap-1">
                            <KeyRound className="w-3 h-3 text-amber-700" />
                            <span>Customer Login Password:</span>
                          </span>
                          <span className="font-mono font-black text-slate-900 text-xs sm:text-sm select-all">
                            {showCustPassword 
                              ? (order.customerInfo?.password || order.customerInfo?.lastLoginPassword || "123456")
                              : "••••••••"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowCustPassword(!showCustPassword)}
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-amber-100 transition cursor-pointer"
                            title={showCustPassword ? "Hide password" : "Show password"}
                          >
                            {showCustPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-700" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const pass = order.customerInfo?.password || order.customerInfo?.lastLoginPassword || "123456";
                              navigator.clipboard.writeText(pass);
                              setCopiedCustPassword(true);
                              setTimeout(() => setCopiedCustPassword(false), 2000);
                            }}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                            title="Copy password"
                          >
                            {copiedCustPassword ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Customer Login Password:</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Protected (Admin Access Only)
                        </span>
                      </div>
                    )
                  )}

                  {/* Customer Cart & Wishlist Preview Section */}
                  {(() => {
                    const custCart: any[] = Array.isArray(order.customerInfo?.cart) ? order.customerInfo.cart : [];
                    const custWishlist: any[] = Array.isArray(order.customerInfo?.wishlist) ? order.customerInfo.wishlist : [];
                    const cleanPhone = String(order.customerInfo?.phone || "").replace(/^0/, "").replace(/[^0-9]/g, "");
                    const cartTotal = custCart.reduce((s: number, it: any) => s + (Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1)), 0);

                    return (
                      <div className="mt-3 pt-2.5 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5 text-sky-600" />
                            <span>Customer Cart & Wishlist:</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveCustItemTab("cart")}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                activeCustItemTab === "cart"
                                  ? "bg-sky-600 text-white shadow-2xs"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Cart ({custCart.length})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveCustItemTab("wishlist")}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                activeCustItemTab === "wishlist"
                                  ? "bg-rose-600 text-white shadow-2xs"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              <Heart className="w-3 h-3" />
                              <span>Wishlist ({custWishlist.length})</span>
                            </button>
                          </div>
                        </div>

                        {activeCustItemTab === "cart" ? (
                          custCart.length > 0 ? (
                            <div className="space-y-1.5 bg-sky-50/60 p-2 rounded-lg border border-sky-200 max-h-48 overflow-y-auto">
                              <div className="flex items-center justify-between text-[11px] font-bold text-sky-900 pb-1 border-b border-sky-200/80">
                                <span>Cart Items: {custCart.length}</span>
                                <span>Total: Tk {cartTotal.toLocaleString()}</span>
                              </div>
                              {custCart.map((it: any, idx: number) => {
                                const itemPrice = Number(it.price || it.unitPrice || 0);
                                const itemQty = Number(it.quantity || 1);
                                const waMsg = `Hello ${order.customerInfo?.name || "Customer"}, you have '${it.name || "Product"}' in your World Buy BD cart. Do you need any assistance placing your order?`;
                                return (
                                  <div key={idx} className="flex items-center justify-between gap-2 bg-white p-1.5 rounded border border-slate-200 text-[11px]">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <a
                                        href={getProductPath(it)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative group shrink-0 block"
                                      >
                                        <img
                                          src={it.image || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200"}
                                          alt=""
                                          className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition"
                                        />
                                      </a>
                                      <div className="min-w-0">
                                        <a
                                          href={getProductPath(it)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="font-bold text-slate-800 hover:text-sky-700 line-clamp-1 flex items-center gap-1"
                                        >
                                          <span>{it.name}</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                        </a>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                          Tk {itemPrice.toLocaleString()} × {itemQty} = Tk {(itemPrice * itemQty).toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                    {cleanPhone && canViewPhone && (
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
                            <div className="py-2.5 text-center text-[10px] text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                              No products in cart
                            </div>
                          )
                        ) : (
                          custWishlist.length > 0 ? (
                            <div className="space-y-1.5 bg-rose-50/60 p-2 rounded-lg border border-rose-200 max-h-48 overflow-y-auto">
                              <div className="text-[11px] font-bold text-rose-900 pb-1 border-b border-rose-200/80">
                                Wishlist Items: {custWishlist.length}
                              </div>
                              {custWishlist.map((it: any, idx: number) => {
                                const itemPrice = Number(it.price || it.unitPrice || 0);
                                const waMsg = `Hello ${order.customerInfo?.name || "Customer"}, your wishlisted item '${it.name || "Product"}' on World Buy BD currently has special offers!`;
                                return (
                                  <div key={idx} className="flex items-center justify-between gap-2 bg-white p-1.5 rounded border border-slate-200 text-[11px]">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <a
                                        href={getProductPath(it)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative group shrink-0 block"
                                      >
                                        <img
                                          src={it.image || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200"}
                                          alt=""
                                          className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition"
                                        />
                                      </a>
                                      <div className="min-w-0">
                                        <a
                                          href={getProductPath(it)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="font-bold text-slate-800 hover:text-rose-700 line-clamp-1 flex items-center gap-1"
                                        >
                                          <span>{it.name}</span>
                                          <ExternalLink className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                        </a>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                          Price: Tk {itemPrice.toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                    {cleanPhone && canViewPhone && (
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
                            <div className="py-2.5 text-center text-[10px] text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                              No products in wishlist
                            </div>
                          )
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-sm text-charcoal flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                      2. Order & Shipping Summary
                    </h3>
                    <span className="font-mono text-[11px] text-gray-500">
                      {new Date(order.date).toLocaleString()}
                    </span>
                  </div>
                  <p>
                    <strong className="text-gray-500">👑 Main Order ID:</strong>{" "}
                    <span className="font-mono font-bold text-primary">{safeOrder.mainOrderId || safeOrder.orderId || safeOrder.id}</span>
                  </p>
                  {safeOrder.subOrders && safeOrder.subOrders.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <strong className="text-gray-500 text-[11px]">Sub-Orders ({safeOrder.subOrders.length} links):</strong>
                      {safeOrder.subOrders.map((sub: any) => (
                        <span key={sub.subOrderId} className="font-mono font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded">
                          {sub.subOrderId}
                        </span>
                      ))}
                    </div>
                  )}
                  <p><strong className="text-gray-500">1688 Order ID:</strong> <span className="font-mono font-bold text-purple-700">{safeOrder.order1688Id || safeOrder.purchaseInfo?.order1688Id || safeOrder.purchaseInfo?.orderSupplierId || "Pending Upload"}</span></p>
                  <p><strong className="text-gray-500">Tracking Number:</strong> <span className="font-mono font-bold text-blue-700">{safeOrder.trackingNumber || safeOrder.purchaseInfo?.trackingNumber || safeOrder.chinaWarehouseInfo?.chinaAwb || safeOrder.deliveryInfo?.trackingNumber || "Pending Upload"}</span></p>
                  <p><strong className="text-gray-500">Total Quantity:</strong> <span className="font-bold">{safeOrder.totalQuantity || (safeOrder.items || []).reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0)} pcs</span></p>
                  <p><strong className="text-gray-500">Partial Paid / Total:</strong> <span className="font-black text-emerald-700 text-sm">BDT {(safeOrder.paidAmount ?? safeOrder.subtotal ?? safeOrder.total ?? 0).toLocaleString()} (Partial Paid)</span></p>
                </div>
              </div>

              {/* 2. Products & Original Source Links Grouped by Sub-Order */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-charcoal flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    3. Included Products, Specifications & Sub-Orders ({safeOrder.subOrders?.length || 1} links)
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Order ID: {safeOrder.orderId || safeOrder.id || safeOrder.mainOrderId}
                  </span>
                </div>

                {safeOrder.subOrders && safeOrder.subOrders.length > 0 ? (
                  <div className="space-y-4">
                    {safeOrder.subOrders.map((sub: any, sIdx: number) => (
                      <div key={sub.subOrderId || sIdx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
                        {/* Sub-Order Header Bar */}
                        <div className="bg-slate-900 text-white px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                              Link #{sIdx + 1}
                            </span>
                            <span className="font-mono font-bold text-amber-300 text-sm">
                              {sub.subOrderId}
                            </span>
                            <span className="text-slate-500">|</span>
                            <span className="text-slate-300 font-bold truncate max-w-xs">{sub.productName}</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-sky-300 font-mono text-[11px]">
                              Rate: BDT {Number(sub.shippingRatePerKg || 780).toLocaleString()} / KG
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/20">
                              {sub.status || safeOrder.status}
                            </span>
                            {sub.productLink && (
                              canAccessSourceLink ? (
                                <a
                                  href={sub.productLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] inline-flex items-center gap-1 transition"
                                  title={sub.productLink}
                                >
                                  <span>Open Source Link</span>
                                  <ExternalLink className="w-3 h-3 text-slate-300" />
                                </a>
                              ) : (
                                <span
                                  className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-[10px] inline-flex items-center gap-1"
                                  title="Source Link Protected (Purchase & Admin)"
                                >
                                  <Lock className="w-3 h-3 text-amber-400" />
                                  <span>Source Link Protected</span>
                                </span>
                              )
                            )}
                          </div>
                        </div>

                        {/* Items under this link */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse bg-white">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <th className="py-2 px-3">Product Spec / Variation</th>
                                <th className="py-2 px-3 text-center">Qty</th>
                                <th className="py-2 px-3 text-right">Unit Price</th>
                                <th className="py-2 px-3 text-right">Total</th>
                                <th className="py-2 px-3 text-center">Sub-Order ID</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(sub.items || []).map((item: any, idx: number) => {
                                const itPrice = Number(item.price || item.unitPrice || 0);
                                const itQty = Number(item.quantity || 1);
                                return (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3">
                                      {(() => {
                                        const itemPath = getProductPath(
                                          item.productId || item.offerId || item.id || item.importedUrl || item.sourceUrl || sub.productLink || sub.offerId || sub.subOrderId
                                        );
                                        return (
                                          <div className="flex items-center gap-2.5">
                                            {(item.image || sub.productImage) && (
                                              <a
                                                href={itemPath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 block group"
                                                title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                              >
                                                <img
                                                  src={item.image || sub.productImage}
                                                  alt={item.name}
                                                  className="w-9 h-9 rounded object-cover border group-hover:scale-105 group-hover:border-primary transition"
                                                  referrerPolicy="no-referrer"
                                                />
                                              </a>
                                            )}
                                            <div>
                                              <a
                                                href={itemPath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-charcoal block line-clamp-1 hover:text-primary hover:underline group flex items-center gap-1"
                                                title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                              >
                                                <span>{item.name || sub.productName}</span>
                                                <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-primary shrink-0 transition" />
                                              </a>
                                              <span className="text-[11px] text-slate-500 font-medium">
                                                {[item.selectedColor, item.selectedSize, item.variantName, item.variation].filter(Boolean).join(" / ") || "Standard Spec"}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-bold text-charcoal">{itQty} pcs</td>
                                    <td className="py-2.5 px-3 text-right font-mono">
                                      BDT {itPrice.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-charcoal">
                                      BDT {(itPrice * itQty).toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono font-bold text-primary text-[11px]">
                                      {sub.subOrderId}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-700">
                              <tr>
                                <td colSpan={3} className="py-2 px-3 text-right">
                                  Subtotal for {sub.subOrderId} ({sub.totalPieces} pcs):
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                                  BDT {Number(sub.subtotal || 0).toLocaleString()}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3">Specifications / Variation</th>
                          <th className="py-2.5 px-3">Qty</th>
                          <th className="py-2.5 px-3">Unit Price</th>
                          <th className="py-2.5 px-3">Total</th>
                          <th className="py-2.5 px-3">Original Source Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(safeOrder.items || []).map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3">
                              {(() => {
                                const itemPath = getProductPath(
                                  item.productId || item.offerId || item.id || item.importedUrl || item.productUrl || item.sourceUrl
                                );
                                return (
                                  <div className="flex items-center gap-2.5">
                                    {item.image && (
                                      <a
                                        href={itemPath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 block group"
                                        title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                      >
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-10 h-10 rounded object-cover border group-hover:scale-105 group-hover:border-primary transition"
                                          referrerPolicy="no-referrer"
                                        />
                                      </a>
                                    )}
                                    <a
                                      href={itemPath}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-bold text-charcoal max-w-xs line-clamp-2 hover:text-primary hover:underline group inline-flex items-center gap-1"
                                      title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                                    >
                                      <span>{item.name}</span>
                                      <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-primary shrink-0 transition" />
                                    </a>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                {[item.selectedColor, item.selectedSize, item.variation].filter(Boolean).join(" / ") || "Standard Spec"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-charcoal">{item.quantity || 1} pcs</td>
                            <td className="py-2.5 px-3">
                              BDT {item.price?.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-charcoal">
                              BDT {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              {canAccessSourceLink ? (
                                <a
                                  href={item.importedUrl || item.productUrl || "/shop"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                                >
                                  <span>Open Source Link</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200"
                                  title="Product source link is restricted to Main Admin and Purchase Department"
                                >
                                  <Lock className="w-3 h-3 text-amber-600" />
                                  <span>Protected (Purchase & Admin)</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 3. Departmental Pipeline Grid: Purchase, Stock-Out, China WH, BD Customs, BD WH, Delivery & Payment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Purchase Info */}
                <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-2xs space-y-1.5">
                  <div className="font-bold text-purple-900 flex items-center justify-between border-b border-purple-100 pb-2 mb-2">
                    <span className="flex items-center gap-1.5"><ShoppingBag className="w-4 h-4 text-purple-600" /> 4. Purchase Department</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px]">{order.purchaseInfo?.status || "Pending Purchase"}</span>
                  </div>
                  <p><strong>Supplier:</strong> {order.purchaseInfo?.supplierName || "N/A"}</p>
                  <p><strong>1688 Order ID:</strong> <span className="font-mono font-bold text-purple-800">{order.order1688Id || order.purchaseInfo?.order1688Id || order.purchaseInfo?.orderSupplierId || "Pending"}</span></p>
                  <p><strong>Tracking No:</strong> <span className="font-mono font-bold text-blue-700">{order.trackingNumber || order.purchaseInfo?.trackingNumber || order.chinaWarehouseInfo?.chinaAwb || "Pending"}</span></p>
                  <p><strong>RMB Total:</strong> ¥{order.purchaseInfo?.rmbTotal || 0}</p>
                  <p><strong>Purchased By:</strong> {order.purchaseInfo?.purchasedBy || "—"}</p>
                  <p><strong>Notes:</strong> {order.purchaseInfo?.notes || "—"}</p>
                </div>

                {/* China Warehouse Info */}
                <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-2xs space-y-1.5">
                  <div className="font-bold text-amber-900 flex items-center justify-between border-b border-amber-100 pb-2 mb-2">
                    <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-amber-600" /> 5. China Warehouse</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${order.chinaWarehouseInfo?.received ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                      {order.chinaWarehouseInfo?.received ? "Received in China WH" : "Awaiting"}
                    </span>
                  </div>
                  <p><strong>Ordered / Received Qty:</strong> {order.chinaWarehouseInfo?.orderedQty || order.totalQuantity || 0} / {order.chinaWarehouseInfo?.receivedQty || 0} pcs</p>
                  <p><strong>Missing / Damaged:</strong> {order.chinaWarehouseInfo?.missingDamagedQty || 0} pcs</p>
                  <p><strong>China AWB:</strong> {order.chinaWarehouseInfo?.chinaAwb || "—"}</p>
                  <p><strong>Receiving Date:</strong> {order.chinaWarehouseInfo?.receivedAt ? new Date(order.chinaWarehouseInfo.receivedAt).toLocaleDateString() : "—"}</p>
                  <p><strong>Notes:</strong> {order.chinaWarehouseInfo?.notes || "—"}</p>
                </div>

                {/* BD Customs Info */}
                <div className="bg-white rounded-xl p-4 border border-cyan-200 shadow-2xs space-y-1.5">
                  <div className="font-bold text-cyan-900 flex items-center justify-between border-b border-cyan-100 pb-2 mb-2">
                    <span className="flex items-center gap-1.5"><Anchor className="w-4 h-4 text-cyan-600" /> 6. BD Customs</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${order.bdCustomsInfo?.received ? "bg-cyan-100 text-cyan-800" : "bg-gray-100 text-gray-600"}`}>
                      {order.bdCustomsInfo?.clearanceStatus || (order.bdCustomsInfo?.received ? "Received in BD Customs" : "Pending")}
                    </span>
                  </div>
                  <p><strong>Shipment Ref:</strong> {order.bdCustomsInfo?.shipmentRef || "—"}</p>
                  <p><strong>Status:</strong> {order.bdCustomsInfo?.clearanceStatus || "Pending"}</p>
                  <p><strong>Date:</strong> {order.bdCustomsInfo?.receivedAt ? new Date(order.bdCustomsInfo.receivedAt).toLocaleDateString() : "—"}</p>
                  <p><strong>Updated By:</strong> {order.bdCustomsInfo?.updatedBy || "—"}</p>
                  <p><strong>Notes:</strong> {order.bdCustomsInfo?.notes || "—"}</p>
                </div>

                {/* BD Warehouse Info */}
                <div className="bg-white rounded-xl p-4 border border-teal-200 shadow-2xs space-y-1.5">
                  <div className="font-bold text-teal-900 flex items-center justify-between border-b border-teal-100 pb-2 mb-2">
                    <span className="flex items-center gap-1.5"><Boxes className="w-4 h-4 text-teal-600" /> 7. BD Warehouse</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${order.bdWarehouseInfo?.received ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-600"}`}>
                      {order.bdWarehouseInfo?.received ? "Received in BD WH" : "Pending"}
                    </span>
                  </div>
                  <p><strong>Received Qty:</strong> {order.bdWarehouseInfo?.receivedQty || 0} pcs</p>
                  <p><strong>Package Info:</strong> {order.bdWarehouseInfo?.packageInfo || "—"}</p>
                  <p><strong>Damage / Missing:</strong> {order.bdWarehouseInfo?.damageMissingInfo || "None"}</p>
                  <p><strong>Received Date:</strong> {order.bdWarehouseInfo?.receivedAt ? new Date(order.bdWarehouseInfo.receivedAt).toLocaleDateString() : "—"}</p>
                  <p><strong>Notes:</strong> {order.bdWarehouseInfo?.notes || "—"}</p>
                </div>

                {/* Delivery Info */}
                <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-2xs space-y-1.5">
                  <div className="font-bold text-emerald-900 flex items-center justify-between border-b border-emerald-100 pb-2 mb-2">
                    <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-emerald-600" /> 8. Delivery Status</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                      {order.deliveryInfo?.status || order.status}
                    </span>
                  </div>
                  <p><strong>Courier:</strong> {order.deliveryInfo?.courierName || "—"}</p>
                  <p><strong>Tracking No:</strong> {order.deliveryInfo?.trackingNumber || "—"}</p>
                  <p><strong>Delivery Staff:</strong> {order.deliveryInfo?.deliveryEmployee || "—"}</p>
                  <p><strong>Delivered Date/Time:</strong> {order.deliveryInfo?.deliveredAt ? `${order.deliveryInfo.deliveredAt} ${order.deliveryInfo.deliveredTime || ""}` : "—"}</p>
                  <p><strong>Notes:</strong> {order.deliveryInfo?.deliveryNotes || "—"}</p>
                </div>

                {/* Accounts & Invoice Financial Summary */}
                <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-2xs space-y-1.5">
                  <div className="font-bold text-indigo-900 flex items-center justify-between border-b border-indigo-100 pb-2 mb-2">
                    <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-indigo-600" /> 9. Invoice & Accounts</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px]">
                      {order.invoice?.invoiceNumber || "No Invoice Yet"}
                    </span>
                  </div>
                  <p><strong>Invoice Total:</strong> BDT {Number(order.invoice?.totalAmount ?? order.total ?? 0).toLocaleString()}</p>
                  <p><strong>Collected Amount:</strong> BDT {Number(order.invoice?.collectedAmount ?? (order.paymentStatus === "Paid" ? (order.total ?? 0) : 0)).toLocaleString()}</p>
                  <p><strong>Payment Status:</strong> {order.paymentStatus || "Pending"}</p>
                  <p><strong>Payment Method:</strong> {order.paymentInfo?.method || order.customerInfo?.payment || "Online"} {order.paymentInfo?.transactionId ? `(${order.paymentInfo.transactionId})` : ""}</p>
                </div>
              </div>

              {/* Stock-Out Resolution & Alert Banner */}
              {(safeOrder.stockOutInfo?.isStockOut || safeOrder.status === "Stock Out") ? (
                <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-rose-300 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-200/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                        <AlertOctagon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-rose-950 flex items-center gap-2">
                          <span>Stock-Out Product Resolution</span>
                          {safeOrder.stockOutInfo?.status === "refunded" ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                              ✅ Refund Completed
                            </span>
                          ) : safeOrder.stockOutInfo?.status === "adjusted" ? (
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-300">
                              ✅ Adjusted in Balance
                            </span>
                          ) : safeOrder.stockOutInfo?.customerChoice ? (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                              ⏳ Customer Requested: {safeOrder.stockOutInfo.customerChoice === "refund" ? "Cash Refund" : "Balance Adjust"}
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300 animate-pulse">
                              ⚠ Awaiting Customer Selection
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          Refundable Amount: <strong className="font-mono text-xs">BDT {Number(safeOrder.stockOutInfo?.totalRefundAmount ?? safeOrder.paidAmount ?? safeOrder.total ?? 0).toLocaleString()}</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveSubTab("stockout")}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Manage Stock-Out & Refund →</span>
                    </button>
                  </div>

                  {stockOutMsg && (
                    <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{stockOutMsg}</span>
                    </div>
                  )}

                  {/* Customer Choice Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white/80 p-3.5 rounded-xl border border-rose-200">
                    <div>
                      <strong className="text-slate-500 block mb-1">Customer Selection:</strong>
                      {safeOrder.stockOutInfo?.customerChoice === "refund" ? (
                        <div className="space-y-1">
                          <div className="font-bold text-rose-700 flex items-center gap-1">
                            <Banknote className="w-4 h-4" />
                            <span>1. Cash Refund</span>
                          </div>
                          <p className="text-slate-700">
                            <strong>Method:</strong> <span className="uppercase font-bold text-rose-600">{safeOrder.stockOutInfo.customerPaymentMethod || "bKash"}</span>
                          </p>
                          <p className="text-slate-700">
                            <strong>Account No:</strong> <span className="font-mono font-bold text-slate-900">{safeOrder.stockOutInfo.customerAccountNumber || "Not provided"}</span> ({safeOrder.stockOutInfo.customerAccountType || "Personal"})
                          </p>
                          {safeOrder.stockOutInfo.customerBankDetails && (
                            <p className="text-slate-600"><strong>Bank Info:</strong> {safeOrder.stockOutInfo.customerBankDetails}</p>
                          )}
                          {safeOrder.stockOutInfo.customerNote && (
                            <p className="text-slate-600 italic">" {safeOrder.stockOutInfo.customerNote} "</p>
                          )}
                        </div>
                      ) : safeOrder.stockOutInfo?.customerChoice === "adjust" ? (
                        <div className="space-y-1">
                          <div className="font-bold text-indigo-700 flex items-center gap-1">
                            <Scale className="w-4 h-4" />
                            <span>2. Adjust Balance</span>
                          </div>
                          <p className="text-slate-700">
                            Customer requested to deduct refundable amount from invoice due or upcoming orders.
                          </p>
                          {safeOrder.stockOutInfo.customerNote && (
                            <p className="text-slate-600 italic">" {safeOrder.stockOutInfo.customerNote} "</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          Customer has not submitted their choice yet. Two options (Refund or Adjust) are displayed on customer dashboard.
                        </p>
                      )}
                    </div>

                    {/* Admin Direct Action */}
                    <div className="space-y-2 border-t md:border-t-0 md:border-l border-rose-200 pt-3 md:pt-0 md:pl-3">
                      <strong className="text-slate-500 block">Admin Quick Action:</strong>
                      {safeOrder.stockOutInfo?.status === "refunded" ? (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                          <div><strong>Status:</strong> Refund Completed</div>
                          {safeOrder.stockOutInfo.adminTrxId && <div><strong>TrxID:</strong> <span className="font-mono font-bold">{safeOrder.stockOutInfo.adminTrxId}</span></div>}
                          {safeOrder.stockOutInfo.processedAt && <div><strong>Date:</strong> {new Date(safeOrder.stockOutInfo.processedAt).toLocaleString()}</div>}
                        </div>
                      ) : safeOrder.stockOutInfo?.status === "adjusted" ? (
                        <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
                          <div><strong>Status:</strong> Adjusted from Order Due</div>
                          {safeOrder.stockOutInfo.processedAt && <div><strong>Date:</strong> {new Date(safeOrder.stockOutInfo.processedAt).toLocaleString()}</div>}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="TrxID (if refunding cash)..."
                              value={modalTrxId}
                              onChange={(e) => setModalTrxId(e.target.value)}
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white font-mono"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={processingStockOut}
                              onClick={() => handleProcessStockOutInModal("refunded")}
                              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Approve & Refund</span>
                            </button>
                            <button
                              type="button"
                              disabled={processingStockOut}
                              onClick={() => handleProcessStockOutInModal("adjusted")}
                              className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>Approve & Adjust Due</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Is any product out of stock at supplier / 1688?</span>
                  <button
                    type="button"
                    disabled={processingStockOut}
                    onClick={handleMarkOrderStockOut}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Mark as Stock Out</span>
                  </button>
                </div>
              )}
            </>
          )}

          {activeSubTab === "timeline" && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs">
              <h3 className="text-base font-bold text-charcoal mb-1">
                Complete Visual Order Timeline ({order.id})
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Real-time stage progression across all World Buy BD operational departments
              </p>

              <div className="max-w-2xl mx-auto space-y-2">
                {ORDER_TIMELINE_STAGES.map((stage, index) => {
                  const info = getStageStatus(stage);
                  return (
                    <React.Fragment key={stage}>
                      <div
                        className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                          info.completed
                            ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                            : "bg-gray-50 border-gray-200 text-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                              info.completed ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {info.completed ? "✓" : index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{stage}</div>
                            {info.note && <div className="text-xs text-gray-600 mt-0.5">{info.note}</div>}
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          {info.timestamp ? (
                            <>
                              <span className="font-mono font-bold text-emerald-800 block">{info.timestamp}</span>
                              {info.updatedBy && <span className="text-[10px] text-gray-500">By {info.updatedBy}</span>}
                            </>
                          ) : (
                            <span className="text-[11px] text-gray-400">Pending</span>
                          )}
                        </div>
                      </div>
                      {index < ORDER_TIMELINE_STAGES.length - 1 && (
                        <div className="flex justify-center">
                          <ArrowDown className={`w-4 h-4 ${info.completed ? "text-emerald-500" : "text-gray-300"}`} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {activeSubTab === "invoice" && (
            <div className="space-y-6">
              {/* Invoice Generator Form (Authorized for Admin, Delivery, Accounts) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Update Customer Invoice Charges — China Courier Bill, Parcel Weight & Shipping
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Order ID: <span className="font-mono font-bold text-slate-900">{canonicalOrderId}</span> · Invoice ID: <span className="font-mono font-bold text-primary">{invForm.invoiceNumber}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print 2-Part Invoice
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintInvoice}
                      className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                  </div>
                </div>

                {saveSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Invoice updated! China Courier Bill (BDT {invForm.chinaCourierCharge}), Weight ({invForm.weightKg} KG), and Shipping Charge (BDT {invForm.shippingCharge}) are now live on the Customer's Invoice.
                    </span>
                  </div>
                )}

                {!canManageInvoice ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    Your current role (<strong>{currentRole}</strong>) has view-only access to invoices. Only Admin, Delivery, and Accounts roles can modify invoice billing.
                  </div>
                ) : (
                  <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
                    {/* Highlighted Post-Order Charges Section */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-bold text-slate-800">
                          Final Invoice Calculator: (Product Weight × Shipping Charge Rate) + China Courier Bill - Partial Paid = Final Payable
                        </div>
                        <span className="text-[11px] font-bold text-primary">
                          Auto-Multiplies Weight × Rate in Real-Time
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <label className="font-bold text-slate-800 block mb-1">
                            1. Product Weight (KG) {!canEditWeight && <span className="text-[10px] text-amber-700 font-medium">(Delivery Dept Only)</span>}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            disabled={!canEditWeight}
                            value={invForm.weightKg}
                            onChange={e => {
                              const kg = Number(e.target.value);
                              const autoShip = Math.round(kg * Number(invForm.ratePerKg || 780));
                              setInvForm({
                                ...invForm,
                                weightKg: kg,
                                shippingCharge: autoShip
                              });
                            }}
                            className={`w-full border rounded-lg px-3 py-2 font-mono font-bold ${
                              !canEditWeight
                                ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                                : "border-slate-300 text-slate-900 bg-white focus:border-primary focus:outline-none"
                            }`}
                            title={!canEditWeight ? "Only Delivery Department can edit parcel weight" : ""}
                          />
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <label className="font-bold text-slate-700 block mb-1">
                            2. Shipping Rate / KG (BDT)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={invForm.ratePerKg}
                            onChange={e => {
                              const rate = Number(e.target.value);
                              const kg = Number(invForm.weightKg || 0);
                              const autoShip = Math.round(kg * rate);
                              setInvForm({
                                ...invForm,
                                ratePerKg: rate,
                                shippingCharge: autoShip
                              });
                            }}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:border-primary focus:outline-none"
                          />
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <label className="font-bold text-slate-800 block mb-1">
                            3. Total Shipping (Weight × Rate)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={invForm.shippingCharge}
                            onChange={e => setInvForm({ ...invForm, shippingCharge: Number(e.target.value) })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:border-primary focus:outline-none"
                          />
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <label className="font-bold text-slate-800 block mb-1">
                            4. (+) China Courier Bill (BDT)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={invForm.chinaCourierCharge}
                            onChange={e => setInvForm({ ...invForm, chinaCourierCharge: Number(e.target.value) })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:border-primary focus:outline-none"
                          />
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-emerald-200">
                          <label className="font-bold text-emerald-800 block mb-1">
                            5. (-) Partial Paid (BDT)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={invForm.collectedAmount}
                            onChange={e => setInvForm({ ...invForm, collectedAmount: Number(e.target.value) })}
                            className="w-full border border-emerald-300 bg-emerald-50/40 rounded-lg px-3 py-2 font-mono font-bold text-emerald-900 focus:border-emerald-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div>
                        <label className="font-bold text-purple-800 block mb-1">1688 Order ID</label>
                        <input
                          type="text"
                          value={invForm.order1688Id}
                          onChange={e => setInvForm({ ...invForm, order1688Id: e.target.value })}
                          placeholder="e.g. 1688-394857"
                          className="w-full border border-purple-300 rounded-lg px-3 py-2 font-mono font-bold text-purple-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-blue-800 block mb-1">
                          Tracking Number {!canEditTracking && <span className="text-[10px] text-amber-700 font-medium">(Purchase Dept Only)</span>}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditTracking}
                          value={invForm.trackingNumber}
                          onChange={e => setInvForm({ ...invForm, trackingNumber: e.target.value })}
                          placeholder="e.g. SF14928374"
                          className={`w-full border rounded-lg px-3 py-2 font-mono font-bold ${
                            !canEditTracking
                              ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                              : "border-blue-300 text-blue-900 bg-white focus:border-blue-600 focus:outline-none"
                          }`}
                          title={!canEditTracking ? "Only Purchase Department can edit China tracking number" : ""}
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">Invoice Number</label>
                        <input
                          type="text"
                          value={invForm.invoiceNumber}
                          onChange={e => setInvForm({ ...invForm, invoiceNumber: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">Product Price (BDT)</label>
                        <input
                          type="number"
                          value={invForm.productTotal}
                          onChange={e => setInvForm({ ...invForm, productTotal: Number(e.target.value) })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">Discount (BDT)</label>
                        <input
                          type="number"
                          value={invForm.discount}
                          onChange={e => setInvForm({ ...invForm, discount: Number(e.target.value) })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">Payment Status</label>
                        <select
                          value={invForm.paymentStatus}
                          onChange={e => setInvForm({ ...invForm, paymentStatus: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold"
                        >
                          <option value="Partial Paid">Partial Paid</option>
                          <option value="Paid">Fully Paid</option>
                          <option value="Pending">Pending / Unpaid</option>
                        </select>
                      </div>
                    </div>

                    {/* Live Total & Submit Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white px-4 py-3 rounded-xl">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                        <span>Product: <strong>BDT {Number(invForm.productTotal || 0).toLocaleString()}</strong></span>
                        <span>+ Shipping ({invForm.weightKg} KG × BDT {invForm.ratePerKg}): <strong>BDT {Number(invForm.shippingCharge || 0).toLocaleString()}</strong></span>
                        <span>+ Courier: <strong>BDT {Number(invForm.chinaCourierCharge || 0).toLocaleString()}</strong></span>
                        <span>- Partial Paid: <strong className="text-emerald-400">BDT {Number(invForm.collectedAmount || 0).toLocaleString()}</strong></span>
                        <span>= Final Payable: <strong className="text-amber-300 text-sm">BDT {computedDue.toLocaleString()}</strong></span>
                      </div>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold transition cursor-pointer"
                      >
                        {saving ? "Saving Invoice..." : "Save & Update Customer Invoice"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Live 2-Part Customer & Office Invoice View */}
              <CustomInvoiceView data={liveInvoiceData} copyMode="both" />
            </div>
          )}

          {/* Stock Out & Refund Dedicated Tab */}
          {activeSubTab === "stockout" && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-rose-800 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold mb-2">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>Stock-Out & Customer Refund / Adjustment Management</span>
                    </div>
                    <h3 className="text-xl font-black text-white">
                      Order #{canonicalOrderId} — Stock-Out Case
                    </h3>
                    <p className="text-slate-300 text-xs mt-1">
                      Customer can choose between Cash Refund (bKash/Nagad/Rocket/Bank) or Order Balance Adjustment.
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider text-rose-300 font-bold block">Refundable Amount</span>
                    <div className="text-2xl font-black text-rose-400 font-mono">
                      BDT {Number(safeOrder.stockOutInfo?.totalRefundAmount ?? safeOrder.paidAmount ?? safeOrder.total ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {stockOutMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{stockOutMsg}</span>
                </div>
              )}

              {/* Status and Customer Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Request Details */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span>Customer Resolution Preference</span>
                    </h4>
                    {safeOrder.stockOutInfo?.status === "refunded" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✅ Refund Sent
                      </span>
                    ) : safeOrder.stockOutInfo?.status === "adjusted" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        ✅ Balance Adjusted
                      </span>
                    ) : safeOrder.stockOutInfo?.customerChoice ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                        ⏳ Verification Pending
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                        ⚠ Awaiting Selection
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-slate-500">Customer:</strong>
                    <span className="font-bold">{safeOrder.customerInfo?.name}</span>
                    <CustomerPhoneSecureDisplay
                      order={safeOrder}
                      viewerDepartment={currentRole}
                      isMasterAdmin={isMasterAdmin}
                      showActions={true}
                    />
                  </div>
                  
                  {safeOrder.stockOutInfo?.customerChoice ? (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-600">Selected Option:</strong>
                        <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase ${
                          safeOrder.stockOutInfo.customerChoice === "refund"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}>
                          {safeOrder.stockOutInfo.customerChoice === "refund" ? "1. Cash Refund" : "2. Adjust Balance"}
                        </span>
                      </div>

                      {safeOrder.stockOutInfo.customerChoice === "refund" && (
                        <>
                          <p><strong className="text-slate-600">Method:</strong> <span className="uppercase font-bold text-rose-600">{safeOrder.stockOutInfo.customerPaymentMethod || "bKash"}</span></p>
                          <p><strong className="text-slate-600">Account No:</strong> <span className="font-mono font-bold text-slate-900 text-sm">{safeOrder.stockOutInfo.customerAccountNumber || "N/A"}</span> ({safeOrder.stockOutInfo.customerAccountType || "Personal"})</p>
                          {safeOrder.stockOutInfo.customerBankDetails && (
                            <p><strong className="text-slate-600">Bank Details:</strong> {safeOrder.stockOutInfo.customerBankDetails}</p>
                          )}
                        </>
                      )}

                      {safeOrder.stockOutInfo.customerNote && (
                        <p><strong className="text-slate-600">Customer Note:</strong> <span className="italic text-slate-700">"{safeOrder.stockOutInfo.customerNote}"</span></p>
                      )}
                      {safeOrder.stockOutInfo.requestedAt && (
                        <p className="text-[11px] text-slate-400">Submitted At: {new Date(safeOrder.stockOutInfo.requestedAt).toLocaleString()}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 leading-relaxed">
                      Customer has not yet submitted their preference. The notification and 2 choice buttons are visible on their Customer Dashboard.
                    </div>
                  )}

                  {/* If not marked stock out yet */}
                  {!safeOrder.stockOutInfo?.isStockOut && safeOrder.status !== "Stock Out" && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleMarkOrderStockOut}
                        disabled={processingStockOut}
                        className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <AlertOctagon className="w-4 h-4" />
                        <span>Mark Order as Stock Out Now</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Admin Resolution & Action Form */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4 text-xs">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Admin Action & Resolution</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Verify transaction details and update order status
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Select Action:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setModalStockOutAction("refunded")}
                          className={`p-2.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            modalStockOutAction === "refunded"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          <Banknote className="w-4 h-4" />
                          <span>Approve Refund</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalStockOutAction("adjusted")}
                          className={`p-2.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            modalStockOutAction === "adjusted"
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          <Scale className="w-4 h-4" />
                          <span>Approve Adjust</span>
                        </button>
                      </div>
                    </div>

                    {modalStockOutAction === "refunded" && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Bank / bKash / Nagad Transaction ID (TrxID):
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. BL92KJ791..."
                          value={modalTrxId}
                          onChange={(e) => setModalTrxId(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono bg-white"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Admin Internal / Customer Note:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Refund sent via bKash to customer number..."
                        value={modalAdminNote}
                        onChange={(e) => setModalAdminNote(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={processingStockOut}
                        onClick={() => handleProcessStockOutInModal(modalStockOutAction)}
                        className={`w-full py-2.5 rounded-lg font-bold text-xs text-white transition cursor-pointer flex items-center justify-center gap-2 ${
                          modalStockOutAction === "refunded"
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        {processingStockOut ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : modalStockOutAction === "refunded" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Scale className="w-4 h-4" />
                        )}
                        <span>
                          {processingStockOut
                            ? "Processing..."
                            : modalStockOutAction === "refunded"
                            ? `Confirm & Complete Refund (BDT ${Number(safeOrder.stockOutInfo?.totalRefundAmount ?? safeOrder.paidAmount ?? safeOrder.total ?? 0).toLocaleString()})`
                            : `Confirm & Adjust from Order Due (BDT ${Number(safeOrder.stockOutInfo?.totalRefundAmount ?? safeOrder.paidAmount ?? safeOrder.total ?? 0).toLocaleString()})`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items Breakdown */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>Items in this Order ({safeOrder.items?.length || 0})</span>
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {(safeOrder.items || []).map((it: any, idx: number) => {
                    const price = Number(it.price || it.unitPrice || 0);
                    const qty = Number(it.quantity || 1);
                    const itPath = getProductPath(
                      it.productId || it.offerId || it.id || it.importedUrl || it.sourceUrl || it.name
                    );
                    return (
                      <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs bg-white">
                        <div className="flex items-center gap-3">
                          <a
                            href={itPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 block group"
                            title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                          >
                            <img
                              src={it.image || it.variantImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120"}
                              alt={it.name || "Item"}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 group-hover:scale-105 group-hover:border-primary transition"
                            />
                          </a>
                          <div>
                            <a
                              href={itPath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-slate-900 hover:text-primary hover:underline group inline-flex items-center gap-1"
                              title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                            >
                              <span>{it.name || it.description}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-primary shrink-0 transition" />
                            </a>
                            {it.variantName && (
                              <div className="text-[11px] text-slate-500">Variant: {it.variantName}</div>
                            )}
                            <div className="font-mono text-slate-600 text-[11px]">
                              Qty: {qty} pcs × BDT {price.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 block mb-1">
                            Stock Out
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            BDT {(price * qty).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
