import fs from "fs"
import { cwd } from "process"

export const TOKEN =  fs.readFileSync(cwd()+"/src/config/token",{encoding:'utf8'})