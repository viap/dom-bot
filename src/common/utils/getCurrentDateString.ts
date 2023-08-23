export function getCurrentDateString(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("ru")
}
