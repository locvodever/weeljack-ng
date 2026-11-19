/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjGalleria,
  WjGalleriaCaptionSlot,
  WjGalleriaItemSlot,
  WjGalleriaThumbnailSlot,
  type WjGalleriaPt,
  type WjGalleriaResponsiveOption,
  type WjGalleriaThumbnailsPosition,
} from 'weeljack-ng/galleria';
import { WjGalleriaHarness } from 'weeljack-ng/galleria/testing';
import { expectNoAxeViolations } from '../spec-support/axe';
import { afterOverlay } from '../spec-support/teardown';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Scheme = 'light' | 'dark';

interface Photo {
  src: string;
  alt: string;
  title: string;
}

/** Local `data:` images only (no network): a flat 4:3 scene per palette. */
const scene = (sky: string, hill: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="${sky}"/><circle cx="244" cy="58" r="28" fill="#f2c94c"/><path d="M0 240V160q120-80 320 0v80z" fill="${hill}"/></svg>`,
  )}`;

const SCENES = [
  ['#bcd4e6', '#6a994e'],
  ['#dbe7f0', '#f4f7f9'],
  ['#274c77', '#386641'],
  ['#f4a261', '#6d597a'],
  ['#cdeac0', '#2d6a4f'],
  ['#e9c46a', '#8c5e3c'],
] as const;
const TITLES = ['Meadow', 'Winter', 'Moon', 'Sunset', 'Spring', 'Autumn'];
const makePhotos = (): Photo[] =>
  SCENES.map(([sky, hill], index) => ({
    src: scene(sky, hill),
    alt: `A ${TITLES[index] ?? ''} scene`,
    title: TITLES[index] ?? '',
  }));

/**
 * A consumer's template with the strip on: a gallery between native buttons, with a button that
 * opens the full screen. The thumbnail is the same image with `alt=""` (Optimus names each
 * thumbnail "Page N").
 */
@Component({
  selector: 'wj-galleria-thumbnails-host',
  imports: [WjGalleria, WjGalleriaItemSlot, WjGalleriaThumbnailSlot, WjGalleriaCaptionSlot],
  template: `
    <button type="button" id="before">Before</button>
    <p id="name">Holiday photos</p>
    <div style="inline-size: 640px; margin: 24px">
      <wj-galleria
        [value]="items()"
        [activeIndex]="activeIndex()"
        (activeIndexChange)="indexChanged($event)"
        [visible]="visible()"
        (visibleChange)="visibleChanged($event)"
        [fullScreen]="fullScreen()"
        [numVisible]="numVisible()"
        [responsiveOptions]="responsiveOptions()"
        [circular]="circular()"
        [showItemNavigators]="showItemNavigators()"
        [showThumbnails]="showThumbnails()"
        [showThumbnailNavigators]="showThumbnailNavigators()"
        [thumbnailsPosition]="thumbnailsPosition()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [pt]="pt()"
      >
        <ng-template wjGalleriaItem [wjGalleriaItemOf]="items()" let-photo>
          <img class="photo" [src]="photo.src" [alt]="photo.alt" />
        </ng-template>
        <ng-template wjGalleriaThumbnail [wjGalleriaThumbnailOf]="items()" let-photo>
          <img class="thumb" [src]="photo.src" alt="" />
          <span class="thumb-title">{{ photo.title }}</span>
        </ng-template>
        @if (withCaption()) {
          <ng-template wjGalleriaCaption [wjGalleriaCaptionOf]="items()" let-photo>
            <span class="title">{{ photo.title }}</span>
            <span class="line">{{ photo.alt }}</span>
          </ng-template>
        }
      </wj-galleria>
    </div>
    @if (opener()) {
      <button type="button" id="opener" (click)="visible.set(true)">View photos</button>
    }
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly items = signal<Photo[]>(makePhotos());
  readonly activeIndex = signal(0);
  readonly visible = signal(false);
  readonly fullScreen = signal(false);
  readonly numVisible = signal(4);
  readonly responsiveOptions = signal<WjGalleriaResponsiveOption[] | undefined>(undefined);
  readonly circular = signal(false);
  readonly showItemNavigators = signal(true);
  readonly showThumbnails = signal(true);
  readonly showThumbnailNavigators = signal(true);
  readonly thumbnailsPosition = signal<WjGalleriaThumbnailsPosition>('bottom');
  readonly ariaLabel = signal('Holiday photos');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjGalleriaPt>(undefined);
  readonly withCaption = signal(false);
  readonly opener = signal(true);
  readonly indexes: number[] = [];
  readonly visibles: boolean[] = [];

  protected indexChanged(index: number): void {
    this.indexes.push(index);
    this.activeIndex.set(index);
  }

  protected visibleChanged(visible: boolean): void {
    this.visibles.push(visible);
    this.visible.set(visible);
  }
}

/** A gallery with a thumbnail template and no `showThumbnails`: every existing gallery's shape. */
@Component({
  selector: 'wj-galleria-default-host',
  imports: [WjGalleria, WjGalleriaItemSlot, WjGalleriaThumbnailSlot],
  template: `
    <wj-galleria ariaLabel="Holiday photos" [value]="items">
      <ng-template wjGalleriaItem [wjGalleriaItemOf]="items" let-photo>
        <img [src]="photo.src" [alt]="photo.alt" />
      </ng-template>
      <ng-template wjGalleriaThumbnail [wjGalleriaThumbnailOf]="items" let-photo>
        <img [src]="photo.src" alt="" />
      </ng-template>
    </wj-galleria>
  `,
})
class DefaultHost {
  protected readonly items = makePhotos();
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

/** The fixture on screen, so `afterEach` can close a full screen a spec left open. */
let current: Rendered | undefined;

const realMatchMedia = window.matchMedia.bind(window);

/**
 * Sets the reader's reduced-motion preference for this window only: Optimus's motion runner reads
 * `window.matchMedia`. A CDP emulation would change the whole shared browser page, and with it every
 * spec file running beside this one.
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

/** Lets the browser draw two frames, so a style added now has a drawn style to start from. */
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

const all = (element: ParentNode, selector: string): HTMLElement[] =>
  Array.from(element.querySelectorAll<HTMLElement>(selector));

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-galleria', HTMLElement);
/** The open full-screen dialog; Optimus can leave a closed mask with `display: none`, which is closed. */
const maskEl = (): HTMLElement | null =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')).find(
    (dialog) => dialog.checkVisibility(),
  ) ?? null;
const part = (element: ParentNode, section: string): HTMLElement =>
  find(element, `[data-pc-section="${section}"]`, HTMLElement);
const thumbnailsOf = (element: ParentNode): HTMLElement[] =>
  all(element, '[data-pc-section="thumbnail"]');
const thumbnailItemsOf = (element: ParentNode): HTMLElement[] =>
  all(element, '[data-pc-section="thumbnailitem"]:not([type])');
const inView = (element: ParentNode): number =>
  all(element, '[data-pc-section="thumbnailitem"].p-galleria-thumbnail-item-active').length;
const buttonOf = (element: HTMLElement, id: string): HTMLButtonElement =>
  find(element, `#${id}`, HTMLButtonElement);
const thumbnailAt = (element: HTMLElement, index: number): HTMLElement => {
  const thumbnail = thumbnailsOf(element)[index];
  if (!thumbnail) {
    throw new Error(`thumbnail ${String(index)} is missing`);
  }
  return thumbnail;
};
const itemOf = (element: ParentNode): HTMLElement => part(element, 'item');
const shownPhoto = (element: HTMLElement): string =>
  find(itemOf(element), 'img', HTMLImageElement).alt;

/** The name of the element that has focus: its `aria-label`, else its text. */
const focusedName = (): string => {
  const active = document.activeElement;
  return active?.getAttribute('aria-label') ?? active?.textContent.trim() ?? '';
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
  // A reader meets the gallery after it was drawn: the strip's slide needs a drawn style to start.
  await frames();
  current = {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
  return current;
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjGalleriaHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjGalleriaHarness);

/** Waits until the full screen has left and nothing of it, or its scroll lock, remains. */
async function gone(): Promise<void> {
  await expect.poll(() => maskEl()).toBeNull();
  await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(false);
}

/** Opens the full screen by clicking the app's button and waits until focus is on Close. */
async function open({ element }: Rendered): Promise<void> {
  await userEvent.click(buttonOf(element, 'opener'));
  await expect.poll(focusedName).toBe('Close');
}

/** Closes the full screen with Escape and waits for the leave to end. */
async function closeWithEscape(): Promise<void> {
  await userEvent.keyboard('{Escape}');
  await gone();
}

/** Moves the pointer onto a neutral element, so no hover state colours what a spec reads next. */
async function parkPointer(element: HTMLElement): Promise<void> {
  await userEvent.hover(buttonOf(element, 'after'));
}

/** The value a CSS value resolves to, through a probe inside `host`. */
function resolved(host: HTMLElement, property: 'color', value: string): string {
  const probe = document.createElement('span');
  probe.style.setProperty(property, value);
  host.append(probe);
  const result = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return result;
}

/**
 * The invariants of the thumbnail strip: every thumbnail is a tab, the wrapper around it has
 * neither `aria-selected` nor `aria-controls`, exactly one thumbnail is current and exactly one is
 * in the Tab order, and both are the active item's.
 */
function expectStrip(element: HTMLElement, active: number): void {
  const thumbnails = thumbnailsOf(element);
  expect(thumbnails.length).toBeGreaterThan(0);
  expect(thumbnails.every((thumbnail) => thumbnail.getAttribute('role') === 'tab')).toBe(true);
  expect(thumbnailItemsOf(element)).toHaveLength(thumbnails.length);
  for (const item of thumbnailItemsOf(element)) {
    expect(item.hasAttribute('aria-selected')).toBe(false);
    expect(item.hasAttribute('aria-controls')).toBe(false);
  }
  expect(thumbnails.map((thumbnail) => thumbnail.getAttribute('aria-current'))).toEqual(
    thumbnails.map((_thumbnail, index) => (index === active ? 'page' : null)),
  );
  expect(thumbnails.map((thumbnail) => thumbnail.tabIndex)).toEqual(
    thumbnails.map((_thumbnail, index) => (index === active ? 0 : -1)),
  );
}

describe('WjGalleria thumbnail strip', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(async () => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Motion is off unless a spec turns it on: a layout read never lands mid-slide.
    reduceMotion(true);
    await page.viewport(1280, 1000);
  });

  afterEach(() => {
    // A full screen left open at teardown would reach the next spec: close it and wait for the leave.
    const left = current;
    current = undefined;
    return afterOverlay(
      async () => {
        if (left && maskEl()) {
          await userEvent.keyboard('{Escape}');
          await gone();
        }
      },
      async () => {
        left?.fixture.destroy();
        vi.useRealTimers();
        ROOT.classList.remove('wj-dark');
        document.body.style.backgroundColor = '';
        document.head
          .querySelectorAll('style[data-optimus-style-id], style[data-probe]')
          .forEach((style) => {
            style.remove();
          });
        Reflect.deleteProperty(window, 'wjInjected');
        await page.viewport(viewport.width, viewport.height);
      },
    );
  });

  describe('off by default', () => {
    it('renders no strip with a thumbnail template but no showThumbnails, so every gallery is unchanged', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(DefaultHost);
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelector('[data-pc-section="thumbnails"]')).toBeNull();
      expect(thumbnailsOf(element)).toHaveLength(0);
      expect(shownPhoto(element)).toBe('A Meadow scene');
      fixture.destroy();
    });

    it('shows the strip once showThumbnails is on', async () => {
      const { component, fixture, element } = await render((host) => {
        host.showThumbnails.set(false);
      });
      expect(element.querySelector('[data-pc-section="thumbnails"]')).toBeNull();

      component.showThumbnails.set(true);
      await fixture.whenStable();
      expect(thumbnailsOf(element)).toHaveLength(6);
    });
  });

  describe('inputs', () => {
    it('renders one thumbnail per item, each with the app’s template, and an `alt=""` image', async () => {
      const { element } = await render();

      expect(thumbnailsOf(element)).toHaveLength(6);
      expect(
        all(element, '[data-pc-section="thumbnail"] .thumb-title').map((t) => t.textContent),
      ).toEqual(TITLES);
      expect(
        all(element, '[data-pc-section="thumbnail"] img').every(
          (img) => img.getAttribute('alt') === '',
        ),
      ).toBe(true);
    });

    it('shows numVisible thumbnails and follows a change of it', async () => {
      const { component, fixture, element } = await render((host) => {
        host.numVisible.set(3);
      });
      expect(inView(element)).toBe(3);

      component.numVisible.set(5);
      await fixture.whenStable();
      expect(inView(element)).toBe(5);
    });

    it('applies the responsive option the window matches and ignores the one it does not', async () => {
      const { element } = await render((host) => {
        host.numVisible.set(4);
        host.responsiveOptions.set([
          { breakpoint: '100px', numVisible: 5 },
          { breakpoint: '10000px', numVisible: 2 },
        ]);
      });
      // Optimus's injected media query sizes the thumbnails: two fill the strip (the 100px option
      // does not match, or five would).
      const ratio = (): number =>
        Math.round(
          part(element, 'thumbnailsviewport').getBoundingClientRect().width /
            (thumbnailItemsOf(element)[0]?.getBoundingClientRect().width ?? 1),
        );
      expect(ratio()).toBe(2);
    });

    it('never reorders or changes the app’s responsiveOptions, nor its value array', async () => {
      const options = Object.freeze([
        Object.freeze({ breakpoint: '100px', numVisible: 4 }),
        Object.freeze({ breakpoint: '10000px', numVisible: 2 }),
      ]) as WjGalleriaResponsiveOption[];
      const photos = Object.freeze(makePhotos().map((photo) => Object.freeze(photo))) as Photo[];
      const { fixture } = await render((host) => {
        host.responsiveOptions.set(options);
        host.items.set(photos);
      });
      const harness = await harnessOf(fixture);
      await harness.selectThumbnail(3);

      expect(options.map((option) => option.breakpoint)).toEqual(['100px', '10000px']);
      expect(photos.map((photo) => photo.title)).toEqual(TITLES);
      expect(warn).not.toHaveBeenCalled();
    });

    it('puts the thumbnails below the item, or above with thumbnailsPosition top', async () => {
      const { component, fixture, element } = await render();
      const below = (): boolean =>
        part(element, 'thumbnails').getBoundingClientRect().top >=
        itemOf(element).getBoundingClientRect().bottom - 1;
      expect(below()).toBe(true);

      component.thumbnailsPosition.set('top');
      await fixture.whenStable();
      expect(below()).toBe(false);
      expect(part(element, 'thumbnails').getBoundingClientRect().bottom).toBeLessThanOrEqual(
        itemOf(element).getBoundingClientRect().top + 1,
      );
    });

    it('hides the thumbnail navigators on request, and shows them by default', async () => {
      const { component, fixture, element } = await render();
      expect(all(element, '[data-pc-group-section="thumbnailnavigator"]')).toHaveLength(2);

      component.showThumbnailNavigators.set(false);
      await fixture.whenStable();
      expect(all(element, '[data-pc-group-section="thumbnailnavigator"]')).toHaveLength(0);
      expect(thumbnailsOf(element)).toHaveLength(6);
    });

    it('renders nothing for an empty value, and follows a later fill', async () => {
      const { component, fixture, element } = await render((host) => {
        host.items.set([]);
      });
      expect(thumbnailsOf(element)).toHaveLength(0);

      component.items.set(makePhotos());
      await fixture.whenStable();
      expect(thumbnailsOf(element)).toHaveLength(6);
    });

    it('renders an HTML payload in a thumbnail as text, and runs nothing', async () => {
      const { element } = await render((host) => {
        host.items.set([{ src: scene('#bcd4e6', '#6a994e'), alt: PAYLOAD, title: PAYLOAD }]);
      });

      expect(find(element, '.thumb-title', HTMLElement).textContent).toBe(PAYLOAD);
      expect(hostOf(element).querySelector('script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('the strip’s semantics', () => {
    it('is a tablist of tabs with no aria-selected or aria-controls on the divs between, from the first render', async () => {
      const { element } = await render();

      expect(part(element, 'thumbnailitems').getAttribute('role')).toBe('tablist');
      expectStrip(element, 0);
      expect(
        thumbnailsOf(element).map((thumbnail) => thumbnail.getAttribute('aria-label')),
      ).toEqual(TITLES.map((_title, index) => `Page ${String(index + 1)}`));
    });

    it('holds after a step, a jump, a wrap, a change from the app and a new value', async () => {
      const { component, fixture, element } = await render((host) => {
        host.circular.set(true);
      });
      const harness = await harnessOf(fixture);

      await harness.next();
      expectStrip(element, 1);
      await harness.selectThumbnail(4);
      expectStrip(element, 4);
      await harness.next();
      await harness.next();
      expectStrip(element, 0);
      await harness.previous();
      expectStrip(element, 5);

      component.activeIndex.set(2);
      await fixture.whenStable();
      expectStrip(element, 2);

      component.items.set(makePhotos().slice(0, 4));
      component.activeIndex.set(1);
      await fixture.whenStable();
      expectStrip(element, 1);
    });

    it('holds after a pt change: object, function and undefined, and the consumer’s keys stay', async () => {
      const { component, fixture, element } = await render();

      component.pt.set({ thumbnailItem: { 'data-probe': 'a' }, thumbnail: { 'data-probe': 'b' } });
      await fixture.whenStable();
      expectStrip(element, 0);
      expect(thumbnailAt(element, 0).dataset['probe']).toBe('b');
      expect(thumbnailItemsOf(element)[0]?.dataset['probe']).toBe('a');

      component.pt.set(() => ({ thumbnailItem: { 'data-probe': 'c' } }));
      await fixture.whenStable();
      expectStrip(element, 0);

      component.pt.set(undefined);
      await fixture.whenStable();
      component.activeIndex.set(3);
      await fixture.whenStable();
      expectStrip(element, 3);
    });

    it('shows the current thumbnail at full opacity and the rest at half', async () => {
      const { fixture, element } = await render((host) => {
        host.activeIndex.set(1);
      });
      await parkPointer(element);
      await fixture.whenStable();
      const opacities = thumbnailItemsOf(element).map((item) => getComputedStyle(item).opacity);

      expect(opacities).toEqual(['0.5', '1', '0.5', '0.5', '0.5', '0.5']);
    });

    it('has a hit box of at least 24 x 24 px per thumbnail and 32 x 32 px per thumbnail navigator', async () => {
      const { element } = await render();

      for (const thumbnail of thumbnailsOf(element)) {
        const box = thumbnail.getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
      for (const section of ['thumbnailprevbutton', 'thumbnailnextbutton']) {
        const box = part(element, section).getBoundingClientRect();
        expect([Math.round(box.width), Math.round(box.height)]).toEqual([32, 32]);
      }
    });
  });

  describe('the thumbnail navigators at an end', () => {
    const navigators = (element: ParentNode): HTMLElement[] =>
      all(element, '[data-pc-group-section="thumbnailnavigator"]');
    const dimmed = (button: HTMLElement): boolean =>
      button.getAttribute('aria-disabled') === 'true' && button.getAttribute('tabindex') === '-1';
    const live = (button: HTMLElement): boolean =>
      !button.hasAttribute('aria-disabled') && !button.hasAttribute('tabindex');

    it('carries phase 1’s attributes: Previous dimmed on the first item, Next live', async () => {
      const { element } = await render();

      expect(dimmed(part(element, 'thumbnailprevbutton'))).toBe(true);
      expect(live(part(element, 'thumbnailnextbutton'))).toBe(true);
    });

    it('follows the item: Next dims on the last item and Previous comes back', async () => {
      const { component, fixture, element } = await render();
      component.activeIndex.set(5);
      await fixture.whenStable();

      await expect.poll(() => dimmed(part(element, 'thumbnailnextbutton'))).toBe(true);
      expect(live(part(element, 'thumbnailprevbutton'))).toBe(true);
    });

    it('dims both while every thumbnail is in view, and neither when circular with a paging strip', async () => {
      const { component, fixture, element } = await render((host) => {
        host.numVisible.set(6);
      });
      await expect.poll(() => navigators(element).every(dimmed)).toBe(true);

      component.numVisible.set(4);
      component.circular.set(true);
      await fixture.whenStable();
      await expect.poll(() => navigators(element).every(live)).toBe(true);
    });

    it('does not step past an end when Enter reaches the dimmed Previous', async () => {
      const { component, element } = await render();
      part(element, 'thumbnailprevbutton').focus();

      await userEvent.keyboard('{Enter}');
      await frames();

      expect(component.indexes).toEqual([]);
      expect(shownPhoto(element)).toBe('A Meadow scene');
    });
  });

  describe('keyboard', () => {
    it('Tab goes previous, next, the current thumbnail and its navigator, then on; the dimmed one is skipped', async () => {
      const { element } = await render();
      buttonOf(element, 'before').focus();

      const seen: string[] = [];
      for (let step = 0; step < 4; step += 1) {
        await userEvent.tab();
        seen.push(focusedName());
      }

      expect(seen).toEqual(['Next', 'Page 1', 'Next Page', 'View photos']);
    });

    it('has one thumbnail in the Tab order, the current one, after a change', async () => {
      const { fixture, element } = await render((host) => {
        host.activeIndex.set(3);
      });
      await fixture.whenStable();

      expect(thumbnailsOf(element).filter((thumbnail) => thumbnail.tabIndex === 0)).toEqual([
        thumbnailAt(element, 3),
      ]);
    });

    it('Enter and Space on the thumbnail navigators move the item', async () => {
      const { component, element } = await render();
      part(element, 'thumbnailnextbutton').focus();

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => component.indexes).toEqual([1]);
      await userEvent.keyboard(' ');
      await expect.poll(() => component.indexes).toEqual([1, 2]);
    });

    it('ArrowRight and ArrowLeft move focus among the thumbnails, Home and End go to the first and last, and Enter and Space show that item', async () => {
      const { component, element } = await render();
      thumbnailAt(element, 0).focus();

      await userEvent.keyboard('{ArrowRight}{ArrowRight}');
      expect(focusedName()).toBe('Page 3');
      await userEvent.keyboard('{ArrowLeft}');
      expect(focusedName()).toBe('Page 2');
      await userEvent.keyboard('{End}');
      expect(focusedName()).toBe('Page 6');
      await userEvent.keyboard('{Home}');
      expect(focusedName()).toBe('Page 1');
      expect(component.indexes).toEqual([]);

      await userEvent.keyboard('{ArrowRight}{ArrowRight}{Enter}');
      await expect.poll(() => component.indexes).toEqual([2]);
      expect(shownPhoto(element)).toBe('A Moon scene');

      await userEvent.keyboard('{ArrowRight}');
      await userEvent.keyboard(' ');
      await expect.poll(() => component.indexes).toEqual([2, 3]);
    });

    it('moves the Tab stop along with the arrows, and keeps it inside the thumbnails in view', async () => {
      const { element } = await render();
      thumbnailAt(element, 0).focus();

      await userEvent.keyboard('{End}');
      const visible = thumbnailsOf(element).filter(
        (thumbnail) => getComputedStyle(thumbnail).visibility !== 'hidden',
      );
      expect(visible.at(-1)).toBe(document.activeElement);
      expect(thumbnailsOf(element).filter((thumbnail) => thumbnail.tabIndex === 0)).toEqual([
        document.activeElement,
      ]);
    });

    it('lets Escape alone: an inline gallery has nothing to close', async () => {
      const { component, element } = await render();
      thumbnailAt(element, 0).focus();

      await userEvent.keyboard('{Escape}');

      expect(component.visibles).toEqual([]);
      expect(component.visible()).toBe(false);
    });
  });

  describe('thumbnail focus', () => {
    it('draws the preset ring inset on a thumbnail a keyboard reached and shows its item at full opacity', async () => {
      const { element } = await render();
      await parkPointer(element);
      const first = thumbnailAt(element, 0);
      const other = thumbnailAt(element, 1);
      expect(getComputedStyle(other.parentElement ?? other).opacity).toBe('0.5');

      // `:focus-visible` needs a real keyboard input: Tab to the current thumbnail, then arrow.
      buttonOf(element, 'before').focus();
      await userEvent.tab();
      await userEvent.tab();
      expect(document.activeElement).toBe(first);
      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(() => document.activeElement === other).toBe(true);
      const style = getComputedStyle(other);

      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineOffset).toBe('-2px');
      expect(style.outlineColor).toBe(resolved(element, 'color', 'var(--wj-focus-ring-color)'));
      expect(getComputedStyle(other.parentElement ?? other).opacity).toBe('1');
    });
  });

  describe('reduced motion', () => {
    const STRIP_RULE = 'wj-galleria .p-galleria-thumbnail-items';
    const FADE_RULE = 'wj-galleria .p-galleria-thumbnail-item:hover';

    it('sets the strip’s transition-duration to 1 ms, important and never none, only under prefers-reduced-motion', async () => {
      await render();

      const [rule] = rulesFor(STRIP_RULE, REDUCED);
      expect(rule?.style.getPropertyValue('transition-duration')).toBe('1ms');
      expect(rule?.style.getPropertyPriority('transition-duration')).toBe('important');
      expect(
        rulesFor(STRIP_RULE, null).filter((outside) => outside.style.transitionDuration !== ''),
      ).toEqual([]);
      expect(rule?.selectorText).toMatch(/\[style\*=["']transition["']\]/);
    });

    it('drops the thumbnail’s hover fade under prefers-reduced-motion, and only there', async () => {
      await render();

      const [rule] = rulesFor(FADE_RULE, REDUCED);
      expect(rule?.style.getPropertyValue('transition')).toMatch(/^none/);
      expect(
        rulesFor(FADE_RULE, null).filter((outside) => outside.style.transition !== ''),
      ).toEqual([]);
    });

    it('slides the strip over Optimus’s 500 ms transition, which ends and clears itself', async () => {
      const { fixture, element } = await render();
      const items = part(element, 'thumbnailitems');
      const harness = await harnessOf(fixture);

      await harness.selectThumbnail(5);
      await fixture.whenStable();
      expect(items.style.transform).not.toBe('');
      await expect.poll(() => items.style.transition).toBe('');
    });

    it('slides in 1 ms with the rule applied, over Optimus’s inline transition', async () => {
      const { fixture, element } = await render();
      const [rule] = rulesFor(STRIP_RULE, REDUCED);
      // The test window is not in reduced motion: apply the media rule's body as a plain rule, and
      // draw two frames so the sheet is in place before the slide starts.
      const style = document.createElement('style');
      style.dataset['probe'] = 'reduced-motion';
      style.textContent = `${rule?.selectorText ?? ''} { ${rule?.style.cssText ?? ''} }`;
      document.head.append(style);
      await frames();
      const items = part(element, 'thumbnailitems');
      const harness = await harnessOf(fixture);

      await harness.selectThumbnail(5);
      await fixture.whenStable();

      expect(getComputedStyle(items).transitionDuration).toBe('0.001s');
      await expect.poll(() => items.style.transition).toBe('');
    });
  });

  describe('full screen', () => {
    const fullScreen = (host: Host): void => {
      host.fullScreen.set(true);
    };

    it('changes the item with the navigators and the thumbnails, and keeps the strip clean', async () => {
      const rendered = await render(fullScreen);
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      await harness.next();
      await harness.selectThumbnail(4);
      await rendered.fixture.whenStable();

      expect(await harness.getActiveIndex()).toBe(4);
      expect(shownPhoto(rendered.element)).toBe('A Spring scene');
      expectStrip(rendered.element, 4);
      await closeWithEscape();
    });

    it('closes before teardown: no mask and no scroll lock remain', async () => {
      const rendered = await render(fullScreen);
      await open(rendered);

      await closeWithEscape();

      expect(maskEl()).toBeNull();
      expect(document.body.classList.contains('p-overflow-hidden')).toBe(false);
    });
  });

  describe('harness', () => {
    it('moves with selectThumbnail and reads the item the strip shows', async () => {
      const { fixture } = await render((host) => {
        host.withCaption.set(true);
      });
      const harness = await harnessOf(fixture);

      expect(await harness.getActiveIndex()).toBe(0);
      await harness.selectThumbnail(4);
      expect(await harness.getActiveIndex()).toBe(4);
      expect(await harness.getCaption()).toBe('SpringA Spring scene');
      await harness.previous();
      expect(await harness.getActiveIndex()).toBe(3);
    });

    it('says which thumbnail is missing: one that is out of range, and every one with showThumbnails off', async () => {
      const { fixture } = await render();
      const harness = await harnessOf(fixture);
      await expect(harness.selectThumbnail(9)).rejects.toThrow('no thumbnail 9');

      fixture.componentInstance.showThumbnails.set(false);
      await fixture.whenStable();
      await expect(harness.selectThumbnail(0)).rejects.toThrow('no thumbnail 0');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      // The fixture's native Before/After/opener buttons are not under test and fail `target-size`,
      // so axe is scoped to the gallery.
      it('has no axe violations: inline, the first item (Previous dimmed)', async () => {
        const { element } = await render(undefined, scheme);

        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations: a middle item, reached by a click, re-checked after another change', async () => {
        const { fixture, element } = await render(undefined, scheme);
        const harness = await harnessOf(fixture);

        await harness.selectThumbnail(2);
        await fixture.whenStable();
        await expectNoAxeViolations(hostOf(element));

        await harness.next();
        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations: with a caption', async () => {
        const { element } = await render((host) => {
          host.withCaption.set(true);
          host.activeIndex.set(1);
        }, scheme);

        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations: full screen open, and after a change of item', async () => {
        const rendered = await render((host) => {
          host.fullScreen.set(true);
          host.withCaption.set(true);
        }, scheme);
        await open(rendered);

        await expectNoAxeViolations(hostOf(rendered.element));

        await (await harnessOf(rendered.fixture)).selectThumbnail(3);
        await rendered.fixture.whenStable();
        await expectNoAxeViolations(hostOf(rendered.element));
        await closeWithEscape();
      });

      it('has no axe violations: the thumbnails on top, circular, named by ariaLabelledBy, and a focused thumbnail', async () => {
        const { fixture, element } = await render((host) => {
          host.circular.set(true);
          host.thumbnailsPosition.set('top');
          host.ariaLabelledBy.set('name');
        }, scheme);
        const harness = await harnessOf(fixture);

        await harness.previous();
        thumbnailAt(element, 5).focus();
        await expectNoAxeViolations(hostOf(element));
      });
    });
  });
});
