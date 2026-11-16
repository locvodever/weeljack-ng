import { Component, computed, input } from '@angular/core';
import { Skeleton } from '@openng/optimus-ui/skeleton';
import { _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import type { WjSkeletonPt, WjSkeletonShape } from './skeleton-types';

/**
 * A placeholder shape that holds the place of content while it loads, over Optimus's
 * `p-skeleton`. It is display only: Optimus hides it from assistive technology, it takes no focus
 * and adds no Tab stop. Mark the loading region (for example `aria-busy`) in your own markup.
 *
 * The host carries the size, so a percentage `width` resolves against the container, in a block
 * parent and in a flex row alike. The shimmer stops when the reader asks for reduced motion.
 */
@Component({
  selector: 'wj-skeleton',
  imports: [Skeleton],
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.css',
  host: {
    '[style.width]': 'boxWidth()',
    '[style.height]': 'boxHeight()',
  },
})
export class WjSkeleton {
  /** Width, as a CSS length. Ignored when `size` is set. */
  readonly width = input('100%');
  /** Height, as a CSS length. Ignored when `size` is set. */
  readonly height = input('1rem');
  /** Width and height together, as a CSS length. Wins over `width` and `height`. */
  readonly size = input<string>();
  /** Outline: a `rectangle`, or a `circle` (give it a `size`). */
  readonly shape = input<WjSkeletonShape>('rectangle');
  /** Corner radius, as a CSS length. Left unset, the theme's content radius applies. */
  readonly borderRadius = input<string>();
  /**
   * Pass-through for the skeleton's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjSkeletonPt>();

  protected readonly boxWidth = computed(() => this.size() ?? this.width());
  protected readonly boxHeight = computed(() => this.size() ?? this.height());

  /** `pt` forwarded as given, plus the shape hook the harness reads. */
  protected readonly partAttributes = computed<WjSkeletonPt>(() =>
    _mergePartAttributes(this.pt(), 'root', { 'data-wj-shape': this.shape() }),
  );

  constructor() {
    _checkWeeljackSetup('wj-skeleton');
  }
}
