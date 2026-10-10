import React from "react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import LiveEditableSection from "../../components/common/LiveEditableSection";

export default function AboutUs() {
  const { settings } = useSiteSettings();

  return (
    <LiveEditableSection sectionId="pages" label="About Us Page Content">
      <div className="container mx-auto px-4 py-12 max-w-4xl min-h-[60vh]">
        <h1 className="text-3xl font-bold text-charcoal mb-8 text-center uppercase tracking-wide border-b border-border pb-4">
          {settings.aboutPageTitle || "About Us"}
        </h1>
        <div className="prose prose-sm md:prose-base max-w-none text-text-secondary space-y-6">
          <p className="leading-relaxed">{settings.aboutPageIntro}</p>

          <h3 className="text-xl font-bold text-charcoal mt-8 mb-4">
            {settings.aboutPageWhyTitle || `Why ${settings.siteName}?`}
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            {(settings.aboutPageWhyBullets || []).map((bullet, idx) => (
              <li key={idx}>{bullet}</li>
            ))}
          </ul>

          <p className="mt-8 leading-relaxed font-medium">{settings.aboutPageClosing}</p>
        </div>
      </div>
    </LiveEditableSection>
  );
}
