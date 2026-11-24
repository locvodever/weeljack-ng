import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Injector,
  afterNextRender,
  computed,
  contentChild,
  inject,
  input,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { Dock } from '@openng/optimus-ui/dock';
import type { WjMenuItem } from 'weeljack-ng';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _toOptimusMenuModel,
  _warnOnce,
  _wjId,
} from 'weeljack-ng/private';
import { WjDockItemSlot } from './dock-slots';
import type { WjDockPosition, WjDockPt } from './dock-types';

/**
 * A bar of icon shortcuts pinned to one edge of a container, over Optimus's `p-dock`. Describe it
 * as `WjMenuItem` objects in `model` and draw each icon in a `wjDockItem` template: the tile is
 * named by the item's `label`, which is never drawn, so every item needs a unique `label`. The
 * dock is positioned absolutely against the nearest positioned ancestor, so put it in a container
 * with `position: relative`. It is a `role="menu"`: give it `ariaLabel` or `ariaLabelledBy`. It is
 * rendered only in the browser: the server output is the empty host.
 */
@Component({
  selector: 'wj-dock',
  imports: [Dock, NgTemplateOutlet],
  templateUrl: './dock.html',
  styleUrl: './dock.css',
})
export class WjDock {
  /**
   * The items. Replace the array to change the dock: it is read when it changes, not watched.
   * Your objects are never changed. Every item needs a unique `label`.
   */
  readonly model = input<WjMenuItem[]>([]);
  /** The edge of the container the dock lies along. */
  readonly position = input<WjDockPosition>('bottom');
  /** Accessible name of the list. Set on the `role="menu"` element, not on the host. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the list. Set on the `role="menu"` element. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the list. Set on the `role="menu"` element. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the dock's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjDockPt>();

  private readonly id = _wjId('dock');
  protected readonly itemSlot = contentChild(WjDockItemSlot);

  /** Optimus's dock reads `window.matchMedia` unguarded, so it is created in the browser only. */
  protected readonly browser = signal(false);

  /**
   * The model as Optimus items, rebuilt only when the app passes a new array. Each copy gets an id
   * of this dock's own: Optimus ids tiles by index, so two docks would share `0`, `1`, ... A
   * disabled copy loses its `url`: Optimus would still draw a link a screen reader could follow,
   * and a focusable link inside its `aria-hidden` one.
   */
  protected readonly mapped = computed(() => {
    const mapped = _toOptimusMenuModel(this.model());
    mapped.items.forEach((copy, index) => {
      copy.id = `${this.id}-${String(index)}`;
      if (copy.disabled) {
        delete copy.url;
      }
    });
    return mapped;
  });

  /** `pt` forwarded as given, plus the description routed to the list. */
  protected readonly partAttributes = computed<WjDockPt>(() =>
    _mergePartAttributes(this.pt(), 'list', { 'aria-describedby': this.ariaDescribedBy() }),
  );

  constructor() {
    _checkWeeljackSetup('wj-dock');
    _checkAriaOnHost('wj-dock');
    const injector = inject(Injector);
    afterNextRender(() => {
      this.browser.set(true);
      if (ngDevMode && this.model().length > 0 && !this.itemSlot()) {
        runInInjectionContext(injector, () => {
          _warnOnce(
            'WJ0140',
            'wj-dock',
            'the dock has items but no wjDockItem template, so every item draws an empty tile',
            "Put an ng-template with wjDockItem inside wj-dock that draws the item's icon",
          );
        });
      }
    });
  }
}
