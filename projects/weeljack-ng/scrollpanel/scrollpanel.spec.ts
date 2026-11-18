import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjScrollPanel, type WjScrollPanelPt } from 'weeljack-ng/scrollpanel';
import { WjScrollPanelHarness } from 'weeljack-ng/scrollpanel/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Overflow = 'vertical' | 'both' | 'fits';

/**
 * A consumer's template: native buttons around one scroll panel in a 300 px column. The panel is
 * 240 px tall unless `height` clears it. The content is a wrapper that overflows as `overflow`
 * says, padded 16 px with 24 px kept clear at the inline end (and the block end when it scrolls
 * both ways); `control` adds a button inside it. Every input is driven by a signal.
 */
@Component({
  selector: 'wj-scrollpanel-host',
  imports: [WjScrollPanel],
  template: `
    <button type="button" id="before">Before</button>
    <div style="inline-size: 300px">
      <wj-scrollpanel
        [style.height]="height()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
      >
        <div
          class="body"
          [style.block-size]="overflow() === 'fits' ? '40px' : '900px'"
          [style.inline-size]="overflow() === 'both' ? '1200px' : null"
          [style.padding]="'16px 24px ' + (overflow() === 'both' ? '24px' : '16px') + ' 16px'"
          style="box-sizing: border-box"
        >
          Content
          @if (control()) {
            <button
              type="button"
              class="inside"
              style="min-inline-size: 44px; min-block-size: 44px"
            >
              Inside
            </button>
          }
        </div>
      </wj-scrollpanel>
    </div>
    <span id="caption">Terms</span>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly height = signal<string | null>('240px');
  readonly overflow = signal<Overflow>('vertical');
  readonly control = signal(false);
  readonly ariaLabel = signal<string | undefined>('Terms of use');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjScrollPanelPt>(undefined);
}

/** A consumer who writes `aria-*` on the host instead of using the inputs. */
@Component({
  selector: 'wj-scrollpanel-aria-host',
  imports: [WjScrollPanel],
  template: `<wj-scrollpanel aria-label="Other">Content</wj-scrollpanel>`,
})
class AriaOnHostHost {}

/** A minimal consumer, to render without `provideWeeljack`. */
@Component({
  selector: 'wj-scrollpanel-bare-host',
  imports: [WjScrollPanel],
  template: `<wj-scrollpanel>Content</wj-scrollpanel>`,
})
class BareHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  panel: WjScrollPanelHarness;
  element: HTMLElement;
}

function find<E extends Element>(root: ParentNode, selector: string, type: new () => E): E {
  const found = root.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const sectionOf = (root: ParentNode, section: string): HTMLElement =>
  find(root, `[data-pc-section="${section}"]`, HTMLElement);
const regionOf = (root: ParentNode): HTMLElement => sectionOf(root, 'content');
const barXOf = (root: ParentNode): HTMLElement => sectionOf(root, 'barx');
const barYOf = (root: ParentNode): HTMLElement => sectionOf(root, 'bary');
const rootOf = (root: ParentNode): HTMLElement => find(root, 'p-scroll-panel', HTMLElement);
const hostOf = (root: ParentNode): HTMLElement => find(root, 'wj-scrollpanel', HTMLElement);
const byId = (root: ParentNode, id: string): HTMLElement => find(root, `#${id}`, HTMLElement);

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

/** Whether the bar is shown: Optimus hides it with `visibility` once its axis fits. */
const shown = (bar: HTMLElement): boolean =>
  bar.getAttribute('data-p-scrollpanel-hidden') === 'false';

/**
 * Renders the host with `provideWeeljack` in the given scheme, then runs `setup` before the first
 * check. It proves Optimus's styles loaded (the content container clips), because a render
 * without them would pass axe for the wrong reason, and waits for the bars to be measured.
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
  expect(getComputedStyle(sectionOf(element, 'contentcontainer')).overflow).toBe('hidden');
  const panel = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjScrollPanelHarness);
  // Optimus measures after the first frame: the bars that must show, show.
  const overflowing = host.overflow() !== 'fits' && host.height() !== null;
  await expect
    .poll(() => barYOf(element).getAttribute('data-p-scrollpanel-hidden'))
    .toBe(overflowing ? 'false' : 'true');
  return { fixture, host, panel, element };
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

/** Parks the pointer on a neutral element, so no hover state shows the bars or recolours a mark. */
async function parkPointer(element: HTMLElement): Promise<void> {
  await userEvent.hover(byId(element, 'caption'));
}

/** The documented states for axe (FR-35), each with the region named by `ariaLabel`. */
const STATES: [string, (host: Host) => void][] = [
  ['overflowing vertically', () => undefined],
  [
    'overflowing both ways',
    (host) => {
      host.overflow.set('both');
    },
  ],
  [
    'content that fits',
    (host) => {
      host.overflow.set('fits');
    },
  ],
  [
    'overflowing vertically with a control inside',
    (host) => {
      host.control.set(true);
    },
  ],
];

describe('WjScrollPanel', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour and the bars' opacity
    // then transition. Measure the end state, not the animation.
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

  describe('layout', () => {
    it('reaches the root with a height set on the host, and the host box equals the root box', async () => {
      const { element } = await render();

      expect(hostOf(element).getBoundingClientRect().height).toBe(240);
      expect(rootOf(element).getBoundingClientRect().height).toBe(240);
      expect(getComputedStyle(hostOf(element)).display).toBe('block');
      expect(getComputedStyle(rootOf(element)).display).toBe('block');
      expect(hostOf(element).getBoundingClientRect().toJSON()).toEqual(
        rootOf(element).getBoundingClientRect().toJSON(),
      );
      expect(sectionOf(element, 'contentcontainer').getBoundingClientRect().height).toBe(240);
    });

    it('fills a stretching flex row: the block size need not be a height', async () => {
      const { element } = await render('light', (host) => {
        host.height.set(null);
      });
      const row = find(element, 'div', HTMLElement);
      row.style.display = 'flex';
      row.style.blockSize = '200px';

      await expect.poll(() => rootOf(element).getBoundingClientRect().height).toBe(200);
      expect(hostOf(element).getBoundingClientRect().height).toBe(200);
    });

    it('with no block size the host stays a few pixels tall and the content spills (documented)', async () => {
      const { element } = await render('light', (host) => {
        host.height.set(null);
      });

      // Optimus floats the content container, so the host holds only the bars' flow boxes.
      expect(hostOf(element).getBoundingClientRect().height).toBeLessThan(24);
      expect(sectionOf(element, 'contentcontainer').getBoundingClientRect().height).toBeGreaterThan(
        800,
      );
    });
  });

  describe('scrolling', () => {
    it('scrolls with trusted keys and the thumb follows, flush with both ends', async () => {
      const { panel, element } = await render();
      const rootBox = (): DOMRect => rootOf(element).getBoundingClientRect();
      const barBox = (): DOMRect => barYOf(element).getBoundingClientRect();
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await panel.isFocused()).toBe(true);
      expect(await panel.canScroll()).toBe(true);
      expect(await panel.getScrollTop()).toBe(0);
      expect(barBox().top).toBeCloseTo(rootBox().top, 0);
      expect(barBox().right).toBeCloseTo(rootBox().right, 0);

      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => panel.getScrollTop()).toBeGreaterThan(0);
      await expect.poll(() => barBox().top).toBeGreaterThan(rootBox().top + 1);
      const afterPage = barBox().top;

      await userEvent.keyboard('{End}');
      await expect
        .poll(async () => (await panel.getScrollTop()) + regionOf(element).clientHeight)
        .toBe(regionOf(element).scrollHeight);
      await expect.poll(() => barBox().bottom).toBeCloseTo(rootBox().bottom, 0);
      expect(barBox().top).toBeGreaterThan(afterPage);
      expect(barBox().right).toBeCloseTo(rootBox().right, 0);
    });

    it('scrolls along the inline axis when the content is wider, and the x thumb follows', async () => {
      const { panel, element } = await render('light', (host) => {
        host.overflow.set('both');
      });
      const rootBox = (): DOMRect => rootOf(element).getBoundingClientRect();
      const barBox = (): DOMRect => barXOf(element).getBoundingClientRect();
      expect(shown(barXOf(element))).toBe(true);
      expect(barBox().bottom).toBeCloseTo(rootBox().bottom, 0);
      expect(barBox().left).toBeCloseTo(rootBox().left, 0);
      await panel.focus();

      await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');

      await expect.poll(() => panel.getScrollLeft()).toBeGreaterThan(0);
      await expect.poll(() => barBox().left).toBeGreaterThan(rootBox().left + 1);
    });

    it('hides both thumbs for content that fits, yet the region stays a Tab stop', async () => {
      const { panel, element } = await render('light', (host) => {
        host.overflow.set('fits');
      });

      expect(await panel.canScroll()).toBe(false);
      expect(shown(barXOf(element))).toBe(false);
      expect(shown(barYOf(element))).toBe(false);
      expect(getComputedStyle(barYOf(element)).visibility).toBe('hidden');
      expect(regionOf(element).getAttribute('tabindex')).toBe('0');
    });

    it('shows the thumbs when the pointer is over the panel and hides them at rest', async () => {
      const { element } = await render();
      await parkPointer(element);

      expect(getComputedStyle(barYOf(element)).opacity).toBe('0');
      await userEvent.hover(regionOf(element));
      await expect.poll(() => getComputedStyle(barYOf(element)).opacity).toBe('1');
    });
  });

  describe('thumbs', () => {
    it.each<Scheme>(['light', 'dark'])(
      'take --wj-surface-500 and meet 3:1 against the page: %s',
      async (scheme) => {
        const { element } = await render(scheme);
        await parkPointer(element);
        const thumb = getComputedStyle(barYOf(element)).backgroundColor;
        const page = resolveColour(element, 'var(--wj-content-background)');

        expect(thumb).toBe(resolveColour(element, 'var(--wj-surface-500)'));
        expect(getComputedStyle(barXOf(element)).backgroundColor).toBe(thumb);
        expect(contrastRatio(thumb, page)).toBeGreaterThanOrEqual(3);
      },
    );

    it('keep their 9 px thickness and rounded ends', async () => {
      const { element } = await render('light', (host) => {
        host.overflow.set('both');
      });

      expect(barYOf(element).getBoundingClientRect().width).toBe(9);
      expect(barXOf(element).getBoundingClientRect().height).toBe(9);
      expect(barYOf(element).clientWidth).toBe(9);
      expect(barXOf(element).clientHeight).toBe(9);
      expect(parseFloat(getComputedStyle(barYOf(element)).borderTopLeftRadius)).toBeGreaterThan(0);
    });

    it('grow a 24 px hit box across their thickness, centred, and no more', async () => {
      const { element } = await render('light', (host) => {
        host.overflow.set('both');
      });
      const hits = (bar: HTMLElement, axis: 'x' | 'y', offset: number): boolean => {
        const box = bar.getBoundingClientRect();
        const x = box.left + box.width / 2 + (axis === 'y' ? offset : 0);
        const y = box.top + box.height / 2 + (axis === 'x' ? offset : 0);
        return document.elementFromPoint(x, y) === bar;
      };
      const barY = barYOf(element);
      const barX = barXOf(element);

      for (const offset of [-11.5, 0, 11.5]) {
        expect(hits(barY, 'y', offset), `y thumb at ${String(offset)}`).toBe(true);
        expect(hits(barX, 'x', offset), `x thumb at ${String(offset)}`).toBe(true);
      }
      for (const offset of [-13, 13]) {
        expect(hits(barY, 'y', offset), `y thumb beyond ${String(offset)}`).toBe(false);
        expect(hits(barX, 'x', offset), `x thumb beyond ${String(offset)}`).toBe(false);
      }
    });

    it('stay out of the Tab order and out of the accessibility tree, after every update', async () => {
      const { element, host, panel } = await render();
      const expectPointerOnly = (): void => {
        for (const bar of [barXOf(element), barYOf(element)]) {
          expect(bar.getAttribute('tabindex')).toBe('-1');
          expect(bar.getAttribute('aria-hidden')).toBe('true');
        }
      };
      expectPointerOnly();

      await panel.focus();
      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => panel.getScrollTop()).toBeGreaterThan(0);
      expectPointerOnly();

      host.overflow.set('both');
      await expect.poll(() => shown(barXOf(element))).toBe(true);
      expectPointerOnly();

      host.pt.set({ barY: { 'data-probe': 'mine', tabindex: '0', 'aria-hidden': 'false' } });
      await expect.poll(() => barYOf(element).getAttribute('data-probe')).toBe('mine');
      expectPointerOnly();
    });
  });

  describe('focus', () => {
    it('draws the 2 px ring on the root while the region has keyboard focus, and shows the thumbs', async () => {
      const { element, panel } = await render();
      await parkPointer(element);
      const ring = (): CSSStyleDeclaration => getComputedStyle(rootOf(element));
      expect(ring().outlineStyle).toBe('none');
      expect(getComputedStyle(barYOf(element)).opacity).toBe('0');
      byId(element, 'before').focus();

      await userEvent.tab();

      expect(await panel.isFocused()).toBe(true);
      expect(ring().outlineWidth).toBe('2px');
      expect(ring().outlineStyle).toBe('solid');
      expect(ring().outlineOffset).toBe('2px');
      expect(ring().outlineColor).toBe(resolveColour(element, 'var(--wj-focus-ring-color)'));
      expect(getComputedStyle(barYOf(element)).opacity).toBe('1');
      expect(getComputedStyle(regionOf(element)).outlineStyle).toBe('none');

      await userEvent.tab();
      expect(ring().outlineStyle).toBe('none');
      await expect.poll(() => getComputedStyle(barYOf(element)).opacity).toBe('0');
    });

    it('draws no second ring on the region when a control inside has focus', async () => {
      const { element, panel } = await render('light', (host) => {
        host.control.set(true);
      });
      await parkPointer(element);
      byId(element, 'before').focus();

      await userEvent.tab();
      await userEvent.tab();

      expect(document.activeElement).toBe(find(element, '.inside', HTMLElement));
      expect(await panel.isFocused()).toBe(false);
      expect(getComputedStyle(rootOf(element)).outlineStyle).toBe('none');
      expect(getComputedStyle(find(element, '.inside', HTMLElement)).outlineStyle).not.toBe('none');
    });

    it('draws no ring for a pointer click on the region', async () => {
      const { element, panel } = await render();

      await userEvent.click(regionOf(element));

      expect(await panel.isFocused()).toBe(true);
      expect(getComputedStyle(rootOf(element)).outlineStyle).toBe('none');
    });

    it('draws the ring in the dark scheme too', async () => {
      const { element } = await render('dark');
      byId(element, 'before').focus();

      await userEvent.tab();

      expect(getComputedStyle(rootOf(element)).outlineStyle).toBe('solid');
      expect(getComputedStyle(rootOf(element)).outlineColor).toBe(
        resolveColour(element, 'var(--wj-focus-ring-color)'),
      );
    });
  });

  describe('ARIA', () => {
    it('routes ariaLabel to the region and makes a named region a landmark', async () => {
      const { element, panel } = await render();

      expect(regionOf(element).getAttribute('aria-label')).toBe('Terms of use');
      expect(regionOf(element).getAttribute('role')).toBe('region');
      expect(regionOf(element).getAttribute('tabindex')).toBe('0');
      expect(await panel.getAriaLabel()).toBe('Terms of use');
      expect(await panel.getRole()).toBe('region');
      expect(await panel.getAriaLabelledBy()).toBeNull();
      expect(rootOf(element).hasAttribute('aria-label')).toBe(false);
      expect(hostOf(element).hasAttribute('aria-label')).toBe(false);
    });

    it('routes ariaLabelledBy and ariaDescribedBy, and ariaLabelledBy names the region too', async () => {
      const { element, panel } = await render('light', (host) => {
        host.ariaLabel.set(undefined);
        host.ariaLabelledBy.set('caption');
        host.ariaDescribedBy.set('caption');
      });

      expect(await panel.getAriaLabelledBy()).toBe('caption');
      expect(await panel.getAriaDescribedBy()).toBe('caption');
      expect(await panel.getAriaLabel()).toBeNull();
      expect(await panel.getRole()).toBe('region');
      await expectNoAxeViolations(hostOf(element));
    });

    it('gives no role="region" to a region that is not named, but keeps it a Tab stop', async () => {
      const { element, panel, host } = await render('light', (instance) => {
        instance.ariaLabel.set(undefined);
        instance.ariaDescribedBy.set('caption');
      });

      expect(await panel.getRole()).toBeNull();
      expect(await panel.getAriaDescribedBy()).toBe('caption');
      expect(regionOf(element).getAttribute('tabindex')).toBe('0');

      host.ariaLabel.set('Named later');
      await expect.poll(() => panel.getRole()).toBe('region');
      host.ariaLabel.set('');
      await expect.poll(() => panel.getRole()).toBeNull();
    });

    it('takes every routed name off again when its input clears', async () => {
      const { element, host, panel } = await render('light', (instance) => {
        instance.ariaLabelledBy.set('caption');
        instance.ariaDescribedBy.set('caption');
      });
      expect(await panel.getRole()).toBe('region');

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set(undefined);
      host.ariaDescribedBy.set(undefined);

      await expect.poll(() => regionOf(element).hasAttribute('aria-label')).toBe(false);
      await expect.poll(() => regionOf(element).hasAttribute('aria-labelledby')).toBe(false);
      await expect.poll(() => regionOf(element).hasAttribute('aria-describedby')).toBe(false);
      await expect.poll(() => regionOf(element).hasAttribute('role')).toBe(false);
      expect(regionOf(element).getAttribute('tabindex')).toBe('0');
    });

    it('keeps a changed name on the region', async () => {
      const { element, host } = await render();

      host.ariaLabel.set('Second');

      await expect.poll(() => regionOf(element).getAttribute('aria-label')).toBe('Second');
    });

    it('shows an HTML payload in the ARIA inputs as attribute text, never as markup', async () => {
      const { element, panel } = await render('light', (host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });

      expect(await panel.getAriaLabel()).toBe(PAYLOAD);
      expect(await panel.getAriaLabelledBy()).toBe(PAYLOAD);
      expect(await panel.getAriaDescribedBy()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('warns WJ0003 for aria-* on the host and forwards nothing', async () => {
      const { element } = await renderSmall(AriaOnHostHost);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-scrollpanel: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(regionOf(element).hasAttribute('aria-label')).toBe(false);
      expect(regionOf(element).hasAttribute('role')).toBe(false);
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      await renderSmall(BareHost, false);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-scrollpanel: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('pt', () => {
    const probe = (name: string): { 'data-probe': string } => ({ 'data-probe': name });

    it('reaches the root, content, bars and container as an object', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          root: probe('root'),
          contentContainer: probe('container'),
          content: probe('content'),
          barX: probe('barx'),
          barY: probe('bary'),
        });
      });
      const at = (name: string): Element | null => element.querySelector(`[data-probe="${name}"]`);

      expect(at('root')?.localName).toBe('p-scroll-panel');
      expect(at('container')?.getAttribute('data-pc-section')).toBe('contentcontainer');
      expect(at('content')).toBe(regionOf(element));
      expect(at('barx')).toBe(barXOf(element));
      expect(at('bary')).toBe(barYOf(element));
      // The routed attributes sit next to the consumer's keys.
      expect(regionOf(element).getAttribute('tabindex')).toBe('0');
      expect(regionOf(element).getAttribute('role')).toBe('region');
      expect(barYOf(element).getAttribute('aria-hidden')).toBe('true');
    });

    it('reaches content and barY as a function, and follows a changed pt', async () => {
      const { element, host } = await render('light', (instance) => {
        instance.pt.set({ content: () => probe('content-fn'), barY: () => probe('bary-fn') });
      });

      expect(regionOf(element).getAttribute('data-probe')).toBe('content-fn');
      expect(barYOf(element).getAttribute('data-probe')).toBe('bary-fn');
      expect(regionOf(element).getAttribute('tabindex')).toBe('0');
      expect(barYOf(element).getAttribute('tabindex')).toBe('-1');

      host.pt.set({ content: probe('second') });
      await expect.poll(() => regionOf(element).getAttribute('data-probe')).toBe('second');
      expect(regionOf(element).getAttribute('aria-label')).toBe('Terms of use');
    });

    it('lets a routed attribute win over the consumer’s own value for it', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ content: { tabindex: '-1', 'aria-label': 'Mine', 'data-probe': 'kept' } });
      });

      expect(regionOf(element).getAttribute('tabindex')).toBe('0');
      expect(regionOf(element).getAttribute('aria-label')).toBe('Terms of use');
      expect(regionOf(element).getAttribute('data-probe')).toBe('kept');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations while the region has keyboard focus', async () => {
        const { element } = await render(scheme);
        byId(element, 'before').focus();

        await userEvent.tab();

        await expectNoAxeViolations(hostOf(element));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab reaches the region once and never a bar, then moves on', async () => {
      const { element, panel } = await render('light', (host) => {
        host.overflow.set('both');
      });
      const stops: Element[] = [];
      byId(element, 'before').focus();

      for (let step = 0; step < 2; step++) {
        await userEvent.tab();
        if (document.activeElement !== null) {
          stops.push(document.activeElement);
        }
      }

      expect(stops).toEqual([regionOf(element), byId(element, 'after')]);
      expect(await panel.isFocused()).toBe(false);
    });

    it('Shift+Tab comes back to the region from the next control', async () => {
      const { element, panel } = await render();
      byId(element, 'after').focus();

      await userEvent.tab({ shift: true });

      expect(await panel.isFocused()).toBe(true);
    });

    it('Tab then moves into the region’s own controls, in order', async () => {
      const { element, panel } = await render('light', (host) => {
        host.control.set(true);
      });
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await panel.isFocused()).toBe(true);
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '.inside', HTMLElement));
      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));
    });

    it('scrolls with trusted PageDown and End, read through the harness', async () => {
      const { element, panel } = await render();
      byId(element, 'before').focus();
      await userEvent.tab();

      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => panel.getScrollTop()).toBeGreaterThan(0);
      const page = await panel.getScrollTop();
      await userEvent.keyboard('{End}');

      // The browser scrolls to the end smoothly: poll until it arrives.
      await expect
        .poll(() => panel.getScrollTop())
        .toBe(regionOf(element).scrollHeight - regionOf(element).clientHeight);
      expect(await panel.getScrollTop()).toBeGreaterThan(page);
    });

    it('finds a panel by its label', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const found = await loader.getAllHarnesses(WjScrollPanelHarness.with({ label: /^Terms/ }));
      const missing = await loader.getAllHarnesses(WjScrollPanelHarness.with({ label: 'Nothing' }));

      expect(found).toHaveLength(1);
      expect(missing).toHaveLength(0);
    });
  });
});
