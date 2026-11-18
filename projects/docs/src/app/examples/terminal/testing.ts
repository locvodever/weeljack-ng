import type { HarnessLoader } from '@angular/cdk/testing';
import { WjTerminalHarness } from 'weeljack-ng/terminal/testing';

/** Enters `command` in the fixture `loader` was made from, and returns the response it got. */
export async function ask(loader: HarnessLoader, command: string): Promise<string | undefined> {
  const terminal = await loader.getHarness(WjTerminalHarness);
  await terminal.enterCommand(command);
  const entries = await terminal.getEntries();
  return entries.at(-1)?.response;
}
