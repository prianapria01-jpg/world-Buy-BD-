import { RoleDashboard, SupportTicket, SalesQuote, DeliveryDispatch, AccountsTransaction, PurchaseQCOrder } from "../types/roleDashboard";

export const DEFAULT_ROLE_DASHBOARDS: RoleDashboard[] = [
  // 3 Customer Support Dashboards
  {
    id: "cs-1",
    code: "CS-1",
    title: "Pre-Sales & Customer Inquiries Desk",
    banglaTitle: "Pre-Sales & Customer Inquiries Desk",
    department: "support",
    description: "New buyer inquiries, factory product sourcing assistance, sizing & color guidelines, and presale live chat management.",
    iconName: "MessageSquare",
    status: "active",
    assignedStaff: {
      name: "Sadia Afrin",
      email: "support1.inquiry@worldbuybd.com",
      phone: "01811001101",
      password: "cs12341",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80"
    },
    permissions: ["view_inquiries", "reply_chat", "convert_quote", "view_products"],
    metrics: { handledCount: 38, pendingCount: 5, resolvedCount: 33 },
    notes: "Ensure response within 3 minutes for new inquiries. Verify factory direct specifications."
  },
  {
    id: "cs-2",
    code: "CS-2",
    title: "Order Status & Complaints Desk",
    banglaTitle: "Order Status & Complaints Desk",
    department: "support",
    description: "Ongoing order tracking, delivery transit updates, customer complaint ticketing, and phone/WhatsApp follow-ups.",
    iconName: "Headphones",
    status: "active",
    assignedStaff: {
      name: "Kamrul Hasan",
      email: "support2.orders@worldbuybd.com",
      phone: "01811001102",
      password: "cs12342",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"
    },
    permissions: ["view_orders", "create_ticket", "resolve_complaint", "send_sms_update"],
    metrics: { handledCount: 64, pendingCount: 8, resolvedCount: 56 },
    notes: "Promptly send SMS/WhatsApp notifications for any airport transit or customs updates."
  },
  {
    id: "cs-3",
    code: "CS-3",
    title: "Returns, Claims & Refunds Desk",
    banglaTitle: "Returns, Claims & Refunds Desk",
    department: "support",
    description: "Inspection of damaged or incorrect items, unboxing video reviews, and refund/replacement authorization workflow.",
    iconName: "RotateCcw",
    status: "active",
    assignedStaff: {
      name: "Fatema Tuz Zohra",
      email: "support3.refunds@worldbuybd.com",
      phone: "01811001103",
      password: "cs12343",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80"
    },
    permissions: ["review_claims", "calculate_refund", "request_payout", "manage_disputes"],
    metrics: { handledCount: 19, pendingCount: 3, resolvedCount: 16 },
    notes: "Require unboxing video verification for damage claims. Get admin approval for cash refunds."
  },

  // 5 Sales / Key Account Manager (KAM) Dashboards
  {
    id: "kam-1",
    code: "KAM-1",
    title: "Wholesale & Bulk Sourcing Desk",
    banglaTitle: "Wholesale & Bulk Sourcing Desk",
    department: "sales",
    description: "Bulk container, carton lot wholesale buyer quotations, volume negotiations, and CBM freight calculations.",
    iconName: "Building2",
    status: "active",
    assignedStaff: {
      name: "Mahfuzur Rahman",
      email: "kam1.wholesale@worldbuybd.com",
      phone: "01722002201",
      password: "kam12341",
      avatar: ""
    },
    permissions: ["create_quotation", "bulk_discounts", "view_merchant_orders", "manage_credit"],
    metrics: { handledCount: 42, pendingCount: 6, amountProcessed: 1450000 },
    notes: "Offer special tier rates for consignments exceeding 100 KG or 1 CBM."
  },
  {
    id: "kam-2",
    code: "KAM-2",
    title: "Dhaka & Central Zone Desk",
    banglaTitle: "Dhaka & Central Zone Desk",
    department: "sales",
    description: "Dhaka, Gazipur, and Narayanganj regional sales leads, merchant onboarding, and priority order tracking.",
    iconName: "MapPin",
    status: "active",
    assignedStaff: {
      name: "Shahriar Ahmed",
      email: "kam2.dhaka@worldbuybd.com",
      phone: "01722002202",
      password: "kam12342",
      avatar: ""
    },
    permissions: ["regional_leads", "manage_orders", "customer_followup", "pickup_coordination"],
    metrics: { handledCount: 88, pendingCount: 11, amountProcessed: 890000 },
    notes: "Facilitate same-day office pickup for Mirpur and Uttara hub clients."
  },
  {
    id: "kam-3",
    code: "KAM-3",
    title: "Chittagong & Port Division Desk",
    banglaTitle: "Chittagong & Port Division Desk",
    department: "sales",
    description: "Chittagong commercial division and seaport sea-freight client and merchant consignment management.",
    iconName: "Anchor",
    status: "active",
    assignedStaff: {
      name: "Nazmul Huda",
      email: "kam3.ctg@worldbuybd.com",
      phone: "01722002203",
      password: "kam12343",
      avatar: ""
    },
    permissions: ["sea_freight_quotes", "port_clearance_tracking", "trader_accounts", "regional_leads"],
    metrics: { handledCount: 31, pendingCount: 4, amountProcessed: 1220000 },
    notes: "Provide direct sea-freight tracking for Khatunganj wholesale merchants."
  },
  {
    id: "kam-4",
    code: "KAM-4",
    title: "Online Reseller & Dropshipping Hub",
    banglaTitle: "Online Reseller & Dropshipping Hub",
    department: "sales",
    description: "White-label order fulfillment, margin management, and fast courier dispatch for online social sellers.",
    iconName: "Share2",
    status: "active",
    assignedStaff: {
      name: "Anisur Rahman",
      email: "kam4.reseller@worldbuybd.com",
      phone: "01722002204",
      password: "kam12344",
      avatar: ""
    },
    permissions: ["reseller_margins", "dropship_orders", "commission_ledger", "white_label_dispatch"],
    metrics: { handledCount: 75, pendingCount: 9, amountProcessed: 680000 },
    notes: "Apply client customized shipping labels without platform markup on dropship parcels."
  },
  {
    id: "kam-5",
    code: "KAM-5",
    title: "Corporate & VIP High-Ticket Accounts",
    banglaTitle: "Corporate & VIP High-Ticket Accounts",
    department: "sales",
    description: "High-volume corporate contracts, industrial equipment procurement, and dedicated executive VIP support.",
    iconName: "Crown",
    status: "active",
    assignedStaff: {
      name: "Tariqul Islam",
      email: "kam5.vip@worldbuybd.com",
      phone: "01722002205",
      password: "kam12345",
      avatar: ""
    },
    permissions: ["vip_pricing", "custom_invoicing", "priority_lane", "contract_management"],
    metrics: { handledCount: 22, pendingCount: 2, amountProcessed: 2850000 },
    notes: "Coordinate duty/VAT tax documentation for corporate consignments over BDT 500,000."
  },

  // 3 Delivery Dashboards
  {
    id: "del-1",
    code: "DEL-1",
    title: "China Warehouse & Inbound Desk",
    banglaTitle: "China Warehouse & Inbound Desk",
    department: "delivery",
    description: "Receiving factory shipments at Guangzhou hub, barcode scanning, weight/dimension logging, and AWB dispatching.",
    iconName: "Plane",
    status: "active",
    assignedStaff: {
      name: "Chen Wei / Asif Iqbal",
      email: "delivery1.china@worldbuybd.com",
      phone: "01933003301",
      password: "del12341",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80"
    },
    permissions: ["scan_china_tracking", "create_awb", "assign_flight_ship", "update_inward"],
    metrics: { handledCount: 140, pendingCount: 14, amountProcessed: 0 },
    notes: "Immediately record parcel weight and volumetric measurements upon arrival at dock."
  },
  {
    id: "del-2",
    code: "DEL-2",
    title: "Bangladesh Hub & Packaging QC",
    banglaTitle: "Bangladesh Hub & Packaging QC",
    department: "delivery",
    description: "Post-customs unboxing, weight cross-checks, protective bubble wrap, and customer invoice labeling.",
    iconName: "Boxes",
    status: "active",
    assignedStaff: {
      name: "Jahangir Alam",
      email: "delivery2.hub@worldbuybd.com",
      phone: "01933003302",
      password: "del12342",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80"
    },
    permissions: ["weight_audit", "print_invoice_label", "packaging_checklist", "ready_for_dispatch"],
    metrics: { handledCount: 112, pendingCount: 7, amountProcessed: 0 },
    notes: "Double bubble wrap glassware and cosmetics, and affix fragile warnings."
  },
  {
    id: "del-3",
    code: "DEL-3",
    title: "Courier Dispatch & Last-Mile Desk",
    banglaTitle: "Courier Dispatch & Last-Mile Desk",
    department: "delivery",
    description: "Steadfast, Pathao, RedX, and Sundarban courier booking, consignment tracking sync, and COD collection management.",
    iconName: "Truck",
    status: "active",
    assignedStaff: {
      name: "Monir Hossain",
      email: "delivery3.courier@worldbuybd.com",
      phone: "01933003303",
      password: "del12343",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80"
    },
    permissions: ["generate_manifest", "courier_handover", "track_cod", "mark_delivered"],
    metrics: { handledCount: 195, pendingCount: 18, amountProcessed: 430000 },
    notes: "Complete courier rider handover daily before 4:00 PM."
  },

  // 1 Accounts & Finance Dashboard
  {
    id: "acc-1",
    code: "ACC-1",
    title: "Accounts & Financial Intelligence",
    banglaTitle: "Accounts & Financial Intelligence",
    department: "accounts",
    description: "Gross revenue, bKash/Nagad/Bank advance reconciliation, RMB factory payouts, air/sea freight costs, and net ledger audit.",
    iconName: "DollarSign",
    status: "active",
    assignedStaff: {
      name: "Rashedul Karim, CA",
      email: "accounts@worldbuybd.com",
      phone: "01711004401",
      password: "acc1234",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
    },
    permissions: ["view_gmv", "bank_reconciliation", "rmb_factory_clearing", "expense_entry", "profit_report", "export_statement"],
    metrics: { handledCount: 280, pendingCount: 12, amountProcessed: 4920000 },
    notes: "Reconcile daily bKash, Nagad, and bank statements by 9:00 PM."
  },

  // 3 Purchase Dashboards
  {
    id: "pur-1",
    code: "PUR-1",
    title: "Direct Factory Sourcing Desk",
    banglaTitle: "Direct Factory Sourcing Desk",
    department: "purchase",
    description: "Supplier offer linking, volume rate bargaining, direct factory PO creation, and China domestic transit tracking.",
    iconName: "ShoppingBag",
    status: "active",
    assignedStaff: {
      name: "Shakil Ahmed",
      email: "purchase1.sourcing@worldbuybd.com",
      phone: "01644005501",
      password: "pur12341",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"
    },
    permissions: ["link_order", "negotiate_rate", "create_po", "track_supplier_shipment"],
    metrics: { handledCount: 94, pendingCount: 10, amountProcessed: 1850000 },
    notes: "Confirm China domestic express dispatch within 1-2 business days with factory."
  },
  {
    id: "pur-2",
    code: "PUR-2",
    title: "Quality Inspection (QC) & Rejection Desk",
    banglaTitle: "Quality Inspection (QC) & Rejection Desk",
    department: "purchase",
    description: "Incoming item inspection for color, size, specification accuracy, and factory return claim management.",
    iconName: "CheckSquare",
    status: "active",
    assignedStaff: {
      name: "Mehedi Hasan",
      email: "purchase2.qc@worldbuybd.com",
      phone: "01644005502",
      password: "pur12342",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80"
    },
    permissions: ["qc_inspection", "upload_defect_proof", "initiate_china_return", "pass_to_warehouse"],
    metrics: { handledCount: 88, pendingCount: 6, amountProcessed: 0 },
    notes: "File return dispute within supplier warranty window if defects are discovered."
  },
  {
    id: "pur-3",
    code: "PUR-3",
    title: "Supplier Settlement & Forex Allocation Desk",
    banglaTitle: "Supplier Settlement & Forex Allocation Desk",
    department: "purchase",
    description: "Factory settlement via Alipay / WeChat Pay, RMB forex rate clearing, and merchant PO reconciliation.",
    iconName: "Landmark",
    status: "active",
    assignedStaff: {
      name: "Zubayer Al Mamun",
      email: "purchase3.forex@worldbuybd.com",
      phone: "01644005503",
      password: "pur12343",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80"
    },
    permissions: ["alipay_settlement", "rmb_rate_audit", "supplier_balance", "po_reconciliation"],
    metrics: { handledCount: 76, pendingCount: 4, amountProcessed: 2340000 },
    notes: "Archive transaction proof voucher after completing factory settlement."
  }
];

