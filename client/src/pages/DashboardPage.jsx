import { useState, useEffect } from "react";
import { getActivities, syncActivities, getStats } from "../api/activities";
import { getPolarStatus, getPolarConnectUrl } from "../api/polar";
import { PageLayout } from "../components/layout";
import { Alert, FullPageSpinner, useToast } from "../components/ui";
import { ActivityList, StatsOverview } from "../components/activity";
import { PolarConnectionCard } from "../components/polar";
import { VolumeChart } from "../components/charts";

const PAGE_SIZE = 10;

export default function DashboardPage() {
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState(null);
  const [polarStatus, setPolarStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      const [activitiesData, statusData, statsData] = await Promise.all([
        getActivities({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
        getPolarStatus(),
        getStats().catch(() => null),
      ]);
      setActivities(activitiesData.activities);
      setTotal(activitiesData.total);
      setPolarStatus(statusData);
      setStats(statsData);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPolar = async () => {
    try {
      const { authorizationUrl } = await getPolarConnectUrl();
      window.location.href = authorizationUrl;
    } catch {
      setError("Failed to get Polar connect URL");
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError("");
    try {
      const result = await syncActivities();
      if (result.syncedCount > 0) {
        setPage(0);
        await loadData();
        toast.success(`Synced ${result.syncedCount} new activities`);
      } else {
        toast.info("No new activities to sync");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <FullPageSpinner />;
  }

  return (
    <PageLayout>
      {error && <Alert className="mb-4">{error}</Alert>}

      <StatsOverview stats={stats}>
        <PolarConnectionCard
          connected={polarStatus?.connected}
          syncing={syncing}
          onConnect={handleConnectPolar}
          onSync={handleSync}
          compact
        />
      </StatsOverview>

      {stats?.recentTrend?.some((d) => d.dailyDistance > 0) && (
        <div className="mb-6">
          <VolumeChart recentTrend={stats.recentTrend} />
        </div>
      )}

      <ActivityList
        activities={activities}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </PageLayout>
  );
}
