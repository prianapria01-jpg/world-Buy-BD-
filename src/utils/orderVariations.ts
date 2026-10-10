export interface OrderedVariantDetail {
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  skuId?: string;
  cartItemId?: string;
  orderId?: string;
  subOrderId?: string;
  mainOrderId?: string;
  productLink?: string;
  customerName?: string;
  customerPhone?: string;
  orderDate?: string;
  status?: string;
}

export interface SubOrder {
  subOrderId: string;             // e.g. "WBBD-748920-L1"
  mainOrderId: string;            // e.g. "WBBD-748920"
  linkIndex: number;              // 1, 2, 3...
  linkKey: string;                // normalized unique key for this product link
  productLink: string;            // direct URL to product / 1688 / store
  isExternalLink: boolean;        // true if external 1688 or external URL
  offerId?: string;               // 1688 offer ID if present
  productId: string;              // product ID
  productName: string;            // product title
  productImage: string;           // product main image
  category?: string;              // category
  items: any[];                   // variations / items belonging to this specific link
  totalPieces: number;            // total items quantity under this link
  totalVariationsCount: number;   // number of unique variations under this link
  subtotal: number;               // total price BDT for this link
  shippingRatePerKg: number;      // assigned shipping rate BDT / KG
  weight?: string;                // e.g. "1.5 KG"
  weightKg?: number;              // 1.5
  shippingCharge?: number;        // weight * rate
  chinaCourierBill?: number;      // courier charge
  status: string;                 // "Pending", "Order Confirmed", "Purchased", etc.
  order1688Id?: string;           // supplier 1688 order ID for this link
  trackingNumber?: string;        // tracking number for this link
  createdAt?: string;
}

export interface ProductLinkGroup {
  key: string;
  subOrderId?: string;
  mainOrderId?: string;
  url: string;
  offerId?: string;
  isExternal: boolean;
  productId: string;
  productName: string;
  productImage: string;
  category?: string;
  totalVariationsCount: number;
  totalPieces: number;
  totalAmount: number;
  variations: OrderedVariantDetail[];
  orderIds: string[];
  shippingRatePerKg?: number;
  chinaCourierBill?: number;
  status?: string;
  order1688Id?: string;
  trackingNumber?: string;
}

/**
 * Extracts and normalizes the source link for any item or product
 */
export function extractProductLink(item: any): { 
  url: string; 
  isExternal: boolean; 
  offerId?: string;
  linkKey: string;
  productId: string;
} {
  if (!item) return { url: "", isExternal: false, linkKey: "unknown", productId: "unknown" };

  const rawUrl = String(item.importedUrl || item.sourceUrl || item.productUrl || "").trim();
  const rawOfferId = item.offerId ? String(item.offerId).replace(/^abb-/, "").trim() : "";
  const rawProdId = String(item.id || item.productId || "").replace(/^abb-/, "").trim();

  // 1. If explicit HTTP/HTTPS link exists
  if (rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"))) {
    // Extract offer ID from 1688 url if present
    const urlMatch = rawUrl.match(/offer\/(\d+)\.html/i) || rawUrl.match(/(\d{10,})/);
    const resolvedOffer = rawOfferId || (urlMatch ? urlMatch[1] : "");
    const key = resolvedOffer ? `offer-${resolvedOffer}` : rawUrl.toLowerCase();
    return {
      url: rawUrl,
      isExternal: true,
      offerId: resolvedOffer || undefined,
      linkKey: key,
      productId: rawProdId || resolvedOffer || "item"
    };
  }

  // 2. If offerId is present, resolve to standard 1688 detail URL
  if (rawOfferId) {
    return {
      url: `https://detail.1688.com/offer/${rawOfferId}.html`,
      isExternal: true,
      offerId: rawOfferId,
      linkKey: `offer-${rawOfferId}`,
      productId: rawProdId || rawOfferId
    };
  }

  // 3. Fallback to store product route
  const prodId = rawProdId || "item";
  return {
    url: `/product/abb-${prodId}`,
    isExternal: false,
    linkKey: `prod-${prodId}`,
    productId: prodId
  };
}

