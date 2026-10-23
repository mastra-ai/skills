# Advanced Trace Query Reference

Use `mastra api trace query` when a normal trace list cannot express the required filters: recursive boolean predicates, related span, score, or feedback conditions, metadata filters, ordering, or opaque cursor pagination.

## Command contract

The command sends `POST /api/observability/traces/query`. It uses the same target and credentials as other observability commands, including the EU host for EU projects (see [`mastra-api.md`](mastra-api.md#target-resolution)).

The inline JSON input is required. Before recommending the command, confirm that the installed CLI exposes it:

```bash
npx mastra api trace query --help
```

After confirming availability, inspect the target server's current contract:

```bash
npx mastra api trace query --schema
```

Use `--schema` to confirm that the target supports the route and to inspect the current request and response shape and structural constraints. Predicate paths are generic strings in the schema, so it does not provide the context-specific field/operator matrix. If you need more information, read the [reference docs online](https://mastra.ai/reference/observability/tracing/advanced-queries). Do not infer unsupported predicates from storage columns or older documentation. The server remains the ultimate validation authority.

## Query workflow

1. Run `trace query --help` and verify that the installed CLI exposes the command.
1. Run `trace query --schema` against the intended target to inspect the route contract and structural constraints.
1. Build the smallest query that answers the question. `timeRange` is required; `from` is inclusive and `to` is exclusive.
1. Keep `page.limit` small while exploring and project lightweight results with `jq`.
1. If `data.page.next` is non-null, repeat the identical query with that value in `page.after`.
1. Use `trace get` or `trace span` to inspect evidence for selected trace IDs.

Query a time range:

```bash
npx mastra api trace query \
  '{"timeRange":{"from":"2026-08-01T00:00:00.000Z","to":"2026-08-08T00:00:00.000Z"},"page":{"limit":25}}' \
  | jq '{traces: [.data.traces[] | {traceId, entityName, status, startedAt}], next: .data.page.next}'
```

Find traces containing a failed tool call. Conditions inside one `spans.some` clause must match the same span:

```bash
npx mastra api trace query \
  '{"timeRange":{"from":"2026-08-01T00:00:00.000Z","to":"2026-08-08T00:00:00.000Z"},"where":{"spans":{"some":{"op":"and","args":[{"op":"eq","left":{"path":"spanType"},"right":{"literal":"tool_call"}},{"op":"exists","path":"error"}]}}},"page":{"limit":25}}' \
  | jq '{traces: .data.traces, next: .data.page.next}'
```

Find traces with a low score from one scorer. Conditions inside one `scores.some` clause must match the same score record:

```bash
npx mastra api trace query \
  '{"timeRange":{"from":"2026-08-01T00:00:00.000Z","to":"2026-08-08T00:00:00.000Z"},"where":{"scores":{"some":{"op":"and","args":[{"op":"eq","left":{"path":"scorerId"},"right":{"literal":"factuality"}},{"op":"lt","left":{"path":"score"},"right":{"literal":0.6}}]}}},"page":{"limit":25}}' \
  | jq '{traces: .data.traces, next: .data.page.next}'
```

## Pagination

The query response remains nested under `data` so the pagination cursor is preserved:

```json
{
  "data": {
    "traces": [],
    "page": { "next": "opaque-cursor" }
  }
}
```

Pass a non-null cursor back without decoding or modifying it:

```bash
npx mastra api trace query \
  '{"timeRange":{"from":"2026-08-01T00:00:00.000Z","to":"2026-08-08T00:00:00.000Z"},"page":{"limit":25,"after":"<page.next>"}}'
```

A cursor is bound to the accepted query and ordering. Do not change the time range, predicates, or ordering between pages. A mismatched cursor returns `409`; a malformed cursor returns `400`.

A `422` with code `query_too_expensive` means the query hit a resource limit; retrying the same request fails again. Narrow `timeRange` (start with the last 24 hours) or add filters.

## Predicate semantics

- Compose predicates with `and`, `or`, and `not`.
- Use `some` when one related record must satisfy the complete nested predicate.
- Use `none` when no related record may satisfy the complete nested predicate. Traces with no related records also match `none`.
- Related span, score, and feedback clauses correlate records by trace. Conditions in separate related clauses do not imply that they refer to one shared related record.
- String comparisons are exact and case-sensitive unless the canonical documentation states otherwise.
- The root `timeRange` filters the selected root span's start time; it does not independently constrain related-record timestamps.
- Query results are lightweight and do not embed matching spans, scores, or feedback. Fetch trace or span details after selecting candidates.

## Query spans

Use `mastra api span query` (`POST /api/observability/spans/query`) when the answer is a list of spans rather than traces: every failed tool call, or every run of one agent including runs nested under other agents or workflows. Trace query returns one row per trace and matches spans only through `spans.some`; span query returns one row per completed span, and its `where` filters span fields directly (`spanType`, `name`, `status`, `entityName`, `durationMs`, `error`, …) with `and`/`or`/`not`. It has no `spans.some`, `scores`, or `feedback` clauses.

```bash
npx mastra api span query --help
npx mastra api span query --schema
npx mastra api span query \
  '{"timeRange":{"from":"2026-08-07T00:00:00.000Z","to":"2026-08-08T00:00:00.000Z"},"where":{"op":"and","args":[{"op":"eq","left":{"path":"spanType"},"right":{"literal":"tool_call"}},{"op":"eq","left":{"path":"status"},"right":{"literal":"error"}}]},"page":{"limit":25}}' \
  | jq '{spans: [.data.spans[] | {traceId, spanId, entityName, rootEntityName, errorPreview}], next: .data.page.next}'
```

`page.limit` defaults to 100 (max 1000); `orderBy` takes one of `startedAt`, `endedAt`, or `timeToFirstChunkMs` (default `startedAt desc`). Paginate exactly like `trace query`: pass a non-null `data.page.next` unchanged as `page.after` with the same query. There is no total count.

Check capabilities before relying on span query features instead of assuming what a store supports: `getObservabilityCapabilities()` reports `spanQuery`, and `spanQueryContextFields` for filters on identity, context, and parent/root entity fields (`traceId`, `threadId`, `resourceId`, `environment`, `rootEntityName`, …). Treat a missing value as unavailable. Unsupported stores return `501 SPAN_QUERY_UNSUPPORTED`; unsupported context-field filters return `422` with a `field_not_allowed` issue. Per-field capability reporting is still evolving, so re-check capabilities rather than hardcoding which store supports which field.

## Aggregate traces

Use `mastra api trace aggregate` (`POST /api/observability/traces/aggregate`) when the question asks for counts or measures rather than individual traces: error rate per agent, p95 latency per workflow, daily token usage or cost. It accepts the same `timeRange` and `where` selection as `trace query`, so the same predicate counts exactly the traces a query would list.

Confirm that the installed CLI exposes the command and that the target supports aggregation:

```bash
npx mastra api trace aggregate --help
npx mastra api trace aggregate --schema
```

From the client SDK, check `capabilities.traceAggregate` from `getObservabilityCapabilities()` before calling `aggregateTraces()`. A missing value means the server doesn't support aggregation; stores without it return `501 TRACE_AGGREGATE_UNSUPPORTED`.

Request shape: `timeRange` (required, up to 365 days), optional `where`, `measures` (required), `groupBy` (up to two dimensions such as `entityName`, `environment`, `userId`, or `metadata.<key>`), optional `interval` (`1m`, `5m`, `15m`, `1h`, `1d`), `having` over measures, `orderBy` (`{ field, direction }`, default `count desc`), and `limit` (groups, default 100, max 1000). Measures include `count`, `countDistinct.<field>`, `errorCount`, `errorRate`, `duration.{avg,min,max,p50,p90,p95,p99}`, `tokens.{input,output,total,reasoning,cached}.{sum,avg}`, and `cost.{sum,avg}`.

```bash
npx mastra api trace aggregate \
  '{"timeRange":{"from":"2026-08-01T00:00:00.000Z","to":"2026-08-08T00:00:00.000Z"},"where":{"op":"eq","left":{"path":"entityType"},"right":{"literal":"agent"}},"groupBy":["entityName"],"measures":["count","errorRate","duration.p95","cost.sum"],"orderBy":{"field":"errorRate","direction":"desc"},"limit":10}'
```

Each row has `dimensions`, `measures`, a `bucket` when `interval` is set, and a `cost` object (`coverage`, `unit`) when a cost measure is requested. Report low `cost.coverage` as understated spend; `cost.sum` is `null` when `cost.unit` is `'mixed'`. Aggregation isn't paginated: when `truncated` is `true`, narrow the selection instead of paging. Empty time buckets are omitted, not zero-filled. To see the traces behind a group, rerun `trace query` with the same selection plus the group's dimension values in `where`.

## Aggregate spans

Use `mastra api span aggregate` (`POST /api/observability/spans/aggregate`) when measures should be computed per span rather than per trace. Trace aggregation rolls each trace up and groups by root fields (e.g. the top-level agent); span aggregation counts any span, including nested agent runs and tool calls, grouped by span fields: `name`, `spanType`, `status`, `entityType`/`entityId`/`entityName`, `parentEntity*`/`rootEntity*` type and name, `environment`, `serviceName`, `executionSource`, `threadId`, `resourceId`, `userId`, `sessionId`, `organizationId`, `experimentId`. It selects exactly the spans `span query` would list for the same `timeRange` and `where`, and takes the same measures, `interval`, `having`, `orderBy`, and `limit` as `trace aggregate`.

```bash
npx mastra api span aggregate --help
npx mastra api span aggregate --schema
npx mastra api span aggregate \
  '{"timeRange":{"from":"2026-08-01T00:00:00.000Z","to":"2026-08-08T00:00:00.000Z"},"where":{"op":"eq","left":{"path":"spanType"},"right":{"literal":"tool_call"}},"groupBy":["entityName"],"measures":["count","errorRate","duration.p95"],"orderBy":{"field":"errorRate","direction":"desc"},"limit":10}'
```

Check `capabilities.spanAggregate` first; treat a missing value as unavailable. Unsupported servers return `501` (on Mastra platform, `404` while the feature is off). Rows and `truncated` match `trace aggregate`. Limits:

- Tokens and cost belong to the span that recorded them (usually `model_generation`) and are never rolled up to ancestors, so an `agent_run` group normally shows no usage. For spend per agent, filter `spanType` to `model_generation` and group by `rootEntityName`, or use `trace aggregate`.
- No `model` or `provider` dimension yet.
- On Mastra platform, organization-wide requests (no project) over 14 days return `422` with a `time_range_too_large` issue unless `where` has a top-level `spanType` `eq`/`in` limited to branch span types: `agent_run`, `workflow_run`, `tool_call`, `mcp_tool_call`, `mcp_server_request`, `processor_run`, `scorer_run`, `rag_ingestion`, `provider_tool_call`. Narrow the window, add that filter, or aggregate one project.

## Choosing the trace command

- `trace list`: browse recent traces with simple list filters.
- `trace query`: select completed traces using complex, explicit predicates.
- `trace aggregate`: count completed traces and compute grouped measures over the same selection.
- `span query`: list completed spans, including nested ones, with span-field predicates.
- `span aggregate`: count spans and compute grouped measures by span fields.
- `trace get <traceId>`: inspect one selected trace.
- `trace span <traceId> <spanId>`: fetch one span in full.

Advanced queries only return completed traces. The configured observability store must support the query API. If the server rejects a query that follows the current structural schema and canonical documentation as unsupported, report that limitation rather than falling back to an inaccurate client-side approximation.
