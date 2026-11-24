import type { HarnessLoader } from '@angular/cdk/testing';
import { WjButtonGroupHarness } from 'weeljack-ng/buttongroup/testing';

/** Clicks the button labelled `label` in the group in the fixture `loader` was made from. */
export async function pressInGroup(loader: HarnessLoader, label: string): Promise<string | null> {
  const group = await loader.getHarness(WjButtonGroupHarness);
  // Each button comes back as a `WjButtonHarness`: click it, read it, check it is disabled.
  const [button] = await group.getButtons({ label });
  await button?.click();
  return group.getAriaLabel();
}
