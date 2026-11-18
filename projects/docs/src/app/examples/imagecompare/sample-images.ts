/**
 * Sample images for the imagecompare examples: flat, text-free 16:9 SVGs as `data:` URIs, so
 * nothing loads over the network. Use your own image URLs in an app.
 */
const uri = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`;

/** A 640 × 360 winter scene: a snow-white hill under a pale sun, in a grey-blue sky. */
export const SCENE_WINTER = uri(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">' +
    '<rect width="640" height="360" fill="#cfdde8"/>' +
    '<circle cx="500" cy="90" r="40" fill="#f4f1de"/>' +
    '<path d="M0 360V240q240-120 640 0v120z" fill="#f4f7f9"/></svg>',
);

/** A 640 × 360 summer scene: the same hill, green, under a yellow sun in a blue sky. */
export const SCENE_SUMMER = uri(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">' +
    '<rect width="640" height="360" fill="#8cc4ea"/>' +
    '<circle cx="500" cy="90" r="40" fill="#f2c94c"/>' +
    '<path d="M0 360V240q240-120 640 0v120z" fill="#6a994e"/></svg>',
);
