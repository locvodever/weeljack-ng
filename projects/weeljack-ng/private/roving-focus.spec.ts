import { Component, ElementRef, inject, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { userEvent } from 'vitest/browser';
import { _rovingFocus } from './roving-focus';

/**
 * A plain host with the shape of the real ones: a row of buttons (one disabled, one removable), a
 * text input that is not an item, one button whose own handler prevents the key, and a button
 * either side. `tick` is read by the template so a signal change renders and the helper re-syncs.
 */
@Component({
  selector: 'wj-roving-host',
  template: `
    <button type="button" id="before">Before</button>
    <div id="row" #row [attr.data-tick]="tick()">
      @for (name of names(); track name) {
        <button type="button" [id]="name" [disabled]="name === off()">{{ name }}</button>
      }
      <button type="button" id="prevent" (keydown)="block($event)">Prevent</button>
      <input id="field" type="text" value="abc" />
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly names = signal(['a', 'b', 'c', 'd']);
  readonly off = signal<string | undefined>('c');
  readonly picked = signal<string | undefined>(undefined);
  readonly tick = signal(0);
  readonly stopKeys = signal(false);

  /** A handler of the consumer's that prevents the key, once asked to. */
  protected block(event: KeyboardEvent): void {
    if (this.stopKeys()) event.preventDefault();
  }
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    _rovingFocus(
      () => [...this.element.querySelectorAll<HTMLButtonElement>('#row button:not(:disabled)')],
      () => {
        const picked = this.picked();
        return picked === undefined
          ? undefined
          : (this.element.querySelector<HTMLElement>(`#${picked}`) ?? undefined);
      },
    );
  }
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  element: HTMLElement;
}

async function render(setup: (host: Host) => void = () => undefined): Promise<Rendered> {
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  return {
    fixture,
    host: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
}

function get(element: HTMLElement, id: string): HTMLElement {
  const found = element.querySelector<HTMLElement>(`#${id}`);
  if (found === null) {
    throw new Error(`#${id} is missing`);
  }
  return found;
}

/** The ids of the row's buttons that carry `tabindex="0"`. */
const stops = (element: HTMLElement): string[] =>
  [...element.querySelectorAll('#row button')]
    .filter((button) => button.getAttribute('tabindex') === '0')
    .map((button) => button.id);

/** Re-renders the host, which is what lets the helper re-sync. */
async function rerender({ fixture, host }: Rendered): Promise<void> {
  host.tick.update((count) => count + 1);
  await fixture.whenStable();
}

describe('_rovingFocus', () => {
  it('marks the host and leaves exactly one enabled item a Tab stop, the first by default', async () => {
    const { element } = await render();

    expect(element.hasAttribute('data-wj-roving')).toBe(true);
    expect(stops(element)).toEqual(['a']);
    expect(['b', 'd', 'prevent'].map((id) => get(element, id).getAttribute('tabindex'))).toEqual([
      '-1',
      '-1',
      '-1',
    ]);
    expect(get(element, 'c').hasAttribute('tabindex')).toBe(false);
  });

  it('one Tab enters the row and the next leaves it, in both directions', async () => {
    const { element } = await render();
    get(element, 'before').focus();

    await userEvent.tab();
    expect(document.activeElement).toBe(get(element, 'a'));
    await userEvent.tab();
    expect(document.activeElement).toBe(get(element, 'field'));
    await userEvent.tab();
    expect(document.activeElement).toBe(get(element, 'after'));
  });

  it('ArrowRight and ArrowLeft move to the next enabled item and wrap', async () => {
    const { element } = await render((host) => {
      host.names.set(['a', 'b']);
      host.off.set(undefined);
    });
    get(element, 'a').focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(get(element, 'b'));
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(get(element, 'prevent'));
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(get(element, 'a'));
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(get(element, 'prevent'));
  });

  it('skips a disabled item, and Home and End go to the first and the last item', async () => {
    const { element } = await render();
    get(element, 'b').focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(get(element, 'd'));
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(document.activeElement).toBe(get(element, 'a'));
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(get(element, 'prevent'));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(get(element, 'a'));
  });

  it('does nothing for Up and Down, and moves the stop only to the focused item', async () => {
    const { element } = await render();
    get(element, 'a').focus();

    await userEvent.keyboard('{ArrowDown}{ArrowUp}');
    expect(document.activeElement).toBe(get(element, 'a'));

    await userEvent.keyboard('{ArrowRight}');
    expect(stops(element)).toEqual(['b']);
    expect(get(element, 'a').getAttribute('tabindex')).toBe('-1');
  });

  it('re-enters on the item that had focus last', async () => {
    const { element } = await render();
    get(element, 'a').focus();
    await userEvent.keyboard('{ArrowRight}');
    get(element, 'after').focus();

    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(get(element, 'field'));
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(get(element, 'b'));
  });

  it('lets selected() win over the last focused item once the host renders again', async () => {
    const rendered = await render();
    const { element, host } = rendered;
    get(element, 'a').focus();
    await userEvent.keyboard('{ArrowRight}');
    get(element, 'after').focus();
    expect(stops(element)).toEqual(['b']);

    host.picked.set('d');
    await rerender(rendered);

    expect(stops(element)).toEqual(['d']);
    get(element, 'before').focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(get(element, 'd'));
  });

  it('falls back when selected() names an item the list dropped', async () => {
    const rendered = await render((host) => {
      host.picked.set('c');
    });

    expect(stops(rendered.element)).toEqual(['a']);
  });

  it('never leaves the stop on an item that was removed or dropped from the list', async () => {
    const rendered = await render();
    const { element, host } = rendered;
    get(element, 'a').focus();
    get(element, 'before').focus();
    expect(stops(element)).toEqual(['a']);

    host.names.set(['b', 'c', 'd']);
    await rerender(rendered);
    expect(stops(element)).toEqual(['b']);

    host.off.set('b');
    await rerender(rendered);
    expect(stops(element)).toEqual(['c']);
    expect(get(element, 'b').getAttribute('tabindex')).toBe('-1');
  });

  it('leaves Alt, Ctrl and Meta with an arrow, and a key another handler prevented, alone', async () => {
    const { element, host } = await render();
    get(element, 'a').focus();

    for (const modifier of ['Alt', 'Control', 'Meta']) {
      await userEvent.keyboard(`{${modifier}>}{ArrowRight}{/${modifier}}`);
      expect(document.activeElement).toBe(get(element, 'a'));
    }

    host.stopKeys.set(true);
    get(element, 'prevent').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(get(element, 'prevent'));
  });

  it('ignores a key whose target is not an item: a text input keeps its arrows', async () => {
    const { element } = await render();
    const field = get(element, 'field');
    if (!(field instanceof HTMLInputElement)) {
      throw new Error('#field is not an input');
    }
    field.focus();
    field.setSelectionRange(3, 3);

    await userEvent.keyboard('{ArrowLeft}');

    expect(document.activeElement).toBe(field);
    expect(field.selectionStart).toBe(2);
    expect(field.hasAttribute('tabindex')).toBe(false);
  });
});
