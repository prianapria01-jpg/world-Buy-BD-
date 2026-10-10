export type DashboardDepartment = "support" | "sales" | "delivery" | "accounts" | "purchase";

export interface RoleDashboard {
  id: string; // e.g. "cs-1"
  code: string; // e.g. "CS-1"
  title: string;
  banglaTitle: string;
  department: DashboardDepartment;
  description: string;
  iconName: string;
  status: "active" | "inactive";
  assignedStaff: {
    name: string;
    email: string;
    phone: string;
    password: string;
    avatar?: string;
  };
  permissions: string[];
  notes?: string;
  metrics?: {
    handledCount?: number;
    pendingCount?: number;
    resolvedCount?: number;
    amountProcessed?: number;
  };
  updatedAt?: string;
}

export interface SupportTicket {
  id: string;
  dashboardId: string; // cs-1, cs-2, cs-3
  ticketNo: string;
  customerName: string;
  customerPhone: string;
  orderId?: string;
  subject: string;
  details: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  type: "inquiry" | "tracking" | "complaint" | "refund" | "return";
  refundAmount?: number;
  refundMethod?: string;
  refundStatus?: "pending_approval" | "approved" | "rejected" | "disbursed";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesQuote {
  id: string;
  dashboardId: string; // kam-1 to kam-5
  quoteNo: string;
  clientName: string;
  clientCompany?: string;
  clientPhone: string;
  productName: string;
  productUrl?: string;
  quantity: number;
  rmbUnitPrice: number;
  rmbTotal: number;
  bdtTotal: number;
  shippingType: "air" | "sea";
  cbmWeight?: string;
  offeredDiscountPct?: number;
  status: "draft" | "sent_to_client" | "negotiating" | "accepted" | "rejected";
  zone?: string;
  notes?: string;
  createdAt: string;
}

export interface DeliveryDispatch {
  id: string;
  dashboardId: string; // del-1, del-2, del-3
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  trackingNumber?: string;
  courierName?: "Steadfast" | "Pathao" | "RedX" | "Sundarban" | "Self-Pickup" | "China Inbound";
  chinaAwb?: string;
  flightSeaBatch?: string;
  stage: "china_warehouse" | "customs_transit" | "bd_hub_qc" | "packaging_done" | "courier_assigned" | "delivered";
  weightKg?: number;
  cbm?: number;
  codAmount?: number;
  codStatus?: "uncollected" | "collected_by_courier" | "remitted_to_bank";
  notes?: string;
  updatedAt: string;
}

export interface AccountsTransaction {
  id: string;
  voucherNo: string;
  date: string;
  type: "income" | "expense" | "factory_settlement" | "courier_cod" | "refund_payout";
  account: "bKash" | "Nagad" | "South East Bank" | "Dutch-Bangla Bank" | "BRAC Bank" | "Alipay RMB" | "Cash In Hand";
  amountBDT: number;
  amountRMB?: number;
  exchangeRate?: number;
  orderId?: string;
  category: string;
  description: string;
  referenceNo?: string;
  status: "completed" | "pending";
}

export interface PurchaseQCOrder {
  id: string;
  dashboardId: string; // pur-1, pur-2, pur-3
  orderId: string;
  offerId?: string;
  supplierName?: string;
  orderSupplierId?: string;
  productTitle: string;
  quantity: number;
  agreedPriceRMB: number;
  supplierAlipayId?: string;
  settlementStatus: "unpaid" | "partial" | "settled";
  qcStatus: "pending_arrival" | "inspecting" | "passed" | "rejected_defect";
  qcChecklist?: {
    colorVerified: boolean;
    sizeVerified: boolean;
    quantityVerified: boolean;
    functionWorking: boolean;
    packagingGood: boolean;
  };
  chinaTrackingNo?: string;
  notes?: string;
  updatedAt: string;
}
