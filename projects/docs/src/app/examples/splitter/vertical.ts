import { Component } from '@angular/core';
import { WjSplitter, WjSplitterPanel } from 'weeljack-ng/splitter';

@Component({
  selector: 'docs-splitter-vertical-example',
  imports: [WjSplitter, WjSplitterPanel],
  template: `
    <wj-splitter orientation="vertical" ariaLabel="Resize the preview">
      <wj-splitter-panel>
        <div class="pane">
          <span class="label">Preview</span>
          <p>The page as visitors see it.</p>
        </div>
      </wj-splitter-panel>
      <wj-splitter-panel>
        <div class="pane">
          <span class="label">Console</span>
          <p>Messages from the running page.</p>
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
      block-size: 20rem;
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
export class SplitterVerticalExample {}
