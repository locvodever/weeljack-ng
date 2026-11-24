import { Component } from '@angular/core';
import { WjChip } from 'weeljack-ng/chip';
import { PORTRAIT_SAGE } from './sample-images';

@Component({
  selector: 'docs-chip-with-image-example',
  imports: [WjChip],
  // The label names the chip, so the photo is decorative: `alt` stays empty.
  template: `<wj-chip label="Ana Lima" [image]="portrait" />`,
})
export class ChipWithImageExample {
  protected readonly portrait = PORTRAIT_SAGE;
}
