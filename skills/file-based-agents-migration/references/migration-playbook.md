# Migration Playbook

Use this procedure after the pre-edit audit. Prefer an incremental mixed-mode migration over an all-at-once rewrite.

## 1. Establish the applicable contract

1. Read the project's repository guidance and package scripts.
2. Record the installed `@mastra/core`, `mastra`, CLI, and deployer versions.
3. Inspect embedded documentation, relevant types, and discovery implementation.
4. Identify how the project is consumed: Mastra tooling, direct imports, tests, deployed entrypoints, or a combination.

If repository policy conflicts with the requested migration, stop and request a scoped decision rather than silently overriding it.

## 2. Audit and classify

Run the bundled auditor before editing. Inventory agents, tools, workflows, scorers, memory, workspace, processors, subagents, storage, observability, logger, server, Studio, schedules, and registration lookups.

Interpret each finding as:

- **supported:** the source and path shape matches a candidate convention that still requires installed-version and runtime verification;
- **unsupported:** no applicable discovery route was established, so the behavior remains code-defined;
- **needs-review:** source inspection cannot determine values, merge behavior, collisions, lookup compatibility, or runtime consumption.

The auditor exits successfully when findings are present. Read its limitation notice and resolve or disclose relevant review items before editing.

## 3. Map identity and keys

Create a migration map containing:

- existing registration key;
- internal ID and display name;
- lookup call sites;
- current definition and consumption paths;
- proposed file path and resulting discovered key;
- code that must remain registered;
- verification method.

Prefer directory and filenames that preserve existing keys. If a rename is unavoidable, update every caller and verify it through the real runtime path.

## 4. Migrate incrementally

For each agent or project-level component:

1. Separate static configuration from runtime-dependent behavior.
2. Create only files supported by the installed version.
3. Add the required default exports and companion files.
4. Keep unsupported or ambiguous behavior in the smallest clear code-registration path.
5. Verify that the file-routed definition is discovered and selected.
6. Remove only the code registration that the verified file route replaces.
7. Run focused project checks before continuing.

Avoid unrelated formatting, renaming, or refactoring. Revert a step when behavior or registration-key compatibility cannot be demonstrated.

## 5. Verify behavior

- Re-run the audit and explain material classification changes.
- Use the scripts defined by the project's `package.json` and repository guidance.
- Run typecheck, tests, and build commands relevant to the changed components.
- Start the project through Mastra tooling when discovery is part of the claim.
- Exercise `getAgent()`, `getWorkflow()`, APIs, workflows, or application paths that use preserved keys.
- Verify that retained code-only features still resolve and run.
- Compare observable configuration and behavior, not only source layout.

## 6. Report the result

Report:

- components migrated to file conventions;
- components retained in code and the reason;
- unresolved `needs-review` items;
- registration keys and IDs preserved or deliberately changed;
- verification commands and runtime checks;
- failures, warnings, and remaining risks.

## Preservation checklist

- [ ] Repository guidance and installed Mastra conventions were checked.
- [ ] Audit ran before edits and after migration.
- [ ] Unsupported and ambiguous cases were surfaced before changes.
- [ ] Agent, workflow, and scorer registration keys were mapped.
- [ ] Every affected `getAgent()`, `getWorkflow()`, and `getScorer()` lookup remains valid.
- [ ] Schedules, global scorers, and other code-only behavior were retained where required.
- [ ] Direct-import consumers were not falsely treated as file-discovered.
- [ ] Required default exports exist for routed workflows and singleton files.
- [ ] Project typecheck, tests, and build passed.
- [ ] Discovery-sensitive claims were exercised through a real Mastra runtime path.
- [ ] The final report separates migrated, retained, and unresolved work.
