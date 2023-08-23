export function getCurrentTimeString(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("ru")
}
