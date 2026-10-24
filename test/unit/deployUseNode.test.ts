import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const LIB = fileURLToPath(
  new URL("../../scripts/deploy/lib.sh", import.meta.url)
)

// Runs use_node from a copy of lib.sh in a temp repo layout, with a stub
// `node` printing nodeVersion first on PATH and no nvm, so a real nvm on the
// machine cannot override the stub.
function runUseNode({
  nvmrc,
  nodeVersion,
}: {
  nvmrc?: string
  nodeVersion: string
}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "use-node-"))
  const deployDir = path.join(root, "scripts", "deploy")
  const binDir = path.join(root, "bin")
  fs.mkdirSync(deployDir, { recursive: true })
  fs.mkdirSync(binDir)
  fs.copyFileSync(LIB, path.join(deployDir, "lib.sh"))
  if (nvmrc !== undefined) fs.writeFileSync(path.join(root, ".nvmrc"), nvmrc)
  fs.writeFileSync(
    path.join(binDir, "node"),
    `#!/bin/sh\necho ${nodeVersion}\n`,
    { mode: 0o755 }
  )

  const result = spawnSync(
    "bash",
    ["-c", `source "${path.join(deployDir, "lib.sh")}"; use_node`],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        NVM_DIR: path.join(root, "no-nvm"),
        PATH: `${binDir}:/usr/bin:/bin`,
      },
    }
  )
  fs.rmSync(root, { recursive: true, force: true })
  return result
}

describe("deploy use_node", () => {
  it("passes when node matches the .nvmrc major", () => {
    const result = runUseNode({ nvmrc: "22\n", nodeVersion: "v22.23.4" })
    assert.equal(result.status, 0, result.stderr + result.stdout)
  })

  it("fails before any PM2 action on another major", () => {
    const result = runUseNode({ nvmrc: "22\n", nodeVersion: "v20.18.1" })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /Node\.js 22 required\. Got: v20\.18\.1/)
  })

  it("fails when .nvmrc is missing", () => {
    const result = runUseNode({ nodeVersion: "v22.23.4" })
    assert.notEqual(result.status, 0)
  })

  it("rejects a full version in .nvmrc (bare major only)", () => {
    const result = runUseNode({ nvmrc: "22.23.4\n", nodeVersion: "v22.23.4" })
    assert.notEqual(result.status, 0)
  })
})
