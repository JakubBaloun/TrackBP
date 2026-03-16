import { Card } from "../ui";

export function StatCard({ label, value, subValue, icon, color = "gray" }) {
  const colors = {
    gray: "bg-gray-50 text-gray-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subValue && (
            <p className="mt-0.5 text-xs text-gray-400">{subValue}</p>
          )}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function StatsGrid({ children, cols = 4 }) {
  const colClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  return (
    <div className={`grid ${colClasses[cols]} gap-4 mb-6`}>
      {children}
    </div>
  );
}
