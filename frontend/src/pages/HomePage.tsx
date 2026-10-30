import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export function HomePage() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    api
      .health()
      .then(() => api.cards())
      .then((cards) => {
        if (alive) setCount(cards.length);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return (
    <>
      <section className="hero page-width">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> YOUR SPENDING. YOUR PRIORITIES.
          </p>
          <h1>
            Your next card.
            <br />
            <span>A better fit.</span>
          </h1>
          <p className="hero-description">
            Make your everyday spending work a little harder. Find credit cards
            that fit your life, with clear reasons behind every match.
          </p>
          <Link className="button" to="/guided">
            Find my match <ArrowRight size={18} />
          </Link>
          <p className="hero-note">
            <Check size={14} /> No sign-up <span>·</span> No credit check{" "}
            <span>·</span> About 2 minutes
          </p>
        </div>
        <div
          className="hero-art"
          aria-label="Illustration of a personalized card comparison"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-label">
            <span className="status-dot" /> MADE FOR YOUR EVERYDAY
          </div>
          <div className="illustration-card back-card">
            <span>More possibilities.</span>
            <span className="card-circle" />
          </div>
          <div className="illustration-card front-card">
            <div className="art-card-top">
              <span>CardMatch.</span>
              <Compass size={27} />
            </div>
            <div className="chip">
              <span />
              <span />
            </div>
            <div className="art-card-bottom">
              <span>
                YOUR EVERYDAY
                <br />
                <strong>ADVANTAGE</strong>
              </span>
              <span className="card-rings">
                <i />
                <i />
              </span>
            </div>
          </div>
          <div className="art-note">
            <span className="check-disc">
              <Check size={19} />
            </span>
            <div>
              <strong>A match that makes sense</strong>
              <small>Built around what matters to you</small>
            </div>
          </div>
          <span className="art-caption">A clearer way to choose.</span>
        </div>
      </section>
      <section className="trust-strip">
        <div className="page-width trust-inner">
          <span>
            <ShieldCheck size={18} /> No account details needed
          </span>
          <span>
            <ListChecks size={18} /> Explainable, consistent rankings
          </span>
          <span>
            <Compass size={18} />{" "}
            {count === null
              ? "Issuer-linked card information"
              : `${count} reviewed cards in our starting collection`}
          </span>
        </div>
      </section>
      <section className="page-width paths-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">START WITH YOU</p>
            <h2>Two ways to find your fit.</h2>
          </div>
          <p>
            A few details are all we need.
            <br />
            Choose the approach that feels right.
          </p>
        </div>
        <div className="path-grid">
          <Link to="/guided" className="path-card">
            <div className="path-top">
              <span className="feature-icon">
                <ListChecks />
              </span>
              <span className="badge">A great place to start</span>
            </div>
            <h3>A few questions. Better matches.</h3>
            <p>
              Tell us about your goals, spending, and must-haves. We’ll take
              care of the comparison.
            </p>
            <span className="text-link">
              Start guided search <ArrowRight size={18} />
            </span>
          </Link>
          <Link to="/ai" className="path-card alternate">
            <div className="path-top">
              <span className="feature-icon">
                <Sparkles />
              </span>
              <span className="quiet-badge">Optional AI assistance</span>
            </div>
            <h3>Put it in your own words.</h3>
            <p>
              Describe what you’re looking for, then review your preferences
              before comparing cards.
            </p>
            <span className="text-link">
              Describe what you want <ArrowUpRight size={18} />
            </span>
          </Link>
        </div>
      </section>
      <section id="how-it-works" className="how-section">
        <div className="page-width">
          <p className="eyebrow">LESS GUESSWORK, MORE CLARITY</p>
          <h2>A thoughtful match in three steps.</h2>
          <div className="steps-grid">
            {[
              [
                "01",
                "Tell us what matters",
                "Cash back, travel, or a fresh start. Begin with your goals and everyday spending.",
              ],
              [
                "02",
                "We do the comparison",
                "Your requirements narrow the field. A consistent scoring model ranks the remaining cards.",
              ],
              [
                "03",
                "See the whole picture",
                "Explore the reasons, the tradeoffs, and the numbers. The final decision is always yours.",
              ],
            ].map(([number, title, description]) => (
              <div key={number}>
                <span className="step-number">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
