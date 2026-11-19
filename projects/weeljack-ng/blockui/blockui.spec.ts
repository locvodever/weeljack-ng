/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjBlockUI, type WjBlockUIPt } from 'weeljack-ng/blockui';
import { WjBlockUIHarness } from 'weeljack-ng/blockui/testing';
import { expectNoAxeViolations } from '../spec-support/axe';
import { afterOverlay } from '../spec-support/teardown';
import { FRAMES } from '../spec-support/frames';

const ROOT = document.documentElement;

/** A consumer's template: a control outside a card, the card, and a block UI over either. */
@Component({
  selector: 'wj-blockui-host',
  imports: [WjBlockUI],
  template: `
    <button id="outside" type="button">Outside</button>
    <section #card id="card" aria-label="Profile">
      <button id="inside" type="button">Inside</button>
      <input id="field" aria-label="Name" />
      <div id="own" inert>Own inert</div>
    </section>
    <wj-blockui [blocked]="blocked()" [target]="page() ? undefined : card" [pt]="pt()">
      <p class="message">{{ message() }}</p>
    </wj-blockui>
  `,
  styles: `
    button {
      min-block-size: 44px;
      min-inline-size: 44px;
    }

    #card {
      min-block-size: 8rem;
      padding: 16px;
    }

    .message {
      margin: 0;
      padding: 8px 16px;
      background: var(--wj-content-background);
      border: 1px solid var(--wj-content-border-color);
      border-radius: 12px;
      color: var(--wj-text-color);
    }
  `,
})
class Host {
  readonly blocked = signal(false);
  readonly page = signal(false);
  readonly message = signal('Saving…');
  readonly pt = signal<WjBlockUIPt>(undefined);
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

let current: Rendered | undefined;

const MASK = '.p-blockui';

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const maskEl = (): HTMLElement => find(document, MASK, HTMLElement);
const card = ({ element }: Rendered): HTMLElement => find(element, '#card', HTMLElement);
const byId = ({ element }: Rendered, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

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
  current = {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
  return current;
}

/** Waits until the mask has entered the page as a mask: Optimus has moved and shown it. */
async function covered(): Promise<void> {
  await expect
    .poll(() => document.querySelector('.p-blockui.p-overlay-mask')?.getAttribute('aria-busy'))
    .toBe('true');
}

/** Waits until Optimus has finished the leave: nothing of the mask is shown any more. */
async function uncovered(): Promise<void> {
  await expect.poll(() => document.querySelector('.p-blockui.p-overlay-mask'), FRAMES).toBeNull();
}

async function block({ fixture, component }: Rendered): Promise<void> {
  component.blocked.set(true);
  await fixture.whenStable();
  await covered();
}

async function unblock({ fixture, component }: Rendered): Promise<void> {
  component.blocked.set(false);
  await fixture.whenStable();
  await uncovered();
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjBlockUIHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjBlockUIHarness);

const everyOtherInert = (region: Element, mask: Element): boolean =>
  Array.from(region.children).every((child) => child === mask || child.hasAttribute('inert'));

const center = (box: DOMRect): [number, number] => [
  box.left + box.width / 2,
  box.top + box.height / 2,
];

/** The reduced-motion rule that zeroes the mask's duration, as the root entry ships it. */
function maskMotionRule(): CSSMediaRule {
  const found: CSSMediaRule[] = [];
  const visit = (list: CSSRuleList): void => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSMediaRule && rule.cssText.includes('--wj-mask-transition-duration')) {
        found.push(rule);
      }
      if (rule instanceof CSSGroupingRule) {
        visit(rule.cssRules);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    visit(sheet.cssRules);
  }
  const [rule] = found.filter((media) => media.conditionText.includes('prefers-reduced-motion'));
  if (!rule) {
    throw new Error('the reduced-motion block has no mask rule');
  }
  return rule;
}

describe('WjBlockUI', () => {
  afterEach(() =>
    afterOverlay(
      async () => {
        // A block left on holds the scroll lock, `inert` and `aria-busy` past the fixture: release it.
        if (current?.component.blocked()) {
          await unblock(current);
        }
      },
      () => {
        current = undefined;
        ROOT.classList.remove('wj-dark');
        document.body.style.backgroundColor = '';
      },
    ),
  );

  describe('not blocked', () => {
    it('is a block with no height, and nothing of the mask or its content shows', async () => {
      const rendered = await render();
      const host = find(rendered.element, 'wj-blockui', HTMLElement);
      const message = find(rendered.element, '.message', HTMLElement);

      expect(getComputedStyle(host).display).toBe('block');
      expect(host.getBoundingClientRect().height).toBe(0);
      expect(getComputedStyle(maskEl()).display).toBe('none');
      expect(message.getClientRects()).toHaveLength(0);
      expect(card(rendered).hasAttribute('aria-busy')).toBe(false);
      expect(byId(rendered, 'inside').hasAttribute('inert')).toBe(false);
    });

    it('reports itself through its harness', async () => {
      const { fixture } = await render();
      const harness = await harnessOf(fixture);

      expect(await harness.isBlocked()).toBe(false);
      expect(await harness.isBusy()).toBe(false);
    });
  });

  describe('blocking a target', () => {
    it('covers the target with the mask, rounded like a card, with the content centred', async () => {
      const rendered = await render((host) => {
        host.message.set('Saving…');
      });
      await block(rendered);
      const mask = maskEl();
      const box = card(rendered).getBoundingClientRect();
      const maskBox = mask.getBoundingClientRect();
      const message = find(mask, '.message', HTMLElement);

      expect(card(rendered).contains(mask)).toBe(true);
      expect(getComputedStyle(mask).position).toBe('absolute');
      expect(maskBox.left).toBeCloseTo(box.left, 0);
      expect(maskBox.top).toBeCloseTo(box.top, 0);
      expect(maskBox.width).toBeCloseTo(box.width, 0);
      expect(maskBox.height).toBeCloseTo(box.height, 0);
      expect(getComputedStyle(mask).borderTopLeftRadius).toBe('12px');
      await expect.poll(() => getComputedStyle(mask).backgroundColor).toBe('rgba(0, 0, 0, 0.4)');
      const [mx, my] = center(maskBox);
      const [cx, cy] = center(message.getBoundingClientRect());
      expect(cx).toBeCloseTo(mx, 0);
      expect(cy).toBeCloseTo(my, 0);
    });

    it('makes the region inert and busy, and the harness says so', async () => {
      const rendered = await render();
      await block(rendered);
      const harness = await harnessOf(rendered.fixture);

      expect(card(rendered).getAttribute('aria-busy')).toBe('true');
      expect(byId(rendered, 'inside').hasAttribute('inert')).toBe(true);
      expect(byId(rendered, 'field').hasAttribute('inert')).toBe(true);
      expect(maskEl().hasAttribute('inert')).toBe(false);
      expect(everyOtherInert(card(rendered), maskEl())).toBe(true);
      expect(await harness.isBlocked()).toBe(true);
      expect(await harness.isBusy()).toBe(true);
      expect(await harness.isInert()).toBe(true);
      expect(await harness.getMaskText()).toBe('Saving…');
      // The page outside the region is untouched.
      expect(byId(rendered, 'outside').hasAttribute('inert')).toBe(false);
    });

    it('releases what it set on unblock, and keeps what the app set', async () => {
      const rendered = await render();
      card(rendered).setAttribute('aria-busy', 'false');
      await block(rendered);
      expect(card(rendered).getAttribute('aria-busy')).toBe('true');

      await unblock(rendered);

      expect(byId(rendered, 'inside').hasAttribute('inert')).toBe(false);
      expect(byId(rendered, 'field').hasAttribute('inert')).toBe(false);
      expect(byId(rendered, 'own').hasAttribute('inert')).toBe(true);
      expect(card(rendered).getAttribute('aria-busy')).toBe('false');
      const harness = await harnessOf(rendered.fixture);
      expect(await harness.isBlocked()).toBe(false);
    });

    it('removes aria-busy it added when the app had none', async () => {
      const rendered = await render();
      await block(rendered);
      await unblock(rendered);

      expect(card(rendered).hasAttribute('aria-busy')).toBe(false);
    });

    it('blocks again after an unblock, and its text follows the app', async () => {
      const rendered = await render();
      await block(rendered);
      await unblock(rendered);
      rendered.component.message.set('Saved');
      await block(rendered);

      expect(card(rendered).getAttribute('aria-busy')).toBe('true');
      expect(byId(rendered, 'inside').hasAttribute('inert')).toBe(true);
      expect(await (await harnessOf(rendered.fixture)).getMaskText()).toBe('Saved');
    });

    it('renders an HTML payload as text', async () => {
      const payload = '<img src=x onerror="window.name=\'pwned\'">';
      const rendered = await render((host) => {
        host.message.set(payload);
      });
      await block(rendered);

      expect(maskEl().querySelector('img')).toBeNull();
      expect(await (await harnessOf(rendered.fixture)).getMaskText()).toBe(payload);
    });

    it('takes no Escape: it is not on the overlay stack', async () => {
      const rendered = await render();
      await block(rendered);

      await userEvent.keyboard('{Escape}');
      await rendered.fixture.whenStable();

      expect(rendered.component.blocked()).toBe(true);
      expect(maskEl().getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('blocking the page', () => {
    it('covers the viewport, locks the scroll and makes the rest of the page inert and busy', async () => {
      const rendered = await render((host) => {
        host.page.set(true);
      });
      await block(rendered);
      const mask = maskEl();
      const harness = await harnessOf(rendered.fixture);

      expect(mask.parentElement).toBe(document.body);
      expect(mask.classList.contains('p-blockui-mask-document')).toBe(true);
      expect(getComputedStyle(mask).position).toBe('fixed');
      const [vx, vy] = center(new DOMRect(0, 0, window.innerWidth, window.innerHeight));
      const [cx, cy] = center(find(mask, '.message', HTMLElement).getBoundingClientRect());
      expect(cx).toBeCloseTo(vx, 0);
      expect(cy).toBeCloseTo(vy, 0);
      expect(document.body.classList.contains('p-overflow-hidden')).toBe(true);
      expect(document.body.getAttribute('aria-busy')).toBe('true');
      expect(everyOtherInert(document.body, mask)).toBe(true);
      expect(mask.hasAttribute('inert')).toBe(false);
      expect(await harness.isBlocked()).toBe(true);
      expect(await harness.isBusy()).toBe(true);
      expect(await harness.isInert()).toBe(true);
    });

    it('releases the scroll lock and every attribute on unblock', async () => {
      const rendered = await render((host) => {
        host.page.set(true);
      });
      await block(rendered);
      await unblock(rendered);

      expect(document.body.classList.contains('p-overflow-hidden')).toBe(false);
      expect(document.body.hasAttribute('aria-busy')).toBe(false);
      expect(document.querySelector('body > [inert]')).toBeNull();
      expect(document.querySelector('.p-blockui.p-overlay-mask')).toBeNull();
    });
  });

  describe('keyboard', () => {
    it('Tab reaches the card when it is not blocked (control)', async () => {
      const rendered = await render();
      byId(rendered, 'outside').focus();

      await userEvent.tab();

      expect(document.activeElement).toBe(byId(rendered, 'inside'));
    });

    it('Tab and Shift+Tab skip the region while it is blocked', async () => {
      const rendered = await render();
      byId(rendered, 'outside').focus();
      await block(rendered);
      byId(rendered, 'outside').focus();

      await userEvent.tab();
      expect(card(rendered).contains(document.activeElement)).toBe(false);
      await userEvent.tab({ shift: true });
      expect(card(rendered).contains(document.activeElement)).toBe(false);
      await userEvent.tab();
      expect(card(rendered).contains(document.activeElement)).toBe(false);
    });

    it('Tab reaches nothing on the page while the page is blocked', async () => {
      const rendered = await render((host) => {
        host.page.set(true);
      });
      byId(rendered, 'outside').focus();
      await block(rendered);

      await userEvent.tab();
      await userEvent.tab();

      expect(rendered.element.contains(document.activeElement)).toBe(false);
    });

    it('gives focus back to the element that had it once unblocked', async () => {
      const rendered = await render();
      byId(rendered, 'inside').focus();
      await block(rendered);
      // The region went inert: the browser moves focus off it on its next frame.
      await expect.poll(() => card(rendered).contains(document.activeElement)).toBe(false);

      await unblock(rendered);

      expect(document.activeElement).toBe(byId(rendered, 'inside'));
    });

    it('gives focus back after the page was blocked', async () => {
      const rendered = await render((host) => {
        host.page.set(true);
      });
      byId(rendered, 'outside').focus();
      await block(rendered);
      await expect.poll(() => document.activeElement).not.toBe(byId(rendered, 'outside'));

      await unblock(rendered);

      expect(document.activeElement).toBe(byId(rendered, 'outside'));
    });

    it('leaves focus alone when it was never in the region', async () => {
      const rendered = await render();
      byId(rendered, 'outside').focus();
      await block(rendered);
      expect(document.activeElement).toBe(byId(rendered, 'outside'));

      await unblock(rendered);

      expect(document.activeElement).toBe(byId(rendered, 'outside'));
    });

    it('does not steal focus the user put elsewhere, and survives a removed element', async () => {
      const rendered = await render();
      byId(rendered, 'inside').focus();
      await block(rendered);
      byId(rendered, 'inside').remove();
      byId(rendered, 'outside').focus();

      await unblock(rendered);

      expect(document.activeElement).toBe(byId(rendered, 'outside'));
    });
  });

  describe('motion', () => {
    it('lets the mask leave under reduced motion: its animation ends at once', async () => {
      const rendered = await render();
      await block(rendered);
      const mask = maskEl();
      const ended = vi.fn();
      mask.addEventListener('animationend', ended);

      const rule = maskMotionRule();
      // Control: with no reduced-motion preference the mask keeps Aura's 0.3s.
      expect(getComputedStyle(mask).getPropertyValue('--wj-mask-transition-duration')).toBe('0.3s');
      const original = rule.media.mediaText;
      try {
        // Widen the real rule in place, so the shipped cascade order is what is tested.
        rule.media.mediaText = 'all';
        expect(getComputedStyle(mask).getPropertyValue('--wj-mask-transition-duration')).toBe('0s');
        rendered.component.blocked.set(false);
        await rendered.fixture.whenStable();
        await expect.poll(() => getComputedStyle(mask).display, FRAMES).toBe('none');
        expect(ended).toHaveBeenCalled();
      } finally {
        rule.media.mediaText = original;
        mask.removeEventListener('animationend', ended);
      }
      await uncovered();
      expect(card(rendered).hasAttribute('aria-busy')).toBe(false);
    });

    it('lets the mask leave of the page under reduced motion too', async () => {
      const rendered = await render((host) => {
        host.page.set(true);
      });
      await block(rendered);
      const rule = maskMotionRule();
      const original = rule.media.mediaText;
      try {
        rule.media.mediaText = 'all';
        rendered.component.blocked.set(false);
        await rendered.fixture.whenStable();
        // Optimus takes the page's mask out of the body when it has left.
        await expect.poll(() => document.querySelector(MASK), FRAMES).toBeNull();
      } finally {
        rule.media.mediaText = original;
      }
      expect(document.body.classList.contains('p-overflow-hidden')).toBe(false);
      expect(document.body.hasAttribute('aria-busy')).toBe(false);
    });
  });

  describe('destroying while blocked', () => {
    it('removes the mask from the target and releases its attributes', async () => {
      const rendered = await render();
      await block(rendered);
      const target = card(rendered);

      rendered.fixture.destroy();
      current = undefined;

      expect(document.querySelector(MASK)).toBeNull();
      expect(target.hasAttribute('aria-busy')).toBe(false);
      expect(target.querySelector('#inside')?.hasAttribute('inert')).toBe(false);
      expect(target.querySelector('#own')?.hasAttribute('inert')).toBe(true);
    });

    it('releases the scroll lock, the mask and the attributes of the page', async () => {
      const rendered = await render((host) => {
        host.page.set(true);
      });
      await block(rendered);
      expect(document.body.classList.contains('p-overflow-hidden')).toBe(true);

      rendered.fixture.destroy();
      current = undefined;

      expect(document.querySelector(MASK)).toBeNull();
      expect(document.body.classList.contains('p-overflow-hidden')).toBe(false);
      expect(document.body.hasAttribute('aria-busy')).toBe(false);
      expect(document.querySelector('body > [inert]')).toBeNull();
    });
  });

  describe('pt', () => {
    const attributes = (mask: HTMLElement): string[] => [
      mask.getAttribute('data-host') ?? '',
      mask.getAttribute('data-root') ?? '',
    ];

    for (const form of ['object', 'function'] as const) {
      it(`lands host, root and the hook with the ${form} form, across cycles`, async () => {
        const parts: WjBlockUIPt = {
          host: { 'data-host': 'h' },
          root: { 'data-root': 'r' },
        };
        const rendered = await render((host) => {
          host.pt.set(form === 'object' ? parts : () => parts);
        });
        const hook = find(rendered.element, 'wj-blockui', HTMLElement).getAttribute(
          'data-wj-blockui',
        );
        expect(hook).toMatch(/^wj-blockui-\d+$/);
        expect(attributes(maskEl())).toEqual(['h', 'r']);

        for (let cycle = 0; cycle < 2; cycle++) {
          await block(rendered);
          expect(attributes(maskEl())).toEqual(['h', 'r']);
          expect(maskEl().getAttribute('data-wj-blockui')).toBe(hook);
          await unblock(rendered);
          expect(attributes(maskEl())).toEqual(['h', 'r']);
          expect(maskEl().getAttribute('data-wj-blockui')).toBe(hook);
        }
      });
    }

    it('keeps the hook when the app sets none, and makes a harness per block UI', async () => {
      const rendered = await render();
      await block(rendered);

      expect(maskEl().getAttribute('data-wj-blockui')).toMatch(/^wj-blockui-\d+$/);
    });
  });

  for (const scheme of ['light', 'dark'] as const) {
    describe(`axe, ${scheme}`, () => {
      it('has no violations when not blocked', async () => {
        await render(undefined, scheme);

        await expectNoAxeViolations();
      });

      it('has no violations while blocking a target', async () => {
        const rendered = await render(undefined, scheme);
        await block(rendered);
        await expect.poll(() => getComputedStyle(maskEl()).backgroundColor).toMatch(/0\.[46]\)$/);

        await expectNoAxeViolations();
      });

      it('has no violations while blocking the page', async () => {
        const rendered = await render((host) => {
          host.page.set(true);
        }, scheme);
        await block(rendered);
        await expect.poll(() => getComputedStyle(maskEl()).backgroundColor).toMatch(/0\.[46]\)$/);

        await expectNoAxeViolations();
      });
    });
  }
});
