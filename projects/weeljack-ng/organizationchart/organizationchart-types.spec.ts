import type { OutputEmitterRef } from '@angular/core';
import type { TreeNode } from '@openng/optimus-ui/api';
import type { OrganizationChart } from '@openng/optimus-ui/organizationchart';
import type { OrganizationChartPassThrough } from '@openng/optimus-ui/types/organizationchart';
import type { WjTreeNode } from 'weeljack-ng';
import {
  WjOrganizationChartNodeSlot,
  type WjOrganizationChart,
  type WjOrganizationChartNodeContext,
  type WjOrganizationChartPt,
} from 'weeljack-ng/organizationchart';

interface Person {
  title: string;
}

/**
 * The seam's type-level spec (09 Q5): `WjOrganizationChartPt` is Optimus's own pass-through type,
 * every input-direction type stays a subset of the Optimus type it feeds, and the outputs carry
 * the app's node. The checks run in `typecheck` (`ngc` over the spec project); a drift in Optimus's
 * types turns this file red there. The runtime assertions only keep the file a spec.
 */
describe('WjOrganizationChart types', () => {
  it('keeps WjOrganizationChartPt equal to the Optimus pass-through', () => {
    expectTypeOf<WjOrganizationChartPt>().toEqualTypeOf<OrganizationChartPassThrough>();

    const pt: WjOrganizationChartPt = { node: { 'data-probe': 'x' }, connectors: 'probe' };
    expect(pt).toBeDefined();
  });

  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<ReturnType<WjOrganizationChart<Person>['value']>>().toExtend<
      NonNullable<OrganizationChart['value']>
    >();
    expectTypeOf<WjTreeNode<Person>>().toExtend<TreeNode<Person>>();
    expectTypeOf<ReturnType<WjOrganizationChart['collapsible']>>().toEqualTypeOf<boolean>();
    expect(true).toBe(true);
  });

  it('emits the app’s own node, typed by the chart’s data type', () => {
    expectTypeOf<WjOrganizationChart<Person>['nodeExpand']>().toEqualTypeOf<
      OutputEmitterRef<WjTreeNode<Person>>
    >();
    expectTypeOf<WjOrganizationChart<Person>['nodeCollapse']>().toEqualTypeOf<
      OutputEmitterRef<WjTreeNode<Person>>
    >();
    expect(true).toBe(true);
  });

  it('types the node slot context from the nodes bound to its typing input', () => {
    expectTypeOf<WjOrganizationChartNodeContext<Person>['$implicit']>().toEqualTypeOf<
      WjTreeNode<Person>
    >();
    expectTypeOf<WjOrganizationChartNodeContext['$implicit']>().toEqualTypeOf<WjTreeNode>();
    expectTypeOf<WjOrganizationChartNodeSlot<Person>['wjOrganizationChartNodeOf']>().not.toBeAny();
    expectTypeOf(WjOrganizationChartNodeSlot).toHaveProperty('ngTemplateContextGuard');
    expect('ngTemplateContextGuard' in WjOrganizationChartNodeSlot).toBe(true);
  });
});
