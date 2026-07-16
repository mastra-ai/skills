---
name: file-based-agents-migration
description: Safely migrate a Mastra project toward its installed file-based-agent conventions. Use when converting code registration under src/mastra, evaluating whether Mastra wiring is file-routable, or planning an incremental mixed-mode migration without losing runtime behavior or registration keys.
---

# File-Based Agents Migration

Migrate only what the target project's installed Mastra version and repository instructions support. Migrate every supported portion safely; keep unsupported, dynamic, or uncertain wiring in code.

## Mandatory workflow

1. Load the existing `mastra` skill before doing Mastra work.
2. Read the target repository's instruction files (`AGENTS.md`, `CLAUDE.md`, and equivalents). Stop or ask before violating them.
3. Inspect the target's installed Mastra package versions, embedded docs, types, and discovery code. Treat this skill's layouts as a starting matrix, not timeless API truth.
4. Run this skill's read-only project auditor before edits. If the auditor is unavailable, stop and report that the skill package is incomplete.
5. Classify every relevant finding as supported, unsupported, or needs-review. Before editing, disclose unsupported and needs-review findings that affect the requested scope.
6. Build a mapping from existing registration keys, IDs, filenames, and runtime lookup strings to the proposed file layout.
7. Migrate one primitive at a time. Preserve behavior and keys; do not rename a key or lookup string without proving every call site.
8. Retain unsupported or dynamic wiring in code. Mixed file/code registration is a valid result, not a failed migration.
9. Re-run the audit and verify with the target project's documented typecheck, test, build, and runtime commands.
10. Report what migrated, what stayed in code, unresolved review items, preserved keys, and verification evidence.

## Load references progressively

- Read [references/conventions.md](references/conventions.md) before proposing paths or exports.
- Read [references/unsupported-and-precedence.md](references/unsupported-and-precedence.md) before classifying findings or removing code registration.
- Read [references/migration-playbook.md](references/migration-playbook.md) before editing and use its preservation checklist during verification.

## Audit a target project

From this skill directory, run before edits and again after migration:

```bash
node scripts/audit-project.mjs --project /path/to/project --format human
node scripts/audit-project.mjs --project /path/to/project --format json
```

Findings do not make the command fail. Treat `supported` as a syntactic migration candidate, `unsupported` as wiring that stays in code, and `needs-review` as a required semantic decision. Use `node scripts/audit-project.mjs --help` for exit behavior.

## Non-negotiable safety rules

- Never claim static inspection proves runtime semantics.
- Never silently drop schedules, global scorers, dynamic functions, direct-import wiring, or other unsupported features.
- Never assume a directory name can replace an existing registration key.
- Never treat a successful build alone as proof that runtime lookups still resolve.
- Never edit the target project from an audit script.
