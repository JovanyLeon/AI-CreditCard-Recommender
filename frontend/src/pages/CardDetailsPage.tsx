import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { ErrorState, LoadingState } from "../components/common/Feedback";
import { ScoreBreakdown } from "../components/recommendations/ScoreBreakdown";
import { useMatch } from "../features/MatchContext";
import { label, money } from "../features/preferences";
import type { CreditCard } from "../types/card";

export function CardDetailsPage() {
  const { cardId = "" } = useParams();
  const { result } = useMatch();
  const [card, setCard] = useState<CreditCard | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setCard(null);
    setError("");
    api
      .card(cardId)
      .then((value) => {
        if (alive) setCard(value);
      })
      .catch(() => {
        if (alive)
          setError(
            "We couldn’t load this card. It may no longer be in the catalog.",
          );
      });
    return () => {
      alive = false;
    };
  }, [cardId, attempt]);
  const match = result?.recommendations.find((item) => item.card.id === cardId);
  return (
    <section className="page-width content-page">
      <Link className="back-link" to="/results">
        <ArrowLeft size={15} /> Back to matches
      </Link>
      {error ? (
        <ErrorState message={error} onRetry={() => setAttempt(attempt + 1)} />
      ) : !card ? (
        <LoadingState
          title="Loading card details…"
          description="Checking the local card catalog."
        />
      ) : (
        <>
          <p className="eyebrow">
            {card.issuer.toUpperCase()} · {label(card.card_type)} card
          </p>
          <h1>{card.name}</h1>
          <div className="detail-grid">
            <div>
              <section className="detail-section">
                <h2>The essentials</h2>
                <dl className="facts-list">
                  <div>
                    <dt>Annual fee</dt>
                    <dd>{money(card.annual_fee)}</dd>
                  </div>
                  <div>
                    <dt>Foreign transaction fee</dt>
                    <dd>
                      {card.foreign_transaction_fee_percent === null
                        ? "Not verified"
                        : `${card.foreign_transaction_fee_percent}%`}
                    </dd>
                  </div>
                  <div>
                    <dt>Introductory purchase APR</dt>
                    <dd>
                      {card.intro_purchase_apr_months
                        ? `0% for ${card.intro_purchase_apr_months} months`
                        : "No verified offer"}
                    </dd>
                  </div>
                  <div>
                    <dt>Introductory balance-transfer APR</dt>
                    <dd>
                      {card.intro_balance_transfer_apr_months
                        ? `0% for ${card.intro_balance_transfer_apr_months} months; transfer fees may apply`
                        : "No verified offer"}
                    </dd>
                  </div>
                  <div>
                    <dt>Welcome offer</dt>
                    <dd>
                      {card.welcome_offer?.description ??
                        "Check current issuer offers"}
                    </dd>
                  </div>
                </dl>
                <p className="small-muted">
                  Regular APR applies after any introductory period. See issuer
                  terms for current rates and fees.
                </p>
              </section>
              <section className="detail-section">
                <h2>Rewards, clearly laid out.</h2>
                {card.reward_rules.length === 0 ? (
                  <p>This card does not earn rewards.</p>
                ) : (
                  <div className="reward-grid">
                    {card.reward_rules.map((rule) => (
                      <div key={rule.category}>
                        <strong>
                          {rule.rate}
                          {rule.unit === "percent" ? "%" : "×"}
                        </strong>
                        <span>
                          {rule.category === "all"
                            ? "Base rate on purchases"
                            : label(rule.category)}
                        </span>
                        {rule.notes && <small>{rule.notes}</small>}
                        {rule.annual_cap !== null && (
                          <small>
                            Up to {money(rule.annual_cap)} annual category
                            spending.
                          </small>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section className="detail-section">
                <h2>Things to keep in mind</h2>
                <ul className="plain-list">
                  {(match?.tradeoffs ?? card.data_notes).map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
                {card.perks.length > 0 && (
                  <>
                    <h3>Key benefits</h3>
                    <ul>
                      {card.perks.map((perk) => (
                        <li key={perk}>{perk}</li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            </div>
            <aside>
              <div className="detail-sidebar">
                {match ? (
                  <>
                    <p className="eyebrow">YOUR MATCH SCORE</p>
                    <div className="large-score">
                      {match.score.toFixed(1)}
                      <span> / 100</span>
                    </div>
                    <p>{match.explanation}</p>
                    <ul className="check-list">
                      {match.matched_preferences.map((text) => (
                        <li key={text}>
                          <Check size={15} />
                          <span>{text}</span>
                        </li>
                      ))}
                    </ul>
                    {match.estimated_net_annual_value !== null && (
                      <div className="net-value">
                        <span>Estimated rewards less annual fee</span>
                        <strong>
                          {money(match.estimated_net_annual_value)}
                          <small> / year</small>
                        </strong>
                      </div>
                    )}
                    <details className="breakdown-details">
                      <summary>Match breakdown</summary>
                      <ScoreBreakdown result={match} />
                    </details>
                  </>
                ) : (
                  <p>
                    Complete a guided search to see how this card matches your
                    preferences.
                  </p>
                )}
                {card.terms_url && (
                  <a
                    className="button"
                    href={card.terms_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View issuer terms <ArrowUpRight size={16} />
                  </a>
                )}
                <p className="data-date">
                  Terms reviewed: {card.last_verified_at}
                  <br />
                  Source verification date: {card.source_verified_at}
                  <br />
                  <a href={card.source_url} target="_blank" rel="noreferrer">
                    View original data source
                  </a>
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
