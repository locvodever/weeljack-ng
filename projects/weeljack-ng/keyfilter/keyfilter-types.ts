/**
 * The named patterns of `wjKeyFilter`. Each accepts only the characters it names:
 *
 * - `pint`: digits. `int`: digits and a leading minus.
 * - `pnum`: digits and the decimal point. `num`: the same, with a leading minus.
 * - `money`: digits, the decimal point, commas and spaces.
 * - `hex`: hexadecimal digits. `alpha`: letters and the underscore. `alphanum`: letters, digits
 *   and the underscore.
 * - `email`: letters, digits and `_ . - @`.
 *
 * Anything else is a `RegExp`, anchored over the whole text: `/^[a-z]*$/`.
 */
export type WjKeyFilterPattern =
  'pint' | 'int' | 'pnum' | 'money' | 'num' | 'hex' | 'email' | 'alpha' | 'alphanum';
