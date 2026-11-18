import type { HarnessLoader } from '@angular/cdk/testing';
import { WjIconFieldHarness } from 'weeljack-ng/iconfield/testing';
import { WjInputIconHarness } from 'weeljack-ng/inputicon/testing';

/** Reads the icon inside the icon field: its text, and whether assistive technology skips it. */
export async function readIcon(loader: HarnessLoader): Promise<string> {
  const iconField = await loader.getHarness(WjIconFieldHarness);
  const icon = await iconField.getHarness(WjInputIconHarness);
  const hidden = await icon.isHiddenFromAt();
  return `text "${await icon.getText()}", hidden from assistive technology: ${String(hidden)}`;
}
