import React from "react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import LiveEditableSection from "../../components/common/LiveEditableSection";

export default function PrivacyPolicy() {
  const { settings } = useSiteSettings();

  return (
    <LiveEditableSection sectionId="pages" label="Privacy Policy Content">
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[60vh] text-xs">
        <h1 className="text-xl font-bold text-gray-900 mb-2 text-center uppercase tracking-wide">
          {settings.privacyPageTitle || "Privacy Policy"}
        </h1>
        <p className="text-center text-[11px] text-gray-500 mb-6 border-b border-gray-200 pb-3">
          {settings.privacyPageUpdated || "Updated on January 27, 2026"}
        </p>

        <div className="max-w-none text-gray-700 space-y-5 leading-relaxed">
          <p className="font-medium bg-gray-50 p-3 rounded border border-gray-200">{settings.privacyPageIntro}</p>

          {(settings.privacySections || []).map((sec, idx) => (
            <div key={idx}>
              <h2 className="text-sm font-bold text-gray-900 mt-6 mb-2">{sec.heading}</h2>
              <p className="text-xs text-gray-600">{sec.body}</p>
            </div>
          ))}
        </div>
      </div>
    </LiveEditableSection>
  );
}
