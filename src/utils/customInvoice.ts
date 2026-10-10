import { jsPDF } from "jspdf";

export interface InvoiceItem {
  no: number | string;
  image?: string;
  description: string;
  variation?: string;
  skuOrVariation?: string;
  quantity: number;
  rate?: number;
  amount?: number;
  unitPrice: number;
  totalPrice: number;
  subOrderId?: string;
  productLink?: string;
}

export interface CustomInvoiceData {
  id?: string;
  orderId: string;
  mainOrderId?: string;
  subOrderId?: string;
  isSubOrderInvoice?: boolean;
  linkIndex?: number;
  productLink?: string;
  linkCount?: number;
  subOrders?: any[];
  invoiceNumber: string;
  orderDate: string;
  trackingNumber: string;
  order1688Id?: string;
  customerName: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  email?: string;
  contactEmail?: string;
  emergencyContact: string;
  productName: string;
  items: InvoiceItem[];
  couponName?: string;
  couponAmount?: number;
  shippingMethod: string;
  shippingRate: number;
  shippingRatePerKg: number;
  weight: string;
  weightApx: string;
  weightKg: number | string;
  weightAmount: number;
  chinaCounterCharge: number;
  chinaCourier: number;
  chinaCourierCharge: number;
  shippingCharge: number;
  discount?: number;
  subTotal: number;
  productSubtotal: number;
  totalProductQty: number;
  paymentNow: number;
  grandTotal: number;
  paidAmount: number;
  totalDue: number;
  dueAmount: number;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionId?: string;
  status?: string;
  adminChargesUploaded?: boolean;
  shippingPaymentPolicy?: string;
  returnRefundPolicy?: string;
  footerNote: string;
}

export const DEFAULT_SHIPPING_PAYMENT_POLICY = `1. 100% of the Product Price is collected upfront as Partial Paid upon order placement.
2. Parcel Weight (KG) × Shipping Charge Rate + China Courier Bill are added upon arrival, and Partial Paid is deducted to determine the Final Invoice Payable.`;

export const DEFAULT_RETURN_REFUND_POLICY = `1. 100% refund or free replacement is guaranteed if wrong, missing, or damaged items arrive in our warehouse.
2. Customers must record an unedited unboxing video while opening the parcel to claim any missing/damage adjustment.
3. Once purchased from the Chinese factory, customized or wholesale orders cannot be cancelled mid-transit.`;

export function formatInvoiceNumber(rawId?: string): string {
  if (!rawId) return "INV-WBBD-1001";
  return rawId.startsWith("INV-") ? rawId : `INV-${rawId}`;
}

