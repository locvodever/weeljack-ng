import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjDivider,
  type WjDividerAlign,
  type WjDividerOrientation,
  type WjDividerPt,
} from 'weeljack-ng/divider';
import { WjDividerHarness } from 'weeljack-ng/divider/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const ROOT = document.documentElement;

/**
 * A consumer's template: one divider in a frame, driven by signals. A vertical divider sits in a
 * fixed-height flex row, which is what stretches it.
 */
@Component({
  selector: 'wj-divider-host',
  imports: [WjDivider],
  template: `
    <button type="button" id="before">Before</button>
    <div class="frame" [class.vertical]="orientation() === 'vertical'" [style.width]="width()">
      <wj-divider [orientation]="orientation()" [align]="align()" [pt]="pt()">
        @if (content()) {
          <span class="text">{{ content() }}</span>
        }
      </wj-divider>
    </div>
    <button type="button" id="after">After</button>
  `,
  styles: `
    .frame {
      width: 20rem;
    }
    .frame.vertical {
      display: flex;
      height: 10rem;
    }
  `,
})
class Host {
  readonly orientation = signal<WjDividerOrientation>('horizontal');
  readonly align = signal<WjDividerAlign | undefined>(undefined);
  readonly pt = signal<WjDividerPt>(undefined);
  readonly content = signal<string | undefined>(undefined);
  readonly width = signal<string | undefined>(undefined);
}

/** A divider that only decorates: the app hides it on the host. */
@Component({
  selector: 'wj-divider-decorative-host',
  imports: [WjDivider],
  template: `
    <p>One.</p>
    <wj-divider aria-hidden="true" />
    <p>Two.</p>
  `,
})
class DecorativeHost {}

/** A bare `wj-divider`. */
@Component({
  selector: 'wj-divider-plain-host',
  imports: [WjDivider],
  template: `<wj-divider />`,
})
class PlainHost {}

/** Three plain-text items in a flex row, separated by two stretching vertical dividers. */
@Component({
  selector: 'wj-divider-row-host',
  imports: [WjDivider],
  template: `
    <div class="row">
      <span>Inbox</span>
      <wj-divider id="first" orientation="vertical" />
      <span class="tall">Drafts<br />and more<br />lines</span>
      <wj-divider id="second" orientation="vertical" />
      <span>Sent</span>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      width: 20rem;
    }
  `,
})
class RowHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  divider: WjDividerHarness;
  element: HTMLElement;
}

function find<E extends Element>(root: ParentNode, selector: string, type: new () => E): E {
  const found = root.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const rootOf = (root: ParentNode): HTMLElement => find(root, 'p-divider', HTMLElement);
const hostOf = (root: ParentNode): HTMLElement => find(root, 'wj-divider', HTMLElement);
const contentOf = (root: ParentNode): HTMLElement =>
  find(root, '[data-pc-section="content"]', HTMLElement);

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(rootOf(element)).display).toBe('flex');
  const divider = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjDividerHarness);
  return { fixture, host: fixture.componentInstance, divider, element };
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

/** What a CSS custom property resolves to as a colour, read through a probe element. */
function colourOf(property: string): string {
  const probe = document.createElement('div');
  probe.style.borderColor = `var(${property})`;
  probe.style.borderStyle = 'solid';
  document.body.append(probe);
  const colour = getComputedStyle(probe).borderTopColor;
  probe.remove();
  return colour;
}

const centre = (box: DOMRect, axis: 'x' | 'y'): number =>
  axis === 'x' ? box.left + box.width / 2 : box.top + box.height / 2;

/** The documented states for axe (FR-23). */
const STATES: [string, (host: Host) => void][] = [
  ['horizontal without content', () => undefined],
  ...(['left', 'center', 'right'] as const).map((align): [string, (host: Host) => void] => [
    `horizontal with content at ${align}`,
    (host) => {
      host.content.set('Or');
      host.align.set(align);
    },
  ]),
  [
    'vertical without content',
    (host) => {
      host.orientation.set('vertical');
    },
  ],
  ...(['top', 'center', 'bottom'] as const).map((align): [string, (host: Host) => void] => [
    `vertical with content at ${align}`,
    (host) => {
      host.orientation.set('vertical');
      host.content.set('Or');
      host.align.set(align);
    },
  ]),
];

