# Query Traces and Spans

Use `mastra api trace query` when a normal trace list cannot express the required filters: recursive boolean predicates, related span conditions, metadata filters, ordering, or opaque cursor pagination.

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

Use `--schema` to inspect the route's request/response shape and structural constraints. A route in the schema does not prove that the configured store supports every feature. Predicate paths are generic strings, so the schema also does not provide the context-specific field/operator matrix. Use the [canonical query reference](https://mastra.ai/reference/observability/tracing/advanced-queries) for fields, operators, optional capabilities, and limits. Do not infer valid predicates from storage columns. The target server's capabilities and validation determine what is available; a newer local CLI or Core checkout does not prove a deployed Platform server supports the same features.

Check the target's capabilities using the client SDK's `getObservabilityCapabilities()`: `traceQuery`, `spanQuery`, `traceAggregate`, and `spanAggregate` enable the four operations. These examples require a CLI exposing the relevant command and a server/store advertising its capability. Replace the example timestamps with a recent range containing the user's data. For Platform retention, follow the public [pricing page](https://mastra.ai/pricing); plan retention and API request validation limits are separate.

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

## Pagination

Trace queries default to keyset pagination. Their CLI response remains nested under `data` so the pagination cursor is preserved:

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

Trace queries also support numbered pages (`pagination`) and delta polling (`mode: "delta"`). These return `data.pagination` or `data.deltaCursor`/`data.delta.hasMore`, respectively. Do not combine pagination modes or interchange their cursors. Span queries support keyset pagination only. Follow the [pagination reference](https://mastra.ai/reference/observability/tracing/advanced-queries#pagination-and-errors) when choosing numbered pages or polling.

For errors, inspect the CLI error details. `422 TRACE_QUERY_INVALID` identifies invalid requests through issue codes and paths. `503 TRACE_QUERY_RESOURCE_LIMIT` or `504 TRACE_QUERY_EXECUTION_TIMEOUT` calls for a narrower time range or more selective filters; increasing the CLI timeout does not raise the database execution budget. See the canonical reference for operation-specific errors.

## Predicate semantics

- Compose predicates with `and`, `or`, and `not`.
- Use `some` when one related record must satisfy the complete nested predicate.
- Use `none` when no related record may satisfy the complete nested predicate. Traces with no related records also match `none`.
- Related span clauses correlate records by trace. Conditions in separate `spans.some` clauses can match different spans; put conditions in one clause when they must match the same span.
- String comparisons are exact and case-sensitive unless the canonical documentation states otherwise.
- The root `timeRange` filters the selected root span's start time; it does not independently constrain related-record timestamps.
- Query results are lightweight and do not embed matching spans. Fetch trace or span details after selecting candidates.

## Query spans

Use `mastra api span query` (`POST /api/observability/spans/query`) when the answer is a list of spans rather than traces: every failed tool call, or every run of one agent including runs nested under other agents or workflows. Trace query returns one row per trace and tests related spans through `spans.some` or `spans.none`; span query returns one row per completed span, and its `where` filters span fields directly (`spanType`, `name`, `status`, `entityName`, `durationMs`, `error`, …) with `and`/`or`/`not`. Do not wrap span predicates in `spans.some`.

```bash
npx mastra api span query --help
npx mastra api span query --schema
npx mastra api span query \
  '{"timeRange":{"from":"2026-08-07T00:00:00.000Z","to":"2026-08-08T00:00:00.000Z"},"where":{"op":"and","args":[{"op":"eq","left":{"path":"spanType"},"right":{"literal":"tool_call"}},{"op":"eq","left":{"path":"status"},"right":{"literal":"error"}}]},"page":{"limit":25}}' \
  | jq '{spans: [.data.spans[] | {traceId, spanId, entityName, rootEntityName, errorPreview}], next: .data.page.next}'
```

For ordering, use a one-item array, such as `"orderBy":[{"field":"startedAt","direction":"desc"}]`. Paginate exactly like a keyset trace query: pass a non-null `data.page.next` unchanged as `page.after` with the same query. Span queries do not return a total count. Read the [span query reference](https://mastra.ai/reference/observability/tracing/advanced-queries#query-spans) for supported sort fields and response fields.

Check `capabilities.spanQuery` from the client SDK's `getObservabilityCapabilities()` before relying on span queries. Optional fields have separate capabilities, including `spanQueryContextFields`, `spanQueryModelFields`, and `spanQueryOutcomeFields`; consult the canonical reference for the exact fields each gates. Treat missing or false capabilities as unavailable. Missing values in a result may mean a field wasn't recorded or isn't supported, not that a run succeeded.

## Aggregate traces

Use `mastra api trace aggregate` (`POST /api/observability/traces/aggregate`) when the question asks for counts or measures rather than individual traces: error rate per agent, p95 latency per workflow, daily token usage or cost. It accepts the same `timeRange` and `where` selection as `trace query`, so the same predicate counts exactly the traces a query would list.

Confirm that the installed CLI exposes the command and that the target supports aggregation:

```bash
npx mastra api trace aggregate --help
npx mastra api trace aggregate --schema
```

From the client SDK, check `capabilities.traceAggregate` from `getObservabilityCapabilities()` before calling `aggregateTraces()`. A missing value means the server doesn't support aggregation; stores without it return `501 TRACE_AGGREGATE_UNSUPPORTED`.

Supply `timeRange` and `measures`; add `where`, `groupBy`, `interval`, `having`, `orderBy`, and `limit` as needed. Aggregate `orderBy` is one object, unlike the one-item array used by trace and span queries. Consult the [aggregate reference](https://mastra.ai/reference/observability/tracing/advanced-queries#aggregate-traces) for available dimensions, measures, and request limits.

```bash
npx mastra api trace aggregate \
  '{"timeRange":{"from":"2026-08-01T00:00:00.000Z","to":"2026-08-08T00:00:00.000Z"},"where":{"op":"eq","left":{"path":"entityType"},"right":{"literal":"agent"}},"groupBy":["entityName"],"measures":["count","errorRate","duration.p95","cost.sum"],"orderBy":{"field":"errorRate","direction":"desc"},"limit":10}'
```

Rows contain `dimensions` and `measures`, plus bucket and cost information when applicable. Report low `cost.coverage` as incomplete spend; don't present a `null` cost as zero. Aggregation isn't paginated: when `truncated` is `true`, narrow the selection instead of paging. Empty time buckets are omitted, not zero-filled. To see the traces behind a group, rerun `trace query` with the same selection plus the group's dimension values in `where`. For a null dimension, use the documented missing-value predicate rather than `eq` with a null literal.

## Aggregate spans

Use `mastra api span aggregate` (`POST /api/observability/spans/aggregate`) when measures should be computed per span rather than per trace. Trace aggregation rolls up each trace; span aggregation measures completed spans, including nested agent runs and tool calls. It selects the same spans as `span query` for the same `timeRange` and `where`. Its request structure follows trace aggregation, but predicate and dimension fields follow the [span aggregation contract](https://mastra.ai/reference/observability/tracing/advanced-queries#aggregate-spans).

```bash
npx mastra api span aggregate --help
npx mastra api span aggregate --schema
npx mastra api span aggregate \
  '{"timeRange":{"from":"2026-08-01T00:00:00.000Z","to":"2026-08-08T00:00:00.000Z"},"where":{"op":"eq","left":{"path":"spanType"},"right":{"literal":"tool_call"}},"groupBy":["entityName"],"measures":["count","errorRate","duration.p95"],"orderBy":{"field":"errorRate","direction":"desc"},"limit":10}'
```

Check `capabilities.spanAggregate` first; treat a missing or false value as unavailable. Unsupported stores return `501 SPAN_AGGREGATE_UNSUPPORTED`; a server without the route returns `404`. Like trace aggregation, results are not paginated: check `truncated` and narrow the selection when needed.

- Tokens and cost belong to the span that recorded them and are not rolled up to ancestors. Use trace aggregation for totals per trace; for span aggregation, select the spans recording usage before grouping by agent identity.
- Grouping or counting distinct values by `model` or `provider` requires `spanAggregateModelDimensions`. These dimensions read dedicated columns, not older attributes; older spans can group under `null`. Check the capability instead of assuming support from the CLI version.

## Choosing the command

- `trace list`: browse recent traces with simple list filters.
- `trace query`: select completed traces using complex, explicit predicates.
- `trace aggregate`: count completed traces and compute grouped measures over the same selection.
- `span query`: list completed spans, including nested ones, with span-field predicates.
- `span aggregate`: count spans and compute grouped measures by span fields.
- `trace get <traceId>`: inspect one selected trace.
- `trace span <traceId> <spanId>`: fetch one span in full.

These query and aggregate APIs return completed traces or spans only. The configured observability store must support the query API. If the server rejects a query that follows the current structural schema and canonical documentation as unsupported, report that limitation rather than falling back to an inaccurate client-side approximation.
