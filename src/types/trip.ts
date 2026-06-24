export type TravelStyle =
  | "커플"
  | "가족"
  | "솔로"
  | "친구"
  | "비즈니스"
  | "배낭여행";

export interface GenerateTripRequest {
  destination: string;
  days: number;
  budget: number;
  style: TravelStyle;
  startDate?: string;
}

export interface PlaceItem {
  name: string;
  description: string;
  address?: string;
  lat?: number;
  lng?: number;
  estimatedCost?: number;
  category: "attraction" | "restaurant" | "cafe" | "shopping" | "transport";
  imageQuery?: string;
}

export interface DayItinerary {
  dayNo: number;
  title: string;
  places: PlaceItem[];
  dailyBudget: number;
  tips: string[];
}

export interface ChecklistItem {
  category: string;
  items: string[];
}

export interface BudgetBreakdown {
  accommodation: number;
  food: number;
  transport: number;
  activities: number;
  shopping: number;
  contingency: number;
  total: number;
}

export interface GeneratedItinerary {
  summary: string;
  days: DayItinerary[];
  budget: BudgetBreakdown;
  checklist: ChecklistItem[];
}

export interface GenerateTripResponse {
  tripId: string;
}

export interface Trip {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  style: string | null;
  share_token: string;
  summary: string | null;
  created_at: string;
}

export interface Itinerary {
  id: string;
  trip_id: string;
  day_no: number;
  content: DayItinerary;
}
