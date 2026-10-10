/**
 * Product Source Link Privacy & Access Control Utility
 *
 * CRITICAL BUSINESS RULE (ইউজারের সুনির্দিষ্ট শর্ত):
 * "প্রডাক্ট এর সোর্স লিংক এর সুধু মাত্র পারসেজ ডেসবোর্ডেই থাকবে অন্য কোন ডেসবোর্ডে থাকবে না সেই ভাবে করে দাও"
 *
 * Product source links (1688, Taobao, supplier URLs, offer IDs, direct links)
 * MUST ONLY be accessible inside the Purchase Dashboard (পারসেজ ড্যাশবোর্ড / Purchase Department).
 * In all other dashboards (Marketing, CS, BD Warehouse, China Warehouse, Delivery, Accounts, etc.),
 * product source links are strictly protected, hidden, and cannot be accessed.
 */

export interface CanAccessSourceLinkParams {
  isMasterAdmin?: boolean;
  viewerDepartment?: string;
  role?: string;
  email?: string;
  isPurchaseDashboard?: boolean;
}

/**
 * Checks whether the viewer is inside the Purchase Dashboard or authorized for Purchase procurement.
 * Strictly restricts product source links so they ONLY appear in the Purchase dashboard.
 */
export function canAccessProductSourceLink(params?: CanAccessSourceLinkParams): boolean {
  // 1. Explicitly marked as Purchase Dashboard
  if (params?.isPurchaseDashboard) {
    return true;
  }

  const dept = String(params?.viewerDepartment || "").toLowerCase().trim();
  const role = String(params?.role || "").toLowerCase().trim();

  // Allow Marketing / Sales / KAM to access and open product links as required by the user
  if (
    dept.includes("market") ||
    dept.includes("sales") ||
    dept.includes("kam") ||
    role.includes("market") ||
    role.includes("sales") ||
    role.includes("kam")
  ) {
    return true;
  }

  // 2. If in non-authorized departments (Delivery, Accounts, Warehouses, etc.):
  // STRICTLY NO ACCESS
  if (
    dept.includes("support") ||
    dept.includes("cs") ||
    dept.includes("deliver") ||
    dept.includes("account") ||
    dept.includes("custom") ||
    dept.includes("warehouse") ||
    role.includes("support") ||
    role.includes("cs") ||
    role.includes("deliver") ||
    role.includes("account") ||
    role.includes("custom") ||
    role.includes("warehouse")
  ) {
    return false;
  }

  // 3. Purchase Department access
  const isPurchase =
    dept === "purchase" ||
    dept.includes("purchas") ||
    dept.includes("sourcing") ||
    dept.includes("procurement") ||
    role === "purchase" ||
    role.includes("purchas") ||
    role.includes("sourcing") ||
    role.includes("procurement");

  if (isPurchase) {
    return true;
  }

  // 4. Main Admin: Only when viewing the Purchase procurement workflow
  if (params?.isMasterAdmin && (dept === "" || dept === "purchase" || role === "purchase")) {
    return true;
  }

  // Any other dashboard -> NO ACCESS
  return false;
}
