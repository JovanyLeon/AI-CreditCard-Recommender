import type {
  RecommendationRequest,
  RecommendationResponse,
} from "./recommendation";

export interface AiResponse {
  interpreted_preferences: RecommendationRequest | null;
  result: RecommendationResponse | null;
  needs_follow_up: boolean;
  follow_up_question: string | null;
  missing_information: string[];
  conflicts: string[];
  ai_enabled: boolean;
}
