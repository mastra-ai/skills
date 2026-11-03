# v1 Migration Reference

API mapping from Mastra v0.x to v1.x. Verified against `@mastra/core@1.81.0`, `@mastra/memory@1.40.0`, `@mastra/observability@1.23.0`, `@mastra/libsql@1.28.0`, and `@mastra/pg@1.34.0` with `tsc --noEmit`.

For the upgrade procedure - official migration docs, codemods, checklists - see [`migration-guide.md`](migration-guide.md). This file is the API mapping.

## Import structure

The root entrypoint `@mastra/core` exports only `Mastra` and types (`Config`, `WorkersConfig`, `WorkersConfigSection`). Everything else moved to a subpath import.

```typescript
// v0.x
import { Agent, Workflow, createTool, Mastra } from '@mastra/core';

// v1.x
import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
```

`import { Agent, Workflow, createTool } from '@mastra/core'` fails to compile in v1 with `Module '"@mastra/core"' has no exported member 'Agent'`.

| Import                       | Exports                                       |
| ---------------------------- | --------------------------------------------- |
| `@mastra/core`               | `Mastra`, `type Config`                       |
| `@mastra/core/agent`         | `Agent`                                       |
| `@mastra/core/tools`         | `createTool`                                  |
| `@mastra/core/workflows`     | `createWorkflow`, `createStep`                |
| `@mastra/core/memory`        | `MastraMemory` (abstract base)                |
| `@mastra/core/request-context` | `RequestContext`                            |
| `@mastra/core/logger`        | `ConsoleLogger`                               |

The concrete `Memory` class ships in `@mastra/memory`, not `@mastra/core/memory`:

```typescript
import { Memory } from '@mastra/memory';
```

`@mastra/core/memory` exports the abstract `MastraMemory` base class. Importing `Memory` from it fails with `Module '"@mastra/core/memory"' has no exported member 'Memory'`.

## Renames

| v0.x                        | v1.x                                     |
| --------------------------- | ---------------------------------------- |
| `new Workflow('id', {...})` | `createWorkflow({ id, description, inputSchema, outputSchema })` |
| `new Step({...})`           | `createStep({ id, inputSchema, outputSchema, execute })` |
| `RuntimeContext`            | `RequestContext`                         |
| `mastra.getAgents()`        | `mastra.listAgents()`                    |
| `mastra.getWorkflows()`     | `mastra.listWorkflows()`                 |
| `mastra.getTools()`         | `mastra.listTools()`                     |
| `agent.getTools()`          | `agent.listTools()`                      |
| config key `telemetry:`     | config key `observability:`              |

The v0 accessors are gone. `mastra.getAgents()` fails with `Property 'getAgents' does not exist on type 'Mastra<...>'. Did you mean 'getAgent'?`, and `agent.getTools()` fails with `Property 'getTools' does not exist on type 'Agent<...>'`.

`RuntimeContext` is gone from `@mastra/core/request-context`: `Module '"@mastra/core/request-context"' has no exported member 'RuntimeContext'`.

`telemetry:` is not a `Config` key in v1: `Object literal may only specify known properties, and 'telemetry' does not exist in type 'Config<...>'`. Use `observability` with the `Observability` class from `@mastra/observability`:

```typescript
import { Mastra } from '@mastra/core';
import { Observability } from '@mastra/observability';

export const mastra = new Mastra({
  observability: new Observability({
    configs: {
      myInstance: { serviceName: 'my-service' },
    },
  }),
});
```

## Workflow construction

v0 built workflows from constructors and chained the result. v1 uses factory functions, and the chain is committed before it is used:

```typescript
// v0.x
const workflow = new Workflow('my-workflow', { inputSchema, outputSchema })
  .then(step)
  .commit();

// v1.x
const workflow = createWorkflow({
  id: 'my-workflow',
  description: 'What the workflow does',
  inputSchema,
  outputSchema,
})
  .then(step)
  .commit();
```

The v1 chain methods are `.then()`, `.parallel()`, `.branch()`, `.foreach()`, `.map()`, `.dountil()`, `.dowhile()`, and `.commit()`.

## Tool execute signature

v0 passed a single context object to `execute`:

```typescript
// v0.x
createTool({
  id: 'get-order',
  execute: async ({ context }) => {
    return getOrder(context.orderId);
  },
});
```

v1 passes the parsed input as the first argument and the runtime context as the second:

```typescript
// v1.x
createTool({
  id: 'get-order',
  execute: async (inputData, context) => {
    return getOrder(inputData.orderId);
  },
});
```

