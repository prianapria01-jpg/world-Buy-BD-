import { StockOutRefundRecord } from "../types";

export function formatStockOutRefundMessage(params: {
  customerName?: string;
  orderId: string;
  productName: string;
  variantName?: string;
  quantity?: number;
  refundAmount: number;
  paymentMethod?: string;
  accountNumber?: string;
  trxId?: string;
  action?: "refunded" | "adjusted" | string;
}): string {
  const name = params.customerName?.trim() || "Valued Customer";
  const orderId = params.orderId?.trim();
  const prod = params.productName?.trim() || "Product";
  const variant = params.variantName?.trim();
  const qty = Number(params.quantity || 1);
  const amount = Number(params.refundAmount || 0).toLocaleString();
  const method = params.paymentMethod || "bKash";
  const acc = params.accountNumber?.trim() || "";
  const trx = params.trxId?.trim();
  const isAdjust = params.action === "adjusted";

  if (isAdjust) {
    return `Dear ${name}, your item '${prod}'${variant ? ` (${variant})` : ""} from order #${orderId} was stocked out at the China factory. The amount of Tk ${amount} has been adjusted from your order's due balance. Your updated invoice is now active. Thank you for choosing World Buy BD.`;
  }

  return `Dear ${name}, your item '${prod}'${variant ? ` (Variant: ${variant}, Qty: ${qty})` : ` (Qty: ${qty})`} from order #${orderId} was stocked out. The refund amount of Tk ${amount} has been refunded to your ${method}${acc ? ` (${acc})` : ""} account. Transaction ID (TrxID): ${trx || "Pending"}. Thank you for choosing World Buy BD.`;
}

export const SAMPLE_STOCK_OUT_REFUNDS: StockOutRefundRecord[] = [
  {
    id: "REF-WBBD-88214-01",
    orderId: "WBBD-88214",
    productId: "wb-factory-963357947517",
    productName: "Non-Slip Silicone Grip Deadlift Wrist Support & Palm Protection Fitness Lifting Straps (Pair)",
    productImage: "https://cbu01.alicdn.com/img/ibank/O1CN015QMHt02GWaqA9Fyh3_!!2220481779023-0-cib.jpg",
    variantName: "Black Silicone Pro / XL (Pair)",
    productLink: "https://detail.1688.com/offer/963357947517.html",
    quantity: 2,
    unitPrice: 850,
    refundAmount: 1700,
    action: "refunded",
    paymentMethod: "bKash",
    accountNumber: "01789-456123",
    accountType: "Personal",
    bankDetails: "",
    trxId: "BK9X84M291Q",
    customerName: "Tanvir Ahmed",
    customerPhone: "01789456123",
    customerEmail: "tanvir.client@gmail.com",
    customerNote: "Please send refund to my bKash number and notify me.",
    refundMessage: "Dear Tanvir Ahmed, your item 'Non-Slip Silicone Grip Deadlift Wrist Support & Palm Protection Fitness Lifting Straps (Pair)' (Variant: Black Silicone Pro / XL (Pair), Qty: 2) from order #WBBD-88214 was stocked out. The refund amount of Tk 1,700 has been refunded to your bKash (01789-456123) account. Transaction ID (TrxID): BK9X84M291Q. Thank you for choosing World Buy BD.",
    adminNote: "Stock out confirmed from China factory. Full refund sent to customer bKash account.",
    processedBy: "Super Admin",
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    status: "Completed"
  },
  {
    id: "REF-WBBD-79105-02",
    orderId: "WBBD-79105",
    productId: "wb-1688-1024794580729",
    productName: "Luxury Quilted 22-Bag Chain Crossbody Purse & Shoulder Handbag",
    productImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80",
    variantName: "Champagne Gold Leather / Medium",
    productLink: "https://detail.1688.com/offer/1024794580729.html",
    quantity: 1,
    unitPrice: 3200,
    refundAmount: 3200,
    action: "refunded",
    paymentMethod: "Nagad",
    accountNumber: "01844-998877",
    accountType: "Personal",
    bankDetails: "",
    trxId: "NG74K8912P",
    customerName: "Farhana Yasmin",
    customerPhone: "01844998877",
    customerEmail: "farhana.y@gmail.com",
    customerNote: "Need urgent refund to Nagad account.",
    refundMessage: "Dear Farhana Yasmin, your item 'Luxury Quilted 22-Bag Chain Crossbody Purse & Shoulder Handbag' (Variant: Champagne Gold Leather / Medium, Qty: 1) from order #WBBD-79105 was stocked out. The refund amount of Tk 3,200 has been refunded to your Nagad (01844-998877) account. Transaction ID (TrxID): NG74K8912P. Thank you for choosing World Buy BD.",
    adminNote: "Supplier out of stock for Gold color. Customer declined substitute, full refund issued.",
    processedBy: "Accounts Admin",
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    status: "Completed"
  },
  {
    id: "REF-WBBD-64210-03",
    orderId: "WBBD-64210",
    productId: "wb-shoes-5501",
    productName: "Breathable Men Lightweight Running Sneakers Sport Casual Shoes",
    productImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
    variantName: "Navy Blue / Size 43",
    productLink: "",
    quantity: 1,
    unitPrice: 2150,
    refundAmount: 2150,
    action: "adjusted",
    paymentMethod: "Order Balance Adjustment",
    accountNumber: "Adjusted against invoice due amount",
    accountType: "Adjustment",
    bankDetails: "",
    trxId: "ADJ-64210-BD",
    customerName: "Rakibul Hasan",
    customerPhone: "01911-223344",
    customerEmail: "rakib.h@gmail.com",
    customerNote: "Please adjust this amount with the shipping or other items in my order.",
    refundMessage: "Dear Rakibul Hasan, your item 'Breathable Men Lightweight Running Sneakers Sport Casual Shoes' (Navy Blue / Size 43) from order #WBBD-64210 was stocked out at China factory. The amount of Tk 2,150 has been adjusted from your order due amount. Your updated invoice is now active. Thank you for choosing World Buy BD.",
    adminNote: "Tk 2,150 deducted from invoice due with customer consent.",
    processedBy: "Super Admin",
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    status: "Adjusted"
  }
];
