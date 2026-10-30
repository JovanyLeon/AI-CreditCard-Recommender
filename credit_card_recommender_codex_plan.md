# AI-Powered Credit Card Recommender
## Codex Project Brief, Architecture, Implementation Plan, and UX Specification

> This document is the source of truth for implementing the project.
>
> Codex should read this entire document before making architectural changes.
>
> The most important constraint is:
>
> **The application must work end-to-end without OpenAI. OpenAI integration comes last.**

---

# 1. Project Summary

Build a portfolio-quality full-stack credit card recommendation application using:

- React
- TypeScript
- FastAPI
- Python
- REST APIs
- OpenAI API as the final integration

Original project framing:

> **AI-Powered Credit Card Recommender | React, TypeScript, FastAPI, REST API, OpenAI API**
>
> - Built a full-stack credit card recommender using React, TypeScript, and the OpenAI API to translate user goals and preferences into ranked recommendations.
> - Developed a FastAPI backend to process structured user preferences, apply filtering constraints, and return ranked, explainable card recommendations through REST APIs.

The implementation should strengthen that idea by making the recommendation system deterministic and testable, while using AI only where it adds value.

---

# 2. Core Product Idea

The product has two paths:

## Guided Mode

The user answers structured questions about:

- primary goal;
- spending categories;
- annual-fee tolerance;
- travel needs;
- rewards preferences;
- student status;
- introductory APR interest;
- issuer exclusions;
- approximate credit profile.

These answers directly produce a structured `RecommendationRequest`.

No AI is required.

## AI Mode

The user writes naturally, for example:

> I'm a student. I spend mostly on groceries and restaurants. I don't want an annual fee and I rarely travel.

OpenAI converts the message into the same structured `RecommendationRequest` used by Guided Mode.

The deterministic recommendation engine then performs:

1. hard filtering;
2. scoring;
3. ranking;
4. explanation generation.

OpenAI must **not** independently decide which cards are best.

---

# 3. Architectural Principle

The product architecture should be:

```text
                    ┌─────────────────────┐
                    │     React Client    │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴──────────────┐
                 │                            │
          Guided Questionnaire          AI Text Input
                 │                            │
                 │                     FINAL PHASE ONLY
                 │                            │
                 │                       OpenAI Parser
                 │                            │
                 └──────────────┬─────────────┘
                                │
                    RecommendationRequest
                                │
                                ▼
                    ┌───────────────────────┐
                    │ FastAPI Recommendation│
                    │        Engine         │
                    └──────────┬────────────┘
                               │
                Hard Filters → Scoring → Ranking
                               │
                               ▼
                     Ranked Credit Cards
                               │
                               ▼
                    Explanation + Results
```

The most important invariant is:

```text
Questionnaire ──────┐
                    ▼
             RecommendationRequest
                    │
                    ▼
             Recommendation Engine
                    │
                    ▼
                Results
                    ▲
                    │
AI Input → OpenAI Parser
```

There is **one recommendation engine**.

There are **two ways to create its input**.

OpenAI is an enhancement to the system, not a dependency of the system.

---

# 4. Non-Negotiable Architecture Rules

Codex must follow these rules:

1. Do not install the OpenAI SDK until the final AI phase.
2. Do not require an API key until the entire non-AI application works.
3. The recommendation algorithm must be deterministic.
4. Credit card facts must come from the application's card dataset, never from the language model.
5. OpenAI may interpret user intent and optionally rewrite explanations, but may not invent card facts.
6. Both AI mode and Guided mode must ultimately call the same recommendation service.
7. Recommendation logic must live outside FastAPI route handlers.
8. Business logic must be independently unit testable.
9. Frontend components must not contain scoring rules.
10. API contracts must use typed Pydantic models.
11. TypeScript interfaces should match backend response contracts.
12. The application must operate gracefully when AI functionality is disabled.
13. The OpenAI API key must exist only on the backend.
14. Never commit `.env` files or secrets.
15. Never claim that a recommendation guarantees card approval.
16. Avoid unnecessary architecture such as microservices, authentication, vector databases, agents, or RAG in V1.
17. Prefer explicit, typed, testable code over abstraction or cleverness.

---

# 5. Repository Structure

Recommended monorepo:

```text
credit-card-recommender/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── questionnaire/
│   │   │   ├── ai/
│   │   │   ├── recommendations/
│   │   │   └── common/
│   │   ├── features/
│   │   │   ├── questionnaire/
│   │   │   ├── recommendations/
│   │   │   └── ai/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── GuidedPage.tsx
│   │   │   ├── AiRecommendPage.tsx
│   │   │   ├── ResultsPage.tsx
│   │   │   └── CardDetailsPage.tsx
│   │   ├── types/
│   │   │   ├── card.ts
│   │   │   └── recommendation.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cards.py
│   │   │   ├── recommendations.py
│   │   │   ├── health.py
│   │   │   └── ai.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── data/
│   │   │   └── cards.json
│   │   ├── domain/
│   │   │   ├── card.py
│   │   │   ├── preferences.py
│   │   │   └── recommendation.py
│   │   ├── providers/
│   │   │   ├── base.py
│   │   │   ├── opencard_db.py
│   │   │   ├── sixty_seven_credit.py
│   │   │   └── cardapi.py
│   │   ├── services/
│   │   │   ├── card_repository.py
│   │   │   ├── card_normalizer.py
│   │   │   ├── filters.py
│   │   │   ├── scoring.py
│   │   │   ├── recommender.py
│   │   │   ├── explanations.py
│   │   │   └── ai_parser.py
│   │   └── main.py
│   ├── scripts/
│   │   └── import_cards.py
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/
│   ├── pyproject.toml
│   └── .env.example
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── .gitignore
└── README.md
```

