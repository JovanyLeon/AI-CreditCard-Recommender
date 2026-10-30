export type Category =
  | "dining"
  | "groceries"
  | "gas"
  | "travel"
  | "transit"
  | "entertainment"
  | "online_shopping"
  | "drugstores"
  | "all"
  | "other";
export type CreditProfile =
  "new" | "fair" | "good" | "very_good" | "excellent" | "unknown";
export interface RewardRule {
  category: Category;
  rate: number;
  unit: "percent" | "points" | "miles";
  point_value: number;
  annual_cap: number | null;
  notes: string | null;
}
export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  network: string | null;
  card_type: "general" | "student" | "secured" | "business";
  annual_fee: number;
  foreign_transaction_fee_percent: number | null;
  reward_rules: RewardRule[];
  welcome_offer: { description: string; as_of: string } | null;
  intro_purchase_apr_months: number | null;
  intro_balance_transfer_apr_months: number | null;
  perks: string[];
  tags: string[];
  credit_profile: CreditProfile;
  source_url: string;
  terms_url: string | null;
  last_verified_at: string;
  source_verified_at: string;
  active: boolean;
  data_notes: string[];
}
