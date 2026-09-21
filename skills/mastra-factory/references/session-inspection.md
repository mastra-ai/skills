# Inspect work, sessions, and memory

Read [connection.md](connection.md) first. These recipes assume `FACTORY_URL` is the user's verified target and `PROJECT_ID` came from that target's Factory project list. Preserve the target and any deployment-specific auth/prefix options on every call. Never substitute a platform deployment ID for `PROJECT_ID`.

## Find work related to the user

For platform authentication, use `mastra auth whoami` to identify the current user ID without reading credentials. For other auth providers, establish the actual Factory user identity with the user; don't assume a platform user ID applies. Set `USER_ID` to that verified identity.

```bash
mastra api --url "$FACTORY_URL" factory work-item list "$PROJECT_ID" \
  | jq --arg user "$USER_ID" '.data | {
      runningSessionIds, parkedSessionIds,
      workItems: [.workItems[] | select(
        .createdBy == $user or any(.sessions[]?; .startedBy == $user)
      ) | {id, title, board, stages, revision, sessions, updatedAt}]
    }'
```

This finds creator/starter relationships, not every assignment, mention, or contribution. Say what was matched. Confirm the actual envelope and pagination before claiming complete coverage; use leaf schema to discover server-side filters rather than guessing them.

A stage such as `execute` or `review` is not proof a model is running. Correlate `runningSessionIds`, session bindings, current decisions, recent messages, timestamps, and health findings. A stale running-session entry is not proof of recent progress. `board: null` can represent a Slack/chat item rather than a card on the work board; report it separately and don't automatically restart it as pipeline work.

## Follow a work item into its thread

1. Select the item and inspect its returned `sessions` entries. Roles can share a thread: deduplicate thread IDs.
2. Use the returned `threadId`, not a work-item ID or an invented session/thread convention. Set `THREAD_ID` to that value.
3. Discover the installed runtime commands. Factory does not currently have a `read-session` leaf; use `thread` and `memory` at the same target.

```bash
mastra api --url "$FACTORY_URL" thread --help
mastra api --url "$FACTORY_URL" thread list --schema
mastra api --url "$FACTORY_URL" thread get "$THREAD_ID" \
  | jq '.data | {id, resourceId, title, createdAt, updatedAt}'
mastra api --url "$FACTORY_URL" thread messages --schema \
  | jq '{positionals, input: .input.schema}'
mastra api --url "$FACTORY_URL" thread messages "$THREAD_ID" '{"page":0,"perPage":10}' \
  | jq '{page, messages: [.data[] | {id, role, createdAt, parts: .content.parts}]}'
```

Use `thread list` with schema-supported filters when no thread binding is available; don't enumerate unrelated users' memory. Runtime `--schema` discovery can require a reachable, authenticated target even though Factory contracts are bundled. Follow `.page.hasMore`, incrementing `page` from zero; select ordering supported by the schema if looking for the newest messages. Limit displayed text/parts and stop once the question is answered. Report the pages/time range inspected and any gaps.

### Open a session in the Factory UI

The hosted Factory UI serves a session at `/factories/<factory-project-id>/workspaces/<sessionId>/threads/<threadId>` on the same origin as `$FACTORY_URL`. Build the URL from the item's returned `sessions` values and hand it to the user's browser (`open` on macOS, `xdg-open` on Linux):

```bash
mastra api --url "$FACTORY_URL" factory work-item list "$PROJECT_ID" \
  | jq -r --arg id "$WORK_ITEM_ID" --arg base "$FACTORY_URL" --arg project "$PROJECT_ID" '
      (.data.workItems // .data)[] | select(.id == $id)
      | .sessions | to_entries[]
      | "\($base)/factories/\($project)/workspaces/\(.value.sessionId)/threads/\(.value.threadId)"' \
  | sort -u
# then: open "<url>"   (macOS)  /  xdg-open "<url>"  (Linux)
```

Unauthenticated fetches of that URL return 401; the user's browser login is what renders it. Do not scrape the page in place of the API.

Read `content.parts` for text, tool calls/results, signals, and OM events. A transcript can contain tool calls without stored results. Separate user intent, attempted actions, observed results, agent claims, and independently verified outcomes. “Tests passed” in assistant text is weaker evidence than a test result. “Implemented” does not prove committed, pushed, or merged: report those states as unknown without repository/PR evidence.

## Observational memory (OM)

Discover commands before assuming support:

```bash
mastra api --url "$FACTORY_URL" memory --help
mastra api --url "$FACTORY_URL" memory status --schema \
  | jq '{positionals, input: .input.schema}'
mastra api --url "$FACTORY_URL" agent list \
  | jq '.data[] | {id, name}'
```