---

# 6. Card Data Strategy

Do **not** manually create every card from scratch.

The better architecture is:

```text
External Credit Card Dataset/API
          ↓
     Data Provider
          ↓
     Normalization Layer
          ↓
Your Canonical CreditCard Model
          ↓
Local Card Repository
          ↓
Recommendation Engine
```

The recommendation engine should never depend directly on a third-party schema.

## Why this architecture is better

It gives the project:

- broader card coverage;
- cleaner data ownership;
- provider independence;
- deterministic recommendations;
- easier testing;
- easier migration between data providers;
- a stronger interview story.

A useful interview explanation:

> I designed the card-data layer behind an abstraction so the recommendation engine is not coupled to a specific third-party provider.

---

# 7. Potential External Card Data Sources

These sources were discussed as possible starting points.

Always verify current licensing, API behavior, coverage, and terms before production use.

## 67.CREDIT

Website:

https://67.credit/data

Previously identified as offering a structured U.S. card dataset with fields such as:

- annual fee;
- APR;
- credit profile;
- reward rates;
- welcome offers;
- verification timestamps.

Good candidate for seeding the initial local dataset.

## OpenCard DB

Repository:

https://github.com/thedavidweng/opencard-db

Potentially useful because it offers structured credit-card data and downloadable exports.

Good open-source option.

## CardAPI

Website:

https://cardapi.dev/

Potentially useful as a more polished API source for:

- reward structures;
- fees;
- benefits;
- APR;
- eligibility;
- transfer partners.

May be more useful later if the project needs live provider-backed refreshes.

## Recommendation

For V1:

```text
External Dataset
      ↓
Import Script
      ↓
Normalizer
      ↓
Local Canonical Dataset
      ↓
Recommender
```

Do not make a live external API request every time a user asks for recommendations.

The system should already have local normalized card data available.

---

# 8. Card Coverage Goal

Do not try to support literally every credit card in existence.

That target is not realistic because of:

- regional banks;
- credit unions;
- co-branded cards;
- business cards;
- invite-only cards;
- secured products;
- geographically restricted cards;
- frequently changing offers;
- cards that open and close regularly.

A better project goal is:

> Support 100+ actively available U.S. consumer credit cards across major issuers.

Or later:

> Support 200+ U.S. cards normalized from external datasets.

Prioritize data quality over raw card count.

---

# 9. Canonical Credit Card Domain Model

Codex should create its own internal schema.

Example:

```python
class CreditCard(BaseModel):
    id: str
    name: str
    issuer: str
    network: str | None
    card_type: CardType

    annual_fee: float
    foreign_transaction_fee_percent: float | None

    reward_rules: list[RewardRule]
    welcome_offer: WelcomeOffer | None

    intro_purchase_apr_months: int | None
    intro_balance_transfer_apr_months: int | None

    perks: list[str]
    tags: list[str]

    credit_profile: CreditProfile | None

    source_url: str
    terms_url: str | None
    last_verified_at: date

    active: bool
```

Possible `CardType` values:

```text
general
student
secured
business
```

---

# 10. Reward Model

Example:

```json
{
  "category": "dining",
  "rate": 3.0,
  "unit": "percent"
}
```

Use controlled spending categories rather than arbitrary strings.

Possible categories:

```text
dining
groceries
gas
travel
transit
entertainment
online_shopping
drugstores
all
other
```

The data model should not be designed around one issuer's reward structure.

If reward structures become too complicated to model exactly, use a documented simplification rather than pretending the calculation is exact.

---

# 11. External Provider Abstraction

Create a provider interface approximately like:

```python
class CardDataProvider(Protocol):
    async def get_cards(self) -> list[ExternalCard]:
        ...
```

Possible providers:

```python
class OpenCardDbProvider:
    ...

class SixtySevenCreditProvider:
    ...

class CardApiProvider:
    ...
```

The rest of the application should only understand the canonical `CreditCard` model.

The adapter should convert provider-specific data:

```python
def convert_external_card(raw: ExternalCard) -> CreditCard:
    return CreditCard(
        id=raw.slug,
        name=raw.name,
        issuer=raw.issuer,
        annual_fee=raw.annual_fee or 0,
        ...
    )
```

---

# 12. Data Import Behavior

External providers should primarily be used for ingestion or refresh.

Do not use this pattern:

```text
User Request
    ↓
Third-Party Card API
    ↓
Immediate Ranking
```

Prefer:

```text
            DATA INGESTION

External Dataset
      ↓
Normalizer
      ↓
Local Card Repository
      ↓

        USER REQUEST PATH

User Preferences
      ↓
Recommendation Engine
      ↓
Local Card Repository
      ↓
Rankings
```

This makes recommendations:

- fast;
- deterministic;
- testable;
- resilient to provider downtime;
- independent of provider rate limits.

---

# 13. Data Validation

Every imported card should be validated.

Tests should ensure:

- unique IDs;
- non-empty card names;
- valid issuer;
- non-negative annual fees;
- valid reward categories;
- valid percentages;
- valid source URLs;
- valid verification dates;
- valid active status;
- valid enum values.

Every production card should include:

```text
source_url
last_verified_at
```

Card terms change over time, so data freshness should be visible.

OpenAI must never be responsible for generating or refreshing card terms.

---

# 14. Recommendation Request Model