export const SAMPLE_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: "tkt-1",
    dashboardId: "cs-1",
    ticketNo: "TKT-10821",
    customerName: "Imran Hossain",
    customerPhone: "01712398411",
    subject: "Wholesale Ladies Handbag Sourcing Quotation",
    details: "Buyer requested air & sea freight costs and delivery timeline for 50 pcs handbags across 5 color variants.",
    priority: "high",
    status: "in_progress",
    type: "inquiry",
    createdAt: "2026-09-22 09:30 AM",
    updatedAt: "2026-09-22 10:15 AM"
  },
  {
    id: "tkt-2",
    dashboardId: "cs-2",
    ticketNo: "TKT-10822",
    customerName: "Nahid Parvez",
    customerPhone: "01855667788",
    orderId: "WB-98214",
    subject: "Shipment Status & Airway Bill Tracking Update",
    details: "Buyer inquiring if package has departed Guangzhou warehouse and requested master tracking AWB.",
    priority: "medium",
    status: "open",
    type: "tracking",
    createdAt: "2026-09-22 10:00 AM",
    updatedAt: "2026-09-22 10:00 AM"
  },
  {
    id: "tkt-3",
    dashboardId: "cs-3",
    ticketNo: "TKT-10823",
    customerName: "Rifat Sultana",
    customerPhone: "01922334455",
    orderId: "WB-97105",
    subject: "Incorrect Size Footwear Received - Exchange or Refund",
    details: "Ordered size 38 but received size 37 from factory. Customer requested bKash refund.",
    priority: "urgent",
    status: "open",
    type: "refund",
    refundAmount: 2450,
    refundMethod: "bKash (01922334455)",
    refundStatus: "pending_approval",
    createdAt: "2026-09-22 11:20 AM",
    updatedAt: "2026-09-22 11:45 AM"
  }
];

