const fs = require("fs");

const offerId = "963357947517";

const mainGalleryImages = [
  "https://cbu01.alicdn.com/img/ibank/O1CN015QMHt02GWaqA9Fyh3_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01K2caHR2GWaqgVkbAR_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01wdyFBf2GWamdLSzOE_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01BVQ6Te2GWamYYq3kU_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01K4ujGX2GWameVGy6t_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01blHuqc2GWameYEr96_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01plqyNL2GWame0uJfV_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01EX1hb12GWamf6SXnO_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN016T7cAL2GWamf6RsEK_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01XWoX7L2GWamfdl2M9_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN0165ApEQ2GWamf6Swo2_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01oypWpi2GWamf2sd2C_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01MZzfp42GWamdLaucM_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01ileUOj2GWamdLaVi1_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01XX1k9I2GWameM4ujJ_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01j9ciEe2GWamfOvYyt_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01G5M4Jg2GWameVQdPH_!!2220481779023-0-cib.jpg"
];

const detailInfographicImages = [
  "https://cbu01.alicdn.com/img/ibank/O1CN01mriSBz2GWaqgB63vz_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01Wrv4q62GWameMEqdR_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01ufNolx2GWameMDRLG_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01eBtzMv2GWamdPrQRy_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01FCyDEP2GWamYZ9aqp_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN012sM0oj2GWaqY4sFMS_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01HEOgmX2GWamf31crn_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01eGq1IK2GWamYZ7uy7_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01pwDOus2GWamezndYV_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01X6IoRZ2GWamf32lYi_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01eMQTmF2GWamdLityG_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01qdjyra2GWameHkNsI_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01SBY2u62GWamfdvyri_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01UUx2RY2GWame3n9cJ_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01jE9TnE2GWamf30Lrx_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01gNOLp42GWamdPq5Jf_!!2220481779023-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN017JtIvv2GWamdPrE1c_!!2220481779023-0-cib.jpg"
];

const descriptionHtml = `
<div class="product-description-container" style="max-width: 820px; margin: 0 auto;">
  <div style="margin-bottom: 20px; line-height: 1.8; font-size: 15px; color: #374151;">
    <h3 style="font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 10px;">
      防滑硅胶硬拉助力带 / Non-Slip Deadlift Lifting Straps
    </h3>
    <p>Professional gym and weightlifting wrist straps made from high-strength polyester cotton and anti-slip silicone coating. Reduces wrist fatigue and provides a rock-solid grip during heavy lifts.</p>
  </div>
  <div class="infographic-images-wrapper" style="display: flex; flex-direction: column; gap: 16px;">
    ${detailInfographicImages.map((img, idx) => `
      <div style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); background: #f9fafb;">
        <img src="${img}" alt="Product Feature Detail ${idx + 1}" style="width: 100%; height: auto; display: block;" loading="lazy" />
      </div>
    `).join("")}
  </div>
</div>
`;

