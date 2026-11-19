import { Component, computed, input } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Checkbox } from '@openng/optimus-ui/checkbox';
import { ColorPicker } from '@openng/optimus-ui/colorpicker';
import { InputText } from '@openng/optimus-ui/inputtext';
import { Knob } from '@openng/optimus-ui/knob';
import { Rating } from '@openng/optimus-ui/rating';
import { Select } from '@openng/optimus-ui/select';
import { Slider } from '@openng/optimus-ui/slider';
import { Textarea } from '@openng/optimus-ui/textarea';
import { ToggleSwitch } from '@openng/optimus-ui/toggleswitch';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../spec-support/axe';
import { provideWeeljack } from './public-api';

const ROOT = document.documentElement;
const INVALID = '--wj-form-field-invalid-border-color';

/** What the wrappers route onto one part when the control (or its field) is invalid. */
function invalidAttributes(
  invalid: boolean,
  name: string,
  extra: Record<string, string> = {},
): Record<string, string | undefined> {
  return { 'aria-label': name, 'aria-invalid': invalid ? 'true' : undefined, ...extra };
}

/** One real Optimus control per gap, with `aria-invalid` on the part its wrapper uses (FR-8). */
@Component({
  selector: 'wj-invalid-looks-host',
  imports: [FormsModule, Rating, Slider, Knob, ColorPicker],
  template: `
    <p-rating [ngModel]="2" [pt]="ratingPt()" />
    <p-slider [ngModel]="40" [pt]="sliderPt()" />
    <p-knob [ngModel]="40" [pt]="knobPt()" />
    <p-colorpicker [ngModel]="'#336699'" [pt]="colorPt()" />
  `,
})
class InvalidLooksHost {
  readonly invalid = input(true);
  protected readonly ratingPt = computed(() => ({
    root: invalidAttributes(this.invalid(), 'Rating', { role: 'radiogroup' }),
  }));
  protected readonly sliderPt = computed(() => ({
    handle: invalidAttributes(this.invalid(), 'Volume'),
  }));
  protected readonly knobPt = computed(() => ({
    svg: invalidAttributes(this.invalid(), 'Level'),
  }));
  protected readonly colorPt = computed(() => ({
    preview: invalidAttributes(this.invalid(), 'Colour'),
  }));
}

/** The invalid controls whose hover rule outranks `.p-invalid` (FR-9), plus a neutral parking spot. */
@Component({
  selector: 'wj-invalid-hover-host',
  imports: [FormsModule, InputText, Textarea, Select, Checkbox, ToggleSwitch],
  template: `
    <div id="neutral" style="width: 40px; height: 20px"></div>
    <input pInputText class="p-invalid" aria-label="Name" />
    <textarea pTextarea class="p-invalid" aria-label="Notes"></textarea>
    <p-select class="p-invalid" [options]="options" ariaLabel="Colour" />
    <p-checkbox class="p-invalid" [binary]="true" ngModel inputId="wj-check" ariaLabel="Agree" />
    <p-toggleswitch class="p-invalid" ngModel ariaLabel="Notify" />
  `,
})
class InvalidHoverHost {
  protected readonly options = ['Red', 'Green'];
}

async function mount<T>(type: new () => T, dark: boolean): Promise<ComponentFixture<T>> {
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(type);
  document.body.appendChild(fixture.nativeElement as HTMLElement);
  ROOT.classList.toggle('wj-dark', dark);
  await fixture.whenStable();
  return fixture;
}

function query(fixture: ComponentFixture<unknown>, selector: string): HTMLElement {
  const found = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(selector);
  if (!found) {
    throw new Error(`no element matches ${selector}`);
  }
  return found;
}

/** A variable's value as the browser computes it for `property`, e.g. `rgb(220, 38, 38)`. */
function resolved(property: 'color' | 'background-color', variable: string): string {
  const probe = document.createElement('div');
  probe.style.setProperty(property, `var(${variable})`);
  document.body.append(probe);
  const value = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return value;
}

/** Resolves once `element`'s colour transitions have ended, so a read sees the final value. */
async function settled<T extends Element>(element: T): Promise<T> {
  getComputedStyle(element).getPropertyValue('color'); // a style read starts any transition
  await expect.poll(() => element.getAnimations().length, { timeout: 2000 }).toBe(0);
  return element;
}

