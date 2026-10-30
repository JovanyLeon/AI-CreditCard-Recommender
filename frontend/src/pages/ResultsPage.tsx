import { ArrowRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { useMatch } from "../features/MatchContext";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/common/Feedback";
import { PreferenceSummary } from "../components/recommendations/PreferenceSummary";
import { RecommendationCard } from "../components/recommendations/RecommendationCard";

export function ResultsPage() {
  const { result, preferences, pending, error, findMatches, reset } =
    useMatch();
  return (
    <section className="page-width content-page">
      <p className="eyebrow">A LITTLE CLOSER TO YOUR NEXT CARD</p>
      <div className="results-heading">
        <div>
          <h1>Your best matches.</h1>
          <p>
            {result
              ? `We compared ${result.compared_count} reviewed cards. ${result.eligible_count} meet your requirements.`
              : "A clearer picture of what fits your life."}
          </p>
        </div>
        <div className="button-row">
          <Link className="button secondary small" to="/guided">
            <SlidersHorizontal size={14} /> Edit preferences
          </Link>
          <Link className="text-link" to="/guided" onClick={reset}>
            <RotateCcw size={14} /> Start over
          </Link>
        </div>
      </div>
      <PreferenceSummary preferences={result?.preferences ?? preferences} />
      {pending ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void findMatches()} />
      ) : !result ? (
        <EmptyState />
      ) : result.recommendations.length === 0 ? (
        <EmptyState
          title="No card matches every preference."
          description="Your requirements are shown above. Try raising your fee limit or removing an issuer exclusion. We’ll never silently relax your requirements."
        />
      ) : (
        <>
          <div className="results-grid">
            {result.recommendations.map((item) => (
              <RecommendationCard key={item.card.id} result={item} />
            ))}
          </div>
          <div className="compare-banner">
            <div>
              <h3>A side-by-side look.</h3>
              <p>Compare fees, rewards, and tradeoffs in one place.</p>
            </div>
            <Link className="button" to="/compare">
              Compare top {result.recommendations.length}{" "}
              <ArrowRight size={17} />
            </Link>
          </div>
        </>
      )}
      {result && (
        <div className="method-note">
          <strong>Behind your matches</strong>
          {result.notices.map((notice) => (
            <p key={notice}>{notice}</p>
          ))}
          <Link to="/about">
            How scoring works · Algorithm {result.algorithm_version}
          </Link>
        </div>
      )}
    </section>
  );
}
