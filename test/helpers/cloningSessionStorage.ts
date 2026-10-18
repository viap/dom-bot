import { StorageAdapter } from "grammy"

export class CloningSessionStorage<T> implements StorageAdapter<T> {
  private readonly values = new Map<string, T>()

  read(key: string): T | undefined {
    const value = this.values.get(key)
    return value === undefined ? undefined : structuredClone(value)
  }

  write(key: string, value: T): void {
    this.values.set(key, structuredClone(value))
  }

  delete(key: string): void {
    this.values.delete(key)
  }
}