export function buildInvoiceFromOrder(order: any, existingInvoice?: any): CustomInvoiceData {
  const safeOrder = order || {};
  const inv = existingInvoice || safeOrder.invoice || {};

  // Canonical Order ID that strictly matches the customer's Order ID
  const canonicalOrderId = String(
    safeOrder.orderId ||
      safeOrder.id ||
      inv.orderId ||
      "WBBD-10025"
  );

  // Invoice Number strictly synced with Order ID unless explicitly customized for this order
  const rawInvNo = inv.invoiceNumber ? String(inv.invoiceNumber) : "";
  const syncedInvoiceNumber =
    rawInvNo && rawInvNo !== "150126000000054952"
      ? rawInvNo
      : `INV-${canonicalOrderId}`;

  // Map items from order.items or inv.items while preserving product images, variations, quantities & prices
  const rawOrderItems = Array.isArray(safeOrder.items) ? safeOrder.items : [];
  const rawInvItems = Array.isArray(inv.items) && inv.items.length > 0 ? inv.items : null;

  const items: InvoiceItem[] = (rawInvItems || rawOrderItems).map((item: any, idx: number) => {
    const fallbackOrderItem = rawOrderItems[idx] || rawOrderItems[0] || {};
    const qty = Number(item.quantity ?? item.qty ?? fallbackOrderItem.quantity ?? 1) || 1;
    const uPrice = Number(
      item.unitPrice ??
        item.price ??
        item.rate ??
        fallbackOrderItem.price ??
        0
    );
    const tPrice = Number(item.totalPrice ?? item.amount ?? qty * uPrice);
    const variationStr =
      item.variation ||
      [
        item.selectedColor || fallbackOrderItem.selectedColor,
        item.selectedSize || fallbackOrderItem.selectedSize,
        item.variantName || fallbackOrderItem.variantName,
      ]
        .filter(Boolean)
        .join(" / ") ||
      "";

    return {
      no: item.no || idx + 1,
      image: item.image || fallbackOrderItem.image || "",
      description: item.description || item.name || fallbackOrderItem.name || "Imported Product",
      variation: variationStr,
      quantity: qty,
      rate: uPrice,
      amount: tPrice,
      unitPrice: uPrice,
      totalPrice: tPrice,
      subOrderId: item.subOrderId || fallbackOrderItem.subOrderId || "",
      productLink: item.productLink || fallbackOrderItem.productLink || fallbackOrderItem.importedUrl || "",
    };
  });

  // Ensure at least 1 item row if order had no items array
  if (items.length === 0) {
    const fallbackPrice = Number(inv.subTotal ?? inv.productTotal ?? safeOrder.subtotal ?? safeOrder.total ?? 0);
    items.push({
      no: 1,
      image: safeOrder.productImage || "",
      description: inv.productName || safeOrder.productName || "Direct China Imported Product",
      variation: "",
      quantity: Number(inv.totalProductQty || safeOrder.quantity || 1),
      rate: fallbackPrice,
      amount: fallbackPrice,
      unitPrice: fallbackPrice,
      totalPrice: fallbackPrice,
    });
  }

  const computedSubTotal = items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
  const subTotal = Number(inv.subTotal ?? inv.productSubtotal ?? inv.productTotal ?? computedSubTotal) || 0;
  const totalProductQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0) || 1;

  const discount = Number(
    inv.discount ??
      safeOrder.discountAmount ??
      safeOrder.discount ??
      0
  ) || 0;

  const netProductPrice = Math.max(0, subTotal - discount);

  const rawChinaCourier = Number(
    inv.chinaCourier ??
      inv.chinaCourierCharge ??
      inv.chinaCounterCharge ??
      inv.otherCharges ??
      safeOrder.chinaCourierCharge ??
      safeOrder.chinaCourierBill ??
      safeOrder.chinaCourier ??
      0
  ) || 0;

  const rawWeight =
    inv.weightApx ??
    inv.weight ??
    inv.weightKg ??
    safeOrder.weightKg ??
    safeOrder.weight ??
    0;
  const parsedRawWeightKg = parseFloat(String(rawWeight).replace(/[^0-9.]/g, "")) || 0;
  const shippingRatePerKg = Number(
    inv.shippingRatePerKg ??
      inv.shippingRate ??
      safeOrder.shippingRatePerKg ??
      safeOrder.items?.[0]?.shippingRatePerKg ??
      780
  ) || 780;

  const rawStoredShipping = Number(
    inv.shippingCharge ??
      safeOrder.shippingCharge ??
      0
  );

  // Only include Shipping Charge & China Courier Bill after Admin / CS explicitly uploads them
  const adminChargesUploaded = Boolean(
    inv.adminChargesUploaded === true ||
      safeOrder.adminChargesUploaded === true ||
      rawChinaCourier > 0 ||
      (rawStoredShipping > 0 && rawStoredShipping !== 100) ||
      (parsedRawWeightKg > 0 && parsedRawWeightKg !== 0.5 && rawStoredShipping !== 100)
  );

  const chinaCourier = adminChargesUploaded ? rawChinaCourier : 0;
  const parsedWeightKg = adminChargesUploaded ? parsedRawWeightKg : 0;
  const weightStr =
    adminChargesUploaded && parsedWeightKg > 0
      ? String(rawWeight).toUpperCase().includes("KG")
        ? String(rawWeight)
        : `${parsedWeightKg} KG`
      : "0 KG";

  const shippingCharge = adminChargesUploaded
    ? rawStoredShipping > 0
      ? rawStoredShipping
      : parsedWeightKg > 0
      ? Math.round(parsedWeightKg * shippingRatePerKg)
      : 0
    : 0;

  // Customer pays 100% of Product Price upfront as "Partial Paid"
  let paidAmount = netProductPrice;
  if (inv.paidAmount !== undefined && inv.paidAmount !== null && Number(inv.paidAmount) > 0) {
    paidAmount = Number(inv.paidAmount);
  } else if (inv.collectedAmount !== undefined && inv.collectedAmount !== null && Number(inv.collectedAmount) > 0) {
    paidAmount = Number(inv.collectedAmount);
  } else if (safeOrder.paidAmount !== undefined && Number(safeOrder.paidAmount) > 0) {
    paidAmount = Number(safeOrder.paidAmount);
  } else if (safeOrder.paymentInfo?.paidAmount !== undefined && Number(safeOrder.paymentInfo.paidAmount) > 0) {
    paidAmount = Number(safeOrder.paymentInfo.paidAmount);
  } else if (safeOrder.paymentInfo?.amount !== undefined && Number(safeOrder.paymentInfo.amount) > 0) {
    paidAmount = Number(safeOrder.paymentInfo.amount);
  }

  // Grand Total = Net Product Price + (Weight × Shipping Rate) + China Courier Bill
  const grandTotal = netProductPrice + shippingCharge + chinaCourier;

  // Final Invoice Payable = Grand Total - Partial Paid
  const totalDue = Math.max(0, grandTotal - paidAmount);
  const paymentNow = totalDue;

  const rawDate = inv.orderDate || inv.invoiceDate || safeOrder.date || safeOrder.createdAt;
  let formattedDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (rawDate) {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      formattedDate = parsed.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } else {
      formattedDate = String(rawDate);
    }
  }

  const productSummaryName =
    inv.productName ||
    safeOrder.productName ||
    items.map((i) => i.description).join(", ");

  const paymentMethod =
    inv.paymentMethod ||
    safeOrder.paymentInfo?.method ||
    safeOrder.paymentMethod ||
    safeOrder.customerInfo?.payment ||
    "bKash / Online";

  const paymentStatus =
    inv.paymentStatus === "Fully Paid" || (safeOrder.status === "Delivered" && totalDue === 0)
      ? "Paid"
      : paidAmount > 0
      ? "Partial Paid"
      : "Unpaid";

  const resolvedTracking =
    inv.trackingNumber ||
    safeOrder.trackingNumber ||
    safeOrder.purchaseInfo?.trackingNumber ||
    safeOrder.chinaWarehouseInfo?.chinaAwb ||
    safeOrder.deliveryInfo?.trackingNumber ||
    "";

  const resolved1688Id =
    inv.order1688Id ||
    safeOrder.order1688Id ||
    safeOrder.purchaseInfo?.order1688Id ||
    safeOrder.purchaseInfo?.orderSupplierId ||
    "";

  return {
    id: inv.id || `inv-${canonicalOrderId}`,
    orderId: canonicalOrderId,
    mainOrderId: safeOrder.mainOrderId || inv.mainOrderId || canonicalOrderId,
    linkCount: safeOrder.linkCount || inv.linkCount || (safeOrder.subOrders ? safeOrder.subOrders.length : 1),
    subOrders: safeOrder.subOrders || inv.subOrders || [],
    invoiceNumber: syncedInvoiceNumber,
    orderDate: formattedDate,
    trackingNumber: resolvedTracking,
    order1688Id: resolved1688Id,
    customerName:
      inv.customerName ||
      safeOrder.customerInfo?.name ||
      safeOrder.customerName ||
      "Valued Customer",
    address:
      inv.address ||
      safeOrder.customerInfo?.address ||
      safeOrder.shippingAddress ||
      safeOrder.address ||
      "Dhaka, Bangladesh",
    district:
      inv.district ||
      safeOrder.customerInfo?.division ||
      safeOrder.customerInfo?.district ||
      "Dhaka",
    city: inv.city || safeOrder.customerInfo?.city || "Dhaka",
    phone:
      inv.phone ||
      safeOrder.customerInfo?.phone ||
      safeOrder.phone ||
      "N/A",
    email:
      inv.email ||
      safeOrder.customerInfo?.email ||
      safeOrder.email ||
      "",
    contactEmail: inv.contactEmail || "worldbuybd01@gmail.com",
    emergencyContact: inv.emergencyContact || safeOrder.customerInfo?.phone || "N/A",
    productName: productSummaryName,
    items,
    shippingMethod: inv.shippingMethod || safeOrder.shippingMethod || "Air Cargo (7-12 Days)",
    shippingRate: shippingRatePerKg,
    shippingRatePerKg,
    weight: weightStr,
    weightApx: weightStr,
    weightKg: parsedWeightKg,
    weightAmount: shippingCharge,
    chinaCounterCharge: chinaCourier,
    chinaCourier,
    chinaCourierCharge: chinaCourier,
    shippingCharge,
    discount,
    subTotal,
    productSubtotal: subTotal,
    totalProductQty,
    paymentNow,
    grandTotal,
    paidAmount,
    totalDue,
    dueAmount: totalDue,
    paymentStatus,
    paymentMethod: String(paymentMethod).toUpperCase(),
    transactionId:
      inv.transactionId ||
      safeOrder.paymentInfo?.transactionId ||
      "",
    status: safeOrder.status || inv.status || "Pending",
    adminChargesUploaded,
    shippingPaymentPolicy: inv.shippingPaymentPolicy || DEFAULT_SHIPPING_PAYMENT_POLICY,
    returnRefundPolicy: inv.returnRefundPolicy || DEFAULT_RETURN_REFUND_POLICY,
    footerNote:
      inv.footerNote ||
      "Thank you for shopping with World Buy BD! Direct China Factory Sourcing & Logistics Partner.",
  };
}

