import { ComponentHarness } from '@angular/cdk/testing';

/** Test harness for `wj-skeleton`. Describes the shape as a user meets it, not how it is built. */
export class WjSkeletonHarness extends ComponentHarness {
  static hostSelector = 'wj-skeleton';

  private readonly shape = this.locatorFor('[data-wj-shape]');

  /** The rendered width and height of the shape, in px. */
  async getSize(): Promise<{ width: number; height: number }> {
    const { width, height } = await (await this.shape()).getDimensions();
    return { width, height };
  }

  /** Whether the shape is a circle. */
  async isCircle(): Promise<boolean> {
    return (await (await this.shape()).getAttribute('data-wj-shape')) === 'circle';
  }
}
