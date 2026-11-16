import { Component } from '@angular/core';
import { WjTextarea } from 'weeljack-ng/textarea';

@Component({
  selector: 'docs-textarea-basic-example',
  imports: [WjTextarea],
  template: `
    <label for="basic-message">Message</label>
    <textarea wjTextarea id="basic-message" rows="3"></textarea>
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
export class TextareaBasicExample {}
