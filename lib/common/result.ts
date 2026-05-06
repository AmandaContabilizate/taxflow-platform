import type { PaginationMeta } from "./paginationMeta";

export type Result<T, E = Error> =
  | { success: true; value: T; meta?: PaginationMeta }
  | { success: false; error: E };

export const ok = <T>(value: T, meta?: PaginationMeta): Result<T, never> => ({
  success: true,
  value,
  meta,
});

export const err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});
