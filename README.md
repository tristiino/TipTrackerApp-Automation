# TipTrackerApp — Automation Test Suite

End-to-end test suite for [TipTrackerApp](https://tiptrackerapp.org) built with **Playwright** and **TypeScript**.

> This is a standalone test project maintained separately from the main application repo. It runs against the live production environment and is designed to be a showcase of modern E2E automation practices.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Playwright](https://playwright.dev) | E2E browser automation |
| TypeScript | Type-safe test authoring |
| GitHub Actions | CI — runs on push and nightly |

---

## Project Structure

```
├── tests/
│   ├── e2e/             # Test specs (one file per feature area)
│   ├── pages/           # Page Object Models
│   ├── fixtures/        # Shared test data
│   └── helpers/         # Auth setup and shared utilities
├── playwright.config.ts # Browser/environment config
├── tsconfig.json
└── .github/workflows/   # CI pipeline
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
npx playwright install
```

### 2. Run all tests (headless)

```bash
npm test
```

### 3. Run with the Playwright UI (interactive, great for debugging)

```bash
npm run test:ui
```

### 4. Run headed (watch the browser)

```bash
npm run test:headed
```

### 5. Debug a specific test

```bash
npm run test:debug -- tests/e2e/auth.spec.ts
```

---

## Environment Variables

Tests default to running against `https://tiptrackerapp.org`. Override for local dev:

```bash
BASE_URL=http://localhost:4200 npm test
```

Credentials are loaded from environment variables (or fall back to a read-only test account):

| Variable | Description |
|----------|-------------|
| `BASE_URL` | Target environment URL |
| `TEST_USERNAME` | Test account username |
| `TEST_PASSWORD` | Test account password |
| `TEST_EMAIL` | Test account email |

---

## Architecture

### Page Object Model

All UI interactions are encapsulated in Page Object classes under `tests/pages/`. This keeps test specs clean and readable — tests describe *what* to verify, not *how* to interact with the DOM.

### Authenticated State

The `auth.setup.ts` helper logs in once and saves browser storage state to `tests/.auth/user.json` (gitignored). Subsequent tests reuse that session, dramatically speeding up the suite.

### Cross-Browser Coverage

The config runs tests across Chromium, Firefox, and WebKit, plus Pixel 5 and iPhone 12 mobile viewports.

---

## CI/CD

GitHub Actions runs the full suite on every push to `main` and on a nightly schedule against production. Test reports are uploaded as artifacts and retained for 30 days.

---

## Related

- **Application repo:** [github.com/tristiino/TipTrackerApp](https://github.com/tristiino/TipTrackerApp)
- **Live app:** [tiptrackerapp.org](https://tiptrackerapp.org)