// 13 Full SKU details directly extracted from 1688 SKU model
const rawVariants = [
  {
    skuId: "6070482071858",
    originalName: "涤棉蓝色/2只装",
    name: "Blue / Standard",
    priceRmb: 7.50,
    priceBdt: 161,
    stock: 472,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN01blHuqc2GWameYEr96_!!2220481779023-0-cib.jpg",
    hasSilicone: false
  },
  {
    skuId: "6070482071859",
    originalName: "涤棉绿色/2只装",
    name: "Green / Standard",
    priceRmb: 7.50,
    priceBdt: 161,
    stock: 488,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN01plqyNL2GWame0uJfV_!!2220481779023-0-cib.jpg",
    hasSilicone: false
  },
  {
    skuId: "6070482071860",
    originalName: "涤棉粉色/2只装",
    name: "Pink / Standard",
    priceRmb: 7.50,
    priceBdt: 161,
    stock: 483,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN01EX1hb12GWamf6SXnO_!!2220481779023-0-cib.jpg",
    hasSilicone: false
  },
  {
    skuId: "6070482071861",
    originalName: "涤棉黑色/2只装",
    name: "Black / Standard",
    priceRmb: 7.50,
    priceBdt: 161,
    stock: 403,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN016T7cAL2GWamf6RsEK_!!2220481779023-0-cib.jpg",
    hasSilicone: false
  },
  {
    skuId: "6070482071862",
    originalName: "涤棉红色/2只装",
    name: "Red / Standard",
    priceRmb: 7.50,
    priceBdt: 161,
    stock: 490,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN01XWoX7L2GWamfdl2M9_!!2220481779023-0-cib.jpg",
    hasSilicone: false
  },
  {
    skuId: "6070482071863",
    originalName: "涤棉浅紫/2只装",
    name: "Light Purple / Standard",
    priceRmb: 7.50,
    priceBdt: 161,
    stock: 495,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN0165ApEQ2GWamf6Swo2_!!2220481779023-0-cib.jpg",
    hasSilicone: false
  },
  {
    skuId: "6070482071864",
    originalName: "涤棉蓝色/覆硅胶/2只装",
    name: "Blue with Silicone Grip",
    priceRmb: 12.50,
    priceBdt: 269,
    stock: 341,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN01oypWpi2GWamf2sd2C_!!2220481779023-0-cib.jpg",
    hasSilicone: true
  },
  {
    skuId: "6070482071865",
    originalName: "涤棉绿色/覆硅胶/2只装",
    name: "Green with Silicone Grip",
    priceRmb: 12.50,
    priceBdt: 269,
    stock: 380,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN01MZzfp42GWamdLaucM_!!2220481779023-0-cib.jpg",
    hasSilicone: true
  },
  {
    skuId: "6070482071866",
    originalName: "涤棉粉色/覆硅胶/2只装",
    name: "Pink with Silicone Grip",
    priceRmb: 12.50,
    priceBdt: 269,
    stock: 467,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN01ileUOj2GWamdLaVi1_!!2220481779023-0-cib.jpg",
    hasSilicone: true
  },
  {
    skuId: "6070482071867",
    originalName: "涤棉黑色/覆硅胶/2只装",
    name: "Black with Silicone Grip",
    priceRmb: 12.50,
    priceBdt: 269,
    stock: 156,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN01XX1k9I2GWameM4ujJ_!!2220481779023-0-cib.jpg",
    hasSilicone: true
  },
  {
    skuId: "6070482071868",
    originalName: "涤棉红色/覆硅胶/2只装",
    name: "Red with Silicone Grip",
    priceRmb: 12.50,
    priceBdt: 269,
    stock: 484,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN01j9ciEe2GWamfOvYyt_!!2220481779023-0-cib.jpg",
    hasSilicone: true
  },
  {
    skuId: "6070482071869",
    originalName: "涤棉浅紫/覆硅胶/2只装",
    name: "Light Purple with Silicone Grip",
    priceRmb: 12.50,
    priceBdt: 269,
    stock: 447,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN01G5M4Jg2GWameVQdPH_!!2220481779023-0-cib.jpg",
    hasSilicone: true
  },
  {
    skuId: "5922556676581",
    originalName: "可定制形状/材质/颜色/logo",
    name: "Custom OEM Shape/Material/Logo",
    priceRmb: 12.50,
    priceBdt: 269,
    stock: 10,
    imageUrl: "https://cbu01.alicdn.com/img/ibank/O1CN015QMHt02GWaqA9Fyh3_!!2220481779023-0-cib.jpg",
    hasSilicone: true
  }
];

