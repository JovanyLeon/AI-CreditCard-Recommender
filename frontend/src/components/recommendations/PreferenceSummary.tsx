import { label, money } from "../../features/preferences";
import type { RecommendationRequest } from "../../types/recommendation";

export function PreferenceSummary({
  preferences,
}: {
  preferences: RecommendationRequest;
}) {
  const spending = Object.entries(preferences.monthly_spending ?? {})
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);
  return (
    <div className="preference-summary">
      <span className="summary-label">YOUR PREFERENCES</span>
      <div className="preference-chips">
        <span>{label(preferences.primary_goal)}</span>
        <span>
          {preferences.max_annual_fee === null
            ? "No fee limit"
            : `${money(preferences.max_annual_fee)} maximum annual fee`}
        </span>
        {preferences.wants_no_foreign_transaction_fee && (
          <span>No foreign transaction fee</span>
        )}
        {preferences.student && <span>Student</span>}
        {preferences.prefers_simple_rewards && <span>Simple rewards</span>}
        {preferences.intro_apr_priority && <span>Intro APR</span>}
        {preferences.credit_profile !== "unknown" && (
          <span>{label(preferences.credit_profile)} credit profile</span>
        )}
        {spending.slice(0, 2).map(([category, amount]) => (
          <span key={category}>
            {label(category)}: {money(amount)}/mo
          </span>
        ))}
        {preferences.issuer_exclusions.length > 0 && (
          <span>Exclude: {preferences.issuer_exclusions.join(", ")}</span>
        )}
      </div>
    </div>
  );
}
