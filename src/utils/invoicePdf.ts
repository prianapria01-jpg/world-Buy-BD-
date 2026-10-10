import { jsPDF } from "jspdf";
import {
  CustomInvoiceData,
  buildInvoiceFromOrder,
  generateCustomInvoicePdf,
  downloadCustomInvoicePdf,
} from "./customInvoice";

export interface InvoiceData {
  id?: string;
  orderId: string;
  invoiceNumber?: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  productName?: string;
  quantity?: number;
  productPrice?: number;
  chinaCourierBill?: number;
  weight?: number | string;
  shippingCharge?: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentPercentage?: number | string;
  paymentStatus: string;
  deliveryStatus?: string;
  created_at?: string;
  items?: Array<{
    name: string;
    image?: string;
    variation?: string;
    quantity: number;
    price: number;
  }>;
}

export function createInvoiceFromOrder(order: any): CustomInvoiceData {
  return buildInvoiceFromOrder(order, order?.invoice);
}

export function generateInvoicePdf(invoiceOrOrder: any): jsPDF {
  const customInv: CustomInvoiceData =
    invoiceOrOrder && invoiceOrOrder.invoiceNumber && Array.isArray(invoiceOrOrder.items)
      ? invoiceOrOrder
      : buildInvoiceFromOrder(invoiceOrOrder, invoiceOrOrder?.invoice);
  return generateCustomInvoicePdf(customInv);
}

export async function downloadInvoicePdf(invoiceOrOrder: any): Promise<boolean> {
  try {
    const customInv: CustomInvoiceData =
      invoiceOrOrder && invoiceOrOrder.invoiceNumber && Array.isArray(invoiceOrOrder.items)
        ? invoiceOrOrder
        : buildInvoiceFromOrder(invoiceOrOrder, invoiceOrOrder?.invoice);
    return await downloadCustomInvoicePdf(customInv);
  } catch (err) {
    console.error("Failed to generate/save PDF, attempting printable fallback:", err);
    try {
      window.print();
    } catch (e) {
      console.error("Print fallback failed:", e);
    }
    return false;
  }
}