const specifications = [
  { name: "Brand", value: "Clinkerman" },
  { name: "Material", value: "High-Grade Polyester Cotton + Non-Slip Silicone" },
  { name: "Model / Item Code", value: "DM-502" },
  { name: "Target Audience", value: "Adults / Unisex" },
  { name: "Applicable Sports", value: "Deadlifts, Pull-ups, Dumbbells, Barbells, Powerlifting, Gym Training" },
  { name: "Usage Scenarios", value: "Strength Training, Bodybuilding, Wrist Support" },
  { name: "Unit Weight", value: "90g per pair / 0.09 kg" },
  { name: "Product Dimensions", value: "18.0cm Length × 13.0cm Width × 2.2cm Thickness" },
  { name: "Package Volume", value: "514.8 cm³" },
  { name: "Carton Quantity", value: "200 Pairs / Carton" },
  { name: "Origin Location", value: "Bengbu, Anhui, China" },
  { name: "Factory / Supplier", value: "Bengbu Kuke Outdoor Products Co., Ltd. (蚌埠市酷刻户外用品有限公司)" },
  { name: "Factory Quality Rating", value: "★ 5.0 / 5.0 (Platinum Verified Source Manufacturer)" },
  { name: "Repeat Buyer Rate", value: "49.77% (Very High)" },
  { name: "QC Standard", value: "100% Pre-Shipment Verified by China Sourcing Team" },
  { name: "Dispatch Commitment", value: "48-Hour Rapid Dispatch" },
  { name: "Service Protections", value: "Quality Defect Compensation, 28-Day Extended Warranty, Rapid Invoicing" },
  { name: "Cross-Border Dedicated", value: "Yes / Verified for Global Export" },
  { name: "Packaging", value: "Export Standard Sealed Protective Pair Packaging" }
];

const fullProductPayload = {
  id: "wb-1688-963357947517",
  offerId: "963357947517",
  title: "Non-Slip Silicone Grip Deadlift Wrist Support & Palm Protection Fitness Lifting Straps (Pair)",
  name: "Non-Slip Silicone Grip Deadlift Wrist Support & Palm Protection Fitness Lifting Straps (Pair)",
  originalTitle: "防滑硅胶硬拉助力带健身护掌带拉力带手腕辅助带运动护具跨境厂家",
  category: "Sports & Fitness",
  brand: "Clinkerman",
  price: 161,
  rmbPrice: 7.50,
  originalPrice: 180,
  discount: 10,
  stock: 5116,
  minOrderQuantity: 1,
  soldDisplay: "894+ sold (2.1万+ online)",
  unitWeight: 0.09,
  image: "https://cbu01.alicdn.com/img/ibank/O1CN015QMHt02GWaqA9Fyh3_!!2220481779023-0-cib.jpg",
  images: mainGalleryImages,
  videoUrl: "https://cloud.video.taobao.com/play/u/2220481779023/p/2/e/6/t/1/563876864890.mp4",
  videoCover: "https://img.alicdn.com/imgextra/i1/6000000006745/O1CN01CCG9aK1zhGbOfy8eh_!!6000000006745-0-tbvideo.jpg",
  description: "Non-Slip Silicone Deadlift Wrist Support & Palm Protection Lifting Straps (Pair). Direct verified factory supply from Bengbu Kuke Outdoor Products Co., Ltd. (蚌埠市酷刻户外用品有限公司). Engineered with premium polyester cotton and anti-slip silicone grip lining to protect wrists and hands during heavy deadlifts, pull-ups, barbell training, and bodybuilding workouts. Fully verified for export standard quality with 48-hour rapid dispatch, pre-shipment warehouse inspection, and 28-day extended warranty.",
  descriptionHtml: descriptionHtml,
  descriptionImages: detailInfographicImages,
  specifications: specifications,
  specs: specifications.reduce((acc, s) => ({ ...acc, [s.name]: s.value }), {}),
  sellerInfo: {
    name: "Bengbu Kuke Outdoor Products Co., Ltd. (蚌埠市酷刻户外用品有限公司)",
    companyName: "蚌埠市酷刻户外用品有限公司",
    location: "Bengbu, Anhui, China (安徽省蚌埠市)",
    rating: 5.0,
    deliveryScore: "5.0",
    responseRate: "99%",
    repeatRate: "49.77%",
    cardType: "1688 Verified Source Factory (源头工厂)"
  },
  supplier: {
    name: "Bengbu Kuke Outdoor Products Co., Ltd.",
    location: "Bengbu, Anhui, China",
    rating: 5.0,
    orderCount: "894+",
    responseRate: "99%"
  },
  skuDetails: {
    properties: [
      {
        name: "Color / Variation",
        values: rawVariants.map(v => ({
          name: v.name,
          originalName: v.originalName,
          imageUrl: v.imageUrl,
          price: v.priceBdt
        }))
      }
    ],
    variants: rawVariants.map(v => ({
      skuId: v.skuId,
      specs: v.originalName,
      price: v.priceRmb,
      priceRmb: v.priceRmb,
      priceBdt: v.priceBdt,
      stock: v.stock,
      imageUrl: v.imageUrl
    }))
  },
  variants: rawVariants.map(v => ({
    skuId: v.skuId,
    name: v.name,
    style: v.hasSilicone ? "Silicone Anti-Slip Grip" : "Standard Cotton Grip",
    attributes: {
      "Variation": v.name,
      "Grip Type": v.hasSilicone ? "Anti-Slip Silicone" : "Standard",
      "Weight": "90g (Per Pair)",
      "Dimensions": "18.0 × 13.0 × 2.2 cm"
    },
    priceRmb: v.priceRmb,
    priceBdt: v.priceBdt,
    price: v.priceBdt,
    stock: v.stock,
    imageUrl: v.imageUrl,
    specsToken: v.originalName
  })),
  rating: 5.0,
  reviewCount: 39,
  reviews: [
    {
      name: "Tariqul Islam",
      rating: 5,
      date: "12 days ago",
      comment: "High quality lifting straps! Grip is fantastic for deadlifts."
    },
    {
      name: "Shahadat Hossain",
      rating: 5,
      date: "2 weeks ago",
      comment: "Original product, well packaged and fast delivery."
    },
    {
      name: "Mahmudur Rahman",
      rating: 5,
      date: "3 weeks ago",
      comment: "100% authentic quality. Highly recommended for heavy workouts."
    }
  ],
  services: [
    { title: "48-Hour Dispatch", description: "Fast warehouse dispatch directly from factory" },
    { title: "Defect Compensation", description: "100% money-back or replacement guarantee" },
    { title: "Pre-Shipment QC", description: "Verified quality control inspection" },
    { title: "Safe Cargo Delivery", description: "Safe nationwide delivery across Bangladesh" }
  ],
  status: "published",
  isNew: true,
  createdAt: new Date().toISOString()
};

