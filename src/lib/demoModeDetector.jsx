// Detect if data is from demo/mock data vs live database
export function isDemoMode(dataSource) {
  // If dbReviews/dbProfessionals are empty and we're falling back to DEMO data
  return dataSource === "demo";
}

export function DemoBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
      Demo Preview
    </div>
  );
}

export function DemoNotice() {
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800 space-y-1.5">
      <p className="font-bold flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Demo Mode Preview
      </p>
      <p>You're viewing demo data. Submissions are fully functional and will be saved to your database once backend integration is complete.</p>
    </div>
  );
}