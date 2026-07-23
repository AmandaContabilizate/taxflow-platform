"use server";

import { ApiError, fetchGet } from "@/lib/api";
import type { UserInfo } from "../types.ts";

export async function getUserInfo(): Promise<UserInfo | null> {
  const routes = [
    "/my-info",
    "/default/my-info",
    "/mx/my-info",
  ];

  for (const route of routes) {
    try {
      return await fetchGet<UserInfo>(route, "auth");
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        return null;
      }
    }
  }

  return null;
}
