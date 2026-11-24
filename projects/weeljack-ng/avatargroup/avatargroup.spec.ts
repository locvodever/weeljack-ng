import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjAvatar, type WjAvatarSize } from 'weeljack-ng/avatar';
import { WjAvatarHarness } from 'weeljack-ng/avatar/testing';
import { WjAvatarGroup, type WjAvatarGroupPt } from 'weeljack-ng/avatargroup';
import { WjAvatarGroupHarness } from 'weeljack-ng/avatargroup/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

interface Member {
  label: string;
  name: string;
  size?: WjAvatarSize | undefined;
}

const PEOPLE: Member[] = [
  { label: 'AL', name: 'Ana Lima' },
  { label: 'BT', name: 'Bao Tran' },
  { label: 'CH', name: 'Cam Ha' },
  { label: 'DR', name: 'Dev Rao' },
  { label: '+3', name: '3 more people' },
];

const withSize = (size?: WjAvatarSize): Member[] => PEOPLE.map((person) => ({ ...person, size }));

/** A consumer's template: a group of avatars between two native buttons. */
@Component({
  selector: 'wj-avatargroup-host',
  imports: [WjAvatarGroup, WjAvatar],
  template: `
    <div [attr.dir]="dir()" [style.inline-size]="width()">
      <button type="button" id="before">Before</button>
      <wj-avatargroup [pt]="pt()">
        @for (member of members(); track member.label) {
          <wj-avatar
            [label]="member.label"
            [size]="member.size"
            [ariaLabel]="member.name"
            shape="circle"
          />
        }
      </wj-avatargroup>
      <button type="button" id="after">After</button>
    </div>
  `,
})
class Host {
  readonly members = signal<Member[]>(PEOPLE);
  readonly pt = signal<WjAvatarGroupPt>(undefined);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly width = signal<string | undefined>(undefined);
}

/** A consumer who writes aria-* on the host: it is not forwarded. */
@Component({
  selector: 'wj-avatargroup-aria-on-host-host',
  imports: [WjAvatarGroup, WjAvatar],
  template: `<wj-avatargroup aria-label="Team"><wj-avatar label="AL" /></wj-avatargroup>`,
})
class AriaOnHostHost {}

/** A group rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-avatargroup-routed-host',
  imports: [WjAvatarGroup, WjAvatar],
  template: `<wj-avatargroup><wj-avatar label="AL" /></wj-avatargroup>`,
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
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  if (fixture.componentInstance.members().length > 0) {
    expect(find(element, 'p-avatar', HTMLElement).getBoundingClientRect().height).toBeGreaterThan(
      0,
    );
  }
  return { fixture, component: fixture.componentInstance, element };
}

function find<E extends Element>(element: HTMLElement, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const groupOf = (element: HTMLElement): HTMLElement => find(element, 'wj-avatargroup', HTMLElement);

const avatarsOf = (element: HTMLElement): HTMLElement[] =>
  Array.from(element.querySelectorAll('wj-avatar')).filter(
    (found): found is HTMLElement => found instanceof HTMLElement,
  );

/** The item at `index`; a spec that expects one fails loudly instead of reading `undefined`. */
function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`no item at ${String(index)}`);
  }
  return item;
}

const rootOf = (avatar: HTMLElement): HTMLElement => find(avatar, 'p-avatar', HTMLElement);

/** What a CSS value resolves to on the page, such as `var(--wj-avatar-group-offset)` in px. */
function resolved(element: HTMLElement, property: 'margin-inline-start' | 'color', value: string) {
  const probe = document.createElement('div');
  probe.style.setProperty(property, value);
  element.append(probe);
  const result = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return result;
}

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjAvatarGroupHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjAvatarGroupHarness);
}

const OFFSETS: [string, WjAvatarSize | undefined, string, string][] = [
  ['default', undefined, '--wj-avatar-group-offset', '-12px'],
  ['large', 'large', '--wj-avatar-lg-group-offset', '-16px'],
  ['xlarge', 'xlarge', '--wj-avatar-xl-group-offset', '-24px'],
];

