// import tsConfig from "../tsconfig.json" assert { type: "json" }
import tsConfigPaths from "tsconfig-paths"

const paths = {
  "@/*": ["./*"],
  "@common/*": ["common/*"],
}
const baseUrl = "./" // Either absolute or relative path. If relative it's resolved to current working directory.
const cleanup = tsConfigPaths.register({
  baseUrl,
  paths,
})

console.log("-------------------------")
console.log("baseUrl", baseUrl)
console.log("paths", paths)
console.log("-------------------------")

// When path registration is no longer needed
// cleanup()
