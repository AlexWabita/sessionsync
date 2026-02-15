"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";

import { BrowserLocalStorage, LocalStoragePrefsRepo } from "@/infrastructure/storage";
import { loadPrefs } from "@/application/useCases/prefs";
import { getScheduleForDate } from "@/application/useCases/getScheduleForDate";
import { getNextEventsForUser } from "@/application/useCases/getNextEventsForUser";
import { DEFAULT_PREFS } from "@/domain/prefs";
import type { ISODate } from "@/domain/time";
import TopNav from "@/ui/components/TopNav";

type ViewModel = {
  displayZone: string;
  pinnedClocks: string[];
  todayISODate: string;
  sessions: { label: string; start: string; end: string }[];
  overlaps: { label: string; start: string; end: string }[];
  nextEvents: { label: string; at: string; kind: string }[];
};

function fmtInZone(iso: string, zone: string) {
  return DateTime.fromISO(iso).setZone(zone).toFormat("HH:mm");
}

export default function TodayClient() {
  const [now, setNow] = useState(() => DateTime.now());

  // SSR-safe repo init (no setState-in-effect)
  const [repo] = useState<LocalStoragePrefsRepo | null>(() => {
    if (typeof window === "undefined") return null;
    const storage = new BrowserLocalStorage(window.localStorage);
    return new LocalStoragePrefsRepo(storage);
  });

  const [vm, setVm] = useState<ViewModel | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(DateTime.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!repo) return;

    let mounted = true;

    (async () => {
      const prefs = await loadPrefs(repo).catch(() => DEFAULT_PREFS);
      const displayZone = prefs.displayZone;
      const todayISODate = DateTime.now().setZone(displayZone).toISODate()!;

      const schedule = getScheduleForDate({
        prefs,
        displayDate: todayISODate as ISODate,
      });

      const nowISO = now.setZone(displayZone).toISO()!;
      const nextEvents = getNextEventsForUser({
        prefs,
        nowISO,
        displayDate: todayISODate as ISODate,
        limit: 6,
      });

      const view: ViewModel = {
        displayZone,
        pinnedClocks: prefs.pinnedClocks,
        todayISODate,
        sessions: schedule.sessions.map((s) => ({
          label: s.label,
          start: fmtInZone(s.startISO, displayZone),
          end: fmtInZone(s.endISO, displayZone),
        })),
        overlaps: schedule.overlaps.map((o) => ({
          label: o.label,
          start: fmtInZone(o.startISO, displayZone),
          end: fmtInZone(o.endISO, displayZone),
        })),
        nextEvents: nextEvents.map((e) => ({
          label: e.label,
          at: fmtInZone(e.atISO, displayZone),
          kind: e.kind,
        })),
      };

      if (mounted) setVm(view);
    })();

    return () => {
      mounted = false;
    };
  }, [repo, now]);

  if (!repo || !vm) {
    return (
      <div>
        <TopNav />
        <div className="p-4 sm:p-6">
          <div className="text-sm opacity-70">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopNav />
      <div className="p-4 sm:p-6 space-y-8">
        <header className="space-y-1">
  <h1 className="text-2xl font-semibold">Today</h1>
  <div className="text-sm opacity-70">
    Display zone: <span className="font-medium">{vm.displayZone}</span>
    <span className="mx-2">·</span>
    <span className="font-mono">{now.setZone(vm.displayZone).toFormat("HH:mm:ss")}</span>
  </div>
</header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Clocks</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vm.pinnedClocks.map((z) => (
              <div key={z} className="rounded-xl border p-4">
                <div className="text-xs opacity-70">{z}</div>
                <div className="mt-1 text-xl font-semibold">
                  {now.setZone(z).toFormat("HH:mm:ss")}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Sessions</h2>

          <div className="rounded-xl border overflow-hidden">
            {/* Mobile (default) */}
            <div className="sm:hidden divide-y">
              {vm.sessions.map((s) => (
                <div key={s.label} className="p-3">
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="mt-1 text-sm opacity-80">
                    <span className="font-mono">{s.start}</span>
                    <span className="mx-2">→</span>
                    <span className="font-mono">{s.end}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet/Desktop */}
            <div className="hidden sm:block w-full overflow-x-auto">
              <table className="min-w-[520px] w-full text-sm">
                <thead className="opacity-70">
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Session</th>
                    <th className="text-left p-3 font-medium">Open</th>
                    <th className="text-left p-3 font-medium">Close</th>
                  </tr>
                </thead>
                <tbody>
                  {vm.sessions.map((s) => (
                    <tr key={s.label} className="border-b last:border-b-0">
                      <td className="p-3 font-medium">{s.label}</td>
                      <td className="p-3 font-mono">{s.start}</td>
                      <td className="p-3 font-mono">{s.end}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {vm.overlaps.length > 0 && (
            <div className="rounded-xl border p-4">
              <div className="text-sm font-semibold">Overlaps</div>
              <div className="mt-2 space-y-1 text-sm">
                {vm.overlaps.map((o) => (
                  <div key={o.label}>
                    <span className="font-medium">{o.label}:</span>{" "}
                    <span className="font-mono">{o.start}</span>–<span className="font-mono">{o.end}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Next up</h2>
          <div className="rounded-xl border p-4">
            <ul className="space-y-2 text-sm">
              {vm.nextEvents.map((e, idx) => (
                <li key={idx} className="flex items-center justify-between gap-3">
                  <span className="truncate">{e.label}</span>
                  <span className="font-mono">{e.at}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-xs opacity-70">
              (Notifications & settings editing come next — this is read-only UI v0.)
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


