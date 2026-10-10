import { useState, useEffect } from "react";
import { 
  BarChart2, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  Smartphone, 
  Building,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function AdminAnalytics() {
  const [stats, setStats] = useState<any>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then(r => r.json()),
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/products").then(r => r.json())
    ]).then(([s, o, p]) => {
      setStats(s || {});
      setOrders(o || []);
      setProducts(p || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Calculate payment breakdowns
  const bkashCount = orders.filter(o => (o.paymentInfo?.method || o.customerInfo?.payment) === "bkash").length;
  const nagadCount = orders.filter(o => (o.paymentInfo?.method || o.customerInfo?.payment) === "nagad").length;
  const bankCount = orders.filter(o => (o.paymentInfo?.method || o.customerInfo?.payment) === "bank").length;

  const totalOrders = orders.length || 1;
  const avgOrderValue = Math.round((stats.totalRevenue || 0) / totalOrders);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
          <BarChart2 className="w-7 h-7 text-primary" />
          Store Analytics & Sales Report
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Complete sales, orders, and payment statistics for your e-commerce platform</p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-charcoal">BDT {(stats.totalRevenue || 0).toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">Total Received Revenue</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-charcoal">{stats.totalOrders || 0}  items</div>
          <span className="text-[11px] text-gray-500 mt-1 inline-block">Completed and pending combined</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500">Average Order Value (AOV)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-charcoal">BDT {avgOrderValue.toLocaleString()}</div>
          <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-block">Average spend per order</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500">Pending Payment Verification</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">{stats.verificationPending || 0}  items</div>
          <span className="text-[11px] text-purple-600 font-semibold mt-1 inline-block">Payment screenshot verification pending</span>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <h3 className="text-base font-bold text-charcoal mb-4">Payment Method Distribution</h3>
          
          <div className="space-y-4">
            {/* bKash */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-[#D12053]">
                  <Smartphone className="w-3.5 h-3.5" /> bKash (bKash)
                </span>
                <span>{bkashCount}  items ({Math.round((bkashCount / totalOrders) * 100)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#D12053] rounded-full transition-all duration-500"
                  style={{ width: `${(bkashCount / totalOrders) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Nagad */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-[#F7931E]">
                  <Smartphone className="w-3.5 h-3.5" /> Nagad (Nagad)
                </span>
                <span>{nagadCount}  items ({Math.round((nagadCount / totalOrders) * 100)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#F7931E] rounded-full transition-all duration-500"
                  style={{ width: `${(nagadCount / totalOrders) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Bank */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <Building className="w-3.5 h-3.5" /> Bank Transfer
                </span>
                <span>{bankCount}  items ({Math.round((bankCount / totalOrders) * 100)}%)</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${(bankCount / totalOrders) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Catalog Stats */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-charcoal mb-3">Product Statistics</h3>
            <p className="text-xs text-gray-500 mb-4">Status of published products on storefront</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-500 block text-[11px]">Total Products Count</span>
                <span className="text-lg font-bold text-charcoal mt-0.5 block">{products.length}  items</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-emerald-700 block text-[11px]">Imported Products</span>
                <span className="text-lg font-bold text-emerald-800 mt-0.5 block">
                  {products.filter(p => p.category?.includes("Imported") || p.brand?.includes("Wholesale") || p.brand?.includes("ChinaOnlineBD")).length}  items
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
            <span>System Status: Real-time sync active</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
