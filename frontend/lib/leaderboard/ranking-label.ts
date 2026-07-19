/**
 * Human-readable ranking basis labels from the backend string.
 * Does not invent weekly/league periods.
 */

export function formatRankingBasis(rankingBasis: string): string {
  if (rankingBasis === 'total_xp') {
    return 'Ranked by total XP'
  }
  return `Ranked by ${rankingBasis.replace(/_/g, ' ')}`
}
