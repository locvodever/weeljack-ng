/** The two paint attributes any node may carry, for filled shapes such as a dot or a Material glyph. */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- the generated API lists type aliases only (W1-display 9.2)
export type WjIconPaint = {
  /** The shape's fill. The icon's default is `none`; use `currentColor` for a solid shape. */
  readonly fill?: string;
  /** The shape's stroke. The icon's default is `currentColor`; use `none` for a solid shape. */
  readonly stroke?: string;
};

/** Attributes of a `path` node. */
export type WjIconPathAttrs = Readonly<{ d: string }> & WjIconPaint;

/** Attributes of a `circle` node. */
export type WjIconCircleAttrs = Readonly<{
  cx?: string | number;
  cy?: string | number;
  r: string | number;
}> &
  WjIconPaint;

/** Attributes of an `ellipse` node. */
export type WjIconEllipseAttrs = Readonly<{
  cx?: string | number;
  cy?: string | number;
  rx: string | number;
  ry: string | number;
}> &
  WjIconPaint;

/** Attributes of a `rect` node. */
export type WjIconRectAttrs = Readonly<{
  x?: string | number;
  y?: string | number;
  width: string | number;
  height: string | number;
  rx?: string | number;
  ry?: string | number;
}> &
  WjIconPaint;

/** Attributes of a `line` node. */
export type WjIconLineAttrs = Readonly<{
  x1?: string | number;
  y1?: string | number;
  x2?: string | number;
  y2?: string | number;
}> &
  WjIconPaint;

/** Attributes of a `polyline` node. */
export type WjIconPolylineAttrs = Readonly<{ points: string }> & WjIconPaint;

/** Attributes of a `polygon` node. */
export type WjIconPolygonAttrs = Readonly<{ points: string }> & WjIconPaint;

/** One shape of an icon: its tag and that tag's attributes, so `d` on a `circle` does not compile. */
export type WjIconNode =
  | readonly ['path', WjIconPathAttrs]
  | readonly ['circle', WjIconCircleAttrs]
  | readonly ['ellipse', WjIconEllipseAttrs]
  | readonly ['rect', WjIconRectAttrs]
  | readonly ['line', WjIconLineAttrs]
  | readonly ['polyline', WjIconPolylineAttrs]
  | readonly ['polygon', WjIconPolygonAttrs];

/** An icon as data: a name, a viewBox and the shapes `wj-icon` draws. */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- the generated API lists type aliases only (W1-display 9.2)
export type WjIconDef = {
  /** The icon's name, shown on the host as `data-icon`. */
  readonly name: string;
  /** The svg `viewBox`, for example `0 0 24 24`. */
  readonly viewBox: string;
  /** The shapes, drawn in order. */
  readonly nodes: readonly WjIconNode[];
};

/**
 * Writes an icon of your own in the shape `wj-icon` draws. It checks the types and nothing else at
 * run time, and returns what it was given as a `WjIconDef`.
 *
 * @param name The icon's name.
 * @param viewBox The svg `viewBox`.
 * @param nodes The shapes, each `[tag, attributes]`.
 */
export function wjIconDef(name: string, viewBox: string, nodes: readonly WjIconNode[]): WjIconDef {
  return { name, viewBox, nodes };
}
