import { Component } from '@angular/core';
import { WjButton, type WjButtonSize } from 'weeljack-ng/button';
import { WjButtonGroup } from 'weeljack-ng/buttongroup';

@Component({
  selector: 'docs-buttongroup-sizes-example',
  imports: [WjButtonGroup, WjButton],
  template: `
    <div class="rows">
      <!-- The group has no size: set the same size on every button in it. -->
      @for (step of steps; track step.name) {
        <wj-buttongroup [ariaLabel]="'Date navigation, ' + step.name">
          @for (label of labels; track label) {
            <wj-button [label]="label" [size]="step.size" severity="secondary" variant="outlined" />
          }
        </wj-buttongroup>
      }
    </div>
  `,
  styles: `
    .rows {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
  `,
})
export class ButtonGroupSizesExample {
  protected readonly labels = ['Previous', 'Today', 'Next'];
  protected readonly steps: { name: string; size: WjButtonSize | undefined }[] = [
    { name: 'small', size: 'small' },
    { name: 'default', size: undefined },
    { name: 'large', size: 'large' },
  ];
}