Create a single request model used everywhere.

Example:

```python
class RecommendationRequest(BaseModel):
    primary_goal: PrimaryGoal

    monthly_spending: MonthlySpending | None = None

    max_annual_fee: float | None = None

    credit_profile: CreditProfile = CreditProfile.UNKNOWN

    wants_no_foreign_transaction_fee: bool | None = None

    prefers_simple_rewards: bool | None = None

    intro_apr_priority: bool = False

    student: bool | None = None

    issuer_exclusions: list[str] = []

    top_n: int = 3
```

Possible goals:

```text
cash_back
travel
build_credit
student
intro_apr
everyday_spending
```

Credit profile values:

```text
new
fair
good
very_good
excellent
unknown
```

Do not request:

- Social Security numbers;
- credit card numbers;
- bank account numbers;
- passwords;
- bank login credentials.

Approximate user preferences are sufficient.

---

# 15. Deterministic Recommendation Engine

This is the core of the project.

Pipeline:

```text
RecommendationRequest
        ↓
Hard Constraints
        ↓
Remaining Cards
        ↓
Calculate Score Components
        ↓
Weighted Score
        ↓
Stable Sort
        ↓
Top N
        ↓
Generate Explanation
```

---

# 16. Hard Filters

Hard constraints must be applied before scoring.

Examples:

## Annual Fee

If:

```text
max_annual_fee = 0
```

remove cards with annual fees greater than zero.

## Foreign Transaction Fee

If:

```text
wants_no_foreign_transaction_fee = true
```

cards with foreign transaction fees should either:

- be filtered if the preference is a strict requirement; or
- be heavily penalized if the product treats it as a soft preference.

Prefer a true filter when the user explicitly states it as mandatory.

## Student Preference

If the user specifically wants student-oriented products, prioritize or filter accordingly.

## Issuer Exclusions

If:

```json
{
  "issuer_exclusions": ["Example Bank"]
}
```

exclude cards from that institution.

## Active Status

Inactive cards must never appear in recommendation results.

---

# 17. Scoring Engine

Each remaining card receives component scores from:

```text
0.0 – 1.0
```

Possible components:

```text
rewards_fit
annual_fee_fit
goal_fit
travel_fit
intro_apr_fit
simplicity_fit
student_fit
credit_profile_fit
```

Final score:

```text
weighted score =
Σ(component_score × component_weight)
```

Presentation score:

```text
0 – 100
```

Weights should depend on the user's primary goal.

Example:

```python
GOAL_WEIGHTS = {
    PrimaryGoal.CASH_BACK: {
        "rewards_fit": 0.45,
        "annual_fee_fit": 0.20,
        "goal_fit": 0.20,
        "simplicity_fit": 0.15,
    }
}
```

Do not scatter magic numbers throughout the codebase.

Store weights centrally.

---

# 18. Spending-Based Reward Fit

Users may optionally provide monthly spending.

Example:

```json
{
  "groceries": 350,
  "dining": 250,
  "gas": 100,
  "travel": 50,
  "other": 300
}
```

Use these values to estimate how closely each card matches the user's spending.

OpenAI should never calculate reward value.

The deterministic backend owns reward calculations.

---

# 19. Recommendation Output Model

Example:

```python
class RecommendationResult(BaseModel):
    rank: int
    card: CreditCard
    score: float
    score_breakdown: dict[str, float]
    matched_preferences: list[str]
    tradeoffs: list[str]
    explanation: str
```

Example response:

```json
{
  "rank": 1,
  "card": {
    "id": "example-card",
    "name": "Example Card"
  },
  "score": 88.4,
  "score_breakdown": {
    "rewards_fit": 94,
    "annual_fee_fit": 100,
    "goal_fit": 82
  },
  "matched_preferences": [
    "No annual fee",
    "Strong grocery rewards",
    "Matches cash-back goal"
  ],
  "tradeoffs": [
    "Limited travel benefits"
  ],
  "explanation": "This card ranks highly because..."
}
```

---

# 20. Deterministic Explanations

Explanations must work before AI exists.

Create an `explanations.py` service.

A useful explanation should include:

1. strongest matching factor;
2. second strongest factor;
3. relevant constraint;
4. one meaningful tradeoff when available.

Example:

```text
This card matches your preference for no annual fee and scores highly for
grocery and dining purchases. It has fewer travel-focused benefits than some
alternatives.
```

This makes explainability independent of OpenAI.

---

# 21. REST API

Implement:

```http
GET /api/v1/health
GET /api/v1/cards
GET /api/v1/cards/{card_id}
POST /api/v1/recommendations
```

Example recommendation request:

```http
POST /api/v1/recommendations
Content-Type: application/json
```

```json
{
  "primary_goal": "cash_back",
  "monthly_spending": {
    "groceries": 300,
    "dining": 200,
    "gas": 100,
    "travel": 0,
    "other": 300
  },
  "max_annual_fee": 0,
  "wants_no_foreign_transaction_fee": false,
  "prefers_simple_rewards": true,
  "student": true,
  "top_n": 3
}
```

The route handler should coordinate:

```text
validate request
→ call recommendation service
→ serialize result
```

The route handler must not contain scoring rules.

---

# 22. Frontend Product Direction

The frontend should look like a **clean fintech decision tool**, not a flashy AI demo.

Avoid making the product feel like:

> ChatGPT for credit cards.

The strongest product story is:

> AI helps understand the user's preferences.
> The recommendation engine compares and ranks the cards.

Visual direction:

