import type { PrefsRepo } from "../../application/repositories/PrefsRepo";
import { DEFAULT_PREFS, type UserPrefs } from "../../domain/prefs";
import { parseUserPrefs } from "../../domain/validation/prefs";
import type { KeyValueStorage } from "./KeyValueStorage";

const PREFS_KEY = "sessionsync:prefs:v1";

/**
 * Local-first prefs repo with repair:
 * - Missing => DEFAULT_PREFS
 * - Invalid/corrupt => DEFAULT_PREFS
 *
 * Later we can add merging/migrations, but we start safe.
 */
export class LocalStoragePrefsRepo implements PrefsRepo {
  constructor(private readonly storage: KeyValueStorage) {}

  async load(): Promise<UserPrefs> {
    const raw = this.storage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;

    try {
      const parsedJson = JSON.parse(raw);
      return parseUserPrefs(parsedJson);
    } catch {
      // repair
      return DEFAULT_PREFS;
    }
  }

  async save(prefs: UserPrefs): Promise<void> {
    // validate before saving (defensive)
    const safe = parseUserPrefs(prefs);
    this.storage.setItem(PREFS_KEY, JSON.stringify(safe));
  }

  async clear(): Promise<void> {
    this.storage.removeItem(PREFS_KEY);
  }
}
