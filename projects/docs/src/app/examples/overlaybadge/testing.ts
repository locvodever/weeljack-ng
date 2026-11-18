import type { HarnessLoader } from '@angular/cdk/testing';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjOverlayBadgeHarness } from 'weeljack-ng/overlaybadge/testing';

/** Reads the badge on the "Inbox" button, and whether any overlay badge in the fixture is a dot. */
export async function readOverlayBadges(
  loader: HarnessLoader,
): Promise<{ inbox: string; button: string; hasDot: boolean }> {
  const inbox = await loader.getHarness(WjOverlayBadgeHarness.with({ value: '3' }));
  // The overlay badge is a container: the wrapped control's own harness is inside it.
  const button = await inbox.getHarness(WjButtonHarness.with({ label: 'Inbox' }));
  const badges = await loader.getAllHarnesses(WjOverlayBadgeHarness);
  const dots = await Promise.all(badges.map((candidate) => candidate.isDot()));
  return {
    inbox: await inbox.getValue(),
    button: await button.getLabel(),
    hasDot: dots.includes(true),
  };
}
