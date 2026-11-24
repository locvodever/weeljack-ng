import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import {
  WjCard,
  WjCardFooterSlot,
  WjCardHeaderSlot,
  WjCardSubtitleSlot,
  WjCardTitleSlot,
  type WjCardPt,
} from 'weeljack-ng/card';
import { WjCardHarness } from 'weeljack-ng/card/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/**
 * A consumer's template: native buttons around one card, every text and slot driven by signals.
 * The header slot and the footer slot each hold a `wj-button`, so the Tab order can be walked.
 */
@Component({
  selector: 'wj-card-host',
  imports: [
    WjCard,
    WjCardHeaderSlot,
    WjCardTitleSlot,
    WjCardSubtitleSlot,
    WjCardFooterSlot,
    WjButton,
  ],
  template: `
    <button type="button" id="before">Before</button>
    <div [style.width]="width()">
      <wj-card [header]="header()" [subheader]="subheader()" [pt]="pt()">
        @if (headerSlot()) {
          <ng-template wjCardHeader>
            <wj-button class="slot-header" [label]="headerSlot()" size="small" />
          </ng-template>
        }
        @if (titleSlot()) {
          <ng-template wjCardTitle>
            <h4 class="slot-title">{{ titleSlot() }}</h4>
          </ng-template>
        }
        @if (subtitleSlot()) {
          <ng-template wjCardSubtitle>
            <span class="slot-subtitle">{{ subtitleSlot() }}</span>
          </ng-template>
        }
        <p class="body">Twelve tasks closed and three opened.</p>
        <button type="button" class="action">Action</button>
        @if (footerLabels().length > 0) {
          <ng-template wjCardFooter>
            @for (label of footerLabels(); track label) {
              <wj-button
                class="slot-footer"
                [label]="label"
                size="small"
                (click)="clicked(label)"
              />
            }
          </ng-template>
        }
      </wj-card>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly header = signal<string | undefined>('Weekly summary');
  readonly subheader = signal<string | undefined>('Week 46');
  readonly pt = signal<WjCardPt>(undefined);
  readonly headerSlot = signal<string | undefined>(undefined);
  readonly titleSlot = signal<string | undefined>(undefined);
  readonly subtitleSlot = signal<string | undefined>(undefined);
  readonly footerLabels = signal<string[]>([]);
  readonly width = signal<string | undefined>(undefined);
  /** The footer buttons the user clicked, in order. */
  readonly clickedLabels = signal<string[]>([]);

  protected clicked(label: string): void {
    this.clickedLabels.update((list) => [...list, label]);
  }
}

/** A card with no text, no slot and a bare `wj-card`: content only. */
@Component({
  selector: 'wj-card-plain-host',
  imports: [WjCard],
  template: `<wj-card><p class="body">Just content.</p></wj-card>`,
})
class PlainHost {}

/** A card used as a landmark: the app's `role` and `aria-label` on the host apply as written. */
@Component({
  selector: 'wj-card-landmark-host',
  imports: [WjCard],
  template: `
    <wj-card role="region" aria-label="Weekly summary" header="Weekly summary">
      <p class="body">Twelve tasks closed.</p>
    </wj-card>
  `,
})
class LandmarkHost {}

/** Two cards in a stretching grid row: the short one must fill the row and pin its footer. */
@Component({
  selector: 'wj-card-row-host',
  imports: [WjCard, WjCardFooterSlot, WjButton],
  template: `
    <div class="row">
      <wj-card id="short" header="Short">
        <p>One line.</p>
        <ng-template wjCardFooter><wj-button label="Open" size="small" /></ng-template>
      </wj-card>
      <wj-card id="tall" header="Tall">
        <p>A much longer body that goes on for a good while so that it wraps over several lines.</p>
        <p>A second paragraph makes it taller still, and a third one makes sure of it.</p>
        <ng-template wjCardFooter><wj-button label="Open" size="small" /></ng-template>
      </wj-card>
    </div>
  `,
  styles: `
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: 100%;
    }
  `,
})
class RowHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  card: WjCardHarness;
  element: HTMLElement;
}

function find<E extends Element>(root: ParentNode, selector: string, type: new () => E): E {
  const found = root.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const sectionOf = (root: ParentNode, section: string): HTMLElement =>
  find(root, `[data-pc-section="${section}"]`, HTMLElement);
const rootOf = (root: ParentNode): HTMLElement => find(root, 'p-card', HTMLElement);
const hostOf = (root: ParentNode): HTMLElement => find(root, 'wj-card', HTMLElement);
const count = (root: ParentNode, selector: string): number =>
  root.querySelectorAll(selector).length;

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
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(rootOf(element)).borderTopLeftRadius).toBe('12px');
  const card = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjCardHarness);
  return { fixture, host: fixture.componentInstance, card, element };
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

/** The colour `--wj-content-border-color` resolves to, read through a probe element. */
function edgeColour(): string {
  const probe = document.createElement('div');
  probe.style.borderColor = 'var(--wj-content-border-color)';
  probe.style.borderStyle = 'solid';
  document.body.append(probe);
  const colour = getComputedStyle(probe).borderTopColor;
  probe.remove();
  return colour;
}

/** The documented states for axe (FR-17). */
const STATES: [string, (host: Host) => void][] = [
  ['header, subheader and content', () => undefined],
  [
    'all four slots and content',
    (host) => {
      host.headerSlot.set('Picture link');
      host.titleSlot.set('Release notes');
      host.subtitleSlot.set('Version 2.4');
      host.footerLabels.set(['Details', 'Book']);
    },
  ],
  [
    'content only',
    (host) => {
      host.header.set(undefined);
      host.subheader.set(undefined);
    },
  ],
];

describe('WjCard', () => {
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

  describe('inputs and content', () => {
    it('shows header and subheader as the title and subtitle, and the content in the box', async () => {
      const { card, element } = await render();

      expect(await card.getTitle()).toBe('Weekly summary');
      expect(await card.getSubtitle()).toBe('Week 46');
      expect(await card.getContentText()).toContain('Twelve tasks closed and three opened.');
      expect(sectionOf(element, 'content').querySelector('.body')).not.toBeNull();
      expect(await card.hasHeader()).toBe(false);
      expect(await card.hasFooter()).toBe(false);
    });

    it('draws no title or subtitle part for a card with neither text nor slot', async () => {
      const { fixture, element } = await renderSmall(PlainHost);
      const card = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjCardHarness);

      expect(element.querySelector('[data-pc-section="title"]')).toBeNull();
      expect(element.querySelector('[data-pc-section="subtitle"]')).toBeNull();
      expect(await card.getTitle()).toBe('');
      expect(await card.getSubtitle()).toBe('');
      expect(await card.getContentText()).toBe('Just content.');
    });

    it('draws the title and subtitle from header and subheader independently', async () => {
      const { card, element } = await render('light', (host) => {
        host.subheader.set(undefined);
      });

      expect(await card.getTitle()).toBe('Weekly summary');
      expect(element.querySelector('[data-pc-section="subtitle"]')).toBeNull();
    });

    it('is a block with no box of its own, and the root has the same box', async () => {
      const { element } = await render();
      const host = hostOf(element);
      const style = getComputedStyle(host);

      expect(style.display).toBe('block');
      expect(style.padding).toBe('0px');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(host.getBoundingClientRect().toJSON()).toEqual(
        rootOf(element).getBoundingClientRect().toJSON(),
      );
    });

    it('is not interactive: no tabindex and no role of its own', async () => {
      const { element } = await render();

      expect(hostOf(element).hasAttribute('tabindex')).toBe(false);
      expect(rootOf(element).hasAttribute('tabindex')).toBe(false);
      expect(rootOf(element).hasAttribute('role')).toBe(false);
    });
  });

  describe('slots', () => {
    it('renders each slot in its own part', async () => {
      const { element, card } = await render('light', (host) => {
        host.headerSlot.set('Picture link');
        host.titleSlot.set('Release notes');
        host.subtitleSlot.set('Version 2.4');
        host.footerLabels.set(['Details']);
      });

      expect(sectionOf(element, 'header').querySelector('.slot-header')?.textContent.trim()).toBe(
        'Picture link',
      );
      expect(sectionOf(element, 'title').querySelector('.slot-title')?.textContent).toBe(
        'Release notes',
      );
      expect(sectionOf(element, 'subtitle').querySelector('.slot-subtitle')?.textContent).toBe(
        'Version 2.4',
      );
      expect(sectionOf(element, 'footer').querySelector('.slot-footer')).not.toBeNull();
      expect(await card.hasHeader()).toBe(true);
      expect(await card.hasFooter()).toBe(true);
      expect(count(element, '.slot-header')).toBe(1);
      expect(count(element, '.slot-title')).toBe(1);
      expect(count(element, '.slot-subtitle')).toBe(1);
      expect(count(element, '.slot-footer')).toBe(1);
    });

    it('puts the header region above the body and the footer last in the body', async () => {
      const { element } = await render('light', (host) => {
        host.headerSlot.set('Picture link');
        host.footerLabels.set(['Details']);
      });
      const header = sectionOf(element, 'header');
      const body = sectionOf(element, 'body');

      expect(header.nextElementSibling).toBe(body);
      expect(rootOf(element).firstElementChild).toBe(header);
      expect(body.lastElementChild).toBe(sectionOf(element, 'footer'));
      expect(sectionOf(element, 'footer').previousElementSibling).toBe(
        sectionOf(element, 'content'),
      );
    });

    it('lets the title slot win over header, and the subtitle slot over subheader', async () => {
      const { element, card } = await render('light', (host) => {
        host.titleSlot.set('Release notes');
        host.subtitleSlot.set('Version 2.4');
      });

      expect(await card.getTitle()).toBe('Release notes');
      expect(await card.getSubtitle()).toBe('Version 2.4');
      expect(sectionOf(element, 'title').textContent).not.toContain('Weekly summary');
      expect(sectionOf(element, 'subtitle').textContent).not.toContain('Week 46');
    });

    it('draws no region for a slot nobody filled', async () => {
      const { element, card } = await render();

      expect(element.querySelector('[data-pc-section="header"]')).toBeNull();
      expect(element.querySelector('[data-pc-section="footer"]')).toBeNull();
      expect(await card.hasHeader()).toBe(false);
      expect(await card.hasFooter()).toBe(false);
    });

    it('follows slots that appear and go after the card was created', async () => {
      const { host, element, card } = await render();

      host.headerSlot.set('Picture link');
      host.titleSlot.set('Release notes');
      host.subtitleSlot.set('Version 2.4');
      host.footerLabels.set(['Details']);
      await expect.poll(() => count(element, '.slot-header')).toBe(1);
      await expect.poll(() => count(element, '.slot-title')).toBe(1);
      await expect.poll(() => count(element, '.slot-subtitle')).toBe(1);
      await expect.poll(() => count(element, '.slot-footer')).toBe(1);
      expect(await card.getTitle()).toBe('Release notes');
      expect(await card.getSubtitle()).toBe('Version 2.4');
      expect(await card.hasHeader()).toBe(true);
      expect(await card.hasFooter()).toBe(true);

      host.headerSlot.set(undefined);
      host.titleSlot.set(undefined);
      host.subtitleSlot.set(undefined);
      host.footerLabels.set([]);
      await expect.poll(() => count(element, '.slot-header')).toBe(0);
      await expect.poll(() => count(element, '.slot-title')).toBe(0);
      await expect.poll(() => count(element, '.slot-subtitle')).toBe(0);
      await expect.poll(() => count(element, '.slot-footer')).toBe(0);
      // The strings come back when their slots go.
      await expect.poll(() => card.getTitle()).toBe('Weekly summary');
      await expect.poll(() => card.getSubtitle()).toBe('Week 46');
      expect(await card.hasHeader()).toBe(false);
      expect(await card.hasFooter()).toBe(false);
    });
  });

  describe('harness', () => {
    it('finds a card by its title text, from the header input or the title slot', async () => {
      const { fixture } = await render('light', (host) => {
        host.header.set(undefined);
        host.titleSlot.set('Release notes');
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(await loader.hasHarness(WjCardHarness.with({ title: 'Release notes' }))).toBe(true);
      expect(await loader.hasHarness(WjCardHarness.with({ title: /^Release/ }))).toBe(true);
      expect(await loader.hasHarness(WjCardHarness.with({ title: 'Weekly summary' }))).toBe(false);
    });

    it('reaches a wj-button in the footer through the card, and clicks it', async () => {
      const { host, card } = await render('light', (instance) => {
        instance.footerLabels.set(['Details', 'Book']);
      });

      const book = await card.getHarness(WjButtonHarness.with({ label: 'Book' }));
      await book.click();

      expect(host.clickedLabels()).toEqual(['Book']);
      expect(await card.countHarnesses(WjButtonHarness)).toBe(2);
    });
  });

  describe('pt', () => {
    it('reaches the root, title and footer, and the other parts, as an object', async () => {
      const probe = (name: string): { 'data-probe': string } => ({ 'data-probe': name });
      const { element } = await render('light', (host) => {
        host.headerSlot.set('Picture link');
        host.footerLabels.set(['Details']);
        host.pt.set({
          root: probe('root'),
          header: probe('header'),
          body: probe('body'),
          title: probe('title'),
          subtitle: probe('subtitle'),
          content: probe('content'),
          footer: probe('footer'),
        });
      });

      const at = (name: string): Element | null => element.querySelector(`[data-probe="${name}"]`);
      expect(at('root')?.localName).toBe('p-card');
      expect(at('header')?.getAttribute('data-pc-section')).toBe('header');
      expect(at('body')?.getAttribute('data-pc-section')).toBe('body');
      expect(at('title')?.getAttribute('data-pc-section')).toBe('title');
      expect(at('subtitle')?.getAttribute('data-pc-section')).toBe('subtitle');
      expect(at('content')?.getAttribute('data-pc-section')).toBe('content');
      expect(at('footer')?.getAttribute('data-pc-section')).toBe('footer');
    });

    it('reaches the root, title and footer, as a function', async () => {
      const { element } = await render('light', (host) => {
        host.footerLabels.set(['Details']);
        host.pt.set({
          root: () => ({ 'data-probe': 'root-fn' }),
          title: () => ({ 'data-probe': 'title-fn' }),
          footer: () => ({ 'data-probe': 'footer-fn' }),
        });
      });

      expect(find(element, '[data-probe="root-fn"]', HTMLElement).localName).toBe('p-card');
      expect(find(element, '[data-probe="title-fn"]', HTMLElement).textContent.trim()).toBe(
        'Weekly summary',
      );
      expect(
        find(element, '[data-probe="footer-fn"]', HTMLElement).getAttribute('data-pc-section'),
      ).toBe('footer');
    });

    it('accepts a class string for a part, and follows a changed pt', async () => {
      const { host, element } = await render('light', (instance) => {
        instance.pt.set({ title: 'probe-class' });
      });

      expect(sectionOf(element, 'title').classList.contains('probe-class')).toBe(true);

      host.pt.set({ title: { 'data-probe': 'later' } });
      await expect.poll(() => sectionOf(element, 'title').getAttribute('data-probe')).toBe('later');
    });

    it('changes nothing visible when no pt is given', async () => {
      const { element } = await render();

      expect(element.querySelector('[data-probe]')).toBeNull();
    });
  });

  describe('host attributes', () => {
    it('applies an app role and aria-label on the host as written, with no warning', async () => {
      const { element } = await renderSmall(LandmarkHost);
      const host = hostOf(element);

      expect(host.getAttribute('role')).toBe('region');
      expect(host.getAttribute('aria-label')).toBe('Weekly summary');
      expect(warn).not.toHaveBeenCalled();
      await expectNoAxeViolations(host);
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      await renderSmall(PlainHost, false);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-card: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('rendering safety', () => {
    it('shows an HTML payload in header and subheader as text, never as markup', async () => {
      const { element, card } = await render('light', (host) => {
        host.header.set(PAYLOAD);
        host.subheader.set(PAYLOAD);
      });

      expect(await card.getTitle()).toBe(PAYLOAD);
      expect(await card.getSubtitle()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(sectionOf(element, 'title').children.length).toBe(0);
      expect(sectionOf(element, 'subtitle').children.length).toBe(0);
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('look', () => {
    it.each<Scheme>(['light', 'dark'])(
      'has a 12 px radius and one 1 px content-border edge (%s)',
      async (scheme) => {
        const { element } = await render(scheme);
        const style = getComputedStyle(rootOf(element));

        expect(style.borderTopLeftRadius).toBe('12px');
        expect(style.borderTopWidth).toBe('1px');
        expect(style.borderTopStyle).toBe('solid');
        expect(style.borderTopColor).toBe(edgeColour());
        expect(style.boxShadow).not.toBe('none');
      },
    );

    it('clips the header region to the top corners', async () => {
      const { element } = await render('light', (host) => {
        host.headerSlot.set('Picture link');
      });
      const style = getComputedStyle(sectionOf(element, 'header'));

      expect(style.overflow).toBe('hidden');
      expect(style.borderTopLeftRadius).toBe('12px');
      expect(style.borderTopRightRadius).toBe('12px');
      expect(style.borderBottomLeftRadius).toBe('0px');
      expect(style.padding).toBe('0px');
    });

    it('gives a heading in the title slot the title look and no margin', async () => {
      const { element } = await render('light', (host) => {
        host.titleSlot.set('Release notes');
      });
      const title = getComputedStyle(sectionOf(element, 'title'));
      const heading = getComputedStyle(find(element, 'h4', HTMLElement));

      expect(heading.marginTop).toBe('0px');
      expect(heading.marginBottom).toBe('0px');
      expect(heading.fontSize).toBe(title.fontSize);
      expect(heading.fontSize).toBe('20px');
      expect(heading.fontWeight).toBe('500');
    });

    it('lays the footer out as a centred, wrapping row at least 16 px under the content', async () => {
      const { element } = await render('light', (host) => {
        host.footerLabels.set(['Details', 'Book']);
      });
      const footer = sectionOf(element, 'footer');
      const style = getComputedStyle(footer);
      const [first, second] = Array.from(footer.querySelectorAll('wj-button'));

      expect(style.display).toBe('flex');
      expect(style.flexWrap).toBe('wrap');
      expect(style.alignItems).toBe('center');
      expect(style.columnGap).toBe('8px');
      expect(first?.nextElementSibling).toBe(second);
      expect(
        (second?.getBoundingClientRect().left ?? 0) - (first?.getBoundingClientRect().right ?? 0),
      ).toBe(8);
      expect(
        (first?.getBoundingClientRect().top ?? 0) -
          sectionOf(element, 'content').getBoundingClientRect().bottom,
      ).toBeGreaterThanOrEqual(16);
    });

    it('wraps footer actions onto new lines when the card is narrow', async () => {
      const { element } = await render('light', (host) => {
        host.width.set('9rem');
        host.footerLabels.set(['Details', 'Book', 'Share']);
      });
      const tops = new Set(
        Array.from(sectionOf(element, 'footer').querySelectorAll('wj-button')).map(
          (button) => button.getBoundingClientRect().top,
        ),
      );

      expect(tops.size).toBeGreaterThan(1);
    });

    it('wraps a long title and subtitle and never truncates them', async () => {
      const { element } = await render('light', (host) => {
        host.width.set('12rem');
        host.header.set('A very long card title that keeps going and going');
        host.subheader.set('An equally long subtitle that also keeps on going');
      });

      for (const part of [sectionOf(element, 'title'), sectionOf(element, 'subtitle')]) {
        const style = getComputedStyle(part);
        expect(part.getBoundingClientRect().height).toBeGreaterThan(
          parseFloat(style.fontSize) * 1.5,
        );
        expect(style.textOverflow).toBe('clip');
        expect(part.scrollWidth).toBeLessThanOrEqual(part.clientWidth);
      }
    });

    it('fills a stretched host: the body grows and the footers line up at the bottom', async () => {
      const { element } = await renderSmall(RowHost);
      const short = find(element, '#short', HTMLElement);
      const tall = find(element, '#tall', HTMLElement);

      expect(short.getBoundingClientRect().height).toBe(tall.getBoundingClientRect().height);
      expect(rootOf(short).getBoundingClientRect().height).toBe(
        short.getBoundingClientRect().height,
      );
      expect(sectionOf(short, 'footer').getBoundingClientRect().bottom).toBe(
        sectionOf(tall, 'footer').getBoundingClientRect().bottom,
      );
      expect(sectionOf(short, 'body').getBoundingClientRect().height).toBeGreaterThan(
        sectionOf(short, 'content').getBoundingClientRect().height + 40,
      );
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(hostOf(element));
      });
    });
  });

  describe('keyboard', () => {
    it('is no Tab stop: Tab passes from the button before it straight to its own control', async () => {
      const { element } = await render('light', (host) => {
        host.header.set(undefined);
        host.subheader.set(undefined);
      });
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();

      expect(document.activeElement).toBe(find(element, '.action', HTMLElement));
      expect(document.activeElement).not.toBe(hostOf(element));
      expect(document.activeElement).not.toBe(rootOf(element));
    });

    it('moves through its own controls in reading order: header slot, content, footer slot', async () => {
      const { element } = await render('light', (host) => {
        host.headerSlot.set('Picture link');
        host.footerLabels.set(['Details', 'Book']);
      });
      const [details, book] = Array.from(
        element.querySelectorAll<HTMLElement>('.slot-footer button'),
      );
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '.slot-header button', HTMLElement));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '.action', HTMLElement));
      await userEvent.tab();
      expect(document.activeElement).toBe(details);
      await userEvent.tab();
      expect(document.activeElement).toBe(book);
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(book);
    });
  });
});
