import React, { useEffect } from "react";

export default function Toast({ show, message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [show, duration, onClose]);

  if (!show) return null;

  const styles = {
    success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg",
    error: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg",
  };

  const icons = {
    success: "✅",
    error: "❌",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className={`px-6 py-4 rounded-xl shadow-2xl font-semibold flex items-center gap-3 max-w-sm ${styles[type]}`}>
        <span className="text-2xl">{icons[type]}</span>
        <p>{message}</p>
      </div>
    </div>
  );
}
