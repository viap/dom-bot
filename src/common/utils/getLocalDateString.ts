export function getLocalDateString(timestamp?: number | string) {
  return new Date(timestamp || Date.now()).toLocaleDateString("ru")
}
