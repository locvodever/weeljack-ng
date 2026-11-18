import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjStep,
  WjStepList,
  WjStepPanel,
  WjStepPanels,
  WjStepper,
  type WjStepListPt,
  type WjStepPanelPt,
  type WjStepPanelsPt,
  type WjStepPt,
  type WjStepperPt,
  type WjStepperValue,
} from 'weeljack-ng/stepper';
import { WjStepHarness, WjStepperHarness } from 'weeljack-ng/stepper/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const VIEWPORT = { width: window.innerWidth, height: window.innerHeight };

/** One step of the host's stepper, and the panel that goes with it. */
interface StepData {
  value: WjStepperValue;
  title: string;
  body: string;
  disabled?: boolean;
  pt?: WjStepPt;
  panelPt?: WjStepPanelPt;
}

const STEPS: StepData[] = [
  { value: 1, title: 'Details', body: 'Who you are.' },
  { value: 2, title: 'Preferences', body: 'How we reach you.' },
  { value: 3, title: 'Confirm', body: 'Check and send.' },
];

/** A consumer's template: native buttons around the stepper, steps and panels declared with `@for`. */
@Component({
  selector: 'wj-stepper-host',
  imports: [WjStepper, WjStepList, WjStep, WjStepPanels, WjStepPanel],
  template: `
    <button type="button" id="before">Before</button>
    <div [style.width]="width()">
      <wj-stepper [value]="value()" (valueChange)="changed($event)" [linear]="linear()" [pt]="pt()">
        <wj-step-list [pt]="listPt()">
          @for (step of steps(); track step.value) {
            <wj-step [value]="step.value" [disabled]="step.disabled ?? false" [pt]="step.pt">{{
              step.title
            }}</wj-step>
          }
          @if (bonus()) {
            <wj-step [value]="99">Bonus</wj-step>
          }
        </wj-step-list>
        <wj-step-panels [pt]="panelsPt()">
          @for (step of steps(); track step.value) {
            <wj-step-panel [value]="step.value" [pt]="step.panelPt">
              <p class="body">{{ step.body }}</p>
              @if (nav()) {
                <button
                  type="button"
                  class="back"
                  style="min-height: 32px; margin: 4px"
                  (click)="go(step.value - 1)"
                >
                  Back
                </button>
                <button
                  type="button"
                  class="next"
                  style="min-height: 32px; margin: 4px"
                  (click)="go(step.value + 1)"
                >
                  Next
                </button>
              }
            </wj-step-panel>
          }
          @if (bonus()) {
            <wj-step-panel [value]="99">Only while it is declared.</wj-step-panel>
          }
        </wj-step-panels>
      </wj-stepper>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly steps = signal<StepData[]>(STEPS);
  readonly value = signal<WjStepperValue>(1);
  readonly linear = signal(false);
  readonly nav = signal(false);
  readonly pt = signal<WjStepperPt>(undefined);
  readonly listPt = signal<WjStepListPt>(undefined);
  readonly panelsPt = signal<WjStepPanelsPt>(undefined);
  readonly bonus = signal(false);
  readonly width = signal<string | undefined>(undefined);
  /** Every value `valueChange` reported, in order. */
  readonly reported = signal<WjStepperValue[]>([]);

  protected changed(next: WjStepperValue): void {
    this.value.set(next);
    this.reported.update((list) => [...list, next]);
  }

  protected go(next: WjStepperValue): void {
    this.value.set(next);
  }
}

/** Two-way binding with `[(value)]`, and the bare attributes `linear` and `disabled`. */
@Component({
  selector: 'wj-stepper-bare-host',
  imports: [WjStepper, WjStepList, WjStep, WjStepPanels, WjStepPanel],
  template: `
    <wj-stepper [(value)]="value" linear>
      <wj-step-list>
        <wj-step [value]="1">A</wj-step>
        <wj-step [value]="2" disabled>B</wj-step>
      </wj-step-list>
      <wj-step-panels>
        <wj-step-panel [value]="1">Alpha</wj-step-panel>
        <wj-step-panel [value]="2">Bravo</wj-step-panel>
      </wj-step-panels>
    </wj-stepper>
  `,
})
class BareHost {
  readonly value = signal<WjStepperValue>(1);
}

/** Content a consumer writes in the wrong place: it must not render. */
@Component({
  selector: 'wj-stepper-stray-host',
  imports: [WjStepper, WjStepList, WjStep, WjStepPanels, WjStepPanel],
  template: `
    <wj-stepper [value]="1">
      <p id="stray">Not a part</p>
      <wj-step id="orphan" [value]="9">Orphan step</wj-step>
      <wj-step-list>
        <p id="loose-in-list">Loose in the list</p>
        <wj-step [value]="1">A</wj-step>
      </wj-step-list>
      <wj-step-panels>
        <p id="loose-in-panels">Loose in the panels</p>
        <wj-step-panel [value]="1">Alpha</wj-step-panel>
      </wj-step-panels>
    </wj-stepper>
  `,
})
class StrayHost {}

/** A consumer who writes `aria-*` on a host instead of leaving the steps to name themselves. */
@Component({
  selector: 'wj-stepper-aria-main-host',
  imports: [WjStepper],
  template: `<wj-stepper [value]="1" aria-label="Checkout" />`,
})
class AriaOnMainHost {}

@Component({
  selector: 'wj-stepper-aria-list-host',
  imports: [WjStepper, WjStepList],
  template: `<wj-stepper [value]="1"><wj-step-list aria-label="Steps" /></wj-stepper>`,
})
class AriaOnListHost {}

@Component({
  selector: 'wj-stepper-aria-step-host',
  imports: [WjStepper, WjStepList, WjStep],
  template: `
    <wj-stepper [value]="1">
      <wj-step-list><wj-step [value]="1" aria-label="A">A</wj-step></wj-step-list>
    </wj-stepper>
  `,
})
class AriaOnStepHost {}

@Component({
  selector: 'wj-stepper-aria-panels-host',
  imports: [WjStepper, WjStepPanels],
  template: `<wj-stepper [value]="1"><wj-step-panels aria-label="Panels" /></wj-stepper>`,
})
class AriaOnPanelsHost {}

@Component({
  selector: 'wj-stepper-aria-panel-host',
  imports: [WjStepper, WjStepPanels, WjStepPanel],
  template: `
    <wj-stepper [value]="1">
      <wj-step-panels
        ><wj-step-panel [value]="1" aria-label="A">Alpha</wj-step-panel></wj-step-panels
      >
    </wj-stepper>
  `,
})
class AriaOnPanelHost {}

/** Titles and panel content that are an HTML payload: they must render as text. */
@Component({
  selector: 'wj-stepper-payload-host',
  imports: [WjStepper, WjStepList, WjStep, WjStepPanels, WjStepPanel],
  template: `
    <wj-stepper [value]="1">
      <wj-step-list>
        <wj-step [value]="1">{{ payload }}</wj-step>
      </wj-step-list>
      <wj-step-panels>
        <wj-step-panel [value]="1">{{ payload }}</wj-step-panel>
      </wj-step-panels>
    </wj-stepper>
  `,
})
class PayloadHost {
  protected readonly payload = PAYLOAD;
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  stepper: WjStepperHarness;
  element: HTMLElement;
}

const realMatchMedia = window.matchMedia.bind(window);

/**
 * Sets the reader's reduced-motion preference for this window only: Optimus's motion runner reads
 * `window.matchMedia`. A CDP emulation would change the whole shared browser page, and with it every
 * spec file running beside this one.
 */
function reduceMotion(reduce: boolean): void {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    const list = realMatchMedia(query);
    return query.includes('prefers-reduced-motion')
      ? new Proxy(list, {
          get(target, key): unknown {
            const value: unknown = Reflect.get(target, key);
            return key === 'matches' ? reduce : value;
          },
        })
      : list;
  });
}

/** Records every class list `p-motion` showed while it runs; call the result to stop and read. */
function recordMotion(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('p-motion')) {
      seen.add(element.className);
    }
  };
  const observer = new MutationObserver(read);
  observer.observe(document.body, { attributes: true, subtree: true, childList: true });
  return () => {
    read();
    observer.disconnect();
    return [...seen].filter((name) => /enter-active|leave-active/.test(name));
  };
}

function find<E extends Element>(root: ParentNode, selector: string, type: new () => E): E {
  const found = root.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const stepEls = (root: ParentNode): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-wj-part="step"]'));

const panelEls = (root: ParentNode): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-wj-part="step-panel"]'));

/** A control inside the panel that is on show. */
const inActivePanel = (root: ParentNode, selector: string): HTMLElement =>
  find(root, `[data-wj-part="step-panel"][data-p-active="true"] ${selector}`, HTMLElement);

/**
 * True once every panel has reached its end state: the active one shown, every other one hidden,
 * and no enter or leave class left on any of them. Optimus starts a panel's motion a frame after
 * the value changes, so a read straight after the change would see the motion's start, not its end.
 */
const panelsSettled = (root: ParentNode): boolean =>
  panelEls(root).every((panel) => {
    const motion = find(panel, 'p-motion', HTMLElement);
    const shown = getComputedStyle(motion).display !== 'none';
    return (
      shown === (panel.getAttribute('data-p-active') === 'true') &&
      !/enter-active|leave-active/.test(motion.className)
    );
  });

/** The button inside a step, the element that is the Tab stop and carries the `tab` role. */
const buttonOf = (step: HTMLElement | undefined): HTMLButtonElement =>
  find(step ?? document.body, 'button', HTMLButtonElement);

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
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  const first = stepEls(element)[0];
  if (
    first &&
    getComputedStyle(find(first, '.p-step-number', HTMLElement)).borderTopWidth !== '2px'
  ) {
    throw new Error("Optimus's stepper styles did not load");
  }
  // Optimus shows the first active panel a frame after it renders: start from the settled page.
  await expect.poll(() => panelsSettled(element)).toBe(true);
  const stepper = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjStepperHarness);
  return { fixture, host: fixture.componentInstance, stepper, element };
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

/** The colour a CSS value resolves to inside `root`, as the browser reports it. */
function resolveColour(root: HTMLElement, value: string): string {
  const probe = document.createElement('i');
  probe.style.color = value;
  root.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
}

/** The documented states for axe (FR-32). */
const STATES: [string, (host: Host) => void][] = [
  ['step 1 active', () => undefined],
  [
    'linear',
    (host) => {
      host.linear.set(true);
    },
  ],
  [
    'the last step active',
    (host) => {
      host.value.set(3);
    },
  ],
  [
    'the middle step active, with Back and Next buttons in the panel',
    (host) => {
      host.value.set(2);
      host.nav.set(true);
    },
  ],
];

describe('WjStepper', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(async () => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Panels change instantly in the horizontal layout; a spec turns motion on where it needs it.
    reduceMotion(true);
    await page.viewport(1280, 800);
  });

  afterEach(async () => {
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
    await page.viewport(VIEWPORT.width, VIEWPORT.height);
  });

  describe('steps and parts', () => {
    it('draws every step in declaration order, each with its number, and shows the active panel', async () => {
      const { stepper } = await render();

      expect(await stepper.getStepTitles()).toEqual(['Details', 'Preferences', 'Confirm']);
      const all = await stepper.getSteps();
      expect(await Promise.all(all.map((step) => step.getNumber()))).toEqual([1, 2, 3]);
      expect(await Promise.all(all.map((step) => step.isActive()))).toEqual([true, false, false]);
      expect(await (await stepper.getActiveStep())?.getTitle()).toBe('Details');
      expect(await stepper.getActivePanelText()).toBe('Who you are.');
    });

    it('writes Optimus parts only in its own template, in Optimus’s structure', async () => {
      const { element } = await render();
      const root = find(find(element, 'wj-stepper', HTMLElement), 'p-stepper', HTMLElement);

      expect(Array.from(root.children).map((child) => child.localName)).toEqual([
        'p-step-list',
        'p-step-panels',
      ]);
      const list = find(root, 'p-step-list', HTMLElement);
      expect(
        Array.from(list.children)
          .filter((child) => child.localName !== '#comment')
          .map((child) => child.localName),
      ).toEqual(['p-step', 'p-step', 'p-step']);
      const panels = find(root, 'p-step-panels', HTMLElement);
      expect(Array.from(panels.children).map((child) => child.localName)).toEqual([
        'p-step-panel',
        'p-step-panel',
        'p-step-panel',
      ]);
      expect(
        root.querySelectorAll('wj-step-list, wj-step, wj-step-panels, wj-step-panel').length,
      ).toBe(0);
    });

    it('stamps each title, and the active panel’s content, once, inside the Optimus part', async () => {
      const { element } = await render();

      const bodies = Array.from(element.querySelectorAll('.body'));
      expect(bodies.length).toBe(1);
      expect(bodies[0]?.closest('[data-pc-section="content"]')).not.toBeNull();
      expect(bodies[0]?.closest('[data-wj-part="step-panel"]')).not.toBeNull();
      expect(bodies[0]?.closest('wj-step-panel')).toBeNull();
      expect(stepEls(element).map((step) => step.textContent.trim().replace(/^\d\s*/, ''))).toEqual(
        ['Details', 'Preferences', 'Confirm'],
      );
      expect(element.querySelectorAll('wj-step [data-wj-part]').length).toBe(0);
    });

    it('keeps the part hosts after the Optimus root, hidden and out of the layout', async () => {
      const { element } = await render();
      const host = find(element, 'wj-stepper', HTMLElement);

      expect(Array.from(host.children).map((child) => child.localName)).toEqual([
        'p-stepper',
        'wj-step-list',
        'wj-step-panels',
      ]);
      const hosts = host.querySelectorAll('wj-step-list, wj-step, wj-step-panels, wj-step-panel');
      expect(hosts.length).toBe(8);
      for (const part of hosts) {
        expect(part.hasAttribute('hidden')).toBe(true);
        expect(getComputedStyle(part).display).toBe('none');
        expect(part.getAttribute('class')).toBeNull();
        expect(part.getAttribute('style')).toBeNull();
      }
    });

    it('renders a step with no panel, and a panel with no step, without failing', async () => {
      const { element, stepper } = await render('light', (host) => {
        host.steps.set(STEPS.slice(0, 2));
        host.bonus.set(true);
      });

      expect(await stepper.getStepTitles()).toEqual(['Details', 'Preferences', 'Bonus']);
      expect(panelEls(element).length).toBe(3);
      await (await stepper.getSteps({ title: 'Bonus' }))[0]?.select();
      await expect.poll(() => stepper.getActivePanelText()).toBe('Only while it is declared.');
    });

    it('draws an empty row, and no Tab stop, with no steps', async () => {
      const { element } = await render('light', (host) => {
        host.steps.set([]);
      });
      find(element, '#before', HTMLElement).focus();

      expect(stepEls(element).length).toBe(0);
      expect(panelEls(element).length).toBe(0);
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
    });

    it('does not render content that is not a part', async () => {
      const { element } = await renderSmall(StrayHost);

      expect(element.querySelector('#stray')).toBeNull();
      expect(element.querySelector('#orphan')).toBeNull();
      expect(element.querySelector('#loose-in-list')).toBeNull();
      expect(element.querySelector('#loose-in-panels')).toBeNull();
      expect(stepEls(element).length).toBe(1);
      expect(panelEls(element).length).toBe(1);
    });

    it('keeps the same content nodes while the active step changes, stamping them once at a time', async () => {
      const { host, stepper, element } = await render();
      const first = find(element, '.body', HTMLElement);

      host.value.set(2);
      await expect.poll(() => stepper.getActivePanelText()).toBe('How we reach you.');
      // Optimus unmounts the old panel's content a frame after it hides the panel.
      await expect.poll(() => element.querySelectorAll('.body').length).toBe(1);
      expect(first.isConnected).toBe(false);

      host.value.set(1);
      await expect.poll(() => stepper.getActivePanelText()).toBe('Who you are.');
      await expect.poll(() => panelsSettled(element)).toBe(true);
      expect(find(element, '.body', HTMLElement)).toBe(first);
    });

    it('follows steps added, removed and reordered', async () => {
      const { host, stepper } = await render();

      host.steps.set([...STEPS].reverse());
      await expect
        .poll(() => stepper.getStepTitles())
        .toEqual(['Confirm', 'Preferences', 'Details']);
      expect(await stepper.getActivePanelText()).toBe('Who you are.');

      host.steps.set(STEPS.slice(1));
      await expect.poll(() => stepper.getStepTitles()).toEqual(['Preferences', 'Confirm']);
      expect(await stepper.getActiveStep()).toBeNull();

      host.bonus.set(true);
      await expect.poll(() => stepper.getStepTitles()).toEqual(['Preferences', 'Confirm', 'Bonus']);

      host.bonus.set(false);
      host.steps.set([]);
      await expect.poll(() => stepper.getStepTitles()).toEqual([]);
    });
  });

  describe('value', () => {
    it('shows the panel of the value it holds, and follows a value set from outside', async () => {
      const { host, stepper } = await render('light', (instance) => {
        instance.value.set(2);
      });

      expect(await (await stepper.getActiveStep())?.getTitle()).toBe('Preferences');
      expect(await stepper.getActivePanelText()).toBe('How we reach you.');

      host.value.set(3);
      await expect.poll(() => stepper.getActivePanelText()).toBe('Check and send.');
      expect(await (await stepper.getActiveStep())?.getTitle()).toBe('Confirm');
    });

    it('reports a step click once, and a click on the active step reports nothing new', async () => {
      const { host, stepper } = await render();
      const [first, second] = await stepper.getSteps();

      await second?.select();
      await expect.poll(() => stepper.getActivePanelText()).toBe('How we reach you.');
      expect(host.value()).toBe(2);

      await second?.select();
      await first?.select();
      await expect.poll(() => stepper.getActivePanelText()).toBe('Who you are.');
      expect(host.reported()).toEqual([2, 1]);
    });

    it('moves with Back and Next buttons in the panels that set the value', async () => {
      const { stepper, element } = await render('light', (host) => {
        host.nav.set(true);
      });

      inActivePanel(element, '.next').click();
      await expect.poll(() => stepper.getActivePanelText()).toContain('How we reach you.');
      inActivePanel(element, '.next').click();
      await expect.poll(() => stepper.getActivePanelText()).toContain('Check and send.');
      inActivePanel(element, '.back').click();
      await expect.poll(() => stepper.getActivePanelText()).toContain('How we reach you.');
      expect(await (await stepper.getActiveStep())?.getNumber()).toBe(2);
    });

    it('reports a key press the same way, once per press', async () => {
      const { host, stepper } = await render();
      const [, second, third] = await stepper.getSteps();

      await second?.focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => stepper.getActivePanelText()).toContain('How we reach you.');

      await third?.focus();
      await userEvent.keyboard(' ');
      await expect.poll(() => stepper.getActivePanelText()).toContain('Check and send.');
      expect(host.reported()).toEqual([2, 3]);
    });

    it('leaves no step active, shows no panel and reports nothing when the value matches no step', async () => {
      const { host, stepper, element } = await render('light', (instance) => {
        instance.value.set(42);
      });

      expect(await stepper.getActiveStep()).toBeNull();
      expect(await stepper.getActivePanelText()).toBeNull();
      expect(element.querySelectorAll('.body').length).toBe(0);
      expect(host.reported()).toEqual([]);
    });

    it('is a two-way model, and takes bare linear and disabled attributes', async () => {
      const { fixture, element } = await renderSmall(BareHost);
      const stepper = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjStepperHarness);
      const [a, b] = await stepper.getSteps();

      expect(element.querySelector('.p-readonly')).not.toBeNull();
      expect(await a?.isDisabled()).toBe(false);
      expect(await b?.isDisabled()).toBe(true);

      fixture.componentInstance.value.set(2);
      await expect.poll(() => stepper.getActivePanelText()).toBe('Bravo');
    });

    it('writes a step click back to a [(value)] binding', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();
      const stepper = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjStepperHarness);
      fixture.componentInstance.value.set(2);
      await expect.poll(() => stepper.getActivePanelText()).toBe('Bravo');
      expect(fixture.componentInstance.value()).toBe(2);
    });
  });

  describe('linear', () => {
    it('disables every step but the active one, and the Next button is the way forward', async () => {
      const { host, stepper, element } = await render('light', (instance) => {
        instance.linear.set(true);
        instance.nav.set(true);
      });
      const all = await stepper.getSteps();

      expect(await Promise.all(all.map((step) => step.isDisabled()))).toEqual([false, true, true]);
      expect(stepEls(element).map((step) => buttonOf(step).getAttribute('tabindex'))).toEqual([
        '0',
        '-1',
        '-1',
      ]);
      await all[2]?.select();
      expect(host.reported()).toEqual([]);

      inActivePanel(element, '.next').click();
      await expect.poll(() => all[1]?.isActive()).toBe(true);
      expect(await Promise.all(all.map((step) => step.isDisabled()))).toEqual([true, false, true]);
    });

    it('keeps an explicitly disabled step disabled when linear is off', async () => {
      const { stepper } = await render('light', (host) => {
        host.steps.set(STEPS.map((step) => ({ ...step, disabled: step.value === 2 })));
      });
      const [first, second, third] = await stepper.getSteps();

      expect(await first?.isDisabled()).toBe(false);
      expect(await second?.isDisabled()).toBe(true);
      expect(await third?.isDisabled()).toBe(false);
    });
  });

  describe('disabled step', () => {
    const withDisabled = (host: Host): void => {
      host.steps.set(STEPS.map((step) => ({ ...step, disabled: step.value === 2 })));
    };

    it('cannot be activated, takes no focus and is not clickable', async () => {
      const { host, stepper, element } = await render('light', withDisabled);
      const second = (await stepper.getSteps())[1];

      expect(await second?.isDisabled()).toBe(true);
      expect(buttonOf(stepEls(element)[1]).getAttribute('tabindex')).toBe('-1');
      await second?.select();
      expect(await second?.isActive()).toBe(false);
      expect(await stepper.getActivePanelText()).toBe('Who you are.');
      expect(host.reported()).toEqual([]);
    });

    it('is skipped by the Tab key', async () => {
      const { element } = await render('light', withDisabled);
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(buttonOf(stepEls(element)[0]));
      await userEvent.tab();
      expect(document.activeElement).toBe(buttonOf(stepEls(element)[2]));
    });
  });

  describe('pt', () => {
    it('reaches the stepper, the step list, a step and its parts, the panels and a panel and its parts', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ root: { 'data-probe': 'stepper' } });
        host.listPt.set({ root: { 'data-probe': 'list' } });
        host.panelsPt.set({ root: { 'data-probe': 'panels' } });
        host.steps.set(
          STEPS.map((step) => ({
            ...step,
            pt: {
              root: { 'data-probe': `step-${String(step.value)}` },
              header: { 'data-probe': `header-${String(step.value)}` },
              number: { 'data-probe': `number-${String(step.value)}` },
              title: { 'data-probe': `title-${String(step.value)}` },
            },
            panelPt: {
              root: { 'data-probe': `panel-${String(step.value)}` },
              contentWrapper: { 'data-probe': `wrapper-${String(step.value)}` },
              content: { 'data-probe': `content-${String(step.value)}` },
            },
          })),
        );
      });

      const probe = (name: string): Element | null =>
        element.querySelector(`[data-probe="${name}"]`);
      expect(probe('stepper')?.localName).toBe('p-stepper');
      expect(probe('list')?.localName).toBe('p-step-list');
      expect(probe('panels')?.localName).toBe('p-step-panels');
      expect(probe('step-2')?.localName).toBe('p-step');
      expect(probe('header-2')?.localName).toBe('button');
      expect(probe('number-2')?.localName).toBe('span');
      expect(probe('title-2')?.localName).toBe('span');
      expect(probe('panel-1')?.localName).toBe('p-step-panel');
      expect(probe('wrapper-1')?.localName).toBe('div');
      expect(probe('content-1')?.localName).toBe('div');
    });

    it('accepts a class string and the function form for a part', async () => {
      const { element } = await render('light', (host) => {
        host.steps.set([
          {
            ...STEPS[0],
            value: 1,
            title: 'Details',
            body: 'Who you are.',
            pt: { root: 'probe-class' },
            panelPt: () => ({ root: () => ({ 'data-probe': 'fn' }) }),
          },
        ]);
      });

      expect(find(element, 'p-step', HTMLElement).classList.contains('probe-class')).toBe(true);
      expect(find(element, '[data-probe="fn"]', HTMLElement).localName).toBe('p-step-panel');
    });

    it('changes nothing when no pt is given', async () => {
      const { element } = await render();

      expect(element.querySelector('[data-probe]')).toBeNull();
    });
  });

  describe('the routed attributes', () => {
    it('makes the stepper root neutral and the step list the tab list', async () => {
      const { element } = await render();

      expect(find(element, 'p-stepper', HTMLElement).getAttribute('role')).toBe('presentation');
      expect(find(element, 'p-step-list', HTMLElement).getAttribute('role')).toBe('tablist');
      expect(element.querySelectorAll('[role="tablist"]').length).toBe(1);
      expect(
        find(element, '[role="tablist"]', HTMLElement).contains(
          find(element, 'p-step-panels', HTMLElement),
        ),
      ).toBe(false);
    });

    it('puts aria-selected on every step button, true only on the active one', async () => {
      const { element } = await render('light', (host) => {
        host.value.set(2);
      });

      expect(stepEls(element).map((step) => buttonOf(step).getAttribute('aria-selected'))).toEqual([
        'false',
        'true',
        'false',
      ]);
      expect(stepEls(element).map((step) => buttonOf(step).getAttribute('role'))).toEqual([
        'tab',
        'tab',
        'tab',
      ]);
    });

    it('moves aria-current from the step element to the active step button, and keeps it there', async () => {
      const { host, element } = await render();
      const current = (): (string | null)[] =>
        stepEls(element).map((step) => buttonOf(step).getAttribute('aria-current'));

      expect(current()).toEqual(['step', null, null]);
      expect(element.querySelectorAll('p-step[aria-current]').length).toBe(0);

      for (const [value, expected] of [
        [2, [null, 'step', null]],
        [3, [null, null, 'step']],
        [1, ['step', null, null]],
      ] as const) {
        host.value.set(value);
        await expect.poll(current).toEqual([...expected]);
        // Optimus re-sets the attribute on the step element when it turns active; the routed
        // removal has to win every time, not only at the first render.
        await expect.poll(() => element.querySelectorAll('p-step[aria-current]').length).toBe(0);
      }
    });

    it('follows a click the same way', async () => {
      const { stepper, element } = await render();

      await (await stepper.getSteps())[1]?.select();
      await expect
        .poll(() => buttonOf(stepEls(element)[1]).getAttribute('aria-selected'))
        .toBe('true');
      expect(buttonOf(stepEls(element)[0]).getAttribute('aria-selected')).toBe('false');
      expect(buttonOf(stepEls(element)[1]).getAttribute('aria-current')).toBe('step');
      expect(element.querySelectorAll('p-step[aria-current]').length).toBe(0);
    });

    it('keeps the consumer’s pt keys on the same parts, and lets a routed attribute win over the same key', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ root: { 'data-probe': 'stepper', role: 'tablist' } });
        host.listPt.set({ root: { 'data-probe': 'list', role: 'group' } });
        host.steps.set(
          STEPS.map((step) => ({
            ...step,
            pt: {
              header: { 'data-probe': `header-${String(step.value)}`, 'aria-selected': 'false' },
            },
          })),
        );
      });

      expect(element.querySelector('[data-probe="stepper"]')?.getAttribute('role')).toBe(
        'presentation',
      );
      expect(element.querySelector('[data-probe="list"]')?.getAttribute('role')).toBe('tablist');
      expect(element.querySelector('[data-probe="header-1"]')?.getAttribute('aria-selected')).toBe(
        'true',
      );
      expect(element.querySelector('[data-probe="header-2"]')?.getAttribute('aria-selected')).toBe(
        'false',
      );
    });

    it('keeps a consumer’s own aria-current on a step element when they set one', async () => {
      const { element } = await render('light', (host) => {
        host.steps.set(
          STEPS.map((step) => ({
            ...step,
            pt: step.value === 3 ? { root: { 'aria-current': 'location' } } : undefined,
          })),
        );
      });

      expect(find(element, 'p-step:last-of-type', HTMLElement).getAttribute('aria-current')).toBe(
        'location',
      );
    });
  });

  describe('host attributes and setup', () => {
    it.each([
      ['wj-stepper', AriaOnMainHost, 'Remove it: the steps and panels name themselves'],
      ['wj-step-list', AriaOnListHost, 'Remove it: each step is named by its own text'],
      ['wj-step', AriaOnStepHost, 'Remove it: the step is named by its own text'],
      ['wj-step-panels', AriaOnPanelsHost, 'Remove it: each panel is tied to its step'],
      ['wj-step-panel', AriaOnPanelHost, 'Remove it: the panel is tied to its step'],
    ])('warns WJ0003 for aria-* on %s and forwards nothing', async (selector, type, instead) => {
      const { element } = await renderSmall(type);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        `WJ0003: ${selector}: aria-label is set on the host, where it is not forwarded to the ` +
          `focusable element. ${instead}. ` +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(element.querySelector('[aria-label]:not(' + selector + ')')).toBeNull();
    });

    it('stays silent when no host carries aria-*', async () => {
      await render();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      await renderSmall(BareHost, false);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-stepper: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('rendering safety', () => {
    it('shows an HTML payload in a step title and in a panel as text, never as markup', async () => {
      const { element } = await renderSmall(PayloadHost);

      expect(element.querySelector('img')).toBeNull();
      expect(
        stepEls(element)[0]?.querySelector('[data-pc-section="title"]')?.textContent,
      ).toContain(PAYLOAD);
      expect(
        panelEls(element)[0]?.querySelector('[data-pc-section="content"]')?.textContent,
      ).toContain(PAYLOAD);
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('layout', () => {
    it('is a block with no box of its own', async () => {
      const { element } = await render();
      const style = getComputedStyle(find(element, 'wj-stepper', HTMLElement));

      expect(style.display).toBe('block');
      expect(style.padding).toBe('0px');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.margin).toBe('0px');
    });

    it('lets a step title wrap at spaces, and never ellipsizes it', async () => {
      const { element } = await render('light', (host) => {
        host.steps.set(
          STEPS.map((step) =>
            step.value === 2 ? { ...step, title: 'Shipping address and billing details' } : step,
          ),
        );
        host.width.set('300px');
      });
      const titles = Array.from(element.querySelectorAll<HTMLElement>('[data-pc-section="title"]'));
      const [short, long] = titles;
      if (!short || !long) {
        throw new Error('the titles are missing');
      }

      for (const title of titles) {
        const style = getComputedStyle(title);
        expect(style.whiteSpace).toBe('normal');
        expect(style.textOverflow).toBe('clip');
        expect(style.overflow).toBe('visible');
        expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
      }
      expect(long.getBoundingClientRect().height).toBeGreaterThan(
        short.getBoundingClientRect().height * 1.5,
      );
    });

    it('scrolls the step list inside the host instead of narrowing a step below its longest word', async () => {
      const { element } = await render('light', (host) => {
        host.width.set('150px');
      });
      const list = find(element, 'p-step-list', HTMLElement);

      expect(getComputedStyle(list).overflowX).toBe('auto');
      expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
      expect(
        find(element, 'wj-stepper', HTMLElement).getBoundingClientRect().width,
      ).toBeLessThanOrEqual(150);
      for (const title of element.querySelectorAll<HTMLElement>('[data-pc-section="title"]')) {
        expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
      }
    });

    it('fills the active step’s number with the primary colour, and no other', async () => {
      const { element } = await render('light', (host) => {
        host.value.set(2);
      });
      await userEvent.hover(find(element, '#before', HTMLElement));
      const host = find(element, 'wj-stepper', HTMLElement);
      const numbers = Array.from(
        element.querySelectorAll<HTMLElement>('[data-pc-section="number"]'),
      );
      const primary = resolveColour(element, 'var(--wj-primary-color)');
      const contrast = resolveColour(element, 'var(--wj-primary-contrast-color)');
      const active = numbers[1];
      const other = numbers[0];

      expect(getComputedStyle(active ?? element).backgroundColor).toBe(primary);
      expect(getComputedStyle(active ?? element).borderTopColor).toBe(primary);
      expect(getComputedStyle(active ?? element).color).toBe(contrast);
      expect(getComputedStyle(other ?? element).backgroundColor).not.toBe(primary);
      const variables = getComputedStyle(host);
      expect(variables.getPropertyValue('--wj-stepper-step-number-active-background')).toBe(
        variables.getPropertyValue('--wj-primary-color'),
      );
    });
  });

  describe('hit boxes', () => {
    it('makes every step button at least 24 by 24 px', async () => {
      const { element } = await render();

      for (const step of stepEls(element)) {
        const box = buttonOf(step).getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(find(element, 'wj-stepper', HTMLElement));
      });

      it('has no axe violations after the active step changed by a click', async () => {
        const { element, stepper } = await render(scheme);

        await (await stepper.getSteps())[2]?.select();
        await expect.poll(async () => (await stepper.getActiveStep())?.getTitle()).toBe('Confirm');
        await expectNoAxeViolations(find(element, 'wj-stepper', HTMLElement));
      });
    });
  });

  describe('keyboard', () => {
    it('makes every enabled step button its own Tab stop, then the panel’s controls, then the page', async () => {
      const { element } = await render('light', (host) => {
        host.nav.set(true);
      });
      find(element, '#before', HTMLElement).focus();

      for (const step of stepEls(element)) {
        await userEvent.tab();
        expect(document.activeElement).toBe(buttonOf(step));
      }
      await userEvent.tab();
      expect(document.activeElement).toBe(inActivePanel(element, '.back'));
      await userEvent.tab();
      expect(document.activeElement).toBe(inActivePanel(element, '.next'));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      await userEvent.tab({ shift: true });
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(buttonOf(stepEls(element)[2]));
    });

    it('under linear, lands only on the active step', async () => {
      const { element } = await render('light', (host) => {
        host.linear.set(true);
        host.value.set(2);
      });
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(buttonOf(stepEls(element)[1]));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
    });

    it('Enter and Space activate the focused step, once per press', async () => {
      const { stepper, host } = await render();
      const [, second, third] = await stepper.getSteps();

      await second?.focus();
      expect(await second?.isActive()).toBe(false);
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => second?.isActive()).toBe(true);

      await third?.focus();
      await userEvent.keyboard(' ');
      await expect.poll(() => third?.isActive()).toBe(true);
      expect(host.reported()).toEqual([2, 3]);
    });

    it('does nothing for the arrow keys, Home and End: focus stays and no step is activated (the listed gap)', async () => {
      const { stepper, host } = await render();
      const [first, second] = await stepper.getSteps();
      await first?.focus();

      for (const key of [
        '{ArrowRight}',
        '{ArrowLeft}',
        '{ArrowDown}',
        '{ArrowUp}',
        '{End}',
        '{Home}',
      ]) {
        await userEvent.keyboard(key);
        expect(await first?.isFocused()).toBe(true);
      }
      expect(await second?.isFocused()).toBe(false);
      expect(await first?.isActive()).toBe(true);
      expect(host.reported()).toEqual([]);
    });
  });

  describe('harness', () => {
    it('finds steps by title and reports state', async () => {
      const { stepper } = await render('light', (host) => {
        host.steps.set(STEPS.map((step) => ({ ...step, disabled: step.value === 3 })));
      });

      const preferences = await stepper.getSteps({ title: 'Preferences' });
      expect(preferences.length).toBe(1);
      expect(await preferences[0]?.getNumber()).toBe(2);
      expect(await preferences[0]?.isDisabled()).toBe(false);
      expect((await stepper.getSteps({ title: /^C/ })).length).toBe(1);
      expect(await (await stepper.getSteps({ title: 'Confirm' }))[0]?.isDisabled()).toBe(true);
    });

    it('finds one step through the loader and drives it', async () => {
      const { fixture } = await render();
      const step = await TestbedHarnessEnvironment.loader(fixture).getHarness(
        WjStepHarness.with({ title: 'Confirm' }),
      );

      expect(await step.isActive()).toBe(false);
      await step.select();
      await expect.poll(() => step.isActive()).toBe(true);
      await step.focus();
      expect(await step.isFocused()).toBe(true);
    });

    it('names no Optimus class', () => {
      expect(WjStepHarness.hostSelector).toBe('[data-wj-part="step"]');
      expect(WjStepperHarness.hostSelector).toBe('wj-stepper');
    });
  });

  describe('motion', () => {
    // In the horizontal layout Optimus switches the panel's motion off, so a panel change is
    // instant. Optimus reads a `disabled` from `pt.motion` over its own, which lets a spec turn the
    // motion back on and prove that `safe: true`, bound on the stepper, still stops it under
    // reduced motion. A control with no preference shows the recorder sees the motion when it runs.
    const motionOn: WjStepperPt = { motion: { disabled: false } };

    const changeStep = async (
      host: Host,
      stepper: WjStepperHarness,
      element: HTMLElement,
    ): Promise<void> => {
      host.value.set(2);
      await expect.poll(() => stepper.getActivePanelText()).toBe('How we reach you.');
      await expect.poll(() => panelsSettled(element)).toBe(true);
      host.value.set(1);
      await expect.poll(() => stepper.getActivePanelText()).toBe('Who you are.');
      await expect.poll(() => panelsSettled(element)).toBe(true);
    };

    it('changes a panel at once, with no enter or leave motion, by default', async () => {
      reduceMotion(false);
      const { host, stepper, element } = await render();
      const stop = recordMotion();

      await changeStep(host, stepper, element);

      expect(stop()).toEqual([]);
    });

    it('plays no enter or leave motion under reduced motion, even when the motion is switched back on', async () => {
      const { host, stepper, element } = await render('light', (instance) => {
        instance.pt.set(motionOn);
      });
      const stop = recordMotion();

      await changeStep(host, stepper, element);

      expect(stop()).toEqual([]);
      expect(host.value()).toBe(1);
    });

    it('pt.motion cannot switch safe off', async () => {
      const { host, stepper, element } = await render('light', (instance) => {
        instance.pt.set({ motion: { disabled: false, safe: false } });
      });
      const stop = recordMotion();

      await changeStep(host, stepper, element);

      expect(stop()).toEqual([]);
    });

    it('plays the motion once switched back on when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const { host, stepper, element } = await render('light', (instance) => {
        instance.pt.set(motionOn);
      });
      const stop = recordMotion();

      await changeStep(host, stepper, element);

      expect(stop().length).toBeGreaterThan(0);
    });
  });
});