/**
 * Builds a standalone, dedicated invoice for an individual Sub-Order / Product Link
 * Provides distinct calculations (Subtotal, Partial Paid, Shipping Charge, Courier, Due)
 */
export function buildSubOrderInvoice(
  order: any, 
  subOrderId: string, 
  existingInvoice?: any
): CustomInvoiceData {
  const safeOrder = order || {};
  const canonicalOrderId = String(safeOrder.mainOrderId || safeOrder.orderId || safeOrder.id || "WBBD-000000");
  const targetSubId = String(subOrderId || "").trim();

  // Find sub-order metadata from safeOrder.subOrders
  const subOrders: any[] = Array.isArray(safeOrder.subOrders) ? safeOrder.subOrders : [];
  const subOrder = subOrders.find(s => s.subOrderId === targetSubId || s.linkKey === targetSubId);
  const linkIndex = subOrder?.linkIndex || 1;

  // Filter items for this sub-order
  const rawOrderItems = Array.isArray(safeOrder.items) ? safeOrder.items : [];
  const matchingItems = rawOrderItems.filter(it => 
    it.subOrderId === targetSubId || 
    (subOrder && (it.productLink === subOrder.productLink || it.linkKey === subOrder.linkKey))
  );
  const itemsToUse = matchingItems.length > 0 ? matchingItems : (subOrder?.items || rawOrderItems);

  // Calculate items subtotal and total quantity for this specific link
  const items: InvoiceItem[] = itemsToUse.map((item: any, idx: number) => {
    const qty = Number(item.quantity ?? 1) || 1;
    const uPrice = Number(item.unitPrice ?? item.price ?? 0);
    const tPrice = Number(item.totalPrice ?? (qty * uPrice));
    const variationStr = item.variation || [item.selectedColor, item.selectedSize, item.variantName].filter(Boolean).join(" / ") || "";

    return {
      no: idx + 1,
      image: item.image || item.variantImage || subOrder?.productImage || "",
      description: item.description || item.name || subOrder?.productName || "Imported Product",
      variation: variationStr,
      quantity: qty,
      rate: uPrice,
      amount: tPrice,
      unitPrice: uPrice,
      totalPrice: tPrice,
      subOrderId: targetSubId,
      productLink: subOrder?.productLink || item.productLink || item.importedUrl || "",
    };
  });

  const subTotal = items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
  const totalProductQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0) || 1;

  // Link specific shipping and courier calculations
  const linkRatePerKg = Number(subOrder?.shippingRatePerKg || safeOrder.shippingRatePerKg || 780);
  const rawWeight = subOrder?.weight || subOrder?.weightKg || "0";
  const parsedWeightKg = parseFloat(String(rawWeight).replace(/[^0-9.]/g, "")) || 0;
  const weightStr = parsedWeightKg > 0 ? `${parsedWeightKg} KG` : "0 KG";

  const adminChargesUploaded = Boolean(
    safeOrder.adminChargesUploaded === true ||
    (subOrder && (subOrder.chinaCourierBill > 0 || subOrder.shippingCharge > 0 || parsedWeightKg > 0))
  );

  const chinaCourier = adminChargesUploaded ? Number(subOrder?.chinaCourierBill || 0) : 0;
  const shippingCharge = adminChargesUploaded 
    ? (subOrder?.shippingCharge ? Number(subOrder.shippingCharge) : Math.round(parsedWeightKg * linkRatePerKg))
    : 0;

  // Paid amount for this specific link: 100% of product price is collected upfront as Partial Paid
  const paidAmount = subTotal;
  const grandTotal = subTotal + shippingCharge + chinaCourier;
  const totalDue = Math.max(0, grandTotal - paidAmount);

  const syncedInvoiceNumber = `INV-${targetSubId}`;
  const rawDate = safeOrder.date || safeOrder.createdAt || new Date().toISOString();
  const formattedDate = new Date(rawDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return {
    id: `inv-${targetSubId}`,
    orderId: targetSubId,
    mainOrderId: canonicalOrderId,
    subOrderId: targetSubId,
    isSubOrderInvoice: true,
    linkIndex,
    productLink: subOrder?.productLink || items[0]?.productLink || "",
    invoiceNumber: syncedInvoiceNumber,
    orderDate: formattedDate,
    trackingNumber: subOrder?.trackingNumber || safeOrder.trackingNumber || "",
    order1688Id: subOrder?.order1688Id || safeOrder.order1688Id || "",
    customerName: safeOrder.customerInfo?.name || "Valued Customer",
    address: safeOrder.customerInfo?.address || "Dhaka, Bangladesh",
    district: safeOrder.customerInfo?.division || "Dhaka",
    city: safeOrder.customerInfo?.city || "Dhaka",
    phone: safeOrder.customerInfo?.phone || "N/A",
    email: safeOrder.customerInfo?.email || "",
    contactEmail: "worldbuybd01@gmail.com",
    emergencyContact: safeOrder.customerInfo?.phone || "N/A",
    productName: subOrder?.productName || items[0]?.description || "Imported Product",
    items,
    shippingMethod: "Air Cargo (7-12 Days)",
    shippingRate: linkRatePerKg,
    shippingRatePerKg: linkRatePerKg,
    weight: weightStr,
    weightApx: weightStr,
    weightKg: parsedWeightKg,
    weightAmount: shippingCharge,
    chinaCounterCharge: chinaCourier,
    chinaCourier,
    chinaCourierCharge: chinaCourier,
    shippingCharge,
    discount: 0,
    subTotal,
    productSubtotal: subTotal,
    totalProductQty,
    paymentNow: totalDue,
    grandTotal,
    paidAmount,
    totalDue,
    dueAmount: totalDue,
    paymentStatus: safeOrder.status === "Delivered" && totalDue === 0 ? "Paid" : "Partial Paid",
    paymentMethod: String(safeOrder.paymentInfo?.method || safeOrder.customerInfo?.payment || "Online").toUpperCase(),
    transactionId: safeOrder.paymentInfo?.transactionId || "",
    status: subOrder?.status || safeOrder.status || "Pending",
    adminChargesUploaded,
    shippingPaymentPolicy: DEFAULT_SHIPPING_PAYMENT_POLICY,
    returnRefundPolicy: DEFAULT_RETURN_REFUND_POLICY,
    footerNote: `This invoice covers Link #${linkIndex} (Sub-Order ${targetSubId}) under Main Order ${canonicalOrderId}.`
  };
}

