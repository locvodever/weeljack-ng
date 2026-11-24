import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjAvatar,
  type WjAvatarPt,
  type WjAvatarShape,
  type WjAvatarSize,
} from 'weeljack-ng/avatar';
import { WjAvatarHarness } from 'weeljack-ng/avatar/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const URL_PAYLOADS = ['javascript:window.wjInjected=true', 'x" onerror="window.wjInjected=true'];
const ROOT = document.documentElement;

/** Local `data:` images only (no network): a flat portrait, a second one, and one that is broken. */
const PORTRAIT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#7c9885"/><circle cx="32" cy="26" r="12" fill="#f4f1de"/><path d="M10 64a22 22 0 0 1 44 0z" fill="#f4f1de"/></svg>',
)}`;
const OTHER_PORTRAIT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#3d5a80"/><circle cx="32" cy="26" r="12" fill="#e0fbfc"/></svg>',
)}`;
const BROKEN = 'data:image/png;base64,AAAA';

/** A consumer's template: one avatar between two native buttons, with a visible name beside it. */
@Component({
  selector: 'wj-avatar-host',
  imports: [WjAvatar],
  template: `
    <button type="button" id="before">Before</button>
    <wj-avatar
      [label]="label()"
      [image]="image()"
      [size]="size()"
      [shape]="shape()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [pt]="pt()"
      (imageError)="errors.push($event)"
    >
      @if (withIcon()) {
        <svg id="icon" width="1em" height="1em" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6" fill="currentColor" />
        </svg>
      }
    </wj-avatar>
    <span id="name">Ana Lima</span>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly label = signal<string | undefined>('AL');
  readonly image = signal<string | undefined>(undefined);
  readonly size = signal<WjAvatarSize | undefined>(undefined);
  readonly shape = signal<WjAvatarShape>('square');
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjAvatarPt>(undefined);
  readonly withIcon = signal(false);
  readonly errors: Event[] = [];
}

/** A consumer who writes aria-* on the host: it is not forwarded. */
@Component({
  selector: 'wj-avatar-aria-on-host-host',
  imports: [WjAvatar],
  template: `<wj-avatar label="AL" aria-label="Other" />`,
})
class AriaOnHostHost {}

/** An avatar rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-avatar-routed-host',
  imports: [WjAvatar],
  template: `<wj-avatar label="AL" />`,
})
class RoutedHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

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
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(find(element, 'p-avatar', HTMLElement).getBoundingClientRect().height).toBeGreaterThan(0);
  return { fixture, component: fixture.componentInstance, element };
}

function find<E extends Element>(element: HTMLElement, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-avatar', HTMLElement);
const rootOf = (element: HTMLElement): HTMLElement => find(element, 'p-avatar', HTMLElement);
const photoOf = (element: HTMLElement): HTMLImageElement => find(element, 'img', HTMLImageElement);

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjAvatarHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjAvatarHarness);
}

/** Polls until the photo has loaded (or failed), so a spec never reads a half-rendered box. */
async function photoSettled(element: HTMLElement): Promise<void> {
  await expect.poll(() => photoOf(element).complete).toBe(true);
}

const STATES: [string, (host: Host) => void][] = [
  ['label', () => undefined],
  [
    'named image',
    (host) => {
      host.label.set(undefined);
      host.image.set(PORTRAIT);
      host.ariaLabel.set('Ana Lima');
    },
  ],
  [
    'image named by id',
    (host) => {
      host.label.set(undefined);
      host.image.set(PORTRAIT);
      host.ariaLabelledBy.set('name');
    },
  ],
  [
    'decorative image',
    (host) => {
      host.label.set(undefined);
      host.image.set(PORTRAIT);
    },
  ],
  [
    'large',
    (host) => {
      host.size.set('large');
    },
  ],
  [
    'xlarge',
    (host) => {
      host.size.set('xlarge');
    },
  ],
  [
    'circle',
    (host) => {
      host.shape.set('circle');
    },
  ],
  [
    'circle image, named',
    (host) => {
      host.label.set(undefined);
      host.image.set(PORTRAIT);
      host.shape.set('circle');
      host.ariaLabel.set('Ana Lima');
    },
  ],
  [
    'named, projected icon',
    (host) => {
      host.label.set(undefined);
      host.withIcon.set(true);
      host.shape.set('circle');
      host.ariaLabel.set('Guest');
    },
  ],
];

describe('WjAvatar', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour then transitions for
    // 0.2s from the browser default. Measure the end state, not the animation.
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

  describe('inputs', () => {
    it('shows the label, and updates when it changes', async () => {
      const { fixture, component } = await render();
      const avatar = await harnessOf(fixture);
      expect(await avatar.getLabel()).toBe('AL');
      expect(await avatar.getImageUrl()).toBeNull();

      component.label.set('BT');
      await fixture.whenStable();

      expect(await avatar.getLabel()).toBe('BT');
    });

    it('is found by its label', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(await loader.getAllHarnesses(WjAvatarHarness.with({ label: 'AL' }))).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjAvatarHarness.with({ label: /^A/ }))).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjAvatarHarness.with({ label: 'BT' }))).toHaveLength(0);
    });

    it('shows the photo, reports its URL and updates when it changes', async () => {
      const { fixture, component, element } = await render((host) => {
        host.label.set(undefined);
        host.image.set(PORTRAIT);
      });
      const avatar = await harnessOf(fixture);
      expect(await avatar.getImageUrl()).toBe(PORTRAIT);
      expect(await avatar.getLabel()).toBeNull();

      component.image.set(OTHER_PORTRAIT);
      await fixture.whenStable();

      expect(await avatar.getImageUrl()).toBe(OTHER_PORTRAIT);
      expect(element.querySelectorAll('img')).toHaveLength(1);
    });

    it('size reaches the Optimus box: 32 px by default, 48 px large, 64 px xlarge', async () => {
      const { fixture, component, element } = await render();
      const avatar = await harnessOf(fixture);
      const width = (): number => rootOf(element).getBoundingClientRect().width;

      expect(width()).toBe(32);
      expect(await avatar.getSize()).toBeNull();

      component.size.set('large');
      await fixture.whenStable();
      await expect.poll(width).toBe(48);
      expect(await avatar.getSize()).toBe('large');

      component.size.set('xlarge');
      await fixture.whenStable();
      await expect.poll(width).toBe(64);
      expect(await avatar.getSize()).toBe('xlarge');
      expect(rootOf(element).getBoundingClientRect().height).toBe(64);
    });

    it('shape is a rounded square by default, a circle on request', async () => {
      const { fixture, component, element } = await render();
      const avatar = await harnessOf(fixture);

      expect(await avatar.getShape()).toBe('square');
      expect(getComputedStyle(rootOf(element)).borderRadius).toBe('12px');

      component.shape.set('circle');
      await fixture.whenStable();
      expect(await avatar.getShape()).toBe('circle');
      await expect.poll(() => getComputedStyle(rootOf(element)).borderRadius).toBe('50%');
    });

    it('emits imageError once for a photo that fails to load, with the browser event', async () => {
      const { component } = await render((host) => {
        host.label.set(undefined);
        host.image.set(BROKEN);
      });

      await expect.poll(() => component.errors.length).toBe(1);
      expect(component.errors[0]?.type).toBe('error');
    });

    it('is never interactive: no tabindex, no focusable descendant, no pointer cursor', async () => {
      const { element } = await render();

      expect(hostOf(element).hasAttribute('tabindex')).toBe(false);
      expect(hostOf(element).querySelector('[tabindex], button, a, input')).toBeNull();
      expect(getComputedStyle(rootOf(element)).cursor).not.toBe('pointer');
    });
  });

  describe('pt', () => {
    it('reaches root and image as an object, keeping consumer keys beside routed ones', async () => {
      const { element } = await render((host) => {
        host.label.set(undefined);
        host.image.set(PORTRAIT);
        host.ariaLabel.set('Ana Lima');
        host.pt.set({
          root: { 'data-root': 'a' },
          image: { 'data-image': 'c' },
        });
      });

      expect(rootOf(element).getAttribute('data-root')).toBe('a');
      expect(rootOf(element).getAttribute('role')).toBe('img');
      expect(photoOf(element).getAttribute('data-image')).toBe('c');
      expect(photoOf(element).getAttribute('alt')).toBe('');
    });

    it('reaches the label as an object', async () => {
      const { element } = await render((host) => {
        host.pt.set({ label: { 'data-label': 'b' } });
      });

      expect(
        find(element, '[data-pc-section="label"]', HTMLElement).getAttribute('data-label'),
      ).toBe('b');
    });

    it('reaches root and image as a function, keeping consumer keys beside routed ones', async () => {
      const { element } = await render((host) => {
        host.label.set(undefined);
        host.image.set(PORTRAIT);
        host.ariaLabel.set('Ana Lima');
        host.pt.set(() => ({
          root: () => ({ 'data-probe': 'fn' }),
          image: () => ({ 'data-probe-image': 'fn' }),
        }));
      });

      expect(rootOf(element).getAttribute('data-probe')).toBe('fn');
      expect(rootOf(element).getAttribute('role')).toBe('img');
      expect(photoOf(element).getAttribute('data-probe-image')).toBe('fn');
      expect(photoOf(element).getAttribute('alt')).toBe('');
    });

    it('lets a routed attribute win over a consumer one of the same name', async () => {
      const { element } = await render((host) => {
        host.label.set(undefined);
        host.image.set(PORTRAIT);
        host.ariaLabel.set('Ana Lima');
        host.pt.set({ root: { role: 'presentation' }, image: { alt: 'A photo' } });
      });

      expect(rootOf(element).getAttribute('role')).toBe('img');
      expect(photoOf(element).getAttribute('alt')).toBe('');
    });

    it('keeps a consumer role while the avatar is unnamed', async () => {
      const { element } = await render((host) => {
        host.pt.set({ root: { role: 'presentation' } });
      });

      expect(rootOf(element).getAttribute('role')).toBe('presentation');
    });
  });

  describe('text alternative and ARIA (FR-21)', () => {
    it('an unnamed avatar is decorative: no role, no name, and its photo has alt=""', async () => {
      const { fixture, element } = await render((host) => {
        host.label.set(undefined);
        host.image.set(PORTRAIT);
      });
      const avatar = await harnessOf(fixture);

      expect(rootOf(element).hasAttribute('role')).toBe(false);
      expect(rootOf(element).hasAttribute('aria-label')).toBe(false);
      expect(rootOf(element).hasAttribute('aria-labelledby')).toBe(false);
      expect(photoOf(element).getAttribute('alt')).toBe('');
      expect(await avatar.isNamed()).toBe(false);
      expect(await avatar.isDecorative()).toBe(true);
    });

    it('ariaLabel makes the avatar one image with that name', async () => {
      const { fixture, element } = await render((host) => {
        host.label.set(undefined);
        host.image.set(PORTRAIT);
        host.ariaLabel.set('Ana Lima');
      });
      const avatar = await harnessOf(fixture);

      expect(rootOf(element).getAttribute('role')).toBe('img');
      expect(rootOf(element).getAttribute('aria-label')).toBe('Ana Lima');
      expect(photoOf(element).getAttribute('alt')).toBe('');
      expect(await avatar.isNamed()).toBe(true);
      expect(await avatar.isDecorative()).toBe(false);
      expect(await avatar.getAriaLabel()).toBe('Ana Lima');
      expect(await avatar.getAriaLabelledBy()).toBeNull();
    });

    it('ariaLabelledBy makes the avatar one image named by that element', async () => {
      const { fixture, element } = await render((host) => {
        host.ariaLabelledBy.set('name');
      });
      const avatar = await harnessOf(fixture);

      expect(rootOf(element).getAttribute('role')).toBe('img');
      expect(rootOf(element).getAttribute('aria-labelledby')).toBe('name');
      expect(await avatar.isNamed()).toBe(true);
      expect(await avatar.getAriaLabelledBy()).toBe('name');
      expect(await avatar.getAriaLabel()).toBeNull();
    });

    it('a label-only avatar keeps its initials as readable text, named or not', async () => {
      const { fixture, component } = await render();
      const avatar = await harnessOf(fixture);
      expect(await avatar.getLabel()).toBe('AL');

      component.ariaLabel.set('Ana Lima');
      await fixture.whenStable();

      expect(await avatar.getLabel()).toBe('AL');
    });

    it('sets and clears the role as the name comes and goes', async () => {
      const { fixture, component, element } = await render((host) => {
        host.label.set(undefined);
        host.image.set(PORTRAIT);
      });
      expect(rootOf(element).hasAttribute('role')).toBe(false);

      component.ariaLabel.set('Ana Lima');
      await fixture.whenStable();
      await expect.poll(() => rootOf(element).getAttribute('role')).toBe('img');

      component.ariaLabel.set(undefined);
      await fixture.whenStable();
      await expect.poll(() => rootOf(element).hasAttribute('role')).toBe(false);
      expect(rootOf(element).hasAttribute('aria-label')).toBe(false);

      component.ariaLabelledBy.set('name');
      await fixture.whenStable();
      await expect.poll(() => rootOf(element).getAttribute('role')).toBe('img');

      component.ariaLabelledBy.set(undefined);
      await fixture.whenStable();
      await expect.poll(() => rootOf(element).hasAttribute('role')).toBe(false);
    });

    it('keeps alt="" on the photo through an image change and through a label round trip', async () => {
      const { fixture, component, element } = await render((host) => {
        host.label.set(undefined);
        host.image.set(PORTRAIT);
      });
      expect(photoOf(element).getAttribute('alt')).toBe('');

      component.image.set(OTHER_PORTRAIT);
      await fixture.whenStable();
      expect(photoOf(element).getAttribute('src')).toBe(OTHER_PORTRAIT);
      expect(photoOf(element).getAttribute('alt')).toBe('');

      // Optimus renders the label in preference to the image, and destroys the `img`.
      component.label.set('AL');
      await fixture.whenStable();
      expect(element.querySelector('img')).toBeNull();

      component.label.set(undefined);
      await fixture.whenStable();
      await expect.poll(() => photoOf(element).getAttribute('alt')).toBe('');
      expect(photoOf(element).getAttribute('src')).toBe(OTHER_PORTRAIT);
    });
  });

  describe('host', () => {
    it('is an inline-flex host with no box of its own around the Optimus root', async () => {
      const { element } = await render();
      const host = hostOf(element);
      const root = rootOf(element).getBoundingClientRect();

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(host.getBoundingClientRect().height).toBe(root.height);
      expect(host.getBoundingClientRect().width).toBe(root.width);
    });

    it('reflects size on the host as data-wj-size, absent by default', async () => {
      const { fixture, component, element } = await render();
      expect(hostOf(element).hasAttribute('data-wj-size')).toBe(false);

      component.size.set('large');
      await fixture.whenStable();
      expect(hostOf(element).getAttribute('data-wj-size')).toBe('large');

      component.size.set('xlarge');
      await fixture.whenStable();
      expect(hostOf(element).getAttribute('data-wj-size')).toBe('xlarge');

      component.size.set(undefined);
      await fixture.whenStable();
      expect(hostOf(element).hasAttribute('data-wj-size')).toBe(false);
    });
  });

  describe('look', () => {
    it('keeps the fill behind a photo and crops it to the box, never stretching it', async () => {
      const labelled = await render();
      const labelFill = getComputedStyle(rootOf(labelled.element)).backgroundColor;
      TestBed.resetTestingModule();

      const { element } = await render((host) => {
        host.label.set(undefined);
        host.image.set(PORTRAIT);
      });
      await photoSettled(element);

      expect(labelFill).not.toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(rootOf(element)).backgroundColor).toBe(labelFill);
      const photo = getComputedStyle(photoOf(element));
      expect(photo.objectFit).toBe('cover');
      expect(photo.borderRadius).toBe('12px');
    });

    it('a failed photo shows the empty fill, not an invisible box', async () => {
      const { element } = await render((host) => {
        host.label.set(undefined);
        host.image.set(BROKEN);
      });
      await photoSettled(element);

      const box = rootOf(element).getBoundingClientRect();
      expect([box.width, box.height]).toEqual([32, 32]);
      expect(getComputedStyle(rootOf(element)).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    it('crops a circle photo to the circle', async () => {
      const { element } = await render((host) => {
        host.label.set(undefined);
        host.image.set(PORTRAIT);
        host.shape.set('circle');
      });

      expect(getComputedStyle(photoOf(element)).borderRadius).toBe('50%');
    });
  });

  describe('projected content', () => {
    it('renders before the label', async () => {
      const { element } = await render((host) => {
        host.withIcon.set(true);
      });
      const icon = find(element, '#icon', SVGElement);

      expect(rootOf(element).firstElementChild).toBe(icon);
    });
  });

  describe('safety', () => {
    it('renders an HTML payload in label as text, creating no element and running nothing', async () => {
      const { fixture, element } = await render((host) => {
        host.label.set(PAYLOAD);
      });
      const avatar = await harnessOf(fixture);

      expect(await avatar.getLabel()).toBe(PAYLOAD);
      expect(element.querySelector('img, script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('keeps an HTML payload in ariaLabel inside the attribute value', async () => {
      const { fixture, element } = await render((host) => {
        host.ariaLabel.set(PAYLOAD);
      });
      const avatar = await harnessOf(fixture);

      expect(await avatar.getAriaLabel()).toBe(PAYLOAD);
      expect(element.querySelector('img, script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('keeps an HTML payload in ariaLabelledBy inside the attribute value', async () => {
      const { fixture, element } = await render((host) => {
        host.ariaLabelledBy.set(PAYLOAD);
      });
      const avatar = await harnessOf(fixture);

      expect(await avatar.getAriaLabelledBy()).toBe(PAYLOAD);
      expect(element.querySelector('img, script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it.each([PAYLOAD, ...URL_PAYLOADS])(
      'lands the image payload %s verbatim as the one img src, and runs nothing',
      async (payload) => {
        const { fixture, element } = await render((host) => {
          host.label.set(undefined);
          host.image.set(payload);
        });
        const avatar = await harnessOf(fixture);

        const images = element.querySelectorAll('img');
        expect(images).toHaveLength(1);
        expect(images[0]?.getAttribute('src')).toBe(payload);
        expect(images[0]?.hasAttribute('onerror')).toBe(false);
        expect(await avatar.getImageUrl()).toBe(payload);
        expect(element.querySelector('script')).toBeNull();
        // Let a failing load (the payloads are not images) run its error event, then check.
        await photoSettled(element);
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
        'WJ0001: wj-avatar: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('warns WJ0003 for aria-* on the host and forwards nothing', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-avatar: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel or ariaLabelledBy input to name an avatar that ' +
          'stands alone. Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(rootOf(element).hasAttribute('aria-label')).toBe(false);
    });

    it('stays silent for a named avatar', async () => {
      await render((host) => {
        host.ariaLabel.set('Ana Lima');
      });

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);
        if (element.querySelector('img')) {
          await photoSettled(element);
        }

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(hostOf(element));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab moves from the button before the avatar straight to the button after it', async () => {
      const { element } = await render((host) => {
        host.ariaLabel.set('Ana Lima');
      });
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, '#before', HTMLElement));
    });
  });
});
