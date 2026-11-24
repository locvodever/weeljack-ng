import type { HarnessLoader } from '@angular/cdk/testing';
import { WjMeterGroupHarness } from 'weeljack-ng/metergroup/testing';

/** Reads the "Storage" meter: its legend, its total, and the text a screen reader hears. */
export async function readStorage(
  loader: HarnessLoader,
): Promise<{ items: { label: string; percent: number }[]; total: number; text: string | null }> {
  const meter = await loader.getHarness(WjMeterGroupHarness.with({ label: 'Storage' }));
  return {
    items: await meter.getItems(),
    total: await meter.getTotalPercent(),
    text: await meter.getValueText(),
  };
}
