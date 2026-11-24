/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack, type WjTranslation } from 'weeljack-ng';
import {
  WjGalleria,
  WjGalleriaCaptionSlot,
  WjGalleriaItemSlot,
  type WjGalleriaPt,
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
 * A consumer's template: a gallery between native buttons, with a button that opens the full
 * screen. The item is an image with a description and the caption a title and a line.
 */
@Component({
  selector: 'wj-galleria-host',
  imports: [WjGalleria, WjGalleriaItemSlot, WjGalleriaCaptionSlot],
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
        [circular]="circular()"
        [showItemNavigators]="showItemNavigators()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [pt]="pt()"
      >
        <ng-template wjGalleriaItem [wjGalleriaItemOf]="items()" let-photo>
          <img class="photo" [src]="photo.src" [alt]="photo.alt" />
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
  readonly circular = signal(false);
  readonly showItemNavigators = signal(true);
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

/** A consumer who writes aria-* on the host: it is not forwarded. */
@Component({
  selector: 'wj-galleria-aria-on-host-host',
  imports: [WjGalleria, WjGalleriaItemSlot],
  template: `
    <wj-galleria aria-label="Other" ariaLabel="Holiday photos" [value]="items">
      <ng-template wjGalleriaItem [wjGalleriaItemOf]="items" let-photo>{{ photo }}</ng-template>
    </wj-galleria>
  `,
})
class AriaOnHostHost {
  protected readonly items = TITLES;
}

/** A gallery rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-galleria-routed-host',
  imports: [WjGalleria, WjGalleriaItemSlot],
  template: `
    <wj-galleria ariaLabel="Holiday photos" [value]="items">
      <ng-template wjGalleriaItem [wjGalleriaItemOf]="items" let-photo>{{ photo }}</ng-template>
    </wj-galleria>
  `,
})
class RoutedHost {
  protected readonly items = TITLES;
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

interface Providers {
  translation?: WjTranslation;
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
const regionOf = (element: ParentNode): HTMLElement =>
  find(element, '[data-pc-section="root"]', HTMLElement);
/**
 * The open full-screen dialog. With Optimus's real motion on, the mask's leave can end before the
 * content's, and Optimus then leaves its mask in the page with `display: none` for good (nothing a
 * reader or a screen reader meets), so a hidden one does not count.
 */
const maskEl = (): HTMLElement | null =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')).find(
    (dialog) => dialog.checkVisibility(),
  ) ?? null;
const part = (element: ParentNode, section: string): HTMLElement =>
  find(element, `[data-pc-section="${section}"]`, HTMLElement);
const buttonOf = (element: HTMLElement, id: string): HTMLButtonElement =>
  find(element, `#${id}`, HTMLButtonElement);
const itemOf = (element: ParentNode): HTMLElement => part(element, 'item');
const shownTitle = (element: HTMLElement): string =>
  find(element, '.title', HTMLElement).textContent.trim();
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

/**
 * Opens the full screen the way a reader does, by clicking the app's button, and waits until
 * Optimus has moved focus onto Close, which it does 25 ms after the enter starts: poll it, never
 * wait for it.
 */
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

const SCRIM = 'color-mix(in srgb, var(--wj-surface-900) 70%, transparent)';

/**
 * Records every class list the full screen's content and mask have from now on, so a spec can tell
 * whether Optimus's enter and leave motion ran. Call the returned function to stop and read them.
 */
function recordClasses(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('.p-galleria, .p-galleria-mask')) {
      seen.add(element.className);
    }
  };
  const observer = new MutationObserver(read);
  observer.observe(document.body, { attributes: true, subtree: true, childList: true });
  return () => {
    read();
    observer.disconnect();
    return [...seen];
  };
}

const motionClasses = (classes: string[]): string[] =>
  classes.filter((name) => /enter-active|leave-active/.test(name));

