import React, { useState, useEffect } from "react";

export default function ProductModal({ open, onClose, onSave, product }) {
  const [form, setForm] = useState({ name: "", category: "", price: "", quantity: "" });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name ?? "",
        category: product.category ?? "",
        price: product.price ?? "",
        quantity: product.quantity ?? ""
      });
    } else {
      setForm({ name: "", category: "", price: "", quantity: "" });
    }
  }, [product, open]);

  const save = (e) => {
    e.preventDefault();
    setErr("");
    if (!form.name || Number(form.price) < 0 || Number(form.quantity) < 0) {
      setErr("Please provide valid name, non-negative price and quantity.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    };
    onSave(payload);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="absolute w-[92vw] max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {product ? "✏️ Edit Product" : "➕ Add Product"}
        </h3>

        {err && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Enter product name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              placeholder="e.g., Electronics, Clothing"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-md"
            >
              {product ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
