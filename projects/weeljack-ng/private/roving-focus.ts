import { ElementRef, afterEveryRender, afterNextRender, inject } from '@angular/core';

/**
 * Gives a row of buttons one Tab stop and the keys of an APG toolbar or tab list (GF3 FR-8):
 *
 * | Key | Effect |
 * |---|---|
 * | Tab | Enters on one item and leaves on the next Tab |
 * | Arrow Right, Arrow Left | The next or previous item, wrapping at the ends |
 * | Home, End | The first or the last item |
 *
 * `items` lists the enabled items in order; it is read on every key and every render, so it may
 * query the host's DOM. Exactly one item has `tabindex="0"` and the rest `"-1"`: the item that has
 * focus, else `selected()` (such as the picked button), else the one that had focus last, else the
 * first. An item that leaves the list is made `"-1"`. Keys with Alt, Ctrl or Meta, keys another
 * handler prevented and keys whose target is not an item are left alone; there is no Up, Down or
 * right-to-left handling. The arrows move focus only: Enter and Space still act as they do.
 *
 * It marks the host `data-wj-roving`, so a host holding another roving row can leave that row's
 * items out of its own list. The listeners are added in `afterNextRender` to the host, so nothing
 * runs on the server and none needs removing. Must run in an injection context (the constructor):
 *
 * ```ts
 * _rovingFocus(() => [...host.querySelectorAll<HTMLElement>('button:not(:disabled)')]);
 * ```
 *
 * @docs-private
 */
export function _rovingFocus(
  items: () => readonly HTMLElement[],
  selected?: () => HTMLElement | undefined,
): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  let last: HTMLElement | undefined;
  let seen: readonly HTMLElement[] = [];
  host.setAttribute('data-wj-roving', '');

  const sync = (): void => {
    const list = items();
    const focused = list.find((item) => item === host.ownerDocument.activeElement);
    last = focused ?? last;
    const stop = [focused, selected?.(), last].find((item) => item && list.includes(item));
    for (const item of seen) if (!list.includes(item)) item.tabIndex = -1;
    for (const item of list) item.tabIndex = item === (stop ?? list[0]) ? 0 : -1;
    seen = list;
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const list = items();
    const at = list.findIndex((item) => item === event.target);
    const move = ['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key);
    if (at < 0 || move < 0) return;
    list.at(([at - 1, at + 1, 0, -1][move] ?? 0) % list.length)?.focus();
    event.preventDefault();
  };

  // The listeners sit on the host, which goes with the component: nothing to remove.
  afterNextRender(() => {
    host.addEventListener('focusin', sync);
    host.addEventListener('keydown', onKeyDown);
  });
  afterEveryRender(sync);
}