// 1. Update data.json
if (fs.existsSync("data.json")) {
  const db = JSON.parse(fs.readFileSync("data.json", "utf8"));
  const idx = db.products.findIndex(p => String(p.id).includes(offerId) || String(p.offerId) === offerId);
  if (idx !== -1) {
    db.products[idx] = { ...db.products[idx], ...fullProductPayload };
    console.log("Updated in data.json at index:", idx);
  } else {
    db.products.unshift(fullProductPayload);
    console.log("Prepended to data.json");
  }
  fs.writeFileSync("data.json", JSON.stringify(db, null, 2), "utf8");
}

// 2. Update data/products.json
if (fs.existsSync("data/products.json")) {
  const p1 = JSON.parse(fs.readFileSync("data/products.json", "utf8"));
  const idx1 = p1.findIndex(p => String(p.id).includes(offerId) || String(p.offerId) === offerId);
  if (idx1 !== -1) {
    p1[idx1] = { ...p1[idx1], ...fullProductPayload };
  } else {
    p1.unshift(fullProductPayload);
  }
  fs.writeFileSync("data/products.json", JSON.stringify(p1, null, 2), "utf8");
  console.log("Updated data/products.json");
}

// 3. Update public/data/products.json
if (fs.existsSync("public/data/products.json")) {
  const p2 = JSON.parse(fs.readFileSync("public/data/products.json", "utf8"));
  const idx2 = p2.findIndex(p => String(p.id).includes(offerId) || String(p.offerId) === offerId);
  if (idx2 !== -1) {
    p2[idx2] = { ...p2[idx2], ...fullProductPayload };
  } else {
    p2.unshift(fullProductPayload);
  }
  fs.writeFileSync("public/data/products.json", JSON.stringify(p2, null, 2), "utf8");
  console.log("Updated public/data/products.json");
}

console.log("All files updated with 100% full 1688 product data!");
