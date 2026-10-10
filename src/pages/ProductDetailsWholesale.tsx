import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Check, Star, ShieldCheck, Truck, ChevronRight, Store, ArrowRight, ChevronDown, ChevronUp, Package } from 'lucide-react';

// Mock data representing the relational structure from MySQL
const mockProduct = {
  id: 1,
  offerId: '701886884877',
  title: '2024 New Cross-Border Trendy Large Capacity Backpack Students Waterproof Travel Bag Wholesale',
  price: 15.8, // Base price
  unit: 'piece',
  minOrderQuantity: 2,
  stock: 4500,
  soldDisplay: '1000+ sold',
  images: [
    'https://cbu01.alicdn.com/img/ibank/O1CN01XXXXXX_!!2200000000000-0-cib.jpg',
    'https://cbu01.alicdn.com/img/ibank/O1CN01YYYYYY_!!2200000000000-0-cib.jpg'
  ],
  skuGroups: [
    {
      id: 1,
      groupName: 'Color',
      options: [
        { id: 101, optionName: 'Black' },
        { id: 102, optionName: 'Khaki' },
        { id: 103, optionName: 'Army Green' }
      ]
    },
    {
      id: 2,
      groupName: 'Size',
      options: [
        { id: 201, optionName: 'Standard (45x30x15cm)' },
        { id: 202, optionName: 'Large (50x33x18cm)' }
      ]
    }
  ],
  skus: [
    { id: 1, optionIds: [101, 201], price: 15.8, stock: 1200, imageUrl: 'https://placeholder.com/black' },
    { id: 2, optionIds: [101, 202], price: 17.5, stock: 850, imageUrl: 'https://placeholder.com/black-large' },
    { id: 3, optionIds: [102, 201], price: 15.8, stock: 900, imageUrl: 'https://placeholder.com/khaki' },
    { id: 4, optionIds: [102, 202], price: 17.5, stock: 600, imageUrl: 'https://placeholder.com/khaki-large' },
    { id: 5, optionIds: [103, 201], price: 15.8, stock: 500, imageUrl: 'https://placeholder.com/green' },
    { id: 6, optionIds: [103, 202], price: 17.5, stock: 450, imageUrl: 'https://placeholder.com/green-large' },
  ],
  specs: [
    { name: 'Material', value: 'High-density Oxford cloth' },
    { name: 'Lining', value: 'Polyester' },
    { name: 'Capacity', value: '20-35L' },
    { name: 'Waterproof Degree', value: 'Water repellent' },
    { name: 'Computer Size', value: '15.6 inches' }
  ],
  supplier: {
    companyName: 'Baoding Xiongan New Area Bag Factory',
    tpYear: 5,
    factoryInspected: true,
    province: 'Hebei',
    city: 'Baoding'
  }
};

