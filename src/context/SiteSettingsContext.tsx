import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cachedFetchJson, invalidateApiCache } from "../utils/apiCache";

export interface HeroSlideItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  imageOnly?: boolean;
}

export interface NavMenuItem {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
}

export interface TrustBadgeItem {
  title: string;
  desc: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  desc: string;
}

export interface TestimonialItem {
  name: string;
  location: string;
  role: string;
  comment: string;
  rating: number;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface PolicySectionItem {
  heading: string;
  body: string;
}

export interface DiscountPopupConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  couponCode: string;
  discountPercent: number;
  imageUrl: string;
  minOrderNotice: string;
  ctaText: string;
  ctaLink: string;
}

export interface SiteSettings {
  // 1. General Branding & Theme
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  logoHeight: number;
  faviconUrl?: string;
  primaryColor: string;
  primaryDarkColor: string;
  secondaryColor: string;
  accentColor: string;
  pinkColor: string;
  bgColor: string;
  fontFamily: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;

  // 2. Top Announcement Bar & Header
  showAnnouncementBar: boolean;
  announcementText: string;
  announcementLinkText: string;
  announcementLinkUrl: string;
  announcementBgColor: string;
  announcementTextColor: string;
  headerSearchPlaceholder: string;
  showFlashSaleBadge: boolean;
  flashSaleBadgeText: string;
  navItems: NavMenuItem[];

  // 3. Hotline, Contacts & Socials
  hotlinePhone: string;
  hotlineText: string;
  whatsappNumber: string;
  whatsappEnabled: boolean;
  supportEmail: string;
  officeAddress: string;
  chinaWarehouseInfo: string;
  socialFacebook: string;
  socialInstagram: string;
  socialWhatsapp: string;
  socialYoutube: string;
  showFloatingWhatsapp: boolean;
  showFloatingCall: boolean;

  // 4. Homepage Section Visibility Toggles
  showHeroSection: boolean;
  showTrustBadges: boolean;
  showFlashSale: boolean;
  showShippingCalculator: boolean;
  showCategoriesShowcase: boolean;
  showWholesaleSection: boolean;
  showTrendingSection: boolean;
  showHowItWorks: boolean;
  showOrderJourney: boolean;
  showTestimonials: boolean;
  showFaqSection: boolean;
  showNewsletter: boolean;

  // 5. Hero Carousel & Direct Link Search
  heroSlides: HeroSlideItem[];
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroSecondaryCtaText: string;
  heroSecondaryCtaLink: string;
  heroSearchPlaceholder: string;
  heroBannerImage1: string;
  heroBannerImage2: string;
  heroBannerImage3: string;
  linkSearchHeading: string;
  linkSearchPlaceholder: string;

  // 6. Right-Side Quick Action Hub (4 Cards)
  quickCard1Title: string;
  quickCard1Desc: string;
  quickCard1Cta: string;
  quickCard2Title: string;
  quickCard2Desc: string;
  quickCard2Cta: string;
  quickCard3Title: string;
  quickCard3Desc: string;
  quickCard4Title: string;
  quickCard4Desc: string;

  // 7. Trust Badges (4 Features)
  trustBadges: TrustBadgeItem[];
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  feature4Title: string;
  feature4Desc: string;

  // 8. Flash Sale Section
  flashSaleTag: string;
  flashSaleSubtitle: string;
  flashSaleTitle: string;

  // 9. Shipping Cost Calculator
  calcBadge: string;
  calcTitle: string;
  calcSubtitle: string;
  airNormalRate: number;
  airSensitiveRate: number;
  seaNormalRate: number;
  seaSensitiveRate: number;
  airDeliveryDays: string;
  seaDeliveryDays: string;
  calcDisclaimer: string;

  // 10. Catalog Section Headers
  categoriesSectionTitle: string;
  categoriesSectionSubtitle: string;
  wholesaleSectionTitle: string;
  wholesaleSectionSubtitle: string;
  trendingSectionTitle: string;
  trendingSectionSubtitle: string;

  // 11. Promo Banners
  showPromoBanners: boolean;
  promo1Title: string;
  promo1Subtitle: string;
  promo1ButtonText: string;
  promo1Link: string;
  promo1Image: string;
  promo2Title: string;
  promo2Subtitle: string;
  promo2ButtonText: string;
  promo2Link: string;
  promo2Image: string;

  // 12. How It Works Section
  howItWorksBadge: string;
  howItWorksTitle: string;
  howItWorksSubtitle: string;
  howItWorksSteps: HowItWorksStep[];

  // 13. Customer Testimonials Section
  testimonialsTitle: string;
  testimonialsSubtitle: string;
  testimonialsRatingText: string;
  testimonials: TestimonialItem[];

