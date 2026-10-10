import React, { useState, useEffect } from "react";
import { Search, Filter, FileText, CheckCircle, Truck, BarChart3 } from "lucide-react";
import DeliveryInvoiceModal from "../../components/admin/DeliveryInvoiceModal";
import CentralOperationsHub from "../../components/admin/CentralOperationsHub";

export default function AdminDelivery() {
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeView, setActiveView] = useState<"delivery_hub" | "daily_reports" | "custom_invoices">("delivery_hub");

  const fetchData = async () => {
    try {
      const [ordersRes, invoicesRes] = await Promise.all([
        fetch("/api/orders").then(res => res.json()),
        fetch("/api/admin/invoices").then(res => res.json())
      ]);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setInvoices(Array.isArray(invoicesRes) ? invoicesRes : []);
    } catch (err) {
      console.error("Failed to load delivery data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getInvoiceForOrder = (orderId: string | number) => {
    return invoices.find(inv => String(inv.orderId) === String(orderId));
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      String(order.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerName || order.customerInfo?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-charcoal flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            Delivery Department, Invoices & Daily Reporting
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Received in BD Warehouse → Invoice Processing → Invoice Ready → Ready for Delivery → Assigned to Delivery → Delivered
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView("delivery_hub")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
              activeView === "delivery_hub" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Delivery Workflow & Invoices
          </button>
          <button
            onClick={() => setActiveView("daily_reports")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeView === "daily_reports" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Daily Delivery & Invoice Reports
          </button>
          <button
            onClick={() => setActiveView("custom_invoices")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
              activeView === "custom_invoices" ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Detailed Weight/CBM Invoice Builder
          </button>
        </div>
      </div>

      {activeView === "delivery_hub" && <CentralOperationsHub key="del-tab" initialTab="Delivery" />}
      {activeView === "daily_reports" && <CentralOperationsHub key="rep-tab" initialTab="Daily Reports" />}

      {activeView === "custom_invoices" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search by Order ID or Customer Name..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Order Confirmed">Order Confirmed</option>
                <option value="Received in BD Warehouse">Received in BD Warehouse</option>
                <option value="Ready for Delivery">Ready for Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Invoice Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading orders...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">No orders found.</td></tr>
                ) : filteredOrders.map(order => {
                  const invoice = getInvoiceForOrder(order.id) || order.invoice;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">#{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-charcoal">{order.customerInfo?.name || order.customerName || "Customer"}</div>
                        <div className="text-xs text-gray-500">{order.customerInfo?.phone || order.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
                          {order.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-charcoal">
                        BDT {(order.total || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {invoice ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded w-max">
                            <CheckCircle className="w-3 h-3" /> Created
                          </span>
                        ) : (
                          <span className="text-amber-500 text-xs font-bold bg-amber-50 px-2 py-1 rounded w-max">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${invoice ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-primary text-white hover:bg-primary-dark'}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {invoice ? "Edit Invoice" : "Create Invoice"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <DeliveryInvoiceModal 
          order={selectedOrder}
          existingInvoice={getInvoiceForOrder(selectedOrder.id)}
          onClose={() => setSelectedOrder(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
