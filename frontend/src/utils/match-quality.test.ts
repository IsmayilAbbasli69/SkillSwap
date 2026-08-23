import { describe, expect, it } from 'vitest'
import { getMatchQuality } from './match-quality'

describe('getMatchQuality', () => {
  it.each([
    [100, 'Excellent Match'],
    [75, 'Excellent Match'],
    [74, 'Good Match'],
    [50, 'Good Match'],
    [49, 'Moderate Match'],
  ])('classifies a score of %i', (score, quality) => {
    expect(getMatchQuality(score)).toBe(quality)
  })
})
