import React, { useEffect, useState } from "react";
import { ProductService } from "../services/ProductService";
import ProductModal from "../components/ProductModal";
import Toast from "../components/Toast";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0); // 0-based
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // sorting: "field,dir" e.g. "price,desc"
  const [sortBy, setSortBy] = useState({ field: "id", dir: "asc" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const loadPage = async (p = page, s = size, sort = `${sortBy.field},${sortBy.dir}`, query = q) => {
    setLoading(true);
    try {
      const resp = await ProductService.listPage({ page: p, size: s, sort, q: query });
      const data = resp.data;
      setProducts(data.content || []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
      setPage(data.number ?? p);
      setSize(data.size ?? s);
    } catch (e) {
      console.error(e);
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    loadPage(0, size, `${sortBy.field},${sortBy.dir}`, q);
    // eslint-disable-next-line
  }, []);

  // handle search: debounce small delay to avoid too many requests
  useEffect(() => {
    const t = setTimeout(() => {
      loadPage(0, size, `${sortBy.field},${sortBy.dir}`, q);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  // when size changes go to page 0
  useEffect(() => {
    loadPage(0, size, `${sortBy.field},${sortBy.dir}`, q);
    // eslint-disable-next-line
  }, [size]);

  // when sort changes, reload page 0
  useEffect(() => {
    loadPage(0, size, `${sortBy.field},${sortBy.dir}`, q);
    // eslint-disable-next-line
  }, [sortBy]);

  const saveProduct = async (payload) => {
    try {
      if (editing) {
        await ProductService.update(editing.id, payload);
        showToast("Product updated");
      } else {
        await ProductService.create(payload);
        showToast("Product added");
      }
      setOpen(false);
      setEditing(null);
      await loadPage(page, size, `${sortBy.field},${sortBy.dir}`, q);
    } catch (e) {
      console.error(e);
      showToast("Save failed", "error");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await ProductService.remove(id);
      showToast("Product deleted");
      // reload current page; if current page becomes empty, adjust below
      await loadPage(page, size, `${sortBy.field},${sortBy.dir}`, q);
      // if current page is beyond last, jump back
      if (page >= totalPages && totalPages > 0) {
        const newPage = Math.max(0, totalPages - 1);
        await loadPage(newPage, size, `${sortBy.field},${sortBy.dir}`, q);
      }
    } catch (e) {
      console.error(e);
      showToast("Delete failed", "error");
    }
  };

  const getStockStatus = (p) => {
    const qty = p.quantity || 0;
    if (qty === 0) return { status: "OUT_OF_STOCK", label: "Out of Stock", color: "red", bg: "bg-red-50", badge: "bg-red-100 text-red-700" };
    if (qty <= 5) return { status: "LOW_STOCK", label: "Low Stock", color: "orange", bg: "bg-orange-50", badge: "bg-orange-100 text-orange-700" };
    if (qty > 50) return { status: "HIGH_STOCK", label: "High Stock", color: "green", bg: "bg-green-50", badge: "bg-green-100 text-green-700" };
    return { status: "NORMAL", label: "Normal", color: "blue", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700" };
  };

  // Sorting helper: toggle directions
  const onSortClick = (field) => {
    setSortBy(prev => {
      if (prev.field === field) {
        // toggle direction
        const dir = prev.dir === "asc" ? "desc" : "asc";
        return { field, dir };
      }
      return { field, dir: "asc" };
    });
  };

  // Pagination helpers
  const goToPage = (p) => {
    if (p < 0 || p >= totalPages) return;
    loadPage(p, size, `${sortBy.field},${sortBy.dir}`, q);
  };

  // compute page numbers (small window)
  const pageNumbers = [];
  const start = Math.max(0, page - 2);
  const end = Math.min(totalPages - 1, page + 2);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your inventory and product catalog</p>
          </div>
          <button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-lg bg-blue-600 text-white px-6 py-2 hover:bg-blue-700 shadow-md transition font-medium">
            + Add Product
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            placeholder="Search products (name or category)..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-white shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">#</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">
                  <button onClick={() => onSortClick("name")} className="flex items-center gap-2 hover:text-blue-600">
                    Name
                    <span className="text-xs text-gray-400">{sortBy.field === "name" ? (sortBy.dir === "asc" ? "↑" : "↓") : ""}</span>
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">
                  <button onClick={() => onSortClick("category")} className="flex items-center gap-2 hover:text-blue-600">
                    Category
                    <span className="text-xs text-gray-400">{sortBy.field === "category" ? (sortBy.dir === "asc" ? "↑" : "↓") : ""}</span>
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">
                  <button onClick={() => onSortClick("price")} className="flex items-center gap-2 hover:text-blue-600">
                    Price (₹)
                    <span className="text-xs text-gray-400">{sortBy.field === "price" ? (sortBy.dir === "asc" ? "↑" : "↓") : ""}</span>
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">
                  <button onClick={() => onSortClick("quantity")} className="flex items-center gap-2 hover:text-blue-600">
                    Stock
                    <span className="text-xs text-gray-400">{sortBy.field === "quantity" ? (sortBy.dir === "asc" ? "↑" : "↓") : ""}</span>
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Value</th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                <th className="px-4 py-4 text-right text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading && (<tr><td className="px-4 py-8 text-center text-gray-500" colSpan={8}>Loading…</td></tr>)}

              {!loading && products.length === 0 && (<tr><td className="px-4 py-8 text-center text-gray-500" colSpan={8}>No products found</td></tr>)}

              {!loading && products.map((p, i) => {
                const stock = getStockStatus(p);
                const value = ((p.price || 0) * (p.quantity || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 });
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 transition ${stock.bg}`}>
                    <td className="px-4 py-3 text-sm text-gray-600">{page * size + i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.category ? (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {p.category}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">₹{(p.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{p.quantity}</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition ${ stock.status === "OUT_OF_STOCK" ? "bg-red-600" : stock.status === "LOW_STOCK" ? "bg-orange-500" : stock.status === "HIGH_STOCK" ? "bg-green-500" : "bg-blue-500"}`}
                            style={{ width: `${Math.min(100, (p.quantity / 100) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">₹{value}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stock.badge}`}>
                        {stock.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditing(p); setOpen(true); }} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition">Edit</button>
                        <button onClick={() => deleteProduct(p.id)} className="text-red-600 hover:bg-red-50 px-3 py-1 rounded transition">Delete</button>
                      </div>
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
          Showing <strong>{Math.min(totalElements, page * size + 1)}</strong> - <strong>{Math.min(totalElements, page * size + products.length)}</strong> of <strong>{totalElements}</strong> products
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => goToPage(0)} disabled={page === 0} className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition">« First</button>
          <button onClick={() => goToPage(page - 1)} disabled={page === 0} className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition">‹ Prev</button>

          {pageNumbers.map(pn => (
            <button key={pn} onClick={() => goToPage(pn)} className={`px-3 py-1 rounded border transition ${pn === page ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"}`}>{pn + 1}</button>
          ))}

          <button onClick={() => goToPage(page + 1)} disabled={page + 1 >= totalPages} className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition">Next ›</button>
          <button onClick={() => goToPage(totalPages - 1)} disabled={page + 1 >= totalPages} className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition">Last »</button>
        </div>
      </div>

      <ProductModal open={open} onClose={() => { setOpen(false); setEditing(null); }} onSave={saveProduct} product={editing} />
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}
