import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjFileUpload, WjFileUploadEmptySlot } from 'weeljack-ng/fileupload';

@Component({
  selector: 'docs-fileupload-in-a-field-example',
  imports: [WjField, WjFileUpload, WjFileUploadEmptySlot],
  template: `
    <wj-field label="Attachments" hint="Up to 3 files." error="Add at least one file.">
      <wj-fileupload multiple [fileLimit]="3">
        <ng-template wjFileUploadEmpty>
          <p class="hint">Drag and drop files here.</p>
        </ng-template>
      </wj-fileupload>
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 32rem);
    }

    .hint {
      margin: 0;
      padding-block: 24px;
      text-align: center;
      color: var(--wj-text-color);
    }
  `,
})
export class FileUploadInAFieldExample {}
