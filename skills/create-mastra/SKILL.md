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

Complete guide for creating new Mastra AI agent projects. Includes both quickstart CLI method and detailed manual installation with full working code examples.

**Official documentation: [mastra.ai/docs](https://mastra.ai/docs)**

---

## Getting Started

When a user wants to create a Mastra project, ask them:

**"How would you like to create your Mastra project?"**

1. **Automatic Setup** - I'll run `npm create mastra@latest` for you and handle everything
2. **Interactive Guide** - I'll walk you through each step and you can approve before I run commands
3. **Manual Installation** - I'll help you set up the project manually with full control

Based on their choice:
- **Option 1**: Run the CLI command directly, prompt for provider/API key, then execute
- **Option 2**: Ask for provider choice, API key, then run command and guide through testing
- **Option 3**: Guide through manual installation step-by-step with user approval at each stage

---

## Prerequisites

- An API key from a supported model provider (OpenAI, Anthropic, Google, etc.)

---

## Quick Start

Create a new Mastra project with one command:

```bash
npm create mastra@latest
```

**Other package managers:**
```bash
pnpm create mastra@latest
yarn create mastra@latest
bun create mastra@latest
```

---

## What the CLI Does

The `npm create mastra@latest` command:
1. Creates a new project directory
2. Prompts you to select a model provider:
   - OpenAI (recommended if undecided)
   - Anthropic
   - Google
   - Other supported providers
3. Asks for your API key
4. Generates a complete project structure:
   - `src/mastra/index.ts` - Mastra instance configuration
   - `src/mastra/tools/weather-tool.ts` - Example weather tool
   - `src/mastra/agents/weather-agent.ts` - Example weather agent
   - `package.json` with scripts
   - `tsconfig.json` with required settings
   - `.env` file with your API key
5. Installs all dependencies

---

## Setup Steps

1. **Run the command from anywhere on your machine:**
   ```bash
   npm create mastra@latest
   ```

2. **When prompted:**
   - Select a model provider (OpenAI, Anthropic, Google, etc.)
   - OpenAI is recommended if you're undecided
   - Enter your API key for the selected provider

3. **The CLI will generate:**
   - A new project directory
   - `src/mastra/index.ts` with configuration and memory settings
   - `src/mastra/tools/weather-tool.ts` with an example tool
   - `src/mastra/agents/weather-agent.ts` with an example agent
   - All necessary configuration files

4. **Start the dev server:**
   ```bash
   cd <your-project-directory>
   npm run dev
   ```

5. **Access Studio at** `http://localhost:4111` to test your agent

---

## CLI Flags

**Skip the example agent:**
```bash
npm create mastra@latest --no-example
```

**Use a specific template:**
```bash
npm create mastra@latest --template <template-name>
```

---

## Bun Users: Extra Steps Required

Due to a known issue, Bun users must run these additional commands after project creation:

```bash
bun add @mastra/server@latest
rm -rf node_modules bun.lock
bun install
```

---

## Generated Project Structure

```
my-mastra-app/
├── src/
│   └── mastra/
│       ├── index.ts              # Mastra configuration
│       ├── agents/
│       │   └── weather-agent.ts  # Example agent
│       └── tools/
│           └── weather-tool.ts   # Example tool
├── package.json
└── .env                          # Your API keys
```

---

## Environment Variables

After project creation, your `.env` file will contain:

```env
# Your selected model provider
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
# or
GOOGLE_GENERATIVE_AI_API_KEY=...
```

---

## Manual Installation (Alternative Method)

If you prefer not to use the CLI or need custom setup, follow these complete steps:

### Step 1: Create Project Directory
```bash
mkdir my-first-agent && cd my-first-agent
npm init -y
```

### Step 2: Install Dependencies

```bash
npm install -D typescript @types/node mastra@latest
npm install @mastra/core@latest zod@^4
```

### Step 3: Configure Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "mastra dev",
    "build": "mastra build"
  }
}
```

### Step 4: Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

**Important:** Mastra requires `"module": "ES2022"` and `"moduleResolution": "bundler"`. CommonJS will cause errors.

### Step 5: Create Environment File

Create `.env` with your API key:

```env
GOOGLE_GENERATIVE_AI_API_KEY=<your-api-key>
```

Or use `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.

### Step 6: Create Weather Tool

Create `src/mastra/tools/weather-tool.ts`:

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const weatherTool = createTool({
  id: "get-weather",
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name"),
  }),
  outputSchema: z.object({
    output: z.string(),
  }),
  execute: async () => {
    return { output: "The weather is sunny" };
  },
});
```

### Step 7: Create Weather Agent

Create `src/mastra/agents/weather-agent.ts`:

```typescript
import { Agent } from "@mastra/core/agent";
import { weatherTool } from "../tools/weather-tool";

export const weatherAgent = new Agent({
  id: "weather-agent",
  name: "Weather Agent",
  instructions: `You are a helpful weather assistant. Always ask for location if none provided.`,
  model: "google/gemini-2.5-pro",
  tools: { weatherTool },
});
```

**Note:** Model format is `"provider/model-name"`. Examples:
- `"google/gemini-2.5-pro"`
- `"openai/gpt-4o"`
- `"anthropic/claude-3-5-sonnet-20241022"`

### Step 8: Create Mastra Entry Point

Create `src/mastra/index.ts`:

```typescript
import { Mastra } from "@mastra/core";
import { weatherAgent } from "./agents/weather-agent";

export const mastra = new Mastra({
  agents: { weatherAgent },
});
```

### Step 9: Launch Development Server

```bash
npm run dev
```

Access Studio at `http://localhost:4111` to test your agent.

---

## Verifying Your Project

After creation, verify these files exist:
```
your-project/
├── src/mastra/
│   ├── index.ts
│   ├── agents/weather-agent.ts
│   └── tools/weather-tool.ts
├── package.json
├── tsconfig.json
└── .env
```

Start the dev server:
```bash
npm run dev
```

Access Studio at `http://localhost:4111` to test your agent.

---

## Next Steps

After creating your project with `create mastra`:

- **Customize the example agent** in `src/mastra/agents/weather-agent.ts`
- **Add new agents** - see [Agents documentation](https://mastra.ai/docs/agents/overview)
- **Create workflows** - see [Workflows documentation](https://mastra.ai/docs/workflows/overview)
- **Add more tools** to extend agent capabilities
- **Integrate into your app** - see framework guides at [mastra.ai/docs](https://mastra.ai/docs)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API key not found | Make sure your `.env` file has the correct key |
| Studio won't start | Check that port 4111 is available |
| Bun installation issues | Follow the Bun-specific steps above |
| Command not found | Ensure you're using Node.js 20+ |

---

## Resources

- [Docs](https://mastra.ai/docs)
- [Installation](https://mastra.ai/docs/getting-started/installation)
- [Agents](https://mastra.ai/docs/agents/overview)
- [Workflows](https://mastra.ai/docs/workflows/overview)
- [Examples](https://github.com/mastra-ai/mastra/tree/main/examples)
- [GitHub](https://github.com/mastra-ai/mastra)
