import { Keyboard } from "grammy"
import { MenuProps } from "../../models/Menu"

export class MenuBlock {
  private current: MenuProps
  private previous?: MenuProps
  private next?: MenuProps

  private menu: MenuProps

  constructor(menu: MenuProps) {
    this.menu = menu
    this.current = menu
  }

  selectItem(itemName: string) {
    let stack = [...this.menu.children]

    if (!itemName) {
      this.current = this.menu
      return
    }

    while (stack.length) {
      const item = stack.pop()

      if (item) {
        if (item.name === itemName) {
          this.current = item
          stack = []

          break
        }

        if (item.children.length) {
          stack.push(...item.children)
        }
      }
    }
  }

  getCurrent(): MenuProps {
    return this.current
  }

  getName(): string {
    return this.current.name
  }

  getKeyboard(): Keyboard {
    const buttons = new Keyboard().oneTime()

    const children = this.current?.children || []

    children
      .sort((child: MenuProps) => child.order)
      .forEach((child: MenuProps) => {
        buttons.add(child.name).row()
      })

    if (this.previous) {
      buttons.add("Назад").row()
    }
    if (this.next) {
      buttons.add("Вперед").row()
    }

    return buttons
  }
}
