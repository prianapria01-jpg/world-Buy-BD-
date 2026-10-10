const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, '..', 'data.json');

const categories = [
  { id: "cat-shoes", name: "Shoes", slug: "shoes", icon: "Footprints" },
  { id: "cat-bags", name: "Bags", slug: "bags", icon: "ShoppingBag" },
  { id: "cat-jewelry", name: "Jewelry", slug: "jewelry", icon: "Gem" },
  { id: "cat-beauty-care", name: "Beauty Care", slug: "beauty-care", icon: "Sparkles" },
  { id: "cat-mens-clothing", name: "Men’s Clothing", slug: "mens-clothing", icon: "Shirt" },
  { id: "cat-womens-clothing", name: "Women's Clothing", slug: "womens-clothing", icon: "Heart" },
  { id: "cat-baby-items", name: "Baby Items", slug: "baby-items", icon: "Baby" },
  { id: "cat-eyewear", name: "Eyewear", slug: "eyewear", icon: "Glasses" },
  { id: "cat-office-school", name: "Office & School Supplies", slug: "office-school-supplies", icon: "BookOpen" },
  { id: "cat-phone-accessories", name: "Phone Accessories", slug: "phone-accessories", icon: "Smartphone" },
  { id: "cat-sports-fitness", name: "Sports & Fitness", slug: "sports-fitness", icon: "Dumbbell" },
  { id: "cat-entertainment", name: "Entertainment Items", slug: "entertainment-items", icon: "Gamepad2" },
  { id: "cat-watches", name: "Watches", slug: "watches", icon: "Watch" },
  { id: "cat-automobile", name: "Automobile Items", slug: "automobile-items", icon: "Car" },
  { id: "cat-pets-food", name: "Pets Food", slug: "pets-food", icon: "Bone" },
  { id: "cat-outdoor-travelling", name: "Outdoor & Travelling", slug: "outdoor-travelling", icon: "Compass" },
  { id: "cat-electronics-gadgets", name: "Electronics & Gadgets", slug: "electronics-gadgets", icon: "Laptop" },
  { id: "cat-home-kitchen", name: "Home And Kitchen", slug: "home-and-kitchen", icon: "UtensilsCrossed" },
  { id: "cat-tools-home-impr", name: "Tools & Home Impr", slug: "tools-home-impr", icon: "Wrench" }
];

