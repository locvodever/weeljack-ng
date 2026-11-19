import type { HarnessLoader } from '@angular/cdk/testing';
import { WjColorPickerHarness } from 'weeljack-ng/colorpicker/testing';

/** Opens the picker labelled "Accent color", and returns the colour it holds. */
export async function openAccent(loader: HarnessLoader): Promise<string | null> {
  const picker = await loader.getHarness(WjColorPickerHarness.with({ ariaLabel: 'Accent color' }));
  await picker.open();
  const value = await picker.getValue();
  await picker.close();
  return value;
}
