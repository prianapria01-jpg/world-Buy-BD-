import { useState, useEffect, useMemo, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Product } from "../../types";
import { Plus, Edit, Trash2, Search, Filter, X, Image as ImageIcon, CheckCircle, Package, SlidersHorizontal, DollarSign, Copy, Check, ExternalLink, Download, Database } from "lucide-react";
import { CATEGORIES_LIST, EXPANDABLE_MAIN_CATEGORIES, matchesCategory, getCategoryIcon, mergeWithStoreCategories, getCanonicalCategoryName } from "../../utils/categories";
import BulkPriceAdjustmentModal from "../../components/admin/BulkPriceAdjustmentModal";
import ProductBackupModal from "../../components/admin/ProductBackupModal";
import { getSafeImageUrl } from "../../utils/imageUrl";
import { cachedFetchJson, invalidateApiCache } from "../../utils/apiCache";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [serverCategories, setServerCategories] = useState<any[]>([]);
  const storeCategories = useMemo(
    () => mergeWithStoreCategories(serverCategories, products),
    [serverCategories, products]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Shoes");
  const [formPrice, setFormPrice] = useState("");
  const [formOriginalPrice, setFormOriginalPrice] = useState("");
  const [formStock, setFormStock] = useState("50");
  const [formBrand, setFormBrand] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("published");

  // Inline edit state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState("");

  const handleUpdatePrice = async (id: string) => {
    if (!editingPrice) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parseFloat(editingPrice) })
      });
      if (res.ok) {
        invalidateApiCache("/api/products");
        setProducts(products.map(p => p.id === id ? { ...p, price: parseFloat(editingPrice) } : p));
        setEditingProductId(null);
        setEditingPrice("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCategory = async (id: string, newCat: string) => {
    if (!newCat) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCat })
      });
      if (res.ok) {
        invalidateApiCache("/api/products");
        setProducts(prev => prev.map(p => p.id === id ? { ...p, category: newCat } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    if (forceRefresh) invalidateApiCache("/api/products");
    cachedFetchJson<any[]>("/api/categories", { forceRefresh })
      .then(cats => {
        if (Array.isArray(cats)) setServerCategories(cats);
      })
      .catch(() => {});
    cachedFetchJson<Product[]>("/api/products", { forceRefresh })
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading products:", err);
        setError("Failed to load products. Please try again.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, offerId?: string) => {
    const targetId = String(id || offerId || "").trim();
    if (!targetId) return;
    setDeletingId(targetId);
    // Optimistically remove from UI immediately
    setProducts((prev) =>
      prev.filter(
        (p) =>
          String(p.id || "") !== targetId &&
          String(p.offerId || "") !== targetId &&
          (!offerId || (String(p.id || "") !== String(offerId) && String(p.offerId || "") !== String(offerId)))
      )
    );
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(targetId)}`, { method: "DELETE" });
      if (offerId && String(offerId) !== targetId) {
        await fetch(`/api/products/${encodeURIComponent(String(offerId))}`, { method: "DELETE" }).catch(() => {});
      }
      invalidateApiCache();
      if (!res.ok) {
        loadProducts(true);
      }
    } catch (error) {
      console.error(error);
      loadProducts(true);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      alert("Please provide product name and price");
      return;
    }

    setSubmitting(true);
    try {
      const priceNum = Number(formPrice) || 0;
      const originalPriceNum = Number(formOriginalPrice) || Math.round(priceNum * 1.3);
      const discountPct = originalPriceNum > priceNum ? Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100) : 0;
      
      const defaultImg = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600";

      const payload = {
        name: formName.trim(),
        category: formCategory,
        price: priceNum,
        originalPrice: originalPriceNum,
        discount: discountPct,
        stock: Number(formStock) || 50,
        brand: formBrand.trim() || "Imported Direct",
        image: formImage.trim() || defaultImg,
        images: [formImage.trim() || defaultImg],
        description: formDescription.trim() || `${formName} imported directly with guaranteed quality inspection.`,
        status: formStatus,
        rating: 4.8,
        reviews: Math.floor(10 + Math.random() * 40)
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowAddModal(false);
        // Reset form
        setFormName("");
        setFormPrice("");
        setFormOriginalPrice("");
        setFormStock("50");
        setFormBrand("");
        setFormImage("");
        setFormDescription("");
        loadProducts(true);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add product");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding product");
    } finally {
      setSubmitting(false);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of storeCategories) {
      counts[cat.name] = products.filter(p => p && matchesCategory(p.category, cat.name, p.name)).length;
    }
    for (const mc of EXPANDABLE_MAIN_CATEGORIES) {
      counts[mc.name] = products.filter(p => p && matchesCategory(p.category, mc.name, p.name)).length;
      for (const sub of mc.subCategories || []) {
        counts[sub.name] = products.filter(p => p && matchesCategory(p.category, sub.name, p.name)).length;
      }
    }
    return counts;
  }, [products, storeCategories]);

  const filteredProducts = useMemo(() => products.filter(p => {
    if (!p) return false;
    const raw = searchTerm.trim();
    if (!raw) {
      if (selectedCategoryFilter) {
        return matchesCategory(p.category, selectedCategoryFilter, p.name);
      }
      return true;
    }

    const term = raw.toLowerCase();
    const cleanCode = term.replace(/^#/, '').trim();
    
    // Extract offerId if a supplier link was pasted into the search box
    const urlMatch = raw.match(/offer[s]?\/(\d+)/i) || raw.match(/id=(\d+)/i) || raw.match(/item\/(\d+)/i);
    const extractedOfferId = urlMatch ? urlMatch[1] : null;

    const pId = String(p.id || '').toLowerCase();
    const pOfferId = String(p.offerId || '').toLowerCase();
    const pCode = String((p as any).code || (p as any).productCode || '').toLowerCase();
    const pName = String(p.name || '').toLowerCase();
    const pBrand = String(p.brand || '').toLowerCase();
    const pImportedUrl = String(p.importedUrl || '').toLowerCase();

    // Check specifications item codes (e.g. 货号, Item No, Model, SKU, Art No, etc.)
    const pSpecCodes: string[] = [];
    if (p.specifications && typeof p.specifications === 'object') {
      const specs = p.specifications as Record<string, any>;
      ['货号', 'Item No', 'Model', 'SKU', 'Art No', 'Style No', 'Item', 'Code', '型号'].forEach(k => {
        if (specs[k]) pSpecCodes.push(String(specs[k]).toLowerCase());
      });
    }

    // Check SKU variant IDs
    if (p.skuDetails?.variants && Array.isArray(p.skuDetails.variants)) {
      p.skuDetails.variants.slice(0, 10).forEach((v: any) => {
        if (v.skuId) pSpecCodes.push(String(v.skuId).toLowerCase());
        if (v.specId) pSpecCodes.push(String(v.specId).toLowerCase());
      });
    }

    const matchesCode = 
      (cleanCode !== '' && pId.includes(cleanCode)) ||
      (cleanCode !== '' && pOfferId.includes(cleanCode)) ||
      (cleanCode !== '' && pCode.includes(cleanCode)) ||
      (extractedOfferId !== null && (pOfferId === extractedOfferId || pId.includes(extractedOfferId))) ||
      pSpecCodes.some(sc => sc && cleanCode !== '' && (sc.includes(cleanCode) || cleanCode.includes(sc)));

    const matchesText = 
      pName.includes(term) ||
      pBrand.includes(term) ||
      pImportedUrl.includes(term);

    const matchesSearch = matchesCode || matchesText;
    if (!matchesSearch) return false;

    // If matches a specific product code, show it directly even if another category was selected
    if (matchesCode && cleanCode !== '') {
      return true;
    }

    if (selectedCategoryFilter) {
      return matchesCategory(p.category, selectedCategoryFilter, p.name);
    }

    return true;
  }), [products, searchTerm, selectedCategoryFilter]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Product Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage and filter products across categories</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/admin/apify-importer"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center shadow-xs transition"
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Upload Apify Dataset Link
          </Link>
          <button 
            onClick={() => setShowBulkPriceModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center shadow-xs transition"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1.5" />
            Bulk Price Control
          </button>
          <button
            type="button"
            onClick={() => setShowBackupModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center shadow-xs transition cursor-pointer"
            title="Open comprehensive product data backup and download hub"
          >
            <Database className="w-4 h-4 mr-1.5" />
            <span>Backup & Download Hub</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center shadow-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 flex flex-col flex-1 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-center bg-gray-50/50">
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Search by Product Code (#123456), link or title..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Category:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-charcoal bg-white focus:outline-none focus:border-primary cursor-pointer w-full md:w-auto"
            >
              <option value="">All Categories ({products.length})</option>
              {EXPANDABLE_MAIN_CATEGORIES.map((mc) => (
                <optgroup key={mc.id} label={`📂 ${mc.name} — Main & ${(mc.subCategories || []).length} Sub-Categories`}>
                  <option value={mc.name}>{mc.name} - All Sub-Categories ({categoryCounts[mc.name] || 0})</option>
                  {(mc.subCategories || []).map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      ↳ {sub.name} ({categoryCounts[sub.name] || 0})
                    </option>
                  ))}
                </optgroup>
              ))}
              <optgroup label="📦 Other Store Categories">
                {storeCategories
                  .filter(
                    (cat) =>
                      !EXPANDABLE_MAIN_CATEGORIES.some(
                        (mc) =>
                          mc.slug === cat.slug ||
                          mc.name.toLowerCase() === cat.name.toLowerCase() ||
                          (mc.subCategories || []).some(
                            (s) => s.slug === cat.slug || s.name.toLowerCase() === cat.name.toLowerCase()
                          )
                      )
                  )
                  .map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name} ({categoryCounts[cat.name] || 0})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Search status feedback banner */}
        {searchTerm && (
          <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200/70 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Search Results: <strong className="font-bold font-mono">"{searchTerm}"</strong> — <strong className="font-bold">{filteredProducts.length}</strong> products found
              </span>
            </div>
            <button
              onClick={() => setSearchTerm("")}
              className="text-amber-800 hover:text-amber-950 underline font-bold text-[11px]"
            >
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="text-red-500 font-bold mb-2">{error}</div>
              <button
                onClick={() => loadProducts()}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 sticky top-0 z-10">
                <tr className="text-gray-600 text-xs border-b border-gray-200 uppercase tracking-wider">
                  <th className="px-6 py-3.5 font-bold">Product Details</th>
                  <th className="px-6 py-3.5 font-bold">Category</th>
                  <th className="px-6 py-3.5 font-bold">Price</th>
                  <th className="px-6 py-3.5 font-bold">Stock</th>
                  <th className="px-6 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredProducts.slice(0, visibleCount).map((product, pIdx) => {
                  const safeId = product.id || `prod-${pIdx}`;
                  const rowKey = `${product.id || 'prod'}-${pIdx}`;
                  const displayCode = String(product.offerId || product.id || safeId);
                  const Icon = getCategoryIcon(product.category);
                  const priceNum = typeof product.price === 'number' && !isNaN(product.price)
                    ? product.price
                    : (parseFloat(product.price as any) || 0);
                  const originalPriceNum = typeof product.originalPrice === 'number' && !isNaN(product.originalPrice)
                    ? product.originalPrice
                    : (parseFloat(product.originalPrice as any) || 0);
                  const stockNum = typeof product.stock === 'number' && !isNaN(product.stock)
                    ? product.stock
                    : (parseInt(product.stock as any) || 0);
                  const productImage = product.image || (Array.isArray(product.images) && product.images[0]) || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600";

                  return (
                    <tr key={rowKey} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-white flex items-center justify-center p-1 flex-shrink-0">
                            {productImage ? (
                              <img 
                                src={getSafeImageUrl(productImage, undefined, product.name)} 
                                alt={product.name || "Product"} 
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-contain" 
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600";
                                }}
                              />
                            ) : <div className="w-full h-full bg-gray-100" />}
                          </div>
                          <div className="max-w-md">
                            <div className="font-bold text-charcoal line-clamp-1">{product.name || "Unnamed Product"}</div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold">
                                Code: #{displayCode}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyCode(displayCode);
                                  }}
                                  title="Copy Code"
                                  className="text-amber-700 hover:text-amber-950 p-0.5 rounded transition"
                                >
                                  {copiedCode === displayCode ? (
                                    <Check className="w-3 h-3 text-emerald-600 inline" />
                                  ) : (
                                    <Copy className="w-3 h-3 inline" />
                                  )}
                                </button>
                              </span>
                              {product.brand && (
                                <span className="text-gray-500 font-medium truncate max-w-[140px]" title={product.brand}>
                                  • {product.brand}
                                </span>
                              )}
                              {product.specifications?.['货号'] && (
                                <span className="text-gray-400 font-mono text-[10px]">
                                  (Item: {product.specifications['货号']})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                          <Icon className="w-3 h-3 shrink-0" />
                          <select
                            value={getCanonicalCategoryName(product.category, product.name)}
                            onChange={(e) => handleUpdateCategory(safeId, e.target.value)}
                            className="bg-transparent font-bold text-primary focus:outline-none cursor-pointer pr-1"
                            title="Change Product Category"
                          >
                            {storeCategories.map((cat) => (
                              <option key={cat.id || cat.name} value={cat.name} className="text-charcoal bg-white">
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        {editingProductId === safeId ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                              placeholder="Price"
                            />
                            <button
                              onClick={() => handleUpdatePrice(safeId)}
                              className="text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingProductId(null); setEditingPrice(""); }}
                              className="text-gray-400 hover:text-gray-600"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-charcoal">
                              BDT {priceNum.toLocaleString()}
                            </span>
                            <button
                              onClick={() => { setEditingProductId(safeId); setEditingPrice(priceNum.toString()); }}
                              className="text-gray-400 hover:text-primary transition-colors"
                              title="Edit Price"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {originalPriceNum > priceNum && (
                              <span className="text-[11px] text-gray-400 line-through font-normal block mt-0.5">
                                BDT {originalPriceNum.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`font-semibold ${stockNum < 10 ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                          {stockNum} units
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          String(product.status || '').toLowerCase() === "published" || !product.status ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {product.status ? String(product.status).toUpperCase() : "PUBLISHED"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link
                            to={`/product/abb-${String(product.offerId || product.id).replace(/^abb-/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                            title="View on Store"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(product.id || safeId, product.offerId ? String(product.offerId) : undefined);
                            }}
                            disabled={deletingId === String(product.id || product.offerId)}
                            className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1 px-2.5 font-bold text-[11px]" 
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {!loading && !error && visibleCount < filteredProducts.length && (
            <div className="p-4 flex justify-center border-t border-gray-100 bg-gray-50/40">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 50)}
                className="px-5 py-2 bg-white border border-gray-300 hover:border-primary hover:text-primary text-charcoal font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Load More Products ({filteredProducts.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-charcoal">Add New Product</h2>
                <p className="text-xs text-gray-500">Add product to database with specific category</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-charcoal p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Italian Leather Loafers Shoes"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Select Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-primary bg-white cursor-pointer"
                  >
                    {EXPANDABLE_MAIN_CATEGORIES.map((mc) => (
                      <optgroup key={mc.id} label={`📂 ${mc.name} — Main & ${(mc.subCategories || []).length} Sub-Categories`}>
                        <option value={mc.name}>{mc.name} (Main Category)</option>
                        {(mc.subCategories || []).map((sub) => (
                          <option key={sub.id} value={sub.name}>
                            ↳ {sub.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <optgroup label="📦 Other Categories">
                      {storeCategories
                        .filter(
                          (cat) =>
                            !EXPANDABLE_MAIN_CATEGORIES.some(
                              (mc) =>
                                mc.slug === cat.slug ||
                                mc.name.toLowerCase() === cat.name.toLowerCase() ||
                                (mc.subCategories || []).some(
                                  (s) => s.slug === cat.slug || s.name.toLowerCase() === cat.name.toLowerCase()
                                )
                            )
                        )
                        .map((cat) => (
                          <option key={cat.id || cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Brand / Supplier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AeroSport Pro"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Selling Price (BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="1250"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Original Price (BDT)
                  </label>
                  <input
                    type="number"
                    placeholder="1650"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Image URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                  />
                  <ImageIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Write product features and description..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Price & Discount Adjustment Modal */}
      <BulkPriceAdjustmentModal
        isOpen={showBulkPriceModal}
        onClose={() => setShowBulkPriceModal(false)}
        onSuccess={() => loadProducts()}
        totalProductsCount={products.length}
      />
      {/* Product Data Backup & Download Modal */}
      <ProductBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onProductsUpdated={() => loadProducts(true)}
      />
    </div>
  );
}
