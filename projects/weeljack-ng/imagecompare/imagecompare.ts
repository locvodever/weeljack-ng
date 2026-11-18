import { NgTemplateOutlet } from '@angular/common';
import { Component, ViewEncapsulation, computed, contentChild, input } from '@angular/core';
import { ImageCompare } from '@openng/optimus-ui/imagecompare';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import { WjImageCompareLeftSlot, WjImageCompareRightSlot } from './imagecompare-slots';
import type { WjImageComparePt } from './imagecompare-types';

/**
 * Two images with a slider between them, over Optimus's `p-imagecompare`. Give both as slots: the
 * `wjImageCompareLeft` image fills the box and the `wjImageCompareRight` image is painted over it
 * from the start edge to the handle. The slider is a native `<input type="range">` and the only Tab
 * stop; the arrow, Page, Home and End keys move it. `ariaLabel` names it, and each image carries
 * its own `alt`. Give both slots when the component renders, and the same 16:9 shape.
 */
@Component({
  selector: 'wj-imagecompare',
  imports: [ImageCompare, NgTemplateOutlet],
  templateUrl: './imagecompare.html',
  styleUrl: './imagecompare.css',
  // The stylesheet styles Optimus's own elements, which an emulated scope cannot reach.
  encapsulation: ViewEncapsulation.None,
})
export class WjImageCompare {
  /** Names the slider. Required: an unnamed slider fails axe `label`. Set on the range input. */
  readonly ariaLabel = input.required<string>();
  /** Id of the element that names the slider. Set on the range input, not the host. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the slider. Set on the range input, not the host. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the component's parts. Tracks Optimus: its part names and attributes follow
   * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes
   * to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjImageComparePt>();

  protected readonly leftSlot = contentChild.required(WjImageCompareLeftSlot);
  protected readonly rightSlot = contentChild.required(WjImageCompareRightSlot);

  /**
   * `pt` forwarded as given, plus the slider's name and description. Optimus puts its own ARIA and
   * a `tabindex` on its non-focusable host and leaves the range input unnamed, so none of its ARIA
   * inputs is passed: all three land on the range input, and a routed `undefined` clears one.
   */
  protected readonly partAttributes = computed<WjImageComparePt>(() =>
    _mergePartAttributes(this.pt(), 'slider', {
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.ariaLabelledBy(),
      'aria-describedby': this.ariaDescribedBy(),
    }),
  );

  constructor() {
    _checkWeeljackSetup('wj-imagecompare');
    _checkAriaOnHost('wj-imagecompare', 'Use the ariaLabel input, which names the slider');
  }
}
