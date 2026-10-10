const dummyBags = [
  {
    name: "Premium Leather Handbag",
    price: 4500,
    originalPrice: 6000,
    image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=600&q=80",
    category: "Fashion",
    description: "Elegant premium leather handbag for women."
  },
  {
    name: "Waterproof Travel Backpack",
    price: 2500,
    originalPrice: 3200,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    category: "Accessories",
    description: "Durable waterproof backpack for travel and outdoor activities."
  },
  {
    name: "Casual Canvas Tote Bag",
    price: 800,
    originalPrice: 1200,
    image: "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=600&q=80",
    category: "Fashion",
    description: "Eco-friendly reusable canvas tote bag."
  }
];

async function seedBags() {
  for (const p of dummyBags) {
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

seedBags();
