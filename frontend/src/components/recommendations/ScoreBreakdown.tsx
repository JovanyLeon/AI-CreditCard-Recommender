import { label } from "../../features/preferences";
import type { RecommendationResult } from "../../types/recommendation";

export function ScoreBreakdown({ result }: { result: RecommendationResult }) {
  return (
    <div className="score-breakdown">
      <p className="small-muted">
        Component scores are weighted for your primary goal. Match Score
        measures preference fit, not approval odds.
      </p>
      {Object.entries(result.score_breakdown).map(([key, score]) => (
        <div className="score-row" key={key}>
          <div>
            <span>{label(key)}</span>
            <span>
              {score.toFixed(0)}{" "}
              <small>
                · {Math.round(result.score_weights[key] * 100)}% weight
              </small>
            </span>
          </div>
          <progress
            max={100}
            value={score}
            aria-label={`${label(key)}: ${score.toFixed(0)} out of 100`}
          />
        </div>
      ))}
    </div>
  );
}
