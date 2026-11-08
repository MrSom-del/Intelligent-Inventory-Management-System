import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menu = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/products", label: "Products", icon: "📦" },
    { path: "/orders", label: "Orders", icon: "🧾" },
    { path: "/forecast", label: "Forecast", icon: "📈" },
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static w-64 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl transition-transform z-40 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="text-4xl">📦</div>
            <div>
              <h1 className="text-2xl font-bold">Inventory</h1>
              <p className="text-xs text-gray-400">Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2 flex-1">
          {menu.map((m) => (
            <button
              key={m.path}
              onClick={() => {
                navigate(m.path);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all font-semibold ${
                isActive(m.path)
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <span className="text-xl">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          <p>⚡ Inventory v1.0</p>
          <p>© 2024 All Rights Reserved</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="bg-white shadow-md border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900 text-2xl"
            >
              ☰
            </button>

            {/* Page Title */}
            <h2 className="flex-1 ml-4 lg:ml-0 text-xl font-bold text-gray-900">
              {menu.find(m => isActive(m.path))?.label || "Dashboard"}
            </h2>

            {/* User Profile */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <span className="text-2xl">👤</span>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">Admin</p>
                  <p className="text-xs text-gray-500">Store Manager</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-500">
          <p>© 2024 Inventory Management System. Built with React & Spring Boot.</p>
        </footer>
      </div>
    </div>
  );
}
