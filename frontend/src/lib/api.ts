import { createApiClient } from "@metrotrip/contracts";
import { legacyApiFetch } from "./legacyApiAdapter";

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const apiBaseUrl = configuredBaseUrl.replace(/\/api\/v1\/?$/, "");

export const api = createApiClient(apiBaseUrl, legacyApiFetch);

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function legacyPublicPost(path: string, body: Record<string, unknown>) {
  const response = await globalThis.fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "요청을 처리하지 못했습니다.";
    throw new Error(detail);
  }
  return data;
}

api.use({
  async onRequest({ request }) {
    if (accessToken) request.headers.set("Authorization", `Bearer ${accessToken}`);
    request.headers.set("X-Client-Platform", "web");
    return request;
  },
});