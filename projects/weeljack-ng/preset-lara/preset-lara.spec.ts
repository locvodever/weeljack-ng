import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideWeeljack, type WjTreeNode } from 'weeljack-ng';
import { WjTheme } from 'weeljack-ng/theme';
import { WjTree } from 'weeljack-ng/tree';
import { wjLara } from 'weeljack-ng/preset-lara';
import { describePresetContract } from '../spec-support/preset-contract';
import { SHEETS, capture, expectPage, styleSheets } from '../spec-support/theme-snapshot';

describePresetContract('wjLara', wjLara);

/** A host that mounts and unmounts a tree: Aura gives Optimus's tree a `css` block, Lara gives none. */
@Component({
  selector: 'wj-lara-tree-host',
  imports: [WjTree],
  template: `
    @if (showTree()) {
      <wj-tree ariaLabel="Files" [value]="nodes" />
    }
  `,
})
class TreeHost {
  readonly showTree = signal(false);
  protected readonly nodes: WjTreeNode[] = [{ key: 'root', label: 'Root' }];
}

const ROOT = document.documentElement;
const TREE_SHEET = 'style[data-optimus-style-id="tree-style"]';

async function render(
  options: Parameters<typeof provideWeeljack>[0],
  tree: boolean,
): Promise<ComponentFixture<TreeHost>> {
  TestBed.configureTestingModule({ providers: [provideWeeljack(options)] });
  const fixture = TestBed.createComponent(TreeHost);
  fixture.componentInstance.showTree.set(tree);
  document.body.appendChild(fixture.nativeElement as HTMLElement);
  await fixture.whenStable();
  return fixture;
}

function clearPage(): void {
  ROOT.classList.remove('wj-dark');
  document.body.replaceChildren();
  document.head.querySelectorAll(SHEETS).forEach((style) => {
    style.remove();
  });
  TestBed.resetTestingModule();
}

describe('wjLara runtime switch from Noir', () => {
  afterEach(clearPage);

  it('drops the sheet of an unmounted Aura tree and writes it again on remount', async () => {
    const fixture = await render({ darkMode: 'class' }, true);
    expect(document.head.querySelector(TREE_SHEET)).not.toBeNull();

    fixture.componentInstance.showTree.set(false);
    fixture.detectChanges();
    TestBed.inject(WjTheme).setPreset(wjLara);
    await fixture.whenStable();

    expect(document.head.querySelector(TREE_SHEET)).toBeNull();
    const without = capture();

    fixture.componentInstance.showTree.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const remounted = capture();
    clearPage();

    await render({ preset: wjLara, darkMode: 'class' }, false);
    const freshWithout = capture();
    clearPage();

    await render({ preset: wjLara, darkMode: 'class' }, true);
    const freshWith = capture();

    // No `-style` sheet a fresh Lara bootstrap lacks, and the same text for each one it has.
    expect(Object.keys(without.sheets)).toEqual(Object.keys(freshWithout.sheets));
    expect(Object.keys(styleSheets())).toContain('tree-style');
    expectPage(without, freshWithout);
    // `capture()` reads every `--wj-*` variable light, then dark, so both schemes are compared.
    expectPage(remounted, freshWith);
  });
});
