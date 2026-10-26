import { useEffect, useState } from "react";
// Single place that registers the offline service worker. Never runs in dev or Lovable previews.
const SW_URL = "/sw.js";

function isRefusedContext() {
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const h = window.location.hostname.toLowerCase();
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  if (/\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(h)) {
    const label = h.split(".")[0] ?? "";
    if (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label)) return true;
    if (/^project--.+-dev$/.test(label)) return true;
  }
  if (h === "id-preview--3a1562f7-4085-4395-baa3-159fa373d1be.lovable.app") return true;
  if (/(^|\.)lovableproject(-dev)?\.com$/.test(h)) return true;
  if (/(^|\.)beta\.lovable\.dev$/.test(h)) return true;
  return false;
}

async function unregisterAppWorkers() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs.filter((r) => r.active?.scriptURL.endsWith(SW_URL) || r.installing?.scriptURL.endsWith(SW_URL)).map((r) => r.unregister()),
  );
}

export async function setupOffline() {
  if (!("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    await unregisterAppWorkers().catch(() => {});
    return;
  }
  await navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {});
}

const KEY = "studia-saved-lessons";

export function getSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function toggleSaved(id: string, url: string): boolean {
  const list = getSaved();
  const on = !list.includes(id);
  localStorage.setItem(KEY, JSON.stringify(on ? [...list, id] : list.filter((x) => x !== id)));
  window.dispatchEvent(new Event("studia-saved"));
  // Warm the page cache so the lesson opens without internet later.
  if (on && "caches" in window) caches.open("studia-pages").then((c) => c.add(url)).catch(() => {});
  return on;
}


export function useSaved() {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setSaved(getSaved());
    sync();
    window.addEventListener("studia-saved", sync);
    return () => window.removeEventListener("studia-saved", sync);
  }, []);
  return saved;
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return online;
}
