import { Component } from '@angular/core';
import { WjDivider } from 'weeljack-ng/divider';

@Component({
  selector: 'docs-divider-vertical-example',
  imports: [WjDivider],
  template: `
    <div class="row">
      <span>Inbox</span>
      <wj-divider orientation="vertical" />
      <span>Drafts</span>
      <wj-divider orientation="vertical" />
      <span>Sent</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    .row {
      display: flex;
      align-items: stretch;
    }
  `,
})
export class DividerVerticalExample {}
