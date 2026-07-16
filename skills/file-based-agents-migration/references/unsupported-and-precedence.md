# Unsupported Cases and Precedence

Inspect the installed Mastra documentation and source before applying these classifications. They are conservative migration boundaries, not permanent compatibility promises across releases.

## Before editing

Surface every `unsupported` or `needs-review` finding that affects the migration. State which behavior must remain code-defined, what cannot be established statically, and how registration keys and runtime behavior will be verified.

## No established file route

Retain code registration unless the installed version establishes an equivalent convention:

- **Schedules:** releases without a file convention still require runtime `mastra.schedules.create()` calls.
- **Project-wide scorers:** per-agent scorer directories do not replace global scorer registration.
- **Direct-library consumers:** importing the Mastra instance directly bypasses CLI file discovery.
- **Nested tools:** versions that scan direct children do not discover deeper tool modules.
- **Excessive subagent depth:** agents beyond the installed depth limit are not routed.
- **Symlinked or test files:** discovery commonly skips symlinks and test/spec modules.
- **Missing default exports:** workflows and project-level singleton files are ignored when the installed convention requires a default export.

Prefer “no applicable route was established for the installed version” over broad claims that Mastra can never support a construct.

## Requires semantic review

Static source inspection cannot safely establish an equivalent file representation for:

- function-valued or request-context-dependent configuration;
- computed maps, spreads, factories, conditional imports, or environment branches;
- runtime-generated agents, tools, scorers, processors, or subagents;
- mutation or behavior attached after construction;
- custom build or deployer integrations;
- registrations consumed through both Mastra tooling and direct imports;
- collisions whose winning definition cannot be proven from the installed implementation.

Keep these cases in code until runtime behavior and merge semantics are understood.

## Precedence hazards

Verify the installed implementation before removing either side of a collision. Common patterns include:

- dynamic `config.instructions` overriding `instructions.md`;
- static config collections merging with discovered entries while config wins key collisions;
- function-valued tools, skills, scorers, or agents preventing static discovery from merging;
- `config.memory` and `config.workspace` overriding sibling files;
- code-registered workflows and project-level singletons winning same-key collisions;
- a code-defined `new Agent(...)` preventing sibling capability files from taking effect.

A successful build does not prove that the intended file-routed definition won. Exercise the actual registration key through a discovery-backed runtime path before deleting code registration.

## Mixed mode

File-based and code-defined configuration can coexist. A correct migration may leave schedules, global scorers, direct-library wiring, dynamic configuration, or version-dependent components in code while moving supported static components to files.

The final report should distinguish:

- components migrated to file conventions;
- components retained in code and why;
- unresolved `needs-review` items;
- key or identity changes and their verification.