/**
 * Builds separate Sub-Orders for each distinct product link from an order's items list
 * Each distinct link gets its own Sub-Order ID: e.g. `${mainOrderId}-L1`, `${mainOrderId}-L2`
 */
export function buildSubOrdersFromItems(
  items: any[], 
  mainOrderId: string, 
  orderMeta?: any
): SubOrder[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const canonicalMainId = String(mainOrderId || "WBBD-000000").trim();
  const groupsMap = new Map<string, {
    linkKey: string;
    url: string;
    isExternal: boolean;
    offerId?: string;
    productId: string;
    productName: string;
    productImage: string;
    category?: string;
    items: any[];
    totalPieces: number;
    subtotal: number;
    shippingRatePerKg: number;
  }>();

  items.forEach((item, idx) => {
    const { url, isExternal, offerId, linkKey, productId } = extractProductLink(item);
    const qty = Number(item.quantity || 1) || 1;
    const price = Number(item.price || item.unitPrice || 0) || 0;
    const ratePerKg = Number(item.shippingRatePerKg || orderMeta?.shippingRatePerKg || 780);

    if (!groupsMap.has(linkKey)) {
      groupsMap.set(linkKey, {
        linkKey,
        url,
        isExternal,
        offerId,
        productId,
        productName: item.name || item.title || "Imported Product",
        productImage: item.image || item.variantImage || "",
        category: item.category || "General",
        items: [],
        totalPieces: 0,
        subtotal: 0,
        shippingRatePerKg: ratePerKg
      });
    }

    const grp = groupsMap.get(linkKey)!;
    grp.items.push(item);
    grp.totalPieces += qty;
    grp.subtotal += (price * qty);
    if (ratePerKg) grp.shippingRatePerKg = ratePerKg;
  });

  const subOrders: SubOrder[] = [];
  let linkIdx = 1;

  for (const [, grp] of groupsMap.entries()) {
    const subOrderId = `${canonicalMainId}-L${linkIdx}`;
    
    // Tag each item with its assigned subOrderId, mainOrderId and productLink
    grp.items.forEach(it => {
      it.subOrderId = subOrderId;
      it.mainOrderId = canonicalMainId;
      it.productLink = grp.url;
      it.linkKey = grp.linkKey;
    });

    // Check if order already has link-specific tracking/status
    const existingSub = Array.isArray(orderMeta?.subOrders) 
      ? orderMeta.subOrders.find((s: any) => s.linkKey === grp.linkKey || s.subOrderId === subOrderId)
      : null;

    subOrders.push({
      subOrderId,
      mainOrderId: canonicalMainId,
      linkIndex: linkIdx,
      linkKey: grp.linkKey,
      productLink: grp.url,
      isExternalLink: grp.isExternal,
      offerId: grp.offerId,
      productId: grp.productId,
      productName: grp.productName,
      productImage: grp.productImage,
      category: grp.category,
      items: grp.items,
      totalPieces: grp.totalPieces,
      totalVariationsCount: grp.items.length,
      subtotal: grp.subtotal,
      shippingRatePerKg: grp.shippingRatePerKg,
      weight: existingSub?.weight || "0 KG",
      weightKg: existingSub?.weightKg || 0,
      shippingCharge: existingSub?.shippingCharge || 0,
      chinaCourierBill: existingSub?.chinaCourierBill || 0,
      status: existingSub?.status || orderMeta?.status || "Pending",
      order1688Id: existingSub?.order1688Id || orderMeta?.order1688Id || "",
      trackingNumber: existingSub?.trackingNumber || orderMeta?.trackingNumber || "",
      createdAt: orderMeta?.createdAt || orderMeta?.date || new Date().toISOString()
    });

    linkIdx++;
  }

  return subOrders;
}

/**
 * Enriches an existing or new order record with canonical mainOrderId, subOrders array, and linkCount
 */
