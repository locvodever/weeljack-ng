import { wjIconDef, type WjIconDef, type WjIconNode } from 'weeljack-ng/icon';

describe('WjIconDef types', () => {
  it('accepts a node for each of the seven tags', () => {
    const nodes: WjIconNode[] = [
      ['path', { d: 'M0 0' }],
      ['circle', { r: 1 }],
      ['ellipse', { rx: 1, ry: 2 }],
      ['rect', { width: 1, height: 2 }],
      ['line', { x1: 0 }],
      ['polyline', { points: '0,0 1,1' }],
      ['polygon', { points: '0,0 1,1 2,0' }],
    ];

    expect(nodes.map((node) => node[0])).toHaveLength(7);
  });

  it('accepts the paint pair on any node', () => {
    const def: WjIconDef = wjIconDef('paint', '0 0 1 1', [
      ['circle', { r: 1, fill: 'currentColor', stroke: 'none' }],
    ]);

    expect(def.nodes).toHaveLength(1);
  });

  it('rejects a node that does not fit its tag', () => {
    // @ts-expect-error a circle has no `d`: it needs `r`
    const wrongAttribute: WjIconNode = ['circle', { d: 'M0 0' }];
    // @ts-expect-error `text` is not a tag wj-icon draws
    const wrongTag: WjIconNode = ['text', { d: 'M0 0' }];
    // @ts-expect-error a path needs `d`
    const missingRequired: WjIconNode = ['path', {}];
    // @ts-expect-error an attribute wj-icon does not bind is not accepted
    const extra: WjIconNode = ['path', { d: 'M0 0', onclick: 'x' }];

    expect([wrongAttribute, wrongTag, missingRequired, extra]).toHaveLength(4);
  });

  it('rejects a def with a wrong field', () => {
    // @ts-expect-error `nodes` is a list of nodes
    const def: WjIconDef = { name: 'x', viewBox: '0 0 1 1', nodes: 'path' };

    expect(def.name).toBe('x');
  });
});
