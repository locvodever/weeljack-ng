/**
 * Sample portraits for the avatar examples: flat, text-free SVGs as `data:` URIs, so nothing loads
 * over the network. Use your own image URL in an app.
 */
function portrait(background: string, figure: string): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
    `<rect width="96" height="96" fill="${background}"/>` +
    `<circle cx="48" cy="38" r="17" fill="${figure}"/>` +
    `<path d="M14 96a34 34 0 0 1 68 0z" fill="${figure}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A portrait on sage green. */
export const PORTRAIT_SAGE = portrait('#7c9885', '#f4f1de');

/** A portrait on dusk blue. */
export const PORTRAIT_DUSK = portrait('#3d5a80', '#e0fbfc');
