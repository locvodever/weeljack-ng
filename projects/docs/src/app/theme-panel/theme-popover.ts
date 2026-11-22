import { Component, output, viewChild } from '@angular/core';
import { WjPopover } from 'weeljack-ng/popover';
import { DocsThemePanel } from './theme-panel';

/**
 * The theme panel in a `wj-popover`. The shell loads it with a dynamic `import()` on the first
 * Theme click, so it and `WjTheme` stay out of the initial bundle.
 */
@Component({
  selector: 'docs-theme-popover',
  imports: [DocsThemePanel, WjPopover],
  template: `
    <wj-popover
      [ariaLabelledBy]="'popover-theme-title'"
      (opened)="focusChecked()"
      (closed)="closed.emit()"
    >
      <docs-theme-panel idPrefix="popover" />
    </wj-popover>
  `,
})
export class DocsThemePopover {
  /** Emits once the popover is open and focus is on the checked Primary swatch. */
  readonly opened = output();
  /** Emits once per close, whatever closed it. */
  readonly closed = output();

  private readonly popover = viewChild.required(WjPopover);
  private readonly panel = viewChild.required(DocsThemePanel);

  /** Opens the popover beside `target`, or closes it when it is open. */
  toggle(event: Event, target: HTMLElement): void {
    this.popover().toggle(event, target);
  }

  /** `wj-popover` focuses its first control, which is Noir: the checked swatch is the better start. */
  protected focusChecked(): void {
    this.panel().focusPrimary();
    this.opened.emit();
  }
}
