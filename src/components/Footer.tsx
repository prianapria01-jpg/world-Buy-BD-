import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Send,
  Smartphone,
  Download,
  Sparkles,
  MessageCircle
} from "lucide-react";
import BrandLogo from "./common/BrandLogo";
import InstallAppModal from "./common/InstallAppModal";
import { useSiteSettings } from "../context/SiteSettingsContext";

const PAYMENT_LOGOS: Array<{ name: string; render: () => React.ReactNode }> = [
  {
    name: "VISA",
    render: () => (
      <span className="font-black italic text-[13px] tracking-tighter text-[#1A1F71] leading-none">
        VISA
      </span>
    ),
  },
  {
    name: "Mastercard",
    render: () => (
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center -space-x-1.5">
          <span className="w-4 h-4 rounded-full bg-[#EB001B] inline-block" />
          <span className="w-4 h-4 rounded-full bg-[#F79E1B]/90 inline-block" />
        </div>
        <span className="text-[5.5px] font-bold text-slate-700 tracking-tight mt-0.5 leading-none">
          mastercard
        </span>
      </div>
    ),
  },
  {
    name: "American Express",
    render: () => (
      <div className="w-7 h-7 bg-[#016FD0] rounded-xs flex flex-col items-center justify-center text-white font-black text-[5px] leading-tight tracking-tighter px-0.5 text-center">
        <span>AMERICAN</span>
        <span>EXPRESS</span>
      </div>
    ),
  },
  {
    name: "UnionPay",
    render: () => (
      <div className="w-8 h-5 rounded-xs overflow-hidden flex text-[5.5px] font-black text-white leading-tight items-center justify-center bg-gradient-to-r from-[#E21836] via-[#00447C] to-[#007B84] -skew-x-6 px-0.5">
        <span className="skew-x-6 text-center leading-none">
          UnionPay
          <br />
          <span className="text-[5px] font-normal">银联</span>
        </span>
      </div>
    ),
  },
  {
    name: "Diners Club",
    render: () => (
      <div className="w-6 h-6 rounded-full border-[2.5px] border-[#0079BE] flex items-center justify-center">
        <div className="w-3 h-3 rounded-full border border-[#0079BE] flex items-center justify-center gap-0.5">
          <span className="w-0.5 h-2 bg-[#0079BE] inline-block" />
          <span className="w-0.5 h-2 bg-[#0079BE] inline-block" />
        </div>
      </div>
    ),
  },
  {
    name: "DBBL Nexus",
    render: () => (
      <div className="flex flex-col items-center justify-center leading-none">
        <div className="w-5 h-3.5 rounded-full bg-gradient-to-r from-red-500 via-blue-600 to-emerald-500 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-white/80" />
        </div>
        <span className="text-[5px] font-black text-slate-800 tracking-tighter mt-0.5">
          DBBL NEXUS
        </span>
      </div>
    ),
  },
  {
    name: "bKash",
    render: () => (
      <div className="flex items-center gap-0.5 leading-none">
        <span className="text-[9px] font-bold text-[#464646] tracking-tight">
          bKash
        </span>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#E2136E]">
          <path d="M2 12L10 4l4 7 8-3-6 10-6-2-8-4z" />
        </svg>
      </div>
    ),
  },
  {
    name: "Nagad",
    render: () => (
      <div className="flex flex-col items-center justify-center leading-none">
        <div className="w-4 h-4 rounded-full border-2 border-[#F7931E] flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ED1C24]" />
        </div>
        <span className="text-[7px] font-black text-[#ED1C24] mt-0.5">Nagad</span>
      </div>
    ),
  },
  {
    name: "Rocket",
    render: () => (
      <div className="flex flex-col items-center justify-center leading-none">
        <span className="text-[7px] font-black text-[#8C3494] tracking-tighter">
          ROCKET
        </span>
        <span className="text-[4.5px] font-semibold text-[#8C3494]">
          DBBL
        </span>
      </div>
    ),
  },
  {
    name: "Upay",
    render: () => (
      <div className="flex flex-col items-center justify-center leading-none">
        <div className="w-4 h-4 rounded-b-full border-b-[3px] border-x-[2.5px] border-[#0054A6] relative flex justify-between">
          <span className="w-1 h-1 rounded-full bg-[#FFD200] -mt-1" />
          <span className="w-1 h-1 rounded-full bg-[#FFD200] -mt-1" />
        </div>
        <span className="text-[6.5px] font-black text-slate-800 mt-0.5">
          Upay
        </span>
      </div>
    ),
  },
  {
    name: "tap",
    render: () => (
      <div className="w-6 h-6 rounded-full border-2 border-[#E31E24] border-r-[#00A651] flex items-center justify-center">
        <span className="text-[7px] font-black text-[#00A651] leading-none">
          tap
        </span>
      </div>
    ),
  },
  {
    name: "SureCash",
    render: () => (
      <div className="flex items-center leading-none">
        <span className="text-[7.5px] font-black text-[#00549E]">SureCash</span>
        <span className="w-1 h-1 rounded-full bg-[#ED1C24] ml-0.5" />
      </div>
    ),
  },
  {
    name: "mCash",
    render: () => (
      <div className="w-4 h-6 rounded-xs bg-[#008C44] flex flex-col items-center justify-center text-white leading-none p-0.5">
        <span className="text-[5px] font-bold">IBBL</span>
        <span className="text-[6.5px] font-black text-amber-300">M</span>
        <span className="text-[4.5px]">Cash</span>
      </div>
    ),
  },
  {
    name: "MYCash",
    render: () => (
      <div className="flex flex-col items-center leading-none">
        <span className="text-[7.5px] font-black text-[#0066B3]">
          MY<span className="text-[#00994D]">Cash</span>
        </span>
        <span className="w-5 h-0.5 bg-[#00994D] rounded-full mt-0.5" />
      </div>
    ),
  },
  {
    name: "Q-cash",
    render: () => (
      <div className="w-6 h-6 rounded-full bg-[#E31E24] flex flex-col items-center justify-center text-white leading-none">
        <span className="text-[9px] font-black italic">Q</span>
        <span className="text-[4.5px] font-semibold -mt-0.5">cash</span>
      </div>
    ),
  },
  {
    name: "FastCash",
    render: () => (
      <div className="flex flex-col items-center justify-center leading-none">
        <div className="w-4 h-4 rounded-full border-2 border-[#E31E24] border-b-[#008C44] flex items-center justify-center text-[6px] font-black text-[#008C44]">
          cf
        </div>
        <span className="text-[5.5px] font-bold text-[#008C44] mt-0.5">
          fastcash
        </span>
      </div>
    ),
  },
  {
    name: "Tap'n Pay",
    render: () => (
      <div className="flex flex-col items-center justify-center leading-none">
        <div className="w-6 h-3 rounded-t-full bg-gradient-to-r from-[#0054A6] to-[#F7931E]" />
        <span className="text-[5.5px] font-bold text-slate-700 -mt-0.5">
          Tap&apos;n Pay
        </span>
      </div>
    ),
  },
  {
    name: "Citytouch",
    render: () => (
      <div className="w-6 h-6 rounded-xs bg-[#E31E24] flex flex-col items-center justify-end p-0.5 text-white leading-none">
        <div className="w-full h-3 border-b border-r border-white/80 mb-0.5" />
        <span className="text-[4.5px] font-bold tracking-tighter">
          citytouch
        </span>
      </div>
    ),
  },
  {
    name: "BRAC Bank",
    render: () => (
      <div className="flex flex-col items-center justify-center leading-none">
        <div className="w-4 h-4 bg-[#0054A6] relative overflow-hidden">
          <div className="w-3 h-3 bg-[#FDB913] rounded-tr-full absolute bottom-0 left-0" />
        </div>
        <span className="text-[4.5px] font-black text-[#0054A6] mt-0.5">
          BRAC BANK
        </span>
      </div>
    ),
  },
  {
    name: "Bank Asia",
    render: () => (
      <div className="flex flex-col items-center justify-center leading-none">
        <div className="w-4 h-4 bg-[#0054A6] grid grid-cols-2 gap-0.5 p-0.5">
          <span className="bg-white block" />
          <span className="bg-white block" />
          <span className="bg-white block" />
          <span className="bg-white block" />
        </div>
        <span className="text-[4.5px] font-bold text-[#0054A6] mt-0.5">
          Bank Asia
        </span>
      </div>
    ),
  },
  {
    name: "Islami Bank",
    render: () => (
      <div className="w-6 h-6 rounded-full border-2 border-[#007A3D] flex items-center justify-center">
        <div className="w-2.5 h-3.5 rounded-t-full bg-[#007A3D]" />
      </div>
    ),
  },
  {
    name: "AB Bank",
    render: () => (
      <div className="w-6 h-5 bg-[#E31E24] rounded-xs flex items-center justify-center text-white font-black text-[8px] leading-none">
        AB<span className="text-[6px] ml-0.5">•</span>
      </div>
    ),
  },
  {
    name: "MTB",
    render: () => (
      <div className="flex items-center gap-0.5 leading-none">
        <div className="grid grid-cols-2 gap-0.5 w-2.5 h-2.5">
          <span className="bg-[#E31E24] block" />
          <span className="bg-[#008C44] block" />
          <span className="bg-[#0054A6] block" />
          <span className="bg-[#F7931E] block" />
        </div>
        <span className="text-[8px] font-black text-[#E31E24]">MTB</span>
      </div>
    ),
  },
  {
    name: "Eastern Bank",
    render: () => (
      <div className="w-5 h-5 flex items-center justify-center">
        <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[15px] border-b-[#007A3D] relative">
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-[#E31E24] absolute -left-[5px] top-[4px]" />
        </div>
      </div>
    ),
  },
  {
    name: "Southeast Bank",
    render: () => (
      <div className="flex items-center font-black text-[12px] tracking-tighter leading-none">
        <span className="text-[#0066B3]">S</span>
        <span className="text-[#D12053] -ml-0.5">B</span>
      </div>
    ),
  },
  {
    name: "First Security Islami Bank",
    render: () => (
      <div className="flex flex-col items-center justify-center leading-none">
        <div className="w-3.5 h-2.5 rounded-t-full bg-[#008C44]" />
        <div className="w-4 h-1.5 bg-[#0054A6] mt-0.5" />
        <span className="text-[4px] font-bold text-[#008C44] mt-0.5">
          FSIBL
        </span>
      </div>
    ),
  },
  {
    name: "Modhumoti Bank",
    render: () => (
      <div className="flex items-center gap-0.5 leading-none">
        <span className="w-2.5 h-2.5 bg-[#6CBE45] rounded-xs inline-block" />
        <div className="flex flex-col text-[4.5px] font-bold text-slate-700 leading-tight">
          <span>Modhumoti</span>
          <span>Bank Ltd.</span>
        </div>
      </div>
    ),
  },
  {
    name: "OK Wallet",
    render: () => (
      <div className="flex items-center gap-0.5 leading-none">
        <span className="w-4 h-4 rounded-full bg-[#FFD200] border border-slate-800 flex items-center justify-center text-[5.5px] font-black text-slate-900">
          OK
        </span>
        <span className="text-[5px] font-bold text-slate-700">wallet</span>
      </div>
    ),
  },
  {
    name: "Dmoney",
    render: () => (
      <div className="flex flex-col items-center justify-center leading-none">
        <div className="w-4 h-3 rounded-t-full bg-gradient-to-t from-[#F7931E] to-[#FFD200]" />
        <span className="text-[5px] font-bold text-slate-600 mt-0.5">
          Dmoney
        </span>
      </div>
    ),
  },
  {
    name: "Islamic Wallet",
    render: () => (
      <div className="flex flex-col items-center justify-center leading-none">
        <div className="w-3.5 h-3 border-t-2 border-x border-[#008C44] rounded-t-full" />
        <span className="text-[4.5px] font-bold text-[#008C44] mt-0.5">
          Islamic Wallet
        </span>
      </div>
    ),
  },
  {
    name: "iPay",
    render: () => (
      <span className="text-[10px] font-black text-[#00B2A9] tracking-tight leading-none">
        iPay
      </span>
    ),
  },
];

export default function Footer() {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { settings } = useSiteSettings();

  const officeLocation = settings?.officeAddress || "Kazipara, Mirpur-10, Dhaka 1216";
  const contactPhone = settings?.hotlinePhone || "+880 1355-136661";
  const contactEmail = settings?.supportEmail || "worldbuybd01@gmail.com";
  const whatsappNumber = (settings?.whatsappNumber || "8801355136661").replace(/[^0-9]/g, "");

  return (
    <footer className="bg-[#0B1220] text-gray-300 border-t border-slate-800/80 mt-auto">
      <div className="container mx-auto px-4 md:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: About Brand */}
          <div>
            <Link to="/" className="inline-block mb-5">
              <BrandLogo theme="dark" size="md" />
            </Link>
            <p className="text-sm leading-relaxed mb-6 text-slate-400">
              Your trusted China-to-Bangladesh wholesale and global import platform. Direct factory-price product sourcing and doorstep delivery across Bangladesh.
            </p>
            <div className="flex space-x-3">
              <a
                href={settings?.socialFacebook || "https://facebook.com"}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={settings?.socialInstagram || "https://instagram.com"}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings?.socialYoutube || "https://youtube.com"}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${whatsappNumber}?text=Hello%20World%20Buy%20BD,%20I%20have%20an%20inquiry`}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp Support: +880 1355-136661"
                className="w-9 h-9 rounded-full bg-emerald-600/90 border border-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition text-white shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-white font-bold text-base mb-5 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-primary">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link to="/about" className="hover:text-primary transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-primary transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping-charges"
                  className="hover:text-primary transition"
                >
                  Shipping Rates
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-primary transition">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary transition">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition">
                  Terms & Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 className="text-white font-bold text-base mb-5 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-primary">
              Contact Us
            </h4>
            <ul className="space-y-3.5 text-sm text-slate-300">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="leading-snug">
                  {officeLocation}
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                  className="hover:text-primary transition"
                >
                  {contactPhone} (10:00 AM - 8:00 PM)
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href={`mailto:${contactEmail}`}
                  className="hover:text-primary transition"
                >
                  {contactEmail}
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <a
                  href={`https://wa.me/${whatsappNumber}?text=Hello%20World%20Buy%20BD,%20I%20have%20an%20inquiry`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition font-medium"
                >
                  WhatsApp: +880 1355-136661
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="text-white font-bold text-base mb-5 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-primary">
              Newsletter & Updates
            </h4>
            <p className="text-sm text-slate-400 mb-4">
              Subscribe to receive exclusive wholesale offers, shipping rate updates, and promotional discounts.
            </p>
            <form
              className="flex flex-col space-y-2.5"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="absolute right-1.5 top-1.5 bottom-1.5 bg-primary hover:bg-primary-dark text-white px-3 rounded-md transition flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Mobile App Download Banner */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-700/80">
              <div className="flex items-center gap-1.5 mb-1.5 text-white text-xs font-bold">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>World Buy BD Mobile App</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-snug">
                Install directly on your phone with 1-click or download the launcher package.
              </p>
              <button
                type="button"
                onClick={() => setShowInstallModal(true)}
                className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App / Download Center</span>
              </button>
            </div>
          </div>
        </div>

        {/* Payment Gateway Logos Strip (Matching Uploaded Banner) */}
        <div className="border-t border-slate-800/90 pt-6 pb-5">
          <div className="bg-white rounded-xl p-2.5 sm:p-3 shadow-sm border border-slate-200">
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {PAYMENT_LOGOS.map((item) => (
                <div
                  key={item.name}
                  title={item.name}
                  className="w-10 h-9 sm:w-11 sm:h-10 rounded-lg bg-white border border-gray-200 shadow-2xs flex items-center justify-center p-1 hover:border-gray-300 hover:scale-105 transition-transform select-none shrink-0"
                >
                  {item.render()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Copyright (Secret Admin Panel Link on © Year) */}
        <div className="border-t border-slate-800/80 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
          <p>
            <Link
              to="/admin"
              className="text-slate-400 hover:text-slate-300 transition select-none"
              aria-label="Copyright Year"
            >
              &copy; {new Date().getFullYear()}
            </Link>{" "}
            <strong className="text-white">World Buy BD</strong>. All Rights Reserved.
          </p>
          <p className="text-slate-500">
            Verified Cross-Border E-Commerce & Logistics Platform
          </p>
        </div>
      </div>

      {/* Mobile App Install & Download Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </footer>
  );
}
