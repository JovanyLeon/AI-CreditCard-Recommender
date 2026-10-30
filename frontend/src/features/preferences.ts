import type { RecommendationRequest } from "../types/recommendation";

export const defaultPreferences = (): RecommendationRequest => ({
  primary_goal: "cash_back",
  monthly_spending: null,
  max_annual_fee: 0,
  credit_profile: "unknown",
  wants_no_foreign_transaction_fee: null,
  prefers_simple_rewards: null,
  intro_apr_priority: false,
  student: null,
  issuer_exclusions: [],
  top_n: 3,
});
export const label = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
