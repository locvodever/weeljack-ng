import type { HarnessLoader } from '@angular/cdk/testing';
import { WjChipHarness } from 'weeljack-ng/chip/testing';

/** Removes the chip labelled "New" in the fixture `loader` was made from; false when it has none. */
export async function removeNewChip(loader: HarnessLoader): Promise<boolean> {
  const chip = await loader.getHarnessOrNull(WjChipHarness.with({ label: 'New' }));
  if (!chip || !(await chip.isRemovable()) || (await chip.isDisabled())) {
    return false;
  }
  // Clicks the remove button, so the chip's `(removed)` output fires once.
  await chip.remove();
  return true;
}
