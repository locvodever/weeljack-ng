import type { HarnessLoader } from '@angular/cdk/testing';
import { WjSelectButtonHarness } from 'weeljack-ng/selectbutton/testing';

/** Picks "Week" in the group named "Calendar view", and returns the label then picked. */
export async function pickWeek(loader: HarnessLoader): Promise<string | null> {
  const group = await loader.getHarness(WjSelectButtonHarness.with({ ariaLabel: 'Calendar view' }));
  await group.selectOption('Week');
  return group.getSelectedLabel();
}
