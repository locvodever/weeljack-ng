import { Component } from '@angular/core';
import { WjScrollPanel } from 'weeljack-ng/scrollpanel';

@Component({
  selector: 'docs-scrollpanel-basic-example',
  imports: [WjScrollPanel],
  template: `
    <wj-scrollpanel ariaLabel="Terms of use">
      <div class="terms">
        <p>Use the service for lawful purposes only, and keep your sign-in details to yourself.</p>
        <p>
          We may update these terms from time to time. The date at the top shows the latest one.
        </p>
        <p>Content you add stays yours. You allow us to store it and show it back to you.</p>
        <p>We keep your data for as long as your account is open, and for thirty days after.</p>
        <p>If something goes wrong, tell us first. Most problems are fixed within a working day.</p>
        <p>These terms are governed by the laws of the place where the service is run.</p>
        <p>Questions about them are welcome, and we answer every one.</p>
      </div>
    </wj-scrollpanel>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    wj-scrollpanel {
      block-size: 15rem;
    }

    .terms {
      padding: 16px;
      padding-inline-end: 24px;
    }

    p {
      margin: 0 0 1rem;
    }
  `,
})
export class ScrollpanelBasicExample {}