- white or very light background;
- dark navy or charcoal text;
- one primary accent color such as blue, indigo, or teal;
- large rounded cards;
- subtle shadows and borders;
- generous spacing;
- little visual clutter;
- clearly separated financial information;
- restrained animation.

Avoid:

- excessive gradients;
- neon AI aesthetics;
- glassmorphism everywhere;
- excessive motion;
- robot imagery;
- gimmicky "Powered by GPT" branding.

Think modern fintech comparison product rather than generic chatbot.

---

# 23. Homepage UX

Suggested structure:

```text
-------------------------------------------------------

             Find the right credit card
               for how you actually spend.

     Compare cards based on your goals, spending,
        fees, rewards, and personal preferences.

      [ Describe What You Want ]
            AI-powered

      [ Answer a Few Questions ]
          Guided recommendation

-------------------------------------------------------

                  How it works

        1              2               3
    Tell us       We compare       See your
    your goals     the cards       best matches

-------------------------------------------------------
```

Two primary entry cards:

```text
┌──────────────────────────────────┐
│ ✨ Describe what you're looking for │
│                                  │
│ Tell us naturally what matters   │
│ to you.                           │
│                                  │
│ [ Try AI Recommendations → ]     │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ✓ Answer a few questions         │
│                                  │
│ Walk through your preferences    │
│ step by step.                    │
│                                  │
│ [ Start Guided Search → ]        │
└──────────────────────────────────┘
```

Before OpenAI exists, the AI route may be disabled or marked as coming later.

The Guided path must be fully functional first.

---

# 24. Guided Questionnaire UX

Do not place every question on one page.

Use a multi-step flow.

Progress indicator:

```text
Step 2 of 5

████████████████░░░░░░░░
```

One major decision per screen.

---

# 25. Guided Step 1 — Primary Goal

Example cards:

```text
What matters most to you?

┌─────────────────────┐
│ 💵 Cash Back        │
│ Earn rewards on     │
│ everyday purchases  │
└─────────────────────┘

┌─────────────────────┐
│ ✈ Travel Rewards    │
│ Earn points or      │
│ miles for travel    │
└─────────────────────┘

┌─────────────────────┐
│ 🎓 Student Card     │
│ Build credit while  │
│ you're in school    │
└─────────────────────┘

┌─────────────────────┐
│ 📉 Intro APR        │
│ Reduce interest on  │
│ purchases initially │
└─────────────────────┘
```

Make the entire card clickable rather than relying on tiny radio buttons.

---

# 26. Guided Step 2 — Spending

Example:

```text
How much do you typically spend each month?

Groceries
$ [ 350 ]

Dining
$ [ 200 ]

Gas
$ [ 100 ]

Travel
$ [ 100 ]

Other
$ [ 500 ]

Estimated monthly spend: $1,250
```

Spending inputs should be optional.

Include:

```text
Skip this step
```

---

# 27. Guided Step 3 — Annual Fee

Use understandable choices:

```text
How much are you willing to pay in annual fees?

○ $0 only

○ Up to $95

○ Up to $250

○ I'm open to higher fees if the benefits are worth it

○ No preference
```

Internally convert the selection into the appropriate numeric or nullable field.

---

# 28. Guided Step 4 — Travel

Ask whether avoiding foreign transaction fees matters.

Possible options:

```text
I rarely travel internationally
I sometimes travel internationally
No foreign transaction fee is important to me
```

Translate these to the structured preference model.

---

# 29. Guided Step 5 — Other Preferences

Ask about:

- simple rewards;
- introductory APR;
- student card preference;
- approximate credit profile;
- optional issuer exclusions.

Keep the form lightweight.

---

# 30. AI Mode UX

The AI page should not look like a full chatbot.

Prefer a single prompt box plus at most a few follow-up questions.

Example:

```text
Tell us what you're looking for

┌─────────────────────────────────────────┐
│ I'm a student. I spend a lot on        │
│ restaurants and groceries. I don't     │
│ want an annual fee and don't travel    │
│ very often.                             │
│                                         │
└─────────────────────────────────────────┘

Examples:
"No annual fee and good grocery rewards"
"I travel a lot and want lounge benefits"
"I'm trying to build credit"

              [ Find My Cards ]
```

Do not create an unlimited conversational assistant unless there is a compelling future reason.

This product is a recommender, not a finance chatbot.

---

# 31. AI Interpretation Preview

One of the strongest frontend features is showing what the AI understood.

Example:

```text
Here's what we understood

┌─────────────────────────────────────────┐
│ Goal                 Cash Back          │
│ Annual Fee           $0                 │
│ Main Spending        Groceries, Dining  │
│ Travel Priority      Low                │
│ Student              Yes                │
│                                         │
│                     [ Edit Preferences ]│
└─────────────────────────────────────────┘
```

Allow the user to edit the interpreted preferences before rerunning recommendations.

This makes the AI behavior transparent and controllable.

---

# 32. Results Page

The results page should receive substantial design attention.

Example heading:

```text
Your Best Matches

Based on your preferences, we compared 187 cards.

[ Edit Preferences ]      [ Start Over ]
```

Primary result example:

```text
┌──────────────────────────────────────────────────┐
│ #1 BEST MATCH                          92 / 100   │
│                                                  │
│ Example Cash Back Card                           │
│ Example Issuer                                   │
│                                                  │
│ Annual Fee       $0                              │
│ Grocery Rewards  3%                              │
│ Dining Rewards   3%                              │
│ Foreign Fee      3%                              │
│                                                  │
│ Why it matches                                   │
│ ✓ No annual fee                                  │
│ ✓ Strong rewards in your top categories          │
│ ✓ Simple cash-back structure                     │
│                                                  │
│ Tradeoff                                         │
│ ⚠ Not ideal for international travel             │
│                                                  │
│ [ View Details ]        [ Visit Issuer ]          │
└──────────────────────────────────────────────────┘
```

