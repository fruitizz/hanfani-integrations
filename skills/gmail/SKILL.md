---
name: gmail
description: How to use the @hanfani/integrations gmail integration — wiring its read tools into an agent, executing its mutations as server effects, setting up Gmail OAuth credentials, and diagnosing checkCredentials failures. Use when importing from @hanfani/integrations/gmail/*, adding Gmail capabilities to a workflow, or when an agent shows "missing credentials" for Gmail.
---

# gmail — how to use

Read + act on a Gmail inbox: list unread emails, fetch the most-recent email, fetch one
email's body, create a draft reply, mark read, trash, star. Reads go to the model as tools;
mutations are SERVER-EXECUTED effects behind approval gates — never expose them to a model.

## Surface

| import                                         | function                                                                       | kind            |
| ---------------------------------------------- | ------------------------------------------------------------------------------ | --------------- |
| `@hanfani/integrations/gmail/list-unread`       | `listUnread({ sinceHours? }, deps)` → `ReadResult<{ emails: EmailRef[] }>`     | read            |
| `@hanfani/integrations/gmail/get-email`         | `getEmail({ messageId }, deps)` → `ReadResult<ParsedEmail>` incl. `body`       | read            |
| `@hanfani/integrations/gmail/get-latest-email`  | `getLatestEmail(args, deps)` → `ReadResult<ParsedEmail>`                       | read            |
| `@hanfani/integrations/gmail/create-draft`      | `createDraft({ threadId, body }, deps)` → `{ ok: true, draftId } \| { error }` | mutation/effect |
| `@hanfani/integrations/gmail/modify`            | `markRead\|trash\|star({ messageIds }, deps)` → `BatchActionResult`            | mutation/effect |
| `@hanfani/integrations/gmail/check-credentials` | `checkCredentials(deps)` → `HealthCheck`                                       | health          |

All functions receive a `deps` object containing `deps.credential` (a `ResolvedCredential`
from `resolveCredential`) — the integration never reads env vars or files directly.

Result shapes (`HealthCheck` / `ReadResult` / `BatchActionResult`) are the shared
`@hanfani/core` integration contract — import them, they are not gmail-specific.

`EmailRef = { messageId, threadId, from, subject, date, snippet }`. Mutations are
best-effort per message: `failed` lists per-id errors; `{ error }` means the client
itself was unavailable. `trash` moves to Gmail Trash (reversible ~30 days), it never
permanently deletes.

**MCP server (app-owned, not shipped in the package):** `apps/inbox/mcp/gmail-tools.mts`,
run via `node --import tsx`. It exposes `get_latest_email`, `list_unread`, `get_email`
(READ ONLY). The server resolves the credential via `@hanfani/server` — it is
app-scoped, not part of the `@hanfani/integrations` package itself.

## Wiring rules

- **Model side (claude-cli):** add the MCP server to the spawn's `--mcp-config` and put
  ONLY the read tools on the agent's allow-list (`mcp__gmail__list_unread`,
  `mcp__gmail__get_email`, `mcp__gmail__get_latest_email`); declare them in
  `defineAgent.readonly`.
- **Model side (Mastra):** register `listUnread`/`getEmail`/`getLatestEmail` as native
  read tools; the credential is resolved in-process.
- **Mutations:** bind `createDraft`, `markRead`, `trash`, `star` as `ServerBinding.effects`
  keyed by the approval tool name — the server calls them AFTER a human approves a gate.
  Never put a mutation on a model allow-list; the framework refuses to boot on an
  unclassified tool.
- **Health:** call `checkCredentials(deps)` in your server's health surface; show its
  `hint` to the user when not ok.

## Credentials

Credentials follow the framework auth contract. The OAuth **app** registration (client
id/secret) is set ONCE in the repo-root `.env.local`:

- `HANFANI_GOOGLE_CLIENT_ID` + `HANFANI_GOOGLE_CLIENT_SECRET` — the OAuth client (GCP Console →
  APIs & Services → Credentials → OAuth client ID).
- `HANFANI_SECRET_KEY` — the AES master key for the encrypted credential store.

The **per-user token** is obtained by clicking **Connect** in the app header (the OAuth flow)
and is stored ENCRYPTED in the `credentials` table. `resolveCredential` yields the live token
to the integration via `deps.credential`. There are no hand-placed files and no
`GMAIL_OAUTH_*` env vars.

`googleapis` is an optional peer — `yarn add googleapis` in the consuming app.

## Diagnosing checkCredentials failures

| error contains                                      | meaning                                   | fix                                                                                                        |
| --------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| not connected (`resolveCredential` → null)          | no per-user token in the credential store | click **Connect** in the app header; ensure `HANFANI_GOOGLE_CLIENT_ID/SECRET` + `HANFANI_SECRET_KEY` are set |
| `invalid_grant`                                     | token expired or revoked                  | click **Connect** again to re-authorize                                                                    |
| `insufficient.*scope` / 403                         | token was granted a narrower scope        | click **Connect** and re-authorize with `gmail.modify` scope                                               |
| `Optional dependency "googleapis" is not installed` | peer missing                              | `yarn add googleapis` in the consuming app                                                                 |
