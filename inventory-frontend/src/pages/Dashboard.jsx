import React, { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { DashboardService } from "../services/DashboardService";
import OrderService from "../services/OrderService";
import { useNavigate } from "react-router-dom";
import { ForecastService } from "../services/ForecastService";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    DashboardService.getStats()
      .then(data => setStats(data))
      .catch(err => console.error("Stats error", err));

    // Load recent orders
    OrderService.listPage({ page: 0, size: 5, sort: "id,desc" })
      .then(resp => setRecentOrders(resp.data.content || []))
      .catch(err => console.error("Error loading orders", err));

    ForecastService.getAlerts()
      .then(resp => setReorderAlerts((resp.data || []).length))
      .catch(() => setReorderAlerts(0));
  }, []);

  const getStatusBadge = (status) => {
    const badges = {
      NEW: { bg: "bg-blue-100", text: "text-blue-700", label: "New" },
      PAID: { bg: "bg-green-100", text: "text-green-700", label: "Paid" },
      CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
      DELIVERED: { bg: "bg-purple-100", text: "text-purple-700", label: "Delivered" },
    };
    return badges[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome! Here's your inventory overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon="📦"
          color="blue"
          hint="Active items in stock"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock}
          icon="⚠️"
          color="orange"
          hint="≤5 units remaining"
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStock}
          icon="❌"
          color="red"
          hint="Needs reordering"
        />
        <StatCard
          title="Total Inventory Value"
          value={`₹${(stats.totalValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          icon="💰"
          color="green"
          hint="Estimated value"
        />
        <StatCard
          title="Reorder Alerts"
          value={reorderAlerts}
          icon="📈"
          color="red"
          hint="Products needing reorder"
        />
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-2xl bg-white shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <p className="text-sm text-gray-500 mt-1">Latest transactions from your store</p>
          </div>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
          >
            View All →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No orders yet</p>
            <p className="text-sm mt-2">Orders will appear here as you create them</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">Order ID</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">Items</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">Total</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="px-4 py-3 font-semibold text-blue-600">#{order.id}</td>
                      <td className="px-4 py-3 text-gray-700">{order.customerName || "Walk-in"}</td>
                      <td className="px-4 py-3 text-gray-600">{order.items?.length || 0} item(s)</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">₹{(order.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate("/products")}>
          <div className="flex items-center gap-4">
            <div className="text-5xl">📦</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Manage Products</h3>
              <p className="text-sm text-gray-600 mt-1">Add, edit, or view your product inventory</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-md p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate("/orders")}>
          <div className="flex items-center gap-4">
            <div className="text-5xl">🧾</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Create Order</h3>
              <p className="text-sm text-gray-600 mt-1">Process new sales and manage customer orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-md p-6">
        <div className="flex gap-4">
          <div className="text-4xl">ℹ️</div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">System Status</h3>
            <p className="text-gray-700 mt-2">
              Your inventory system is running smoothly. Keep track of low-stock items and manage orders efficiently.
              All data is updated in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
