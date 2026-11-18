import type { HarnessLoader } from '@angular/cdk/testing';
import { WjProgressBarHarness } from 'weeljack-ng/progressbar/testing';

/** Reads the "Uploading report.pdf" bar: its value, and the "40%" shown inside the fill. */
export async function readUpload(
  loader: HarnessLoader,
): Promise<{ value: number | null; shown: string | null }> {
  const bar = await loader.getHarness(WjProgressBarHarness.with({ label: 'Uploading report.pdf' }));
  return { value: await bar.getValue(), shown: await bar.getDisplayedValue() };
}

/** Says whether the "Preparing your export" bar is indeterminate: it then has no value. */
export async function isExportIndeterminate(loader: HarnessLoader): Promise<boolean> {
  const bar = await loader.getHarness(WjProgressBarHarness.with({ label: /^Preparing/ }));
  return (await bar.getMode()) === 'indeterminate';
}
