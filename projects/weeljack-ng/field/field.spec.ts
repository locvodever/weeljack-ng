import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, Directive, HostAttributeToken, inject, input, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormField, form, required, submit, validate } from '@angular/forms/signals';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';
import { _registerWithField } from 'weeljack-ng/private';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/**
 * A spec-local control: it registers through `_registerWithField` the way a WeeljackNg control
 * does, and writes what it resolves on its element. Like a directive wrapper it reads its
 * registration flags from static attributes: `labelable="false"` and `inline`.
 */
@Directive({
  selector: '[wjProbe]',
  host: {
    '[attr.id]': 'field.id()',
    '[attr.aria-describedby]': 'field.describedBy()',
    '[attr.aria-labelledby]': 'field.labelledBy()',
    '[attr.aria-invalid]': 'field.invalid() ? "true" : null',
  },
})
class Probe {
  readonly probeId = input<string>();
  readonly describedBy = input<string>();
  readonly labelledBy = input<string>();
  readonly invalid = input(false);

  readonly field = _registerWithField({
    entry: 'probe',
    id: this.probeId,
    describedBy: this.describedBy,
    labelledBy: this.labelledBy,
    invalid: this.invalid,
    labelable: inject(new HostAttributeToken('labelable'), { optional: true }) !== 'false',
    inline: inject(new HostAttributeToken('inline'), { optional: true }) !== null,
  });
}

type Mode = 'input' | 'inline' | 'custom' | 'radios' | 'two' | 'plain' | 'none';

/** A consumer's template: one field around whatever `mode` selects. */
@Component({
  selector: 'wj-field-host',
  imports: [WjField, Probe],
  template: `
    <button type="button" id="before">Before</button>
    <div class="stack" [style.width]="width()">
      <wj-field [label]="label()" [hint]="hint()" [error]="error()">
        @switch (mode()) {
          @case ('input') {
            <input
              wjProbe
              [probeId]="probeId()"
              [describedBy]="describedBy()"
              [labelledBy]="labelledBy()"
              [invalid]="invalid()"
            />
          }
          @case ('inline') {
            <input type="checkbox" wjProbe inline />
          }
          @case ('custom') {
            <span
              wjProbe
              labelable="false"
              role="textbox"
              tabindex="0"
              [labelledBy]="labelledBy()"
            ></span>
          }
          @case ('radios') {
            <div>
              <label><input type="radio" name="size" /> Small</label>
              <label><input type="radio" name="size" /> Large</label>
            </div>
          }
          @case ('two') {
            <div>
              <input wjProbe aria-label="First name" />
              <input wjProbe aria-label="Last name" />
            </div>
          }
          @case ('plain') {
            <input aria-label="Plain" />
          }
        }
      </wj-field>
    </div>
    <button type="button" id="after">After</button>
  `,
  // The preset sizes a real checkbox to 24px; the native stand-in is sized to match.
  styles: `
    input[type='checkbox'] {
      width: 24px;
      height: 24px;
      margin: 0;
    }
  `,
})
class Host {
  readonly mode = signal<Mode>('input');
  readonly label = signal('Email');
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly probeId = signal<string | undefined>(undefined);
  readonly describedBy = signal<string | undefined>(undefined);
  readonly labelledBy = signal<string | undefined>(undefined);
  readonly invalid = signal(false);
  readonly width = signal<string | undefined>('24rem');
}

/** A control that appears and disappears inside a field. */
@Component({
  selector: 'wj-field-live-host',
  imports: [WjField, Probe],
  template: `
    <wj-field label="Name" hint="As on your card.">
      @if (first()) {
        <input wjProbe aria-label="First" />
      }
      @if (second()) {
        <input wjProbe aria-label="Second" />
      }
      @if (custom()) {
        <span wjProbe labelable="false" role="textbox" tabindex="0"></span>
      }
    </wj-field>
  `,
})
class LiveHost {
  readonly first = signal(true);
  readonly second = signal(false);
  readonly custom = signal(false);
}

