import React, { useEffect, useState } from "react";
import { ProductService } from "../services/ProductService";
import { ForecastService } from "../services/ForecastService";
import Toast from "../components/Toast";

export default function Forecast() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const loadAlerts = () => {
    return ForecastService.getAlerts()
      .then(response => setAlerts(response.data || []))
      .catch(() => setAlerts([]));
  };

  useEffect(() => {
    ProductService.listPage({ page: 0, size: 100, sort: "name,asc" })
      .then(response => setProducts(response.data.content || []))
      .catch(error => {
        showToast(error.response?.data?.error || "Unable to load products", "error");
      });
    loadAlerts();
  }, []);

  const runForecast = () => {
    if (!selectedProductId) return;

    setRunning(true);
    ForecastService.runForecast(selectedProductId)
      .then(response => {
        setSummary(response.data);
        return loadAlerts();
      })
      .catch(error => {
        showToast(error.response?.data?.error || "Unable to run forecast", "error");
      })
      .finally(() => setRunning(false));
  };

  const refreshSalesHistory = () => {
    ForecastService.aggregateSales()
      .then(response => showToast(`${response.data} rows written`))
      .catch(error => {
        showToast(error.response?.data?.error || "Unable to refresh sales history", "error");
      });
  };

  return (
    <div className="space-y-8">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(current => ({ ...current, show: false }))}
      />

      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold text-gray-900">Forecast & Reorder Alerts</h1>
        <p className="text-gray-500">Predict upcoming demand and monitor stock levels.</p>
      </div>

      <div className="rounded-2xl bg-white shadow-md border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <label className="flex-1">
            <span className="block text-sm font-semibold text-gray-700 mb-2">Product</span>
            <select
              value={selectedProductId}
              onChange={event => setSelectedProductId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={runForecast}
            disabled={!selectedProductId || running}
            className="px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {running ? "Running..." : "Run Forecast"}
          </button>
          <button
            onClick={refreshSalesHistory}
            className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Refresh sales history
          </button>
        </div>
      </div>

      {summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <SummaryCard title="Current Stock" value={summary.quantity} />
            <SummaryCard title="Reorder Point" value={summary.reorderPoint} />
            <div className="rounded-2xl bg-white shadow-md border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600">Status</div>
              <span className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-semibold ${
                summary.needsReorder
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}>
                {summary.needsReorder ? "Needs reorder" : "Stock OK"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">7-Day Forecast</h2>
            <ForecastTable forecast={summary.forecast || []} />
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Reorder Alerts</h2>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No products need reordering</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">Product</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">Stock</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">Reorder Point</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {alerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{alert.name}</td>
                    <td className="px-4 py-3 text-gray-700">{alert.quantity}</td>
                    <td className="px-4 py-3 text-gray-700">{alert.reorderPoint}</td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        Needs reorder
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-2xl bg-white shadow-md border border-gray-200 p-6">
      <div className="text-sm font-medium text-gray-600">{title}</div>
      <div className="mt-2 text-3xl font-bold text-gray-900">{value ?? 0}</div>
    </div>
  );
}

function ForecastTable({ forecast }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-gray-600 font-semibold">Date</th>
            <th className="px-4 py-3 text-left text-gray-600 font-semibold">Predicted Quantity</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {forecast.map(point => (
            <tr key={point.date} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-700">{point.date}</td>
              <td className="px-4 py-3 font-semibold text-gray-900">
                {Number(point.predictedQuantity || 0).toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
