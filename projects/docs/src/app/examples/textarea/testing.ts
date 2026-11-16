import type { HarnessLoader } from '@angular/cdk/testing';
import { WjTextareaHarness } from 'weeljack-ng/textarea/testing';

/** Types `text` into the textarea whose placeholder is "Your message", and returns what it holds. */
export async function typeMessage(loader: HarnessLoader, text: string): Promise<string> {
  const area = await loader.getHarness(WjTextareaHarness.with({ placeholder: 'Your message' }));
  await area.setValue(text);
  return area.getValue();
}
