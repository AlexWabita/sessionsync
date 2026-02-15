"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";

import TopNav from "@/ui/components/TopNav";
import { BrowserLocalStorage, LocalStoragePrefsRepo } from "@/infrastructure/storage";
import { loadPrefs } from "@/application/useCases/prefs";
import { DEFAULT_PREFS } from "@/domain/prefs";

type IntlWithSupportedValues = typeof Intl & {
  supportedValuesOf?: (key: "timeZone") => string[];
};

type RepoLike = {
  save?: (prefs: unknown) => Promise<void> | void;
  set?: (prefs: unknown) => Promise<void> | void;
  write?: (prefs: unknown) => Promise<void> | void;
  put?: (prefs: unknown) => Promise<void> | void;
};

function normalizeZoneInput(input: string): string {
  const raw = input.trim();
  if (!raw) return raw;

  const upper = raw.toUpperCase();
  if (upper === "UTC") return "Etc/UTC";
  if (upper === "GMT") return "Etc/GMT";
  if (upper === "EAT") return "Africa/Nairobi";
  if (upper === "ETC/UTC") return "Etc/UTC";
  if (upper === "ETC/GMT") return "Etc/GMT";
  return raw;
}

function isValidIanaZone(zone: string): boolean {
  const z = normalizeZoneInput(zone);
  if (!z.trim()) return false;
  return DateTime.now().setZone(z).isValid;
}

function uniqZones(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const z0 of list) {
    const z = normalizeZoneInput(z0);
    if (!z) continue;
    if (seen.has(z)) continue;
    if (!isValidIanaZone(z)) continue;
    seen.add(z);
    out.push(z);
  }
  return out;
}

async function persistPrefs(repo: LocalStoragePrefsRepo, prefs: unknown) {
  const r = repo as unknown as RepoLike;

  if (typeof r.save === "function") return void (await r.save(prefs));
  if (typeof r.set === "function") return void (await r.set(prefs));
  if (typeof r.write === "function") return void (await r.write(prefs));
  if (typeof r.put === "function") return void (await r.put(prefs));

  throw new Error("Prefs repo has no recognized save method (save/set/write/put).");
}

