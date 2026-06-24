import { z } from "zod";
import type { GeneratedItinerary } from "@/types/trip";

type PlaceCategory =
  | "attraction"
  | "restaurant"
  | "cafe"
  | "shopping"
  | "transport";

const CATEGORY_ALIASES: Record<string, PlaceCategory> = {
  attraction: "attraction",
  tourist: "attraction",
  sightseeing: "attraction",
  landmark: "attraction",
  관광: "attraction",
  관광지: "attraction",
  명소: "attraction",
  관람: "attraction",
  restaurant: "restaurant",
  food: "restaurant",
  dining: "restaurant",
  meal: "restaurant",
  맛집: "restaurant",
  식당: "restaurant",
  음식: "restaurant",
  레스토랑: "restaurant",
  cafe: "cafe",
  coffee: "cafe",
  카페: "cafe",
  커피: "cafe",
  shopping: "shopping",
  shop: "shopping",
  mall: "shopping",
  쇼핑: "shopping",
  마켓: "shopping",
  transport: "transport",
  transportation: "transport",
  transit: "transport",
  교통: "transport",
  이동: "transport",
};

const placeSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  estimatedCost: z.number().optional(),
  category: z.enum([
    "attraction",
    "restaurant",
    "cafe",
    "shopping",
    "transport",
  ]),
});

const itinerarySchema = z.object({
  summary: z.string().min(1),
  days: z.array(
    z.object({
      dayNo: z.number(),
      title: z.string(),
      places: z.array(placeSchema).min(1),
      dailyBudget: z.number(),
      tips: z.array(z.string()),
    })
  ).min(1),
  budget: z.object({
    accommodation: z.number(),
    food: z.number(),
    transport: z.number(),
    activities: z.number(),
    shopping: z.number(),
    contingency: z.number(),
    total: z.number(),
  }),
  checklist: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()),
    })
  ),
});

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toString(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value).trim();
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalCoord(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = toNumber(value, NaN);
  if (!Number.isFinite(parsed)) return undefined;
  if (parsed < -180 || parsed > 180) return undefined;
  return parsed;
}

function normalizeTips(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tip) => toString(tip)).filter(Boolean);
  }
  if (value == null) return [];
  return [toString(value)].filter(Boolean);
}

function normalizeCategory(value: unknown): PlaceCategory {
  const raw = toString(value, "attraction").toLowerCase();
  if (CATEGORY_ALIASES[raw]) return CATEGORY_ALIASES[raw];

  for (const [key, category] of Object.entries(CATEGORY_ALIASES)) {
    if (raw.includes(key)) return category;
  }

  return "attraction";
}

function normalizePlace(raw: unknown) {
  const place = asRecord(raw) ?? {};

  return {
    name: toString(place.name ?? place.placeName ?? place.title, "추천 장소"),
    description: toString(
      place.description ?? place.desc ?? place.summary ?? place.detail,
      "추천 장소입니다."
    ),
    address: toString(place.address ?? place.location, "") || undefined,
    lat: toOptionalCoord(place.lat),
    lng: toOptionalCoord(place.lng ?? place.lon),
    estimatedCost:
      place.estimatedCost != null
        ? toNumber(place.estimatedCost ?? place.cost ?? place.price)
        : undefined,
    category: normalizeCategory(place.category ?? place.type),
  };
}

function normalizeDay(raw: unknown, index: number) {
  const day = asRecord(raw) ?? {};
  const places = asArray(day.places ?? day.spots ?? day.locations ?? day.activities);

  return {
    dayNo: toNumber(day.dayNo ?? day.day_no ?? day.day ?? index + 1, index + 1),
    title: toString(day.title ?? day.name ?? day.theme, `Day ${index + 1}`),
    places: places.length > 0 ? places.map(normalizePlace) : [normalizePlace({})],
    dailyBudget: toNumber(day.dailyBudget ?? day.daily_budget ?? day.budget),
    tips: normalizeTips(day.tips ?? day.notes),
  };
}