export const SAMPLE_SALES_QUOTES: SalesQuote[] = [
  {
    id: "q-1",
    dashboardId: "kam-1",
    quoteNo: "QUO-7721",
    clientName: "Bashundhara City Bag Traders",
    clientCompany: "Style House BD",
    clientPhone: "01711223344",
    productName: "Korean PU Leather Tote Bag (120 Pcs)",
    quantity: 120,
    rmbUnitPrice: 24.5,
    rmbTotal: 2940,
    bdtTotal: 88500,
    shippingType: "air",
    cbmWeight: "35 KG",
    offeredDiscountPct: 7,
    status: "sent_to_client",
    zone: "Dhaka Central",
    notes: "Client agreed to 40% initial advance payment. Balance due on local courier delivery.",
    createdAt: "2026-09-22 08:45 AM"
  },
  {
    id: "q-2",
    dashboardId: "kam-4",
    quoteNo: "QUO-7722",
    clientName: "TrendZone Online Dropshipper",
    clientCompany: "TrendZone BD",
    clientPhone: "01899112233",
    productName: "Highlighter Palette & Beauty Kits (50 Sets)",
    quantity: 50,
    rmbUnitPrice: 14.0,
    rmbTotal: 700,
    bdtTotal: 23800,
    shippingType: "air",
    cbmWeight: "12 KG",
    offeredDiscountPct: 5,
    status: "negotiating",
    zone: "Online / Courier",
    notes: "Requires white-label packaging and plain dispatch via Steadfast.",
    createdAt: "2026-09-22 09:15 AM"
  }
];

