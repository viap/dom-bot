export function getLocalTimeString(timestamp?: number) {
  return new Date(timestamp || Date.now()).toLocaleTimeString("ru")
}
