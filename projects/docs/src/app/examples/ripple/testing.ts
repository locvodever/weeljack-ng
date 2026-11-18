import type { HarnessLoader } from '@angular/cdk/testing';
import { WjRippleHarness } from 'weeljack-ng/ripple/testing';

/**
 * Presses the first element with `wjRipple` and reports whether an ink shows. It is `false` when
 * `wjRippleDisabled` is on, and under `prefers-reduced-motion: reduce`.
 */
export async function pressAndSeeInk(loader: HarnessLoader): Promise<boolean> {
  const ripple = await loader.getHarness(WjRippleHarness);
  await ripple.press();
  return ripple.hasInk();
}
