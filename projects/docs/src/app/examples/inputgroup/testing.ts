import type { HarnessLoader } from '@angular/cdk/testing';
import { WjInputGroupHarness } from 'weeljack-ng/inputgroup/testing';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';
import { WjSelectHarness } from 'weeljack-ng/select/testing';

/** Types an amount, picks a currency, and reports what the group holds. */
export async function enterPrice(
  loader: HarnessLoader,
  amount: string,
  currency: string,
): Promise<string> {
  const group = await loader.getHarness(WjInputGroupHarness);
  const input = await group.getHarness(WjInputTextHarness);
  const select = await group.getHarness(WjSelectHarness);
  await input.setValue(amount);
  await select.selectOption(currency);
  const addons = await group.getAddonCount();
  return `${await input.getValue()} ${await select.getValueText()} (addons: ${String(addons)})`;
}
