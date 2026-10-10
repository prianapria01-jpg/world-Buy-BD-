import React from "react";
import { CustomInvoiceData, buildInvoiceFromOrder } from "../../utils/customInvoice";
import BrandLogo from "../common/BrandLogo";
import { getSafeImageUrl, DEFAULT_PRODUCT_FALLBACK } from "../../utils/imageUrl";
import { Scissors, CheckCircle2, Clock, Package, Phone, Mail, MapPin } from "lucide-react";

interface CustomInvoiceViewProps {
  invoice?: CustomInvoiceData;
  data?: CustomInvoiceData;
  id?: string;
  copyMode?: "both" | "customer" | "office";
  hide1688?: boolean;
}

interface SingleInvoiceSectionProps {
  invoice: CustomInvoiceData;
  partType: "customer" | "office";
  hide1688?: boolean;
}

const SingleInvoicePart: React.FC<SingleInvoiceSectionProps> = ({ invoice, partType, hide1688 }) => {
  const isOffice = partType === "office";
  const subTotal = Math.round(Number(invoice.subTotal || invoice.productSubtotal || 0));
  const discount = Math.round(Number(invoice.discount || 0));
  const rawChinaCourier = Math.round(Number(invoice.chinaCourier || invoice.chinaCourierCharge || 0));
  const weightKg = Number(invoice.weightKg || 0);
  const shippingRatePerKg = Math.round(Number(invoice.shippingRatePerKg || invoice.shippingRate || 780));
  const rawShippingCharge = Math.round(
    Number(
      invoice.shippingCharge ||
        (weightKg > 0 && shippingRatePerKg > 0 ? Math.round(weightKg * shippingRatePerKg) : 0)
    )
  );
  const hasAdminUploadedCharges = Boolean(
    invoice.adminChargesUploaded === true ||
      rawChinaCourier > 0 ||
      (rawShippingCharge > 0 && rawShippingCharge !== 100)
  );
  const chinaCourier = hasAdminUploadedCharges ? rawChinaCourier : 0;
  const shippingCharge = hasAdminUploadedCharges ? rawShippingCharge : 0;
  const grandTotal = Math.max(0, subTotal - discount) + chinaCourier + shippingCharge;
  // Customer's initial 100% product payment is treated as Partial Paid
  const paidAmount = Math.round(Number(invoice.paidAmount ?? Math.max(0, subTotal - discount)));
  const dueBalance = Math.max(0, grandTotal - paidAmount);

  const isFullyPaid =
    (invoice.paymentStatus === "Paid" || invoice.paymentStatus === "Fully Paid") &&
    dueBalance === 0 &&
    (shippingCharge > 0 || chinaCourier > 0);

  const itemsList =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            no: 1,
            image: "",
            description: invoice.productName || "Imported Product",
            variation: "",
            quantity: invoice.totalProductQty || 1,
            unitPrice: subTotal,
            totalPrice: subTotal,
          },
        ];

  return (
    <div className="bg-white text-slate-900 rounded-xl border border-slate-300 overflow-hidden shadow-xs print:shadow-none print:rounded-none">
      {/* Top Corporate Header Bar */}
      <div className="px-6 py-5 border-b-2 border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <BrandLogo size="sm" showTagline={false} />
          </div>
          <div className="border-l border-slate-200 pl-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
                WORLD BUY BD INTERNATIONAL
              </h2>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                  isOffice
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-primary text-white border-primary"
                }`}
              >
                {isOffice ? "OFFICE COPY" : "CUSTOMER COPY"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Kazipara, Mirpur-10, Dhaka 1216 • Hotline: +880 1355-136661 • worldbuybd01@gmail.com
            </p>
          </div>
        </div>

        {/* Right Invoice Meta Block */}
        <div className="text-left sm:text-right w-full sm:w-auto bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
          <div className="flex items-center gap-1.5 justify-start sm:justify-end flex-wrap">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              {invoice.isSubOrderInvoice ? `LINK INVOICE (LINK #${invoice.linkIndex || 1})` : "COMMERCIAL INVOICE"}
            </span>
            {invoice.isSubOrderInvoice && (
              <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded shadow-2xs">
                Sub-Order Link Invoice
              </span>
            )}
          </div>
          <div className="font-mono font-black text-base text-slate-900 mt-0.5">
            {invoice.invoiceNumber}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            {invoice.isSubOrderInvoice ? (
              <>
                Sub-Order ID: <strong className="font-mono text-amber-600 font-bold">{invoice.subOrderId}</strong>
                {invoice.mainOrderId && (
                  <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                    Parent Order ID: <strong className="text-slate-700">{invoice.mainOrderId}</strong>
                  </span>
                )}
              </>
            ) : (
              <>
                Order ID: <strong className="font-mono text-primary">{invoice.orderId || invoice.mainOrderId}</strong>
              </>
            )} • Date: <strong>{invoice.orderDate}</strong>
          </div>
          {invoice.productLink && (
            <div className="mt-1 flex items-center justify-start sm:justify-end">
              <a 
                href={invoice.productLink} 
                target="_blank" 
                rel="noreferrer" 
                className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-mono inline-flex items-center gap-1"
                title={invoice.productLink}
              >
                <span>View Product Source Link ↗</span>
              </a>
            </div>
          )}
          {!invoice.isSubOrderInvoice && invoice.subOrders && invoice.subOrders.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap justify-start sm:justify-end mt-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sub-Orders ({invoice.subOrders.length} links):</span>
              {invoice.subOrders.map((sub: any) => (
                <span key={sub.subOrderId} className="font-mono font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded">
                  {sub.subOrderId}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* 2-Column Customer Details & Shipment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Billed & Shipped To */}
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-2 mb-2.5 border-b border-slate-200 flex items-center justify-between">
              <span>1. Customer & Delivery Details</span>
              <span className="text-slate-600 font-semibold">
                {invoice.district || "Dhaka"}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-slate-500 shrink-0">Customer Name:</span>
                <span className="font-bold text-slate-900 text-right">
                  {invoice.customerName || "Valued Customer"}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-slate-500 shrink-0">Mobile Phone:</span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  {invoice.phone || "N/A"}
                </span>
              </div>
              {invoice.email && (
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Email Address:</span>
                  <span className="text-slate-700 text-right break-all">
                    {invoice.email}
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between gap-4 pt-1 border-t border-slate-200/70">
                <span className="text-slate-500 shrink-0">Delivery Address:</span>
                <span className="font-medium text-slate-800 text-right leading-snug">
                  {invoice.address || "Bangladesh"}
                </span>
              </div>
            </div>
          </div>

          {/* Order & Logistics Info */}
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-2 mb-2.5 border-b border-slate-200 flex items-center justify-between">
              <span>2. Order & Shipment Summary</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  isFullyPaid
                    ? "bg-emerald-100 text-emerald-800"
                    : paidAmount > 0
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {isFullyPaid ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                {isFullyPaid ? "PAID" : paidAmount > 0 ? "PARTIAL PAID" : "UNPAID / DUE"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <span className="text-slate-500 block text-[10px]">Order Stage</span>
                <span
                  className={`font-bold text-xs ${
                    invoice.status === "Stock Out" ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {invoice.status || "Pending"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Tracking Number</span>
                <span className="font-mono font-bold text-primary text-xs">
                  {invoice.trackingNumber || "Pending Upload"}
                </span>
              </div>
              {isOffice && !hide1688 && (
                <div className="col-span-2 bg-purple-50 border border-purple-200 rounded px-2.5 py-1 flex items-center justify-between">
                  <span className="text-purple-700 font-bold text-[10px] uppercase">1688 Order ID (Office Only):</span>
                  <span className="font-mono font-bold text-purple-900 text-xs">
                    {invoice.order1688Id || "Not Uploaded"}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-500 block text-[10px]">Product Shipping Charge Rate</span>
                <span className="font-mono font-bold text-indigo-700 text-xs">
                  BDT {shippingRatePerKg.toLocaleString()} / KG
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Product Weight (KG)</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {hasAdminUploadedCharges ? invoice.weightApx || invoice.weight || "0 KG" : "Pending Upload"}
                </span>
              </div>
              {hasAdminUploadedCharges && (
                <>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Shipping (Weight × Rate)</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      BDT {shippingCharge.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">China Courier Bill</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      BDT {chinaCourier.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Ordered Products Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-primary" />
              <span>3. Ordered Products & Specifications</span>
            </h3>
            <span className="text-xs text-slate-500">
              Total Items: <strong className="font-mono text-slate-900">{invoice.totalProductQty} pcs</strong>
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-center w-10">SL</th>
                  <th className="py-2.5 px-3 text-center w-14">Image</th>
                  <th className="py-2.5 px-3">Product Description & Variation</th>
                  <th className="py-2.5 px-3 text-center w-20">Qty</th>
                  <th className="py-2.5 px-3 text-right w-28">Unit Price</th>
                  <th className="py-2.5 px-3 text-right w-32">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {itemsList.map((item, idx) => {
                  const safeImg = item.image
                    ? getSafeImageUrl(
                        item.image,
                        DEFAULT_PRODUCT_FALLBACK,
                        item.skuOrVariation ? `${item.description} - ${item.skuOrVariation}` : item.description
                      )
                    : DEFAULT_PRODUCT_FALLBACK;
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {item.no || idx + 1}
                      </td>
                      <td className="py-2 px-3">
                        <div className="w-10 h-10 rounded border border-slate-200 bg-white p-0.5 flex items-center justify-center overflow-hidden mx-auto">
                          <img
                            src={safeImg}
                            alt={item.description}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK;
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {item.description}
                        </div>
                        {item.variation && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Spec / Variation: <span className="font-semibold text-slate-800">{item.variation}</span>
                          </div>
                        )}
                        {item.subOrderId && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                              Sub-Order: {item.subOrderId}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                        {item.quantity} pcs
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        BDT {Number(item.unitPrice || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        BDT {Number(item.totalPrice || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Section: Payment/Office Notes on Left + Step-by-Step Financial Calculation on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch pt-1">
          {/* Left 6 Columns: Payment Instructions OR Office Dispatch Verification */}
          <div className="md:col-span-6 flex flex-col justify-between rounded-lg border border-slate-200 p-4 bg-slate-50/50 text-xs space-y-4">
            {isOffice ? (
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>{hide1688 ? "Office Verification & Delivery Record" : "Office Verification & 1688 Sourcing Record"}</span>
                  <span className="font-mono text-slate-800">{invoice.orderId}</span>
                </div>
                <div className={`grid ${hide1688 ? "grid-cols-1" : "grid-cols-2"} gap-2 text-[11px]`}>
                  {!hide1688 && (
                    <div className="bg-purple-50 p-2 rounded border border-purple-200">
                      <span className="text-purple-600 font-semibold block text-[10px]">1688 Order ID</span>
                      <strong className="font-mono text-purple-950">{invoice.order1688Id || "Not Uploaded"}</strong>
                    </div>
                  )}
                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                    <span className="text-blue-600 font-semibold block text-[10px]">Tracking Number</span>
                    <strong className="font-mono text-blue-950">{invoice.trackingNumber || "Pending"}</strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Payment Channel & TrxID</span>
                    <strong className="font-mono text-slate-900">
                      {invoice.paymentMethod || "Online"} {invoice.transactionId ? `(${invoice.transactionId})` : ""}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Weight × Rate</span>
                    <strong className="font-mono text-slate-900">
                      {invoice.weightApx || "0 KG"} × BDT {shippingRatePerKg}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>Payment Channels & Tracking Info</span>
                  {invoice.trackingNumber && (
                    <span className="font-mono font-bold text-primary">
                      Tracking: {invoice.trackingNumber}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="font-bold text-[#D12053] block">bKash / Nagad (Send Money)</span>
                    <span className="font-mono font-bold text-slate-800">01712-345678 / 01912-345678</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="font-bold text-blue-700 block">South East Bank PLC (Banani Branch)</span>
                    <span className="font-mono font-bold text-slate-800">A/C: 002412100022424 (Md Shamim Hossen)</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                  <p>• Final Payable = (Product Weight × Shipping Charge Rate) + China Courier Bill + Product Price - Partial Paid.</p>
                  <p>• Please keep an unboxing video when receiving your parcel for any claim support.</p>
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-[11px] text-slate-600 text-center">
              <div>
                <div className="border-t border-slate-400 pt-1.5 font-semibold">
                  Customer Signature
                </div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1.5 font-semibold">
                  Authorized Signature
                </div>
              </div>
            </div>
          </div>

          {/* Right 6 Columns: Crystal-Clear Step-by-Step Financial Calculation */}
          <div className="md:col-span-6 rounded-lg border border-slate-300 overflow-hidden bg-white flex flex-col justify-between text-xs">
            <div className="bg-slate-900 text-white px-4 py-2.5 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>4. Final Invoice Calculation Breakdown</span>
              <span className="font-mono text-slate-300">Currency: BDT</span>
            </div>

            <div className="p-4 space-y-2 divide-y divide-slate-100">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">1. Product Price (Items Subtotal):</span>
                <span className="font-mono font-bold text-slate-900">
                  BDT {subTotal.toLocaleString()}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between items-center py-1 text-emerald-700">
                  <span>Less: Discount Applied:</span>
                  <span className="font-mono font-bold">- BDT {discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 text-indigo-800 bg-indigo-50/50 px-2 rounded">
                <span className="font-semibold">Assigned Product Shipping Rate:</span>
                <span className="font-mono font-bold">BDT {shippingRatePerKg.toLocaleString()} / KG</span>
              </div>

              {hasAdminUploadedCharges ? (
                <>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-600">
                      2. (+) Shipping Charge ({invoice.weightApx || "0 KG"} × BDT {shippingRatePerKg}/KG):
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      + BDT {shippingCharge.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-600">
                      3. (+) China Courier Bill:
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      + BDT {chinaCourier.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 pb-1 text-xs font-extrabold text-slate-900">
                    <span>Total Order Bill (Product + Shipping + China Courier):</span>
                    <span className="font-mono text-sm">
                      BDT {grandTotal.toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-1.5 px-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  Shipping Charge & China Courier Bill will be added once uploaded from Admin / CS Panel.
                </div>
              )}

              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="font-bold">4. (-) Partial Paid (Initial Product Payment):</span>
                <span className="font-mono font-black text-sm">
                  - BDT {paidAmount.toLocaleString()}
                </span>
              </div>

              <div
                className={`flex justify-between items-center py-2.5 px-3 rounded-lg border ${
                  dueBalance > 0
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-slate-100 border-slate-200 text-slate-800"
                }`}
              >
                <span className="font-extrabold text-sm">
                  Final Invoice Payable (Net Due):
                </span>
                <span className="font-mono font-black text-base">
                  BDT {dueBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CustomInvoiceView: React.FC<CustomInvoiceViewProps> = ({
  invoice,
  data,
  id = "printable-custom-invoice",
  copyMode = "both",
  hide1688,
}) => {
  const resolvedInvoice = invoice || data || buildInvoiceFromOrder({});
  return (
    <div
      id={id}
      className="bg-slate-100 print:bg-white text-slate-900 mx-auto w-full max-w-[860px] p-2 sm:p-4 font-sans print:p-0 print:max-w-none space-y-6"
    >
      {/* PART 1: CUSTOMER INVOICE */}
      {(copyMode === "both" || copyMode === "customer") && (
        <SingleInvoicePart invoice={resolvedInvoice} partType="customer" hide1688={hide1688} />
      )}

      {/* PERFORATED CUT LINE BETWEEN CUSTOMER COPY AND OFFICE COPY */}
      {copyMode === "both" && (
        <div className="relative py-2 flex items-center justify-center print:py-3">
          <div className="w-full border-t-2 border-dashed border-slate-400" />
          <div className="absolute bg-white px-4 py-1 rounded-full border border-slate-300 text-[11px] font-bold text-slate-600 flex items-center gap-2 shadow-2xs">
            <Scissors className="w-3.5 h-3.5 text-primary" />
            <span>Cut Here — Customer Copy (Top) / Office Copy (Bottom)</span>
          </div>
        </div>
      )}

      {/* PART 2: OFFICE INVOICE */}
      {(copyMode === "both" || copyMode === "office") && (
        <SingleInvoicePart invoice={resolvedInvoice} partType="office" hide1688={hide1688} />
      )}
    </div>
  );
};

export default CustomInvoiceView;
