import { Component, TemplateRef, input, viewChild } from '@angular/core';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjAccordionContentPt } from '../accordion-types';

/**
 * The content of a `wj-accordion-panel`: shown under the header while the panel is open. A part
 * renders nothing itself: the accordion reads its `pt` and draws its content in the region it
 * writes. Collapsed content stays in the page, hidden and out of the Tab order.
 */
@Component({
  selector: 'wj-accordion-content',
  template: '<ng-template><ng-content /></ng-template>',
  host: { hidden: '' },
})
export class WjAccordionContent {
  /**
   * Pass-through for the content's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjAccordionContentPt>();
  /** The projected content, as a template the accordion stamps once. @docs-private */
  readonly content = viewChild.required<TemplateRef<unknown>>(TemplateRef);

  constructor() {
    _checkWeeljackSetup('wj-accordion-content');
    _checkAriaOnHost('wj-accordion-content', 'Remove it: the content is named by its header');
  }
}
