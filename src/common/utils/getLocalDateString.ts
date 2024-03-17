export function getLocalDateString(timestamp?: number) {
  return new Date(timestamp || Date.now()).toLocaleDateString("ru")
}
