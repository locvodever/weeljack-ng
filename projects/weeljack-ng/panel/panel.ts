import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Injector,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  runInInjectionContext,
  viewChild,
} from '@angular/core';
import { Panel } from '@openng/optimus-ui/panel';
import {
  _OVERLAY_MOTION,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _warnOnce,
  _wjId,
} from 'weeljack-ng/private';
import { WjPanelFooterSlot, WjPanelHeaderSlot, WjPanelIconsSlot } from './panel-slots';
import type { WjPanelPt } from './panel-types';

/**
 * A titled box whose content can collapse, over Optimus's `p-panel`. Give it a `header` (text) or a
 * `wjPanelHeader` slot: it names the toggle button and the content region. `toggleable` adds the
 * toggle, and `collapsed` is a two-way model that reports every toggle, a click or a key press.
 * Slots: `wjPanelHeader` (beside the title), `wjPanelIcons` (the header's actions, before the
 * toggle) and `wjPanelFooter` (under the content); a section exists only while its slot is filled.
 */
@Component({
  selector: 'wj-panel',
  imports: [Panel, NgTemplateOutlet],
  templateUrl: './panel.html',
  styleUrl: './panel.css',
})
export class WjPanel {
  /** Title text. Rendered as text, never as HTML. It names the toggle button. */
  readonly header = input<string>();
  /** Adds a toggle button that collapses and expands the content. */
  readonly toggleable = input(false, { transform: booleanAttribute });
  /** Whether the content is collapsed. Two-way: `[(collapsed)]`. */
  readonly collapsed = model(false);
  /**
   * Pass-through for the panel's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjPanelPt>();

  protected readonly headerSlot = contentChild(WjPanelHeaderSlot);
  protected readonly iconsSlot = contentChild(WjPanelIconsSlot);
  protected readonly footerSlot = contentChild(WjPanelFooterSlot);
  protected readonly motion = _OVERLAY_MOTION;
  /**
   * Optimus 2.0.2 binds the toggle's `autofocus` as `undefined`, which its `AutoFocus` directive
   * does not treat as `false`, so the toggle gets `autofocus="true"`. An explicit `false` keeps it off.
   */
  protected readonly toggleProps = { autofocus: false };
  protected readonly headerId = _wjId('panel-header');
  private readonly titleId = _wjId('panel-title');

  private readonly inner = viewChild(Panel);

  /**
   * `pt` forwarded as given, plus what this wrapper routes (FR-38's gap fixes): a unique title id
   * (Optimus gives the title and the toggle one id); the toggle named by the title or by the header
   * slot, and the region labelled by the same element; and the toggle's state moved onto the real
   * button, because Optimus puts `role="button"` on a host that wraps it (axe `nested-interactive`).
   */
  protected readonly partAttributes = computed<WjPanelPt>(() => {
    const labelledBy = this.header() ? this.titleId : this.headerSlot() ? this.headerId : undefined;
    const id = this.inner()?.id;
    const title = _mergePartAttributes(this.pt(), 'title', { id: this.titleId });
    const host = _mergePartAttributes(title, 'pcToggleButton.host', { role: undefined });
    const toggle = _mergePartAttributes(host, 'pcToggleButton.root', {
      'aria-labelledby': labelledBy,
      'aria-expanded': !this.collapsed(),
      'aria-controls': id && `${id}_content`,
    });
    return _mergePartAttributes(toggle, 'contentContainer', { 'aria-labelledby': labelledBy });
  });

  constructor() {
    _checkWeeljackSetup('wj-panel');
    _checkAriaOnHost('wj-panel', 'Use the header input or a wjPanelHeader slot to name the panel');

    // Optimus reads each bridged template from a content query into a plain property, and its
    // OnPush view does not notice a slot that appears or goes after creation: nudge it.
    effect(() => {
      this.headerSlot();
      this.iconsSlot();
      this.footerSlot();
      this.inner()?.cd.markForCheck();
    });
    if (ngDevMode) {
      const injector = inject(Injector);
      effect(() => {
        if (this.toggleable() && !this.header() && !this.headerSlot()) {
          runInInjectionContext(injector, () => {
            _warnOnce(
              'WJ0110',
              'wj-panel',
              'a toggleable panel has no header text and no wjPanelHeader slot, so its toggle button has no accessible name',
              'Set header or fill the wjPanelHeader slot',
            );
          });
        }
      });
    }
  }
}
