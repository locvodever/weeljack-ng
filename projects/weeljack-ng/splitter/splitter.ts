import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Injector,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  output,
  runInInjectionContext,
} from '@angular/core';
import { Splitter } from '@openng/optimus-ui/splitter';
import type { SplitterResizeEndEvent } from '@openng/optimus-ui/types/splitter';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _warnOnce,
} from 'weeljack-ng/private';
import { WjSplitterPanel } from './splitter-panel/splitter-panel';
import type { WjSplitterOrientation, WjSplitterPt, WjSplitterResizeEvent } from './splitter-types';

/** A share in percent; 0 for none, which Optimus reads as unset (an unset, NaN or negative input). */
const share = (value: number | undefined): number => (value !== undefined && value > 0 ? value : 0);

/**
 * Two or more panels the user resizes with the pointer or the keyboard, over Optimus's
 * `p-splitter`. Declare each panel as a `wj-splitter-panel` child: the splitter draws them in
 * order with a gutter between each pair, and a horizontal one needs only its panels' height. Name
 * the separators with `ariaLabel` or `ariaLabelledBy`. The panel set is read once, at first
 * render: render a new splitter to change it. Panels clip their content.
 */
@Component({
  selector: 'wj-splitter',
  imports: [Splitter, NgTemplateOutlet],
  templateUrl: './splitter.html',
  styleUrl: './splitter.css',
})
export class WjSplitter {
  /** `horizontal` puts the panels side by side, `vertical` stacks them. A vertical splitter needs a height. */
  readonly orientation = input<WjSplitterOrientation>('horizontal');
  /** How many pixels an arrow key moves the gutter. */
  readonly step = input(5, { transform: (value: unknown) => numberAttribute(value, 5) });
  /** Accessible name of every separator. Name it after the panel it resizes. */
  readonly ariaLabel = input<string>();
  /** Id of the element or elements that name every separator. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element or elements that describe every separator. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the component's parts. Tracks Optimus: its part names and attributes follow
   * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes
   * to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjSplitterPt>();
  /**
   * Emits once a resize is done, by pointer or by key, with every panel's share in percent. It
   * stays silent for a key-up that moved nothing, such as Tab arriving on a gutter.
   */
  readonly resizeEnd = output<WjSplitterResizeEvent>();

  /** The `wj-splitter-panel` children, in declaration order. */
  protected readonly panels = contentChildren(WjSplitterPanel);
  /** Set when Optimus starts a resize and cleared when it ends one. */
  protected resizing = false;

  // Optimus reads its panels once, so the set drawn is the set of the first pass.
  private first?: readonly WjSplitterPanel[];
  protected readonly drawn = computed(() => (this.first ??= this.panels()));

  /** Each panel's share: the unset ones split what the set ones leave, equally. */
  protected readonly sizes = computed(() => {
    const set = this.drawn().map((panel) => share(panel.size()));
    const rest = Math.max(100 - set.reduce((total, size) => total + size, 0), 0);
    return set.map((size) => size || rest / set.filter((other) => !other).length);
  });
  protected readonly minSizes = computed(() => this.drawn().map((panel) => share(panel.minSize())));

  /**
   * The value every handle reports: the first panel's share, exact for two panels. Optimus sets
   * its own only in the browser, which leaves a prerendered separator with no value (axe
   * `aria-required-attr`), and reports a size it refused at a `minSize`.
   */
  private readonly value = linkedSignal(() => this.sizes()[0]);

  /**
   * `pt` forwarded as given, plus what this wrapper routes (FR-41's gap fixes): the focusable
   * handle becomes the one `separator` of its gutter, with its value and range, its orientation
   * (the line runs across the panels' axis) and the ARIA inputs; the outer gutter loses its role.
   */
  protected readonly partAttributes = computed<WjSplitterPt>(() => {
    const gutter = _mergePartAttributes(this.pt(), 'gutter', { role: undefined });
    return _mergePartAttributes(gutter, 'gutterHandle', {
      role: 'separator',
      'aria-orientation': this.orientation() === 'vertical' ? 'horizontal' : 'vertical',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': this.value()?.toFixed(4),
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.ariaLabelledBy(),
      'aria-describedby': this.ariaDescribedBy(),
    });
  });

  constructor() {
    _checkWeeljackSetup('wj-splitter');
    _checkAriaOnHost('wj-splitter');

    if (ngDevMode) {
      const injector = inject(Injector);
      effect(() => {
        const now = this.panels();
        const first = this.first;
        if (first && (now.length !== first.length || now.some((panel, i) => panel !== first[i]))) {
          runInInjectionContext(injector, () => {
            _warnOnce(
              'WJ0120',
              'wj-splitter',
              'its panels changed after the first render, and Optimus reads them once',
              'Render a new wj-splitter to change its panels (for example inside @if)',
            );
          });
        }
      });
    }
  }

  /** Optimus ends a "resize" on every key-up, so only one that started counts. */
  protected ended(event: SplitterResizeEndEvent): void {
    if (this.resizing) {
      this.resizing = false;
      const sizes = event.sizes.map(Number);
      this.value.set(sizes[0]);
      this.resizeEnd.emit({ sizes });
    }
  }
}
