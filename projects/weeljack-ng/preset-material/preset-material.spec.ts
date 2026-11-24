import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AutoComplete } from '@openng/optimus-ui/autocomplete';
import { Optimus } from '@openng/optimus-ui/config';
import { ToggleButton } from '@openng/optimus-ui/togglebutton';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack, type WjMenuItem, type WjPreset, type WjTreeNode } from 'weeljack-ng';
import {
  WjAccordion,
  WjAccordionContent,
  WjAccordionHeader,
  WjAccordionPanel,
} from 'weeljack-ng/accordion';
import { WjAutoComplete } from 'weeljack-ng/autocomplete';
import { WjButton } from 'weeljack-ng/button';
import { WjCarousel, WjCarouselItemSlot } from 'weeljack-ng/carousel';
import { WjCascadeSelect, type WjCascadeSelectOption } from 'weeljack-ng/cascadeselect';
import { WjCheckbox } from 'weeljack-ng/checkbox';
import { WjColorPicker } from 'weeljack-ng/colorpicker';
import { WjDatePicker } from 'weeljack-ng/datepicker';
import { WjFieldset } from 'weeljack-ng/fieldset';
import { WjInputGroup } from 'weeljack-ng/inputgroup';
import { WjInputNumber } from 'weeljack-ng/inputnumber';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjKnob } from 'weeljack-ng/knob';
import { WjListbox } from 'weeljack-ng/listbox';
import { WjMegaMenu, type WjMegaMenuItem } from 'weeljack-ng/megamenu';
import { WjMenu } from 'weeljack-ng/menu';
import { WjMenubar } from 'weeljack-ng/menubar';
import { WjMessage } from 'weeljack-ng/message';
import { WjMultiSelect } from 'weeljack-ng/multiselect';
import { WjPanelMenu } from 'weeljack-ng/panelmenu';
import { wjMaterial } from 'weeljack-ng/preset-material';
import { wjNoir } from 'weeljack-ng/preset-noir';
import { WjRadioButton } from 'weeljack-ng/radiobutton';
import { WjRating } from 'weeljack-ng/rating';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';
import { WjSlider } from 'weeljack-ng/slider';
import { WjStep, WjStepList, WjStepPanel, WjStepPanels, WjStepper } from 'weeljack-ng/stepper';
import { WjColumn, WjTable } from 'weeljack-ng/table';
import { WjTab, WjTabList, WjTabPanel, WjTabPanels, WjTabs } from 'weeljack-ng/tabs';
import { WjTag } from 'weeljack-ng/tag';
import { WjTextarea } from 'weeljack-ng/textarea';
import { WjTheme } from 'weeljack-ng/theme';
import { WjTieredMenu } from 'weeljack-ng/tieredmenu';
import { WjToggleButton } from 'weeljack-ng/togglebutton';
import { WjToggleSwitch } from 'weeljack-ng/toggleswitch';
import { WjTree } from 'weeljack-ng/tree';
import { WjTreeSelect } from 'weeljack-ng/treeselect';
import { describePresetContract } from '../spec-support/preset-contract';
import { expectNoAxeViolations, runAxe } from '../spec-support/axe';
import { capture, expectPage, styleSheets, type Page } from '../spec-support/theme-snapshot';

/*
 * `wjMaterial` (ADR 0010, PRD FR-14): the shared preset contract, then what only Material needs:
 *  - case 6 over Material's own css blocks, and the stale-sheet cleanup in both directions;
 *  - FR-13: `wjLayerStyles`' invalid, disabled and menu-focus rules hold over Material's css;
 *  - FR-10: the 4 px radius;
 *  - FR-12: the three `_css` cases (no halo, the filled variant's ring, the checkmark).
 * Every `-style` read waits for the transitions to end, and every key press waits for focus.
 */

describePresetContract('wjMaterial', wjMaterial);

const ROOT = document.documentElement;
const SHEET_SELECTOR = 'style[data-optimus-style-id]';
const INVALID = '--wj-form-field-invalid-border-color';
const SCHEMES = [
  { scheme: 'light', dark: false },
  { scheme: 'dark', dark: true },
] as const;

const FRUIT: WjSelectOption<string>[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Pear', value: 'pear' },
];
const MENU: WjMenuItem[] = [
  { label: 'New' },
  { label: 'Open', items: [{ label: 'Recent' }] },
  { label: 'Print' },
];
const MEGA: WjMegaMenuItem[] = [{ label: 'Home' }, { label: 'Docs' }, { label: 'Help' }];
const NODES: WjTreeNode[] = [
  { key: 'docs', label: 'Documents', children: [{ key: 'docs/a', label: 'Report' }] },
  { key: 'music', label: 'Music' },
];
const CITIES: WjCascadeSelectOption<string>[] = [
  { label: 'Australia', children: [{ label: 'Sydney', value: 'sydney' }] },
  { label: 'Canada', children: [{ label: 'Toronto', value: 'toronto' }] },
];

