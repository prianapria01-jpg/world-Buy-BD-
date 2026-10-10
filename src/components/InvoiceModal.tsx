import React, { useState } from "react";
import {
  X,
  Printer,
  Download,
  FileText,
  Layers,
} from "lucide-react";
import {
  CustomInvoiceData,
  buildInvoiceFromOrder,
  buildSubOrderInvoice,
  downloadCustomInvoicePdf,
} from "../utils/customInvoice";
import CustomInvoiceView from "./invoice/CustomInvoiceView";

interface InvoiceModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  initialSubOrderId?: string;
}

export default function InvoiceModal({
  order,
  isOpen,
  onClose,
  initialSubOrderId,
}: InvoiceModalProps) {
  if (!isOpen || !order) return null;

  const isAlreadySubInvoice = Boolean(order && order.isSubOrderInvoice);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(() => {
    if (initialSubOrderId) return initialSubOrderId;
    if (isAlreadySubInvoice && order.subOrderId) return order.subOrderId;
    return null;
  });

  const subOrders: any[] = Array.isArray(order.subOrders) ? order.subOrders : [];

  const invoiceData: CustomInvoiceData = (() => {
    if (isAlreadySubInvoice && !selectedSubId) {
      return order;
    }
    if (selectedSubId) {
      return buildSubOrderInvoice(order, selectedSubId, order.invoice);
    }
    return buildInvoiceFromOrder(order, order.invoice);
  })();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    await downloadCustomInvoicePdf(invoiceData, "customer");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-auto border border-slate-300 flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:bg-white">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-slate-900 text-white print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-primary text-white text-xs font-mono font-bold">
              {invoiceData.orderId}
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                {invoiceData.isSubOrderInvoice ? `Sub-Order Invoice (${invoiceData.subOrderId})` : "Official Commercial Invoice"}
              </h3>
              <p className="text-[11px] text-slate-400">
                Invoice No:{" "}
                <span className="text-white font-mono font-bold">
                  {invoiceData.invoiceNumber}
                </span>{" "}
                • Date: {invoiceData.orderDate}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Order Invoices Navigation Bar if order has multiple product links */}
        {subOrders.length > 0 && (
          <div className="bg-slate-800 px-4 sm:px-6 py-2 border-b border-slate-700 flex flex-wrap items-center gap-2 text-xs print:hidden">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Select Invoice:
            </span>
            <button
              type="button"
              onClick={() => setSelectedSubId(null)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                selectedSubId === null
                  ? "bg-amber-400 text-slate-950 shadow-xs"
                  : "bg-slate-700 text-slate-200 hover:bg-slate-600"
              }`}
            >
              👑 Main Invoice (All Items Combined)
            </button>
            {subOrders.map((sub: any, sIdx: number) => (
              <button
                key={sub.subOrderId}
                type="button"
                onClick={() => setSelectedSubId(sub.subOrderId)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                  selectedSubId === sub.subOrderId
                    ? "bg-primary text-white shadow-xs"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                Link #{sIdx + 1}: {sub.subOrderId} (Separate Invoice)
              </button>
            ))}
          </div>
        )}

        {/* Clean Printable Invoice Sheet */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
          <CustomInvoiceView data={invoiceData} copyMode="customer" />
        </div>
      </div>
    </div>
  );
}
