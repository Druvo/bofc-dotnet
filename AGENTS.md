---
disable-kp-sync: true
---
@.claude/kp-instructions.md

# BOFC — agent instructions

`CLAUDE.md` is the canonical project doc for this repo. This file mirrors the
sections below for agents that don't read `CLAUDE.md`; keep the two in sync.

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature-slug>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