describe('WjGalleria', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(async () => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Motion is off unless a spec turns it on: a layout read never lands mid-scale.
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
        document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
          style.remove();
        });
        Reflect.deleteProperty(window, 'wjInjected');
        await page.viewport(viewport.width, viewport.height);
      },
    );
  });

  describe('inputs', () => {
    it('renders a block host holding Optimus’s region, the active item and the two navigators, and no strip or indicators', async () => {
      const { fixture, element } = await render();

      expect(getComputedStyle(hostOf(element)).display).toBe('block');
      expect(regionOf(element).getAttribute('role')).toBe('region');
      expect(shownPhoto(element)).toBe('A Meadow scene');
      expect(all(element, '[data-pc-group-section="itemnavigator"]')).toHaveLength(2);
      expect(element.querySelector('[data-pc-section="thumbnails"]')).toBeNull();
      expect(element.querySelector('[role="tablist"], [role="tab"]')).toBeNull();
      expect(element.querySelector('[data-pc-section="indicatorlist"]')).toBeNull();
      expect(all(element, '[data-pc-section="item"]')).toHaveLength(1);
      expect(maskEl()).toBeNull();
      expect(await (await harnessOf(fixture)).getActiveIndex()).toBe(0);
    });

    it('starts on activeIndex and follows the model both ways, emitting activeIndexChange only from the user', async () => {
      const { component, fixture, element } = await render((host) => {
        host.activeIndex.set(2);
      });
      const harness = await harnessOf(fixture);
      expect(shownPhoto(element)).toBe('A Moon scene');
      expect(await harness.getActiveIndex()).toBe(2);

      component.activeIndex.set(4);
      await fixture.whenStable();
      expect(shownPhoto(element)).toBe('A Spring scene');
      expect(await harness.getActiveIndex()).toBe(4);
      expect(component.indexes).toEqual([]);

      await harness.next();
      await harness.previous();
      await harness.previous();
      await fixture.whenStable();

      expect(component.indexes).toEqual([5, 4, 3]);
      expect(shownPhoto(element)).toBe('A Sunset scene');
    });

    it('never changes the app’s value array, in any mode', async () => {
      const items = Object.freeze(makePhotos().map((photo) => Object.freeze(photo)));
      const { component, fixture } = await render((host) => {
        host.items.set(items as Photo[]);
        host.circular.set(true);
      });
      const harness = await harnessOf(fixture);

      for (let step = 0; step < 7; step += 1) {
        await harness.next();
      }
      await harness.previous();
      await fixture.whenStable();

      expect(component.items()).toBe(items);
      expect(items.map((item) => item.title)).toEqual(TITLES);
    });

    it('stops at the ends and dims the navigators there when not circular', async () => {
      const { fixture, element } = await render();
      const harness = await harnessOf(fixture);
      const prev = part(element, 'prevbutton');
      const next = part(element, 'nextbutton');
      expect(prev.classList.contains('p-disabled')).toBe(true);
      expect(next.classList.contains('p-disabled')).toBe(false);

      for (let step = 0; step < 8; step += 1) {
        await harness.next();
      }

      expect(await harness.getActiveIndex()).toBe(5);
      expect(shownPhoto(element)).toBe('A Autumn scene');
      expect(next.classList.contains('p-disabled')).toBe(true);
      expect(prev.classList.contains('p-disabled')).toBe(false);
    });

    it('does not step past an end when Enter or Space reaches the dimmed navigator: Optimus would hand the app an undefined item', async () => {
      const { component, element } = await render((host) => {
        host.activeIndex.set(5);
      });
      const next = part(element, 'nextbutton');
      next.focus();
      expect(document.activeElement).toBe(next);

      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      await frames();

      expect(component.indexes).toEqual([]);
      expect(shownPhoto(element)).toBe('A Autumn scene');
      expect(document.activeElement).toBe(next);

      component.activeIndex.set(0);
      const prev = part(element, 'prevbutton');
      prev.focus();
      await userEvent.keyboard('{Enter}');
      await frames();

      expect(component.indexes).toEqual([]);
      expect(shownPhoto(element)).toBe('A Meadow scene');
    });

    it('wraps from the last item to the first and back when circular', async () => {
      const { fixture, element } = await render((host) => {
        host.circular.set(true);
        host.activeIndex.set(5);
      });
      const harness = await harnessOf(fixture);

      await harness.next();
      expect(await harness.getActiveIndex()).toBe(0);
      expect(shownPhoto(element)).toBe('A Meadow scene');
      expect(part(element, 'prevbutton').classList.contains('p-disabled')).toBe(false);
      await harness.previous();
      expect(await harness.getActiveIndex()).toBe(5);
    });

    it('shows the item navigators by default and hides them on request', async () => {
      const { component, fixture, element } = await render((host) => {
        host.showItemNavigators.set(false);
      });
      expect(element.querySelector('[data-pc-section="prevbutton"]')).toBeNull();
      expect(element.querySelector('[data-pc-section="nextbutton"]')).toBeNull();

      component.showItemNavigators.set(true);
      await fixture.whenStable();
      expect(element.querySelector('[data-pc-section="prevbutton"]')).not.toBeNull();
      expect(element.querySelector('[data-pc-section="nextbutton"]')).not.toBeNull();
    });

    it('renders nothing for an empty value, and follows a later fill', async () => {
      const { component, fixture, element } = await render((host) => {
        host.items.set([]);
      });
      expect(element.querySelector('[data-pc-section="item"]')).toBeNull();

      component.items.set(makePhotos());
      await fixture.whenStable();
      expect(shownPhoto(element)).toBe('A Meadow scene');
    });

    it('does not take focus when it renders', async () => {
      const { element } = await render();

      expect(hostOf(element).contains(document.activeElement)).toBe(false);
    });

    it('is inline until fullScreen: visible alone opens no overlay', async () => {
      const { component, fixture, element } = await render();
      component.visible.set(true);
      await fixture.whenStable();

      expect(maskEl()).toBeNull();
      expect(shownPhoto(element)).toBe('A Meadow scene');
    });
  });

  describe('slots', () => {
    it('renders the item template for the active item only, with the item as its context', async () => {
      const { fixture, element } = await render();
      const harness = await harnessOf(fixture);
      expect(all(element, '[data-pc-section="item"] img')).toHaveLength(1);
      expect(find(itemOf(element), 'img', HTMLImageElement).getAttribute('src')).toBe(
        makePhotos()[0]?.src,
      );

      await harness.next();
      await harness.next();
      await fixture.whenStable();
      expect(shownPhoto(element)).toBe('A Moon scene');
      expect(find(itemOf(element), 'img', HTMLImageElement).getAttribute('src')).toBe(
        makePhotos()[2]?.src,
      );
    });

    it('renders no caption without a caption template', async () => {
      const { fixture, element } = await render();

      expect(await (await harnessOf(fixture)).getCaption()).toBeNull();
      expect(element.querySelector('[data-pc-section="caption"]')).toBeNull();
    });

    it('renders the caption of the active item, and follows the item', async () => {
      const { component, fixture, element } = await render((host) => {
        host.withCaption.set(true);
        host.activeIndex.set(1);
      });
      const harness = await harnessOf(fixture);
      expect(shownTitle(element)).toBe('Winter');
      expect(await harness.getCaption()).toContain('Winter');
      expect(await harness.getCaption()).toContain('A Winter scene');

      await harness.next();
      await fixture.whenStable();
      expect(shownTitle(element)).toBe('Moon');
      expect(component.indexes).toEqual([2]);
    });

    it('follows a changed item list and changed items', async () => {
      const { component, fixture, element } = await render((host) => {
        host.withCaption.set(true);
      });

      component.items.set(makePhotos().slice(2));
      await fixture.whenStable();
      expect(shownTitle(element)).toBe('Moon');

      component.items.update((items) =>
        items.map((item) => ({ ...item, title: `${item.title}!` })),
      );
      await fixture.whenStable();
      expect(shownTitle(element)).toBe('Moon!');
    });

    it('shows a caption template that arrives after the first render from the next item on: give it at first render', async () => {
      const { component, fixture, element } = await render();
      expect(element.querySelector('[data-pc-section="caption"]')).toBeNull();

      component.withCaption.set(true);
      await fixture.whenStable();
      await frames();
      component.activeIndex.set(1);
      await fixture.whenStable();

      await expect.poll(() => all(element, '[data-pc-section="caption"]').length).toBe(1);
      expect(shownTitle(element)).toBe('Winter');
    });

    it('renders an HTML payload in an item and a caption as text, and runs nothing', async () => {
      const { element } = await render((host) => {
        host.withCaption.set(true);
        host.items.set([{ src: scene('#bcd4e6', '#6a994e'), alt: PAYLOAD, title: PAYLOAD }]);
      });

      expect(find(element, '.title', HTMLElement).textContent).toBe(PAYLOAD);
      expect(shownPhoto(element)).toBe(PAYLOAD);
      expect(hostOf(element).querySelector('script')).toBeNull();
      expect(all(hostOf(element), 'img').every((img) => img.getAttribute('onerror') === null)).toBe(
        true,
      );
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('the region and the navigators', () => {
    it('names the region on the Optimus root and leaves the host with no ARIA', async () => {
      const { element } = await render();

      expect(regionOf(element).getAttribute('aria-label')).toBe('Holiday photos');
      expect(regionOf(element).hasAttribute('aria-labelledby')).toBe(false);
      for (const name of ['aria-label', 'aria-labelledby', 'role']) {
        expect(hostOf(element).hasAttribute(name)).toBe(false);
      }
    });

    it('follows ariaLabel and ariaLabelledBy as they change and clear', async () => {
      const { component, fixture, element } = await render();

      component.ariaLabel.set('Other photos');
      await fixture.whenStable();
      expect(regionOf(element).getAttribute('aria-label')).toBe('Other photos');

      component.ariaLabelledBy.set('name');
      await fixture.whenStable();
      expect(regionOf(element).getAttribute('aria-labelledby')).toBe('name');

      component.ariaLabelledBy.set(undefined);
      await fixture.whenStable();
      expect(regionOf(element).hasAttribute('aria-labelledby')).toBe(false);
    });

    it('removes the navigators’ static role="navigation" and names them Previous and Next', async () => {
      const { element } = await render();
      const prev = part(element, 'prevbutton');
      const next = part(element, 'nextbutton');

      expect(prev.hasAttribute('role')).toBe(false);
      expect(next.hasAttribute('role')).toBe(false);
      expect(element.querySelector('[role="navigation"]')).toBeNull();
      expect(prev.getAttribute('aria-label')).toBe('Previous');
      expect(next.getAttribute('aria-label')).toBe('Next');
    });

    it('names them from a custom translation', async () => {
      const { element } = await render(undefined, 'light', {
        translation: { aria: { previous: 'Précédent', next: 'Suivant' } },
      });

      expect(part(element, 'prevbutton').getAttribute('aria-label')).toBe('Précédent');
      expect(part(element, 'nextbutton').getAttribute('aria-label')).toBe('Suivant');
    });

    it('keeps the names, and the removed role, after a step, a wrap and a pt change', async () => {
      const { component, fixture, element } = await render((host) => {
        host.circular.set(true);
      });
      const harness = await harnessOf(fixture);
      const check = (): void => {
        expect(regionOf(element).getAttribute('aria-label')).toBe('Holiday photos');
        expect(part(element, 'prevbutton').getAttribute('aria-label')).toBe('Previous');
        expect(part(element, 'nextbutton').getAttribute('aria-label')).toBe('Next');
        expect(element.querySelector('[role="navigation"]')).toBeNull();
      };

      await harness.next();
      check();
      await harness.previous();
      await harness.previous();
      check();
      await harness.next();
      check();

      component.pt.set({ root: { 'data-probe': 'x' } });
      await fixture.whenStable();
      check();
    });

    it('renders an HTML payload in ariaLabel as text, and runs nothing', async () => {
      const { element } = await render((host) => {
        host.ariaLabel.set(PAYLOAD);
      });

      expect(regionOf(element).getAttribute('aria-label')).toBe(PAYLOAD);
      expect(hostOf(element).querySelector('script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('hit boxes', () => {
    it('has 48 x 48 px item navigators', async () => {
      const { element } = await render();

      for (const section of ['prevbutton', 'nextbutton']) {
        const box = part(element, section).getBoundingClientRect();
        expect([section, Math.round(box.width), Math.round(box.height)]).toEqual([section, 48, 48]);
      }
    });

    it('has 48 x 48 px item navigators and Close in the full screen', async () => {
      const rendered = await render((host) => {
        host.fullScreen.set(true);
      });
      await open(rendered);

      for (const section of ['prevbutton', 'nextbutton', 'closebutton']) {
        const box = part(document.body, section).getBoundingClientRect();
        expect([section, Math.round(box.width), Math.round(box.height)]).toEqual([section, 48, 48]);
      }
    });
  });

  describe('the photo scrim', () => {
    it('puts the item navigators on the scrim, and solid surface-900 on hover', async () => {
      const { element } = await render();
      const next = part(element, 'nextbutton');
      await parkPointer(element);

      expect(getComputedStyle(next).backgroundColor).toBe(
        resolved(element, 'background-color', SCRIM),
      );

      await userEvent.hover(next);
      await expect
        .poll(() => getComputedStyle(next).backgroundColor)
        .toBe(resolved(element, 'background-color', 'var(--wj-surface-900)'));
    });

    it('puts the caption on the scrim', async () => {
      const { element } = await render((host) => {
        host.withCaption.set(true);
      });

      expect(getComputedStyle(part(element, 'caption')).backgroundColor).toBe(
        resolved(element, 'background-color', SCRIM),
      );
    });

    it('puts Close on the scrim, and solid surface-900 on hover', async () => {
      const rendered = await render((host) => {
        host.fullScreen.set(true);
      });
      await open(rendered);
      const close = part(document.body, 'closebutton');

      await expect
        .poll(() => getComputedStyle(close).backgroundColor)
        .toBe(resolved(rendered.element, 'background-color', SCRIM));

      await userEvent.hover(close);
      await expect
        .poll(() => getComputedStyle(close).backgroundColor)
        .toBe(resolved(rendered.element, 'background-color', 'var(--wj-surface-900)'));
    });

    it.each<Scheme>(['light', 'dark'])(
      'keeps the glyphs at 3:1 and the caption text at 4.5:1 over a white photo, %s',
      async (scheme) => {
        const { element } = await render((host) => {
          host.withCaption.set(true);
        }, scheme);
        const overWhite = resolved(
          element,
          'background-color',
          'color-mix(in srgb, var(--wj-surface-900) 70%, white)',
        );

        expect(
          contrast(getComputedStyle(part(element, 'caption')).color, overWhite),
        ).toBeGreaterThan(4.5);
        expect(
          contrast(getComputedStyle(part(element, 'nextbutton')).color, overWhite),
        ).toBeGreaterThan(3);
      },
    );
  });

  describe('motion', () => {
    it('plays none of Optimus’s enter and leave motion when the reader asks for less', async () => {
      reduceMotion(true);
      const rendered = await render((host) => {
        host.fullScreen.set(true);
      });
      const read = recordClasses();

      await open(rendered);
      await closeWithEscape();

      expect(motionClasses(read())).toEqual([]);
    });

    it('pt.motion cannot switch safe off', async () => {
      reduceMotion(true);
      const rendered = await render((host) => {
        host.fullScreen.set(true);
        host.pt.set({ motion: { safe: false }, maskMotion: { safe: false } } as WjGalleriaPt);
      });
      const read = recordClasses();

      await open(rendered);
      await closeWithEscape();

      expect(motionClasses(read())).toEqual([]);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const rendered = await render((host) => {
        host.fullScreen.set(true);
      });
      const read = recordClasses();

      await open(rendered);
      await closeWithEscape();

      expect(motionClasses(read()).length).toBeGreaterThan(0);
    });

    it('never moves on its own: no autoplay, so a minute on the clock changes nothing', async () => {
      const { fixture, element } = await render();
      // spec-timing: a minute of fake clock proves no timer advances the item; nothing real waits.
      vi.useFakeTimers();
      await vi.advanceTimersByTimeAsync(60_000);
      await fixture.whenStable();

      expect(shownPhoto(element)).toBe('A Meadow scene');
      expect(await (await harnessOf(fixture)).getActiveIndex()).toBe(0);
    });
  });

  describe('keyboard', () => {
    it('Tab goes previous, then next, then on: the item holds nothing to focus', async () => {
      const { element } = await render((host) => {
        host.activeIndex.set(2);
      });
      buttonOf(element, 'before').focus();

      const seen: string[] = [];
      for (let step = 0; step < 3; step += 1) {
        await userEvent.tab();
        seen.push(focusedName());
      }

      expect(seen).toEqual(['Previous', 'Next', 'View photos']);
    });

    describe('a navigator Optimus dims at an end', () => {
      const navigators = (element: ParentNode): HTMLElement[] =>
        all(element, '[data-pc-group-section="itemnavigator"]');
      const tabStops = (element: ParentNode): string[] =>
        navigators(element)
          .filter((button) => button.tabIndex >= 0)
          .map((button) => button.getAttribute('aria-label') ?? '');
      const dimmed = (button: HTMLElement): boolean =>
        button.getAttribute('aria-disabled') === 'true' && button.getAttribute('tabindex') === '-1';
      const live = (button: HTMLElement): boolean =>
        !button.hasAttribute('aria-disabled') && !button.hasAttribute('tabindex');

      it('leaves the Tab order and is announced as disabled: previous on the first item', async () => {
        const { element } = await render();

        expect(dimmed(part(element, 'prevbutton'))).toBe(true);
        expect(live(part(element, 'nextbutton'))).toBe(true);
        expect(tabStops(element)).toEqual(['Next']);
        expect(part(element, 'prevbutton').hasAttribute('disabled')).toBe(false);
        buttonOf(element, 'before').focus();
        await userEvent.tab();
        expect(focusedName()).toBe('Next');
      });

      it('leaves the Tab order and is announced as disabled: next on the last item', async () => {
        const { component, fixture, element } = await render();
        component.activeIndex.set(5);
        await fixture.whenStable();

        await expect.poll(() => dimmed(part(element, 'nextbutton'))).toBe(true);
        expect(live(part(element, 'prevbutton'))).toBe(true);
        expect(tabStops(element)).toEqual(['Previous']);
        buttonOf(element, 'before').focus();
        await userEvent.tab();
        await userEvent.tab();
        expect(focusedName()).toBe('View photos');
      });

      it('dims neither navigator when circular, at either end', async () => {
        const { component, fixture, element } = await render((host) => {
          host.circular.set(true);
        });

        for (const index of [0, 5, 2]) {
          component.activeIndex.set(index);
          await fixture.whenStable();
          await expect.poll(() => tabStops(element)).toEqual(['Previous', 'Next']);
          expect(navigators(element).every(live)).toBe(true);
        }
      });

      it('follows the item: the attributes move with the end', async () => {
        const { fixture, element } = await render();
        const harness = await harnessOf(fixture);

        await harness.next();
        await expect.poll(() => live(part(element, 'prevbutton'))).toBe(true);
        await harness.previous();
        await expect.poll(() => dimmed(part(element, 'prevbutton'))).toBe(true);
      });

      it('holds in the full screen, opened at an end', async () => {
        const rendered = await render((host) => {
          host.fullScreen.set(true);
          host.activeIndex.set(5);
        });
        await open(rendered);
        const { element } = rendered;

        await expect.poll(() => dimmed(part(element, 'nextbutton'))).toBe(true);
        expect(live(part(element, 'prevbutton'))).toBe(true);
        expect(tabStops(element)).toEqual(['Previous']);

        await closeWithEscape();
      });
    });

    it('Enter and Space on the navigators change the item', async () => {
      const { component, element } = await render();
      part(element, 'nextbutton').focus();

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => component.indexes).toEqual([1]);
      await userEvent.keyboard(' ');
      await expect.poll(() => component.indexes).toEqual([1, 2]);

      part(element, 'prevbutton').focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => component.indexes).toEqual([1, 2, 1]);
      expect(shownPhoto(element)).toBe('A Winter scene');
    });

    it('lets Escape alone: an inline gallery has nothing to close', async () => {
      const { component, element } = await render();
      part(element, 'nextbutton').focus();

      await userEvent.keyboard('{Escape}');

      expect(component.visibles).toEqual([]);
      expect(component.visible()).toBe(false);
    });
  });

  describe('full screen', () => {
    const fullScreen = (host: Host): void => {
      host.fullScreen.set(true);
    };

    it('stays closed until visible, then opens a modal dialog named by ariaLabel', async () => {
      const rendered = await render(fullScreen);
      expect(maskEl()).toBeNull();
      expect(rendered.element.querySelector('[data-pc-section="item"]')).toBeNull();

      await open(rendered);
      const dialog = maskEl();

      expect(dialog?.getAttribute('aria-label')).toBe('Holiday photos');
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
      expect(shownPhoto(rendered.element)).toBe('A Meadow scene');
      expect(rendered.component.visible()).toBe(true);
    });

    it('names the dialog by ariaLabelledBy too', async () => {
      const rendered = await render((host) => {
        fullScreen(host);
        host.ariaLabelledBy.set('name');
      });
      await open(rendered);

      expect(maskEl()?.getAttribute('aria-labelledby')).toBe('name');
    });

    it('moves focus to Close, blocks the page scroll and keeps Tab inside', async () => {
      const rendered = await render(fullScreen);
      expect(document.body.classList.contains('p-overflow-hidden')).toBe(false);
      await open(rendered);
      expect(document.body.classList.contains('p-overflow-hidden')).toBe(true);

      const inside = (): boolean => maskEl()?.contains(document.activeElement) ?? false;
      const seen: string[] = [];
      for (let step = 0; step < 8; step += 1) {
        await userEvent.tab();
        seen.push(focusedName());
        expect(inside()).toBe(true);
      }
      // Previous is dimmed on the first item, so it is not a stop.
      expect(new Set(seen)).toEqual(new Set(['Close', 'Next']));

      await userEvent.tab({ shift: true });
      expect(inside()).toBe(true);
    });

    it('closes on Escape by setting visible to false, and focus goes back to the opener', async () => {
      const rendered = await render(fullScreen);
      await open(rendered);

      await userEvent.keyboard('{Escape}');
      await gone();

      expect(rendered.component.visibles).toEqual([false]);
      expect(rendered.component.visible()).toBe(false);
      expect(document.activeElement).toBe(buttonOf(rendered.element, 'opener'));
      expect(document.body.classList.contains('p-overflow-hidden')).toBe(false);
    });

    it('closes on Escape also when focus is on the page, not inside the dialog', async () => {
      const rendered = await render(fullScreen);
      await open(rendered);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      expect(document.activeElement).toBe(document.body);

      await userEvent.keyboard('{Escape}');
      await gone();

      expect(rendered.component.visible()).toBe(false);
      expect(document.activeElement).toBe(buttonOf(rendered.element, 'opener'));
    });

    it('closes with Close, with a click on the backdrop and with the app setting visible, each returning focus', async () => {
      const rendered = await render(fullScreen);
      const harness = await harnessOf(rendered.fixture);
      const opener = buttonOf(rendered.element, 'opener');

      await open(rendered);
      expect(await harness.isFullScreenOpen()).toBe(true);
      await harness.closeFullScreen();
      await gone();
      expect(await harness.isFullScreenOpen()).toBe(false);
      expect(document.activeElement).toBe(opener);

      await open(rendered);
      await userEvent.click(maskEl() ?? opener, { position: { x: 4, y: 400 } });
      await gone();
      expect(document.activeElement).toBe(opener);

      await open(rendered);
      rendered.component.visible.set(false);
      await rendered.fixture.whenStable();
      await gone();
      expect(document.activeElement).toBe(opener);
      expect(rendered.component.visibles).toEqual([false, false]);
    });

    it('opens again after a close, on the item the app left active', async () => {
      const rendered = await render(fullScreen);
      await open(rendered);
      await (await harnessOf(rendered.fixture)).next();
      await closeWithEscape();

      await open(rendered);

      expect(shownPhoto(rendered.element)).toBe('A Winter scene');
    });

    it('does not throw when the opener is gone by the time it closes', async () => {
      const rendered = await render(fullScreen);
      await open(rendered);
      rendered.component.opener.set(false);
      await rendered.fixture.whenStable();

      await closeWithEscape();

      expect(rendered.component.visible()).toBe(false);
    });

    it('changes the item with the navigators in full screen', async () => {
      const rendered = await render(fullScreen);
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      await harness.next();
      await harness.next();
      await harness.previous();
      await rendered.fixture.whenStable();

      expect(await harness.getActiveIndex()).toBe(1);
      expect(shownPhoto(rendered.element)).toBe('A Winter scene');
    });

    it('sizes the gallery to min(48rem, 90vw) and no wider', async () => {
      const rendered = await render(fullScreen);
      await open(rendered);
      const gallery = find(document, '.p-galleria-fullscreen', HTMLElement);
      expect(Math.round(gallery.getBoundingClientRect().width)).toBe(768);

      await page.viewport(400, 900);
      await expect.poll(() => Math.round(gallery.getBoundingClientRect().width)).toBe(360);
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
    it('reads the active index and the caption, and moves with next and previous', async () => {
      const { fixture } = await render((host) => {
        host.withCaption.set(true);
      });
      const harness = await harnessOf(fixture);

      expect(await harness.getActiveIndex()).toBe(0);
      expect(await harness.getCaption()).toContain('Meadow');
      await harness.next();
      expect(await harness.getActiveIndex()).toBe(1);
      await harness.next();
      expect(await harness.getCaption()).toContain('Moon');
      await harness.previous();
      expect(await harness.getActiveIndex()).toBe(1);
    });

    it('reads -1 for a full-screen gallery that is not open, and closes it once open', async () => {
      const rendered = await render((host) => {
        host.fullScreen.set(true);
      });
      const harness = await harnessOf(rendered.fixture);
      expect(await harness.getActiveIndex()).toBe(-1);
      expect(await harness.getAriaLabel()).toBeNull();
      await expect(harness.closeFullScreen()).rejects.toThrow('not open in full screen');
      expect(await harness.isFullScreenOpen()).toBe(false);

      await open(rendered);
      expect(await harness.isFullScreenOpen()).toBe(true);
      expect(await harness.getActiveIndex()).toBe(0);
      await harness.closeFullScreen();
      await gone();
      expect(await harness.isFullScreenOpen()).toBe(false);
    });

    it('finds a gallery by its accessible name', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(
        await loader.getAllHarnesses(WjGalleriaHarness.with({ ariaLabel: 'Holiday photos' })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjGalleriaHarness.with({ ariaLabel: /holiday/i })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjGalleriaHarness.with({ ariaLabel: 'Other' })),
      ).toHaveLength(0);
      const harness = await loader.getHarness(WjGalleriaHarness);
      expect(await harness.getAriaLabel()).toBe('Holiday photos');
    });
  });

  describe('pt', () => {
    const SECTIONS = [
      'root',
      'content',
      'itemscontainer',
      'items',
      'prevbutton',
      'item',
      'nextbutton',
      'caption',
    ] as const;
    const PART_NAMES = [
      'root',
      'content',
      'itemsContainer',
      'items',
      'prevButton',
      'item',
      'nextButton',
      'caption',
    ] as const;

    const probes = (element: ParentNode): Record<string, string | undefined> =>
      Object.fromEntries(
        SECTIONS.map((section, index) => [
          PART_NAMES[index] ?? section,
          part(element, section).dataset['probe'],
        ]),
      );

    it('reaches every part of the docs table as an object', async () => {
      const { element } = await render((host) => {
        host.withCaption.set(true);
        host.pt.set(Object.fromEntries(PART_NAMES.map((name) => [name, { 'data-probe': name }])));
      });

      expect(probes(element)).toEqual(Object.fromEntries(PART_NAMES.map((name) => [name, name])));
    });

    it('reaches the parts as a function, and the parts of the full screen', async () => {
      const rendered = await render((host) => {
        host.fullScreen.set(true);
        host.pt.set(() => ({
          root: { 'data-probe': 'fn-root' },
          mask: { 'data-probe': 'fn-mask' },
          closeButton: { 'data-probe': 'fn-close' },
        }));
      });
      await open(rendered);

      expect(regionOf(document.body).dataset['probe']).toBe('fn-root');
      expect(maskEl()?.dataset['probe']).toBe('fn-mask');
      expect(part(document.body, 'closebutton').dataset['probe']).toBe('fn-close');
    });

    it('keeps the consumer keys beside the routed attributes, and the routed attribute wins', async () => {
      const { component, fixture, element } = await render((host) => {
        host.pt.set({
          root: { 'aria-label': 'Consumer', 'data-probe': 'kept' },
          nextButton: { 'aria-label': 'Consumer next', role: 'link', 'data-probe': 'next' },
        });
      });

      expect(regionOf(element).getAttribute('aria-label')).toBe('Holiday photos');
      expect(regionOf(element).dataset['probe']).toBe('kept');
      expect(part(element, 'nextbutton').getAttribute('aria-label')).toBe('Next');
      expect(part(element, 'nextbutton').dataset['probe']).toBe('next');
      expect(part(element, 'nextbutton').hasAttribute('role')).toBe(true);

      component.pt.set(undefined);
      await fixture.whenStable();

      expect(regionOf(element).getAttribute('aria-label')).toBe('Holiday photos');
      expect(part(element, 'nextbutton').getAttribute('aria-label')).toBe('Next');
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-galleria: provideWeeljack() is missing from the application providers. ' +
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
        'WJ0003: wj-galleria: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use ariaLabel or ariaLabelledBy instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(regionOf(element).getAttribute('aria-label')).toBe('Holiday photos');
    });

    it('stays silent for a well-formed gallery', async () => {
      await render();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      // The fixture's native Before/After/opener buttons are not under test and fail `target-size`,
      // so axe is scoped to the gallery.
      it('has no axe violations: inline', async () => {
        const { element } = await render(undefined, scheme);

        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations: a middle item, reached by clicks, re-checked after another change', async () => {
        const { fixture, element } = await render(undefined, scheme);
        const harness = await harnessOf(fixture);

        await harness.next();
        await harness.next();
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

        await (await harnessOf(rendered.fixture)).next();
        await rendered.fixture.whenStable();
        await expectNoAxeViolations(hostOf(rendered.element));
      });

      it('has no axe violations: the dimmed navigator at each end, inline and in full screen', async () => {
        const { component, fixture, element } = await render((host) => {
          host.fullScreen.set(true);
        }, scheme);
        await open({ component, fixture, element });
        expect(part(element, 'prevbutton').getAttribute('aria-disabled')).toBe('true');
        await expectNoAxeViolations(hostOf(element));

        component.activeIndex.set(5);
        await fixture.whenStable();
        await expect
          .poll(() => part(element, 'nextbutton').getAttribute('aria-disabled'))
          .toBe('true');
        await expectNoAxeViolations(hostOf(element));

        await closeWithEscape();
      });

      it('has no axe violations: at both ends, circular, named by ariaLabelledBy, a focused navigator', async () => {
        const { component, fixture, element } = await render((host) => {
          host.ariaLabelledBy.set('name');
        }, scheme);
        part(element, 'nextbutton').focus();
        await expectNoAxeViolations(hostOf(element));

        component.activeIndex.set(5);
        await fixture.whenStable();
        await expectNoAxeViolations(hostOf(element));

        component.circular.set(true);
        await fixture.whenStable();
        await expectNoAxeViolations(hostOf(element));
      });
    });
  });
});
