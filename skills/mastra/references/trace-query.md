# Advanced Trace Query Reference

Use `mastra api trace query` when a normal trace list cannot express the required filters: recursive boolean predicates, related span, score, or feedback conditions, metadata filters, ordering, or opaque cursor pagination.

For broad questions about recurring agent behavior or health, start with [`trace-intelligence.md`](trace-intelligence.md). Use advanced trace queries when the user needs exact traces matching explicit conditions, then inspect the returned traces for evidence.

## Command contract

The command sends `POST /api/observability/traces/query`. It uses the same target and credentials as other observability commands and targets `https://observability.mastra.ai` by default.

The inline JSON input is required. Before recommending the command, confirm that the installed CLI exposes it:

```bash
npx mastra api trace query --help
```

After confirming availability, inspect the target server's current contract:

```bash
npx mastra api trace query --schema
```

Use `--schema` to confirm that the target supports the route and to inspect the current request and response shape and structural constraints. Predicate paths are generic strings in the schema, so it does not provide the context-specific field/operator matrix. If you need more information, read the [reference docs online](https://mastra.ai/reference/observability/tracing/trace-query). Do not infer unsupported predicates from storage columns or older documentation. The server remains the ultimate validation authority.

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

## Predicate semantics

- Compose predicates with `and`, `or`, and `not`.
- Use `some` when one related record must satisfy the complete nested predicate.
- Use `none` when no related record may satisfy the complete nested predicate. Traces with no related records also match `none`.
- Related span, score, and feedback clauses correlate records by trace. Conditions in separate related clauses do not imply that they refer to one shared related record.
- String comparisons are exact and case-sensitive unless the canonical documentation states otherwise.
- The root `timeRange` filters the selected root span's start time; it does not independently constrain related-record timestamps.
- Query results are lightweight and do not embed matching spans, scores, or feedback. Fetch trace or span details after selecting candidates.

## Choosing the trace command

- `trace list`: browse recent traces with simple list filters.
- `trace query`: select completed traces using complex, explicit predicates.
- `trace get <traceId>`: inspect one selected trace.
- `trace span <traceId> <spanId>`: fetch one span in full.
- Trace Intelligence: discover aggregate recurring themes before drilling into individual traces.

Advanced queries only return completed traces. The configured observability store must support the query API. If the server rejects a query that follows the current structural schema and canonical documentation as unsupported, report that limitation rather than falling back to an inaccurate client-side approximation.
