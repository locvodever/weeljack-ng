import { Component, computed, input, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Checkbox } from '@openng/optimus-ui/checkbox';
import { ColorPicker } from '@openng/optimus-ui/colorpicker';
import { DatePicker } from '@openng/optimus-ui/datepicker';
import { Dock } from '@openng/optimus-ui/dock';
import type { MenuItem } from '@openng/optimus-ui/api';
import { InputText } from '@openng/optimus-ui/inputtext';
import { Knob } from '@openng/optimus-ui/knob';
import { Menubar } from '@openng/optimus-ui/menubar';
import { Paginator } from '@openng/optimus-ui/paginator';
import { Rating } from '@openng/optimus-ui/rating';
import { Select } from '@openng/optimus-ui/select';
import { Slider } from '@openng/optimus-ui/slider';
import { Textarea } from '@openng/optimus-ui/textarea';
import { TieredMenu } from '@openng/optimus-ui/tieredmenu';
import { ToggleButton } from '@openng/optimus-ui/togglebutton';
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

/** Disabled toggle buttons, off and on, with an icon each (FR-10). */
@Component({
  selector: 'wj-disabled-toggle-host',
  imports: [FormsModule, ToggleButton],
  template: `
    <p-togglebutton
      id="off"
      [ngModel]="false"
      [disabled]="true"
      aria-disabled="true"
      onLabel="On"
      offLabel="Off"
      onIcon="pi pi-check"
      offIcon="pi pi-times"
    />
    <p-togglebutton
      id="on"
      [ngModel]="true"
      [disabled]="true"
      aria-disabled="true"
      onLabel="On"
      offLabel="Off"
      onIcon="pi pi-check"
      offIcon="pi pi-times"
    />
  `,
})
class DisabledToggleHost {}

/** An inline date picker whose earlier days cannot be picked (FR-11). */
@Component({
  selector: 'wj-disabled-days-host',
  imports: [DatePicker],
  template: `<p-datepicker [inline]="true" [defaultDate]="bound" [minDate]="bound" />`,
})
class DisabledDaysHost {
  protected readonly bound = new Date(2030, 0, 15);
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'New' },
  { label: 'Open', items: [{ label: 'Recent' }] },
  { label: 'Print' },
];

/** A static tiered menu (FR-12). */
@Component({
  selector: 'wj-tiered-focus-host',
  imports: [TieredMenu],
  template: `<p-tieredmenu [model]="items" />`,
})
class TieredFocusHost {
  protected readonly items = MENU_ITEMS;
}

/** A menubar, at a width that keeps the desktop layout (FR-12). */
@Component({
  selector: 'wj-menubar-focus-host',
  imports: [Menubar],
  template: `<p-menubar [model]="items" breakpoint="0px" />`,
})
class MenubarFocusHost {
  protected readonly items = MENU_ITEMS;
}

/** A pager with a rows-per-page list (FR-15). */
@Component({
  selector: 'wj-rows-per-page-host',
  imports: [Paginator],
  template: `<p-paginator [totalRecords]="50" [rows]="10" [rowsPerPageOptions]="[10, 20]" />`,
})
class RowsPerPageHost {}

