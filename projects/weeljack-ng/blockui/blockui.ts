import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { BlockUI } from '@openng/optimus-ui/blockui';
import { _checkWeeljackSetup, _mergePartAttributes, _wjId } from 'weeljack-ng/private';
import type { WjBlockUIPt } from './blockui-types';

/**
 * Covers a region, or the page, while it is busy: the pointer and the keyboard cannot reach it.
 * Optimus's mask blocks only the pointer, so while `blocked` the region's content is also
 * `inert` and the region is `aria-busy`. Put the message on a surface card inside it: text
 * straight on the mask is too faint in light mode. The mask's content is not announced, so tell
 * the user the status yourself. Block a static or relatively positioned element: Optimus leaves
 * `position: relative` on its target.
 */
@Component({
  selector: 'wj-blockui',
  imports: [BlockUI],
  templateUrl: './blockui.html',
  styleUrl: './blockui.css',
  host: { '[attr.data-wj-blockui]': 'id' },
})
export class WjBlockUI {
  /** Whether the region is covered. */
  readonly blocked = input(false, { transform: booleanAttribute });
  /** The element to cover. With none, the whole page is blocked. */
  readonly target = input<HTMLElement>();
  /**
   * Pass-through for the block UI's parts. Tracks Optimus: its part names and attributes follow
   * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes
   * to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjBlockUIPt>();

  /** Links the host to its mask, which Optimus moves out of it: the harness reads it. */
  protected readonly id = _wjId('blockui');
  /** Optimus wants a component with `getBlockableElement()`: any element will do. */
  protected readonly blockable = computed(() => {
    const element = this.target();
    return element && { getBlockableElement: () => element };
  });
  protected readonly partAttributes = computed<WjBlockUIPt>(() =>
    _mergePartAttributes(this.pt(), 'root', { 'data-wj-blockui': this.id }),
  );

  private readonly mask = viewChild.required<BlockUI, ElementRef<HTMLElement>>(BlockUI, {
    read: ElementRef,
  });
  private moved: HTMLElement | undefined;

  constructor() {
    _checkWeeljackSetup('wj-blockui');
    const document = inject(DOCUMENT);

    // Runs after Optimus has moved its mask in, in a browser only. The cleanup runs on unblock
    // and on destroy: it removes only what was set here, so an app's own `inert` stays.
    afterRenderEffect((onCleanup) => {
      if (!this.blocked()) {
        return;
      }
      const region = this.target() ?? document.body;
      const mask = this.mask().nativeElement;
      const focused = document.activeElement;
      const busy = region.getAttribute('aria-busy');
      const covered = Array.from(region.children).filter(
        (child) => child !== mask && !child.hasAttribute('inert'),
      );
      this.moved = mask;
      for (const child of covered) {
        child.setAttribute('inert', '');
      }
      region.setAttribute('aria-busy', 'true');

      onCleanup(() => {
        for (const child of covered) {
          child.removeAttribute('inert');
        }
        if (busy === null) {
          region.removeAttribute('aria-busy');
        } else {
          region.setAttribute('aria-busy', busy);
        }
        // Focus inside the region was lost when it went inert: give it back, unless the user
        // has put it somewhere else since.
        const active = document.activeElement;
        if (
          focused instanceof HTMLElement &&
          focused.isConnected &&
          !focused.closest('[inert]') &&
          (!active || active === document.body || mask.contains(active))
        ) {
          focused.focus();
        }
      });
    });

    // Optimus moves its element into the target or `document.body` and leaves it there when this
    // host goes: take it away, or the mask outlives its owner. Optimus itself releases the scroll lock.
    inject(DestroyRef).onDestroy(() => {
      this.moved?.remove();
    });
  }
}
