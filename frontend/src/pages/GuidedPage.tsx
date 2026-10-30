import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  Coffee,
  GraduationCap,
  Plane,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMatch } from "../features/MatchContext";
import { label, money } from "../features/preferences";
import type { CreditProfile } from "../types/card";
import type { RecommendationRequest } from "../types/recommendation";

const goals = [
  {
    id: "cash_back",
    title: "Cash back",
    description: "More back on everyday purchases",
    icon: Banknote,
  },
  {
    id: "travel",
    title: "Travel rewards",
    description: "Points and miles for your next trip",
    icon: Plane,
  },
  {
    id: "build_credit",
    title: "Build credit",
    description: "Find a place to start or rebuild",
    icon: ShieldCheck,
  },
  {
    id: "student",
    title: "Student card",
    description: "Start your next chapter with confidence",
    icon: GraduationCap,
  },
  {
    id: "intro_apr",
    title: "Intro APR",
    description: "An introductory purchase APR period",
    icon: TrendingDown,
  },
  {
    id: "everyday_spending",
    title: "Everyday spending",
    description: "A straightforward everyday companion",
    icon: Coffee,
  },
] as const;
const stepTitles = [
  "Your goal",
  "Your spending",
  "Annual fee",
  "Travel needs",
  "Finishing touches",
];
const questions = [
  "What matters most to you?",
  "What does a typical month look like?",
  "What annual fee feels right?",
  "Will your card travel with you?",
  "Let’s make it a little more personal.",
];

