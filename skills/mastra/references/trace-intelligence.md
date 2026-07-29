# Trace Intelligence Reference

How to query Trace Intelligence (private beta) from the Mastra platform. Trace Intelligence analyzes completed agent traces and groups them into recurring themes across four trace signals: `goal`, `outcome`, `behavior`, and `sentiment`.

Use this reference when the user asks to investigate agent health, find recurring failures or behavior issues, identify ways to improve an agent, understand what users ask for, inspect recurring goal/outcome/behavior/sentiment themes, or query Trace Intelligence data programmatically.

## Concepts

- **Trace signal**: one-sentence description generated per completed trace, per dimension (`goal`, `outcome`, `behavior`, `sentiment`).
- **Theme**: durable cluster of similar trace signals for one dimension, with a label and description. Theme IDs are stable across snapshots for one signal.
- **Snapshot**: a moving analysis window over recent traces. Identified by an opaque `snapshotId`.
- **Noise**: traces in a snapshot that did not cluster into any theme. Window-local, no durable identity.

## Prerequisites

- The project uses Mastra platform Observability and has completed traces.
- The project is enrolled in the Trace Intelligence private beta. Non-enrolled projects get `403` from direct project reads.

Analysis is asynchronous: a project generally needs 100+ completed traces before themes exist. Empty responses usually mean not enough analyzed data yet, not an error.

## Access paths

All Trace Intelligence routes are read-only `GET` requests under `/api/learning/`.

1. **`mastra api learning` CLI** (preferred): use the same credential model as hosted observability commands. No `--url` or `--header` is required if `MASTRA_PLATFORM_ACCESS_TOKEN` and `MASTRA_PROJECT_ID` are set, or if `.mastra-project.json` is present. The CLI also resolves `X-Mastra-Organization-Id` from `MASTRA_ORGANIZATION_ID` or `.mastra-project.json`.

```bash
mastra api learning entities '{"entityType":"agent"}'
```

Pass `--url` and `--header` only when overriding the hosted Trace Intelligence target or credentials.

2. **Local dev server proxy**: `mastra dev` proxies `GET http://localhost:4111/api/learning/*` to the platform using its normal platform credentials. Loopback only.

```bash
curl -fsS "http://localhost:4111/api/learning/entities?entityType=agent" | jq
```

3. **Direct platform endpoint** (no CLI or dev server needed): call `https://output.signals.mastra.ai` with explicit auth, project, and organization headers.

```bash
BASE="https://output.signals.mastra.ai"
AUTH=(
  -H "Authorization: Bearer $MASTRA_PLATFORM_ACCESS_TOKEN"
  -H "X-Mastra-Project-Id: $MASTRA_PROJECT_ID"
  -H "X-Mastra-Organization-Id: $MASTRA_ORGANIZATION_ID"
)

curl -fsS "${AUTH[@]}" "$BASE/api/learning/entities?entityType=agent" | jq
```

The curl examples below use `$BASE` and `"${AUTH[@]}"`; for the local proxy, replace `$BASE` with `http://localhost:4111` and drop the headers.

## CLI commands

