import type { HarnessLoader } from '@angular/cdk/testing';
import { WjInputOtpHarness } from 'weeljack-ng/inputotp/testing';

/** Types a code into the group named "Verification code", and returns what the boxes then hold. */
export async function enterCode(loader: HarnessLoader, code: string): Promise<string> {
  const otp = await loader.getHarness(WjInputOtpHarness.with({ ariaLabel: 'Verification code' }));
  await otp.typeCode(code);
  return otp.getValue();
}
