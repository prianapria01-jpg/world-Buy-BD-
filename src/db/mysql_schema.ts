import {
  mysqlTable,
  serial,
  varchar,
  text,
  decimal,
  int,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/mysql-core";

export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  offerId: varchar("offerId", { length: 255 }).unique().notNull(),
  title: text("title").notNull(),
  detailUrl: text("detailUrl"),
  price: decimal("price", { precision: 10, scale: 2 }),
  province: varchar("province", { length: 255 }),
  city: varchar("city", { length: 255 }),
  orderCount: int("orderCount").default(0),
  saledCount: int("saledCount").default(0),
  saledCountStr: varchar("saledCountStr", { length: 255 }),
  wantBuyCount: int("wantBuyCount").default(0),
  recentSoldCount: int("recentSoldCount").default(0),
  soldDisplay: varchar("soldDisplay", { length: 255 }),
  returnRate: varchar("returnRate", { length: 50 }),
  repurchaseRate: varchar("repurchaseRate", { length: 50 }),
  offerRepurchaseRate: varchar("offerRepurchaseRate", { length: 50 }),
  stock: int("stock").default(0),
  minOrderQuantity: int("minOrderQuantity").default(1),
  supportsMix: boolean("supportsMix").default(false),
  supportsSampling: boolean("supportsSampling").default(false),
  unitWeight: decimal("unitWeight", { precision: 10, scale: 3 }),
  isPromoted: boolean("isPromoted").default(false),
  block: varchar("block", { length: 255 }),
  categoryId: varchar("categoryId", { length: 255 }),
  topCategoryId: varchar("topCategoryId", { length: 255 }),
  categoryName: varchar("categoryName", { length: 255 }),
  categoryPath: text("categoryPath"),
  customization: boolean("customization").default(false),
  unit: varchar("unit", { length: 50 }),
  isOutOfStock: boolean("isOutOfStock").default(false),
  isCrossBorderTrade: boolean("isCrossBorderTrade").default(false),
  winportUrl: text("winportUrl"),
  descriptionUrl: text("descriptionUrl"),
  dropship: json("dropship"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const productQuantityPrices = mysqlTable("product_quantity_prices", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  minQuantity: int("min_quantity").notNull(),
  maxQuantity: int("max_quantity"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  discountPrice: decimal("discount_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("CNY"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productImages = mysqlTable("product_images", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  imageUrl: text("image_url").notNull(),
  sortOrder: int("sort_order").default(0),
  imageType: varchar("image_type", { length: 50 }), // main, gallery, sku, description
});

export const productVideos = mysqlTable("product_videos", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  videoUrl: text("video_url").notNull(),
  sortOrder: int("sort_order").default(0),
});

export const productSkuGroups = mysqlTable("product_sku_groups", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  groupName: varchar("group_name", { length: 255 }).notNull(),
  sortOrder: int("sort_order").default(0),
});

export const productSkuOptions = mysqlTable("product_sku_options", {
  id: serial("id").primaryKey(),
  skuGroupId: int("sku_group_id").notNull(),
  optionName: varchar("option_name", { length: 255 }).notNull(),
  optionValue: varchar("option_value", { length: 255 }),
  sortOrder: int("sort_order").default(0),
});

export const productSkus = mysqlTable("product_skus", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  skuId: varchar("sku_id", { length: 255 }),
  specId: varchar("spec_id", { length: 255 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  discountPrice: decimal("discount_price", { precision: 10, scale: 2 }),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  stock: int("stock").default(0),
  saleCount: int("sale_count").default(0),
  weight: decimal("weight", { precision: 10, scale: 3 }),
  imageUrl: text("image_url"),
  promotionSku: boolean("promotion_sku").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// To handle M:M mapping of SKUs to Options, we need a join table
export const productSkuOptionMappings = mysqlTable("product_sku_option_mappings", {
  id: serial("id").primaryKey(),
  skuId: int("sku_id").notNull(),
  optionId: int("option_id").notNull(),
});

export const productSpecs = mysqlTable("product_specs", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  specName: varchar("spec_name", { length: 255 }).notNull(),
  specValue: text("spec_value").notNull(),
  sortOrder: int("sort_order").default(0),
});

export const suppliers = mysqlTable("suppliers", {
  id: serial("id").primaryKey(),
  supplierName: varchar("supplier_name", { length: 255 }),
  companyName: varchar("company_name", { length: 255 }),
  memberId: varchar("member_id", { length: 255 }),
  loginId: varchar("login_id", { length: 255 }),
  shopUrl: text("shop_url"),
  province: varchar("province", { length: 255 }),
  city: varchar("city", { length: 255 }),
  businessType: varchar("business_type", { length: 255 }),
  tpYear: int("tp_year"),
  factoryInspected: boolean("factory_inspected").default(false),
  supplierFlags: json("supplier_flags"),
  supplierStatistics: json("supplier_statistics"),
  supplierServices: json("supplier_services"),
  supplierRatingInfo: json("supplier_rating_info"),
});

export const productServices = mysqlTable("product_services", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  serviceDescription: text("service_description"),
  serviceType: varchar("service_type", { length: 255 }),
  availableStatus: boolean("available_status").default(true),
});

export const productCoupons = mysqlTable("product_coupons", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  couponId: varchar("coupon_id", { length: 255 }),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  minPurchaseAmount: decimal("min_purchase_amount", { precision: 10, scale: 2 }),
  validity: text("validity"),
  conditions: text("conditions"),
  status: varchar("status", { length: 50 }),
});

export const productShipping = mysqlTable("product_shipping", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  deliveryTime: varchar("delivery_time", { length: 255 }),
  deliveryDays: int("delivery_days"),
  carrier: varchar("carrier", { length: 255 }),
  freeShippingStatus: boolean("free_shipping_status").default(false),
  shippingMethod: varchar("shipping_method", { length: 255 }),
  shippingDescription: text("shipping_description"),
  shippingRestrictions: json("shipping_restrictions"),
});

export const productPromotions = mysqlTable("product_promotions", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  promotionName: varchar("promotion_name", { length: 255 }),
  promotionType: varchar("promotion_type", { length: 255 }),
  promotionPrice: decimal("promotion_price", { precision: 10, scale: 2 }),
  promotionPeriod: varchar("promotion_period", { length: 255 }),
  promotionRules: json("promotion_rules"),
  promotionStatus: varchar("promotion_status", { length: 50 }),
});

export const productDescriptions = mysqlTable("product_descriptions", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  descriptionUrl: text("description_url"),
  descriptionText: text("description_text"),
  descriptionHtml: text("description_html"),
});

export const productRawData = mysqlTable("product_raw_data", {
  id: serial("id").primaryKey(),
  productId: int("product_id").notNull(),
  offerId: varchar("offer_id", { length: 255 }).notNull(),
  rawJson: json("raw_json").notNull(),
  importedAt: timestamp("imported_at").defaultNow(),
});

export const importLogs = mysqlTable("import_logs", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  offerId: varchar("offer_id", { length: 255 }),
  status: varchar("status", { length: 50 }), // SUCCESS, FAILED, UPDATED, DUPLICATE
  errorMessage: text("error_message"),
  importedProductId: int("imported_product_id"),
  numSkus: int("num_skus").default(0),
  numImages: int("num_images").default(0),
  processingTimeMs: int("processing_time_ms"),
  importDate: timestamp("import_date").defaultNow(),
});
