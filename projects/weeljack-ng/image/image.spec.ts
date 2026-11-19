/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjImage, type WjImageLoading, type WjImagePt } from 'weeljack-ng/image';
import { WjImageHarness } from 'weeljack-ng/image/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const URL_PAYLOADS = ['javascript:window.wjInjected=true', 'x" onerror="window.wjInjected=true'];
const ROOT = document.documentElement;

/** Local `data:` images only (no network): a flat scene, a larger one for the preview, a broken one. */
const scene = (sky: string, hill: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="${sky}"/><circle cx="120" cy="30" r="14" fill="#f2c94c"/><path d="M0 120V80q60-40 160 0v40z" fill="${hill}"/></svg>`,
  )}`;
const SCENE = scene('#bcd4e6', '#6a994e');
const BIG_SCENE = scene('#274c77', '#386641');
const BROKEN = 'data:image/png;base64,AAAA';
const ALT = 'A green hill under a yellow sun';

/** A consumer's template: one image between two native buttons. */
@Component({
  selector: 'wj-image-host',
  imports: [WjImage],
  template: `
    <button type="button" id="before">Before</button>
    <wj-image
      [src]="src()"
      [alt]="alt()"
      [srcSet]="srcSet()"
      [sizes]="sizes()"
      [width]="width()"
      [height]="height()"
      [loading]="loading()"
      [preview]="preview()"
      [previewImageSrc]="previewImageSrc()"
      [pt]="pt()"
      (opened)="opens.update(countUp)"
      (closed)="closes.update(countUp)"
      (imageError)="errors.push($event)"
    />
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly src = signal(SCENE);
  readonly alt = signal(ALT);
  readonly srcSet = signal<string | undefined>(undefined);
  readonly sizes = signal<string | undefined>(undefined);
  readonly width = signal<string | undefined>('160');
  readonly height = signal<string | undefined>('120');
  readonly loading = signal<WjImageLoading | undefined>(undefined);
  readonly preview = signal(true);
  readonly previewImageSrc = signal<string | undefined>(undefined);
  readonly pt = signal<WjImagePt>(undefined);
  readonly opens = signal(0);
  readonly closes = signal(0);
  readonly errors: Event[] = [];
  readonly countUp = (count: number): number => count + 1;
}

/** A consumer who writes aria-* on the host: it is not forwarded. */
@Component({
  selector: 'wj-image-aria-on-host-host',
  imports: [WjImage],
  template: `<wj-image aria-label="Other" src="data:," alt="A hill" />`,
})
class AriaOnHostHost {}

/** An image rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-image-routed-host',
  imports: [WjImage],
  template: `<wj-image src="data:," alt="A hill" />`,
})
class RoutedHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

/** The fixture currently on screen, so `afterEach` can close an overlay a spec left open. */
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

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const maskEl = (): HTMLElement | null => document.querySelector<HTMLElement>('[role="dialog"]');
const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-image', HTMLElement);
const photoOf = (element: HTMLElement): HTMLImageElement =>
  find(element, 'p-image > img', HTMLImageElement);
const enlargeOf = (element: HTMLElement): HTMLButtonElement =>
  find(element, 'p-image > button', HTMLButtonElement);
const originalOf = (): HTMLImageElement => find(document, '[role="dialog"] img', HTMLImageElement);
const part = (name: string): HTMLElement =>
  find(document, `[data-pc-section="${name.toLowerCase()}"]`, HTMLElement);

/** Renders `Host` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function render(
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
  translation?: Parameters<typeof provideWeeljack>[0],
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', ...translation })],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  current = {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
  await photoSettled(current.element);
  return current;
}

/** Polls until the inline photo has loaded (or failed), so a spec never reads a half-rendered box. */
async function photoSettled(element: HTMLElement): Promise<void> {
  await expect.poll(() => photoOf(element).complete).toBe(true);
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjImageHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjImageHarness);

/** The name of the element that has focus: its `aria-label`, else its text. */
const focusedName = (): string => {
  const active = document.activeElement;
  return active?.getAttribute('aria-label') ?? active?.textContent.trim() ?? '';
};

/**
 * Waits until the preview is open and Optimus has moved focus onto Close, which it does 25 ms after
 * the enter starts: poll it, never wait for it.
 */
async function entered(
  { component }: Rendered,
  before = component.opens() - 1,
  closeName = 'Close',
): Promise<void> {
  await expect.poll(() => component.opens()).toBe(before + 1);
  await expect.poll(focusedName).toBe(closeName);
}

/** Opens the preview with the harness and waits until focus is on Close. */
async function open(rendered: Rendered, closeName = 'Close'): Promise<void> {
  const before = rendered.component.opens();
  await (await harnessOf(rendered.fixture)).openPreview();
  await entered(rendered, before, closeName);
}

/** Waits until the preview has left and nothing of it, or its scroll lock, remains. */
async function gone(): Promise<void> {
  await expect.poll(() => maskEl()).toBeNull();
  await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(false);
}

/** Closes the preview with its Close button and waits for the leave to end. */
async function close({ fixture }: Rendered): Promise<void> {
  await (await harnessOf(fixture)).closePreview();
  await gone();
}

/**
 * Records every class list the preview's mask and enlarged image have from now on, so a spec can
 * tell whether Optimus's enter and leave motion ran. Call the returned function to stop and read.
 */
function recordClasses(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('.p-image-mask, .p-image-original')) {
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

/** Every style rule of the page whose selector holds `selector`, inside a block that holds `media`. */
function mediaRules(media: string, selector: string): CSSStyleRule[] {
  const found: CSSStyleRule[] = [];
  const walk = (rules: CSSRuleList, inMedia: boolean): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && inMedia && rule.selectorText.includes(selector)) {
        found.push(rule);
      }
      if (rule instanceof CSSGroupingRule) {
        walk(
          rule.cssRules,
          inMedia || (rule instanceof CSSMediaRule && rule.conditionText.includes(media)),
        );
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules, false);
  }
  return found;
}

/** What a CSS value resolves to on the page, such as a `var(--wj-*)` colour. */
function resolved(element: HTMLElement, property: 'background-color' | 'color', value: string) {
  const probe = document.createElement('div');
  probe.style.setProperty(property, value);
  element.append(probe);
  const result = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return result;
}

describe('WjImage', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Motion is off unless a spec turns it on: an open or a close then ends at once.
    reduceMotion(true);
  });

  afterEach(async () => {
    try {
      // An overlay left open at teardown would reach the next spec: close it and wait for the leave.
      if (current && maskEl()) {
        await userEvent.keyboard('{Escape}');
        await gone();
      }
    } catch (error) {
      // The preview did not leave, so this spec fails. Vitest runs no later after-hook once one
      // throws, and that includes the one that resets TestBed: reset it here, or every later spec in
      // the file fails to configure its module and the one stuck preview reads as twenty failures.
      TestBed.resetTestingModule();
      maskEl()?.remove();
      document.body.classList.remove('p-overflow-hidden');
      throw error;
    } finally {
      current = undefined;
      ROOT.classList.remove('wj-dark');
      document.body.style.backgroundColor = '';
      document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
        style.remove();
      });
      Reflect.deleteProperty(window, 'wjInjected');
    }
  });

  describe('inputs', () => {
    it('renders the image in a host that is an inline block as big as the image', async () => {
      const { fixture, element } = await render();
      const host = hostOf(element);
      const image = await harnessOf(fixture);

      expect(getComputedStyle(host).display).toBe('inline-block');
      expect(await image.getSourceUrl()).toBe(SCENE);
      expect(await image.getAlt()).toBe(ALT);
      expect(host.getBoundingClientRect().width).toBe(
        photoOf(element).getBoundingClientRect().width,
      );
      expect(host.getBoundingClientRect().height).toBe(
        photoOf(element).getBoundingClientRect().height,
      );
    });

    it('sets src, alt, srcSet, sizes, width, height and loading on the one img, and follows changes', async () => {
      const srcSet = `${SCENE} 1x, ${BIG_SCENE} 2x`;
      const { fixture, component, element } = await render((host) => {
        host.srcSet.set(srcSet);
        host.sizes.set('(min-width: 600px) 160px, 100vw');
        host.loading.set('eager');
      });
      const photo = photoOf(element);

      expect(element.querySelectorAll('img')).toHaveLength(1);
      expect(photo.getAttribute('src')).toBe(SCENE);
      expect(photo.getAttribute('alt')).toBe(ALT);
      expect(photo.getAttribute('srcset')).toBe(srcSet);
      expect(photo.getAttribute('sizes')).toBe('(min-width: 600px) 160px, 100vw');
      expect(photo.getAttribute('width')).toBe('160');
      expect(photo.getAttribute('height')).toBe('120');
      expect(photo.getAttribute('loading')).toBe('eager');

      component.src.set(BIG_SCENE);
      component.alt.set('A blue sky');
      component.loading.set('lazy');
      component.width.set('80');
      await fixture.whenStable();

      expect(photo.getAttribute('src')).toBe(BIG_SCENE);
      expect(photo.getAttribute('alt')).toBe('A blue sky');
      expect(photo.getAttribute('loading')).toBe('lazy');
      expect(photo.getAttribute('width')).toBe('80');
    });

    it('leaves srcset, sizes and loading off the img when they are not given', async () => {
      const { element } = await render();
      const photo = photoOf(element);

      expect(photo.hasAttribute('srcset')).toBe(false);
      expect(photo.hasAttribute('sizes')).toBe(false);
      expect(photo.hasAttribute('loading')).toBe(false);
    });

    it('marks an image decorative with an empty alt', async () => {
      const { fixture, element } = await render((host) => {
        host.alt.set('');
        host.preview.set(false);
      });

      expect(photoOf(element).getAttribute('alt')).toBe('');
      expect(await (await harnessOf(fixture)).getAlt()).toBe('');
    });

    it('offers the enlarge button only with preview, and follows it', async () => {
      const { fixture, component, element } = await render((host) => {
        host.preview.set(false);
      });
      const image = await harnessOf(fixture);
      expect(await image.hasPreview()).toBe(false);
      expect(element.querySelector('button#before ~ wj-image button')).toBeNull();

      component.preview.set(true);
      await fixture.whenStable();
      expect(await image.hasPreview()).toBe(true);

      component.preview.set(false);
      await fixture.whenStable();
      expect(await image.hasPreview()).toBe(false);
    });

    it('shows src in the preview when there is no previewImageSrc', async () => {
      const rendered = await render();
      await open(rendered);

      expect(originalOf().getAttribute('src')).toBe(SCENE);
    });

    it('shows the preview image from previewImageSrc, and keeps src on the photo', async () => {
      const rendered = await render((host) => {
        host.previewImageSrc.set(BIG_SCENE);
      });
      await open(rendered);

      expect(originalOf().getAttribute('src')).toBe(BIG_SCENE);
      expect(photoOf(rendered.element).getAttribute('src')).toBe(SCENE);
    });

    it('is found by the harness through its filters', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(await loader.getAllHarnesses(WjImageHarness.with({ src: SCENE }))).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjImageHarness.with({ alt: /green hill/ }))).toHaveLength(
        1,
      );
      expect(await loader.getAllHarnesses(WjImageHarness.with({ alt: 'Other' }))).toHaveLength(0);
      expect(await loader.getAllHarnesses(WjImageHarness.with({ preview: true }))).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjImageHarness.with({ preview: false }))).toHaveLength(0);
    });
  });

  describe('outputs', () => {
    it('imageError emits once for a broken image', async () => {
      const { fixture, component } = await render((host) => {
        host.src.set(BROKEN);
      });
      await expect.poll(() => component.errors.length).toBe(1);
      await fixture.whenStable();

      expect(component.errors).toHaveLength(1);
      expect(component.errors[0]?.type).toBe('error');
    });

    it('opened and closed fire once per cycle, whichever way the preview closes', async () => {
      const rendered = await render();
      const { component, element } = rendered;

      // Close button.
      await open(rendered);
      expect([component.opens(), component.closes()]).toEqual([1, 0]);
      await close(rendered);
      await expect.poll(() => component.closes()).toBe(1);

      // Escape.
      await open(rendered);
      await userEvent.keyboard('{Escape}');
      await gone();
      await expect.poll(() => component.closes()).toBe(2);

      // A click on the backdrop.
      await open(rendered);
      await userEvent.click(find(document, '[role="dialog"]', HTMLElement), {
        position: { x: 4, y: 400 },
      });
      await gone();
      await expect.poll(() => component.closes()).toBe(3);

      expect([component.opens(), component.closes()]).toEqual([3, 3]);
      expect(element.querySelector('[role="dialog"]')).toBeNull();
    });
  });

  describe('pt', () => {
    it('reaches root, image, previewMask, previewIcon, mask, toolbar, the five buttons and original (object form)', async () => {
      const parts = [
        'root',
        'image',
        'previewMask',
        'previewIcon',
        'mask',
        'toolbar',
        'rotateRightButton',
        'rotateLeftButton',
        'zoomOutButton',
        'zoomInButton',
        'closeButton',
        'original',
      ] as const;
      const rendered = await render((host) => {
        host.pt.set(Object.fromEntries(parts.map((name) => [name, { 'data-probe': name }])));
      });
      await open(rendered);

      for (const name of parts) {
        expect(
          find(document, `[data-probe="${name}"]`, Element),
          `pt.${name} did not reach its element`,
        ).toBeTruthy();
      }
      expect(photoOf(rendered.element).getAttribute('data-probe')).toBe('image');
      expect(originalOf().getAttribute('data-probe')).toBe('original');
    });

    it('accepts the function form and keeps a consumer key beside the routed ones', async () => {
      const rendered = await render((host) => {
        host.pt.set({
          original: () => ({ 'data-probe': 'fn' }),
          mask: { 'data-probe': 'mask' },
        });
      });
      await open(rendered);

      expect(originalOf().getAttribute('data-probe')).toBe('fn');
      expect(originalOf().getAttribute('alt')).toBe(ALT);
      expect(maskEl()?.getAttribute('data-probe')).toBe('mask');
      expect(maskEl()?.getAttribute('aria-label')).toBe(ALT);
    });

    it('lets a routed alt and aria-label win over the same attribute in the consumer pt', async () => {
      const rendered = await render((host) => {
        host.pt.set({ original: { alt: 'Mine' }, mask: { 'aria-label': 'Mine' } });
      });
      await open(rendered);

      expect(originalOf().getAttribute('alt')).toBe(ALT);
      expect(maskEl()?.getAttribute('aria-label')).toBe(ALT);
    });

    it('applies a pt that arrives after the first render', async () => {
      const rendered = await render();
      rendered.component.pt.set({ image: { 'data-probe': 'late' } });
      await rendered.fixture.whenStable();

      expect(photoOf(rendered.element).getAttribute('data-probe')).toBe('late');
    });
  });

  describe('the enlarge button', () => {
    it('is a real button named Zoom Image, covering the image', async () => {
      const { element } = await render();
      const button = enlargeOf(element);

      expect(button.tagName).toBe('BUTTON');
      expect(button.type).toBe('button');
      expect(button.getAttribute('aria-label')).toBe('Zoom Image');
      expect(button.getBoundingClientRect().width).toBe(
        photoOf(element).getBoundingClientRect().width,
      );
    });

    it('is named from the translation', async () => {
      const { element } = await render(undefined, 'light', {
        translation: { aria: { zoomImage: 'Phóng to ảnh' } },
      });

      expect(enlargeOf(element).getAttribute('aria-label')).toBe('Phóng to ảnh');
    });

    it('is invisible at rest, and on keyboard focus washes the image and draws the preset ring', async () => {
      const { element } = await render();
      const button = enlargeOf(element);
      // Park the pointer on a neutral element before reading a hoverable control.
      await userEvent.hover(find(element, '#before', HTMLElement));
      expect(getComputedStyle(button).opacity).toBe('0');

      find(element, '#before', HTMLElement).focus();
      await userEvent.tab();
      expect(document.activeElement).toBe(button);
      const style = getComputedStyle(button);
      expect(style.opacity).toBe('1');
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineOffset).toBe('2px');
      expect(style.outlineColor).toBe(resolved(element, 'color', 'var(--wj-focus-ring-color)'));
      // The photo scrim, not Aura's 40 % black. Optimus fades the wash in, so poll it.
      await expect
        .poll(() => getComputedStyle(button).backgroundColor)
        .toBe(
          resolved(
            element,
            'background-color',
            'color-mix(in srgb, var(--wj-surface-900) 70%, transparent)',
          ),
        );
    });
  });

  describe('the preview overlay', () => {
    it('is a modal dialog named by alt, with an enlarged image that carries the alt', async () => {
      const rendered = await render();
      await open(rendered);
      const mask = maskEl();

      expect(mask?.getAttribute('role')).toBe('dialog');
      expect(mask?.getAttribute('aria-modal')).toBe('true');
      expect(mask?.getAttribute('aria-label')).toBe(ALT);
      expect(originalOf().getAttribute('alt')).toBe(ALT);
      expect(await (await harnessOf(rendered.fixture)).isPreviewOpen()).toBe(true);
      expect(hostOf(rendered.element).contains(mask)).toBe(true);
    });

    it('is named by the translation when alt is empty, and the enlarged image keeps an empty alt', async () => {
      const rendered = await render((host) => {
        host.alt.set('');
      });
      await open(rendered);

      expect(maskEl()?.getAttribute('aria-label')).toBe('Zoom Image');
      expect(originalOf().getAttribute('alt')).toBe('');
    });

    it('takes its fallback name from a changed translation', async () => {
      const rendered = await render(
        (host) => {
          host.alt.set('');
        },
        'light',
        { translation: { aria: { zoomImage: 'Phóng to ảnh' } } },
      );
      await open(rendered);

      expect(maskEl()?.getAttribute('aria-label')).toBe('Phóng to ảnh');
    });

    it('follows alt while it is open, in both directions', async () => {
      const rendered = await render();
      await open(rendered);

      rendered.component.alt.set('A blue sky');
      await rendered.fixture.whenStable();
      expect(maskEl()?.getAttribute('aria-label')).toBe('A blue sky');
      expect(originalOf().getAttribute('alt')).toBe('A blue sky');

      rendered.component.alt.set('');
      await rendered.fixture.whenStable();
      expect(maskEl()?.getAttribute('aria-label')).toBe('Zoom Image');
      expect(originalOf().getAttribute('alt')).toBe('');

      rendered.component.alt.set(ALT);
      await rendered.fixture.whenStable();
      expect(maskEl()?.getAttribute('aria-label')).toBe(ALT);
    });

    it('names its five toolbar buttons from the translation, in order', async () => {
      const rendered = await render();
      await open(rendered);
      const buttons = Array.from(document.querySelectorAll('[role="dialog"] button'));

      expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
        'Rotate Right',
        'Rotate Left',
        'Zoom Out',
        'Zoom In',
        'Close',
      ]);
    });

    it('follows a changed translation for the toolbar', async () => {
      const rendered = await render(undefined, 'light', {
        translation: { aria: { close: 'Đóng', rotateLeft: 'Xoay trái' } },
      });
      await open(rendered, 'Đóng');

      expect(part('closeButton').getAttribute('aria-label')).toBe('Đóng');
      expect(part('rotateLeftButton').getAttribute('aria-label')).toBe('Xoay trái');
    });

    it('rotates and zooms through the harness, and disables a zoom at its limit', async () => {
      const rendered = await render();
      const image = await harnessOf(rendered.fixture);
      await open(rendered);
      const transform = (): string => originalOf().style.transform;
      expect(transform()).toBe('rotate(0deg) scale(1)');

      await image.rotateRight();
      expect(transform()).toBe('rotate(90deg) scale(1)');
      await image.rotateLeft();
      await image.rotateLeft();
      expect(transform()).toBe('rotate(-90deg) scale(1)');
      await image.zoomIn();
      expect(transform()).toBe('rotate(-90deg) scale(1.1)');
      await image.zoomOut();
      await image.zoomOut();
      expect(transform()).toBe('rotate(-90deg) scale(0.9)');

      for (let step = 0; step < 4; step++) {
        await image.zoomOut();
      }
      await expect.poll(() => part('zoomOutButton').hasAttribute('disabled')).toBe(true);
      expect(part('zoomInButton').hasAttribute('disabled')).toBe(false);
    });

    it('swallows the first backdrop click after a rotate (Optimus’s own, listed on the docs page)', async () => {
      const rendered = await render();
      const image = await harnessOf(rendered.fixture);
      await open(rendered);
      await image.rotateRight();
      const backdrop = (): Promise<void> =>
        userEvent.click(find(document, '[role="dialog"]', HTMLElement), {
          position: { x: 4, y: 400 },
        });

      await backdrop();
      expect(await image.isPreviewOpen()).toBe(true);
      await backdrop();
      await gone();
    });

    it('resets rotation and zoom for the next open', async () => {
      const rendered = await render();
      const image = await harnessOf(rendered.fixture);
      await open(rendered);
      await image.rotateRight();
      await image.zoomIn();
      await close(rendered);

      await open(rendered);
      expect(originalOf().style.transform).toBe('rotate(0deg) scale(1)');
    });

    it('blocks the page scroll while open and gives it back on close', async () => {
      const rendered = await render();
      const blocked = (): boolean => document.body.classList.contains('p-overflow-hidden');
      expect(blocked()).toBe(false);

      await open(rendered);
      expect(blocked()).toBe(true);

      await close(rendered);
      expect(blocked()).toBe(false);
    });

    it('has 48 x 48 px toolbar actions', async () => {
      const rendered = await render();
      await open(rendered);

      for (const name of [
        'rotateRightButton',
        'rotateLeftButton',
        'zoomOutButton',
        'zoomInButton',
        'closeButton',
      ]) {
        const box = part(name).getBoundingClientRect();
        expect([name, box.width, box.height]).toEqual([name, 48, 48]);
      }
    });

    it('puts the toolbar pill on the photo scrim, not on Aura’s 10 % white', async () => {
      const rendered = await render();
      await open(rendered);

      expect(getComputedStyle(part('toolbar')).backgroundColor).toBe(
        resolved(
          rendered.element,
          'background-color',
          'color-mix(in srgb, var(--wj-surface-900) 70%, transparent)',
        ),
      );
    });
  });

  describe('motion', () => {
    it('plays none of Optimus’s enter and leave motion when the reader asks for less', async () => {
      const rendered = await render();
      const read = recordClasses();

      await open(rendered);
      await close(rendered);

      expect(motionClasses(read())).toEqual([]);
    });

    it('pt.motion cannot switch safe off', async () => {
      const rendered = await render((host) => {
        host.pt.set({ motion: { safe: false }, maskMotion: { safe: false } } as WjImagePt);
      });
      const read = recordClasses();

      await open(rendered);
      await close(rendered);

      expect(motionClasses(read())).toEqual([]);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const rendered = await render();
      const read = recordClasses();

      await open(rendered);
      await close(rendered);

      expect(motionClasses(read()).length).toBeGreaterThan(0);
    });

    it('turns Optimus’s 300 ms rotate and zoom transition off under prefers-reduced-motion only', async () => {
      const rendered = await render();
      await open(rendered);

      // Normal preference: Optimus's own transition stands.
      expect(getComputedStyle(originalOf()).transitionDuration).toBe('0.3s');
      // The rule that switches it off sits in the reduced-motion block and nowhere else.
      const rules = mediaRules('prefers-reduced-motion: reduce', '.p-image-original');
      expect(rules.map((rule) => rule.style.getPropertyValue('transition'))).toEqual(['none']);
    });
  });

  describe('keyboard', () => {
    it('Tab goes from the button before the image to the enlarge button, then on', async () => {
      const { element } = await render();
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(enlargeOf(element));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(enlargeOf(element));
    });

    it('has no Tab stop without preview', async () => {
      const { element } = await render((host) => {
        host.preview.set(false);
      });
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('%s on the enlarge button opens the preview with focus on Close', async (_name, key) => {
      const rendered = await render();
      enlargeOf(rendered.element).focus();

      await userEvent.keyboard(key);
      await entered(rendered, 0);

      expect(await (await harnessOf(rendered.fixture)).isPreviewOpen()).toBe(true);
      expect(focusedName()).toBe('Close');
    });

    it('Tab and Shift+Tab cycle inside the toolbar and never leave it', async () => {
      const rendered = await render();
      await open(rendered);
      const names: string[] = [];

      for (let step = 0; step < 6; step++) {
        await userEvent.tab();
        names.push(focusedName());
      }
      expect(names).toEqual([
        'Rotate Right',
        'Rotate Left',
        'Zoom Out',
        'Zoom In',
        'Close',
        'Rotate Right',
      ]);

      await userEvent.tab({ shift: true });
      expect(focusedName()).toBe('Close');
      expect(hostOf(rendered.element).contains(document.activeElement)).toBe(true);
    });

    it('Enter and Space on a toolbar button rotate, zoom or close', async () => {
      const rendered = await render();
      await open(rendered);
      const transform = (): string => originalOf().style.transform;

      part('rotateRightButton').focus();
      await userEvent.keyboard('{Enter}');
      expect(transform()).toBe('rotate(90deg) scale(1)');
      part('rotateLeftButton').focus();
      await userEvent.keyboard(' ');
      expect(transform()).toBe('rotate(0deg) scale(1)');
      part('zoomInButton').focus();
      await userEvent.keyboard('{Enter}');
      expect(transform()).toBe('rotate(0deg) scale(1.1)');
      part('zoomOutButton').focus();
      await userEvent.keyboard(' ');
      expect(transform()).toBe('rotate(0deg) scale(1)');

      part('closeButton').focus();
      await userEvent.keyboard('{Enter}');
      await gone();
    });

    it('Escape closes the preview and returns focus to the enlarge button', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.keyboard('{Escape}');
      await gone();

      await expect.poll(() => document.activeElement).toBe(enlargeOf(rendered.element));
      expect(rendered.component.closes()).toBe(1);
    });

    it('Escape still closes after a rotate, whose click Optimus leaves marked', async () => {
      const rendered = await render();
      await open(rendered);
      await (await harnessOf(rendered.fixture)).rotateRight();

      await userEvent.keyboard('{Escape}');
      await gone();
      await expect.poll(() => document.activeElement).toBe(enlargeOf(rendered.element));
    });

    it('the Close button returns focus to the enlarge button too, which Optimus alone does not', async () => {
      const rendered = await render();
      await open(rendered);

      await close(rendered);

      await expect.poll(() => document.activeElement).toBe(enlargeOf(rendered.element));
    });
  });

  describe('rendering safety', () => {
    it('renders an HTML payload in alt as text: it names the dialog and sits in attributes only', async () => {
      const rendered = await render((host) => {
        host.alt.set(PAYLOAD);
      });
      await open(rendered);

      expect(photoOf(rendered.element).getAttribute('alt')).toBe(PAYLOAD);
      expect(originalOf().getAttribute('alt')).toBe(PAYLOAD);
      expect(maskEl()?.getAttribute('aria-label')).toBe(PAYLOAD);
      // Two images: the photo and the enlarged one. The payload added none, and no script.
      expect(hostOf(rendered.element).querySelectorAll('img')).toHaveLength(2);
      expect(hostOf(rendered.element).querySelector('script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it.each([PAYLOAD, ...URL_PAYLOADS])(
      'lands the src payload %s verbatim as the one img src, and runs nothing',
      async (payload) => {
        const { fixture, element } = await render((host) => {
          host.src.set(payload);
          host.preview.set(false);
        });

        const images = element.querySelectorAll('img');
        expect(images).toHaveLength(1);
        expect(images[0]?.getAttribute('src')).toBe(payload);
        expect(images[0]?.hasAttribute('onerror')).toBe(false);
        expect(await (await harnessOf(fixture)).getSourceUrl()).toBe(payload);
        expect(element.querySelector('script')).toBeNull();
        // Let a failing load (the payloads are not images) run its error event, then check.
        await photoSettled(element);
        expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
      },
    );

    it.each([PAYLOAD, ...URL_PAYLOADS])(
      'lands the srcSet payload %s verbatim as the one img srcset, and runs nothing',
      async (payload) => {
        const { element } = await render((host) => {
          host.srcSet.set(payload);
          host.preview.set(false);
        });

        const images = element.querySelectorAll('img');
        expect(images).toHaveLength(1);
        expect(images[0]?.getAttribute('srcset')).toBe(payload);
        expect(images[0]?.hasAttribute('onerror')).toBe(false);
        expect(element.querySelector('script')).toBeNull();
        await photoSettled(element);
        expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
      },
    );

    it.each([PAYLOAD, ...URL_PAYLOADS])(
      'lands the previewImageSrc payload %s verbatim as the enlarged img src, and runs nothing',
      async (payload) => {
        const rendered = await render((host) => {
          host.previewImageSrc.set(payload);
        });
        await open(rendered);

        const enlarged = originalOf();
        expect(enlarged.getAttribute('src')).toBe(payload);
        expect(enlarged.hasAttribute('onerror')).toBe(false);
        expect(hostOf(rendered.element).querySelectorAll('img')).toHaveLength(2);
        expect(hostOf(rendered.element).querySelector('script')).toBeNull();
        await expect.poll(() => enlarged.complete).toBe(true);
        expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
      },
    );
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-image: provideWeeljack() is missing from the application providers. ' +
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
        'WJ0003: wj-image: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the alt input, which names the image and its preview. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(photoOf(element).hasAttribute('aria-label')).toBe(false);
    });

    it('stays silent for a well-formed image', async () => {
      await render();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    const states: [string, (host: Host) => void, boolean][] = [
      [
        'default (no preview)',
        (host) => {
          host.preview.set(false);
        },
        false,
      ],
      [
        'decorative',
        (host) => {
          host.alt.set('');
        },
        false,
      ],
      ['preview offered', () => undefined, false],
      ['preview open', () => undefined, true],
      [
        'preview open, decorative',
        (host) => {
          host.alt.set('');
        },
        true,
      ],
    ];

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(states)('has no axe violations: %s', async (_name, setup, opened) => {
        const rendered = await render(setup, scheme);
        if (opened) {
          await open(rendered);
        }

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(hostOf(rendered.element));
      });
    });
  });
});
