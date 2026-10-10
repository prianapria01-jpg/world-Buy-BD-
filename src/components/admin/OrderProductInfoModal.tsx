import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Package,
  Layers,
  DollarSign,
  Truck,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Printer,
  ChevronRight,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  Link as LinkIcon,
  ShoppingBag,
  ShieldAlert,
  MessageCircle,
  Eye,
  Maximize2
} from "lucide-react";
import { enrichOrderWithSubOrders, extractProductLink } from "../../utils/orderVariations";
import { downloadCustomInvoicePdf, buildInvoiceFromOrder } from "../../utils/customInvoice";
import CustomerPhoneSecureDisplay from "./CustomerPhoneSecureDisplay";
import { canViewCustomerPhone } from "../../utils/customerPrivacy";
import { canAccessProductSourceLink } from "../../utils/productPrivacy";
import { getProductPath } from "../../utils/productUrl";
import { Lock } from "lucide-react";

interface OrderProductInfoModalProps {
  order: any;
  hide1688?: boolean;
  department?: string;
  showFullWorkspace?: boolean;
  onClose: () => void;
  onOpenFullPipeline?: (order: any) => void;
}

export default function OrderProductInfoModal({
  order,
  hide1688,
  department,
  showFullWorkspace,
  onClose,
  onOpenFullPipeline
}: OrderProductInfoModalProps) {
  const canAccessSourceLink = React.useMemo(() => {
    if (hide1688) return false;
    return canAccessProductSourceLink({ viewerDepartment: department });
  }, [hide1688, department]);

  const [activeTab, setActiveTab] = useState<"products" | "source_links" | "financials" | "customer">("products");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!order) return null;

  const safeOrder = enrichOrderWithSubOrders(order);
  const canonicalOrderId = String(safeOrder.mainOrderId || safeOrder.orderId || safeOrder.id || "");
  const invoiceData = buildInvoiceFromOrder(safeOrder, safeOrder.invoice);

  // Extract products / items
  const items: any[] = Array.isArray(safeOrder.items) && safeOrder.items.length > 0
    ? safeOrder.items
    : [
        {
          name: safeOrder.productName || "Imported Wholesale Product",
          image: safeOrder.productImage || safeOrder.image || "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
          quantity: safeOrder.totalQuantity || safeOrder.quantity || 1,
          price: safeOrder.price || safeOrder.total || 0,
          variation: safeOrder.variation || safeOrder.variantName || "",
          selectedColor: safeOrder.selectedColor || "",
          selectedSize: safeOrder.selectedSize || "",
          importedUrl: safeOrder.importedUrl || safeOrder.sourceUrl || ""
        }
      ];

  const totalPieces = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const productSubtotal = Math.round(Number(safeOrder.subtotal ?? invoiceData.subTotal ?? safeOrder.total ?? 0));
  const discountAmount = Math.round(Number(safeOrder.discountAmount ?? invoiceData.discount ?? 0));
  const shippingRatePerKg = Number(safeOrder.shippingRatePerKg ?? invoiceData.shippingRatePerKg ?? 780);
  const weightNum = parseFloat(String(safeOrder.weight || invoiceData.weightApx || "0").replace(/[^0-9.]/g, "")) || 0;
  const shippingCharge = Math.round(Number(safeOrder.shippingCharge ?? invoiceData.shippingCharge ?? (weightNum * shippingRatePerKg)));
  const chinaCourierCharge = Math.round(Number(safeOrder.chinaCourierCharge ?? invoiceData.chinaCourier ?? 0));
  const paidAmount = Math.round(Number(safeOrder.paidAmount ?? invoiceData.paidAmount ?? 0));
  const totalPayable = productSubtotal - discountAmount + shippingCharge + chinaCourierCharge;
  const netDue = Math.max(0, totalPayable - paidAmount);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const cleanPhone = String(safeOrder.customerInfo?.phone || safeOrder.phone || "").replace(/^0/, "").replace(/[^0-9]/g, "");

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-5 sm:px-6 py-4.5 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md font-bold text-lg">
              <span className="italic font-serif font-black">i</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-black bg-white/15 px-2.5 py-0.5 rounded-md text-amber-300 border border-white/10">
                  {canonicalOrderId}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  safeOrder.status === "Delivered"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : safeOrder.status === "Stock Out"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  ● {safeOrder.status || "Pending"}
                </span>
                <span className="text-[11px] font-semibold text-slate-300">
                  {safeOrder.date ? new Date(safeOrder.date).toLocaleDateString("en-GB") : ""}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
                <span>Product Details & Sourcing Information</span>
                <span className="text-xs text-slate-400 font-normal hidden sm:inline">(Product & Sourcing Details)</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                downloadCustomInvoicePdf(invoiceData, "both");
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/15"
              title="Download PDF Invoice"
            >
              <Printer className="w-3.5 h-3.5 text-slate-200" />
              <span className="hidden sm:inline">PDF Invoice</span>
            </button>
            {showFullWorkspace !== false && !department && onOpenFullPipeline && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullPipeline(safeOrder);
                }}
                className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Full Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer ml-1"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 px-5 sm:px-6 py-2.5 border-b border-slate-200 flex items-center gap-1.5 sm:gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "products"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Package className="w-3.5 h-3.5 text-primary" />
            <span>Products & Variations ({items.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("source_links")}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "source_links"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>1688 Source Links</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("financials")}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "financials"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Financials & Invoice Summary</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("customer")}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "customer"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <User className="w-3.5 h-3.5 text-purple-600" />
            <span>Customer & Delivery</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/70">
          {/* TAB 1: PRODUCTS & VARIATIONS */}
          {activeTab === "products" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3.5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    📦
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Total Ordered: {totalPieces} Pieces ({items.length} Variation{items.length > 1 ? "s" : ""})
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Product details, quantity ordered, unit prices, and specifications
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">Product Subtotal</span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    BDT {productSubtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items Card List */}
              <div className="space-y-3">
                {items.map((it: any, idx: number) => {
                  const itemQty = Number(it.quantity) || 1;
                  const itemUnitPrice = Number(it.price || it.unitPrice || 0);
                  const itemTotal = itemUnitPrice * itemQty;
                  const linkObj = extractProductLink(it);
                  const sourceLink = it.importedUrl || it.sourceUrl || linkObj.url;
                  const specLabels = [it.selectedColor, it.selectedSize, it.variation, it.variantName].filter(Boolean);

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-start gap-3.5">
                          <div className="relative group cursor-pointer" onClick={() => it.image && setPreviewImage(it.image)}>
                            <img
                              src={it.image || "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80"}
                              alt={it.name || "Product"}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 bg-slate-100 group-hover:scale-102 transition"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Maximize2 className="w-4 h-4 text-white" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                Item #{idx + 1}
                              </span>
                              {it.subOrderId && (
                                <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                                  Sub: {it.subOrderId}
                                </span>
                              )}
                              {it.category && (
                                <span className="text-[10px] font-semibold text-slate-500">
                                  Category: {it.category}
                                </span>
                              )}
                            </div>
                            {(() => {
                              const storeProductPath = getProductPath(
                                it.productId || it.offerId || it.id || it.importedUrl || it.sourceUrl || linkObj.url
                              );
                              return (
                                <div className="space-y-1">
                                  <a
                                    href={storeProductPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-bold text-slate-900 leading-snug hover:text-blue-700 hover:underline inline-flex items-center gap-1.5 group cursor-pointer"
                                    title="প্রোডাক্ট পেজ খুলুন / Open Store Product Page"
                                  >
                                    <span>{it.name || "Wholesale Imported Product"}</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 shrink-0 transition" />
                                  </a>
                                  <div>
                                    <a
                                      href={storeProductPath}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                                    >
                                      <ShoppingBag className="w-3 h-3" />
                                      <span>ওয়েবসাইটে দেখুন (Open Store Page)</span>
                                    </a>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Specifications / Variation tags */}
                            {specLabels.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Specs:</span>
                                {specLabels.map((lbl, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold"
                                  >
                                    {lbl}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantity & Price Highlight Box */}
                        <div className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl p-3 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block sm:text-right">Ordered Qty</span>
                            <span className="text-base sm:text-lg font-black text-primary font-mono block sm:text-right">
                              {itemQty} Pcs
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 font-mono block">
                              Unit: BDT {itemUnitPrice.toLocaleString()}
                            </span>
                            <span className="text-xs font-black text-emerald-700 font-mono block">
                              Subtotal: BDT {itemTotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Product Direct Source Link Bar */}
                      {sourceLink ? (
                        canAccessSourceLink ? (
                          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] uppercase shrink-0">
                                1688 Source
                              </span>
                              <span className="font-mono text-slate-600 truncate text-[11px]" title={sourceLink}>
                                {sourceLink}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCopy(sourceLink, `link-${idx}`)}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                              >
                                {copiedLink === `link-${idx}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-slate-500" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>
                              <a
                                href={sourceLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-2xs"
                              >
                                <span>Open on 1688</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-amber-50/70 rounded-xl p-2.5 border border-amber-200/80 flex items-center justify-between gap-2 text-xs">
                            <span className="inline-flex items-center gap-1.5 text-amber-800 text-[11px] font-semibold">
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Source Link Protected (Main Admin & Purchase Dept Only)</span>
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          No direct 1688 external link attached for this variation.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SOURCE LINKS & 1688 SOURCING */}
          {activeTab === "source_links" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      1688 / China Supplier Source Links
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify original factory supply listings, pricing, and supplier tracking
                    </p>
                  </div>
                  {canAccessSourceLink && (
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                      1688 ID: {safeOrder.order1688Id || safeOrder.purchaseInfo?.order1688Id || "Pending Upload"}
                    </span>
                  )}
                </div>

                {!canAccessSourceLink ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-2">
                    <Lock className="w-8 h-8 text-amber-600 mx-auto" />
                    <div className="font-bold text-amber-900 text-sm">Source Link Access Restricted</div>
                    <p className="text-xs text-amber-700 max-w-md mx-auto">
                      Direct supplier product source links (1688 / China Supplier Links) are restricted to <strong>Main Admin</strong> and <strong>Purchase Department</strong> staff.
                    </p>
                  </div>
                ) : safeOrder.subOrders && safeOrder.subOrders.length > 0 ? (
                  <div className="space-y-3">
                    {safeOrder.subOrders.map((sub: any, sIdx: number) => (
                      <div key={sIdx} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                              {sub.subOrderId}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{sub.productName}</span>
                          </div>
                          <span className="text-xs font-mono text-slate-600">
                            Rate: BDT {Number(sub.shippingRatePerKg || 780).toLocaleString()} / KG
                          </span>
                        </div>

                        {sub.productLink ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="font-mono text-xs text-blue-700 truncate max-w-md" title={sub.productLink}>
                              {sub.productLink}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCopy(sub.productLink, `sublink-${sIdx}`)}
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                {copiedLink === `sublink-${sIdx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedLink === `sublink-${sIdx}` ? "Copied" : "Copy"}</span>
                              </button>
                              <a
                                href={sub.productLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1"
                              >
                                <span>Open Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">No external link recorded.</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  items.map((it: any, iIdx: number) => {
                    const src = it.importedUrl || it.sourceUrl || extractProductLink(it).url;
                    return (
                      <div key={iIdx} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{it.name}</div>
                          {src && (
                            <div className="font-mono text-[11px] text-blue-700 truncate max-w-md mt-0.5">
                              {src}
                            </div>
                          )}
                        </div>
                        {src && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopy(src, `src-${iIdx}`)}
                              className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedLink === `src-${iIdx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedLink === `src-${iIdx}` ? "Copied" : "Copy"}</span>
                            </button>
                            <a
                              href={src}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1"
                            >
                              <span>Open 1688</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Sourcing & Tracking identifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-900 uppercase block">1688 Order ID (Purchase Dept)</span>
                    <span className="font-mono font-black text-sm text-purple-950 mt-0.5 block">
                      {safeOrder.order1688Id || safeOrder.purchaseInfo?.order1688Id || "Pending Upload by Purchase Dept"}
                    </span>
                  </div>
                  <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                    <span className="text-[10px] font-bold text-blue-900 uppercase block">China Warehouse Tracking Number</span>
                    <span className="font-mono font-black text-sm text-blue-950 mt-0.5 block">
                      {safeOrder.trackingNumber || safeOrder.purchaseInfo?.trackingNumber || safeOrder.chinaWarehouseInfo?.chinaAwb || "Pending Upload"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIALS & INVOICE BREAKDOWN */}
          {activeTab === "financials" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Complete Financial & Invoice Breakdown
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    safeOrder.paymentStatus === "Paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {safeOrder.paymentStatus || "Unpaid"}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">1. Product Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      BDT {productSubtotal.toLocaleString()}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="py-2.5 flex items-center justify-between text-rose-600">
                      <span className="font-semibold">2. Discount Applied:</span>
                      <span className="font-mono font-bold text-sm">
                        - BDT {discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-slate-600 font-semibold block">3. International Shipping:</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {weightNum} KG × BDT {shippingRatePerKg} / KG
                      </span>
                    </div>
                    <span className="font-mono font-bold text-indigo-700 text-sm">
                      BDT {shippingCharge.toLocaleString()}
                    </span>
                  </div>
                  {chinaCourierCharge > 0 && (
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-600 font-semibold">4. China Courier Charge:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        BDT {chinaCourierCharge.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="py-3 flex items-center justify-between bg-slate-50 px-3 rounded-xl mt-1">
                    <span className="text-slate-800 font-black text-sm">Total Calculated Invoice:</span>
                    <span className="font-mono font-black text-base text-slate-900">
                      BDT {totalPayable.toLocaleString()}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between text-emerald-700">
                    <div>
                      <span className="font-semibold block">Advance / Partial Paid:</span>
                      <span className="text-[11px] text-slate-400">
                        Method: {safeOrder.paymentInfo?.method || safeOrder.customerInfo?.payment || "Online / bKash"}
                        {safeOrder.paymentInfo?.transactionId && ` (TrxID: ${safeOrder.paymentInfo.transactionId})`}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm">
                      - BDT {paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="py-3 flex items-center justify-between bg-rose-50 px-3 rounded-xl border border-rose-200">
                    <div>
                      <span className="font-black text-rose-800 text-sm block">Final Invoice Due:</span>
                      <span className="text-[10px] text-rose-600">Payable during delivery handover</span>
                    </div>
                    <span className="font-mono font-black text-lg text-rose-600">
                      BDT {netDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMER & DELIVERY */}
          {activeTab === "customer" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    Customer & Delivery Information
                  </h3>
                  {cleanPhone && canViewCustomerPhone({ order: safeOrder, viewerDepartment: department, isMasterAdmin: !department || department === "admin" }) && (
                    <a
                      href={`https://wa.me/880${cleanPhone}?text=${encodeURIComponent(`Hello ${safeOrder.customerInfo?.name || "Customer"}, regarding your order ${canonicalOrderId} at World Buy BD:`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Chat</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Customer Name</span>
                    <span className="text-sm font-bold text-slate-900 block">
                      {safeOrder.customerInfo?.name || safeOrder.customer || "N/A"}
                    </span>
                  </div>
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Phone Number</span>
                    <CustomerPhoneSecureDisplay
                      order={safeOrder}
                      viewerDepartment={department}
                      isMasterAdmin={!department || department === "admin"}
                      showActions={true}
                    />
                  </div>
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Full Delivery Address</span>
                    <span className="text-xs text-slate-800 leading-relaxed block font-medium">
                      {safeOrder.customerInfo?.address || "No delivery address provided"}
                      {safeOrder.customerInfo?.division && ` (${safeOrder.customerInfo.division})`}
                      {safeOrder.customerInfo?.postalCode && ` - ${safeOrder.customerInfo.postalCode}`}
                    </span>
                  </div>
                  {safeOrder.customerInfo?.email && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Email Address</span>
                      <span className="text-xs text-slate-800 font-mono block">
                        {safeOrder.customerInfo.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>
              All product variations, China supplier links, and live pricing are linked to Main Order #{canonicalOrderId}.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => downloadCustomInvoicePdf(invoiceData, "both")}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-xl max-h-[85vh]">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/20 bg-white"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
