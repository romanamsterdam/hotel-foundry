// Minimal browser globals so client code doesn't crash under Node during seeding.
declare global {
  // eslint-disable-next-line no-var
  var localStorage: any;
  // eslint-disable-next-line no-var
  var window: any;
  // eslint-disable-next-line no-var
  var document: any;
}

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
}
if (typeof globalThis.window === "undefined") globalThis.window = globalThis;
if (typeof globalThis.document === "undefined") globalThis.document = {};