function getZonesFromPrefs(p: unknown): { displayZone: string; pinnedClocks: string[] } {
  const rec = p as Record<string, unknown>;

  const dzRaw =
    typeof rec.displayZone === "string" && (rec.displayZone as string).trim()
      ? (rec.displayZone as string)
      : "Africa/Nairobi";

  const displayZone = normalizeZoneInput(dzRaw);

  const pcRaw = rec.pinnedClocks;
  const fallback = ["Africa/Nairobi", "Europe/London", "America/New_York", "Etc/UTC"];
  const pinned =
    Array.isArray(pcRaw) && pcRaw.every((x) => typeof x === "string")
      ? uniqZones(pcRaw as string[])
      : uniqZones(fallback);

  return { displayZone, pinnedClocks: pinned.length ? pinned : uniqZones(["Africa/Nairobi"]) };
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

export default function SettingsClient() {
  const [repo] = useState<LocalStoragePrefsRepo | null>(() => {
    if (typeof window === "undefined") return null;
    const storage = new BrowserLocalStorage(window.localStorage);
    return new LocalStoragePrefsRepo(storage);
  });

  const [prefs, setPrefs] = useState<unknown | null>(null);

  // Display zone editor
  const [tzQuery, setTzQuery] = useState<string>("");
  const [tzValue, setTzValue] = useState<string>("Africa/Nairobi");
  const [tzError, setTzError] = useState<string | null>(null);
  const [tzStatus, setTzStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [tzStatusMsg, setTzStatusMsg] = useState<string>("");

  // Pinned clocks editor
  const [clockQuery, setClockQuery] = useState<string>("");
  const [clockError, setClockError] = useState<string | null>(null);
  const [pinnedClocks, setPinnedClocks] = useState<string[]>(["Africa/Nairobi", "Etc/UTC"]);
  const [clocksStatus, setClocksStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [clocksStatusMsg, setClocksStatusMsg] = useState<string>("");

  // Live tick for clocks (proper approach: state with effect)
  const [now, setNow] = useState<DateTime>(() => DateTime.now());
  useEffect(() => {
    const id = setInterval(() => setNow(DateTime.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Browser zone list
  const allZones = useMemo(() => {
    if (typeof Intl === "undefined") return [] as string[];
    const intl = Intl as IntlWithSupportedValues;
    const list = intl.supportedValuesOf?.("timeZone") ?? [];
    return Array.isArray(list) ? list : [];
  }, []);

  // Global-ish curated defaults (for "not Africa-only")
  const curated = useMemo(
    () => [
      "Etc/UTC",
      "Europe/London",
      "Europe/Berlin",
      "America/New_York",
      "America/Chicago",
      "America/Los_Angeles",
      "Asia/Dubai",
      "Asia/Kolkata",
      "Asia/Singapore",
      "Asia/Tokyo",
      "Australia/Sydney",
      "Africa/Nairobi",
    ],
    []
  );

  const augmentedZones = useMemo(() => {
    const set = new Set<string>();
    for (const z of curated) set.add(z);
    for (const z of allZones) set.add(z);
    return Array.from(set);
  }, [allZones, curated]);

  const displayZoneSuggestions = useMemo(() => {
    const q = tzQuery.trim().toLowerCase();
    if (!q) {
      // show curated suggestions first
      return curated.filter(isValidIanaZone).slice(0, 12);
    }
    return augmentedZones
      .filter((z) => z.toLowerCase().includes(q))
      .slice(0, 20);
  }, [augmentedZones, curated, tzQuery]);

  const clockSuggestions = useMemo(() => {
    const q = clockQuery.trim().toLowerCase();
    if (!q) {
      // show a small random mix from curated + a few extra
      const base = uniqZones(curated).filter(isValidIanaZone);
      return shuffle(base).slice(0, 10);
    }
    return augmentedZones
      .filter((z) => z.toLowerCase().includes(q))
      .slice(0, 20);
  }, [augmentedZones, curated, clockQuery]);

  useEffect(() => {
    if (!repo) return;

    let mounted = true;
    (async () => {
      const p = await loadPrefs(repo).catch(() => DEFAULT_PREFS);
      if (!mounted) return;

      const parsed = getZonesFromPrefs(p);

      setPrefs(p);
      setTzValue(parsed.displayZone);
      setTzQuery(parsed.displayZone);
      setPinnedClocks(parsed.pinnedClocks);

      setTzError(null);
      setClockError(null);
      setTzStatus("idle");
      setClocksStatus("idle");
      setTzStatusMsg("");
      setClocksStatusMsg("");
    })();

    return () => {
      mounted = false;
    };
  }, [repo]);

  function onPickDisplayZone(z0: string) {
    const z = normalizeZoneInput(z0);
    setTzQuery(z0);
    setTzValue(z);
    setTzError(isValidIanaZone(z) ? null : "Invalid IANA timezone.");
    setTzStatus("idle");
    setTzStatusMsg("");
  }

  function addClock(zone0: string) {
    const z = normalizeZoneInput(zone0);
    if (!z) return;

    if (!isValidIanaZone(z)) {
      setClockError('Invalid IANA timezone (tip: type "UTC" for Etc/UTC).');
      return;
    }

    const next = uniqZones([...pinnedClocks, z]);
    setPinnedClocks(next.length ? next : pinnedClocks);
    setClockQuery("");
    setClockError(null);
    setClocksStatus("idle");
    setClocksStatusMsg("");
  }

  function removeClock(zone: string) {
    if (pinnedClocks.length <= 1) return;
    const next = pinnedClocks.filter((z) => z !== zone);
    setPinnedClocks(next.length ? next : ["Africa/Nairobi"]);
    setClocksStatus("idle");
    setClocksStatusMsg("");
  }

  function moveClock(index: number, dir: -1 | 1) {
    const next = pinnedClocks.slice();
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[index];
    next[index] = next[j];
    next[j] = tmp;
    setPinnedClocks(next);
    setClocksStatus("idle");
    setClocksStatusMsg("");
  }

  async function saveDisplayZone() {
    if (!repo || !prefs) return;

    setTzStatus("saving");
    setTzStatusMsg("");

    const displayZone = normalizeZoneInput(tzValue);
    if (!isValidIanaZone(displayZone)) {
      setTzError("Invalid IANA timezone.");
      setTzStatus("error");
      setTzStatusMsg("Fix the display timezone and try again.");
      return;
    }

    const nextPrefs = {
      ...(prefs as Record<string, unknown>),
      displayZone,
    };

    try {
      await persistPrefs(repo, nextPrefs);
      setPrefs(nextPrefs);
      setTzValue(displayZone);
      setTzQuery(displayZone);
      setTzStatus("saved");
      setTzStatusMsg("Saved.");
      setTimeout(() => setTzStatus("idle"), 1200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save display timezone.";
      setTzStatus("error");
      setTzStatusMsg(msg);
    }
  }

  async function savePinnedClocks() {
    if (!repo || !prefs) return;

    setClocksStatus("saving");
    setClocksStatusMsg("");

    const clocksFinal = uniqZones(pinnedClocks);
    if (clocksFinal.length === 0) {
      setClockError("Add at least one pinned clock.");
      setClocksStatus("error");
      setClocksStatusMsg("Fix pinned clocks and try again.");
      return;
    }

    const nextPrefs = {
      ...(prefs as Record<string, unknown>),
      pinnedClocks: clocksFinal,
    };

    try {
      await persistPrefs(repo, nextPrefs);
      setPrefs(nextPrefs);
      setPinnedClocks(clocksFinal);
      setClocksStatus("saved");
      setClocksStatusMsg("Saved.");
      setTimeout(() => setClocksStatus("idle"), 1200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save pinned clocks.";
      setClocksStatus("error");
      setClocksStatusMsg(msg);
    }
  }

  if (!repo || !prefs) {
    return (
      <div>
        <TopNav />
        <div className="p-4 sm:p-6">
          <div className="text-sm opacity-70">Loading…</div>
        </div>
      </div>
    );
  }

  const displayPreviewZone = isValidIanaZone(tzValue) ? normalizeZoneInput(tzValue) : "Africa/Nairobi";
  const previewNow = now.setZone(displayPreviewZone);

  return (
    <div>
      <TopNav />
      <div className="p-4 sm:p-6 space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm opacity-70">Display timezone affects schedules; pinned clocks are your custom list.</p>
        </header>

        {/* Display timezone */}
        <section className="rounded-2xl border p-5 space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Display Timezone</div>
            <div className="text-sm opacity-70">
              Tip: type <span className="font-mono">UTC</span> to map to <span className="font-mono">Etc/UTC</span>.
            </div>
          </div>

          <div className="space-y-2">
            <input
              value={tzQuery}
              onChange={(e) => {
                const raw = e.target.value;
                const normalized = normalizeZoneInput(raw);
                setTzQuery(raw);
                setTzValue(normalized);
                setTzError(raw.trim() ? (isValidIanaZone(normalized) ? null : "Invalid IANA timezone.") : "Timezone is required.");
                setTzStatus("idle");
                setTzStatusMsg("");
              }}
              placeholder='Search (e.g. "Africa/Nairobi", "UTC", "Europe/London")…'
              className="w-full rounded-xl border px-3 py-2 text-sm"
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
            />

            {tzError && <div className="text-sm text-red-600">{tzError}</div>}

            <div className="rounded-xl border overflow-hidden">
              <div className="p-3 text-xs opacity-70 border-b flex items-center justify-between"><span>Suggestions</span><span>Showing {displayZoneSuggestions.length}</span></div>
              <div className="max-h-64 overflow-auto">
                {displayZoneSuggestions.length === 0 ? (
                  <div className="p-3 text-sm opacity-70">No suggestions found.</div>
                ) : (
                  displayZoneSuggestions.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => onPickDisplayZone(z)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-black/5"
                    >
                      <span className="font-mono">{z}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-xs opacity-70">Display zone clock</div>
              <div className="mt-1 text-xl font-semibold">{previewNow.toFormat("HH:mm:ss")}</div>
              <div className="mt-1 text-sm opacity-70 font-mono">{displayPreviewZone}</div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={saveDisplayZone}
                disabled={tzStatus === "saving"}
                className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {tzStatus === "saving" ? "Saving…" : "Save display timezone"}
              </button>

              {tzStatus !== "idle" && (
                <div
                  className={[
                    "text-sm",
                    tzStatus === "saved" ? "text-green-700" : tzStatus === "error" ? "text-red-600" : "opacity-70",
                  ].join(" ")}
                >
                  {tzStatusMsg || (tzStatus === "saved" ? "Saved." : tzStatus === "error" ? "Error." : "")}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Pinned clocks */}
        <section className="rounded-2xl border p-5 space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Pinned clocks</div>
            <div className="text-sm opacity-70">Add, remove, and reorder independently from the display timezone.</div>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <div className="p-3 text-xs opacity-70 border-b">Current</div>
            <div className="divide-y">
              {pinnedClocks.map((z, idx) => (
                <div key={z} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-sm truncate">{z}</div>
                    <div className="text-xs opacity-70">{now.setZone(z).toFormat("HH:mm:ss")}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveClock(idx, -1)}
                      disabled={idx === 0}
                      className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveClock(idx, 1)}
                      disabled={idx === pinnedClocks.length - 1}
                      className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeClock(z)}
                      disabled={pinnedClocks.length <= 1}
                      className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
                      title={pinnedClocks.length <= 1 ? "Keep at least one clock" : "Remove"}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Add clock</div>
            <input
              value={clockQuery}
              onChange={(e) => {
                const raw = e.target.value;
                setClockQuery(raw);
                const normalized = normalizeZoneInput(raw);
                setClockError(raw.trim() ? (isValidIanaZone(normalized) ? null : "Invalid IANA timezone.") : null);
                setClocksStatus("idle");
                setClocksStatusMsg("");
              }}
              placeholder='Type any IANA timezone (try "UTC", "Asia/Tokyo")…'
              className="w-full rounded-xl border px-3 py-2 text-sm"
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
            />
            {clockError && <div className="text-sm text-red-600">{clockError}</div>}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addClock(clockQuery)}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                Add
              </button>
              <div className="text-xs opacity-70">Duplicates are ignored.</div>
            </div>

            <div className="rounded-xl border overflow-hidden">
              <div className="p-3 text-xs opacity-70 border-b flex items-center justify-between"><span>Suggestions</span><span>Showing {clockSuggestions.length}</span></div>
              <div className="max-h-64 overflow-auto">
                {clockSuggestions.length === 0 ? (
                  <div className="p-3 text-sm opacity-70">No suggestions found.</div>
                ) : (
                  clockSuggestions.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => addClock(z)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-black/5"
                    >
                      <span className="font-mono">{z}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={savePinnedClocks}
              disabled={clocksStatus === "saving"}
              className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {clocksStatus === "saving" ? "Saving…" : "Save pinned clocks"}
            </button>

            {clocksStatus !== "idle" && (
              <div
                className={[
                  "text-sm",
                  clocksStatus === "saved" ? "text-green-700" : clocksStatus === "error" ? "text-red-600" : "opacity-70",
                ].join(" ")}
              >
                {clocksStatusMsg || (clocksStatus === "saved" ? "Saved." : clocksStatus === "error" ? "Error." : "")}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

