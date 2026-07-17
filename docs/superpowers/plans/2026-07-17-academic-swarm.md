# Academic Paper Swarm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a secure Supabase-backed academic paper swarm with a durable TypeScript worker and a realtime Next.js dashboard.

**Architecture:** The Next.js App Router handles authentication, uploads, and visualization while a separate worker atomically claims Supabase queue rows and executes a typed orchestration pipeline. OpenAI Responses, approved remote MCP servers, Crossref, and OpenAlex sit behind injectable ports so the full workflow is deterministic under test.

**Tech Stack:** Node.js 24, Next.js 16+, React 19.2.4+, TypeScript 5, Tailwind CSS 4, Supabase, OpenAI SDK, Zod, Vitest, Testing Library, Playwright.

## Global Constraints

- Work only in `C:\Users\a\OneDrive\Desktop\REWORK`.
- Pin dependency versions and commit `package-lock.json`.
- Never expose service-role, OpenAI, encryption, or MCP secrets to client bundles.
- Require exactly three complete A/B debate rounds before validation.
- Keep full proposal and manuscript text encrypted; realtime payloads contain safe summaries only.
- Every public table has RLS, ownership policies, and indexes for ownership/foreign-key filters.
- Each milestone ends with relevant checks, a focused commit, and a push to `origin/main`.

---

### Task 1: Scaffold and secure configuration boundary

**Files:**

- Create: `package.json`, Next.js scaffold files, `vitest.config.ts`, `playwright.config.ts`
- Create: `src/lib/env/schema.ts`, `src/lib/security/envelope.ts`
- Test: `src/lib/env/schema.test.ts`, `src/lib/security/envelope.test.ts`

**Interfaces:**

- Produces: `readServerEnv(): ServerEnv`, `readPublicEnv(): PublicEnv`, `encryptText(plain, key, aad): CipherEnvelope`, `decryptText(envelope, key, aad): string`.

- [ ] Write tests that reject missing/short secrets, round-trip UTF-8 text, and reject tampered tags.
- [ ] Run `npm test -- src/lib/env/schema.test.ts src/lib/security/envelope.test.ts` and confirm the missing modules fail.
- [ ] Implement Zod environment schemas and AES-256-GCM using `node:crypto` with a 12-byte IV and 16-byte tag.
- [ ] Rerun the focused tests and then `npm run typecheck`.
- [ ] Commit and push `chore: scaffold secure application core`.

### Task 2: Supabase schema, RLS, storage, and queue claim

**Files:**

- Create: `supabase/config.toml`
- Create: `supabase/migrations/20260717000100_academic_swarm.sql`
- Create: `supabase/tests/academic_swarm.sql`
- Create: `src/lib/supabase/client.ts`, `server.ts`, `admin.ts`, `database.types.ts`

**Interfaces:**

- Produces: required seven tables plus `pipeline_runs`, `agent_events`, `skill_registry`; private `proposals` bucket; `private.claim_next_pipeline_run(worker_id text)`.

- [ ] Write pgTAP assertions for table presence, constraints, indexed foreign keys, publication membership, storage policies, and cross-user RLS isolation.
- [ ] Run `npx supabase test db` and confirm schema assertions fail before the migration exists.
- [ ] Implement enums, tables, checks, indexes, grants, RLS policies, realtime publication setup, and a tightly scoped queue-claim function in the private schema.
- [ ] Run `npx supabase db reset`, `npx supabase test db`, and generate TypeScript types.
- [ ] Commit and push `feat: add secure realtime Supabase schema`.

### Task 3: Typed agent contracts and prompt registry

**Files:**

- Create: `src/swarm/contracts.ts`, `src/swarm/agents.ts`, `src/swarm/prompts/*.md`
- Create: `src/swarm/skills/manifest.ts`, `src/swarm/skills/loader.ts`
- Test: `src/swarm/contracts.test.ts`, `src/swarm/skills/loader.test.ts`

**Interfaces:**

- Produces: role-specific Zod schemas; `AGENT_DEFINITIONS`; `loadRemoteSkill(manifestUrl, fetcher, allowlist): Promise<VerifiedSkill>`.

- [ ] Write tests for all ten displayed agent definitions, strict role outputs, HTTPS/host/size enforcement, and SHA-256 mismatch rejection.
- [ ] Run the focused tests and confirm missing contracts fail.
- [ ] Implement lean role prompts, schemas, local prompt loading, and prompt-only signed-manifest ingestion.
- [ ] Rerun focused and full unit suites.
- [ ] Commit and push `feat: define academic swarm roles and skills`.

### Task 4: Model, research, MCP, and persistence ports

**Files:**

