import { ArrowRight, ArrowUpRight, Check, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { money } from "../../features/preferences";
import type { RecommendationResult } from "../../types/recommendation";
import { ScoreBreakdown } from "./ScoreBreakdown";

export function RecommendationCard({
  result,
}: {
  result: RecommendationResult;
}) {
  const { card } = result;
  return (
    <article
      className={`recommendation-card ${result.rank === 1 ? "best-match" : ""}`}
    >
      <div className="result-topline">
        <span className="rank-label">
          {result.rank === 1
            ? "#1 YOUR BEST MATCH"
            : `#${result.rank} ANOTHER GOOD FIT`}
        </span>
        <span className="match-score">
          <strong>{result.score.toFixed(1)}</strong>
          <span>
            / 100<small>Match Score</small>
          </span>
        </span>
      </div>
      <p className="issuer-name">{card.issuer}</p>
      <h2>
        <Link to={`/cards/${card.id}`}>{card.name}</Link>
      </h2>
      <div className="card-facts">
        <div>
          <span>Annual fee</span>
          <strong>{money(card.annual_fee)}</strong>
        </div>
        <div>
          <span>Foreign fee</span>
          <strong>
            {card.foreign_transaction_fee_percent === null
              ? "Unverified"
              : `${card.foreign_transaction_fee_percent}%`}
          </strong>
        </div>
        <div>
          <span>Est. annual rewards</span>
          <strong>
            {result.estimated_annual_rewards === null
              ? "Add spending"
              : money(result.estimated_annual_rewards)}
          </strong>
        </div>
      </div>
      <div className="result-reasons">
        <h3>Why it fits</h3>
        <ul className="check-list">
          {result.matched_preferences.slice(0, 4).map((item) => (
            <li key={item}>
              <Check size={15} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="tradeoff-preview">
        <Info size={16} />
        <div>
          <strong>Keep in mind</strong>
          <p>
            {result.tradeoffs[0] ??
              "Verify current terms with the issuer before applying."}
          </p>
        </div>
      </div>
      <details className="breakdown-details">
        <summary>See match breakdown</summary>
        <ScoreBreakdown result={result} />
      </details>
      <div className="result-actions">
        <Link className="button secondary" to={`/cards/${card.id}`}>
          View details <ArrowRight size={15} />
        </Link>
        {card.terms_url && (
          <a
            className="text-link"
            href={card.terms_url}
            target="_blank"
            rel="noreferrer"
          >
            Visit issuer <ArrowUpRight size={15} />
          </a>
        )}
      </div>
      <p className="data-date">
        Terms reviewed {card.last_verified_at} ·{" "}
        <a href={card.source_url} target="_blank" rel="noreferrer">
          Data source
        </a>
      </p>
    </article>
  );
}