  // 14. FAQ Section
  faqBadge: string;
  faqTitle: string;
  faqSubtitle: string;
  faqs: FaqItem[];

  // 15. Newsletter Banner
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterButtonText: string;

  // 16. Footer Content
  footerAbout: string;
  footerGuaranteeText: string;
  footerCopyright: string;
  footerPoweredBy: string;

  // 17. Info & Policy Pages (Full CMS)
  aboutPageTitle: string;
  aboutPageIntro: string;
  aboutPageWhyTitle: string;
  aboutPageWhyBullets: string[];
  aboutPageClosing: string;
  contactPageTitle: string;
  contactPageCtaTitle: string;
  contactPageCtaText: string;
  contactPageButtonText: string;
  privacyPageTitle: string;
  privacyPageUpdated: string;
  privacyPageIntro: string;
  privacySections: PolicySectionItem[];
  returnPageTitle: string;
  returnPageSubtitle: string;
  returnPageIntro: string;
  returnHubAddress: string;
  cancellationPageTitle: string;
  cancellationPageIntro: string;
  prohibitedItemsList: string[];

  // 18. Popup & Notices
  showNoticePopup: boolean;
  noticePopupTitle: string;
  noticePopupMessage: string;
  noticePopupCode: string;
  noticePopupImage: string;
  discountPopup: DiscountPopupConfig;

  // 19. Payment, Currency & Order Rules
  rmbRate: number;
  airShippingRate: number;
  seaShippingRate: number;
  minOrderAmount: number;
  deliveryCharge: number;
  globalDiscount: number;
  advancePercent: number;
  bkashNumber: string;
  bkashType: string;
  nagadNumber: string;
  nagadType: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  bankRouting: string;
  phone?: string;
  email?: string;
  apkDownloadUrl?: string;
  playStoreUrl?: string;
  googleSearchConsoleVerification?: string;
}