/** Signal forms: a native input bound with `[formField]` inside a field. */
@Component({
  selector: 'wj-field-signal-host',
  imports: [WjField, Probe, FormField],
  template: `
    <form novalidate (submit)="onSubmit($event)">
      <wj-field label="Name" [error]="error()">
        <input wjProbe [formField]="model.name" />
      </wj-field>
      <wj-field label="Nickname">
        <input wjProbe aria-label="Nickname" [formField]="model.nickname" />
      </wj-field>
      <button type="submit">Save</button>
    </form>
  `,
})
class SignalHost {
  readonly error = signal<string | undefined>(undefined);
  readonly value = signal({ name: '', nickname: '' });
  readonly model = form(this.value, (path) => {
    required(path.name, { message: 'Enter a name.' });
    // A validator that gives no message: the field can only turn invalid.
    validate(path.nickname, ({ value }) => (value() === '' ? { kind: 'nickname' } : undefined));
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.model, () => Promise.resolve());
  }
}

/** A real `input[wjInputText]` inside a field, the way an app writes it. */
@Component({
  selector: 'wj-field-real-host',
  imports: [WjField, WjInputText],
  template: `
    <wj-field label="Email" hint="We never share it." [error]="error()">
      <input wjInputText type="email" />
    </wj-field>
  `,
})
class RealControlHost {
  readonly error = signal<string | undefined>(undefined);
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  field: WjFieldHarness;
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
  // A render without the theme's variables would pass axe for the wrong reason: fail loudly.
  expect(getComputedStyle(ROOT).getPropertyValue('--wj-text-color')).not.toBe('');
  return {
    fixture,
    host: fixture.componentInstance,
    field: await TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness),
    element,
  };
}

