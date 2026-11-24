import errorsJson from '../../../generated/errors.json';

/** One wording of a code's message, with the selectors that raise it. */
export interface ErrorVariant {
  /** The selector the sample message names. */
  selector: string;
  selectors: string[];
  what: string;
  fix: string;
  /** 21 Q8's line, as a dev warning prints it. `…` stands for text filled in at run time. */
  message: string;
}

/** One `WJ<NNNN>` code, as `scripts/extract-errors.mjs` writes it. */
export interface ErrorEntry {
  code: string;
  /** Raised through `_checkWeeljackSetup`: every WeeljackNg component can raise it. */
  everyComponent: boolean;
  callSites: number | null;
  selectors: string[];
  variants: ErrorVariant[];
  /** Set when the advice differs per component (`WJ0003`): what a component without its own gets. */
  defaultFix: string | null;
  /** Set with `defaultFix`: each component and the advice for it. */
  components: { selector: string; fix: string }[] | null;
}

export const ERROR_ENTRIES: readonly ErrorEntry[] = errorsJson.codes;

/** A sentence as the page shows it: capital first letter, closing full stop. */
export function sentence(text: string): string {
  const head = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.…?!]$/.test(head) ? head : `${head}.`;
}