export const THEME_PRESETS = [
  {
    id: "crimson-teal",
    name: "WorldBuy Signature (Crimson & Pine Teal)",
    primaryColor: "#cb1e46",
    primaryDarkColor: "#b01438",
    secondaryColor: "#014144",
    accentColor: "#0a484e",
    bgColor: "#f8f9fa",
    announcementBgColor: "#014144",
  },
  {
    id: "ocean-royal",
    name: "Ocean Royal (Cobalt Blue & Navy)",
    primaryColor: "#2563eb",
    primaryDarkColor: "#1d4ed8",
    secondaryColor: "#0f172a",
    accentColor: "#1e3a8a",
    bgColor: "#f8fafc",
    announcementBgColor: "#0f172a",
  },
  {
    id: "emerald-luxury",
    name: "Emerald Trade (Emerald & Deep Forest)",
    primaryColor: "#059669",
    primaryDarkColor: "#047857",
    secondaryColor: "#064e3b",
    accentColor: "#0f766e",
    bgColor: "#f9fafb",
    announcementBgColor: "#064e3b",
  },
  {
    id: "amber-enterprise",
    name: "Alibaba Orange (Vibrant Orange & Slate)",
    primaryColor: "#ea580c",
    primaryDarkColor: "#c2410c",
    secondaryColor: "#18181b",
    accentColor: "#27272a",
    bgColor: "#fafaf9",
    announcementBgColor: "#18181b",
  },
  {
    id: "royal-indigo",
    name: "Global Express (Indigo & Deep Violet)",
    primaryColor: "#4f46e5",
    primaryDarkColor: "#4338ca",
    secondaryColor: "#1e1b4b",
    accentColor: "#312e81",
    bgColor: "#f8fafc",
    announcementBgColor: "#1e1b4b",
  },
  {
    id: "midnight-gold",
    name: "Executive Dark (Warm Gold & Obsidian)",
    primaryColor: "#d97706",
    primaryDarkColor: "#b45309",
    secondaryColor: "#111827",
    accentColor: "#1f2937",
    bgColor: "#f9fafb",
    announcementBgColor: "#111827",
  },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  // 1. General Branding & Theme
  siteName: "World Buy BD",
  siteTagline: "Trusted Gateway for Direct China Wholesale & Retail",
  logoUrl: "/assets/logo.png",
  logoHeight: 48,
  primaryColor: "#cb1e46",
  primaryDarkColor: "#b01438",
  secondaryColor: "#014144",
  accentColor: "#0a484e",
  pinkColor: "#cb1e46",
  bgColor: "#f8f9fa",
  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  maintenanceMode: false,
  maintenanceMessage: "We are currently upgrading our China-Bangladesh logistics catalog. We will be back shortly!",

  // 2. Top Announcement Bar & Header
  showAnnouncementBar: true,
  announcementText: "Direct Sourcing from China Factories · 100% Customs Clearance · Express Air & Sea Freight",
  announcementLinkText: "Track Order",
  announcementLinkUrl: "/account",
  announcementBgColor: "#014144",
  announcementTextColor: "#FFFFFF",
  headerSearchPlaceholder: "Search products from China by name, ID, or keywords...",
  showFlashSaleBadge: true,
  flashSaleBadgeText: "Flash Sale",
  navItems: [
    { id: "nav-home", label: "Home", path: "/", enabled: true },
    { id: "nav-shop", label: "Shop", path: "/shop", enabled: true },
    { id: "nav-categories", label: "Categories", path: "/#categories", enabled: true },
    { id: "nav-how", label: "How It Works", path: "/#how-it-works", enabled: true },
    { id: "nav-shipping", label: "Shipping", path: "/#shipping-calc", enabled: true },
    { id: "nav-about", label: "About Us", path: "/about", enabled: true },
    { id: "nav-contact", label: "Contact", path: "/contact", enabled: true },
  ],

  // 3. Hotline, Contacts & Socials
  hotlinePhone: "+880 1355-136661",
  hotlineText: "Helpline Desk",
  whatsappNumber: "8801355136661",
  whatsappEnabled: true,
  supportEmail: "worldbuybd01@gmail.com",
  officeAddress: "Kazipara, Mirpur-10, Dhaka 1216",
  chinaWarehouseInfo: "Guangzhou & Yiwu Warehouses, China",
  socialFacebook: "https://facebook.com",
  socialInstagram: "https://instagram.com",
  socialWhatsapp: "https://wa.me/8801355136661",
  socialYoutube: "https://youtube.com",
  showFloatingWhatsapp: true,
  showFloatingCall: true,

  // 4. Homepage Section Visibility Toggles
  showHeroSection: true,
  showTrustBadges: true,
  showFlashSale: true,
  showShippingCalculator: true,
  showCategoriesShowcase: true,
  showWholesaleSection: true,
  showTrendingSection: true,
  showHowItWorks: true,
  showOrderJourney: true,
  showTestimonials: true,
  showFaqSection: true,
  showNewsletter: true,

  // 5. Hero Carousel & Direct Link Search
  heroSlides: [
    {
      id: "slide-1",
      badge: "DIRECT CHINA WHOLESALE SOURCING",
      title: "Buy Factory-Direct at Genuine Wholesale Rates",
      subtitle: "Access verified Chinese manufacturing supplies at authentic factory prices. Secure payments via bKash/Nagad and door-to-door delivery.",
      ctaText: "Browse Products",
      ctaLink: "/shop",
      image: "https://images.unsplash.com/photo-1577563935244-124b172a6b4b?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "slide-2",
      badge: "EXPRESS AIR & ECONOMY SEA FREIGHT",
      title: "Fast Air Express & Low-Cost Sea Cargo to Dhaka",
      subtitle: "Air cargo delivers in 7-12 days; Sea cargo delivers in 35-45 days. 100% tax-free customs clearance guaranteed.",
      ctaText: "Calculate Shipping",
      ctaLink: "#shipping-calc",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "slide-3",
      badge: "B2B & RESELLER IMPORT SOLUTIONS",
      title: "Effortless Bulk Product Sourcing for Your Business",
      subtitle: "Guangzhou warehouse inspection and pre-shipment quality verification. Reliable doorstep delivery to your shop or warehouse.",
      ctaText: "Request Custom Quote",
      ctaLink: "#sourcing-service",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
    },
  ],
  heroBadge: "DIRECT WHOLESALE SOURCING FROM CHINA FACTORIES",
  heroTitle: "Source Directly from Verified Manufacturers at Factory Rates",
  heroSubtitle: "Access millions of wholesale and retail products directly to your doorstep. Complete customs clearance, hassle-free door-to-door delivery.",
  heroCtaText: "Browse Catalog",
  heroCtaLink: "/shop",
  heroSecondaryCtaText: "How It Works",
  heroSecondaryCtaLink: "#how-it-works",
  heroSearchPlaceholder: "Search China products by name, product link, or SKU...",
  heroBannerImage1: "https://images.unsplash.com/photo-1577563935244-124b172a6b4b?auto=format&fit=crop&w=1200&q=80",
  heroBannerImage2: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
  heroBannerImage3: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
  linkSearchHeading: "Paste any China product link or search by keywords:",
  linkSearchPlaceholder: "e.g. Paste product URL, SKU ID, or enter keyword...",

  // 6. Right-Side Quick Action Hub (3 Cards)
  quickCard1Title: "Custom Sourcing Quote",
  quickCard1Desc: "Share any product image or link to get factory pricing directly.",
  quickCard1Cta: "Request Quote",
  quickCard2Title: "Shipping Rate Calculator",
  quickCard2Desc: "Instantly estimate Air & Sea cargo charges in Bangladeshi Taka.",
  quickCard2Cta: "Calculate Now",
  quickCard3Title: "",
  quickCard3Desc: "",
  quickCard4Title: "Direct WhatsApp Support",
  quickCard4Desc: "Chat with our procurement desk",

  // 7. Trust Badges (4 Features)
  trustBadges: [
    { title: "100% Customs Cleared", desc: "Zero hidden customs or tax duty" },
    { title: "Express Air Cargo", desc: "7 to 12 days direct to Dhaka" },
    { title: "Economy Sea Cargo", desc: "Starting at only BDT 250 per kg" },
    { title: "64 Districts Delivery", desc: "Safe delivery directly to your door" },
  ],
  feature1Title: "100% Customs Cleared",
  feature1Desc: "Zero hidden customs or tax duty",
  feature2Title: "Express Air Cargo",
  feature2Desc: "7 to 12 days direct to Dhaka",
  feature3Title: "Economy Sea Cargo",
  feature3Desc: "Starting at only BDT 250 per kg",
  feature4Title: "64 Districts Delivery",
  feature4Desc: "Safe delivery directly to your door",

  // 8. Flash Sale Section
  flashSaleTag: "Limited Time Offers",
  flashSaleSubtitle: "Direct Factory Discount",
  flashSaleTitle: "Flash Deals & Special Discounts",

  // 9. Shipping Cost Calculator
  calcBadge: "Transparent Freight Estimation",
  calcTitle: "China to Bangladesh Freight Cost Calculator",
  calcSubtitle: "Estimate real-time Air and Sea cargo charges before importing. No hidden customs or port fees.",
  airNormalRate: 780,
  airSensitiveRate: 1200,
  seaNormalRate: 250,
  seaSensitiveRate: 350,
  airDeliveryDays: "7-12 Days",
  seaDeliveryDays: "35-45 Days",
  calcDisclaimer: "* Final freight is calculated upon actual digital scale measurement at our Guangzhou warehouse.",

  // 10. Catalog Section Headers
  categoriesSectionTitle: "Top Sourcing Categories",
  categoriesSectionSubtitle: "Browse millions of factory-priced products directly from verified manufacturers",
  wholesaleSectionTitle: "Direct Factory Wholesale Tier",
  wholesaleSectionSubtitle: "Real manufacturer wholesale pricing for resellers and smart shoppers",
  trendingSectionTitle: "Trending Sourcing Collection",
  trendingSectionSubtitle: "Explore best-selling imported items across popular categories",

  // 11. Promo Banners
  showPromoBanners: true,
  promo1Title: "Wholesale Gadgets & Electronics",
  promo1Subtitle: "Source directly from top tech manufacturers",
  promo1ButtonText: "Explore Now",
  promo1Link: "/shop?category=Electronics%20%26%20Gadgets",
  promo1Image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80",
  promo2Title: "Trendy Fashion, Shoes & Bags",
  promo2Subtitle: "Latest season designs with verified quality",
  promo2ButtonText: "View Collection",
  promo2Link: "/shop?category=Shoes",
  promo2Image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",

  // 12. How It Works Section
  howItWorksBadge: "Simple 4-Step Process",
  howItWorksTitle: "How Buying from China Works",
  howItWorksSubtitle: "We handle the entire sourcing, quality inspection, customs clearance, and delivery pipeline.",
  howItWorksSteps: [
    {
      step: "1",
      title: "Choose or Paste Link",
      desc: "Select products from our catalog or paste any supplier product link/SKU into our search bar.",
    },
    {
      step: "2",
      title: "Secure Payment",
      desc: "Confirm your order securely using bKash, Nagad, or Bank Transfer in Bangladeshi Taka.",
    },
    {
      step: "3",
      title: "Guangzhou QC & Freight",
      desc: "Our China team inspects your items, repacks securely, and flies them to Dhaka warehouse.",
    },
    {
      step: "4",
      title: "Doorstep Delivery",
      desc: "Pay international freight upon delivery anywhere in Bangladesh.",
    },
  ],

  // 13. Customer Testimonials Section
  testimonialsTitle: "Customer Testimonials",
  testimonialsSubtitle: "Feedback from business importers and individual shoppers",
  testimonialsRatingText: "4.9 / 5.0 (1,400+ Verified Orders)",
  testimonials: [
    {
      name: "Tanvir Ahmed",
      location: "Uttara, Dhaka",
      role: "Verified Importer",
      comment: "Ordered fitness accessories in bulk for our gym equipment store. Air cargo arrived in Dhaka in 9 days. Quality inspection photos were provided beforehand.",
      rating: 5,
    },
    {
      name: "Sabrina Chowdhury",
      location: "Chittagong",
      role: "Verified Buyer",
      comment: "Pasted a custom supplier link for stylish sunglasses. World Buy BD sourced them straight from the factory at genuine wholesale rates. Zero customs hassle.",
      rating: 5,
    },
    {
      name: "Mahmudul Hasan",
      location: "Gazipur",
      role: "Business Reseller",
      comment: "Sea cargo was extremely cost-effective for heavy hardware tools. Delivered in 38 days right to our warehouse with 100% tax clearance guaranteed.",
      rating: 5,
    },
  ],

  // 14. FAQ Section
  faqBadge: "Clear Answers",
  faqTitle: "Frequently Asked Questions",
  faqSubtitle: "Everything you need to know about purchasing, shipping, and payments",
  faqs: [
    {
      q: "How do I place an order with World Buy BD?",
      a: "Select your desired product directly on our platform or simply paste any supplier product link or SKU ID into our search bar. You can confirm your order by paying an 80% partial advance via bKash, Nagad, or Bank Transfer. The remaining 20% and international shipping charges are payable upon delivery in Bangladesh.",
    },
    {
      q: "How long does shipping take from China to Bangladesh?",
      a: "Air Freight typically takes only 7 to 12 days to arrive at our Dhaka warehouse and is dispatched to your doorstep the next business day. Heavy or bulk shipments via Sea Freight take approximately 35 to 45 days.",
    },
    {
      q: "What are the shipping charges and are there any customs duties?",
      a: "Our freight rates are 100% transparent and all-inclusive of customs clearance! General goods cost only BDT 780/kg via Air Cargo and BDT 250/kg via Sea Cargo. Sensitive goods (such as batteries, liquids, or magnets) are charged at BDT 1,200/kg via Air. You never pay any hidden customs taxes.",
    },
    {
      q: "Are the products inspected before shipping?",
      a: "Yes! Our dedicated quality control team at our Guangzhou Central Warehouse unboxes every shipment to verify quality, dimensions, colors, and functionality. We take photos and videos upon request. If any defects are discovered, we return the item directly to the factory.",
    },
    {
      q: "Can you source a product that is not listed on your website?",
      a: "Absolutely! Use our 'Request Custom Quote' button or send photos and specifications directly to our official WhatsApp helpline (+880 1355-136661). Our procurement team will communicate directly with verified manufacturers to get you the lowest factory rate.",
    },
    {
      q: "What payment methods are supported?",
      a: "You can pay safely in Bangladeshi Taka (BDT) through bKash, Nagad, Rocket, or direct local bank transfers. No international dual-currency credit card is required.",
    },
  ],

  // 15. Newsletter Banner
  newsletterTitle: "Subscribe for Weekly Factory Price Drops",
  newsletterSubtitle: "Get trending product recommendations and exclusive freight discount coupons.",
  newsletterButtonText: "Subscribe",

  // 16. Footer Content
  footerAbout: "World Buy BD — China to Bangladesh: Easy, Safe & Affordable. Discover millions of authentic products directly from verified Chinese factories, Alibaba, and Taobao with guaranteed door-to-door delivery.",
  footerGuaranteeText: "100% Customs Clearance & Inspection Guarantee",
  footerCopyright: "© 2026 World Buy BD. All Rights Reserved. China to Bangladesh Import & E-commerce.",
  footerPoweredBy: "Powered by World Buy BD Logistics",

  // 17. Info & Policy Pages (Full CMS)
  aboutPageTitle: "About Us",
  aboutPageIntro: "World Buy BD is the premier wholesale and retail import marketplace in Bangladesh that brings the latest global factory goods directly to your doorstep at genuine wholesale rates. You can purchase any product from verified Chinese manufacturers in Bangladeshi Taka (BDT) with a fast, safe, and transparent online shopping experience.",
  aboutPageWhyTitle: "Why Choose World Buy BD?",
  aboutPageWhyBullets: [
    "Direct factory-to-doorstep online purchasing experience.",
    "Lowest wholesale and retail prices across thousands of verified categories.",
    "Dedicated customer service desk via Phone, WhatsApp, and Live Support.",
    "1,400+ verified business resellers and individual importers across Bangladesh.",
    "Convenient local payments via bKash, Nagad, and Local Bank Transfers.",
    "Transparent per-KG international air and sea cargo charges with zero hidden customs fees.",
    "Guangzhou warehouse unboxing inspection and quality assurance guarantee.",
  ],
  aboutPageClosing: "We hope you enjoy sourcing products with us as much as we enjoy delivering them to you. If you have any questions or custom bulk sourcing requirements, please reach out to our team anytime.",

  contactPageTitle: "Contact Us",
  contactPageCtaTitle: "Have a question or custom sourcing request?",
  contactPageCtaText: "Feel free to reach out to our procurement & support team for any queries regarding your orders, shipping rates, or wholesale quotes.",
  contactPageButtonText: "Send Us an Email",

  privacyPageTitle: "Privacy Policy",
  privacyPageUpdated: "Updated on January 27, 2026",
  privacyPageIntro: "Welcome to World Buy BD. We respect your personal privacy and are committed to safeguarding the confidentiality of your personal information. This Privacy Policy details how we collect, store, and utilize data to fulfill your global procurement orders.",
  privacySections: [
    {
      heading: "Personal Information Collection",
      body: "When you register an account or checkout, we collect essential operational details: customer name, mobile phone number, delivery shipping address, and email address. All account records are stored in secure cloud infrastructure protected by industry-standard SSL encryption and firewall protocols.",
    },
    {
      heading: "Payment & Transaction Security",
      body: "Online payment transactions are processed securely through trusted payment gateways and direct local channels (bKash, Nagad, Rocket, or direct bank transfer). We never store debit/credit card CVV or sensitive banking passwords on our local servers.",
    },
    {
      heading: "Third-Party Data Disclosure",
      body: "We do not sell, rent, or lease your private information to third-party marketing brokers. Recipient contact details and delivery addresses are shared strictly with certified logistics and last-mile courier partners (such as Steadfast, Pathao, or RedX) solely for consignment delivery.",
    },
    {
      heading: "Cookies & Analytical Tracking",
      body: "Our website utilizes functional cookies and standard analytics to remember active shopping cart contents, session preferences, and improve browsing speed and performance.",
    },
    {
      heading: "Policy Updates & Customer Consent",
      body: "World Buy BD reserves the right to periodically update this policy. Continued usage of our website signifies acceptance of our privacy terms. For inquiries regarding your data, contact us at worldbuybd01@gmail.com.",
    },
  ],

  returnPageTitle: "Return & Refund Policy",
  returnPageSubtitle: "Official Terms & Guidelines for Global Procurements",
  returnPageIntro: "World Buy BD procures products on-demand directly from manufacturer factories in China upon your confirmation. Because items are custom-imported, returns and refunds are governed strictly by the terms outlined below.",
  returnHubAddress: "World Buy BD Hub\nKazipara, Mirpur-10, Dhaka 1216\nHelpline: +880 1355-136661 | Email: worldbuybd01@gmail.com",

  cancellationPageTitle: "Cancellation & Prohibited Items Policy",
  cancellationPageIntro: "World Buy BD facilitates cross-border procurement directly from international factories and suppliers to your doorstep. Because products are procured on-demand, please review our cancellation policy thoroughly before confirming orders.",
  prohibitedItemsList: [
    "Walkie-talkies and unauthorized radio frequency transmitters",
    "Gold, bullion, precious raw metals, and uncut gems",
    "SKD parts of restricted goods",
    "Drones and unmanned aerial vehicle (UAV) components",
    "Wooden and non-plastic bulky commercial furniture",
    "Gas lighters, flammable gases, and hazardous chemicals",
    "Restricted cosmetic formulations and non-certified chemical creams",
    "Security hardware, handcuffs, weapons, pistols, and replicas",
    "Smartphones and SIM devices without BTRC regulatory clearance",
    "Adult novelty goods and sexually explicit media",
    "Alcoholic beverages, narcotics, and controlled substances",
  ],

  // 18. Popup & Notices
  showNoticePopup: true,
  noticePopupTitle: "Special Welcome Discount Offer!",
  noticePopupMessage: "Get a special discount on your first order. Use coupon code at checkout.",
  noticePopupCode: "WORLDBUYBD",
  noticePopupImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80",
  discountPopup: {
    enabled: true,
    title: "Special Welcome Offer",
    subtitle: "Get a Flat 5% Discount on Your Order",
    couponCode: "WORLDBUY5",
    discountPercent: 5,
    imageUrl: "/assets/popup-banner.jpg",
    minOrderNotice: "Applicable on orders over BDT 2,000",
    ctaText: "Claim Discount Now",
    ctaLink: "/shop",
  },

  // 19. Payment, Currency & Order Rules
  rmbRate: 22.8,
  airShippingRate: 950,
  seaShippingRate: 450,
  minOrderAmount: 2000,
  deliveryCharge: 100,
  globalDiscount: 3,
  advancePercent: 80,
  bkashNumber: "01712-345678",
  bkashType: "Personal (Send Money)",
  nagadNumber: "01912-345678",
  nagadType: "Personal (Send Money)",
  bankName: "South East Bank PLC",
  bankAccountName: "Md Shamim Hossen",
  bankAccountNumber: "002412100022424",
  bankBranch: "Banani Branch",
  bankRouting: "205260432",
  phone: "+880 1355-136661",
  email: "worldbuybd01@gmail.com",
  apkDownloadUrl: "",
  playStoreUrl: "",
  googleSearchConsoleVerification: "",
};

