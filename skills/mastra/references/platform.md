# Mastra Platform

## When to use

Use this reference to create Mastra Platform projects, deploy a Mastra app (new or existing), and use Platform workspaces (`PlatformFilesystem`, `PlatformSandbox`) in generated code. For calls to a running Mastra server (agents, workflows, traces), use [`mastra-api.md`](mastra-api.md); it does not cover the Platform control plane.

The Platform API changes often. Treat the live spec `https://platform.mastra.ai/openapi.json` and `mastra <command> --help` as the source of truth, and check them before using anything not listed here.

## Human steps vs agent steps

The browser is only for the human: signing up, creating an organization, and `mastra auth login`. Never automate the browser or scrape the dashboard.

Everything else is agent work: scaffolding, REST discovery and provisioning, `mastra deploy`, and verification. When credentials are missing, stop and ask the user to do one of:

- Run `mastra auth login` in their own terminal (browser sign-in). The CLI saves the session, and later CLI commands reuse it without a TTY.
- Create an API token themselves (`mastra auth tokens create <name>` in their own terminal, or the dashboard) and put it, with `MASTRA_ORG_ID`, in the environment or an ignored env file.

Do not run `mastra auth tokens create` yourself: it prints the secret to stdout. Never ask for secret values in chat, never print or log them, and never commit them.

If you need anything you were not given — a credential, a model-provider key, which org or project to use — stop and ask the user. Do not take secrets from your own shell environment, other projects, or files the user did not point you to.

## Credentials

Two credential models exist. Do not mix them.

| Variable | Used by | Notes |
| - | - | - |
| `MASTRA_API_TOKEN` | CLI and control-plane REST | Wins over saved `mastra auth login` credentials. Setting it puts `mastra deploy` in headless mode. |
| `MASTRA_ORG_ID` | CLI and control-plane REST | Sent as `x-organization-id`. Required with `MASTRA_API_TOKEN`. |
| `MASTRA_PROJECT_ID` | CLI headless deploy | Must be a project ID (not a slug or name) in headless mode. |
| `MASTRA_PLATFORM_API_URL` | CLI | Optional override. Default `https://platform.mastra.ai`. |
| `MASTRA_PLATFORM_ACCESS_TOKEN` | App runtime (workspaces, observability) | Not a deploy credential. Injected on deploy; locally, an org API token the user creates. |
| `MASTRA_ENVIRONMENT_ID`, `MASTRA_PLATFORM_BUCKET_NAME` | App runtime (workspaces) | Injected on deploy; set manually only for local runs. |

Check for a saved session with `mastra auth whoami` before asking for credentials. With a saved session, CLI commands (including `mastra deploy`) work without a TTY and use the current org (`mastra auth orgs`; override with `--org <id>`). Only signing in, or signing in again after the session expires, needs a TTY. Do not read the saved credentials file; in session mode use CLI commands instead of the REST calls below, which need `MASTRA_API_TOKEN`.

Keep control-plane credentials (`MASTRA_API_TOKEN`, `MASTRA_ORG_ID`) in the shell environment, not in the app's `.env`: deploy uploads app env files as-is and does not filter them.

## Discover and provision over REST

`mastra deploy` and `mastra auth` have no JSON output, so use REST when you need machine-readable state. Every control-plane call uses the same headers:

```bash
curl -fsS https://platform.mastra.ai/v1/auth/orgs \
  -H "Authorization: Bearer $MASTRA_API_TOKEN" \
  -H "x-organization-id: $MASTRA_ORG_ID"
```

| Route | Purpose |
| - | - |
| `GET /v1/auth/orgs` | `{ organizations: [{ id, slug, name, role, isCurrent }] }`. Pick `MASTRA_ORG_ID` here (or `mastra auth whoami`). Org API keys (`sk_...`) get an empty list; ask the user for the org ID. |
| `GET /v1/projects` | List projects in the org. |
| `POST /v1/studio/projects` | Create a project. Body `{"name": "..."}` (1–64 chars); response `{ project: { id, slug, workspacesEnabled, ... } }`. Viewer/read-only roles get 403. |
| `GET /v1/projects/{id}` | Project details, including `workspacesEnabled`. |
| `GET /v1/projects/{projectId}/environments` | `{ environments: [{ id, name, slug, type, region, instanceUrl, customServerUrl, ... }] }`. Not in the public spec; called by the CLI. |
| `POST /v1/projects/{projectId}/environments` | Create an environment. Body `{"name": "production", "type": "production", "region": "us"}` (`region` optional). Not in the public spec; called by the CLI. |
| `GET /v1/projects/{projectId}/environment-deploys` | `{ deploys: [{ id, environmentName, status, error, errorCode, createdAt, ... }] }`. Not in the public spec; called by the CLI. |

