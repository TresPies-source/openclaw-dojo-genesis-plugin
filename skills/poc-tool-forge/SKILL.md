---
name: poc-tool-forge
description: End-to-end pipeline to turn an idea into a live single-page TresPies POC tool — source/pick an idea (Build Forge brief or operator concept), build it to the house design system, browser-verify, deploy to *.trespies.dev, and document. Use when the operator says "build a POC tool", "make something from the brief", "ship a new trespies-poc tool", "spin up a landing demo", "check trespies-poc for ideas", or "/poc-tool-forge". Orchestrates the house-poc-builder, static-tool-verify, and cf-pages-trespies-deploy skills.
---

> **OpenClaw Integration:** This skill is invoked by the Dojo Genesis plugin via `/dojo run poc-tool-forge`.
> The agent receives project context automatically via the `before_agent_start` hook.
> Use `dojo_get_context` for full state, `dojo_save_artifact` to persist outputs,
> and `dojo_update_state` to record phase transitions and decisions.

# poc-tool-forge — idea → live trespies.dev tool

The repeatable pipeline that produced quorum / counterclock / body-almanac / phenotype-draft /
contagion / bodyglossary (all live on `*.trespies.dev`). Each POC is a self-contained
single-page `index.html` under `trespies-poc/<slug>/`, deployed as its own Cloudflare Pages
project. This skill is the conductor; it delegates to three phase skills:
`house-poc-builder` · `static-tool-verify` · `cf-pages-trespies-deploy`.

All paths absolute. `trespies-poc/` is its **own git sub-repo** (local-only unless a remote is
added) — commits there don't touch the parent. **Commit/push only when the operator asks.**

## Phase 1 — Source & pick the idea (don't over-survey; recommend, then confirm)
- Default idea source: the nightly **Build Forge** drop — `trespies-poc/build-forge/briefs/LATEST.md`.
  Its "Tonight's 5 standouts" are the curated best; the 48-idea list (8 families) is the deep menu.
  Scores are `[u c s ce f]` = uniqueness · cashflow · scalability · ceiling · founder-amplification.
- Present 2–4 candidates with a one-line hook + scores **and a clear recommendation**, then
  confirm with **AskUserQuestion** (the *which-idea* choice is the operator's and changes everything).
  Filter for single-page-demoable: no real backend, demonstrable client-side, sharp screenshot,
  variety against what's already shipped (see `trespies-poc/README.md` table).
- Carry forward sensible defaults rather than re-asking every time: **demo-ready single page →
  deploy to `*.trespies.dev`** has been the standing choice this whole session. State the
  assumption; let them override.
- The operator may pick **several at once** ("build the first three") — that's the norm; fan out.

## Phase 2 — Build (parallel, one agent per tool)
- Invoke `house-poc-builder` per tool. Dispatch **one Agent per tool, in parallel** (separate
  folders = no file conflict). **Never** `isolation: "worktree"` for file-writing agents (writes
  get discarded). Model split: **Opus for the flagship / most complex; Sonnet for the rest** (~1 Opus : 2 Sonnet).
- Give each agent the full house-design spec, the specific mechanic, the load-bearing guardrail,
  and its exact output path. Agents start cold — hand them everything (read paths, not memory).

## Phase 3 — Verify (independent; never trust agent self-reports)
- Invoke `static-tool-verify` per tool: structural + `node --check`, then a real browser pass
  (preview_start → exercise the core mechanic → assert zero console errors → screenshot).
- **Fix the bugs a syntax check misses.** Real examples caught this session: a "Summer" almanac
  citing a "March" driver (season-incoherent vocab) and a public-health page labeling a quiet
  summer as "HIGH" (severity banded on cross-state rank instead of absolute %-of-peak). These
  pass `node --check` but fail a human — catch them before deploy.

## Phase 4 — Deploy
- Invoke `cf-pages-trespies-deploy` per tool: create project → deploy → attach `slug.trespies.dev`
  → create the proxied CNAME → verify. Kick off a background watcher until all go 200; don't block.

## Phase 5 — Document & track
- Per tool: a `trespies-poc/<slug>/README.md` (house pattern — tagline, what-it-is, guardrail,
  Live URLs, deploy/run). Add a row to the `trespies-poc/README.md` index table. Register a
  `.claude/launch.json` entry (`python3 -m http.server <port> --directory trespies-poc/<slug>`).
- Optional ecosystem tie-ins: mirror the build as a Linear issue (the brief tracks builds as
  OCH-*); if cross-machine parity matters, write a handoff (see `cf-pages-trespies-deploy` for the
  token-parity handoff precedent).
- Leave **uncommitted** unless asked. When asked: conventional commit in the `trespies-poc` sub-repo.

## Intelligence notes (what makes this not just a checklist)
- **Altitude:** recommend, don't dump. One AskUserQuestion at the real fork, then act.
- **Guardrail is load-bearing**, not decoration — these deploy publicly and many are health-adjacent.
  Health/medical-adjacent tools are **general-wellness / decision-literacy, never medical advice**;
  the disclaimer banner + footer ship in every build (enforced in `house-poc-builder`).
- **Real data > fabricated** when a credible source exists (the ip-scout / contagion pattern):
  capture via an MCP, bake a snapshot with full provenance, never invent a number, and sanity-check
  the rendered framing isn't misleading.
- **Don't poll in the foreground** — background-watch domains; the harness re-invokes on completion.
