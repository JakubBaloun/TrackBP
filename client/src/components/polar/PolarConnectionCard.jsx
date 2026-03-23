import { Card, CardBody, Button } from "../ui";

const PolarLogo = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
  </svg>
);

export default function PolarConnectionCard({
  connected,
  syncing,
  onConnect,
  onSync,
  compact = false,
}) {
  if (compact) {
    return (
      <Card className="overflow-hidden h-full">
        <div className={`h-1 ${connected ? "bg-green-500" : "bg-gray-200"}`} />
        <CardBody className="flex flex-col justify-center h-full p-3 sm:p-5">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className={`p-2 rounded-lg flex-shrink-0 ${connected ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                <PolarLogo />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 text-sm">Polar</h2>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className="text-xs text-gray-500 truncate">
                    {connected ? "Connected" : "Not connected"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              {connected ? (
                <Button onClick={onSync} loading={syncing} variant="secondary" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              ) : (
                <Button onClick={onConnect} size="sm">
                  Connect
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mb-6 overflow-hidden">
      <div className={`h-1 ${connected ? "bg-green-500" : "bg-gray-200"}`} />
      <CardBody className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${connected ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
            <PolarLogo />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Polar</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-sm text-gray-500">
                {connected ? "Connected" : "Not connected"}
              </span>
            </div>
          </div>
        </div>

        {connected ? (
          <Button onClick={onSync} loading={syncing} variant="secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? "Syncing..." : "Sync"}
          </Button>
        ) : (
          <Button onClick={onConnect}>
            Connect Account
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