describe('WjAvatarGroup', () => {
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

  describe('the joined look (FR-25)', () => {
    describe.each(['ltr', 'rtl'] as const)('%s', (dir) => {
      it.each(OFFSETS)(
        'overlaps each %s avatar onto the one before by the preset offset',
        async (_name, size, token, offset) => {
          const { element } = await render((host) => {
            host.members.set(withSize(size));
            host.dir.set(dir);
          });
          const avatars = avatarsOf(element);

          expect(resolved(element, 'margin-inline-start', `var(${token})`)).toBe(offset);
          expect(getComputedStyle(at(avatars, 0)).marginInlineStart).toBe('0px');
          for (const avatar of avatars.slice(1)) {
            expect(getComputedStyle(avatar).marginInlineStart).toBe(offset);
            // Logical: the same overlap, mirrored. Physical margins swap sides under RTL.
            expect(getComputedStyle(avatar)[dir === 'rtl' ? 'marginRight' : 'marginLeft']).toBe(
              offset,
            );
            expect(getComputedStyle(avatar)[dir === 'rtl' ? 'marginLeft' : 'marginRight']).toBe(
              '0px',
            );
          }
        },
      );

      it(`lays the avatars out as one overlapping row, mirrored for ${dir}`, async () => {
        const { element } = await render((host) => {
          host.dir.set(dir);
        });
        const boxes = avatarsOf(element).map((avatar) => avatar.getBoundingClientRect());

        boxes.slice(1).forEach((box, index) => {
          const before = at(boxes, index);
          expect(box.top).toBe(before.top);
          if (dir === 'ltr') {
            expect(box.left).toBe(before.right - 12);
          } else {
            expect(box.right).toBe(before.left + 12);
          }
        });
      });
    });

    it('takes the default offset for a mixed pair, in either order', async () => {
      const { element } = await render((host) => {
        host.members.set([
          { label: 'AL', name: 'Ana Lima' },
          { label: 'BT', name: 'Bao Tran', size: 'large' },
          { label: 'CH', name: 'Cam Ha' },
          { label: 'DR', name: 'Dev Rao', size: 'xlarge' },
          { label: 'EM', name: 'Eli Mai', size: 'xlarge' },
        ]);
      });
      const margins = avatarsOf(element).map(
        (avatar) => getComputedStyle(avatar).marginInlineStart,
      );

      expect(margins).toEqual(['0px', '-12px', '-12px', '-12px', '-24px']);
    });

    it('puts a 2px ring in the group border colour on every avatar, in both schemes', async () => {
      for (const scheme of ['light', 'dark'] as const) {
        TestBed.resetTestingModule();
        const { element } = await render(undefined, scheme);
        const ring = resolved(element, 'color', 'var(--wj-avatar-group-border-color)');
        const surface = resolved(element, 'color', 'var(--wj-content-background)');

        expect(ring).toBe(surface);
        for (const avatar of avatarsOf(element)) {
          const style = getComputedStyle(rootOf(avatar));
          for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
            expect(style[`border${side}Width`]).toBe('2px');
            expect(style[`border${side}Style`]).toBe('solid');
            expect(style[`border${side}Color`]).toBe(ring);
          }
        }
      }
    });

    it('keeps each avatar at its own size, border included', async () => {
      const { element } = await render((host) => {
        host.members.set([
          { label: 'AL', name: 'Ana Lima' },
          { label: 'BT', name: 'Bao Tran', size: 'large' },
          { label: 'CH', name: 'Cam Ha', size: 'xlarge' },
        ]);
      });

      expect(avatarsOf(element).map((avatar) => avatar.getBoundingClientRect().width)).toEqual([
        32, 48, 64,
      ]);
    });

    it('paints later avatars over earlier ones', async () => {
      const { element } = await render();
      const avatars = avatarsOf(element);
      const [first, second] = [at(avatars, 0), at(avatars, 1)];
      const overlap = second.getBoundingClientRect();
      const x = overlap.left + 2;
      const y = overlap.top + overlap.height / 2;

      expect(first.getBoundingClientRect().right).toBeGreaterThan(x);
      expect(document.elementFromPoint(x, y)?.closest('wj-avatar')).toBe(second);
    });

    it('is a flex host that is vertically centred', async () => {
      const { element } = await render((host) => {
        host.members.set([
          { label: 'AL', name: 'Ana Lima' },
          { label: 'BT', name: 'Bao Tran', size: 'xlarge' },
        ]);
      });
      const boxes = avatarsOf(element).map((avatar) => avatar.getBoundingClientRect());
      const [small, large] = [at(boxes, 0), at(boxes, 1)];

      expect(getComputedStyle(groupOf(element)).display).toBe('flex');
      expect(small.top + small.height / 2).toBe(large.top + large.height / 2);
    });

    it('never wraps or squashes the avatars, and overflows a narrow container unclipped', async () => {
      const { element } = await render((host) => {
        host.width.set('60px');
      });
      const boxes = avatarsOf(element).map((avatar) => avatar.getBoundingClientRect());
      const container = find(element, 'div', HTMLElement).getBoundingClientRect();

      expect(boxes.map((box) => box.width)).toEqual([32, 32, 32, 32, 32]);
      expect(new Set(boxes.map((box) => box.top)).size).toBe(1);
      const last = at(boxes, 4);
      expect(last.right).toBeGreaterThan(container.right);
      expect(getComputedStyle(groupOf(element)).overflow).toBe('visible');
      // The part of the last avatar past the container is still painted, so still hit.
      expect(
        document.elementFromPoint(last.right - 4, last.top + last.height / 2)?.closest('wj-avatar'),
      ).toBe(at(avatarsOf(element), 4));
    });

    it('renders nothing visible and no Tab stop with no avatars', async () => {
      const { element } = await render((host) => {
        host.members.set([]);
      });
      const group = groupOf(element);

      expect(group.getBoundingClientRect().height).toBe(0);
      expect(group.querySelector('[tabindex], button, a, input')).toBeNull();
      expect(group.textContent.trim()).toBe('');
    });

    it('updates the overlap when avatars come and go', async () => {
      const { fixture, component, element } = await render((host) => {
        host.members.set(PEOPLE.slice(0, 1));
      });
      expect(avatarsOf(element)).toHaveLength(1);

      component.members.set(PEOPLE);
      await fixture.whenStable();

      expect(avatarsOf(element)).toHaveLength(5);
      expect(getComputedStyle(at(avatarsOf(element), 4)).marginInlineStart).toBe('-12px');
    });
  });

  describe('pt', () => {
    it('reaches root and host as an object', async () => {
      const { element } = await render((host) => {
        host.pt.set({ root: { 'data-root': 'a' }, host: { 'data-host': 'b' } });
      });
      const part = find(element, 'p-avatargroup', HTMLElement);

      expect(part.getAttribute('data-root')).toBe('a');
      expect(part.getAttribute('data-host')).toBe('b');
    });

    it('reaches root as a function', async () => {
      const { element } = await render((host) => {
        host.pt.set(() => ({ root: () => ({ 'data-probe': 'fn' }) }));
      });

      expect(find(element, 'p-avatargroup', HTMLElement).getAttribute('data-probe')).toBe('fn');
    });

    it('updates when the pt changes', async () => {
      const { fixture, component, element } = await render((host) => {
        host.pt.set({ root: { 'data-root': 'a' } });
      });
      component.pt.set({ root: { 'data-root': 'z' } });
      await fixture.whenStable();

      await expect
        .poll(() => find(element, 'p-avatargroup', HTMLElement).getAttribute('data-root'))
        .toBe('z');
    });
  });

  describe('harness (FR-26)', () => {
    it('returns the avatars as WjAvatarHarnesses, in order', async () => {
      const { fixture } = await render();
      const group = await harnessOf(fixture);
      const avatars = await group.getAvatars();

      expect(avatars).toHaveLength(5);
      for (const avatar of avatars) {
        expect(avatar).toBeInstanceOf(WjAvatarHarness);
      }
      expect(await Promise.all(avatars.map((avatar) => avatar.getLabel()))).toEqual([
        'AL',
        'BT',
        'CH',
        'DR',
        '+3',
      ]);
      expect(await avatars[0]?.getAriaLabel()).toBe('Ana Lima');
      expect(await avatars[4]?.getAriaLabel()).toBe('3 more people');
    });

    it('narrows the avatars by WjAvatarHarnessFilters', async () => {
      const { fixture } = await render();
      const group = await harnessOf(fixture);

      expect(await group.getAvatars({ label: 'CH' })).toHaveLength(1);
      expect(await group.getAvatars({ label: /^[A-D]/ })).toHaveLength(4);
      expect(await group.getAvatars({ label: 'ZZ' })).toHaveLength(0);
    });

    it('counts the avatars, narrowed or not', async () => {
      const { fixture } = await render();
      const group = await harnessOf(fixture);

      expect(await group.getAvatarCount()).toBe(5);
      expect(await group.getAvatarCount({ label: /^\+/ })).toBe(1);
    });

    it('counts none for an empty group, and sees the sizes of the avatars', async () => {
      const { fixture, component } = await render((host) => {
        host.members.set(withSize('large'));
      });
      const group = await harnessOf(fixture);
      const [first] = await group.getAvatars();
      expect(await first?.getSize()).toBe('large');

      component.members.set([]);
      await fixture.whenStable();
      expect(await group.getAvatarCount()).toBe(0);
    });
  });

  describe('safety (FR-8)', () => {
    // The group has no string input: its only input is `pt`, so there is no label, name or URL to
    // carry an HTML or URL payload. What it projects stays the avatar's own: text stays text.
    it('has no string input to bind a payload to; a projected payload label stays text', async () => {
      const { fixture, element } = await render((host) => {
        host.members.set([{ label: PAYLOAD, name: PAYLOAD }]);
      });
      const group = await harnessOf(fixture);
      const [avatar] = await group.getAvatars();

      expect(await avatar?.getLabel()).toBe(PAYLOAD);
      expect(element.querySelector('img, script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-avatargroup: provideWeeljack() is missing from the application providers. ' +
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
        'WJ0003: wj-avatargroup: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Remove it: the group adds no role and no name, so name each avatar ' +
          'instead. Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(find(element, 'p-avatargroup', HTMLElement).hasAttribute('aria-label')).toBe(false);
    });

    it('adds no role and no name, and stays silent when set up', async () => {
      const { element } = await render();
      const part = find(element, 'p-avatargroup', HTMLElement);

      expect(warn).not.toHaveBeenCalled();
      expect(part.hasAttribute('role')).toBe(false);
      expect(part.hasAttribute('aria-label')).toBe(false);
      expect(part.hasAttribute('aria-labelledby')).toBe(false);
      expect(groupOf(element).hasAttribute('role')).toBe(false);
    });
  });

  describe('accessibility', () => {
    const STATES: [string, (host: Host) => void][] = [
      ['basic group', () => undefined],
      [
        'large',
        (host) => {
          host.members.set(withSize('large'));
        },
      ],
      [
        'xlarge',
        (host) => {
          host.members.set(withSize('xlarge'));
        },
      ],
      [
        'rtl',
        (host) => {
          host.dir.set('rtl');
        },
      ],
    ];

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(groupOf(element));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab moves from the button before the group straight to the button after it', async () => {
      const { element } = await render();
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, '#before', HTMLElement));
    });
  });
});
