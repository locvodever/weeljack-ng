/**
 * Sample images for the image examples: flat, text-free SVGs as `data:` URIs, so nothing loads over
 * the network. Use your own image URL in an app.
 */
const uri = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`;

/** A 320 × 240 scene: a green hill under a yellow sun, in a pale blue sky. */
export const SCENE_HILL = uri(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">' +
    '<rect width="320" height="240" fill="#bcd4e6"/>' +
    '<circle cx="244" cy="58" r="28" fill="#f2c94c"/>' +
    '<path d="M0 240V160q120-80 320 0v80z" fill="#6a994e"/></svg>',
);

/** A 320 × 80 band of diagonal stripes: pure decoration. */
export const BAND_STRIPES = uri(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">' +
    '<rect width="320" height="80" fill="#e4e4e7"/>' +
    '<path d="M0 80L80 0h40L40 80zM160 80L240 0h40l-80 80zM320 80L400 0" fill="#a1a1aa"/></svg>',
);