- Create: `src/swarm/ports.ts`, `src/swarm/openai-gateway.ts`, `src/swarm/mcp-tools.ts`
- Create: `src/lib/research/crossref.ts`, `openalex.ts`, `normalize.ts`
- Create: `src/swarm/supabase-repository.ts`, `src/swarm/memory-repository.ts`
- Test: `src/lib/research/normalize.test.ts`, `src/swarm/openai-gateway.test.ts`, `src/swarm/supabase-repository.test.ts`

**Interfaces:**

- Produces: `ModelGateway.run<T>()`, `ResearchGateway.search()`, `SwarmRepository`, and OpenAI tool definitions for hosted web search plus approved remote MCP servers.

- [ ] Write failing tests for citation deduplication, DOI normalization, structured-output parsing, MCP approval defaults, and sanitized event persistence.
- [ ] Implement lazy OpenAI/Supabase clients, current Responses API calls, bounded fetch timeouts, and repository adapters.
- [ ] Rerun focused tests; verify no SDK initializes at build-import time.
- [ ] Commit and push `feat: connect model research and persistence ports`.

### Task 5: Deterministic swarm orchestration and worker

**Files:**

- Create: `src/swarm/orchestrator.ts`, `src/swarm/stages.ts`, `src/swarm/retry.ts`
- Create: `worker/runner.ts`
- Test: `src/swarm/orchestrator.integration.test.ts`, `src/swarm/retry.test.ts`

**Interfaces:**

- Consumes: gateways and repository ports from Task 4.
- Produces: `runSwarm(runId, deps): Promise<void>` and a process that repeatedly calls `claimNextRun`.

- [ ] Write a deterministic integration test asserting stage order, six alternating debate entries, literature/translation records, RQ version two, advisor feedback, encrypted final paper, and completed statuses.
- [ ] Run the integration test and confirm it fails before orchestration exists.
- [ ] Implement stages with bounded retries, cancellation checks, safe events, and graceful worker shutdown.
- [ ] Rerun integration and full unit tests.
- [ ] Commit and push `feat: orchestrate the academic paper swarm`.

### Task 6: Authenticated proposal upload and final-paper APIs

**Files:**

- Create: `src/lib/documents/validate.ts`, `extract.ts`
- Create: `src/app/api/proposals/route.ts`, `src/app/api/final-papers/[id]/route.ts`
- Create: `src/proxy.ts`, auth callback and login routes
- Test: `src/lib/documents/validate.test.ts`, route tests

**Interfaces:**

- Produces: multipart upload returning `{ proposalId, runId }`; authenticated final-paper download returning decrypted Markdown.

- [ ] Write tests for authentication, 20 MB limit, MIME/extension agreement, encrypted storage fields, ownership checks, and missing-record behavior.
- [ ] Implement extraction for PDF, DOCX, Markdown, and text, private Storage upload, encryption, queue insertion, and server-side auth revalidation.
- [ ] Rerun route tests and typecheck.
- [ ] Commit and push `feat: add secure proposal and paper APIs`.

### Task 7: Faithful realtime dashboard

**Files:**

- Create: `src/components/workroom/*`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/lib/realtime/use-workroom.ts`, `src/lib/demo/scenario.ts`
- Test: component tests under `src/components/workroom/*.test.tsx`

**Interfaces:**

- Produces: concept-faithful responsive workroom with demo data fallback and Supabase Realtime subscriptions.

- [ ] Write component tests for all agent names/states, active pulse class, reduced motion, log filters, RQ versions, literature nodes, upload callback, and accessible controls.
- [ ] Implement tokens and focused components matching `docs/design/research-war-room-concept.png`.
- [ ] Run component tests, start the app, and verify desktop plus mobile core interactions in the browser.
- [ ] Compare concept and browser screenshots with `view_image`, record at least five fidelity checks, and repair mismatches.
- [ ] Commit and push `feat: build realtime research workroom`.

### Task 8: Automation, CI, documentation, and release verification

**Files:**

- Create: `scripts/checkpoint.ps1`, `scripts/checkpoint.sh`, `.github/workflows/ci.yml`
- Create: `.env.example`, `README.md`, `TODO_HUMAN.md`, `docs/SECURITY.md`, `docs/FIDELITY.md`
- Create: `e2e/workroom.spec.ts`

**Interfaces:**

- Produces: explicit `npm run checkpoint -- "message"` automation, GitHub CI, reproducible setup, and human-only configuration ledger.

- [ ] Write the Playwright happy-path test and a checkpoint-script dry-run test.
- [ ] Implement scripts that run format checks, lint, typecheck, unit tests, and build before committing the confirmed project tree and pushing the current tracked branch.
- [ ] Add CI with locked dependency install, unit/component tests, build, secret scanning, and artifact retention for Playwright reports.
- [ ] Complete setup, security, deployment, and human-only instructions without embedding credentials.
- [ ] Run `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:e2e` from a clean checkout-equivalent state.
- [ ] Inspect `git diff`, commit `docs: finalize operations and release gates`, push `origin/main`, and confirm the GitHub branch reflects the final commit.
