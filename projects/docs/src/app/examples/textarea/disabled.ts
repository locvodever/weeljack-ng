import { Component } from '@angular/core';
import { WjTextarea } from 'weeljack-ng/textarea';

@Component({
  selector: 'docs-textarea-disabled-example',
  imports: [WjTextarea],
  template: `
    <label for="disabled-message">Message</label>
    <textarea wjTextarea id="disabled-message" rows="3" disabled>Thanks for your help.</textarea>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 8px;
    }
  `,
})
export class TextareaDisabledExample {}
