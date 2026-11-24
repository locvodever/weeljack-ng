import type { HarnessLoader } from '@angular/cdk/testing';
import { WjBadgeHarness } from 'weeljack-ng/badge/testing';

/** Reads the text of the badge whose value is "8", and whether any badge in the fixture is a dot. */
export async function readBadges(
  loader: HarnessLoader,
): Promise<{ eight: string; hasDot: boolean }> {
  const badge = await loader.getHarness(WjBadgeHarness.with({ value: '8' }));
  const badges = await loader.getAllHarnesses(WjBadgeHarness);
  const dots = await Promise.all(badges.map((candidate) => candidate.isDot()));
  return { eight: await badge.getValue(), hasDot: dots.includes(true) };
}