const newProductsByCat = {
  "Shoes": [
    {
      name: "Men's Ultra-Light Breathable Running Sneakers",
      price: 1850,
      originalPrice: 2450,
      discount: 24,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "AeroSport Pro",
      rating: 4.8,
      reviews: 42,
      stock: 65,
      specifications: [{ name: "Upper Material", value: "Breathable Mesh" }, { name: "Sole", value: "EVA Cushioning" }, { name: "Closure", value: "Lace-Up" }],
      description: "High-performance lightweight athletic sneakers engineered for daily jogging, gym training, and casual streetwear."
    },
    {
      name: "Women's Chunky Platform Retro Casual Walking Shoes",
      price: 1950,
      originalPrice: 2600,
      discount: 25,
      image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "UrbanWalk",
      rating: 4.9,
      reviews: 38,
      stock: 48,
      specifications: [{ name: "Style", value: "Chunky Platform" }, { name: "Insole", value: "Memory Foam" }, { name: "Colors", value: "White/Pastel Pink" }],
      description: "Trendy Korean-style retro platform sneakers providing exceptional height boost and all-day walking comfort."
    }
  ],
  "Jewelry": [
    {
      name: "18K Gold Plated Zircon Crystal Pendant Luxury Necklace",
      price: 850,
      originalPrice: 1250,
      discount: 32,
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "AuraGems",
      rating: 4.9,
      reviews: 56,
      stock: 120,
      specifications: [{ name: "Plating", value: "18K Real Gold Electroplating" }, { name: "Stone", value: "AAA Cubic Zirconia" }, { name: "Chain Length", value: "45cm + 5cm extension" }],
      description: "Dazzling hypoallergenic zircon crystal necklace crafted for elegant party wear, weddings, and premium gifting."
    },
    {
      name: "Vintage Titanium Steel Minimalist Couple Rings Set",
      price: 650,
      originalPrice: 950,
      discount: 31,
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "EternalCraft",
      rating: 4.7,
      reviews: 29,
      stock: 90,
      specifications: [{ name: "Material", value: "Titanium Steel" }, { name: "Finish", value: "High Polish Matte Bevel" }, { name: "Waterproof", value: "100% Anti-Tarnish" }],
      description: "Sleek, scratch-resistant matching bands designed with comfortable rounded inner edges for daily wear."
    }
  ],
  "Beauty Care": [
    {
      name: "Natural Rose Quartz Facial Jade Roller & Gua Sha Set",
      price: 750,
      originalPrice: 1100,
      discount: 31,
      image: "https://images.unsplash.com/photo-1512290900672-1f55b0b008e0?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1512290900672-1f55b0b008e0?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "GlowBeauty",
      rating: 4.8,
      reviews: 64,
      stock: 85,
      specifications: [{ name: "Stone", value: "100% Natural Rose Quartz" }, { name: "Use For", value: "Anti-Aging, Lymphatic Drainage, Face Contouring" }],
      description: "Authentic jade roller with dual-head design and matching gua sha scraper to stimulate collagen and reduce puffiness."
    },
    {
      name: "Ultrasonic Deep Pore Face Cleansing Scrubber & Peeling Device",
      price: 1450,
      originalPrice: 2100,
      discount: 30,
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "DermaPure",
      rating: 4.7,
      reviews: 31,
      stock: 45,
      specifications: [{ name: "Modes", value: "Cleansing, Moisturizing, Lifting" }, { name: "Charging", value: "USB Rechargeable" }, { name: "Blade", value: "Medical Stainless Steel" }],
      description: "High-frequency ultrasonic oscillation removes blackheads, dead skin cells, and excess sebum effortlessly."
    }
  ],
  "Men’s Clothing": [
    {
      name: "Premium Oxford Cotton Slim-Fit Long Sleeve Casual Shirt",
      price: 1250,
      originalPrice: 1750,
      discount: 28,
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "UrbanTailor",
      rating: 4.8,
      reviews: 73,
      stock: 95,
      specifications: [{ name: "Fabric", value: "100% Combed Oxford Cotton" }, { name: "Fit", value: "Slim Fit" }, { name: "Collar", value: "Button-Down" }],
      description: "Tailored to perfection with breathable pure cotton, ideal for smart corporate office wear or weekend social outings."
    },
    {
      name: "Vintage Washed Oversized Heavyweight Cotton Hoodie",
      price: 1650,
      originalPrice: 2200,
      discount: 25,
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "StreetVibe BD",
      rating: 4.9,
      reviews: 48,
      stock: 60,
      specifications: [{ name: "Weight", value: "380 GSM Heavy Terry" }, { name: "Style", value: "Drop Shoulder Oversized" }, { name: "Pocket", value: "Kangaroo Front Pocket" }],
      description: "Super warm and cozy fleece interior with vintage acid-washed aesthetic for streetwear enthusiasts."
    }
  ],
  "Women's Clothing": [
    {
      name: "Bohemian Floral Chiffon Tiered Elegant Maxi Dress",
      price: 1750,
      originalPrice: 2500,
      discount: 30,
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "BelleChic",
      rating: 4.9,
      reviews: 52,
      stock: 45,
      specifications: [{ name: "Material", value: "Soft Flowing Chiffon with Full Lining" }, { name: "Sleeve", value: "Puff Sleeves" }, { name: "Waist", value: "Elastic Smocked Waist" }],
      description: "Graceful floral summer maxi dress designed with breathable fabric and romantic silhouette."
    },
    {
      name: "High-Waist Wide Leg Casual Drape Trousers with Belt",
      price: 1150,
      originalPrice: 1600,
      discount: 28,
      image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "VogueLine",
      rating: 4.8,
      reviews: 37,
      stock: 70,
      specifications: [{ name: "Cut", value: "Wide Leg Flared" }, { name: "Fabric", value: "Crepe Poly Blend" }, { name: "Pockets", value: "Deep Side Pockets" }],
      description: "Chic formal-casual straight drape trousers that pair effortlessly with crop tops or formal blazers."
    }
  ],
  "Baby Items": [
    {
      name: "Organic Cotton Baby Romper Jumpsuit (Pack of 3)",
      price: 950,
      originalPrice: 1350,
      discount: 29,
      image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "TinySnuggles",
      rating: 4.9,
      reviews: 64,
      stock: 80,
      specifications: [{ name: "Material", value: "100% GOTS Certified Organic Cotton" }, { name: "Closure", value: "Nickel-Free Snap Buttons" }, { name: "Age Range", value: "0-12 Months" }],
      description: "Ultra-gentle breathable baby onesies designed with expandable neckline and diaper-friendly snap bottoms."
    },
    {
      name: "Ergonomic 6-in-1 Multi-Position Baby Hipseat Carrier",
      price: 2150,
      originalPrice: 3100,
      discount: 30,
      image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "SafeCuddle",
      rating: 4.8,
      reviews: 41,
      stock: 35,
      specifications: [{ name: "Weight Support", value: "Up to 20kg (3-36 Months)" }, { name: "Ergonomics", value: "M-Shape Sitting Support" }, { name: "Waistband", value: "Padded Lumbar Support" }],
      description: "Evenly distributes baby weight across parents shoulders and waist, with breathable 3D air mesh."
    }
  ],
  "Eyewear": [
    {
      name: "Classic Polarized Aviator UV400 Sunglasses with Metal Frame",
      price: 890,
      originalPrice: 1350,
      discount: 34,
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "SkyRay Optics",
      rating: 4.8,
      reviews: 82,
      stock: 110,
      specifications: [{ name: "Lens", value: "TAC Polarized UV400 Protection" }, { name: "Frame", value: "Corrosion-Resistant Metal Alloy" }, { name: "Includes", value: "Hard Leather Case & Microfiber Cloth" }],
      description: "Eliminates glare while driving or outdoor sports while providing 100% harmful UV ray filtration."
    },
    {
      name: "Anti-Blue Light Computer Gaming Reading Glasses",
      price: 650,
      originalPrice: 950,
      discount: 31,
      image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "OptiShield",
      rating: 4.7,
      reviews: 58,
      stock: 140,
      specifications: [{ name: "Lens Type", value: "Anti-Reflective Blue Ray Blocker" }, { name: "Weight", value: "Ultra-Light 18g" }, { name: "Frame", value: "TR90 Flexible Material" }],
      description: "Reduces digital eye strain, headache, and insomnia caused by prolonged smartphone and computer screen exposure."
    }
  ],
  "Office & School Supplies": [
    {
      name: "Luxury Refillable A5 Vintage Leather Notebook & Executive Pen Set",
      price: 950,
      originalPrice: 1400,
      discount: 32,
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "ScriptCraft",
      rating: 4.9,
      reviews: 44,
      stock: 75,
      specifications: [{ name: "Pages", value: "200 Pages 100gsm Ink-Proof Paper" }, { name: "Cover", value: "Supple PU Leather with Magnetic Clasp" }, { name: "Pen", value: "Rollerball 0.5mm Metal Body" }],
      description: "Perfect for corporate journaling, academic notes, brainstorming, and executive business meetings."
    },
    {
      name: "Multi-Functional 360° Rotating Desk Organizer Caddy",
      price: 680,
      originalPrice: 990,
      discount: 31,
      image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "NeatDesk",
      rating: 4.7,
      reviews: 35,
      stock: 60,
      specifications: [{ name: "Compartments", value: "5 Slots with Deep Centers" }, { name: "Base", value: "Smooth Ball-Bearing 360 Rotation" }, { name: "Material", value: "Durable BPA-Free ABS Plastic" }],
      description: "Keeps stationery, pens, markers, scissors, and paper clips neatly organized on any study desk."
    }
  ],
  "Phone Accessories": [
    {
      name: "3-in-1 Fast Magnetic Wireless Charging Station Stand (15W)",
      price: 1850,
      originalPrice: 2700,
      discount: 31,
      image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "VoltMag",
      rating: 4.9,
      reviews: 89,
      stock: 50,
      specifications: [{ name: "Compatibility", value: "iPhone 12-16, AirPods, Apple Watch & Qi Androids" }, { name: "Output", value: "15W Fast Charge" }, { name: "Protection", value: "Overheat & Surge Protection" }],
      description: "Charges your smartphone, wireless earbuds, and smartwatch all at once with magnetic auto-alignment."
    },
    {
      name: "Heavy Duty Shockproof Armor Magnetic Ring Phone Case",
      price: 490,
      originalPrice: 750,
      discount: 34,
      image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "ArmorShield",
      rating: 4.8,
      reviews: 112,
      stock: 200,
      specifications: [{ name: "Protection", value: "Military Grade Drop Tested 10ft" }, { name: "Kickstand", value: "360° Rotatable Magnetic Ring" }, { name: "Camera Guard", value: "1.5mm Raised Lip" }],
      description: "Double-layered TPU bumper with polycarbonate back protects your mobile phone from drops and scratches."
    }
  ],
  "Sports & Fitness": [
    {
      name: "Non-Slip 8mm High Density TPE Exercise Yoga Mat with Carry Strap",
      price: 1250,
      originalPrice: 1800,
      discount: 30,
      image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "ZenCore Fitness",
      rating: 4.9,
      reviews: 76,
      stock: 85,
      specifications: [{ name: "Thickness", value: "8mm Joint-Protective Cushioning" }, { name: "Texture", value: "Double-Sided Laser Non-Slip Grip" }, { name: "Size", value: "183cm x 61cm" }],
      description: "Eco-friendly non-toxic yoga mat engineered for pilates, floor workouts, push-ups, and meditation."
    },
    {
      name: "11-Piece Resistance Bands Home Gym Workout Set with Door Anchor",
      price: 990,
      originalPrice: 1500,
      discount: 34,
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "FitForce",
      rating: 4.8,
      reviews: 58,
      stock: 90,
      specifications: [{ name: "Tension", value: "Stackable up to 150 lbs" }, { name: "Includes", value: "5 Latex Bands, 2 Cushioned Handles, 2 Ankle Straps, Door Anchor & Bag" }],
      description: "Complete full-body workout system to build muscle, strengthen arms, chest, and legs at home."
    }
  ],
  "Entertainment Items": [
    {
      name: "RGB Mechanical Gaming Keyboard with Blue Switches & Detachable Cable",
      price: 2450,
      originalPrice: 3500,
      discount: 30,
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "ViperStrike",
      rating: 4.8,
      reviews: 67,
      stock: 40,
      specifications: [{ name: "Switches", value: "Tactile Clicky Blue Mechanical Switches" }, { name: "Lighting", value: "18 Custom RGB Backlight Modes" }, { name: "Anti-Ghosting", value: "Full Key Rollover" }],
      description: "Ultimate precision mechanical keyboard engineered for competitive gamers and fast typists."
    },
    {
      name: "Portable Retro Handheld Video Game Console (500 Classic Games)",
      price: 850,
      originalPrice: 1300,
      discount: 34,
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "PixelPlay",
      rating: 4.7,
      reviews: 95,
      stock: 120,
      specifications: [{ name: "Screen", value: "3.0-Inch Color LCD Display" }, { name: "Battery", value: "1020mAh Rechargeable (6 Hours Playtime)" }, { name: "TV Out", value: "AV Cable Included for TV Connection" }],
      description: "Relive childhood nostalgic games like Super Mario, Contra, and Tank on this pocket-sized retro console."
    }
  ],
  "Watches": [
    {
      name: "Men's Luxury Minimalist Ultra-Thin Quartz Wristwatch with Mesh Band",
      price: 1350,
      originalPrice: 1950,
      discount: 30,
      image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "Geneva Chrono",
      rating: 4.9,
      reviews: 83,
      stock: 70,
      specifications: [{ name: "Dial Diameter", value: "40mm Ultra-Slim 7mm" }, { name: "Movement", value: "Japanese Precision Quartz" }, { name: "Water Resistance", value: "3ATM Daily Splashproof" }],
      description: "Sleek stainless steel mesh band with scratch-resistant mineral glass for formal and everyday attire."
    },
    {
      name: "Waterproof Multi-Function Digital Sports Chronograph Watch",
      price: 950,
      originalPrice: 1450,
      discount: 34,
      image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "Tactix Pro",
      rating: 4.8,
      reviews: 52,
      stock: 85,
      specifications: [{ name: "Features", value: "Stopwatch, LED Backlight, Dual Time, Alarm" }, { name: "Waterproof", value: "50M / 5ATM Swimming Ready" }, { name: "Strap", value: "Durable TPU Resin" }],
      description: "Rugged military shockproof watch built to withstand rough outdoor sports, running, and swimming."
    }
  ],
  "Automobile Items": [
    {
      name: "High-Power 120W Portable Handheld Wet/Dry Car Vacuum Cleaner",
      price: 1350,
      originalPrice: 1950,
      discount: 30,
      image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "AutoClean Pro",
      rating: 4.8,
      reviews: 61,
      stock: 55,
      specifications: [{ name: "Suction Power", value: "8000 PA Cyclone Suction" }, { name: "Filter", value: "Washable Stainless Steel HEPA" }, { name: "Power", value: "12V Cigarette Lighter Plug (4.5m Cable)" }],
      description: "Quickly sucks up dust, biscuit crumbs, pet hair, and spilled liquids inside car cabins and trunk."
    },
    {
      name: "Universal 360° Magnetic Dashboard & Air Vent Car Phone Mount",
      price: 450,
      originalPrice: 700,
      discount: 35,
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "DriveSafe",
      rating: 4.7,
      reviews: 78,
      stock: 150,
      specifications: [{ name: "Magnets", value: "6x Strong N52 Neodymium Magnets" }, { name: "Mounting", value: "Strong 3M VHB Base + Air Vent Clip" }],
      description: "Secure one-handed magnetic lock keeps your phone stable even over rough bumps and emergency braking."
    }
  ],
  "Pets Food": [
    {
      name: "Royal Canine & Feline Nutrition Grain-Free Adult Cat Food (1.5kg)",
      price: 1450,
      originalPrice: 1950,
      discount: 25,
      image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "PawFeast Gourmet",
      rating: 4.9,
      reviews: 39,
      stock: 65,
      specifications: [{ name: "Flavour", value: "Ocean Salmon & Tender Tuna" }, { name: "Benefits", value: "Hairball Control, Shiny Coat, Taurine Enriched" }, { name: "Weight", value: "1.5 Kg" }],
      description: "Specially formulated complete nutrition to boost immunity and promote healthy digestion for indoor cats."
    },
    {
      name: "Natural Dental Chew Bones for Dogs (Pack of 10 Pcs)",
      price: 550,
      originalPrice: 800,
      discount: 31,
      image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "BarkBites",
      rating: 4.8,
      reviews: 47,
      stock: 80,
      specifications: [{ name: "Ingredient", value: "Rawhide Free, Beef & Veggie Formula" }, { name: "Oral Care", value: "Removes Tartar & Freshens Breath" }],
      description: "Long-lasting tasty dental treats that satisfy dogs' natural urge to chew while protecting their gums."
    }
  ],
  "Outdoor & Travelling": [
    {
      name: "40L Waterproof Tactical Hiking & Travel Backpack with Rain Cover",
      price: 2150,
      originalPrice: 3200,
      discount: 32,
      image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "SummitTrek",
      rating: 4.9,
      reviews: 58,
      stock: 45,
      specifications: [{ name: "Capacity", value: "40 Liters with Multi-Compartments" }, { name: "Material", value: "900D Tear-Resistant Oxford Fabric" }, { name: "Padding", value: "Breathable Sponge Back Support" }],
      description: "Spacious ergonomic rucksack designed for weekend trekking, flights, camping, and mountain climbing."
    },
    {
      name: "Ultra-Bright Rechargeable LED Camping Lantern with Solar & Powerbank",
      price: 1100,
      originalPrice: 1650,
      discount: 33,
      image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "CampLume",
      rating: 4.8,
      reviews: 62,
      stock: 90,
      specifications: [{ name: "Brightness", value: "1000 Lumens 360° Illumination" }, { name: "Battery", value: "4400mAh with Phone Emergency Charging" }, { name: "Waterproof", value: "IPX5 Weatherproof" }],
      description: "Collapsible solar emergency lamp with 4 light modes, ideal for load shedding, night fishing, and tents."
    }
  ],
  "Electronics & Gadgets": [
    {
      name: "TWS Active Noise Cancelling (ANC) Wireless Earbuds with Touch Control",
      price: 1750,
      originalPrice: 2600,
      discount: 32,
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "SonicWave",
      rating: 4.8,
      reviews: 145,
      stock: 120,
      specifications: [{ name: "Bluetooth", value: "v5.3 Low Latency 40ms" }, { name: "Battery", value: "32 Hours Total Playtime with Case" }, { name: "Noise Reduction", value: "-35dB Hybrid ANC" }],
      description: "Crystal clear HD calls, deep bass diaphragms, and smart noise cancellation for music lovers."
    },
    {
      name: "20000mAh 65W PD Fast Charge Power Bank for Laptops & Phones",
      price: 2450,
      originalPrice: 3500,
      discount: 30,
      image: "https://images.unsplash.com/photo-1609592424364-555e8869c9b1?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1609592424364-555e8869c9b1?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "PowerCore Titan",
      rating: 4.9,
      reviews: 98,
      stock: 50,
      specifications: [{ name: "Output", value: "Type-C 65W PD + 22.5W QC3.0 USB" }, { name: "Display", value: "Smart Digital Percentage Screen" }, { name: "Cells", value: "UL-Certified Polymer Battery" }],
      description: "Charges modern MacBooks, iPads, iPhones, and Android flagships from 0% to 60% in just 30 minutes."
    }
  ],
  "Home And Kitchen": [
    {
      name: "Multi-Function High-Speed Electric Spice & Coffee Grinder (300W)",
      price: 1150,
      originalPrice: 1700,
      discount: 32,
      image: "https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "ChefMaster",
      rating: 4.8,
      reviews: 84,
      stock: 75,
      specifications: [{ name: "Blade", value: "304 Food-Grade Stainless Steel 4-Leaf Blade" }, { name: "Capacity", value: "100g Dry Spices/Beans" }, { name: "Motor", value: "Pure Copper High-Torque Motor" }],
      description: "Grinds coffee beans, dry red chili, cumin, cardamom, and nuts in just 10-15 seconds effortlessly."
    },
    {
      name: "Non-Stick Granite Marble Coating Frying Pan with Wooden Handle (28cm)",
      price: 1450,
      originalPrice: 2200,
      discount: 34,
      image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "GraniteChef",
      rating: 4.9,
      reviews: 67,
      stock: 60,
      specifications: [{ name: "Coating", value: "100% PFOA-Free German Stone Coating" }, { name: "Stove Suitability", value: "Induction, Gas, Electric & Ceramic" }],
      description: "Healthy low-oil cooking with easy wipe-clean surface and heat-resistant ergonomic cool-touch handle."
    }
  ],
  "Tools & Home Impr": [
    {
      name: "108-in-1 Precision Magnetic Screwdriver Repair Tool Kit",
      price: 850,
      originalPrice: 1300,
      discount: 34,
      image: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "ProFixer",
      rating: 4.9,
      reviews: 110,
      stock: 95,
      specifications: [{ name: "Bits", value: "CR-V Chromium Vanadium Steel (HRC 58-62)" }, { name: "For", value: "Smartphones, Laptops, Watches, Electronics" }, { name: "Case", value: "Shockproof Compact Magnetic Storage Box" }],
      description: "Everything required to disassemble and fix iPhones, MacBooks, gaming controllers, and household appliances."
    },
    {
      name: "12V Cordless Rechargeable Electric Drill & Screwdriver Kit with Bits",
      price: 2350,
      originalPrice: 3400,
      discount: 30,
      image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=600",
      images: [
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=600"
      ],
      brand: "PowerCraft Pro",
      rating: 4.8,
      reviews: 73,
      stock: 45,
      specifications: [{ name: "Torque", value: "18+1 Torque Settings, 25 N.m" }, { name: "Speed", value: "Dual Speed (0-350 / 0-1350 RPM)" }, { name: "Includes", value: "Li-ion Battery, Fast Charger, 24 Accessories" }],
      description: "Powerful compact drill for wood, drywall, metal drilling, and furniture assembly with built-in LED work light."
    }
  ]
};

