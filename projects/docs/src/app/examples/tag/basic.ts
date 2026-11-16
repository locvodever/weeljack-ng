import { Component } from '@angular/core';
import { WjTag } from 'weeljack-ng/tag';

@Component({
  selector: 'docs-tag-basic-example',
  imports: [WjTag],
  template: `<wj-tag value="Paid" />`,
})
export class TagBasicExample {}
