import type { HarnessLoader } from '@angular/cdk/testing';
import { WjPasswordHarness } from 'weeljack-ng/password/testing';

/** Types a new password, shows it, and returns the text the user then reads in the input. */
export async function typeAndReveal(loader: HarnessLoader): Promise<string> {
  const password = await loader.getHarness(WjPasswordHarness.with({ ariaLabel: 'New password' }));
  await password.setValue('correct horse battery staple');
  await password.toggleMask();
  return password.getValue();
}
