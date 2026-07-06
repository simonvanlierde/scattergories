// localStorage can throw (SecurityError with site data blocked, QuotaExceededError
// when full, ReferenceError in SSR); treat persistence as best-effort everywhere.
const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Best-effort: the in-memory state stays authoritative.
    }
  },
};

export { safeStorage };
