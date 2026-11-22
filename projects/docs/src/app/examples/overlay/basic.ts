import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WjButton, type WjButtonPt } from 'weeljack-ng/button';
import { WjIcon, wjIconChevronDown } from 'weeljack-ng/icon';
import { WjOverlay } from 'weeljack-ng/overlay';

@Component({
  selector: 'docs-overlay-basic-example',
  imports: [RouterLink, WjButton, WjOverlay, WjIcon],
  template: `
    <div class="anchor">
      <wj-button
        label="Resources"
        severity="secondary"
        variant="outlined"
        [ariaExpanded]="open()"
        [pt]="triggerPt"
        (click)="open.set(!open())"
      >
        <wj-icon [icon]="chevronDown" />
      </wj-button>
      <wj-overlay [(visible)]="open">
        <ul id="overlay-basic-links" class="links">
          <li><a routerLink="/">Home</a></li>
          <li><a routerLink="/components/popover">Popover</a></li>
          <li><a routerLink="/components/tooltip">Tooltip</a></li>
        </ul>
      </wj-overlay>
    </div>
  `,
  styles: `
    .links {
      display: grid;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .links a {
      display: block;
      box-sizing: border-box;
      min-block-size: 32px;
      padding: 4px 12px;
      border-radius: 8px;
      color: var(--wj-text-color);
      line-height: 24px;
      text-decoration: none;
    }

    .links a:hover {
      background: var(--wj-content-hover-background);
    }
  `,
})
export class OverlayBasicExample {
  protected readonly chevronDown = wjIconChevronDown;
  protected readonly open = signal(false);

  /** `wj-button` has no `aria-controls` input, so that one goes through `pt`. */
  protected readonly triggerPt: WjButtonPt = { root: { 'aria-controls': 'overlay-basic-links' } };
}
