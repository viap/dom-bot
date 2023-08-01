export function getValueByKey(type: any, value: string) {
  return Object.entries(type).find(([key]) => key === value)?.[1]
}
