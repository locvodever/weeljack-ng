import { ContentContainerComponentHarness } from '@angular/cdk/testing';

/**
 * Test harness for `wj-fluid`. It has no concepts of its own: reach the controls inside it with the
 * inherited `getHarness` and `getAllHarnesses`, for example `fluid.getHarness(WjButtonHarness)`.
 */
export class WjFluidHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-fluid';
}
