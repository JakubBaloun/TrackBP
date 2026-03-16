import { Card } from "../ui";
import { formatDuration, formatDistance, formatCalories } from "../../utils/formatters";

const icons = {
  activities: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  duration: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  distance: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  calories: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  ),
};

const colors = {
  activities: "bg-blue-50 text-blue-600",
  duration: "bg-purple-50 text-purple-600",
  distance: "bg-green-50 text-green-600",
  calories: "bg-orange-50 text-orange-600",
};

function StatItem({ label, value, color }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          {icons[color]}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default function StatsOverview({ stats, children }) {
  if (!stats) return null;

  const { thisMonth } = stats;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatItem
        color="activities"
        label="This Month"
        value={`${thisMonth?.count || 0} activities`}
      />
      <StatItem
        color="duration"
        label="Total Time"
        value={formatDuration(thisMonth?.duration || 0)}
      />
      <StatItem
        color="distance"
        label="Distance"
        value={formatDistance(thisMonth?.distance || 0)}
      />
      {children || (
        <StatItem
          color="calories"
          label="Calories"
          value={formatCalories(thisMonth?.calories || 0)}
        />
      )}
    </div>
  );
}