The first argument is the parsed input, typed from `inputSchema`. The second is the runtime context, carrying `agent`, `workflow`, `requestContext`, and `observe`.

The v0 destructuring form does not compile against a v1 input schema:

```
Property 'context' does not exist on type '{ location: string; }'.
```

Where the old code still compiles - the input schema carries its own `context` field, or the schema is loose - the destructured `context` is that field's value, not the runtime context. `context.data` is `undefined` at runtime, so the tool silently returns nothing. Read the value from `inputData`.

## Required `id`

These constructors and factories fail to compile without a unique `id` string:

| Constructor                     | Package                 |
| ------------------------------- | ----------------------- |
| `new Agent({...})`              | `@mastra/core/agent`    |
| `createTool({...})`             | `@mastra/core/tools`    |
| `createStep({...})`             | `@mastra/core/workflows` |
| `createWorkflow({...})`         | `@mastra/core/workflows` |
| `new LibSQLStore({...})`        | `@mastra/libsql`        |
| `new PgVector({...})`           | `@mastra/pg`            |

The error names the missing property:

```
Property 'id' is missing in type '{ name: string; instructions: string; ... }'
  but required in type 'Omit<AgentConfigBase<...>, "editor" | "instructions" | "tools">'.
```

`new Memory({...})` does not require one. `new Memory({ options: {...} })` is valid.

`pg` ships no types of its own. With `@types/pg` installed, the `PgVector` check reports `Property 'id' is missing in type '{ connectionString: string; }' but required in type 'PostgresBaseConfig'`. Without `@types/pg` the `pg` types resolve to `any` and the missing `id` is not reported.

## Version pinning

`@mastra/*` packages do not share a version number. As of `@mastra/core@1.81.0`:

| Package                   | Version   |
| ------------------------- | --------- |
| `@mastra/core`            | `1.81.0`  |
| `@mastra/libsql`          | `1.28.0`  |
| `@mastra/observability`   | `1.23.0`  |
| `@mastra/memory`          | `1.40.0`  |

Pinning every `@mastra/*` package to the core version fails to resolve. `npm view @mastra/libsql@1.81.0 version` returns `404 Not Found`, and the same holds for `@mastra/observability` and `@mastra/memory`. Install each package at its own latest:

```bash
npm install @mastra/core@latest @mastra/memory@latest @mastra/observability@latest @mastra/libsql@latest
```

## Observability sampling

`sampling.type` is a nominal string enum. A plain string does not compile:

```typescript
// v1.x - does not compile
import { Observability } from '@mastra/observability';

new Observability({
  configs: {
    myInstance: {
      serviceName: 'my-service',
      sampling: { type: 'always' },
    },
  },
});
```

```
Type '"always"' is not assignable to type 'SamplingStrategyType'.
```

Use the enum instead:

```typescript
import { Observability, SamplingStrategyType } from '@mastra/observability';

new Observability({
  configs: {
    myInstance: {
      serviceName: 'my-service',
      sampling: { type: SamplingStrategyType.ALWAYS },
    },
  },
});
```

`SamplingStrategyType` is exported from `@mastra/observability` and has four members: `ALWAYS`, `NEVER`, `RATIO`, `CUSTOM`.

## Workflow bail

`bail(result)` is typed `bail(result: TStepOutput)`. The payload must match the step's `outputSchema`:

```typescript
const step = createStep({
  id: 'check-order',
  inputSchema: z.object({ orderId: z.string() }),
  outputSchema: z.object({ reason: z.string() }),
  execute: async ({ inputData, bail }) => {
    if (inputData.orderId === '0') {
      return bail({ reason: 'invalid order' });
    }
    return { reason: 'ok' };
  },
});
```

## `result.status`

`result.status` is a string. The status values Mastra defines for a workflow run are:

```
'running' | 'success' | 'failed' | 'tripwire' | 'suspended' | 'waiting' | 'pending' | 'canceled' | 'bailed' | 'paused' | 'skipped'
```

The values a run result reports are `success`, `failed`, `suspended`, `tripwire`, `paused`, `canceled`, `skipped`, `running`, and `waiting`. Branch on `result.status` before reading `result.result` or `result.error`.

On the server, `run.start()` resolves to `WorkflowResult`, whose `status` is narrowed to `'success' | 'failed' | 'tripwire' | 'suspended' | 'paused'`. The streaming result adds `'running' | 'waiting' | 'pending' | 'canceled'`.

## Client SDK

`@mastra/client-js` also changed in v1. See [`client-js.md`](client-js.md) for the current client surface.
