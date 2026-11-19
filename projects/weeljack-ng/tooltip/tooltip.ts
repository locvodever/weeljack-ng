import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  effect,
  inject,
  input,
  runInInjectionContext,
  signal,
  untracked,
} from '@angular/core';
import { Tooltip } from '@openng/optimus-ui/tooltip';
import { _checkWeeljackSetup, _overlayEscapeGate, _warnOnce, _wjId } from 'weeljack-ng/private';

const WJ0153 = 'WJ0153';

/**
 * A short text that describes the element it is on, over Optimus's `pTooltip`. It shows on hover
 * and on keyboard focus, stays while the pointer is on the element or the bubble, and hides on
 * blur, pointer leave and Escape. It never times out, never holds controls or links, and always
 * renders the text as text.
 *
 * The text is also the element's accessible description, shown or not: a hidden element the
 * directive owns holds it, and its id is added to the host's `aria-describedby` (your own ids are
 * kept). Put it on an element that can take focus. On a component such as `wj-button`, whose
 * focusable part is inside it, bind the component's `ariaDescribedBy` to `descriptionId`.
 *
 * `pt` is the pass-through for the parts Optimus renders. It tracks Optimus: its part names and
 * attributes follow the installed `@openng/optimus-ui` minor and are outside this directive's
 * stable API; changes to them ship only in the release that takes a new Optimus minor and are not
 * breaking.
 */
@Directive({
  selector: '[wjTooltip]',
  exportAs: 'wjTooltip',
  // `pt` is Optimus's inherited input: `pTooltipPT` cannot be aliased to it (NG2018).
  hostDirectives: [
    {
      directive: Tooltip,
      inputs: ['tooltipPosition', 'showDelay', 'hideDelay', 'pt'],
    },
  ],
  // A bound `[wjTooltip]="text"` leaves no attribute in the DOM, so the harness's host selector
  // and an app's CSS would never match it: write the attribute.
  host: { wjTooltip: '' },
})
export class WjTooltip {
  /** The text of the tooltip, shown as text and never as HTML. Empty shows no bubble. */
  readonly wjTooltip = input<string>('');

  /** Turns the tooltip off: it shows no bubble and hides one that is showing. */
  readonly tooltipDisabled = input(false, { transform: booleanAttribute });

  /**
   * The id of the hidden element that holds the text: the host's description. Bind it to a
   * component host's `ariaDescribedBy`.
   */
  readonly descriptionId: string = _wjId('tooltip');

  private readonly tooltip = inject(Tooltip, { self: true });
  private readonly injector = inject(Injector);
  private readonly shown = signal(false);

  constructor() {
    _checkWeeljackSetup('[wjTooltip]');
    const { tooltip } = this;
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const document = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    // Set before Optimus binds its listeners in `ngAfterViewInit`. `escape` is never touched: it
    // stays true, so the text is written as a text node.
    tooltip.setOption({ tooltipEvent: 'both', autoHide: false, hideOnEscape: true });

    // Optimus has no output for it: follow its show and hide, which every cause goes through.
    const show = tooltip.show.bind(tooltip);
    const hide = tooltip.hide.bind(tooltip);
    tooltip.show = () => {
      // An unset `[tooltipPosition]` binding overwrites Optimus's default and the bubble is then
      // never aligned: keep its `right`.
      if (!tooltip._tooltipOptions.tooltipPosition) {
        tooltip.setOption({ tooltipPosition: 'right' });
      }
      show();
      this.shown.set(Boolean(tooltip.container));
    };
    tooltip.hide = () => {
      hide();
      this.shown.set(false);
    };
    // No `closable` of its own: it joins the stack while shown, so Escape reaches it first.
    _overlayEscapeGate(this.shown, () => true);

    // `tooltipDisabled` is Optimus's alias of its `disabled` property, which `hostDirectives`
    // cannot expose under that name here (the docs extractor reads property names), so it is an
    // input of this directive that sets the same option.
    effect(() => {
      const disabled = this.tooltipDisabled();
      untracked(() => {
        tooltip.setOption({ disabled });
        if (disabled) {
          tooltip.deactivate();
        }
      });
    });

    let description: HTMLElement | undefined;
    effect(() => {
      const text = this.wjTooltip();
      untracked(() => {
        tooltip.setOption({ tooltipLabel: text });
        if (description) {
          description.textContent = text;
        }
        if (tooltip.active) {
          if (!text) {
            tooltip.hide();
          } else if (tooltip.container) {
            tooltip.updateText();
            tooltip.align();
          } else {
            tooltip.show();
          }
        }
      });
    });

    afterNextRender(() => {
      description = document.createElement('span');
      description.id = this.descriptionId;
      description.hidden = true;
      description.textContent = this.wjTooltip();
      document.body.append(description);

      if (host.tabIndex < 0) {
        runInInjectionContext(this.injector, () => {
          _warnOnce(
            WJ0153,
            '[wjTooltip]',
            'the host cannot take focus, so its description is not linked to it',
            'Put wjTooltip on a focusable element, or bind the component’s ariaDescribedBy to descriptionId',
          );
        });
        return;
      }
      // Add the id to the host's own tokens, and put it back when an app binding or a `wj-field`
      // rewrites the attribute.
      const link = (): void => {
        const tokens = host.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? [];
        if (!tokens.includes(this.descriptionId)) {
          host.setAttribute('aria-describedby', [...tokens, this.descriptionId].join(' '));
        }
      };
      link();
      const observer = new MutationObserver(link);
      observer.observe(host, { attributes: true, attributeFilter: ['aria-describedby'] });
      destroyRef.onDestroy(() => {
        observer.disconnect();
      });
    });
    destroyRef.onDestroy(() => {
      description?.remove();
    });
  }
}