describe('layer styles', () => {
  afterEach(async () => {
    await userEvent.unhover(document.body);
    ROOT.classList.remove('wj-dark');
    document.body.replaceChildren();
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
  });

  describe.each([
    { scheme: 'light', dark: false },
    { scheme: 'dark', dark: true },
  ])('$scheme', ({ dark }) => {
    describe('invalid looks (FR-8)', () => {
      it('turns the stars that are not picked invalid and keeps the picked ones primary', async () => {
        const fixture = await mount(InvalidLooksHost, dark);
        const root = query(fixture, '.p-rating');
        const first = query(fixture, '.p-rating-option-active .p-rating-icon');
        const third = query(
          fixture,
          '.p-rating-option:not(.p-rating-option-active) .p-rating-icon',
        );
        const invalid = resolved('color', INVALID);

        await settled(third);
        expect(root.getAttribute('aria-invalid')).toBe('true');
        expect(getComputedStyle(third).color).toBe(invalid);
        expect(getComputedStyle(first).color).toBe(
          resolved('color', '--wj-rating-icon-active-color'),
        );
        expect(getComputedStyle(first).color).not.toBe(invalid);

        fixture.componentRef.setInput('invalid', false);
        await fixture.whenStable();
        await settled(third);

        expect(getComputedStyle(third).color).toBe(resolved('color', '--wj-rating-icon-color'));
      });

      it('gives the slider handle the invalid ring, at rest and on hover', async () => {
        const fixture = await mount(InvalidLooksHost, dark);
        const handle = query(fixture, '.p-slider-handle');
        const invalid = resolved('background-color', INVALID);

        await settled(handle);
        expect(getComputedStyle(handle).backgroundColor).toBe(invalid);

        await userEvent.hover(handle);
        await expect.poll(() => handle.matches(':hover')).toBe(true);
        await settled(handle);
        expect(getComputedStyle(handle).backgroundColor).toBe(invalid);
        await userEvent.unhover(handle);

        fixture.componentRef.setInput('invalid', false);
        await fixture.whenStable();
        await settled(handle);

        expect(getComputedStyle(handle).backgroundColor).toBe(
          resolved('background-color', '--wj-slider-handle-background'),
        );
      });

      it('draws a 1px invalid ring around the knob', async () => {
        const fixture = await mount(InvalidLooksHost, dark);
        const svg = query(fixture, '.p-knob svg');

        await settled(svg);
        expect(getComputedStyle(svg).boxShadow).toBe(
          `${resolved('color', INVALID)} 0px 0px 0px 1px`,
        );

        fixture.componentRef.setInput('invalid', false);
        await fixture.whenStable();
        await settled(svg);

        expect(getComputedStyle(svg).boxShadow).toBe('none');
      });

      it('gives the colour swatch an invalid inset boundary', async () => {
        const fixture = await mount(InvalidLooksHost, dark);
        const preview = query(fixture, '.p-colorpicker-preview');

        await settled(preview);
        expect(getComputedStyle(preview).boxShadow).toBe(
          `${resolved('color', INVALID)} 0px 0px 0px 1px inset`,
        );

        fixture.componentRef.setInput('invalid', false);
        await fixture.whenStable();
        await settled(preview);

        expect(getComputedStyle(preview).boxShadow).toBe('none');
      });

      it('has no axe violations with all four invalid', async () => {
        const fixture = await mount(InvalidLooksHost, dark);

        await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
      });
    });

    describe('a hovered invalid control (FR-9)', () => {
      const invalid = (): string => resolved('color', INVALID);

      async function hoverBorder(
        fixture: ComponentFixture<unknown>,
        hover: string,
        bordered: string,
        side: 'borderColor' | 'borderTopColor' = 'borderColor',
      ): Promise<void> {
        const target = query(fixture, hover);
        const box = query(fixture, bordered);

        await userEvent.hover(query(fixture, '#neutral'));
        await userEvent.hover(target);
        await expect.poll(() => target.matches(':hover')).toBe(true);
        // A hover transition starts from the resting colour, so wait for it to end before reading.
        await settled(box);
        expect(getComputedStyle(box)[side]).toBe(invalid());
        await userEvent.hover(query(fixture, '#neutral'));
      }

      it('keeps the red border on a text input', async () => {
        const fixture = await mount(InvalidHoverHost, dark);

        await hoverBorder(fixture, 'input.p-inputtext', 'input.p-inputtext');
      });

      it('keeps the red border on a textarea', async () => {
        const fixture = await mount(InvalidHoverHost, dark);

        await hoverBorder(fixture, 'textarea.p-textarea', 'textarea.p-textarea');
      });

      it('keeps the red border on a select', async () => {
        const fixture = await mount(InvalidHoverHost, dark);

        await hoverBorder(fixture, 'p-select', '.p-select');
      });

      it('keeps the red border on a checkbox box', async () => {
        const fixture = await mount(InvalidHoverHost, dark);

        await hoverBorder(fixture, '.p-checkbox-input', '.p-checkbox-box');
      });

      it('keeps the red border on a switch track', async () => {
        const fixture = await mount(InvalidHoverHost, dark);

        await hoverBorder(fixture, '.p-toggleswitch-input', '.p-toggleswitch-slider');
      });

      it('has no axe violations with all five invalid', async () => {
        const fixture = await mount(InvalidHoverHost, dark);

        await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
      });
    });
  });
});
