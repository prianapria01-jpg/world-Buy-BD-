/**
 * Customer Privacy & Marketing Assignment Access Control
 *
 * Rules:
 * 1. Customer Assignment: Only Main Admin can assign or change the Marketing Manager for an order/customer.
 * 2. Unassigned Order Privacy:
 *    - Main Admin: can view customer phone number & assign marketing manager.
 *    - CS (Customer Support): can view customer phone number (to contact customer).
 *    - Other Departments (Purchase, Delivery, Accounts, Marketing, etc.): CANNOT view customer phone number.
 *      They CAN view what the customer ordered (products, variations, quantities, price, shipping, status).
 * 3. Assigned Order Visibility:
 *    - When Main Admin assigns a Marketing Manager, CS and ALL departments (Purchase, Delivery, Accounts, etc.)
 *      can view the customer's phone number.
 */

export interface AdminUserInfo {
  id?: string;
  code?: string;
  role: string;
  email: string;
  name?: string;
  department?: string;
  isMasterAdmin: boolean;
}

export function getCurrentAdminUser(): AdminUserInfo {
  if (typeof window === "undefined") {
    return { role: "admin", email: "", isMasterAdmin: true };
  }

  // If in portal route, never treat as Master Admin
  const isPortalRoute = window.location.pathname.startsWith("/portal");

  try {
    const raw = localStorage.getItem("admin_user");
    if (raw) {
      const parsed = JSON.parse(raw);
      const role = String(parsed?.role || "").toLowerCase();
      const email = String(parsed?.email || "").toLowerCase();
      const isMasterAdmin =
        !isPortalRoute &&
        (role === "admin" ||
        role === "super_admin" ||
        email === "mdm859219@gmail.com" ||
        email === "radowan121537@gmail.com" ||
        email === "admin@worldbuybd.com");

      const deptRaw = String(parsed?.department || parsed?.defaultRole || parsed?.role || "").toLowerCase();
      return {
        id: parsed?.id || parsed?.staffId,
        code: parsed?.code || parsed?.staffCode,
        role,
        email,
        name: parsed?.name,
        department: deptRaw,
        isMasterAdmin
      };
    }

    const savedStaff = localStorage.getItem("admin_logged_in_staff");
    if (savedStaff) {
      const parsed = JSON.parse(savedStaff);
      const role = String(parsed?.role || "").toLowerCase();
      const isMasterAdmin = !isPortalRoute && (role === "admin" || role === "super_admin");
      return {
        id: parsed?.id || parsed?.staffId,
        code: parsed?.code || parsed?.staffCode,
        role,
        email: parsed?.email || "",
        name: parsed?.name,
        department: String(parsed?.department || parsed?.role || "").toLowerCase(),
        isMasterAdmin
      };
    }
  } catch {}

  // If on admin route without specific staff, default to admin, otherwise false
  const isAdminPath = window.location.pathname.startsWith("/admin");
  return { role: isAdminPath ? "admin" : "guest", email: "", isMasterAdmin: isAdminPath && !isPortalRoute };
}

/**
 * Customer Login Password Privacy & Access Control Utility
 *
 * CRITICAL RULE:
 * "মার্কেটীং এর ডীপার্টমেন্ট এর কাছে কাস্টমারের log in কোন password দেখা যাচ্ছে এটা থাকবে না এটার একসেজ সুধু এডমিন প্যানেলের কাছে থাকবে"
 *
 * Customer login passwords can ONLY be viewed in the Main Admin panel (/admin) by authenticated Master Admins.
 * Marketing department (and all staff portals / non-admin dashboards) are STRICTLY FORBIDDEN
 * from viewing, copying, or receiving customer passwords.
 */
export function canViewCustomerPassword(params?: {
  isMasterAdmin?: boolean;
  viewerDepartment?: string;
  viewerRole?: string;
}): boolean {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/portal")) {
    return false;
  }

  const dept = String(params?.viewerDepartment || "").toLowerCase();
  const role = String(params?.viewerRole || "").toLowerCase();

  // If viewer is in Marketing or Sales, STRICTLY FORBIDDEN
  if (
    dept.includes("market") ||
    dept.includes("sales") ||
    dept.includes("kam") ||
    role.includes("market") ||
    role.includes("sales") ||
    role.includes("kam")
  ) {
    return false;
  }

  // If viewer is in other non-admin departments (CS, Purchase, Warehouse, Delivery, Accounts)
  if (
    dept.includes("purchase") ||
    dept.includes("deliver") ||
    dept.includes("warehouse") ||
    dept.includes("cs") ||
    dept.includes("support") ||
    dept.includes("account") ||
    dept.includes("custom")
  ) {
    return false;
  }

  // Explicit master admin check
  if (params?.isMasterAdmin) {
    return true;
  }

  const currentUser = getCurrentAdminUser();
  return Boolean(currentUser.isMasterAdmin);
}

/**
 * Checks whether an order or customer record is assigned to a Marketing Manager.
 */
export function isOrderMarketingAssigned(orderOrCustomer: any): boolean {
  if (!orderOrCustomer) return false;

  const staff = orderOrCustomer.assignedMarketingStaff;
  if (staff && (staff.name || staff.id || staff.code)) {
    return true;
  }

  if (orderOrCustomer.assignedMarketingId && orderOrCustomer.assignedMarketingId !== "unassigned") {
    return true;
  }

  if (orderOrCustomer.assignedMarketingName && orderOrCustomer.assignedMarketingName !== "Unassigned") {
    return true;
  }

  return false;
}

/**
 * Checks if a specific order or customer is assigned to the given marketing manager / staff desk.
 * Matches by staff ID, staff code, name, or email.
 */
