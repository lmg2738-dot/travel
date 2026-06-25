import { z } from "zod";

const placeSchema = z.object({
  name: z.string(),
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

const daySchema = z.object({
  dayNo: z.number(),
  title: z.string(),
  places: z.array(placeSchema),
  dailyBudget: z.number(),
  tips: z.array(z.string()),
});

export const storedTripSchema = z.object({
  id: z.string().uuid(),
  destination: z.string().min(1),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  budget: z.number(),
  style: z.string().nullable(),
  share_token: z.string().min(1),
  summary: z.string().nullable(),
  budget_breakdown: z
    .object({
      accommodation: z.number(),
      food: z.number(),
      transport: z.number(),
      activities: z.number(),
      shopping: z.number(),
      contingency: z.number(),
      total: z.number(),
    })
    .nullable(),
  checklist: z
    .array(
      z.object({
        category: z.string(),
        items: z.array(z.string()),
      })
    )
    .nullable(),
  itineraries: z.array(daySchema),
  created_at: z.string(),
});
