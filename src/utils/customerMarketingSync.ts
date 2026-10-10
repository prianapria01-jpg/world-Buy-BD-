/**
 * Customer Marketing Manager Auto-Assignment & Synchronization Service
 * 
 * Rules:
 * 1. Once a customer phone number is assigned a Marketing Manager (KAM), 
 *    that phone number is permanently remembered.
 * 2. ANY subsequent order placed with that phone number automatically gets
 *    assigned to that same Marketing Manager.
 * 3. All historical & existing orders for that phone number stay synchronized.
 */

export function normalizeCustomerPhone(raw: any): string {
  if (!raw) return "";
  // Convert Bengali numerals to ASCII numerals
  let str = String(raw).replace(/[\u09E6-\u09EF]/g, (d) => String(d.charCodeAt(0) - 0x09E6)).trim();
  if (str.includes("@")) return str.toLowerCase().trim();

  // Strip all non-digit characters
  const digits = str.replace(/\D/g, "");
  if (!digits) return str.trim();

  // If 88017... (13 digits)
  if (digits.startsWith("880") && digits.length === 13) {
    return "0" + digits.substring(3);
  }
  // If 00880... (15 digits)
  if (digits.startsWith("00880") && digits.length === 15) {
    return "0" + digits.substring(5);
  }
  // If 10 digits starting with 1 (e.g. 1712345678)
  if (digits.length === 10 && digits.startsWith("1")) {
    return "0" + digits;
  }
  // If 11 digits starting with 01
  if (digits.length === 11 && digits.startsWith("01")) {
    return digits;
  }
  return digits || str;
}

