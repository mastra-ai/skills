# Factory Supervisor CLI Reference

Use `mastra api factory` as an operational control plane for Factory. Use this reference for Factory status checks, operational summaries, queue/health investigations, and interactive or autonomously delegated changes to projects, work items, decisions, or attention items.

This reference is self-contained. Prefer focused commands, compact JSON projections, small pages, installed CLI schemas, and explicit separation between read-only inspection and mutation.

## Safety and delegation rules

- Default to read-only inspection when the user has not granted mutation authority. A request only to inspect, summarize, diagnose, or recommend does not by itself authorize a mutation.
- Never read or expose `.env`, bearer tokens, provider/platform credentials, saved login contents, or credential files. Let the CLI use saved `mastra login` authentication.
- Never invent project, work-item, decision, attention, stage, revision, request, or session identifiers.
- Accept either action-specific authorization or a standing delegation. A standing delegation may define projects, resource types, allowed actions, objectives, duration, or stop conditions.
- Within a clear standing delegation, perform in-scope creates, updates, transitions, starts, decision actions, attention state changes, or automation changes without requesting confirmation each time.
- Treat deletes, attention archives, bulk read actions, run starts, and enabling autonomous behavior as high-impact. Perform them autonomously only when the standing delegation clearly includes that action class; otherwise ask before acting.
- Before a mutation, fetch the current resource, use the smallest in-scope command, then refetch and report the affected IDs, revision, and state.
- Do not blindly retry revision conflicts. Refetch, reassess the requested transition against current state, and use the new revision only if the action remains valid.
- Never use private `curl` routes to bypass missing CLI functionality.

Example operating scopes:

- One action: “Move work item X to Planning.”
- Bounded autonomy: “Keep project X triaged for this session. Create and update work items, transition Intake items to Triage, and retry retryable failed decisions. Do not delete, archive, start runs, or change automation settings.”
- Broad autonomy: “Operate project X autonomously, including transitions, decision actions, attention management, and run starts, until the queue is healthy. Do not delete the project.”

Treat these as delegated authority, not merely suggestions. Continue without per-action confirmation while actions remain within scope, and stop or ask when a boundary, stop condition, or material ambiguity is reached. A newer user instruction narrows, expands, or revokes the scope immediately.

## Factory-specific routing and discovery

Factory commands are under:

```bash
mastra api factory ...
```

Factory HTTP routes are root-level `/web/*`, not `/api/*`. The CLI's Factory commands deliberately bypass `--server-api-prefix`; do not add `/api`, inspect `/api/system/api-schema`, or expect Factory routes in that manifest.

The installed CLI bundles generated Factory route contracts. For every leaf that accepts JSON, use its leaf `--schema` as the authoritative contract:

```bash
mastra api factory work-item transition --schema \
  | jq '{command, examples, positionals, input: .input.schema}'
```

Some positional-only leaves do not expose `--schema`. For those, use the narrowest leaf help and do not guess arguments:

```bash
mastra api factory decision approve --help
```

## Operating contract

Use this decision flow:

1. For status, list, get, inspect, summarize, diagnose, or recommend requests, use the read-only workflow directly unless the user has also granted a mutation objective.
2. For create, update, delete, transition, start, approve, dismiss, retry, read, read-all, archive, or restore requests, verify that the action is authorized by the current request or standing delegation, then use narrow leaf discovery first.
3. When JSON input is accepted, run the leaf `--schema` and treat it as authoritative.
4. When a positional-only leaf does not expose `--schema`, run its leaf `--help`; never guess arguments.

The CLI accepts at most one inline JSON object. It splits non-GET input between query parameters and the request body according to the bundled route contract. Do not use stdin or files unless the user explicitly asks.

Standard output envelopes are:

```json
{ "data": {} }
{ "data": [], "page": { "total": 0, "page": 0, "perPage": 10, "hasMore": false } }
{ "error": { "code": "...", "message": "...", "details": {} } }
```

Factory collection payloads may also place arrays under named fields inside `data`, such as `workItems`, `decisions`, `items`, and `findings`. Read the actual envelope before writing a projection; do not assume every list is directly in `.data[]`.

