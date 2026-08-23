export type MatchQuality = 'Excellent Match' | 'Good Match' | 'Moderate Match'

export function getMatchQuality(score: number): MatchQuality {
  if (score >= 75) return 'Excellent Match'
  if (score >= 50) return 'Good Match'
  return 'Moderate Match'
}
