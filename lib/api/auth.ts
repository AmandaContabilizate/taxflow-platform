import { cookies } from "next/headers";
import { readAuthToken } from "./tokenCookie";

export async function getAuthToken(): Promise<string> {
  try {
    // El token viaja troceado en cookies (auth_token + auth_token_1..n)
    const cookieStore = await cookies();
    return readAuthToken((name) => cookieStore.get(name)?.value) || "";
  } catch (e) {
    console.warn("[getAuthToken] Failed to get auth token:", e);
    return "";
  }
}
