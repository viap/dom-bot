export function getValueByKey(type: any, value: string) {
  return Object.entries(type).find(([key, val]) => key === value)?.[1]
}
