import { Component } from '@angular/core';
import { WjTag } from 'weeljack-ng/tag';

@Component({
  selector: 'docs-tag-with-icon-example',
  imports: [WjTag],
  template: `
    <wj-tag value="Verified" severity="success">
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M3 8.5 6.5 12 13 4.5" />
      </svg>
    </wj-tag>
  `,
})
export class TagWithIconExample {}
