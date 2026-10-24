import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, it } from "node:test"

// Error objects from axios and grammY carry request payloads (API client
// password, JWTs, chat ids, message text). Logs must go through
// getSafeErrorDetails instead of passing the raw error as the last argument.
const RAW_ERROR_LOG =
  /(?:conversation\.log|console\.(?:error|warn|log|info|debug))\((?:[^()]|\([^()]*\))*?,\s*(?:e|err|error|exception|exitError)\s*\)/g

function sourceFiles(dir: string): Array<string> {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      return sourceFiles(path)
    }
    return path.endsWith(".ts") && !path.endsWith(".test.ts") ? [path] : []
  })
}

describe("error logging", () => {
  it("never logs a raw error object", () => {
    const offenders = sourceFiles(join(process.cwd(), "src")).flatMap(
      (file) =>
        [...readFileSync(file, "utf8").matchAll(RAW_ERROR_LOG)].map(
          (match) => `${file}: ${match[0].replace(/\s+/g, " ")}`
        )
    )

    assert.deepEqual(offenders, [])
  })
})
