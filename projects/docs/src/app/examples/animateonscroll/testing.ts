import type { HarnessLoader } from '@angular/cdk/testing';
import { WjAnimateOnScrollHarness } from 'weeljack-ng/animateonscroll/testing';

/**
 * Reports whether the first element with `wjAnimateOnScroll` is still held, and whether it has
 * the app's enter class. It is never held under `prefers-reduced-motion: reduce`.
 */
export async function readHeldState(
  loader: HarnessLoader,
  enterClass: string,
): Promise<{ hidden: boolean; entered: boolean }> {
  const target = await loader.getHarness(WjAnimateOnScrollHarness);
  return { hidden: await target.isHidden(), entered: await target.hasClass(enterClass) };
}
