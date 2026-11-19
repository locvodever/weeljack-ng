import { expectNoAxeViolations } from './axe';

/**
 * The shared FR-12 assertions for a list wrapper whose "nothing to pick" row used to be exposed as
 * an option (autocomplete and select). Spec-only, like the rest of `spec-support/`.
 *
 * The wrapper's own announcer is the one `[data-wj-announcer]` element beside the Optimus
 * component: a visually hidden polite `role="status"`.
 */

const ANNOUNCER = '[data-wj-announcer]';

function required<E extends Element>(root: ParentNode, selector: string, type: new () => E): E {
  const found = root.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

/** The wrapper's own live region inside `host`. Throws when it is missing. */
export function announcerOf(host: ParentNode): HTMLElement {
  return required(host, ANNOUNCER, HTMLElement);
}

/** The announcer's text with surrounding white space removed. */
export function announcedText(host: ParentNode): string {
  return announcerOf(host).textContent.trim();
}

/** Asserts the announcer is a polite status region, and is not visually in the way. */
export function expectPoliteStatus(host: ParentNode): void {
  const region = announcerOf(host);
  expect(region.getAttribute('role')).toBe('status');
  expect(region.getAttribute('aria-live')).toBe('polite');
  const box = region.getBoundingClientRect();
  expect(box.width).toBeLessThanOrEqual(1);
  expect(box.height).toBeLessThanOrEqual(1);
}

/**
 * Asserts the open panel's empty row (`rowSelector`, inside `host`) has no `role="option"`, that
 * the wrapper's live region carries `text` while the panel is open, and that axe finds nothing in
 * `host`. Call it with the panel fully open; close the panel afterwards.
 */
export async function expectEmptyRowAnnounced(
  host: HTMLElement,
  rowSelector: string,
  text: string,
): Promise<void> {
  const row = required(host, rowSelector, HTMLElement);
  expect(row.getAttribute('role')).not.toBe('option');
  expect(row.textContent.trim()).toBe(text);
  expect(host.querySelectorAll('[role="option"]')).toHaveLength(0);
  expectPoliteStatus(host);
  await expect.poll(() => announcedText(host)).toBe(text);
  await expectNoAxeViolations(host);
}

/** Asserts the wrapper's live region is empty, as it is while the panel is closed. */
export async function expectAnnouncerEmpty(host: ParentNode): Promise<void> {
  await expect.poll(() => announcedText(host)).toBe('');
}
