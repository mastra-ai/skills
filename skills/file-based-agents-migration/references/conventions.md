# File-Based Agent Conventions

Use this reference only after checking the project's installed Mastra versions. File-based agents are version-sensitive; installed documentation, types, and discovery implementation take precedence over this baseline.

## Establish the discovery boundary

File-routed primitives are discovered when a project is prepared, started, or built through Mastra tooling. Directly importing a `mastra` instance as a library does not perform file discovery. Projects with direct-library consumers may need to retain explicit registration for that path.

Discovery is conventionally rooted at `src/mastra/`. Symlinks and test/spec files are skipped. Discovery may notice an agent directory when either `config.ts|js` or `instructions.md` exists, but the installed convention requires both files before treating the route as a complete file-based agent.

## Agent directory

```text
src/mastra/agents/<registration-key>/
  config.ts
  instructions.md
  tools/*.ts
  skills/
  memory.ts
  workspace.ts
  workspace/
  processors/*.ts
  scorers/*.ts
  subagents/<child>/
```

| Construct | Expected location | Discovery requirement |
| --- | --- | --- |
| Agent config | `config.ts|js` | Default-export the installed version's agent config shape |
| Instructions | `instructions.md` | Follow installed requirements and config precedence |
| Tools | `tools/*.ts|js` | Direct children with the required default export |
| Skills | `skills/` | Follow the installed Agent Skills convention |
| Memory | `memory.ts|js` | Use the expected default export; config may take precedence |
| Workspace | `workspace.ts|js`, `workspace/` | Config may take precedence; seed files have build-time behavior |
| Processors | `processors/*.ts|js` | Direct children with the expected default export |
| Scorers | `scorers/*.ts|js` | Per-agent scope; direct children with the expected default export |
| Subagents | `subagents/<child>/` | Self-contained agent directories within the installed depth limit |

Do not place shared helper modules in a discovered capability directory unless the installed implementation explicitly excludes them. Nested tool directories are not discovered by versions that scan only direct children.

## Project-level primitives

These conventions live directly under `src/mastra/`:

| Primitive | Expected location |
| --- | --- |
| Workflows | `workflows/*.ts|js` |
| Storage | `storage.ts|js` |
| Observability | `observability.ts|js` |
| Logger | `logger.ts|js` |
| Server | `server.ts|js` |
| Studio | `studio.ts|js` |

Workflows and singleton modules are file-routed only when they provide the expected default export. Filenames commonly determine registration keys, so preserve existing `getWorkflow()` strings and external callers when selecting paths.

## Preserve identity and lookup keys

Before editing, inventory:

- keys in `new Mastra({ agents, workflows, scorers, ... })` maps;
- agent and workflow internal IDs and display names;
- `getAgent('...')`, `getWorkflow('...')`, and `getScorer('...')` strings;
- API, Studio, tests, schedules, and application code that use those keys;
- keys that the proposed directories and filenames will create.

A directory name is not automatically interchangeable with an existing agent ID or registration key. Prefer paths that preserve current keys. If a key must change, update every caller and verify it through the real discovery-backed runtime path.
