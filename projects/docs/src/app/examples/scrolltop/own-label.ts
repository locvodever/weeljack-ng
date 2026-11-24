import { Component } from '@angular/core';
import { WjScrollTop } from 'weeljack-ng/scrolltop';

/**
 * A scroll-top named for its page. Without `ariaLabel`, the button is named "Scroll Top" (or the
 * translation's `aria.scrollTop`). Keep one `wj-scrolltop` per page, near its end.
 */
@Component({
  selector: 'docs-scrolltop-own-label-example',
  imports: [WjScrollTop],
  template: `<wj-scrolltop ariaLabel="Back to top of results" />`,
})
export class ScrollTopOwnLabelExample {}
