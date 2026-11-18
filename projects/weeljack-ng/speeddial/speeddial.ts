import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
  numberAttribute,
  runInInjectionContext,
} from '@angular/core';
import { SpeedDial } from '@openng/optimus-ui/speeddial';
import type { WjMenuItem } from 'weeljack-ng';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _toOptimusMenuModel,
  _warnOnce,
  _wjStrings,
} from 'weeljack-ng/private';
import { WjSpeedDialItemSlot } from './speeddial-slots';
import type { WjSpeedDialDirection, WjSpeedDialPt, WjSpeedDialType } from './speeddial-types';

/** Optimus gives a part function the item's state as `context` (it types only `instance`). */
function isHidden(options: unknown): boolean {
  const context =
    typeof options === 'object' && options !== null && 'context' in options ? options.context : 0;
  return (
    typeof context === 'object' &&
    context !== null &&
    'hidden' in context &&
    context.hidden === true
  );
}

/**
 * A floating button that opens a set of icon actions, over Optimus's `p-speeddial`. Describe the
 * actions as `WjMenuItem` objects in `model` (the `label` names an action and `command` runs it; a
 * link or children do nothing here) and draw each icon in a `wjSpeedDialItem` template. The toggle
 * is named "Actions" unless you set `ariaLabel` or `ariaLabelledBy`. The closed actions keep their
 * space, so the host is not positioned for you: put it out of flow, with `position: fixed` or
 * `absolute`, anchored at the toggle. Items with `visible: false` are left out.
 */
@Component({
  selector: 'wj-speeddial',
  imports: [SpeedDial, NgTemplateOutlet],
  templateUrl: './speeddial.html',
  styleUrl: './speeddial.css',
})
export class WjSpeedDial {
  /**
   * The actions. Replace the array to change the dial: it is read when it changes, not watched.
   * Your objects are never changed. Every action needs a `label`, its only name.
   */
  readonly model = input<WjMenuItem[]>([]);
  /** Whether the actions are open. Two-way. */
  readonly visible = model(false);
  /** The side the actions open toward. The diagonals are for `quarter-circle` only. */
  readonly direction = input<WjSpeedDialDirection>('up');
  /** How the actions are laid out: in a line, or around the toggle on a circle, half or quarter. */
  readonly type = input<WjSpeedDialType>('linear');
  /** Radius in px of the circle types. `0` gives each action 20 px. */
  readonly radius = input(0, { transform: numberAttribute });
  /** Makes the toggle inert, so the actions cannot open. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible name of the toggle. Left unset, "Actions" (from the translation). */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the toggle. Set on the toggle. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the toggle. Set on the toggle. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the dial's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjSpeedDialPt>();

  protected readonly strings = _wjStrings();
  protected readonly itemSlot = contentChild(WjSpeedDialItemSlot);

  /**
   * The visible items as Optimus items, rebuilt only when the app passes a new array. Optimus draws
   * every item and its Enter key finds the item in `model` by its position in the page, so the
   * hidden ones are left out of a new array before the mapper copies it.
   */
  protected readonly mapped = computed(() =>
    _toOptimusMenuModel(this.model().filter((item) => item.visible !== false)),
  );

  /**
   * `pt` forwarded as given, plus the description routed to the toggle, and what Optimus 2.0.2
   * does not do itself: closed actions are only scaled to zero, so each is made `inert` while
   * Optimus reports it hidden.
   */
  protected readonly partAttributes = computed<WjSpeedDialPt>(() => {
    const own = _mergePartAttributes(this.pt(), 'pcButton.root', {
      'aria-describedby': this.ariaDescribedBy(),
    });
    return (context) => {
      const pt = own(context);
      const { item } = pt;
      return {
        ...pt,
        item: (options) => {
          const given = typeof item === 'function' ? item(options) : item;
          const attributes = typeof given === 'string' ? { class: given } : given;
          return {
            ...attributes,
            inert: isHidden(options) ? true : undefined,
            'aria-controls': undefined,
          };
        },
      };
    };
  });

  constructor() {
    _checkWeeljackSetup('wj-speeddial');
    _checkAriaOnHost(
      'wj-speeddial',
      'Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input to name the toggle',
    );
    const injector = inject(Injector);
    afterNextRender(() => {
      if (ngDevMode && this.model().length > 0 && !this.itemSlot()) {
        runInInjectionContext(injector, () => {
          _warnOnce(
            'WJ0141',
            'wj-speeddial',
            'the speed dial has items but no wjSpeedDialItem template, so every action draws an empty button',
            "Put an ng-template with wjSpeedDialItem inside wj-speeddial that draws the action's icon",
          );
        });
      }
    });
  }
}
