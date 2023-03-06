export type Item = {
  key: string
  content: string
  click?: () => void
  items: Array<Item>
}

export type MenuProps = {
  items?: Array<Item>
}

export class Menu {
  items: Array<Item>

  constructor({ items = [] }: MenuProps) {
    this.items = items
  }

  static showItems(items: Array<Item>) {
    return items.forEach((item) => {
      return Menu.renderItem(item)
    })
  }

  static renderItem(item: Item) {
    return item.content
  }

  show(itemKey?: string) {
    return Menu.showItems(this.getItems(itemKey))
  }

  getItems(itemKey?: string) {
    const curItem = this.findItem(itemKey || "")
    const items = curItem?.items || this.items
    return items
  }

  findItem(itemKey: string) {
    return this.items.find((item) => item.key === itemKey)
  }

  addItem(item: Item) {
    return this.items.push(item)
  }

  removeItem(itemKey: string) {
    const index = this.items.findIndex((item) => item.key === itemKey)
    if (index) {
      this.items.slice(index, 1)
    }
    return this.items
  }

  itemClick(itemKey: string) {
    const curItem = this.findItem(itemKey)
    if (curItem) {
      if (curItem.click) {
        curItem.click()
      } else {
        this.show(itemKey)
      }
    }
  }
}
