export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  price: number;
  rmbPrice?: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  image: string;
  images?: string[];
  videoUrl?: string;
  rating: number;
  reviewCount: number;
  status: "published" | "draft" | "archived";
  offerId?: string;
  description?: string;
  specifications?: Record<string, string>;
  descriptionImages?: string[];
  sellerInfo?: {
    name?: string;
    level?: string;
    location?: string;
    rating?: number;
    responseRate?: string;
    deliveryScore?: number;
    [key: string]: any;
  };
  importedUrl?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isFlashSale?: boolean;
  // Advanced Supplier Data
  skuDetails?: any;
  specs?: any;
  descriptionHtml?: string;
  supplier?: any;
  quantityPrices?: any;
  services?: any;
  productFlags?: any;
  shipping?: any;
  soldDisplay?: string;
  minOrderQuantity?: number;
  variants?: any[];
}

export interface StockOutItem {
  itemId?: string;
  productId?: string;
  name: string;
  variantName?: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  reason?: string;
}

export interface StockOutInfo {
  isStockOut: boolean;
  totalRefundAmount: number; // Total refund or adjustment amount
  reason?: string;
  items?: StockOutItem[];
  customerChoice?: "refund" | "adjust" | null; // Refund or adjustment preference
  customerPaymentMethod?: "bkash" | "nagad" | "rocket" | "bank" | "other";
  customerAccountNumber?: string;
  customerAccountType?: "personal" | "agent" | "bank_acc";
  customerBankDetails?: string;
  customerNote?: string;
  requestedAt?: string;
  status?: "pending_customer_choice" | "requested" | "processing" | "refunded" | "adjusted" | "rejected";
  adminActionNote?: string;
  adminTrxId?: string;
  adminProcessedAt?: string;
  adminProcessedBy?: string;
  adjustedAmount?: number;
}

export interface StockOutRefundRecord {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantName?: string;
  productLink?: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  action: "refunded" | "adjusted";
  paymentMethod: string;
  accountNumber?: string;
  accountType?: string;
  bankDetails?: string;
  trxId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerNote?: string;
  refundMessage: string;
  adminNote?: string;
  processedBy: string;
  createdAt: string;
  status: "Completed" | "Adjusted" | "Processing";
}

export interface CartItem extends Product {
  quantity: number;
  variantName?: string;
  variantImage?: string;
  variantSkuId?: string;
  cartItemId?: string;
  subOrderId?: string;
  mainOrderId?: string;
  productLink?: string;
  linkKey?: string;
  shippingRatePerKg?: number;
  isStockOut?: boolean;
  stockOutQuantity?: number;
  refundAmount?: number;
}

export interface SubOrder {
  subOrderId: string;
  mainOrderId: string;
  linkIndex: number;
  linkKey: string;
  productLink: string;
  isExternalLink: boolean;
  offerId?: string;
  productId: string;
  productName: string;
  productImage: string;
  category?: string;
  items: CartItem[];
  totalPieces: number;
  totalVariationsCount: number;
  subtotal: number;
  shippingRatePerKg: number;
  weight?: string;
  weightKg?: number;
  shippingCharge?: number;
  chinaCourierBill?: number;
  order1688Id?: string;
  trackingNumber?: string;
  status: string;
  createdAt?: string;
}

export interface Order {
  id: string;
  orderId?: string;
  mainOrderId?: string;
  isMainOrder?: boolean;
  linkCount?: number;
  subOrders?: SubOrder[];
  date: string;
  createdAt?: string;
  status: string;
  paymentStatus?: string;
  total: number;
  subtotal?: number;
  discountAmount?: number;
  shippingCharge?: number;
  chinaCourierBill?: number;
  shippingRatePerKg?: number;
  weight?: string;
  weightKg?: number;
  paidAmount?: number;
  dueAmount?: number;
  adminChargesUploaded?: boolean;
  items: CartItem[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    division?: string;
    postalCode?: string;
    payment?: string;
    userId?: string;
  };
  paymentInfo?: any;
  invoice?: any;
  trackingNumber?: string;
  order1688Id?: string;
  userId?: string | null;
  userEmail?: string;
  userPhone?: string;
  stockOutInfo?: StockOutInfo;
  assignedMarketingStaff?: {
    id: string; // e.g. "kam-1"
    code: string; // e.g. "KAM-1"
    name: string;
    phone: string;
    email?: string;
    avatar?: string;
    assignedAt?: string;
    assignedBy?: string;
  };
}
