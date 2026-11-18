import { Component } from '@angular/core';
import { WjFileUpload, WjFileUploadEmptySlot } from 'weeljack-ng/fileupload';

@Component({
  selector: 'docs-fileupload-advanced-example',
  imports: [WjFileUpload, WjFileUploadEmptySlot],
  template: `
    <div class="item">
      <span id="fileupload-advanced-caption">Photos</span>
      <wj-fileupload
        multiple
        accept="image/*"
        [maxFileSize]="1048576"
        ariaDescribedBy="fileupload-advanced-caption"
      >
        <ng-template wjFileUploadEmpty>
          <div class="hint">
            <p>Drag and drop images here.</p>
            <p class="note">Images up to 1 MB each.</p>
          </div>
        </ng-template>
      </wj-fileupload>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 32rem);
    }

    .item {
      display: grid;
      gap: 4px;
    }

    #fileupload-advanced-caption {
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.5;
    }

    .hint {
      padding-block: 24px;
      text-align: center;
    }

    .hint p {
      margin: 0;
      color: var(--wj-text-color);
    }

    .hint .note {
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class FileUploadAdvancedExample {}
