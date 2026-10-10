import React from "react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import LiveEditableSection from "../../components/common/LiveEditableSection";

export default function CancellationPolicy() {
  const { settings } = useSiteSettings();

  return (
    <LiveEditableSection sectionId="pages" label="Cancellation & Prohibited Items Policy">
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[60vh] text-xs">
        <h1 className="text-xl font-bold text-gray-900 mb-6 text-center uppercase tracking-wide border-b border-gray-200 pb-3">
          {settings.cancellationPageTitle || "Cancellation Policy"}
        </h1>

        <div className="max-w-none text-gray-700 space-y-5 leading-relaxed">
          <p className="font-medium bg-gray-50 p-3 rounded border border-gray-200">{settings.cancellationPageIntro}</p>

          <h2 className="text-sm font-bold text-gray-900 mt-6 mb-2">Cancellation Guidelines:</h2>
          <ol className="list-decimal pl-5 space-y-2 text-xs">
            <li>
              Orders for items restricted or prohibited by the Bangladesh Government and Customs regulations cannot be
              imported. We reserve the full right to cancel such orders upon review.
            </li>
            <li>
              Cancellations cannot be requested once 6 hours have elapsed from the time of order confirmation, as
              procurement processing with overseas factories begins immediately.
            </li>
            <li>
              If an order is cancelled due to customer-side variant/quantity errors after processing starts, a 2.5%
              administrative processing fee is deducted.
            </li>
          </ol>

          <h2 id="prohibited" className="text-sm font-bold text-gray-900 mt-6 mb-2">
            Prohibited & Restricted Items:
          </h2>
          <ul className="list-disc pl-5 space-y-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-gray-600">
            {(settings.prohibitedItemsList || []).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </LiveEditableSection>
  );
}
