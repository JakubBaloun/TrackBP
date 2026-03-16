import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// Group daily trend data into ISO weeks (Monday-based)
const groupByWeek = (recentTrend) => {
  const weeks = {};
  for (const day of recentTrend) {
    const date = new Date(day._id);
    const dayOfWeek = date.getDay(); // 0=Sun
    const monday = new Date(date);
    monday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const weekKey = monday.toISOString().slice(0, 10);
    if (!weeks[weekKey]) {
      weeks[weekKey] = { week: weekKey, distance: 0, duration: 0, count: 0 };
    }
    weeks[weekKey].distance += day.dailyDistance || 0;
    weeks[weekKey].duration += day.dailyDuration || 0;
    weeks[weekKey].count += day.activitiesCount || 0;
  }
  return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week));
};

const formatWeekLabel = (weekStr) => {
  const d = new Date(weekStr);
  return `${d.getDate()}. ${d.getMonth() + 1}.`;
};

const renderTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const distanceKm = (d.distance / 1000).toFixed(1);
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-sm">
      <p className="font-semibold text-gray-900">
        Week of {formatWeekLabel(d.week)}
      </p>
      <p className="text-blue-600 font-bold">{distanceKm} km</p>
      <p className="text-gray-500">
        {d.count} {d.count === 1 ? "activity" : "activities"}
      </p>
    </div>
  );
};

export default function VolumeChart({ recentTrend }) {
  const data = useMemo(() => {
    if (!recentTrend?.length) return [];
    return groupByWeek(recentTrend).map((week) => ({
      ...week,
      distanceKm: parseFloat((week.distance / 1000).toFixed(2)),
    }));
  }, [recentTrend]);

  const maxKm = useMemo(
    () => Math.max(...data.map((d) => d.distanceKm), 1),
    [data]
  );
  const domainMax = Math.ceil(maxKm / 5) * 5 + 5;

  if (!data.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
        Weekly Volume
      </h3>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tickFormatter={formatWeekLabel}
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, domainMax]}
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}km`}
              width={40}
            />
            <Tooltip content={renderTooltip} cursor={{ fill: "#f0f9ff" }} />
            <Bar
              dataKey="distanceKm"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
