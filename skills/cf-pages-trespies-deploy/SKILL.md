---
name: cf-pages-trespies-deploy
description: Deploy a static folder to Cloudflare Pages and bind a *.trespies.dev custom domain — including the two gotchas that cost real time: wrangler's OAuth login CANNOT attach custom domains (you need a scoped API token) and attaching a domain does NOT auto-create its DNS record (you must create the proxied CNAME yourself). Use when "deploy to trespies.dev", "ship this to Cloudflare Pages", "bind a custom subdomain", "publish the POC", or as Phase 4 of poc-tool-forge.
---

> **OpenClaw Integration:** This skill is invoked by the Dojo Genesis plugin via `/dojo run cf-pages-trespies-deploy`.
> The agent receives project context automatically via the `before_agent_start` hook.
> Use `dojo_get_context` for full state, `dojo_save_artifact` to persist outputs,
> and `dojo_update_state` to record phase transitions and decisions.

# cf-pages-trespies-deploy — static folder → live *.trespies.dev

Ships a static folder (e.g. `trespies-poc/<slug>/`) as its own Cloudflare Pages project with a
`<slug>.trespies.dev` vanity domain. Encodes the exact sequence + the two non-obvious failures we hit.
Part of `poc-tool-forge`. Deploying is outward-facing — proceed when the operator has asked to deploy.

## Constants (not secrets — safe to reference)
- Account ID: `e64029811149939c1f67579b888309d7`
- `trespies.dev` zone ID: `087d1af3cd36cd575d7473c4f18de9d7`
- Existing Pages projects on this account include trespies-dev (dash.trespies.dev), and the POC
  projects: quorum, counterclock, body-almanac, ip-scout, hey-matt (matt.trespies.dev),
  phenotype-draft, contagion, bodyglossary.

## Prerequisite — the scoped API token (the #1 gotcha)
`wrangler` authenticates via an **OAuth** token, which `wrangler pages deploy` accepts but the public
REST API **rejects** ("Authentication error"). Custom-domain attach + DNS are REST-only in wrangler 4.x,
so you need a **scoped Cloudflare API token**:
- Permissions: **Account → Cloudflare Pages: Edit**, **Zone → DNS: Edit**, **Zone → Zone: Read**;
  scoped to this account + the `trespies.dev` zone.
- Hand-off pattern (never paste the token in chat): operator writes it to
  `trespies-poc/.cf-token` (already gitignored — confirm `git check-ignore` before anything), you read
  it for the API calls, operator rolls/deletes it after. It is ephemeral, not a shared credential.
- Verify it: `curl -s https://api.cloudflare.com/client/v4/user/tokens/verify -H "Authorization: Bearer $TOK"`
  → `success:true, status:active`.
- **Cross-machine:** the Windows machine needs the same capability — there's a `notify` handoff
  precedent (`handoffs/2026-06-27_cf-pages-deploy-parity-windows.md`) verifying token parity. Write one
  if deploying becomes Mac-only.

## The sequence (per folder)
```bash
TOK=$(tr -d '\r\n' < trespies-poc/.cf-token)
ACC=e64029811149939c1f67579b888309d7
ZID=087d1af3cd36cd575d7473c4f18de9d7
SLUG=<slug>

# 1. create the project (wrangler pages deploy does NOT auto-create it)
npx --yes wrangler pages project create "$SLUG" --production-branch=main

# 2. deploy the folder (note the canonical *.pages.dev target it prints — may have a random suffix)
npx --yes wrangler pages deploy "trespies-poc/$SLUG" --project-name="$SLUG" --branch=main --commit-dirty=true

# 3. attach the custom domain to the Pages project (REST — needs the API token)
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACC/pages/projects/$SLUG/domains" \
  -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  --data "{\"name\":\"$SLUG.trespies.dev\"}"

# 4. CREATE THE DNS RECORD (the #2 gotcha — attach does NOT create it; without this it sits "pending" forever)
#    proxied CNAME → the project's canonical *.pages.dev host from step 2 (e.g. contagion-86o.pages.dev)
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records" \
  -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"$SLUG.trespies.dev\",\"content\":\"<project>.pages.dev\",\"proxied\":true}"
```

## Verify
- `*.pages.dev` is live immediately: `curl -sI https://<project>.pages.dev` → 200.
- Custom domain takes a few minutes (cert + DNS). The domain object goes `pending` → `active`; HTTPS
  passes through `522` (edge up, cert finalizing) → `200`.
- **Local-DNS gotcha:** your own machine may keep a negative `NXDOMAIN` cache from before the record
  existed, so `curl https://<slug>.trespies.dev` returns "Could not resolve host" while the domain is
  live everywhere else. Prove liveness by bypassing the local resolver:
  `ip=$(dig +short <slug>.trespies.dev @1.1.1.1 | head -1); curl -sI --resolve "<slug>.trespies.dev:443:$ip" https://<slug>.trespies.dev`.
  To fix the local machine: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` (needs the
  operator's sudo) or wait for the negative TTL.
- **Don't poll in the foreground.** Run a background watcher that loops the `--resolve` check until all
  domains return 200 (the harness re-invokes you on completion).

## Rollback / cleanup
- Remove a custom domain: `DELETE /accounts/$ACC/pages/projects/$SLUG/domains/$SLUG.trespies.dev` + delete
  the CNAME. Delete the project: `wrangler pages project delete $SLUG`.
- After deploying, the `.cf-token` has done its job — remind the operator to `rm trespies-poc/.cf-token`
  and/or roll it.
