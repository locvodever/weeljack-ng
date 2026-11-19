import type { HarnessLoader } from '@angular/cdk/testing';
import { WjTooltipHarness } from 'weeljack-ng/tooltip/testing';

/**
 * Focuses the element with the tooltip, as a keyboard user does, and reads what the bubble says.
 * Its description is read first: it is the same text, shown or not.
 */
export async function readByFocus(loader: HarnessLoader): Promise<string> {
  const tooltip = await loader.getHarness(WjTooltipHarness);
  const description = await tooltip.getDescription();
  await tooltip.focus();
  const text = (await tooltip.isShown()) ? await tooltip.getText() : '';
  return text === description ? text : '';
}

/** Presses Escape in the shown tooltip, as a user does, and says whether it hid. */
export async function dismiss(loader: HarnessLoader): Promise<boolean> {
  const tooltip = await loader.getHarness(WjTooltipHarness);
  await tooltip.dismiss();
  return !(await tooltip.isShown());
}
