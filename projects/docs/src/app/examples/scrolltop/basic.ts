import { Component } from '@angular/core';
import { WjScrollTop } from 'weeljack-ng/scrolltop';

/** The page's one live `wj-scrolltop`: it renders nothing in the panel, so the note is the content. */
@Component({
  selector: 'docs-scrolltop-basic-example',
  imports: [WjScrollTop],
  template: `
    <p>
      Scroll this page down. Once you pass 200 px, a round button appears in the bottom corner of
      the window; press it to go back to the top.
    </p>
    <wj-scrolltop threshold="200" />
  `,
  styles: `
    p {
      margin: 0;
      max-inline-size: 60ch;
      color: var(--wj-text-color);
      font-size: 1rem;
    }
  `,
})
export class ScrollTopBasicExample {}
