/**
 * WeeljackNg's own UI strings, read through `Optimus.getTranslation('wj')`. Every key is part of
 * the contract later components read, so none is renamed.
 */
export interface WjOwnStrings {
  /** The password mask's "show" button label. */
  showPassword?: string;
  /** The password mask's "hide" button label. */
  hidePassword?: string;
  /** The breadcrumb's navigation landmark name, when the app sets no `ariaLabel`. */
  breadcrumb?: string;
  /** The breadcrumb's home link name, when the home item has no label. */
  home?: string;
  /** The split button's menu button name, when the app sets no `expandAriaLabel`. */
  moreActions?: string;
  /** The speed dial's toggle name, when the app sets no `ariaLabel`. */
  actions?: string;
  /**
   * The name of each `wj-inputotp` input; `{0}` is replaced by the input's position, counting from
   * 1.
   */
  otpCharacter?: string;
  /** `wj-fileupload`'s message for a file over `maxFileSize`, first part; `{0}` is the file name. */
  invalidFileSizeSummary?: string;
  /** The second part of that message; `{0}` is the largest size allowed, such as `1.000 MB`. */
  invalidFileSizeDetail?: string;
  /** `wj-fileupload`'s message for a file `accept` rejects, first part; `{0}` is the file name. */
  invalidFileTypeSummary?: string;
  /** The second part of that message; `{0}` is the `accept` list. */
  invalidFileTypeDetail?: string;
  /** `wj-fileupload`'s message for more files than `fileLimit`, first part. */
  invalidFileLimitSummary?: string;
  /** The second part of that message; `{0}` is the `fileLimit`. */
  invalidFileLimitDetail?: string;
  /** The name of `wj-terminal`'s command input, when the app sets no `ariaLabel` or `ariaLabelledBy`. */
  terminalCommand?: string;
  /** `wj-togglebutton`'s label while it is on, when the app sets no `onLabel`. */
  toggleOn?: string;
  /** `wj-togglebutton`'s label while it is off, when the app sets no `offLabel`. */
  toggleOff?: string;
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
