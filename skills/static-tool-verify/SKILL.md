---
name: static-tool-verify
description: Browser-verify a self-contained single-page tool before shipping — start it via .claude/launch.json, exercise the core mechanic, assert zero console errors, screenshot, and catch the content/logic bugs (seasonal incoherence, misleading severity labels, dead interactions) that pass a syntax check but fail a human. Use when "verify the tool", "check the page before deploy", "browser-test this POC", or as Phase 3 of poc-tool-forge. Never trust an agent's self-report of "done".
---

> **OpenClaw Integration:** This skill is invoked by the Dojo Genesis plugin via `/dojo run static-tool-verify`.
> The agent receives project context automatically via the `before_agent_start` hook.
> Use `dojo_get_context` for full state, `dojo_save_artifact` to persist outputs,
> and `dojo_update_state` to record phase transitions and decisions.

# static-tool-verify — prove it works before it ships

The discipline that caught real bugs this session. An agent reporting "verified, HTTP 200, zero
errors" is **not** verification — confirm it yourself. Part of `poc-tool-forge`; applies to anything
`house-poc-builder` produces (and any static single-page tool).

## Step 1 — Structural / syntax (cheap, do first)
- File exists + non-trivial size; balanced `<script>`/`<style>` tags.
- Extract the inline JS and `node --check` it (catches the syntax errors that would white-screen the page).
- If real-data: spot-check that the inlined `DATA` matches the source snapshot (a couple of values),
  to confirm nothing was paraphrased or invented.

## Step 2 — Real browser pass (the part that matters)
Use the preview MCP (`preview_*`), driven off `.claude/launch.json`:
1. Register a launch entry if missing: `{"name":"<slug>","runtimeExecutable":"python3",
   "runtimeArgs":["-m","http.server","<port>","--directory","trespies-poc/<slug>"],"port":<port>}`.
2. `preview_start` the slug → get the serverId.
3. **Exercise the core mechanic**, don't just load the landing: set the input / click the real
   generate button via `preview_eval` (example chips often only *prefill* — trigger generation
   explicitly), then assert the artifact rendered (body length jumps, expected sections + SVG element
   counts present).
4. `preview_console_logs level:error` → must be empty.
5. `preview_screenshot` → eyeball the actual render (layout, the hero element, the disclaimer banner).

## Step 3 — Catch what a syntax check can't (this is the point)
Look for output that is *valid* but *wrong*:
- **Coherence:** does generated vocab contradict the inputs? (A "Summer" almanac that cites a "March"
  driver — vocab pool wasn't season-filtered.)
- **Honesty of framing:** does a label overstate reality? (A public-health page labeling a quiet
  summer "HIGH" because severity was banded on cross-state rank instead of absolute %-of-peak.)
- **Dead interactions:** do "see also" / regenerate / toggles actually do something?
- **Guardrail present:** disclaimer banner + footer actually render in the artifact, not just the source.
When you find one, **fix the source** (root cause, per the debugging protocol), reload, re-assert — then move on.

## Step 4 — Hand off proof
Screenshot(s) of the working mechanic are the deliverable to the operator. Then proceed to
`cf-pages-trespies-deploy`.

## Notes
- Foreground `sleep` is blocked; to wait on something, use a background poll or a `preview_eval` reload
  with a short settle, then re-query.
- Kill stray `python3 -m http.server` you started manually; launch.json-managed servers are fine to leave.
