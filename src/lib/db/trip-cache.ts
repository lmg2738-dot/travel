import { cache } from "react";
import { getTripById } from "./trips";

export const getCachedTripById = cache(getTripById);
