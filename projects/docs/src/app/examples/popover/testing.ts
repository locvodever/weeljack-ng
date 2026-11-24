import type { HarnessLoader } from '@angular/cdk/testing';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjPopoverHarness } from 'weeljack-ng/popover/testing';

/**
 * Reads the name of the open popover in the fixture `loader` was made from, presses Save inside it
 * (its harnesses are found in the panel, which renders in `document.body`), and says whether it closed.
 */
export async function saveAndClose(loader: HarnessLoader): Promise<boolean> {
  const popover = await loader.getHarness(WjPopoverHarness);
  const name = await popover.getName();
  const save = await popover.getHarness(WjButtonHarness.with({ label: 'Save' }));
  await save.click();
  return name !== null && !(await popover.isOpen());
}

/** Presses Escape in the open popover, as a user does, and says whether it closed. */
export async function dismiss(loader: HarnessLoader): Promise<boolean> {
  const popover = await loader.getHarness(WjPopoverHarness);
  await popover.close();
  return !(await popover.isOpen());
}