Set `AGENT_ID` to the session's actual memory-owning agent, confirmed from deployment/session metadata (ask if ambiguous). Do not assume a universal agent ID. Set `RESOURCE_ID` from the thread's returned `resourceId`; resource, thread, session, and project IDs are not generally interchangeable.

```bash
mastra api --url "$FACTORY_URL" memory status \
  "$(jq -nc --arg agent "$AGENT_ID" --arg resource "$RESOURCE_ID" --arg thread "$THREAD_ID" \
    '{agentId:$agent,resourceId:$resource,threadId:$thread}')" \
  | jq '.data.observationalMemory'
```

Status can expose `enabled`, `hasRecord`, `lastObservedAt`, `observationTokenCount`, and observing/reflecting flags. It is not the observation text. A missing status block is not proof of an empty memory: verify the agent and resource first. A record with zero observation tokens is not evidence that observation succeeded.

In the verified CLI surface (Mastra 1.30.0), `memory` exposes `search`, `current`, and `status`, not a dedicated OM-content command. The server's authenticated `GET /memory/observational-memory` returns `{record, history}` (under the runtime API prefix), but route metadata alone does not make it a CLI command. Do not extract saved tokens or invent a passthrough command to call it. If authoritative current OM is needed, use a supported authenticated UI/client or report the CLI limitation. Do not call the buffer-status POST as a substitute for a read.

Historical observation text can also be present in stored message parts. This is a version-dependent diagnostic fallback, not a reconstruction of the authoritative current record:

```bash
mastra api --url "$FACTORY_URL" thread messages "$THREAD_ID" '{"page":0,"perPage":10}' \
  | jq '{page, events: [.data[] | .content.parts[]? |
      select(.type | startswith("data-om-")) |
      {type, data: (.data | {cycleId, observations, error, tokensAttempted})}]}'
```

- `data-om-activation`, `data-om-buffering-end`, or observation-end events may carry `data.observations`.
- Buffered observations are not necessarily activated. Events can overlap or repeat; don't sum them as the current token count or concatenate them into a claimed current memory.
- Failure markers can expose provider/auth errors and failed cycles. Correlate by `cycleId` so one failure reported twice isn't counted as two attempts.
- Start-only events do not prove a hard kill; persistence may be partial. Likewise an OM error near a stopped run is evidence, not proof of causation.
- `remembered`/pinned-knowledge signals are distinct from the full OM record. Missing markers don't prove that OM never ran.

## Interpret supervisor findings before suggesting repairs

A **seat** is an active run binding assigning an agent role to a work item, not a paid-user license. Stage-to-role mapping depends on the board and deployment; use returned evidence rather than deriving the role from a stage label.

| Finding | Meaning / next inspection |
| --- | --- |
| `seat-missing` | Working-stage item has no active binding and no in-flight decision. Check whether work is already complete, intentionally parked, or awaiting a real restart. It is not itself proof of a crash and need not have an age threshold. |
| `seat-orphaned` | Active binding references a missing or terminal item. Inspect binding/item state before revocation. |
| `start-stalled` | A pending start failed or exceeded the supervisor's stall threshold. Inspect its failure and session before restarting. |
| `decision-stuck` | Pending/retry decision has waited too long, or a lease has expired. Inspect status, attempts, and errors before retry. |
| `held-waiting` | Work is waiting for human acceptance. Check acceptance and triage state rather than launching an agent. |
| `label-drift` | External labels disagree with acceptance state. Inspect synchronization state. |

Report only findings actually returned by the deployment. Proposals awaiting approval are not the same as a failed dispatch. The `health thresholds` command describes queue-age buckets; it is not the configuration of supervisor decision/start/lease timeouts. Use supervisor evidence for those findings, not a queue-aging cutoff.

A suggested repair is not authorization. Apply the supervisor reference's mutation protocol and durable-session requirements; a completed task may need reconciliation rather than rerunning expensive work. Never use the supervisor session as a replacement work session.

## Pagination and compatibility failures

- Attention collections may cap requested `limit` (a cap of 50 was observed). Follow returned `hasMore` and `nextCursor` using `before`, preserving the opaque cursor exactly. Never manufacture or decode/rebuild a cursor.
- Some deployed versions rejected schema-advertised attention `kind` filters with HTTP 400 `invalid_attention_kind`. If encountered, omit that filter, use supported `search`/`view` filters, and filter returned items locally. Don't generalize one deployment's failure to every version.
- If pagination yields an empty page with contradictory continuation state, repeats a cursor, or returns malformed JSON, stop and report partial coverage. Preserve the error for diagnosis; don't silently drop broken pages or claim no matching work exists.
- Narrow projections before raising page sizes. Don't pipe raw JSON through `head` and then try to parse the truncated result.
