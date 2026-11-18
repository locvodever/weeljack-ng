import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import type { ComponentFixture } from '@angular/core/testing';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjDynamicDialogHarness } from 'weeljack-ng/dynamicdialog/testing';

/**
 * Presses Save in the open "Edit name" dialog and returns its header. The dialog renders in
 * `document.body`, outside the fixture, so it is found from the document root.
 */
export async function saveName(fixture: ComponentFixture<unknown>): Promise<string> {
  const loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  const dialog = await loader.getHarness(WjDynamicDialogHarness.with({ header: 'Edit name' }));
  const header = await dialog.getHeader();

  // The component inside the dialog is inside the harness, so its harnesses are found from it.
  const save = await dialog.getHarness(WjButtonHarness.with({ label: 'Save' }));
  await save.click();
  return header;
}

/** Presses Escape in the open dialog, as a user does, and says whether it closed. */
export async function dismiss(fixture: ComponentFixture<unknown>): Promise<boolean> {
  const loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  const dialog = await loader.getHarness(WjDynamicDialogHarness);
  await dialog.closeWithEscape();
  return (await loader.getAllHarnesses(WjDynamicDialogHarness)).length === 0;
}
