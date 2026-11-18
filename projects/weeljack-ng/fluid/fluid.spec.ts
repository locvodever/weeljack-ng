/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjField } from 'weeljack-ng/field';
import { WjFluid, type WjFluidPt } from 'weeljack-ng/fluid';
import { WjFluidHarness } from 'weeljack-ng/fluid/testing';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';
import { WjPassword } from 'weeljack-ng/password';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';
import { expectNoAxeViolations } from '../spec-support/axe';

const ROOT = document.documentElement;
const PLANS: WjSelectOption<string>[] = [
  { label: 'Free', value: 'free' },
  { label: 'Team', value: 'team' },
];

/** A consumer's template: the documented stack, each control a direct child of the fluid. */
@Component({
  selector: 'wj-fluid-host',
  imports: [WjFluid, WjInputText, WjSelect, WjPassword, WjButton],
  template: `
    <button type="button" id="before">Before</button>
    <div id="scope" style="width: 320px">
      <wj-fluid [pt]="pt()" [style.padding]="padding()">
        <input wjInputText aria-label="Name" />
        <wj-select ariaLabel="Plan" [options]="plans" />
        <wj-password ariaLabel="Password" [feedback]="false" />
        <wj-button label="Save" />
      </wj-fluid>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly plans = PLANS;
  readonly pt = signal<WjFluidPt>(undefined);
  readonly padding = signal('');
}

/** Fields inside a fluid, and a nested layout of the app's own. */
@Component({
  selector: 'wj-fluid-layout-host',
  imports: [WjFluid, WjField, WjInputText, WjButton, WjSelect],
  template: `
    <div id="scope" style="width: 320px">
      <wj-button id="bare-button" label="Go" />
      <wj-fluid>
        <wj-field label="Full name">
          <input wjInputText id="layout-name" />
        </wj-field>
        <wj-field label="Plan">
          <wj-select [options]="plans" />
        </wj-field>
        <div id="row" style="display: flex; gap: 8px">
          <input wjInputText id="row-input" aria-label="Short" style="width: 100px" />
          <wj-button id="row-button" label="Go" />
        </div>
        <wj-button id="direct-button" label="Save" />
      </wj-fluid>
    </div>
  `,
})
class LayoutHost {
  readonly plans = PLANS;
}

/** A fluid with nothing inside it. */
@Component({
  selector: 'wj-fluid-empty-host',
  imports: [WjFluid],
  template: `<wj-fluid />`,
})
class EmptyHost {}

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
  expect(find(element, 'input').getBoundingClientRect().height).toBe(44);
  return { fixture, host: fixture.componentInstance, element };
}

function find(element: Element, selector: string): HTMLElement {
  const found = element.querySelector(selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

function widthOf(element: Element, selector: string): number {
  return find(element, selector).getBoundingClientRect().width;
}

describe('WjFluid', () => {
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

  describe('content', () => {
    it('projects the controls inside the Optimus root', async () => {
      const { fixture, element } = await render(Host);
      const root = find(element, 'p-fluid');
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const fluid = await loader.getHarness(WjFluidHarness);

      expect(Array.from(root.children).map((child) => child.localName)).toEqual([
        'input',
        'wj-select',
        'wj-password',
        'wj-button',
      ]);
      expect(await fluid.getHarness(WjInputTextHarness)).toBeDefined();
      expect(await (await fluid.getHarness(WjButtonHarness)).getLabel()).toBe('Save');
    });
  });

  describe('widths', () => {
    it.each([
      ['a text input', 'input[wjInputText]'],
      ['wj-select', 'wj-select'],
      ['the select box', 'wj-select p-select'],
      ['wj-password', 'wj-password'],
      ['the password input', 'wj-password input'],
      ['wj-button', 'wj-button'],
      ['wj-button’s inner button', 'wj-button button'],
    ])('%s spans the 320 px the wrapper is given', async (_name, selector) => {
      const { element } = await render(Host);

      expect(widthOf(element, selector)).toBe(320);
    });

    it('spans the content width of a wrapper with padding', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.padding.set('0 16px');
      });

      expect(widthOf(element, 'p-fluid')).toBe(288);
      for (const selector of ['input', 'wj-select', 'wj-password', 'wj-button button']) {
        expect(widthOf(element, selector)).toBe(288);
      }
    });

    it('follows a narrower wrapper without overflowing it', async () => {
      const { fixture, element } = await render(Host);
      find(element, '#scope').style.width = '200px';
      await fixture.whenStable();

      for (const selector of ['input', 'wj-select', 'wj-password', 'wj-button button']) {
        expect(widthOf(element, selector)).toBe(200);
      }
    });

    it('centres the label of the button that fills its row', async () => {
      const { element } = await render(Host);
      const button = find(element, 'wj-button button');
      const label = find(button, '[data-pc-section="label"]');
      const buttonBox = button.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();

      expect(labelBox.left + labelBox.width / 2).toBeCloseTo(
        buttonBox.left + buttonBox.width / 2,
        0,
      );
      expect(buttonBox.height).toBe(44);
    });

    it('adds no gap of its own: children touch', async () => {
      const { element } = await render(Host);

      expect(getComputedStyle(find(element, 'p-fluid')).rowGap).toBe('normal');
    });

    it('spans a wj-field, whose own control then fills the field', async () => {
      const { element } = await render(LayoutHost);

      expect(widthOf(element, 'wj-field')).toBe(320);
      expect(widthOf(element, '#layout-name')).toBe(320);
      expect(widthOf(element, 'wj-field wj-select p-select')).toBe(320);
    });

    it('spans a direct wj-button that sits among other children', async () => {
      const { element } = await render(LayoutHost);

      expect(widthOf(element, '#direct-button button')).toBe(320);
    });
  });

  describe('the nested-layout boundary', () => {
    it('lets a control in the app’s own flex row keep its own width', async () => {
      const { element } = await render(LayoutHost);

      expect(widthOf(element, '#row')).toBe(320);
      expect(widthOf(element, '#row-input')).toBe(100);
    });

    it('lets a wj-button in the app’s own flex row keep the width it has on its own', async () => {
      const { element } = await render(LayoutHost);
      const alone = widthOf(element, '#bare-button button');

      expect(widthOf(element, '#row-button button')).toBe(alone);
      expect(alone).toBeLessThan(320);
    });
  });

  describe('pt', () => {
    it('reaches host and root, as an object', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set({ root: { 'data-probe': 'root' }, host: { 'data-host': 'host' } });
      });
      const root = find(element, 'p-fluid');

      await expect.poll(() => root.getAttribute('data-probe')).toBe('root');
      expect(root.getAttribute('data-host')).toBe('host');
    });

    it('reaches root, as a function', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set(() => ({ root: { 'data-probe': 'fn' } }));
      });

      await expect.poll(() => find(element, 'p-fluid').getAttribute('data-probe')).toBe('fn');
    });

    it('keeps the projected controls in place', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set({ root: 'probe-class' });
      });
      const root = find(element, 'p-fluid');

      await expect.poll(() => root.classList.contains('probe-class')).toBe(true);
      expect(root.children).toHaveLength(4);
      expect(widthOf(element, 'wj-button button')).toBe(320);
    });
  });

  describe('layout', () => {
    it('takes the block display of the root it wraps, never contents', async () => {
      const { element } = await render(Host);
      const host = find(element, 'wj-fluid');
      const root = find(element, 'p-fluid');

      expect(getComputedStyle(host).display).toBe('block');
      expect(getComputedStyle(root).display).toBe('grid');
      expect(host.getBoundingClientRect().toJSON()).toEqual(root.getBoundingClientRect().toJSON());
    });

    it('is as tall as its children and draws nothing of its own', async () => {
      const { element } = await render(Host);
      const style = getComputedStyle(find(element, 'wj-fluid'));
      const children = ['input', 'wj-select', 'wj-password', 'wj-button'].map(
        (selector) => find(element, selector).getBoundingClientRect().height,
      );

      expect(find(element, 'wj-fluid').getBoundingClientRect().height).toBe(
        children.reduce((sum, height) => sum + height, 0),
      );
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.borderTopWidth).toBe('0px');
    });

    it('has no height with nothing inside it', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(EmptyHost);
      await fixture.whenStable();

      expect(
        find(fixture.nativeElement as HTMLElement, 'wj-fluid').getBoundingClientRect().height,
      ).toBe(0);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it('has no axe violations: the stack of input, select, password and button', async () => {
        const { fixture, element } = await render(Host, scheme);
        await fixture.whenStable();

        await expectNoAxeViolations(find(element, '#scope'));
      });

      it('has no axe violations: fields, a nested row and a button', async () => {
        const { fixture, element } = await render(LayoutHost, scheme);
        await fixture.whenStable();

        await expectNoAxeViolations(find(element, '#scope'));
      });
    });

    it('adds no role and no tabindex of its own', async () => {
      const { element } = await render(Host);

      for (const selector of ['wj-fluid', 'p-fluid']) {
        expect(find(element, selector).getAttribute('role')).toBeNull();
        expect(find(element, selector).tabIndex).toBe(-1);
      }
    });
  });

  describe('keyboard', () => {
    it('Tab order is the children’s: the fluid is no stop, Shift+Tab goes back', async () => {
      const { element } = await render(Host);
      find(element, '#before').focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, 'input'));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '[role="combobox"]'));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, 'wj-password input'));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, 'wj-button button'));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after'));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, 'wj-button button'));
    });
  });

  describe('setup warning', () => {
    it('is silent when provideWeeljack is present', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(EmptyHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(EmptyHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'WJ0001: wj-fluid: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });
});
