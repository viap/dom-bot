import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const mode = process.argv[2] || "unit"
const roots = ["src", "test"]
const integrationSuffix = ".integration.test.ts"
const testSuffix = ".test.ts"
const validModes = new Set(["unit", "integration", "all"])

if (!validModes.has(mode)) {
  console.error(
    `[run-tests] Unknown mode "${mode}". Use unit, integration, or all.`
  )
  process.exit(1)
}

function listFiles(dir) {
  let entries

  try {
    entries = readdirSync(dir)
  } catch (error) {
    console.error(`[run-tests] Cannot read expected test root "${dir}".`)
    console.error(error)
    process.exit(1)
  }

  return entries.flatMap((name) => {
    const path = join(dir, name)
    let stat

    try {
      stat = statSync(path)
    } catch (error) {
      console.error(`[run-tests] Cannot inspect "${path}".`)
      console.error(error)
      process.exit(1)
    }

    return stat.isDirectory() ? listFiles(path) : [path]
  })
}

const files = roots
  .flatMap(listFiles)
  .filter((file) => file.endsWith(testSuffix))
  .filter((file) => {
    const isIntegration = file.endsWith(integrationSuffix)
    if (mode === "integration") return isIntegration
    if (mode === "all") return true
    return !isIntegration
  })
  .sort()

if (!files.length) {
  console.error(`[run-tests] No ${mode} test files found.`)
  process.exit(1)
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...files],
  {
    stdio: "inherit",
  }
)

if (result.error) {
  console.error("[run-tests] Failed to launch Node test runner.")
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