function normalizeBudget(raw: unknown, totalBudget: number) {
  const budget = asRecord(raw) ?? {};
  const total = toNumber(
    budget.total ?? budget.grandTotal ?? budget.sum,
    totalBudget
  );

  return {
    accommodation: toNumber(budget.accommodation ?? budget.hotel ?? budget.lodging),
    food: toNumber(budget.food ?? budget.dining ?? budget.meals),
    transport: toNumber(budget.transport ?? budget.transportation ?? budget.traffic),
    activities: toNumber(budget.activities ?? budget.activity ?? budget.tours),
    shopping: toNumber(budget.shopping ?? budget.souvenir),
    contingency: toNumber(budget.contingency ?? budget.emergency ?? budget.reserve),
    total,
  };
}

function normalizeChecklist(raw: unknown) {
  const entries = asArray(raw);
  if (entries.length === 0) {
    return [{ category: "준비물", items: ["신분증", "여행자보험"] }];
  }

  return entries.map((item) => {
    if (typeof item === "string") {
      return { category: "준비물", items: [item] };
    }

    const entry = asRecord(item) ?? {};
    const items = asArray(entry.items ?? entry.list);
    const normalizedItems =
      items.length > 0
        ? items.map((value) => toString(value)).filter(Boolean)
        : [toString(entry.item ?? entry.name, "여행 필수품")].filter(Boolean);

    return {
      category: toString(entry.category ?? entry.title, "준비물"),
      items: normalizedItems,
    };
  });
}

export function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function repairJsonText(text: string): string {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/:\s*undefined/g, ": null")
    .replace(/:\s*NaN/g, ": 0")
    .replace(/,\s*\.\.\.\s*,/g, ",")
    .replace(/,\s*\.\.\./g, "")
    .replace(/\[\s*\.\.\.\s*\]/g, "[]")
    .replace(/\.\.\./g, "")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3')
    .replace(/:\s*'([^']*)'/g, ': "$1"')
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
}

function closeTruncatedJson(text: string): string {
  let result = text.trim();
  const openBraces = (result.match(/{/g) ?? []).length;
  const closeBraces = (result.match(/}/g) ?? []).length;
  const openBrackets = (result.match(/\[/g) ?? []).length;
  const closeBrackets = (result.match(/]/g) ?? []).length;

  if (result.endsWith(",")) {
    result = result.slice(0, -1);
  }

  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    result += "]";
  }
  for (let i = 0; i < openBraces - closeBraces; i++) {
    result += "}";
  }

  return result;
}

export function parseAiJson(content: string): unknown {
  const candidates = [
    extractJson(content),
    repairJsonText(extractJson(content)),
    closeTruncatedJson(repairJsonText(extractJson(content))),
    content.trim(),
  ];

  let lastError: Error | null = null;

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("AI 응답을 JSON으로 파싱하지 못했습니다.");
}

export function normalizeItinerary(
  raw: unknown,
  totalBudget: number,
  expectedDays?: number
): GeneratedItinerary {
  const root = asRecord(raw) ?? {};
  const payload =
    asRecord(root.itinerary) ??
    asRecord(root.trip) ??
    asRecord(root.data) ??
    root;

  const days = asArray(payload.days ?? payload.dayPlans ?? payload.schedule);
  const budget = normalizeBudget(payload.budget ?? payload.budgetBreakdown, totalBudget);

  let normalizedDays =
    days.length > 0 ? days.map(normalizeDay) : [normalizeDay({}, 0)];

  if (expectedDays && expectedDays > 0) {
    while (normalizedDays.length < expectedDays) {
      normalizedDays.push(normalizeDay({}, normalizedDays.length));
    }
    if (normalizedDays.length > expectedDays) {
      normalizedDays = normalizedDays.slice(0, expectedDays);
    }
  }

  const itinerary: GeneratedItinerary = {
    summary: toString(
      payload.summary ?? payload.overview ?? payload.description,
      "맞춤 여행 일정이 생성되었습니다."
    ),
    days: normalizedDays,
    budget,
    checklist: normalizeChecklist(payload.checklist ?? payload.checklists),
  };

  const validated = itinerarySchema.safeParse(itinerary);
  if (validated.success) {
    return validated.data;
  }

  console.warn(
    "[TripMind] 스키마 경고, 정규화 데이터 사용:",
    validated.error.flatten()
  );
  return itinerary;
}

export function parseAndValidateItinerary(
  content: string,
  totalBudget: number,
  expectedDays?: number
): GeneratedItinerary {
  const parsed = parseAiJson(content);
  return normalizeItinerary(parsed, totalBudget, expectedDays);
}
