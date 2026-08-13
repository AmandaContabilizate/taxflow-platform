import { cookies } from "next/headers";

export async function getAuthToken(): Promise<string> {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    return token || "";
  } catch (e) {
    console.warn("[getAuthToken] Failed to get auth token:", e);
    return "";
  }
}