/** One wrapper for each Material component with css, `editor` apart (it has no entry). */
@Component({
  selector: 'wj-material-css-host',
  imports: [
    WjAccordion,
    WjAccordionContent,
    WjAccordionHeader,
    WjAccordionPanel,
    WjAutoComplete,
    WjButton,
    WjCarousel,
    WjCarouselItemSlot,
    WjCascadeSelect,
    WjCheckbox,
    WjColumn,
    WjDatePicker,
    WjFieldset,
    WjInputGroup,
    WjInputNumber,
    WjInputText,
    WjListbox,
    WjMegaMenu,
    WjMenu,
    WjMenubar,
    WjMultiSelect,
    WjPanelMenu,
    WjRadioButton,
    WjRating,
    WjSelect,
    WjSlider,
    WjStep,
    WjStepList,
    WjStepPanel,
    WjStepPanels,
    WjStepper,
    WjTab,
    WjTabList,
    WjTabPanel,
    WjTabPanels,
    WjTable,
    WjTabs,
    WjTextarea,
    WjTieredMenu,
    WjToggleButton,
    WjToggleSwitch,
    WjTree,
    WjTreeSelect,
  ],
  template: `
    @if (show()) {
      <wj-accordion value="a">
        <wj-accordion-panel value="a">
          <wj-accordion-header>Header</wj-accordion-header>
          <wj-accordion-content>Body</wj-accordion-content>
        </wj-accordion-panel>
      </wj-accordion>
      <wj-autocomplete ariaLabel="Country" />
      <wj-button label="Save" />
      <wj-carousel ariaLabel="Featured" [value]="slides">
        <ng-template wjCarouselItem [wjCarouselItemOf]="slides" let-slide>{{ slide }}</ng-template>
      </wj-carousel>
      <wj-cascadeselect ariaLabel="City" [options]="cities" />
      <wj-checkbox ariaLabel="Agree" />
      <wj-datepicker ariaLabel="Start" />
      <wj-table [value]="rows" ariaLabel="Orders">
        <wj-column field="id" header="Order" />
      </wj-table>
      <wj-fieldset legend="Notes">Body</wj-fieldset>
      <wj-inputgroup><input wjInputText aria-label="Amount" /></wj-inputgroup>
      <wj-inputnumber ariaLabel="Quantity" />
      <input wjInputText aria-label="Name" />
      <wj-listbox ariaLabel="Fruit" [options]="fruit" />
      <wj-megamenu [model]="mega" ariaLabel="Site" />
      <wj-menu [model]="menu" ariaLabel="Actions" />
      <wj-menubar [model]="menu" ariaLabel="Editor" />
      <wj-multiselect ariaLabel="Days" [options]="fruit" />
      <wj-panelmenu [model]="menu" />
      <wj-radiobutton name="speed" option="standard" ariaLabel="Standard" />
      <wj-rating ariaLabel="Score" />
      <wj-select ariaLabel="Fruit" [options]="fruit" />
      <wj-slider ariaLabel="Volume" />
      <wj-stepper [value]="1">
        <wj-step-list>
          <wj-step [value]="1">One</wj-step>
          <wj-step [value]="2">Two</wj-step>
        </wj-step-list>
        <wj-step-panels>
          <wj-step-panel [value]="1">First</wj-step-panel>
          <wj-step-panel [value]="2">Second</wj-step-panel>
        </wj-step-panels>
      </wj-stepper>
      <wj-tabs value="a">
        <wj-tablist ariaLabel="Account">
          <wj-tab value="a">A</wj-tab>
          <wj-tab value="b">B</wj-tab>
        </wj-tablist>
        <wj-tabpanels>
          <wj-tabpanel value="a">First</wj-tabpanel>
          <wj-tabpanel value="b">Second</wj-tabpanel>
        </wj-tabpanels>
      </wj-tabs>
      <textarea wjTextarea aria-label="Notes"></textarea>
      <wj-tieredmenu [model]="menu" ariaLabel="Tiers" />
      <wj-togglebutton ariaLabel="Receipt" onLabel="On" offLabel="Off" />
      <wj-toggleswitch ariaLabel="Notify" />
      <wj-tree [value]="nodes" ariaLabel="Files" />
      <wj-treeselect ariaLabel="Department" [options]="nodes" />
    }
  `,
})
class MaterialCssHost {
  readonly show = signal(true);
  protected readonly cities = CITIES;
  protected readonly fruit = FRUIT;
  protected readonly mega = MEGA;
  protected readonly menu = MENU;
  protected readonly nodes = NODES;
  protected readonly rows = [{ id: 1 }];
  protected readonly slides = ['One', 'Two', 'Three'];
}

/** The `-style` sheet ids of the 30 Material components `MaterialCssHost` mounts. */
const MATERIAL_SHEETS = [
  'accordion',
  'autocomplete',
  'button',
  'carousel',
  'cascadeselect',
  'checkbox',
  'datatable',
  'datepicker',
  'fieldset',
  'inputgroup',
  'inputnumber',
  'inputtext',
  'listbox',
  'megamenu',
  'menu',
  'menubar',
  'multiselect',
  'panelmenu',
  'radiobutton',
  'rating',
  'select',
  'slider',
  'stepper',
  'tabs',
  'textarea',
  'tieredmenu',
  'togglebutton',
  'toggleswitch',
  'tree',
  'treeselect',
].map((name) => `${name}-style`);

/** Aura's own css blocks for a table and a tree, mounted under Noir. */
@Component({
  selector: 'wj-aura-css-host',
  imports: [WjColumn, WjTable, WjTree],
  template: `
    @if (show()) {
      <wj-table [value]="rows" ariaLabel="Orders"><wj-column field="id" header="Order" /></wj-table>
      <wj-tree [value]="nodes" ariaLabel="Files" />
    }
  `,
})
class AuraCssHost {
  readonly show = signal(true);
  protected readonly nodes = NODES;
  protected readonly rows = [{ id: 1 }];
}

/** Every wrapper whose focus used to draw a Material halo, each checkable in both states. */
@Component({
  selector: 'wj-material-halo-host',
  imports: [
    WjCarousel,
    WjCarouselItemSlot,
    WjCheckbox,
    WjRadioButton,
    WjRating,
    WjSlider,
    WjToggleSwitch,
  ],
  template: `
    <wj-checkbox ariaLabel="Off" />
    <wj-checkbox ariaLabel="On" [checked]="true" />
    <wj-radiobutton name="one" option="a" ariaLabel="Unpicked" />
    <wj-radiobutton name="two" option="b" value="b" ariaLabel="Picked" />
    <wj-toggleswitch ariaLabel="Off switch" />
    <wj-toggleswitch ariaLabel="On switch" [checked]="true" />
    <wj-rating ariaLabel="Score" />
    <div style="width: 240px"><wj-slider ariaLabel="Volume" /></div>
    <div style="width: 320px">
      <wj-carousel ariaLabel="Featured" [value]="slides">
        <ng-template wjCarouselItem [wjCarouselItemOf]="slides" let-slide>{{ slide }}</ng-template>
      </wj-carousel>
    </div>
  `,
})
class HaloHost {
  protected readonly slides = ['One', 'Two', 'Three'];
}

