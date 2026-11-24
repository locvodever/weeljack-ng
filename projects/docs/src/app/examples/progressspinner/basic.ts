import { Component } from '@angular/core';
import { WjProgressSpinner } from 'weeljack-ng/progressspinner';

@Component({
  selector: 'docs-progressspinner-basic-example',
  imports: [WjProgressSpinner],
  template: `<wj-progressspinner ariaLabel="Loading" />`,
})
export class ProgressspinnerBasicExample {}
