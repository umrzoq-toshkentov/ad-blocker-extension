import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Register happy-dom once — guarded so multiple test files don't double-register
const g = globalThis as Record<string, unknown>;
if (!g.__happyDomRegistered__) {
  GlobalRegistrator.register();
  g.__happyDomRegistered__ = true;
}
