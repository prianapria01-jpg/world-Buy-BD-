import { Outlet, useLocation } from "react-router-dom";
import { MessageCircle, Phone } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SidebarCategories from "../components/SidebarCategories";
import DiscountPopup from "../components/common/DiscountPopup";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function StorefrontLayout() {
  const location = useLocation();
  const { settings } = useSiteSettings();
  const isHome = location.pathname === "/";
  const isProductPage = location.pathname.startsWith("/product");
  const hideSidebarPaths = ["/", "/checkout", "/login", "/register", "/admin", "/account", "/wishlist", "/product"];

  const showSidebar = !hideSidebarPaths.some(
    (path) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path))
  );

  return (
    <div className="flex flex-col min-h-screen">
      <DiscountPopup />
      <Header />
      <div
        className={`flex flex-1 w-full ${
          isHome || isProductPage ? "px-3 sm:px-4 md:px-6 max-w-7xl mx-auto" : "px-4 md:px-8 gap-6"
        } py-4`}
      >
        {showSidebar && (
          <div className="hidden lg:block">
            <SidebarCategories />
          </div>
        )}
        <main className="flex-1 min-w-0 bg-bg w-full">
          <Outlet />
        </main>
      </div>
      <Footer />

      {/* Customer-facing Floating WhatsApp & Helpline Call Buttons (Controlled from Admin Panel) */}
      {(settings.showFloatingWhatsapp || settings.showFloatingCall) && (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
          {settings.showFloatingCall && settings.hotlinePhone && (
            <a
              href={`tel:${settings.hotlinePhone.replace(/\s+/g, "")}`}
              className="w-10 h-10 rounded-full bg-slate-900 hover:bg-primary text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
              title={`Call Helpline: ${settings.hotlinePhone}`}
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          {settings.showFloatingWhatsapp && settings.whatsappNumber && (
            <a
              href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                settings.siteName
              )},%20I%20have%20an%20inquiry`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition-transform hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">WhatsApp Support</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
