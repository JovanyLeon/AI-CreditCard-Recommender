# Non-AI completion gate

Passed on 2026-10-28 before adding the optional OpenAI SDK.

- `importlib.util.find_spec('openai')` returned `None`.
- Backend: Ruff, strict mypy, and 49 pytest tests passed.
- Frontend: ESLint, TypeScript, 3 Vitest tests, and Vite production build passed.
- Playwright: 6 tests passed using headless Edge on Windows with desktop and mobile viewports.
- Both real servers started with `ENABLE_OPENAI=false` and an empty `OPENAI_API_KEY`.
- Real API flow returned three ranked $0 annual-fee cards, explanations, tradeoffs, score breakdowns, and source links.
- Browser tests covered comparison, card details, preserved preferences, restart, negative-spending validation, empty results, and API failure/retry.

Commands (from `backend/` or `frontend/` respectively):

```text
python -m ruff check .
python -m ruff format --check .
python -m mypy app scripts
python -m pytest -q
npm run lint
npm run test
npm run build
npm run test:e2e
```

Windows browser test override: `$env:PLAYWRIGHT_CHANNEL='msedge'`.
The checked-in Playwright config defaults to Chromium elsewhere.
