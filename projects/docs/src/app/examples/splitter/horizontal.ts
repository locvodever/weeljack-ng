import { Component } from '@angular/core';
import { WjSplitter, WjSplitterPanel } from 'weeljack-ng/splitter';

@Component({
  selector: 'docs-splitter-horizontal-example',
  imports: [WjSplitter, WjSplitterPanel],
  template: `
    <wj-splitter ariaLabel="Resize the file list">
      <wj-splitter-panel [size]="30">
        <div class="pane">
          <span class="label">Files</span>
          <p>Folders and documents sit here.</p>
        </div>
      </wj-splitter-panel>
      <wj-splitter-panel>
        <div class="pane">
          <span class="label">Editor</span>
          <p>The open file is shown here.</p>
        </div>
      </wj-splitter-panel>
    </wj-splitter>
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
  `,
})
export class SplitterHorizontalExample {}