describe('WjDivider', () => {
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
  });

  describe('orientation', () => {
    it('is horizontal when orientation is not given, and says so as a separator', async () => {
      const { element, divider } = await render();
      const root = rootOf(element);

      expect(root.getAttribute('role')).toBe('separator');
      expect(root.getAttribute('aria-orientation')).toBe('horizontal');
      expect(await divider.getOrientation()).toBe('horizontal');
      expect(root.classList.contains('p-divider-horizontal')).toBe(true);
    });

    it('is vertical when orientation is vertical', async () => {
      const { element, divider } = await render('light', (host) => {
        host.orientation.set('vertical');
      });
      const root = rootOf(element);

      expect(root.getAttribute('role')).toBe('separator');
      expect(root.getAttribute('aria-orientation')).toBe('vertical');
      expect(await divider.getOrientation()).toBe('vertical');
      expect(root.classList.contains('p-divider-vertical')).toBe(true);
    });

    it('follows an orientation that changes after creation', async () => {
      const { host, element, divider } = await render();

      host.orientation.set('vertical');
      await expect.poll(() => divider.getOrientation()).toBe('vertical');
      expect(hostOf(element).getAttribute('data-wj-orientation')).toBe('vertical');
      expect(getComputedStyle(hostOf(element)).display).toBe('flex');

      host.orientation.set('horizontal');
      await expect.poll(() => divider.getOrientation()).toBe('horizontal');
      expect(getComputedStyle(hostOf(element)).display).toBe('block');
    });

    it('draws a 1 px content-border line, 16 px clear of its neighbours', async () => {
      const { element } = await render();
      const root = getComputedStyle(rootOf(element));
      const line = getComputedStyle(rootOf(element), '::before');

      expect(root.marginTop).toBe('16px');
      expect(root.marginBottom).toBe('16px');
      expect(line.borderTopWidth).toBe('1px');
      expect(line.borderTopStyle).toBe('solid');
      expect(line.borderTopColor).toBe(colourOf('--wj-content-border-color'));
    });
  });

  describe('align and content', () => {
    it('projects the content into the content part', async () => {
      const { element, divider } = await render('light', (host) => {
        host.content.set('Or');
      });

      expect(await divider.getContentText()).toBe('Or');
      expect(contentOf(element).querySelector('.text')?.textContent).toBe('Or');
      expect(rootOf(element).querySelectorAll('.text').length).toBe(1);
    });

    it('reads an empty content text for a divider with none', async () => {
      const { divider } = await render();

      expect(await divider.getContentText()).toBe('');
    });

    it('pads the content 8 px, on the content surface', async () => {
      const { element } = await render('light', (host) => {
        host.content.set('Or');
      });
      const style = getComputedStyle(contentOf(element));

      expect(style.paddingLeft).toBe('8px');
      expect(style.paddingRight).toBe('8px');
      expect(style.backgroundColor).toBe(colourOf('--wj-divider-content-background'));
    });

    it('renders an unset align centred: the inline style wins over the class', async () => {
      const { element } = await render('light', (host) => {
        host.content.set('Or');
      });
      const root = rootOf(element);

      expect(getComputedStyle(root).justifyContent).toBe('center');
      expect(
        Math.abs(
          centre(contentOf(element).getBoundingClientRect(), 'x') -
            centre(root.getBoundingClientRect(), 'x'),
        ),
      ).toBeLessThan(1);
    });

    it('puts horizontal content at the start for left, in the middle for center, at the end for right', async () => {
      const { host, element } = await render('light', (instance) => {
        instance.content.set('Or');
        instance.align.set('left');
      });
      const root = rootOf(element);
      const edge = (): DOMRect => contentOf(element).getBoundingClientRect();

      await expect.poll(() => edge().left - root.getBoundingClientRect().left).toBe(16);

      host.align.set('center');
      await expect
        .poll(() => Math.abs(centre(edge(), 'x') - centre(root.getBoundingClientRect(), 'x')))
        .toBeLessThan(1);

      host.align.set('right');
      await expect.poll(() => root.getBoundingClientRect().right - edge().right).toBe(16);
    });

    it('puts vertical content at the top for top, in the middle for center, at the bottom for bottom', async () => {
      const { host, element } = await render('light', (instance) => {
        instance.orientation.set('vertical');
        instance.content.set('Or');
        instance.align.set('top');
      });
      const root = rootOf(element);
      const edge = (): DOMRect => contentOf(element).getBoundingClientRect();

      await expect.poll(() => edge().top - root.getBoundingClientRect().top).toBe(8);

      host.align.set('center');
      await expect
        .poll(() => Math.abs(centre(edge(), 'y') - centre(root.getBoundingClientRect(), 'y')))
        .toBeLessThan(1);

      host.align.set('bottom');
      await expect.poll(() => root.getBoundingClientRect().bottom - edge().bottom).toBe(8);
    });

    it('wraps long content and never truncates it', async () => {
      const { element } = await render('light', (host) => {
        host.width.set('9rem');
        host.content.set('Content that is far too long for one line');
      });
      const part = contentOf(element);
      const style = getComputedStyle(part);

      expect(part.getBoundingClientRect().height).toBeGreaterThan(parseFloat(style.fontSize) * 1.5);
      expect(style.textOverflow).toBe('clip');
      expect(part.scrollWidth).toBeLessThanOrEqual(part.clientWidth);
    });
  });

  describe('host box', () => {
    it('is a block with no box of its own, and the root has the same box', async () => {
      const { element } = await render();
      const host = hostOf(element);
      const style = getComputedStyle(host);

      expect(style.display).toBe('block');
      expect(style.padding).toBe('0px');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(host.getBoundingClientRect().toJSON()).toEqual(
        rootOf(element).getBoundingClientRect().toJSON(),
      );
    });

    it('spans the height of its flex row when vertical', async () => {
      const { element } = await render('light', (host) => {
        host.orientation.set('vertical');
      });
      const frame = find(element, '.frame', HTMLElement);
      const host = hostOf(element);
      const root = rootOf(element);

      expect(getComputedStyle(host).display).toBe('flex');
      expect(getComputedStyle(host).padding).toBe('0px');
      expect(frame.getBoundingClientRect().height).toBe(160);
      expect(host.getBoundingClientRect().height).toBe(160);
      expect(root.getBoundingClientRect().height).toBe(160);
      // The root's 16 px side margins sit inside the host.
      expect(host.getBoundingClientRect().width).toBe(root.getBoundingClientRect().width + 32);
    });

    it('draws the vertical line the height of the row, 16 px clear on either side', async () => {
      const { element } = await render('light', (host) => {
        host.orientation.set('vertical');
      });
      const root = rootOf(element);
      const line = getComputedStyle(root, '::before');

      expect(getComputedStyle(root).marginLeft).toBe('16px');
      expect(getComputedStyle(root).marginRight).toBe('16px');
      expect(line.borderLeftWidth).toBe('1px');
      expect(line.borderLeftColor).toBe(colourOf('--wj-content-border-color'));
      expect(parseFloat(line.height)).toBe(160);
    });

    it('stretches every vertical divider to the tallest item of a flex row', async () => {
      const { element } = await renderSmall(RowHost);
      const row = find(element, '.row', HTMLElement).getBoundingClientRect();
      const tall = find(element, '.tall', HTMLElement).getBoundingClientRect();

      expect(tall.height).toBeGreaterThan(40);
      for (const id of ['#first', '#second']) {
        const host = find(element, id, HTMLElement);
        expect(host.getBoundingClientRect().height).toBe(row.height);
        expect(rootOf(host).getBoundingClientRect().height).toBe(row.height);
      }
    });
  });

  describe('pt', () => {
    it('reaches the root and the content, as an object', async () => {
      const { element } = await render('light', (host) => {
        host.content.set('Or');
        host.pt.set({ root: { 'data-probe': 'root' }, content: { 'data-probe': 'content' } });
      });

      expect(find(element, '[data-probe="root"]', HTMLElement).localName).toBe('p-divider');
      expect(
        find(element, '[data-probe="content"]', HTMLElement).getAttribute('data-pc-section'),
      ).toBe('content');
    });

    it('reaches the root and the content, as a function', async () => {
      const { element } = await render('light', (host) => {
        host.content.set('Or');
        host.pt.set({
          root: () => ({ 'data-probe': 'root-fn' }),
          content: () => ({ 'data-probe': 'content-fn' }),
        });
      });

      expect(find(element, '[data-probe="root-fn"]', HTMLElement).localName).toBe('p-divider');
      expect(find(element, '[data-probe="content-fn"]', HTMLElement).textContent.trim()).toBe('Or');
    });

    it('accepts a class string for a part, and follows a changed pt', async () => {
      const { host, element } = await render('light', (instance) => {
        instance.pt.set({ content: 'probe-class' });
      });

      expect(contentOf(element).classList.contains('probe-class')).toBe(true);

      host.pt.set({ content: { 'data-probe': 'later' } });
      await expect.poll(() => contentOf(element).getAttribute('data-probe')).toBe('later');
    });

    it('changes nothing visible when no pt is given', async () => {
      const { element } = await render();

      expect(element.querySelector('[data-probe]')).toBeNull();
    });
  });

  describe('host attributes', () => {
    it('lets an app hide a decorative divider on its host, with no warning', async () => {
      const { element } = await renderSmall(DecorativeHost);

      expect(hostOf(element).getAttribute('aria-hidden')).toBe('true');
      expect(warn).not.toHaveBeenCalled();
      await expectNoAxeViolations(element);
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      await renderSmall(PlainHost, false);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-divider: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(element);
      });
    });
  });

  describe('keyboard', () => {
    it.each<WjDividerOrientation>(['horizontal', 'vertical'])(
      'is no Tab stop (%s): Tab passes from the button before it to the button after it',
      async (orientation) => {
        const { element } = await render('light', (host) => {
          host.orientation.set(orientation);
          host.content.set('Or');
        });
        find(element, '#before', HTMLElement).focus();

        await userEvent.tab();

        expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
        expect(hostOf(element).hasAttribute('tabindex')).toBe(false);
        expect(rootOf(element).hasAttribute('tabindex')).toBe(false);
      },
    );
  });
});
