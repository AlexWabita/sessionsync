"use client";

import TopNav from "@/ui/components/TopNav";

export default function AlertsClient() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="p-6 max-w-3xl space-y-2">
        <h1 className="text-xl font-semibold">Alerts</h1>
        <p className="text-sm opacity-70">
          Alerts are temporarily disabled while the preferences contract stabilizes.
        </p>
      </main>
    </div>
  );
}