The #1 recommendation should be visually dominant.

#2 and #3 may use slightly more compact cards.

---

# 33. Match Score

Do not label it:

```text
AI Score
```

Do not imply:

```text
88% chance of approval
```

Use:

```text
Match Score
92 / 100
```

Add explanation:

```text
Match Score measures how closely this card aligns
with the preferences you provided.
```

This score represents recommendation compatibility, not approval odds.

---

# 34. Score Breakdown

Expose the deterministic scoring model visually.

Example:

```text
Match Breakdown

Rewards Fit       ██████████████████░░  92
Annual Fee Fit    ████████████████████ 100
Goal Fit          █████████████████░░░  86
Travel Fit        ███████████░░░░░░░░░  55
Simplicity        ███████████████████░  95
```

This is a strong portfolio feature because it demonstrates explainability.

A useful interview explanation:

> The UI exposes the score breakdown so recommendations are explainable rather than opaque.

---

# 35. Comparison Mode

After the core results page works, add:

```text
[ Compare Top 3 ]
```

Suggested comparison view:

| Attribute | Card A | Card B | Card C |
|---|---:|---:|---:|
| Match Score | 92 | 87 | 82 |
| Annual Fee | $0 | $95 | $0 |
| Grocery Reward | 3% | 4x | 2% |
| Dining | 3% | 3x | 3% |
| Foreign Transaction Fee | 3% | $0 | $0 |
| Best For | Everyday spending | Travel | Simplicity |

On mobile, avoid a cramped horizontal table.

Convert the comparison into vertically stacked card sections.

---

# 36. Card Details Page

A card details page or side panel should show:

```text
Card Name
Issuer

Match Score
Why we recommended it

Rewards
Annual Fee
Intro APR
Welcome Offer
Foreign Transaction Fee
Key Benefits
Potential Drawbacks

Recommended because:
✓ ...
✓ ...

Potential tradeoffs:
• ...
• ...

Last verified: October 2026
View official terms →
```

Showing `last_verified_at` improves transparency because credit-card terms change.

---

# 37. Navigation

Keep navigation minimal.

Suggested:

```text
[Logo] CardMatch

Find Cards
Compare
How It Works
About
```

Do not invent unnecessary sections such as:

```text
Dashboard
Profile
Notifications
Settings
Messages
```

unless accounts are added later for a real product reason.

---

# 38. Reusable Frontend Components

Suggested component structure:

```text
components/
│
├── layout/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── PageContainer.tsx
│
├── questionnaire/
│   ├── QuestionCard.tsx
│   ├── ProgressBar.tsx
│   ├── GoalSelector.tsx
│   ├── SpendingForm.tsx
│   └── FeeSelector.tsx
│
├── ai/
│   ├── AiInput.tsx
│   ├── ExamplePrompt.tsx
│   └── InterpretedPreferences.tsx
│
├── recommendations/
│   ├── RecommendationCard.tsx
│   ├── MatchScore.tsx
│   ├── ScoreBreakdown.tsx
│   ├── TradeoffList.tsx
│   └── PreferenceMatches.tsx
│
└── common/
    ├── Button.tsx
    ├── Badge.tsx
    ├── LoadingSpinner.tsx
    ├── ErrorMessage.tsx
    └── EmptyState.tsx
```

Do not let every page invent its own button, card, spacing, and color system.

---

# 39. Badges

Use badges sparingly.

Examples:

```text
[ No Annual Fee ]

[ Great for Dining ]

[ Travel ]

[ Student ]

[ 0% Intro APR ]
```

Three or four meaningful badges are better than a wall of labels.

---

# 40. Loading States

Avoid generic:

```text
Loading...
```

Prefer:

```text
Finding your best matches...

Comparing rewards, fees, and preferences.
```

For AI:

```text
Understanding your preferences...
```

then:

```text
Comparing matching cards...
```

Skeleton recommendation cards may be displayed underneath.

---

# 41. Empty Results State

Design strict-filter outcomes intentionally.

Example:

```text
We couldn't find a card matching every preference.

Your current requirements:
• $0 annual fee
• No foreign transaction fee
• Student card
• Premium travel rewards

Try relaxing one preference.

[ Edit Preferences ]
```

Do not show only:

```text
No results.
```

---

# 42. Error States

Example:

```text
We couldn't load recommendations.

Your preferences are still saved.

[ Try Again ]

or

[ Use Guided Search ]
```

If AI is unavailable:

```text
AI recommendations are temporarily unavailable.
You can still use the guided recommender.
```

AI failure must never break the core product.

---

# 43. Mobile Design

The app must work cleanly on mobile.

Desktop:

```text
[ #1 recommendation ] [ #2 recommendation ]
[ #3 recommendation ]
```

Mobile:

```text
[ #1 recommendation ]

[ #2 recommendation ]

[ #3 recommendation ]
```

Questionnaire buttons should become full width.

Avoid desktop-oriented comparison tables on narrow screens.

---

# 44. Recommended End-to-End UX

```text
Landing Page
     │
     ├───────────────┐
     ▼               ▼
AI Search        Guided Search
     │               │
Natural text      5-step form
     │               │
     ▼               │
Interpretation       │
     │               │
     └───────┬───────┘
             ▼
      Preference Summary
             │
             ▼
        Results Page
             │
       ┌─────┴─────┐
       ▼           ▼
  Card Details   Compare
```

