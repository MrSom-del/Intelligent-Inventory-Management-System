import React from "react";

export default function Topbar({ onMenu }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenu}
            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span className="text-xl font-bold text-blue-600">Inventory</span>
        </div>

        <div className="flex items-center gap-3">
          <input
            className="hidden sm:block w-64 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search (coming soon)"
          />
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white grid place-items-center font-semibold">
            I
          </div>
        </div>
      </div>
    </header>
  );
}
