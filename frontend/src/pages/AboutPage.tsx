export function AboutPage() {
  return (
    <article className="page-width content-page about-page">
      <p className="eyebrow">A CLEARER WAY TO CHOOSE</p>
      <h1>Understand your match.</h1>
      <p className="page-intro">
        CardMatch is a portfolio project built to make credit card comparisons
        understandable.
      </p>
      <section>
        <h2>Your preferences set the rules.</h2>
        <p>
          We first apply your annual-fee limit, issuer exclusions, student
          eligibility, and foreign-fee requirements. Inactive and business cards
          are excluded. An unverified foreign fee cannot satisfy a
          no-foreign-fee requirement.
        </p>
      </section>
      <section>
        <h2>Every score has a reason.</h2>
        <p>
          Eligible cards receive component scores for rewards, fees, goal,
          travel, introductory APR, simplicity, student fit, and approximate
          credit profile. Your primary goal sets the weights. Expand a result’s
          match breakdown to see both the component scores and their weights.
        </p>
        <p>
          A Match Score measures compatibility with your preferences. It is not
          a credit score or an estimate of approval chances. Credit profile
          information is only a general preference signal.
        </p>
      </section>
      <section>
        <h2>Estimates come with assumptions.</h2>
        <p>
          Annual reward estimates use your monthly spending multiplied by
          twelve. Points and miles use the valuation recorded in the local
          dataset; Venture miles use a one-cent travel baseline. We subtract the
          annual fee for estimated net value. Interest, welcome offers, credits,
          portal bonuses, and unmodeled benefits are excluded. Merchant
          restrictions apply. With no spending supplied, rewards fit uses only
          the base earn rate.
        </p>
      </section>
      <section>
        <h2>A small, reviewed starting collection.</h2>
        <p>
          The initial catalog contains six cards across two issuers. It is not a
          comprehensive market comparison. External records are adapted from the{" "}
          <a href="https://67.credit/data" target="_blank" rel="noreferrer">
            67.CREDIT dataset
          </a>{" "}
          under{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          , with issuer-reviewed corrections and conservative reward rules. Each
          card links to both its source and issuer. Terms change; review those
          links before applying.
        </p>
      </section>
      <section>
        <h2>AI helps with the input.</h2>
        <p>
          When enabled, AI translates a description into editable preferences.
          The same deterministic engine compares cards in either mode. AI never
          supplies card facts or independently ranks cards. Guided search works
          without an AI service.
        </p>
      </section>
      <section>
        <h2>Only the information we need.</h2>
        <p>
          No account, credit pull, bank connection, or sensitive identifiers are
          needed. Preferences are held in browser memory and sent to the backend
          to calculate results. Refreshing clears the session. If you use AI
          assistance, your description is sent to the configured AI provider.
          Never enter account numbers, passwords, or Social Security numbers.
        </p>
      </section>
    </article>
  );
}
