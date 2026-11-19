import { Component, computed, input } from '@angular/core';
import { Breadcrumb } from '@openng/optimus-ui/breadcrumb';
import type { WjMenuItem } from 'weeljack-ng';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _toOptimusMenuModel,
  _wjStrings,
} from 'weeljack-ng/private';
import type { WjBreadcrumbPt } from './breadcrumb-types';

/** The parts of an item that decide whether its link is a Tab stop. */
interface LinkState {
  disabled?: boolean;
  url?: string;
  routerLink?: unknown;
}

/**
 * The attributes a link needs beyond Optimus's own. A disabled link keeps its `href` and stays a
 * Tab stop in Optimus, so it is announced disabled and taken out; a current page with no link is
 * not interactive, so it is taken out. Any other link gets no key: `undefined` would remove
 * Optimus's `tabindex`.
 */
function linkAttributes(item: LinkState | undefined, current: boolean): Record<string, string> {
  if (item?.disabled) {
    return { 'aria-disabled': 'true', tabindex: '-1' };
  }
  return current && !item?.url && !item?.routerLink ? { tabindex: '-1' } : {};
}

/**
 * Where the current page sits in the site's hierarchy, as a trail of links, over Optimus's
 * `p-breadcrumb`. Describe the trail as `WjMenuItem` objects in `model` and the first link as
 * `home`: without a `label` it draws a house glyph, named "Home". The last visible item is the
 * current page (`aria-current="page"`): give every other item a `url` or `routerLink`, because an
 * item with only a `command` is not a link the keyboard can follow. The trail sits in a `nav`
 * landmark named by `ariaLabel`. With no `home` and no visible items, nothing renders.
 */
@Component({
  selector: 'wj-breadcrumb',
  imports: [Breadcrumb],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class WjBreadcrumb {
  /**
   * The trail, in order. Replace the array to change it: it is read when it changes, not watched.
   * Your objects are never changed.
   */
  readonly model = input<WjMenuItem[]>([]);
  /** The first link, before the trail. Without a `label` it draws a house glyph. */
  readonly home = input<WjMenuItem>();
  /**
   * Name of the home link. Left unset, a home item without a `label` is named "Home" (from the
   * translation); a visible `label` already names the link.
   */
  readonly homeAriaLabel = input<string>();
  /** Name of the `nav` landmark. Left unset, "Breadcrumb" (from the translation). */
  readonly ariaLabel = input<string>();
  /**
   * Pass-through for the trail's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjBreadcrumbPt>();

  private readonly strings = _wjStrings();

  /**
   * What Optimus gets, rebuilt only when an input changes. Hidden items are left out, and no
   * `model` is passed when none is left: Optimus draws a separator after `home` whenever `model` is
   * set, and after every item but the last one in the array, so a hidden last item would leave a
   * dangling chevron.
   */
  protected readonly shown = computed(() => {
    const items = _toOptimusMenuModel(this.model()).items.filter((item) => item.visible !== false);
    const home = this.home();
    const [mapped] = _toOptimusMenuModel(home === undefined ? [] : [home]).items;
    const visibleHome = mapped?.visible === false ? undefined : mapped;
    return {
      items: items.length > 0 ? items : undefined,
      home: visibleHome,
      homeAriaLabel:
        this.homeAriaLabel() ?? (visibleHome?.label ? undefined : this.strings('home')),
    };
  });

  /**
   * `pt` forwarded as given, plus the landmark's name routed to the `nav` and, on every link, the
   * Tab-stop state of {@link linkAttributes}. Optimus calls the function `itemLink` part per link
   * with `context.item`, and for the home link with no context.
   */
  protected readonly partAttributes = computed<WjBreadcrumbPt>(() => {
    const routed = _mergePartAttributes(this.pt(), 'root', {
      'aria-label': this.ariaLabel() ?? this.strings('breadcrumb'),
    });
    const { items, home } = this.shown();
    const current = items?.at(-1);
    return (context) => {
      const pt = routed(context);
      const own = pt.itemLink;
      return {
        ...pt,
        itemLink: (options) => {
          const attributes = typeof own === 'function' ? own(options) : own;
          const picked: unknown = Reflect.get(
            Object(Reflect.get(Object(options), 'context')),
            'item',
          );
          const item =
            picked === undefined ? home : items?.find((candidate) => candidate === picked);
          return {
            ...(typeof attributes === 'string' ? { class: attributes } : attributes),
            ...linkAttributes(item, item !== undefined && item === current),
          };
        },
      };
    };
  });

  constructor() {
    _checkWeeljackSetup('wj-breadcrumb');
    _checkAriaOnHost(
      'wj-breadcrumb',
      'Use the ariaLabel input to name the landmark and homeAriaLabel to name the home link',
    );
  }
}