export function enrichOrderWithSubOrders(order: any): any {
  if (!order) return order;

  const canonicalId = String(order.mainOrderId || order.orderId || order.id || "").trim();
  const rawItems = Array.isArray(order.items) ? order.items : [];

  let subOrders: SubOrder[] = [];
  if (Array.isArray(order.subOrders) && order.subOrders.length > 0) {
    subOrders = order.subOrders.map((sub: any, idx: number) => ({
      ...sub,
      mainOrderId: canonicalId,
      subOrderId: sub.subOrderId || `${canonicalId}-L${idx + 1}`
    }));
  } else {
    subOrders = buildSubOrdersFromItems(rawItems, canonicalId, order);
  }

  return {
    ...order,
    id: canonicalId,
    orderId: canonicalId,
    mainOrderId: canonicalId,
    isMainOrder: true,
    linkCount: subOrders.length,
    subOrders
  };
}

/**
 * Groups items within a single order by their source link / product
 */
export function groupOrderItemsByLink(
  items: any[], 
  orderMeta?: { orderId?: string; customerName?: string; customerPhone?: string; status?: string; orderDate?: string }
): ProductLinkGroup[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const groupsMap = new Map<string, ProductLinkGroup>();

  items.forEach((item, idx) => {
    const { url, isExternal, offerId } = extractProductLink(item);
    const prodId = String(item.id || item.productId || `item-${idx}`);
    // Group key is primarily the external URL if available, else product ID
    const groupKey = url && isExternal ? url : prodId;

    const variantName = item.variantName || item.variant || item.skuName || "Standard Variant";
    const variantImage = item.variantImage || item.image || "";
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.price || item.unitPrice) || 0;
    const totalPrice = unitPrice * qty;

    const variantDetail: OrderedVariantDetail = {
      name: variantName,
      image: variantImage,
      quantity: qty,
      unitPrice,
      totalPrice,
      skuId: item.skuId || item.variantSkuId || `sku-${idx}`,
      cartItemId: item.cartItemId || `${prodId}-${variantName}`,
      orderId: orderMeta?.orderId,
      customerName: orderMeta?.customerName,
      customerPhone: orderMeta?.customerPhone,
      orderDate: orderMeta?.orderDate,
      status: orderMeta?.status
    };

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, {
        key: groupKey,
        url: url || `/product/${prodId}`,
        offerId,
        isExternal,
        productId: prodId,
        productName: item.name || "Product",
        productImage: item.image || variantImage || "",
        category: item.category || "General",
        totalVariationsCount: 0,
        totalPieces: 0,
        totalAmount: 0,
        variations: [],
        orderIds: orderMeta?.orderId ? [orderMeta.orderId] : []
      });
    }

    const grp = groupsMap.get(groupKey)!;
    grp.variations.push(variantDetail);
    grp.totalPieces += qty;
    grp.totalAmount += totalPrice;
    grp.totalVariationsCount = grp.variations.length;
    if (orderMeta?.orderId && !grp.orderIds.includes(orderMeta.orderId)) {
      grp.orderIds.push(orderMeta.orderId);
    }
  });

  const linkGroups = Array.from(groupsMap.values());
  linkGroups.forEach((grp, gIdx) => {
    if (orderMeta?.orderId) {
      grp.mainOrderId = orderMeta.orderId;
      grp.subOrderId = `${orderMeta.orderId}-L${gIdx + 1}`;
    }
  });

  return linkGroups;
}

/**
 * Groups items across multiple orders by their source link / product
 * Perfect for the China Purchasing / Procurement team
 */
