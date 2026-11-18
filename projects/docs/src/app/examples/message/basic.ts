import { Component } from '@angular/core';
import { WjMessage } from 'weeljack-ng/message';

@Component({
  selector: 'docs-message-basic-example',
  imports: [WjMessage],
  template: `
    <wj-message><strong>Update available.</strong> Version 2.4 is ready to install.</wj-message>
    <wj-message severity="success"><strong>Saved.</strong> Your changes are stored.</wj-message>
    <wj-message severity="warn">
      <strong>Storage almost full.</strong> 90% of your space is used.
    </wj-message>
    <wj-message severity="error">
      <strong>Upload failed.</strong> The file is larger than 10 MB. Choose a smaller file.
    </wj-message>
    <wj-message severity="secondary"
      ><strong>Draft.</strong> Only you can see this page.</wj-message
    >
    <wj-message severity="contrast">
      <strong>Maintenance tonight.</strong> Sign-in pauses from 22:00 to 22:30.
    </wj-message>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      max-inline-size: 40rem;
    }
  `,
})
export class MessageBasicExample {}
