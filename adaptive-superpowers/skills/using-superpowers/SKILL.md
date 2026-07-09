---
name: using-superpowers
description: Route development work into the lightest safe workflow before invoking other skills. Use at the start of a conversation and whenever scope, risk, or uncertainty changes.
---

<SUBAGENT-STOP>
If dispatched as a subagent for one bounded task, skip this skill.
</SUBAGENT-STOP>

# Adaptive Superpowers

Use Superpowers proportionally. Optimize total effort and token cost, not ceremony.

## Priority

1. Follow explicit user instructions.
2. Always invoke a skill the user explicitly requests.
3. Otherwise route the task before invoking process skills.

## Route the task

Classify from the request and, only when needed, a few bounded read-only checks.

### Light

Use only when all are true:

- The desired result and acceptance check are clear.
- The change is local, reversible, and has a predictable blast radius.
- Verification is quick and objective.

Act directly, run the smallest relevant verification, and report evidence. Do not invoke brainstorming, writing-plans, worktrees, subagents, or formal review merely because they exist.

Examples: copy changes, a known configuration value, a narrow style adjustment, or a mechanical rename with an obvious check.

### Standard

Use when the task is bounded but one detail is uncertain, or implementation has more than one meaningful step.

Before editing, state a compact contract:

- Goal
- Expected scope
- Verification

Then implement. Invoke only the skill that addresses the real risk, such as test-driven-development for behavior or systematic-debugging for a failure. Skip design documents, worktrees, and subagents unless the task later escalates.

### Full

Use the full workflow when any of these apply:

- Requirements or acceptance criteria are ambiguous.
- The change crosses modules or alters architecture, public interfaces, data, authentication, permissions, or deployment.
- Failure is costly or hard to reverse.
- Verification is unclear.
- The work is expected to span several independent tasks or sessions.

Typical flow:

1. brainstorming
2. using-git-worktrees when isolation helps
3. writing-plans
4. subagent-driven-development or executing-plans
5. test-driven-development as required by implementation
6. requesting-code-review
7. verification-before-completion
8. finishing-a-development-branch

Do not invoke skills that do not apply, even in Full mode.

## Escalate while working

Immediately pause patch-by-patch editing and move up one level when any occurs:

- The user has to correct the same interpretation twice.
- The change spreads beyond the stated scope.
- A fix creates a new failure or requires unrelated edits.
- A public interface, shared data, security boundary, or deployment path becomes involved.
- Verification remains unclear or repeatedly fails.

Preserve completed evidence, state why the route changed, and continue from the appropriate workflow stage. Do not restart work unnecessarily.

## De-escalate

After investigation proves the task local and objectively verifiable, move down one level. Keep any useful contract or tests already created; drop unnecessary ceremony.

## Platform adaptation

For Codex, read `references/codex-tools.md` only when tool-name mapping is needed. For Pi or Antigravity, read the matching reference only when running there.
