import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OrderService from "../services/OrderService";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    OrderService.getById(id)
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const changeStatus = async (status) => {
    try {
      await OrderService.updateStatus(id, status);
      const updated = await OrderService.getById(id);
      setOrder(updated);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      NEW: { label: "New Order", bg: "bg-blue-100", text: "text-blue-700", icon: "📋", color: "blue" },
      PAID: { label: "Payment Received", bg: "bg-green-100", text: "text-green-700", icon: "✅", color: "green" },
      CANCELLED: { label: "Cancelled", bg: "bg-red-100", text: "text-red-700", icon: "❌", color: "red" },
      DELIVERED: { label: "Delivered", bg: "bg-purple-100", text: "text-purple-700", icon: "🎁", color: "purple" },
    };
    return statusMap[status] || { label: status, bg: "bg-gray-100", text: "text-gray-700", icon: "📦", color: "gray" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 transition"
      >
        ← Back to Orders
      </button>

      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Order #{order.id}</h1>
          <p className="text-gray-500 mt-1">
            {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className={`px-6 py-3 rounded-2xl font-bold text-lg flex items-center gap-2 ${statusInfo.bg} ${statusInfo.text}`}>
          <span className="text-2xl">{statusInfo.icon}</span>
          {statusInfo.label}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Order Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Order Info Card */}
          <div className="rounded-2xl bg-white shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              👤 Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 font-medium">Customer Name</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{order.customerName || "Walk-in Customer"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Order Status</p>
                <p className={`text-lg font-bold mt-1 ${statusInfo.text}`}>{statusInfo.label}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Order Date</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Order ID</p>
                <p className="text-lg font-bold text-blue-600 mt-1">#{order.id}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-2xl bg-white shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                📦 Order Items ({order.items?.length || 0})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Quantity</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Price</th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 font-semibold text-gray-900">{item.product?.name || "—"}</td>
                      <td className="px-6 py-3 text-gray-700">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                          {item.quantity} x
                        </span>
                      </td>
                      <td className="px-6 py-3 font-semibold text-gray-900">
                        ₹{(item.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-gray-900">
                        ₹{((item.price || 0) * item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Summary & Actions */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md border border-blue-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              💰 Order Summary
            </h3>
            <div className="space-y-3 border-b border-blue-200 pb-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Subtotal:</p>
                <p className="font-semibold text-gray-900">
                  ₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Tax (0%):</p>
                <p className="font-semibold text-gray-900">₹0.00</p>
              </div>
            </div>
            <div className="pt-4 flex justify-between items-center">
              <p className="text-lg font-bold text-gray-900">Total:</p>
              <p className="text-3xl font-bold text-blue-600">
                ₹{(order.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Status Actions Card */}
          {order.status === "NEW" && (
            <div className="rounded-2xl bg-white shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => changeStatus("PAID")}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 font-semibold transition shadow-md"
                >
                  ✅ Mark as PAID
                </button>
                <button
                  onClick={() => changeStatus("CANCELLED")}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 font-semibold transition shadow-md"
                >
                  ❌ Cancel Order
                </button>
              </div>
            </div>
          )}

          {/* Order Stats */}
          <div className="rounded-2xl bg-white shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Statistics</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Number of Items</p>
                <p className="text-2xl font-bold text-gray-900">{order.items?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{(order.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
