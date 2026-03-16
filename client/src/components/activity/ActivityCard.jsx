import { Link } from "react-router-dom";
import { SportIcon } from "../ui";
import {
  formatDuration,
  formatDateTime,
  formatDistance,
  formatHeartRate,
} from "../../utils/formatters";

export default function ActivityCard({ activity }) {
  const sport = activity.detailedSport || activity.sport;

  return (
    <Link
      to={`/activity/${activity._id}`}
      className="group flex items-center gap-4 p-5 hover:bg-gray-50/80 transition-colors"
    >
      <SportIcon sport={sport} size="lg" />

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {activity.title || sport || "Activity"}
        </h3>
        <p className="text-sm text-gray-500">
          {formatDateTime(activity.startTime)}
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Duration</p>
          <p className="font-medium text-gray-900">{formatDuration(activity.duration)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Distance</p>
          <p className="font-medium text-gray-900">{formatDistance(activity.stats?.distance)}</p>
        </div>
        {activity.stats?.avgHeartRate && (
          <div className="text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Avg HR</p>
            <p className="font-medium text-gray-900">{formatHeartRate(activity.stats.avgHeartRate)}</p>
          </div>
        )}
      </div>

      {/* Mobile stats */}
      <div className="sm:hidden text-right">
        <p className="font-medium text-gray-900">{formatDuration(activity.duration)}</p>
        <p className="text-sm text-gray-500">{formatDistance(activity.stats?.distance)}</p>
      </div>

      <svg
        className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
