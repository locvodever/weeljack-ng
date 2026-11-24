import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjSplitButton } from 'weeljack-ng/splitbutton';

@Component({
  selector: 'docs-splitbutton-disabled-example',
  imports: [WjSplitButton],
  template: `<wj-splitbutton label="Publish" disabled [model]="items" />`,
})
export class SplitButtonDisabledExample {
  protected readonly items: WjMenuItem[] = [{ label: 'Schedule…' }, { label: 'Publish to all' }];
}
