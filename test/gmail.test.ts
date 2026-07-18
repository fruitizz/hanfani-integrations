import { describe, it, expect } from 'vitest'
import { createDraft } from '../src/gmail/create-draft.mjs'
import { checkCredentials } from '../src/gmail/check-credentials.mjs'
import { listUnread } from '../src/gmail/list-unread.mjs'
import { getEmail } from '../src/gmail/get-email.mjs'
import { getLatestEmail } from '../src/gmail/get-latest-email.mjs'
import { markRead, trash, star } from '../src/gmail/modify.mjs'
import { auth } from '../src/gmail/auth.mjs'

describe('gmail integration surface', () => {
  it('exposes the read + effect functions', () => {
    for (const fn of [
      createDraft,
      checkCredentials,
      listUnread,
      getEmail,
      getLatestEmail,
      markRead,
      trash,
      star,
    ]) {
      expect(typeof fn).toBe('function')
    }
  })

  it('exposes the gmail auth spec', () => {
    expect(auth).toBeTruthy()
  })

  it('checkCredentials reports not-ok with the connect hint when no credential is provided', async () => {
    const health = await checkCredentials({})
    expect(health.ok).toBe(false)
    expect(health.hint).toContain('HANFANI_GOOGLE_CLIENT_ID')
  })
})
