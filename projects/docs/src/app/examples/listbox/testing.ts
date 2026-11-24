import type { HarnessLoader } from '@angular/cdk/testing';
import { WjListboxHarness } from 'weeljack-ng/listbox/testing';

/** Picks "Once a day" in the list named "Email notifications", and returns the label then picked. */
export async function pickOnceADay(loader: HarnessLoader): Promise<string | null> {
  const list = await loader.getHarness(WjListboxHarness.with({ ariaLabel: 'Email notifications' }));
  await list.selectOption('Once a day');
  return list.getSelectedLabel();
}