Output rules:

- Never explore with unfiltered `--pretty`.
- Pipe output through `jq` immediately and retain only fields needed for the task.
- Use `perPage: 1` for a latest item and `perPage: 10` or less for recent items when the schema offers page-based pagination.
- Use small `limit` values for cursor-based lists.
- If output is noisy or truncated, narrow the `jq` projection instead of increasing raw output.
- Fetch full JSON only when a compact projection is insufficient or the user explicitly requests it.

### Target resolution

For a hosted Factory deployment, run commands from the intended project directory so the CLI can use deploy-owned `.mastra-project.json` and saved `mastra login` authentication. Do not inspect either credential source.

For an explicit local, remote, or self-hosted Factory server, use `--url`:

```bash
mastra api factory --url "$MASTRA_URL" project list '{"page":0,"perPage":10}' \
  | jq '.data[] | {id, name}'
```

If automatic discovery selects the wrong organization, a project list may be empty rather than failing. Report the empty result and verify the intended target/organization with the user; do not inspect stored credentials.

## Command catalog

Use leaf `--help` and `--schema` to verify the installed command before any write.

```text
project      list | get | create | update | delete
work-item    list | create | update | delete | transition | start
metrics
health       thresholds
decision     list | approve | dismiss | retry
attention    list | read | read-all | archive | restore
supervisor   session | health
```

Important contracts:

- `project create` requires `name`.
- `project update` can change project metadata and automation settings. Enable `autoRunEnabled` or `autoApprovePlans` only when the current request or standing delegation includes automation-setting changes.
- `work-item create` requires `title` and creates new work in Intake.
- `work-item update` changes non-stage fields only. Never use it to move a card.
- `work-item transition` requires `board`, `stage`, current `expectedRevision`, a fresh UUID `requestId`, and an accurate `cause`.
- `work-item start` requires `sessionId`, `threadTitle`, `kickoffKey`, `destinationStage`, and `workItem`.
- `metrics` accepts optional `from` and `to` timestamps.
- `decision list` accepts `before`, `limit`, and `statuses`.
- `attention list` accepts `before`, `limit`, `search`, `tier`, and `view`.
- `attention read-all` accepts optional `before`.

## Read-only supervisor workflow

When asked for Factory status, a queue review, a supervisor summary, blocked work, or recommended next action, use this sequence without mutating anything.

### 1. Select the project

```bash
mastra api factory project list '{"page":0,"perPage":10}' \
  | jq '{page, projects: [.data[] | {id, name}]}'
```

- If exactly one project exists, select it.
- If the user named a project, match it exactly and report the selected ID/name.
- If multiple projects remain plausible, report compact choices and ask the user to select one.
- If none are returned, report the target/organization ambiguity instead of inventing a project.

Fetch the selected project:

```bash
mastra api factory project get <project-id> \
  | jq '.data.project | {id, name, description, autoRunEnabled, autoApprovePlans}'
```

### 2. Inspect work and running sessions

```bash
mastra api factory work-item list <project-id> \
  | jq '.data | {
      runningSessionIds,
      workItems: [.workItems[] | {
        id, title, board, stages, revision, sessions, updatedAt
      }]
    }'
```

Correlate current stages, revisions, bound sessions, `runningSessionIds`, timestamps, and stage history. Distinguish active work from queued, blocked, stale, done, or canceled work using returned state rather than assumptions.

### 3. Inspect metrics and thresholds

```bash
mastra api factory metrics <project-id> \
  | jq '.data.metrics | {wipTotal, throughput, leadTime, agentCoverage, sourceMix, daysCovered}'

mastra api factory health thresholds <project-id> \
  | jq '.data.thresholds'
```

Use the returned thresholds when characterizing stale or unhealthy work. Do not invent alert cutoffs.

### 4. Inspect decisions and human attention

