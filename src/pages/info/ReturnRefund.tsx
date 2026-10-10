import React from "react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import LiveEditableSection from "../../components/common/LiveEditableSection";

export default function ReturnRefund() {
  const { settings } = useSiteSettings();

  return (
    <LiveEditableSection sectionId="pages" label="Return & Refund Policy Content">
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[60vh] text-xs">
        <h1 className="text-xl font-bold text-gray-900 mb-2 text-center uppercase tracking-wide">
          {settings.returnPageTitle || "Return & Refund Policy"}
        </h1>
        <p className="text-center text-[11px] text-gray-500 mb-6 border-b border-gray-200 pb-3">
          {settings.returnPageSubtitle || "Official Terms & Guidelines for Global Procurements"}
        </p>

        <div className="max-w-none text-gray-700 space-y-5 leading-relaxed">
          <p className="font-medium bg-gray-50 p-3 rounded border border-gray-200">{settings.returnPageIntro}</p>

          <h2 className="text-sm font-bold text-gray-900 mt-6 mb-2 border-b border-gray-100 pb-1">
            Return & Refund Eligibility
          </h2>

          <h3 className="font-semibold text-gray-800 mt-4 mb-2 text-xs">Cases Where Refunds Apply:</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
            <li>
              If an item received from our local delivery has demonstrable factory defects, transit damage, or if an
              incorrect or incomplete product was dispatched, you must submit a refund claim with clear video proof
              within 24 hours of package receipt.
            </li>
            <li>If the factory or overseas seller is completely out of stock and cannot dispatch the ordered product.</li>
            <li>
              If a consignment is inexplicably delayed beyond 45 working days (excluding public holidays, customs
              clearance holds, and airline flight delays).
            </li>
            <li>Direct physical product exchanges are not supported due to cross-border shipping logistics.</li>
          </ul>

          <div className="bg-gray-50 p-4 rounded-lg mt-6 border border-gray-200 text-xs">
            <h3 className="font-bold text-gray-900 mb-2">Authorized Hub Address for Verified Returns:</h3>
            <p className="text-gray-600 leading-normal whitespace-pre-line">{settings.returnHubAddress}</p>
          </div>
        </div>
      </div>
    </LiveEditableSection>
  );
}
