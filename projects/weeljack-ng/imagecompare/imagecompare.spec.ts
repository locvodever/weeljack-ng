/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjImageCompare,
  WjImageCompareLeftSlot,
  WjImageCompareRightSlot,
  type WjImageComparePt,
} from 'weeljack-ng/imagecompare';
import { WjImageCompareHarness } from 'weeljack-ng/imagecompare/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** Local `data:` images only (no network): two flat 16:9 scenes in different palettes. */
const scene = (sky: string, hill: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="${sky}"/><circle cx="120" cy="24" r="12" fill="#f2c94c"/><path d="M0 90V60q60-30 160 0v30z" fill="${hill}"/></svg>`,
  )}`;
const WINTER = scene('#dbe7f0', '#f4f7f9');
const SUMMER = scene('#9cc9e8', '#6a994e');
const NEXT = scene('#274c77', '#386641');

/** A consumer's template: two slot images between two native buttons, plus a name and a hint. */
@Component({
  selector: 'wj-imagecompare-host',
  imports: [WjImageCompare, WjImageCompareLeftSlot, WjImageCompareRightSlot],
  template: `
    <button type="button" id="before">Before</button>
    <div style="inline-size: 320px; margin: 24px">
      <wj-imagecompare
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
      >
        <ng-template wjImageCompareLeft>
          <img [src]="leftSrc()" alt="A winter hill" />
        </ng-template>
        <ng-template wjImageCompareRight>
          <img [src]="rightSrc()" [alt]="rightAlt()" />
        </ng-template>
      </wj-imagecompare>
    </div>
    <button type="button" id="after">After</button>
    <span id="name">Hill</span>
    <span id="hint">Drag to compare</span>
  `,
})
class Host {
  readonly ariaLabel = signal('Before and after');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjImageComparePt>(undefined);
  readonly leftSrc = signal(WINTER);
  readonly rightSrc = signal(SUMMER);
  readonly rightAlt = signal('A summer hill');
}

/** A consumer who writes aria-* on the host: it is not forwarded. */
@Component({
  selector: 'wj-imagecompare-aria-on-host-host',
  imports: [WjImageCompare, WjImageCompareLeftSlot, WjImageCompareRightSlot],
  template: `
    <wj-imagecompare aria-label="Other" ariaLabel="Before and after">
      <ng-template wjImageCompareLeft><img [src]="src" alt="Left" /></ng-template>
      <ng-template wjImageCompareRight><img [src]="src" alt="Right" /></ng-template>
    </wj-imagecompare>
  `,
})
class AriaOnHostHost {
  protected readonly src = WINTER;
}

/** A comparison that gives only the left slot. */
@Component({
  selector: 'wj-imagecompare-missing-slot-host',
  imports: [WjImageCompare, WjImageCompareLeftSlot],
  template: `
    <wj-imagecompare ariaLabel="Before and after">
      <ng-template wjImageCompareLeft><img [src]="src" alt="Left" /></ng-template>
    </wj-imagecompare>
  `,
})
class MissingSlotHost {
  protected readonly src = WINTER;
}

/** A comparison rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-imagecompare-routed-host',
  imports: [WjImageCompare, WjImageCompareLeftSlot, WjImageCompareRightSlot],
  template: `
    <wj-imagecompare ariaLabel="Before and after">
      <ng-template wjImageCompareLeft><img [src]="src" alt="Left" /></ng-template>
      <ng-template wjImageCompareRight><img [src]="src" alt="Right" /></ng-template>
    </wj-imagecompare>
  `,
})
class RoutedHost {
  protected readonly src = WINTER;
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-imagecompare', HTMLElement);
const innerOf = (element: HTMLElement): HTMLElement => find(element, 'p-imagecompare', HTMLElement);
const sliderOf = (element: HTMLElement): HTMLInputElement =>
  find(element, 'input[type="range"]', HTMLInputElement);
const buttonOf = (element: HTMLElement, id: string): HTMLButtonElement =>
  find(element, `#${id}`, HTMLButtonElement);
const imagesOf = (element: HTMLElement): HTMLImageElement[] =>
  Array.from(innerOf(element).querySelectorAll('img'));
const imageAt = (element: HTMLElement, index: number): HTMLImageElement => {
  const image = imagesOf(element)[index];
  if (!image) {
    throw new Error(`image ${String(index)} is missing`);
  }
  return image;
};

/** Renders `Host` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function render(
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  await expect.poll(() => imagesOf(element).every((image) => image.complete)).toBe(true);
  return { fixture, component: fixture.componentInstance, element };
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjImageCompareHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjImageCompareHarness);

/** The ARIA attributes of an element, as `name=value` text, sorted. */
const ariaOf = (element: Element): string[] =>
  Array.from(element.attributes)
    .filter((attribute) => attribute.name.startsWith('aria-'))
    .map((attribute) => `${attribute.name}=${attribute.value}`)
    .sort();

/** Every element in the host (the host included) that is in the Tab order. */
const tabStops = (host: HTMLElement): Element[] =>
  [host, ...Array.from(host.querySelectorAll<HTMLElement>('*'))].filter(
    (element) => element instanceof HTMLElement && element.tabIndex >= 0,
  );

/** Moves the pointer onto a neutral element, so no hover state colours what a spec reads next. */
async function parkPointer(element: HTMLElement): Promise<void> {
  await userEvent.hover(buttonOf(element, 'after'));
}

/** Tabs from the "Before" button onto the slider, so the focus is a keyboard focus. */
async function tabToSlider(element: HTMLElement): Promise<void> {
  buttonOf(element, 'before').focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(sliderOf(element));
}

/**
 * Presses `key` until the slider reads `expected`. Chrome may ignore Home right after End, so the
 * key is repeated until it takes (the w3-data precedent); both keys are idempotent.
 */
async function pressUntil(slider: HTMLInputElement, key: string, expected: number): Promise<void> {
  await expect
    .poll(async () => {
      await userEvent.keyboard(key);
      return slider.valueAsNumber;
    })
    .toBe(expected);
}

/** The value a CSS value (a `--wj-*` variable, say) resolves to, through a probe inside `host`. */
function resolved(
  host: HTMLElement,
  property: 'color' | 'background-color',
  value: string,
): string {
  const probe = document.createElement('span');
  probe.style.setProperty(property, value);
  host.append(probe);
  const result = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return result;
}

describe('WjImageCompare', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('slots', () => {
    it('renders a block host with a 16:9 box holding the left image, the right image and the slider, in that order', async () => {
      const { element } = await render();
      const host = hostOf(element);
      const box = innerOf(element);

      expect(getComputedStyle(host).display).toBe('block');
      expect(host.getBoundingClientRect().width).toBe(320);
      expect(box.getBoundingClientRect().width).toBe(320);
      expect(box.getBoundingClientRect().height).toBe(180);
      expect(Array.from(box.children).map((child) => child.localName)).toEqual([
        'img',
        'img',
        'input',
      ]);
      expect(imageAt(element, 0).getAttribute('src')).toBe(WINTER);
      expect(imageAt(element, 1).getAttribute('src')).toBe(SUMMER);
    });

    it('renders the consumer templates on the first pass, each image keeping its own alt', async () => {
      const { element } = await render();

      expect(imageAt(element, 0).getAttribute('alt')).toBe('A winter hill');
      expect(imageAt(element, 1).getAttribute('alt')).toBe('A summer hill');
      // The slot images are the app's markup: each fills the box.
      expect(imageAt(element, 0).getBoundingClientRect().width).toBe(320);
      expect(imageAt(element, 1).getBoundingClientRect().width).toBe(320);
    });

    it('follows bindings inside both slot templates after creation', async () => {
      const { component, fixture, element } = await render();

      component.leftSrc.set(NEXT);
      component.rightSrc.set(NEXT);
      component.rightAlt.set('A dusk hill');
      await fixture.whenStable();

      expect(imageAt(element, 0).getAttribute('src')).toBe(NEXT);
      expect(imageAt(element, 1).getAttribute('src')).toBe(NEXT);
      expect(imageAt(element, 1).getAttribute('alt')).toBe('A dusk hill');
      expect(imagesOf(element)).toHaveLength(2);
    });

    it('paints the right image from the start edge to the handle, and the left one whole', async () => {
      const { fixture, element } = await render();
      const harness = await harnessOf(fixture);

      expect(imageAt(element, 0).style.clipPath).toBe('');
      expect(await harness.getPosition()).toBe(50);

      await harness.setPosition(30);

      expect(imageAt(element, 1).style.clipPath).toContain('30%');
      expect(imageAt(element, 0).style.clipPath).toBe('');
    });
  });

  describe('required slots', () => {
    it('fails loudly when a slot is missing, rather than rendering half a comparison', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });

      expect(() => {
        TestBed.createComponent(MissingSlotHost).detectChanges();
      }).toThrow(/NG0951/);
    });
  });

  describe('the slider', () => {
    it('names the range input and leaves the host and Optimus element with no ARIA and no tabindex', async () => {
      const { element } = await render();

      expect(sliderOf(element).getAttribute('aria-label')).toBe('Before and after');
      for (const host of [hostOf(element), innerOf(element)]) {
        expect(ariaOf(host)).toEqual([]);
        expect(host.hasAttribute('tabindex')).toBe(false);
      }
    });

    it('is the single Tab stop: Tab goes from the button before onto the slider and then past it', async () => {
      const { element } = await render();

      expect(tabStops(hostOf(element))).toEqual([sliderOf(element)]);

      await tabToSlider(element);
      await userEvent.tab();

      expect(document.activeElement).toBe(buttonOf(element, 'after'));
    });

    it('follows ariaLabel, ariaLabelledBy and ariaDescribedBy as they change and clear', async () => {
      const { component, fixture, element } = await render();
      const slider = sliderOf(element);
      const harness = await harnessOf(fixture);

      component.ariaLabel.set('Compare the hill');
      component.ariaLabelledBy.set('name');
      component.ariaDescribedBy.set('hint');
      await fixture.whenStable();

      expect(ariaOf(slider)).toEqual([
        'aria-describedby=hint',
        'aria-label=Compare the hill',
        'aria-labelledby=name',
      ]);
      expect(await harness.getAriaLabel()).toBe('Compare the hill');
      expect(await harness.getAriaLabelledBy()).toBe('name');
      expect(await harness.getAriaDescribedBy()).toBe('hint');

      component.ariaLabelledBy.set(undefined);
      component.ariaDescribedBy.set(undefined);
      await fixture.whenStable();

      expect(ariaOf(slider)).toEqual(['aria-label=Compare the hill']);
      expect(await harness.getAriaLabelledBy()).toBeNull();
      expect(await harness.getAriaDescribedBy()).toBeNull();
    });

    it('keeps the host free of ARIA and the slider the one Tab stop after every input change', async () => {
      const { component, fixture, element } = await render();

      component.ariaLabel.set('Compare');
      component.ariaLabelledBy.set('name');
      component.ariaDescribedBy.set('hint');
      component.leftSrc.set(NEXT);
      component.pt.set({ root: { 'data-probe': 'root' } });
      await fixture.whenStable();
      component.ariaLabelledBy.set(undefined);
      component.pt.set(undefined);
      await fixture.whenStable();

      for (const host of [hostOf(element), innerOf(element)]) {
        expect(ariaOf(host)).toEqual([]);
        expect(host.hasAttribute('tabindex')).toBe(false);
      }
      expect(tabStops(hostOf(element))).toEqual([sliderOf(element)]);
    });

    it('moves the divider with the keys: arrows 1, Page keys 10, Home 0 and End 100', async () => {
      const { element } = await render();
      const slider = sliderOf(element);
      await tabToSlider(element);

      expect(slider.valueAsNumber).toBe(50);
      const steps: [string, number][] = [
        ['{ArrowRight}', 51],
        ['{ArrowRight}', 52],
        ['{ArrowLeft}', 51],
        ['{ArrowUp}', 52],
        ['{ArrowDown}', 51],
        ['{PageUp}', 61],
        ['{PageDown}', 51],
      ];
      for (const [key, expected] of steps) {
        await userEvent.keyboard(key);
        expect(slider.valueAsNumber).toBe(expected);
      }
      await pressUntil(slider, '{End}', 100);
      await pressUntil(slider, '{Home}', 0);
      await pressUntil(slider, '{End}', 100);
      // Past the ends it stays put.
      await userEvent.keyboard('{ArrowRight}');
      expect(slider.valueAsNumber).toBe(100);
      await pressUntil(slider, '{Home}', 0);
      await userEvent.keyboard('{ArrowLeft}');
      expect(slider.valueAsNumber).toBe(0);
    });

    it('clips the right image as the keys move the divider', async () => {
      const { element } = await render();
      await tabToSlider(element);

      await userEvent.keyboard('{PageUp}');
      expect(imageAt(element, 1).style.clipPath).toContain('60%');
      await pressUntil(sliderOf(element), '{Home}', 0);
      expect(imageAt(element, 1).style.clipPath).toContain('0%');
    });
  });

  describe('harness', () => {
    it('reads and sets the divider position, focuses the slider and reads its ARIA', async () => {
      const { component, fixture, element } = await render();
      component.ariaLabelledBy.set('name');
      component.ariaDescribedBy.set('hint');
      await fixture.whenStable();
      const harness = await harnessOf(fixture);

      expect(await harness.getPosition()).toBe(50);
      await harness.setPosition(20);
      expect(await harness.getPosition()).toBe(20);
      expect(sliderOf(element).valueAsNumber).toBe(20);
      expect(imageAt(element, 1).style.clipPath).toContain('20%');
      await harness.setPosition(150);
      expect(await harness.getPosition()).toBe(100);

      expect(await harness.isFocused()).toBe(false);
      await harness.focus();
      expect(await harness.isFocused()).toBe(true);
      expect(document.activeElement).toBe(sliderOf(element));
      expect(await harness.getAriaLabel()).toBe('Before and after');
      expect(await harness.getAriaLabelledBy()).toBe('name');
      expect(await harness.getAriaDescribedBy()).toBe('hint');
    });

    it('finds a comparison by its accessible name', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(
        await loader.getAllHarnesses(WjImageCompareHarness.with({ ariaLabel: /before and/i })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjImageCompareHarness.with({ ariaLabel: 'Other' })),
      ).toHaveLength(0);
    });
  });

  describe('pt', () => {
    it('reaches the root and the slider as an object', async () => {
      const { element } = await render((host) => {
        host.pt.set({ root: { 'data-probe': 'root' }, slider: { 'data-probe': 'slider' } });
      });

      expect(innerOf(element).getAttribute('data-probe')).toBe('root');
      expect(sliderOf(element).getAttribute('data-probe')).toBe('slider');
    });

    it('reaches the root and the slider as a function', async () => {
      const { element } = await render((host) => {
        host.pt.set(() => ({ root: { 'data-probe': 'fn-root' }, slider: { 'data-probe': 'fn' } }));
      });

      expect(innerOf(element).getAttribute('data-probe')).toBe('fn-root');
      expect(sliderOf(element).getAttribute('data-probe')).toBe('fn');
    });

    it('keeps the consumer keys beside the routed names, and the routed name wins', async () => {
      const { component, fixture, element } = await render((host) => {
        host.pt.set({ slider: { 'aria-label': 'Consumer', 'data-probe': 'kept' } });
      });
      const slider = sliderOf(element);

      expect(slider.getAttribute('aria-label')).toBe('Before and after');
      expect(slider.getAttribute('data-probe')).toBe('kept');

      component.pt.set(undefined);
      await fixture.whenStable();

      expect(slider.getAttribute('aria-label')).toBe('Before and after');
    });
  });

  describe('rendering safety', () => {
    it('renders an HTML payload in every ARIA string as text, and runs nothing', async () => {
      const { element } = await render((host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });
      const slider = sliderOf(element);

      expect(slider.getAttribute('aria-label')).toBe(PAYLOAD);
      expect(slider.getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(slider.getAttribute('aria-describedby')).toBe(PAYLOAD);
      expect(imagesOf(element)).toHaveLength(2);
      expect(hostOf(element).querySelector('script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('look', () => {
    it('draws a two-tone 24 px handle, set as Optimus variables on the host', async () => {
      const { element } = await render();
      const host = hostOf(element);
      const style = getComputedStyle(host);

      expect(style.getPropertyValue('--wj-imagecompare-handle-size')).toBe('24px');
      expect(style.getPropertyValue('--wj-imagecompare-handle-border-width')).toBe('2px');
      const fill = resolved(host, 'background-color', 'var(--wj-content-background)');
      expect(resolved(host, 'background-color', 'var(--wj-imagecompare-handle-background)')).toBe(
        fill,
      );
      expect(
        resolved(host, 'background-color', 'var(--wj-imagecompare-handle-hover-background)'),
      ).toBe(fill);
      const ring = resolved(host, 'color', 'var(--wj-primary-color)');
      expect(resolved(host, 'color', 'var(--wj-imagecompare-handle-border-color)')).toBe(ring);
      expect(resolved(host, 'color', 'var(--wj-imagecompare-handle-hover-border-color)')).toBe(
        ring,
      );
      expect(resolved(host, 'color', 'var(--wj-imagecompare-handle-focus-ring-color)')).toBe(
        resolved(host, 'color', 'var(--wj-focus-ring-color)'),
      );
    });

    it('takes the fill and the ring from the scheme, in both schemes', async () => {
      const light = await render();
      const lightFill = resolved(
        hostOf(light.element),
        'background-color',
        'var(--wj-imagecompare-handle-background)',
      );
      const lightRing = resolved(
        hostOf(light.element),
        'color',
        'var(--wj-imagecompare-handle-border-color)',
      );
      light.fixture.destroy();
      TestBed.resetTestingModule();

      const dark = await render(undefined, 'dark');
      const darkFill = resolved(
        hostOf(dark.element),
        'background-color',
        'var(--wj-imagecompare-handle-background)',
      );
      const darkRing = resolved(
        hostOf(dark.element),
        'color',
        'var(--wj-imagecompare-handle-border-color)',
      );

      expect(lightFill).not.toBe(darkFill);
      expect(lightRing).not.toBe(darkRing);
      expect(lightFill).toBe('rgb(255, 255, 255)');
    });

    it('is 24 px at rest and grows to 30 px on hover and on keyboard focus', async () => {
      const { element } = await render();
      const slider = sliderOf(element);
      const width = (): number => slider.getBoundingClientRect().width;
      // Optimus eases the slider's size over its own transition, so every read polls.
      const margin = (): string => getComputedStyle(slider).marginInlineStart;
      await parkPointer(element);

      // The slider is as wide as the box plus the handle, centred on the box's edges.
      await expect.poll(width).toBe(320 + 24);
      await expect.poll(margin).toBe('-12px');

      await userEvent.hover(slider);
      await expect.poll(width).toBe(320 + 30);
      await expect.poll(margin).toBe('-15px');

      await parkPointer(element);
      await expect.poll(width).toBe(320 + 24);

      await tabToSlider(element);
      await expect.poll(width).toBe(320 + 30);
      await expect.poll(margin).toBe('-15px');
      expect(slider.matches(':focus-visible')).toBe(true);

      buttonOf(element, 'before').focus();
      await expect.poll(width).toBe(320 + 24);
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-imagecompare: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('warns WJ0003 for aria-* on the host, says what to use, and forwards nothing', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-imagecompare: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel input, which names the slider. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(sliderOf(element).getAttribute('aria-label')).toBe('Before and after');
    });

    it('stays silent for a well-formed comparison', async () => {
      await render();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it('has no axe violations: default', async () => {
        const { element } = await render(undefined, scheme);

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations: focused', async () => {
        const { element } = await render(undefined, scheme);
        await tabToSlider(element);

        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations: named by ariaLabelledBy and described', async () => {
        const { element } = await render((host) => {
          host.ariaLabelledBy.set('name');
          host.ariaDescribedBy.set('hint');
        }, scheme);

        await expectNoAxeViolations(hostOf(element));
      });
    });
  });
});