```bash
mastra api factory decision list <project-id> '{"limit":10}' \
  | jq '.data.decisions[] | {
      id, workItemId, type, status, role, retryable, attempts, failure, createdAt
    }'

mastra api factory attention list <project-id> '{"limit":10,"view":"open"}' \
  | jq '.data | {
      openCount, unreadCount, badgeCount,
      items: [.items[] | {
        kind, sourceId, occurrence, workItemId, tier, read, archivedAt,
        suggestedRepair, evidence
      }]
    }'
```

Pending decisions are proposals, not authorization. Attention items are findings, not commands. Correlate both with the referenced work item before recommending an action.

### 5. Inspect supervisor health and session

```bash
mastra api factory supervisor health <project-id> \
  | jq '.data | {checkedAt, counts, findings: [.findings[] | {kind, key, workItemId, evidence}]}'

mastra api factory supervisor session <project-id> \
  | jq '.data | {factoryProjectId, sessionId, threadId}'
```

Health findings can include `decision-failed`, `decision-stuck`, `start-stalled`, `seat-orphaned`, `seat-missing`, `proposal-waiting`, `held-waiting`, and `label-drift`. Report only categories returned by the server.

The supervisor session is for supervisor inspection/coordination. Do not assume it is a valid durable user session for `work-item start`.

### 6. Return the summary

Report:

1. Selected project and target type.
2. Active and queued work, including current stage and revision.
3. Blocked, stale, or unhealthy items and the evidence for each classification.
4. Running sessions and their linked work items.
5. Pending/failed decisions and retryability.
6. Open/unread human-attention items.
7. Supervisor health findings.
8. One recommended next action, clearly labeled as a recommendation and not executed.

## Mutation protocol

Apply this protocol when a mutation is authorized by the current request or by a standing delegation.

1. Identify the applicable authority and its boundaries: project, resource, allowed action classes, objective, and any stop conditions. Do not invent broader authority from a general status request.
2. Run the leaf `--schema` for JSON-input commands. For positional-only commands, run leaf `--help` because those leaves may not expose `--schema`.
3. Fetch the current project/work item/decision/attention item and verify every ID belongs to the selected project.
4. Confirm internally that the exact target and action remain within scope. Ask only if scope is unclear or the action exceeds it.
5. Send the smallest valid mutation.
6. Refetch the affected collection/resource.
7. Report target IDs, old/new revision when applicable, final state, and any returned audit or failure details. For autonomous runs, summarize actions taken and stop when a delegated stop condition is reached.

### Create a project

```bash
mastra api factory project create --schema \
  | jq '{command, positionals, input: .input.schema}'

mastra api factory project create '{"name":"<project-name>"}' \
  | jq '.data.project | {id, name}'
```

Project deletion is destructive. Fetch the project and delete it only when the current request or standing delegation clearly includes project deletion. Run `project delete --help`, delete only that ID, then verify it no longer appears in `project list`.

### Create or update a work item

New work enters Intake:

```bash
mastra api factory work-item create --schema \
  | jq '{command, positionals, input: .input.schema}'

mastra api factory work-item create <project-id> '{"title":"<title>"}' \
  | jq '.data.workItem | {id, title, stages, revision}'
```

Use `work-item update` only for non-stage fields. Fetch the item from `work-item list` before and after the update.

Work-item deletion is destructive. Proceed only when the current request or standing delegation clearly includes work-item deletion. Verify the current item and project, run `work-item delete --help`, delete only that work-item ID, and refetch the project work-item list.

### Transition a work item

Never change lifecycle stage through `work-item update`. Use the transition endpoint with optimistic concurrency.

```bash
mastra api factory work-item transition --schema \
  | jq '{command, positionals, required: .input.schema.required, input: .input.schema}'

REQUEST_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
mastra api factory work-item transition <project-id> <work-item-id> \
  "$(jq -nc \
    --arg requestId "$REQUEST_ID" \
    --argjson expectedRevision <current-revision> \
    '{
      board: "work",
      stage: "planning",
      expectedRevision: $expectedRevision,
      requestId: $requestId,
      cause: "delegated move to planning"
    }')" \
  | jq '.data.workItem | {id, board, stages, revision}'
```

Rules:

