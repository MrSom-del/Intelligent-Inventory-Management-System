import React, { useEffect, useState } from "react";
import OrderService from "../services/OrderService";
import AddOrderModal from "../components/AddOrderModal";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show:false, message:"", type:"success" });
  const navigate = useNavigate();

  const showToast = (m, t="success") => setToast({ show:true, message:m, type:t });

  const getStatusInfo = (status) => {
    const statusMap = {
      NEW: { label: "New", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-600" },
      PAID: { label: "Paid", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-600" },
      CANCELLED: { label: "Cancelled", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-600" },
      DELIVERED: { label: "Delivered", bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-600" },
    };
    return statusMap[status] || { label: status, bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-600" };
  };

  const load = async (p=0, s=size) => {
    setLoading(true);
    try {
      const resp = await OrderService.listPage({ page: p, size: s });
      const data = resp.data;
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setPage(data.number || p);
      setSize(data.size || s);
    } catch (e) {
      console.error(e);
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(0, size); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const createOrder = async (payload) => {
    try {
      await OrderService.create(payload);
      showToast("Order created successfully! 🎉");
      setOpen(false);
      await load(page, size);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data || "Create failed";
      showToast(msg, "error");
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order? This will restore product stock.")) return;
    try {
      await OrderService.remove(id);
      showToast("Order deleted");
      await load(page, size);
    } catch (e) {
      console.error(e);
      showToast("Delete failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-500 text-sm mt-1">Manage customer orders and transactions</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700 shadow-md transition"
          >
            + Create Order
          </button>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Show:</label>
          <select
            value={size}
            onChange={e => { setSize(Number(e.target.value)); load(0, Number(e.target.value)); }}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">#</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Customer</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Items</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Total (₹)</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Date</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <p className="text-lg">No orders yet</p>
                    <p className="text-sm mt-2">Click "Create Order" to get started</p>
                  </td>
                </tr>
              )}
              {!loading && orders.map((o, i) => {
                const statusInfo = getStatusInfo(o.status);
                return (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition border-b"
                  >
                    <td className="px-4 py-3 font-semibold text-blue-600">#{o.id}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{o.customerName || "Walk-in Customer"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                        📦 {o.items?.length || 0} item(s)
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      ₹{(o.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${statusInfo.bg} ${statusInfo.text}`}>
                        <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOrder(o.id);
                        }}
                        className="text-red-600 hover:bg-red-50 px-3 py-1 rounded transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600">
          Showing <strong>{Math.min(totalElements, page * size + 1)}</strong> - <strong>{Math.min(totalElements, page * size + orders.length)}</strong> of <strong>{totalElements}</strong> orders
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => load(0)} disabled={page === 0} className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition">« First</button>
          <button onClick={() => load(page - 1)} disabled={page === 0} className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition">‹ Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i).slice(Math.max(0, page - 2), Math.min(totalPages, page + 3)).map(n => (
            <button key={n} onClick={() => load(n)} className={`px-3 py-1 border rounded transition ${n === page ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"}`}>{n + 1}</button>
          ))}
          <button onClick={() => load(page + 1)} disabled={page + 1 >= totalPages} className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition">Next ›</button>
          <button onClick={() => load(totalPages - 1)} disabled={page + 1 >= totalPages} className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition">Last »</button>
        </div>
      </div>

      <AddOrderModal open={open} onClose={() => setOpen(false)} onSave={createOrder} />
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}
