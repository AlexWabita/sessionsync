import type { UserPrefs } from "../../domain/prefs";

export interface PrefsRepo {
  load(): Promise<UserPrefs>;
  save(prefs: UserPrefs): Promise<void>;
  clear(): Promise<void>;
}