export function getCustomerPhoneTail(raw: any): string {
  if (!raw) return "";
  const str = String(raw).replace(/[\u09E6-\u09EF]/g, (d) => String(d.charCodeAt(0) - 0x09E6)).trim();
  const digits = str.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function extractOrderPhone(order: any): string {
  if (!order) return "";
  return String(
    order.customerInfo?.phone ||
    order.userPhone ||
    order.customerPhone ||
    order.phone ||
    order.invoice?.phone ||
    order.paymentInfo?.customerInfo?.phone ||
    ""
  ).trim();
}

export function extractOrderUserId(order: any): string {
  if (!order) return "";
  return String(
    order.userId ||
    order.customerInfo?.userId ||
    order.customerInfo?.id ||
    order.paymentInfo?.userId ||
    ""
  ).trim();
}

export interface MarketingStaffProfile {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  department?: string;
  assignedAt?: string;
  assignedBy?: string;
}

export interface MarketingAssignmentResult {
  assignedMarketingStaff: MarketingStaffProfile;
  assignedMarketingId: string;
  assignedMarketingName: string;
}

/**
 * Look up the assigned marketing manager for a phone number or userId
 */
export function findAssignedMarketingForCustomer(
  db: any,
  rawPhone: any,
  rawUserId?: any
): MarketingAssignmentResult | null {
  if (!db) return null;

  const phone = normalizeCustomerPhone(rawPhone);
  const tail = getCustomerPhoneTail(rawPhone);
  const userId = rawUserId ? String(rawUserId).trim() : "";

  db.customerAssignments = db.customerAssignments || {};
  const assignments = db.customerAssignments;

  // 1. Direct lookup in customerAssignments
  const candidateKeys = [phone, tail, String(rawPhone || "").trim(), userId].filter(Boolean);
  for (const k of candidateKeys) {
    const entry = assignments[k];
    if (entry && (entry.assignedMarketingStaff?.name || entry.assignedMarketingName)) {
      const staff: MarketingStaffProfile = entry.assignedMarketingStaff || {
        id: entry.assignedMarketingId || "KAM",
        name: entry.assignedMarketingName,
        code: entry.code || "KAM",
        department: "sales"
      };
      return {
        assignedMarketingStaff: staff,
        assignedMarketingId: staff.id || entry.assignedMarketingId,
        assignedMarketingName: staff.name || entry.assignedMarketingName
      };
    }
  }

  // 2. Fuzzy match inside customerAssignments keys by phone tail
  if (tail && tail.length >= 8) {
    for (const [key, entry] of Object.entries(assignments)) {
      const keyTail = getCustomerPhoneTail(key);
      if (keyTail && keyTail === tail) {
        const val: any = entry;
        if (val && (val.assignedMarketingStaff?.name || val.assignedMarketingName)) {
          const staff: MarketingStaffProfile = val.assignedMarketingStaff || {
            id: val.assignedMarketingId || "KAM",
            name: val.assignedMarketingName,
            code: val.code || "KAM",
            department: "sales"
          };
          return {
            assignedMarketingStaff: staff,
            assignedMarketingId: staff.id || val.assignedMarketingId,
            assignedMarketingName: staff.name || val.assignedMarketingName
          };
        }
      }
    }
  }

  // 3. Scan existing orders for an order with this phone that already has an assigned marketing manager
  if (Array.isArray(db.orders) && (tail || userId)) {
    for (const o of db.orders) {
      if (!o) continue;
      const oStaff = o.assignedMarketingStaff;
      const oName = o.assignedMarketingName || oStaff?.name;
      const oId = o.assignedMarketingId || oStaff?.id;

      if (!oName) continue;

      const oPhone = extractOrderPhone(o);
      const oTail = getCustomerPhoneTail(oPhone);
      const oUid = extractOrderUserId(o);

      const matchesPhone = tail && oTail && (oTail === tail || (tail.length >= 10 && oTail.endsWith(tail.slice(-10))));
      const matchesUid = userId && oUid && oUid === userId;

      if (matchesPhone || matchesUid) {
        const staff: MarketingStaffProfile = {
          id: oId || "KAM",
          name: oName,
          code: oStaff?.code || "KAM",
          phone: oStaff?.phone || "",
          email: oStaff?.email || "",
          avatar: oStaff?.avatar || "",
          department: oStaff?.department || "sales",
          assignedAt: oStaff?.assignedAt || new Date().toISOString(),
          assignedBy: oStaff?.assignedBy || "Auto System"
        };

        // Cache into customerAssignments for ultra fast future retrieval
        if (phone) assignments[phone] = { assignedMarketingId: staff.id, assignedMarketingName: staff.name, assignedMarketingStaff: staff };
        if (tail) assignments[tail] = { assignedMarketingId: staff.id, assignedMarketingName: staff.name, assignedMarketingStaff: staff };

        return {
          assignedMarketingStaff: staff,
          assignedMarketingId: staff.id,
          assignedMarketingName: staff.name
        };
      }
    }
  }

  // 4. Scan registered users in db.users
  if (Array.isArray(db.users) && (tail || userId)) {
    for (const u of db.users) {
      if (!u) continue;
      const uStaff = u.assignedMarketingStaff;
      const uName = u.assignedMarketingName || uStaff?.name;
      const uId = u.assignedMarketingId || uStaff?.id;

      if (!uName) continue;

      const uPhone = String(u.phone || u.phoneNumber || "").trim();
      const uTail = getCustomerPhoneTail(uPhone);
      const uUid = String(u.uid || u.id || "").trim();

      const matchesPhone = tail && uTail && (uTail === tail || (tail.length >= 10 && uTail.endsWith(tail.slice(-10))));
      const matchesUid = userId && uUid && uUid === userId;

      if (matchesPhone || matchesUid) {
        const staff: MarketingStaffProfile = {
          id: uId || "KAM",
          name: uName,
          code: uStaff?.code || "KAM",
          phone: uStaff?.phone || "",
          email: uStaff?.email || "",
          avatar: uStaff?.avatar || "",
          department: uStaff?.department || "sales",
          assignedAt: uStaff?.assignedAt || new Date().toISOString(),
          assignedBy: uStaff?.assignedBy || "Auto System"
        };

        if (phone) assignments[phone] = { assignedMarketingId: staff.id, assignedMarketingName: staff.name, assignedMarketingStaff: staff };
        if (tail) assignments[tail] = { assignedMarketingId: staff.id, assignedMarketingName: staff.name, assignedMarketingStaff: staff };

        return {
          assignedMarketingStaff: staff,
          assignedMarketingId: staff.id,
          assignedMarketingName: staff.name
        };
      }
    }
  }

  return null;
}

/**
 * Register a marketing manager assignment to a phone number and sync ALL historical & future orders
 */
export function registerMarketingAssignment(
  db: any,
  params: {
    orderId?: string;
    orderIds?: string[];
    customerPhone?: string;
    userId?: string;
    assignedMarketingStaff: MarketingStaffProfile;
  }
): { updatedCount: number; matchedPhone: string } {
  if (!db) return { updatedCount: 0, matchedPhone: "" };

  const { orderId, orderIds, customerPhone, userId, assignedMarketingStaff } = params;
  if (!assignedMarketingStaff || !assignedMarketingStaff.name) {
    return { updatedCount: 0, matchedPhone: "" };
  }

  db.orders = db.orders || [];
  db.users = db.users || [];
  db.customerAssignments = db.customerAssignments || {};

  const targetOrderIds = new Set<string>();
  if (orderId) targetOrderIds.add(String(orderId).trim());
  if (Array.isArray(orderIds)) {
    orderIds.forEach((id: any) => targetOrderIds.add(String(id).trim()));
  }

  // Derive phone from target order if not provided explicitly
  let rawPhone = customerPhone || "";
  let rawUserId = userId || "";

  if (!rawPhone && targetOrderIds.size > 0) {
    for (const o of db.orders) {
      const oid = String(o.orderId || o.id || "").trim();
      if (targetOrderIds.has(oid)) {
        rawPhone = extractOrderPhone(o);
        if (!rawUserId) rawUserId = extractOrderUserId(o);
        if (rawPhone) break;
      }
    }
  }

  const normPhone = normalizeCustomerPhone(rawPhone);
  const tail = getCustomerPhoneTail(rawPhone);

  const staffPayload: MarketingStaffProfile = {
    ...assignedMarketingStaff,
    id: assignedMarketingStaff.id || "KAM",
    code: assignedMarketingStaff.code || "KAM",
    assignedAt: assignedMarketingStaff.assignedAt || new Date().toISOString()
  };

  // 1. Permanently remember this customer's phone number mapping
  if (normPhone) {
    db.customerAssignments[normPhone] = {
      assignedMarketingId: staffPayload.id,
      assignedMarketingName: staffPayload.name,
      assignedMarketingStaff: staffPayload
    };
  }
  if (tail) {
    db.customerAssignments[tail] = {
      assignedMarketingId: staffPayload.id,
      assignedMarketingName: staffPayload.name,
      assignedMarketingStaff: staffPayload
    };
  }
  if (rawPhone && rawPhone !== normPhone && rawPhone !== tail) {
    db.customerAssignments[rawPhone] = {
      assignedMarketingId: staffPayload.id,
      assignedMarketingName: staffPayload.name,
      assignedMarketingStaff: staffPayload
    };
  }
  if (rawUserId) {
    db.customerAssignments[rawUserId] = {
      assignedMarketingId: staffPayload.id,
      assignedMarketingName: staffPayload.name,
      assignedMarketingStaff: staffPayload
    };
  }

  let updatedCount = 0;

  // 2. Synchronize ALL orders that match targetOrderIds, OR match the customer phone/tail, OR match the userId
  db.orders = db.orders.map((o: any) => {
    const oid = String(o.orderId || o.id || "").trim();
    const oPhone = extractOrderPhone(o);
    const oTail = getCustomerPhoneTail(oPhone);
    const oUid = extractOrderUserId(o);

    const matchesId = targetOrderIds.has(oid);
    const matchesPhone = tail && oTail && (oTail === tail || (tail.length >= 10 && oTail.endsWith(tail.slice(-10))));
    const matchesUser = rawUserId && oUid && oUid === rawUserId;

    if (matchesId || matchesPhone || matchesUser) {
      updatedCount++;
      const updatedSubOrders = Array.isArray(o.subOrders)
        ? o.subOrders.map((so: any) => ({
            ...so,
            assignedMarketingStaff: staffPayload,
            assignedMarketingId: staffPayload.id,
            assignedMarketingName: staffPayload.name
          }))
        : o.subOrders;

      return {
        ...o,
        assignedMarketingStaff: staffPayload,
        assignedMarketingId: staffPayload.id,
        assignedMarketingName: staffPayload.name,
        subOrders: updatedSubOrders,
        updatedAt: new Date().toISOString()
      };
    }
    return o;
  });

  // 3. Synchronize user profile in db.users
  if (tail || rawUserId) {
    db.users = db.users.map((u: any) => {
      const uPhone = String(u.phone || u.phoneNumber || "").trim();
      const uTail = getCustomerPhoneTail(uPhone);
      const uUid = String(u.uid || u.id || "").trim();

      const matchesPhone = tail && uTail && (uTail === tail || (tail.length >= 10 && uTail.endsWith(tail.slice(-10))));
      const matchesUser = rawUserId && uUid && uUid === rawUserId;

      if (matchesPhone || matchesUser) {
        return {
          ...u,
          assignedMarketingStaff: staffPayload,
          assignedMarketingId: staffPayload.id,
          assignedMarketingName: staffPayload.name,
          updatedAt: new Date().toISOString()
        };
      }
      return u;
    });
  }

  return { updatedCount, matchedPhone: normPhone || rawPhone };
}

/**
 * Scan all orders and sync unassigned orders if another order with the same phone is already assigned
 */
export function syncAllOrdersByPhone(db: any): boolean {
  if (!db || !Array.isArray(db.orders)) return false;

  let mutated = false;
  db.customerAssignments = db.customerAssignments || {};

  // First pass: populate customerAssignments from any already-assigned orders
  for (const o of db.orders) {
    if (!o) continue;
    const staff = o.assignedMarketingStaff;
    const name = o.assignedMarketingName || staff?.name;
    const id = o.assignedMarketingId || staff?.id;

    if (name) {
      const phone = extractOrderPhone(o);
      const norm = normalizeCustomerPhone(phone);
      const tail = getCustomerPhoneTail(phone);
      const uid = extractOrderUserId(o);

      const staffObj: MarketingStaffProfile = {
        id: id || "KAM",
        name,
        code: staff?.code || "KAM",
        phone: staff?.phone || "",
        email: staff?.email || "",
        avatar: staff?.avatar || "",
        department: staff?.department || "sales",
        assignedAt: staff?.assignedAt || o.createdAt || new Date().toISOString()
      };

      if (norm && !db.customerAssignments[norm]) {
        db.customerAssignments[norm] = { assignedMarketingId: staffObj.id, assignedMarketingName: staffObj.name, assignedMarketingStaff: staffObj };
        mutated = true;
      }
      if (tail && !db.customerAssignments[tail]) {
        db.customerAssignments[tail] = { assignedMarketingId: staffObj.id, assignedMarketingName: staffObj.name, assignedMarketingStaff: staffObj };
        mutated = true;
      }
      if (uid && !db.customerAssignments[uid]) {
        db.customerAssignments[uid] = { assignedMarketingId: staffObj.id, assignedMarketingName: staffObj.name, assignedMarketingStaff: staffObj };
        mutated = true;
      }
    }
  }

  // Second pass: for every order that lacks assignedMarketingStaff, check if phone has an assigned manager
  for (let i = 0; i < db.orders.length; i++) {
    const o = db.orders[i];
    if (!o) continue;

    if (!o.assignedMarketingStaff?.name && !o.assignedMarketingName) {
      const phone = extractOrderPhone(o);
      const uid = extractOrderUserId(o);
      const matched = findAssignedMarketingForCustomer(db, phone, uid);

      if (matched) {
        db.orders[i] = {
          ...o,
          assignedMarketingStaff: matched.assignedMarketingStaff,
          assignedMarketingId: matched.assignedMarketingId,
          assignedMarketingName: matched.assignedMarketingName
        };
        mutated = true;
      }
    }
  }

  return mutated;
}
