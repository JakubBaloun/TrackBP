import { useState, useCallback } from "react";
import HeartRateChart from "./HeartRateChart";
import PaceChart from "./PaceChart";

const RUNNING_SPORTS = ["RUNNING", "TRAIL_RUNNING", "TREADMILL_RUNNING", "TRACK_AND_FIELD_RUNNING"];

export default function ActivityCharts({ samples, duration, onHoverIndex, sport }) {
  const [hoverTime, setHoverTime] = useState(null);

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

  if (!hasHeartRate && !hasSpeed) {
    return null;
  }

  return (
    <div className="space-y-4">
      {hasHeartRate && (
        <HeartRateChart
          samples={samples.heartRate}
          duration={duration}
          hoverTime={hoverTime}
          onHoverTime={handleHoverTime}
        />
      )}

      {hasSpeed && (
        <PaceChart
          samples={samples.speed}
          duration={duration}
          hoverTime={hoverTime}
          onHoverTime={handleHoverTime}
          isRunning={isRunning}
        />
      )}
    </div>
  );
}
