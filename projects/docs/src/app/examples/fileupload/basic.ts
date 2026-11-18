import { Component, signal } from '@angular/core';
import { WjFileUpload, type WjFileUploadEvent } from 'weeljack-ng/fileupload';

@Component({
  selector: 'docs-fileupload-basic-example',
  imports: [WjFileUpload],
  template: `
    <div class="item">
      <div class="row">
        <span id="fileupload-basic-caption">Attachment</span>
        <wj-fileupload
          mode="basic"
          auto
          ariaDescribedBy="fileupload-basic-caption"
          (upload)="received($event)"
        />
      </div>
      <p class="state">Received: {{ state() }}</p>
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
      gap: 8px;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    #fileupload-basic-caption {
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.5;
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class FileUploadBasicExample {
  protected readonly state = signal('nothing yet');

  /** `auto` hands the chosen file over at once; the app would send it from here. */
  protected received({ files }: WjFileUploadEvent): void {
    const [first] = files;
    this.state.set(
      files.length === 1 && first ? `1 file, ${first.name}` : `${String(files.length)} files`,
    );
  }
}
