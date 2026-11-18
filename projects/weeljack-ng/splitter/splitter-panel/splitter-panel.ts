import { Component, TemplateRef, input, numberAttribute, viewChild } from '@angular/core';

// A part is a declaration (PRD FR-3): `<ng-content />` sits inside an `ng-template`, so the
// projected nodes move to the one place `wj-splitter` stamps the template. The host is projected
// into the splitter only so it reaches the prerendered HTML (check:ssr), and `hidden` keeps it out
// of the layout without a stylesheet. The part runs no dev check: its splitter does (FR-40).

/**
 * One panel of a `wj-splitter`. Its content is what the panel shows. A part renders nothing
 * itself: the splitter reads `size` and `minSize` and draws the panel. A panel clips what does not
 * fit, so put a `wj-scrollpanel` inside one that must scroll.
 */
@Component({
  selector: 'wj-splitter-panel',
  template: '<ng-template><ng-content /></ng-template>',
  host: { hidden: '' },
})
export class WjSplitterPanel {
  /**
   * The panel's initial share in percent. Panels with no size share what the others leave,
   * equally.
   */
  readonly size = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  /**
   * The least share in percent the panel may shrink to. It holds for a splitter of two panels
   * only.
   */
  readonly minSize = input<number | undefined, unknown>(undefined, { transform: numberAttribute });
  /** The projected content, as a template the splitter stamps once. @docs-private */
  readonly content = viewChild.required<TemplateRef<unknown>>(TemplateRef);
}
