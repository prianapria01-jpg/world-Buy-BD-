import { Fragment, useState, useEffect, useMemo, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  Folder,
  FolderOpen,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Layers,
  Tag,
  Upload,
} from "lucide-react";
import {
  MAIN_CATEGORIES_LIST,
  EXPANDABLE_MAIN_CATEGORIES,
  getMainCategoriesWithSubs,
  matchesCategory,
  mergeWithStoreCategories,
} from "../../utils/categories";

export default function AdminCategories() {
  const [serverCategories, setServerCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMains, setExpandedMains] = useState<Record<string, boolean>>({
    Bag: true,
    Shoes: true,
    Jewelry: true,
    "Beauty Products": true,
    "Mens Clothing": true,
    "Womens Clothing": true,
  });

  // Add Category / Sub-Category Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [parentCategory, setParentCategory] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products"),
      ]);
      const cats = await catsRes.json();
      const prods = await prodsRes.json();
      const prodsList = Array.isArray(prods) ? prods : [];
      setServerCategories(Array.isArray(cats) ? cats : []);
      setProducts(prodsList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const hierarchicalCategories = useMemo(() => {
    const baseTree = getMainCategoriesWithSubs(serverCategories);
    const mergedFlat = mergeWithStoreCategories(serverCategories, products);

    // Ensure any custom top-level categories from products/DB are also included if not already in baseTree or its subCategories
    const existingNames = new Set<string>();
    baseTree.forEach((m) => {
      existingNames.add(m.name.toLowerCase());
      (m.subCategories || []).forEach((s) => existingNames.add(s.name.toLowerCase()));
    });

    const extraMains = mergedFlat.filter(
      (c) => !c.parentCategory && !existingNames.has(c.name.toLowerCase())
    );

    return [...baseTree, ...extraMains];
  }, [serverCategories, products]);

  const toggleExpand = (catName: string) => {
    setExpandedMains((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  const openAddMainModal = () => {
    setParentCategory("");
    setNewCatName("");
    setNewCatSlug("");
    setShowAddModal(true);
  };

  const openAddSubModal = (mainCatName: string) => {
    setParentCategory(mainCatName);
    setNewCatName("");
    setNewCatSlug("");
    setShowAddModal(true);
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          slug: newCatSlug.trim() || newCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          parentCategory: parentCategory || undefined,
        }),
      });
      if (res.ok) {
        if (parentCategory) {
          setExpandedMains((prev) => ({ ...prev, [parentCategory]: true }));
        }
        setNewCatName("");
        setNewCatSlug("");
        setParentCategory("");
        setShowAddModal(false);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, _name: string) => {
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTree = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return hierarchicalCategories;

    return hierarchicalCategories
      .map((mainCat) => {
        const mainMatches = mainCat.name.toLowerCase().includes(q);
        const matchingSubs = (mainCat.subCategories || []).filter((sub: any) =>
          sub.name.toLowerCase().includes(q)
        );
        if (mainMatches) return mainCat;
        if (matchingSubs.length > 0) {
          return {
            ...mainCat,
            subCategories: matchingSubs,
          };
        }
        return null;
      })
      .filter(Boolean) as any[];
  }, [hierarchicalCategories, searchTerm]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">
            Categories & Sub-Categories Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Click on a main category (like <strong>Bag</strong>, <strong>Shoes</strong>, or <strong>Jewelry</strong>) to view or add sub-categories inside it
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openAddSubModal("Bag")}
            className="bg-red-50 hover:bg-red-100 text-[#cb1e46] border border-red-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ Sub in Bag</span>
          </button>
          <button
            onClick={() => openAddSubModal("Shoes")}
            className="bg-red-50 hover:bg-red-100 text-[#cb1e46] border border-red-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ Sub in Shoes</span>
          </button>
          <button
            onClick={() => openAddSubModal("Jewelry")}
            className="bg-red-50 hover:bg-red-100 text-[#cb1e46] border border-red-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ Sub in Jewelry</span>
          </button>
          <button
            onClick={openAddMainModal}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Main Category</span>
          </button>
        </div>
      </div>

      {/* Quick Highlight Banner for All 17 Main Categories & Sub-Categories */}
      <div className="bg-gradient-to-r from-red-50 via-white to-amber-50/60 border border-red-200/80 rounded-xl p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#cb1e46] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-charcoal">
                {EXPANDABLE_MAIN_CATEGORIES.length} Main Categories with Sub-Categories ({EXPANDABLE_MAIN_CATEGORIES.map((m) => `${m.name} (${(m.subCategories || []).length})`).join(" • ")})
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-[#cb1e46] px-2 py-0.5 rounded-full">
                {EXPANDABLE_MAIN_CATEGORIES.reduce((sum, m) => sum + (m.subCategories || []).length, 0)}{" "}
                Sub-Categories Active
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Click on any Main Category row below to expand or manage all its sub-categories.
            </p>
          </div>
        </div>
        <Link
          to="/admin/apify-importer"
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-red-50 text-[#cb1e46] border border-red-200 rounded-xl text-xs font-bold transition shadow-2xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Scraped Data by Category</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 flex flex-col flex-1 overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <input
              type="text"
              placeholder="Search main categories or sub-categories (e.g. Bag, Purse, Wallet, Backpack)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-primary"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>
              Main Categories: <strong className="text-charcoal">{hierarchicalCategories.length}</strong>
            </span>
            <span>•</span>
            <span>
              Total Sub-Categories:{" "}
              <strong className="text-[#cb1e46]">
                {EXPANDABLE_MAIN_CATEGORIES.reduce((sum, m) => sum + (m.subCategories || []).length, 0)}
              </strong>
            </span>
          </div>
        </div>

        {/* Categories Tree Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="text-gray-600 text-xs border-b border-gray-200 uppercase tracking-wider">
                  <th className="px-6 py-3 font-bold">Category / Sub-Category Name</th>
                  <th className="px-6 py-3 font-bold">Type</th>
                  <th className="px-6 py-3 font-bold">Slug</th>
                  <th className="px-6 py-3 font-bold">Products Count</th>
                  <th className="px-6 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {filteredTree.map((mainCat, mainIdx) => {
                  const subList = Array.isArray(mainCat.subCategories) ? mainCat.subCategories : [];
                  const hasSubs = subList.length > 0;
                  const isExpanded = Boolean(expandedMains[mainCat.name] || searchTerm.trim());
                  const mainProductCount = products.filter((p) =>
                    matchesCategory(p.category, mainCat.name, p.name)
                  ).length;
                  const MainIcon = mainCat.IconComponent || (isExpanded ? FolderOpen : Folder);

                  return (
                    <Fragment key={`${mainCat.id || mainCat.name}-${mainIdx}`}>
                      {/* Main Category Row */}
                      <tr
                        className={`transition-colors ${
                          hasSubs ? "bg-red-50/25 hover:bg-red-50/60" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 font-bold text-charcoal">
                          <div className="flex items-center gap-2.5">
                            {hasSubs ? (
                              <button
                                type="button"
                                onClick={() => toggleExpand(mainCat.name)}
                                className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#cb1e46] hover:bg-[#cb1e46] hover:text-white transition cursor-pointer shadow-2xs"
                                title={isExpanded ? "Collapse sub-categories" : "Expand sub-categories"}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="w-6 h-6 inline-flex items-center justify-center text-gray-300">
                                •
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => hasSubs && toggleExpand(mainCat.name)}
                              className={`flex items-center gap-2 text-left ${
                                hasSubs ? "cursor-pointer hover:text-[#cb1e46]" : ""
                              }`}
                            >
                              <MainIcon className="w-4 h-4 text-[#cb1e46]" />
                              <span className="text-sm font-extrabold">{mainCat.name}</span>
                            </button>

                            {hasSubs && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(mainCat.name)}
                                className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#cb1e46] text-white cursor-pointer hover:bg-[#a81739] transition"
                              >
                                {subList.length} Sub-Categories {isExpanded ? "▲" : "▼"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                            Main Category
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-500">{mainCat.slug}</td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/shop?category=${encodeURIComponent(mainCat.name)}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary text-charcoal font-bold px-2.5 py-1 rounded-full text-xs transition"
                          >
                            <span>{mainProductCount} products</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openAddSubModal(mainCat.name)}
                              className="px-2.5 py-1 bg-white hover:bg-red-50 text-[#cb1e46] border border-red-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                              title={`Add sub-category inside ${mainCat.name}`}
                            >
                              + Add Sub
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(mainCat.id, mainCat.name)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Sub-Category Rows */}
                      {hasSubs &&
                        isExpanded &&
                        subList.map((sub: any, idx: number) => {
                          const subProductCount = products.filter((p) =>
                            matchesCategory(p.category, sub.name, p.name)
                          ).length;
                          const SubIcon = sub.IconComponent || Tag;
                          return (
                            <tr
                              key={`${mainCat.name}-sub-${sub.id || sub.name}-${idx}`}
                              className="bg-slate-50/70 hover:bg-red-50/40 transition-colors border-l-4 border-l-[#cb1e46]"
                            >
                              <td className="pl-14 pr-6 py-3 font-semibold text-gray-800">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 font-mono text-xs">├─</span>
                                  <SubIcon className="w-3.5 h-3.5 text-[#cb1e46]" />
                                  <span>{sub.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <span className="px-2 py-0.5 rounded-md bg-red-50 text-[#cb1e46] border border-red-200/70 font-bold text-[10px]">
                                  Sub of {mainCat.name}
                                </span>
                              </td>
                              <td className="px-6 py-3 font-mono text-gray-500">{sub.slug}</td>
                              <td className="px-6 py-3">
                                <Link
                                  to={`/shop?category=${encodeURIComponent(sub.name)}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-[#cb1e46] hover:text-[#cb1e46] text-charcoal font-bold px-2.5 py-1 rounded-full text-xs transition"
                                >
                                  <span>{subProductCount} products</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </td>
                              <td className="px-6 py-3 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <Link
                                    to={`/admin/apify-importer?category=${encodeURIComponent(sub.name)}`}
                                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition"
                                    title={`Upload scraped products to ${sub.name}`}
                                  >
                                    Upload Here
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(sub.id, sub.name)}
                                    className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                    title="Delete Sub-Category"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Category / Sub-Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-charcoal mb-1">
              {parentCategory ? `Add Sub-Category under "${parentCategory}"` : "Add New Category"}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {parentCategory
                ? `This sub-category will open when clicking on "${parentCategory}".`
                : "Create a new top-level main category or assign it under an existing main category."}
            </p>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Parent Main Category (Optional)
                </label>
                <select
                  value={parentCategory}
                  onChange={(e) => setParentCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-none bg-white"
                >
                  <option value="">-- None (Make this a Main Category) --</option>
                  {MAIN_CATEGORIES_LIST.map((mc) => (
                    <option key={mc.id} value={mc.name}>
                      {mc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  {parentCategory ? "Sub-Category Name *" : "Category Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={parentCategory === "Bag" ? "e.g. Purse, Briefcases, Travel Bag" : "e.g. Smart Gadgets"}
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Slug (URL Identifier)
                </label>
                <input
                  type="text"
                  placeholder="e.g. travel-bag"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs font-mono focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
