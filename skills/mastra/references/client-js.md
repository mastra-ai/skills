# Client SDK Reference

`@mastra/client-js` calls a running Mastra server from a separate frontend or service. Use it when the agent and workflow code lives in the Mastra app and the caller does not.

Verified against `@mastra/client-js@1.58.0` with `tsc --noEmit`.

## Install

```bash
npm install @mastra/client-js
```

## Create the client

```typescript
import { MastraClient } from '@mastra/client-js';

export const mastraClient = new MastraClient({
  baseUrl: process.env.MASTRA_API_URL || 'http://localhost:4111',
  headers: { Authorization: `Bearer ${userToken}` },
});
```

| Option         | Type                     | Purpose                                  |
| -------------- | ------------------------ | ---------------------------------------- |
| `baseUrl`      | `string`                 | Base URL of the Mastra server            |
| `headers`      | `Record<string, string>` | Headers sent with every request          |
| `retries`      | `number`                 | Retry attempts for failed requests       |
| `backoffMs`    | `number`                 | Initial backoff between retries          |
| `maxBackoffMs` | `number`                 | Maximum backoff between retries          |

## Get agents and workflows

Look up resources by the id they are registered with on the server:

```typescript
const agent = mastraClient.getAgent('supportAgent');
const workflow = mastraClient.getWorkflow('refundWorkflow');
```

`getAgent()` and `getWorkflow()` return handles, not network calls. The request happens when a method on the handle runs.

## Stream from an agent

`agent.stream(...)` takes a string prompt or an array of `{ role, content }` messages:

```typescript
const stream = await agent.stream('I need a refund for order #992 for $150');

stream.processDataStream({
  onChunk: (chunk) => {
    console.log(chunk);
  },
});
```

The callback is `onChunk`. `onTextPart` is not a property of the options object and fails to compile with `Object literal may only specify known properties, and 'onTextPart' does not exist in type '{ onChunk: (chunk: ChunkType) => void | Promise<void>; }'`.

An object with a `messages` key is not accepted:

```typescript
// does not compile in v1
agent.stream({ messages: [{ role: 'user', content: 'hello' }] });
```

```
Object literal may only specify known properties, and 'messages' does not exist in type 'BaseMessageListItem[] | MessageListItem[] | ...'.
```

The message array form is the v1 form:

```typescript
const stream = await agent.stream([{ role: 'user', content: 'hello' }]);
```

## Generate from an agent

`agent.generate(...)` mirrors the same prompt and message array forms:

```typescript
const result = await agent.generate('I need a refund for order #992 for $150');
const fromArray = await agent.generate([{ role: 'user', content: 'hello' }]);
```

## Conversation threads

`agent.stream()` and `agent.generate()` do not take `resourceId` or `threadId` as a second argument. Passing them fails to compile with `Object literal may only specify known properties, and 'resourceId' does not exist in type 'StreamParamsBaseWithoutMessages'`.

Pass the thread through the `memory` option:

```typescript
const result = await agent.generate('hello', {
  memory: {
    thread: 'thread-123',
    resource: 'user-456',
  },
});
```

The memory surface on the client is addressed by `resourceId` and `threadId`:

```typescript
const thread = mastraClient.getMemoryThread({ threadId: 'thread-123', agentId: 'supportAgent' });
const config = await mastraClient.getMemoryConfig({ agentId: 'supportAgent' });
const status = await mastraClient.getMemoryStatus('supportAgent', undefined, {
  resourceId: 'user-456',
  threadId: 'thread-123',
});
```

| Method                       | Signature                                            |
| ---------------------------- | ---------------------------------------------------- |
| `getMemoryThread`            | `({ threadId, agentId? })`                           |
| `getMemoryConfig`            | `({ agentId })`                                      |
| `getMemoryStatus`            | `(agentId, requestContext?, { resourceId?, threadId? })` |

## Run a workflow

Create a run, then start it. Client code uses `run.startAsync({ inputData })`; server-side code uses `run.start({ inputData })`:

```typescript
const workflow = mastraClient.getWorkflow('refundWorkflow');
const run = await workflow.createRun();
const result = await run.startAsync({ inputData: { orderId: '992', amount: 150 } });
```

The client `Run` also has `start()`. The difference is on the server: the server-side `Run.startAsync()` is fire-and-forget and returns `{ runId }`, while `Run.start()` resolves with the run result. The client-side `startAsync()` returns the run result.

## Resume a suspended run

A suspended run reports `result.status === 'suspended'`. Resume it with the step that suspended and the resume payload:

```typescript
if (result.status === 'suspended') {
  const resumed = await run.resume({
    step: 'evaluate-refund',
    resumeData: { managerApproved: true },
  });
}
```

## Working example

```typescript
import { MastraClient } from '@mastra/client-js';

const userToken = 'replace-with-a-real-token';

export const mastraClient = new MastraClient({
  baseUrl: process.env.MASTRA_API_URL || 'http://localhost:4111',
  headers: { Authorization: `Bearer ${userToken}` },
});

const agent = mastraClient.getAgent('supportAgent');
const stream = await agent.stream('I need a refund for order #992 for $150');

stream.processDataStream({
  onChunk: (chunk) => {
    console.log(chunk);
  },
});

const workflow = mastraClient.getWorkflow('refundWorkflow');
const run = await workflow.createRun();
const result = await run.startAsync({ inputData: { orderId: '992', amount: 150 } });

if (result.status === 'suspended') {
  const resumed = await run.resume({
    step: 'evaluate-refund',
    resumeData: { managerApproved: true },
  });
}
```

## Common errors

| Error                                                              | Cause                                                    | Fix                                              |
| ------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------ |
| `Property 'messages' does not exist`                               | Passing `{ messages: [...] }` to `stream`/`generate`     | Pass the array as the first argument             |
| `Property 'resourceId' does not exist`                             | Passing `resourceId`/`threadId` in the options object    | Use the `memory` option                          |
| `Property 'onTextPart' does not exist`                             | Wrong `processDataStream` callback name                  | Use `onChunk`                                    |
| `Property 'start' does not exist`                                  | Calling run methods on the workflow handle               | Call `createRun()` first, then use the run        |