Every route has a CLI command. Positional args carry `entityId`/`themeId`; the JSON input carries the query params from the [route summary](#route-summary). Pass `--schema` to any command to print its input schema, and `--pretty` for readable output.

| Command | Route |
| --- | --- |
| `mastra api learning entities '{"entityType":"agent"}'` | `/api/learning/entities` |
| `mastra api learning snapshots <entityId> <input>` | `.../theme-snapshots` |
| `mastra api learning flow <entityId> <input>` | `.../theme-flow` |
| `mastra api learning paths <entityId> <input>` | `.../theme-paths` |
| `mastra api learning theme list <entityId> <input>` | `.../themes` |
| `mastra api learning theme get <entityId> <themeId> <input>` | `.../themes/:themeId` |
| `mastra api learning theme examples <entityId> <themeId> <input>` | `.../themes/:themeId/examples` |
| `mastra api learning theme history <entityId> <themeId> <input>` | `.../themes/:themeId/history` |
| `mastra api learning noise get <entityId> <input>` | `.../noise` |
| `mastra api learning noise examples <entityId> <input>` | `.../noise/examples` |

Same workflow as the curl steps below:

```bash
# 1. Discover entities and their available signals
mastra api learning entities '{"entityType":"agent"}'

# 2. List snapshots (signalNames is ordered, comma-separated)
mastra api learning snapshots my-agent \
  '{"entityType":"agent","signalNames":"goal,outcome,behavior,sentiment","limit":10}'

# 3. Themes for one signal in one snapshot (snapshotId from step 2)
mastra api learning theme list my-agent \
  '{"entityType":"agent","signalName":"goal","snapshotId":"<snapshotId>"}'

# 4. Drill into one theme (numeric themeId from step 3)
mastra api learning theme examples my-agent 42 \
  '{"entityType":"agent","signalName":"goal","snapshotId":"<snapshotId>","limit":10}'
mastra api learning theme history my-agent 42 \
  '{"entityType":"agent","signalName":"goal"}'
```

## Investigation workflow

For broad agent-health or improvement questions, start with Trace Intelligence to find recurring patterns, then use trace/log/metric/score APIs for concrete evidence from specific runs. For a specific failed run or error, start with `mastra api trace` or `mastra api log`, then use Trace Intelligence to check whether the issue is recurring.

Follow this order for aggregate Trace Intelligence analysis. Later calls need values returned by earlier calls.

### 1. Discover entities

Lists entities (agents) that have theme output, with which signals are available:

```bash
curl -fsS "${AUTH[@]}" "$BASE/api/learning/entities?entityType=agent" \
  | jq '.entities[] | {entityId, availableSignals, latestWindow}'
```

Only request `signalNames` that appear in `availableSignals` in later calls.

### 2. List snapshots

`signalNames` is an ordered, comma-separated list (1-4 unique values). A snapshot is returned only when every requested signal has usable output for the window:

```bash
ENTITY="my-agent" # TODO: entityId from step 1
curl -fsS "${AUTH[@]}" \
  "$BASE/api/learning/entities/$ENTITY/theme-snapshots?entityType=agent&signalNames=goal,outcome,behavior,sentiment&limit=10" \
  | jq '.snapshots[] | {snapshotId, ordinal, total, startedAt, endedAt, traceCount}'
```

Optional `from`/`to` (ISO timestamps with offset) bound the snapshot cutoffs; `cursor` paginates newest-first via `nextCursor`.

### 3. Read themes or the cross-signal flow

Use each trace signal for a different diagnostic angle:

- `goal`: what users are trying to do.
- `outcome`: what completes, fails, gets blocked, or remains unresolved.
- `behavior`: how the agent behaves, including tool use, loops, refusals, recovery, or drift.
- `sentiment`: how user emotion changes across interactions.

Themes for one signal in one snapshot:

```bash
SNAPSHOT="..." # TODO: snapshotId from step 2
curl -fsS "${AUTH[@]}" \
  "$BASE/api/learning/entities/$ENTITY/themes?entityType=agent&signalName=goal&snapshotId=$SNAPSHOT" \
  | jq '{themes: [.themes[] | {themeId, label, state, traceCount, coverage, trend}], noise}'
```

Cross-signal flow (Sankey-style stages and links; counts are distinct traces):

```bash
curl -fsS "${AUTH[@]}" \
  "$BASE/api/learning/entities/$ENTITY/theme-flow?entityType=agent&signalNames=goal,outcome&snapshotId=$SNAPSHOT" \
  | jq '{stages: [.stages[] | {signalName, nodes: [.nodes[] | {label, kind, traceCount, stageShare}]}], links}'
```

### 4. Drill into one theme

Use examples to move from aggregate themes to concrete traces. After identifying a suspicious theme, inspect its examples, then use the returned `traceId` with `mastra api trace`, logs, metrics, or scores when you need execution-level evidence.

Detail, examples (raw trace signal texts), and history:

```bash
THEME="42" # TODO: numeric themeId from step 3
curl -fsS "${AUTH[@]}" \
  "$BASE/api/learning/entities/$ENTITY/themes/$THEME?entityType=agent&signalName=goal&snapshotId=$SNAPSHOT" | jq '.theme'

curl -fsS "${AUTH[@]}" \
  "$BASE/api/learning/entities/$ENTITY/themes/$THEME/examples?entityType=agent&signalName=goal&snapshotId=$SNAPSHOT&limit=10" \
  | jq '.examples[] | {traceId, signalText}'

curl -fsS "${AUTH[@]}" \
  "$BASE/api/learning/entities/$ENTITY/themes/$THEME/history?entityType=agent&signalName=goal" \
  | jq '{points: [.points[] | {state, traceCount, coverage}], relationships}'
```

History does not take `snapshotId`; it returns the theme's lifecycle (`birth`, `continue`, `split`, `merge`, `death`, `resurrection`) across snapshots, plus split/merge relationships.

### 5. Noise and per-trace paths

Noise bucket and its examples (same query shape as themes, using `/noise` and `/noise/examples`):

```bash
curl -fsS "${AUTH[@]}" \
  "$BASE/api/learning/entities/$ENTITY/noise?entityType=agent&signalName=goal&snapshotId=$SNAPSHOT" | jq '.noise'
```

Per-trace assignments across the ordered signals (trace-level companion to `theme-flow`; paginate with `limit`/`offset` until `nextOffset` is absent):

```bash
curl -fsS "${AUTH[@]}" \
  "$BASE/api/learning/entities/$ENTITY/theme-paths?entityType=agent&signalNames=goal,outcome&snapshotId=$SNAPSHOT&limit=100" \
  | jq '{themes, paths: .paths[:5]}'
```

`paths[].assignments` maps each signal to a theme key (resolved in the `themes` dictionary) or `"noise"`. Use this to join themes back to concrete `traceId` values, then inspect those traces with `mastra api trace` (see [`mastra-api.md`](mastra-api.md)).

## Route summary

| Route | Required query params | Optional |
| --- | --- | --- |
| `GET /api/learning/entities` | `entityType` | `limit` |
| `GET .../:entityId/theme-snapshots` | `entityType`, `signalNames` | `limit`, `cursor`, `from`, `to` |
| `GET .../:entityId/theme-flow` | `entityType`, `signalNames`, `snapshotId` | `themeLimitPerStage` |
| `GET .../:entityId/theme-paths` | `entityType`, `signalNames`, `snapshotId` | `limit`, `offset` |
| `GET .../:entityId/themes` | `entityType`, `signalName`, `snapshotId` | — |
| `GET .../:entityId/themes/:themeId` | `entityType`, `signalName`, `snapshotId` | — |
| `GET .../:entityId/themes/:themeId/examples` | `entityType`, `signalName`, `snapshotId` | `limit`, `offset` |
| `GET .../:entityId/themes/:themeId/history` | `entityType`, `signalName` | `limit`, `cursor` |
| `GET .../:entityId/noise` | `entityType`, `signalName`, `snapshotId` | — |
| `GET .../:entityId/noise/examples` | `entityType`, `signalName`, `snapshotId` | `limit`, `offset` |

`:themeId` is numeric. Flow/paths/snapshots take plural ordered `signalNames`; theme/noise routes take singular `signalName`.

## Rules and caveats

- **`snapshotId` is opaque.** Send it back unchanged, with the same entity and signal selection it came from. It is rejected for a different project, entity, or signal set. Never construct or reuse snapshot IDs across scopes.
- **Counts are distinct traces**, not assignment rows. `coverage`, `stageShare`, `sourceShare`, `targetShare` are fractions of the deduplicated counts.
- **`other` nodes in `theme-flow`** are lower-volume themes collapsed per stage. They have no `themeId` and cannot be drilled into; raise `themeLimitPerStage` to expand them.
- **Noise is window-local.** It has no durable ID, label, or trend, and differs between snapshots.
- **Results are AI-generated summaries.** Verify conclusions against theme examples and the underlying traces before acting on them.

## Errors

- `401`: bad or missing bearer token. Check `MASTRA_PLATFORM_ACCESS_TOKEN`.
- `403` mentioning `X-Mastra-Organization-Id`: the organization header is missing. Set `MASTRA_ORGANIZATION_ID` (direct curl) or run from a directory containing `.mastra-project.json` (CLI).
- `403`: project not enrolled in the private beta, or the local proxy was called from a non-loopback host.
- `503` from the local proxy: `MASTRA_PLATFORM_ACCESS_TOKEN` / `MASTRA_PROJECT_ID` missing from the dev server environment.
- Empty `entities` or `snapshots`: not enough analyzed traces yet, or the requested `signalNames` are not all available. Re-check `availableSignals` from the entities call.
