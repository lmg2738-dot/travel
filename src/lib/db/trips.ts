import { promises as fs } from "fs";
import path from "path";
import { randomBytes, randomUUID } from "crypto";
import type {
  BudgetBreakdown,
  ChecklistItem,
  DayItinerary,
  GeneratedItinerary,
} from "@/types/trip";
import { isVercelRuntime } from "@/lib/runtime-config";
import {
  blobStorageEnabled,
  BLOB_INDEX_PATH,
  deleteBlob,
  readBlobJson,
  tripBlobPath,
  writeBlobJson,
} from "@/lib/db/trip-blob";

const DATA_DIR = isVercelRuntime()
  ? path.join("/tmp", "tripmind", "trips")
  : path.join(process.cwd(), "data", "trips");
const INDEX_FILE = path.join(DATA_DIR, ".index.json");

export interface StoredTrip {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  style: string | null;
  share_token: string;
  summary: string | null;
  budget_breakdown: BudgetBreakdown | null;
  checklist: ChecklistItem[] | null;
  itineraries: DayItinerary[];
  created_at: string;
}

export interface TripSummary {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  style: string | null;
  summary: string | null;
  created_at: string;
}

interface TripIndex {
  shareTokens: Record<string, string>;
  summaries: TripSummary[];
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function tripFilePath(id: string): string {
  return path.join(DATA_DIR, `${id}.json`);
}

function isTripFile(file: string): boolean {
  return file.endsWith(".json") && !file.startsWith(".");
}

function toSummary(trip: StoredTrip): TripSummary {
  return {
    id: trip.id,
    destination: trip.destination,
    start_date: trip.start_date,
    end_date: trip.end_date,
    budget: trip.budget,
    style: trip.style,
    summary: trip.summary,
    created_at: trip.created_at,
  };
}

async function readIndex(): Promise<TripIndex | null> {
  if (blobStorageEnabled()) {
    return readBlobJson<TripIndex>(BLOB_INDEX_PATH);
  }

  try {
    const content = await fs.readFile(INDEX_FILE, "utf-8");
    return JSON.parse(content) as TripIndex;
  } catch {
    return null;
  }
}

async function writeIndex(index: TripIndex): Promise<void> {
  if (blobStorageEnabled()) {
    await writeBlobJson(BLOB_INDEX_PATH, index);
    return;
  }

  await ensureDataDir();
  await fs.writeFile(INDEX_FILE, JSON.stringify(index), "utf-8");
}

async function rebuildIndex(): Promise<TripIndex> {
  if (blobStorageEnabled()) {
    const index = await readIndex();
    return index ?? { shareTokens: {}, summaries: [] };
  }

  await ensureDataDir();
  const files = await fs.readdir(DATA_DIR);
  const tripFiles = files.filter(isTripFile);

  const trips = await Promise.all(
    tripFiles.map(async (file) => {
      try {
        const content = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
        return JSON.parse(content) as StoredTrip;
      } catch {
        return null;
      }
    })
  );

  const validTrips = trips.filter((trip): trip is StoredTrip => trip !== null);
  const shareTokens: Record<string, string> = {};

  for (const trip of validTrips) {
    shareTokens[trip.share_token] = trip.id;
  }

  const summaries = validTrips
    .map(toSummary)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const index: TripIndex = { shareTokens, summaries };
  await writeIndex(index);
  return index;
}

async function getIndex(): Promise<TripIndex> {
  const index = await readIndex();
  if (index) return index;
  return rebuildIndex();
}

async function syncIndexWithTrip(trip: StoredTrip): Promise<void> {
  const index = await getIndex();
  index.shareTokens[trip.share_token] = trip.id;

  const summary = toSummary(trip);
  const existingIdx = index.summaries.findIndex((s) => s.id === trip.id);
  if (existingIdx >= 0) {
    index.summaries[existingIdx] = summary;
  } else {
    index.summaries.unshift(summary);
  }

  index.summaries.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  await writeIndex(index);
}

async function removeTripFromIndex(id: string, shareToken?: string): Promise<void> {
  const index = await readIndex();
  if (!index) return;

  index.summaries = index.summaries.filter((s) => s.id !== id);
  if (shareToken) {
    delete index.shareTokens[shareToken];
  }

  await writeIndex(index);
}

export async function listTripSummaries(): Promise<TripSummary[]> {
  const index = await getIndex();
  return index.summaries;
}

/** @deprecated listTripSummaries 사용 권장 */
export async function listTrips(): Promise<StoredTrip[]> {
  await ensureDataDir();
  const files = await fs.readdir(DATA_DIR);
  const tripFiles = files.filter(isTripFile);

  const trips = await Promise.all(
    tripFiles.map(async (file) => {
      try {
        const content = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
        return JSON.parse(content) as StoredTrip;
      } catch {
        return null;
      }
    })
  );

  return trips
    .filter((trip): trip is StoredTrip => trip !== null)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export async function getTripById(id: string): Promise<StoredTrip | null> {
  if (blobStorageEnabled()) {
    return readBlobJson<StoredTrip>(tripBlobPath(id));
  }

  try {
    const content = await fs.readFile(tripFilePath(id), "utf-8");
    return JSON.parse(content) as StoredTrip;
  } catch {
    return null;
  }
}

export async function getTripByShareToken(
  token: string
): Promise<StoredTrip | null> {
  const index = await getIndex();
  const tripId = index.shareTokens[token];

  if (tripId) {
    const trip = await getTripById(tripId);
    if (trip?.share_token === token) return trip;
  }

  const trips = await listTrips();
  const trip = trips.find((t) => t.share_token === token) ?? null;
  if (trip) {
    await syncIndexWithTrip(trip);
  }
  return trip;
}

export async function saveTrip(trip: StoredTrip): Promise<StoredTrip> {
  if (blobStorageEnabled()) {
    await writeBlobJson(tripBlobPath(trip.id), trip);
    await syncIndexWithTrip(trip);
    return trip;
  }

  if (isVercelRuntime()) {
    try {
      await ensureDataDir();
      await fs.writeFile(tripFilePath(trip.id), JSON.stringify(trip), "utf-8");
    } catch (error) {
      console.warn("[TripMind] Vercel /tmp 저장 실패:", error);
    }
    return trip;
  }

  await ensureDataDir();
  await fs.writeFile(tripFilePath(trip.id), JSON.stringify(trip), "utf-8");
  await syncIndexWithTrip(trip);
  return trip;
}

interface CreateTripInput {
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  style: string;
  itinerary: GeneratedItinerary;
}

export async function createTrip(input: CreateTripInput): Promise<StoredTrip> {
  const trip: StoredTrip = {
    id: randomUUID(),
    share_token: randomBytes(16).toString("hex"),
    destination: input.destination,
    start_date: input.start_date,
    end_date: input.end_date,
    budget: input.budget,
    style: input.style,
    summary: input.itinerary.summary,
    budget_breakdown: input.itinerary.budget,
    checklist: input.itinerary.checklist,
    itineraries: input.itinerary.days,
    created_at: new Date().toISOString(),
  };

  return saveTrip(trip);
}

export async function deleteTrip(id: string): Promise<boolean> {
  const trip = await getTripById(id);
  try {
    if (blobStorageEnabled()) {
      await deleteBlob(tripBlobPath(id));
    } else {
      await fs.unlink(tripFilePath(id));
    }
    await removeTripFromIndex(id, trip?.share_token);
    return true;
  } catch {
    return false;
  }
}