---

# 45. Implementation Phases

Codex should work one phase at a time.

Do not jump ahead.

---

# 46. Phase 0 — Project Foundation

## Backend

Create FastAPI application.

Endpoint:

```http
GET /api/v1/health
```

Response:

```json
{
  "status": "ok"
}
```

Recommended backend tooling:

- Python 3.12+
- FastAPI
- Pydantic
- pytest
- httpx
- Ruff

Configure CORS for the React development origin.

## Frontend

Create React + TypeScript application using Vite.

Create the initial landing page.

The two eventual actions should be visible:

```text
Describe What You Want
Answer a Few Questions
```

Before AI exists, the first action may be disabled.

## Acceptance Criteria

- backend starts;
- frontend starts;
- frontend can call `/api/v1/health`;
- no OpenAI dependency exists.

---

# 47. Phase 1 — Domain Model and Card Data Layer

Implement:

- canonical `CreditCard`;
- reward schemas;
- provider interface;
- card normalizer;
- local repository;
- import script;
- dataset validation.

Start with a manageable subset of cards during development.

Expand card count after the recommendation engine stabilizes.

OpenAI is still forbidden.

---

# 48. Phase 2 — Recommendation Input Model

Create:

- `RecommendationRequest`;
- primary goal enum;
- credit profile enum;
- spending model;
- validation rules.

Ensure invalid states are rejected by Pydantic when possible.

OpenAI is still forbidden.

---

# 49. Phase 3 — Deterministic Recommendation Engine

Implement:

- hard filters;
- scoring components;
- centralized goal weights;
- stable sorting;
- top-N ranking;
- deterministic explanations.

Do not build the final recommendation UI until this logic is reliable.

---

# 50. Phase 4 — Backend REST API

Implement:

```http
GET /api/v1/health
GET /api/v1/cards
GET /api/v1/cards/{card_id}
POST /api/v1/recommendations
```

Keep route handlers thin.

OpenAI is still forbidden.

---

# 51. Phase 5 — Backend Testing Gate

Required tests:

## Filtering

- removes cards over annual-fee constraint;
- honors issuer exclusions;
- handles no-foreign-fee requirement;
- ignores inactive cards.

## Scoring

- identical inputs produce identical scores;
- grocery-heavy profiles favor expected grocery fixtures;
- travel-focused profiles change rankings appropriately;
- no-fee preference improves relevant rankings;
- scores never exceed defined range.

## Ranking

- descending score;
- `top_n` works;
- stable tie resolution.

Recommended tie breaker:

```text
score descending
reward fit descending
annual fee ascending
card id ascending
```

## Edge Cases

Test:

```text
empty optional spending
unknown credit profile
no matching cards
top_n larger than dataset
negative spending
invalid annual fee
unknown enum
```

Do not proceed until backend tests pass.

---

# 52. Phase 6 — Guided React Experience

Build:

- multi-step questionnaire;
- progress indicator;
- primary-goal selection;
- optional spending inputs;
- annual-fee selection;
- travel preferences;
- additional preferences;
- request conversion;
- results submission.

This path must work entirely without AI.

---

# 53. Phase 7 — Results UX

Build:

- ranked recommendation cards;
- Match Score;
- score breakdown;
- matched preferences;
- tradeoffs;
- source links;
- card details;
- empty state;
- loading state;
- error state;
- edit preferences;
- start over.

Comparison mode may be added after the main results path is stable.

---

# 54. Phase 8 — Frontend Testing

Test:

```text
questionnaire navigation
form validation
request conversion
loading state
API failure state
empty results state
recommendation rendering
score breakdown
restart questionnaire
```

Add at least one end-to-end flow:

```text
Home
→ Guided Mode
→ Answer Questions
→ Submit
→ Backend
→ Results
```

No OpenAI credentials may be required.

---

# 55. Hard Non-AI Completion Gate

STOP before OpenAI.

The application must pass this test:

```text
Delete OPENAI_API_KEY.
Do not install the OpenAI SDK.
Start backend.
Start frontend.
Complete questionnaire.
Receive meaningful recommendations.
See ranked cards.
See explanations.
See tradeoffs.
Run frontend tests.
Run backend tests.
Build frontend production bundle.
```

Everything above must succeed.

Only then may Codex implement AI.

---

# 56. Phase 9 — OpenAI Integration

OpenAI becomes an adapter into the existing system.

It is not the recommendation engine.

Backend configuration:

```env
ENABLE_OPENAI=false
OPENAI_API_KEY=
OPENAI_MODEL=
```

The key must never be exposed in the frontend.

The model must be configurable rather than hard-coded throughout the codebase.

Use the current OpenAI recommended API for new projects at implementation time.

Prefer structured schema-based output rather than free-form parsing.

---

# 57. AI Intent Model

Create a structured model approximately like:

```python
class ParsedRecommendationIntent(BaseModel):
    primary_goal: PrimaryGoal | None

    monthly_spending: MonthlySpending | None

    max_annual_fee: float | None

    credit_profile: CreditProfile

    wants_no_foreign_transaction_fee: bool | None

    prefers_simple_rewards: bool | None

    intro_apr_priority: bool

    student: bool | None

    issuer_exclusions: list[str]

    missing_information: list[str]

    needs_follow_up: bool

    follow_up_question: str | None
```

The OpenAI response must be validated before entering the recommendation engine.

