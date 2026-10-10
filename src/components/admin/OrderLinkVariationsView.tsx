import React, { useState } from "react";
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  Package, 
  FileText, 
  ShoppingBag,
  ArrowUpRight,
  Lock
} from "lucide-react";
import { ProductLinkGroup } from "../../utils/orderVariations";
import { canAccessProductSourceLink } from "../../utils/productPrivacy";
import { getProductPath } from "../../utils/productUrl";

interface OrderLinkVariationsViewProps {
  groups: ProductLinkGroup[];
  showOrderMeta?: boolean;
  onUpdateChinaCourier?: (subOrderId: string, amount: number) => void;
}

export const OrderLinkVariationsView: React.FC<OrderLinkVariationsViewProps> = ({ 
  groups,
  showOrderMeta = false,
  onUpdateChinaCourier
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedTextKey, setCopiedTextKey] = useState<string | null>(null);
  const [localCourierBill, setLocalCourierBill] = useState<Record<string, number>>({});

  const canAccessSourceLink = canAccessProductSourceLink();

  const handleCopyLink = (url: string, key: string) => {
    if (!canAccessSourceLink) return;
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopySummary = (group: ProductLinkGroup) => {
    const lines = [
      `Product: ${group.productName}`,
      canAccessSourceLink ? `Source Link: ${group.url}` : `Source Link: [Protected (Main Admin & Purchase Only)]`,
      `Total Variations: ${group.totalVariationsCount} | Total Pieces: ${group.totalPieces} Pcs`,
      `--- Variation & Quantity List ---`,
      ...group.variations.map((v, i) => `${i + 1}. ${v.name}: ${v.quantity} Pcs (Unit: BDT ${v.unitPrice})`),
      `Subtotal: BDT ${group.totalAmount.toLocaleString()}`
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedTextKey(group.key);
    setTimeout(() => setCopiedTextKey(null), 2000);
  };

  if (!groups || groups.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
        No products or variations found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group, gIdx) => (
        <div 
          key={group.key || gIdx} 
          className="bg-white border-2 border-emerald-100 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-emerald-300"
        >
          {/* 1. Header: Product info + Source Link */}
          {(() => {
            const groupProductPath = getProductPath(group.offerId || group.key || group.url || group.productName);
            return (
              <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white p-4 sm:p-5 border-b border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <a
                    href={groupProductPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group shrink-0 block"
                    title="প্রোডাক্ট পেজ খুলুন / Open Store Product Page"
                  >
                    <img 
                      src={group.productImage || "https://placehold.co/80"} 
                      alt={group.productName} 
                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-emerald-200 shadow-xs bg-white group-hover:scale-105 group-hover:border-emerald-500 transition" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </span>
                  </a>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                        Link #{gIdx + 1}
                      </span>
                      {group.subOrderId && (
                        <span className="font-mono font-bold text-xs bg-slate-900 text-amber-300 px-2 py-0.5 rounded shadow-xs">
                          Sub-Order ID: {group.subOrderId}
                        </span>
                      )}
                      {group.mainOrderId && (
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Main Order: {group.mainOrderId}
                        </span>
                      )}
                      {group.category && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {group.category}
                        </span>
                      )}
                      {group.offerId && (
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Offer ID: {group.offerId}
                        </span>
                      )}
                    </div>
                    <a
                      href={groupProductPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-charcoal text-sm sm:text-base leading-snug hover:text-emerald-700 hover:underline inline-flex items-center gap-1.5 group cursor-pointer"
                      title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                    >
                      <span>{group.productName}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 shrink-0 transition" />
                    </a>

                {/* Source Link Section */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-gray-500 font-medium">Source Link:</span>
                  {canAccessSourceLink ? (
                    <>
                      <a 
                        href={group.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1 font-mono text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-300 px-2 py-0.5 rounded-md hover:bg-emerald-50 transition max-w-xs sm:max-w-md truncate font-semibold"
                        title={group.url}
                      >
                        <span className="truncate">{group.url}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      </a>

                      <button 
                        type="button"
                        onClick={() => handleCopyLink(group.url, group.key)}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                      >
                        {copiedKey === group.key ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-gray-500" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium"
                      title="Product source link is restricted to Main Admin and Purchase Department"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Source Link Protected (Purchase & Admin)</span>
                    </span>
                  )}

                  <button 
                    type="button"
                    onClick={() => handleCopySummary(group)}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium transition cursor-pointer"
                  >
                    {copiedTextKey === group.key ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span className="font-bold">List Copied!</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3 h-3 text-emerald-700" />
                        <span>Copy Variation List</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics for this Link */}
            <div className="flex items-center gap-2 sm:gap-3 bg-white p-2.5 rounded-xl border border-emerald-200/80 shrink-0 self-start md:self-center">
              <div className="px-3 py-1 text-center border-r border-gray-100">
                <div className="text-[10px] text-gray-500 font-medium">China Courier Bill</div>
                <div className="flex items-center gap-1">
                   <input
                     type="number"
                     min="0"
                     defaultValue={group.chinaCourierBill || 0}
                     className="w-16 text-center font-bold text-emerald-700 border border-emerald-200 rounded p-0.5 text-xs"
                     onBlur={(e) => {
                       if (onUpdateChinaCourier && group.subOrderId) {
                         onUpdateChinaCourier(group.subOrderId, Number(e.target.value));
                       }
                     }}
                   />
                </div>
              </div>
              <div className="px-3 py-1 text-center border-r border-gray-100">
                <div className="text-[10px] text-gray-500 font-medium">Unique Variations</div>
                <div className="text-base font-bold text-emerald-700 flex items-center justify-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  {group.totalVariationsCount}  items
                </div>
              </div>
              <div className="px-3 py-1 text-center border-r border-gray-100">
                <div className="text-[10px] text-gray-500 font-medium">Total Quantity</div>
                <div className="text-base font-extrabold text-charcoal flex items-center justify-center gap-1">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  <span className="text-emerald-700">{group.totalPieces}</span> Pcs
                </div>
              </div>
              <div className="px-3 py-1 text-center">
                <div className="text-[10px] text-gray-500 font-medium">Subtotal</div>
                <div className="text-base font-bold text-charcoal">
                  BDT {group.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
            );
          })()}

          {/* 2. Detailed Variations Breakdown Table */}
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/90 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4 w-16 text-center">Image</th>
                  <th className="py-2.5 px-4">Variation Specs (Color / Size / Type)</th>
                  {showOrderMeta && <th className="py-2.5 px-4">Order ID & Customer</th>}
                  <th className="py-2.5 px-4 text-center font-bold text-charcoal bg-emerald-50/50">
                    Ordered Quantity (Pcs)
                  </th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {group.variations.map((v, vIdx) => (
                  <tr key={v.cartItemId || vIdx} className="hover:bg-emerald-50/30 transition">
                    <td className="py-3 px-4 text-center font-mono font-medium text-gray-400">
                      {vIdx + 1}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <a
                        href={getProductPath(group.offerId || group.key || group.url || group.productName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block group"
                        title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                      >
                        <img 
                          src={v.image || group.productImage || "https://placehold.co/50"} 
                          alt={v.name} 
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200 mx-auto shadow-2xs group-hover:scale-105 group-hover:border-emerald-500 transition" 
                          referrerPolicy="no-referrer"
                        />
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={getProductPath(group.offerId || group.key || group.url || group.productName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-charcoal text-sm hover:text-emerald-700 hover:underline group inline-flex items-center gap-1"
                        title="প্রোডাক্ট পেজ খুলুন / Open Product Page"
                      >
                        <span>{v.name}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-700 shrink-0 transition" />
                      </a>
                      {v.skuId && (
                        <span className="text-[10px] text-gray-400 font-mono block">
                          SKU: {v.skuId}
                        </span>
                      )}
                    </td>

                    {showOrderMeta && (
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] block w-fit">
                          {v.orderId}
                        </span>
                        {v.customerName && (
                          <span className="text-[11px] text-gray-600 block mt-0.5">
                            {v.customerName} {v.customerPhone ? `(${v.customerPhone})` : ""}
                          </span>
                        )}
                      </td>
                    )}

                    {/* Ordered Quantity - Highlighted Prominently */}
                    <td className="py-3 px-4 text-center bg-emerald-50/40">
                      <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {v.quantity} Pcs
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-gray-600">
                      BDT {v.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-charcoal">
                      BDT {v.totalPrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50/90 border-t border-gray-200 font-bold text-charcoal">
                <tr>
                  <td colSpan={showOrderMeta ? 4 : 3} className="py-3 px-4 text-right">
                    Total for this link ({group.totalVariationsCount} variations):
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-700 font-black text-sm bg-emerald-100/60">
                    {group.totalPieces} Pcs
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-right text-emerald-800 text-sm">
                    BDT {group.totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Action Bar */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500">
            <div>
              When buying from supplier, open link and add corresponding quantities to cart.
            </div>
            <a 
              href={group.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-300 hover:border-emerald-400 px-3 py-1 rounded-lg shadow-2xs transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              Open supplier link to place order
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderLinkVariationsView;
