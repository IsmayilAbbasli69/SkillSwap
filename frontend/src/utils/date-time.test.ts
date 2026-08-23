import { describe, expect, it } from 'vitest'
import { localDateTimeToIso } from './date-time'

describe('localDateTimeToIso', () => {
  it('interprets datetime-local values in the browser local timezone', () => {
    const expected = new Date(2026, 7, 25, 14, 30, 0, 0).toISOString()
    expect(localDateTimeToIso('2026-08-25T14:30')).toBe(expected)
  })

  it.each(['', '2026-08-25', 'not-a-date', '2026-02-30T12:00', '2026-13-01T09:00'])(
    'rejects invalid local datetime %s',
    (value) => {
      expect(localDateTimeToIso(value)).toBeNull()
    },
  )
})
