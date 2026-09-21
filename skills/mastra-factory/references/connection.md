# Connect to a Factory

Start here on first activation or whenever the target, login, or CLI is uncertain. A fresh, empty directory is sufficient: connecting does not require source code, a deployment, or a project config file.

## 1. Check the CLI

```bash
mastra --version
mastra api --help
mastra api factory --help
```

Confirm `factory` is actually listed; some older CLIs print parent help for an unknown command. If the repository has a local CLI, use `./node_modules/.bin/mastra` instead. Do not upgrade the project's dependencies just to inspect a remote Factory.

If no compatible CLI is available, this temporary invocation was verified with Mastra 1.30.0:

```bash
npm exec --yes --package=mastra@1.30.0 --package=@mastra/core@latest --package=typescript@latest -- mastra api factory --help
```

Substitute the same `npm exec ... -- mastra` prefix for `mastra` below. The extra packages address missing `@mastra/core` and `typescript` dependencies encountered with a bare `npx mastra`. This is a tested fallback, not a minimum-version guarantee; check help/schema again when versions change. If npm reports engine incompatibility, use a Node version supported by the selected packages.

## 2. Establish the target and authentication

Ask for the user's Factory instance URL if it isn't already known. Obtain it from their deployment details, the Factory UI's origin, or their deployment administrator; do not derive it from a project name or reuse another user's host. Use the server base URL, not a board-page URL, the platform dashboard/API URL, or a URL ending in `/api`.

For a platform-hosted Factory, check the existing login:

```bash
mastra auth whoami
```

If logged out, offer to run `mastra auth login` and wait for authorization unless the user already requested login. Run it, let the user complete browser authentication, then rerun `whoami`. The command is **`mastra auth login`**, not `mastra login`. Saved login is user-level and works across directories; do not read the credential file.

For HTTPS hosts recognized by the CLI (`*.factory.mastra.cloud` and `*.factory.staging.mastra.cloud`), explicit `--url` automatically uses the saved login. Factory requests also use the selected organization. Inspect `mastra auth orgs --help` and, with the user's authorization, `mastra auth orgs switch` if the organization is wrong. `MASTRA_ORG_ID` can override organization selection; don't silently change it.

For local, custom-domain, or self-hosted deployments, platform login is not necessarily applicable. Confirm the deployment's authentication requirements. The CLI does not automatically send saved platform credentials to arbitrary hosts. Use the deployment's approved environment/header mechanism if required; never ask the user to paste secrets into chat, read saved credentials, or send a platform token to an unverified host. An unauthenticated `curl` returning 401 does not prove a logged-in CLI request will fail.

## 3. Connect and discover projects

Set `FACTORY_URL` to the actual instance URL supplied or verified above. This shell variable is just a convenience, not an auto-read CLI environment variable.

```bash
mastra api --url "$FACTORY_URL" factory project list '{"page":0,"perPage":10}' \
  | jq '{page, projects: [.data[] | {id, name}]}'
```

Follow `page.hasMore` before concluding a named project is absent. Select the sole project or match the user's named project; ask when multiple choices remain plausible. Keep `--url "$FACTORY_URL"` on **every** subsequent command, including thread/memory calls and their schema discovery. A successful call does not persist a target.

An empty project list is not proof there are no projects: confirm the URL, organization, access, and pagination. A 401/403 calls for checking login and access, not inventing IDs or retrying with credentials borrowed from another project.

## Alternative: automatic target resolution

If the working directory is a repository that has already been deployed with `mastra deploy`, it contains a `.mastra-project.json` link file and plain `mastra api factory ...` works with no `--url` at all:

```bash
# from inside a deployed project's repo
mastra api factory project list '{"page":0,"perPage":10}' | jq '.data[] | {id, name}'
```

Without `--url`, Factory/runtime commands probe `http://localhost:4111` first, then read `.mastra-project.json` in the working directory to resolve the platform deployment. A reachable local server can therefore win over a linked deployment. Prefer an explicit URL for unambiguous remote inspection.

The link file is normally written by deployment commands after project selection; login and read-only API calls do not create it. Do not deploy, copy another repository's config, or hand-author a link file just to connect. `MASTRA_PROJECT_ID` / `MASTRA_ORGANIZATION_ID` are not substitutes for a Factory target; their service-target handling applies to observability/learning, not Factory URL lookup.

Distinguish these identifiers:

- **Platform deployment project**: the host identity referenced by `.mastra-project.json`.
- **Factory project**: an organization-scoped logical project returned by `factory project list` on the selected deployment.

Names, IDs, organizations, and project counts are deployment-specific. Never assume either namespace's IDs can be used in the other, or that a deployment name appears in the Factory list.

Factory commands use origin-level `/web/*` routes, bypassing `--server-api-prefix`. Thread/memory commands use the runtime API prefix (normally `/api`); for a customized server prefix, discover it from the deployment rather than adding `/api` to `FACTORY_URL`.

## Installing or repairing the skill

Prefer the repository source so references are installed with the skill:

```bash
npx skills add mastra-ai/skills --skill mastra-factory
```

Use the interactive selection to choose scope and agent. For a supported global target, an explicit example is:

```bash
npx skills add mastra-ai/skills --skill mastra-factory --agent claude-code -g -y
npx skills list -g --agent claude-code
```

Replace `claude-code` with the user's actual supported agent; don't install for an unrelated agent. Check `npx skills --help` for current options. PromptScript does not support global installation: select project scope for that agent (omit `-g`), or target a different intended agent that supports global scope. A multi-agent install can partially succeed while reporting a PromptScript failure. Project-scope PromptScript installs have been observed to report "copied" while `npx skills list` shows the skill as "not linked", so a successful copy is not proof of integration. Verify the intended agent's installation, the SKILL.md and its referenced files, and activation in that agent rather than trusting the aggregate install message.
