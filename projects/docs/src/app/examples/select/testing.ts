import type { HarnessLoader } from '@angular/cdk/testing';
import { WjSelectHarness } from 'weeljack-ng/select/testing';

/** Picks "Banana" in the select that shows "Pick a fruit", and returns the text it then shows. */
export async function pickBanana(loader: HarnessLoader): Promise<string> {
  const select = await loader.getHarness(WjSelectHarness.with({ valueText: 'Pick a fruit' }));
  await select.selectOption('Banana');
  return select.getValueText();
}
