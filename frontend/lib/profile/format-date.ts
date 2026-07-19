/**
 * Localized date formatting for profile and achievements.
 * Never invents missing dates — callers must guard nulls.
 */

export function formatProfileDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return new Intl.DateTimeFormat(undefined, options).format(date)
}

export function formatEarnedAt(iso: string): string {
  return formatProfileDate(iso, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