export type CustomizerSectionId =
  | "theme"
  | "header"
  | "hero"
  | "quickhub"
  | "videos"
  | "sections"
  | "trust"
  | "flashsale"
  | "calculator"
  | "howitworks"
  | "testimonials"
  | "faq"
  | "newsletter"
  | "popup"
  | "payments"
  | "footer"
  | "pages"
  | "backup";

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  hasUnsavedChanges: boolean;
  isLiveEditMode: boolean;
  setIsLiveEditMode: (val: boolean) => void;
  activeEditSection: CustomizerSectionId;
  setActiveEditSection: (sec: CustomizerSectionId) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  openSectionEditor: (sec: CustomizerSectionId) => void;
  updateDraft: (patch: Partial<SiteSettings>) => void;
  saveSettings: (newSettings?: Partial<SiteSettings>) => Promise<boolean>;
  discardDraft: () => void;
  resetToDefaults: () => Promise<boolean>;
  uploadImage: (file: File) => Promise<string>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

function hasBengaliOr1688(val: any): boolean {
  if (typeof val === "string") {
    return /[\u0980-\u09F2\u09F4-\u09FF]/.test(val) || /1688/i.test(val);
  }
  if (Array.isArray(val)) {
    return val.some((item) => hasBengaliOr1688(item));
  }
  if (val && typeof val === "object") {
    return Object.values(val).some((v) => hasBengaliOr1688(v));
  }
  return false;
}

