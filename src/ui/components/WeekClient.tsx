"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { BrowserLocalStorage, LocalStoragePrefsRepo } from "@/infrastructure/storage";
import { loadPrefs } from "@/application/useCases/prefs";
import { getScheduleForDate } from "@/application/useCases/getScheduleForDate";
import { DEFAULT_PREFS } from "@/domain/prefs";
import type { ISODate } from "@/domain/time";
import TopNav from "@/ui/components/TopNav";

type DayCard = {
  isoDate: string;
  weekday: string;
  sessions: { label: string; open: string; close: string }[];
  overlap?: { label: string; start: string; end: string };
};

function fmtInZone(iso: string, zone: string) {
  return DateTime.fromISO(iso).setZone(zone).toFormat("HH:mm");
}

export default function WeekClient() {
  // SSR-safe repo init (no setState-in-effect)
  const [repo] = useState<LocalStoragePrefsRepo | null>(() => {
    if (typeof window === "undefined") return null;
    const storage = new BrowserLocalStorage(window.localStorage);
    return new LocalStoragePrefsRepo(storage);
  });

  const [days, setDays] = useState<DayCard[] | null>(null);
  const [displayZone, setDisplayZone] = useState<string>("Africa/Nairobi");

// UI ticker (for header clock)
const [now, setNow] = useState<DateTime>(() => DateTime.now());
useEffect(() => {
  const id = setInterval(() => setNow(DateTime.now()), 1000);
  return () => clearInterval(id);
}, []);useEffect(() => {
    if (!repo) return;

    let mounted = true;

    (async () => {
      const prefs = await loadPrefs(repo).catch(() => DEFAULT_PREFS);
      const zone = prefs.displayZone;

      const start = DateTime.now().setZone(zone).startOf("day");

      const cards: DayCard[] = [];
      for (let i = 0; i < 7; i++) {
        const d = start.plus({ days: i });
        const iso = d.toISODate()!;

        const schedule = getScheduleForDate({
          prefs,
          displayDate: iso as ISODate,
        });

        const overlap = schedule.overlaps[0];

        cards.push({
          isoDate: iso,
          weekday: d.toFormat("ccc"),
          sessions: schedule.sessions.map((s) => ({
            label: s.label,
            open: fmtInZone(s.startISO, zone),
            close: fmtInZone(s.endISO, zone),
          })),
          overlap: overlap
            ? {
                label: overlap.label,
                start: fmtInZone(overlap.startISO, zone),
                end: fmtInZone(overlap.endISO, zone),
              }
            : undefined,
        });
      }

      if (mounted) {
        setDisplayZone(zone);
        setDays(cards);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [repo]);

  if (!repo || !days) {
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
  <h1 className="text-2xl font-semibold">Week</h1>
  <div className="text-sm opacity-70">
    Next 7 days · Display zone: <span className="font-medium">{displayZone}</span>
    <span className="mx-2">·</span>
    <span className="font-mono">{now.setZone(displayZone).toFormat("HH:mm:ss")}</span>
  </div>
</header>

        <div className="grid gap-4 lg:grid-cols-2">
          {days.map((d) => (
            <div key={d.isoDate} className="rounded-2xl border p-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <div className="text-lg font-semibold">
                  {d.weekday} <span className="opacity-70">({d.isoDate})</span>
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden">
                {/* Mobile (default) */}
                <div className="sm:hidden divide-y">
                  {d.sessions.map((s) => (
                    <div key={s.label} className="p-3">
                      <div className="text-sm font-semibold">{s.label}</div>
                      <div className="mt-1 text-sm opacity-80">
                        <span className="font-mono">{s.open}</span>
                        <span className="mx-2">→</span>
                        <span className="font-mono">{s.close}</span>
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
                      {d.sessions.map((s) => (
                        <tr key={s.label} className="border-b last:border-b-0">
                          <td className="p-3 font-medium">{s.label}</td>
                          <td className="p-3 font-mono">{s.open}</td>
                          <td className="p-3 font-mono">{s.close}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {d.overlap && (
                <div className="text-sm">
                  <span className="font-semibold">Overlap:</span>{" "}
                  {d.overlap.label}{" "}
                  <span className="font-mono">{d.overlap.start}</span>–<span className="font-mono">{d.overlap.end}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





