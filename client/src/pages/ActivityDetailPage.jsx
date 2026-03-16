import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getActivity, updateActivity, deleteActivity } from "../api/activities";
import { PageLayout } from "../components/layout";
import { Card, CardBody, Button, Input, Textarea, Alert, FullPageSpinner, ConfirmModal, useToast } from "../components/ui";
import { FeelingSelector, feelingLabels } from "../components/activity";
import { feelingEmojis } from "../components/activity/FeelingSelector";
import { ChartLoader, MapLoader } from "../components/charts";

// Lazy load heavy chart components
const ActivityCharts = lazy(() => import("../components/charts/ActivityCharts"));
const ZonesChart = lazy(() => import("../components/charts/ZonesChart"));
const RouteMap = lazy(() => import("../components/charts/RouteMap"));
import { formatDuration, formatDateTime, formatDistance, formatCalories, formatHeartRate, formatPace } from "../utils/formatters";

export default function ActivityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", feeling: -1 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(null);
  const [chartIndex, setChartIndex] = useState(null);

  const handleChartHover = (ratio, index) => {
    setHoverPosition(ratio);
    setChartIndex(index);
  };

  useEffect(() => {
    loadActivity();
  }, [id]);

  const loadActivity = async () => {
    try {
      const data = await getActivity(id);
      setActivity(data);
      setEditForm({
        title: data.title || "",
        description: data.description || "",
        feeling: data.feeling ?? -1,
      });
    } catch {
      setError("Failed to load activity");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updated = await updateActivity(id, editForm);
      setActivity(updated);
      setEditing(false);
      toast.success("Activity updated successfully");
    } catch {
      toast.error("Failed to update activity");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteActivity(id);
      toast.success("Activity deleted");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to delete activity");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <FullPageSpinner />;
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Alert className="mb-4">{error || "Activity not found"}</Alert>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      {/* Navigation bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        {!editing && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        )}
      </div>
        {/* Title & Edit Form */}
        {editing ? (
          <Card className="mb-6">
            <CardBody>
              <EditForm
                form={editForm}
                onChange={setEditForm}
                onSave={handleSave}
                onCancel={() => setEditing(false)}
              />
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {activity.title || activity.detailedSport || activity.sport}
              </h1>
              <p className="text-gray-500 mt-1">{formatDateTime(activity.startTime)}</p>
            </div>

            {/* Stats Row + Feeling */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <Card className="lg:col-span-3">
                <CardBody className="p-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    <StatBox
                      label="Duration"
                      value={formatDuration(activity.duration)}
                      icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <StatBox
                      label="Distance"
                      value={formatDistance(activity.stats?.distance)}
                      icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    />
                    <StatBox
                      label="Avg HR"
                      value={formatHeartRate(activity.stats?.avgHeartRate)}
                      icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                    />
                    <StatBox
                      label={activity.stats?.distance > 0 ? "Avg Pace" : "Calories"}
                      value={activity.stats?.distance > 0
                        ? formatPace(activity.stats.distance / activity.duration)
                        : formatCalories(activity.stats?.calories)}
                      icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Feeling & Notes */}
              <Card>
                <CardBody className="flex flex-col justify-center h-full">
                  {activity.feeling > 0 ? (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{feelingEmojis[activity.feeling]}</span>
                      <span className="text-gray-600 font-medium">{feelingLabels[activity.feeling]}</span>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm mb-1">No feeling set</div>
                  )}
                  {activity.description ? (
                    <p className="text-gray-500 text-sm line-clamp-2">{activity.description}</p>
                  ) : (
                    <p className="text-gray-300 text-sm">No notes</p>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Map + Zones Row - only show if we have data */}
            {(activity.route?.coordinates?.length > 0 || activity.zones?.length > 0) && (
              <div className={`grid grid-cols-1 gap-6 mb-6 ${
                activity.route?.coordinates?.length > 0 && activity.zones?.length > 0
                  ? "lg:grid-cols-3"
                  : ""
              }`}>
                {/* Route Map */}
                {activity.route?.coordinates?.length > 0 && (
                  <Card className={activity.zones?.length > 0 ? "lg:col-span-2" : ""}>
                    <CardBody>
                      <Suspense fallback={<MapLoader />}>
                        <RouteMap route={activity.route} hoverPosition={hoverPosition} />
                      </Suspense>
                    </CardBody>
                  </Card>
                )}

                {/* Heart Rate Zones */}
                {activity.zones?.length > 0 && (
                  <Card>
                    <CardBody>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                        Heart Rate Zones
                      </h3>
                      <Suspense fallback={<ChartLoader height="h-48" />}>
                        <ZonesChart zones={activity.zones} compact />
                      </Suspense>
                    </CardBody>
                  </Card>
                )}
              </div>
            )}

            {/* Activity Charts - only show if we have samples */}
            {(activity.samples?.heartRate?.length > 0 || activity.samples?.speed?.length > 0) && (
              <Card className="mb-6">
                <CardBody>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Activity Details
                  </h3>
                  <Suspense fallback={<ChartLoader height="h-48" />}>
                    <ActivityCharts
                      samples={activity.samples}
                      duration={activity.duration}
                      onHoverIndex={handleChartHover}
                      activeIndex={chartIndex}
                      sport={activity.sport}
                    />
                  </Suspense>
                </CardBody>
              </Card>
            )}

          </>
        )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Activity"
        message="Are you sure you want to delete this activity? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </PageLayout>
  );
}

function StatBox({ label, value, icon }) {
  return (
    <div className="p-4 text-center">
      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function EditForm({ form, onChange, onSave, onCancel }) {
  return (
    <div className="space-y-5">
      <Input
        label="Title"
        value={form.title}
        onChange={(e) => onChange({ ...form, title: e.target.value })}
        placeholder="Activity title"
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => onChange({ ...form, description: e.target.value })}
        rows={3}
        placeholder="Add notes about this activity..."
      />
      <FeelingSelector
        value={form.feeling}
        onChange={(feeling) => onChange({ ...form, feeling })}
      />
      <div className="flex gap-3 pt-2">
        <Button onClick={onSave}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Changes
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
