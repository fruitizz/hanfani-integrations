# @hanfani/integrations

[![build status][build-src]][build-href]
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![size][size-src]][size-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

External-service integrations for the [Hanfani](https://github.com/fruitizz/hanfani-core) agent
framework. Each integration is a set of pure, importable effects: read tools return a
`ReadResult`, mutations return a `BatchActionResult` or `{ ok, ... }`, and a `checkCredentials`
health probe reports whether a usable credential reaches the integration. No `fs`, no
`process.env` — the framework resolves and injects the credential via `deps.credential`.

## Install

```bash
pnpm add @hanfani/integrations @hanfani/core
```

`googleapis` is an optional peer — lazily imported only when a Gmail client is actually built, so
importing the effects never pulls it in.

## Gmail

Each function is its own subpath so an app pulls in only what it uses.

| Import | Signature | Kind |
|--------|-----------|------|
| `@hanfani/integrations/gmail/list-unread` | `listUnread({ sinceHours? }, deps)` → `ReadResult<{ emails }>` | read |
| `@hanfani/integrations/gmail/get-email` | `getEmail({ messageId }, deps)` → `ReadResult<ParsedEmail>` | read |
| `@hanfani/integrations/gmail/get-latest-email` | `getLatestEmail(args, deps)` → `ReadResult<ParsedEmail>` | read |
| `@hanfani/integrations/gmail/create-draft` | `createDraft({ threadId, body }, deps)` → `{ ok, draftId } \| { error }` | mutation |
| `@hanfani/integrations/gmail/modify` | `markRead \| trash \| star({ messageIds }, deps)` → `BatchActionResult` | mutation |
| `@hanfani/integrations/gmail/check-credentials` | `checkCredentials(deps)` → `HealthCheck` | health |
| `@hanfani/integrations/gmail/auth` | `auth` — the Gmail `AuthSpec` | oauth |

```ts
import { listUnread } from '@hanfani/integrations/gmail/list-unread'
import { createDraft } from '@hanfani/integrations/gmail/create-draft'
```

A Gmail skill for agents ships under `skills/gmail`.

## License

[MIT](./LICENSE) License © [Fruitizz](https://github.com/fruitizz)

<!-- Badges -->

[build-src]: https://img.shields.io/github/actions/workflow/status/fruitizz/hanfani-integrations/ci.yml?branch=main&style=flat&colorA=080f12&colorB=1fa669&label=build
[build-href]: https://github.com/fruitizz/hanfani-integrations/actions/workflows/ci.yml
[npm-version-src]: https://img.shields.io/npm/v/@hanfani/integrations?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@hanfani/integrations
[npm-downloads-src]: https://img.shields.io/npm/dm/@hanfani/integrations?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@hanfani/integrations
[size-src]: https://img.shields.io/npm/unpacked-size/@hanfani/integrations?style=flat&colorA=080f12&colorB=1fa669&label=size
[size-href]: https://www.npmjs.com/package/@hanfani/integrations
[license-src]: https://img.shields.io/github/license/fruitizz/hanfani-integrations.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/fruitizz/hanfani-integrations/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/@hanfani/integrations