export default function ProductDetailsWholesale() {
  const { id } = useParams();
  
  // State for SKU selection
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [quantity, setQuantity] = useState(mockProduct.minOrderQuantity);
  const [exchangeRate, setExchangeRate] = useState<number>(22.80);
  const [showSimilarProducts, setShowSimilarProducts] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.rmbRate) {
          setExchangeRate(Number(data.rmbRate) || 22.80);
        }
      })
      .catch(() => {});

    fetch('/api/products?limit=8')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.products || []);
        setSimilarProducts(list);
      })
      .catch(() => {});
  }, []);
  
  // Helper to find the matched SKU
  const matchedSku = React.useMemo(() => {
    const requiredGroupIds = mockProduct.skuGroups.map(g => g.id);
    const selectedOptionIds = Object.values(selectedOptions);
    
    if (selectedOptionIds.length !== requiredGroupIds.length) return null;
    
    return mockProduct.skus.find(sku => 
      sku.optionIds.every(id => selectedOptionIds.includes(id))
    );
  }, [selectedOptions]);

  const handleOptionSelect = (groupId: number, optionId: number) => {
    setSelectedOptions(prev => ({ ...prev, [groupId]: optionId }));
  };

  const displayPrice = matchedSku ? matchedSku.price : mockProduct.price;
  const displayStock = matchedSku ? matchedSku.stock : mockProduct.stock;
  
  // Dynamic Pricing conversion using active RMB rate
  const markupMultiplier = 1.3; // 30% markup
  const finalCustomerPrice = (displayPrice * exchangeRate * markupMultiplier).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      
      {/* Breadcrumb */}
      <nav className="flex text-sm text-gray-500 mb-6 items-center">
        <span>Home</span>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span>Bags & Luggage</span>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span className="text-gray-900 truncate max-w-xs">{mockProduct.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-10 lg:gap-x-10 xl:gap-x-12">
        {/* Product Images Gallery */}
        <div className="flex flex-col-reverse lg:flex-row gap-4">
          {/* Thumbnail list (mocked for simplicity) */}
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible">
            {[1, 2, 3, 4].map((item) => (
              <button key={item} className="w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-md border-2 border-transparent hover:border-primary overflow-hidden bg-gray-100">
                <div className="w-full h-full bg-gray-200"></div>
              </button>
            ))}
          </div>
          {/* Main Image */}
          <div className="flex-1 aspect-square rounded-lg bg-gray-100 overflow-hidden relative border border-gray-200 flex items-center justify-center">
            {/* Direct supplier image preview */}
            <span className="text-gray-400">Product Image Placeholder</span>
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-10 px-4 sm:px-0 lg:mt-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
            {mockProduct.title}
          </h1>
          
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-sm text-gray-500">{mockProduct.soldDisplay}</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">Offer ID: {mockProduct.offerId}</span>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">World Buy BD Price</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary">BDT {finalCustomerPrice}</span>
              <span className="text-sm text-gray-500 line-through">BDT {(displayPrice * exchangeRate * 1.8).toFixed(2)}</span>
            </div>
            {matchedSku && (
              <div className="text-sm text-green-600 font-medium mt-2 flex items-center">
                <Check className="w-4 h-4 mr-1" />
                Selected SKU price active
              </div>
            )}
          </div>

          {/* SKUs Matrix */}
          <div className="space-y-6 mb-8">
            {mockProduct.skuGroups.map((group) => (
              <div key={group.id}>
                <h3 className="text-sm font-medium text-gray-900 mb-3">{group.groupName}</h3>
                <div className="flex flex-wrap gap-3">
                  {group.options.map((option) => {
                    const isSelected = selectedOptions[group.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(group.id, option.id)}
                        className={`
                          px-4 py-2 text-sm border rounded-md transition-all duration-200
                          ${isSelected 
                            ? 'border-primary bg-primary/5 text-primary font-medium ring-1 ring-primary' 
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        {option.optionName}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quantity */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
              <span className="text-sm text-gray-500">{displayStock} pieces available</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <button 
                  onClick={() => setQuantity(Math.max(mockProduct.minOrderQuantity, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                  disabled={quantity <= mockProduct.minOrderQuantity}
                >-</button>
                <input 
                  type="number" 
                  value={quantity}
                  readOnly
                  className="w-16 text-center py-2 border-x border-gray-300 text-gray-900 font-medium focus:outline-none"
                />
                <button 
                  onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >+</button>
              </div>
              <span className="text-sm text-gray-500">
                (Min order: {mockProduct.minOrderQuantity} {mockProduct.unit})
              </span>
            </div>
          </div>

          {/* Add to Cart Actions Section */}
          <div className="flex gap-4">
            <button className="flex-1 bg-primary text-white py-4 px-8 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </button>
            <button className="flex-1 bg-charcoal text-white py-4 px-8 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-sm">
              Buy Now
            </button>
          </div>

          {/* Supplier Info */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center mr-3">
                <Star className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{mockProduct.supplier.companyName}</h4>
                <div className="flex space-x-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                    TP {mockProduct.supplier.tpYear} Years
                  </span>
                  <span>{mockProduct.supplier.province}, {mockProduct.supplier.city}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-6 text-sm">
              <div className="flex items-center text-gray-600">
                <ShieldCheck className="w-4 h-4 mr-1 text-green-600" />
                Factory Inspected
              </div>
              <div className="flex items-center text-gray-600">
                <Truck className="w-4 h-4 mr-1 text-blue-600" />
                Supports Global Shipping
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      <div className="mt-16 pt-10 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Specifications</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left text-gray-600">
            <tbody>
              {mockProduct.specs.map((spec, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="w-1/3 px-6 py-4 font-medium text-gray-900 border-r border-gray-100">
                    {spec.name}
                  </td>
                  <td className="px-6 py-4">
                    {spec.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visit Seller Store Action Banner (Directly Above Description) */}
      <div className="mt-14 mb-8 bg-gradient-to-r from-red-50 via-white to-amber-50/70 border border-red-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#cb1e46] to-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#cb1e46] bg-red-100/80 px-2.5 py-0.5 rounded-md">
                Verified Factory Supplier
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {mockProduct.supplier.city}, {mockProduct.supplier.province}, China
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 mt-1 flex items-center gap-2">
              <span>{mockProduct.supplier.companyName}</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                4.9 ({mockProduct.supplier.tpYear} Years Gold Supplier)
              </span>
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Explore similar wholesale items and verified catalog from this manufacturer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowSimilarProducts(prev => !prev)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-[#cb1e46] via-red-600 to-rose-600 hover:from-[#a81638] hover:to-red-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer transform active:scale-98 group"
          >
            <Store className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Visit Seller Store</span>
            <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
              {similarProducts.length} Similar Items
            </span>
            {showSimilarProducts ? (
              <ChevronUp className="w-4 h-4 ml-0.5" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-0.5 group-hover:translate-y-0.5 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* Similar Products Section when Visit Seller Store is clicked */}
      {showSimilarProducts && (
        <div className="bg-white rounded-2xl p-6 mb-10 border-2 border-red-200/90 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <h4 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-[#cb1e46]" />
              <span>Seller Store: Similar Products Collection</span>
            </h4>
            <Link
              to="/shop"
              className="text-xs font-bold text-[#cb1e46] hover:underline flex items-center gap-1"
            >
              <span>View Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {similarProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {similarProducts.map((p: any) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="group bg-white rounded-xl border border-gray-100 hover:border-red-300 hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden relative">
                    <img
                      src={p.image || p.imageUrl || mockProduct.images[0]}
                      alt={p.name || p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h5 className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-[#cb1e46] transition-colors">
                      {p.name || p.title}
                    </h5>
                    <div className="mt-auto pt-2 flex items-baseline justify-between">
                      <span className="text-sm font-black text-[#cb1e46]">
                        BDT {Math.round(p.price || 0)}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        MOQ: {p.minOrder || p.minOrderQuantity || 1}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Loading seller store products...</p>
            </div>
          )}
        </div>
      )}

      {/* Description Section */}
      <div className="mt-16 pt-10 border-t border-gray-200">
         <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Description</h2>
         <div className="prose max-w-none text-gray-600">
           <p>
             The original Alibaba product description HTML will be safely rendered here.
             It includes rich images, promotional banners, and detailed sizing charts straight from the factory.
           </p>
           <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300 mt-6 text-gray-400">
             [HTML Description Render Area]
           </div>
         </div>
      </div>
    </div>
  );
}
