import { Component, computed, input } from '@angular/core';
import { ScrollPanel } from '@openng/optimus-ui/scrollpanel';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import type { WjScrollPanelPt } from './scrollpanel-types';

/**
 * A scroll region with slim, themed scrollbars, over Optimus's `p-scroll-panel`. Give the host a
 * block size (`height`, `block-size` or a stretching flex or grid row): the content scrolls
 * against it. The region itself is the one Tab stop, scrolled by the browser's own keys; the
 * thumbs are for the pointer and hidden from assistive technology. Name the region with
 * `ariaLabel` or `ariaLabelledBy`: a named region is a landmark.
 */
@Component({
  selector: 'wj-scrollpanel',
  imports: [ScrollPanel],
  templateUrl: './scrollpanel.html',
  styleUrl: './scrollpanel.css',
})
export class WjScrollPanel {
  /** Accessible name of the scroll region. A named region takes `role="region"`. */
  readonly ariaLabel = input<string>();
  /** Id of the element or elements that name the scroll region. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element or elements that describe the scroll region. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the component's parts. Tracks Optimus: its part names and attributes follow
   * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes
   * to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjScrollPanelPt>();

  /**
   * `pt` forwarded as given, plus what this wrapper routes (FR-34's gap fixes): `tabindex="0"`,
   * the ARIA inputs and, only while named, `role="region"` on `content`, the scrolling element;
   * and `tabindex="-1"` with `aria-hidden="true"` on both bars, which become pointer-only.
   */
  protected readonly partAttributes = computed<WjScrollPanelPt>(() => {
    const named = Boolean(this.ariaLabel()) || Boolean(this.ariaLabelledBy());
    const content = _mergePartAttributes(this.pt(), 'content', {
      tabindex: '0',
      role: named ? 'region' : undefined,
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.ariaLabelledBy(),
      'aria-describedby': this.ariaDescribedBy(),
    });
    const bar = { tabindex: '-1', 'aria-hidden': 'true' };
    return _mergePartAttributes(_mergePartAttributes(content, 'barX', bar), 'barY', bar);
  });

  constructor() {
    _checkWeeljackSetup('wj-scrollpanel');
    _checkAriaOnHost('wj-scrollpanel');
  }
}