export function GuidedPage() {
  const { preferences, setPreferences, findMatches, pending } = useMatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [exclusions, setExclusions] = useState(
    preferences.issuer_exclusions.join(", "),
  );
  function update(patch: Partial<RecommendationRequest>) {
    setPreferences({ ...preferences, ...patch });
    setError("");
  }
  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      Object.values(preferences.monthly_spending ?? {}).some(
        (n) => !Number.isFinite(n) || n < 0 || n > 1000000,
      )
    ) {
      setError("Enter spending between $0 and $1,000,000.");
      return;
    }
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    const value = {
      ...preferences,
      issuer_exclusions: exclusions
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    };
    void findMatches(value);
    navigate("/results");
  }
  return (
    <div className="page-width guided-shell">
      <aside className="guide-aside">
        <Link className="back-link" to="/">
          <ArrowLeft size={15} /> Back to home
        </Link>
        <p className="eyebrow">YOUR PERSONAL CARD SEARCH</p>
        <h2>
          A few details.
          <br />A clearer choice.
        </h2>
        <p>
          There’s no one-size-fits-all card.
          <br />
          Let’s find what fits you.
        </p>
        <ol className="step-list">
          {stepTitles.map((title, index) => (
            <li
              key={title}
              className={
                step === index ? "current" : step > index ? "complete" : ""
              }
              aria-current={step === index ? "step" : undefined}
            >
              <span>{step > index ? <Check size={14} /> : index + 1}</span>
              {title}
            </li>
          ))}
        </ol>
        <div className="privacy-note">
          <ShieldCheck size={19} />
          <p>No credit check. No account needed. Just your preferences.</p>
        </div>
      </aside>
      <section className="question-panel">
        <div className="progress-meta">
          <span>Step {step + 1} of 5</span>
          <span>{(step + 1) * 20}%</span>
        </div>
        <progress
          value={step + 1}
          max={5}
          aria-label="Questionnaire progress"
        />
        <p className="eyebrow question-kicker">{stepTitles[step]}</p>
        <h1 className="question-title" tabIndex={-1}>
          {questions[step]}
        </h1>
        <p className="question-help">
          {
            [
              "Choose your main goal. We’ll use it to focus your matches.",
              "Optional estimates help us compare rewards. No account details needed.",
              "We’ll only show cards within your limit.",
              "An explicit no-foreign-fee requirement will filter your results.",
              "These preferences help fine-tune your matches. You can leave them open.",
            ][step]
          }
        </p>
        <form onSubmit={next}>
          {step === 0 && (
            <fieldset className="choice-grid">
              <legend className="sr-only">Primary goal</legend>
              {goals.map(({ id, title, description, icon: Icon }) => (
                <label
                  className={`choice-card ${preferences.primary_goal === id ? "selected" : ""}`}
                  key={id}
                >
                  <input
                    type="radio"
                    name="goal"
                    value={id}
                    checked={preferences.primary_goal === id}
                    onChange={() =>
                      update({
                        primary_goal: id,
                        student: id === "student" ? true : preferences.student,
                      })
                    }
                  />
                  <Icon size={23} />
                  <strong>{title}</strong>
                  <span>{description}</span>
                  <span className="radio-indicator" />
                </label>
              ))}
            </fieldset>
          )}
          {step === 1 && (
            <>
              <div className="spending-grid">
                {(
                  [
                    "groceries",
                    "dining",
                    "gas",
                    "travel",
                    "transit",
                    "entertainment",
                    "online_shopping",
                    "drugstores",
                    "other",
                  ] as const
                ).map((category) => (
                  <label className="field" key={category}>
                    {label(category)}
                    <div className="money-input">
                      <span>$</span>
                      <input
                        aria-label={label(category)}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="1000000"
                        step="0.01"
                        placeholder="0"
                        value={preferences.monthly_spending?.[category] ?? ""}
                        onChange={(e) =>
                          update({
                            monthly_spending: {
                              ...preferences.monthly_spending,
                              [category]:
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </label>
                ))}
              </div>
              <div className="spending-total">
                <span>Estimated monthly spend</span>
                <strong>
                  {money(
                    Object.values(preferences.monthly_spending ?? {}).reduce(
                      (sum, n) => sum + n,
                      0,
                    ),
                  )}
                </strong>
              </div>
            </>
          )}
          {step === 2 && (
            <fieldset className="stack-choices">
              <legend className="sr-only">Annual fee limit</legend>
              {[
                {
                  value: 0,
                  title: "$0 only",
                  description: "Keep annual costs at zero",
                },
                {
                  value: 95,
                  title: "Up to $95",
                  description: "A modest fee for the right benefits",
                },
                {
                  value: 250,
                  title: "Up to $250",
                  description: "Room for more premium options",
                },
                {
                  value: null,
                  title: "No fixed limit",
                  description: "I’m open to higher fees if the benefits fit",
                },
              ].map((option) => (
                <label
                  className={`stack-choice ${preferences.max_annual_fee === option.value ? "selected" : ""}`}
                  key={String(option.value)}
                >
                  <input
                    type="radio"
                    name="fee"
                    checked={preferences.max_annual_fee === option.value}
                    onChange={() => update({ max_annual_fee: option.value })}
                  />
                  <span>
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {step === 3 && (
            <fieldset className="stack-choices">
              <legend className="sr-only">Foreign transaction fees</legend>
              {[
                {
                  value: null,
                  title: "I rarely travel internationally",
                  description: "No specific foreign-fee requirement",
                },
                {
                  value: false,
                  title: "I sometimes travel internationally",
                  description:
                    "I’m open to considering cards with foreign fees",
                },
                {
                  value: true,
                  title: "No foreign transaction fees",
                  description:
                    "This is a must-have. Exclude cards with unverified fees, too.",
                },
              ].map((option) => (
                <label
                  className={`stack-choice ${preferences.wants_no_foreign_transaction_fee === option.value ? "selected" : ""}`}
                  key={String(option.value)}
                >
                  <input
                    type="radio"
                    name="travel"
                    checked={
                      preferences.wants_no_foreign_transaction_fee ===
                      option.value
                    }
                    onChange={() =>
                      update({ wants_no_foreign_transaction_fee: option.value })
                    }
                  />
                  <span>
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {step === 4 && (
            <div className="additional-fields">
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={preferences.prefers_simple_rewards === true}
                  onChange={(e) =>
                    update({ prefers_simple_rewards: e.target.checked })
                  }
                />
                <span>
                  <strong>I like simple rewards</strong>
                  <small>Fewer categories to keep track of</small>
                </span>
              </label>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={preferences.intro_apr_priority}
                  onChange={(e) =>
                    update({ intro_apr_priority: e.target.checked })
                  }
                />
                <span>
                  <strong>Introductory purchase APR matters</strong>
                  <small>
                    Offers end; regular interest rates apply afterward
                  </small>
                </span>
              </label>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={preferences.student === true}
                  disabled={preferences.primary_goal === "student"}
                  onChange={(e) => update({ student: e.target.checked })}
                />
                <span>
                  <strong>I’m a student</strong>
                  <small>Include student-focused products</small>
                </span>
              </label>
              <label className="field">
                Approximate credit profile
                <select
                  value={preferences.credit_profile}
                  onChange={(e) =>
                    update({ credit_profile: e.target.value as CreditProfile })
                  }
                >
                  {[
                    "unknown",
                    "new",
                    "fair",
                    "good",
                    "very_good",
                    "excellent",
                  ].map((value) => (
                    <option key={value} value={value}>
                      {value === "unknown"
                        ? "Not sure / prefer not to say"
                        : label(value)}
                    </option>
                  ))}
                </select>
                <small>
                  A general preference signal, not an approval prediction.
                </small>
              </label>
              <label className="field">
                Issuers to exclude <span className="optional">(optional)</span>
                <input
                  maxLength={500}
                  placeholder="e.g. Chase, Capital One"
                  value={exclusions}
                  onChange={(e) => setExclusions(e.target.value)}
                />
                <small>Separate issuer names with commas.</small>
              </label>
            </div>
          )}
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              disabled={step === 0}
              onClick={() => {
                setStep(step - 1);
                setError("");
              }}
            >
              <ArrowLeft size={17} /> Back
            </button>
            {step === 1 && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  update({ monthly_spending: null });
                  setStep(2);
                }}
              >
                Skip spending
              </button>
            )}
            <button className="button" disabled={pending}>
              {step === 4 ? "Find my matches" : "Continue"}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
