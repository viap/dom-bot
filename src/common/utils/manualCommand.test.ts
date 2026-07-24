import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { ROLES } from "@/common/enums/roles"
import { DEFAULT_BOT_COMMANDS } from "@/common/consts/botCommands"
import {
  EDITOR_MANUAL_LINK,
  PSYCHOLOGIST_MANUAL_LINK,
  hasManualCommandAccess,
  getManualInstructionText,
  getRoleAwareBotCommands,
} from "./manualCommand"

describe("manual command helpers", () => {
  it("does not add manual command or instruction links without eligible roles", () => {
    for (const role of [ROLES.USER, ROLES.ADMIN, ROLES.ACCOUNTANT]) {
      const commands = getRoleAwareBotCommands([role])

      assert.equal(hasManualCommandAccess([role]), false)
      assert.equal(
        commands.some(({ command }) => command === BOT_COMMANDS.MANUAL),
        false
      )
      assert.equal(getManualInstructionText([role]), undefined)
    }
  })

  it("adds manual command and editor instruction for editors", () => {
    const commands = getRoleAwareBotCommands([ROLES.EDITOR])
    const text = getManualInstructionText([ROLES.EDITOR])

    assert.equal(
      commands.some(({ command }) => command === BOT_COMMANDS.MANUAL),
      true
    )
    assert.equal(hasManualCommandAccess([ROLES.EDITOR]), true)
    assert.equal(text, `Инструкция для редакторов: ${EDITOR_MANUAL_LINK}`)
    assert.equal(text?.includes(PSYCHOLOGIST_MANUAL_LINK), false)
  })

  it("adds manual command and psychologist instruction for psychologists", () => {
    const commands = getRoleAwareBotCommands([ROLES.PSYCHOLOGIST])
    const text = getManualInstructionText([ROLES.PSYCHOLOGIST])

    assert.equal(
      commands.some(({ command }) => command === BOT_COMMANDS.MANUAL),
      true
    )
    assert.equal(hasManualCommandAccess([ROLES.PSYCHOLOGIST]), true)
    assert.equal(
      text,
      `Инструкция для психологов: ${PSYCHOLOGIST_MANUAL_LINK}`
    )
    assert.equal(text?.includes(EDITOR_MANUAL_LINK), false)
  })

  it("adds one manual command and both instructions for users with both roles", () => {
    const commands = getRoleAwareBotCommands([ROLES.EDITOR, ROLES.PSYCHOLOGIST])
    const text = getManualInstructionText([ROLES.EDITOR, ROLES.PSYCHOLOGIST])

    assert.equal(
      commands.filter(({ command }) => command === BOT_COMMANDS.MANUAL).length,
      1
    )
    assert.equal(
      text,
      [
        `Инструкция для редакторов: ${EDITOR_MANUAL_LINK}`,
        `Инструкция для психологов: ${PSYCHOLOGIST_MANUAL_LINK}`,
      ].join("\r\n\r\n")
    )
  })

  it("returns fresh command arrays without mutating the default commands", () => {
    const ineligibleCommands = getRoleAwareBotCommands([ROLES.USER])
    const eligibleCommands = getRoleAwareBotCommands([ROLES.EDITOR])
    const defaultCommandsLength = DEFAULT_BOT_COMMANDS.length

    ineligibleCommands.push({
      command: BOT_COMMANDS.MANUAL,
      description: "mutated",
    })
    eligibleCommands.pop()

    assert.equal(DEFAULT_BOT_COMMANDS.length, defaultCommandsLength)
    assert.equal(
      DEFAULT_BOT_COMMANDS.some(
        ({ command, description }) =>
          command === BOT_COMMANDS.MANUAL && description === "mutated"
      ),
      false
    )
  })
})