`/v1/projects` itself is list-only; project creation is under `/v1/studio/projects`. The spec also lists `POST /v1/auth/orgs` (create organization), but creating or choosing an organization is the user's decision: ask the user, do not create one.

Before calling a route not listed here, check it exists with the method you need:

```bash
curl -fsS https://platform.mastra.ai/openapi.json | jq '.paths["/v1/studio/projects"] | keys'
```

## Build with Platform workspaces

Use `@mastra/platform-workspace` when the app needs durable file storage or remote command execution on the Platform. New projects have workspaces enabled and get one bucket per environment when the environment is created.

```bash
npm install @mastra/platform-workspace
```

```typescript title="src/mastra/workspace.ts"
import { Workspace } from '@mastra/core/workspace';
import { PlatformFilesystem, PlatformSandbox } from '@mastra/platform-workspace';

// Reads MASTRA_PLATFORM_ACCESS_TOKEN, MASTRA_PROJECT_ID, MASTRA_ENVIRONMENT_ID,
// and MASTRA_PLATFORM_BUCKET_NAME from the environment. The Platform injects them on deploy.
export const workspace = new Workspace({
  filesystem: new PlatformFilesystem(),
  sandbox: new PlatformSandbox(),
});
```

```typescript title="src/mastra/index.ts"
import { Mastra } from '@mastra/core';
import { workspace } from './workspace';

export const mastra = new Mastra({
  // TODO: register your agents, workflows, and storage
  workspace,
});
```

The bucket is shared by every request in the environment. A statically configured `PlatformSandbox` is one shared sandbox; construct a new `PlatformSandbox()` (call `start()`, then `destroy()`) for per-task isolation. The sandbox does not mount the bucket. Check the installed package's types or embedded docs for sandbox options before using them.

Local runs need all four runtime variables in the app's `.env`. Get `MASTRA_ENVIRONMENT_ID` from the environments route and the bucket name from `GET /v1/server/projects/{id}/environments/{envId}/bucket` (`envId` is the environment ID; response includes `status`: `provisioning`, `ready`, `failed`, or `destroyed`). The user creates the local `MASTRA_PLATFORM_ACCESS_TOKEN` (an org API token from the dashboard). For an offline loop, swap in `LocalFilesystem` and `LocalSandbox`.

Projects created before workspaces were on by default may have `workspacesEnabled: false`. Enable with `POST /v1/server/projects/{id}/workspaces/enable`: it requires an admin role (an org API key may not qualify), returns 409 when the project has no environment yet, is idempotent, and cannot be undone. Ask the user before calling it.

## Deploy

`mastra deploy` builds the app, runs preflight checks, uploads `.mastra/output`, and follows the deploy until it is running or fails. The first deploy creates the environment (`--env`, default `production`) and writes `.mastra-project.json` (`projectId`, `projectName`, `projectSlug`, `organizationId`, optional `disablePlatformObservability`). It holds no secrets and links the directory to the project for later deploys.

| Situation | Command |
| - | - |
| Saved `mastra auth login` session (no `MASTRA_API_TOKEN` set) | `mastra deploy --project <name> --yes` (creates the project in the current org if not found) |
| Headless, token in env | Export `MASTRA_API_TOKEN`, `MASTRA_ORG_ID`, `MASTRA_PROJECT_ID`, then `mastra deploy --yes` |
| Directory already linked | `mastra deploy --yes` (reads `.mastra-project.json`) |

`--project <value>` deploys into an existing project whose ID, slug, or name matches, replacing whatever is running there; it creates a project only when nothing matches. When the directory is not linked yet, check for an existing project with that name first (`GET /v1/projects` with a token; otherwise ask the user). If one exists and you did not create it in this session, ask the user whether to deploy into it or pick a different name.

