/**
 * WeeljackNg's own UI strings, read through `Optimus.getTranslation('wj')`. Every key is part of
 * the contract later components read, so none is renamed.
 */
export interface WjOwnStrings {
  /** The password mask's "show" button label. */
  showPassword?: string;
  /** The password mask's "hide" button label. */
  hidePassword?: string;
}

/**
 * The UI strings `provideWeeljack` hands to Optimus: the keys the library's components read,
 * typed, plus an index signature so any Optimus-shaped translation passes. Merged one level deep
 * over the English default (top level, `aria` and `wj` each), so a partial object keeps every
 * other English string. `weeljack-ng/locale` ships complete `en` and `vi` objects.
 */
export interface WjTranslation {
  /** Shown when a list has no options. */
  emptyMessage?: string;
  /** Shown when a filter matches nothing. */
  emptyFilterMessage?: string;
  /** The password meter's prompt. */
  passwordPrompt?: string;
  /** The password meter's weak label. */
  weak?: string;
  /** The password meter's medium label. */
  medium?: string;
  /** The password meter's strong label. */
  strong?: string;
  /** Accessible names. */
  aria?: {
    close?: string;
    listLabel?: string;
    maximizeLabel?: string;
    minimizeLabel?: string;
    [key: string]: string | undefined;
  };
  /** WeeljackNg's own strings. */
  wj?: WjOwnStrings;
  [key: string]: unknown;
}
