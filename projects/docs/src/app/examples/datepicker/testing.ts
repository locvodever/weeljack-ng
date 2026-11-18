import type { HarnessLoader } from '@angular/cdk/testing';
import { WjDatePickerHarness } from 'weeljack-ng/datepicker/testing';

/** Picks the 20th of the month the calendar of "Start date" opens on, and returns the text shown. */
export async function pickThe20th(loader: HarnessLoader): Promise<string> {
  const start = await loader.getHarness(WjDatePickerHarness.with({ placeholder: 'mm/dd/yyyy' }));
  await start.open();
  await start.selectDay(20);
  return start.getText();
}
