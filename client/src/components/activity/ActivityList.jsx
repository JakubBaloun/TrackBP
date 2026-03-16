import ActivityCard from "./ActivityCard";
import Pagination from "./Pagination";
import { Card, CardHeader, EmptyState, Button } from "../ui";

export default function ActivityList({
  activities,
  total,
  page,
  pageSize,
  onPageChange,
  onSync,
  loading,
}) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
          <p className="text-sm text-gray-500">{total} total activities</p>
        </div>
      </CardHeader>

      {activities.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          title="No activities yet"
          description="Connect your Polar account and sync your activities to see them here."
          action={
            onSync && (
              <Button onClick={onSync} loading={loading}>
                Sync Activities
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <ActivityCard key={activity._id} activity={activity} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </Card>
  );
}
