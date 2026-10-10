
import { Outlet, Navigate } from "react-router-dom";
import SubAdminSidebar from "../components/admin/SubAdminSidebar";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

export default function SubAdminLayout() {
  const userStr = localStorage.getItem("admin_user");
  if (!userStr) {
    return <Navigate to="/subadmin/login" replace />;
  }
  
  const user = JSON.parse(userStr);
  const customRoles = ["Sales Person", "Admin", "CS", "Purchase", "Marketing", "Delivery"];
  const isCustomDashboard = customRoles.includes(user?.role);

  if (isCustomDashboard) {
    // For Sales Person, just render the main content without sidebar or default header
    // Since AdminOrders includes its own custom header, this will match the requested dashboard exactly.
    return (
      <div className="flex h-screen font-sans overflow-hidden bg-white">
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <SubAdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
          <div className="text-lg font-bold text-slate-800">World Buy BD (Sub-Admin)</div>
          <div className="flex items-center space-x-4">
             <Link to="/" target="_blank" className="text-sm text-primary hover:underline mr-4">View Storefront</Link>
             <button className="text-gray-500 hover:text-slate-800 relative">
               <Bell className="w-5 h-5" />
               <span className="absolute -top-1 -right-1 bg-primary w-2 h-2 rounded-full"></span>
             </button>
             <div className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold">
               {user?.name?.[0]?.toUpperCase() || 'S'}
             </div>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
