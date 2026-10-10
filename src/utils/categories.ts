import {
  Footprints, ShoppingBag, Gem, Sparkles, Shirt, Heart, Baby,
  Glasses, BookOpen, Smartphone, Dumbbell, Gamepad2, Watch,
  Car, Bone, Compass, Laptop, UtensilsCrossed, Wrench, Tag, Boxes,
  Briefcase, Wallet, Backpack, Luggage, CreditCard, Gift, Banknote,
  Crown, CircleDot, CloudRain, Trophy,
  type LucideIcon
} from "lucide-react";

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  IconComponent: LucideIcon;
  image: string;
  parentCategory?: string;
  parentSlug?: string;
  subCategories?: CategoryInfo[];
}

export const BAG_SUBCATEGORIES: CategoryInfo[] = [
  {
    id: "cat-wallet",
    name: "Wallet",
    slug: "wallet",
    iconName: "Wallet",
    IconComponent: Wallet,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
  {
    id: "cat-purse",
    name: "Purse",
    slug: "purse",
    iconName: "ShoppingBag",
    IconComponent: ShoppingBag,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
  {
    id: "cat-backpack",
    name: "Backpack",
    slug: "backpack",
    iconName: "Backpack",
    IconComponent: Backpack,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
  {
    id: "cat-ladies-bag",
    name: "Ladies Bag",
    slug: "ladies-bag",
    iconName: "ShoppingBag",
    IconComponent: ShoppingBag,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
  {
    id: "cat-crossbody-bags",
    name: "Crossbody Bags",
    slug: "crossbody-bags",
    iconName: "ShoppingBag",
    IconComponent: ShoppingBag,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
  {
    id: "cat-travel-bag",
    name: "Travel Bag",
    slug: "travel-bag",
    iconName: "Luggage",
    IconComponent: Luggage,
    image: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
  {
    id: "cat-handbag",
    name: "Handbag",
    slug: "handbag",
    iconName: "ShoppingBag",
    IconComponent: ShoppingBag,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
  {
    id: "cat-laptop-bags",
    name: "Laptop Bags",
    slug: "laptop-bags",
    iconName: "Laptop",
    IconComponent: Laptop,
    image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
  {
    id: "cat-school-bags",
    name: "School Bags",
    slug: "school-bags",
    iconName: "Backpack",
    IconComponent: Backpack,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
  {
    id: "cat-canvas-bag",
    name: "Canvas Bag",
    slug: "canvas-bag",
    iconName: "ShoppingBag",
    IconComponent: ShoppingBag,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
  {
    id: "cat-beach-bag",
    name: "Beach Bag",
    slug: "beach-bag",
    iconName: "ShoppingBag",
    IconComponent: ShoppingBag,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
  {
    id: "cat-messenger-bag",
    name: "Messenger Bag",
    slug: "messenger-bag",
    iconName: "Briefcase",
    IconComponent: Briefcase,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
  {
    id: "cat-bum-bag",
    name: "Bum Bag",
    slug: "bum-bag",
    iconName: "ShoppingBag",
    IconComponent: ShoppingBag,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=400&q=80",
    parentCategory: "Bag",
    parentSlug: "bag",
  },
];

export const SHOES_SUBCATEGORIES: CategoryInfo[] = [
  { id: "cat-men-shoes", name: "Men Shoes", slug: "men-shoes", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-men-boots", name: "Men Boots", slug: "men-boots", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-ladies-shoes", name: "Ladies Shoes", slug: "ladies-shoes", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-ladies-boot", name: "Ladies Boot", slug: "ladies-boot", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-high-heels", name: "High Heels", slug: "high-heels", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-formal-shoes", name: "Formal Shoes", slug: "formal-shoes", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-sandals", name: "Sandals", slug: "sandals", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-running-shoes", name: "Running Shoes", slug: "running-shoes", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-casual-shoes", name: "Casual Shoes", slug: "casual-shoes", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-loafers", name: "Loafers", slug: "loafers", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-sports-shoes", name: "Sports Shoes", slug: "sports-shoes", iconName: "Dumbbell", IconComponent: Dumbbell, image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-baby-shoes", name: "Baby Shoes", slug: "baby-shoes", iconName: "Baby", IconComponent: Baby, image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-low-top-shoes", name: "Low Top Shoes", slug: "low-top-shoes", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-rain-boots", name: "Rain Boots", slug: "rain-boots", iconName: "CloudRain", IconComponent: CloudRain, image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-football-shoes", name: "Football Shoes", slug: "football-shoes", iconName: "Trophy", IconComponent: Trophy, image: "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
  { id: "cat-slippers", name: "Slippers", slug: "slippers", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=400&q=80", parentCategory: "Shoes", parentSlug: "shoes" },
];

export const JEWELRY_SUBCATEGORIES: CategoryInfo[] = [
  { id: "cat-men-bracelets", name: "Men Bracelets", slug: "men-bracelets", iconName: "Gem", IconComponent: Gem, image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-earrings", name: "Earrings", slug: "earrings", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-jewelry-cases", name: "Jewelry Cases", slug: "jewelry-cases", iconName: "Boxes", IconComponent: Boxes, image: "https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-necklace", name: "Necklace", slug: "necklace", iconName: "Gem", IconComponent: Gem, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-bridal-jewelry", name: "Bridal Jewelry", slug: "bridal-jewelry", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-crown", name: "Crown", slug: "crown", iconName: "Crown", IconComponent: Crown, image: "https://images.unsplash.com/photo-1546167889-0b4f5ff62034?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-pendant", name: "Pendant", slug: "pendant", iconName: "Gem", IconComponent: Gem, image: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-bangle", name: "Bangle", slug: "bangle", iconName: "CircleDot", IconComponent: CircleDot, image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-ring", name: "Ring", slug: "ring", iconName: "CircleDot", IconComponent: CircleDot, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-anklet", name: "Anklet", slug: "anklet", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-tiara", name: "Tiara", slug: "tiara", iconName: "Crown", IconComponent: Crown, image: "https://images.unsplash.com/photo-1546167889-0b4f5ff62034?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-belly-chain", name: "Belly Chain", slug: "belly-chain", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-jewelry-box", name: "Jewelry Box", slug: "jewelry-box", iconName: "Gift", IconComponent: Gift, image: "https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-pin-brooch", name: "Pin Brooch", slug: "pin-brooch", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
  { id: "cat-fashion-jewelry", name: "Fashion Jewelry", slug: "fashion-jewelry", iconName: "Gem", IconComponent: Gem, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80", parentCategory: "Jewelry", parentSlug: "jewelry" },
];

export const BEAUTY_SUBCATEGORIES: CategoryInfo[] = [
  { id: "cat-eyeshadow", name: "Eyeshadow", slug: "eyeshadow", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-eyeliner", name: "Eyeliner", slug: "eyeliner", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-face-powder", name: "Face Powder", slug: "face-powder", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-makeup-remover", name: "Makeup Remover", slug: "makeup-remover", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-eye-brushes", name: "Eye Brushes", slug: "eye-brushes", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-hair-removal", name: "Hair Removal", slug: "hair-removal", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-mirror", name: "Mirror", slug: "mirror", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-teeth-whitening", name: "Teeth Whitening", slug: "teeth-whitening", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1559591937-abc36800675f?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-nail-polish", name: "Nail Polish", slug: "nail-polish", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-lip-gloss", name: "Lip Gloss", slug: "lip-gloss", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-lip-liner", name: "Lip Liner", slug: "lip-liner", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-lipstick", name: "Lipstick", slug: "lipstick", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-anti-hair-loss", name: "Anti Hair Loss", slug: "anti-hair-loss", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-hairspray", name: "Hairspray", slug: "hairspray", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-hair-dryers", name: "Hair Dryers", slug: "hair-dryers", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-hair-dye", name: "Hair Dye", slug: "hair-dye", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-hair-oil", name: "Hair Oil", slug: "hair-oil", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1608248597359-0e6d526a6c58?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-shower-gel", name: "Shower Gel", slug: "shower-gel", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-candles", name: "Candles", slug: "candles", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-lotion", name: "Lotion", slug: "lotion", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-perfume", name: "Perfume", slug: "perfume", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-perfume-set", name: "Perfume Set", slug: "perfume-set", iconName: "Gift", IconComponent: Gift, image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
  { id: "cat-deodorant", name: "Deodorant", slug: "deodorant", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80", parentCategory: "Beauty Products", parentSlug: "beauty-care" },
];

export const MENS_CLOTHING_SUBCATEGORIES: CategoryInfo[] = [
  { id: "cat-mens-jeans-pant", name: "Mens Jeans Pant", slug: "mens-jeans-pant", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-men-suit", name: "Men Suit", slug: "men-suit", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-leather-jackets-for-men", name: "Leather Jackets For Men", slug: "leather-jackets-for-men", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-trouser", name: "Trouser", slug: "trouser", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-shirts", name: "Shirts", slug: "shirts", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-shorts", name: "Shorts", slug: "shorts", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-tie-clips", name: "Tie Clips", slug: "tie-clips", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1589756823695-278bc923f962?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-mens-sweater", name: "Mens Sweater", slug: "mens-sweater", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-boxers", name: "Boxers", slug: "boxers", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-mens-hat", name: "Mens Hat", slug: "mens-hat", iconName: "Crown", IconComponent: Crown, image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-leather-gloves", name: "Leather Gloves", slug: "leather-gloves", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-men-sweatpants", name: "Men Sweatpants", slug: "men-sweatpants", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-socks", name: "Socks", slug: "socks", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-tie", name: "Tie", slug: "tie", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1589756823695-278bc923f962?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-bow-ties", name: "Bow Ties", slug: "bow-ties", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1589756823695-278bc923f962?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
  { id: "cat-gloves", name: "Gloves", slug: "gloves", iconName: "Shirt", IconComponent: Shirt, image: "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=400&q=80", parentCategory: "Mens Clothing", parentSlug: "mens-clothing" },
];

export const WOMENS_CLOTHING_SUBCATEGORIES: CategoryInfo[] = [
  { id: "cat-hodies-sweatshirts", name: "Hodies & Sweatshirrts", slug: "hodies-sweatshirrts", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-womens-suits-blazers", name: "Womens Suits Blazers", slug: "womens-suits-blazers", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-bodysuits", name: "Bodysuits", slug: "bodysuits", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-coats-jackets", name: "Coats Jackets", slug: "coats-jackets", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-swimwear", name: "Swimwear", slug: "swimwear", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-bikini-set", name: "Bikini Set", slug: "bikini-set", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-skirt", name: "Skirt", slug: "skirt", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-womens-jeans", name: "Womens Jeans", slug: "womens-jeans", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-wedding-dresses", name: "Wedding Dresses", slug: "wedding-dresses", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-prom-dresses", name: "Prom Dresses", slug: "prom-dresses", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-evening-dresses", name: "Evening Dresses", slug: "evening-dresses", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-cosplay-costumes", name: "Cosplay Costumes", slug: "cosplay-costumes", iconName: "Sparkles", IconComponent: Sparkles, image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-bra", name: "Bra", slug: "bra", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-panties", name: "Panties", slug: "panties", iconName: "Heart", IconComponent: Heart, image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-women-socks", name: "Women Socks", slug: "women-socks", iconName: "Footprints", IconComponent: Footprints, image: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-bucket-hats", name: "Bucket Hats", slug: "bucket-hats", iconName: "Crown", IconComponent: Crown, image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
  { id: "cat-belts", name: "Belts", slug: "belts", iconName: "Tag", IconComponent: Tag, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80", parentCategory: "Womens Clothing", parentSlug: "womens-clothing" },
];

function makeSubList(
  names: string[],
  parentCategory: string,
  parentSlug: string,
  iconName: string,
  IconComponent: LucideIcon,
  image: string,
  slugPrefix = ""
): CategoryInfo[] {
  return names.map((name) => {
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = slugPrefix ? `${slugPrefix}-${baseSlug}` : baseSlug;
    return {
      id: `cat-${parentSlug}-${baseSlug}`,
      name,
      slug,
      iconName,
      IconComponent,
      image,
      parentCategory,
      parentSlug,
    };
  });
}

export const BABY_SUBCATEGORIES: CategoryInfo[] = makeSubList(
  [
    "Baby Bottle",
    "Diapers",
    "Potty & Washing",
    "Water Toys",
    "Remote Control Toys",
    "Baby Gift Set",
    "Baby Dress",
    "Baby Socks",
    "Baby Swimsuit",
    "Baby Jacket",
    "Baby Skirt",
    "Baby Sweater",
    "Baby Shoes",
    "Baby Sports Shoes",
  ],
  "Baby Items",
  "baby-items",
  "Baby",
  Baby,
  "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=400&q=80"
);

export const SUNGLASS_SUBCATEGORIES: CategoryInfo[] = makeSubList(
  [
    "Sunglasses",
    "Reading Glasses",
    "Blue Light Glasses",
    "Prescription Glasses",
    "Fashion Glasses",
    "Sports Glasses",
    "Safety Glasses",
    "Cycling Glasses",
    "Driving Glasses",
    "Kids Glasses",
    "3D Glasses",
    "Contact Lenses",
    "Color Contact Lenses",
    "Polarized Glasses",
    "Photochromic Glasses",
    "Aviator Sunglasses",
    "Wayfarer Sunglasses",
    "Cat Eye Sunglasses",
    "Round Sunglasses",
    "Oversized Sunglasses",
    "Retro Glasses",
    "Smart Glasses",
    "Swimming Goggles",
    "Ski Goggles",
    "Diving Masks",
    "Protective Goggles",
    "Lens Cleaners",
    "Eyewear Cases",
    "Eyewear Chains",
    "Clip-on Sunglasses",
  ],
  "Sunglass",
  "eyewear",
  "Glasses",
  Glasses,
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=400&q=80"
);

export const PHONE_ACCESSORIES_SUBCATEGORIES: CategoryInfo[] = makeSubList(
  [
    "Phone Cases",
    "Screen Protectors",
    "Charging Cables",
    "Wireless Chargers",
    "Power Banks",
    "Phone Holders",
    "Car Mounts",
    "Pop Sockets",
    "Earphones",
    "Wireless Earbuds",
    "Headphones",
    "Bluetooth Headsets",
    "Phone Lanyards",
    "Selfie Sticks",
    "Tripods",
    "Memory Cards",
    "OTG Adapters",
    "Stylus Pens",
    "Gaming Triggers",
    "Cooling Fans",
    "Phone Cleaning Kits",
    "SIM Card Adapters",
    "Phone Skins",
    "USB Hubs",
    "Microphones",
    "Phone Cameras Lenses",
    "Smart Rings",
    "VR Glasses",
    "Car Chargers",
    "Phone Batteries",
  ],
  "Phone Accessories",
  "phone-accessories",
  "Smartphone",
  Smartphone,
  "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=400&q=80"
);

export const FITNESS_SUBCATEGORIES: CategoryInfo[] = makeSubList(
  [
    "Snowboard",
    "Jet Ski",
    "Swimming",
    "Fishing Rod",
    "Grills & Bbq Equipment",
    "Luggage Lock",
    "Yoga",
    "Tent",
  ],
  "Fitness",
  "sports-fitness",
  "Dumbbell",
  Dumbbell,
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80"
);

export const WATCHES_SUBCATEGORIES: CategoryInfo[] = makeSubList(
  [
    "Watch",
    "Analog Watches",
    "Digital Watches",
    "Smartwatches",
    "Luxury Watches",
    "Sports Watches",
    "Chronograph Watches",
    "Automatic Watches",
    "Quartz Watches",
    "Skeleton Watches",
    "Diving Watches",
    "Pilot Watches",
    "Fashion Watches",
    "Minimalist Watches",
    "Couple Watches",
    "Pocket Watches",
    "Military Watches",
    "Tactical Watches",
    "Smart Fitness Watches",
    "GPS Watches",
    "Hybrid Watches",
    "Leather Strap Watches",
    "Metal Strap Watches",
    "Silicone Strap Watches",
    "Limited Edition Watches",
    "Dive Smartwatches",
    "Alarm Watches",
    "Waterproof Watches",
    "Vintage Watches",
    "Fashion Smartwatches",
    "Kids Watches",
    "Sports Smartwatches",
  ],
  "Watches",
  "watches",
  "Watch",
  Watch,
  "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=400&q=80"
);

export const PETS_FOOD_SUBCATEGORIES: CategoryInfo[] = makeSubList(
  [
    "Breakfast",
    "Laundry & Household",
    "Cat",
    "Cat Bag",
    "Dog",
    "Fish",
    "Bird",
    "Small Pet",
  ],
  "Pets Food Items",
  "pets-food",
  "Bone",
  Bone,
  "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80"
);

export const AUTOMOBILE_SUBCATEGORIES: CategoryInfo[] = makeSubList(
  [
    "Car Accessories",
    "Car Seats",
    "Car Covers",
    "Car Lights",
    "Car Batteries",
    "Car Tires",
    "GPS Navigation",
    "Dash Cameras",
    "Car Vacuum Cleaners",
    "Car Organizers",
    "Steering Wheel Covers",
    "Car Audio Systems",
    "Car Horns",
    "Car Mirrors",
    "Car Mats",
    "Car Cleaning Supplies",
    "Air Fresheners",
    "Car Tools",
    "Tire Inflators",
    "Car Alarms",
    "Roof Racks",
    "Fuel Additives",
    "Car Paint Protection",
    "Tow Hooks",
    "Car Jacks",
    "Tool Kits",
    "Windshield Wipers",
    "Car Covers Waterproof",
    "Car Security Cameras",
  ],
  "Automobile Items",
  "automobile-items",
  "Car",
  Car,
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80"
);

export const OUTDOOR_SUBCATEGORIES: CategoryInfo[] = makeSubList(
  [
    "Tents",
    "Sleeping Bags",
    "Backpacks",
    "Hiking Boots",
    "Camping Chairs",
    "Camping Tables",
    "Portable Stoves",
    "Cooler Boxes",
    "Travel Bags",
    "Duffel Bags",
    "Travel Organizers",
    "Hiking Poles",
    "Water Bottles",
    "First Aid Kits",
    "Portable Lanterns",
    "Camping Cookware",
    "Sleeping Pads",
    "Hammocks",
    "Travel Pillows",
    "Portable Showers",
    "Travel Locks",
    "Travel Adapters",
    "Hiking Socks",
    "Camping Hats",
    "Travel Wallets",
    "Dry Bags",
    "Portable Chargers",
    "Travel Umbrellas",
    "Outdoor Gloves",
    "Climbing Gear",
  ],
  "Outdoor & Travelling",
  "outdoor-travelling",
  "Compass",
  Compass,
  "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=400&q=80"
);

export const ELECTRONICS_SUBCATEGORIES: CategoryInfo[] = makeSubList(
  [
    "Smartphones",
    "Tablets",
    "Laptops",
    "Desktop Computers",
    "Smartwatches",
    "Fitness Trackers",
    "Bluetooth Speakers",
    "Headphones",
    "Earbuds",
    "Cameras",
    "Action Cameras",
    "Drones",
    "VR Headsets",
    "Projectors",
    "External Hard Drives",
    "USB Flash Drives",
    "Power Banks",
    "Chargers",
    "Gaming Consoles",
    "Smart Home Devices",
    "Cables & Adapters",
    "Routers",
    "Modems",
    "Webcams",
    "Portable Fans",
    "LED Lights",
    "Microphones",
    "Smart Glasses",
    "Portable Speakers",
    "Electronic Toys",
  ],
  "Electronics & Gadgets",
  "electronics-gadgets",
  "Laptop",
  Laptop,
  "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400&q=80"
);

export const HOME_KITCHEN_SUBCATEGORIES: CategoryInfo[] = makeSubList(
  [
    "Cookware",
    "Bakeware",
    "Kitchen Utensils",
    "Cutlery",
    "Dinnerware",
    "Glassware",
    "Storage Containers",
    "Kitchen Gadgets",
    "Blenders",
    "Juicers",
    "Coffee Makers",
    "Kettles",
    "Toasters",
    "Microwaves",
    "Refrigerators",
    "Ovens",
    "Dishwashers",
    "Vacuum Cleaners",
    "Air Purifiers",
    "Fans",
    "Heaters",
    "Water Filters",
    "Food Processors",
    "Knife Sets",
    "Chopping Boards",
    "Mixing Bowls",
    "Storage Jars",
    "Trash Bins",
    "Lighting Fixtures",
    "Clocks",
  ],
  "Home And Kitchen",
  "home-and-kitchen",
  "UtensilsCrossed",
  UtensilsCrossed,
  "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80"
);

export const TOOLS_SUBCATEGORIES: CategoryInfo[] = makeSubList(
  [
    "Power Tools",
    "Hand Tools",
    "Screwdrivers",
    "Wrenches",
    "Hammers",
    "Drills",
    "Saws",
    "Sanders",
    "Measuring Tools",
    "Levels",
    "Tape Measures",
    "Toolboxes",
    "Workbenches",
    "Fasteners",
    "Nails",
    "Screws",
    "Bolts",
    "Anchors",
    "Paints",
    "Paint Brushes",
    "Rollers",
    "Protective Gear",
    "Gloves",
    "Safety Glasses",
    "Masks",
    "Ladders",
    "Extension Cords",
    "Lighting",
    "Generators",
  ],
  "Tools & Home Improvement",
  "tools-home-improvement",
  "Wrench",
  Wrench,
  "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=400&q=80"
);

export const MAIN_CATEGORIES_LIST: CategoryInfo[] = [
  {
    id: "cat-bag",
    name: "Bag",
    slug: "bag",
    iconName: "ShoppingBag",
    IconComponent: ShoppingBag,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80",
    subCategories: BAG_SUBCATEGORIES,
  },
  {
    id: "cat-shoes",
    name: "Shoes",
    slug: "shoes",
    iconName: "Footprints",
    IconComponent: Footprints,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
    subCategories: SHOES_SUBCATEGORIES,
  },
  {
    id: "cat-jewelry",
    name: "Jewelry",
    slug: "jewelry",
    iconName: "Gem",
    IconComponent: Gem,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80",
    subCategories: JEWELRY_SUBCATEGORIES,
  },
  {
    id: "cat-beauty-care",
    name: "Beauty Products",
    slug: "beauty-care",
    iconName: "Sparkles",
    IconComponent: Sparkles,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
    subCategories: BEAUTY_SUBCATEGORIES,
  },
  {
    id: "cat-mens-clothing",
    name: "Mens Clothing",
    slug: "mens-clothing",
    iconName: "Shirt",
    IconComponent: Shirt,
    image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=400&q=80",
    subCategories: MENS_CLOTHING_SUBCATEGORIES,
  },
  {
    id: "cat-womens-clothing",
    name: "Womens Clothing",
    slug: "womens-clothing",
    iconName: "Heart",
    IconComponent: Heart,
    image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=400&q=80",
    subCategories: WOMENS_CLOTHING_SUBCATEGORIES,
  },
  {
    id: "cat-baby-items",
    name: "Baby Items",
    slug: "baby-items",
    iconName: "Baby",
    IconComponent: Baby,
    image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=400&q=80",
    subCategories: BABY_SUBCATEGORIES,
  },
  {
    id: "cat-eyewear",
    name: "Sunglass",
    slug: "eyewear",
    iconName: "Glasses",
    IconComponent: Glasses,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=400&q=80",
    subCategories: SUNGLASS_SUBCATEGORIES,
  },
  {
    id: "cat-phone-accessories",
    name: "Phone Accessories",
    slug: "phone-accessories",
    iconName: "Smartphone",
    IconComponent: Smartphone,
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=400&q=80",
    subCategories: PHONE_ACCESSORIES_SUBCATEGORIES,
  },
  {
    id: "cat-sports-fitness",
    name: "Fitness",
    slug: "sports-fitness",
    iconName: "Dumbbell",
    IconComponent: Dumbbell,
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80",
    subCategories: FITNESS_SUBCATEGORIES,
  },
  {
    id: "cat-watches",
    name: "Watches",
    slug: "watches",
    iconName: "Watch",
    IconComponent: Watch,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=400&q=80",
    subCategories: WATCHES_SUBCATEGORIES,
  },
  {
    id: "cat-pets-food",
    name: "Pets Food Items",
    slug: "pets-food",
    iconName: "Bone",
    IconComponent: Bone,
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80",
    subCategories: PETS_FOOD_SUBCATEGORIES,
  },
  {
    id: "cat-automobile",
    name: "Automobile Items",
    slug: "automobile-items",
    iconName: "Car",
    IconComponent: Car,
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80",
    subCategories: AUTOMOBILE_SUBCATEGORIES,
  },
  {
    id: "cat-outdoor-travelling",
    name: "Outdoor & Travelling",
    slug: "outdoor-travelling",
    iconName: "Compass",
    IconComponent: Compass,
    image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=400&q=80",
    subCategories: OUTDOOR_SUBCATEGORIES,
  },
  {
    id: "cat-electronics-gadgets",
    name: "Electronics & Gadgets",
    slug: "electronics-gadgets",
    iconName: "Laptop",
    IconComponent: Laptop,
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400&q=80",
    subCategories: ELECTRONICS_SUBCATEGORIES,
  },
  {
    id: "cat-home-kitchen",
    name: "Home And Kitchen",
    slug: "home-and-kitchen",
    iconName: "UtensilsCrossed",
    IconComponent: UtensilsCrossed,
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80",
    subCategories: HOME_KITCHEN_SUBCATEGORIES,
  },
  {
    id: "cat-tools-home-improvement",
    name: "Tools & Home Improvement",
    slug: "tools-home-improvement",
    iconName: "Wrench",
    IconComponent: Wrench,
    image: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=400&q=80",
    subCategories: TOOLS_SUBCATEGORIES,
  },
  { id: "cat-office-school", name: "Office & School Supplies", slug: "office-school-supplies", iconName: "BookOpen", IconComponent: BookOpen, image: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=400&q=80" },
  { id: "cat-entertainment", name: "Entertainment Items", slug: "entertainment-items", iconName: "Gamepad2", IconComponent: Gamepad2, image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=400&q=80" },
];

export const EXPANDABLE_MAIN_CATEGORIES: CategoryInfo[] = MAIN_CATEGORIES_LIST.filter(
  (c) => Array.isArray(c.subCategories) && c.subCategories.length > 0
);

// Full flat list including Main Categories and all Sub-Categories (deduplicated by slug)
export const CATEGORIES_LIST: CategoryInfo[] = (() => {
  const list: CategoryInfo[] = [];
  const seen = new Set<string>();
  for (const mc of MAIN_CATEGORIES_LIST) {
    if (!seen.has(mc.slug)) {
      seen.add(mc.slug);
      list.push(mc);
    }
    if (Array.isArray(mc.subCategories)) {
      for (const sub of mc.subCategories) {
        if (!seen.has(sub.slug)) {
          seen.add(sub.slug);
          list.push(sub);
        }
      }
    }
  }
  return list;
})();

const BAG_SUB_SLUG_SET = new Set<string>([
  ...BAG_SUBCATEGORIES.map((s) => s.slug.toLowerCase()),
  "bags",
  "briefcases",
  "money-clip",
  "card-holder",
  "laptop-bag",
  "suitcase",
  "waist-bag",
  "hand-bag",
  "gift-box",
]);
const SHOES_SUB_SLUG_SET = new Set<string>(SHOES_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const JEWELRY_SUB_SLUG_SET = new Set<string>(JEWELRY_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const BEAUTY_SUB_SLUG_SET = new Set<string>(BEAUTY_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const MENS_CLOTHING_SUB_SLUG_SET = new Set<string>(MENS_CLOTHING_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const WOMENS_CLOTHING_SUB_SLUG_SET = new Set<string>(WOMENS_CLOTHING_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const BABY_SUB_SLUG_SET = new Set<string>(BABY_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const SUNGLASS_SUB_SLUG_SET = new Set<string>(SUNGLASS_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const PHONE_SUB_SLUG_SET = new Set<string>(PHONE_ACCESSORIES_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const FITNESS_SUB_SLUG_SET = new Set<string>(FITNESS_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const WATCHES_SUB_SLUG_SET = new Set<string>(WATCHES_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const PETS_SUB_SLUG_SET = new Set<string>(PETS_FOOD_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const AUTOMOBILE_SUB_SLUG_SET = new Set<string>(AUTOMOBILE_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const OUTDOOR_SUB_SLUG_SET = new Set<string>(OUTDOOR_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const ELECTRONICS_SUB_SLUG_SET = new Set<string>(ELECTRONICS_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const HOME_KITCHEN_SUB_SLUG_SET = new Set<string>(HOME_KITCHEN_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));
const TOOLS_SUB_SLUG_SET = new Set<string>(TOOLS_SUBCATEGORIES.map((s) => s.slug.toLowerCase()));

const PARENT_SUB_SLUG_MAP: Record<string, Set<string>> = {
  bag: BAG_SUB_SLUG_SET,
  shoes: SHOES_SUB_SLUG_SET,
  jewelry: JEWELRY_SUB_SLUG_SET,
  "beauty-care": BEAUTY_SUB_SLUG_SET,
  "mens-clothing": MENS_CLOTHING_SUB_SLUG_SET,
  "womens-clothing": WOMENS_CLOTHING_SUB_SLUG_SET,
  "baby-items": BABY_SUB_SLUG_SET,
  eyewear: SUNGLASS_SUB_SLUG_SET,
  "phone-accessories": PHONE_SUB_SLUG_SET,
  "sports-fitness": FITNESS_SUB_SLUG_SET,
  watches: WATCHES_SUB_SLUG_SET,
  "pets-food": PETS_SUB_SLUG_SET,
  "automobile-items": AUTOMOBILE_SUB_SLUG_SET,
  "outdoor-travelling": OUTDOOR_SUB_SLUG_SET,
  "electronics-gadgets": ELECTRONICS_SUB_SLUG_SET,
  "home-and-kitchen": HOME_KITCHEN_SUB_SLUG_SET,
  "tools-home-improvement": TOOLS_SUB_SLUG_SET,
};

// Dictionary to map Chinese and variant categories to English slugs
const categoryMap: Record<string, string> = {
  // 1. Shoes & 16 Sub-Categories
  "shoes": "shoes",
  "shoe": "shoes",
  "all shoes": "shoes",
  "footwear": "shoes",
  "防砸防刺穿鞋": "shoes",
  "👟 shoes": "shoes",

  "men shoes": "men-shoes",
  "men-shoes": "men-shoes",
  "mens shoes": "men-shoes",
  "men's shoes": "men-shoes",
  "mens-shoes": "men-shoes",
  "男鞋": "men-shoes",
  "男式板鞋": "men-shoes",
  "男式休闲单鞋": "men-shoes",
  "男式单鞋": "men-shoes",

  "men boots": "men-boots",
  "men-boots": "men-boots",
  "mens boots": "men-boots",
  "men's boots": "men-boots",
  "男靴": "men-boots",
  "马丁靴男": "men-boots",
  "工装靴": "men-boots",

  "ladies shoes": "ladies-shoes",
  "ladies-shoes": "ladies-shoes",
  "women shoes": "ladies-shoes",
  "womens shoes": "ladies-shoes",
  "women's shoes": "ladies-shoes",
  "womens-shoes": "ladies-shoes",
  "女鞋": "ladies-shoes",
  "女式板鞋": "ladies-shoes",
  "女式休闲单鞋": "ladies-shoes",
  "女式单鞋": "ladies-shoes",

  "ladies boot": "ladies-boot",
  "ladies-boot": "ladies-boot",
  "ladies boots": "ladies-boot",
  "women boots": "ladies-boot",
  "womens boots": "ladies-boot",
  "女靴": "ladies-boot",
  "时装靴": "ladies-boot",
  "短靴女": "ladies-boot",
  "长靴": "ladies-boot",

  "high heels": "high-heels",
  "high-heels": "high-heels",
  "high heel": "high-heels",
  "heels": "high-heels",
  "pumps": "high-heels",
  "高跟鞋": "high-heels",
  "细跟鞋": "high-heels",

  "formal shoes": "formal-shoes",
  "formal-shoes": "formal-shoes",
  "dress shoes": "formal-shoes",
  "oxford shoes": "formal-shoes",
  "business shoes": "formal-shoes",
  "正装鞋": "formal-shoes",
  "商务皮鞋": "formal-shoes",
  "皮鞋": "formal-shoes",

  "sandals": "sandals",
  "sandal": "sandals",
  "凉鞋": "sandals",
  "坡跟凉鞋": "sandals",
  "沙滩鞋": "sandals",

  "running shoes": "running-shoes",
  "running-shoes": "running-shoes",
  "jogging shoes": "running-shoes",
  "跑步鞋": "running-shoes",
  "气垫鞋": "running-shoes",
  "慢跑鞋": "running-shoes",

  "casual shoes": "casual-shoes",
  "casual-shoes": "casual-shoes",
  "walking shoes": "casual-shoes",
  "休闲鞋": "casual-shoes",
  "板鞋": "casual-shoes",
  "帆布鞋": "casual-shoes",

  "loafers": "loafers",
  "loafer": "loafers",
  "slip-on shoes": "loafers",
  "moccasins": "loafers",
  "豆豆鞋": "loafers",
  "乐福鞋": "loafers",
  "一脚蹬": "loafers",

  "sports shoes": "sports-shoes",
  "sports-shoes": "sports-shoes",
  "sport shoes": "sports-shoes",
  "athletic shoes": "sports-shoes",
  "sneakers": "sports-shoes",
  "男式运动单鞋": "sports-shoes",
  "运动鞋": "sports-shoes",
  "篮球鞋": "sports-shoes",

  "baby shoes": "baby-shoes",
  "baby-shoes": "baby-shoes",
  "kids shoes": "baby-shoes",
  "toddler shoes": "baby-shoes",
  "infant shoes": "baby-shoes",
  "童鞋": "baby-shoes",
  "学步鞋": "baby-shoes",
  "婴儿鞋": "baby-shoes",

  "low top shoes": "low-top-shoes",
  "low-top-shoes": "low-top-shoes",
  "low top": "low-top-shoes",
  "low-top": "low-top-shoes",
  "低帮鞋": "low-top-shoes",
  "浅口鞋": "low-top-shoes",

  "rain boots": "rain-boots",
  "rain-boots": "rain-boots",
  "rain boot": "rain-boots",
  "waterproof boots": "rain-boots",
  "galoshes": "rain-boots",
  "雨鞋": "rain-boots",
  "雨靴": "rain-boots",
  "水鞋": "rain-boots",

  "football shoes": "football-shoes",
  "football-shoes": "football-shoes",
  "soccer shoes": "football-shoes",
  "football boots": "football-shoes",
  "cleats": "football-shoes",
  "足球鞋": "football-shoes",

  "slippers": "slippers",
  "slipper": "slippers",
  "slides": "slippers",
  "flip flops": "slippers",
  "拖鞋": "slippers",
  "厚底拖鞋": "slippers",
  "凉拖": "slippers",
  "居家拖鞋": "slippers",

  // 2. Main Category: Bag & 13 Sub-Categories
  "bag": "bag",
  "main bag": "bag",
  "all bags": "bag",
  "bag & luggage": "bag",
  "bags & luggage": "bag",
  "箱包": "bag",

  // 2.1 Purse
  "purse": "purse",
  "purses": "purse",
  "clutch": "purse",
  "coin purse": "purse",
  "零钱包": "purse",
  "手拿包": "purse",
  "晚宴包": "purse",
  "👛 purse": "purse",

  // 2.2 Bags / Ladies Bag / Crossbody / Handbag / School / Canvas / Beach / Messenger / Bum Bag
  "bags": "ladies-bag",
  "ladies bag": "ladies-bag",
  "ladies-bag": "ladies-bag",
  "ladies bags": "ladies-bag",
  "women bag": "ladies-bag",
  "womens bag": "ladies-bag",
  "shoulder bag": "ladies-bag",
  "tote bag": "ladies-bag",
  "女士单肩包": "ladies-bag",
  "托特包": "ladies-bag",
  "水桶包": "ladies-bag",
  "腋下包": "ladies-bag",
  "👜 bags": "ladies-bag",

  "crossbody bags": "crossbody-bags",
  "crossbody-bags": "crossbody-bags",
  "crossbody bag": "crossbody-bags",
  "女士斜挎包": "crossbody-bags",
  "斜挎包": "crossbody-bags",

  "handbag": "handbag",
  "handbags": "handbag",
  "hand bag": "handbag",
  "hand-bag": "handbag",
  "手提包": "handbag",

  "laptop bags": "laptop-bags",
  "laptop-bags": "laptop-bags",
  "laptop bag": "laptop-bags",
  "laptop-bag": "laptop-bags",
  "电脑包": "laptop-bags",
  "笔记本包": "laptop-bags",
  "内胆包": "laptop-bags",

  "school bags": "school-bags",
  "school-bags": "school-bags",
  "school bag": "school-bags",
  "书包": "school-bags",

  "canvas bag": "canvas-bag",
  "canvas-bag": "canvas-bag",
  "canvas bags": "canvas-bag",
  "帆布包": "canvas-bag",

  "beach bag": "beach-bag",
  "beach-bag": "beach-bag",
  "beach bags": "beach-bag",
  "straw bag": "beach-bag",
  "草编包": "beach-bag",
  "沙滩包": "beach-bag",

  "messenger bag": "messenger-bag",
  "messenger-bag": "messenger-bag",
  "messenger bags": "messenger-bag",
  "邮差包": "messenger-bag",
  "公文包": "messenger-bag",

  "bum bag": "bum-bag",
  "bum-bag": "bum-bag",
  "bum bags": "bum-bag",
  "waist bag": "bum-bag",
  "waist-bag": "bum-bag",
  "fanny pack": "bum-bag",
  "腰包": "bum-bag",
  "胸包": "bum-bag",

  // 2.4 Money Clip
  "money clip": "money-clip",
  "money-clip": "money-clip",
  "money clips": "money-clip",
  "cash clip": "money-clip",
  "钞票夹": "money-clip",
  "钱夹": "money-clip",

  // 2.5 Wallet
  "wallet": "wallet",
  "wallets": "wallet",
  "bifold wallet": "wallet",
  "leather wallet": "wallet",
  "card wallet": "wallet",
  "钱包": "wallet",
  "金属卡盒": "wallet",
  "碳纤维卡包": "wallet",
  "rfid卡包": "wallet",
  "皮夹": "wallet",
  "钱袋": "wallet",
  "长款钱包": "wallet",
  "短款钱包": "wallet",

  // 2.6 Backpack
  "backpack": "backpack",
  "backpacks": "backpack",
  "rucksack": "backpack",
  "schoolbag": "backpack",
  "双肩包": "backpack",
  "背包": "backpack",
  "休闲背包": "backpack",
  "女士双肩包": "backpack",
  "男士双肩包": "backpack",

  // 2.7 Travel Bag
  "travel bag": "travel-bag",
  "travel-bag": "travel-bag",
  "travel bags": "travel-bag",
  "duffle bag": "travel-bag",
  "duffel bag": "travel-bag",
  "luggage bag": "travel-bag",
  "旅行包": "travel-bag",
  "旅行袋": "travel-bag",
  "旅行包、旅行袋": "travel-bag",
  "行李袋": "travel-bag",

  // 2.8 Card Holder & Money Clip (Mapped under Wallet sub-category)
  "card holder": "wallet",
  "card-holder": "wallet",
  "card holders": "wallet",
  "card case": "wallet",
  "credit card holder": "wallet",
  "卡包": "wallet",
  "卡盒": "wallet",
  "卡夹": "wallet",
  "名片夹": "wallet",
  "证件包": "wallet",
  "护照包": "wallet",

  // 2.9 Laptop Bag
  "laptop case": "laptop-bag",
  "laptop sleeve": "laptop-bag",
  "computer bag": "laptop-bag",

  // 2.10 Suitcase
  "suitcase": "suitcase",
  "suitcases": "suitcase",
  "trolley case": "suitcase",
  "trolley bag": "suitcase",
  "luggage": "suitcase",
  "拉杆箱": "suitcase",
  "行李箱": "suitcase",
  "登机箱": "suitcase",
  "密码箱": "suitcase",
  "旅行箱": "suitcase",

  // 2.11 Waist Bag
  "waist bags": "waist-bag",
  "belt bag": "waist-bag",
  "chest bag": "waist-bag",
  "sling bag": "waist-bag",
  "运动腰包": "waist-bag",

  // 2.12 Hand Bag
  "hand bags": "hand-bag",
  "top handle bag": "hand-bag",
  "女士手提包": "hand-bag",

  // 2.13 Gift Box
  "gift box": "gift-box",
  "gift-box": "gift-box",
  "gift boxes": "gift-box",
  "gift bag": "gift-box",
  "packaging box": "gift-box",
  "礼盒": "gift-box",
  "礼品盒": "gift-box",
  "包装盒": "gift-box",
  "礼品袋": "gift-box",

  // 3. Jewelry & 15 Sub-Categories
  "jewelry": "jewelry",
  "jewellery": "jewelry",
  "all jewelry": "jewelry",
  "首饰套装": "jewelry",
  "💍 jewelry": "jewelry",

  "men bracelets": "men-bracelets",
  "men-bracelets": "men-bracelets",
  "mens bracelets": "men-bracelets",
  "men's bracelets": "men-bracelets",
  "men bracelet": "men-bracelets",
  "男士手链": "men-bracelets",
  "男士手镯": "men-bracelets",

  "earrings": "earrings",
  "earring": "earrings",
  "ear studs": "earrings",
  "ear drops": "earrings",
  "耳环": "earrings",
  "耳钉": "earrings",
  "耳坠": "earrings",
  "耳饰": "earrings",

  "jewelry cases": "jewelry-cases",
  "jewelry-cases": "jewelry-cases",
  "jewelry case": "jewelry-cases",
  "jewelry organizer": "jewelry-cases",
  "首饰包": "jewelry-cases",
  "首饰收纳": "jewelry-cases",

  "necklace": "necklace",
  "necklaces": "necklace",
  "choker": "necklace",
  "chain necklace": "necklace",
  "项链": "necklace",
  "锁骨链": "necklace",
  "颈链": "necklace",

  "bridal jewelry": "bridal-jewelry",
  "bridal-jewelry": "bridal-jewelry",
  "wedding jewelry": "bridal-jewelry",
  "bridal set": "bridal-jewelry",
  "新娘首饰": "bridal-jewelry",
  "婚庆首饰": "bridal-jewelry",

  "crown": "crown",
  "crowns": "crown",
  "皇冠": "crown",
  "王冠": "crown",

  "pendant": "pendant",
  "pendants": "pendant",
  "locket": "pendant",
  "吊坠": "pendant",
  "挂件": "pendant",
  "项坠": "pendant",

  "bangle": "bangle",
  "bangles": "bangle",
  "bracelet": "bangle",
  "bracelets": "bangle",
  "cuff bracelet": "bangle",
  "手镯": "bangle",
  "手链": "bangle",
  "手串": "bangle",

  "ring": "ring",
  "rings": "ring",
  "finger ring": "ring",
  "戒指": "ring",
  "指环": "ring",
  "戒子": "ring",

  "anklet": "anklet",
  "anklets": "anklet",
  "ankle bracelet": "anklet",
  "脚链": "anklet",

  "tiara": "tiara",
  "tiaras": "tiara",
  "hair crown": "tiara",
  "发冠": "tiara",
  "头冠": "tiara",

  "belly chain": "belly-chain",
  "belly-chain": "belly-chain",
  "waist chain": "belly-chain",
  "body chain": "belly-chain",
  "腰链": "belly-chain",
  "身体链": "belly-chain",
  "肚脐链": "belly-chain",

  "jewelry box": "jewelry-box",
  "jewelry-box": "jewelry-box",
  "jewelry boxes": "jewelry-box",
  "ring box": "jewelry-box",
  "首饰盒": "jewelry-box",
  "珠宝盒": "jewelry-box",
  "戒指盒": "jewelry-box",

  "pin brooch": "pin-brooch",
  "pin-brooch": "pin-brooch",
  "brooch": "pin-brooch",
  "brooches": "pin-brooch",
  "lapel pin": "pin-brooch",
  "胸针": "pin-brooch",
  "别针": "pin-brooch",
  "徽章": "pin-brooch",

  "fashion jewelry": "fashion-jewelry",
  "fashion-jewelry": "fashion-jewelry",
  "costume jewelry": "fashion-jewelry",
  "时尚首饰": "fashion-jewelry",
  "饰品": "fashion-jewelry",

  // 4. Beauty Products & 23 Sub-Categories
  "beauty": "beauty-care",
  "beauty products": "beauty-care",
  "beauty-products": "beauty-care",
  "beauty care": "beauty-care",
  "beauty-care": "beauty-care",
  "beauty & health": "beauty-care",
  "beauty & cosmetics": "beauty-care",
  "cosmetics": "beauty-care",
  "skincare": "beauty-care",
  "复合功能型保健产品": "beauty-care",
  "其他美妆工具": "beauty-care",
  "电子美容仪": "beauty-care",
  "其他膳食补充食品": "beauty-care",
  "身体护理工具": "beauty-care",
  "蛋白粉/氨基酸/胶原蛋白": "beauty-care",
  "维生素/矿物质（食品）": "beauty-care",
  "软糖": "beauty-care",
  "粉底液/膏": "beauty-care",
  "💄 beauty care": "beauty-care",
  "💄 beauty products": "beauty-care",

  "eyeshadow": "eyeshadow",
  "eye shadow": "eyeshadow",
  "眼影": "eyeshadow",
  "眼影盘": "eyeshadow",

  "eyeliner": "eyeliner",
  "eye liner": "eyeliner",
  "眼线笔": "eyeliner",
  "眼线液": "eyeliner",
  "眼线": "eyeliner",

  "face powder": "face-powder",
  "face-powder": "face-powder",
  "setting powder": "face-powder",
  "pressed powder": "face-powder",
  "loose powder": "face-powder",
  "散粉": "face-powder",
  "粉饼": "face-powder",
  "定妆粉": "face-powder",

  "makeup remover": "makeup-remover",
  "makeup-remover": "makeup-remover",
  "cleansing water": "makeup-remover",
  "cleansing oil": "makeup-remover",
  "卸妆水": "makeup-remover",
  "卸妆油": "makeup-remover",
  "卸妆巾": "makeup-remover",
  "卸妆": "makeup-remover",

  "eye brushes": "eye-brushes",
  "eye-brushes": "eye-brushes",
  "eye brush": "eye-brushes",
  "makeup brush": "eye-brushes",
  "makeup brushes": "eye-brushes",
  "眼影刷": "eye-brushes",
  "化妆刷": "eye-brushes",

  "hair removal": "hair-removal",
  "hair-removal": "hair-removal",
  "epilator": "hair-removal",
  "waxing": "hair-removal",
  "脱毛膏": "hair-removal",
  "脱毛仪": "hair-removal",
  "脱毛": "hair-removal",

  "mirror": "mirror",
  "mirrors": "mirror",
  "makeup mirror": "mirror",
  "vanity mirror": "mirror",
  "化妆镜": "mirror",
  "随身镜": "mirror",
  "镜子": "mirror",

  "teeth whitening": "teeth-whitening",
  "teeth-whitening": "teeth-whitening",
  "tooth whitening": "teeth-whitening",
  "whitening strips": "teeth-whitening",
  "美牙": "teeth-whitening",
  "牙贴": "teeth-whitening",
  "牙齿美白": "teeth-whitening",

  "nail polish": "nail-polish",
  "nail-polish": "nail-polish",
  "nail gel": "nail-polish",
  "nail art": "nail-polish",
  "指甲油": "nail-polish",
  "甲油胶": "nail-polish",
  "美甲": "nail-polish",

  "lip gloss": "lip-gloss",
  "lip-gloss": "lip-gloss",
  "lipgloss": "lip-gloss",
  "唇彩": "lip-gloss",
  "唇釉": "lip-gloss",
  "唇蜜": "lip-gloss",

  "lip liner": "lip-liner",
  "lip-liner": "lip-liner",
  "lipliner": "lip-liner",
  "唇线笔": "lip-liner",
  "唇线": "lip-liner",

  "lipstick": "lipstick",
  "lipsticks": "lipstick",
  "口红": "lipstick",
  "唇膏": "lipstick",

  "anti hair loss": "anti-hair-loss",
  "anti-hair-loss": "anti-hair-loss",
  "hair growth": "anti-hair-loss",
  "防脱发": "anti-hair-loss",
  "生发液": "anti-hair-loss",
  "育发": "anti-hair-loss",

  "hairspray": "hairspray",
  "hair spray": "hairspray",
  "hair-spray": "hairspray",
  "定型喷雾": "hairspray",
  "发胶": "hairspray",

  "hair dryers": "hair-dryers",
  "hair-dryers": "hair-dryers",
  "hair dryer": "hair-dryers",
  "blow dryer": "hair-dryers",
  "吹风机": "hair-dryers",
  "电吹风": "hair-dryers",

  "hair dye": "hair-dye",
  "hair-dye": "hair-dye",
  "hair color": "hair-dye",
  "染发剂": "hair-dye",
  "染发膏": "hair-dye",
  "染发": "hair-dye",

  "hair oil": "hair-oil",
  "hair-oil": "hair-oil",
  "essential hair oil": "hair-oil",
  "护发精油": "hair-oil",
  "发油": "hair-oil",

  "shower gel": "shower-gel",
  "shower-gel": "shower-gel",
  "body wash": "shower-gel",
  "沐浴液、沐浴露": "shower-gel",
  "沐浴露": "shower-gel",
  "沐浴乳": "shower-gel",

  "candles": "candles",
  "candle": "candles",
  "scented candle": "candles",
  "aromatherapy candle": "candles",
  "香薰蜡烛": "candles",
  "蜡烛": "candles",

  "lotion": "lotion",
  "lotions": "lotion",
  "body lotion": "lotion",
  "moisturizing lotion": "lotion",
  "身体乳": "lotion",
  "润肤乳": "lotion",
  "乳液": "lotion",

  "perfume set": "perfume-set",
  "perfume-set": "perfume-set",
  "fragrance set": "perfume-set",
  "香水礼盒": "perfume-set",
  "香水套装": "perfume-set",

  "perfume": "perfume",
  "perfumes": "perfume",
  "fragrance": "perfume",
  "cologne": "perfume",
  "香水": "perfume",

  "deodorant": "deodorant",
  "deodorants": "deodorant",
  "antiperspirant": "deodorant",
  "止汗露": "deodorant",
  "走珠": "deodorant",
  "除臭剂": "deodorant",

  // 5. Mens Clothing & 16 Sub-Categories
  "men’s clothing": "mens-clothing",
  "men's clothing": "mens-clothing",
  "mens clothing": "mens-clothing",
  "mens-clothing": "mens-clothing",
  "男装": "mens-clothing",
  "男式t恤": "mens-clothing",
  "👔 men’s clothing": "mens-clothing",
  "👔 men's clothing": "mens-clothing",

  "mens jeans pant": "mens-jeans-pant",
  "mens-jeans-pant": "mens-jeans-pant",
  "men jeans": "mens-jeans-pant",
  "mens jeans": "mens-jeans-pant",
  "men's jeans": "mens-jeans-pant",
  "男士牛仔裤": "mens-jeans-pant",
  "男式牛仔裤": "mens-jeans-pant",

  "men suit": "men-suit",
  "men-suit": "men-suit",
  "mens suit": "men-suit",
  "men's suit": "men-suit",
  "男士西服": "men-suit",
  "男士西装": "men-suit",
  "西服套装": "men-suit",

  "leather jackets for men": "leather-jackets-for-men",
  "leather-jackets-for-men": "leather-jackets-for-men",
  "men leather jacket": "leather-jackets-for-men",
  "mens leather jacket": "leather-jackets-for-men",
  "男士皮衣": "leather-jackets-for-men",
  "男式皮夹克": "leather-jackets-for-men",

  "trouser": "trouser",
  "trousers": "trouser",
  "men trousers": "trouser",
  "mens trousers": "trouser",
  "casual pants": "trouser",
  "男士休闲裤": "trouser",
  "男裤": "trouser",
  "西裤": "trouser",

  "shirts": "shirts",
  "shirt": "shirts",
  "men shirt": "shirts",
  "mens shirt": "shirts",
  "dress shirt": "shirts",
  "男式衬衫": "shirts",
  "衬衫": "shirts",

  "shorts": "shorts",
  "short": "shorts",
  "men shorts": "shorts",
  "mens shorts": "shorts",
  "沙滩裤": "shorts",
  "短裤": "shorts",
  "五分裤": "shorts",

  "tie clips": "tie-clips",
  "tie-clips": "tie-clips",
  "tie clip": "tie-clips",
  "tie bar": "tie-clips",
  "领带夹": "tie-clips",

  "mens sweater": "mens-sweater",
  "mens-sweater": "mens-sweater",
  "men sweater": "mens-sweater",
  "men's sweater": "mens-sweater",
  "男士毛衣": "mens-sweater",
  "男式针织衫": "mens-sweater",

  "boxers": "boxers",
  "boxer": "boxers",
  "men underwear": "boxers",
  "mens boxers": "boxers",
  "男士内裤": "boxers",
  "平角裤": "boxers",

  "mens hat": "mens-hat",
  "mens-hat": "mens-hat",
  "men hat": "mens-hat",
  "baseball cap": "mens-hat",
  "男士帽子": "mens-hat",
  "棒球帽": "mens-hat",
  "鸭舌帽": "mens-hat",

  "leather gloves": "leather-gloves",
  "leather-gloves": "leather-gloves",
  "leather glove": "leather-gloves",
  "皮手套": "leather-gloves",
  "真皮手套": "leather-gloves",

  "men sweatpants": "men-sweatpants",
  "men-sweatpants": "men-sweatpants",
  "mens sweatpants": "men-sweatpants",
  "joggers": "men-sweatpants",
  "sweatpants": "men-sweatpants",
  "卫裤": "men-sweatpants",
  "运动裤": "men-sweatpants",
  "束脚裤": "men-sweatpants",

  "socks": "socks",
  "sock": "socks",
  "men socks": "socks",
  "mens socks": "socks",
  "男袜": "socks",
  "袜子": "socks",

  "bow ties": "bow-ties",
  "bow-ties": "bow-ties",
  "bow tie": "bow-ties",
  "bowtie": "bow-ties",
  "领结": "bow-ties",

  "tie": "tie",
  "ties": "tie",
  "necktie": "tie",
  "领带": "tie",

  "gloves": "gloves",
  "glove": "gloves",
  "winter gloves": "gloves",
  "手套": "gloves",

  // 6. Womens Clothing & 17 Sub-Categories
  "women's clothing": "womens-clothing",
  "womens clothing": "womens-clothing",
  "womens-clothing": "womens-clothing",
  "clothing": "womens-clothing",
  "女装": "womens-clothing",
  "女式t恤": "womens-clothing",
  "女式针织衫": "womens-clothing",
  "连衣裙": "womens-clothing",
  "👗 women's clothing": "womens-clothing",
  "👗 womens clothing": "womens-clothing",

  "hodies & sweatshirrts": "hodies-sweatshirrts",
  "hodies-sweatshirrts": "hodies-sweatshirrts",
  "hoodies & sweatshirts": "hodies-sweatshirrts",
  "hoodies-sweatshirts": "hodies-sweatshirrts",
  "hoodie": "hodies-sweatshirrts",
  "hoodies": "hodies-sweatshirrts",
  "sweatshirt": "hodies-sweatshirrts",
  "sweatshirts": "hodies-sweatshirrts",
  "卫衣": "hodies-sweatshirrts",
  "连帽衫": "hodies-sweatshirrts",

  "womens suits blazers": "womens-suits-blazers",
  "womens-suits-blazers": "womens-suits-blazers",
  "women blazer": "womens-suits-blazers",
  "womens blazer": "womens-suits-blazers",
  "blazer": "womens-suits-blazers",
  "blazers": "womens-suits-blazers",
  "女士西装": "womens-suits-blazers",
  "小西装": "womens-suits-blazers",

  "bodysuits": "bodysuits",
  "bodysuit": "bodysuits",
  "shapewear": "bodysuits",
  "塑身衣": "bodysuits",
  "连体塑身衣": "bodysuits",

  "coats jackets": "coats-jackets",
  "coats-jackets": "coats-jackets",
  "coat": "coats-jackets",
  "coats": "coats-jackets",
  "women jacket": "coats-jackets",
  "womens coat": "coats-jackets",
  "风衣": "coats-jackets",
  "大衣": "coats-jackets",
  "女式外套": "coats-jackets",

  "swimwear": "swimwear",
  "swimsuit": "swimwear",
  "bathing suit": "swimwear",
  "泳衣": "swimwear",
  "泳装": "swimwear",

  "bikini set": "bikini-set",
  "bikini-set": "bikini-set",
  "bikini": "bikini-set",
  "bikinis": "bikini-set",
  "比基尼": "bikini-set",

  "skirt": "skirt",
  "skirts": "skirt",
  "mini skirt": "skirt",
  "pleated skirt": "skirt",
  "半身裙": "skirt",
  "短裙": "skirt",
  "百褶裙": "skirt",

  "womens jeans": "womens-jeans",
  "womens-jeans": "womens-jeans",
  "women jeans": "womens-jeans",
  "women's jeans": "womens-jeans",
  "女士牛仔裤": "womens-jeans",
  "女式牛仔裤": "womens-jeans",

  "wedding dresses": "wedding-dresses",
  "wedding-dresses": "wedding-dresses",
  "wedding dress": "wedding-dresses",
  "bridal gown": "wedding-dresses",
  "婚纱": "wedding-dresses",

  "prom dresses": "prom-dresses",
  "prom-dresses": "prom-dresses",
  "prom dress": "prom-dresses",
  "party dress": "prom-dresses",
  "礼服裙": "prom-dresses",
  "宴会裙": "prom-dresses",

  "evening dresses": "evening-dresses",
  "evening-dresses": "evening-dresses",
  "evening dress": "evening-dresses",
  "evening gown": "evening-dresses",
  "晚礼服": "evening-dresses",

  "cosplay costumes": "cosplay-costumes",
  "cosplay-costumes": "cosplay-costumes",
  "cosplay": "cosplay-costumes",
  "costume": "cosplay-costumes",
  "角色扮演服": "cosplay-costumes",
  "演出服": "cosplay-costumes",

  "bra": "bra",
  "bras": "bra",
  "sports bra": "bra",
  "lingerie": "bra",
  "文胸": "bra",
  "胸罩": "bra",
  "内衣": "bra",
  "抹胸": "bra",

  "panties": "panties",
  "panty": "panties",
  "women underwear": "panties",
  "女士内裤": "panties",
  "三角裤": "panties",

  "women socks": "women-socks",
  "women-socks": "women-socks",
  "womens socks": "women-socks",
  "stockings": "women-socks",
  "运动、休闲棉袜": "women-socks",
  "女袜": "women-socks",
  "丝袜": "women-socks",

  "bucket hats": "bucket-hats",
  "bucket-hats": "bucket-hats",
  "bucket hat": "bucket-hats",
  "sun hat": "bucket-hats",
  "成人帽": "bucket-hats",
  "渔夫帽": "bucket-hats",
  "遮阳帽": "bucket-hats",

  "belts": "belts",
  "belt": "belts",
  "waist belt": "belts",
  "leather belt": "belts",
  "腰带": "belts",
  "皮带": "belts",

  // 7. Baby Items & 14 Sub-Categories
  "baby items": "baby-items",
  "baby-items": "baby-items",
  "baby dress": "baby-dress",
  "baby-dress": "baby-dress",
  "baby & kids": "baby-items",
  "toys": "baby-items",
  "连身衣、爬服": "baby-dress",
  "童t恤": "baby-dress",
  "娃衣": "baby-dress",
  "喂养餐具": "baby-bottle",
  "童连衣裙": "baby-dress",
  "👶 baby items": "baby-items",
  "奶瓶": "baby-bottle",
  "纸尿裤": "diapers",
  "尿不湿": "diapers",

  // 8. Sunglass / Eyewear & 30 Sub-Categories
  "eyewear": "eyewear",
  "sunglass": "eyewear",
  "wholesale eyewear": "eyewear",
  "glasses": "eyewear",
  "sunglasses": "sunglasses",
  "眼镜": "eyewear",
  "太阳镜": "sunglasses",
  "墨镜": "sunglasses",
  "👓 eyewear": "eyewear",
  "👓 sunglass": "eyewear",

  // 9. Office & School Supplies
  "office & school supplies": "office-school-supplies",
  "office-school-supplies": "office-school-supplies",
  "office supplies": "office-school-supplies",
  "school supplies": "office-school-supplies",
  "📚 office & school supplies": "office-school-supplies",

  // 10. Phone Accessories & 30 Sub-Categories
  "phone accessories": "phone-accessories",
  "phone-accessories": "phone-accessories",
  "computer accessories": "phone-accessories",
  "手机壳": "phone-cases",
  "充电器": "chargers",
  "数据线": "charging-cables",
  "充电宝": "power-banks",
  "手机膜": "screen-protectors",
  "钢化膜": "screen-protectors",
  "🔌 phone accessories": "phone-accessories",

  // 11. Fitness / Sports & Fitness & 8 Sub-Categories
  "sports & fitness": "sports-fitness",
  "sports-fitness": "sports-fitness",
  "gym": "sports-fitness",
  "fitness": "sports-fitness",
  "badminton": "sports-fitness",
  "羽毛球": "sports-fitness",
  "鸭毛球": "sports-fitness",
  "乒乓球": "sports-fitness",
  "运动户外": "sports-fitness",
  "鱼竿": "fishing-rod",
  "钓鱼竿": "fishing-rod",
  "瑜伽": "yoga",
  "瑜伽垫": "yoga",
  "烧烤架": "grills-bbq-equipment",
  "🏋️‍♂️ sports & fitness": "sports-fitness",
  "🏋️ sports & fitness": "sports-fitness",

  // 12. Entertainment Items
  "entertainment items": "entertainment-items",
  "entertainment-items": "entertainment-items",
  "entertainment": "entertainment-items",
  "gaming": "entertainment-items",
  "games": "entertainment-items",
  "toys & games": "entertainment-items",
  "🎮 entertainment items": "entertainment-items",

  // 13. Watches & 32 Sub-Categories
  "watches": "watches",
  "watch": "watch",
  "手表": "watches",
  "智能手表": "smartwatches",
  "石英表": "quartz-watches",
  "机械表": "automatic-watches",
  "电子表": "digital-watches",
  "⌚ watches": "watches",

  // 14. Automobile Items & 29 Sub-Categories
  "automobile items": "automobile-items",
  "automobile-items": "automobile-items",
  "automotive": "automobile-items",
  "car accessories": "car-accessories",
  "car": "automobile-items",
  "汽车用品": "automobile-items",
  "行车记录仪": "dash-cameras",
  "车载吸尘器": "car-vacuum-cleaners",
  "汽车脚垫": "car-mats",
  "汽车座套": "car-seats",
  "🚗 automobile items": "automobile-items",

  // 15. Pets Food Items & 8 Sub-Categories
  "pets food items": "pets-food",
  "pets-food-items": "pets-food",
  "pets food": "pets-food",
  "pets-food": "pets-food",
  "pet food": "pets-food",
  "pet supplies": "pets-food",
  "宠物食品": "pets-food",
  "猫包": "cat-bag",
  "猫粮": "cat",
  "狗粮": "dog",
  "鱼食": "fish",
  "鸟食": "bird",
  "🐾 pets food": "pets-food",

  // 16. Outdoor & Travelling & 30 Sub-Categories
  "outdoor & travelling": "outdoor-travelling",
  "outdoor and travelling": "outdoor-travelling",
  "outdoor-travelling": "outdoor-travelling",
  "outdoor & travel": "outdoor-travelling",
  "camping": "outdoor-travelling",
  "travel": "outdoor-travelling",
  "户外旅游": "outdoor-travelling",
  "帐篷": "tents",
  "睡袋": "sleeping-bags",
  "登山杖": "hiking-poles",
  "折叠椅": "camping-chairs",
  "保温箱": "cooler-boxes",
  "⛺ outdoor & travelling": "outdoor-travelling",

  // 17. Electronics & Gadgets & 30 Sub-Categories
  "electronics & gadgets": "electronics-gadgets",
  "electronics and gadgets": "electronics-gadgets",
  "electronics-gadgets": "electronics-gadgets",
  "electronics": "electronics-gadgets",
  "gadgets": "electronics-gadgets",
  "动漫/明星小卡": "electronics-gadgets",
  "consumer electronics": "electronics-gadgets",
  "蓝牙音箱": "bluetooth-speakers",
  "无人机": "drones",
  "投影仪": "projectors",
  "U盘": "usb-flash-drives",
  "路由器": "routers",
  "摄像头": "webcams",
  "💻 electronics & gadgets": "electronics-gadgets",

  // 18. Home And Kitchen & 30 Sub-Categories
  "home and kitchen": "home-and-kitchen",
  "home & kitchen": "home-and-kitchen",
  "home-and-kitchen": "home-and-kitchen",
  "厨房置物架": "storage-containers",
  "电动打蛋器": "kitchen-gadgets",
  "衣架": "home-and-kitchen",
  "榨汁机": "juicers",
  "搅拌机": "blenders",
  "咖啡机": "coffee-makers",
  "电水壶": "kettles",
  "吸尘器": "vacuum-cleaners",
  "空气净化器": "air-purifiers",
  "挂钟": "clocks",
  "闹钟": "clocks",
  "垃圾桶": "trash-bins",
  "菜刀": "knife-sets",
  "砧板": "chopping-boards",
  "🍳 home and kitchen": "home-and-kitchen",

  // 19. Tools & Home Improvement & 29 Sub-Categories
  "tools & home improvement": "tools-home-improvement",
  "tools and home improvement": "tools-home-improvement",
  "tools and home imporovement": "tools-home-improvement",
  "tools-home-improvement": "tools-home-improvement",
  "tools & home impr": "tools-home-improvement",
  "tools-home-impr": "tools-home-improvement",
  "tools & equipment": "tools-home-improvement",
  "machinery & parts": "tools-home-improvement",
  "tools": "tools-home-improvement",
  "hardware": "tools-home-improvement",
  "螺丝刀": "screwdrivers",
  "扳手": "wrenches",
  "锤子": "hammers",
  "电钻": "drills",
  "卷尺": "tape-measures",
  "工具箱": "toolboxes",
  "梯子": "ladders",
  "发电机": "generators",
  "🛠️ tools & home improvement": "tools-home-improvement"
};

const slugMemoCache = new Map<string, string>();
const cleanTitleMemoCache = new Map<string, string>();

export function getMappedSlug(productCategory: string): string {
  if (!productCategory) return "imported";
  const cached = slugMemoCache.get(productCategory);
  if (cached) return cached;
  const cat = productCategory.toLowerCase().trim().replace(/['’]/g, "'");
  if (!cat || cat === "auto" || cat === "general" || cat === "uncategorized" || cat === "imported" || cat === "imported & scraped" || cat === "scraped products") {
    slugMemoCache.set(productCategory, "imported");
    return "imported";
  }

  // 1. Direct match in CATEGORIES_LIST
  const directCat = CATEGORIES_LIST.find(
    (c) => c.slug.toLowerCase() === cat || c.name.toLowerCase().replace(/['’]/g, "'") === cat
  );
  if (directCat) {
    slugMemoCache.set(productCategory, directCat.slug);
    return directCat.slug;
  }

  // 2. Direct lookup in categoryMap
  if (categoryMap[cat]) {
    slugMemoCache.set(productCategory, categoryMap[cat]);
    return categoryMap[cat];
  }

  if (cat.includes("scrape") || cat === "wholesale") {
    slugMemoCache.set(productCategory, "imported");
    return "imported";
  }

  // 2.5 Check if the string contains any specific Sub-Category name (longest match first)
  for (const mc of EXPANDABLE_MAIN_CATEGORIES) {
    const subs = [...(mc.subCategories || [])].sort((a, b) => b.name.length - a.name.length);
    for (const sub of subs) {
      const subLower = sub.name.toLowerCase();
      if (subLower.length >= 6 && cat.includes(subLower)) {
        slugMemoCache.set(productCategory, sub.slug);
        return sub.slug;
      }
    }
  }

  // 3. Partial matching in Chinese and English (ordered from most specific sub-categories to general categories)
  let resolved = "";
  if (cat.includes("eyeshadow") || cat.includes("eye shadow") || cat.includes("眼影")) {
    resolved = "eyeshadow";
  } else if (cat.includes("eyeliner") || cat.includes("eye liner") || cat.includes("眼线")) {
    resolved = "eyeliner";
  } else if (cat.includes("face powder") || cat.includes("setting powder") || cat.includes("pressed powder") || cat.includes("散粉") || cat.includes("粉饼") || cat.includes("定妆粉")) {
    resolved = "face-powder";
  } else if (cat.includes("makeup remover") || cat.includes("cleansing water") || cat.includes("卸妆")) {
    resolved = "makeup-remover";
  } else if (cat.includes("eye brush") || cat.includes("makeup brush") || cat.includes("眼影刷") || cat.includes("化妆刷")) {
    resolved = "eye-brushes";
  } else if (cat.includes("hair removal") || cat.includes("epilator") || cat.includes("脱毛")) {
    resolved = "hair-removal";
  } else if (cat.includes("mirror") || cat.includes("化妆镜") || cat.includes("镜子")) {
    resolved = "mirror";
  } else if (cat.includes("teeth whiten") || cat.includes("tooth whiten") || cat.includes("牙贴") || cat.includes("美牙")) {
    resolved = "teeth-whitening";
  } else if (cat.includes("nail polish") || cat.includes("nail gel") || cat.includes("指甲油") || cat.includes("甲油胶") || cat.includes("美甲")) {
    resolved = "nail-polish";
  } else if (cat.includes("lip gloss") || cat.includes("lipgloss") || cat.includes("唇彩") || cat.includes("唇釉") || cat.includes("唇蜜")) {
    resolved = "lip-gloss";
  } else if (cat.includes("lip liner") || cat.includes("lipliner") || cat.includes("唇线")) {
    resolved = "lip-liner";
  } else if (cat.includes("lipstick") || cat.includes("口红") || cat.includes("唇膏")) {
    resolved = "lipstick";
  } else if (cat.includes("anti hair loss") || cat.includes("hair growth") || cat.includes("防脱发") || cat.includes("生发") || cat.includes("育发")) {
    resolved = "anti-hair-loss";
  } else if (cat.includes("hairspray") || cat.includes("hair spray") || cat.includes("定型喷雾") || cat.includes("发胶")) {
    resolved = "hairspray";
  } else if (cat.includes("hair dryer") || cat.includes("blow dryer") || cat.includes("吹风机") || cat.includes("电吹风")) {
    resolved = "hair-dryers";
  } else if (cat.includes("hair dye") || cat.includes("hair color") || cat.includes("染发")) {
    resolved = "hair-dye";
  } else if (cat.includes("hair oil") || cat.includes("护发精油") || cat.includes("发油")) {
    resolved = "hair-oil";
  } else if (cat.includes("shower gel") || cat.includes("body wash") || cat.includes("沐浴")) {
    resolved = "shower-gel";
  } else if (cat.includes("candle") || cat.includes("蜡烛")) {
    resolved = "candles";
  } else if (cat.includes("lotion") || cat.includes("身体乳") || cat.includes("润肤乳") || cat.includes("乳液")) {
    resolved = "lotion";
  } else if (cat.includes("perfume set") || cat.includes("fragrance set") || cat.includes("香水礼盒") || cat.includes("香水套装")) {
    resolved = "perfume-set";
  } else if (cat.includes("perfume") || cat.includes("fragrance") || cat.includes("cologne") || cat.includes("香水")) {
    resolved = "perfume";
  } else if (cat.includes("deodorant") || cat.includes("antiperspirant") || cat.includes("止汗") || cat.includes("除臭")) {
    resolved = "deodorant";
  } else if (
    cat.includes("美妆") ||
    cat.includes("护肤") ||
    cat.includes("粉底") ||
    cat.includes("美容") ||
    cat.includes("保健") ||
    cat.includes("膳食") ||
    cat.includes("蛋白粉") ||
    cat.includes("维生素") ||
    cat.includes("beauty") ||
    cat.includes("cosmetic") ||
    cat.includes("skincare") ||
    cat.includes("makeup") ||
    cat.includes("gauze") ||
    cat.includes("facial mask")
  ) {
    resolved = "beauty-care";
  } else if (
    cat.includes("baby shoe") ||
    cat.includes("baby-shoe") ||
    cat.includes("toddler shoe") ||
    cat.includes("infant shoe") ||
    cat.includes("kids shoe") ||
    cat.includes("童鞋") ||
    cat.includes("学步鞋") ||
    cat.includes("婴儿鞋")
  ) {
    resolved = "baby-shoes";
  } else if (
    cat.includes("baby") ||
    cat.includes("infant") ||
    cat.includes("toddler") ||
    cat.includes("爬服") ||
    cat.includes("包屁") ||
    cat.includes("连身衣") ||
    cat.includes("连体衣") ||
    cat.includes("哈衣") ||
    cat.includes("童装") ||
    cat.includes("童t恤") ||
    cat.includes("童连衣裙") ||
    cat.includes("娃衣") ||
    cat.includes("喂养餐具") ||
    cat.includes("婴儿")
  ) {
    resolved = "baby-items";
  } else if (
    cat.includes("rain boot") ||
    cat.includes("rain-boot") ||
    cat.includes("waterproof boot") ||
    cat.includes("雨鞋") ||
    cat.includes("雨靴") ||
    cat.includes("水鞋")
  ) {
    resolved = "rain-boots";
  } else if (
    cat.includes("football shoe") ||
    cat.includes("football-shoe") ||
    cat.includes("soccer shoe") ||
    cat.includes("football boot") ||
    cat.includes("cleat") ||
    cat.includes("足球鞋")
  ) {
    resolved = "football-shoes";
  } else if (
    cat.includes("high heel") ||
    cat.includes("high-heel") ||
    cat.includes("stiletto") ||
    cat.includes("高跟鞋") ||
    cat.includes("细跟")
  ) {
    resolved = "high-heels";
  } else if (
    cat.includes("ladies boot") ||
    cat.includes("ladies-boot") ||
    cat.includes("women boot") ||
    cat.includes("women's boot") ||
    cat.includes("womens boot") ||
    cat.includes("女靴") ||
    cat.includes("时装靴") ||
    cat.includes("长靴") ||
    cat.includes("短靴女")
  ) {
    resolved = "ladies-boot";
  } else if (
    cat.includes("men boot") ||
    cat.includes("men-boot") ||
    cat.includes("men's boot") ||
    cat.includes("mens boot") ||
    cat.includes("boot") ||
    cat.includes("男靴") ||
    cat.includes("马丁靴") ||
    cat.includes("工装靴")
  ) {
    resolved = "men-boots";
  } else if (
    cat.includes("formal shoe") ||
    cat.includes("formal-shoe") ||
    cat.includes("dress shoe") ||
    cat.includes("oxford") ||
    cat.includes("正装鞋") ||
    cat.includes("商务皮鞋")
  ) {
    resolved = "formal-shoes";
  } else if (
    cat.includes("loafer") ||
    cat.includes("moccasin") ||
    cat.includes("豆豆鞋") ||
    cat.includes("乐福鞋") ||
    cat.includes("一脚蹬")
  ) {
    resolved = "loafers";
  } else if (
    cat.includes("low top") ||
    cat.includes("low-top") ||
    cat.includes("低帮") ||
    cat.includes("浅口鞋")
  ) {
    resolved = "low-top-shoes";
  } else if (
    cat.includes("running shoe") ||
    cat.includes("running-shoe") ||
    cat.includes("jogging shoe") ||
    cat.includes("跑步鞋") ||
    cat.includes("气垫鞋") ||
    cat.includes("慢跑鞋")
  ) {
    resolved = "running-shoes";
  } else if (
    cat.includes("sports shoe") ||
    cat.includes("sports-shoe") ||
    cat.includes("sport shoe") ||
    cat.includes("athletic shoe") ||
    cat.includes("basketball shoe") ||
    cat.includes("运动鞋") ||
    cat.includes("篮球鞋") ||
    cat.includes("男式运动单鞋")
  ) {
    resolved = "sports-shoes";
  } else if (
    cat.includes("sandal") ||
    cat.includes("凉鞋") ||
    cat.includes("沙滩鞋")
  ) {
    resolved = "sandals";
  } else if (
    cat.includes("slipper") ||
    cat.includes("flip flop") ||
    cat.includes("slide") ||
    cat.includes("拖鞋") ||
    cat.includes("凉拖")
  ) {
    resolved = "slippers";
  } else if (
    cat.includes("ladies shoe") ||
    cat.includes("ladies-shoe") ||
    cat.includes("women shoe") ||
    cat.includes("women's shoe") ||
    cat.includes("womens shoe") ||
    cat.includes("女鞋") ||
    cat.includes("女式板鞋") ||
    cat.includes("女式休闲单鞋") ||
    cat.includes("女式单鞋")
  ) {
    resolved = "ladies-shoes";
  } else if (
    cat.includes("men shoe") ||
    cat.includes("men-shoe") ||
    cat.includes("men's shoe") ||
    cat.includes("mens shoe") ||
    cat.includes("男鞋") ||
    cat.includes("男式板鞋") ||
    cat.includes("男式休闲单鞋") ||
    cat.includes("男式单鞋")
  ) {
    resolved = "men-shoes";
  } else if (
    cat.includes("casual shoe") ||
    cat.includes("casual-shoe") ||
    cat.includes("walking shoe") ||
    cat.includes("sneaker") ||
    cat.includes("休闲鞋") ||
    cat.includes("板鞋") ||
    cat.includes("帆布鞋")
  ) {
    resolved = "casual-shoes";
  } else if (
    cat.includes("shoe") ||
    cat.includes("footwear") ||
    cat.includes("单鞋") ||
    cat.includes("防砸")
  ) {
    resolved = "shoes";
  } else if (
    cat.includes("briefcase") ||
    cat.includes("document bag") ||
    cat.includes("公文包") ||
    cat.includes("商务包") ||
    cat.includes("文件包")
  ) {
    resolved = "briefcases";
  } else if (
    cat.includes("money clip") ||
    cat.includes("money-clip") ||
    cat.includes("cash clip") ||
    cat.includes("钞票夹") ||
    cat.includes("钱夹") ||
    cat.includes("美金夹") ||
    cat.includes("card holder") ||
    cat.includes("card-holder") ||
    cat.includes("card case") ||
    cat.includes("credit card") ||
    cat.includes("passport holder") ||
    cat.includes("卡包") ||
    cat.includes("卡盒") ||
    cat.includes("卡夹") ||
    cat.includes("卡片包") ||
    cat.includes("名片夹") ||
    cat.includes("证件包") ||
    cat.includes("护照包")
  ) {
    resolved = "wallet";
  } else if (
    cat.includes("laptop bag") ||
    cat.includes("laptop-bag") ||
    cat.includes("laptop sleeve") ||
    cat.includes("laptop case") ||
    cat.includes("computer bag") ||
    cat.includes("notebook bag") ||
    cat.includes("电脑包") ||
    cat.includes("笔记本包") ||
    cat.includes("内胆包")
  ) {
    resolved = "laptop-bag";
  } else if (
    cat.includes("suitcase") ||
    cat.includes("trolley") ||
    cat.includes("rolling luggage") ||
    cat.includes("spinner") ||
    cat.includes("拉杆箱") ||
    cat.includes("行李箱") ||
    cat.includes("登机箱") ||
    cat.includes("密码箱") ||
    cat.includes("旅行箱")
  ) {
    resolved = "suitcase";
  } else if (
    cat.includes("travel bag") ||
    cat.includes("travel-bag") ||
    cat.includes("duffle") ||
    cat.includes("duffel") ||
    cat.includes("weekender") ||
    cat.includes("旅行包") ||
    cat.includes("旅行袋") ||
    cat.includes("行李袋")
  ) {
    resolved = "travel-bag";
  } else if (
    cat.includes("waist bag") ||
    cat.includes("waist-bag") ||
    cat.includes("fanny pack") ||
    cat.includes("belt bag") ||
    cat.includes("bum bag") ||
    cat.includes("chest bag") ||
    cat.includes("sling bag") ||
    cat.includes("腰包") ||
    cat.includes("胸包")
  ) {
    resolved = "waist-bag";
  } else if (
    cat.includes("backpack") ||
    cat.includes("rucksack") ||
    cat.includes("schoolbag") ||
    cat.includes("bookbag") ||
    cat.includes("双肩包") ||
    cat.includes("背包") ||
    cat.includes("书包")
  ) {
    resolved = "backpack";
  } else if (
    cat.includes("gift box") ||
    cat.includes("gift-box") ||
    cat.includes("gift bag") ||
    cat.includes("packaging box") ||
    cat.includes("礼盒") ||
    cat.includes("礼品盒") ||
    cat.includes("包装盒") ||
    cat.includes("伴手礼") ||
    cat.includes("礼品袋")
  ) {
    resolved = "gift-box";
  } else if (
    cat.includes("wallet") ||
    cat.includes("bifold") ||
    cat.includes("trifold") ||
    cat.includes("钱包") ||
    cat.includes("皮夹") ||
    cat.includes("钱袋")
  ) {
    resolved = "wallet";
  } else if (
    cat.includes("hand bag") ||
    cat.includes("hand-bag") ||
    cat.includes("handbag") ||
    cat.includes("top handle") ||
    cat.includes("satchel") ||
    cat.includes("手提包") ||
    cat.includes("妈妈包") ||
    cat.includes("波士顿包") ||
    cat.includes("凯莉包") ||
    cat.includes("戴妃包")
  ) {
    resolved = "hand-bag";
  } else if (
    cat.includes("purse") ||
    cat.includes("clutch") ||
    cat.includes("coin bag") ||
    cat.includes("零钱包") ||
    cat.includes("手拿包") ||
    cat.includes("晚宴包") ||
    cat.includes("手机包")
  ) {
    resolved = "purse";
  } else if (
    cat.includes("bag") ||
    cat.includes("tote") ||
    cat.includes("crossbody") ||
    cat.includes("shoulder") ||
    cat.includes("单肩包") ||
    cat.includes("斜挎包") ||
    cat.includes("托特包") ||
    cat.includes("女包") ||
    cat.includes("男包") ||
    cat.includes("水桶包") ||
    cat.includes("腋下包")
  ) {
    resolved = "bags";
  } else if (
    cat.includes("men bracelet") ||
    cat.includes("men-bracelet") ||
    cat.includes("mens bracelet") ||
    cat.includes("men's bracelet") ||
    cat.includes("男士手链") ||
    cat.includes("男士手镯")
  ) {
    resolved = "men-bracelets";
  } else if (
    cat.includes("jewelry case") ||
    cat.includes("jewelry-case") ||
    cat.includes("jewelry organizer") ||
    cat.includes("首饰包") ||
    cat.includes("首饰收纳")
  ) {
    resolved = "jewelry-cases";
  } else if (
    cat.includes("jewelry box") ||
    cat.includes("jewelry-box") ||
    cat.includes("ring box") ||
    cat.includes("首饰盒") ||
    cat.includes("珠宝盒") ||
    cat.includes("戒指盒")
  ) {
    resolved = "jewelry-box";
  } else if (
    cat.includes("bridal jewel") ||
    cat.includes("bridal-jewel") ||
    cat.includes("wedding jewel") ||
    cat.includes("新娘首饰") ||
    cat.includes("婚庆首饰")
  ) {
    resolved = "bridal-jewelry";
  } else if (
    cat.includes("belly chain") ||
    cat.includes("belly-chain") ||
    cat.includes("waist chain") ||
    cat.includes("body chain") ||
    cat.includes("腰链") ||
    cat.includes("身体链") ||
    cat.includes("肚脐链")
  ) {
    resolved = "belly-chain";
  } else if (
    cat.includes("pin brooch") ||
    cat.includes("pin-brooch") ||
    cat.includes("brooch") ||
    cat.includes("lapel pin") ||
    cat.includes("胸针") ||
    cat.includes("别针")
  ) {
    resolved = "pin-brooch";
  } else if (
    cat.includes("tiara") ||
    cat.includes("发冠") ||
    cat.includes("头冠")
  ) {
    resolved = "tiara";
  } else if (
    cat.includes("crown") ||
    cat.includes("皇冠") ||
    cat.includes("王冠")
  ) {
    resolved = "crown";
  } else if (
    cat.includes("anklet") ||
    cat.includes("ankle bracelet") ||
    cat.includes("脚链")
  ) {
    resolved = "anklet";
  } else if (
    cat.includes("earring") ||
    cat.includes("ear stud") ||
    cat.includes("耳环") ||
    cat.includes("耳钉") ||
    cat.includes("耳坠") ||
    cat.includes("耳饰")
  ) {
    resolved = "earrings";
  } else if (
    cat.includes("pendant") ||
    cat.includes("locket") ||
    cat.includes("吊坠") ||
    cat.includes("项坠")
  ) {
    resolved = "pendant";
  } else if (
    cat.includes("necklace") ||
    cat.includes("choker") ||
    cat.includes("项链") ||
    cat.includes("锁骨链") ||
    cat.includes("颈链")
  ) {
    resolved = "necklace";
  } else if (
    cat.includes("bangle") ||
    cat.includes("bracelet") ||
    cat.includes("手镯") ||
    cat.includes("手链") ||
    cat.includes("手串")
  ) {
    resolved = "bangle";
  } else if (
    /\bring\b/.test(cat) ||
    /\brings\b/.test(cat) ||
    cat.includes("finger ring") ||
    cat.includes("戒指") ||
    cat.includes("指环") ||
    cat.includes("戒子")
  ) {
    resolved = "ring";
  } else if (
    cat.includes("fashion jewel") ||
    cat.includes("fashion-jewel") ||
    cat.includes("costume jewel") ||
    cat.includes("时尚首饰") ||
    cat.includes("饰品")
  ) {
    resolved = "fashion-jewelry";
  } else if (
    cat.includes("jewel") ||
    cat.includes("首饰") ||
    cat.includes("珠宝")
  ) {
    resolved = "jewelry";
  } else if (
    cat.includes("watch") ||
    cat.includes("timepiece") ||
    cat.includes("chronograph") ||
    cat.includes("手表") ||
    cat.includes("腕表")
  ) {
    resolved = "watches";
  } else if (
    cat.includes("eyewear") ||
    cat.includes("sunglass") ||
    cat.includes("spectacle") ||
    cat.includes("glasses") ||
    cat.includes("optical") ||
    cat.includes("眼镜") ||
    cat.includes("太阳镜") ||
    cat.includes("墨镜")
  ) {
    resolved = "eyewear";
  } else if (
    cat.includes("phone") ||
    cat.includes("charger") ||
    cat.includes("data cable") ||
    cat.includes("power bank") ||
    cat.includes("screen protector") ||
    cat.includes("手机壳") ||
    cat.includes("充电器") ||
    cat.includes("数据线") ||
    cat.includes("保护套")
  ) {
    resolved = "phone-accessories";
  } else if (
    cat.includes("mens jeans") ||
    cat.includes("men's jeans") ||
    cat.includes("men jeans") ||
    cat.includes("男士牛仔裤") ||
    cat.includes("男式牛仔裤")
  ) {
    resolved = "mens-jeans-pant";
  } else if (
    cat.includes("womens jeans") ||
    cat.includes("women's jeans") ||
    cat.includes("women jeans") ||
    cat.includes("女士牛仔裤") ||
    cat.includes("女式牛仔裤")
  ) {
    resolved = "womens-jeans";
  } else if (
    cat.includes("womens suit") ||
    cat.includes("women's suit") ||
    cat.includes("blazer") ||
    cat.includes("女士西装") ||
    cat.includes("小西装")
  ) {
    resolved = "womens-suits-blazers";
  } else if (
    cat.includes("men suit") ||
    cat.includes("mens suit") ||
    cat.includes("men's suit") ||
    cat.includes("男士西服") ||
    cat.includes("男士西装") ||
    cat.includes("西服套装")
  ) {
    resolved = "men-suit";
  } else if (
    cat.includes("leather jacket") ||
    cat.includes("皮衣") ||
    cat.includes("皮夹克")
  ) {
    resolved = "leather-jackets-for-men";
  } else if (
    cat.includes("tie clip") ||
    cat.includes("tie bar") ||
    cat.includes("领带夹")
  ) {
    resolved = "tie-clips";
  } else if (
    cat.includes("bow tie") ||
    cat.includes("bowtie") ||
    cat.includes("领结")
  ) {
    resolved = "bow-ties";
  } else if (
    /\btie\b/.test(cat) ||
    cat.includes("necktie") ||
    cat.includes("领带")
  ) {
    resolved = "tie";
  } else if (
    cat.includes("leather glove") ||
    cat.includes("皮手套") ||
    cat.includes("真皮手套")
  ) {
    resolved = "leather-gloves";
  } else if (
    cat.includes("glove") ||
    cat.includes("手套")
  ) {
    resolved = "gloves";
  } else if (
    cat.includes("sweatpant") ||
    cat.includes("jogger") ||
    cat.includes("卫裤") ||
    cat.includes("束脚裤")
  ) {
    resolved = "men-sweatpants";
  } else if (
    cat.includes("boxer") ||
    cat.includes("男士内裤") ||
    cat.includes("平角裤")
  ) {
    resolved = "boxers";
  } else if (
    cat.includes("mens sweater") ||
    cat.includes("men's sweater") ||
    cat.includes("men sweater") ||
    cat.includes("男士毛衣") ||
    cat.includes("男式针织衫")
  ) {
    resolved = "mens-sweater";
  } else if (
    cat.includes("bucket hat") ||
    cat.includes("渔夫帽") ||
    cat.includes("遮阳帽") ||
    cat.includes("成人帽")
  ) {
    resolved = "bucket-hats";
  } else if (
    cat.includes("mens hat") ||
    cat.includes("men hat") ||
    cat.includes("baseball cap") ||
    cat.includes("棒球帽") ||
    cat.includes("鸭舌帽") ||
    cat.includes("男士帽子")
  ) {
    resolved = "mens-hat";
  } else if (
    cat.includes("women sock") ||
    cat.includes("womens sock") ||
    cat.includes("stocking") ||
    cat.includes("女袜") ||
    cat.includes("丝袜") ||
    cat.includes("运动、休闲棉袜")
  ) {
    resolved = "women-socks";
  } else if (
    cat.includes("sock") ||
    cat.includes("男袜") ||
    cat.includes("袜子")
  ) {
    resolved = "socks";
  } else if (
    cat.includes("trouser") ||
    cat.includes("休闲裤") ||
    cat.includes("西裤")
  ) {
    resolved = "trouser";
  } else if (
    cat.includes("short") ||
    cat.includes("沙滩裤") ||
    cat.includes("短裤") ||
    cat.includes("五分裤")
  ) {
    resolved = "shorts";
  } else if (
    cat.includes("hoodie") ||
    cat.includes("hodie") ||
    cat.includes("sweatshirt") ||
    cat.includes("sweatshirrt") ||
    cat.includes("卫衣") ||
    cat.includes("连帽衫")
  ) {
    resolved = "hodies-sweatshirrts";
  } else if (
    cat.includes("bodysuit") ||
    cat.includes("shapewear") ||
    cat.includes("塑身衣")
  ) {
    resolved = "bodysuits";
  } else if (
    cat.includes("coats jacket") ||
    cat.includes("coat") ||
    cat.includes("风衣") ||
    cat.includes("大衣") ||
    cat.includes("女式外套")
  ) {
    resolved = "coats-jackets";
  } else if (
    cat.includes("bikini") ||
    cat.includes("比基尼")
  ) {
    resolved = "bikini-set";
  } else if (
    cat.includes("swimwear") ||
    cat.includes("swimsuit") ||
    cat.includes("bathing suit") ||
    cat.includes("泳衣") ||
    cat.includes("泳装")
  ) {
    resolved = "swimwear";
  } else if (
    cat.includes("skirt") ||
    cat.includes("半身裙") ||
    cat.includes("百褶裙") ||
    cat.includes("短裙")
  ) {
    resolved = "skirt";
  } else if (
    cat.includes("wedding dress") ||
    cat.includes("bridal gown") ||
    cat.includes("婚纱")
  ) {
    resolved = "wedding-dresses";
  } else if (
    cat.includes("prom dress") ||
    cat.includes("party dress") ||
    cat.includes("礼服裙") ||
    cat.includes("宴会裙")
  ) {
    resolved = "prom-dresses";
  } else if (
    cat.includes("evening dress") ||
    cat.includes("evening gown") ||
    cat.includes("晚礼服")
  ) {
    resolved = "evening-dresses";
  } else if (
    cat.includes("cosplay") ||
    cat.includes("costume") ||
    cat.includes("角色扮演") ||
    cat.includes("演出服")
  ) {
    resolved = "cosplay-costumes";
  } else if (
    /\bbra\b/.test(cat) ||
    /\bbras\b/.test(cat) ||
    cat.includes("lingerie") ||
    cat.includes("文胸") ||
    cat.includes("胸罩") ||
    cat.includes("内衣") ||
    cat.includes("抹胸")
  ) {
    resolved = "bra";
  } else if (
    cat.includes("pantie") ||
    cat.includes("panty") ||
    cat.includes("女士内裤") ||
    cat.includes("三角裤")
  ) {
    resolved = "panties";
  } else if (
    /\bbelt\b/.test(cat) ||
    /\bbelts\b/.test(cat) ||
    cat.includes("waist belt") ||
    cat.includes("皮带") ||
    cat.includes("腰带")
  ) {
    resolved = "belts";
  } else if (
    cat.includes("shirt") ||
    cat.includes("男式衬衫") ||
    cat.includes("衬衫")
  ) {
    resolved = "shirts";
  } else if (
    ((cat.includes("men's") || cat.includes("mens") || /\bmen\b/.test(cat)) &&
      !cat.includes("women") &&
      (cat.includes("cloth") || cat.includes("pant") || cat.includes("jacket") || cat.includes("apparel"))) ||
    cat.includes("男装") ||
    cat.includes("男式t恤")
  ) {
    resolved = "mens-clothing";
  } else if (
    cat.includes("women's clothing") ||
    cat.includes("womens clothing") ||
    cat.includes("womens-clothing") ||
    cat.includes("dress") ||
    cat.includes("blouse") ||
    cat.includes("女装") ||
    cat.includes("连衣裙") ||
    cat.includes("女式t恤") ||
    cat.includes("女式针织衫")
  ) {
    resolved = "womens-clothing";
  } else if (
    cat.includes("office") ||
    cat.includes("school") ||
    cat.includes("stationery") ||
    cat.includes("notebook") ||
    cat.includes("pencil") ||
    cat.includes("文具")
  ) {
    resolved = "office-school-supplies";
  } else if (
    cat.includes("pet ") ||
    cat.includes("pets") ||
    cat.includes("dog food") ||
    cat.includes("cat food") ||
    cat.includes("宠物") ||
    cat.includes("猫粮") ||
    cat.includes("狗粮")
  ) {
    resolved = "pets-food";
  } else if (
    cat.includes("automobile") ||
    cat.includes("automotive") ||
    cat.includes("car ") ||
    cat.includes("vehicle") ||
    cat.includes("汽车")
  ) {
    resolved = "automobile-items";
  } else if (
    cat.includes("outdoor") ||
    cat.includes("travelling") ||
    cat.includes("camping") ||
    cat.includes("hiking") ||
    cat.includes("露营") ||
    cat.includes("户外旅游")
  ) {
    resolved = "outdoor-travelling";
  } else if (
    cat.includes("entertainment") ||
    cat.includes("gaming") ||
    cat.includes("game") ||
    cat.includes("游戏") ||
    cat.includes("盲盒") ||
    cat.includes("动漫") ||
    cat.includes("小卡")
  ) {
    resolved = "entertainment-items";
  } else if (
    cat.includes("羽毛球") ||
    cat.includes("鸭毛球") ||
    cat.includes("乒乓球") ||
    cat.includes("网球") ||
    cat.includes("sport") ||
    cat.includes("fitness") ||
    cat.includes("gym") ||
    cat.includes("badminton") ||
    cat.includes("助力带") ||
    cat.includes("护腕") ||
    cat.includes("健身") ||
    cat.includes("运动")
  ) {
    resolved = "sports-fitness";
  } else if (
    cat.includes("electr") ||
    cat.includes("gadget") ||
    cat.includes("laptop") ||
    cat.includes("headphone") ||
    cat.includes("earphone") ||
    cat.includes("earbud") ||
    cat.includes("bluetooth") ||
    cat.includes("数码") ||
    cat.includes("电子") ||
    cat.includes("耳机") ||
    cat.includes("音箱")
  ) {
    resolved = "electronics-gadgets";
  } else if (
    cat.includes("kitchen") ||
    cat.includes("cookware") ||
    cat.includes("home and kitchen") ||
    cat.includes("home & kitchen") ||
    cat.includes("home-and-kitchen") ||
    cat.includes("厨房") ||
    cat.includes("家居") ||
    cat.includes("置物架") ||
    cat.includes("打蛋器") ||
    cat.includes("衣架") ||
    cat.includes("收纳")
  ) {
    resolved = "home-and-kitchen";
  } else if (
    cat.includes("tool") ||
    cat.includes("wrench") ||
    cat.includes("drill") ||
    cat.includes("screwdriver") ||
    cat.includes("hardware") ||
    cat.includes("machinery") ||
    cat.includes("工具")
  ) {
    resolved = "tools-home-improvement";
  } else {
    resolved = cat.replace(/[^a-z0-9\u0980-\u09ff]+/g, "-").replace(/^-|-$/g, "") || "imported";
  }

  slugMemoCache.set(productCategory, resolved);
  return resolved;
}

/**
 * Resolves any category string (or Chinese category / alias) to the canonical category display name.
 * Preserves custom category names if they don't map to a predefined category.
 */
export function getCanonicalCategoryName(rawCategory?: string | null, fallbackTitle?: string | null): string {
  const trimmed = (rawCategory || "").trim();
  const lower = trimmed.toLowerCase().replace(/['’]/g, "'");
  const isGeneric =
    !trimmed ||
    lower === "auto" ||
    lower === "imported" ||
    lower === "imported & scraped" ||
    lower === "scraped products" ||
    lower === "general" ||
    lower === "uncategorized";

  if (!isGeneric) {
    // Check if it directly matches or maps to one of the predefined store categories / sub-categories
    const slug = getMappedSlug(trimmed);
    const matchedPredefined = CATEGORIES_LIST.find((c) => c.slug === slug);
    if (matchedPredefined) {
      // If the user/scraper explicitly passed a main category AND we have a fallbackTitle that resolves to a specific sub-category, refine to that sub-category
      if (fallbackTitle && fallbackTitle.trim()) {
        const titleSlug = getMappedSlug(fallbackTitle);
        const subSlugSet = PARENT_SUB_SLUG_MAP[matchedPredefined.slug];
        if (subSlugSet && subSlugSet.has(titleSlug)) {
          const matchedSub = (matchedPredefined.subCategories || []).find((s) => s.slug === titleSlug);
          if (matchedSub) return matchedSub.name;
        }
      }
      return matchedPredefined.name;
    }
    // If rawCategory is NOT purely Chinese characters (i.e. it's a custom English/Bengali category name), preserve it
    const hasChineseOnly = /[\u4e00-\u9fa5]/.test(trimmed) && !/[a-zA-Z\u0980-\u09ff]/.test(trimmed);
    if (!hasChineseOnly) {
      return trimmed;
    }
  }

  // If category is generic/empty or unmapped Chinese, classify from fallbackTitle
  if (fallbackTitle && fallbackTitle.trim()) {
    const titleSlug = getMappedSlug(fallbackTitle);
    const matchedFromTitle = CATEGORIES_LIST.find((c) => c.slug === titleSlug);
    if (matchedFromTitle) {
      return matchedFromTitle.name;
    }
  }

  return "Shoes";
}

/**
 * Checks whether a category name or slug is "Bag" or one of its 13 sub-categories
 */
export function isBagMainOrSubCategory(nameOrSlug?: string | null): boolean {
  if (!nameOrSlug) return false;
  const slug = getMappedSlug(nameOrSlug);
  return slug === "bag" || BAG_SUB_SLUG_SET.has(slug);
}

/**
 * Checks whether a category name or slug is "Shoes" or one of its 16 sub-categories
 */
export function isShoesMainOrSubCategory(nameOrSlug?: string | null): boolean {
  if (!nameOrSlug) return false;
  const slug = getMappedSlug(nameOrSlug);
  return slug === "shoes" || SHOES_SUB_SLUG_SET.has(slug);
}

/**
 * Checks whether a category name or slug is "Jewelry" or one of its 15 sub-categories
 */
export function isJewelryMainOrSubCategory(nameOrSlug?: string | null): boolean {
  if (!nameOrSlug) return false;
  const slug = getMappedSlug(nameOrSlug);
  return slug === "jewelry" || JEWELRY_SUB_SLUG_SET.has(slug);
}

/**
 * Checks whether a category name or slug is "Beauty Products" or one of its 23 sub-categories
 */
export function isBeautyMainOrSubCategory(nameOrSlug?: string | null): boolean {
  if (!nameOrSlug) return false;
  const slug = getMappedSlug(nameOrSlug);
  return slug === "beauty-care" || BEAUTY_SUB_SLUG_SET.has(slug);
}

/**
 * Checks whether a category name or slug is "Mens Clothing" or one of its 16 sub-categories
 */
export function isMensClothingMainOrSubCategory(nameOrSlug?: string | null): boolean {
  if (!nameOrSlug) return false;
  const slug = getMappedSlug(nameOrSlug);
  return slug === "mens-clothing" || MENS_CLOTHING_SUB_SLUG_SET.has(slug);
}

/**
 * Checks whether a category name or slug is "Womens Clothing" or one of its 17 sub-categories
 */
export function isWomensClothingMainOrSubCategory(nameOrSlug?: string | null): boolean {
  if (!nameOrSlug) return false;
  const slug = getMappedSlug(nameOrSlug);
  return slug === "womens-clothing" || WOMENS_CLOTHING_SUB_SLUG_SET.has(slug);
}

/**
 * Returns the parent Main Category info if the given category is a main or sub-category of any expandable main category
 */
export function getParentCategoryInfo(nameOrSlug?: string | null): CategoryInfo | null {
  if (!nameOrSlug) return null;
  const slug = getMappedSlug(nameOrSlug);
  for (const mc of EXPANDABLE_MAIN_CATEGORIES) {
    const subSet = PARENT_SUB_SLUG_MAP[mc.slug];
    if (mc.slug === slug || (subSet && subSet.has(slug))) {
      return mc;
    }
  }
  return null;
}

/**
 * Returns the main categories with their populated `subCategories` array
 * (including `Bag` -> 13 sub-categories, plus any custom sub-categories from serverCategories).
 */
export function getMainCategoriesWithSubs(
  serverCategories?: any[] | null,
  products?: any[] | null
): CategoryInfo[] {
  const customSubsByParentSlug = new Map<string, CategoryInfo[]>();

  if (Array.isArray(serverCategories)) {
    for (const sc of serverCategories) {
      if (!sc || !sc.name || !sc.parentCategory) continue;
      const parentSlug = getMappedSlug(sc.parentCategory);
      const canonical = getCanonicalCategoryName(sc.name);
      const subSlug = sc.slug || getMappedSlug(canonical);
      const list = customSubsByParentSlug.get(parentSlug) || [];
      if (!list.some((item) => item.slug === subSlug || item.name.toLowerCase() === canonical.toLowerCase())) {
        list.push({
          id: sc.id || `cat-${subSlug}`,
          name: canonical,
          slug: subSlug,
          iconName: sc.icon || "Tag",
          IconComponent: getCategoryIcon(canonical),
          image: sc.image || getCategoryImage(canonical),
          parentCategory: sc.parentCategory,
          parentSlug,
        });
      }
      customSubsByParentSlug.set(parentSlug, list);
    }
  }

  const result: CategoryInfo[] = MAIN_CATEGORIES_LIST.map((mainCat) => {
    const baseSubs = Array.isArray(mainCat.subCategories) ? [...mainCat.subCategories] : [];
    const extraSubs = customSubsByParentSlug.get(mainCat.slug) || [];
    for (const ex of extraSubs) {
      if (!baseSubs.some((b) => b.slug === ex.slug || b.name.toLowerCase() === ex.name.toLowerCase())) {
        baseSubs.push(ex);
      }
    }
    return {
      ...mainCat,
      subCategories: baseSubs.length > 0 ? baseSubs : undefined,
    };
  });

  const knownMainSlugs = new Set<string>(result.map((c) => c.slug));
  // Any predefined sub-category slug should not be duplicated as a standalone main category
  const allSubSlugs = new Set<string>();
  for (const mc of EXPANDABLE_MAIN_CATEGORIES) {
    for (const sub of mc.subCategories || []) {
      allSubSlugs.add(sub.slug);
    }
  }

  if (Array.isArray(serverCategories)) {
    for (const sc of serverCategories) {
      if (!sc || !sc.name || sc.parentCategory) continue;
      const canonical = getCanonicalCategoryName(sc.name);
      const slug = getMappedSlug(canonical);
      if (slug === "imported" || knownMainSlugs.has(slug) || allSubSlugs.has(slug)) continue;
      knownMainSlugs.add(slug);
      const extraSubs = customSubsByParentSlug.get(slug) || [];
      result.push({
        id: sc.id || `cat-${slug}`,
        name: canonical,
        slug,
        iconName: sc.icon || "Tag",
        IconComponent: getCategoryIcon(canonical),
        image: sc.image || getCategoryImage(canonical),
        subCategories: extraSubs.length > 0 ? extraSubs : undefined,
      });
    }
  }

  if (Array.isArray(products)) {
    for (const p of products) {
      if (!p || !p.category) continue;
      const canonical = getCanonicalCategoryName(p.category, p.name);
      const slug = getMappedSlug(canonical);
      if (slug === "imported" || knownMainSlugs.has(slug) || allSubSlugs.has(slug)) continue;
      // Check if it belongs to a custom sub-category
      let isCustomSub = false;
      for (const subs of customSubsByParentSlug.values()) {
        if (subs.some((s) => s.slug === slug)) {
          isCustomSub = true;
          break;
        }
      }
      if (isCustomSub) continue;
      knownMainSlugs.add(slug);
      result.push({
        id: `cat-${slug}`,
        name: canonical,
        slug,
        iconName: "Tag",
        IconComponent: getCategoryIcon(canonical),
        image: p.image || getCategoryImage(canonical),
      });
    }
  }

  return result;
}

/**
 * Given any selected category (either a Main Category like "Bag" or a Sub-Category like "Wallet" / "Purse"),
 * returns its parent Main Category (with `subCategories`) if it belongs to a multi-subcategory group.
 */
export function getActiveMainCategoryWithSubs(
  selectedCategory?: string | null,
  serverCategories?: any[] | null
): CategoryInfo | null {
  if (!selectedCategory) return null;
  const targetSlug = getMappedSlug(selectedCategory);
  const mainCats = getMainCategoriesWithSubs(serverCategories);

  for (const mc of mainCats) {
    if (!mc.subCategories || mc.subCategories.length === 0) continue;
    if (mc.slug === targetSlug || mc.name.toLowerCase() === selectedCategory.toLowerCase().trim()) {
      return mc;
    }
    if (mc.subCategories.some((sub) => sub.slug === targetSlug || sub.name.toLowerCase() === selectedCategory.toLowerCase().trim())) {
      return mc;
    }
  }
  return null;
}

function decodeSkuHtmlEntities(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

export function syncSkuDetailsWithVariants(skuDetails: any, variants?: any[] | null, variantsEdited?: boolean): any {
  const sourceVariants =
    Array.isArray(variants) && variants.length > 0
      ? variants
      : !variantsEdited && Array.isArray(skuDetails?.variants) && skuDetails.variants.length > 0
      ? skuDetails.variants
      : variants;

  if (!Array.isArray(sourceVariants)) {
    return skuDetails || null;
  }
  if (sourceVariants.length === 0) {
    return null;
  }

  const existingProps = Array.isArray(skuDetails?.properties) ? skuDetails.properties : [];
  const existingPrimaryValues = Array.isArray(existingProps[0]?.values) ? existingProps[0].values : [];
  const existingSecondaryValues = Array.isArray(existingProps[1]?.values) ? existingProps[1].values : [];

  const existingColorMetaMap = new Map<
    string,
    { name: string; originalName: string; imageUrl: string | null; orderIdx: number }
  >();
  existingPrimaryValues.forEach((val: any, idx: number) => {
    const k1 = decodeSkuHtmlEntities(val?.originalName || "");
    const k2 = decodeSkuHtmlEntities(val?.name || "");
    const rawImg = val?.imageUrl || val?.image || null;
    if (k2.includes(";") || k2.includes(">")) return;
    const entry = {
      name: k2 || k1,
      originalName: k1 || k2,
      imageUrl: rawImg,
      orderIdx: idx,
    };
    if (k1) existingColorMetaMap.set(k1.toLowerCase(), entry);
    if (k2) existingColorMetaMap.set(k2.toLowerCase(), entry);
  });

  const variantImgs = sourceVariants.map((v: any) => v?.imageUrl || v?.image).filter(Boolean);
  const uniqueVariantImgs = new Set(variantImgs);
  const existingHasAnyImg = existingPrimaryValues.some((v: any) => Boolean(v?.imageUrl || v?.image));
  const allVariantsShareSingleFallbackImg =
    !existingHasAnyImg && sourceVariants.length > 1 && uniqueVariantImgs.size === 1;

  const parsedVariants = sourceVariants.map((v: any, idx: number) => {
    const skuId = String(v?.skuId || v?.variantId || v?.id || `sku-${idx + 1}`);
    const rawSpec = decodeSkuHtmlEntities(
      String(v?.specsToken || v?.specs || v?.name || v?.color || `Option ${idx + 1}`)
    );

    let colorToken = "";
    let sizeToken = "";

    if (rawSpec.includes(">")) {
      const parts = rawSpec.split(">").map((s) => s.trim()).filter(Boolean);
      colorToken = parts[0] || rawSpec;
      sizeToken = parts.slice(1).join(" > ");
    } else if (rawSpec.includes(";")) {
      const parts = rawSpec.split(";").map((s) => s.trim()).filter(Boolean);
      colorToken = parts[0] || rawSpec;
      sizeToken = parts.slice(1).join(" - ");
    } else if (
      v?.color &&
      v?.size &&
      decodeSkuHtmlEntities(String(v.color)) !== decodeSkuHtmlEntities(String(v.size))
    ) {
      colorToken = decodeSkuHtmlEntities(String(v.color));
      sizeToken = decodeSkuHtmlEntities(String(v.size));
    } else if (
      rawSpec.includes(" - ") &&
      existingProps.length >= 2 &&
      !existingColorMetaMap.has(rawSpec.toLowerCase())
    ) {
      const parts = rawSpec.split(" - ").map((s) => s.trim()).filter(Boolean);
      colorToken = parts[0] || rawSpec;
      sizeToken = parts.slice(1).join(" - ");
    } else {
      colorToken = rawSpec;
      sizeToken = "";
    }

    const existingMeta = existingColorMetaMap.get(colorToken.toLowerCase());
    const rmb =
      Number(
        v?.priceRmb ??
          v?.discountPrice ??
          (typeof v?.price === "number" && v.price < 500 ? v.price : 0)
      ) || 0;
    const bdt = Number(v?.priceBdt ?? v?.price ?? 0) || 0;
    const stock =
      typeof v?.stock === "number" ? v.stock : parseInt(String(v?.stock ?? 100), 10) || 100;

    const rawVarImg = allVariantsShareSingleFallbackImg ? null : (v?.imageUrl || v?.image || null);
    const imageUrl = existingMeta?.imageUrl || rawVarImg || null;

    const canonicalColorName = existingMeta?.name || colorToken;
    const canonicalOriginalName = existingMeta?.originalName || colorToken;
    const normalizedSpecs = sizeToken ? `${canonicalOriginalName}>${sizeToken}` : canonicalOriginalName;

    return {
      skuId,
      specs: normalizedSpecs,
      colorToken: canonicalColorName,
      originalColorToken: canonicalOriginalName,
      sizeToken,
      price: rmb > 0 ? rmb : bdt,
      priceRmb: rmb > 0 ? rmb : undefined,
      priceBdt: bdt > 0 ? bdt : undefined,
      stock,
      imageUrl,
    };
  });

  const hasMultiLevelSpecs = parsedVariants.some((pv) => Boolean(pv.sizeToken));

  const syncedSkuVariants = parsedVariants.map((pv) => ({
    skuId: pv.skuId,
    specs: pv.specs,
    price: pv.price,
    priceRmb: pv.priceRmb,
    priceBdt: pv.priceBdt,
    stock: pv.stock,
    imageUrl: pv.imageUrl,
  }));

  if (hasMultiLevelSpecs) {
    const colorMap = new Map<
      string,
      { name: string; originalName: string; imageUrl: string | null; orderIdx: number }
    >();
    const sizeMap = new Map<string, { name: string; originalName: string; imageUrl: null }>();

    parsedVariants.forEach((pv, vIdx) => {
      const cKey = pv.colorToken.toLowerCase();
      const meta =
        existingColorMetaMap.get(cKey) ||
        existingColorMetaMap.get(pv.originalColorToken.toLowerCase());
      if (!colorMap.has(cKey)) {
        colorMap.set(cKey, {
          name: meta?.name || pv.colorToken,
          originalName: meta?.originalName || pv.originalColorToken,
          imageUrl: meta?.imageUrl || pv.imageUrl || null,
          orderIdx: meta ? meta.orderIdx : 10000 + vIdx,
        });
      } else {
        const existing = colorMap.get(cKey)!;
        if (!existing.imageUrl && pv.imageUrl) {
          existing.imageUrl = pv.imageUrl;
        }
      }

      if (pv.sizeToken) {
        const sKey = pv.sizeToken.toLowerCase();
        if (!sizeMap.has(sKey)) {
          sizeMap.set(sKey, {
            name: pv.sizeToken,
            originalName: pv.sizeToken,
            imageUrl: null,
          });
        }
      }
    });

    const sortedColors = Array.from(colorMap.values())
      .sort((a, b) => a.orderIdx - b.orderIdx)
      .map(({ name, originalName, imageUrl }) => ({ name, originalName, imageUrl }));

    const existingSizeOrder = new Map<string, number>();
    existingSecondaryValues.forEach((sv: any, idx: number) => {
      const sn = decodeSkuHtmlEntities(sv?.originalName || sv?.name || "").toLowerCase();
      if (sn) existingSizeOrder.set(sn, idx);
    });
    const sortedSizes = Array.from(sizeMap.values()).sort((a, b) => {
      const ia = existingSizeOrder.get(a.name.toLowerCase()) ?? 9999;
      const ib = existingSizeOrder.get(b.name.toLowerCase()) ?? 9999;
      return ia - ib;
    });

    const rawProp0Name = existingProps[0]?.name;
    const prop0Name =
      !rawProp0Name ||
      rawProp0Name === "Model" ||
      rawProp0Name === "Option" ||
      rawProp0Name === "规格型号"
        ? "颜色"
        : rawProp0Name;
    const prop1Name = existingProps[1]?.name || "尺码";

    return {
      ...(skuDetails && typeof skuDetails === "object" ? skuDetails : {}),
      properties: [
        {
          name: prop0Name,
          values: sortedColors,
        },
        {
          name: prop1Name,
          values: sortedSizes,
        },
      ],
      variants: syncedSkuVariants,
    };
  }

  const rawPrimaryName = existingProps[0]?.name;
  const primaryPropName =
    !rawPrimaryName ||
    rawPrimaryName === "Model" ||
    rawPrimaryName === "Option" ||
    rawPrimaryName === "规格型号"
      ? "颜色"
      : rawPrimaryName;

  const seenNames = new Set<string>();
  const syncedValuesWithOrder: Array<{
    name: string;
    originalName: string;
    imageUrl: string | null;
    skuId: string;
    orderIdx: number;
  }> = [];

  parsedVariants.forEach((pv, vIdx) => {
    const cKey = pv.colorToken.toLowerCase();
    const uniqueKey = `${cKey}::${pv.skuId}`;
    if (!seenNames.has(uniqueKey) && !seenNames.has(cKey)) {
      seenNames.add(uniqueKey);
      seenNames.add(cKey);
      const meta =
        existingColorMetaMap.get(cKey) ||
        existingColorMetaMap.get(pv.originalColorToken.toLowerCase());
      syncedValuesWithOrder.push({
        name: meta?.name || pv.colorToken,
        originalName: meta?.originalName || pv.originalColorToken,
        imageUrl: meta?.imageUrl || pv.imageUrl,
        skuId: pv.skuId,
        orderIdx: meta ? meta.orderIdx : 10000 + vIdx,
      });
    }
  });

  const syncedValues = syncedValuesWithOrder
    .sort((a, b) => a.orderIdx - b.orderIdx)
    .map(({ name, originalName, imageUrl, skuId }) => ({
      name,
      originalName,
      imageUrl,
      skuId,
    }));

  return {
    ...(skuDetails && typeof skuDetails === "object" ? skuDetails : {}),
    properties: [
      {
        name: primaryPropName,
        values: syncedValues,
      },
    ],
    variants: syncedSkuVariants,
  };
}

export function getCategoryImage(nameOrSlug?: string): string {
  if (!nameOrSlug) return CATEGORIES_LIST[0].image;
  const target = nameOrSlug.toLowerCase().trim();
  const mappedSlug = getMappedSlug(target);

  const found = CATEGORIES_LIST.find(
    (c) => c.slug === mappedSlug || c.slug === target || c.name.toLowerCase() === target
  );
  return found?.image || CATEGORIES_LIST[0].image;
}

export function getCategoryIcon(nameOrSlug?: string): LucideIcon {
  if (!nameOrSlug) return Tag;
  const target = nameOrSlug.toLowerCase().trim();
  const mappedSlug = getMappedSlug(target);

  const found = CATEGORIES_LIST.find(
    (c) => c.slug === mappedSlug || c.slug === target || c.name.toLowerCase() === target
  );
  return found?.IconComponent || Tag;
}

/**
 * Merges predefined store categories (including Bag and its 13 sub-categories) with any custom categories from /api/categories or product catalog.
 */
export function mergeWithStoreCategories(serverCategories?: any[] | null, products?: any[] | null): CategoryInfo[] {
  const merged: CategoryInfo[] = CATEGORIES_LIST.map((predefined) => {
    const serverCat = Array.isArray(serverCategories)
      ? serverCategories.find(
          (c: any) =>
            c &&
            (c.slug === predefined.slug ||
              (c.slug === "tools-home-impr" && predefined.slug === "tools-home-improvement") ||
              c.name?.toLowerCase().replace(/['’]/g, "'") === predefined.name.toLowerCase().replace(/['’]/g, "'"))
        )
      : null;
    return {
      ...predefined,
      image: serverCat?.image || predefined.image,
      parentCategory: serverCat?.parentCategory || predefined.parentCategory,
      parentSlug: serverCat?.parentSlug || predefined.parentSlug,
      IconComponent: predefined.IconComponent || getCategoryIcon(predefined.name),
    };
  });

  const knownSlugs = new Set<string>(merged.map((c) => c.slug.toLowerCase()));
  const knownNames = new Set<string>(merged.map((c) => c.name.toLowerCase().replace(/['’]/g, "'")));

  if (Array.isArray(serverCategories)) {
    for (const sc of serverCategories) {
      if (!sc || !sc.name) continue;
      const canonical = getCanonicalCategoryName(sc.name);
      const normName = canonical.toLowerCase().replace(/['’]/g, "'");
      const slug = sc.slug || getMappedSlug(canonical);
      if (slug === "imported" || knownSlugs.has(slug) || knownNames.has(normName)) continue;
      knownSlugs.add(slug);
      knownNames.add(normName);
      merged.push({
        id: sc.id || `cat-${slug}`,
        name: canonical,
        slug,
        iconName: sc.icon || "Tag",
        IconComponent: getCategoryIcon(canonical),
        image: sc.image || getCategoryImage(canonical),
        parentCategory: sc.parentCategory || undefined,
        parentSlug: sc.parentCategory ? getMappedSlug(sc.parentCategory) : undefined,
      });
    }
  }

  if (Array.isArray(products)) {
    for (const p of products) {
      if (!p || !p.category) continue;
      const canonical = getCanonicalCategoryName(p.category, p.name);
      const normName = canonical.toLowerCase().replace(/['’]/g, "'");
      const slug = getMappedSlug(canonical);
      if (slug === "imported" || knownSlugs.has(slug) || knownNames.has(normName)) continue;
      knownSlugs.add(slug);
      knownNames.add(normName);
      merged.push({
        id: `cat-${slug}`,
        name: canonical,
        slug,
        iconName: "Tag",
        IconComponent: getCategoryIcon(canonical),
        image: p.image || getCategoryImage(canonical),
      });
    }
  }

  return merged;
}

export function matchesCategory(
  productCategory: string | undefined,
  selectedCategory: string,
  productName?: string,
  serverCategories?: any[] | null
): boolean {
  if (!selectedCategory) return true;
  const sel = selectedCategory.toLowerCase().trim().replace(/['’]/g, "'");
  if (sel === "all" || sel === "all products" || sel === "all categories" || sel === "shop all") return true;

  const pCat = (productCategory || "").toLowerCase().trim().replace(/['’]/g, "'");
  const selMapped = getMappedSlug(sel);
  const pCatMapped = pCat ? getMappedSlug(pCat) : "imported";

  // Parent-child matching when any expandable main category is selected:
  if (PARENT_SUB_SLUG_MAP[selMapped]) {
    const subSlugSet = PARENT_SUB_SLUG_MAP[selMapped];
    if (pCat && pCatMapped && pCatMapped !== "imported") {
      if (pCatMapped === selMapped || subSlugSet.has(pCatMapped)) return true;
      if (Array.isArray(serverCategories)) {
        const isCustomSub = serverCategories.some(
          (sc) =>
            sc &&
            sc.parentCategory &&
            getMappedSlug(sc.parentCategory) === selMapped &&
            getMappedSlug(sc.name) === pCatMapped
        );
        if (isCustomSub) return true;
      }
      return false;
    }
    if (productName) {
      const inferredSlug = getMappedSlug(productName);
      if (inferredSlug === selMapped || subSlugSet.has(inferredSlug)) return true;
    }
    return false;
  }

  // Check if selectedCategory is another main category that has custom server sub-categories
  if (Array.isArray(serverCategories) && pCatMapped && pCatMapped !== "imported") {
    const isCustomSubMatch = serverCategories.some(
      (sc) =>
        sc &&
        sc.parentCategory &&
        getMappedSlug(sc.parentCategory) === selMapped &&
        getMappedSlug(sc.name) === pCatMapped
    );
    if (isCustomSubMatch) return true;
  }

  if (pCat && pCat === sel) return true;

  // 1. If the product has an explicit category (predefined or custom, not generic "imported"),
  // strictly match when its category slug equals the selected category slug.
  if (pCat && pCatMapped && pCatMapped !== "imported") {
    return pCatMapped === selMapped;
  }

  // 2. If the user specifically selected "Imported & Scraped"
  if (selMapped === "imported") {
    return pCatMapped === "imported";
  }

  // 3. Fallback keyword matching ONLY for unclassified / generic "Imported" products
  if (productName) {
    const inferredSlug = getMappedSlug(productName);
    if (inferredSlug && inferredSlug !== "imported") {
      return inferredSlug === selMapped;
    }
  }

  return false;
}

/**
 * Translates or cleans Chinese product titles to professional English titles
 */
export function cleanEnglishTitle(name: string | undefined, category?: string): string {
  if (!name) return "Wholesale Import Product";
  const cacheKey = `${name}::${category || ""}`;
  const cached = cleanTitleMemoCache.get(cacheKey);
  if (cached) return cached;

  const result = computeCleanEnglishTitle(name, category);
  cleanTitleMemoCache.set(cacheKey, result);
  return result;
}

function computeCleanEnglishTitle(name: string, category?: string): string {
  const containsChinese = /[\u4e00-\u9fa5]/.test(name);
  if (!containsChinese) {
    return name.trim();
  }

  const englishWords = name.match(/[a-zA-Z0-9\s-]{4,}/g);
  const genericWords = new Set(["wallet", "wallets", "purse", "clutch", "rfid", "shoes", "shoe", "bags", "bag", "women", "mens", "style", "fashion"]);
  const cleanEnglish = englishWords
    ? englishWords
        .map((w) => w.trim())
        .filter((w) => w.length > 3 && !genericWords.has(w.toLowerCase()))
        .join(" ")
    : "";

  const lowerName = name.toLowerCase();

  if (lowerName.includes("羽毛球") || lowerName.includes("鸭毛球") || lowerName.includes("badminton")) {
    const packCount = lowerName.includes("12") ? "12 Pack" : "Pack";
    return cleanEnglish
      ? `${cleanEnglish} Professional Duck Feather Badminton Shuttlecocks (${packCount})`
      : `Professional Duck Feather Badminton Shuttlecocks - ${packCount} (Training & Recreation)`;
  }

  if (lowerName.includes("面膜") || lowerName.includes("纱布") || lowerName.includes("gauze") || lowerName.includes("mask")) {
    return cleanEnglish ? `${cleanEnglish} Beauty Gauze Facial Care Mask (100 pcs/pack)` : "Beauty Salon Gauze Facial Care Mask (100 pcs/pack)";
  }
  if (lowerName.includes("浮水") || lowerName.includes("拖拉机") || lowerName.includes("假饵") || lowerName.includes("lure") || lowerName.includes("bait")) {
    return cleanEnglish ? `${cleanEnglish} Floating Water System Tractor Lure Bait` : "Floating Water Surface Tractor Lure Fish Bait";
  }
  if (lowerName.includes("air max") || lowerName.includes("气垫鞋") || lowerName.includes("跑步鞋")) {
    return cleanEnglish ? `${cleanEnglish} Air Cushion Athletic Running Shoes` : "Men's Air Cushion Athletic Breathable Running Shoes";
  }
  if (lowerName.includes("板鞋") || lowerName.includes("休闲鞋") || lowerName.includes("shoes") || lowerName.includes("单鞋")) {
    return cleanEnglish ? `${cleanEnglish} Casual Walking Sneakers` : "Classic Breathable Casual Walking Sneakers";
  }
  if (lowerName.includes("拖鞋") || lowerName.includes("凉拖")) {
    return "Women's Non-Slip Thick Sole Summer Slides";
  }
  if (lowerName.includes("安全鞋") || lowerName.includes("劳保鞋") || lowerName.includes("防砸")) {
    return cleanEnglish ? `${cleanEnglish} Steel Toe Anti-Smash Work Safety Shoes` : "Heavy-Duty Steel Toe Anti-Smash Work Safety Shoes";
  }
  if (lowerName.includes("爬服") || lowerName.includes("连体衣") || lowerName.includes("哈衣") || lowerName.includes("包屁衣") || lowerName.includes("婴儿") || lowerName.includes("童装") || lowerName.includes("baby")) {
    return cleanEnglish ? `${cleanEnglish} Pure Cotton Newborn Baby Romper Bodysuit` : "Pure Cotton Newborn Baby Romper Jumpsuit Onesie";
  }
  if (lowerName.includes("公文包") || lowerName.includes("商务包")) {
    return cleanEnglish ? `${cleanEnglish} Executive Business Leather Briefcase` : "Executive Business Leather Briefcase & Document Bag";
  }
  if (lowerName.includes("钱夹") || lowerName.includes("钞票夹")) {
    return cleanEnglish ? `${cleanEnglish} Slim Leather Money Clip Wallet` : "Minimalist Slim Leather Money Clip & Cash Holder";
  }
  if (lowerName.includes("弹出") || (lowerName.includes("金属") && (lowerName.includes("卡盒") || lowerName.includes("卡包"))) || lowerName.includes("碳纤维卡包")) {
    return cleanEnglish ? `${cleanEnglish} RFID Blocking Metal Card Wallet` : "Men's Pop-up Metal RFID Blocking Carbon Fiber Multi-Slot Card Wallet";
  }
  if ((lowerName.includes("女士") || lowerName.includes("女款") || lowerName.includes("women")) && (lowerName.includes("钱包") || lowerName.includes("卡包") || lowerName.includes("零钱") || lowerName.includes("wallet"))) {
    const isLong = lowerName.includes("长款") || lowerName.includes("long");
    const isShort = lowerName.includes("短款") || lowerName.includes("short");
    const hasPhone = lowerName.includes("手机包") || lowerName.includes("手拿包") || lowerName.includes("clutch");
    if (isLong && hasPhone) {
      return cleanEnglish ? `${cleanEnglish} Women's Luxury Long Wallet & Clutch Phone Purse` : "Women's Luxury Long Multi-Card Wallet & Clutch Phone Purse";
    }
    if (isLong) {
      return cleanEnglish ? `${cleanEnglish} Women's Classic Long Wallet` : "Women's Elegant Multi-Card Long Leather Wallet";
    }
    if (isShort) {
      return cleanEnglish ? `${cleanEnglish} Women's Compact Short Clutch Wallet` : "Women's Minimalist Short Clutch Wallet & Coin Purse";
    }
    return cleanEnglish ? `${cleanEnglish} Women's Fashion Wallet` : "Women's Fashion Multi-Slot Leather Wallet & Coin Purse";
  }
  if (lowerName.includes("卡包") || lowerName.includes("卡夹") || lowerName.includes("名片夹") || lowerName.includes("卡盒")) {
    return cleanEnglish && !cleanEnglish.toLowerCase().includes("rfid")
      ? `${cleanEnglish} RFID Blocking Leather Card Holder`
      : "Luxury RFID Blocking Leather Credit Card Holder & Organizer";
  }
  if (lowerName.includes("电脑包") || lowerName.includes("笔记本包") || lowerName.includes("内胆包")) {
    return cleanEnglish ? `${cleanEnglish} Waterproof Shockproof Laptop Bag` : "Waterproof Shockproof Protective Laptop Bag & Sleeve";
  }
  if (lowerName.includes("拉杆箱") || lowerName.includes("行李箱") || lowerName.includes("登机箱")) {
    return cleanEnglish ? `${cleanEnglish} Hardside Spinner Travel Suitcase` : "Durable Hardshell Spinner Travel Suitcase & Trolley";
  }
  if (lowerName.includes("旅行包") || lowerName.includes("旅行袋") || lowerName.includes("行李袋")) {
    return cleanEnglish ? `${cleanEnglish} Large Capacity Waterproof Travel Duffle Bag` : "Large Capacity Waterproof Travel Duffle & Weekender Bag";
  }
  if (lowerName.includes("腰包") || lowerName.includes("胸包")) {
    return cleanEnglish ? `${cleanEnglish} Casual Crossbody Chest & Waist Bag` : "Sport Waterproof Crossbody Sling & Waist Bag";
  }
  if (lowerName.includes("双肩包") || lowerName.includes("背包") || lowerName.includes("书包")) {
    return cleanEnglish ? `${cleanEnglish} High Capacity Waterproof Travel Backpack` : "Ergonomic High Capacity Waterproof Travel & Daily Backpack";
  }
  if (lowerName.includes("礼盒") || lowerName.includes("礼品盒") || lowerName.includes("包装盒")) {
    return cleanEnglish ? `${cleanEnglish} Luxury Presentation Gift Box` : "Premium Luxury Packaging & Presentation Gift Box";
  }
  if (lowerName.includes("手提包") || lowerName.includes("凯莉") || lowerName.includes("波士顿包")) {
    return cleanEnglish ? `${cleanEnglish} Luxury Designer Women's Top-Handle Hand Bag` : "Luxury Designer Leather Top-Handle Hand Bag";
  }
  if (lowerName.includes("钱包") || lowerName.includes("皮夹")) {
    return cleanEnglish ? `${cleanEnglish} Genuine Leather Bifold Wallet` : "Classic Genuine Leather Multi-Slot Wallet";
  }
  if (lowerName.includes("零钱") || lowerName.includes("手机包") || lowerName.includes("手拿包") || (category || "").toLowerCase() === "purse") {
    return cleanEnglish ? `${cleanEnglish} Luxury Women's Crossbody Purse & Clutch` : "Luxury Designer Leather Crossbody Purse & Clutch";
  }
  if (lowerName.includes("包") || lowerName.includes("单肩") || lowerName.includes("斜挎")) {
    return cleanEnglish ? `${cleanEnglish} Fashion Crossbody Shoulder Bag` : "Fashion Waterproof Leather Crossbody Shoulder Bag";
  }
  if (lowerName.includes("项链") || lowerName.includes("首饰") || lowerName.includes("耳环") || lowerName.includes("手镯")) {
    return cleanEnglish ? `${cleanEnglish} Luxury Designer Jewelry Collection` : "Premium Plated Fashion Jewelry Set";
  }
  if (lowerName.includes("手表") || lowerName.includes("watch")) {
    return cleanEnglish ? `${cleanEnglish} Luxury Waterproof Quartz Watch` : "Classic Waterproof Sports Quartz Watch";
  }
  if (lowerName.includes("文胸") || lowerName.includes("内衣") || lowerName.includes("胸罩") || lowerName.includes("抹胸")) {
    if (lowerName.includes("运动") || lowerName.includes("健身") || lowerName.includes("瑜伽")) {
      return cleanEnglish ? `${cleanEnglish} Women's Breathable Sports Bra & Yoga Top` : "Women's Seamless Breathable Fitness Sports Bra";
    }
    return cleanEnglish ? `${cleanEnglish} Women's Comfort Seamless Bra & Lingerie` : "Women's Comfort Breathable Seamless Bra";
  }
  if (lowerName.includes("t恤") || lowerName.includes("短袖") || lowerName.includes("衣服")) {
    return cleanEnglish ? `${cleanEnglish} Premium Heavyweight Cotton T-Shirt` : "Men's Premium Heavyweight Cotton T-Shirt";
  }
  if (lowerName.includes("连衣裙") || lowerName.includes("裙")) {
    return cleanEnglish ? `${cleanEnglish} Elegant Casual Summer Dress` : "Women's Elegant Casual Summer Dress";
  }
  if (lowerName.includes("墨镜") || lowerName.includes("太阳镜") || lowerName.includes("眼镜")) {
    return cleanEnglish ? `${cleanEnglish} UV400 Polarized Fashion Sunglasses` : "Classic UV400 Driving & Fashion Sunglasses";
  }
  if (lowerName.includes("助力带") || lowerName.includes("护腕") || lowerName.includes("健身") || lowerName.includes("护掌")) {
    return cleanEnglish ? `${cleanEnglish} Non-Slip Fitness Wrist Support & Lifting Straps` : "Non-Slip Silicone Grip Deadlift Wrist Support & Fitness Lifting Straps";
  }
  if (lowerName.includes("手机壳") || lowerName.includes("保护套") || lowerName.includes("充电") || lowerName.includes("数据线")) {
    return cleanEnglish ? `${cleanEnglish} Shockproof Protective Phone Case & Accessory` : "Premium Shockproof Protective Mobile Phone Accessory";
  }
  if (lowerName.includes("耳机") || lowerName.includes("蓝牙") || lowerName.includes("音箱")) {
    return cleanEnglish ? `${cleanEnglish} Wireless Bluetooth Stereo Earbuds` : "TWS Wireless Bluetooth Hi-Fi Stereo Earbuds";
  }
  if (lowerName.includes("收纳") || lowerName.includes("置物架") || lowerName.includes("厨房") || lowerName.includes("衣架")) {
    return cleanEnglish ? `${cleanEnglish} Multi-Layer Home & Kitchen Organizer` : "Multi-Purpose Home & Kitchen Storage Organizer";
  }
  if (lowerName.includes("宠物") || lowerName.includes("猫") || lowerName.includes("狗")) {
    return cleanEnglish ? `${cleanEnglish} Premium Pet Care & Feeding Supply` : "Nutritious Pet Food & Daily Care Supply";
  }
  if (lowerName.includes("玩具") || lowerName.includes("公仔") || lowerName.includes("盲盒") || lowerName.includes("游戏")) {
    return cleanEnglish ? `${cleanEnglish} Interactive Toy & Entertainment Set` : "Creative Kids & Family Entertainment Toy Set";
  }

  if (cleanEnglish && cleanEnglish.length > 5) {
    return cleanEnglish;
  }

  const mapped = getMappedSlug(category || "");
  if (mapped === "shoes") return "Men's & Women's Fashion Breathable Shoes";
  if (mapped === "purse") return "Luxury Designer Women's Crossbody Purse & Clutch";
  if (mapped === "bags" || mapped === "bag") return "High Capacity Travel & Casual Shoulder Bag";
  if (mapped === "briefcases") return "Executive Business Leather Briefcase";
  if (mapped === "money-clip") return "Slim Leather Money Clip & Cash Holder";
  if (mapped === "wallet") return "Classic Leather Bifold Wallet";
  if (mapped === "backpack") return "High Capacity Waterproof Travel Backpack";
  if (mapped === "travel-bag") return "Large Capacity Waterproof Travel Duffle Bag";
  if (mapped === "card-holder") return "Luxury Leather Credit Card Holder";
  if (mapped === "laptop-bag") return "Waterproof Shockproof Protective Laptop Bag";
  if (mapped === "suitcase") return "Durable Spinner Travel Suitcase & Luggage";
  if (mapped === "waist-bag") return "Sport Waterproof Crossbody Waist & Chest Bag";
  if (mapped === "hand-bag") return "Luxury Designer Women's Top-Handle Hand Bag";
  if (mapped === "gift-box") return "Premium Luxury Packaging & Gift Box";
  if (mapped === "jewelry") return "Exquisite Fashion Jewelry Accessory";
  if (mapped === "beauty-care") return "Professional Beauty & Personal Care Supply";
  if (mapped === "mens-clothing") return "Men's Casual High Quality Apparel";
  if (mapped === "womens-clothing") return "Women's Fashion Designer Apparel";
  if (mapped === "baby-items") return "Baby & Kids Soft Cotton Daily Essentials";
  if (mapped === "eyewear") return "Trendy UV400 Protection Fashion Eyewear & Sunglasses";
  if (mapped === "office-school-supplies") return "Executive Office & School Stationery Supply";
  if (mapped === "phone-accessories") return "Fast Charging & Protective Mobile Phone Accessory";
  if (mapped === "watches") return "Luxury Waterproof Quartz Wristwatch";
  if (mapped === "automobile-items") return "Universal Car Interior & Exterior Accessory";
  if (mapped === "pets-food") return "Premium Pet Nutrition & Care Supply";
  if (mapped === "outdoor-travelling") return "Portable Outdoor Camping & Travel Gear";
  if (mapped === "entertainment-items") return "Interactive Gaming & Entertainment Accessory";
  if (mapped === "electronics-gadgets") return "Smart Portable Electronic Accessory";
  if (mapped === "home-and-kitchen") return "Modern Home & Kitchen Functional Utensil";
  if (mapped === "tools-home-improvement" || mapped === "tools-home-impr") return "Durable Multi-Purpose Hardware Tool";
  if (mapped === "sports-fitness" || (category || "").toLowerCase().includes("sport") || (category || "").toLowerCase().includes("fitness") || (category || "").toLowerCase().includes("gym")) {
    return "Professional Sports & Fitness Training Gear";
  }

  const matchedSubOrMain = CATEGORIES_LIST.find((c) => c.slug === mapped);
  if (matchedSubOrMain && matchedSubOrMain.slug !== "imported") {
    return cleanEnglish
      ? `${cleanEnglish} - Premium ${matchedSubOrMain.name}`
      : `Premium Wholesale ${matchedSubOrMain.name}`;
  }

  return "Premium Imported Wholesale Product";
}
