import type { HarnessLoader } from '@angular/cdk/testing';
import { WjTimelineHarness } from 'weeljack-ng/timeline/testing';

/** Reads the events of the timeline named "Shipment history": what each shows, in order. */
export async function readTheShipment(loader: HarnessLoader): Promise<string[]> {
  const timeline = await loader.getHarness(WjTimelineHarness.with({ name: 'Shipment history' }));

  return timeline.getEventTexts(); // "Order placed", "Packed", "Shipped", "Delivered"
}

/** Reads the dates and the way the "Shipment history with dates" timeline runs. */
export async function readTheDates(loader: HarnessLoader): Promise<[string[], string]> {
  const timeline = await loader.getHarness(WjTimelineHarness.with({ name: /with dates/ }));

  return [await timeline.getOppositeTexts(), await timeline.getOrientation()]; // the dates, "vertical"
}