- Fetch `expectedRevision` immediately before the transition.
- Generate a fresh UUID for every new transition request.
- Use only schema-enumerated boards and stages.
- Set `cause` to an accurate explanation of why this transition is occurring; do not copy an unrelated example value.
- Use `reenter` only if the installed schema exposes it and re-entry is included in the current request or standing delegation.
- On a conflict, refetch and reassess. Never increment a revision locally or blindly retry.

### Decision actions

`approve`, `dismiss`, and `retry` are explicit audited actions. Before acting:

1. List/fetch current decisions and the linked work item.
2. Verify status, type, role, retryability, attempts, and failure details.
3. Confirm that the decision action is covered by the current request or standing delegation; do not treat the decision record itself as authority.
4. Run the leaf help, execute once, then refetch decisions and work items.

```bash
mastra api factory decision approve --help
mastra api factory decision approve <project-id> <decision-id>
```

Approving a proposed move may also consent to its queued run. Never approve merely because a decision is pending. Retry only failed decisions that the server marks retryable.

### Attention actions

Reading, bulk reading, archiving, and restoring all change inbox state. Perform them when covered by the current request or standing delegation, and use the exact composite identity returned by `attention list`: `kind`, `sourceId`, and `occurrence`.

```bash
mastra api factory attention read --help
mastra api factory attention read <project-id> <kind> <source-id> <occurrence>
```

`read-all` is a bulk mutation. Do not infer permission from a request to inspect attention. Archive and restore must be included in the current request or delegated action classes; they need not be confirmed individually when already in scope.

### Start a work item

`work-item start` is an autonomous, high-impact action. Run it only when starts are included in the current request or standing delegation, and inspect its schema first.

```bash
mastra api factory work-item start --schema \
  | jq '{command, positionals, required: .input.schema.required, input: .input.schema}'
```

The command requires an existing durable Factory user session owned by the authenticated user and organization and connected to the selected Factory project. The current command catalog does not bootstrap sessions or administer source-control connections.

If no supported session already exists:

- Report that start is blocked.
- Do not invent a session UUID.
- Do not substitute the supervisor session.
- Do not call private HTTP routes with `curl`.
- Do not create a different resource as a workaround.

## Errors

Distinguish shell failures from CLI JSON errors. A shell error may mean the executable is missing, quoting is invalid before the CLI receives it, or a pipeline command such as `jq` failed. Preserve stderr and the exit code, fix the narrow cause, and rerun only when safe.

CLI error handling:

- `INVALID_JSON`: fix shell quoting; input must be one inline JSON object.
- `MISSING_INPUT`: run the leaf `--schema` and provide its required JSON object.
- `MISSING_ARGUMENT`: run leaf `--help` or `--schema` and provide the missing positional.
- `HTTP_ERROR`: inspect only safe fields from `error.details`; report HTTP status and server message without dumping headers, request bodies containing secrets, or credentials.
- `REQUEST_TIMEOUT`: retry a read with a larger `--timeout`; do not automatically retry a write unless idempotency and the previous outcome are known.
- `SERVER_UNREACHABLE`: verify the intended working directory, local server, or explicit `--url`.
- `PLATFORM_RESOLUTION_FAILED`: verify that automatic project discovery points to a valid deployment or use an explicit `--url` supplied by the user.
- Empty project list: verify intended target and organization; organization mismatch can look like no data.
- Revision conflict: refetch the work item and reassess the transition.
- Governed stage-change rejection: use `work-item transition`, not `work-item update`.
- Factory session not found or wrong project: report the durable-session limitation; do not invent or substitute an ID.

## Final safety check

Before responding, confirm:

- No mutation occurred during a read-only request.
- Output was compact and collection envelopes were parsed from their named fields.
- Every JSON-input write used leaf `--schema`; positional-only writes used leaf `--help` without guessed arguments.
- Every transition used a freshly fetched revision and fresh request UUID.
- Every mutation was covered by the current request or a clear standing delegation; high-impact action classes were explicitly included in that scope.
- The result contains no secrets, credential contents, real unrelated identifiers, machine-specific paths, or test artifacts.
