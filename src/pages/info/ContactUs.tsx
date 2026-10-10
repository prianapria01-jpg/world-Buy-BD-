import React from "react";
import { MapPin, Mail, Phone, Globe } from "lucide-react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import LiveEditableSection from "../../components/common/LiveEditableSection";

export default function ContactUs() {
  const { settings } = useSiteSettings();

  return (
    <LiveEditableSection sectionId="pages" label="Contact Us Page Content">
      <div className="container mx-auto px-4 py-12 max-w-4xl min-h-[60vh]">
        <h1 className="text-3xl font-bold text-charcoal mb-8 text-center uppercase tracking-wide border-b border-border pb-4">
          {settings.contactPageTitle || "Contact Us"}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          <div className="bg-white p-8 rounded-xl border border-border shadow-sm">
            <h2 className="text-xl font-bold text-charcoal mb-6">Contact Information</h2>
            <ul className="space-y-6">
              <li className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider mb-1 text-charcoal">Bangladesh Office:</h4>
                  <p className="text-text-secondary text-sm">{settings.officeAddress}</p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider mb-1 text-charcoal">China Warehouses:</h4>
                  <p className="text-text-secondary text-sm">{settings.chinaWarehouseInfo}</p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider mb-1 text-charcoal">Email:</h4>
                  <p className="text-text-secondary text-sm">{settings.supportEmail}</p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider mb-1 text-charcoal">Helpline:</h4>
                  <p className="text-text-secondary text-sm">{settings.hotlinePhone}</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 p-8 rounded-xl border border-border flex items-center justify-center text-center">
            <div>
              <h3 className="text-lg font-bold text-charcoal mb-2">{settings.contactPageCtaTitle}</h3>
              <p className="text-text-secondary text-sm mb-6">{settings.contactPageCtaText}</p>
              <a
                href={`mailto:${settings.supportEmail}`}
                className="inline-block bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-sm"
              >
                {settings.contactPageButtonText || "Send Us an Email"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </LiveEditableSection>
  );
}
