const dummyProducts = [
  // Electronics
  { name: "Smartphone Pro Max Mobile", price: 120000, category: "Electronics", description: "Latest smartphone with high-end camera.", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500" },
  { name: "Ultra Thin Laptop Computer PC", price: 85000, category: "Electronics", description: "Lightweight laptop for work and gaming.", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500" },
  { name: "DSLR Camera Photo", price: 45000, category: "Electronics", description: "Professional photography camera.", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500" },
  { name: "Smart TV 4K Television", price: 55000, category: "Electronics", description: "55-inch 4K UHD Smart Television.", image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500" },
  
  // Clothing & Fashion
  { name: "Blue Denim Jeans Pants", price: 2000, category: "Fashion", description: "Comfortable classic blue jeans.", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500" },
  { name: "White Cotton T-Shirt Shirt", price: 500, category: "Fashion", description: "Basic white cotton tee for daily wear.", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500" },
  { name: "Floral Summer Dress Clothing", price: 1500, category: "Fashion", description: "Beautiful floral dress for summer.", image: "https://images.unsplash.com/photo-1515347619362-75fe80c102bd?w=500" },
  { name: "Winter Coat Jacket", price: 4000, category: "Fashion", description: "Warm jacket coat for cold weather.", image: "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=500" },
  { name: "Running Shoes Sneakers Footwear", price: 3000, category: "Fashion", description: "Comfortable sports shoes for running.", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500" },

  // Accessories
  { name: "Aviator Sunglasses Glasses", price: 1200, category: "Accessories", description: "Stylish black aviator sunglasses.", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500" },
  { name: "Baseball Cap Hat", price: 400, category: "Accessories", description: "Casual sports cap.", image: "https://images.unsplash.com/photo-1521369909029-2afed882ba54?w=500" },
  { name: "Leather Belt", price: 800, category: "Accessories", description: "Genuine brown leather belt.", image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=500" },
  { name: "Gold Necklace Jewelry", price: 15000, category: "Accessories", description: "Elegant gold pendant necklace.", image: "https://images.unsplash.com/photo-1599643478524-fb66f4568e71?w=500" },

  // Home & Living
  { name: "Living Room Sofa Furniture", price: 25000, category: "Home & Living", description: "Comfortable 3-seater sofa.", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500" },
  { name: "Ceramic Coffee Mug Cup", price: 300, category: "Home & Living", description: "White ceramic mug for tea or coffee.", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500" },
  { name: "Table Lamp Light", price: 1200, category: "Home & Living", description: "Modern desk lamp with warm light.", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500" },
  { name: "Kitchen Blender Appliance Mixer", price: 3500, category: "Home & Living", description: "High-speed blender for smoothies.", image: "https://images.unsplash.com/photo-1585237723326-80f4f9f7bfdc?w=500" },

  // Beauty & Health
  { name: "Matte Red Lipstick Makeup", price: 900, category: "Beauty", description: "Long-lasting matte lipstick.", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500" },
  { name: "Luxury Perfume Fragrance Scent", price: 4500, category: "Beauty", description: "Premium scent for men and women.", image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500" },
  { name: "Skincare Face Cream Lotion", price: 1500, category: "Beauty", description: "Moisturizing daily face cream.", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500" },

  // Sports & Outdoors
  { name: "Soccer Ball Football", price: 1000, category: "Sports", description: "Standard size football for matches.", image: "https://images.unsplash.com/photo-1614632537190-23e4146777db?w=500" },
  { name: "Yoga Mat Exercise", price: 600, category: "Sports", description: "Non-slip exercise yoga mat.", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500" },
  { name: "Tennis Racket", price: 2500, category: "Sports", description: "Lightweight professional tennis racket.", image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=500" },
  { name: "Mountain Bicycle Bike", price: 12000, category: "Sports", description: "Sturdy mountain bike for rough terrains.", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500" },

  // Others
  { name: "Acoustic Guitar Instrument", price: 6000, category: "Others", description: "Wooden acoustic guitar for beginners.", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500" },
  { name: "Story Book Novel Reading", price: 400, category: "Others", description: "Bestselling fiction novel.", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500" },
  { name: "Toy Car Hotwheels", price: 250, category: "Others", description: "Collectible miniature toy car.", image: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=500" }
];

async function seedAll() {
  for (const p of dummyProducts) {
    try {
      const res = await fetch("http://localhost:3000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p)
      });
      const data = await res.json();
      console.log(`Added: ${data.name || p.name}`);
    } catch (e) {
      console.error("Failed to add", p.name, e);
    }
  }
}

seedAll();
