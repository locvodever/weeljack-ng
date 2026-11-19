import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import {
  WjSplitter,
  WjSplitterPanel,
  type WjSplitterOrientation,
  type WjSplitterPt,
  type WjSplitterResizeEvent,
} from 'weeljack-ng/splitter';
import { WjSplitterHarness, WjSplitterPanelHarness } from 'weeljack-ng/splitter/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

const WJ0120 =
  'WJ0120: wj-splitter: its panels changed after the first render, and Optimus reads them once. ' +
  'Render a new wj-splitter to change its panels (for example inside @if). ' +
  'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0120';

/**
 * A consumer's template: native buttons around one splitter in a 600 px column. The splitter is
 * 200 px tall unless `height` clears it. The first panel holds a `wj-button`, so a harness inside a
 * panel is reachable; a third panel appears with `third`. Every input is driven by a signal.
 */
@Component({
  selector: 'wj-splitter-host',
  imports: [WjSplitter, WjSplitterPanel, WjButton],
  template: `
    <button type="button" id="before">Before</button>
    <div style="inline-size: 600px">
      <wj-splitter
        [orientation]="orientation()"
        [step]="step()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
        [style.block-size]="height()"
        (resizeEnd)="ended($event)"
      >
        <wj-splitter-panel [size]="size()" [minSize]="minSize()">
          <div class="pane" style="padding: 16px">
            <strong>Files</strong>
            <wj-button label="Open" size="small" severity="secondary" />
          </div>
        </wj-splitter-panel>
        <wj-splitter-panel [size]="secondSize()" [minSize]="secondMin()">
          <div class="pane" style="padding: 16px"><strong>Editor</strong> Text</div>
        </wj-splitter-panel>
        @if (third()) {
          <wj-splitter-panel>
            <div class="pane" style="padding: 16px"><strong>Console</strong> Output</div>
          </wj-splitter-panel>
        }
      </wj-splitter>
    </div>
    <span id="caption">Caption</span>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly orientation = signal<WjSplitterOrientation>('horizontal');
  readonly step = signal<number | string | undefined>(undefined);
  readonly height = signal<string | null>('200px');
  readonly size = signal<number | undefined>(30);
  readonly minSize = signal<number | undefined>(undefined);
  readonly secondSize = signal<number | undefined>(undefined);
  readonly secondMin = signal<number | undefined>(undefined);
  readonly third = signal(false);
  readonly ariaLabel = signal<string | undefined>('Resize the file list');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjSplitterPt>(undefined);
  readonly sizes = signal<WjSplitterResizeEvent[]>([]);

  ended(event: WjSplitterResizeEvent): void {
    this.sizes.update((all) => [...all, event]);
  }
}

/** A consumer who writes `aria-*` on the host instead of using the inputs. */
@Component({
  selector: 'wj-splitter-aria-host',
  imports: [WjSplitter, WjSplitterPanel],
  template: `
    <wj-splitter aria-label="Other">
      <wj-splitter-panel>One</wj-splitter-panel>
      <wj-splitter-panel>Two</wj-splitter-panel>
    </wj-splitter>
  `,
})
class AriaOnHostHost {}

/** A minimal consumer, to render without `provideWeeljack`. */
@Component({
  selector: 'wj-splitter-bare-host',
  imports: [WjSplitter, WjSplitterPanel],
  template: `
    <wj-splitter>
      <wj-splitter-panel>One</wj-splitter-panel>
      <wj-splitter-panel>Two</wj-splitter-panel>
    </wj-splitter>
  `,
})
class BareHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  splitter: WjSplitterHarness;
  element: HTMLElement;
}

function find<E extends Element>(root: ParentNode, selector: string, type: new () => E): E {
  const found = root.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

function findAll(root: ParentNode, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll(selector)).filter(
    (found): found is HTMLElement => found instanceof HTMLElement,
  );
}

const rootOf = (root: ParentNode): HTMLElement => find(root, 'p-splitter', HTMLElement);
const hostOf = (root: ParentNode): HTMLElement => find(root, 'wj-splitter', HTMLElement);
const byId = (root: ParentNode, id: string): HTMLElement => find(root, `#${id}`, HTMLElement);
const panelsOf = (root: ParentNode): HTMLElement[] => findAll(root, '[data-pc-section="panel"]');
const guttersOf = (root: ParentNode): HTMLElement[] => findAll(root, '[data-pc-section="gutter"]');
const handlesOf = (root: ParentNode): HTMLElement[] =>
  findAll(root, '[data-pc-section="gutterhandle"]');

/** The colour a CSS value resolves to inside `root`, as the browser reports it. */
function resolveColour(root: HTMLElement, value: string): string {
  const probe = document.createElement('i');
  probe.style.color = value;
  root.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
}

/** Relative luminance of an `rgb()`/`rgba()` colour, as WCAG defines it. */
function luminance(colour: string): number {
  const channels = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(colour);
  if (channels === null) {
    throw new Error(`Not an rgb colour: ${colour}`);
  }
  const [red = 0, green = 0, blue = 0] = channels.slice(1, 4).map((channel) => {
    const value = Number(channel) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(a: string, b: string): number {
  const [light = 0, dark = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Renders the host with `provideWeeljack` in the given scheme, then runs `setup` before the first
 * check. It proves Optimus's styles loaded (the root is a flex box with a 1 px edge) and that the
 * panels drew on that first pass.
 */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  setup(host);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  expect(getComputedStyle(rootOf(element)).display).toBe('flex');
  expect(getComputedStyle(rootOf(element)).borderTopWidth).toBe('1px');
  const splitter = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjSplitterHarness);
  return { fixture, host, splitter, element };
}

/** Renders one of the small hosts with `provideWeeljack` (or without it). */
async function renderSmall<T>(
  type: new () => T,
  withProvider = true,
): Promise<{ fixture: ComponentFixture<T>; element: HTMLElement }> {
  if (withProvider) {
    TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  }
  const fixture = TestBed.createComponent(type);
  await fixture.whenStable();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

/** Parks the pointer on a neutral element, so no hover state recolours a mark. */
async function parkPointer(element: HTMLElement): Promise<void> {
  await userEvent.hover(byId(element, 'caption'));
}

/** Whether Optimus is mid-resize: it sets this class when a resize starts and drops it at its end. */
const resizing = (element: HTMLElement): boolean =>
  rootOf(element).classList.contains('p-splitter-resizing');

/**
 * Presses `key` on the focused gutter the way Optimus needs it: held until its 40 ms timer has
 * acted (a resize has started), then released, which ends the resize. Nothing sleeps: the spec
 * polls Optimus's own state.
 */
async function press(element: HTMLElement, key: string): Promise<void> {
  await userEvent.keyboard(`{${key}>}`);
  await expect.poll(() => resizing(element)).toBe(true);
  await userEvent.keyboard(`{/${key}}`);
  await expect.poll(() => resizing(element)).toBe(false);
}

/**
 * Moves focus onto the first gutter the way a user does: Tab from the control before the
 * splitter, past the button inside the first panel.
 */
async function tabToGutter(element: HTMLElement): Promise<void> {
  byId(element, 'before').focus();
  await userEvent.tab();
  await userEvent.tab();
}

const widthOf = (panel: HTMLElement): number => panel.getBoundingClientRect().width;
const heightOf = (panel: HTMLElement): number => panel.getBoundingClientRect().height;

/** The documented states for axe (FR-43), each with the separators named by `ariaLabel`. */
const STATES: [string, (host: Host) => void][] = [
  ['horizontal with two panels', () => undefined],
  [
    'vertical with two panels',
    (host) => {
      host.orientation.set('vertical');
    },
  ],
  [
    'three panels',
    (host) => {
      host.third.set(true);
    },
  ],
];

describe('WjSplitter', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and the handle's ring transitions. Measure
    // the end state, not the animation.
    const noMotion = document.createElement('style');
    noMotion.id = 'wj-spec-no-motion';
    noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.append(noMotion);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('panels', () => {
    it('draw on the first paint, in order, at their sizes', async () => {
      const { element, splitter } = await render();

      // Optimus reads its panels once, in `onAfterContentInit`: nothing waited for a second pass.
      expect(panelsOf(element)).toHaveLength(2);
      expect(panelsOf(element).map((panel) => panel.textContent.trim())).toEqual([
        'FilesOpen',
        'Editor Text',
      ]);
      expect(await splitter.getGutterCount()).toBe(1);
      const [first = 0, second = 0] = await splitter.getPanelSizes();
      expect(first).toBeCloseTo(30, 0);
      expect(second).toBeCloseTo(70, 0);
    });

    it('share what the sized panels leave, equally', async () => {
      const { splitter } = await render('light', (host) => {
        host.size.set(20);
        host.third.set(true);
      });

      const sizes = await splitter.getPanelSizes();
      expect(sizes).toHaveLength(3);
      expect(sizes[0]).toBeCloseTo(20, 0);
      expect(sizes[1]).toBeCloseTo(40, 0);
      expect(sizes[2]).toBeCloseTo(40, 0);
    });

    it('split equally when none has a size', async () => {
      const { splitter } = await render('light', (host) => {
        host.size.set(undefined);
      });

      const [first = 0, second = 0] = await splitter.getPanelSizes();
      expect(first).toBeCloseTo(50, 0);
      expect(second).toBeCloseTo(50, 0);
    });

    it('follow a size that changes later', async () => {
      const { host, splitter } = await render();

      host.size.set(60);

      await expect.poll(async () => (await splitter.getPanelSizes())[0]).toBeCloseTo(60, 0);
    });

    it('lay out side by side for horizontal and stacked for vertical', async () => {
      const { element, splitter } = await render();
      const [left, right] = panelsOf(element);
      expect(await splitter.getOrientation()).toBe('horizontal');
      expect(left?.getBoundingClientRect().right).toBeLessThanOrEqual(
        right?.getBoundingClientRect().left ?? 0,
      );
      expect(heightOf(left ?? element)).toBeCloseTo(heightOf(right ?? element), 0);
    });

    it('stack for vertical, sized along the height', async () => {
      const { element, splitter } = await render('light', (host) => {
        host.orientation.set('vertical');
      });
      const [top, bottom] = panelsOf(element);

      expect(await splitter.getOrientation()).toBe('vertical');
      expect(top?.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        bottom?.getBoundingClientRect().top ?? 0,
      );
      expect(widthOf(top ?? element)).toBeCloseTo(widthOf(bottom ?? element), 0);
      const [first = 0] = await splitter.getPanelSizes();
      expect(first).toBeCloseTo(30, 0);
    });

    it('follow an orientation that changes later', async () => {
      const { element, host, splitter } = await render();

      host.orientation.set('vertical');

      await expect.poll(() => splitter.getOrientation()).toBe('vertical');
      await expect.poll(() => widthOf(panelsOf(element)[0] ?? element)).toBeGreaterThan(500);
    });

    it('reach the harnesses inside them', async () => {
      const { fixture, splitter } = await render();

      const [files, editor] = await splitter.getPanels();
      expect(files).toBeInstanceOf(WjSplitterPanelHarness);
      expect(await files?.getHarness(WjButtonHarness.with({ label: 'Open' }))).toBeDefined();
      expect(await files?.countHarnesses(WjButtonHarness)).toBe(1);
      expect(await editor?.countHarnesses(WjButtonHarness)).toBe(0);
      const size = await files?.getSize();
      expect(size?.height).toBe(198);
      expect(size?.width).toBeGreaterThan(100);
      const found =
        await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjSplitterPanelHarness);
      expect(found).toHaveLength(2);
    });

    it('leave the panel parts hidden, empty and after the Optimus root', async () => {
      const { element } = await render();
      const hosted = Array.from(element.querySelectorAll('wj-splitter-panel'));
      const [first, second] = Array.from(hostOf(element).children);

      expect(hosted).toHaveLength(2);
      for (const part of hosted) {
        expect(part.hasAttribute('hidden')).toBe(true);
        expect(getComputedStyle(part).display).toBe('none');
        expect(part.children).toHaveLength(0);
        expect(part.textContent).toBe('');
      }
      expect(first).toBe(rootOf(element));
      expect(second?.localName).toBe('wj-splitter-panel');
      expect(hostOf(element).lastElementChild?.localName).toBe('wj-splitter-panel');
    });
  });

  describe('layout', () => {
    it('reaches the root with a height set on the host, and the host box equals the root box', async () => {
      const { element } = await render();

      expect(hostOf(element).getBoundingClientRect().height).toBe(200);
      expect(rootOf(element).getBoundingClientRect().height).toBe(200);
      expect(getComputedStyle(hostOf(element)).display).toBe('block');
      expect(hostOf(element).getBoundingClientRect().toJSON()).toEqual(
        rootOf(element).getBoundingClientRect().toJSON(),
      );
    });

    it('is as tall as its tallest panel when the app sets no height, and still the root box', async () => {
      const { element } = await render('light', (host) => {
        host.height.set(null);
      });

      expect(hostOf(element).getBoundingClientRect().height).toBeGreaterThan(24);
      expect(hostOf(element).getBoundingClientRect().height).toBeLessThan(200);
      expect(hostOf(element).getBoundingClientRect().toJSON()).toEqual(
        rootOf(element).getBoundingClientRect().toJSON(),
      );
    });

    it('keeps Optimus’s 1 px edge and 6 px radius', async () => {
      const { element } = await render();

      expect(getComputedStyle(rootOf(element)).borderTopWidth).toBe('1px');
      expect(getComputedStyle(rootOf(element)).borderTopLeftRadius).toBe('6px');
    });
  });

  describe('gutter', () => {
    it('keeps its 4 px, so Optimus’s panel sizes still add up', async () => {
      const { element } = await render();
      const [gutter] = guttersOf(element);
      const [left, right] = panelsOf(element);

      expect(gutter?.getBoundingClientRect().width).toBe(4);
      expect(gutter?.getBoundingClientRect().height).toBe(198);
      expect(gutter?.getBoundingClientRect().left).toBeCloseTo(
        left?.getBoundingClientRect().right ?? 0,
        0,
      );
      expect(gutter?.getBoundingClientRect().right).toBeCloseTo(
        right?.getBoundingClientRect().left ?? 0,
        0,
      );
    });

    it.each<Scheme>(['light', 'dark'])(
      'draws a line of --wj-surface-500 that meets 3:1 against the panels: %s',
      async (scheme) => {
        const { element } = await render(scheme);
        await parkPointer(element);
        const [gutter] = guttersOf(element);
        const line = getComputedStyle(gutter ?? element).backgroundColor;
        const panels = getComputedStyle(rootOf(element)).backgroundColor;

        expect(line).toBe(resolveColour(element, 'var(--wj-surface-500)'));
        expect(contrastRatio(line, panels)).toBeGreaterThanOrEqual(3);
      },
    );

    it('draws a line of the same colour for a vertical splitter', async () => {
      const { element } = await render('light', (host) => {
        host.orientation.set('vertical');
      });
      await parkPointer(element);
      const [gutter] = guttersOf(element);

      expect(getComputedStyle(gutter ?? element).backgroundColor).toBe(
        resolveColour(element, 'var(--wj-surface-500)'),
      );
      expect(gutter?.getBoundingClientRect().height).toBe(4);
    });

    it('grows the handle to a 24 px square centred on the line, without growing the gutter', async () => {
      const { element } = await render();
      const [gutter] = guttersOf(element);
      const [handle] = handlesOf(element);
      const line = gutter?.getBoundingClientRect();
      const box = handle?.getBoundingClientRect();

      expect(box?.width).toBe(24);
      expect(box?.height).toBe(24);
      expect((box?.left ?? 0) + 12).toBeCloseTo((line?.left ?? 0) + 2, 0);
      expect((box?.top ?? 0) + 12).toBeCloseTo((line?.top ?? 0) + (line?.height ?? 0) / 2, 0);
      expect(line?.width).toBe(4);
    });

    it('grows the handle across a vertical splitter too', async () => {
      const { element } = await render('light', (host) => {
        host.orientation.set('vertical');
      });
      const [gutter] = guttersOf(element);
      const [handle] = handlesOf(element);
      const line = gutter?.getBoundingClientRect();
      const box = handle?.getBoundingClientRect();

      expect(box?.width).toBe(24);
      expect(box?.height).toBe(24);
      expect((box?.top ?? 0) + 12).toBeCloseTo((line?.top ?? 0) + 2, 0);
      expect(line?.height).toBe(4);
    });

    it('takes the pointer over 10 px either side of the line, and no further', async () => {
      const { element } = await render();
      const [gutter] = guttersOf(element);
      const [handle] = handlesOf(element);
      const line = gutter?.getBoundingClientRect();
      const y = (line?.top ?? 0) + (line?.height ?? 0) / 2;
      const middle = (line?.left ?? 0) + 2;
      const hits = (offset: number): Element | null =>
        document.elementFromPoint(middle + offset, y);

      for (const offset of [-11, 0, 11]) {
        expect(hits(offset), `at ${String(offset)}`).toBe(handle);
      }
      for (const offset of [-13, 13]) {
        expect(hits(offset), `at ${String(offset)}`).not.toBe(handle);
      }
    });

    it('draws the 2 px ring, 2 px out, around the focused handle', async () => {
      const { element, splitter } = await render();
      await parkPointer(element);
      const [handle] = handlesOf(element);
      expect(getComputedStyle(handle ?? element).outlineStyle).toBe('none');

      await tabToGutter(element);

      expect(await splitter.isGutterFocused()).toBe(true);
      const ring = getComputedStyle(handle ?? element);
      expect(ring.outlineWidth).toBe('2px');
      expect(ring.outlineStyle).toBe('solid');
      expect(ring.outlineOffset).toBe('2px');
      expect(ring.outlineColor).toBe(resolveColour(element, 'var(--wj-focus-ring-color)'));
    });
  });

  describe('keyboard', () => {
    it('Tab reaches each gutter in order, then moves on', async () => {
      const { element, splitter } = await render('light', (host) => {
        host.third.set(true);
      });
      expect(await splitter.getGutterCount()).toBe(2);
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(document.activeElement?.closest('wj-button')).not.toBeNull();
      await userEvent.tab();
      expect(await splitter.isGutterFocused(0)).toBe(true);
      expect(document.activeElement).toBe(handlesOf(element)[0]);

      await userEvent.tab();
      expect(await splitter.isGutterFocused(1)).toBe(true);
      expect(document.activeElement).toBe(handlesOf(element)[1]);

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));
    });

    it('Tab meets the control inside the first panel before the gutter, in reading order', async () => {
      const { element, splitter } = await render();
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(document.activeElement?.closest('wj-button')).not.toBeNull();
      expect(await splitter.isGutterFocused()).toBe(false);

      await userEvent.tab();
      expect(await splitter.isGutterFocused()).toBe(true);
    });

    it('ArrowRight grows the first panel by step px and ArrowLeft shrinks it, and the value follows', async () => {
      const { element, splitter } = await render();
      const first = (): number => widthOf(panelsOf(element)[0] ?? element);
      const start = first();
      const startValue = await splitter.getGutterValue();
      await tabToGutter(element);

      await press(element, 'ArrowRight');

      // Optimus measures against the root's outer width, so a step is 5 px to within a pixel.
      expect(first() - start).toBeGreaterThan(3);
      expect(first() - start).toBeLessThan(8);
      const grown = first();
      await expect.poll(() => splitter.getGutterValue()).toBeGreaterThan(startValue ?? 0);
      const grownValue = await splitter.getGutterValue();

      await press(element, 'ArrowLeft');

      expect(grown - first()).toBeGreaterThan(3);
      expect(grown - first()).toBeLessThan(8);
      await expect.poll(() => splitter.getGutterValue()).toBeLessThan(grownValue ?? 0);
      expect(await splitter.isGutterFocused()).toBe(true);
    });

    it('moves by the step input: 10 px a key', async () => {
      const { element, host } = await render('light', (instance) => {
        instance.step.set(10);
      });
      const first = (): number => widthOf(panelsOf(element)[0] ?? element);
      const start = first();
      await tabToGutter(element);

      await press(element, 'ArrowRight');

      expect(first() - start).toBeGreaterThan(8);
      expect(first() - start).toBeLessThan(14);

      host.step.set('20');
      const before = first();
      await press(element, 'ArrowRight');
      expect(first() - before).toBeGreaterThan(18);
      expect(first() - before).toBeLessThan(25);
    });

    it('ignores ArrowUp and ArrowDown on a horizontal splitter', async () => {
      const { element, splitter } = await render();
      const sizes = await splitter.getPanelSizes();
      await tabToGutter(element);
      // spec-timing: Optimus acts on a key through its own setTimeout, so the spec advances it
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      try {
        for (const key of ['ArrowUp', 'ArrowDown']) {
          await userEvent.keyboard(`{${key}>}`);
          vi.advanceTimersByTime(200);
          expect(resizing(element), `${key} held`).toBe(false);
          await userEvent.keyboard(`{/${key}}`);
        }
      } finally {
        vi.useRealTimers();
      }

      expect(await splitter.getPanelSizes()).toEqual(sizes);
    });

    it('ArrowDown grows the first panel of a vertical splitter and ArrowUp shrinks it', async () => {
      const { element, splitter } = await render('light', (host) => {
        host.orientation.set('vertical');
      });
      const first = (): number => heightOf(panelsOf(element)[0] ?? element);
      const start = first();
      const startValue = await splitter.getGutterValue();
      await tabToGutter(element);

      await press(element, 'ArrowDown');

      expect(first() - start).toBeGreaterThan(3);
      expect(first() - start).toBeLessThan(8);
      const grown = first();
      await expect.poll(() => splitter.getGutterValue()).toBeGreaterThan(startValue ?? 0);

      await press(element, 'ArrowUp');

      expect(grown - first()).toBeGreaterThan(3);
      expect(grown - first()).toBeLessThan(8);
    });

    it('ignores ArrowLeft and ArrowRight on a vertical splitter', async () => {
      const { element, splitter } = await render('light', (host) => {
        host.orientation.set('vertical');
      });
      const sizes = await splitter.getPanelSizes();
      await tabToGutter(element);
      // spec-timing: Optimus acts on a key through its own setTimeout, so the spec advances it
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      try {
        for (const key of ['ArrowLeft', 'ArrowRight']) {
          await userEvent.keyboard(`{${key}>}`);
          vi.advanceTimersByTime(200);
          expect(resizing(element), `${key} held`).toBe(false);
          await userEvent.keyboard(`{/${key}}`);
        }
      } finally {
        vi.useRealTimers();
      }

      expect(await splitter.getPanelSizes()).toEqual(sizes);
    });

    it('does not support Home, End or Enter (documented)', async () => {
      const { element, splitter } = await render();
      const sizes = await splitter.getPanelSizes();
      await tabToGutter(element);

      await userEvent.keyboard('{Home}{End}{Enter}');

      expect(resizing(element)).toBe(false);
      expect(await splitter.getPanelSizes()).toEqual(sizes);
    });

    it('stops at minSize, which Optimus checks for two panels', async () => {
      const { element, fixture, splitter } = await render('light', (host) => {
        host.minSize.set(30);
      });
      const start = widthOf(panelsOf(element)[0] ?? element);
      await tabToGutter(element);

      const startValue = await splitter.getGutterValue();

      await press(element, 'ArrowLeft');
      expect(widthOf(panelsOf(element)[0] ?? element)).toBeCloseTo(start, 0);
      // Optimus alone would report the size it refused; the value follows the size it applied.
      await fixture.whenStable();
      expect(await splitter.getGutterValue()).toBe(startValue);

      await press(element, 'ArrowRight');
      expect(widthOf(panelsOf(element)[0] ?? element)).toBeGreaterThan(start + 3);
      expect(await splitter.getGutterCount()).toBe(1);
    });

    it('stops the second panel at its own minSize', async () => {
      const { element } = await render('light', (host) => {
        host.secondMin.set(70);
      });
      const start = widthOf(panelsOf(element)[0] ?? element);
      await tabToGutter(element);

      await press(element, 'ArrowRight');
      expect(widthOf(panelsOf(element)[0] ?? element)).toBeCloseTo(start, 0);

      await press(element, 'ArrowLeft');
      expect(widthOf(panelsOf(element)[0] ?? element)).toBeLessThan(start - 3);
    });
  });

  describe('resizeEnd', () => {
    it('emits once, with one number per panel, after a keyboard resize ends', async () => {
      const { element, host } = await render();
      await tabToGutter(element);
      expect(host.sizes()).toEqual([]);

      await press(element, 'ArrowRight');

      expect(host.sizes()).toHaveLength(1);
      const [event] = host.sizes();
      expect(Object.keys(event ?? {})).toEqual(['sizes']);
      expect(event?.sizes).toHaveLength(2);
      expect(event?.sizes.every((size) => typeof size === 'number')).toBe(true);
      expect(event?.sizes[0]).toBeGreaterThan(30);
      expect(event?.sizes[0]).toBeLessThan(32);
      expect(event?.sizes[1]).toBeLessThan(70);

      await press(element, 'ArrowLeft');
      expect(host.sizes()).toHaveLength(2);
    });

    it('stays silent while the key is held, and when Tab arrives on a gutter', async () => {
      const { element, host } = await render();

      await tabToGutter(element);
      // The key-up of that Tab lands on the gutter, where Optimus would report a resize.
      expect(host.sizes()).toEqual([]);

      await userEvent.keyboard('{ArrowRight>}');
      await expect.poll(() => resizing(element)).toBe(true);
      expect(host.sizes()).toEqual([]);
      await userEvent.keyboard('{/ArrowRight}');
      await expect.poll(() => host.sizes().length).toBe(1);
    });

    it('stays silent for a key-up that moved nothing, such as ArrowUp or Tab away', async () => {
      const { element, host } = await render();
      await tabToGutter(element);

      await userEvent.keyboard('{ArrowUp}{ArrowDown}{Home}');
      await userEvent.tab();
      await userEvent.tab({ shift: true });
      await userEvent.tab({ shift: true });

      expect(host.sizes()).toEqual([]);
    });

    it('emits once after a pointer drag, from synthetic events at fixed coordinates', async () => {
      const { element, host, splitter } = await render();
      const [gutter] = guttersOf(element);
      const line = gutter?.getBoundingClientRect();
      const x = (line?.left ?? 0) + 2;
      const y = (line?.top ?? 0) + (line?.height ?? 0) / 2;
      const start = widthOf(panelsOf(element)[0] ?? element);
      // 8 px off the line: the handle's hit box, not the 4 px gutter, takes the mousedown.
      const target = document.elementFromPoint(x + 8, y);
      expect(target).toBe(handlesOf(element)[0]);
      const at = (type: string, left: number): MouseEvent =>
        new MouseEvent(type, { bubbles: true, cancelable: true, clientX: left, clientY: y });

      target?.dispatchEvent(at('mousedown', x + 8));
      document.dispatchEvent(at('mousemove', x + 8 + 60));
      expect(resizing(element)).toBe(true);
      expect(host.sizes()).toEqual([]);
      document.dispatchEvent(at('mouseup', x + 8 + 60));

      await expect.poll(() => host.sizes().length).toBe(1);
      const grown = widthOf(panelsOf(element)[0] ?? element) - start;
      expect(grown).toBeGreaterThan(57);
      expect(grown).toBeLessThan(63);
      expect(host.sizes()[0]?.sizes[0]).toBeGreaterThan(30);
      expect((await splitter.getPanelSizes())[0]).toBeGreaterThan(38);
    });
  });

  describe('tap to place (FR-16)', () => {
    const ARMED = 'data-wj-armed';
    const isArmed = (element: HTMLElement): boolean =>
      handlesOf(element)[0]?.hasAttribute(ARMED) ?? false;

    /** Presses and releases the first handle where it stands, which arms it. */
    async function arm(element: HTMLElement): Promise<void> {
      await userEvent.click(handlesOf(element)[0] ?? element);
      await expect.poll(() => isArmed(element)).toBe(true);
    }

    /** The first panel's share as the last `resizeEnd` reported it. */
    const lastShare = (host: Host): number | undefined => host.sizes().at(-1)?.sizes[0];

    const fifty = (host: Host): void => {
      host.size.set(50);
    };

    it('places the line where the next tap lands in the first panel, and reports it once', async () => {
      const { element, host, splitter } = await render('light', fifty);
      await arm(element);
      const emitted = host.sizes().length;
      const panel = panelsOf(element)[0] ?? element;

      await userEvent.click(panel, { position: { x: 180, y: 150 } });

      await expect
        .poll(async () => Math.abs(((await splitter.getPanelSizes())[0] ?? 0) - 30) <= 1)
        .toBe(true);
      expect(host.sizes()).toHaveLength(emitted + 1);
      expect(Math.abs((lastShare(host) ?? 0) - 30)).toBeLessThanOrEqual(1);
      expect(isArmed(element)).toBe(false);
    });

    it('places it from a tap in the second panel too', async () => {
      const { element, host, splitter } = await render('light', fifty);
      await arm(element);

      const second = panelsOf(element)[1] ?? element;
      const root = rootOf(element).getBoundingClientRect();
      const tapped = (second.getBoundingClientRect().left + 100 - root.left) / root.width;

      await userEvent.click(second, { position: { x: 100, y: 150 } });

      await expect.poll(() => host.sizes().length).toBeGreaterThan(1);
      const [first = 0] = await splitter.getPanelSizes();
      expect(Math.abs(first - 100 * tapped)).toBeLessThanOrEqual(1.5);
    });

    it('works for a vertical splitter, measured down the page', async () => {
      const { element, host, splitter } = await render('light', (h) => {
        fifty(h);
        h.orientation.set('vertical');
        h.height.set('400px');
      });
      await arm(element);

      await userEvent.click(panelsOf(element)[0] ?? element, { position: { x: 100, y: 120 } });

      await expect.poll(() => host.sizes().length).toBeGreaterThan(1);
      expect(Math.abs(((await splitter.getPanelSizes())[0] ?? 0) - 30)).toBeLessThanOrEqual(1);
    });

    it('moves nothing and disarms when the tap would break a minSize', async () => {
      const { element, splitter } = await render('light', (host) => {
        fifty(host);
        host.minSize.set(40);
      });
      await arm(element);

      await userEvent.click(panelsOf(element)[0] ?? element, { position: { x: 100, y: 150 } });

      await expect.poll(() => isArmed(element)).toBe(false);
      expect(Math.abs(((await splitter.getPanelSizes())[0] ?? 0) - 50)).toBeLessThanOrEqual(1);
    });

    it('is disarmed by Escape, by a second press and by a tap outside the panels', async () => {
      const { element, splitter } = await render('light', fifty);

      await arm(element);
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => isArmed(element)).toBe(false);

      await arm(element);
      await userEvent.click(handlesOf(element)[0] ?? element);
      await expect.poll(() => isArmed(element)).toBe(false);

      await arm(element);
      await userEvent.click(byId(element, 'caption'));
      await expect.poll(() => isArmed(element)).toBe(false);

      // Nothing was placed by any of them.
      expect(Math.abs(((await splitter.getPanelSizes())[0] ?? 0) - 50)).toBeLessThanOrEqual(1);
    });

    it('does not place after it is disarmed', async () => {
      const { element, splitter } = await render('light', fifty);
      await arm(element);
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => isArmed(element)).toBe(false);

      await userEvent.click(panelsOf(element)[0] ?? element, { position: { x: 100, y: 150 } });

      expect(Math.abs(((await splitter.getPanelSizes())[0] ?? 0) - 50)).toBeLessThanOrEqual(1);
    });

    it('keeps the placing tap from reaching a button inside the panel', async () => {
      const { element, host } = await render('light', fifty);
      const clicked = vi.fn();
      const open = find(element, '.pane button', HTMLButtonElement);
      open.addEventListener('click', clicked);
      await arm(element);
      const emitted = host.sizes().length;

      await userEvent.click(open);

      await expect.poll(() => host.sizes().length).toBe(emitted + 1);
      expect(clicked).not.toHaveBeenCalled();
      expect(isArmed(element)).toBe(false);
    });

    it('still resizes by a drag, and a drag does not arm', async () => {
      const { element, host } = await render('light', fifty);
      const [handle] = handlesOf(element);
      const box = handle?.getBoundingClientRect();
      const x = (box?.left ?? 0) + 12;
      const y = (box?.top ?? 0) + 12;
      const event = (type: string, left: number): MouseEvent =>
        new (type.startsWith('pointer') ? PointerEvent : MouseEvent)(type, {
          bubbles: true,
          cancelable: true,
          clientX: left,
          clientY: y,
        });

      handle?.dispatchEvent(event('pointerdown', x));
      handle?.dispatchEvent(event('mousedown', x));
      document.dispatchEvent(event('mousemove', x + 60));
      document.dispatchEvent(event('mouseup', x + 60));
      document.dispatchEvent(event('pointerup', x + 60));

      await expect.poll(() => host.sizes().length).toBe(1);
      expect(host.sizes()[0]?.sizes[0]).toBeGreaterThan(55);
      expect(isArmed(element)).toBe(false);
    });

    it('draws the armed handle with the focus ring and the panels with a crosshair', async () => {
      const { element } = await render('light', fifty);
      const [handle] = handlesOf(element);
      expect(getComputedStyle(hostOf(element)).cursor).toBe('auto');

      await arm(element);
      await userEvent.hover(byId(element, 'caption'));

      const ring = getComputedStyle(handle ?? element);
      expect(ring.outlineWidth).toBe('2px');
      expect(ring.outlineStyle).toBe('solid');
      expect(ring.outlineColor).toBe(resolveColour(element, 'var(--wj-focus-ring-color)'));
      expect(getComputedStyle(hostOf(element)).cursor).toBe('crosshair');
    });

    it.each<Scheme>(['light', 'dark'])('has no axe violations while armed, %s', async (scheme) => {
      const { element } = await render(scheme, fifty);
      await arm(element);
      await userEvent.hover(byId(element, 'caption'));

      await expectNoAxeViolations(hostOf(element));
    });
  });

  describe('ARIA', () => {
    it('makes the handle the one separator of its gutter, with a value, a range and a name', async () => {
      const { element, splitter } = await render();
      const [gutter] = guttersOf(element);
      const [handle] = handlesOf(element);

      expect(findAll(element, '[role="separator"]')).toEqual([handle]);
      expect(gutter?.hasAttribute('role')).toBe(false);
      expect(handle?.getAttribute('role')).toBe('separator');
      expect(handle?.getAttribute('tabindex')).toBe('0');
      expect(await splitter.getGutterMin()).toBe('0');
      expect(await splitter.getGutterMax()).toBe('100');
      expect(await splitter.getGutterValue()).toBeCloseTo(30, 0);
      expect(await splitter.getGutterLabel()).toBe('Resize the file list');
      expect(await splitter.getGutterLabelledBy()).toBeNull();
      expect(await splitter.getGutterDescribedBy()).toBeNull();
      expect(rootOf(element).hasAttribute('aria-label')).toBe(false);
      expect(hostOf(element).hasAttribute('aria-label')).toBe(false);
    });

    it('says the separator of side-by-side panels is vertical, and the other way round', async () => {
      const { element, host, splitter } = await render();
      expect(await splitter.getGutterOrientation()).toBe('vertical');

      host.orientation.set('vertical');
      await expect.poll(() => splitter.getGutterOrientation()).toBe('horizontal');

      host.orientation.set('horizontal');
      await expect.poll(() => splitter.getGutterOrientation()).toBe('vertical');
      expect(handlesOf(element)[0]?.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('routes ariaLabelledBy and ariaDescribedBy, and names every gutter the same', async () => {
      const { splitter } = await render('light', (host) => {
        host.third.set(true);
        host.ariaLabel.set(undefined);
        host.ariaLabelledBy.set('caption');
        host.ariaDescribedBy.set('caption');
      });

      expect(await splitter.getGutterCount()).toBe(2);
      for (const index of [0, 1]) {
        expect(await splitter.getGutterLabelledBy(index)).toBe('caption');
        expect(await splitter.getGutterDescribedBy(index)).toBe('caption');
        expect(await splitter.getGutterLabel(index)).toBeNull();
        expect(await splitter.getGutterMax(index)).toBe('100');
        expect(await splitter.getGutterValue(index)).toEqual(expect.any(Number));
      }
    });

    it('shows one value on every gutter of three panels: the first panel’s share (listed)', async () => {
      const { element, host, splitter } = await render('light', (instance) => {
        instance.third.set(true);
      });
      const initial = await splitter.getGutterValue(0);
      expect(initial).toBeCloseTo(30, 0);
      expect(await splitter.getGutterValue(1)).toBe(initial);
      await tabToGutter(element);
      await userEvent.tab();
      expect(await splitter.isGutterFocused(1)).toBe(true);

      await press(element, 'ArrowRight');

      expect(host.sizes()).toHaveLength(1);
      expect(host.sizes()[0]?.sizes).toHaveLength(3);
      await expect
        .poll(() => splitter.getGutterValue(0))
        .toBeCloseTo(host.sizes()[0]?.sizes[0] ?? 0, 3);
      expect(await splitter.getGutterValue(1)).toBe(await splitter.getGutterValue(0));
    });

    it('takes every routed name off again when its input clears', async () => {
      const { element, host } = await render('light', (instance) => {
        instance.ariaLabelledBy.set('caption');
        instance.ariaDescribedBy.set('caption');
      });
      const [handle] = handlesOf(element);

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set(undefined);
      host.ariaDescribedBy.set(undefined);

      await expect.poll(() => handle?.hasAttribute('aria-label')).toBe(false);
      await expect.poll(() => handle?.hasAttribute('aria-labelledby')).toBe(false);
      await expect.poll(() => handle?.hasAttribute('aria-describedby')).toBe(false);
      expect(handle?.getAttribute('role')).toBe('separator');
      expect(handle?.getAttribute('aria-valuemax')).toBe('100');
    });

    it('keeps a changed name on the handle', async () => {
      const { host, splitter } = await render();

      host.ariaLabel.set('Second');

      await expect.poll(() => splitter.getGutterLabel()).toBe('Second');
    });

    it('shows an HTML payload in the ARIA inputs as attribute text, never as markup', async () => {
      const { element, splitter } = await render('light', (host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });

      expect(await splitter.getGutterLabel()).toBe(PAYLOAD);
      expect(await splitter.getGutterLabelledBy()).toBe(PAYLOAD);
      expect(await splitter.getGutterDescribedBy()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('warns WJ0003 for aria-* on the host and forwards nothing', async () => {
      const { element } = await renderSmall(AriaOnHostHost);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-splitter: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(handlesOf(element)[0]?.hasAttribute('aria-label')).toBe(false);
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      await renderSmall(BareHost, false);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-splitter: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    describe.each<Scheme>(['light', 'dark'])('after updates, %s', (scheme) => {
      it('keeps every routed attribute on the handle and the role off the gutter', async () => {
        const { element, host, splitter } = await render(scheme);
        const landed = async (orientation: string): Promise<void> => {
          const [gutter] = guttersOf(element);
          const [handle] = handlesOf(element);
          expect(gutter?.hasAttribute('role')).toBe(false);
          expect(findAll(element, '[role="separator"]')).toEqual([handle]);
          expect(handle?.getAttribute('aria-orientation')).toBe(orientation);
          expect(handle?.getAttribute('aria-valuemin')).toBe('0');
          expect(handle?.getAttribute('aria-valuemax')).toBe('100');
          expect(await splitter.getGutterLabel()).toBe(host.ariaLabel());
        };
        await landed('vertical');

        await tabToGutter(element);
        await press(element, 'ArrowRight');
        await landed('vertical');

        host.ariaLabel.set('Resize the notes');
        await expect.poll(() => splitter.getGutterLabel()).toBe('Resize the notes');
        await landed('vertical');

        // Optimus types `panel` as required in the object form of `pt`.
        host.pt.set({ panel: undefined, gutter: { 'data-probe': 'g' } });
        await expect.poll(() => guttersOf(element)[0]?.getAttribute('data-probe')).toBe('g');
        await landed('vertical');

        host.orientation.set('vertical');
        await expect
          .poll(() => handlesOf(element)[0]?.getAttribute('aria-orientation'))
          .toBe('horizontal');
        await landed('horizontal');
      });

      it('shows the value on the first paint and after a resize', async () => {
        const { element, splitter } = await render(scheme);

        expect(handlesOf(element)[0]?.hasAttribute('aria-valuenow')).toBe(true);
        expect(await splitter.getGutterValue()).toBeCloseTo(30, 0);
      });
    });
  });

  describe('pt', () => {
    const probe = (name: string): { 'data-probe': string } => ({ 'data-probe': name });
    const at = (element: HTMLElement, name: string): Element | null =>
      element.querySelector(`[data-probe="${name}"]`);

    it('reaches the root, panel, gutter and gutter handle as an object', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          root: probe('root'),
          panel: probe('panel'),
          gutter: probe('gutter'),
          gutterHandle: probe('handle'),
        });
      });

      expect(at(element, 'root')).toBe(rootOf(element));
      expect(at(element, 'gutter')).toBe(guttersOf(element)[0]);
      expect(at(element, 'handle')).toBe(handlesOf(element)[0]);
      expect(at(element, 'panel')).toBe(panelsOf(element)[0]);
      expect(findAll(element, '[data-probe="panel"]')).toHaveLength(2);
      // The routed attributes sit next to the consumer's keys.
      expect(handlesOf(element)[0]?.getAttribute('role')).toBe('separator');
      expect(handlesOf(element)[0]?.getAttribute('aria-label')).toBe('Resize the file list');
      expect(guttersOf(element)[0]?.hasAttribute('role')).toBe(false);
    });

    it('reaches the four parts as a function, and follows a changed pt', async () => {
      const { element, host } = await render('light', (instance) => {
        instance.pt.set({
          root: () => probe('root-fn'),
          panel: () => probe('panel-fn'),
          gutter: () => probe('gutter-fn'),
          gutterHandle: () => probe('handle-fn'),
        });
      });

      expect(at(element, 'root-fn')).toBe(rootOf(element));
      expect(at(element, 'panel-fn')).toBe(panelsOf(element)[0]);
      expect(at(element, 'gutter-fn')).toBe(guttersOf(element)[0]);
      expect(at(element, 'handle-fn')).toBe(handlesOf(element)[0]);
      expect(handlesOf(element)[0]?.getAttribute('role')).toBe('separator');

      host.pt.set({ panel: undefined, gutterHandle: probe('second') });
      await expect.poll(() => at(element, 'second')).toBe(handlesOf(element)[0]);
      expect(handlesOf(element)[0]?.getAttribute('aria-label')).toBe('Resize the file list');
    });

    it('lets a routed attribute win over the consumer’s own value for it', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          panel: undefined,
          gutterHandle: {
            role: 'button',
            'aria-orientation': 'horizontal',
            'aria-label': 'Mine',
            'data-probe': 'kept',
          },
        });
      });
      const [handle] = handlesOf(element);

      expect(handle?.getAttribute('role')).toBe('separator');
      expect(handle?.getAttribute('aria-orientation')).toBe('vertical');
      expect(handle?.getAttribute('aria-label')).toBe('Resize the file list');
      expect(handle?.getAttribute('data-probe')).toBe('kept');
    });
  });

  describe('WJ0120', () => {
    it('warns once, with the documented text, when a panel is added after the first render', async () => {
      const { element, host, fixture } = await render();
      expect(warn).not.toHaveBeenCalled();

      host.third.set(true);
      await expect.poll(() => warn.mock.calls.length).toBe(1);
      host.third.set(false);
      await fixture.whenStable();
      host.third.set(true);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(WJ0120);
      // Nothing else changes: Optimus still draws the two panels it read.
      expect(panelsOf(element)).toHaveLength(2);
      expect(handlesOf(element)).toHaveLength(1);
    });

    it('warns once when a panel goes after the first render, and the rest keep drawing', async () => {
      const { element, host } = await render('light', (instance) => {
        instance.third.set(true);
      });
      expect(panelsOf(element)).toHaveLength(3);

      host.third.set(false);

      await expect.poll(() => warn.mock.calls.length).toBe(1);
      expect(warn).toHaveBeenCalledWith(WJ0120);
      expect(panelsOf(element)).toHaveLength(3);
      expect(panelsOf(element)[0]?.textContent.trim()).toBe('FilesOpen');
    });

    it('stays silent when only sizes, step, labels or orientation change', async () => {
      const { host, fixture } = await render();

      host.size.set(40);
      host.minSize.set(10);
      host.secondSize.set(60);
      host.step.set(8);
      host.ariaLabel.set('Other');
      host.orientation.set('vertical');
      await fixture.whenStable();
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('stays silent for a splitter that renders three panels from the start', async () => {
      await render('light', (host) => {
        host.third.set(true);
      });

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations after a keyboard resize', async () => {
        const { element } = await render(scheme);
        await tabToGutter(element);
        await press(element, 'ArrowRight');

        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations while a gutter has keyboard focus', async () => {
        const { element } = await render(scheme);
        await tabToGutter(element);

        await expectNoAxeViolations(hostOf(element));
      });
    });
  });
});
