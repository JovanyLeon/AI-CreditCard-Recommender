import { Compass, LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function LoadingState({
  title = "Finding your best matches…",
  description = "Comparing rewards, fees, and preferences.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="feedback-panel" role="status">
      <LoaderCircle className="spinner" size={32} />
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="skeleton" />
      <div className="skeleton short" />
    </div>
  );
}
export function EmptyState({
  title = "Start with what matters to you.",
  description = "Answer a few questions to see your card matches.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="feedback-panel">
      <Compass size={34} />
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="button" to="/guided">
        Edit preferences
      </Link>
    </div>
  );
}
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="feedback-panel error-box" role="alert">
      <h2>Let’s try that again.</h2>
      <p>{message}</p>
      <div className="button-row">
        <button className="button" onClick={onRetry}>
          Try again
        </button>
        <Link className="button secondary" to="/guided">
          Use guided search
        </Link>
      </div>
    </div>
  );
}