function run() {
  if (!fs.existsSync(DB_FILE)) {
    console.error("data.json not found!");
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  const db = JSON.parse(raw);

  // Set the 19 categories
  db.categories = categories;

  // Update existing products:
  // Any product that was in "Imported (1688)" or "Fashion" or contains bag keywords -> set to "Bags"
  if (Array.isArray(db.products)) {
    db.products = db.products.map(p => {
      if (!p.category || p.category === "Imported (1688)" || p.category === "Fashion" || p.category === "Fashion & Clothing") {
        return { ...p, category: "Bags" };
      }
      return p;
    });
  } else {
    db.products = [];
  }

  // Add the newly created products for each of the categories
  let addedCount = 0;
  for (const [catName, prods] of Object.entries(newProductsByCat)) {
    // Check if category already has products
    const existing = db.products.filter(p => p.category === catName);
    if (existing.length < prods.length) {
      for (const p of prods) {
        // avoid duplicate by name
        if (!db.products.some(x => x.name === p.name)) {
          const newProd = {
            id: crypto.randomUUID(),
            name: p.name,
            price: p.price,
            originalPrice: p.originalPrice,
            discount: p.discount,
            image: p.image,
            images: p.images || [p.image],
            category: catName,
            brand: p.brand,
            rating: p.rating,
            reviews: p.reviews,
            status: "published",
            stock: p.stock,
            offerId: "wb-" + Math.floor(100000000 + Math.random() * 900000000),
            specifications: p.specifications,
            description: p.description,
            sellerInfo: {
              name: p.brand + " Official Store",
              level: "Gold Supplier",
              location: "Guangzhou / Yiwu International Market",
              rating: 4.9,
              responseRate: "98.5%",
              deliveryScore: 4.9
            },
            importedUrl: "https://www.1688.com",
            createdAt: new Date().toISOString()
          };
          db.products.push(newProd);
          addedCount++;
        }
      }
    }
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  console.log(`Updated data.json successfully! Total categories: ${db.categories.length}, Total products: ${db.products.length} (Added ${addedCount} new category products).`);
}

run();
