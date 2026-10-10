/**
 * Stock-Out Privacy & Role-Based Access Control Utility
 *
 * CRITICAL BUSINESS RULES (ইউজারের সুনির্দিষ্ট শর্তাবলী):
 * 1. "stock out এর কোন প্রকার একসেজ মার্কেটীং ডিপার্টামেণ্ট এর মধ্যে থাকবে এটার একসেজ সুধু এটার একসেজ এডমিন ও পারসেজ এর কাছে থাকবে ।"
 *    - Marketing Department: Absolutely NO access to Stock Out.
 *      - Cannot view Stock Out management tabs or badges.
 *      - Cannot mark orders as Stock Out.
 *      - Cannot change order status to "Stock Out".
 *      - Cannot view or manage Stock Out resolution / refund claims.
 *    - Main Admin: Has full access to manage Stock Out.
 *    - Purchase Department (পারসেজ): Has full access to mark products/orders as Stock Out.
 *    - Other departments (CS, Delivery, Warehouse, etc.): Do NOT have stock out modification access.
 */

export interface StockOutAccessParams {
  isMasterAdmin?: boolean;
  viewerDepartment?: string;
  role?: string;
}

/**
 * Checks whether the current user / viewer has access to Stock Out management or actions.
 * Only returns true for Main Admin and Purchase Department.
 * Explicitly blocks Marketing Department and all other unauthorized roles.
 */
export function canAccessStockOutManagement(params?: StockOutAccessParams): boolean {
  const dept = String(params?.viewerDepartment || "").toLowerCase().trim();
  const role = String(params?.role || "").toLowerCase().trim();

  // 1. Marketing Department & Sales Person -> ABSOLUTELY NO ACCESS
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

  // 2. Main Admin check
  if (params?.isMasterAdmin) {
    return true;
  }

  // 3. Purchase Department check
  const isPurchase =
    dept === "purchase" ||
    dept.includes("purchase") ||
    dept.includes("purchas") ||
    dept.includes("sourcing") ||
    dept.includes("procurement") ||
    role === "purchase" ||
    role.includes("purchase") ||
    role.includes("purchas") ||
    role.includes("sourcing") ||
    role.includes("procurement");

  if (isPurchase) {
    return true;
  }

  return false;
}
