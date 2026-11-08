import React from "react";
const items = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "products",  label: "Products",  icon: "📦" },
  { key: "orders",    label: "Orders",    icon: "🧾" },
  { key: "forecast",  label: "Forecast",  icon: "📈" },
  { key: "sales",     label: "Sales",     icon: "💸" },
  { key: "reports",   label: "Reports",   icon: "📈" },
  { key: "settings",  label: "Settings",  icon: "⚙️" },
];

export default function Sidebar({ open, onClose, active, onSelect }) {
  return (
    <>
      {/* overlay for mobile */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 lg:hidden transition-opacity ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-72 bg-white border-r border-gray-200 transform transition-transform
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="h-14 border-b border-gray-200 px-4 flex items-center font-semibold">Menu</div>
        <nav className="p-2">
          {items.map(it => (
            <button
              key={it.key}
              onClick={() => { onSelect(it.key); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left mb-1
              ${active === it.key ? "bg-blue-50 text-blue-700 border border-blue-200" : "hover:bg-gray-100"}`}
            >
              <span className="text-lg">{it.icon}</span>
              <span className="font-medium">{it.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-3 text-xs text-gray-500 border-t">
          v1.0 • Core Java + Spring Boot
        </div>
      </aside>
    </>
  );
}