export const SAMPLE_DELIVERY_DISPATCHES: DeliveryDispatch[] = [
  {
    id: "disp-1",
    dashboardId: "del-1",
    orderId: "WB-99101",
    customerName: "Tanvir Ahmed",
    customerPhone: "01788223344",
    customerAddress: "House 12, Road 4, Sector 7, Uttara, Dhaka",
    chinaAwb: "CZ-882914-BD",
    flightSeaBatch: "Air Flight Biman BG-391 (Guangzhou to DAC)",
    stage: "customs_transit",
    weightKg: 2.4,
    codAmount: 3200,
    codStatus: "uncollected",
    notes: "Scheduled for Dhaka airport customs clearance tomorrow morning.",
    updatedAt: "2026-09-22 10:30 AM"
  },
  {
    id: "disp-2",
    dashboardId: "del-2",
    orderId: "WB-99102",
    customerName: "Meherun Nesa",
    customerPhone: "01611223344",
    customerAddress: "Flat 4B, Dhanmondi 27, Dhaka",
    stage: "packaging_done",
    weightKg: 1.8,
    codAmount: 2150,
    codStatus: "uncollected",
    notes: "Bubble wrap completed. Invoice labels attached.",
    updatedAt: "2026-09-22 11:00 AM"
  },
  {
    id: "disp-3",
    dashboardId: "del-3",
    orderId: "WB-99103",
    customerName: "Shafiqul Alam",
    customerPhone: "01977889900",
    customerAddress: "Agrabad Commercial Area, Chittagong",
    courierName: "Steadfast",
    trackingNumber: "STF-99481230",
    stage: "courier_assigned",
    weightKg: 3.5,
    codAmount: 4850,
    codStatus: "uncollected",
    notes: "Handed over to Steadfast courier. Tracking active.",
    updatedAt: "2026-09-22 11:45 AM"
  }
];

