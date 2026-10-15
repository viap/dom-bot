import { getTextOfData } from "@/common/utils/getTextOfData"

export function getTextOfRequisites(title = ""): string {
  return getTextOfData(
    title,
    {
      bank: "JSC TBC Bank",
      iban: "GE54TB7471136010100058",
      name: "P/E Vladislav Birilov",
    },
    {
      bank: "Beneficiary’s Bank",
      iban: "Beneficiary’s IBAN",
      name: "Name of Beneficiary",
    }
  )
}
