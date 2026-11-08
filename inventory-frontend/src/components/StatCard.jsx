import React from "react";

export default function StatCard({ title, value, hint, icon, color = "blue", trend }) {
  const gradients = {
    blue: "from-blue-50 to-blue-100 border-blue-200",
    green: "from-green-50 to-green-100 border-green-200",
    orange: "from-orange-50 to-orange-100 border-orange-200",
    red: "from-red-50 to-red-100 border-red-200",
    purple: "from-purple-50 to-purple-100 border-purple-200",
  };

  const iconColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    orange: "text-orange-600",
    red: "text-red-600",
    purple: "text-purple-600",
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradients[color]} shadow-md border p-6 hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
          {hint && <div className="mt-2 text-xs text-gray-500">{hint}</div>}
          {trend && (
            <div className={`mt-2 text-xs font-semibold ${trend.up ? "text-green-600" : "text-red-600"}`}>
              {trend.up ? "↑" : "↓"} {Math.abs(trend.percent)}% {trend.label || ""}
            </div>
          )}
        </div>
        {icon && (
          <div className={`text-4xl ${iconColors[color]} opacity-20`}>{icon}</div>
        )}
      </div>
    </div>
  );
}