---

# 58. AI Flow

Example user message:

```text
I'm graduating this year. I mostly spend on groceries and restaurants.
I don't want an annual fee and I travel outside the country sometimes.
```

Desired conceptual flow:

```text
User language
     ↓
OpenAI intent extraction
     ↓
STRUCTURED PREFERENCES
     ↓
Pydantic validation
     ↓
DETERMINISTIC ENGINE
     ↓
CARD DATASET
     ↓
RANKINGS
```

Never use:

```text
User language
     ↓
OpenAI
     ↓
"Here are three cards I think you should get"
```

OpenAI must not invent or independently rank cards.

---

# 59. AI Endpoint

Add:

```http
POST /api/v1/ai/recommendations
```

Example request:

```json
{
  "message": "I want a card with good grocery rewards and no annual fee."
}
```

Backend flow:

```text
validate message
→ OpenAI intent parser
→ validate structured intent
→ deterministic recommendation engine
→ response
```

Example response:

```json
{
  "interpreted_preferences": {},
  "recommendations": [],
  "ai_enabled": true
}
```

The frontend should display the interpreted preferences.

---

# 60. AI Follow-Up Questions

If important information is genuinely missing, OpenAI may return:

```json
{
  "needs_follow_up": true,
  "follow_up_question": "Would you prefer a card with no annual fee, or are you comfortable paying one for better rewards?"
}
```

Keep this bounded.

A typical flow should use zero to two follow-up questions.

Do not build an unlimited chatbot in V1.

---

# 61. Optional AI Explanation Layer

After deterministic recommendations exist, OpenAI may optionally rewrite structured facts into a friendlier explanation.

Provide only trusted structured facts such as:

```json
{
  "card_name": "...",
  "score": 89,
  "matched_preferences": [
    "...",
    "..."
  ],
  "tradeoffs": [
    "..."
  ]
}
```

The prompt should explicitly prohibit introducing:

- new reward rates;
- new fees;
- new benefits;
- unsupported qualification criteria;
- unsupported card facts.

If AI explanation fails, return the deterministic explanation.

Recommendation results must still display.

---

# 62. AI Failure Handling

Handle:

```text
missing API key
AI feature disabled
timeout
rate limiting
invalid response
refusal
service error
network error
unexpected structured output
```

Fallback behavior:

```text
AI recommendations are temporarily unavailable.
You can still use the guided recommender.
```

AI failure must never crash the application.

---

# 63. AI Testing Strategy

Do not make real OpenAI calls in normal tests.

Create an interface:

```python
class IntentParser(Protocol):
    def parse(self, text: str) -> ParsedRecommendationIntent:
        ...
```

Production implementation:

```text
OpenAIIntentParser
```

Test implementation:

```text
FakeIntentParser
```

Test:

- natural language → mocked structured intent;
- structured intent → deterministic recommendation engine;
- follow-up-required response;
- AI unavailable;
- malformed provider response;
- provider timeout.

Perform live OpenAI testing only as a manual smoke test after everything else passes.

---

# 64. Security and Privacy

Do not request unnecessary financial information.

AI input should display a notice such as:

```text
Do not enter credit card numbers, bank account numbers, passwords,
Social Security numbers, or other sensitive financial information.
```

Limit AI input length.

Example:

```text
2,000 characters
```

Do not:

- log API keys;
- expose backend errors containing secrets;
- log full user prompts in production unless there is a deliberate privacy policy;
- expose provider credentials in browser code.

---

# 65. Financial Product Guardrails

The app should clearly state:

```text
Recommendations are for informational purposes and are based on the
preferences you provide. Card terms and offers can change. Verify current
terms with the card issuer before applying.
```

Also:

```text
Credit profile information is used only as a general preference signal and
does not predict approval.
```

Source and issuer links should be available in the UI.

---

# 66. Observability

Add basic structured logging.

Log:

```text
request path
response status
recommendation count
algorithm version
AI enabled/disabled
AI provider success/failure
```

Do not log sensitive financial information.

Assign an algorithm version, for example:

```text
recommendation_algorithm_version = "1.0"
```

Optionally return it in response metadata.

---

# 67. CI

Create GitHub Actions.

Backend:

```text
install
ruff check
pytest
```

Frontend:

```text
install
typecheck
test
build
```

CI must run without:

```text
OPENAI_API_KEY
```

If CI requires a real OpenAI secret, the architecture is wrong.

---

# 68. README Requirements

README should explain:

- project purpose;
- architecture;
- technology stack;
- card-data ingestion;
- canonical card schema;
- Guided mode;
- AI mode;
- recommendation algorithm;
- REST API endpoints;
- setup;
- environment variables;
- testing;
- AI architecture;
- card-data limitations;
- financial disclaimer.

Include architecture diagrams showing:

```text
React
   ↓
FastAPI
   ↓
Recommendation Engine
   ↓
Card Repository
```

and separately:

```text
Natural Language
   ↓
OpenAI Intent Parser
   ↓
RecommendationRequest
   ↓
Same Recommendation Engine
```

README should explicitly state that OpenAI does not independently rank or invent cards.

---

# 69. Features Explicitly Deferred From V1

Do not implement these before the core project is complete:

```text
user accounts
OAuth
saving cards to a user database
affiliate links
real-time issuer scraping
automatic credit-card applications
credit pulls
bank account connections
Plaid integration
complex conversational memory
vector databases
RAG
multi-agent systems
fine-tuning
microservices
```

They add complexity without improving the core portfolio story.

---

