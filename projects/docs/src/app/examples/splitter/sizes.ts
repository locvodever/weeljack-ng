import { Component } from '@angular/core';
import { WjSplitter, WjSplitterPanel } from 'weeljack-ng/splitter';

@Component({
  selector: 'docs-splitter-sizes-example',
  imports: [WjSplitter, WjSplitterPanel],
  template: `
    <wj-splitter ariaLabel="Resize the sidebar">
      <wj-splitter-panel [size]="25" [minSize]="15">
        <div class="pane">
          <span class="label">Sidebar</span>
          <p>Shortcuts, never narrower than 15 %.</p>
        </div>
      </wj-splitter-panel>
      <wj-splitter-panel [minSize]="50">
        <div class="pane">
          <span class="label">Content</span>
          <p>The main view, never narrower than 50 %.</p>
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
export class SplitterSizesExample {}
