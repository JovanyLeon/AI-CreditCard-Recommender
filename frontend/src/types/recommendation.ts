import type { Category, CreditCard, CreditProfile } from "./card";
export type PrimaryGoal =
  | "cash_back"
  | "travel"
  | "build_credit"
  | "student"
  | "intro_apr"
  | "everyday_spending";
export type MonthlySpending = Partial<Record<Exclude<Category, "all">, number>>;
export interface RecommendationRequest {
  primary_goal: PrimaryGoal;
  monthly_spending: MonthlySpending | null;
  max_annual_fee: number | null;
  credit_profile: CreditProfile;
  wants_no_foreign_transaction_fee: boolean | null;
  prefers_simple_rewards: boolean | null;
  intro_apr_priority: boolean;
  student: boolean | null;
  issuer_exclusions: string[];
  top_n: number;
}
export interface RecommendationResult {
  rank: number;
  card: CreditCard;
  score: number;
  score_breakdown: Record<string, number>;
  score_weights: Record<string, number>;
  matched_preferences: string[];
  tradeoffs: string[];
  explanation: string;
  estimated_annual_rewards: number | null;
  estimated_net_annual_value: number | null;
}
export interface RecommendationResponse {
  preferences: RecommendationRequest;
  recommendations: RecommendationResult[];
  compared_count: number;
  eligible_count: number;
  algorithm_version: string;
  notices: string[];
}