# 70. Final Acceptance Tests

## Scenario A — No AI

```text
OPENAI_API_KEY missing
ENABLE_OPENAI=false
```

Flow:

```text
Home
→ Guided Mode
→ Cash Back
→ Groceries + Dining
→ $0 annual fee
→ Results
```

Expected:

```text
3 ranked cards
match scores
explanations
tradeoffs
card facts
source links
```

Must succeed.

## Scenario B — AI Enabled

User enters:

```text
I'm a student and mostly spend money on food. I don't travel much and
don't want an annual fee.
```

Expected:

```text
OpenAI extracts preferences
backend validates preferences
deterministic engine ranks cards
frontend displays inferred preferences
frontend displays ranked results
```

## Scenario C — AI Failure

OpenAI request fails.

Expected:

```text
friendly failure message
guided recommender remains available
application does not crash
```

## Scenario D — Conflicting Request

User enters:

```text
I absolutely want a $0 annual fee but give me premium cards with
$500 annual fees.
```

Expected:

```text
system identifies the conflict or honors the explicit hard constraint
rather than silently violating it
```

---

# 71. Definition of Done

The project is complete when:

```text
✓ 100+ cards exist in a validated canonical dataset, or a smaller carefully
  validated initial set exists with a clear path to the 100+ target

✓ External data is normalized through a provider/adapter layer

✓ Guided questionnaire works without AI

✓ Deterministic recommendation engine works

✓ Hard filters work

✓ Weighted rankings work

✓ Spending-based fit works when spending is provided

✓ Recommendation explanations work without AI

✓ FastAPI REST API works

✓ React results page works

✓ Match-score breakdown works

✓ Card data displays verification/source metadata

✓ Backend unit tests pass

✓ Backend integration tests pass

✓ Frontend tests pass

✓ End-to-end Guided flow passes

✓ Application works with no OpenAI key

✓ OpenAI natural-language parser works

✓ Structured AI output is validated

✓ AI uses the existing recommendation engine

✓ AI errors gracefully fall back to Guided mode

✓ No API secret is exposed in frontend

✓ README documents architecture and limitations

✓ CI runs without OpenAI credentials
```

---

# 72. Instructions to Codex

Before implementing any phase:

1. Inspect the repository first.
2. Read this entire document.
3. State which files will be created or modified.
4. Implement only the current phase.
5. Do not introduce functionality scheduled for later phases.
6. Run formatter, linter, type checker, and tests relevant to that phase.
7. Fix failures before proceeding.
8. Summarize what changed.
9. Report commands used to verify the implementation.
10. Do not install OpenAI or request an API key before the hard non-AI completion gate.

When implementation decisions are ambiguous, prefer:

```text
simple
typed
deterministic
testable
explicit
```

over unnecessary abstraction.

---

# 73. Portfolio and Interview Story

The project should communicate this engineering story:

> The application accepts either structured questionnaire input or natural-language input. Both paths resolve to the same typed recommendation request. A deterministic FastAPI recommendation engine then applies hard constraints, calculates weighted fit scores, ranks locally normalized card data, and returns explainable recommendations. OpenAI is used only to translate natural language into structured preferences and optionally improve explanation phrasing.

That is stronger than presenting the project as:

> I sent a prompt to OpenAI and asked it which cards were best.

Useful interview points:

- provider abstraction prevents coupling to one data source;
- local normalized data avoids external API latency and outages;
- deterministic scoring is testable;
- score breakdown improves explainability;
- AI interpretation is visible and editable;
- OpenAI failure does not break the core application;
- card facts are never generated by the LLM;
- CI works without external AI credentials;
- card freshness and provenance are explicit.

---

# 74. Potential Resume Framing After Implementation

Possible future résumé wording:

> Built a full-stack credit card recommendation platform with React, TypeScript, and FastAPI that normalizes third-party card data and ranks products using deterministic filtering and weighted scoring.

> Integrated OpenAI as a structured natural-language intent parser, converting user goals into typed recommendation criteria while keeping card ranking, financial data, and explanations grounded in backend-controlled logic.

> Designed explainable recommendation APIs that return match scores, scoring breakdowns, tradeoffs, and source metadata while remaining fully functional without AI availability.

Do not finalize résumé numbers such as card count or user count until the implementation and testing support those claims.

---

# 75. Final Priority Order

The implementation order should remain:

```text
1. Define canonical CreditCard schema
          ↓
2. Build provider abstraction
          ↓
3. Build importer / normalizer
          ↓
4. Import and validate card dataset
          ↓
5. Define RecommendationRequest
          ↓
6. Build hard filters
          ↓
7. Build deterministic scoring/ranking
          ↓
8. Build deterministic explanations
          ↓
9. Build FastAPI REST endpoints
          ↓
10. Test backend thoroughly
          ↓
11. Build Guided React questionnaire
          ↓
12. Build results and explainability UI
          ↓
13. Build comparison/details UX
          ↓
14. Test frontend and end-to-end Guided flow
          ↓
15. Confirm full app works without OpenAI
          ↓
16. Add OpenAI structured intent parser LAST
          ↓
17. Add AI preference preview/editing
          ↓
18. Add AI fallback/error behavior
          ↓
19. Optional AI explanation rewriting
          ↓
20. Final polish, CI, documentation, deployment
```

---

# 76. Final Reminder

The key product and engineering principle is:

> **AI helps understand the user. The application itself understands the cards.**

OpenAI should never be required for the core recommendation experience.

The system should still be useful, testable, explainable, and deployable if OpenAI is completely disabled.
