import React, { useEffect, useState } from "react";
import { ProductService } from "../services/ProductService";

export default function AddOrderModal({ open, onClose, onSave }) {
  const [items, setItems] = useState([]); // { productId, quantity, product }
  const [allProducts, setAllProducts] = useState([]);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    if (!open) return;
    // load products (we can load first 100; ProductService.listPage returns page)
    ProductService.listPage({ page: 0, size: 100, sort: "id,asc" })
      .then(resp => setAllProducts(resp.data.content || []))
      .catch(err => console.error(err));
    setItems([]);
    setCustomerName("");
  }, [open]);

  const addLine = () => setItems(prev => [...prev, { productId: null, quantity: 1 }]);

  const updateLine = (idx, key, value) => {
    setItems(prev => prev.map((it, i) => i===idx ? { ...it, [key]: value } : it));
  };

  const removeLine = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const calcTotal = () => {
    return items.reduce((s, it) => {
      const p = allProducts.find(a => a.id === Number(it.productId));
      return s + (p ? (p.price * Number(it.quantity || 0)) : 0);
    }, 0);
  };

  const submit = (e) => {
    e.preventDefault();
    // validate
    if (!items.length) return alert("Add at least one item");
    for (let it of items) {
      if (!it.productId) return alert("Select product for each line");
      if (!it.quantity || it.quantity <= 0) return alert("Quantity must be > 0");
      const p = allProducts.find(a => a.id === Number(it.productId));
      if (!p) return alert("Product not found");
      if (p.quantity < it.quantity) return alert(`Insufficient stock for ${p.name}`);
    }
    const payload = {
      customerName,
      items: items.map(it => ({ productId: Number(it.productId), quantity: Number(it.quantity) })),
    };
    onSave(payload);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="absolute w-[96vw] max-w-3xl bg-white rounded-3xl p-8 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          🛒 Create New Order
        </h3>

        <form onSubmit={submit} className="space-y-6">
          {/* Customer Name Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name (Optional)</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Enter customer name or leave blank"
            />
          </div>

          {/* Order Items Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700">Order Items</label>
              <button
                type="button"
                onClick={addLine}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm hover:bg-blue-50 px-3 py-1 rounded transition"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No items added yet. Click "Add Item" to get started.</p>
              ) : (
                items.map((it, idx) => (
                  <div key={idx} className="flex gap-3 items-end bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-gray-600">Product</label>
                      <select
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        value={it.productId ?? ""}
                        onChange={e => updateLine(idx, "productId", Number(e.target.value))}
                      >
                        <option value="">-- Select Product --</option>
                        {allProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.quantity > 0 ? `(Stock: ${p.quantity})` : "(Out of Stock)"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <label className="text-xs font-semibold text-gray-600">Qty</label>
                      <input
                        type="number"
                        min="1"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        value={it.quantity}
                        onChange={e => updateLine(idx, "quantity", Number(e.target.value))}
                        placeholder="1"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded font-semibold transition"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Total Amount:</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                ₹{calcTotal().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
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
              ✅ Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


