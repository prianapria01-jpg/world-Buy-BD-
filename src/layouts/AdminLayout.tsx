import { Outlet, Link, Navigate, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import { Sliders, ExternalLink, FileText, LogOut } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("admin_user");

  if (!userStr) {
    return <Navigate to="/admin/login" replace />;
  }

  let adminUser: any = null;
  try {
    adminUser = JSON.parse(userStr);
  } catch {
    localStorage.removeItem("admin_user");
    return <Navigate to="/admin/login" replace />;
  }

  if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "Admin")) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_user");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-slate-900">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900">World Buy BD</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-medium text-slate-500">
              Admin Control Center
            </span>
            {adminUser?.email && (
              <>
                <span className="hidden md:inline text-slate-300">·</span>
                <span className="hidden md:inline text-xs font-mono text-slate-600">
                  {adminUser.email}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/admin/orders"
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title="Update Customer Invoice Charges (China Courier Bill, Weight KG, Shipping Charge)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Orders & Invoice Charges</span>
            </Link>
            <Link
              to="/admin/customizer"
              className="hidden sm:flex px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium items-center gap-1.5 transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customizer</span>
            </Link>
            <Link
              to="/"
              target="_blank"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleLogout}
              title="Sign out from Admin"
              className="text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/80 p-5 sm:p-6">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
