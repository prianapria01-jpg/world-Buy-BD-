import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { 
  CheckCircle2, 
  Upload, 
  Copy, 
  Check, 
  CreditCard, 
  Building, 
  Smartphone, 
  FileText, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  X,
  Download,
  Zap,
  ExternalLink,
  Layers
} from "lucide-react";
import { downloadInvoicePdf, createInvoiceFromOrder } from "../utils/invoicePdf";
import { getSafeImageUrl, DEFAULT_PRODUCT_FALLBACK } from "../utils/imageUrl";
import InvoiceModal from "../components/InvoiceModal";

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: location } });
    }
  }, [authLoading, user, navigate, location]);

  // Read direct Buy Now items if arriving from Buy Now button
  const locationState = location.state as { buyNowItems?: any[] } | null;
  const isBuyNow = Boolean(locationState?.buyNowItems && locationState.buyNowItems.length > 0);
  const checkoutItems = isBuyNow ? (locationState?.buyNowItems || []) : cart;

  const [discountPercent, setDiscountPercent] = useState(3);

  // Calculate pricing: 100% Product Payment upfront is recorded as Partial Paid;
  // Weight x Shipping Rate + China Courier Bill are added post-order on the Final Invoice
  const checkoutSubtotal = checkoutItems.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const discountAmount = Math.round(checkoutSubtotal * (discountPercent / 100)); // Dynamic Discount
  const deliveryCharge = 0;
  const totalPayable = Math.max(0, checkoutSubtotal - discountAmount);

  // Success Modal & Payment States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [createdOrders, setCreatedOrders] = useState<any[]>([]);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  
  // Payment Proof Form States
  const [selectedMethod, setSelectedMethod] = useState<"bkash" | "nagad" | "bank">("bkash");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const userStorageKey = user?.uid || user?.email || user?.phoneNumber || "guest";
  const savedProfile = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(`customer_profile_${userStorageKey}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [userStorageKey]);

  // Dynamic store payment settings
  const [settings, setSettings] = useState({
    bkashNumber: "01712-345678",
    bkashType: "Personal (Send Money)",
    nagadNumber: "01912-345678",
    nagadType: "Personal (Send Money)",
    bankName: "South East Bank PLC",
    bankAccountName: "Md Shamim Hossen",
    bankAccountNumber: "002412100022424",
    bankBranch: "Banani Branch",
    bankRouting: "205260432"
  });

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
          if (data.globalDiscount !== undefined) {
            setDiscountPercent(Number(data.globalDiscount));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    
    const minOrder = Number((settings as any).minOrderAmount) || 2000;
    if (checkoutSubtotal < minOrder) {
      setCheckoutError(`Minimum order limit is BDT ${minOrder.toLocaleString()}. Your current cart subtotal is BDT ${checkoutSubtotal.toLocaleString()}. Please add items worth BDT ${(minOrder - checkoutSubtotal).toLocaleString()} to proceed.`);
      return;
    }

    const paymentAmount = totalPayable;
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const rawCustomerInfo = Object.fromEntries(formData.entries());
    const customerInfo = {
      ...rawCustomerInfo,
      userId: user?.uid || "",
      name: String(rawCustomerInfo.name || user?.displayName || user?.name || "Customer").trim(),
      phone: String(rawCustomerInfo.phone || user?.phoneNumber || "").trim(),
      email: String(rawCustomerInfo.email || user?.email || "").trim(),
      address: String(rawCustomerInfo.address || user?.address || "").trim(),
      division: String(rawCustomerInfo.division || "Dhaka").trim(),
      postalCode: String(rawCustomerInfo.postalCode || "").trim(),
      payment: selectedMethod
    };

    try {
      localStorage.setItem(`customer_profile_${userStorageKey}`, JSON.stringify(customerInfo));
    } catch {}

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid || "",
          userEmail: (user?.email || customerInfo.email || "").toLowerCase(),
          userPhone: user?.phoneNumber || customerInfo.phone || "",
          total: paymentAmount,
          subtotal: checkoutSubtotal,
          discountAmount: discountAmount,
          deliveryCharge: 0,
          shippingCharge: 0,
          chinaCourierCharge: 0,
          weightKg: 0,
          shippingRatePerKg: 780,
          adminChargesUploaded: false,
          status: "Pending",
          items: checkoutItems.map((it: any) => ({
            ...it,
            shippingRatePerKg: Number(it.shippingRatePerKg || 780),
            importedUrl: it.importedUrl || (it.offerId ? `https://detail.1688.com/offer/${String(it.offerId).replace(/^abb-/, "")}.html` : '') || (it.id ? `/product/${it.id}` : ''),
            offerId: it.offerId ? String(it.offerId).replace(/^abb-/, "") : undefined,
          })),
          customerInfo,
          paymentMethod: selectedMethod,
          paidAmount: paymentAmount,
          paymentStatus: "Partial Paid"
        }),
      });

      if (response.ok) {
        const orderData = await response.json();
        const ordersList: any[] = Array.isArray(orderData.orders) && orderData.orders.length > 0 ? orderData.orders : [orderData];
        setCreatedOrders(ordersList);
        setCreatedOrder(ordersList[0]);
        setSelectedInvoiceOrder(ordersList[0]);
        // Always clear active cart after successful order placement as requested
        clearCart(true);
        localStorage.removeItem("myshop_cart");
        sessionStorage.removeItem("buy_now_item");
        
        setShowSuccessModal(true);
      } else {
        setCheckoutError("Failed to create order. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setCheckoutError("Failed to place order. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    if (!createdOrder) return;
    if (!transactionId.trim() && !screenshotPreview) {
      setCheckoutError("Please enter Transaction ID (TrxID) or upload payment screenshot.");
      return;
    }

    setSubmittingProof(true);
    try {
      const allOrderIds = (createdOrders.length > 0 ? createdOrders : [createdOrder]).map(
        (o) => o.orderId || o.id
      );

      let response;
      if (allOrderIds.length > 1) {
        response = await fetch("/api/orders/bulk-payment", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderIds: allOrderIds,
            paymentInfo: {
              method: selectedMethod,
              senderNumber,
              transactionId,
              amount: totalPayable,
              screenshot: screenshotPreview || "",
              notes: `Submitted via Checkout for ${selectedMethod.toUpperCase()} (${allOrderIds.length} orders)`
            }
          })
        });
      } else {
        response = await fetch(`/api/orders/${createdOrder.orderId || createdOrder.id}/payment`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: selectedMethod,
            senderNumber,
            transactionId,
            amount: totalPayable,
            screenshot: screenshotPreview || "",
            notes: `Submitted via Checkout Popup for ${selectedMethod.toUpperCase()}`
          }),
        });
      }

      if (response.ok) {
        const updatedData = await response.json();
        if (updatedData.orders && Array.isArray(updatedData.orders)) {
          setCreatedOrders(updatedData.orders);
          setCreatedOrder(updatedData.orders[0]);
        } else if (updatedData && (updatedData.id || updatedData.orderId)) {
          setCreatedOrder(updatedData);
        }
        setProofSubmitted(true);
      } else {
        setCheckoutError("Error submitting payment proof. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setCheckoutError("Error submitting payment proof.");
    } finally {
      setSubmittingProof(false);
    }
  };

  if (checkoutItems.length === 0 && !showSuccessModal) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-white border border-gray-200 rounded-lg my-8 max-w-xl text-xs">
        <h2 className="text-lg font-bold mb-2 text-gray-900">No Items Selected</h2>
        <p className="text-gray-500 mb-4">Please add products to your cart or select "Buy Now" to proceed to checkout.</p>
        <Link to="/shop" className="bg-primary text-white font-medium px-5 py-2 rounded-md hover:bg-primary-dark transition inline-block">
          Browse Products
        </Link>
      </div>
    );
  }

  const minOrder = Number((settings as any).minOrderAmount) || 2000;
  const isBelowMinOrder = checkoutSubtotal < minOrder;

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 relative text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h1 className="text-xl font-bold text-gray-900">Checkout & Order Confirmation</h1>
        {isBuyNow && (
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full w-fit">
            <Zap className="w-3 h-3 fill-emerald-600 text-emerald-600" /> Direct Buy Now
          </span>
        )}
      </div>

      {checkoutError && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{checkoutError}</span>
          </div>
          <button type="button" onClick={() => setCheckoutError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Minimum Order Alert */}
      {isBelowMinOrder && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg p-3 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-amber-900">Minimum Order Amount: BDT {minOrder.toLocaleString()}</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Current cart subtotal is <strong className="font-bold">BDT {checkoutSubtotal.toLocaleString()}</strong>. Please add <strong className="font-bold text-red-600">BDT {(minOrder - checkoutSubtotal).toLocaleString()}</strong> more to checkout.
              </p>
            </div>
          </div>
          <Link
            to="/shop"
            className="bg-primary hover:bg-primary-dark text-white text-[11px] font-bold px-4 py-1.5 rounded-lg transition whitespace-nowrap"
          >
            Add More Items
          </Link>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Form: Customer & Shipping */}
        <div className="flex-1">
          <form id="checkout-form" onSubmit={handleSubmitOrder} className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            
            <h2 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 flex items-center">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] mr-2">1</span>
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Full Name *</label>
                <input required name="name" type="text" defaultValue={user?.displayName || user?.name || savedProfile.name || ''} placeholder="e.g. Ariful Islam" className="w-full border border-gray-300 rounded-md p-2 text-xs focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Mobile Phone Number *</label>
                <input required name="phone" type="tel" defaultValue={user?.phoneNumber || savedProfile.phone || ''} placeholder="017XXXXXXXX" className="w-full border border-gray-300 rounded-md p-2 text-xs focus:border-primary focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Email Address *</label>
                <input required name="email" type="email" defaultValue={user?.email || savedProfile.email || ''} placeholder="example@gmail.com" className="w-full border border-gray-300 rounded-md p-2 text-xs focus:border-primary focus:outline-none" />
              </div>
            </div>

            <h2 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 flex items-center">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] mr-2">2</span>
              Shipping Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Detailed Street Address (House, Road, Area) *</label>
                <textarea required name="address" defaultValue={user?.address || savedProfile.address || ''} rows={2} placeholder="e.g. House #12, Road #4, Sector #7, Uttara, Dhaka" className="w-full border border-gray-300 rounded-md p-2 text-xs focus:border-primary focus:outline-none"></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Division *</label>
                <select required name="division" defaultValue={savedProfile.division || ''} className="w-full border border-gray-300 rounded-md p-2 text-xs focus:border-primary focus:outline-none bg-white">
                  <option value="">Select Division</option>
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chattogram">Chattogram</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Khulna">Khulna</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Barishal">Barishal</option>
                  <option value="Rangpur">Rangpur</option>
                  <option value="Mymensingh">Mymensingh</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Postal Code *</label>
                <input required name="postalCode" type="text" defaultValue={savedProfile.postalCode || ''} placeholder="e.g. 1230" className="w-full border border-gray-300 rounded-md p-2 text-xs focus:border-primary focus:outline-none" />
              </div>
            </div>

            <h2 className="text-sm font-bold text-gray-900 mb-2 pb-2 border-b border-gray-100 flex items-center">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] mr-2">3</span>
              Payment Method Selection
            </h2>
            <p className="text-[11px] text-gray-500 mb-3">
              * Upon confirming order, you can submit payment transaction details and screenshot verification immediately.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
              <label 
                onClick={() => setSelectedMethod("bkash")}
                className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition ${
                  selectedMethod === "bkash" ? "border-[#D12053] bg-pink-50/50 shadow-xs" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input type="radio" name="paymentMethod" checked={selectedMethod === "bkash"} onChange={() => setSelectedMethod("bkash")} className="text-[#D12053] focus:ring-[#D12053]" />
                <div className="ml-2.5">
                  <div className="font-bold text-xs text-[#D12053]">bKash</div>
                  <div className="text-[10px] text-gray-500">Personal / Send Money</div>
                </div>
              </label>

              <label 
                onClick={() => setSelectedMethod("nagad")}
                className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition ${
                  selectedMethod === "nagad" ? "border-[#F7931E] bg-orange-50/50 shadow-xs" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input type="radio" name="paymentMethod" checked={selectedMethod === "nagad"} onChange={() => setSelectedMethod("nagad")} className="text-[#F7931E] focus:ring-[#F7931E]" />
                <div className="ml-2.5">
                  <div className="font-bold text-xs text-[#F7931E]">Nagad</div>
                  <div className="text-[10px] text-gray-500">Personal / Send Money</div>
                </div>
              </label>

              <label 
                onClick={() => setSelectedMethod("bank")}
                className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition ${
                  selectedMethod === "bank" ? "border-blue-600 bg-blue-50/50 shadow-xs" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input type="radio" name="paymentMethod" checked={selectedMethod === "bank"} onChange={() => setSelectedMethod("bank")} className="text-blue-600 focus:ring-blue-600" />
                <div className="ml-2.5">
                  <div className="font-bold text-xs text-blue-700">Bank Transfer</div>
                  <div className="text-[10px] text-gray-500">South East Bank / Online Banking</div>
                </div>
              </label>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Secure Transaction:</strong> For cross-border wholesale factory consignments, advances are safely held in trust under full buyer purchase protection.
              </div>
            </div>

          </form>
        </div>

        {/* Right Summary */}
        <div className="w-full lg:w-88 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-24 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-2 pb-2 border-b border-gray-100">Order Summary</h3>
            
            {/* Direct Buy Now Indicator */}
            {isBuyNow && (
              <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-900">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Direct Buy Now Order</span>
                </div>
                <p className="text-[10px] text-emerald-700 leading-normal">
                  You are checking out this item directly. Any previously saved cart items remain safely in your cart.
                </p>
                {cart.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => navigate("/checkout", { state: null })}
                    className="mt-1.5 text-primary font-bold hover:underline cursor-pointer text-[10px] block"
                  >
                    ← Checkout entire cart ({cart.length} items) instead
                  </button>
                )}
              </div>
            )}

            {/* Product Item List */}
            <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
              {checkoutItems.map((item, idx) => {
                const safeImg = getSafeImageUrl(
                  item.image,
                  DEFAULT_PRODUCT_FALLBACK,
                  item.variantName ? `${item.name} - ${item.variantName}` : item.name
                );
                return (
                  <div key={item.cartItemId || item.id || idx} className="flex gap-2.5 items-center py-1.5 border-b border-gray-100 last:border-b-0">
                    <div className="w-12 h-12 border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center p-1 flex-shrink-0 overflow-hidden">
                      <img 
                        src={safeImg} 
                        alt={item.name} 
                        className="w-full h-full object-contain mix-blend-multiply" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-800 line-clamp-1" title={item.name}>{item.name}</h4>
                      {item.variantName && (
                        <p className="text-[10px] text-gray-500 line-clamp-1">Variant: {item.variantName}</p>
                      )}
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-gray-500">Qty: {item.quantity}</span>
                        <span className="text-xs font-bold text-primary">BDT {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 mb-4 text-xs text-gray-700 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Items Subtotal</span>
                <span className="font-semibold">BDT {checkoutSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{discountPercent}% Instant Discount</span>
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1 rounded border border-emerald-200">-{discountPercent}% OFF</span>
                </div>
                <span className="font-bold">-BDT {discountAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-amber-800 bg-amber-50/80 px-2 py-1.5 rounded border border-amber-200">
                <span>Post-Arrival (Weight × Shipping + Courier)</span>
                <span className="font-bold">Final Invoice</span>
              </div>
            </div>

            {/* 100% Product Payment = Partial Paid Notice */}
            <div className="mb-4 p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="font-bold text-[11px] text-emerald-900">100% Product Payment (Partial Paid)</span>
                </div>
                <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {discountPercent}% OFF Applied
                </span>
              </div>
              <p className="text-[10px] text-emerald-800 mt-0.5 leading-tight">
                Your 100% upfront product payment is recorded as <strong>Partial Paid</strong>. Later, <strong>(Product Weight × Shipping Charge + China Courier Bill) − Partial Paid</strong> will be shown on your Final Invoice.
              </p>
            </div>
            
            {/* Total Payable */}
            <div className="border-t border-gray-200 pt-3 mb-4 flex justify-between items-end">
              <div>
                <span className="text-[10px] text-gray-500 block">Upfront Product Payment (Partial Paid)</span>
                <span className="font-bold text-gray-900 text-xs">Payable Now</span>
              </div>
              <span className="text-lg font-black text-primary">
                BDT {totalPayable.toLocaleString()}
              </span>
            </div>
            
            <button 
              type="submit"
              form="checkout-form"
              disabled={loading || isBelowMinOrder}
              className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isBelowMinOrder ? (
                <span>Min BDT {minOrder.toLocaleString()} Order Required</span>
              ) : (
                <>
                  <span>BDT {totalPayable.toLocaleString()} - Confirm Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">Next step: Upload payment confirmation voucher</p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* POPUP: ORDER SUCCESS & PAYMENT SCREENSHOT UPLOAD MODAL    */}
      {/* ========================================================= */}
      {showSuccessModal && createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full my-6 border border-gray-200 overflow-hidden text-xs">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 relative">
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-3 right-3 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold">🎉 Order Placed Successfully!</h3>
                  <p className="text-emerald-100 text-xs">Your procurement order has been registered.</p>
                </div>
              </div>

              {/* Order Quick Details */}
              <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap justify-between items-center text-xs gap-2">
                {createdOrders.length > 1 ? (
                  <>
                    <div>
                      <span className="text-emerald-200 text-[10px] block font-bold">📦 Total Orders:</span>
                      <span className="font-mono font-black text-sm tracking-wider text-yellow-200">
                        {createdOrders.length} Separate Order IDs
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-200 text-[10px] block font-bold">📄 Invoices:</span>
                      <span className="font-bold text-xs bg-white/20 px-2 py-0.5 rounded text-white inline-flex items-center gap-1">
                        <Layers className="w-3 h-3 text-yellow-300" />
                        Individual Invoice per Link
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-emerald-200 text-[10px] block font-bold">Order ID:</span>
                      <span className="font-mono font-black text-sm tracking-wider text-yellow-200">
                        {createdOrder.orderId || createdOrder.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-200 text-[10px] block">Invoice ID:</span>
                      <span className="font-mono font-bold tracking-wider text-yellow-200">
                        {createdOrder.invoice?.invoiceNumber || `INV-${createdOrder.orderId || createdOrder.id}`}
                      </span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-emerald-200 text-[10px] block">Total Payable:</span>
                  <span className="font-bold text-sm text-yellow-300">BDT {totalPayable?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-emerald-200 text-[10px] block">Customer Name:</span>
                  <span className="font-medium">{createdOrder.customerInfo?.name}</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              {/* If multiple orders created from cart links, list all individual Order IDs & Invoices */}
              {createdOrders.length > 1 ? (
                <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      Link-based {createdOrders.length} Separate Order IDs & Invoices:
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Enables easy refund/adjustment if any product stocks out
                    </span>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {createdOrders.map((ord: any, oIdx: number) => {
                      const oId = ord.orderId || ord.id;
                      const invId = ord.invoice?.invoiceNumber || `INV-${oId}`;
                      const firstItem = ord.items?.[0] || {};
                      const itThumb = firstItem.image || firstItem.variantImage || firstItem.imageUrl || DEFAULT_PRODUCT_FALLBACK;
                      const itName = firstItem.name || firstItem.description || `Product Link #${oIdx + 1}`;
                      const itQty = ord.items?.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0) || 1;
                      const itPrice = Number(ord.total || ord.subtotal || 0);
                      const prodLink = firstItem.importedUrl || firstItem.productLink || firstItem.sourceUrl || "";

                      return (
                        <div key={oId || oIdx} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs shadow-2xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={itThumb} 
                              alt={itName} 
                              className="w-11 h-11 rounded object-cover border border-slate-200 shrink-0 bg-white" 
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK; }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-primary bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[11px]">
                                  #{oId}
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono font-semibold">
                                  {invId}
                                </span>
                                <span className="text-[10px] text-slate-400">Link #{oIdx + 1}</span>
                              </div>
                              <div className="font-bold text-slate-900 truncate max-w-xs text-[11px] mt-0.5">
                                {itName}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>{itQty} pcs</span>
                                <span>•</span>
                                <span className="font-mono font-bold text-slate-700">BDT {itPrice.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {prodLink && (
                              <a
                                href={prodLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[10px] inline-flex items-center gap-1 transition"
                                title={prodLink}
                              >
                                <span>Link</span>
                                <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoiceOrder(ord);
                                setShowInvoicePreview(true);
                              }}
                              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] inline-flex items-center gap-1 transition cursor-pointer"
                              title="View Invoice"
                            >
                              <FileText className="w-2.5 h-2.5 text-amber-600" />
                              <span>Invoice</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(oId, oId)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[10px] inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              {copiedText === oId ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  <span className="text-emerald-600 font-bold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5 text-slate-500" />
                                  <span>Copy ID</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : Array.isArray(createdOrder.subOrders) && createdOrder.subOrders.length > 1 ? (
                <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      Link-based Separate Orders ({createdOrder.subOrders.length} links):
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Individual tracking for each link
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {createdOrder.subOrders.map((sub: any, sIdx: number) => (
                      <div key={sub.subOrderId || sIdx} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img 
                            src={sub.productImage || DEFAULT_PRODUCT_FALLBACK} 
                            alt={sub.productName} 
                            className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0 bg-white" 
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK; }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-primary bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[11px]">
                                {sub.subOrderId}
                              </span>
                              <span className="text-[10px] text-slate-400">Link #{sIdx + 1}</span>
                            </div>
                            <div className="font-bold text-slate-900 truncate max-w-xs text-[11px] mt-0.5">
                              {sub.productName}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>{sub.totalPieces} pcs</span>
                              <span>•</span>
                              <span>BDT {Number(sub.subtotal || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {sub.productLink && (
                            <a
                              href={sub.productLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[10px] inline-flex items-center gap-1 transition"
                              title={sub.productLink}
                            >
                              <span>Link</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(sub.subOrderId, sub.subOrderId)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[10px] inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedText === sub.subOrderId ? (
                              <>
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-2.5 h-2.5 text-slate-500" />
                                <span>Copy ID</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {!proofSubmitted ? (
                <div>
                  <div className="mb-3">
                    <h4 className="text-xs font-bold text-gray-900">Complete Payment & Upload Voucher</h4>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      To expedite factory processing, please complete payment via any channel below and provide TrxID or receipt.
                    </p>
                  </div>

                  {/* Payment Method Tabs */}
                  <div className="flex border-b border-gray-200 mb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("bkash")}
                      className={`flex-1 py-2 px-1 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                        selectedMethod === "bkash"
                          ? "border-[#D12053] text-[#D12053] bg-pink-50/40"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      bKash
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("nagad")}
                      className={`flex-1 py-2 px-1 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                        selectedMethod === "nagad"
                          ? "border-[#F7931E] text-[#F7931E] bg-orange-50/40"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Nagad
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("bank")}
                      className={`flex-1 py-2 px-1 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
                        selectedMethod === "bank"
                          ? "border-blue-600 text-blue-600 bg-blue-50/40"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      Bank Account
                    </button>
                  </div>

                  {/* TAB 1: BKASH */}
                  {selectedMethod === "bkash" && (
                    <div className="bg-pink-50/50 border border-pink-200 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <div>
                          <div className="text-[10px] font-medium text-pink-700">bKash Personal Number ({settings.bkashType})</div>
                          <div className="text-base font-bold font-mono text-[#D12053]">{settings.bkashNumber}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.bkashNumber, "bkash")}
                          className="flex items-center gap-1 bg-[#D12053] hover:bg-[#b01642] text-white px-2.5 py-1 rounded text-xs font-medium transition"
                        >
                          {copiedText === "bkash" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedText === "bkash" ? "Copied!" : "Copy"}
                        </button>
                      </div>

                      <div className="text-[11px] text-gray-600 space-y-0.5 mt-2 pt-2 border-t border-pink-200">
                        <p>1. Open your bKash app and select <strong>'Send Money'</strong>.</p>
                        <p>2. Send <strong>BDT {createdOrder.total?.toLocaleString()}</strong> to the number above.</p>
                        <p>3. Enter Reference as Order ID: <strong>{createdOrder.id}</strong>.</p>
                        <p>4. Take a screenshot of the successful transaction and input the TrxID below.</p>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: NAGAD */}
                  {selectedMethod === "nagad" && (
                    <div className="bg-orange-50/50 border border-orange-200 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <div>
                          <div className="text-[10px] font-medium text-orange-700">Nagad Personal Number ({settings.nagadType})</div>
                          <div className="text-base font-bold font-mono text-[#F7931E]">{settings.nagadNumber}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.nagadNumber, "nagad")}
                          className="flex items-center gap-1 bg-[#F7931E] hover:bg-[#d67b11] text-white px-2.5 py-1 rounded text-xs font-medium transition"
                        >
                          {copiedText === "nagad" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedText === "nagad" ? "Copied!" : "Copy"}
                        </button>
                      </div>

                      <div className="text-[11px] text-gray-600 space-y-0.5 mt-2 pt-2 border-t border-orange-200">
                        <p>1. Open Nagad app or dial *167# and select <strong>'Send Money'</strong>.</p>
                        <p>2. Send <strong>BDT {createdOrder.total?.toLocaleString()}</strong> to the number above.</p>
                        <p>3. Save the Transaction ID (TrxID) and confirmation voucher screenshot.</p>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: BANK */}
                  {selectedMethod === "bank" && (
                    <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-start mb-1.5">
                        <div>
                          <div className="text-[10px] font-medium text-blue-700">{settings.bankName}</div>
                          <div className="text-xs font-bold text-gray-800 mt-0.5">Account Name: {settings.bankAccountName}</div>
                          <div className="text-sm font-bold font-mono text-blue-800 mt-0.5">Account No: {settings.bankAccountNumber}</div>
                          <div className="text-[10px] text-gray-600 mt-0.5">Branch: {settings.bankBranch} | Routing: {settings.bankRouting}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.bankAccountNumber, "bank")}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-medium transition"
                        >
                          {copiedText === "bank" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedText === "bank" ? "Copied!" : "Copy"}
                        </button>
                      </div>

                      <div className="text-[11px] text-gray-600 space-y-0.5 mt-2 pt-2 border-t border-blue-200">
                        <p>Deposit via online banking / branch counter and upload transaction slip or transfer receipt screenshot.</p>
                      </div>
                    </div>
                  )}

                  {/* PROOF SUBMISSION FORM */}
                  <form onSubmit={handleSubmitPaymentProof} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {selectedMethod === "bank" ? "Sender Account Name / No *" : "Sender Mobile Number *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          placeholder={selectedMethod === "bank" ? "Account / Name" : "01XXXXXXXXX"}
                          className="w-full border border-gray-300 rounded-md p-2 text-xs focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Transaction ID (TrxID / Ref No) *
                        </label>
                        <input
                          type="text"
                          required
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. 9J28DA91K"
                          className="w-full border border-gray-300 rounded-md p-2 text-xs font-mono focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Screenshot Upload Dropzone */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Upload Payment Voucher or Bank Slip *
                      </label>
                      
                      {!screenshotPreview ? (
                        <label className="border-2 border-dashed border-gray-300 hover:border-primary bg-gray-50/50 hover:bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition">
                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs font-medium text-gray-700">Click to select screenshot or slip</span>
                          <span className="text-[10px] text-gray-500 mt-0.5">PNG, JPG, JPEG or PDF</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotChange}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-12 h-12 rounded border bg-white overflow-hidden flex items-center justify-center">
                              <img src={screenshotPreview} alt="Payment Proof" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-800">Screenshot Attached</div>
                              <div className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                                <Check className="w-3 h-3" /> Ready to submit
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setScreenshotPreview(null)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="submit"
                        disabled={submittingProof}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition shadow-xs disabled:opacity-70 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                      >
                        {submittingProof ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Submit Payment Voucher
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate("/account")}
                        className="px-3 py-2.5 border border-gray-300 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-medium transition cursor-pointer"
                      >
                        Submit Later
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* PROOF SUBMITTED SUCCESS STATE */
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Payment Voucher Received!</h4>
                  <p className="text-xs text-gray-600 max-w-md mx-auto mb-4">
                    Thank you! Your transaction voucher has been sent to our accounts desk for verification. Order processing begins immediately.
                  </p>

                  {createdOrders.length > 1 ? (
                    <div className="text-left mb-4 space-y-2">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-900">
                        <strong className="block mb-0.5">🎉 Individual Order IDs & Invoices generated for your {createdOrders.length} items:</strong>
                        <span className="text-[11px] text-emerald-700">If any item is out of stock in future, isolated refunds or adjustments can be processed quickly without delaying your other orders.</span>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {createdOrders.map((ord: any, idx: number) => {
                          const oId = ord.orderId || ord.id;
                          const invId = ord.invoice?.invoiceNumber || `INV-${oId}`;
                          const itName = ord.items?.[0]?.name || ord.items?.[0]?.description || "Product";
                          const itQty = ord.items?.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0) || 1;
                          const itPrice = Number(ord.total || ord.subtotal || 0);

                          return (
                            <div key={oId} className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex items-center justify-between gap-3 text-xs">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-primary">#{oId}</span>
                                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                                    {invId}
                                  </span>
                                </div>
                                <div className="text-slate-800 font-semibold text-[11px] line-clamp-1 mt-0.5">
                                  {itName}
                                </div>
                                <div className="text-slate-500 text-[10px] font-mono mt-0.5">
                                  Qty: {itQty} pcs • Paid: BDT {itPrice.toLocaleString()}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedInvoiceOrder(ord);
                                  setShowInvoicePreview(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shrink-0 flex items-center gap-1 transition cursor-pointer"
                              >
                                <FileText className="w-3 h-3 text-amber-400" />
                                <span>Invoice</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-left max-w-sm mx-auto mb-4 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Order ID:</span>
                        <span className="font-mono font-bold text-gray-900">{createdOrder.orderId || createdOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Invoice ID:</span>
                        <span className="font-mono font-bold text-primary">{createdOrder.invoice?.invoiceNumber || `INV-${createdOrder.orderId || createdOrder.id}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Method:</span>
                        <span className="font-bold uppercase text-emerald-600">{selectedMethod}</span>
                      </div>
                      {transactionId && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Transaction ID:</span>
                          <span className="font-mono font-bold text-gray-800">{transactionId}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                          Payment Submitted (Pending Verification)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setShowInvoicePreview(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg transition text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-orange-400" /> View 2-Part Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (createdOrder) {
                          downloadInvoicePdf(createInvoiceFromOrder({
                            ...createdOrder,
                            orderId: createdOrder.orderId || createdOrder.id,
                            paymentStatus: "Payment Submitted"
                          }));
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard?tab=orders")}
                      className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-lg transition text-xs shadow cursor-pointer"
                    >
                      View Order in Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/shop")}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition text-xs cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      {/* 2-Part Invoice Preview Modal */}
      {showInvoicePreview && (selectedInvoiceOrder || createdOrder) && (
        <InvoiceModal
          order={selectedInvoiceOrder || createdOrder}
          isOpen={showInvoicePreview}
          onClose={() => setShowInvoicePreview(false)}
        />
      )}
    </div>
  );
}
