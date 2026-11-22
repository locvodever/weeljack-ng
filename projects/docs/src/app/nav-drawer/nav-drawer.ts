import { Component, model, output } from '@angular/core';
import { WjDrawer } from 'weeljack-ng/drawer';
import { DocsSidebar } from '../sidebar/sidebar';
import { DocsThemePanel } from '../theme-panel/theme-panel';

/**
 * The narrow-screen navigation: the sidebar inside a left `wj-drawer`. The shell loads it with a
 * dynamic `import()` on the first Menu click (a template `@defer` would put its runtime in the
 * initial bundle), so the drawer and Optimus's drawer stay out of it. Below 720 px, where the bar
 * has no room for Theme, it also holds the theme panel after the navigation. The shell sets
 * `visible` and listens to `visibleChange` and `closed`.
 */
@Component({
  selector: 'docs-nav-drawer',
  imports: [DocsSidebar, DocsThemePanel, WjDrawer],
  template: `
    <wj-drawer [(visible)]="visible" header="Menu" position="left" (closed)="closed.emit()">
      <docs-sidebar idPrefix="drawer" [sticky]="false" (linkClick)="visible.set(false)" />
      <section class="theme-section" aria-labelledby="drawer-theme-title">
        <docs-theme-panel idPrefix="drawer" />
      </section>
    </wj-drawer>
  `,
  styles: `
    .theme-section {
      margin-block-start: 16px;
      padding-block-start: 16px;
      border-block-start: 1px solid var(--wj-content-border-color);
    }

    @media (min-width: 720px) {
      .theme-section {
        display: none;
      }
    }
  `,
})
export class DocsNavDrawer {
  /** Whether the drawer is open. Two-way: `[(visible)]`. */
  readonly visible = model(false);

  /** Emits once each time the drawer has closed, after it is gone and focus has been restored. */
  readonly closed = output();
}
