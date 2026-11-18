import type { HarnessLoader } from '@angular/cdk/testing';
import { WjMultiSelectHarness } from 'weeljack-ng/multiselect/testing';

/**
 * Picks Monday and Wednesday in the multi select named "Working days", and returns the text the
 * control then shows.
 */
export async function pickMondayAndWednesday(loader: HarnessLoader): Promise<string> {
  const days = await loader.getHarness(WjMultiSelectHarness.with({ ariaLabel: 'Working days' }));
  // Opens the list, then clicks each option; the list stays open until it is closed.
  await days.toggleOption('Monday');
  await days.toggleOption('Wednesday');
  await days.close();
  return days.getText();
}
