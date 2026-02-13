# Opus Prompt 1: OpenClaw Plugin API Deep Dive

**Agent Level:** Opus 4.5
**Estimated Duration:** 2-4 hours
**Output:** Technical research document + code examples

---

## Context

We're building a specification-driven development orchestration plugin for OpenClaw called `@openclaw/dojo-genesis`. This plugin needs to:

1. Register custom commands (`/dojo init`, `/dojo scout`, etc.)
2. Persist project state to the file system
3. Hook into OpenClaw's message routing to intercept commands
4. Bundle 44 skills and control their loading
5. Operate securely with file system access

The architecture document is at `./ARCHITECTURE.md` — read it first to understand the full vision.

---

## Your Task

Research the OpenClaw plugin API in depth and provide definitive answers to these questions:

### 1. Custom Command Registration

**Question:** How do we register custom commands that invoke AI agent workflows?

**What we need to know:**
- Exact API for registering commands via `register(api)`
- How to define command syntax and arguments
- How to route commands to AI agent vs. execute directly (auto-reply commands)
- How to pass project context to the agent when a command runs
- Error handling for malformed commands

**Deliverable:**
- Code example showing `/dojo scout <tension>` command registration
- Explanation of command execution lifecycle
- Best practices for command design

### 2. State Persistence Strategy

**Question:** How should we persist plugin-specific state (project state, decision logs, specs)?

**Options to evaluate:**
- File-based state in `~/.openclaw/dojo-genesis/` (our current approach)
- OpenClaw Gateway memory backend
- Hybrid (state.json for structured data, markdown for human-readable artifacts)

**What we need to know:**
- Does OpenClaw provide a plugin-specific storage API?
- Can plugins write to arbitrary file paths, or are they sandboxed?
- How to handle permissions and security for file operations?
- How to make state portable across systems?

**Deliverable:**
- Recommendation for state persistence approach
- Code example showing read/write operations
- Security considerations and best practices

### 3. Message Routing and Hooks

**Question:** How do we hook into OpenClaw's message routing to intercept /dojo commands before they reach the agent?

**What we need to know:**
- Can plugins intercept commands and modify behavior?
- How to register hooks (e.g., `on_command`, `on_message`)?
- How to pass modified context to the agent?
- How to prevent conflicts with other plugins?

**Deliverable:**
- Hook registration code example
- Message routing flow diagram
- Conflict prevention strategies

### 4. Skill Bundling and Loading

**Question:** How do we bundle 44 skills within the plugin and control their loading?

**What we need to know:**
- Plugin manifest structure for skills (list each skill in `openclaw.plugin.json`?)
- How to organize skills in the plugin directory structure?
- Can we lazy-load skills, or are they all loaded at plugin init?
- How to make skills orchestration-aware (receive project context)?

**Deliverable:**
- Recommended directory structure for bundled skills
- Manifest configuration example
- Skill loading and context injection pattern

### 5. Security Considerations

**Question:** What security measures are required for file system operations?

**What we need to know:**
- Post-ClawHavoc security requirements (VirusTotal scans, etc.)
- Permissions model for file access
- How to validate user input to prevent path traversal attacks
- How to handle sensitive data in project files

**Deliverable:**
- Security checklist for file operations
- Input validation patterns
- Best practices for secure plugin development

---

## Research Approach

1. **Read OpenClaw source code:**
   - `openclaw/openclaw` GitHub repository
   - `src/plugins/` directory
   - `dist/plugin-sdk/` TypeScript types

2. **Study existing plugins:**
   - @openclaw/voice-call (example plugin)
   - @openclaw/cognee (memory plugin with state management)
   - Official OpenClaw plugins for patterns

3. **Review documentation:**
   - docs.openclaw.ai/tools/plugin
   - deepwiki.com/openclaw/openclaw/10-extensions-and-plugins
   - Recent GitHub issues and discussions

4. **Test hypotheses:**
   - If unclear, propose 2-3 approaches and evaluate tradeoffs

---

## Output Format

Create a research document with these sections:

```markdown
# OpenClaw Plugin API Research

## 1. Custom Command Registration
[Findings, code examples, best practices]

## 2. State Persistence Strategy
[Recommendation, code examples, tradeoffs]

## 3. Message Routing and Hooks
[Hook API, flow diagram, examples]

## 4. Skill Bundling and Loading
[Directory structure, manifest config, loading pattern]

## 5. Security Considerations
[Security checklist, validation patterns, best practices]

## 6. Recommended Architecture Refinements
[Based on your findings, any changes to ARCHITECTURE.md?]

## 7. Code Examples
[Full working examples of key patterns]

## 8. Open Questions
[Anything you couldn't definitively answer — flag for further research]
```

---

## Success Criteria

- [ ] All 5 questions answered with confidence
- [ ] Code examples are syntactically correct and tested against OpenClaw docs
- [ ] Security considerations are comprehensive
- [ ] Recommendations are specific and actionable
- [ ] Document is ready to inform Phase 1 implementation

---

## Notes

- Prioritize **accuracy over speed** — we're building a foundation
- If OpenClaw's API is underdocumented, propose the **best-practice approach** based on patterns in the ecosystem
- Flag any assumptions clearly
- Include links to sources for all findings

---

**Timeline:** Start immediately, deliver within 2-4 hours of research time.