function query<T extends Element>(element: Element, selector: string, type: new () => T): T {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const fieldOf = (element: HTMLElement): HTMLElement => query(element, 'wj-field', HTMLElement);
const labelOf = (element: HTMLElement): HTMLElement =>
  query(element, '.wj-field-label', HTMLElement);

describe('WjField', () => {
  afterEach(() => {
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('inputs', () => {
    it('label renders the visible text', async () => {
      const { field } = await render((host) => {
        host.label.set('Work email');
      });

      expect(await field.getLabel()).toBe('Work email');
    });

    it('hint renders under the label, and an empty hint shows none', async () => {
      const { field, host, fixture } = await render((h) => {
        h.hint.set('We never share it.');
      });

      expect(await field.getHint()).toBe('We never share it.');

      host.hint.set('');
      await fixture.whenStable();
      expect(await field.getHint()).toBeNull();
    });

    it('error renders as an alert, and an empty error shows none', async () => {
      const { field, host, fixture, element } = await render();

      expect(await field.getError()).toBeNull();
      expect(element.querySelector('[role="alert"]')).toBeNull();

      host.error.set('Enter an email address.');
      await fixture.whenStable();
      expect(await field.getError()).toBe('Enter an email address.');
      expect(query(element, '[role="alert"]', HTMLElement).tagName).toBe('P');

      host.error.set('');
      await fixture.whenStable();
      expect(await field.getError()).toBeNull();
      expect(element.querySelector('[role="alert"]')).toBeNull();
    });

    it('is found by label through the harness', async () => {
      const { fixture } = await render();

      const found = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(
        WjFieldHarness.with({ label: /^Em/ }),
      );

      expect(found).toHaveLength(1);
    });

    it('renders its label, hint and error as text only', async () => {
      const { field, element } = await render((host) => {
        host.label.set(PAYLOAD);
        host.hint.set(PAYLOAD);
        host.error.set(PAYLOAD);
      });

      expect(await field.getLabel()).toBe(PAYLOAD);
      expect(await field.getHint()).toBe(PAYLOAD);
      expect(await field.getError()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('stacked order', () => {
    it('puts label, hint, control, then error in the DOM', async () => {
      const { element } = await render((host) => {
        host.hint.set('Hint');
        host.error.set('Error');
      });

      const order = Array.from(fieldOf(element).querySelectorAll('.wj-field-box > *')).map(
        (child) => child.tagName.toLowerCase(),
      );

      expect(order).toEqual(['label', 'p', 'input', 'p']);
      expect(fieldOf(element).querySelector('p:last-child')?.getAttribute('role')).toBe('alert');
    });

    it('gives the label, hint and error generated ids', async () => {
      const { element } = await render((host) => {
        host.hint.set('Hint');
        host.error.set('Error');
      });

      expect(labelOf(element).id).toMatch(/^wj-field-label-\d+$/);
      expect(query(element, '.wj-field-hint', HTMLElement).id).toMatch(/^wj-field-hint-\d+$/);
      expect(query(element, '.wj-field-error', HTMLElement).id).toMatch(/^wj-field-error-\d+$/);
    });
  });

  describe('a single labelable control', () => {
    it('is named by a label that points at its id', async () => {
      const { element, field } = await render();
      const input = query(element, 'input', HTMLInputElement);
      const label = labelOf(element);

      expect(label.tagName).toBe('LABEL');
      expect(label.getAttribute('for')).toBe(input.id);
      expect(input.id).toMatch(/^wj-probe-\d+$/);
      expect(await field.isGroup()).toBe(false);
      expect(await field.isInline()).toBe(false);
      expect(input.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('adopts the consumer’s id', async () => {
      const { element } = await render((host) => {
        host.probeId.set('email');
      });

      expect(query(element, 'input', HTMLInputElement).id).toBe('email');
      expect(labelOf(element).getAttribute('for')).toBe('email');
    });

    it('moves focus to the control when the label is clicked', async () => {
      const { element } = await render();

      await userEvent.click(labelOf(element));

      expect(document.activeElement).toBe(query(element, 'input', HTMLInputElement));
    });

    it('describes the control with the hint then the error, after the consumer’s ids', async () => {
      const { element, host, fixture } = await render((h) => {
        h.hint.set('Hint');
        h.describedBy.set('mine');
      });
      const input = query(element, 'input', HTMLInputElement);
      const hint = query(element, '.wj-field-hint', HTMLElement).id;

      expect(input.getAttribute('aria-describedby')).toBe(`mine ${hint}`);

      host.error.set('Error');
      await fixture.whenStable();
      const error = query(element, '.wj-field-error', HTMLElement).id;
      expect(input.getAttribute('aria-describedby')).toBe(`mine ${hint} ${error}`);

      host.hint.set('');
      await fixture.whenStable();
      expect(input.getAttribute('aria-describedby')).toBe(`mine ${error}`);
    });

    it('drops aria-describedby when there is nothing to describe', async () => {
      const { element } = await render();

      expect(query(element, 'input', HTMLInputElement).hasAttribute('aria-describedby')).toBe(
        false,
      );
    });

    it('is invalid exactly while the field shows an error', async () => {
      const { element, host, fixture } = await render((h) => {
        h.invalid.set(true);
      });
      const input = query(element, 'input', HTMLInputElement);

      // The control's own state is not shown inside a field.
      expect(input.hasAttribute('aria-invalid')).toBe(false);

      host.error.set('Enter an email address.');
      await fixture.whenStable();
      expect(input.getAttribute('aria-invalid')).toBe('true');

      host.error.set('');
      await fixture.whenStable();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('a single non-labelable control', () => {
    function custom(host: Host): void {
      host.mode.set('custom');
    }

    it('gets a span label and is named through aria-labelledby', async () => {
      const { element, field } = await render(custom);
      const control = query(element, '[role="textbox"]', HTMLElement);
      const label = labelOf(element);

      expect(label.tagName).toBe('SPAN');
      expect(label.hasAttribute('for')).toBe(false);
      expect(control.getAttribute('aria-labelledby')).toBe(label.id);
      expect(await field.isGroup()).toBe(false);
    });

    it('lets a consumer aria-labelledby win', async () => {
      const { element } = await render((host) => {
        custom(host);
        host.labelledBy.set('mine');
      });

      expect(query(element, '[role="textbox"]', HTMLElement).getAttribute('aria-labelledby')).toBe(
        'mine',
      );
    });

    it('moves focus to the control when the span label is clicked', async () => {
      const { element } = await render(custom);

      await userEvent.click(labelOf(element));

      expect(document.activeElement).toBe(query(element, '[role="textbox"]', HTMLElement));
    });
  });

  describe('an inline control', () => {
    function inline(host: Host): void {
      host.mode.set('inline');
      host.label.set('Subscribe');
      host.hint.set('Weekly.');
      host.error.set('Tick to continue.');
    }

    it('orders the DOM control, label, hint, error', async () => {
      const { element, field } = await render(inline);

      const order = Array.from(fieldOf(element).querySelectorAll('.wj-field-box > *')).map(
        (child) => child.tagName.toLowerCase(),
      );

      expect(order).toEqual(['input', 'label', 'p', 'p']);
      expect(await field.isInline()).toBe(true);
      expect(await field.isGroup()).toBe(false);
    });

    it('names the control with a label that points at it', async () => {
      const { element } = await render(inline);

      expect(labelOf(element).getAttribute('for')).toBe(
        query(element, 'input', HTMLInputElement).id,
      );
    });

    it('lays the control in the first column and the text beside it', async () => {
      const { element } = await render(inline);
      const control = query(element, 'input', HTMLInputElement).getBoundingClientRect();
      const label = labelOf(element).getBoundingClientRect();
      const hint = query(element, '.wj-field-hint', HTMLElement).getBoundingClientRect();
      const error = query(element, '.wj-field-error', HTMLElement).getBoundingClientRect();

      expect(label.left).toBeGreaterThanOrEqual(control.right + 8 - 0.5);
      expect(hint.left).toBeCloseTo(label.left, 0);
      expect(error.left).toBeCloseTo(label.left, 0);
      expect(hint.top).toBeGreaterThanOrEqual(label.bottom);
      expect(error.top).toBeGreaterThanOrEqual(hint.bottom);
      // The control sits on the label's first line.
      expect(control.top).toBeLessThan(label.bottom);
    });

    it('sets the inline label in body text, not the stacked label style', async () => {
      const { element } = await render(inline);
      const style = getComputedStyle(labelOf(element));

      expect(style.fontSize).toBe('16px');
      expect(style.fontWeight).toBe('400');
    });

    it('toggles the control when the label is clicked', async () => {
      const { element } = await render(inline);
      const box = query(element, 'input', HTMLInputElement);

      await userEvent.click(labelOf(element));

      expect(box.checked).toBe(true);
    });
  });

  describe('a group', () => {
    it('with zero registered controls has role group named by the span label', async () => {
      const { element, field } = await render((host) => {
        host.mode.set('radios');
        host.label.set('Size');
      });
      const group = fieldOf(element);
      const label = labelOf(element);

      expect(await field.isGroup()).toBe(true);
      expect(group.getAttribute('role')).toBe('group');
      expect(group.getAttribute('aria-labelledby')).toBe(label.id);
      expect(label.tagName).toBe('SPAN');
    });

    it('describes itself with the hint and error ids while they show', async () => {
      const { element, host, fixture } = await render((h) => {
        h.mode.set('radios');
      });
      const group = fieldOf(element);

      expect(group.hasAttribute('aria-describedby')).toBe(false);

      host.hint.set('Pick one.');
      await fixture.whenStable();
      const hint = query(element, '.wj-field-hint', HTMLElement).id;
      expect(group.getAttribute('aria-describedby')).toBe(hint);

      host.error.set('Pick a size.');
      await fixture.whenStable();
      const error = query(element, '.wj-field-error', HTMLElement).id;
      expect(group.getAttribute('aria-describedby')).toBe(`${hint} ${error}`);

      host.hint.set('');
      await fixture.whenStable();
      expect(group.getAttribute('aria-describedby')).toBe(error);
    });

    it('with two registered controls is a group, and each control still merges the ids', async () => {
      const { element, field } = await render((host) => {
        host.mode.set('two');
        host.hint.set('Hint');
        host.error.set('Error');
      });
      const hint = query(element, '.wj-field-hint', HTMLElement).id;
      const error = query(element, '.wj-field-error', HTMLElement).id;

      expect(await field.isGroup()).toBe(true);
      expect(labelOf(element).tagName).toBe('SPAN');
      for (const input of Array.from(element.querySelectorAll('input'))) {
        expect(input.getAttribute('aria-describedby')).toBe(`${hint} ${error}`);
        expect(input.getAttribute('aria-invalid')).toBe('true');
      }
    });

    it('is the mode for a control that does not register', async () => {
      const { field } = await render((host) => {
        host.mode.set('plain');
      });

      expect(await field.isGroup()).toBe(true);
    });

    it('leaves a click on the span label inert', async () => {
      const { element } = await render((host) => {
        host.mode.set('two');
      });

      await userEvent.click(labelOf(element));

      expect(document.activeElement).not.toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('live registration', () => {
    async function renderLive() {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(LiveHost);
      await fixture.whenStable();
      const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);
      return { fixture, host: fixture.componentInstance, field };
    }

    it('switches mode as controls appear and disappear', async () => {
      const { fixture, host, field } = await renderLive();
      const element = fixture.nativeElement as HTMLElement;
      const input = query(element, 'input', HTMLInputElement);

      expect(await field.isGroup()).toBe(false);
      expect(labelOf(element).getAttribute('for')).toBe(input.id);

      host.second.set(true);
      await fixture.whenStable();
      expect(await field.isGroup()).toBe(true);
      expect(labelOf(element).tagName).toBe('SPAN');

      host.first.set(false);
      host.second.set(false);
      await fixture.whenStable();
      expect(await field.isGroup()).toBe(true);
      expect(fieldOf(element).hasAttribute('aria-labelledby')).toBe(true);

      host.custom.set(true);
      await fixture.whenStable();
      const control = query(element, '[role="textbox"]', HTMLElement);
      expect(await field.isGroup()).toBe(false);
      expect(control.getAttribute('aria-labelledby')).toBe(labelOf(element).id);
    });

    it('stops describing a control that left, and keeps the hint on the one that stayed', async () => {
      const { fixture, host } = await renderLive();
      const element = fixture.nativeElement as HTMLElement;
      const hint = query(element, '.wj-field-hint', HTMLElement).id;
      host.second.set(true);
      await fixture.whenStable();

      host.second.set(false);
      await fixture.whenStable();

      expect(element.querySelectorAll('input')).toHaveLength(1);
      expect(query(element, 'input', HTMLInputElement).getAttribute('aria-describedby')).toBe(hint);
    });
  });

  describe('the error source', () => {
    async function renderSignal() {
      TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
      const fixture = TestBed.createComponent(SignalHost);
      await fixture.whenStable();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const fields = await loader.getAllHarnesses(WjFieldHarness);
      const element = fixture.nativeElement as HTMLElement;
      const [name, nickname] = Array.from(element.querySelectorAll('input'));
      if (name === undefined || nickname === undefined) {
        throw new Error('the inputs did not render');
      }
      return { fixture, host: fixture.componentInstance, fields, element, name, nickname };
    }

    it('shows no error before the field is touched', async () => {
      const { fields, name } = await renderSignal();

      expect(await fields[0]?.getError()).toBeNull();
      expect(name.hasAttribute('aria-invalid')).toBe(false);
    });

    it('shows the first error’s message once the control is touched, and clears it when fixed', async () => {
      const { fixture, fields, name } = await renderSignal();

      await userEvent.click(name);
      await userEvent.tab();
      await fixture.whenStable();

      expect(await fields[0]?.getError()).toBe('Enter a name.');
      expect(name.getAttribute('aria-invalid')).toBe('true');

      await userEvent.click(name);
      await userEvent.keyboard('Ada');
      await fixture.whenStable();

      expect(await fields[0]?.getError()).toBeNull();
      expect(name.hasAttribute('aria-invalid')).toBe(false);
    });

    it('shows every error on submit(), without a blur', async () => {
      const { fixture, fields, element } = await renderSignal();

      await userEvent.click(query(element, 'button[type="submit"]', HTMLButtonElement));
      await fixture.whenStable();

      expect(await fields[0]?.getError()).toBe('Enter a name.');
    });

    it('lets the error input win over the form error', async () => {
      const { fixture, host, fields } = await renderSignal();
      host.error.set('Pick another name.');
      await fixture.whenStable();

      expect(await fields[0]?.getError()).toBe('Pick another name.');
    });

    it('turns invalid with no text for a message-less error, and warns WJ0020 once', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { fixture, fields, nickname, element } = await renderSignal();

      await userEvent.click(query(element, 'button[type="submit"]', HTMLButtonElement));
      await fixture.whenStable();

      expect(await fields[1]?.getError()).toBeNull();
      expect(element.querySelectorAll('[role="alert"]')).toHaveLength(1);
      expect(nickname.getAttribute('aria-invalid')).toBe('true');
      const wj0020 = warn.mock.calls.filter(([message]) => String(message).startsWith('WJ0020'));
      expect(wj0020).toHaveLength(1);
      expect(String(wj0020[0]?.[0])).toContain('wj-field');
      expect(String(wj0020[0]?.[0])).toContain('/errors/WJ0020');
    });
  });

  describe('styling', () => {
    it('stretches a control with no width of its own to the field', async () => {
      const { element } = await render();

      const input = query(element, 'input', HTMLInputElement).getBoundingClientRect();

      expect(input.width).toBeCloseTo(fieldOf(element).getBoundingClientRect().width, 0);
    });

    it('keeps the width of a control that has its own', async () => {
      const { element } = await render((host) => {
        host.mode.set('input');
      });
      const input = query(element, 'input', HTMLInputElement);
      input.style.width = '8rem';

      expect(input.getBoundingClientRect().width).toBe(128);
    });

    it('has a block host with no box of its own', async () => {
      const { element } = await render();
      const style = getComputedStyle(fieldOf(element));

      expect(style.display).toBe('block');
      expect(style.paddingTop).toBe('0px');
      expect(style.borderTopWidth).toBe('0px');
    });

    it('stacks with a 4px gap, which --wj-field-gap changes', async () => {
      const { element } = await render((host) => {
        host.hint.set('Hint');
      });
      const box = query(element, '.wj-field-box', HTMLElement);

      expect(getComputedStyle(box).rowGap).toBe('4px');

      fieldOf(element).style.setProperty('--wj-field-gap', '12px');
      expect(getComputedStyle(box).rowGap).toBe('12px');
    });

    it('sits the inline text 8px from the control, which --wj-field-inline-gap changes', async () => {
      const { element } = await render((host) => {
        host.mode.set('inline');
      });
      const box = query(element, '.wj-field-box', HTMLElement);

      expect(getComputedStyle(box).columnGap).toBe('8px');

      fieldOf(element).style.setProperty('--wj-field-inline-gap', '16px');
      expect(getComputedStyle(box).columnGap).toBe('16px');
    });

    it('sets the stacked label in 0.875rem at weight 600 and the hint in the muted colour', async () => {
      const { element } = await render((host) => {
        host.hint.set('Hint');
      });
      const label = getComputedStyle(labelOf(element));
      const hint = getComputedStyle(query(element, '.wj-field-hint', HTMLElement));

      expect([label.fontSize, label.fontWeight]).toEqual(['14px', '600']);
      expect(hint.fontSize).toBe('14px');
      expect(hint.color).not.toBe(label.color);
    });

    it('draws the error in the theme error colour, with a decorative glyph beside the text', async () => {
      const { element } = await render((host) => {
        host.error.set('Enter an email address.');
      });
      const error = query(element, '.wj-field-error', HTMLElement);
      const probe = document.createElement('span');
      probe.style.color = 'var(--wj-error-color)';
      element.append(probe);

      expect(getComputedStyle(error).color).toBe(getComputedStyle(probe).color);
      const glyph = query(error, 'svg', SVGElement);
      expect(glyph.getAttribute('aria-hidden')).toBe('true');
      expect(glyph.getBoundingClientRect().width).toBe(16);
      expect(glyph.getBoundingClientRect().right).toBeLessThanOrEqual(
        query(error, 'span', HTMLElement).getBoundingClientRect().left - 8 + 0.5,
      );
    });

    it('wraps a long unbroken string inside the field instead of widening it', async () => {
      const { element } = await render((host) => {
        host.width.set('10rem');
        host.error.set('a'.repeat(120));
      });

      expect(fieldOf(element).getBoundingClientRect().width).toBe(160);
      expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
    });

    it('shows no required or optional marker', async () => {
      const { element } = await render();

      expect(labelOf(element).textContent.trim()).toBe('Email');
    });
  });

  describe('a real input[wjInputText]', () => {
    it('is named by the label, described by the hint and error, and invalid with the error', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(RealControlHost);
      await fixture.whenStable();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const field = await loader.getHarness(WjFieldHarness);
      const input = await field.getHarness(WjInputTextHarness);
      const label = (fixture.nativeElement as HTMLElement).querySelector('label');

      expect(label?.getAttribute('for')).toBe(await input.getId());
      expect(await field.isGroup()).toBe(false);
      expect((await input.getAriaAttributes()).describedBy).toMatch(/^wj-field-hint-\d+$/);
      expect(await input.isInvalid()).toBe(false);

      fixture.componentInstance.error.set('Enter an email address.');
      await fixture.whenStable();

      expect((await input.getAriaAttributes()).describedBy).toMatch(
        /^wj-field-hint-\d+ wj-field-error-\d+$/,
      );
      expect(await input.isInvalid()).toBe(true);
    });
  });

  describe('keyboard', () => {
    it('adds no tab stop: Tab goes from the button before to the control to the button after', async () => {
      const { element } = await render((host) => {
        host.hint.set('Hint');
        host.error.set('Error');
      });
      query(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(query(element, 'input', HTMLInputElement));

      await userEvent.tab();
      expect(document.activeElement).toBe(query(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(query(element, 'input', HTMLInputElement));
      expect(fieldOf(element).hasAttribute('tabindex')).toBe(false);
    });

    it('never moves focus when an error appears', async () => {
      const { element, host, fixture } = await render();
      const input = query(element, 'input', HTMLInputElement);
      input.focus();

      host.error.set('Enter an email address.');
      await fixture.whenStable();

      expect(document.activeElement).toBe(input);
    });
  });

  describe('accessibility (axe)', () => {
    const STATES: [string, (host: Host) => void][] = [
      ['stacked', () => undefined],
      [
        'with a hint',
        (host) => {
          host.hint.set('We never share it.');
        },
      ],
      [
        'with an error',
        (host) => {
          host.hint.set('We never share it.');
          host.error.set('Enter an email address.');
          host.invalid.set(true);
        },
      ],
      [
        'non-labelable',
        (host) => {
          host.mode.set('custom');
          host.hint.set('Hint');
        },
      ],
      [
        'inline',
        (host) => {
          host.mode.set('inline');
          host.label.set('Subscribe to the newsletter');
          host.hint.set('One email a week.');
          host.error.set('Tick to continue.');
        },
      ],
      [
        'group of zero',
        (host) => {
          host.mode.set('radios');
          host.label.set('Size');
          host.hint.set('Pick one.');
          host.error.set('Pick a size.');
        },
      ],
      [
        'group of two',
        (host) => {
          host.mode.set('two');
          host.label.set('Name');
          host.hint.set('As on your card.');
          host.error.set('Enter both names.');
        },
      ],
    ];

    for (const scheme of ['light', 'dark'] as const) {
      for (const [name, setup] of STATES) {
        it(`${name} has no violations in ${scheme}`, async () => {
          const { element } = await render(setup, scheme);

          await expectNoAxeViolations(fieldOf(element));
        });
      }
    }
  });
});