export const SAMPLE_ACCOUNTS_TRANSACTIONS: AccountsTransaction[] = [
  {
    id: "tx-1",
    voucherNo: "VCH-2026-0901",
    date: "2026-09-22",
    type: "income",
    account: "bKash",
    amountBDT: 15400,
    category: "Customer Advance Deposits",
    description: "bKash advance deposit for 3 confirmed customer orders",
    referenceNo: "TRX99281734",
    status: "completed"
  },
  {
    id: "tx-2",
    voucherNo: "VCH-2026-0902",
    date: "2026-09-22",
    type: "factory_settlement",
    account: "Alipay RMB",
    amountBDT: 45600,
    amountRMB: 2000,
    exchangeRate: 22.8,
    category: "Direct Factory Payout",
    description: "Alipay payout for Guangzhou handbag and children clothing factory orders",
    referenceNo: "ALI-88192837",
    status: "completed"
  },
  {
    id: "tx-3",
    voucherNo: "VCH-2026-0903",
    date: "2026-09-22",
    type: "expense",
    account: "South East Bank",
    amountBDT: 12500,
    category: "Air Freight & Customs Clearance",
    description: "Air cargo batch #94 customs duty and airport handling charges",
    referenceNo: "DBBL-REF-8841",
    status: "completed"
  },
  {
    id: "tx-4",
    voucherNo: "VCH-2026-0904",
    date: "2026-09-22",
    type: "courier_cod",
    account: "BRAC Bank",
    amountBDT: 38200,
    category: "Steadfast COD Remittance",
    description: "Bank deposit for 12 parcel COD collections from Steadfast courier",
    referenceNo: "STF-REMIT-9921",
    status: "completed"
  }
];

export const SAMPLE_PURCHASE_QC_ORDERS: PurchaseQCOrder[] = [
  {
    id: "qc-1",
    dashboardId: "pur-1",
    orderId: "WB-99101",
    offerId: "7761028391",
    supplierName: "Guangzhou Baili Leather Co., Ltd.",
    orderSupplierId: "WB-FAC-998821",
    productTitle: "Korean Style Shoulder Tote Bag",
    quantity: 30,
    agreedPriceRMB: 22.0,
    supplierAlipayId: "baili_leather@163.com",
    settlementStatus: "settled",
    qcStatus: "passed",
    qcChecklist: {
      colorVerified: true,
      sizeVerified: true,
      quantityVerified: true,
      functionWorking: true,
      packagingGood: true
    },
    chinaTrackingNo: "SF-9928172901",
    notes: "Supplier applied 3% volume rebate. Quality inspection verified.",
    updatedAt: "2026-09-22 09:40 AM"
  },
  {
    id: "qc-2",
    dashboardId: "pur-2",
    orderId: "WB-99104",
    offerId: "8827103948",
    supplierName: "Yiwu Star Kids Fashion Factory",
    orderSupplierId: "WB-FAC-998822",
    productTitle: "Baby Cotton Romper & Bodysuit Set",
    quantity: 45,
    agreedPriceRMB: 12.5,
    settlementStatus: "settled",
    qcStatus: "inspecting",
    qcChecklist: {
      colorVerified: true,
      sizeVerified: true,
      quantityVerified: false,
      functionWorking: true,
      packagingGood: true
    },
    chinaTrackingNo: "ZT-8827192837",
    notes: "Under count inspection at Guangzhou hub. 3 pcs test piece checked.",
    updatedAt: "2026-09-22 10:20 AM"
  }
];
