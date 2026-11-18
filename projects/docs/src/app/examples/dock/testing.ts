import type { HarnessLoader } from '@angular/cdk/testing';
import { WjDockHarness } from 'weeljack-ng/dock/testing';

/** Reads the dock named "Apps" and runs its "Mail" tile in the fixture `loader` was made from. */
export async function openMail(loader: HarnessLoader): Promise<string[]> {
  // The dock is created in the browser after the first render: read it once the fixture is stable.
  const dock = await loader.getHarness(WjDockHarness.with({ name: 'Apps' }));
  const names = await dock.getItemLabels(); // ["Home", "Search", "Mail", …]
  const edge = await dock.getPosition(); // "bottom"

  // A tile is found by its name, which is never drawn. A disabled tile runs nothing when clicked.
  const [mail] = await dock.getItems({ label: 'Mail' });
  if (edge === 'bottom' && mail !== undefined && !(await mail.isDisabled())) {
    await mail.click();
  }

  // The keyboard moves the active tile: focus the list, then read where it is.
  await dock.focus();
  const active = await dock.getActiveItemLabel(); // "Home"
  return active === null ? names : [active, ...names];
}
