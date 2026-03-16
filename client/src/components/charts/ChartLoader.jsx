export default function ChartLoader({ height = "h-48" }) {
  return (
    <div className={`${height} bg-gray-50 rounded-xl animate-pulse flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-xs">Loading...</span>
      </div>
    </div>
  );
}

export function MapLoader() {
  return (
    <div className="h-64 bg-gray-50 rounded-xl animate-pulse flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <span className="text-sm">Loading map...</span>
      </div>
    </div>
  );
}
