export function localDateTimeToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null

  const [, yearText, monthText, dayText, hourText, minuteText] = match
  const year = Number(yearText)
  const month = Number(monthText) - 1
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const localDate = new Date(year, month, day, hour, minute, 0, 0)

  const componentsWerePreserved =
    localDate.getFullYear() === year &&
    localDate.getMonth() === month &&
    localDate.getDate() === day &&
    localDate.getHours() === hour &&
    localDate.getMinutes() === minute

  return componentsWerePreserved ? localDate.toISOString() : null
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}
