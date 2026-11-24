import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as set from 'weeljack-ng/icon';
import { WjIcon, type WjIconDef } from 'weeljack-ng/icon';
import { WjIconHarness } from 'weeljack-ng/icon/testing';

/** Whether the export is a generated icon constant: an object whose name starts with `wjIcon`. */
function isIcon(entry: [string, unknown]): entry is [string, WjIconDef] {
  return entry[0].startsWith('wjIcon') && typeof entry[1] === 'object' && entry[1] !== null;
}

const ICONS: [string, WjIconDef][] = Object.entries(set).filter(isIcon);

const pascal = (name: string): string =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/** Every icon in one host. */
@Component({
  selector: 'wj-icon-set-host',
  imports: [WjIcon],
  template: `
    @for (def of icons(); track def.name) {
      <wj-icon [icon]="def" />
    }
  `,
})
class Host {
  readonly icons = input.required<readonly WjIconDef[]>();
}

async function renderAll(): Promise<ReturnType<typeof TestBed.createComponent<Host>>> {
  const fixture = TestBed.createComponent(Host);
  fixture.componentRef.setInput(
    'icons',
    ICONS.map(([, def]) => def),
  );
  await fixture.whenStable();
  return fixture;
}

describe('the icon set', () => {
  it('holds 85 icons, and wjIconDef is not one of them', () => {
    expect(ICONS).toHaveLength(85);
    expect(ICONS.map(([name]) => name)).not.toContain('wjIconDef');
  });

  it('names every constant after its icon', () => {
    for (const [exported, def] of ICONS) {
      expect(exported).toBe(`wjIcon${pascal(def.name)}`);
    }
  });

  it('renders every icon: viewBox, shapes and name', async () => {
    const fixture = await renderAll();
    const hosts = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('wj-icon'));

    expect(hosts).toHaveLength(85);
    for (const [index, [exported, def]] of ICONS.entries()) {
      const host = hosts[index];
      const svg = host?.querySelector('svg');
      expect(svg?.getAttribute('viewBox'), exported).toBe('0 0 24 24');
      expect(svg?.children.length, exported).toBe(def.nodes.length);
      expect(def.nodes.length, exported).toBeGreaterThan(0);
      expect(host?.getAttribute('data-icon'), exported).toBe(def.name);
      expect(def.name, exported).not.toBe('');
    }
  });

  it('finds an icon by name with the harness', async () => {
    const fixture = await renderAll();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const trash = await loader.getHarness(WjIconHarness.with({ name: 'trash' }));
    expect(await trash.getName()).toBe('trash');
    expect(await trash.getShapeCount()).toBe(set.wjIconTrash.nodes.length);
    expect(await loader.getAllHarnesses(WjIconHarness)).toHaveLength(85);
  });
});
