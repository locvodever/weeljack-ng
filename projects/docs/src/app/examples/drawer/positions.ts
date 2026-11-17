import { Component, computed, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjDrawer, type WjDrawerPosition } from 'weeljack-ng/drawer';

@Component({
  selector: 'docs-drawer-positions-example',
  imports: [WjButton, WjDrawer],
  template: `
    <div class="row">
      <wj-button label="Left" (click)="show('left')" />
      <wj-button label="Right" (click)="show('right')" />
      <wj-button label="Top" (click)="show('top')" />
      <wj-button label="Bottom" (click)="show('bottom')" />
    </div>
    <wj-drawer
      [(visible)]="visible"
      [position]="position()"
      [header]="header()"
      ariaDescribedBy="drawer-positions-description"
    >
      <p id="drawer-positions-description" class="message">
        One drawer, four edges. A click on the backdrop, Escape or the close button closes it.
      </p>
    </wj-drawer>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .message {
      margin: 0;
    }
  `,
})
export class DrawerPositionsExample {
  protected readonly visible = signal(false);
  protected readonly position = signal<WjDrawerPosition>('left');
  protected readonly header = computed(() => {
    const name = this.position();
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} drawer`;
  });

  protected show(position: WjDrawerPosition): void {
    this.position.set(position);
    this.visible.set(true);
  }
}
