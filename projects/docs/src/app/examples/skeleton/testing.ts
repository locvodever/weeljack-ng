import type { HarnessLoader } from '@angular/cdk/testing';
import { WjSkeletonHarness } from 'weeljack-ng/skeleton/testing';

/** Reads the rendered size and shape of the first skeleton in the fixture `loader` was made from. */
export async function readSkeleton(
  loader: HarnessLoader,
): Promise<{ width: number; height: number; circle: boolean }> {
  const skeleton = await loader.getHarness(WjSkeletonHarness);
  return { ...(await skeleton.getSize()), circle: await skeleton.isCircle() };
}
