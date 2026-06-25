import type { StoredTrip } from "@/lib/db/trips";

const CACHE_PREFIX = "tripmind:trip:";
const CACHE_INDEX_KEY = "tripmind:trip-index";
const MAX_CACHED_TRIPS = 50;

function cacheKey(id: string): string {
  return `${CACHE_PREFIX}${id}`;
}

function readIndex(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(ids.slice(0, MAX_CACHED_TRIPS)));
}

export function saveTripToClientCache(trip: StoredTrip): void {
  if (typeof window === "undefined") return;

  const serialized = JSON.stringify(trip);
  sessionStorage.setItem(cacheKey(trip.id), serialized);
  localStorage.setItem(cacheKey(trip.id), serialized);

  const ids = readIndex().filter((id) => id !== trip.id);
  ids.unshift(trip.id);
  writeIndex(ids);
}

export function loadTripFromClientCache(id: string): StoredTrip | null {
  if (typeof window === "undefined") return null;

  try {
    const raw =
      sessionStorage.getItem(cacheKey(id)) ??
      localStorage.getItem(cacheKey(id));
    return raw ? (JSON.parse(raw) as StoredTrip) : null;
  } catch {
    return null;
  }
}

export function listClientCachedTripIds(): string[] {
  return readIndex();
}
