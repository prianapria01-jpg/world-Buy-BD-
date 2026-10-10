import React from "react";
import { Lock, PhoneCall, MessageSquare } from "lucide-react";
import { canViewCustomerPhone } from "../../utils/customerPrivacy";

interface CustomerPhoneSecureDisplayProps {
  order?: any;
  customer?: any;
  phone?: string;
  viewerDepartment?: string;
  viewerRole?: string;
  viewerStaff?: {
    id?: string;
    code?: string;
    name?: string;
    email?: string;
  };
  isMasterAdmin?: boolean;
  showActions?: boolean;
  className?: string;
}

export default function CustomerPhoneSecureDisplay({
  order,
  customer,
  phone,
  viewerDepartment,
  viewerRole,
  viewerStaff,
  isMasterAdmin,
  showActions = false,
  className = ""
}: CustomerPhoneSecureDisplayProps) {
  const rawPhone =
    phone ||
    order?.customerInfo?.phone ||
    order?.customerPhone ||
    order?.phone ||
    customer?.phone ||
    "";

  const isVisible = canViewCustomerPhone({
    order,
    customer,
    viewerDepartment,
    viewerRole,
    viewerStaff,
    isMasterAdmin
  });

  if (!rawPhone) {
    return <span className={`text-slate-400 font-mono text-xs ${className}`}>N/A</span>;
  }

  if (!isVisible) {
    const dept = String(viewerDepartment || "").toLowerCase();
    const isMarketing = dept.includes("market") || dept.includes("sales") || dept.includes("kam");

    return (
      <div className={`inline-flex flex-col gap-0.5 ${className}`}>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50/80 border border-amber-200/80 text-amber-800 text-[11px] font-medium font-sans"
          title={
            isMarketing
              ? "Only the assigned Marketing Manager can view this customer phone number."
              : "Customer phone number is restricted to CS and Main Admin until assigned."
          }
        >
          <Lock className="w-3 h-3 text-amber-600 shrink-0" />
          <span>
            {isMarketing ? "Number Hidden (Not Assigned)" : "Number Hidden (Assignment Pending)"}
          </span>
        </span>
      </div>
    );
  }

  const cleanPhone = String(rawPhone).replace(/^0/, "").replace(/[^0-9]/g, "");

  return (
    <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
      <span className="font-mono text-xs font-bold text-slate-800">
        {rawPhone}
      </span>

      {showActions && (
        <div className="flex items-center gap-1">
          <a
            href={`tel:${rawPhone}`}
            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
            title={`Call ${rawPhone}`}
          >
            <PhoneCall className="w-3 h-3" />
          </a>
          {cleanPhone && (
            <a
              href={`https://wa.me/880${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
              title="WhatsApp"
            >
              <MessageSquare className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