function mergeWithDefaults(raw: any): SiteSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SITE_SETTINGS };
  const sanitizedRaw: any = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!hasBengaliOr1688(v)) {
      sanitizedRaw[k] = v;
    }
  }
  const merged: SiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
    ...sanitizedRaw,
    navItems: Array.isArray(sanitizedRaw.navItems) && sanitizedRaw.navItems.length > 0 ? sanitizedRaw.navItems : DEFAULT_SITE_SETTINGS.navItems,
    heroSlides: Array.isArray(sanitizedRaw.heroSlides) && sanitizedRaw.heroSlides.length > 0 ? sanitizedRaw.heroSlides : DEFAULT_SITE_SETTINGS.heroSlides,
    trustBadges: Array.isArray(sanitizedRaw.trustBadges) && sanitizedRaw.trustBadges.length > 0 ? sanitizedRaw.trustBadges : DEFAULT_SITE_SETTINGS.trustBadges,
    howItWorksSteps: Array.isArray(sanitizedRaw.howItWorksSteps) && sanitizedRaw.howItWorksSteps.length > 0 ? sanitizedRaw.howItWorksSteps : DEFAULT_SITE_SETTINGS.howItWorksSteps,
    testimonials: Array.isArray(sanitizedRaw.testimonials) && sanitizedRaw.testimonials.length > 0 ? sanitizedRaw.testimonials : DEFAULT_SITE_SETTINGS.testimonials,
    faqs: Array.isArray(sanitizedRaw.faqs) && sanitizedRaw.faqs.length > 0 ? sanitizedRaw.faqs : DEFAULT_SITE_SETTINGS.faqs,
    aboutPageWhyBullets: Array.isArray(sanitizedRaw.aboutPageWhyBullets) && sanitizedRaw.aboutPageWhyBullets.length > 0 ? sanitizedRaw.aboutPageWhyBullets : DEFAULT_SITE_SETTINGS.aboutPageWhyBullets,
    privacySections: Array.isArray(sanitizedRaw.privacySections) && sanitizedRaw.privacySections.length > 0 ? sanitizedRaw.privacySections : DEFAULT_SITE_SETTINGS.privacySections,
    prohibitedItemsList: Array.isArray(sanitizedRaw.prohibitedItemsList) && sanitizedRaw.prohibitedItemsList.length > 0 ? sanitizedRaw.prohibitedItemsList : DEFAULT_SITE_SETTINGS.prohibitedItemsList,
    discountPopup: {
      ...DEFAULT_SITE_SETTINGS.discountPopup,
      ...(sanitizedRaw.discountPopup || {}),
    },
  };

  // Sync legacy phone/email fields if updated from AdminSettings
  if (sanitizedRaw.phone && !sanitizedRaw.hotlinePhone) merged.hotlinePhone = sanitizedRaw.phone;
  if (sanitizedRaw.email && !sanitizedRaw.supportEmail) merged.supportEmail = sanitizedRaw.email;

  return merged;
}

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedSettings, setSavedSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLiveEditMode, setIsLiveEditModeState] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("wbbd_live_edit_mode") === "true";
    } catch {
      return false;
    }
  });
  const [activeEditSection, setActiveEditSection] = useState<CustomizerSectionId>("theme");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const setIsLiveEditMode = useCallback((val: boolean) => {
    setIsLiveEditModeState(val);
    try {
      if (val) {
        sessionStorage.setItem("wbbd_live_edit_mode", "true");
      } else {
        sessionStorage.removeItem("wbbd_live_edit_mode");
        setIsDrawerOpen(false);
      }
    } catch {}
  }, []);

  const openSectionEditor = useCallback((sec: CustomizerSectionId) => {
    setActiveEditSection(sec);
    setIsLiveEditModeState(true);
    setIsDrawerOpen(true);
    try {
      sessionStorage.setItem("wbbd_live_edit_mode", "true");
    } catch {}
  }, []);

  // Apply dynamic CSS variables for theme colors, background & typography
  const applyVisualTheme = useCallback((s: Partial<SiteSettings>) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (s.primaryColor) {
      root.style.setProperty("--color-primary", s.primaryColor);
      root.style.setProperty("--color-pink", s.primaryColor);
    }
    if (s.primaryDarkColor) {
      root.style.setProperty("--color-primary-dark", s.primaryDarkColor);
    }
    if (s.secondaryColor) {
      root.style.setProperty("--color-secondary", s.secondaryColor);
    }
    if (s.accentColor) {
      root.style.setProperty("--color-accent", s.accentColor);
    }
    if (s.bgColor) {
      root.style.setProperty("--color-bg", s.bgColor);
      document.body.style.backgroundColor = s.bgColor;
    }
    if (s.fontFamily) {
      document.body.style.fontFamily = s.fontFamily;
    }
    if (s.siteName) {
      document.title = `${s.siteName} — ${s.siteTagline || "Direct China Wholesale & Retail"}`;
    }
    if (s.googleSearchConsoleVerification) {
      let gscMeta = document.getElementById("gsc-meta-tag") as HTMLMetaElement | null;
      if (!gscMeta) {
        gscMeta = document.querySelector('meta[name="google-site-verification"]');
      }
      if (gscMeta) {
        gscMeta.content = s.googleSearchConsoleVerification;
      }
    }
  }, []);

  useEffect(() => {
    cachedFetchJson<any>("/api/settings")
      .then((data) => {
        const merged = mergeWithDefaults(data);
        setSavedSettings(merged);
        setSettings(merged);
        applyVisualTheme(merged);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load site settings:", err);
        applyVisualTheme(DEFAULT_SITE_SETTINGS);
        setLoading(false);
      });
  }, [applyVisualTheme]);

  const updateDraft = useCallback((patch: Partial<SiteSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      applyVisualTheme(next);
      return next;
    });
    setHasUnsavedChanges(true);
  }, [applyVisualTheme]);

  const discardDraft = useCallback(() => {
    setSettings(savedSettings);
    applyVisualTheme(savedSettings);
    setHasUnsavedChanges(false);
  }, [savedSettings, applyVisualTheme]);

  const saveSettings = async (newSettings?: Partial<SiteSettings>): Promise<boolean> => {
    try {
      const updated: SiteSettings = {
        ...settings,
        ...(newSettings || {}),
        phone: (newSettings?.hotlinePhone ?? settings.hotlinePhone),
        email: (newSettings?.supportEmail ?? settings.supportEmail),
      };
      setSettings(updated);
      setSavedSettings(updated);
      applyVisualTheme(updated);

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings to server");
      }

      setHasUnsavedChanges(false);
      invalidateApiCache("/api/settings");
      invalidateApiCache("/api/products");
      return true;
    } catch (error) {
      console.error("Error saving site settings:", error);
      return false;
    }
  };

  const resetToDefaults = async (): Promise<boolean> => {
    try {
      setSettings(DEFAULT_SITE_SETTINGS);
      setSavedSettings(DEFAULT_SITE_SETTINGS);
      applyVisualTheme(DEFAULT_SITE_SETTINGS);
      setHasUnsavedChanges(false);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEFAULT_SITE_SETTINGS),
      });
      invalidateApiCache("/api/settings");
      invalidateApiCache("/api/products");
      return res.ok;
    } catch (e) {
      console.error("Error resetting settings:", e);
      return false;
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      throw new Error("Image upload failed");
    }
    const data = await res.json();
    return data.url;
  };

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        loading,
        hasUnsavedChanges,
        isLiveEditMode,
        setIsLiveEditMode,
        activeEditSection,
        setActiveEditSection,
        isDrawerOpen,
        setIsDrawerOpen,
        openSectionEditor,
        updateDraft,
        saveSettings,
        discardDraft,
        resetToDefaults,
        uploadImage,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return context;
};
