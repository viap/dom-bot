export function getLocalTimeString(timestamp?: number | string) {
  return new Date(timestamp || Date.now()).toLocaleTimeString("ru")
}
