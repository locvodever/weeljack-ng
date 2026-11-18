/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjTranslation } from 'weeljack-ng';
import {
  WjCarousel,
  WjCarouselItemSlot,
  type WjCarouselPt,
  type WjCarouselResponsiveOption,
} from 'weeljack-ng/carousel';
import { WjCarouselHarness } from 'weeljack-ng/carousel/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Scheme = 'light' | 'dark';

interface Product {
  name: string;
}

const NAMES = ['Kettle', 'Teapot', 'Mug', 'Jug', 'Cup', 'Bowl'];
const makeProducts = (): Product[] => NAMES.map((name) => ({ name }));

/**
 * A consumer's template: a carousel between two native buttons, with a button in every slide (so
 * every hidden slide holds something focusable) and a name and a hint to name it by.
 */
@Component({
  selector: 'wj-carousel-host',
  imports: [WjCarousel, WjCarouselItemSlot],
  template: `
    <button type="button" id="before">Before</button>
    <p id="name">Featured</p>
    <div style="inline-size: 400px; margin: 24px">
      <wj-carousel
        [value]="items()"
        [page]="page()"
        (pageChange)="changed($event)"
        [numVisible]="numVisible()"
        [numScroll]="numScroll()"
        [responsiveOptions]="responsiveOptions()"
        [circular]="circular()"
        [showIndicators]="showIndicators()"
        [showNavigators]="showNavigators()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [pt]="pt()"
      >
        @if (withSlot()) {
          <ng-template wjCarouselItem [wjCarouselItemOf]="items()" let-item>
            <span class="name">{{ item.name }}</span>
            <button type="button" class="buy" style="min-block-size: 24px">
              Buy {{ item.name }}
            </button>
          </ng-template>
        }
      </wj-carousel>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly items = signal<Product[]>(makeProducts());
  readonly page = signal(0);
  readonly pages: number[] = [];
  readonly numVisible = signal(1);
  readonly numScroll = signal(1);
  readonly responsiveOptions = signal<WjCarouselResponsiveOption[] | undefined>(undefined);
  readonly circular = signal(false);
  readonly showIndicators = signal(true);
  readonly showNavigators = signal(true);
  readonly ariaLabel = signal('Featured products');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjCarouselPt>(undefined);
  readonly withSlot = signal(true);

  protected changed(page: number): void {
    this.pages.push(page);
    this.page.set(page);
  }
}

/** A consumer who writes aria-* on the host: it is not forwarded. */
@Component({
  selector: 'wj-carousel-aria-on-host-host',
  imports: [WjCarousel, WjCarouselItemSlot],
  template: `
    <wj-carousel aria-label="Other" ariaLabel="Featured products" [value]="items">
      <ng-template wjCarouselItem let-item>{{ item }}</ng-template>
    </wj-carousel>
  `,
})
class AriaOnHostHost {
  protected readonly items = NAMES;
}

/** A carousel rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-carousel-routed-host',
  imports: [WjCarousel, WjCarouselItemSlot],
  template: `
    <wj-carousel ariaLabel="Featured products" [value]="items">
      <ng-template wjCarouselItem let-item>{{ item }}</ng-template>
    </wj-carousel>
  `,
})
class RoutedHost {
  protected readonly items = NAMES;
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

interface Providers {
  translation?: WjTranslation;
}

const realMatchMedia = window.matchMedia.bind(window);

/**
 * Sets the reader's reduced-motion preference for this window only. The carousel reads no media
 * query itself (its reduced path is a CSS rule), so this spy cannot switch that rule: it records
 * the intent without a CDP emulation, which would change the whole shared page and every spec file
 * running beside this one. {@link applyReducedMotionRule} applies the rule's declarations.
 */
function reduceMotion(reduce: boolean): void {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    const list = realMatchMedia(query);
    return query.includes('prefers-reduced-motion')
      ? new Proxy(list, {
          get(target, key): unknown {
            const value: unknown = Reflect.get(target, key);
            return key === 'matches' ? reduce : value;
          },
        })
      : list;
  });
}

/**
 * Every style rule of the page whose selector holds `selector`: inside a media block that holds
 * `media`, or, with `media` null, outside every media block.
 */
function rulesFor(selector: string, media: string | null): CSSStyleRule[] {
  const found: CSSStyleRule[] = [];
  const walk = (rules: CSSRuleList, inMatching: boolean, inAnyMedia: boolean): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes(selector)) {
        if (media === null ? !inAnyMedia : inMatching) {
          found.push(rule);
        }
      }
      if (rule instanceof CSSGroupingRule) {
        const isMedia = rule instanceof CSSMediaRule;
        walk(
          rule.cssRules,
          inMatching || (isMedia && media !== null && rule.conditionText.includes(media)),
          inAnyMedia || isMedia,
        );
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules, false, false);
  }
  return found;
}

const REDUCED = 'prefers-reduced-motion: reduce';
const LIST_RULE = 'wj-carousel .p-carousel-item-list';

/**
 * Applies the declarations of the wrapper's reduced-motion rule to the page unconditionally, as a
 * reader who asked for less motion gets them. The text is read from the stylesheet, so a change to
 * the rule changes what the specs that use this helper run under.
 */
async function applyReducedMotionRule(): Promise<void> {
  const [rule] = rulesFor(LIST_RULE, REDUCED);
  if (!rule) {
    throw new Error('the reduced-motion rule is missing');
  }
  const style = document.createElement('style');
  style.dataset['probe'] = 'reduced-motion';
  style.textContent = `${rule.selectorText} { ${rule.style.cssText} }`;
  document.head.append(style);
  await frames();
}

/**
 * Lets the browser draw two frames. A stylesheet appended just before a slide changes drops that
 * change's transition (the browser has no drawn style to start it from), and a transition that
 * never runs never fires `transitionend`.
 */
async function frames(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-carousel', HTMLElement);
const innerOf = (element: HTMLElement): HTMLElement => find(element, 'p-carousel', HTMLElement);
const listOf = (element: HTMLElement): HTMLElement =>
  find(element, '[data-pc-section="itemlist"]', HTMLElement);
const contentOf = (element: HTMLElement): HTMLElement =>
  find(element, '[data-pc-section="content"]', HTMLElement);
const prevOf = (element: HTMLElement): HTMLButtonElement =>
  find(element, '[data-pc-name="pcprevbutton"]', HTMLButtonElement);
const nextOf = (element: HTMLElement): HTMLButtonElement =>
  find(element, '[data-pc-name="pcnextbutton"]', HTMLButtonElement);
const buttonOf = (element: HTMLElement, id: string): HTMLButtonElement =>
  find(element, `#${id}`, HTMLButtonElement);
const slidesOf = (element: HTMLElement): HTMLElement[] =>
  Array.from(element.querySelectorAll<HTMLElement>('[data-pc-section="item"]'));
const clonesOf = (element: HTMLElement): HTMLElement[] =>
  Array.from(element.querySelectorAll<HTMLElement>('[data-pc-section="itemclone"]'));
const indicatorsOf = (element: HTMLElement): HTMLButtonElement[] =>
  Array.from(element.querySelectorAll<HTMLButtonElement>('[data-pc-section="indicatorbutton"]'));
const indicatorAt = (element: HTMLElement, index: number): HTMLButtonElement => {
  const indicator = indicatorsOf(element)[index];
  if (!indicator) {
    throw new Error(`indicator ${String(index)} is missing`);
  }
  return indicator;
};

/** The product name a slide's text starts with (its button repeats it after "Buy"). */
const nameOf = (text: string): string => text.replace(/Buy.*$/, '').trim();

/** Renders `Host` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function render(
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
  providers: Providers = {},
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', ...providers })],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  // A reader meets the carousel after it was drawn: a slide change needs a drawn style to start its
  // transition from, and the first one on a fresh element otherwise never runs (or ends).
  await frames();
  return {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjCarouselHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjCarouselHarness);

/** The names of the slides on screen. */
async function onScreen(harness: WjCarouselHarness): Promise<string[]> {
  return (await harness.getVisibleItemTexts()).map(nameOf);
}

/** The text of every slide a reader or a screen reader can reach: real slides that are not `inert`. */
const liveSlides = (element: HTMLElement): string[] =>
  slidesOf(element)
    .filter((slide) => !slide.inert)
    .map((slide) => nameOf(slide.textContent));

/** Every element in the host that is in the Tab order and not `inert` (an inert subtree is skipped). */
const tabStops = (host: HTMLElement): HTMLElement[] =>
  Array.from(host.querySelectorAll<HTMLElement>('*')).filter(
    (candidate) =>
      (candidate instanceof HTMLButtonElement || candidate instanceof HTMLAnchorElement) &&
      candidate.tabIndex >= 0 &&
      candidate.closest('[inert]') === null,
  );

/** The buttons a reader can reach inside the slides: one per live slide, none in a hidden one. */
const slideButtons = (element: HTMLElement): string[] =>
  tabStops(hostOf(element))
    .filter((stop) => stop.classList.contains('buy'))
    .map((stop) => stop.textContent.trim());

/**
 * The invariant of FR-40: a slide hidden from assistive tech (`aria-hidden`) is also `inert`, every
 * clone is `inert`, and a slide on screen is neither, so no hidden slide keeps a Tab stop.
 */
function expectHiddenSlidesInert(element: HTMLElement): void {
  for (const slide of slidesOf(element)) {
    const onScreen = slide.getAttribute('data-p-carousel-item-active') === 'true';
    expect(slide.inert, `slide ${nameOf(slide.textContent)} inert`).toBe(!onScreen);
    expect(slide.hasAttribute('inert')).toBe(!onScreen);
    if (slide.getAttribute('aria-hidden') === 'true') {
      expect(slide.inert).toBe(true);
    }
  }
  for (const clone of clonesOf(element)) {
    expect(clone.inert, 'clone inert').toBe(true);
  }
}

/**
 * Clicks a control as a reader does and lets the app settle. The specs that watch a circular wrap
 * click the controls themselves, so each step can wait for `transitionend` ({@link turn}).
 */
async function press(fixture: ComponentFixture<unknown>, button: HTMLElement): Promise<void> {
  button.click();
  await fixture.whenStable();
}

/** Presses a control and waits for the slide's transition to end: Optimus clears its inline transition then. */
async function turn(
  fixture: ComponentFixture<unknown>,
  element: HTMLElement,
  button: HTMLElement,
): Promise<void> {
  await press(fixture, button);
  await expect.poll(() => listOf(element).style.transition).toBe('');
}

/** Moves the pointer onto a neutral element, so no hover state colours what a spec reads next. */
async function parkPointer(element: HTMLElement): Promise<void> {
  await userEvent.hover(buttonOf(element, 'after'));
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

/** WCAG contrast ratio of two `rgb(r, g, b)` colours. */
function contrast(first: string, second: string): number {
  const luminance = (colour: string): number => {
    const [red = 0, green = 0, blue = 0] = (colour.match(/\d+(\.\d+)?/g) ?? []).map((channel) => {
      const value = Number(channel) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

const FIRST_SLIDE_AT_REST = 'translate3d(-100%, 0px, 0px)';

describe('WjCarousel', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head
      .querySelectorAll('style[data-optimus-style-id], style[data-probe]')
      .forEach((style) => {
        style.remove();
      });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('inputs', () => {
    it('renders a block host holding Optimus’s region, one slide per item, the navigators and the indicators', async () => {
      const { fixture, element } = await render();
      const harness = await harnessOf(fixture);

      expect(getComputedStyle(hostOf(element)).display).toBe('block');
      expect(innerOf(element).getAttribute('role')).toBe('region');
      expect(slidesOf(element).map((slide) => nameOf(slide.textContent))).toEqual(NAMES);
      expect(clonesOf(element)).toHaveLength(0);
      expect(await onScreen(harness)).toEqual(['Kettle']);
      expect(await harness.getVisibleItemCount()).toBe(1);
      expect(await harness.getPage()).toBe(0);
      expect(await harness.getPageCount()).toBe(6);
      expect(prevOf(element)).toBeInstanceOf(HTMLButtonElement);
      expect(nextOf(element)).toBeInstanceOf(HTMLButtonElement);
    });

    it('shows numVisible slides and moves numScroll at a time', async () => {
      const { fixture } = await render((host) => {
        host.numVisible.set(3);
        host.numScroll.set(3);
      });
      const harness = await harnessOf(fixture);

      expect(await onScreen(harness)).toEqual(['Kettle', 'Teapot', 'Mug']);
      expect(await harness.getPageCount()).toBe(2);

      await harness.next();

      await expect.poll(() => onScreen(harness)).toEqual(['Jug', 'Cup', 'Bowl']);
      expect(await harness.getPage()).toBe(1);
    });

    it('moves fewer slides than it shows when numScroll is smaller than numVisible', async () => {
      const { fixture } = await render((host) => {
        host.numVisible.set(2);
        host.numScroll.set(1);
      });
      const harness = await harnessOf(fixture);

      expect(await harness.getPageCount()).toBe(5);
      await harness.next();

      await expect.poll(() => onScreen(harness)).toEqual(['Teapot', 'Mug']);
    });

    it('applies the responsive option the window matches and ignores the one it does not', async () => {
      // The window is never 10000 px wide, and always wider than 100 px.
      const options: WjCarouselResponsiveOption[] = [
        { breakpoint: '100px', numVisible: 4, numScroll: 4 },
        { breakpoint: '10000px', numVisible: 2, numScroll: 2 },
      ];
      const { fixture } = await render((host) => {
        host.responsiveOptions.set(options);
      });
      const harness = await harnessOf(fixture);

      await expect.poll(() => harness.getVisibleItemCount()).toBe(2);
      expect(await harness.getPageCount()).toBe(3);
    });

    it('never reorders the app’s responsiveOptions: Optimus sorts the array it is given', async () => {
      const options: WjCarouselResponsiveOption[] = [
        { breakpoint: '100px', numVisible: 4, numScroll: 4 },
        { breakpoint: '10000px', numVisible: 2, numScroll: 2 },
      ];
      const before = options.map((option) => option.breakpoint);
      await render((host) => {
        host.responsiveOptions.set(options);
      });

      expect(options.map((option) => option.breakpoint)).toEqual(before);
    });

    it('never changes the app’s value array, in any mode', async () => {
      const items = Object.freeze(makeProducts().map((product) => Object.freeze(product)));
      const { component, fixture } = await render((host) => {
        host.items.set(items as Product[]);
        host.circular.set(true);
        host.numVisible.set(2);
      });
      await applyReducedMotionRule();
      const harness = await harnessOf(fixture);

      for (let step = 0; step < 4; step += 1) {
        await harness.next();
      }
      await harness.previous();
      await harness.goToPage(2);
      await fixture.whenStable();

      expect(component.items()).toBe(items);
      expect(items.map((item) => item.name)).toEqual(NAMES);
    });

    it('starts on page and follows the page model both ways, emitting pageChange from the user', async () => {
      const { component, fixture } = await render((host) => {
        host.page.set(2);
      });
      const harness = await harnessOf(fixture);

      expect(await harness.getPage()).toBe(2);
      expect(await onScreen(harness)).toEqual(['Mug']);

      component.page.set(4);
      await fixture.whenStable();
      await expect.poll(() => onScreen(harness)).toEqual(['Cup']);
      expect(await harness.getPage()).toBe(4);

      await harness.next();

      await expect.poll(() => onScreen(harness)).toEqual(['Bowl']);
      expect(component.pages.at(-1)).toBe(5);
      expect(component.page()).toBe(5);

      await harness.goToPage(1);

      await expect.poll(() => onScreen(harness)).toEqual(['Teapot']);
      expect(component.pages.at(-1)).toBe(1);
    });

    it('wraps from the last page to the first and back when circular, with the clones inert', async () => {
      reduceMotion(true);
      const { fixture, element } = await render((host) => {
        host.circular.set(true);
      });
      await applyReducedMotionRule();
      const harness = await harnessOf(fixture);

      expect(clonesOf(element)).toHaveLength(2);
      expect(await onScreen(harness)).toEqual(['Kettle']);

      await turn(fixture, element, indicatorAt(element, 5));
      await expect.poll(() => onScreen(harness)).toEqual(['Bowl']);
      await turn(fixture, element, nextOf(element));

      await expect.poll(() => listOf(element).style.transform).toBe(FIRST_SLIDE_AT_REST);
      await expect.poll(() => onScreen(harness)).toEqual(['Kettle']);
      expect(await harness.getPage()).toBe(0);

      await turn(fixture, element, prevOf(element));

      await expect.poll(() => onScreen(harness)).toEqual(['Bowl']);
      await expect.poll(() => listOf(element).style.transform).toBe('translate3d(-600%, 0px, 0px)');
      expect(await harness.getPage()).toBe(5);
    });

    it('stops at the ends when not circular', async () => {
      const { fixture } = await render((host) => {
        host.page.set(5);
      });
      const harness = await harnessOf(fixture);

      await harness.next();
      expect(await onScreen(harness)).toEqual(['Bowl']);
      expect(await harness.getPage()).toBe(5);

      await harness.goToPage(0);
      await expect.poll(() => onScreen(harness)).toEqual(['Kettle']);
      await harness.previous();
      expect(await onScreen(harness)).toEqual(['Kettle']);
    });

    it('hides the indicators and the navigators on request', async () => {
      const { component, fixture, element } = await render();
      const harness = await harnessOf(fixture);
      expect(indicatorsOf(element)).toHaveLength(6);

      component.showIndicators.set(false);
      component.showNavigators.set(false);
      await fixture.whenStable();

      expect(indicatorsOf(element)).toHaveLength(0);
      expect(element.querySelector('[data-pc-name="pcnextbutton"]')).toBeNull();
      expect(element.querySelector('[data-pc-name="pcprevbutton"]')).toBeNull();
      expect(await harness.getPageCount()).toBe(0);
      expect(await onScreen(harness)).toEqual(['Kettle']);
    });

    it('renders no slide and no indicator for an empty value, and follows a later fill', async () => {
      const { component, fixture, element } = await render((host) => {
        host.items.set([]);
      });
      const harness = await harnessOf(fixture);

      expect(slidesOf(element)).toHaveLength(0);
      expect(await harness.getPageCount()).toBe(0);

      component.items.set(makeProducts());
      await fixture.whenStable();

      expect(await harness.getPageCount()).toBe(6);
      await expect.poll(() => onScreen(harness)).toEqual(['Kettle']);
    });

    it('does not take focus when it renders, whatever Optimus’s autofocus attribute says', async () => {
      const { element } = await render();

      await expect.poll(() => document.activeElement).toBe(document.body);
      expect(element.contains(document.activeElement)).toBe(false);
    });
  });

  describe('slot', () => {
    it('renders the typed template once per item, with the item as its context', async () => {
      const { fixture, element } = await render();
      const harness = await harnessOf(fixture);

      expect(slidesOf(element)).toHaveLength(6);
      expect(
        slidesOf(element).map((slide) => find(slide, '.name', HTMLElement).textContent),
      ).toEqual(NAMES);
      expect(await harness.getVisibleItemTexts()).toEqual(['Kettle Buy Kettle']);
    });

    it('follows a changed item list and changed items', async () => {
      const { component, fixture, element } = await render();
      const harness = await harnessOf(fixture);

      component.items.set([{ name: 'Pan' }, { name: 'Pot' }]);
      await fixture.whenStable();

      expect(slidesOf(element).map((slide) => nameOf(slide.textContent))).toEqual(['Pan', 'Pot']);
      expect(await harness.getPageCount()).toBe(2);
      await expect.poll(() => onScreen(harness)).toEqual(['Pan']);
    });

    it('renders the template of a slot that arrives after the carousel does', async () => {
      const { component, fixture, element } = await render((host) => {
        host.withSlot.set(false);
      });
      expect(slidesOf(element).map((slide) => slide.textContent.trim())).toEqual(
        NAMES.map(() => ''),
      );

      component.withSlot.set(true);
      await fixture.whenStable();

      await expect
        .poll(() => slidesOf(element).map((slide) => nameOf(slide.textContent)))
        .toEqual(NAMES);
    });

    it('renders an HTML payload in an item as text, and runs nothing', async () => {
      const { element } = await render((host) => {
        host.items.set([{ name: PAYLOAD }]);
      });

      expect(find(slidesOf(element)[0] ?? element, '.name', HTMLElement).textContent).toBe(PAYLOAD);
      expect(hostOf(element).querySelector('img')).toBeNull();
      expect(hostOf(element).querySelector('script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('the region and the navigators', () => {
    it('names the region on the Optimus root and leaves the host with no ARIA', async () => {
      const { element } = await render();

      expect(innerOf(element).getAttribute('aria-label')).toBe('Featured products');
      expect(innerOf(element).hasAttribute('aria-labelledby')).toBe(false);
      expect(
        Array.from(hostOf(element).attributes).filter((attribute) =>
          attribute.name.startsWith('aria-'),
        ),
      ).toEqual([]);
    });

    it('follows ariaLabel and ariaLabelledBy as they change and clear', async () => {
      const { component, fixture, element } = await render();
      const harness = await harnessOf(fixture);

      component.ariaLabel.set('Our products');
      component.ariaLabelledBy.set('name');
      await fixture.whenStable();

      expect(innerOf(element).getAttribute('aria-label')).toBe('Our products');
      expect(innerOf(element).getAttribute('aria-labelledby')).toBe('name');
      expect(await harness.getAriaLabel()).toBe('Our products');

      component.ariaLabelledBy.set(undefined);
      await fixture.whenStable();

      expect(innerOf(element).hasAttribute('aria-labelledby')).toBe(false);
      expect(innerOf(element).getAttribute('aria-label')).toBe('Our products');
    });

    it('keeps the region’s name after paging and after a circular wrap', async () => {
      const { fixture, element } = await render((host) => {
        host.circular.set(true);
        host.ariaLabelledBy.set('name');
      });
      await applyReducedMotionRule();
      const harness = await harnessOf(fixture);

      for (let step = 0; step < 7; step += 1) {
        await turn(fixture, element, nextOf(element));
        expect(innerOf(element).getAttribute('aria-label')).toBe('Featured products');
        expect(innerOf(element).getAttribute('aria-labelledby')).toBe('name');
      }
      await expect.poll(() => onScreen(harness)).toEqual(['Teapot']);
    });

    it('names the inner navigator buttons from the translation, and the Optimus host elements keep theirs', async () => {
      const { element } = await render();

      expect(prevOf(element).getAttribute('aria-label')).toBe('Previous Page');
      expect(nextOf(element).getAttribute('aria-label')).toBe('Next Page');
    });

    it('names them from a custom translation', async () => {
      const { element } = await render(undefined, 'light', {
        translation: { aria: { prevPageLabel: 'Trang trước', nextPageLabel: 'Trang sau' } },
      });

      expect(prevOf(element).getAttribute('aria-label')).toBe('Trang trước');
      expect(nextOf(element).getAttribute('aria-label')).toBe('Trang sau');
    });

    it('keeps the navigator names after paging, a wrap and a pt change', async () => {
      const { component, fixture, element } = await render((host) => {
        host.circular.set(true);
      });
      await applyReducedMotionRule();

      await turn(fixture, element, indicatorAt(element, 5));
      await turn(fixture, element, nextOf(element));
      await expect.poll(() => listOf(element).style.transform).toBe(FIRST_SLIDE_AT_REST);
      component.pt.set({ pcNextButton: { root: { 'data-probe': 'next' } } });
      await fixture.whenStable();

      expect(prevOf(element).getAttribute('aria-label')).toBe('Previous Page');
      expect(nextOf(element).getAttribute('aria-label')).toBe('Next Page');
      expect(nextOf(element).getAttribute('data-probe')).toBe('next');
    });

    it('renders an HTML payload in ariaLabel as text, and runs nothing', async () => {
      const { element } = await render((host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
      });

      expect(innerOf(element).getAttribute('aria-label')).toBe(PAYLOAD);
      expect(innerOf(element).getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(hostOf(element).querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('hidden slides', () => {
    it('makes every slide off screen inert and the one on screen not, from the first render', async () => {
      const { fixture, element } = await render();
      const harness = await harnessOf(fixture);

      expectHiddenSlidesInert(element);
      expect(liveSlides(element)).toEqual(['Kettle']);
      expect(slideButtons(element)).toEqual(['Buy Kettle']);
      expect(await onScreen(harness)).toEqual(['Kettle']);
    });

    it('follows the page: next, previous, a jump through an indicator and a page change from the app', async () => {
      const { component, fixture, element } = await render();
      const harness = await harnessOf(fixture);

      await harness.next();
      await harness.next();
      expectHiddenSlidesInert(element);
      expect(liveSlides(element)).toEqual(['Mug']);
      expect(slideButtons(element)).toEqual(['Buy Mug']);

      await harness.previous();
      expect(liveSlides(element)).toEqual(['Teapot']);

      await harness.goToPage(5);
      expectHiddenSlidesInert(element);
      expect(liveSlides(element)).toEqual(['Bowl']);
      expect(slideButtons(element)).toEqual(['Buy Bowl']);

      component.page.set(1);
      await fixture.whenStable();
      await expect.poll(() => liveSlides(element)).toEqual(['Teapot']);
      expectHiddenSlidesInert(element);
    });

    it('follows numVisible and numScroll changes after creation', async () => {
      const { component, fixture, element } = await render();

      component.numVisible.set(3);
      component.numScroll.set(3);
      await fixture.whenStable();

      await expect.poll(() => liveSlides(element)).toEqual(['Kettle', 'Teapot', 'Mug']);
      expectHiddenSlidesInert(element);
      expect(slideButtons(element)).toEqual(['Buy Kettle', 'Buy Teapot', 'Buy Mug']);
    });

    it('holds in circular mode: the first render, every page, both wraps, with a button in every slide and clone', async () => {
      const { fixture, element } = await render((host) => {
        host.circular.set(true);
      });
      await applyReducedMotionRule();

      expectHiddenSlidesInert(element);
      expect(liveSlides(element)).toEqual(['Kettle']);
      expect(clonesOf(element).every((clone) => clone.querySelector('button') !== null)).toBe(true);

      // Forward through the last page and round the wrap, twice over.
      for (let step = 1; step <= 8; step += 1) {
        await turn(fixture, element, nextOf(element));
        const expected = NAMES[step % NAMES.length] ?? '';
        await expect.poll(() => liveSlides(element)).toEqual([expected]);
        expectHiddenSlidesInert(element);
        expect(slideButtons(element)).toEqual([`Buy ${expected}`]);
      }

      // And backwards round the other wrap.
      for (let step = 1; step <= 3; step += 1) {
        await turn(fixture, element, prevOf(element));
        const expected = NAMES[(8 - step + NAMES.length * 2) % NAMES.length] ?? '';
        await expect.poll(() => liveSlides(element)).toEqual([expected]);
        expectHiddenSlidesInert(element);
        expect(slideButtons(element)).toEqual([`Buy ${expected}`]);
      }
    });

    it('holds in circular mode with several slides on screen', async () => {
      const { fixture, element } = await render((host) => {
        host.circular.set(true);
        host.numVisible.set(2);
        host.numScroll.set(2);
      });
      await applyReducedMotionRule();

      expect(liveSlides(element)).toEqual(['Kettle', 'Teapot']);
      expect(clonesOf(element)).toHaveLength(4);
      // Three pages of two: the third step wraps back to the first.
      for (let step = 0; step < 3; step += 1) {
        await turn(fixture, element, nextOf(element));
        expectHiddenSlidesInert(element);
        expect(slideButtons(element)).toHaveLength(2);
      }
      await expect.poll(() => liveSlides(element)).toEqual(['Kettle', 'Teapot']);
    });

    it('lets a routed inert win over a consumer’s own, and keeps the rest of a consumer’s item part', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({ item: { inert: false, 'data-probe': 'item' } });
      });
      const harness = await harnessOf(fixture);

      await harness.next();

      expectHiddenSlidesInert(element);
      expect(slidesOf(element).every((slide) => slide.dataset['probe'] === 'item')).toBe(true);
      expect(liveSlides(element)).toEqual(['Teapot']);
    });
  });

  describe('indicators', () => {
    it('grows each indicator’s hit box to 32 by 24 px and keeps the bar 32 by 8 px', async () => {
      const { element } = await render();

      for (const indicator of indicatorsOf(element)) {
        const box = indicator.getBoundingClientRect();
        const style = getComputedStyle(indicator);

        expect(box.width).toBe(32);
        expect(box.height).toBe(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
        // The bar is the content box: the transparent padding is the hit box beyond it.
        expect(style.paddingTop).toBe('8px');
        expect(style.paddingBottom).toBe('8px');
        expect(style.height).toBe('8px');
        expect(style.backgroundClip).toBe('content-box');
      }
    });

    it('keeps the bar where it was: the list’s block padding drops from 16 to 8 px, the container gets 4 px', async () => {
      const { element } = await render();
      const list = find(element, '[data-pc-section="indicatorlist"]', HTMLElement);
      const container = find(element, '[data-pc-section="contentcontainer"]', HTMLElement);

      expect(getComputedStyle(list).paddingTop).toBe('8px');
      expect(getComputedStyle(list).paddingBottom).toBe('8px');
      expect(getComputedStyle(container).padding).toBe('4px');
      // The list's 8 px and the button's own 8 px: the bar sits 16 px below the slides, as before.
      const viewport = find(element, '[data-pc-section="viewport"]', HTMLElement);
      expect(
        indicatorAt(element, 0).getBoundingClientRect().top +
          8 -
          viewport.getBoundingClientRect().bottom,
      ).toBe(16);
    });

    it('paints the inactive bar in the form-field border colour, hover in its hover colour and the active bar in the primary colour', async () => {
      const { element } = await render();
      const host = hostOf(element);
      await parkPointer(element);

      const background = (index: number): string =>
        getComputedStyle(indicatorAt(element, index)).backgroundColor;
      expect(background(1)).toBe(
        resolved(host, 'background-color', 'var(--wj-form-field-border-color)'),
      );
      expect(background(0)).toBe(resolved(host, 'background-color', 'var(--wj-primary-color)'));

      await userEvent.hover(indicatorAt(element, 1));
      await expect
        .poll(() => background(1))
        .toBe(resolved(host, 'background-color', 'var(--wj-form-field-hover-border-color)'));

      await parkPointer(element);
      await expect
        .poll(() => background(1))
        .toBe(resolved(host, 'background-color', 'var(--wj-form-field-border-color)'));
    });

    it('keeps the inactive bar at 3:1 or more against the page, in both schemes', async () => {
      for (const scheme of ['light', 'dark'] as const) {
        const { fixture, element } = await render(undefined, scheme);
        const bar = getComputedStyle(indicatorAt(element, 1)).backgroundColor;
        const page = resolved(hostOf(element), 'background-color', 'var(--wj-content-background)');

        expect(contrast(bar, page), scheme).toBeGreaterThanOrEqual(3);
        fixture.destroy();
        TestBed.resetTestingModule();
      }
    });

    it('keeps the hit box after paging', async () => {
      const { fixture, element } = await render();
      const harness = await harnessOf(fixture);

      await harness.goToPage(3);

      for (const indicator of indicatorsOf(element)) {
        expect(indicator.getBoundingClientRect().height).toBe(24);
        expect(indicator.getBoundingClientRect().width).toBe(32);
      }
    });
  });

  describe('slide announcements', () => {
    it('sets aria-live to polite on the content from the first render', async () => {
      const { element } = await render();

      expect(contentOf(element).getAttribute('aria-live')).toBe('polite');
    });

    it('holds it after paging, a wrap, an input change and a pt change', async () => {
      const { component, fixture, element } = await render((host) => {
        host.circular.set(true);
      });
      await applyReducedMotionRule();

      await turn(fixture, element, nextOf(element));
      expect(contentOf(element).getAttribute('aria-live')).toBe('polite');
      await turn(fixture, element, indicatorAt(element, 5));
      await turn(fixture, element, nextOf(element));
      await expect.poll(() => listOf(element).style.transform).toBe(FIRST_SLIDE_AT_REST);
      expect(contentOf(element).getAttribute('aria-live')).toBe('polite');

      component.numVisible.set(2);
      component.ariaLabel.set('Other');
      component.pt.set({ content: { 'data-probe': 'content' } });
      await fixture.whenStable();
      await turn(fixture, element, nextOf(element));

      expect(contentOf(element).getAttribute('aria-live')).toBe('polite');
      expect(contentOf(element).getAttribute('data-probe')).toBe('content');
    });

    it('lets the routed value win over a consumer’s aria-live on the same part', async () => {
      const { fixture, element } = await render((host) => {
        host.pt.set({ content: { 'aria-live': 'off' } });
      });
      const harness = await harnessOf(fixture);

      await harness.next();

      expect(contentOf(element).getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('reduced motion', () => {
    it('sets the item list’s transition-duration to 1 ms, important and never none, only under prefers-reduced-motion', async () => {
      await render();

      const reduced = rulesFor(LIST_RULE, REDUCED);
      expect(reduced).toHaveLength(1);
      expect(reduced[0]?.style.getPropertyValue('transition-duration')).toBe('1ms');
      expect(reduced[0]?.style.getPropertyPriority('transition-duration')).toBe('important');
      expect(reduced[0]?.style.getPropertyValue('transition')).toBe('');
      expect(reduced[0]?.style.getPropertyValue('transition-property')).toBe('');
      // No rule of the wrapper touches the list's transition outside the block.
      expect(
        rulesFor('wj-carousel .p-carousel-item-list', null).map((rule) =>
          rule.style.getPropertyValue('transition-duration'),
        ),
      ).toEqual([]);
    });

    it('leaves Optimus’s 500 ms slide alone when the reader has not asked for less', async () => {
      reduceMotion(false);
      const { fixture, element } = await render();
      const harness = await harnessOf(fixture);

      await harness.next();

      expect(getComputedStyle(listOf(element)).transitionDuration).toBe('0.5s');
    });

    it('slides in 1 ms with the rule applied, over Optimus’s inline transition', async () => {
      reduceMotion(true);
      const { fixture, element } = await render();
      await applyReducedMotionRule();
      const harness = await harnessOf(fixture);

      await harness.next();

      expect(listOf(element).style.transition).toContain('500ms');
      expect(getComputedStyle(listOf(element)).transitionDuration).toBe('0.001s');
      expect(getComputedStyle(listOf(element)).transitionProperty).toBe('transform');
    });

    it('still wraps a circular carousel under reduced motion: transitionend fires and Optimus resets the list', async () => {
      reduceMotion(true);
      const { component, fixture, element } = await render((host) => {
        host.circular.set(true);
      });
      await applyReducedMotionRule();
      const harness = await harnessOf(fixture);

      await turn(fixture, element, indicatorAt(element, 5));
      await press(fixture, nextOf(element));

      await expect.poll(() => listOf(element).style.transform).toBe(FIRST_SLIDE_AT_REST);
      await expect.poll(() => listOf(element).style.transition).toBe('');
      await expect.poll(() => onScreen(harness)).toEqual(['Kettle']);
      expect(await harness.getPage()).toBe(0);
      expect(component.page()).toBe(0);
      expectHiddenSlidesInert(element);
    });

    it('wraps a circular carousel with Optimus’s own 500 ms slide too', async () => {
      const { fixture, element } = await render((host) => {
        host.circular.set(true);
        host.page.set(5);
      });
      const harness = await harnessOf(fixture);

      await press(fixture, nextOf(element));

      await expect
        .poll(() => listOf(element).style.transform, { timeout: 4000 })
        .toBe(FIRST_SLIDE_AT_REST);
      await expect.poll(() => onScreen(harness)).toEqual(['Kettle']);
    });

    it('never moves on its own: no autoplay, so a minute on the clock changes nothing', async () => {
      const { component, fixture, element } = await render((host) => {
        host.circular.set(true);
      });
      const before = listOf(element).style.transform;

      vi.useFakeTimers(); // spec-timing: an autoplay interval Optimus started would fire inside this fake clock
      vi.advanceTimersByTime(60_000); // spec-timing: a minute of fake time, to prove nothing advances the slides
      vi.useRealTimers();
      await fixture.whenStable();

      expect(listOf(element).style.transform).toBe(before);
      expect(component.pages).toEqual([]);
      expect(component.page()).toBe(0);
      expect(liveSlides(element)).toEqual(['Kettle']);
    });
  });

  describe('keyboard', () => {
    it('Tab goes previous button, the slide on screen, next button, the current indicator, then on', async () => {
      const { element } = await render();
      buttonOf(element, 'before').focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(prevOf(element));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '.buy', HTMLButtonElement));
      expect(document.activeElement?.textContent.trim()).toBe('Buy Kettle');
      await userEvent.tab();
      expect(document.activeElement).toBe(nextOf(element));
      await userEvent.tab();
      expect(document.activeElement).toBe(indicatorAt(element, 0));
      await userEvent.tab();
      expect(document.activeElement).toBe(buttonOf(element, 'after'));
    });

    it('has one slide button, one indicator and both navigators in the Tab order on every page', async () => {
      const { fixture, element } = await render();
      const harness = await harnessOf(fixture);

      for (let page = 0; page < 6; page += 1) {
        await harness.goToPage(page);
        const stops = tabStops(hostOf(element));
        expect(stops).toHaveLength(4);
        expect(stops).toContain(prevOf(element));
        expect(stops).toContain(nextOf(element));
        expect(stops).toContain(indicatorAt(element, page));
      }
    });

    it('keeps the end navigators in the Tab order, dimmed but not disabled, on the first and last page', async () => {
      const { fixture, element } = await render();
      const harness = await harnessOf(fixture);

      expect(prevOf(element).disabled).toBe(false);
      expect(tabStops(hostOf(element))).toContain(prevOf(element));
      await harness.goToPage(5);
      expect(nextOf(element).disabled).toBe(false);
      expect(tabStops(hostOf(element))).toContain(nextOf(element));
    });

    it('Enter and Space on the navigators change the page', async () => {
      const { fixture, element } = await render();
      const harness = await harnessOf(fixture);

      nextOf(element).focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => harness.getPage()).toBe(1);
      await userEvent.keyboard(' ');
      await expect.poll(() => harness.getPage()).toBe(2);

      prevOf(element).focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => harness.getPage()).toBe(1);
      await userEvent.keyboard(' ');
      await expect.poll(() => harness.getPage()).toBe(0);
    });

    it('ArrowRight and ArrowLeft move focus among the indicators, and Enter and Space show that page', async () => {
      const { fixture, element } = await render();
      const harness = await harnessOf(fixture);
      indicatorAt(element, 0).focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(indicatorAt(element, 1));
      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(indicatorAt(element, 2));
      await userEvent.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(indicatorAt(element, 1));
      expect(await harness.getPage()).toBe(0);

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => harness.getPage()).toBe(1);
      expect(await onScreen(harness)).toEqual(['Teapot']);

      await userEvent.keyboard('{ArrowRight}');
      await userEvent.keyboard(' ');
      await expect.poll(() => harness.getPage()).toBe(2);
      expect(await onScreen(harness)).toEqual(['Mug']);
    });

    it('does not wire Home and End on the indicators: focus stays where it is (the listed gap)', async () => {
      const { element } = await render();
      indicatorAt(element, 2).focus();

      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(indicatorAt(element, 2));
      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(indicatorAt(element, 2));
    });

    it('reaches a button in a slide that arrives on screen, and not the one that left', async () => {
      const { element } = await render();
      nextOf(element).focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => slideButtons(element)).toEqual(['Buy Teapot']);

      buttonOf(element, 'before').focus();
      await userEvent.tab();
      await userEvent.tab();

      expect(document.activeElement?.textContent.trim()).toBe('Buy Teapot');
    });
  });

  describe('harness', () => {
    it('reads the page and the page count, pages with next, previous and goToPage, and reads the slides on screen', async () => {
      const { fixture } = await render((host) => {
        host.numVisible.set(2);
        host.numScroll.set(2);
      });
      const harness = await harnessOf(fixture);

      expect(await harness.getPageCount()).toBe(3);
      expect(await harness.getPage()).toBe(0);
      expect(await harness.getVisibleItemCount()).toBe(2);
      expect(await onScreen(harness)).toEqual(['Kettle', 'Teapot']);

      await harness.next();
      await expect.poll(() => onScreen(harness)).toEqual(['Mug', 'Jug']);
      expect(await harness.getPage()).toBe(1);

      await harness.goToPage(2);
      await expect.poll(() => onScreen(harness)).toEqual(['Cup', 'Bowl']);

      await harness.previous();
      await expect.poll(() => onScreen(harness)).toEqual(['Mug', 'Jug']);
      await expect(harness.goToPage(9)).rejects.toThrow('no page 9');
    });

    it('finds a carousel by its accessible name', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(
        await loader.getAllHarnesses(WjCarouselHarness.with({ ariaLabel: /featured/i })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjCarouselHarness.with({ ariaLabel: 'Other' })),
      ).toHaveLength(0);
    });
  });

  describe('pt', () => {
    const PARTS = [
      'root',
      'content',
      'viewport',
      'itemList',
      'item',
      'itemClone',
      'indicatorList',
      'indicator',
      'indicatorButton',
    ] as const;

    const probes = (element: HTMLElement): Record<string, string | null | undefined> => ({
      root: innerOf(element).dataset['probe'],
      content: contentOf(element).dataset['probe'],
      viewport: find(element, '[data-pc-section="viewport"]', HTMLElement).dataset['probe'],
      itemList: listOf(element).dataset['probe'],
      item: slidesOf(element)[0]?.dataset['probe'],
      itemClone: clonesOf(element)[0]?.dataset['probe'],
      indicatorList: find(element, '[data-pc-section="indicatorlist"]', HTMLElement).dataset[
        'probe'
      ],
      indicator: find(element, '[data-pc-section="indicator"]', HTMLElement).dataset['probe'],
      indicatorButton: indicatorAt(element, 0).dataset['probe'],
      pcPrevButton: prevOf(element).dataset['probe'],
      pcNextButton: nextOf(element).dataset['probe'],
    });

    it('reaches every part of the docs table as an object', async () => {
      const { element } = await render((host) => {
        host.circular.set(true);
        host.pt.set({
          root: { 'data-probe': 'root' },
          content: { 'data-probe': 'content' },
          viewport: { 'data-probe': 'viewport' },
          itemList: { 'data-probe': 'itemList' },
          item: { 'data-probe': 'item' },
          itemClone: { 'data-probe': 'itemClone' },
          indicatorList: { 'data-probe': 'indicatorList' },
          indicator: { 'data-probe': 'indicator' },
          indicatorButton: { 'data-probe': 'indicatorButton' },
          pcPrevButton: { root: { 'data-probe': 'pcPrevButton' } },
          pcNextButton: { root: { 'data-probe': 'pcNextButton' } },
        });
      });

      expect(probes(element)).toEqual({
        root: 'root',
        content: 'content',
        viewport: 'viewport',
        itemList: 'itemList',
        item: 'item',
        itemClone: 'itemClone',
        indicatorList: 'indicatorList',
        indicator: 'indicator',
        indicatorButton: 'indicatorButton',
        pcPrevButton: 'pcPrevButton',
        pcNextButton: 'pcNextButton',
      });
      expect(PARTS).toHaveLength(9);
    });

    it('reaches the parts as a function, and an item part as a function or a class string', async () => {
      const { component, fixture, element } = await render((host) => {
        host.circular.set(true);
        host.pt.set(() => ({
          root: { 'data-probe': 'fn-root' },
          item: () => ({ 'data-probe': 'fn-item' }),
        }));
      });

      expect(innerOf(element).dataset['probe']).toBe('fn-root');
      expect(slidesOf(element)[0]?.dataset['probe']).toBe('fn-item');
      expectHiddenSlidesInert(element);

      component.pt.set({ item: 'wj-probe-slide' });
      await fixture.whenStable();

      expect(slidesOf(element).every((slide) => slide.classList.contains('wj-probe-slide'))).toBe(
        true,
      );
      expectHiddenSlidesInert(element);
    });

    it('keeps the consumer keys beside the routed attributes, and the routed attribute wins', async () => {
      const { component, fixture, element } = await render((host) => {
        host.pt.set({
          root: { 'aria-label': 'Consumer', 'data-probe': 'kept' },
          pcNextButton: { root: { 'aria-label': 'Consumer next', 'data-probe': 'next' } },
        });
      });

      expect(innerOf(element).getAttribute('aria-label')).toBe('Featured products');
      expect(innerOf(element).dataset['probe']).toBe('kept');
      expect(nextOf(element).getAttribute('aria-label')).toBe('Next Page');
      expect(nextOf(element).dataset['probe']).toBe('next');

      component.pt.set(undefined);
      await fixture.whenStable();

      expect(innerOf(element).getAttribute('aria-label')).toBe('Featured products');
      expect(nextOf(element).getAttribute('aria-label')).toBe('Next Page');
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-carousel: provideWeeljack() is missing from the application providers. ' +
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
        'WJ0003: wj-carousel: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use ariaLabel or ariaLabelledBy instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(innerOf(element).getAttribute('aria-label')).toBe('Featured products');
    });

    it('stays silent for a well-formed carousel', async () => {
      await render();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      // The fixture's native Before/After buttons are not under test and fail `target-size`, so
      // axe is scoped to the carousel.
      it('has no axe violations: first page', async () => {
        const { element } = await render(undefined, scheme);

        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations: a middle page', async () => {
        const { fixture, element } = await render(undefined, scheme);
        const harness = await harnessOf(fixture);
        await harness.goToPage(2);
        await expect.poll(() => liveSlides(element)).toEqual(['Mug']);

        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations: last page', async () => {
        const { fixture, element } = await render(undefined, scheme);
        const harness = await harnessOf(fixture);
        await harness.goToPage(5);
        await expect.poll(() => liveSlides(element)).toEqual(['Bowl']);

        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations: circular, at rest, after a wrap and after a step back', async () => {
        const { fixture, element } = await render((host) => {
          host.circular.set(true);
        }, scheme);
        await applyReducedMotionRule();
        await expectNoAxeViolations(hostOf(element));

        await turn(fixture, element, indicatorAt(element, 5));
        await turn(fixture, element, nextOf(element));
        await expect.poll(() => listOf(element).style.transform).toBe(FIRST_SLIDE_AT_REST);
        await expectNoAxeViolations(hostOf(element));

        await turn(fixture, element, prevOf(element));
        await expect.poll(() => liveSlides(element)).toEqual(['Bowl']);
        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations: several slides on screen, and a focused indicator', async () => {
        const { element } = await render((host) => {
          host.numVisible.set(3);
          host.numScroll.set(3);
        }, scheme);
        await expect.poll(() => liveSlides(element)).toHaveLength(3);
        indicatorAt(element, 0).focus();

        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations: named by ariaLabelledBy', async () => {
        const { element } = await render((host) => {
          host.ariaLabelledBy.set('name');
        }, scheme);

        await expectNoAxeViolations(hostOf(element));
      });
    });
  });
});
