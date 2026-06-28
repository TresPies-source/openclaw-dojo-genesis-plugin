---
name: house-poc-builder
description: Build ONE self-contained, deployable single-page index.html in the TresPies "official-document" house style (the ip-scout aesthetic) — cream paper, serif/mono, seeded determinism, a landing→artifact flow, a load-bearing general-wellness/regulatory guardrail, and real-data baking when a credible source exists. Use when "build a house-style tool", "make a trespies-poc page", "single-page POC to the ip-scout look", or as Phase 2 of poc-tool-forge.
---

> **OpenClaw Integration:** This skill is invoked by the Dojo Genesis plugin via `/dojo run house-poc-builder`.
> The agent receives project context automatically via the `before_agent_start` hook.
> Use `dojo_get_context` for full state, `dojo_save_artifact` to persist outputs,
> and `dojo_update_state` to record phase transitions and decisions.

# house-poc-builder — one self-contained POC tool, house style

Builds a single `trespies-poc/<slug>/index.html`: no build step, no dependencies, no runtime
network calls, works by double-clicking the file. Canonical reference to read first:
`trespies-poc/ip-scout/index.html` (the design-system source of truth). Part of `poc-tool-forge`.

## The house design system (match it exactly)
- Cream "official document" feel. CSS vars: `--cream:#f8f5ef; --cream-dark:#ede9e0; --ink:#1a1a1a;
  --ink-mid:#3a3a3a; --ink-light:#6b6b6b; --rule:#c8bfaa; --gold:#8b6914; --red:#8b1a1a; --blue:#1a3a8b;`
  body background `#d4cfc5`.
- System fonts only: `--serif:'Times New Roman','Times','Georgia',serif;` `--mono:'Courier New','Courier',monospace;`
- Signature touches: hard offset box-shadows (`3px 3px 0 var(--ink)`), thin `--rule` hairlines,
  uppercase letter-spaced section titles, a circular embossed stamp, a faint rotated stamp watermark
  over the artifact, an italic small-print footer.
- **Flow:** centered landing (stamp, big serif H1 with one word italic-red, italic tagline, input(s),
  example/preset chips) → on submit hide landing, reveal a generated **artifact** with a "← back"
  link + action bar (Regenerate / Copy / Start over). Responsive (~600px breakpoint). Tasteful reveal
  animation (the ip-scout `pageIn`).
- **Determinism:** copy the `hash` / `makeRng` / `pick` / `rand` helpers from ip-scout and key the RNG
  off the input — same input → same artifact; "regenerate" re-rolls. Light keyword reading of the
  input tilts the output so different inputs feel genuinely different, while ANY input is handled gracefully.
- Every chart/gauge/visualization is **real inline SVG driven by computed values** — not an image, not faked.

## The load-bearing regulatory guardrail (non-negotiable — these deploy publicly)
Most of these tools are health/body-adjacent. They are **general-wellness / decision-literacy /
entertainment — never medical advice, diagnosis, or clinical interpretation.** Bake in:
- A visible disclaimer banner near the top of the artifact **and** a footer disclaimer.
- Frame outputs as illustrative / for-reflection / "talk to your clinician" — never a directive or verdict.
- Match the framing to the tool (e.g. "decision-literacy, not a recommendation"; "a directional wellness
  signal, not a measurement"; "an illustrative almanac, not a clinical forecast"; "a game, not clinical
  reference ranges"). When in doubt, more disclaimer, not less.

## Real-data baking (the ip-scout / contagion pattern — use when a credible source exists)
- Capture a real snapshot at build time (e.g. via an MCP — PopHIVE for public-health data, the
  `model-exhaust-poc/` run for model benchmarks), save it to `trespies-poc/<slug>/data/<name>.json`
  with a `_meta` block (source, attribution, captured/as-of dates, deeplink), and **inline it** into
  the page as `const DATA = {...}`. The page stays static; no fetch at runtime.
- **Never fabricate or alter a number.** Every figure traces to the snapshot. Show provenance loudly
  (a source/as-of bar near the top + full attribution in the footer; honor source-specific credit
  requirements, e.g. Yale/DOI, Epic Cosmos, Google).
- **Sanity-check that the rendered framing is honest**, not just that the numbers are right. A real
  bug this session: deriving severity from cross-state *rank* labeled a quiet summer "HIGH"; the fix
  was to band on **absolute severity** (% of seasonal peak) so the output matched reality. Numbers can
  be correct and the framing still misleading — check both.

## Dispatch template (when building via an Agent)
Give the agent, in one prompt: (1) the exact output path + "write the whole file in ONE Write call";
(2) "READ `trespies-poc/ip-scout/index.html` in full and match its visual DNA" + the tokens above;
(3) the specific mechanic + artifact structure; (4) the guardrail; (5) the data file path + "inline
verbatim, never invent" if real-data; (6) "VERIFY: file exists + non-trivial, `node --check` the
extracted JS, serve + curl 200, ALWAYS kill any server you start"; (7) "return findings directly, do
NOT write a summary .md". Model: **Opus for the flagship, Sonnet for the rest.**

## Done-when
Self-contained file that opens offline, matches the house look, has the guardrail in two places, real
SVG visualizations, deterministic output, and (if real-data) verbatim provenance. Then hand to
`static-tool-verify`.
