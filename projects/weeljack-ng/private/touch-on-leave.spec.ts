import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { _touchedOnLeave } from './touch-on-leave';

/** A control's touched callback, as Optimus holds it: a public member the form replaces. */
class Control {
  touches = 0;
  onModelTouched: unknown = () => {
    this.touches += 1;
  };
}

/** The helper reads the element it runs on, so the handler lives on a component host. */
@Component({
  selector: 'wj-touch-on-host',
  template: `
    <button type="button" id="inside">Inside</button>
    <button type="button" id="inside-too">Inside too</button>
  `,
  host: { '(focusout)': 'leave($event)' },
})
class OnHost {
  readonly control = signal<Control | undefined>(new Control());
  protected readonly leave = _touchedOnLeave(this.control);
}

/** Two focusable parts inside the host, one button outside it. */
@Component({
  selector: 'wj-touch-around',
  imports: [OnHost],
  template: `
    <wj-touch-on-host />
    <button type="button" id="outside">Outside</button>
  `,
})
class Around {
  readonly host = viewChild.required(OnHost);
}

async function render(): Promise<{ root: HTMLElement; host: OnHost }> {
  const fixture = TestBed.createComponent(Around);
  document.body.append(fixture.nativeElement as HTMLElement);
  await fixture.whenStable();
  return { root: fixture.nativeElement as HTMLElement, host: fixture.componentInstance.host() };
}

function button(root: HTMLElement, id: string): HTMLButtonElement {
  const found = root.querySelector(`#${id}`);
  if (!(found instanceof HTMLButtonElement)) {
    throw new Error(`#${id} is missing`);
  }
  return found;
}

describe('_touchedOnLeave', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('calls onModelTouched when focus leaves the host for an element outside it', async () => {
    const { root, host } = await render();

    button(root, 'inside').focus();
    expect(host.control()?.touches).toBe(0);
    button(root, 'outside').focus();

    expect(host.control()?.touches).toBe(1);
  });

  it('calls it when focus leaves for nothing, as a blur does', async () => {
    const { root, host } = await render();

    button(root, 'inside').focus();
    button(root, 'inside').blur();

    expect(host.control()?.touches).toBe(1);
  });

  it('does not call it while focus moves between parts inside the host', async () => {
    const { root, host } = await render();

    button(root, 'inside').focus();
    button(root, 'inside-too').focus();
    button(root, 'inside').focus();

    expect(host.control()?.touches).toBe(0);
  });

  it('does nothing before the inner control exists, and calls the current one once it does', async () => {
    const { root, host } = await render();
    host.control.set(undefined);

    button(root, 'inside').focus();
    expect(() => {
      button(root, 'outside').focus();
    }).not.toThrow();

    const later = new Control();
    host.control.set(later);
    button(root, 'inside').focus();
    button(root, 'outside').focus();
    expect(later.touches).toBe(1);
  });

  it('ignores a control whose touched callback is not a function', async () => {
    const { root, host } = await render();
    const odd = new Control();
    odd.onModelTouched = undefined;
    host.control.set(odd);

    button(root, 'inside').focus();

    expect(() => {
      button(root, 'outside').focus();
    }).not.toThrow();
    expect(odd.touches).toBe(0);
  });
});
