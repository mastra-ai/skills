---
name: create-mastra
# prettier-ignore
description: Skill for creating AI agent projects using Mastra framework. Guide for adding agents/workflows to TypeScript/JavaScript apps.
license: Apache-2.0
metadata:
  author: Mastra
  version: "1.0.0"
  repository: https://github.com/mastra-ai/skills
---

# Create Mastra Skill

Guide for adding AI agents and workflows to TypeScript/JavaScript applications using Mastra.

**For code examples and syntax, see [mastra.ai/docs](https://mastra.ai/docs).**

---

## Decision Tree

```
Is this a new/empty project?
├─ YES → New project setup
│   1. Run npm create mastra@latest
│   2. Choose package manager
│   3. CLI generates weather agent example
│   4. Add API keys to .env
│   5. Run npm run dev
│   6. Test in Studio (localhost:4111)
│   7. Customize/add agents
│
└─ NO → Add to existing project
    1. Analyze project structure
    2. Install @mastra/core
    3. Configure TypeScript (ES2022)
    4. Create src/mastra/ directory
    5. Add agents/workflows
    6. Export Mastra instance
    7. Integrate into routes
```

---

## Installation

**Quick start (new projects):**
```bash
npm create mastra@latest
```

**Manual (existing projects):**
```bash
npm install @mastra/core zod
npm install -D typescript @types/node mastra
```

**Common packages:**
| Package | Use case |
|---------|----------|
| `@mastra/core` | Core agents/workflows (required) |
| `@mastra/memory` | Memory/conversation history |
| `@mastra/rag` | RAG/vector search |
| `@mastra/deployer` | Deployment tools |

---

## Environment Variables

```env
# Choose your model provider (one or more)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...

# Optional: Memory/storage
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

---

## Project Structure

**Location:** `src/mastra/` (CLI looks here, or use custom path)

```
src/mastra/
├── tools/              # Custom tool definitions
│   └── weather-tool.ts
├── agents/             # Agent configurations
│   └── my-agent.ts
├── workflows/          # Workflow definitions
│   └── my-workflow.ts
└── index.ts           # Mastra instance (exports)
```

---

## Agent Config (agents/my-agent.ts)

**Minimal config:**
```typescript
import { Agent } from '@mastra/core';

export const myAgent = new Agent({
  name: 'my-agent',
  instructions: 'You are a helpful assistant',
  model: {
    provider: 'OPENAI',  // or ANTHROPIC, GOOGLE
    name: 'gpt-4o'
  }
});
```

**With tools:**
```typescript
import { Agent } from '@mastra/core';
import { myTool } from '../tools/my-tool';

export const myAgent = new Agent({
  name: 'my-agent',
  instructions: 'You help users with tasks',
  model: { provider: 'OPENAI', name: 'gpt-4o' },
  tools: [myTool]
});
```

**With memory:**
```typescript
export const chatAgent = new Agent({
  name: 'chat-agent',
  memory: memoryInstance,
  model: { provider: 'OPENAI', name: 'gpt-4o' }
});

// Use with threadId for continuity
await chatAgent.generate('Hello', { threadId: 'user-123' });
```

---

## Workflow Config (workflows/my-workflow.ts)

**Basic workflow:**
```typescript
import { createWorkflow, createStep } from '@mastra/core';
import { z } from 'zod';

const step1 = createStep({
  id: 'validate'
})
  .input(z.object({ data: z.string() }))
  .output(z.object({ valid: z.boolean() }))
  .execute(async ({ context }) => {
    return { valid: true };
  });

export const myWorkflow = createWorkflow({ name: 'my-workflow' })
  .then(step1)
  .commit();
```

**Workflow methods:**
- `.start()` - Executes all steps, returns results
- `.stream()` - Emits events during execution
- `.createRunAsync()` - Instantiates run
- `.restart()` - Resumes after disconnect

---

## Mastra Instance (index.ts)

**Export your Mastra instance:**
```typescript
import { Mastra } from '@mastra/core';
import { myAgent } from './agents/my-agent';
import { myWorkflow } from './workflows/my-workflow';

export const mastra = new Mastra({
  agents: { myAgent },
  workflows: { myWorkflow }
});
```

**Access in code:**
```typescript
// ✅ Recommended
const agent = mastra.getAgent('myAgent');
const workflow = mastra.getWorkflow('myWorkflow');

// ❌ Less ideal (bypasses Mastra instance)
import { myAgent } from './agents/my-agent';
```

---

## TypeScript Config (Required)

**Critical settings:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler"
  }
}
```

**CommonJS will cause errors. Must use ES2022 modules.**

---

## Development Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "dev": "mastra dev",
    "build": "mastra build"
  }
}
```

**Testing with Studio:**
```bash
npm run dev
```
Access at http://localhost:4111 for visual testing.

---

## Framework Integration

| Framework | File | Handler |
|-----------|------|---------|
| Next.js App Router | `app/api/mastra/route.ts` | POST handler with `mastra.getAgent()` |
| Next.js Pages | `pages/api/mastra.ts` | API route handler |
| Express | Any file | `app.post('/api/agent/:name', ...)` |
| Fastify | Any file | `fastify.post('/api/agent/:name', ...)` |

### Next.js Example

`app/api/mastra/route.ts`
```typescript
import { mastra } from '@/mastra';

export async function POST(req: Request) {
  const { agent, message } = await req.json();
  const agentInstance = mastra.getAgent(agent);
  const response = await agentInstance.generate(message);
  return Response.json(response);
}
```

### Express Example

```typescript
import express from 'express';
import { mastra } from './mastra';

const app = express();

app.post('/api/agent/:name', async (req, res) => {
  const agent = mastra.getAgent(req.params.name);
  const response = await agent.generate(req.body.message);
  res.json(response);
});
```

---

## Common Patterns

### Structured Output
```typescript
import { z } from 'zod';

const response = await agent.generate('Extract: John, age 30', {
  output: z.object({
    name: z.string(),
    age: z.number()
  })
});
// response.object is typed and validated
```

### Streaming Responses
```typescript
const stream = await agent.stream('Tell me a story');
for await (const chunk of stream) {
  console.log(chunk);
}
```

### Agent Parameters
| Parameter | Default | Purpose |
|-----------|---------|---------|
| `maxSteps` | 5 | Limits sequential LLM calls |
| `onStepFinish` | - | Monitors multi-step progress |
| `onFinish` | - | Callback when complete |

---

## Setup Checklist

- [ ] Node.js 20+ installed
- [ ] Project created (CLI or manual)
- [ ] TypeScript ES2022 configured
- [ ] `@mastra/core` and `zod` installed
- [ ] API keys in .env
- [ ] `src/mastra/` directory created
- [ ] At least one agent/workflow defined
- [ ] Mastra instance exported
- [ ] Dev scripts in package.json
- [ ] Studio accessible at localhost:4111

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Cannot find module" | Verify ES2022 in tsconfig (not CommonJS) |
| "API key not found" | Add provider key to .env |
| Agent not responding | Check model provider and API key |
| Studio won't start | Verify `mastra dev` in package.json |
| TypeScript errors | Use `moduleResolution: "bundler"` |
| Tools not working | Add tool to agent's `tools` array |

---

## Resources

- [Docs](https://mastra.ai/docs)
- [Installation](https://mastra.ai/docs/getting-started/installation)
- [Agents](https://mastra.ai/docs/agents/overview)
- [Workflows](https://mastra.ai/docs/workflows/overview)
- [Examples](https://github.com/mastra-ai/mastra/tree/main/examples)
- [GitHub](https://github.com/mastra-ai/mastra)
