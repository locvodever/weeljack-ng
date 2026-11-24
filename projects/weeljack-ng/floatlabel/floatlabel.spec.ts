/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import {
  WjFloatLabel,
  type WjFloatLabelPt,
  type WjFloatLabelVariant,
} from 'weeljack-ng/floatlabel';
import { WjFloatLabelHarness } from 'weeljack-ng/floatlabel/testing';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';
import { WjPassword } from 'weeljack-ng/password';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';
import { WjTextarea } from 'weeljack-ng/textarea';
import { expectNoAxeViolations } from '../spec-support/axe';

const ROOT = document.documentElement;
const VARIANTS: WjFloatLabelVariant[] = ['over', 'in', 'on'];
const CITIES: WjSelectOption<string>[] = [
  { label: 'Hanoi', value: 'hanoi' },
  { label: 'Da Nang', value: 'danang' },
];

/** A consumer's template: a text input, its label after it and a hint linked by the input. */
@Component({
  selector: 'wj-floatlabel-host',
  imports: [WjFloatLabel, WjInputText, FormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <div id="scope" style="margin-top: 32px; width: 320px">
      <wj-floatlabel [variant]="variant()" [pt]="pt()">
        <input
          wjInputText
          id="email"
          aria-describedby="email-hint"
          [attr.placeholder]="placeholder()"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [(ngModel)]="value"
        />
        <label for="email">{{ label() }}</label>
      </wj-floatlabel>
      <small id="email-hint">We never share it.</small>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly variant = signal<WjFloatLabelVariant>('over');
  readonly pt = signal<WjFloatLabelPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly placeholder = signal<string | null>(null);
  readonly value = signal('');
  readonly label = signal('Email');
}

/** The other three controls, each in its own float label, named the way their kind allows. */
@Component({
  selector: 'wj-floatlabel-controls-host',
  imports: [WjFloatLabel, WjTextarea, WjSelect, WjPassword, FormsModule],
  template: `
    <div id="scope" style="margin-top: 32px; width: 320px; display: grid; row-gap: 32px">
      <wj-floatlabel [variant]="variant()">
        <textarea wjTextarea id="bio" rows="3" [(ngModel)]="bio"></textarea>
        <label for="bio">Bio</label>
      </wj-floatlabel>
      <wj-floatlabel [variant]="variant()">
        <wj-select [options]="cities" ariaLabelledBy="city-label" [(ngModel)]="city" />
        <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- ariaLabelledBy names the select -->
        <label id="city-label">City</label>
      </wj-floatlabel>
      <wj-floatlabel [variant]="variant()">
        <wj-password inputId="secret" [feedback]="false" [(ngModel)]="secret" />
        <label for="secret">Password</label>
      </wj-floatlabel>
    </div>
  `,
})
class ControlsHost {
  readonly variant = signal<WjFloatLabelVariant>('over');
  readonly cities = CITIES;
  readonly bio = signal('');
  readonly city = signal<string | null>(null);
  readonly secret = signal('');
}

/** The mistake `WJ0100` names: float labels inside a field. */
@Component({
  selector: 'wj-floatlabel-field-host',
  imports: [WjFloatLabel, WjField, WjInputText],
  template: `
    <wj-field label="Email">
      <wj-floatlabel>
        <input wjInputText id="field-email" />
        <label for="field-email">Email</label>
      </wj-floatlabel>
    </wj-field>
    <wj-field label="Name">
      <wj-floatlabel>
        <input wjInputText id="field-name" />
        <label for="field-name">Name</label>
      </wj-floatlabel>
    </wj-field>
  `,
})
class FieldHost {}

/** The same float label with no field around it. */
@Component({
  selector: 'wj-floatlabel-bare-host',
  imports: [WjFloatLabel, WjInputText],
  template: `
    <wj-floatlabel>
      <input wjInputText id="bare" />
      <label for="bare">Email</label>
    </wj-floatlabel>
  `,
})
class BareHost {}

type Scheme = 'light' | 'dark';

interface Rendered<T> {
  fixture: ComponentFixture<T>;
  host: T;
  element: HTMLElement;
}

/** Renders `type` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function render<T extends object>(
  type: Type<T>,
  scheme: Scheme = 'light',
  setup: (host: T) => void = () => undefined,
): Promise<Rendered<T>> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(type);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  expect(getComputedStyle(find(element, 'label')).position).toBe('absolute');
  return { fixture, host: fixture.componentInstance, element };
}

function find(element: Element, selector: string): HTMLElement {
  const found = element.querySelector(selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

function labelOf(element: Element, text: string): HTMLElement {
  const found = Array.from(element.querySelectorAll('label')).find(
    (label) => label.textContent.trim() === text,
  );
  if (found === undefined) {
    throw new Error(`no label reads ${text}`);
  }
  return found;
}

/** The box a user sees the label in: its resolved position, size and transform. */
function look(label: HTMLElement): { top: string; fontSize: string; transform: string } {
  const style = getComputedStyle(label);
  return { top: style.top, fontSize: style.fontSize, transform: style.transform };
}

/** What a theme variable resolves to as a colour where `at` sits. */
function colourOf(at: HTMLElement, variable: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${variable})`;
  at.append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}

/** Whether the label has floated: the active size, whatever the variant. */
const FLOATED_SIZE = '12px';

function floated(label: HTMLElement): boolean {
  return getComputedStyle(label).fontSize === FLOATED_SIZE;
}

async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

describe('WjFloatLabel', () => {
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

  afterEach(async () => {
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    await emulateReducedMotion(false);
  });

  describe('content', () => {
    it('projects the control and its label inside the Optimus root', async () => {
      const { fixture, element } = await render(Host);
      const root = find(element, 'p-floatlabel');
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const floatLabel = await loader.getHarness(WjFloatLabelHarness);

      expect(root.querySelector('input#email')).not.toBeNull();
      expect(root.querySelector('label[for="email"]')).not.toBeNull();
      expect(await floatLabel.getLabel()).toBe('Email');
      expect(await floatLabel.getLabelTarget()).toBe('email');
      expect(await floatLabel.getHarness(WjInputTextHarness)).toBeDefined();
    });

    it('finds a float label by its label text', async () => {
      const { fixture } = await render(Host);
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(
        await loader.getAllHarnesses(WjFloatLabelHarness.with({ label: 'Email' })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjFloatLabelHarness.with({ label: 'Other' })),
      ).toHaveLength(0);
    });
  });

  describe('variant', () => {
    it('defaults to over: the floated label sits above the control', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.value.set('a@b.co');
      });
      const label = labelOf(element, 'Email');

      await expect.poll(() => look(label)).toMatchObject({ top: '-20px', fontSize: '12px' });
    });

    it('in floats the label inside the control and pads the control top to make room', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.variant.set('in');
        host.value.set('a@b.co');
      });
      const label = labelOf(element, 'Email');

      await expect.poll(() => floated(label)).toBe(true);
      expect(parseFloat(look(label).top)).toBeGreaterThanOrEqual(0);
      expect(getComputedStyle(find(element, 'input')).paddingTop).toBe('24px');
    });

    it('on floats the label onto the border, over the field background', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.variant.set('on');
        host.value.set('a@b.co');
      });
      const label = labelOf(element, 'Email');

      await expect.poll(() => look(label)).toMatchObject({ top: '0px', fontSize: '12px' });
      expect(getComputedStyle(label).backgroundColor).toBe(
        getComputedStyle(find(element, 'input')).backgroundColor,
      );
    });

    it('follows the input when it changes', async () => {
      const { fixture, host, element } = await render(Host, 'light', (initial) => {
        initial.value.set('a@b.co');
      });
      const label = labelOf(element, 'Email');
      await expect.poll(() => look(label).top).toBe('-20px');

      host.variant.set('on');
      await fixture.whenStable();

      await expect.poll(() => look(label).top).toBe('0px');
    });
  });

  describe('states', () => {
    it.each(VARIANTS)(
      '%s: rests inside the control while it is empty and unfocused',
      async (variant) => {
        const { element } = await render(Host, 'light', (host) => {
          host.variant.set(variant);
        });
        const label = labelOf(element, 'Email');
        const input = find(element, 'input');
        const labelBox = label.getBoundingClientRect();
        const inputBox = input.getBoundingClientRect();

        expect(floated(label)).toBe(false);
        expect(labelBox.top).toBeGreaterThanOrEqual(inputBox.top);
        expect(labelBox.bottom).toBeLessThanOrEqual(inputBox.bottom);
        expect(labelBox.left).toBeGreaterThanOrEqual(inputBox.left);
      },
    );

    it.each(VARIANTS)('%s: floats on focus and returns on blur', async (variant) => {
      const { element } = await render(Host, 'light', (host) => {
        host.variant.set(variant);
      });
      const label = labelOf(element, 'Email');

      find(element, 'input').focus();
      await expect.poll(() => floated(label)).toBe(true);
      expect(getComputedStyle(label).color).toBe(colourOf(label, '--wj-floatlabel-focus-color'));

      find(element, 'input').blur();
      await expect.poll(() => floated(label)).toBe(false);
      expect(getComputedStyle(label).color).toBe(colourOf(label, '--wj-floatlabel-color'));
    });

    it.each(VARIANTS)('%s: floats with a value written late through ngModel', async (variant) => {
      const { fixture, host, element } = await render(Host, 'light', (initial) => {
        initial.variant.set(variant);
      });
      const label = labelOf(element, 'Email');
      expect(floated(label)).toBe(false);

      host.value.set('a@b.co');
      await fixture.whenStable();

      await expect.poll(() => floated(label)).toBe(true);
      expect(getComputedStyle(label).color).toBe(colourOf(label, '--wj-floatlabel-active-color'));
    });

    it.each(VARIANTS)('%s: floats while the input has a placeholder', async (variant) => {
      const { element } = await render(Host, 'light', (host) => {
        host.variant.set(variant);
        host.placeholder.set('name@example.com');
      });

      await expect.poll(() => floated(labelOf(element, 'Email'))).toBe(true);
    });

    it.each(VARIANTS)('%s: turns the invalid colour with the control', async (variant) => {
      const { fixture, host, element } = await render(Host, 'light', (initial) => {
        initial.variant.set(variant);
      });
      const label = labelOf(element, 'Email');
      const valid = getComputedStyle(label).color;

      host.invalid.set(true);
      await fixture.whenStable();

      await expect
        .poll(() => getComputedStyle(label).color)
        .toBe(colourOf(label, '--wj-floatlabel-invalid-color'));
      expect(valid).not.toBe(getComputedStyle(label).color);
    });

    it('stays unfloated and keeps the resting colour while disabled and empty', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.disabled.set(true);
      });
      const label = labelOf(element, 'Email');

      await expect.poll(() => find(element, 'input').hasAttribute('disabled')).toBe(true);
      expect(floated(label)).toBe(false);
      expect(getComputedStyle(label).color).toBe(colourOf(label, '--wj-floatlabel-color'));
    });
  });

  describe('other controls', () => {
    it.each(['bio', 'city', 'secret'] as const)(
      '%s: floats on a value written late through ngModel',
      async (name) => {
        const { fixture, host, element } = await render(ControlsHost);
        const label = labelOf(element, { bio: 'Bio', city: 'City', secret: 'Password' }[name]);
        expect(floated(label)).toBe(false);

        if (name === 'bio') host.bio.set('Hello');
        if (name === 'city') host.city.set('hanoi');
        if (name === 'secret') host.secret.set('hunter2');
        await fixture.whenStable();

        await expect.poll(() => floated(label)).toBe(true);
      },
    );

    it.each([
      ['Bio', 'textarea'],
      ['City', '[role="combobox"]'],
      ['Password', 'input[type="password"]'],
    ])('%s: floats on focus', async (text, control) => {
      const { element } = await render(ControlsHost);
      const label = labelOf(element, text);
      const focusable = find(labelOf(element, text).parentElement ?? element, control);

      focusable.focus();

      await expect.poll(() => floated(label)).toBe(true);
    });

    it('rests the textarea label at the top of the box', async () => {
      const { element } = await render(ControlsHost);
      const label = labelOf(element, 'Bio');

      expect(
        label.getBoundingClientRect().top - find(element, 'textarea').getBoundingClientRect().top,
      ).toBeLessThan(24);
    });

    it('names the select through ariaLabelledBy', async () => {
      const { element } = await render(ControlsHost);

      expect(find(element, '[role="combobox"]').getAttribute('aria-labelledby')).toBe('city-label');
    });
  });

  describe('pt', () => {
    it('reaches host and root, as an object', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set({ root: { 'data-probe': 'root' }, host: { 'data-host': 'host' } });
      });
      const root = find(element, 'p-floatlabel');

      await expect.poll(() => root.getAttribute('data-probe')).toBe('root');
      expect(root.getAttribute('data-host')).toBe('host');
    });

    it('reaches root, as a function', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set(() => ({ root: { 'data-probe': 'fn' } }));
      });

      await expect.poll(() => find(element, 'p-floatlabel').getAttribute('data-probe')).toBe('fn');
    });

    it('keeps the projected control and label in place', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set({ root: 'probe-class' });
      });
      const root = find(element, 'p-floatlabel');

      await expect.poll(() => root.classList.contains('probe-class')).toBe(true);
      expect(root.querySelector('input#email')).not.toBeNull();
    });
  });

  describe('layout', () => {
    it('takes the block display of the root it wraps, never contents', async () => {
      const { element } = await render(Host);
      const host = find(element, 'wj-floatlabel');
      const root = find(element, 'p-floatlabel');

      expect(getComputedStyle(host).display).toBe('block');
      expect(host.getBoundingClientRect().toJSON()).toEqual(root.getBoundingClientRect().toJSON());
    });

    it('fills the width the app gives it with a control that has none of its own', async () => {
      const { element } = await render(ControlsHost);

      const widths = ['textarea', 'wj-select', 'wj-password'].map(
        (selector) => find(element, selector).getBoundingClientRect().width,
      );

      expect(widths).toEqual([320, 320, 320]);
      expect(find(element, 'wj-floatlabel').getBoundingClientRect().width).toBe(320);
    });

    it('fills the width with a text input too, and lets an explicit width win', async () => {
      const { fixture, element } = await render(Host);
      const input = find(element, 'input');
      expect(input.getBoundingClientRect().width).toBe(320);

      input.style.width = '200px';
      await fixture.whenStable();

      expect(input.getBoundingClientRect().width).toBe(200);
    });

    describe('a long label', () => {
      const LONG = 'The address we send your receipt and every later notice to, in full';

      it.each(['at rest', 'floated'])('stays on one line and is clipped, %s', async (state) => {
        const { fixture, host, element } = await render(Host, 'light', (initial) => {
          initial.label.set(LONG);
          initial.value.set(state === 'floated' ? 'a@b.co' : '');
        });
        find(element, '#scope').style.width = '200px';
        await fixture.whenStable();
        const label = labelOf(element, LONG);
        await expect.poll(() => floated(label)).toBe(state === 'floated');
        const style = getComputedStyle(label);
        const input = find(element, 'input');

        expect(style.whiteSpace).toBe('nowrap');
        expect(style.textOverflow).toBe('ellipsis');
        expect(style.overflow).toBe('hidden');
        expect(label.getBoundingClientRect().height).toBe(parseFloat(style.fontSize));
        expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
        expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(
          input.getBoundingClientRect().width - 28,
        );
        expect(host.label()).toBe(LONG);
      });

      it('keeps its full text as the name of the control', async () => {
        const { element } = await render(Host, 'light', (initial) => {
          initial.label.set(LONG);
        });
        find(element, '#scope').style.width = '200px';
        const label = labelOf(element, LONG);

        // Clipping is CSS only: the label element, which names the input, still holds every word.
        expect(find(element, 'input')).toHaveProperty('labels.0', label);
        expect(label.textContent.trim()).toBe(LONG);
        await expectNoAxeViolations(find(element, '#scope'));
      });
    });

    it('rests 14 px from the control start, and the in variant makes a 59 px control', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.variant.set('in');
      });

      expect(
        labelOf(element, 'Email').getBoundingClientRect().left -
          find(element, 'input').getBoundingClientRect().left,
      ).toBe(14);
      expect(find(element, 'input').getBoundingClientRect().height).toBe(59);
    });

    it('leaves the label out of the grid: it does not add a row', async () => {
      const { element } = await render(Host);

      expect(find(element, 'wj-floatlabel').getBoundingClientRect().height).toBe(
        find(element, 'input').getBoundingClientRect().height,
      );
    });
  });

  describe('motion', () => {
    beforeEach(() => {
      document.getElementById('wj-spec-no-motion')?.remove();
    });

    it('names the transitioned properties and never transitions all', async () => {
      const { element } = await render(Host);

      const property = getComputedStyle(labelOf(element, 'Email')).transitionProperty;

      expect(property.split(',').map((name) => name.trim())).toEqual([
        'top',
        'transform',
        'font-size',
        'font-weight',
        'color',
        'background',
        'padding',
      ]);
    });

    it('lasts 0.2s normally', async () => {
      const { element } = await render(Host);

      const durations = getComputedStyle(labelOf(element, 'Email')).transitionDuration;

      expect(new Set(durations.split(',').map((value) => value.trim()))).toEqual(new Set(['0.2s']));
    });

    it('lasts 0s under reduced motion, and the label moves at once', async () => {
      await emulateReducedMotion(true);
      const { element } = await render(Host, 'light', (host) => {
        host.value.set('a@b.co');
      });
      const label = labelOf(element, 'Email');

      const durations = getComputedStyle(label).transitionDuration;

      expect(new Set(durations.split(',').map((value) => value.trim()))).toEqual(new Set(['0s']));
      await expect.poll(() => look(label).top).toBe('-20px');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      describe.each(VARIANTS)('%s', (variant) => {
        const states: [string, (host: Host) => void][] = [
          ['at rest', () => undefined],
          [
            'filled',
            (host) => {
              host.value.set('a@b.co');
            },
          ],
          [
            'invalid',
            (host) => {
              host.invalid.set(true);
            },
          ],
          [
            'disabled',
            (host) => {
              host.disabled.set(true);
            },
          ],
        ];

        it.each(states)('has no axe violations: %s', async (_name, setup) => {
          const { fixture, element } = await render(Host, scheme, (host) => {
            host.variant.set(variant);
            setup(host);
          });
          await fixture.whenStable();

          await expectNoAxeViolations(find(element, '#scope'));
        });

        it('has no axe violations: focused', async () => {
          const { element } = await render(Host, scheme, (host) => {
            host.variant.set(variant);
          });
          find(element, 'input').focus();
          await expect.poll(() => floated(labelOf(element, 'Email'))).toBe(true);

          await expectNoAxeViolations(find(element, '#scope'));
        });

        it('has no axe violations: textarea, select and password filled', async () => {
          const { fixture, host, element } = await render(ControlsHost, scheme, (initial) => {
            initial.variant.set(variant);
          });
          host.bio.set('Hello');
          host.city.set('hanoi');
          host.secret.set('hunter2');
          await fixture.whenStable();
          await expect.poll(() => floated(labelOf(element, 'City'))).toBe(true);

          await expectNoAxeViolations(find(element, '#scope'));
        });
      });
    });
  });

  describe('keyboard', () => {
    it('Tab reaches the control, the float label is no stop, Shift+Tab goes back', async () => {
      const { element } = await render(Host);
      find(element, '#before').focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, 'input'));

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after'));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, 'input'));
      expect(find(element, 'wj-floatlabel').tabIndex).toBe(-1);
    });

    it('a click where the resting label is lands on the control and focuses it', async () => {
      const { element } = await render(Host);
      const label = labelOf(element, 'Email');
      const box = label.getBoundingClientRect();
      const input = find(element, 'input');

      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      expect(hit).toBe(input);

      await userEvent.click(input);

      expect(document.activeElement).toBe(input);
      await expect.poll(() => floated(label)).toBe(true);
    });
  });

  describe('WJ0100', () => {
    const MESSAGE =
      'WJ0100: wj-floatlabel: it sits inside a wj-field, so its control gets two labels. ' +
      'Use the wj-field label or the in-field label, not both. ' +
      'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0100';

    it('is raised once, with the exact message, for float labels inside a wj-field', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(FieldHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledExactlyOnceWith(MESSAGE);
    });

    it('is silent outside a field', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'WJ0001: wj-floatlabel: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });
});
