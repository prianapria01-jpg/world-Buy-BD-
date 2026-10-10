import { NavLink } from "react-router-dom";
import BrandLogo from "../common/BrandLogo";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut,
  Layers,
  DownloadCloud,
  Video
} from "lucide-react";

export default function SubAdminSidebar() {
  // Restricted access: Sub-Admins cannot see Settings, Sub-Admins management, Discounts, Analytics.
  const navItems = [
    { name: "Dashboard", path: "/subadmin", icon: LayoutDashboard },
    { name: "Video Manager", path: "/subadmin/videos", icon: Video },
    { name: "Products", path: "/subadmin/products", icon: Package },
    { name: "Apify Importer", path: "/subadmin/apify-importer", icon: DownloadCloud },
    { name: "Categories", path: "/subadmin/categories", icon: Layers },
    { name: "Orders", path: "/subadmin/orders", icon: ShoppingCart },
    { name: "Customers", path: "/subadmin/customers", icon: Users },
  ];

  return (
    <aside className="w-64 bg-slate-800 text-gray-300 flex flex-col h-full flex-shrink-0">
      <div className="h-16 px-4 flex items-center justify-center border-b border-slate-700 bg-slate-900">
        <NavLink to="/subadmin" className="flex items-center justify-center">
          <BrandLogo theme="dark" size="sm" showTagline={false} />
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                end={item.path === "/subadmin"}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-md transition-colors duration-200 ${
                    isActive
                      ? "bg-primary text-white font-medium shadow-md"
                      : "hover:bg-slate-700 hover:text-white"
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700 bg-slate-900">
        <NavLink to="/auth/login" className="flex items-center w-full px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-slate-800 rounded-md transition">
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </NavLink>
      </div>
    </aside>
  );
}
