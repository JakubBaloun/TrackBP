import { useState, useCallback } from "react";
import HeartRateChart from "./HeartRateChart";
import PaceChart from "./PaceChart";

const RUNNING_SPORTS = ["RUNNING", "TRAIL_RUNNING", "TREADMILL_RUNNING", "TRACK_AND_FIELD_RUNNING"];

export default function ActivityCharts({ samples, duration, onHoverIndex, sport }) {
  const [hoverTime, setHoverTime] = useState(null);
  // brushDomain: [startTime, endTime] in seconds, or null = full range
  const [brushDomain, setBrushDomain] = useState(null);

  const isRunning = RUNNING_SPORTS.includes(sport?.toUpperCase());
  const hasHeartRate = samples?.heartRate?.length > 0;
  const hasSpeed = samples?.speed?.length > 0;

  const handleHoverTime = useCallback((time) => {
    setHoverTime(time);
    if (onHoverIndex && time !== null) {
      onHoverIndex(time / duration, null);
    } else {
      onHoverIndex?.(null, null);
    }
  }, [onHoverIndex, duration]);

  const handleBrushChange = useCallback((domain) => {
    setBrushDomain(domain);
    // Reset hover when brush changes
    setHoverTime(null);
    onHoverIndex?.(null, null);
  }, [onHoverIndex]);

  const handleResetZoom = useCallback(() => {
    setBrushDomain(null);
  }, []);

  if (!hasHeartRate && !hasSpeed) {
    return null;
  }

  const isZoomed = brushDomain !== null;

  return (
    <div className="space-y-4">
      {isZoomed && (
        <div className="flex justify-end">
          <button
            onClick={handleResetZoom}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
            Reset zoom
          </button>
        </div>
      )}

      {hasHeartRate && (
        <HeartRateChart
          samples={samples.heartRate}
          duration={duration}
          hoverTime={hoverTime}
          onHoverTime={handleHoverTime}
          brushDomain={brushDomain}
          onBrushChange={handleBrushChange}
          showBrush={hasHeartRate}
        />
      )}

      {hasSpeed && (
        <PaceChart
          samples={samples.speed}
          duration={duration}
          hoverTime={hoverTime}
          onHoverTime={handleHoverTime}
          isRunning={isRunning}
          brushDomain={brushDomain}
          onBrushChange={handleBrushChange}
          showBrush={!hasHeartRate}
        />
      )}
    </div>
  );
}
