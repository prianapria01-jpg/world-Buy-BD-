# World Buy BD - 1688 System Architecture

This outlines the complete database schema, backend API structure, admin import system, and frontend product details page architecture designed to handle complex 1688 products natively within the World Buy BD ecosystem.

## 1. Database Schema (`src/db/mysql_schema.ts`)
We created a robust relational schema utilizing **Drizzle ORM** (MySQL mapping). 
This covers the exact structural requirements provided:
- **`products`**: Main table for core info (offerId, title, stats).
- **`product_sku_groups` & `product_sku_options`**: For mapping "Color", "Size" to "Black", "Large".
- **`product_skus`**: Stores the absolute specific variations (e.g. price and stock for Black+Large) ensuring no SKU combination is lost.
- **`product_specs`**: Supports unlimited specifications.
- **`suppliers`**: Maps directly to the manufacturer.
- **`product_images` & `product_videos`**: URL-based media handling.
- **`product_raw_data`**: Backs up the raw JSON payload in case mapping needs adjustments.

## 2. Admin Import Panel (`src/pages/admin/AdminImport1688.tsx`)
A dedicated admin panel reachable at `/admin/1688-importer`.
- **URL Extractor**: Provide a 1688 link.
- **System Integration**: Validates and maps the extracted payload directly to the MySQL DB schema.
- **Status Logging**: Duplicate protection implemented (will show DUPLICATE or SUCCESS).

## 3. World Buy BD Product Page Architecture (`src/pages/ProductDetails1688.tsx`)
A comprehensive customer-facing page reachable via `/product-1688/:id`.
- **World Buy BD Branded**: Follows the global Tailwind styling of the app.
- **Complex SKU Matrix**: Customers can click combinations (Color -> Size). The React state instantly fetches the exact mapped SKU for price and stock updates.
- **Price Engine**: Shows original price vs customer price by applying the RMB to BDT conversion rate + Markup.

## How to run locally in VS Code
1. Ensure your local machine has Node.js and npm installed.
2. Clone/Download the project.
3. Run `npm install` to grab dependencies (Drizzle ORM has already been installed).
4. Run `npm run dev` to boot the application.
5. Go to `/admin/1688-importer` to view the admin UI.
6. Go to `/product-1688/1` to view the comprehensive product details demo.
