/**
 * Whether the pass-through `context` Optimus hands a function-form part describes a row with `key`
 * set (`disabled`, `optionGroup`, `active`, `selected`, ...). Optimus's types do not declare
 * `context`, so it is narrowed through `Reflect.get(Object(...))`, with no cast; anything that is
 * not an object with `context[key] === true` is `false`.
 *
 * @docs-private
 */
export function _ptContextFlag(options: unknown, key: string): boolean {
  return Reflect.get(Object(Reflect.get(Object(options), 'context')), key) === true;
}
