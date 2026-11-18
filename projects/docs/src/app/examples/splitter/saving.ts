import { Component, signal } from '@angular/core';
import { WjSplitter, WjSplitterPanel, type WjSplitterResizeEvent } from 'weeljack-ng/splitter';

@Component({
  selector: 'docs-splitter-saving-example',
  imports: [WjSplitter, WjSplitterPanel],
  template: `
    <wj-splitter ariaLabel="Resize the notes" (resizeEnd)="save($event)">
      <wj-splitter-panel>
        <div class="pane">
          <span class="label">Notes</span>
          <p>Drag the line or use the arrow keys.</p>
        </div>
      </wj-splitter-panel>
      <wj-splitter-panel>
        <div class="pane">
          <span class="label">Preview</span>
          <p>The sizes are reported when you let go.</p>
        </div>
      </wj-splitter-panel>
    </wj-splitter>
    <p class="status" role="status">{{ status() }}</p>
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }

    wj-splitter {
      block-size: 15rem;
    }

    .pane {
      padding: 16px;
    }

    .label {
      font-weight: 600;
    }

    p {
      margin: 0.25rem 0 0;
      color: var(--wj-text-muted-color);
    }

    .status {
      margin-block-start: 8px;
      font-size: 0.875rem;
    }
  `,
})
export class SplitterSavingExample {
  protected readonly status = signal('No resize yet');

  /** An app stores these and binds `size` the next time it renders the splitter. */
  protected save(event: WjSplitterResizeEvent): void {
    const [notes = 0, preview = 0] = event.sizes.map((size) => Math.round(size));
    this.status.set(`Saved sizes: ${String(notes)} % and ${String(preview)} %`);
  }
}
