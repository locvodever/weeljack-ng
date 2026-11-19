import type { HarnessLoader } from '@angular/cdk/testing';
import { WjAutoCompleteHarness } from 'weeljack-ng/autocomplete/testing';

/**
 * Types "vie" into the autocomplete named "Country", picks Vietnam from the list the app answers
 * with, and returns the text the autocomplete then shows.
 */
export async function pickVietnam(loader: HarnessLoader): Promise<string> {
  const country = await loader.getHarness(WjAutoCompleteHarness.with({ ariaLabel: 'Country' }));
  await country.typeText('vie');
  // `query` fires 300 ms after the last key, so the list opens a moment later: wait for it.
  while (!(await country.isOpen())) {
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
  }
  await country.selectSuggestion('Vietnam');
  return country.getText();
}