/** A dock with an enabled and a disabled tile, in a positioned box (FR-17). */
@Component({
  selector: 'wj-dock-surface-host',
  imports: [Dock],
  template: `
    <div id="neutral" style="width: 40px; height: 20px"></div>
    <div style="position: relative; height: 160px">
      <p-dock [model]="items" position="bottom" ariaLabel="Shortcuts">
        <ng-template #item let-item>
          <span style="display: block; width: 24px; height: 24px">{{ item.label }}</span>
        </ng-template>
      </p-dock>
    </div>
  `,
})
class DockSurfaceHost {
  protected readonly items: MenuItem[] = [{ label: 'A' }, { label: 'B', disabled: true }];
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

/** Every rule below `list`, flattened through `@layer` / `@media` nesting. */
function flatten(list: CSSRuleList): CSSRule[] {
  return Array.from(list).flatMap((rule) =>
    rule instanceof CSSGroupingRule ? [rule, ...flatten(rule.cssRules)] : [rule],
  );
}

/**
 * Widens the shipped reduced-motion rule that holds `fragment` to `all`, in place, so its cascade
 * position is what is tested (the tooltip spec's pattern, never media emulation). Returns the undo.
 */
function widenReducedMotion(fragment: string): () => void {
  const rule = Array.from(document.styleSheets)
    .flatMap((sheet) => flatten(sheet.cssRules))
    .find(
      (candidate): candidate is CSSMediaRule =>
        candidate instanceof CSSMediaRule &&
        candidate.conditionText.includes('prefers-reduced-motion') &&
        candidate.cssText.includes(fragment),
    );
  if (!rule) {
    throw new Error(`the reduced-motion block has no ${fragment} rule`);
  }
  const original = rule.media.mediaText;
  rule.media.mediaText = 'all';
  return () => {
    rule.media.mediaText = original;
  };
}

/** Tabs onto the menu's own list (a bounded walk, as the entry specs do), then presses Arrow Down. */
async function activateFirstItem(role: 'menu' | 'menubar'): Promise<void> {
  for (let tabs = 0; tabs < 3 && document.activeElement?.getAttribute('role') !== role; tabs++) {
    await userEvent.tab();
  }
  await expect.poll(() => document.activeElement?.getAttribute('role')).toBe(role);
  await userEvent.keyboard('{ArrowDown}');
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

    describe('disabled looks (FR-10, FR-11)', () => {
      it('gives a disabled toggle button the disabled tokens at full opacity', async () => {
        const fixture = await mount(DisabledToggleHost, dark);
        const off = query(fixture, 'p-togglebutton#off');
        const icon = off.querySelector<HTMLElement>('.p-togglebutton-icon');
        await settled(off);

        expect(getComputedStyle(off).opacity).toBe('1');
        expect(getComputedStyle(off).cursor).toBe('default');
        expect(getComputedStyle(off).backgroundColor).toBe(
          resolved('background-color', '--wj-togglebutton-disabled-background'),
        );
        expect(getComputedStyle(off).borderTopColor).toBe(
          resolved('color', '--wj-togglebutton-disabled-border-color'),
        );
        expect(getComputedStyle(off).color).toBe(
          resolved('color', '--wj-togglebutton-disabled-color'),
        );
        expect(getComputedStyle(icon ?? off).color).toBe(
          resolved('color', '--wj-togglebutton-icon-disabled-color'),
        );
      });

      it('keeps the picked pill visible on a disabled toggle button', async () => {
        const fixture = await mount(DisabledToggleHost, dark);
        const on = query(fixture, 'p-togglebutton#on');
        const pill = query(fixture, 'p-togglebutton#on .p-togglebutton-content');
        const icon = query(fixture, 'p-togglebutton#on .p-togglebutton-icon');
        await settled(pill);

        expect(getComputedStyle(on).opacity).toBe('1');
        expect(getComputedStyle(pill).backgroundColor).toBe(
          resolved('background-color', '--wj-togglebutton-disabled-color'),
        );
        expect(getComputedStyle(pill).color).toBe(
          resolved('color', '--wj-togglebutton-disabled-background'),
        );
        expect(getComputedStyle(icon).color).toBe(
          resolved('color', '--wj-togglebutton-disabled-background'),
        );
      });

      it('shows a day that cannot be picked in the muted colour at full opacity', async () => {
        const fixture = await mount(DisabledDaysHost, dark);
        const day = query(fixture, '.p-datepicker-day.p-disabled');
        await settled(day);

        expect(getComputedStyle(day).opacity).toBe('1');
        expect(getComputedStyle(day).color).toBe(resolved('color', '--wj-text-muted-color'));
        expect(getComputedStyle(day).cursor).toBe('default');
      });

      it('has no axe violations on disabled toggle buttons', async () => {
        const fixture = await mount(DisabledToggleHost, dark);

        await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
      });

      it('has no axe violations on an inline date picker with days that cannot be picked', async () => {
        const fixture = await mount(DisabledDaysHost, dark);

        await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
      });
    });

    describe('keyboard focus in a menu (FR-12)', () => {
      const ring = (): string => resolved('color', '--wj-focus-ring-color');

      it.each<{ name: string; host: Type<unknown>; role: 'menu' | 'menubar'; item: string }>([
        { name: 'tiered menu', host: TieredFocusHost, role: 'menu', item: 'tieredmenu' },
        { name: 'menubar', host: MenubarFocusHost, role: 'menubar', item: 'menubar' },
      ])('rings the active item of a $name inside its fill', async ({ host, role, item }) => {
        const fixture = await mount(host, dark);

        await activateFirstItem(role);
        const content = query(fixture, `.p-focus > .p-${item}-item-content`);

        await expect.poll(() => getComputedStyle(content).outlineStyle).toBe('solid');
        expect(getComputedStyle(content).outlineWidth).toBe('2px');
        expect(getComputedStyle(content).outlineOffset).toBe('-2px');
        expect(getComputedStyle(content).outlineColor).toBe(ring());
      });

      it('draws no ring after a pointer click', async () => {
        const fixture = await mount(TieredFocusHost, dark);
        const root = fixture.nativeElement as HTMLElement;

        await userEvent.click(query(fixture, '.p-tieredmenu-item-content'));
        await expect.poll(() => root.querySelector('.p-focus')).not.toBeNull();

        const focused = query(fixture, '.p-focus > .p-tieredmenu-item-content');
        expect(getComputedStyle(focused).outlineStyle).toBe('none');
      });
    });

    describe('the dock (FR-17)', () => {
      const FRAME = 'rgb(113, 113, 122)'; // {zinc.500}, the boundary step in both schemes
      const CLEAR = 'rgba(0, 0, 0, 0)';

      it('draws a zinc.500 frame on the card surface', async () => {
        const fixture = await mount(DockSurfaceHost, dark);
        const frame = query(fixture, '.p-dock-list-container');
        await settled(frame);

        expect(getComputedStyle(frame).borderTopColor).toBe(FRAME);
        expect(getComputedStyle(frame).backgroundColor).toBe(
          resolved('background-color', '--wj-content-background'),
        );
      });

      it('fills an enabled tile under the pointer and leaves a disabled one bare', async () => {
        const fixture = await mount(DockSurfaceHost, dark);
        const [enabled, disabled] = Array.from(
          (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.p-dock-item'),
        );
        if (!enabled || !disabled) {
          throw new Error('the dock has fewer than two tiles');
        }
        const fill = resolved('background-color', '--wj-content-hover-background');

        await userEvent.hover(query(fixture, '#neutral'));
        await settled(enabled);
        expect(getComputedStyle(enabled).backgroundColor).toBe(CLEAR);

        await userEvent.hover(enabled);
        await expect.poll(() => enabled.matches(':hover')).toBe(true);
        await settled(enabled);
        expect(getComputedStyle(enabled).backgroundColor).toBe(fill);

        await userEvent.hover(query(fixture, '#neutral'));
        await userEvent.hover(disabled, { force: true });
        await settled(disabled);
        expect(getComputedStyle(disabled).backgroundColor).toBe(CLEAR);
        await userEvent.hover(query(fixture, '#neutral'));
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

describe('menus, motion and text buttons', () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
  });

  it('does not animate the narrow-layout chevron under reduced motion (FR-14)', async () => {
    await mount(TieredFocusHost, false); // loads the tiered menu's styles
    const narrow = document.createElement('div');
    narrow.className = 'p-tieredmenu-mobile';
    narrow.innerHTML =
      '<div class="p-tieredmenu-item"><div class="p-tieredmenu-item-content">' +
      '<span class="p-tieredmenu-submenu-icon"></span></div></div>';
    document.body.append(narrow);
    const icon = narrow.querySelector('.p-tieredmenu-submenu-icon');
    if (!icon) {
      throw new Error('the narrow structure has no indicator');
    }

    expect(getComputedStyle(icon).transitionDuration).toBe('0.2s');
    const restore = widenReducedMotion('p-tieredmenu-submenu-icon');
    try {
      expect(getComputedStyle(icon).transitionDuration).toBe('0s');
    } finally {
      restore();
    }
    expect(getComputedStyle(icon).transitionDuration).toBe('0.2s');
  });

  it('opens and closes the rows-per-page list without animating under reduced motion (FR-15)', async () => {
    const fixture = await mount(RowsPerPageHost, false);
    const probe = document.createElement('div');
    probe.className = 'p-anchored-overlay-enter-active';
    document.body.append(probe);
    const restore = widenReducedMotion('p-anchored-overlay-enter-active');
    try {
      expect(getComputedStyle(probe).animationName).toBe('none');
      probe.className = 'p-anchored-overlay-leave-active';
      expect(getComputedStyle(probe).animationName).toBe('none');

      await userEvent.click(query(fixture, 'p-select'));
      await expect.poll(() => document.querySelector('.p-select-overlay')).not.toBeNull();
      expect(document.querySelector('.p-select-overlay')?.getAnimations()).toEqual([]);

      await userEvent.keyboard('{Escape}');
      await expect.poll(() => document.querySelector('.p-select-overlay')).toBeNull();
    } finally {
      restore();
    }
    probe.className = 'p-anchored-overlay-enter-active';
    expect(getComputedStyle(probe).animationName).toBe('p-animate-anchored-overlay-enter');
  });
});
