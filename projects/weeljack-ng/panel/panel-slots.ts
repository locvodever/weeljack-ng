import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Content beside a `wj-panel`'s `header` text: put it in an `<ng-template wjPanelHeader>` inside
 * the panel. With no `header` text it also names the toggle button and the content region. Import
 * the directive: an un-imported `wjPanelHeader` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjPanelHeader]' })
export class WjPanelHeaderSlot {
  /** The template the panel renders after its title. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(directive: WjPanelHeaderSlot, context: unknown): context is void {
    return directive instanceof WjPanelHeaderSlot && context === undefined;
  }
}

/**
 * The header's actions area of a `wj-panel`, before the toggle button: put your buttons in an
 * `<ng-template wjPanelIcons>` inside the panel. Name an icon-only button yourself. Import the
 * directive: an un-imported `wjPanelIcons` silently drops its template.
 */
@Directive({ selector: 'ng-template[wjPanelIcons]' })
export class WjPanelIconsSlot {
  /** The template the panel renders in its header's actions area. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(directive: WjPanelIconsSlot, context: unknown): context is void {
    return directive instanceof WjPanelIconsSlot && context === undefined;
  }
}

/**
 * The footer of a `wj-panel`, under the content and inside the part that collapses: put it in an
 * `<ng-template wjPanelFooter>` inside the panel. The footer region exists only while this
 * template is given. Import the directive: an un-imported `wjPanelFooter` silently drops its
 * template.
 */
@Directive({ selector: 'ng-template[wjPanelFooter]' })
export class WjPanelFooterSlot {
  /** The template the panel renders in its footer. */
  readonly template = inject<TemplateRef<void>>(TemplateRef);

  /** The slot has no context, so a template reference inside it is checked against `void`. */
  static ngTemplateContextGuard(directive: WjPanelFooterSlot, context: unknown): context is void {
    return directive instanceof WjPanelFooterSlot && context === undefined;
  }
}