export function isAssignedToThisMarketingManager(
  record: any,
  viewerStaff?: {
    id?: string;
    code?: string;
    name?: string;
    email?: string;
  }
): boolean {
  if (!record || !viewerStaff) return false;

  const vId = String(viewerStaff.id || "").trim().toLowerCase();
  const vCode = String(viewerStaff.code || "").trim().toLowerCase();
  const vName = String(viewerStaff.name || "").trim().toLowerCase();
  const vEmail = String(viewerStaff.email || "").trim().toLowerCase();

  // If viewer has no identifier at all, we cannot authenticate assignment
  if (!vId && !vCode && !vName && !vEmail) return false;

  const staff = record.assignedMarketingStaff;
  if (staff) {
    const sId = String(staff.id || staff.staffId || "").trim().toLowerCase();
    const sCode = String(staff.code || staff.staffCode || "").trim().toLowerCase();
    const sName = String(staff.name || "").trim().toLowerCase();
    const sEmail = String(staff.email || "").trim().toLowerCase();

    if (vId && sId && vId === sId) return true;
    if (vCode && sCode && vCode === sCode) return true;
    if (vName && sName && (vName === sName || sName.includes(vName) || vName.includes(sName))) return true;
    if (vEmail && sEmail && vEmail === sEmail) return true;
  }

  // Check flat attributes on order or customer record
  const recId = String(record.assignedMarketingId || "").trim().toLowerCase();
  const recCode = String(record.assignedMarketingCode || "").trim().toLowerCase();
  const recName = String(record.assignedMarketingName || "").trim().toLowerCase();

  if (vId && recId && (vId === recId || recId.includes(vId))) return true;
  if (vCode && recCode && vCode === recCode) return true;
  if (vCode && recId && vCode === recId) return true;
  if (vName && recName && (vName === recName || recName.includes(vName) || vName.includes(recName))) return true;

  return false;
}

export interface CanViewCustomerPhoneParams {
  order?: any;
  customer?: any;
  viewerDepartment?: string;
  viewerRole?: string;
  viewerStaff?: {
    id?: string;
    code?: string;
    name?: string;
    email?: string;
  };
  isMasterAdmin?: boolean;
}

/**
 * Determines if customer phone number should be visible to the viewer.
 *
 * Rules:
 * 1. Main Admin: Always can view customer phone.
 * 2. Marketing Manager:
 *    - "যে যে মার্কেটিং মেনেজার এর জন্য যে যে কাস্ট এসাইন করা হবে ছাড়া অন্য কোন মার্কেটিং মেনেজার কাস্টমারের ফোন নাম্বার দেখতে পাবেনা"
 *    - ONLY the assigned marketing manager can see the customer phone number!
 *    - Unassigned or assigned to a different marketing manager -> PHONE IS HIDDEN!
 * 3. CS (Customer Support):
 *    - Can view customer phone when customer places an order to facilitate support.
 * 4. Other Departments (Delivery, Accounts, Warehouse):
 *    - If unassigned: Hidden.
 *    - If assigned: Delivery & Accounts can view for order fulfillment.
 */
export function canViewCustomerPhone(params: CanViewCustomerPhoneParams): boolean {
  const { order, customer, viewerDepartment, viewerRole, viewerStaff, isMasterAdmin } = params;

  // 1. Main Admin can ALWAYS view customer phone
  if (isMasterAdmin) {
    return true;
  }

  const currentUser = getCurrentAdminUser();
  if (currentUser.isMasterAdmin && (isMasterAdmin === undefined || isMasterAdmin)) {
    return true;
  }

  const record = order || customer;
  if (!record) return false;

  const dept = String(viewerDepartment || currentUser.department || "").toLowerCase().trim();
  const role = String(viewerRole || currentUser.role || "").toLowerCase().trim();

  const isMarketing =
    dept.includes("market") ||
    dept.includes("sales") ||
    dept.includes("kam") ||
    role.includes("market") ||
    role.includes("sales") ||
    role.includes("kam");

  // 2. Strict Marketing Manager Isolation:
  // "যে যে মার্কেটিং মেনেজার এর জন্য যে যে কাস্ট এসাইন করা হবে ছাড়া অন্য কোন মার্কেটিং মেনেজার কাস্টমারের ফোন নাম্বার দেখতে পাবেনা"
  if (isMarketing) {
    const staffIdentity = {
      id: viewerStaff?.id || currentUser.id,
      code: viewerStaff?.code || currentUser.code,
      name: viewerStaff?.name || currentUser.name,
      email: viewerStaff?.email || currentUser.email
    };

    return isAssignedToThisMarketingManager(record, staffIdentity);
  }

  // 3. Customer Support (CS):
  // Can view phone number when order is placed to handle customer queries
  const isCS =
    dept === "cs" ||
    dept === "support" ||
    dept === "customer_support" ||
    dept.includes("cs") ||
    role === "cs" ||
    role.includes("support");

  if (isCS) {
    return true;
  }

  // 4. Other departments (Delivery, Warehouse, Accounts):
  // When assigned, Delivery & Accounts can view phone for dispatch & invoices
  const isAssigned = isOrderMarketingAssigned(record);
  if (isAssigned) {
    const isDeliveryOrAccounts =
      dept.includes("delivery") ||
      dept.includes("account") ||
      dept.includes("warehouse") ||
      role.includes("delivery") ||
      role.includes("account");

    if (isDeliveryOrAccounts) {
      return true;
    }
  }

  // Unassigned or unauthorized department -> hidden
  return false;
}

/**
 * Checks if the current user can assign or reassign customers/orders to Marketing Managers.
 * Only Main Admin has this permission.
 */
export function canAssignMarketingStaff(isMasterAdmin?: boolean): boolean {
  return Boolean(isMasterAdmin);
}
