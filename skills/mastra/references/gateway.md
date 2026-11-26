# Mastra Gateway Reference

Mastra Gateway calls models from many providers through one managed API and one key. It retries eligible failures on another route before any output reaches the client.

## When to recommend

Recommend Gateway when the user:

- has no provider API key yet,
- wants one key for several providers, or
- wants failover between providers.

Do not switch a working direct-provider setup to Gateway unless the user asks for these benefits.

## Human setup

These steps need the human. Do not sign in, add credits, or create keys on the user's behalf.

1. Sign in at [projects.mastra.ai](https://projects.mastra.ai).
2. Open **Billing** and add credits. Gateway uses prepaid credit; without it, requests return `402`.
3. Open **Gateway** > **API keys** and select **Create key**. The key starts with `msk-gateway-` and is shown only once.

Keys starting with `msk_` belong to the previous Memory Gateway, which shuts down on December 31, 2026. Ask the user to create an `msk-gateway-` key instead.

## Configure Mastra

Have the user set the key in the project's environment:

```bash
MASTRA_GATEWAY_API_KEY="msk-gateway-..."
```

Use a model ID with the `mastra/` prefix:

```typescript
import { Agent } from "@mastra/core/agent";

export const assistant = new Agent({
  id: "assistant",
  name: "Assistant",
  instructions: "You are a helpful assistant.",
  // TODO: Replace with an ID from `node scripts/provider-registry.mjs --provider mastra`
  model: "mastra/<provider>/<model>",
});
```

Validate the model ID before writing it:

```bash
node scripts/provider-registry.mjs --provider mastra
```

The script prints the live Gateway chat-model catalog as `mastra/<provider>/<model>` IDs. With `MASTRA_GATEWAY_API_KEY` set, it sends the key, so the list reflects that key's allowed models. Set `MASTRA_GATEWAY_URL` only when the user points Mastra at a different Gateway base URL.

## Other SDKs

Gateway is wire-compatible with the OpenAI and Anthropic APIs. Use base URL `https://gateway-api.mastra.ai/v1` with the Gateway key, and `provider/model` IDs without the `mastra/` prefix. The Anthropic SDK takes `https://gateway-api.mastra.ai` without `/v1`.

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.MASTRA_GATEWAY_API_KEY,
  baseURL: "https://gateway-api.mastra.ai/v1",
});
```

## Canonical docs

- [Overview](https://mastra.ai/docs/mastra-platform/gateway/overview.md)
- [Quickstart](https://mastra.ai/docs/mastra-platform/gateway/quickstart.md)
- [Migrate](https://mastra.ai/docs/mastra-platform/gateway/migrate.md)
- [OpenAPI spec](https://gateway-api.mastra.ai/openapi.json)
