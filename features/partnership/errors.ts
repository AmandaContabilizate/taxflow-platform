import { ApiError } from "@/lib/api";
import type { PartnershipError } from "./types";

/** Normaliza cualquier excepción a un PartnershipError con mensaje amigable. */
export function toPartnershipError(e: unknown, fallback: string): PartnershipError {
  if (e instanceof ApiError) {
    return { statusCode: e.status, message: e.message || fallback };
  }
  console.error("[partnership]", fallback, e);
  return { statusCode: 500, message: fallback };
}
