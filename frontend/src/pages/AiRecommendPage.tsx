import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { LoadingState } from "../components/common/Feedback";
import { PreferenceSummary } from "../components/recommendations/PreferenceSummary";
import { useMatch } from "../features/MatchContext";
import { label, money } from "../features/preferences";
import type { AiResponse } from "../types/ai";

const examples = [
  "I want cash back on groceries and dining, with no annual fee.",
  "I travel internationally and prefer simple rewards.",
  "I’m a student looking to start building credit.",
];
export function AiRecommendPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [count, setCount] = useState(0);
  const [parsed, setParsed] = useState<AiResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { setPreferences, findMatches } = useMatch();
  const navigate = useNavigate();
  useEffect(() => {
    let alive = true;
    api
      .aiStatus()
      .then((status) => {
        if (alive) setEnabled(status.ai_enabled);
      })
      .catch(() => {
        if (alive) setEnabled(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  async function interpret(event: FormEvent) {
    event.preventDefault();
    const nextCount = parsed?.needs_follow_up ? count + 1 : 0;
    const text = parsed?.needs_follow_up
      ? `${message}\nClarification: ${answer.trim()}`
      : message.trim();
    if (text.length > 2000 || text.length < 10 || nextCount > 2) {
      setError(
        "Use 10–2,000 characters in total, or finish with guided search.",
      );
      return;
    }
    setError("");
    setPending(true);
    try {
      const response = await api.interpret(text, nextCount);
      setParsed(response);
      setMessage(text);
      setCount(nextCount);
      setAnswer("");
    } catch {
      setError(
        "AI recommendations are temporarily unavailable. Your description is still here. You can try again or use guided search.",
      );
    } finally {
      setPending(false);
    }
  }
  function edit() {
    if (parsed?.interpreted_preferences)
      setPreferences(parsed.interpreted_preferences);
    navigate("/guided");
  }
  function confirm() {
    if (parsed?.interpreted_preferences && !parsed.needs_follow_up) {
      void findMatches(parsed.interpreted_preferences);
      navigate("/results");
    }
  }
  return (
    <section className="page-width content-page ai-shell">
      <aside className="ai-intro">
        <Link className="back-link" to="/">
          <ArrowLeft size={15} /> Back to home
        </Link>
        <span className="feature-icon">
          <Sparkles size={23} />
        </span>
        <p className="eyebrow">START IN YOUR OWN WORDS</p>
        <h1>A good match starts with you.</h1>
        <p>
          Tell us what matters. We’ll turn it into preferences you can review
          and change.
        </p>
        <div className="privacy-note">
          <ShieldCheck size={20} />
          <p>
            AI interprets your preferences. Our comparison engine handles the
            cards.
          </p>
        </div>
      </aside>
      <div className="ai-workspace">
        {enabled === false && (
          <div className="ai-unavailable" role="status">
            <strong>Guided search is ready when you are.</strong>
            <p>
              AI assistance is not enabled right now. You can get the same card
              comparisons by answering a few questions.
            </p>
            <Link className="button" to="/guided">
              Use guided search <ArrowRight size={16} />
            </Link>
          </div>
        )}
        <div className="question-panel">
          <h2>What are you looking for?</h2>
          <p className="question-help">
            Your goals, spending, and must-haves are a great place to start.
          </p>
          <form onSubmit={interpret}>
            <label className="field" htmlFor="ai-message">
              Describe your ideal card
            </label>
            <textarea
              id="ai-message"
              rows={6}
              maxLength={2000}
              minLength={10}
              required
              disabled={pending || enabled !== true}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setParsed(null);
                setCount(0);
                setError("");
              }}
              placeholder="I spend mostly on groceries and restaurants. I’d love cash back, without an annual fee…"
            />
            <div className="character-count">
              {message.length} / 2,000 characters
            </div>
            <p className="privacy-copy">
              Your description is sent to OpenAI when you submit. Do not enter
              credit card numbers, bank account numbers, passwords, Social
              Security numbers, or other sensitive information.
            </p>
            {!parsed && (
              <>
                <p className="example-label">NEED A STARTING POINT?</p>
                <div className="example-prompts">
                  {examples.map((example) => (
                    <button
                      type="button"
                      key={example}
                      disabled={pending || enabled !== true}
                      onClick={() => setMessage(example)}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </>
            )}
            {parsed?.needs_follow_up && (
              <div className="follow-up">
                <h3>One detail to clarify</h3>
                {parsed.conflicts.map((conflict) => (
                  <p key={conflict}>{conflict}</p>
                ))}
                {parsed.follow_up_question ? (
                  <label className="field">
                    {parsed.follow_up_question}
                    <input
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      required
                      maxLength={Math.max(0, 2000 - message.length - 16)}
                      disabled={pending}
                    />
                  </label>
                ) : (
                  <p>
                    Let’s finish in guided search so you can set each preference
                    directly.
                  </p>
                )}
              </div>
            )}
            {error && (
              <div className="error-box" role="alert">
                <p>{error}</p>
                <Link className="text-link" to="/guided">
                  Use guided search <ArrowRight size={14} />
                </Link>
              </div>
            )}
            {(!parsed ||
              (parsed.needs_follow_up && parsed.follow_up_question)) && (
              <button
                className="button ai-submit"
                disabled={pending || enabled !== true}
              >
                {pending
                  ? "Understanding your preferences…"
                  : parsed?.needs_follow_up
                    ? "Clarify preferences"
                    : "Understand my preferences"}
                <ArrowRight size={16} />
              </button>
            )}
            {enabled === null && (
              <p role="status" className="small-muted">
                Checking AI availability…
              </p>
            )}
          </form>
        </div>
        {pending && (
          <LoadingState
            title="Understanding your preferences…"
            description="Turning your description into a clear starting point."
          />
        )}
        {parsed && !pending && (
          <section className="interpretation-panel">
            <p className="eyebrow">YOU’RE IN CONTROL</p>
            <h2>Here’s what we understood.</h2>
            {parsed.interpreted_preferences ? (
              <>
                <PreferenceSummary
                  preferences={parsed.interpreted_preferences}
                />
                <dl className="facts-list">
                  <div>
                    <dt>Credit profile</dt>
                    <dd>
                      {label(parsed.interpreted_preferences.credit_profile)}
                    </dd>
                  </div>
                  <div>
                    <dt>Monthly spending</dt>
                    <dd>
                      {Object.entries(
                        parsed.interpreted_preferences.monthly_spending ?? {},
                      )
                        .filter(([, amount]) => amount > 0)
                        .map(
                          ([key, amount]) => `${label(key)}: ${money(amount)}`,
                        )
                        .join("; ") || "Not supplied — no amounts assumed"}
                    </dd>
                  </div>
                  <div>
                    <dt>Simple rewards</dt>
                    <dd>
                      {parsed.interpreted_preferences.prefers_simple_rewards ===
                      null
                        ? "No preference supplied"
                        : parsed.interpreted_preferences.prefers_simple_rewards
                          ? "Preferred"
                          : "Not required"}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <p>We need a clearer goal before comparing cards.</p>
            )}
            {parsed.missing_information.length > 0 && (
              <p className="small-muted">
                Unspecified: {parsed.missing_information.join(", ")}
              </p>
            )}
            <div className="button-row">
              <button className="button secondary" onClick={edit}>
                Edit preferences
              </button>
              {!parsed.needs_follow_up && parsed.interpreted_preferences && (
                <button className="button" onClick={confirm}>
                  See my matches <ArrowRight size={16} />
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
