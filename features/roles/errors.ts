import { ApiError } from "@/lib/api";
import type { RolesError } from "./types";

/** Normaliza cualquier excepción a un RolesError con mensaje amigable. */
export function toRolesError(e: unknown, fallback: string): RolesError {
  if (e instanceof ApiError) {
    return { statusCode: e.status, message: e.message || fallback };
  }
  console.error("[roles]", fallback, e);
  return { statusCode: 500, message: fallback };
}
