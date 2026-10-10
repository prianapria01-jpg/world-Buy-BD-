const dummyProducts = [
  {
    name: "Wireless Noise Cancelling Headphones",
    price: 15000,
    originalPrice: 20000,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    category: "Electronics",
    description: "Premium wireless headphones with active noise cancellation and 30-hour battery life."
  },
  {
    name: "Smart Watch Series 8",
    price: 25000,
    originalPrice: 28000,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    category: "Electronics",
    description: "Advanced smartwatch with health tracking and fitness features."
  },
  {
    name: "Classic Blue Denim Jacket",
    price: 3500,
    originalPrice: 4500,
    image: "https://images.unsplash.com/photo-1551537482-f209eb2a5707?auto=format&fit=crop&w=600&q=80",
    category: "Fashion",
    description: "Stylish classic blue denim jacket for men."
  },
  {
    name: "Running Sneakers",
    price: 4500,
    originalPrice: 6000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    category: "Fashion",
    description: "Lightweight and comfortable red running sneakers."
  },
  {
    name: "Leather Wallet",
    price: 1200,
    originalPrice: 1500,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80",
    category: "Accessories",
    description: "Genuine leather wallet with multiple card slots."
  }
];

async function seed() {
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

seed();
