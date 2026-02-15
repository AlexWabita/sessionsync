import type { KeyValueStorage } from "./KeyValueStorage";

/**
 * Browser localStorage adapter (only use in browser runtime).
 * In tests we use MemoryStorage.
 */
export class BrowserLocalStorage implements KeyValueStorage {
  constructor(private readonly ls: Storage) {}

  getItem(key: string): string | null {
    return this.ls.getItem(key);
  }
  setItem(key: string, value: string): void {
    this.ls.setItem(key, value);
  }
  removeItem(key: string): void {
    this.ls.removeItem(key);
  }
}
