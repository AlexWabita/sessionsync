import { describe, it, expect } from "vitest";
import { DEFAULT_PREFS } from "../prefs/types";
import { MemoryStorage, LocalStoragePrefsRepo } from "../../infrastructure/storage";

describe("LocalStoragePrefsRepo", () => {
  it("returns DEFAULT_PREFS when storage empty", async () => {
    const repo = new LocalStoragePrefsRepo(new MemoryStorage());
    const prefs = await repo.load();
    expect(prefs.displayZone).toBe(DEFAULT_PREFS.displayZone);
  });

  it("saves and loads round-trip", async () => {
    const store = new MemoryStorage();
    const repo = new LocalStoragePrefsRepo(store);

    const custom = { ...DEFAULT_PREFS, displayZone: "UTC" as const };
    await repo.save(custom);
    const loaded = await repo.load();

    expect(loaded.displayZone).toBe("UTC");
    expect(loaded.enabledSessions.length).toBe(4);
  });

  it("repairs corrupt JSON by returning DEFAULT_PREFS", async () => {
    const store = new MemoryStorage();
    // @ts-expect-error (intentional)
    store.setItem("sessionsync:prefs:v1", "{not-json");
    const repo = new LocalStoragePrefsRepo(store);

    const loaded = await repo.load();
    expect(loaded.displayZone).toBe(DEFAULT_PREFS.displayZone);
  });

  it("repairs invalid prefs shape by returning DEFAULT_PREFS", async () => {
    const store = new MemoryStorage();
    store.setItem("sessionsync:prefs:v1", JSON.stringify({ hello: "world" }));
    const repo = new LocalStoragePrefsRepo(store);

    const loaded = await repo.load();
    expect(loaded.displayZone).toBe(DEFAULT_PREFS.displayZone);
  });

  it("clear removes stored prefs", async () => {
    const store = new MemoryStorage();
    const repo = new LocalStoragePrefsRepo(store);

    await repo.save(DEFAULT_PREFS);
    await repo.clear();

    const loaded = await repo.load();
    expect(loaded.displayZone).toBe(DEFAULT_PREFS.displayZone);
  });
});


