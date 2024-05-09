export function convertHoursToMinutes(hours: string) {
  const [hour, minute] = hours.split(":").map(Number)

  return Math.floor(hour * 60 + minute)
}