export async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("data:image/")) return imageUrl;
  
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(img.naturalWidth || 120, 240);
          canvas.height = Math.min(img.naturalHeight || 120, 240);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL("image/jpeg", 0.8);
            resolve(dataURL);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
      // 1.5s timeout safeguard so PDF generation never blocks
      setTimeout(() => resolve(null), 1500);
    } catch {
      resolve(null);
    }
  });
}

function drawSingleInvoicePart(
  doc: jsPDF,
  invoice: CustomInvoiceData,
  startY: number,
  copyType: "CUSTOMER COPY" | "OFFICE COPY",
  preloadedImages?: Record<string, string>
) {
  const pageWidth = 210;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const isOffice = copyType === "OFFICE COPY";

  // Top Header Strip
  if (isOffice) {
    doc.setFillColor(30, 41, 59); // Slate-800 for Office Copy
  } else {
    doc.setFillColor(220, 38, 38); // Primary Red for Customer Copy
  }
  doc.roundedRect(margin, startY, contentWidth, 16, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("WORLD BUY BD", margin + 4, startY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "Kazipara, Mirpur-10, Dhaka-1216 | Hotline: +880 1355-136661 | worldbuybd.web.app",
    margin + 4,
    startY + 12.5
  );

  // Copy Badge in Center-Right
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + contentWidth - 46, startY + 3.5, 42, 9, 1.5, 1.5, "F");
  doc.setTextColor(isOffice ? 30 : 220, isOffice ? 41 : 38, isOffice ? 59 : 38);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(copyType, margin + contentWidth - 25, startY + 9.5, { align: "center" });

  let curY = startY + 19;

  // Customer & Order Meta Grid (2 Boxes)
  const colW = (contentWidth - 4) / 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, colW, 24, 1.5, 1.5, "FD");
  doc.roundedRect(margin + colW + 4, curY, colW, 24, 1.5, 1.5, "FD");

  // Left Box: Customer Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("CUSTOMER INFORMATION:", margin + 3, curY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(String(invoice.customerName || "Customer"), margin + 3, curY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: ${invoice.phone || "N/A"}`, margin + 3, curY + 14.5);
  const addrLines = doc.splitTextToSize(`Address: ${invoice.address || "Bangladesh"}`, colW - 6);
  doc.text(addrLines.slice(0, 2), margin + 3, curY + 19);

  // Right Box: Order ID, Invoice No, Weight, Status
  const rx = margin + colW + 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(220, 38, 38);
  const rightTitle = invoice.isSubOrderInvoice 
    ? `SUB-ORDER ID: ${invoice.subOrderId || invoice.orderId}`
    : `ORDER ID: ${invoice.orderId}`;
  doc.text(rightTitle, rx, curY + 5.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, rx, curY + 10);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Date: ${invoice.orderDate}   |   Weight: ${invoice.weightApx || "0.5 KG"}`, rx, curY + 14.5);
  doc.text(
    `Payment: ${invoice.paymentStatus || "Unpaid"} (${invoice.paymentMethod || "Online"})`,
    rx,
    curY + 19
  );
  doc.text(`Order Status: ${invoice.status || "Confirmed"}`, rx, curY + 23);

  curY += 27;

  // Products Table Header (With Photo Column)
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, curY, contentWidth, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("SL", margin + 2, curY + 4.2);
  doc.text("PHOTO", margin + 8, curY + 4.2);
  doc.text("PRODUCT NAME & SPECIFICATION", margin + 20, curY + 4.2);
  doc.text("QTY", margin + contentWidth - 52, curY + 4.2, { align: "center" });
  doc.text("UNIT PRICE", margin + contentWidth - 28, curY + 4.2, { align: "right" });
  doc.text("TOTAL (BDT)", margin + contentWidth - 3, curY + 4.2, { align: "right" });

  curY += 6;

  // Product Rows (up to 4 rows per half-page to fit both copies cleanly)
  const displayItems = (invoice.items || []).slice(0, 4);

  displayItems.forEach((it, idx) => {
    const rowH = 8.5;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, curY, contentWidth, rowH, "F");
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, curY + rowH, margin + contentWidth, curY + rowH);

    // SL
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(String(it.no || idx + 1), margin + 2.5, curY + 5.5);

    // Photo Thumbnail
    const imgKey = it.image || "";
    const imgData = preloadedImages?.[imgKey] || (it as any).imageBase64;
    if (imgData) {
      try {
        doc.addImage(imgData, "JPEG", margin + 8, curY + 0.75, 7, 7);
      } catch {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin + 8, curY + 0.75, 7, 7, 1, 1, "F");
        doc.setFontSize(5);
        doc.setTextColor(148, 163, 184);
        doc.text("IMG", margin + 11.5, curY + 5, { align: "center" });
      }
    } else {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin + 8, curY + 0.75, 7, 7, 1, 1, "F");
      doc.setFontSize(5);
      doc.setTextColor(148, 163, 184);
      doc.text("IMG", margin + 11.5, curY + 5, { align: "center" });
    }

    // Product Title & Specs
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    const clippedTitle = it.description.length > 55 ? it.description.slice(0, 52) + "..." : it.description;
    doc.text(clippedTitle, margin + 18, curY + 3.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    const specStr = it.variation ? `Spec: ${it.variation}` : "Standard Wholesale Spec";
    const clippedSpec = specStr.length > 58 ? specStr.slice(0, 55) + "..." : specStr;
    doc.text(clippedSpec, margin + 18, curY + 7);

    // Quantity
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`${it.quantity} pcs`, margin + contentWidth - 52, curY + 5.5, { align: "center" });

    // Unit Price
    doc.setFont("helvetica", "normal");
    doc.text(`BDT ${Number(it.unitPrice || 0).toLocaleString()}`, margin + contentWidth - 28, curY + 5.5, {
      align: "right",
    });

    // Total
    doc.setFont("helvetica", "bold");
    doc.text(`BDT ${Number(it.totalPrice || 0).toLocaleString()}`, margin + contentWidth - 3, curY + 5.5, {
      align: "right",
    });

    curY += rowH;
  });

  if ((invoice.items || []).length > 4) {
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`+ ${(invoice.items || []).length - 4} more item(s) included in this order`, margin + 18, curY + 4);
    curY += 5;
  }

  curY += 2;

  // Bottom Summary: Left Logistics/Office Box + Right Financial Breakdown
  const summaryStartY = curY;
  const calcW = 78;
  const calcX = margin + contentWidth - calcW;

  // Left Note / Verification Box
  const leftW = contentWidth - calcW - 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, summaryStartY, leftW, 33, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isOffice ? "OFFICE & DISPATCH RECORD (INTERNAL USE)" : "LOGISTICS & PAYMENT SUMMARY",
    margin + 3,
    summaryStartY + 5
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `• Total Qty: ${invoice.totalProductQty} pcs  |  Weight: ${invoice.weightApx || "0.5 KG"}`,
    margin + 3,
    summaryStartY + 10
  );
  doc.text(
    `• China Courier Bill: BDT ${Number(invoice.chinaCourier || 0).toLocaleString()}  |  Shipping: BDT ${Number(invoice.shippingCharge || 0).toLocaleString()}`,
    margin + 3,
    summaryStartY + 14.5
  );
  doc.text(
    `• Paid Amount: BDT ${Number(invoice.paidAmount || 0).toLocaleString()}  |  Due Balance: BDT ${Number(invoice.totalDue || 0).toLocaleString()}`,
    margin + 3,
    summaryStartY + 19
  );
  if (isOffice) {
    doc.text(
      `• TrxID: ${invoice.transactionId || "N/A"}  |  Checked By: ____________  |  Courier: ____________`,
      margin + 3,
      summaryStartY + 24
    );
  } else {
    doc.text(
      `• bKash/Nagad: 01712-345678 | South East Bank PLC A/C: 002412100022424 (Md Shamim Hossen)`,
      margin + 3,
      summaryStartY + 24
    );
  }
  doc.text("Customer Sign: ___________________       Authorized Sign: ___________________", margin + 3, summaryStartY + 30.5);

  // Right Financial Breakdown Lines
  let lineY = summaryStartY + 4;
  const drawStat = (label: string, val: string, bold = false, color?: [number, number, number]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(7.2);
    if (color) {
      doc.setTextColor(color[0], color[1], color[2]);
    } else {
      doc.setTextColor(bold ? 15 : 71, bold ? 23 : 85, bold ? 42 : 105);
    }
    doc.text(label, calcX + 2, lineY);
    doc.text(val, calcX + calcW - 2, lineY, { align: "right" });
    lineY += 4.8;
  };

  drawStat("Product Price (Sub Total):", `BDT ${Number(invoice.subTotal || 0).toLocaleString()}`);
  drawStat("China Courier Bill:", `BDT ${Number(invoice.chinaCourier || 0).toLocaleString()}`);
  drawStat(`Shipping Charge (${invoice.weightApx || "Weight"}):`, `BDT ${Number(invoice.shippingCharge || 0).toLocaleString()}`);
  if (invoice.discount && invoice.discount > 0) {
    drawStat("Discount:", `- BDT ${Number(invoice.discount).toLocaleString()}`, false, [16, 185, 129]);
  }
  doc.setDrawColor(203, 213, 225);
  doc.line(calcX, lineY - 3, calcX + calcW, lineY - 3);
  drawStat("Grand Total:", `BDT ${Number(invoice.grandTotal || 0).toLocaleString()}`, true, [15, 23, 42]);
  drawStat("Paid Amount:", `BDT ${Number(invoice.paidAmount || 0).toLocaleString()}`, true, [5, 150, 105]);
  drawStat("Due / Payable:", `BDT ${Number(invoice.totalDue || 0).toLocaleString()}`, true, [220, 38, 38]);
}

export function generateCustomInvoicePdf(
  invoice: CustomInvoiceData,
  copyMode: "both" | "customer" | "office" = "both",
  preloadedImages?: Record<string, string>
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  if (copyMode === "customer") {
    // Customer Mini Invoice Only (Single Copy)
    drawSingleInvoicePart(doc, invoice, 12, "CUSTOMER COPY", preloadedImages);
    return doc;
  }

  if (copyMode === "office") {
    // Office Copy Only
    drawSingleInvoicePart(doc, invoice, 12, "OFFICE COPY", preloadedImages);
    return doc;
  }

  // Default ('both'): Part 1 CUSTOMER INVOICE + Part 2 OFFICE INVOICE (for Admin Panel)
  drawSingleInvoicePart(doc, invoice, 10, "CUSTOMER COPY", preloadedImages);

  // Perforated Cut Line in the middle of A4 (Y = 148.5mm)
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(10, 148.5, 200, 148.5);
  doc.setLineDashPattern([], 0);

  doc.setFillColor(255, 255, 255);
  doc.rect(75, 145.5, 60, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("✂  CUT HERE (CUSTOMER / OFFICE COPY)  ✂", 105, 149.5, { align: "center" });

  // Part 2: OFFICE INVOICE (Bottom Half)
  drawSingleInvoicePart(doc, invoice, 154, "OFFICE COPY", preloadedImages);

  return doc;
}

export async function downloadCustomInvoicePdf(
  invoice: CustomInvoiceData,
  copyMode: "both" | "customer" | "office" = "both"
): Promise<boolean> {
  try {
    const preloadedImages: Record<string, string> = {};
    const items = (invoice.items || []).slice(0, 4);

    // Preload product images to base64 so they appear clearly in the downloaded invoice PDF
    await Promise.all(
      items.map(async (it) => {
        if (it.image) {
          const b64 = await getBase64ImageFromUrl(it.image);
          if (b64) {
            preloadedImages[it.image] = b64;
          }
        }
      })
    );

    const doc = generateCustomInvoicePdf(invoice, copyMode, preloadedImages);
    const cleanId = (invoice.orderId || invoice.invoiceNumber || "Invoice").replace(/[^a-zA-Z0-9-_]/g, "");
    const prefix = copyMode === "customer" ? "Customer-Invoice" : "WorldBuyBD-Invoice";
    doc.save(`${prefix}-${cleanId}.pdf`);
    return true;
  } catch (error) {
    console.error("Failed to generate PDF with images, retrying fallback:", error);
    try {
      const fallbackDoc = generateCustomInvoicePdf(invoice, copyMode);
      const cleanId = (invoice.orderId || invoice.invoiceNumber || "Invoice").replace(/[^a-zA-Z0-9-_]/g, "");
      fallbackDoc.save(`Invoice-${cleanId}.pdf`);
      return true;
    } catch (e) {
      console.error("Critical PDF failure:", e);
      return false;
    }
  }
}
