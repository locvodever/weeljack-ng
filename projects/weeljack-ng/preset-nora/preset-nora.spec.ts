import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Tree } from '@openng/optimus-ui/tree';
import { provideWeeljack, type WjPreset } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjMessage } from 'weeljack-ng/message';
import { wjNora } from 'weeljack-ng/preset-nora';
import { WjTheme } from 'weeljack-ng/theme';
import { describePresetContract } from '../spec-support/preset-contract';
import { capture, expectPage } from '../spec-support/theme-snapshot';

describePresetContract('wjNora', wjNora);

/** A form-field wrapper, a content wrapper (the message) and an Aura component with a sheet of its own. */
@Component({
  selector: 'wj-nora-host',
  imports: [WjButton, WjMessage, Tree],
  template: `
    <wj-button label="Save" />
    <wj-message>Saved</wj-message>
    @if (showTree()) {
      <p-tree [value]="nodes" />
    }
  `,
})
class NoraHost {
  readonly showTree = signal(true);
  protected readonly nodes = [{ key: 'root', label: 'Root' }];
}

const ROOT = document.documentElement;
const TREE_SHEET = 'style[data-optimus-style-id="tree-style"]';

async function render(
  preset: WjPreset | undefined,
  options: { dark?: boolean; tree?: boolean } = {},
): Promise<ComponentFixture<NoraHost>> {
  if (options.dark === true) {
    ROOT.classList.add('wj-dark');
  }
  TestBed.configureTestingModule({
    providers: [
      provideWeeljack(preset === undefined ? { darkMode: 'class' } : { preset, darkMode: 'class' }),
    ],
  });
  const fixture = TestBed.createComponent(NoraHost);
  fixture.componentInstance.showTree.set(options.tree ?? false);
  document.body.appendChild(fixture.nativeElement as HTMLElement);
  await fixture.whenStable();
  return fixture;
}

function cleanUp(): void {
  ROOT.classList.remove('wj-dark');
  document.body.replaceChildren();
  document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
    style.remove();
  });
  TestBed.resetTestingModule();
}

function find(root: ParentNode, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (found === null) {
    throw new Error(`the fixture rendered nothing for '${selector}'`);
  }
  return found;
}

describe('wjNora: its own look', () => {
  afterEach(cleanUp);

  describe.each([false, true])('dark %s', (dark) => {
    it('keeps Nora 2 px corners on a form-field wrapper and a content wrapper (the message), and no motion', async () => {
      const fixture = await render(wjNora, { dark });
      const root = fixture.nativeElement as HTMLElement;
      const button = find(root, 'wj-button button');
      const message = find(root, 'p-message');

      expect(getComputedStyle(button).borderTopLeftRadius).toBe('2px');
      expect(getComputedStyle(message).borderTopLeftRadius).toBe('2px');
      expect(getComputedStyle(button).getPropertyValue('--wj-form-field-border-radius')).toBe(
        '2px',
      );
      expect(getComputedStyle(message).getPropertyValue('--wj-content-border-radius')).toBe('2px');
      expect(getComputedStyle(button).getPropertyValue('--wj-transition-duration')).toBe('0s');
    });
  });

  describe('stale component sheets with the real Nora base', () => {
    it('drops the sheet of an unmounted Aura component on setPreset, and returns to a fresh Noir', async () => {
      const fixture = await render(undefined, { tree: true });
      expect(document.head.querySelector(TREE_SHEET)).not.toBeNull();

      fixture.componentInstance.showTree.set(false);
      fixture.detectChanges();
      const theme = TestBed.inject(WjTheme);
      theme.setPreset(wjNora);
      await fixture.whenStable();

      expect(document.head.querySelector(TREE_SHEET)).toBeNull();

      theme.setPreset();
      await fixture.whenStable();
      const returned = capture();
      cleanUp();

      await render(undefined);
      expectPage(returned, capture());
    });
  });
});
