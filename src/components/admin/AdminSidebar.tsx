import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import BrandLogo from "../common/BrandLogo";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  Tags,
  Layers,
  BarChart2,
  DownloadCloud,
  UserCheck,
  Truck,
  Bot,
  Briefcase,
  Sliders,
  Video,
  ShieldCheck,
  Database
} from "lucide-react";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const isMarketing = React.useMemo(() => {
    try {
      const uStr = localStorage.getItem("admin_user");
      if (uStr) {
        const u = JSON.parse(uStr);
        const r = String(u.role || "").toLowerCase();
        if (r.includes("marketing") || r === "sales person") return true;
      }
      const dept = localStorage.getItem("admin_department_role");
      if (dept === "marketing") return true;
    } catch {}
    return false;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_user");
    navigate("/admin/login", { replace: true });
  };

  const navSections = [
    {
      title: "Operations & Billing",
      items: [
        { name: "Overview & Hub", path: "/admin", icon: LayoutDashboard },
        { name: "Department Workflow", path: "/admin/departments", icon: ShieldCheck },
        { name: "Orders & Invoices", path: "/admin/orders", icon: ShoppingCart },
        { name: "Delivery & Logistics", path: "/admin/delivery", icon: Truck },
      ],
    },
    {
      title: "Catalog & Sourcing",
      items: [
        { name: "Products", path: "/admin/products", icon: Package },
        { name: "Product Backup & Export", path: "/admin/product-backup", icon: Database },
        { name: "Categories", path: "/admin/categories", icon: Layers },
        { name: "Product Scraper", path: "/admin/scraper", icon: Bot },
        { name: "Apify Importer", path: "/admin/apify-importer", icon: DownloadCloud },
      ],
    },
    {
      title: "Storefront & Growth",
      items: [
        { name: "Customers", path: "/admin/customers", icon: Users },
        { name: "Discounts & Offers", path: "/admin/discounts", icon: Tags },
        { name: "Video Showcase", path: "/admin/videos", icon: Video },
        { name: "Store Customizer", path: "/admin/customizer", icon: Sliders },
      ],
    },
    {
      title: "Team & System",
      items: [
        { name: "Staff Desks", path: "/admin/role-dashboards", icon: Briefcase },
        { name: "Sub-Admins", path: "/admin/subadmins", icon: UserCheck },
        { name: "Analytics", path: "/admin/analytics", icon: BarChart2 },
        { name: "Settings", path: "/admin/settings", icon: Settings },
      ],
    },
  ];

  const visibleSections = React.useMemo(() => {
    if (!isMarketing) return navSections;
    return navSections
      .map(section => ({
        ...section,
        items: section.items.filter(i => i.path !== "/admin/settings" && i.path !== "/admin/subadmins")
      }))
      .filter(section => section.items.length > 0);
  }, [isMarketing]);

  return (
    <aside className="w-60 bg-slate-950 text-slate-300 flex flex-col h-full shrink-0 border-r border-slate-800/80 select-none">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
        <NavLink to="/admin" className="flex items-center">
          <BrandLogo theme="dark" size="sm" showTagline={false} />
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {visibleSections.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-1.5 text-[11px] font-semibold text-slate-500 tracking-wide">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/admin"}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-white font-semibold shadow-xs"
                          : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 mr-2.5 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800/80">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
