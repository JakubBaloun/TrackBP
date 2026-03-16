import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatDuration } from "../../utils/formatters";

const ZONE_COLORS = {
  0: "#94a3b8", // Zone 1 - Gray (recovery)
  1: "#3b82f6", // Zone 2 - Blue (endurance)
  2: "#22c55e", // Zone 3 - Green (tempo)
  3: "#f59e0b", // Zone 4 - Orange (threshold)
  4: "#ef4444", // Zone 5 - Red (anaerobic)
};

const ZONE_NAMES = {
  0: "Z1 (Recovery)",
  1: "Z2 (Endurance)",
  2: "Z3 (Tempo)",
  3: "Z4 (Threshold)",
  4: "Z5 (Anaerobic)",
};

export default function ZonesChart({ zones, compact = false }) {
  if (!zones?.length) {
    return (
      <div className="h-48 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
        No zone data
      </div>
    );
  }

  const data = zones
    .filter(zone => zone.duration > 0)
    .map((zone) => ({
      name: ZONE_NAMES[zone.index] || `Z${zone.index + 1}`,
      shortName: `Z${zone.index + 1}`,
      value: zone.duration,
      lowerLimit: zone.lowerLimit,
      upperLimit: zone.upperLimit,
      index: zone.index,
    }));

  const totalDuration = data.reduce((sum, zone) => sum + zone.value, 0);

  const renderTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const zone = payload[0].payload;
      const percentage = ((zone.value / totalDuration) * 100).toFixed(0);
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-sm">
          <p className="font-semibold text-gray-900">{zone.name}</p>
          <p className="text-gray-500">{zone.lowerLimit}-{zone.upperLimit} bpm</p>
          <p className="font-bold mt-1" style={{ color: ZONE_COLORS[zone.index] }}>
            {formatDuration(zone.value)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Get all zones for showing BPM ranges (not just those with duration > 0)
  const allZones = zones.map((zone) => ({
    name: ZONE_NAMES[zone.index] || `Z${zone.index + 1}`,
    shortName: `Z${zone.index + 1}`,
    lowerLimit: zone.lowerLimit,
    upperLimit: zone.upperLimit,
    index: zone.index,
    duration: zone.duration,
  }));

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={ZONE_COLORS[entry.index]}
                      stroke="white"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={renderTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1">
            {data.map((zone) => {
              const percentage = ((zone.value / totalDuration) * 100).toFixed(0);
              return (
                <div key={zone.index} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ZONE_COLORS[zone.index] }}
                  />
                  <span className="text-gray-600 flex-1 truncate">{zone.name}</span>
                  <span className="text-gray-400 tabular-nums">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
        {/* BPM ranges */}
        <div className="border-t border-gray-100 pt-3">
          <div className="grid grid-cols-5 gap-1">
            {allZones.map((zone) => (
              <div key={zone.index} className="text-center">
                <div
                  className="text-[10px] font-medium mb-0.5"
                  style={{ color: ZONE_COLORS[zone.index] }}
                >
                  Z{zone.index + 1}
                </div>
                <div className="text-[10px] text-gray-500">
                  {zone.lowerLimit}-{zone.upperLimit}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={ZONE_COLORS[entry.index]}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={renderTooltip} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 -mt-4">
        {data.map((zone) => (
          <div key={zone.index} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: ZONE_COLORS[zone.index] }}
            />
            <span className="text-xs text-gray-600">{zone.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