/** Every control whose filled variant Material strips of its outline on focus. */
@Component({
  selector: 'wj-material-filled-host',
  imports: [
    AutoComplete,
    FormsModule,
    WjCascadeSelect,
    WjDatePicker,
    WjInputText,
    WjMultiSelect,
    WjSelect,
    WjTextarea,
    WjTreeSelect,
  ],
  template: `
    <input wjInputText aria-label="Name" />
    <textarea wjTextarea aria-label="Notes"></textarea>
    <wj-select ariaLabel="Fruit" [options]="fruit" />
    <wj-multiselect ariaLabel="Days" [options]="fruit" />
    <wj-cascadeselect ariaLabel="City" [options]="cities" />
    <wj-treeselect ariaLabel="Department" [options]="nodes" />
    <p-autocomplete [multiple]="true" ngModel [suggestions]="[]" ariaLabel="Tags" />
    <wj-datepicker ariaLabel="Start" [showIcon]="true" />
    <wj-datepicker ariaLabel="Calendar" [inline]="true" [value]="shown" />
  `,
})
class FilledHost {
  protected readonly cities = CITIES;
  protected readonly fruit = FRUIT;
  protected readonly nodes = NODES;
  protected readonly shown = new Date(2035, 5, 15);
}

/** A checked box in each of its three sizes. */
@Component({
  selector: 'wj-material-check-host',
  imports: [WjCheckbox],
  template: `<wj-checkbox ariaLabel="Agree" [checked]="true" />`,
})
class CheckHost {}

/** The controls that paint no invalid look in Optimus, each invalid. */
@Component({
  selector: 'wj-material-invalid-looks-host',
  imports: [WjColorPicker, WjKnob, WjRating, WjSlider],
  template: `
    <wj-rating ariaLabel="Score" [value]="2" [invalid]="true" />
    <div style="width: 240px">
      <wj-slider ariaLabel="Volume" [value]="40" [invalid]="true" />
    </div>
    <wj-knob ariaLabel="Level" [value]="40" [invalid]="true" />
    <wj-colorpicker ariaLabel="Colour" [value]="'336699'" [invalid]="true" />
  `,
})
class InvalidLooksHost {}

/** Every control whose hovered-invalid border Material's own hover rules could win. */
@Component({
  selector: 'wj-material-invalid-hover-host',
  imports: [
    AutoComplete,
    FormsModule,
    WjCascadeSelect,
    WjCheckbox,
    WjInputText,
    WjMultiSelect,
    WjRadioButton,
    WjSelect,
    WjTextarea,
    WjToggleSwitch,
    WjTreeSelect,
  ],
  template: `
    <div id="neutral" style="width: 40px; height: 20px"></div>
    <input wjInputText aria-label="Name" [invalid]="true" />
    <textarea wjTextarea aria-label="Notes" [invalid]="true"></textarea>
    <wj-select ariaLabel="Fruit" [options]="fruit" [invalid]="true" />
    <wj-multiselect ariaLabel="Days" [options]="fruit" [invalid]="true" />
    <wj-cascadeselect ariaLabel="City" [options]="cities" [invalid]="true" />
    <wj-treeselect ariaLabel="Department" [options]="nodes" [invalid]="true" />
    <p-autocomplete
      class="p-invalid"
      [multiple]="true"
      ngModel
      [suggestions]="[]"
      ariaLabel="Tags"
    />
    <wj-checkbox ariaLabel="Agree" [invalid]="true" />
    <wj-radiobutton name="speed" option="a" ariaLabel="Standard" [invalid]="true" />
    <wj-toggleswitch ariaLabel="Notify" [invalid]="true" />
  `,
})
class InvalidHoverHost {
  protected readonly cities = CITIES;
  protected readonly fruit = FRUIT;
  protected readonly nodes = NODES;
}

/**
 * A disabled toggle button, off and on, through the wrapper; and the same through Optimus's own
 * element, because `wj-togglebutton` exposes no icon and the icon is one of the rule's parts.
 */