export function groupAllOrdersByLink(orders: any[]): ProductLinkGroup[] {
  if (!Array.isArray(orders) || orders.length === 0) return [];

  const groupsMap = new Map<string, ProductLinkGroup>();

  orders.forEach((order) => {
    const orderMeta = {
      orderId: order.id,
      customerName: order.customerInfo?.name || "Customer",
      customerPhone: order.customerInfo?.phone || "",
      orderDate: order.date,
      status: order.status
    };

    const orderGroups = groupOrderItemsByLink(order.items || [], orderMeta);

    orderGroups.forEach((grp) => {
      if (!groupsMap.has(grp.key)) {
        groupsMap.set(grp.key, {
          key: grp.key,
          url: grp.url,
          offerId: grp.offerId,
          isExternal: grp.isExternal,
          productId: grp.productId,
          productName: grp.productName,
          productImage: grp.productImage,
          category: grp.category,
          totalVariationsCount: 0,
          totalPieces: 0,
          totalAmount: 0,
          variations: [],
          orderIds: []
        });
      }

      const masterGrp = groupsMap.get(grp.key)!;
      masterGrp.variations.push(...grp.variations);
      masterGrp.totalPieces += grp.totalPieces;
      masterGrp.totalAmount += grp.totalAmount;
      masterGrp.totalVariationsCount = masterGrp.variations.length;
      grp.orderIds.forEach(id => {
        if (!masterGrp.orderIds.includes(id)) masterGrp.orderIds.push(id);
      });
    });
  });

  return Array.from(groupsMap.values());
}

/**
 * Creates a sample demo order with 1 product link and 10 variations
 * For testing and verification of the user's specific scenario
 */
export function generateTenVariationsDemoOrder(): any {
  const timestamp = Date.now();
  const sampleOfferId = "701886884877";
  const linkUrl = `https://worldbuybd.com/product/wholesale-${sampleOfferId}`;
  const baseImg = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300";

  const tenVariations = [
    { name: "Black - Size: M", qty: 2, price: 550, sku: "SKU-BLK-M", img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300" },
    { name: "Black - Size: L", qty: 4, price: 550, sku: "SKU-BLK-L", img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300" },
    { name: "Black - Size: XL", qty: 3, price: 580, sku: "SKU-BLK-XL", img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300" },
    { name: "White - Size: S", qty: 1, price: 550, sku: "SKU-WHT-S", img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300" },
    { name: "White - Size: M", qty: 5, price: 550, sku: "SKU-WHT-M", img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300" },
    { name: "White - Size: L", qty: 3, price: 550, sku: "SKU-WHT-L", img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300" },
    { name: "Navy Blue - Size: L", qty: 4, price: 560, sku: "SKU-NAV-L", img: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300" },
    { name: "Navy Blue - Size: XL", qty: 2, price: 580, sku: "SKU-NAV-XL", img: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300" },
    { name: "Olive Green - Size: M", qty: 2, price: 550, sku: "SKU-OLV-M", img: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300" },
    { name: "Maroon - Size: XL", qty: 3, price: 580, sku: "SKU-MRN-XL", img: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=300" }
  ];

  const items = tenVariations.map((v, i) => ({
    id: `prod-wholesale-${sampleOfferId}`,
    offerId: sampleOfferId,
    name: "Factory Premium Cotton Polo T-Shirt (Heavyweight Cotton Polo)",
    importedUrl: linkUrl,
    variantName: v.name,
    variantImage: v.img,
    variantSkuId: v.sku,
    cartItemId: `prod-${sampleOfferId}-${v.sku}`,
    price: v.price,
    quantity: v.qty,
    category: "Men's Fashion",
    image: v.img
  }));

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: `ORD-DEMO-${timestamp.toString().slice(-6)}`,
    date: new Date().toISOString(),
    status: "Pending",
    paymentStatus: "Paid",
    total,
    items,
    customerInfo: {
      name: "Radowan Ahmed (Demo Buyer)",
      phone: "01712345678",
      email: "radowan375123@gmail.com",
      address: "House #45, Road #12, Dhanmondi, Dhaka",
      division: "Dhaka",
      postalCode: "1205"
    },
    paymentInfo: {
      method: "bkash",
      transactionId: `TRX${timestamp.toString().slice(-8)}`,
      senderNumber: "01712345678",
      submittedAt: new Date().toISOString()
    },
    demoNote: `Demo order with 1 product link and 10 variations (total ${totalPieces} pcs)`
  };
}
