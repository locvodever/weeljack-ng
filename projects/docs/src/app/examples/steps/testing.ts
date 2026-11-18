import type { HarnessLoader } from '@angular/cdk/testing';
import { WjStepsHarness } from 'weeljack-ng/steps/testing';

/** Reads the steps in the fixture `loader` was made from, and selects "Payment" when it can be. */
export async function goToPayment(loader: HarnessLoader): Promise<string | null> {
  const steps = await loader.getHarness(WjStepsHarness);
  const labels = await steps.getStepLabels(); // ["Cart", "Shipping", "Payment", "Review"]
  const current = await steps.getActiveLabel(); // the step marked aria-current="step"

  // Read-only steps are inert: only an app that set `readonly` to false can select one.
  if (labels.includes('Payment') && !(await steps.isReadonly())) {
    await steps.selectStep('Payment');
  }

  // A step is found by its visible label, and read as a user meets it.
  const [payment] = await steps.getSteps({ label: 'Payment' });
  if (payment !== undefined && (await payment.isActive())) {
    return `${String(await payment.getNumber())}: ${await payment.getLabel()}`; // "3: Payment"
  }
  return current;
}
