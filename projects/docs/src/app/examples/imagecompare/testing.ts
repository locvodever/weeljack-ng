import type { HarnessLoader } from '@angular/cdk/testing';
import { WjImageCompareHarness } from 'weeljack-ng/imagecompare/testing';

/**
 * Moves the divider of the comparison named "Before and after" in the fixture `loader` was made
 * from to 25, then reports where it is and whether the slider took focus.
 */
export async function slideToQuarter(
  loader: HarnessLoader,
): Promise<{ position: number; focused: boolean }> {
  const compare = await loader.getHarness(
    WjImageCompareHarness.with({ ariaLabel: 'Before and after' }),
  );
  await compare.setPosition(25);
  await compare.focus();
  return { position: await compare.getPosition(), focused: await compare.isFocused() };
}
