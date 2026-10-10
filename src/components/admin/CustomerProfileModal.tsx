import React, { useState } from "react";
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  MessageSquare,
  ShoppingCart,
  Heart,
  ExternalLink,
  Edit3,
  RefreshCw,
  PhoneCall,
  Calendar,
  Package,
  Lock
} from "lucide-react";
import CustomerPhoneSecureDisplay from "./CustomerPhoneSecureDisplay";
import { canViewCustomerPhone, getCurrentAdminUser } from "../../utils/customerPrivacy";
import { getProductPath } from "../../utils/productUrl";

interface CustomerProfileModalProps {
  customer: any;
  onClose: () => void;
  onUpdateCustomer?: (updated: any) => void;
}

export default function CustomerProfileModal({
  customer: initialCustomer,
  onClose,
  onUpdateCustomer,
}: CustomerProfileModalProps) {
  const [customer, setCustomer] = useState(initialCustomer);
  const [showPassword, setShowPassword] = useState(true);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Edit password state
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const activePassword = customer.password || customer.lastLoginPassword || "123456";

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(activePassword);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  const formattedWhatsAppMessage = `Hello ${customer.name || "Customer"}, your World Buy BD login password is: ${activePassword}. You can use this password to sign in directly to your account. Thank you for choosing World Buy BD!`;

  const handleCopyFormattedMessage = () => {
    navigator.clipboard.writeText(formattedWhatsAppMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      alert("Please enter a new password.");
      return;
    }
    setSavingPassword(true);
    try {
      const targetId = customer.id || customer.uid || customer.phone;
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(targetId)}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword.trim() }),
      });
      if (res.ok) {
        const updated = {
          ...customer,
          password: newPassword.trim(),
          lastLoginPassword: newPassword.trim(),
        };
        setCustomer(updated);
        if (onUpdateCustomer) onUpdateCustomer(updated);
        setIsEditingPassword(false);
        setNewPassword("");
        setBannerMessage("Password successfully updated!");
        setTimeout(() => setBannerMessage(null), 4000);
      } else {
        alert("Failed to update password.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while updating the password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const cleanPhone = String(customer.phone || "").replace(/^0/, "").replace(/[^0-9]/g, "");
  const currentAdmin = getCurrentAdminUser();
  const isPhoneVisible = canViewCustomerPhone({
    customer,
    viewerDepartment: currentAdmin.department,
    isMasterAdmin: currentAdmin.isMasterAdmin
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div>
            <span className="text-[11px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              ID: {customer.id || customer.uid}
            </span>
            <h3 className="font-bold text-lg text-slate-900 mt-1">
              {customer.name || "Customer"}'s Profile & Credentials
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {bannerMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
        )}

        {/* Basic Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Phone Number</span>
            <CustomerPhoneSecureDisplay
              customer={customer}
              phone={customer.phone}
              viewerDepartment={currentAdmin.department}
              isMasterAdmin={currentAdmin.isMasterAdmin}
              showActions={true}
            />
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Email</span>
            <span className="font-bold text-slate-800">{customer.email || "No email"}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Delivery Address</span>
            <span className="text-slate-700">{customer.address || "Dhaka, Bangladesh"}</span>
          </div>
          {customer.lastLoginAt && (
            <div className="sm:col-span-2 text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Last Logged In: {new Date(customer.lastLoginAt).toLocaleString("en-US")}</span>
            </div>
          )}
        </div>

        {/* HIGHLIGHTED CUSTOMER LOGIN PASSWORD BOX - ADMIN ONLY */}
        {currentAdmin.isMasterAdmin ? (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Customer Login Password
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Assist customers if they forget their password or request support
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditingPassword(!isEditingPassword)}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingPassword ? "Cancel" : "Change Password"}</span>
              </button>
            </div>

            {!isEditingPassword ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-base sm:text-lg font-black text-slate-900 tracking-wider">
                      {showPassword ? activePassword : "••••••••••••"}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyPassword}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      {copiedPass ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Password</span>
                        </>
                      )}
                    </button>

                    {cleanPhone && isPhoneVisible && (
                      <a
                        href={`https://wa.me/880${cleanPhone}?text=${encodeURIComponent(formattedWhatsAppMessage)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send via WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Ready-to-Send Message Preview */}
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-700 text-[11px]">
                    <span>Ready-to-Send Customer Message:</span>
                    <button
                      onClick={handleCopyFormattedMessage}
                      className="text-primary hover:underline text-[10px] flex items-center gap-1 cursor-pointer font-bold"
                    >
                      {copiedMsg ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-800 italic bg-amber-50/50 p-2 rounded text-[11px] leading-relaxed border border-amber-100 font-sans">
                    "{formattedWhatsAppMessage}"
                  </p>
                </div>
              </div>
            ) : (
              /* Inline Password Edit Form */
              <form onSubmit={handleSaveNewPassword} className="space-y-3 bg-white p-4 rounded-xl border border-amber-300 text-xs">
                <label className="font-bold text-slate-800 block">
                  Enter new password for this customer:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123456 or new password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:bg-white focus:border-amber-600 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${savingPassword ? "animate-spin" : ""}`} />
                    <span>{savingPassword ? "Saving..." : "Save Password"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  The new password takes effect immediately in the database, allowing the customer to log in with it.
                </p>
              </form>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-semibold">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Customer Login Password</span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              Confidential (Admin Access Only)
            </span>
          </div>
        )}

        {/* Customer Cart & Wishlist Section */}
        <div className="border-t border-slate-200 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Saved Cart & Wishlist Products</span>
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Review saved items for follow-up and sales conversions
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Active Cart */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                        Cart Products ({customer.cart?.length || 0})
                      </h5>
                      <span className="text-[10px] text-slate-500">Items added to shopping cart</span>
                    </div>
                  </div>
                  {customer.cart && customer.cart.length > 0 && (
                    <span className="text-xs font-mono font-black text-sky-800 bg-sky-100/80 px-2.5 py-1 rounded-full border border-sky-300">
                      Total: Tk {customer.cart.reduce((sum: number, it: any) => sum + (Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1)), 0).toLocaleString()}
                    </span>
                  )}
                </div>

                {customer.cart && customer.cart.length > 0 ? (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {customer.cart.map((item: any, idx: number) => {
                      const itemPrice = Number(item.price || item.unitPrice || 0);
                      const itemQty = Number(item.quantity || 1);
                      const itemTotal = itemPrice * itemQty;
                      const productUrl = getProductPath(item);
                      const cartFollowUpMsg = `Hello ${customer.name || "Customer"}, you have '${item.name || "Product"}' in your World Buy BD shopping cart. We are happy to help you complete your order!`;

                      return (
                        <div
                          key={item.cartItemId || `${item.id}-${idx}`}
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-sky-300 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative group">
                              <img
                                src={item.image || item.variantImage || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200"}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <a
                                href={productUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-xs text-slate-900 hover:text-primary transition line-clamp-1 flex items-center gap-1"
                                title={item.name}
                              >
                                <span>{item.name || "Product"}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                              </a>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                                {item.variantName && (
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-700">
                                    {item.variantName}
                                  </span>
                                )}
                                <span className="font-semibold text-slate-700">
                                  Tk {itemPrice.toLocaleString()} × {itemQty}
                                </span>
                                <span className="font-bold text-sky-700">
                                  = Tk {itemTotal.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {cleanPhone && (
                            <a
                              href={`https://wa.me/880${cleanPhone}?text=${encodeURIComponent(cartFollowUpMsg)}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Contact customer on WhatsApp regarding this item"
                              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition shrink-0 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 italic">
                    <ShoppingCart className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <span>No products currently in customer cart</span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Wishlist */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                      <Heart className="w-4 h-4 fill-rose-500" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                        Wishlist Products ({customer.wishlist?.length || 0})
                      </h5>
                      <span className="text-[10px] text-slate-500">Saved favorite items</span>
                    </div>
                  </div>
                  {customer.wishlist && customer.wishlist.length > 0 && (
                    <span className="text-xs font-mono font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      {customer.wishlist.length} items
                    </span>
                  )}
                </div>

                {customer.wishlist && customer.wishlist.length > 0 ? (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {customer.wishlist.map((item: any, idx: number) => {
                      const itemPrice = Number(item.price || item.unitPrice || 0);
                      const productUrl = getProductPath(item);
                      const wishlistFollowUpMsg = `Hello ${customer.name || "Customer"}, your wishlisted item '${item.name || "Product"}' on World Buy BD currently has special promotions! Check it out anytime.`;

                      return (
                        <div
                          key={item.id || `wish-${idx}`}
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-rose-300 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative group">
                              <img
                                src={item.image || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200"}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <a
                                href={productUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-xs text-slate-900 hover:text-primary transition line-clamp-1 flex items-center gap-1"
                                title={item.name}
                              >
                                <span>{item.name || "Product"}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                              </a>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                <span className="font-bold text-rose-600">
                                  Tk {itemPrice.toLocaleString()}
                                </span>
                                {item.category && (
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {cleanPhone && (
                            <a
                              href={`https://wa.me/880${cleanPhone}?text=${encodeURIComponent(wishlistFollowUpMsg)}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Send wishlist offer on WhatsApp"
                              className="p-2 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 transition shrink-0 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 italic">
                    <Heart className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <span>No products currently in customer wishlist</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            {cleanPhone && (
              <a
                href={`tel:${customer.phone}`}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Customer</span>
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
