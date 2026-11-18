/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjIftaLabel, type WjIftaLabelPt } from 'weeljack-ng/iftalabel';
import { WjIftaLabelHarness } from 'weeljack-ng/iftalabel/testing';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';
import { WjPassword } from 'weeljack-ng/password';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';
import { WjTextarea } from 'weeljack-ng/textarea';
import { expectNoAxeViolations } from '../spec-support/axe';

const ROOT = document.documentElement;
const CITIES: WjSelectOption<string>[] = [
  { label: 'Hanoi', value: 'hanoi' },
  { label: 'Da Nang', value: 'danang' },
];

/** A consumer's template: a text input, its label after it and a hint linked by the input. */
@Component({
  selector: 'wj-iftalabel-host',
  imports: [WjIftaLabel, WjInputText, FormsModule],
  template: `
    <button type="button" id="before">Before</button>
    <div id="scope" style="margin-top: 32px; width: 320px">
      <wj-iftalabel [pt]="pt()">
        <input
          wjInputText
          id="email"
          aria-describedby="email-hint"
          [invalid]="invalid()"
          [disabled]="disabled()"
          [(ngModel)]="value"
        />
        <label for="email">{{ label() }}</label>
      </wj-iftalabel>
      <small id="email-hint">We never share it.</small>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly pt = signal<WjIftaLabelPt>(undefined);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly value = signal('');
  readonly label = signal('Email');
}

/** The other three controls, each in its own ifta label, named the way their kind allows. */
@Component({
  selector: 'wj-iftalabel-controls-host',
  imports: [WjIftaLabel, WjTextarea, WjSelect, WjPassword, FormsModule],
  template: `
    <div id="scope" style="margin-top: 32px; width: 320px; display: grid; row-gap: 16px">
      <wj-iftalabel>
        <textarea wjTextarea id="bio" rows="3" [(ngModel)]="bio"></textarea>
        <label for="bio">Bio</label>
      </wj-iftalabel>
      <wj-iftalabel>
        <wj-select [options]="cities" ariaLabelledBy="city-label" [(ngModel)]="city" />
        <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- ariaLabelledBy names the select -->
        <label id="city-label">City</label>
      </wj-iftalabel>
      <wj-iftalabel>
        <wj-password inputId="secret" [feedback]="false" [(ngModel)]="secret" />
        <label for="secret">Password</label>
      </wj-iftalabel>
    </div>
  `,
})
class ControlsHost {
  readonly cities = CITIES;
  readonly bio = signal('');
  readonly city = signal<string | null>(null);
  readonly secret = signal('');
}

/** The mistake `WJ0100` names: ifta labels inside a field. */
@Component({
  selector: 'wj-iftalabel-field-host',
  imports: [WjIftaLabel, WjField, WjInputText],
  template: `
    <wj-field label="Email">
      <wj-iftalabel>
        <input wjInputText id="field-email" />
        <label for="field-email">Email</label>
      </wj-iftalabel>
    </wj-field>
    <wj-field label="Name">
      <wj-iftalabel>
        <input wjInputText id="field-name" />
        <label for="field-name">Name</label>
      </wj-iftalabel>
    </wj-field>
  `,
})
class FieldHost {}

/** The same ifta label with no field around it. */
@Component({
  selector: 'wj-iftalabel-bare-host',
  imports: [WjIftaLabel, WjInputText],
  template: `
    <wj-iftalabel>
      <input wjInputText id="bare" />
      <label for="bare">Email</label>
    </wj-iftalabel>
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

interface Look {
  fontSize: string;
  fontWeight: string;
  transform: string;
  /** The label's offset from the top and start edges of the root it sits in. */
  offsetTop: number;
  offsetLeft: number;
}

/** What a user sees of the label's place: its size, weight and offset inside the root. */
function look(label: HTMLElement): Look {
  const style = getComputedStyle(label);
  const labelBox = label.getBoundingClientRect();
  const rootBox = (label.closest('p-iftalabel') ?? label).getBoundingClientRect();
  return {
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    transform: style.transform,
    offsetTop: labelBox.top - rootBox.top,
    offsetLeft: labelBox.left - rootBox.left,
  };
}

/** The ifta label's place, in every state and for every control: fixed. */
const FIXED_LOOK: Look = {
  fontSize: '12px',
  fontWeight: '400',
  transform: 'none',
  offsetTop: 9,
  offsetLeft: 14,
};

/** What a theme variable resolves to as a colour where `at` sits. */
function colourOf(at: HTMLElement, variable: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${variable})`;
  at.append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}

function colourNow(label: HTMLElement): string {
  return getComputedStyle(label).color;
}

function durationsOf(label: HTMLElement): Set<string> {
  return new Set(
    getComputedStyle(label)
      .transitionDuration.split(',')
      .map((value) => value.trim()),
  );
}

async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

describe('WjIftaLabel', () => {
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
      const root = find(element, 'p-iftalabel');
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const iftaLabel = await loader.getHarness(WjIftaLabelHarness);

      expect(root.querySelector('input#email')).not.toBeNull();
      expect(root.querySelector('label[for="email"]')).not.toBeNull();
      expect(await iftaLabel.getLabel()).toBe('Email');
      expect(await iftaLabel.getLabelTarget()).toBe('email');
      expect(await iftaLabel.getHarness(WjInputTextHarness)).toBeDefined();
    });

    it('finds an ifta label by its label text', async () => {
      const { fixture } = await render(Host);
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(
        await loader.getAllHarnesses(WjIftaLabelHarness.with({ label: 'Email' })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjIftaLabelHarness.with({ label: 'Other' })),
      ).toHaveLength(0);
    });
  });

  describe('states', () => {
    it('sits at the top inside the control while it is empty and unfocused', async () => {
      const { element } = await render(Host);
      const label = labelOf(element, 'Email');
      const labelBox = label.getBoundingClientRect();
      const inputBox = find(element, 'input').getBoundingClientRect();

      expect(look(label)).toEqual(FIXED_LOOK);
      expect(labelBox.top).toBeGreaterThanOrEqual(inputBox.top);
      expect(labelBox.bottom).toBeLessThanOrEqual(inputBox.bottom);
      expect(colourNow(label)).toBe(colourOf(label, '--wj-iftalabel-color'));
    });

    it('pads the control top for the label: a text input is 59 px tall', async () => {
      const { element } = await render(Host);
      const input = find(element, 'input');

      expect(getComputedStyle(input).paddingTop).toBe('24px');
      expect(input.getBoundingClientRect().height).toBe(59);
    });

    it('stays in place and turns the focus colour on focus, then returns on blur', async () => {
      const { element } = await render(Host);
      const label = labelOf(element, 'Email');

      find(element, 'input').focus();
      await expect.poll(() => colourNow(label)).toBe(colourOf(label, '--wj-iftalabel-focus-color'));
      expect(look(label)).toEqual(FIXED_LOOK);

      find(element, 'input').blur();
      await expect.poll(() => colourNow(label)).toBe(colourOf(label, '--wj-iftalabel-color'));
      expect(look(label)).toEqual(FIXED_LOOK);
    });

    it('stays in place with a value written late through ngModel', async () => {
      const { fixture, host, element } = await render(Host);
      const label = labelOf(element, 'Email');

      host.value.set('a@b.co');
      await fixture.whenStable();

      await expect.poll(() => find(element, 'input')).toHaveProperty('value', 'a@b.co');
      expect(look(label)).toEqual(FIXED_LOOK);
      expect(colourNow(label)).toBe(colourOf(label, '--wj-iftalabel-color'));
    });

    it('turns the invalid colour with the control, and back', async () => {
      const { fixture, host, element } = await render(Host);
      const label = labelOf(element, 'Email');
      const valid = colourNow(label);

      host.invalid.set(true);
      await fixture.whenStable();

      await expect
        .poll(() => colourNow(label))
        .toBe(colourOf(label, '--wj-iftalabel-invalid-color'));
      expect(colourNow(label)).not.toBe(valid);
      expect(look(label)).toEqual(FIXED_LOOK);

      host.invalid.set(false);
      await fixture.whenStable();

      await expect.poll(() => colourNow(label)).toBe(valid);
    });

    it('keeps the resting colour and place while disabled', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.disabled.set(true);
      });
      const label = labelOf(element, 'Email');

      await expect.poll(() => find(element, 'input').hasAttribute('disabled')).toBe(true);
      expect(look(label)).toEqual(FIXED_LOOK);
      expect(colourNow(label)).toBe(colourOf(label, '--wj-iftalabel-color'));
    });
  });

  describe('other controls', () => {
    it.each(['bio', 'city', 'secret'] as const)(
      '%s: keeps the label at the top after a value written late through ngModel',
      async (name) => {
        const { fixture, host, element } = await render(ControlsHost);
        const label = labelOf(element, { bio: 'Bio', city: 'City', secret: 'Password' }[name]);
        expect(look(label)).toEqual(FIXED_LOOK);

        if (name === 'bio') host.bio.set('Hello');
        if (name === 'city') host.city.set('hanoi');
        if (name === 'secret') host.secret.set('hunter2');
        await fixture.whenStable();

        if (name === 'bio') {
          await expect.poll(() => find(element, 'textarea')).toHaveProperty('value', 'Hello');
        }
        if (name === 'city') {
          await expect
            .poll(() => find(element, '[role="combobox"]').textContent.trim())
            .toBe('Hanoi');
        }
        if (name === 'secret') {
          await expect
            .poll(() => find(element, 'input[type="password"]'))
            .toHaveProperty('value', 'hunter2');
        }
        expect(look(label)).toEqual(FIXED_LOOK);
        expect(colourNow(label)).toBe(colourOf(label, '--wj-iftalabel-color'));
      },
    );

    it.each([
      ['Bio', 'textarea'],
      ['City', '[role="combobox"]'],
      ['Password', 'input[type="password"]'],
    ])('%s: the control is padded at the top for the label', async (text, control) => {
      const { element } = await render(ControlsHost);
      const label = labelOf(element, text);
      const box = find(label.parentElement ?? element, control).getBoundingClientRect();

      expect(label.getBoundingClientRect().top - box.top).toBeLessThan(24);
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
      const root = find(element, 'p-iftalabel');

      await expect.poll(() => root.getAttribute('data-probe')).toBe('root');
      expect(root.getAttribute('data-host')).toBe('host');
    });

    it('reaches root, as a function', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set(() => ({ root: { 'data-probe': 'fn' } }));
      });

      await expect.poll(() => find(element, 'p-iftalabel').getAttribute('data-probe')).toBe('fn');
    });

    it('keeps the projected control and label in place', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set({ root: 'probe-class' });
      });
      const root = find(element, 'p-iftalabel');

      await expect.poll(() => root.classList.contains('probe-class')).toBe(true);
      expect(root.querySelector('input#email')).not.toBeNull();
      expect(root.querySelector('label[for="email"]')).not.toBeNull();
    });
  });

  describe('layout', () => {
    it('takes the block display of the root it wraps, never contents', async () => {
      const { element } = await render(Host);
      const host = find(element, 'wj-iftalabel');
      const root = find(element, 'p-iftalabel');

      expect(getComputedStyle(host).display).toBe('block');
      expect(host.getBoundingClientRect().toJSON()).toEqual(root.getBoundingClientRect().toJSON());
    });

    it('fills the width the app gives it with a control that has none of its own', async () => {
      const { element } = await render(ControlsHost);

      const widths = ['textarea', 'wj-select', 'wj-password'].map(
        (selector) => find(element, selector).getBoundingClientRect().width,
      );

      expect(widths).toEqual([320, 320, 320]);
      expect(find(element, 'wj-iftalabel').getBoundingClientRect().width).toBe(320);
    });

    it('fills the width with a text input too, and lets an explicit width win', async () => {
      const { fixture, element } = await render(Host);
      const input = find(element, 'input');
      expect(input.getBoundingClientRect().width).toBe(320);

      input.style.width = '200px';
      await fixture.whenStable();

      expect(input.getBoundingClientRect().width).toBe(200);
    });

    it('leaves the label out of the grid: it does not add a row', async () => {
      const { element } = await render(Host);

      expect(find(element, 'wj-iftalabel').getBoundingClientRect().height).toBe(
        find(element, 'input').getBoundingClientRect().height,
      );
    });

    describe('a long label', () => {
      const LONG = 'The address we send your receipt and every later notice to, in full';

      it('stays on one line and is clipped before the end padding', async () => {
        const { fixture, host, element } = await render(Host, 'light', (initial) => {
          initial.label.set(LONG);
        });
        find(element, '#scope').style.width = '200px';
        await fixture.whenStable();
        const label = labelOf(element, LONG);
        const style = getComputedStyle(label);

        expect(style.whiteSpace).toBe('nowrap');
        expect(style.textOverflow).toBe('ellipsis');
        expect(style.overflow).toBe('hidden');
        expect(label.getBoundingClientRect().height).toBe(parseFloat(style.fontSize));
        expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
        expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(
          find(element, 'input').getBoundingClientRect().width - 28,
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
  });

  describe('motion', () => {
    beforeEach(() => {
      document.getElementById('wj-spec-no-motion')?.remove();
    });

    it('names the transitioned property and never transitions all', async () => {
      const { element } = await render(Host);

      const property = getComputedStyle(labelOf(element, 'Email')).transitionProperty;

      expect(property.split(',').map((name) => name.trim())).toEqual(['color']);
    });

    it('lasts 0.2s normally', async () => {
      const { element } = await render(Host);

      expect(durationsOf(labelOf(element, 'Email'))).toEqual(new Set(['0.2s']));
    });

    it('lasts 0s under reduced motion, and the colour changes at once', async () => {
      await emulateReducedMotion(true);
      const { element } = await render(Host);
      const label = labelOf(element, 'Email');

      expect(durationsOf(label)).toEqual(new Set(['0s']));

      find(element, 'input').focus();
      await expect.poll(() => colourNow(label)).toBe(colourOf(label, '--wj-iftalabel-focus-color'));
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
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
        const { fixture, element } = await render(Host, scheme, setup);
        await fixture.whenStable();

        await expectNoAxeViolations(find(element, '#scope'));
      });

      it('has no axe violations: focused', async () => {
        const { element } = await render(Host, scheme);
        const label = labelOf(element, 'Email');
        find(element, 'input').focus();
        await expect
          .poll(() => colourNow(label))
          .toBe(colourOf(label, '--wj-iftalabel-focus-color'));

        await expectNoAxeViolations(find(element, '#scope'));
      });

      it('has no axe violations: textarea, select and password filled', async () => {
        const { fixture, host, element } = await render(ControlsHost, scheme);
        host.bio.set('Hello');
        host.city.set('hanoi');
        host.secret.set('hunter2');
        await fixture.whenStable();
        await expect
          .poll(() => find(element, '[role="combobox"]').textContent.trim())
          .toBe('Hanoi');

        await expectNoAxeViolations(find(element, '#scope'));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab reaches the control, the ifta label is no stop, Shift+Tab goes back', async () => {
      const { element } = await render(Host);
      find(element, '#before').focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, 'input'));

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after'));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, 'input'));
      expect(find(element, 'wj-iftalabel').tabIndex).toBe(-1);
    });

    it('a click where the label sits lands on the control and focuses it', async () => {
      const { element } = await render(Host);
      const label = labelOf(element, 'Email');
      const box = label.getBoundingClientRect();
      const input = find(element, 'input');

      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      expect(hit).toBe(input);

      await userEvent.click(input);

      expect(document.activeElement).toBe(input);
    });
  });

  describe('WJ0100', () => {
    const MESSAGE =
      'WJ0100: wj-iftalabel: it sits inside a wj-field, so its control gets two labels. ' +
      'Use the wj-field label or the in-field label, not both. ' +
      'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0100';

    it('is raised once, with the exact message, for ifta labels inside a wj-field', async () => {
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
        'WJ0001: wj-iftalabel: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });
});
