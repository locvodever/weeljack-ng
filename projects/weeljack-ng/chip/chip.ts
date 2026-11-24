import {
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { Chip } from '@openng/optimus-ui/chip';
import { Optimus } from '@openng/optimus-ui/config';
import { TimesCircleIcon } from '@openng/optimus-ui/icons/timescircle';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _WJ_EN,
  _wjId,
} from 'weeljack-ng/private';
import type { WjChipPt } from './chip-types';

/**
 * A compact label, with an optional photo and an optional remove button, over Optimus's `p-chip`.
 * The remove button is a native `<button type="button">` named from the translation
 * (`aria.removeLabel`) and described by the label: it is the chip's only Tab stop. The chip never
 * hides itself: drop it from your list in `(removed)`, and move focus yourself. Content you project
 * (an icon, say) renders before the label; mark a decorative icon `aria-hidden`.
 */
@Component({
  selector: 'wj-chip',
  imports: [Chip, TimesCircleIcon],
  templateUrl: './chip.html',
  styleUrl: './chip.css',
  // The stylesheet styles Optimus's own elements, which an emulated scope cannot reach.
  encapsulation: ViewEncapsulation.None,
})
export class WjChip {
  /** Text of the chip. Rendered as text, never as HTML. */
  readonly label = input<string>();
  /** URL of the photo. A plain string, only ever set as the `src` of the photo's `img`. */
  readonly image = input<string>();
  /** Text alternative of the photo. Empty by default: the label names the chip. */
  readonly alt = input('');
  /** Disables the remove button: it leaves the Tab order and emits nothing. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shows a remove button. */
  readonly removable = input(false, { transform: booleanAttribute });
  /** Emits when the remove button is activated by click, Enter, Space or Backspace. */
  readonly removed = output();
  /** Emits when the photo fails to load. */
  readonly imageError = output<Event>();
  /**
   * Pass-through for the chip's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjChipPt>();

  protected readonly labelId = _wjId('chip-label');
  protected readonly removeLabel = removeLabel();

  /**
   * `pt` forwarded as given, plus two routed parts. The label gets the id the remove button is
   * described by. Optimus wraps the remove button in a `span` it makes a `role="button"` Tab stop
   * (and a click and Enter/Backspace target that hides the chip): that span is made inert here.
   */
  protected readonly partAttributes = computed<WjChipPt>(() =>
    _mergePartAttributes(
      _mergePartAttributes(this.pt(), 'label', { id: this.labelId }),
      'removeIcon',
      {
        role: null,
        tabindex: null,
        'aria-label': null,
      },
    ),
  );

  constructor() {
    _checkWeeljackSetup('wj-chip');
    _checkAriaOnHost(
      'wj-chip',
      'Remove it: the chip is named by its label, and its remove button by the translation',
    );
  }

  protected remove(event: Event): void {
    // Optimus's own click handler on the span around the button would hide the chip. A click on the
    // glyph of a disabled button still bubbles through it in some browsers, so check here too.
    event.stopPropagation();
    if (!this.disabled()) {
      this.removed.emit();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    // Enter reaches `remove` as the button's own click; Backspace is the one extra key.
    if (event.key === 'Enter' || event.key === 'Backspace') {
      event.stopPropagation();
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      this.removed.emit();
    }
  }
}

/** `aria.removeLabel` of the translation `provideWeeljack` fills, with the English default. */
function removeLabel(): string {
  const aria: unknown = inject(Optimus).getTranslation('aria');
  const label: unknown = Reflect.get(Object(aria), 'removeLabel');
  return typeof label === 'string' && label !== '' ? label : _WJ_EN.aria.removeLabel;
}
