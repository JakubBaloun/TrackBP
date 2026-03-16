import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const MAX_POINTS = 300;

// Generate nice round time ticks (0, 5m, 10m, 15m, etc.)
const generateTimeTicks = (duration) => {
  const minutes = duration / 60;
  let interval;

  if (minutes <= 10) interval = 2;
  else if (minutes <= 30) interval = 5;
  else if (minutes <= 60) interval = 10;
  else interval = 15;

  const ticks = [];
  for (let m = 0; m <= minutes; m += interval) {
    ticks.push(m * 60);
  }
  return ticks;
};

const formatTime = (seconds) => {
  const mins = Math.round(seconds / 60);
  return `${mins}m`;
};

export default function HeartRateChart({
  samples,
  duration,
  hoverTime,
  onHoverTime,
}) {
  const { data, domain, ticks } = useMemo(() => {
    if (!samples?.length) {
      return { data: [], domain: [60, 180], ticks: [60, 100, 140, 180] };
    }

    const step = Math.max(1, Math.floor(samples.length / MAX_POINTS));
    const chartData = [];

    for (let i = 0; i < samples.length; i += step) {
      const time = (i / samples.length) * duration;
      const value = samples[i];
      if (value > 0) {
        chartData.push({ time, value });
      }
    }

    const values = chartData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const domainMin = Math.floor(min / 10) * 10 - 10;
    const domainMax = Math.ceil(max / 10) * 10 + 10;

    // Generate ticks every 20 bpm
    const tickValues = [];
    for (let v = domainMin; v <= domainMax; v += 20) {
      tickValues.push(v);
    }

    return {
      data: chartData,
      domain: [domainMin, domainMax],
      ticks: tickValues,
    };
  }, [samples, duration]);

  const timeTicks = useMemo(() => generateTimeTicks(duration), [duration]);

  // Find hovered value
  const hoverValue = useMemo(() => {
    if (hoverTime === null || !data.length) return null;
    let closest = data[0];
    let minDiff = Math.abs(data[0].time - hoverTime);
    for (const point of data) {
      const diff = Math.abs(point.time - hoverTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }
    return closest?.value;
  }, [data, hoverTime]);

  if (!data.length) {
    return null;
  }

  // Custom tooltip to capture mouse position
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.[0]?.payload) {
      const time = payload[0].payload.time;
      // Update parent state
      if (time !== hoverTime) {
        setTimeout(() => onHoverTime?.(time), 0);
      }
    }
    return null;
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-4"
      onMouseLeave={() => onHoverTime?.(null)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Heart Rate
        </h3>
        <div className="text-right min-w-[100px]">
          {hoverValue !== null ? (
            <span className="text-lg font-bold text-red-500 tabular-nums">
              {Math.round(hoverValue)}{" "}
              <span className="text-sm font-normal text-gray-400">bpm</span>
            </span>
          ) : (
            <span className="text-sm text-gray-300">—</span>
          )}
        </div>
      </div>

      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              type="number"
              domain={[0, duration]}
              ticks={timeTicks}
              tickFormatter={formatTime}
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={domain}
              ticks={ticks}
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#hrGradient)"
              dot={false}
              activeDot={{
                r: 5,
                stroke: "white",
                strokeWidth: 2,
                fill: "#ef4444",
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
