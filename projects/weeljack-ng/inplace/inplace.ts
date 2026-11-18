import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { Inplace } from '@openng/optimus-ui/inplace';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _focusIntoOverlay,
  _mergePartAttributes,
  _overlayCloseLabel,
} from 'weeljack-ng/private';
import { WjInplaceContentSlot, WjInplaceDisplaySlot } from './inplace-slots';
import type { WjInplaceContentContext, WjInplacePt } from './inplace-types';

/**
 * A value that turns into an editor or more content when activated, over Optimus's `p-inplace`.
 * Fill both slots: `wjInplaceDisplay` is what shows first (a button, named by its content or by
 * `ariaLabel`) and `wjInplaceContent` replaces it while `active`. Clicking, Enter or Space on the
 * display activates it, and `closable` adds a close button. `active` is two-way and reports every
 * switch, a user's or the app's. After a user switch focus moves into the content, or back to the
 * display; setting `active` from the app moves no focus. Both slots are read at first render.
 */
@Component({
  selector: 'wj-inplace',
  imports: [Inplace, NgTemplateOutlet],
  templateUrl: './inplace.html',
  styleUrl: './inplace.css',
  host: {
    '(keydown)': 'space($event)',
    '[attr.data-wj-closable]': 'closable() || null',
    '[attr.data-wj-disabled]': 'disabled() || null',
  },
})
export class WjInplace {
  /** Whether the content shows in place of the display. Two-way: `[(active)]`. */
  readonly active = model(false);
  /** Shows a close button beside the content. Its name is the translation's `aria.close`. */
  readonly closable = input(false, { transform: booleanAttribute });
  /** Blocks every way of switching. The display stays a Tab stop and is announced as disabled. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible name of the display, for when its content is not a name. */
  readonly ariaLabel = input<string>();
  /** Id of the element or elements that name the display. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element or elements that describe the display. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the component's parts, including the close button as `pcButton`. Tracks
   * Optimus: its part names and attributes follow the installed `@openng/optimus-ui` minor and are
   * outside this component's stable API; changes to them ship only in the release that takes a new
   * Optimus minor and are not breaking.
   */
  readonly pt = input<WjInplacePt>();

  protected readonly displaySlot = contentChild.required(WjInplaceDisplaySlot);
  protected readonly contentSlot = contentChild.required(WjInplaceContentSlot);

  private readonly inner = viewChild(Inplace);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly closeLabel = _overlayCloseLabel();

  /** What the content template gets: `close` goes through Optimus, which refuses while disabled. */
  protected readonly context: WjInplaceContentContext = {
    close: () => {
      this.inner()?.deactivate();
    },
  };

  /**
   * `pt` forwarded as given, plus what this wrapper routes (FR-28's gap fixes): the ARIA inputs
   * and `aria-disabled` on the display, `tabindex="-1"` on the content so focus can land there,
   * and on the close button's real `button` (Optimus draws it with no name, as a filled primary
   * square): its name, and the classes that make it a round secondary text button. The classes
   * replace a consumer `class` on `pcButton.root`; every other key of theirs is kept.
   */
  protected readonly partAttributes = computed<WjInplacePt>(() => {
    const display = _mergePartAttributes(this.pt(), 'display', {
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.ariaLabelledBy(),
      'aria-describedby': this.ariaDescribedBy(),
      'aria-disabled': this.disabled() ? 'true' : undefined,
    });
    const content = _mergePartAttributes(display, 'content', { tabindex: '-1' });
    return _mergePartAttributes(content, 'pcButton.root', {
      'aria-label': this.closeLabel,
      class: 'p-button-secondary p-button-text p-button-rounded',
    });
  });

  constructor() {
    _checkWeeljackSetup('wj-inplace');
    _checkAriaOnHost('wj-inplace');
  }

  /**
   * Optimus emits only for a switch the user made (click, Enter, the close button or `close()`),
   * never for one the app made through `active`, so this is the one place focus may move.
   */
  protected switched(active: boolean): void {
    this.active.set(active);
    afterNextRender(
      () => {
        const part = this.host.querySelector<HTMLElement>(
          `[data-pc-section="${active ? 'content' : 'display'}"]`,
        );
        if (active) {
          _focusIntoOverlay(part, [part?.querySelector<HTMLElement>('[data-wj-part="inplace"]')]);
        } else {
          part?.focus();
        }
      },
      { injector: this.injector },
    );
  }

  /** Optimus activates on Enter only: Space on the display activates too, and does not scroll. */
  protected space(event: KeyboardEvent): void {
    if (
      event.code === 'Space' &&
      event.target instanceof HTMLElement &&
      event.target.dataset['pcSection'] === 'display'
    ) {
      event.preventDefault();
      this.inner()?.activate(event);
    }
  }
}
