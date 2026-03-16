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

// Convert km/h to min/km
const speedToPace = (speedKmh) => {
  if (!speedKmh || speedKmh < 2) return null;
  const pace = 60 / speedKmh;
  if (pace < 2 || pace > 15) return null;
  return pace;
};

// Format pace as "M:SS"
const formatPace = (paceMin) => {
  if (paceMin == null || paceMin > 30) return "";
  const mins = Math.floor(paceMin);
  const secs = Math.round((paceMin - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Generate nice round time ticks
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

export default function PaceChart({
  samples,
  duration,
  hoverTime,
  onHoverTime,
  isRunning = true,
}) {
  const { data, domain, ticks, reversed } = useMemo(() => {
    if (!samples?.length) {
      return { data: [], domain: [4, 8], ticks: [4, 5, 6, 7, 8], reversed: true };
    }

    const step = Math.max(1, Math.floor(samples.length / MAX_POINTS));
    const chartData = [];

    for (let i = 0; i < samples.length; i += step) {
      const time = (i / samples.length) * duration;
      const speedKmh = samples[i];

      if (isRunning) {
        const pace = speedToPace(speedKmh);
        if (pace !== null) {
          chartData.push({ time, value: pace });
        }
      } else {
        if (speedKmh > 0) {
          chartData.push({ time, value: speedKmh });
        }
      }
    }

    if (!chartData.length) {
      return { data: [], domain: [4, 8], ticks: [4, 5, 6, 7, 8] };
    }

    const values = chartData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (isRunning) {
      // Pace: faster (lower values) at TOP, slower (higher) at BOTTOM
      const domainMin = Math.max(2, Math.floor(min));
      const domainMax = Math.ceil(max) + 1;

      // Ticks from min to max
      const tickValues = [];
      for (let v = domainMin; v <= domainMax; v += 1) {
        tickValues.push(v);
      }

      return {
        data: chartData,
        domain: [domainMin, domainMax],
        ticks: tickValues,
        reversed: true, // Invert Y axis
      };
    } else {
      // Speed: normal axis
      const domainMax = Math.ceil(max / 5) * 5 + 5;
      const tickValues = [];
      for (let v = 0; v <= domainMax; v += 10) {
        tickValues.push(v);
      }

      return {
        data: chartData,
        domain: [0, domainMax],
        ticks: tickValues,
        reversed: false,
      };
    }
  }, [samples, duration, isRunning]);

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
          {isRunning ? "Pace" : "Speed"}
        </h3>
        <div className="text-right min-w-[100px]">
          {hoverValue !== null ? (
            <span className="text-lg font-bold text-blue-500 tabular-nums">
              {isRunning ? formatPace(hoverValue) : hoverValue.toFixed(1)}{" "}
              <span className="text-sm font-normal text-gray-400">
                {isRunning ? "min/km" : "km/h"}
              </span>
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
            margin={{ top: 5, right: 5, left: -5, bottom: 0 }}
          >
            <defs>
              <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
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
              tickFormatter={isRunning ? formatPace : (v) => v}
              reversed={reversed}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#paceGradient)"
              dot={false}
              activeDot={{
                r: 5,
                stroke: "white",
                strokeWidth: 2,
                fill: "#3b82f6",
              }}
              isAnimationActive={false}
              connectNulls
              baseValue={domain[1]}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
