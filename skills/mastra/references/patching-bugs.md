# Unblocking with a local patch

Use this reference when a verified Mastra defect blocks the user's task and the normal fixes have not worked. It covers patching the installed package so the user can keep going, then reporting the defect and the fix as a GitHub issue on `mastra-ai/mastra`.

Patching is a last resort. It changes the user's dependencies and creates an issue in a public repository under the user's GitHub account, so each of those steps needs the user's explicit permission.

## 1. Rule out the normal fixes first

Patch only after all of these have failed to unblock the user:

- Confirm the failure is in Mastra, not in the user's code or configuration. Check [`common-errors.md`](common-errors.md).
- Verify the API, configuration and limits for the installed version in [embedded docs](embedded-docs.md), then in [remote docs](remote-docs.md).
- Check whether the defect is already known or fixed: search existing issues (see [step 6](#6-search-for-an-existing-issue)) and the affected package's `CHANGELOG.md`.
- Try the latest published release of the affected `@mastra/*` packages. Ask before upgrading the user's dependencies, and say which packages and versions change. Upgrade related `@mastra/*` packages together. If the latest release fixes the defect, stop here; no patch or issue is needed.
- Prefer a supported workaround, such as a different documented option or API, over a patch.

## 2. Find the smallest fix

- Find the defect in the installed package under `node_modules/@mastra/<package>/dist/`. `SOURCE_MAP.json` (see [`embedded-docs.md`](embedded-docs.md)) maps exports to `dist` files, and the `.js.map`/`.cjs.map` source maps next to each build file name the original source file in the `mastra-ai/mastra` repository.
- Keep the change to the minimum needed to unblock the user. Do not refactor or add behavior.
- A package can ship several builds of the same code (`.js`, `.cjs`, shared `chunk-*.js` files). Find every copy the user's app actually loads.
- Do not patch to bypass authentication, authorization, validation of untrusted input or other safety checks. Report those defects without a patch.
- If the defect is in a non-Mastra dependency, do not use this workflow. Report it upstream as described in [`feedback.md`](feedback.md).

## 3. Ask permission to patch

Before changing anything, tell the user:

- What the defect is and the evidence for it.
- Which package, version and files the patch changes, and what the change does.
- That the patch is unofficial, may break on upgrade, and should be removed once a fixed release ships.

Apply the patch only after the user agrees.

## 4. Apply the patch so it survives reinstalls

Use the project's package manager to create a patch file that is committed with the project. Do not leave edits only in `node_modules`; a reinstall silently discards them.

| Package manager | Commands |
| --- | --- |
| pnpm | `pnpm patch @mastra/<package>@<version>`, edit the printed directory, then `pnpm patch-commit <dir>` |
| Yarn (Berry) | `yarn patch @mastra/<package>`, edit the printed directory, then `yarn patch-commit -s <dir>` |
| Bun | `bun patch @mastra/<package>`, edit in `node_modules`, then `bun patch --commit node_modules/@mastra/<package>` |
| npm | Install `patch-package` as a dev dependency, edit `node_modules`, run `npx patch-package @mastra/<package>`, and add `"postinstall": "patch-package"` to `package.json` scripts |

Detect the package manager from the lockfile. Verify the exact commands against the installed package manager's help output before running them.

## 5. Verify the patch

- Rerun the scenario that failed and confirm the user is unblocked.
- Run a control: the same scenario with the patch reverted should still fail. If it doesn't, the patch did not fix the defect; go back to step 2.
- Run the project's typecheck and tests if available.
- Tell the user where the patch file is and that it must be removed when a fixed release ships.

## 6. Search for an existing issue

Ask permission before filing. Then search open and closed issues for the same underlying defect:

```bash
gh issue list --repo mastra-ai/mastra --state all --search "<component> <key error text>" --limit 20
```

If a matching issue exists, propose adding a comment to it with the new evidence and the patch instead of opening a new issue. Comment only with the user's permission.

## 7. Open the issue

Opening an issue publishes it under the user's GitHub account. Show the user the full title and body, then create it only after they approve. Permission to patch is not permission to file.

Follow the repository's bug report template (`.github/ISSUE_TEMPLATE/bug_report.yml`): title prefixed with `[BUG] `, the `bug` label, and these sections:

```markdown
### Describe the Bug
<One or two sentences naming the affected component and the concrete failure.>

### Steps To Reproduce
1. <Minimal steps from `npx create-mastra@latest`, using generic data and public APIs.>
2. ...

### Link to Minimal Reproducible Example
<Link, or "Inline below" with the minimal reproduction code.>

### Expected Behavior
<Expected result and the documented contract it comes from.>

### Environment Information
<Exact resolved @mastra/* versions tested, Node version, package manager, OS, LLM provider if relevant. State whether the latest release was tested.>

### Local patch that unblocked the issue
<Patch diff against the published dist files, and the package version it applies to.>
<Source file in mastra-ai/mastra where the fix likely belongs. Label this as inferred unless verified.>
<Control result: the scenario fails without the patch and passes with it.>
```

```bash
gh issue create --repo mastra-ai/mastra --title "[BUG] <summary>" --label bug --body-file <file>
```

If adding the label fails because of permissions, retry without `--label`.

Rules for the issue content:

- Apply the evidence and privacy rules in [`feedback.md`](feedback.md#how-to-report). Never include the user's application source, local paths, private URLs, secrets or project names. A diff of Mastra's own published code is fine to share.
- The template requires a minimal reproduction. Write a small synthetic reproduction rather than copying the user's code. Publishing it as a gist or repository is a separate public action; ask first, or put it inline.
- Do not open a pull request. The template says a maintainer must approve the bug report before PRs are opened.

If `gh` is not installed or authenticated, or the user declines the GitHub issue, offer the [feedback endpoint](feedback.md) instead, unless the user said not to report the issue at all.

## 8. Wrap up

Tell the user:

- The patch file location and what it changes.
- The issue URL, or that no issue was filed and why.
- To remove the patch and its `postinstall` hook (if added) once a release with the fix ships.
