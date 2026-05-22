# Testing Infrastructure Design

**Date:** 2026-05-23
**Status:** Approved

## Overview

Add Vitest (unit/component) and Playwright (e2e) testing to the `site/` package. Focus on data persistence, editor rendering, and dashboard/editor user flows — the areas reported as most broken.

## Directory Structure

```
site/
├── vitest.config.ts
├── playwright.config.ts
├── tests/
│   ├── unit/
│   │   ├── stores/
│   │   │   ├── data.test.ts        # useDataStore: setData, setAndSyncToMonaco
│   │   │   └── style.test.ts       # useStyleStore (future)
│   │   ├── composables/
│   │   │   ├── useResume.test.ts   # create → edit → save → reload cycle
│   │   │   ├── markdown.test.ts    # markdown-it plugin chain rendering
│   │   │   └── monaco.test.ts      # setContent sync, language switch
│   │   └── storage/
│   │       └── repository.test.ts  # CRUD round-trip via localForage
│   └── e2e/
│       ├── dashboard.spec.ts       # List, create, delete resume
│       └── editor.spec.ts          # Edit markdown, preview, persistence
└── package.json                    # New test scripts + dependencies
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `vitest` (devDep) | Unit/component test runner |
| `@nuxt/test-utils` (devDep) | Nuxt 3 helpers (`mountSuspended`, `mockNuxtImport`) |
| `@vue/test-utils` (devDep) | Vue component mounting |
| `happy-dom` (devDep) | Browser env simulation (lighter than jsdom) |
| `@playwright/test` (devDep) | E2E test runner |

## Scripts (added to `site/package.json`)

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

## Test Strategy

### Unit Tests (Vitest)

**Priority 1 — Data persistence chain (Area A: data loss / save failures):**

- `useDataStore` — `setData` updates reactive state; `setAndSyncToMonaco` calls monaco composable
- `useResume` — create → write markdown/css → save → reload → data matches
- Repository CRUD — localForage read/write round-trip, no data loss

**Priority 2 — Editor rendering (Area B: preview / parsing issues):**

- Markdown rendering — markdown-it pipeline (KaTeX, cross-ref, LaTeX commands) produces correct HTML
- Monaco integration — `setContent` syncs editor model, language toggles

**localForage strategy:** Use `vi.mock('localforage')` to intercept calls. Verify correct keys and values pass through the storage interface without depending on real IndexedDB.

### E2E Tests (Playwright)

Run against Nuxt dev server. First version skips Monaco Web Worker interactions; validates preview panel rendering instead.

**Dashboard flow:**
1. Open dashboard → see list or empty state
2. Click "New Resume" → navigates to editor with new id
3. Resume appears in dashboard list
4. Delete resume → list updates

**Editor flow:**
1. Open editor with existing id → content loaded
2. Preview panel renders markdown as styled HTML
3. Refresh page → content persisted
4. Export triggers download/print

### CI Integration

Add to `.github/workflows/deploy.yaml`:

```yaml
- name: Unit tests
  run: pnpm test

- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps chromium

- name: E2E tests
  run: |
    pnpm dev &
    sleep 5
    pnpm test:e2e
```

## Constraints & Decisions

- Tests live in `site/` only — packages under `packages/` are not independently tested (no consumers outside this app)
- Monaco editor interactions excluded from E2E v1 (Web Worker heavy, unreliable in headless Chromium)
- `happy-dom` over `jsdom` — faster startup, sufficient for stores/composables
- No test coverage thresholds enforced yet — add after baseline established
