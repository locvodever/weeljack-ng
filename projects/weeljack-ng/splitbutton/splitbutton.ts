import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DOCUMENT,
  ElementRef,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  output,
} from '@angular/core';
import { SplitButton } from '@openng/optimus-ui/splitbutton';
import type { WjMenuItem } from 'weeljack-ng';
import {
  _OVERLAY_MOTION,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _toOptimusMenuModel,
  _wjStrings,
} from 'weeljack-ng/private';
import { WjSplitButtonContentSlot } from './splitbutton-slots';
import type {
  WjSplitButtonPt,
  WjSplitButtonSeverity,
  WjSplitButtonSize,
  WjSplitButtonVariant,
} from './splitbutton-types';

/**
 * A main action with a menu of related actions, over Optimus's `p-splitbutton`: the `label` button
 * emits `buttonClick`, and the chevron button next to it opens `model`, a list of `WjMenuItem`
 * objects (an item with `items` opens a submenu). The menu button is named "More actions" and so is
 * the popup. With no items the menu button is disabled. The popup opens on `body`, so a clipping
 * ancestor does not cut it off. Put an `<ng-template wjSplitButtonContent>` inside it to draw the
 * main button's content yourself, such as an icon beside the text.
 */
@Component({
  selector: 'wj-splitbutton',
  imports: [SplitButton, NgTemplateOutlet],
  templateUrl: './splitbutton.html',
  styleUrl: './splitbutton.css',
})
export class WjSplitButton {
  /**
   * The menu's items. Replace the array to change them: it is read when it changes, not watched.
   * Your objects are never changed.
   */
  readonly model = input<WjMenuItem[]>([]);
  /** Text of the main button. Rendered as text, never as HTML. */
  readonly label = input<string>();
  /** Colour role of both buttons. */
  readonly severity = input<WjSplitButtonSeverity>();
  /** Height step of both buttons. */
  readonly size = input<WjSplitButtonSize>();
  /** `outlined` or `text` fill instead of the solid one. */
  readonly variant = input<WjSplitButtonVariant>();
  /** Makes both buttons inert. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Where the popup renders. `'self'` keeps it inside the host, where a clipping ancestor can cut it. */
  readonly appendTo = input<'self' | 'body'>('body');
  /** Name of the menu button and of the popup. Left unset, "More actions" (from the translation). */
  readonly expandAriaLabel = input<string>();
  /** Accessible name of the main button when its visible content is not text. Set on the button. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the main button. Set on the button. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the main button. Set on the button. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the split button's parts. Tracks Optimus: its part names and attributes follow
   * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjSplitButtonPt>();
  /** Emits when the main button is clicked, not the menu button. */
  readonly buttonClick = output<MouseEvent>();
  /** Emits when the popup has opened. */
  readonly opened = output();
  /** Emits when the popup has closed, whatever closed it. */
  readonly closed = output();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly strings = _wjStrings();
  private shown = false;
  protected readonly contentSlot = contentChild(WjSplitButtonContentSlot);
  protected readonly motion = _OVERLAY_MOTION;

  /** The model as Optimus items, rebuilt only when the app passes a new array. */
  protected readonly mapped = computed(() => _toOptimusMenuModel(this.model()));

  protected readonly menuName = computed(
    () => this.expandAriaLabel() ?? this.strings('moreActions'),
  );

  /** Optimus's only route to the main button's `aria-label`. */
  protected readonly buttonProps = computed(() => {
    const ariaLabel = this.ariaLabel();
    return ariaLabel === undefined ? {} : { ariaLabel };
  });

  /**
   * The menu button is disabled with no items, and with `disabled`. Optimus's `disabled` setter also
   * writes `menuButtonDisabled`, but only when `disabled` changes, so a bound `true` that stays
   * `true` would be overwritten. The two spellings of "true" differ to Angular's change check and
   * coerce alike, so the binding is written again whenever `disabled` flips.
   */
  protected readonly menuDisabled = computed(() => {
    const off = this.disabled();
    return this.mapped().items.length === 0 ? (off ? true : 'true') : off;
  });

  /** `pt` forwarded as given, plus the ARIA routed to the main button and the popup's name. */
  protected readonly partAttributes = computed<WjSplitButtonPt>(() =>
    _mergePartAttributes(
      _mergePartAttributes(this.pt(), 'pcButton.root', {
        'aria-labelledby': this.ariaLabelledBy(),
        'aria-describedby': this.ariaDescribedBy(),
      }),
      'pcMenu.rootList',
      { 'aria-label': this.menuName() },
    ),
  );

  constructor() {
    _checkWeeljackSetup('wj-splitbutton');
    _checkAriaOnHost(
      'wj-splitbutton',
      'Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input to name the main button and expandAriaLabel to name the menu button',
    );
  }

  /** A popup has opened. */
  protected entered(): void {
    this.shown = true;
    this.opened.emit();
  }

  /**
   * Optimus says the popup is leaving twice: when it hides, and again once the leave motion has
   * ended. The first is `closed`. The second is where focus is put right: Optimus focuses the
   * element it was opened from, the host, which is not focusable, so focus ends on the closing list,
   * or on `body` once it is gone. Put it on the menu button. Focus that is somewhere else (Tab moved
   * on, an outside click on another control) stays.
   */
  protected left(): void {
    if (this.shown) {
      this.shown = false;
      this.closed.emit();
      return;
    }
    const { activeElement, body } = this.document;
    if (
      activeElement === null ||
      activeElement === body ||
      activeElement.closest('[role="menu"]')
    ) {
      this.host.querySelector<HTMLElement>('button[aria-haspopup]')?.focus();
    }
  }
}