@Component({
  selector: 'wj-material-disabled-toggle-host',
  imports: [FormsModule, ToggleButton, WjToggleButton],
  template: `
    <wj-togglebutton id="off" ariaLabel="Off" onLabel="On" offLabel="Off" [disabled]="true" />
    <wj-togglebutton
      id="on"
      ariaLabel="On"
      onLabel="On"
      offLabel="Off"
      [checked]="true"
      [disabled]="true"
    />
    <p-togglebutton
      id="icon-off"
      [ngModel]="false"
      [disabled]="true"
      aria-disabled="true"
      onLabel="On"
      offLabel="Off"
      onIcon="pi pi-check"
      offIcon="pi pi-times"
    />
    <p-togglebutton
      id="icon-on"
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

/** An inline date picker whose earlier days, months and years cannot be picked. */
@Component({
  selector: 'wj-material-disabled-days-host',
  imports: [WjDatePicker],
  template: `<wj-datepicker ariaLabel="Date" [inline]="true" [value]="bound" [minDate]="bound" />`,
})
class DisabledDaysHost {
  protected readonly bound = new Date(2035, 5, 15);
}

/** The five menus whose active item takes the layer's focus ring. */
@Component({
  selector: 'wj-material-menus-host',
  imports: [WjMegaMenu, WjMenu, WjMenubar, WjPanelMenu, WjTieredMenu],
  template: `
    <button type="button" id="start">Start</button>
    <wj-menu [model]="menu" ariaLabel="Actions" />
    <wj-tieredmenu [model]="menu" ariaLabel="Tiers" />
    <wj-menubar [model]="menu" ariaLabel="Editor" />
    <wj-megamenu [model]="mega" ariaLabel="Site" />
    <nav aria-label="Docs"><wj-panelmenu [model]="panels" /></nav>
  `,
})
class MenusHost {
  protected readonly mega = MEGA;
  protected readonly menu = MENU;
  protected readonly panels: WjMenuItem[] = [
    { label: 'Start', expanded: true, items: [{ label: 'Install' }, { label: 'Theming' }] },
    { label: 'Help' },
  ];
}

/** Form-field and content parts, side by side. */
@Component({
  selector: 'wj-material-radius-host',
  imports: [WjFieldset, WjInputText, WjListbox, WjMenu, WjSelect, WjTextarea],
  template: `
    <input wjInputText aria-label="Name" />
    <textarea wjTextarea aria-label="Notes"></textarea>
    <wj-select ariaLabel="Fruit" [options]="fruit" />
    <wj-listbox ariaLabel="Pick" [options]="fruit" />
    <wj-fieldset legend="Notes">Body</wj-fieldset>
    <wj-menu [model]="menu" ariaLabel="Actions" />
  `,
})
class RadiusHost {
  protected readonly fruit = FRUIT;
  protected readonly menu = MENU;
}

/** The severities whose Material colours failed `color-contrast` before the T9 fix. */
@Component({
  selector: 'wj-material-contrast-host',
  imports: [WjButton, WjMessage, WjTag],
  template: `
    <wj-button label="Help" severity="help" />
    <wj-message severity="info" variant="simple">Info</wj-message>
    <wj-message severity="success" variant="simple">Success</wj-message>
    <wj-message severity="warn" variant="simple">Warn</wj-message>
    <wj-message severity="error" variant="simple">Error</wj-message>
    <wj-tag value="Danger" severity="danger" />
  `,
})
class ContrastHost {}

function clearPage(): void {
  ROOT.classList.remove('wj-dark');
  document.body.replaceChildren();
  document.head.querySelectorAll(SHEET_SELECTOR).forEach((style) => {
    style.remove();
  });
  TestBed.resetTestingModule();
}

/** Mounts `type` under Material (or `preset`), in light or dark, with the page settled. */
async function mount<T>(
  type: Type<T>,
  dark = false,
  preset: WjPreset | null = wjMaterial,
): Promise<ComponentFixture<T>> {
  TestBed.configureTestingModule({
    providers: [
      provideWeeljack(preset === null ? { darkMode: 'class' } : { preset, darkMode: 'class' }),
    ],
  });
  const fixture = TestBed.createComponent(type);
  document.body.appendChild(fixture.nativeElement as HTMLElement);
  ROOT.classList.toggle('wj-dark', dark);
  await fixture.whenStable();
  return fixture;
}

function query(root: ParentNode, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (!found) {
    throw new Error(`no element matches '${selector}'`);
  }
  return found;
}

function queryAll(root: ParentNode, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

function nativeOf(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

/** A token as the browser computes it for `property`: `rgb(...)` for a colour, `2px` for a length. */
function resolved(property: string, variable: string): string {
  const probe = document.createElement('div');
  probe.style.setProperty(property, `var(${variable})`);
  document.body.append(probe);
  const value = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return value;
}

/** Resolves once nothing on `element` or inside it is still moving, so a style read is final. */
async function settled(element: Element): Promise<void> {
  getComputedStyle(element).getPropertyValue('color'); // a style read starts any transition
  await expect
    .poll(
      () =>
        element.getAnimations({ subtree: true }).filter((a) => a instanceof CSSTransition).length,
      { timeout: 2000 },
    )
    .toBe(0);
}

/**
 * Presses Tab until `target` has focus (a bounded walk), waiting for each press to move the focus
 * before the next one, so that a late focus is never walked past.
 */
async function tabTo(target: HTMLElement, name: string): Promise<void> {
  for (let presses = 0; presses < 24 && document.activeElement !== target; presses++) {
    const before = document.activeElement;
    await userEvent.tab();
    await expect.poll(() => document.activeElement, { message: name }).not.toBe(before);
  }
  await expect.poll(() => document.activeElement, { message: name }).toBe(target);
}

/** Every rule below `list`, flattened through `@layer` / `@media` nesting. */
function flatten(list: CSSRuleList): CSSRule[] {
  return Array.from(list).flatMap((rule) =>
    rule instanceof CSSGroupingRule ? [rule, ...flatten(rule.cssRules)] : [rule],
  );
}

/**
 * Widens the shipped reduced-motion block that holds `fragment` to `all`, in place, so its cascade
 * position is what is tested (never media emulation, which leaks across parallel specs; Optimus's
 * own motion reads `matchMedia`, which this does not touch). Returns the undo.
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
    throw new Error(`the reduced-motion blocks have no ${fragment} rule`);
  }
  const original = rule.media.mediaText;
  rule.media.mediaText = 'all';
  return () => {
    rule.media.mediaText = original;
  };
}

afterEach(async () => {
  await userEvent.unhover(document.body);
  clearPage();
});

describe('wjMaterial case 6: runtime equals bootstrap over Material css', () => {
  /** The page after a Noir or Material bootstrap, with every Material component mounted. */
  async function bootstrapped(preset: WjPreset | null): Promise<Page> {
    await mount(MaterialCssHost, false, preset);
    const read = capture();
    clearPage();
    return read;
  }

  it('mounts 30 of Material’s 31 css blocks (editor has no entry and Quill is not installed)', async () => {
    await mount(MaterialCssHost);

    expect(MATERIAL_SHEETS).toHaveLength(30);
    expect(Object.keys(styleSheets())).toEqual(expect.arrayContaining(MATERIAL_SHEETS));
  });

  it('setPreset(wjMaterial) equals a fresh bootstrap, and setPreset() returns to Noir', async () => {
    const fixture = await mount(MaterialCssHost, false, null);
    const theme = TestBed.inject(WjTheme);
    const noirGlobal = styleSheets()['global-style'] ?? '';
    const css = wjMaterial._css ?? '';
    // Optimus writes the css back compacted, so the strings are compared without whitespace.
    const squash = (text: string): string => text.replace(/\s+/g, '');
    expect(css).not.toBe('');
    expect(squash(noirGlobal)).not.toContain(squash(css));

    theme.setPreset(wjMaterial);
    await fixture.whenStable();
    const switched = capture();
    expect(squash(switched.sheets['global-style'] ?? '')).toContain(squash(css));

    theme.setPreset();
    await fixture.whenStable();
    const returned = capture();
    expect(returned.sheets['global-style']).toBe(noirGlobal);
    clearPage();

    const material = await bootstrapped(wjMaterial);
    const noir = await bootstrapped(null);

    expectPage(switched, material);
    expectPage(returned, noir);
  });

  it('drops every Material sheet of an unmounted component on setPreset()', async () => {
    const fixture = await mount(MaterialCssHost);
    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(Object.keys(styleSheets())).toEqual(expect.arrayContaining(MATERIAL_SHEETS));

    TestBed.inject(WjTheme).setPreset();
    await fixture.whenStable();

    expect(Object.keys(styleSheets())).toEqual(['global-style']);
  });

  it('drops every Aura sheet of an unmounted table and tree on setPreset(wjMaterial)', async () => {
    const fixture = await mount(AuraCssHost, false, wjNoir);
    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(Object.keys(styleSheets())).toEqual(
      expect.arrayContaining(['datatable-style', 'tree-style']),
    );

    TestBed.inject(WjTheme).setPreset(wjMaterial);
    await fixture.whenStable();

    expect(Object.keys(styleSheets())).toEqual(['global-style']);
  });
});

describe.each(SCHEMES)('wjMaterial $scheme', ({ dark }) => {
  describe('radius (FR-10)', () => {
    it('resolves the form-field and content radius to 4px on rendered wrappers', async () => {
      const fixture = await mount(RadiusHost, dark);
      const root = nativeOf(fixture);
      const radius = (selector: string): string =>
        getComputedStyle(query(root, selector)).borderTopLeftRadius;

      expect(getComputedStyle(ROOT).getPropertyValue('--wj-form-field-border-radius')).toBe('4px');
      expect(getComputedStyle(ROOT).getPropertyValue('--wj-content-border-radius')).toBe('4px');
      expect(radius('input[wjInputText]')).toBe('4px');
      expect(radius('textarea[wjTextarea]')).toBe('4px');
      expect(radius('.p-select')).toBe('4px');
      expect(radius('.p-listbox')).toBe('4px');
      expect(radius('.p-fieldset')).toBe('4px');
      expect(radius('.p-menu')).toBe('4px');
    });
  });

  describe('keyboard focus: no halo, one ring (FR-12 a)', () => {
    interface Stop {
      readonly name: string;
      readonly targets: (root: HTMLElement) => HTMLElement[];
      /** The element Material draws the halo on. */
      readonly halo: (target: HTMLElement) => HTMLElement;
      /** The element that paints the ring. */
      readonly ring: (target: HTMLElement) => HTMLElement;
    }
    const closest =
      (selector: string) =>
      (target: HTMLElement): HTMLElement => {
        const found = target.closest<HTMLElement>(selector);
        if (!found) {
          throw new Error(`no '${selector}' around the focus target`);
        }
        return found;
      };
    const self = (target: HTMLElement): HTMLElement => target;
    const STOPS: readonly Stop[] = [
      {
        name: 'checkbox',
        targets: (root) => queryAll(root, 'wj-checkbox input'),
        halo: closest('.p-checkbox'),
        ring: (target) => query(closest('wj-checkbox')(target), '.p-checkbox-box'),
      },
      {
        name: 'radiobutton',
        targets: (root) => queryAll(root, 'wj-radiobutton input'),
        halo: closest('.p-radiobutton'),
        ring: (target) => query(closest('wj-radiobutton')(target), '.p-radiobutton-box'),
      },
      {
        name: 'toggleswitch handle',
        targets: (root) => queryAll(root, 'wj-toggleswitch input'),
        halo: (target) => query(closest('wj-toggleswitch')(target), '.p-toggleswitch-handle'),
        ring: (target) => query(closest('wj-toggleswitch')(target), '.p-toggleswitch-slider'),
      },
      {
        name: 'rating',
        targets: (root) => queryAll(root, 'wj-rating input').slice(0, 1),
        halo: closest('.p-rating-option'),
        ring: closest('.p-rating-option'),
      },
      {
        name: 'slider',
        targets: (root) => queryAll(root, '[role="slider"]'),
        halo: self,
        ring: self,
      },
      {
        name: 'carousel indicator',
        targets: (root) => queryAll(root, '.p-carousel-indicator-button').slice(0, 1),
        halo: self,
        ring: self,
      },
    ];

    it('draws the 2px ring and no box-shadow beyond the resting one, on every stop', async () => {
      const fixture = await mount(HaloHost, dark);
      const root = nativeOf(fixture);
      const rows = STOPS.flatMap((stop) =>
        stop.targets(root).map((target) => ({ stop, target, rest: '' })),
      );
      for (const row of rows) {
        await settled(row.stop.halo(row.target));
        row.rest = getComputedStyle(row.stop.halo(row.target)).boxShadow;
      }
      const colour = resolved('color', '--wj-focus-ring-color');

      expect(rows.map((row) => row.stop.name)).toHaveLength(9);
      for (const { stop, target, rest } of rows) {
        await tabTo(target, stop.name);
        const halo = stop.halo(target);
        const ring = stop.ring(target);
        await settled(halo);
        await settled(ring);

        expect([stop.name, getComputedStyle(halo).boxShadow]).toEqual([stop.name, rest]);
        expect([
          stop.name,
          getComputedStyle(ring).outlineStyle,
          getComputedStyle(ring).outlineWidth,
          getComputedStyle(ring).outlineColor,
        ]).toEqual([stop.name, 'solid', '2px', colour]);
      }
    });

    it('keeps the switch handle’s resting elevation, and leaves every other part bare', async () => {
      const fixture = await mount(HaloHost, dark);
      const root = nativeOf(fixture);

      for (const stop of STOPS) {
        for (const target of stop.targets(root)) {
          await settled(stop.halo(target));
          const shadow = getComputedStyle(stop.halo(target)).boxShadow;
          expect([stop.name, shadow === 'none']).toEqual([
            stop.name,
            stop.name !== 'toggleswitch handle',
          ]);
        }
      }
    });
  });

  describe('the filled variant’s ring (FR-12 b)', () => {
    it('draws the 2px ring on every filled field Material strips of its outline', async () => {
      const fixture = await mount(FilledHost, dark);
      const root = nativeOf(fixture);
      TestBed.inject(Optimus).inputVariant.set('filled');
      await fixture.whenStable();
      const colour = resolved('color', '--wj-focus-ring-color');
      const offset = resolved('outline-offset', '--wj-focus-ring-offset');
      const around = (selector: string) => (target: HTMLElement) =>
        target.closest<HTMLElement>(selector) ?? target;
      const stops: { name: string; target: HTMLElement; ring: HTMLElement }[] = [
        {
          name: 'inputtext',
          target: query(root, 'input[wjInputText]'),
          ring: query(root, 'input[wjInputText]'),
        },
        {
          name: 'textarea',
          target: query(root, 'textarea[wjTextarea]'),
          ring: query(root, 'textarea[wjTextarea]'),
        },
        ...(
          [
            ['select', 'p-select'],
            ['multiselect', 'p-multiselect'],
            ['cascadeselect', 'p-cascadeselect'],
            ['treeselect', 'p-treeselect'],
          ] as const
        ).map(([name, host]) => {
          const target = query(root, `${host} [role="combobox"]`);
          return { name, target, ring: around(host)(target) };
        }),
        {
          name: 'autocomplete multiple',
          target: query(root, '.p-autocomplete-input-multiple input'),
          ring: query(root, '.p-autocomplete-input-multiple'),
        },
      ];

      expect(stops).toHaveLength(7);
      for (const { name, target, ring } of stops) {
        await tabTo(target, name);
        await settled(ring);
        const style = getComputedStyle(ring);

        expect([name, style.outlineStyle, style.outlineWidth, style.outlineColor]).toEqual([
          name,
          'solid',
          '2px',
          colour,
        ]);
        expect([name, style.outlineOffset]).toEqual([name, offset]);
      }
    });

    it('draws it on the date picker’s dropdown, month and year buttons', async () => {
      const fixture = await mount(FilledHost, dark);
      const root = nativeOf(fixture);
      const colour = resolved('color', '--wj-focus-ring-color');
      const buttons = [
        query(root, '.p-datepicker-dropdown'),
        query(root, '.p-datepicker-select-month'),
        query(root, '.p-datepicker-select-year'),
      ];

      for (const button of buttons) {
        await tabTo(button, button.className);
        await settled(button);
        const style = getComputedStyle(button);

        expect([
          button.className,
          style.outlineStyle,
          style.outlineWidth,
          style.outlineColor,
        ]).toEqual([button.className, 'solid', '2px', colour]);
      }
    });
  });

  describe('the checkmark (FR-12 c)', () => {
    /**
     * Where the drawn check sits against the middle of the box, in px. The mark is the right and
     * bottom border of an absolutely placed rectangle, turned 45 degrees about its lower left
     * corner, so its stroke centrelines are the three points below, placed from the padding box of
     * the nearest positioned ancestor.
     */
    function markOffset(box: HTMLElement): { x: number; y: number } {
      const mark = getComputedStyle(box, '::before');
      const stroke = parseFloat(mark.borderRightWidth);
      const width = parseFloat(mark.width);
      const height = parseFloat(mark.height);
      const [originX = 0, originY = 0] = mark.transformOrigin.split(' ').map(parseFloat);
      const matrix = new DOMMatrix(mark.transform);
      const holder = getComputedStyle(box).position === 'static' ? box.offsetParent : box;
      if (!(holder instanceof HTMLElement)) {
        throw new Error('the check has no positioned ancestor');
      }
      const frame = holder.getBoundingClientRect();
      const points = [
        [0, height - stroke / 2],
        [width - stroke / 2, height - stroke / 2],
        [width - stroke / 2, 0],
      ].map(([x = 0, y = 0]) => {
        const moved = matrix.transformPoint(new DOMPoint(x - originX, y - originY));
        return {
          x: frame.left + holder.clientLeft + parseFloat(mark.left) + originX + moved.x,
          y: frame.top + holder.clientTop + parseFloat(mark.top) + originY + moved.y,
        };
      });
      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      const middle = box.getBoundingClientRect();
      return {
        x: (Math.min(...xs) + Math.max(...xs)) / 2 - (middle.left + middle.width / 2),
        y: (Math.min(...ys) + Math.max(...ys)) / 2 - (middle.top + middle.height / 2),
      };
    }

    async function finished(box: HTMLElement): Promise<void> {
      await expect
        .poll(() => box.getAnimations({ subtree: true }).every((a) => a.playState === 'finished'))
        .toBe(true);
    }

    it('centres the drawn check in the 24px box', async () => {
      const fixture = await mount(CheckHost, dark);
      const box = query(nativeOf(fixture), '.p-checkbox-box');
      await finished(box);

      expect([box.offsetWidth, box.offsetHeight]).toEqual([24, 24]);
      const { x, y } = markOffset(box);
      expect(Math.abs(x)).toBeLessThanOrEqual(1);
      expect(Math.abs(y)).toBeLessThanOrEqual(1);
    });

    it('plays no check keyframes under reduced motion, and draws the mark at once', async () => {
      const fixture = await mount(CheckHost, dark);
      const box = query(nativeOf(fixture), '.p-checkbox-box');
      await finished(box);
      expect(getComputedStyle(box, '::before').animationName).not.toBe('none');

      const restore = widenReducedMotion('p-checkbox-checked');
      try {
        const mark = getComputedStyle(box, '::before');
        expect(mark.animationName).toBe('none');
        expect(mark.width).toBe(
          getComputedStyle(query(nativeOf(fixture), '.p-checkbox')).getPropertyValue(
            '--p-md-check-icon-w',
          ),
        );
        const { x, y } = markOffset(box);
        expect(Math.abs(x)).toBeLessThanOrEqual(1);
        expect(Math.abs(y)).toBeLessThanOrEqual(1);
      } finally {
        restore();
      }
    });

    it('has no axe violation on a checked box', async () => {
      const fixture = await mount(CheckHost, dark);

      await expectNoAxeViolations(nativeOf(fixture));
    });
  });

  describe('invalid looks (FR-13)', () => {
    it('turns the unpicked stars invalid and keeps the picked ones primary', async () => {
      const fixture = await mount(InvalidLooksHost, dark);
      const root = nativeOf(fixture);
      const first = query(root, '.p-rating-option-active .p-rating-icon');
      const third = query(root, '.p-rating-option:not(.p-rating-option-active) .p-rating-icon');
      await settled(third);

      expect(getComputedStyle(third).color).toBe(resolved('color', INVALID));
      expect(getComputedStyle(first).color).toBe(
        resolved('color', '--wj-rating-icon-active-color'),
      );
    });

    it('gives the slider handle the invalid background, at rest and on hover', async () => {
      const fixture = await mount(InvalidLooksHost, dark);
      const handle = query(nativeOf(fixture), '.p-slider-handle');
      const invalid = resolved('background-color', INVALID);
      await settled(handle);
      expect(getComputedStyle(handle).backgroundColor).toBe(invalid);

      await userEvent.hover(handle);
      await expect.poll(() => handle.matches(':hover')).toBe(true);
      await settled(handle);

      expect(getComputedStyle(handle).backgroundColor).toBe(invalid);
    });

    it('draws a 1px invalid ring around the knob', async () => {
      const fixture = await mount(InvalidLooksHost, dark);
      const svg = query(nativeOf(fixture), '.p-knob svg');
      await settled(svg);

      expect(getComputedStyle(svg).boxShadow).toBe(`${resolved('color', INVALID)} 0px 0px 0px 1px`);
    });

    it('gives the colour swatch an invalid inset boundary', async () => {
      const fixture = await mount(InvalidLooksHost, dark);
      const preview = query(nativeOf(fixture), '.p-colorpicker-preview');
      await settled(preview);

      expect(getComputedStyle(preview).boxShadow).toBe(
        `${resolved('color', INVALID)} 0px 0px 0px 1px inset`,
      );
    });

    describe.each(['outlined', 'filled'] as const)('a hovered invalid control, %s', (variant) => {
      const CONTROLS: { name: string; hover: string; bordered: string; filledToo: boolean }[] = [
        {
          name: 'input text',
          hover: 'input[wjInputText]',
          bordered: 'input[wjInputText]',
          filledToo: true,
        },
        {
          name: 'textarea',
          hover: 'textarea[wjTextarea]',
          bordered: 'textarea[wjTextarea]',
          filledToo: true,
        },
        { name: 'select', hover: 'p-select', bordered: 'p-select', filledToo: true },
        { name: 'multiselect', hover: 'p-multiselect', bordered: 'p-multiselect', filledToo: true },
        {
          name: 'cascadeselect',
          hover: 'p-cascadeselect',
          bordered: 'p-cascadeselect',
          filledToo: true,
        },
        { name: 'treeselect', hover: 'p-treeselect', bordered: 'p-treeselect', filledToo: true },
        {
          name: 'autocomplete chips',
          hover: '.p-autocomplete-input-multiple',
          bordered: '.p-autocomplete-input-multiple',
          filledToo: true,
        },
        {
          name: 'checkbox',
          hover: '.p-checkbox-input',
          bordered: '.p-checkbox-box',
          filledToo: false,
        },
        {
          name: 'radio button',
          hover: '.p-radiobutton-input',
          bordered: '.p-radiobutton-box',
          filledToo: false,
        },
        {
          name: 'toggle switch',
          hover: '.p-toggleswitch-input',
          bordered: '.p-toggleswitch-slider',
          filledToo: false,
        },
      ];

      it.each(CONTROLS.filter((control) => variant === 'outlined' || control.filledToo))(
        'keeps the red border on a $name',
        async ({ hover, bordered }) => {
          const fixture = await mount(InvalidHoverHost, dark);
          const root = nativeOf(fixture);
          TestBed.inject(Optimus).inputVariant.set(variant);
          await fixture.whenStable();
          const target = query(root, hover);
          const box = query(root, bordered);

          await userEvent.hover(query(root, '#neutral'));
          await settled(box);
          const resting = getComputedStyle(box).backgroundImage;
          await userEvent.hover(target);
          await expect.poll(() => target.matches(':hover')).toBe(true);
          await settled(box);

          if (variant === 'outlined') {
            expect(getComputedStyle(box).borderTopColor).toBe(resolved('color', INVALID));
            expect(getComputedStyle(box).borderLeftColor).toBe(resolved('color', INVALID));
          } else {
            // Material draws a filled field's edge as an underline gradient, never as a border, so
            // the invalid look it keeps on hover is that underline.
            expect(resting).toContain(resolved('color', INVALID));
            expect(getComputedStyle(box).backgroundImage).toBe(resting);
          }
        },
      );
    });
  });

  describe('disabled looks (FR-13)', () => {
    it('gives a disabled toggle button the disabled tokens at full opacity', async () => {
      const fixture = await mount(DisabledToggleHost, dark);
      const root = nativeOf(fixture);
      const off = query(root, 'wj-togglebutton#off [role="button"]');
      await settled(off);
      const style = getComputedStyle(off);

      expect(style.opacity).toBe('1');
      expect(style.cursor).toBe('default');
      expect(style.backgroundColor).toBe(
        resolved('background-color', '--wj-togglebutton-disabled-background'),
      );
      expect(style.borderTopColor).toBe(
        resolved('color', '--wj-togglebutton-disabled-border-color'),
      );
      expect(style.color).toBe(resolved('color', '--wj-togglebutton-disabled-color'));
    });

    it('keeps the picked pill visible, and colours the unpicked icon', async () => {
      const fixture = await mount(DisabledToggleHost, dark);
      const root = nativeOf(fixture);
      const pill = query(root, 'wj-togglebutton#on .p-togglebutton-content');
      const offIcon = query(root, 'p-togglebutton#icon-off .p-togglebutton-icon');
      const onIcon = query(root, 'p-togglebutton#icon-on .p-togglebutton-icon');
      await settled(pill);

      expect(getComputedStyle(pill).backgroundColor).toBe(
        resolved('background-color', '--wj-togglebutton-disabled-color'),
      );
      expect(getComputedStyle(pill).color).toBe(
        resolved('color', '--wj-togglebutton-disabled-background'),
      );
      expect(getComputedStyle(offIcon).color).toBe(
        resolved('color', '--wj-togglebutton-icon-disabled-color'),
      );
      expect(getComputedStyle(onIcon).color).toBe(
        resolved('color', '--wj-togglebutton-disabled-background'),
      );
    });

    it('shows a day, month and year that cannot be picked muted at full opacity', async () => {
      const fixture = await mount(DisabledDaysHost, dark);
      const root = nativeOf(fixture);
      const muted = resolved('color', '--wj-text-muted-color');
      const day = query(root, '.p-datepicker-day.p-disabled');
      await settled(day);
      expect([getComputedStyle(day).opacity, getComputedStyle(day).color]).toEqual(['1', muted]);

      await userEvent.click(query(root, '.p-datepicker-select-month'));
      await expect.poll(() => root.querySelector('.p-datepicker-month.p-disabled')).not.toBeNull();
      const disabledMonth = query(root, '.p-datepicker-month.p-disabled');
      await settled(disabledMonth);
      expect([
        getComputedStyle(disabledMonth).opacity,
        getComputedStyle(disabledMonth).color,
      ]).toEqual(['1', muted]);

      await userEvent.click(query(root, '.p-datepicker-select-year'));
      await expect.poll(() => root.querySelector('.p-datepicker-year.p-disabled')).not.toBeNull();
      const disabledYear = query(root, '.p-datepicker-year.p-disabled');
      await settled(disabledYear);
      expect([
        getComputedStyle(disabledYear).opacity,
        getComputedStyle(disabledYear).color,
      ]).toEqual(['1', muted]);
    });

    it('has no axe violation on disabled toggle buttons or a date picker with disabled days', async () => {
      const toggles = await mount(DisabledToggleHost, dark);
      await expectNoAxeViolations(nativeOf(toggles));
      clearPage();

      const days = await mount(DisabledDaysHost, dark);
      await expectNoAxeViolations(nativeOf(days));
    });
  });

  describe('keyboard focus in a menu (FR-13)', () => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };

    beforeEach(async () => {
      await page.viewport(1280, 800);
    });

    afterEach(async () => {
      await page.viewport(viewport.width, viewport.height);
    });

    /** Starts the Tab walk at the page's first button, so it never depends on where focus was. */
    function startWalk(root: HTMLElement): void {
      query(root, '#start').focus();
    }

    /** Tabs onto the menu's own list, then presses Arrow Down onto its first item. */
    async function activateFirstItem(root: HTMLElement, menu: HTMLElement): Promise<void> {
      startWalk(root);
      await tabTo(menu, menu.id);
      await userEvent.keyboard('{ArrowDown}');
    }

    it.each([
      { name: 'menu', list: 'wj-menu [role="menu"]', item: 'menu' },
      { name: 'tiered menu', list: 'wj-tieredmenu [role="menu"]', item: 'tieredmenu' },
      { name: 'menubar', list: 'wj-menubar [role="menubar"]', item: 'menubar' },
      { name: 'mega menu', list: 'wj-megamenu [role="menubar"]', item: 'megamenu' },
    ])('rings the active item of a $name inside its fill', async ({ list, item }) => {
      const fixture = await mount(MenusHost, dark);
      const root = nativeOf(fixture);

      await activateFirstItem(root, query(root, list));
      const content = query(root, `.p-focus > .p-${item}-item-content`);

      await expect.poll(() => getComputedStyle(content).outlineStyle).toBe('solid');
      await settled(content);
      expect(getComputedStyle(content).outlineWidth).toBe('2px');
      expect(getComputedStyle(content).outlineOffset).toBe('-2px');
      expect(getComputedStyle(content).outlineColor).toBe(
        resolved('color', '--wj-focus-ring-color'),
      );
    });

    it('rings the focused header and the active item of a panel menu', async () => {
      const fixture = await mount(MenusHost, dark);
      const root = nativeOf(fixture);
      const colour = resolved('color', '--wj-focus-ring-color');
      const header = query(root, '.p-panelmenu-header');

      startWalk(root);
      await tabTo(header, 'panel menu header');
      const headerContent = query(header, '.p-panelmenu-header-content');
      await expect.poll(() => getComputedStyle(headerContent).outlineStyle).toBe('solid');
      await settled(headerContent);
      expect(getComputedStyle(headerContent).outlineWidth).toBe('2px');
      expect(getComputedStyle(headerContent).outlineColor).toBe(colour);

      await userEvent.keyboard('{ArrowDown}');
      await expect
        .poll(() => root.querySelector('.p-focus > .p-panelmenu-item-content'))
        .not.toBeNull();
      const itemContent = query(root, '.p-focus > .p-panelmenu-item-content');
      await expect.poll(() => getComputedStyle(itemContent).outlineStyle).toBe('solid');
      await settled(itemContent);
      expect(getComputedStyle(itemContent).outlineWidth).toBe('2px');
      expect(getComputedStyle(itemContent).outlineColor).toBe(colour);
    });

    it('draws no ring after a pointer click', async () => {
      const fixture = await mount(MenusHost, dark);
      const root = nativeOf(fixture);

      await userEvent.click(query(root, 'wj-tieredmenu .p-tieredmenu-item-content'));
      await expect.poll(() => root.querySelector('wj-tieredmenu .p-focus')).not.toBeNull();

      const focused = query(root, 'wj-tieredmenu .p-focus > .p-tieredmenu-item-content');
      expect(getComputedStyle(focused).outlineStyle).toBe('none');
    });
  });
});

describe('wjMaterial colour pairs the token gate cannot see (T9 FR-17)', () => {
  /** The `color-contrast` violations axe finds inside `selector`, as one line each. */
  async function contrastIn(
    fixture: ComponentFixture<unknown>,
    selector: string,
  ): Promise<string[]> {
    const scope = query(nativeOf(fixture), selector);
    await settled(scope);
    const violations = await runAxe(scope);
    return violations
      .filter((violation) => violation.id === 'color-contrast')
      .flatMap((violation) => violation.nodes.map((node) => node.target.join(' ')));
  }

  it('keeps the help button readable in dark', async () => {
    const fixture = await mount(ContrastHost, true);

    expect(await contrastIn(fixture, 'wj-button')).toEqual([]);
  });

  it.each(['info', 'success', 'warn', 'error'])(
    'keeps the simple %s message readable in light',
    async (severity) => {
      const fixture = await mount(ContrastHost, false);

      expect(await contrastIn(fixture, `wj-message[severity="${severity}"]`)).toEqual([]);
    },
  );

  it('keeps the danger tag readable in dark', async () => {
    const fixture = await mount(ContrastHost, true);

    expect(await contrastIn(fixture, 'wj-tag')).toEqual([]);
  });
});
