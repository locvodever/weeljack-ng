import type { HarnessLoader } from '@angular/cdk/testing';
import { WjIconFieldHarness } from 'weeljack-ng/iconfield/testing';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';

/** Types a query into the input inside the icon field, and reports which sides hold an icon. */
export async function typeQuery(loader: HarnessLoader, query: string): Promise<string> {
  const iconField = await loader.getHarness(WjIconFieldHarness);
  const input = await iconField.getHarness(WjInputTextHarness);
  await input.setValue(query);
  const leading = await iconField.hasLeadingIcon();
  const trailing = await iconField.hasTrailingIcon();
  return `${await input.getValue()} (leading: ${String(leading)}, trailing: ${String(trailing)})`;
}
