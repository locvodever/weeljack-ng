import { Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { WjFileUpload, type WjFileUploadEvent } from 'weeljack-ng/fileupload';

@Component({
  selector: 'docs-fileupload-own-upload-example',
  imports: [WjFileUpload],
  template: `
    <div class="item">
      <span id="fileupload-own-upload-caption">Documents</span>
      <wj-fileupload
        multiple
        ariaDescribedBy="fileupload-own-upload-caption"
        (upload)="send($event)"
      />
      <p class="state">{{ state() }}</p>
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

    #fileupload-own-upload-caption {
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.5;
    }

    .state {
      margin: 4px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class FileUploadOwnUploadExample {
  protected readonly state = signal('Nothing sent yet.');
  private readonly uploader = viewChild.required(WjFileUpload);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
    });
  }

  /**
   * `wj-fileupload` sends nothing. Your app sends the files here, with its own `HttpClient`, then
   * calls `clear()`. This example only waits a moment, so the docs make no request.
   */
  protected send({ files }: WjFileUploadEvent): void {
    const label = `${String(files.length)} ${files.length === 1 ? 'file' : 'files'}`;
    this.state.set(`Sending ${label}…`);
    this.timer = setTimeout(() => {
      this.state.set(`Sent ${label}.`);
      this.uploader().clear();
    }, 1000);
  }
}
