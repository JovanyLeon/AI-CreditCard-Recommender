import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/common/Feedback";
import { useMatch } from "../features/MatchContext";
import { label, money } from "../features/preferences";

export function ComparePage() {
  const { result } = useMatch();
  return (
    <section className="page-width content-page">
      <Link className="back-link" to="/results">
        <ArrowLeft size={15} /> Back to matches
      </Link>
      <p className="eyebrow">THE DETAILS, SIDE BY SIDE</p>
      <h1>Find your deciding factor.</h1>
      <p className="page-intro">
        A closer look at your top matches. Every card has a tradeoff.
      </p>
      {!result?.recommendations.length ? (
        <EmptyState description="Complete your search to compare the top cards for your preferences." />
      ) : (
        <div className="comparison-grid">
          {result.recommendations.map(
            ({ card, score, estimated_net_annual_value, tradeoffs }) => (
              <article className="comparison-card" key={card.id}>
                <p className="issuer-name">{card.issuer}</p>
                <h2>
                  <Link to={`/cards/${card.id}`}>{card.name}</Link>
                </h2>
                <dl className="facts-list">
                  <div>
                    <dt>Match Score</dt>
                    <dd>{score.toFixed(1)} / 100</dd>
                  </div>
                  <div>
                    <dt>Annual fee</dt>
                    <dd>{money(card.annual_fee)}</dd>
                  </div>
                  <div>
                    <dt>Foreign fee</dt>
                    <dd>
                      {card.foreign_transaction_fee_percent === null
                        ? "Unverified"
                        : `${card.foreign_transaction_fee_percent}%`}
                    </dd>
                  </div>
                  <div>
                    <dt>Intro purchase APR</dt>
                    <dd>
                      {card.intro_purchase_apr_months
                        ? `0% for ${card.intro_purchase_apr_months} months`
                        : "Unverified"}
                    </dd>
                  </div>
                  <div>
                    <dt>Est. rewards less annual fee</dt>
                    <dd>
                      {estimated_net_annual_value === null
                        ? "Add spending"
                        : `${money(estimated_net_annual_value)}/year`}
                    </dd>
                  </div>
                </dl>
                <h3>Rewards</h3>
                <ul className="plain-list">
                  {card.reward_rules.map((rule) => (
                    <li key={rule.category}>
                      {rule.rate}
                      {rule.unit === "percent" ? "%" : "×"} ·{" "}
                      {rule.category === "all"
                        ? "Base rate"
                        : label(rule.category)}
                    </li>
                  ))}
                </ul>
                <h3>Keep in mind</h3>
                <p className="small-muted">
                  {tradeoffs[0] ?? "Check issuer terms."}
                </p>
                <Link className="text-link" to={`/cards/${card.id}`}>
                  All details <ArrowUpRight size={15} />
                </Link>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}