In headless mode the project must already exist and `MASTRA_PROJECT_ID` must be its ID. For a new app, create it first with `POST /v1/studio/projects`, read `project.id`, and export it. Headless mode auto-accepts prompts.

Other useful flags: `--env <name>`, `--region us|eu` (new environments only), `--env-file <file>`, `--workers dedicated|in-process`, `--skip-build`. Avoid `--skip-preflight`; it skips the checks that prevent broken deploys.

**App environment variables.** Variables stored on the Platform environment are used at deploy time. `--env-file <file>` layers a local file on top (overriding stored keys); with several `.env*` files present, headless mode requires an explicit `--env-file`. A missing model-provider key fails at runtime, not at deploy. Before deploying, check which keys the app needs (for example `OPENAI_API_KEY`); if they are not already stored on the environment, ask the user to put them in a gitignored env file in the project (for example `.env.production`) and deploy with `--env-file <file>` (path relative to the project). Deploy saves those variables on the environment, so later deploys reuse them. Never fill that file from your own shell (for example `printf 'KEY=%s' "$KEY" > .env.production`): the value persists on the Platform environment. If a key was deployed that the user did not provide, tell the user so they can remove or rotate it; do not change stored environment credentials yourself.

**Storage.** Preflight blocks file-backed storage (`file:./mastra.db`) because the Platform filesystem is ephemeral. Guard the path with an environment variable:

```typescript
import { LibSQLStore } from '@mastra/libsql';

export const storage = new LibSQLStore({
  id: 'mastra-storage',
  // Hosted database when deployed, local file during development
  url: process.env.TURSO_DATABASE_URL ?? 'file:./mastra.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});
```

The deploy-time offer to create a managed database is interactive only; in headless or `--yes` runs the CLI prints the command instead. Provision it explicitly once the environment exists (create the environment first with `mastra env create production --type production --project "$MASTRA_PROJECT_ID"` or the REST route above):

```bash
mastra env db create production --kind turso --project "$MASTRA_PROJECT_ID"
```

The database's connection variables are injected into deploys automatically.

## Verify

1. `mastra deploy` exits non-zero on failure and prints the Server URL on success. The CLI waits until the deploy status is `running` (success), `failed`, or `stopped`; any other status is still in progress.
2. For machine-readable status, read the newest entry from `GET /v1/projects/{projectId}/environment-deploys`, or poll `GET /v1/projects/{projectId}/environments/{environmentId}/deploys/{deployId}`.
3. On failure, run `mastra env diagnosis <deploy-id>` for fix suggestions.
4. Call the deployed server with `mastra api --url <server-url> agent list` (see [`mastra-api.md`](mastra-api.md)), then exercise one agent, including a workspace tool if the app uses one.

## Clean up

Only delete resources you created in this session, and only with the user's consent. `DELETE /v1/projects/{id}` is a soft delete: `GET /v1/projects/recently-deleted` lists deleted projects and `POST /v1/projects/{id}/undelete` restores one. `mastra env delete <environment>` removes an environment.

## Failures

| Symptom | Cause and fix |
| - | - |
| 401 | Missing, expired, or wrong credential type. `MASTRA_PLATFORM_ACCESS_TOKEN` cannot replace `MASTRA_API_TOKEN`. Ask the user for a new token. |
| 403 | Role lacks permission (viewer on project create, non-admin on workspace enable). Ask the user for a token with a sufficient role. |
| Headless deploy asks for `MASTRA_ORG_ID` / `MASTRA_PROJECT_ID` | Both are required with `MASTRA_API_TOKEN`; create the project over REST first. |
| `No organizations found` from `mastra env ...` with `MASTRA_API_TOKEN` | Known CLI issue: org resolution can fail before `MASTRA_ORG_ID` is read. Use the REST route with `x-organization-id` instead. |
| 409 on workspace enable | The project has no environment; deploy or create one first. |
| Generic 500 from `PlatformFilesystem` / `PlatformSandbox` | Upstream storage or sandbox error, not auth. Capture the request ID and report it; do not retry in a loop. |
| Preflight blocks a local storage path | Guard the path with an env var and attach a managed database (see Storage). |
| Deploy succeeds but agent calls fail | Model-provider key missing from the environment. Ask the user to add it to a gitignored env file, then redeploy with `--env-file <file>`. |
