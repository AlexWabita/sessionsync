import type { PrefsRepo } from "../repositories/PrefsRepo";
import type { UserPrefs } from "../../domain/prefs";

export async function loadPrefs(repo: PrefsRepo): Promise<UserPrefs> {
  return repo.load();
}

export async function savePrefs(repo: PrefsRepo, prefs: UserPrefs): Promise<void> {
  return repo.save(prefs);
}
