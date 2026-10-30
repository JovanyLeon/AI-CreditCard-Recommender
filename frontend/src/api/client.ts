import type { CreditCard } from "../types/card";
import type { AiResponse } from "../types/ai";
import type {
  RecommendationRequest,
  RecommendationResponse,
} from "../types/recommendation";

export async function call<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(35000),
    });
  } catch {
    throw new Error(
      "We couldn’t reach CardMatch. Check that the backend is running and try again.",
    );
  }
  if (!response.ok) {
    if (response.status === 422)
      throw new Error(
        "Please check your preferences. Spending and fees must be valid, non-negative amounts.",
      );
    throw new Error(
      "We couldn’t load your matches. Your preferences are still here. Please try again.",
    );
  }
  return response.json() as Promise<T>;
}
export const api = {
  aiStatus: () => call<{ ai_enabled: boolean }>("/ai/status"),
  interpret: (message: string, follow_up_count = 0) =>
    call<AiResponse>("/ai/recommendations", { message, follow_up_count }),
  health: () => call<{ status: string }>("/health"),
  cards: () => call<CreditCard[]>("/cards"),
  card: (id: string) => call<CreditCard>(`/cards/${encodeURIComponent(id)}`),
  recommend: (preferences: RecommendationRequest) =>
    call<RecommendationResponse>("/recommendations", preferences),
};
