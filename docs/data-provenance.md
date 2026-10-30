# Data provenance and review policy

The original snapshot in `backend/app/data/source-67credit.json` was downloaded from
https://67.credit/api/v1/cards.json. The source metadata reports generation on
2026-07-29 and 201 records. The upstream snapshot is preserved without rewriting it.

Attribution: **67.CREDIT card dataset (67.credit/data), CC BY 4.0**.
License: https://creativecommons.org/licenses/by/4.0/
Source field dictionary: https://67.credit/data

CardMatch transforms this data. It is not endorsed by the source or issuers.

## Why the initial catalog has six cards

The snapshot has duplicates/variants, closed products, business cards, and reward
categories that conflate conditional bonuses. Raw coverage is not equivalent to a
reviewed consumer catalog. The importer publishes only the six entries in
`reviews.json`. This is the plan's smaller, reviewed initial-set option.

Each entry preserves external identity and provenance, then overlays reviewed fees,
product type, reward rules, and an official issuer URL. The initial review date is
2026-10-28. Unknown fields stay null. `source_verified_at` is the upstream date;
`last_verified_at` is the date of our review of the modeled fields. Neither is a
promise that offers remain current or that every possible benefit has been modeled.

| Source ID | Official page | Modeled information |
| --- | --- | --- |
| savor | https://www.capitalone.com/credit-cards/savor/ | $0 annual fee, 0% foreign fee, 3% eligible groceries/dining/entertainment, 1% base, 12-month intro APR |
| quicksilver | https://www.capitalone.com/credit-cards/quicksilver/ | $0 annual fee, 0% foreign fee, 1.5% base, 15-month intro APR |
| venture | https://www.capitalone.com/credit-cards/venture/ | $95 annual fee, 0% foreign fee, 2 miles/$ base |
| savorone-student | https://www.capitalone.com/credit-cards/savor-student/ | Student product, $0 annual fee, 0% foreign fee, 3% eligible groceries/dining/entertainment, 1% base |
| platinum-secured | https://www.capitalone.com/credit-cards/platinum-secured/ | Secured product, $0 annual fee, 0% foreign fee, no rewards, deposit required |
| chase-freedom-unlimited | https://creditcards.chase.com/cash-back-credit-cards/freedom/unlimited | $0 annual fee, 1.5% base, 3% dining/drugstores, 15-month intro APR; foreign fee left unverified |

Issuer-specific exclusions are preserved in reward notes. Portal travel and
entertainment bonuses, streaming rewards, transfer partners, welcome offers, annual
credits, and regular APR ranges are not modeled in V1. Student eligibility and
secured deposits require separate issuer review by the user. Venture miles use a
documented 1-cent travel valuation; this is an estimate, not a universal cash value.

## Expansion toward 100+ cards

1. Refresh/download a versioned provider snapshot and preserve its license metadata.
2. Deduplicate product identities, remove inactive/business/geographically restricted
   products, and inspect current issuer terms.
3. Add an issuer-reviewed entry in `reviews.json`. Do not use LLM-generated facts.
4. Encode supported reward caps and restrictions. For conditional rewards that
   cannot be modeled faithfully, use a conservative base rate and explain omissions.
5. Preserve unknown foreign fees as null. Strict no-foreign-fee searches exclude them.
6. Run the importer, inspect the canonical diff, and run the data/scoring/API tests.
7. Update coverage documentation and restart the backend to load the new snapshot.

The provider protocol can support additional licensed providers without changing
the engine. Only the verified 67.CREDIT adapter is implemented; speculative adapters
for other APIs are deliberately absent.

`python -m scripts.import_cards` reproduces the checked-in catalog offline.
`python -m scripts.import_cards --refresh` fetches live provider identity/status data
but still requires reviewed terms. It does not refresh the issuer-reviewed overlay
or overwrite the retained original snapshot. Missing reviewed IDs, duplicate IDs,
and invalid canonical values abort the import before replacing the catalog.
