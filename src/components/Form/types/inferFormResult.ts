import { FORM_INPUT_TYPES } from "../enums/formInputTypes"
import { FormInputProps } from "./formInputProps"

// Maps form input types to TypeScript types
type InputTypeToTSType<T extends FORM_INPUT_TYPES> =
  T extends FORM_INPUT_TYPES.STRING
    ? string
    : T extends FORM_INPUT_TYPES.NUMBER
    ? number
    : T extends FORM_INPUT_TYPES.FLOAT
    ? number
    : T extends FORM_INPUT_TYPES.BOOLEAN
    ? boolean
    : T extends FORM_INPUT_TYPES.SELECT
    ? unknown
    : T extends FORM_INPUT_TYPES.DATE
    ? string
    : never

// Extracts the result type from a single input configuration
type ExtractInputResult<T extends FormInputProps> = {
  [K in T["name"]]: T["optional"] extends true
    ? InputTypeToTSType<T["type"]> | undefined
    : InputTypeToTSType<T["type"]>
}

// Merges multiple input results into a single result type
type MergeInputResults<T extends readonly FormInputProps[]> =
  T extends readonly [infer First, ...infer Rest]
    ? First extends FormInputProps
      ? Rest extends readonly FormInputProps[]
        ? ExtractInputResult<First> & MergeInputResults<Rest>
        : ExtractInputResult<First>
      : unknown
    : unknown

// Main utility type that infers the result type from inputs array
export type InferFormResult<T extends readonly FormInputProps[]> =
  MergeInputResults<T>

// Alternative simpler approach using mapped types
export type InferFormResultSimple<T extends readonly FormInputProps[]> = {
  [K in T[number]["name"]]: Extract<T[number], { name: K }> extends infer Input
    ? Input extends FormInputProps
      ? Input["optional"] extends true
        ? InputTypeToTSType<Input["type"]> | undefined
        : InputTypeToTSType<Input["type"]>
      : never
    : never
}
