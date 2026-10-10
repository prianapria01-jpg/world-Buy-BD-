import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(), // Firebase Auth UID (if using oauth/firebase)
  name: text('name'),
  email: text('email'),
  phone: text('phone').unique(),
  password: text('password'), // hashed password for manual login
  role: text('role').default('user'),
  cart: jsonb('cart').default('[]'),
  wishlist: jsonb('wishlist').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  offerId: text('offer_id').unique(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  originalPrice: integer('original_price'),
  discount: integer('discount'),
  image: text('image'),
  images: jsonb('images'),
  category: text('category'),
  status: text('status'),
  stock: integer('stock'),
  minOrderQuantity: integer('min_order_quantity').default(1),
  supplierName: text('supplier_name'),
  skuDetails: jsonb('sku_details'),
  specifications: jsonb('specifications'),
  videoUrl: text('video_url'),
  descriptionHtml: text('description_html'),
  descriptionImages: jsonb('description_images'),
  sellerInfo: jsonb('seller_info'),
  quantityPrices: jsonb('quantity_prices'),
  soldDisplay: text('sold_display'),
  brand: text('brand'),
  reviewCount: integer('review_count'),
  rating: text('rating'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  icon: text('icon'),
  image: text('image'),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').unique().notNull(),
  userId: integer('user_id'),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  customerAddress: text('customer_address'),
  totalPrice: integer('total_price'),
  paymentMethod: text('payment_method'),
  paymentStatus: text('payment_status'),
  status: text('status').default('Pending'),
  items: jsonb('items'),
  paymentInfo: jsonb('payment_info'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const subadmins = pgTable('subadmins', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  phone: text('phone'),
  password: text('password'),
  role: text('role').default('subadmin'),
  permissions: jsonb('permissions'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').unique().notNull(),
  value: jsonb('value'),
});

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  title: text('title'),
  imageUrl: text('image_url').notNull(),
  linkUrl: text('link_url'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const stockOutRefunds = pgTable('stock_out_refunds', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').notNull(),
  userId: integer('user_id').notNull(),
  productId: text('product_id').notNull(),
  refundAmount: integer('refund_amount').notNull(),
  status: text('status').default('Pending'), // Pending, Accepted, Completed
  customerChoice: text('customer_choice'), // Refund, Adjust
  createdAt: timestamp('created_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  orderId: text('order_id'),
  action: text('action').notNull(),
  department: text('department').notNull(),
  changedBy: text('changed_by').notNull(),
  field: text('field'),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').unique().notNull(),
  orderId: text('order_id').notNull(),
  customerInfo: jsonb('customer_info'),
  items: jsonb('items'),
  productTotal: integer('product_total'),
  shippingRate: integer('shipping_rate'),
  productWeight: text('product_weight'),
  shippingCost: integer('shipping_cost'),
  chinaCourierBill: integer('china_courier_bill'),
  chinaCourierEnabled: boolean('china_courier_enabled').default(true),
  finalShippingAmount: integer('final_shipping_amount'),
  grandTotal: integer('grand_total'),
  paidAmount: integer('paid_amount'),
  dueAmount: integer('due_amount'),
  paymentStatus: text('payment_status'),
  deliveryStatus: text('delivery_status'),
  undeliveredReason: text('undelivered_reason'),
  undeliveredNote: text('undelivered_note'),
  createdAt: timestamp('created_at').defaultNow(),
});

