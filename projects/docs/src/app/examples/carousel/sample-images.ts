/**
 * Sample images for the carousel examples: flat, text-free 4:3 SVGs as `data:` URIs, so nothing
 * loads over the network. Use your own image URLs in an app.
 */
const uri = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`;

/** A 320 × 240 scene: a sky, a sun and a hill in the given colours. */
const scene = (sky: string, sun: string, hill: string): string =>
  uri(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">' +
      `<rect width="320" height="240" fill="${sky}"/>` +
      `<circle cx="244" cy="58" r="28" fill="${sun}"/>` +
      `<path d="M0 240V160q120-80 320 0v80z" fill="${hill}"/></svg>`,
  );

/** Six scenes that differ by palette, each with the text alternative that describes it. */
export const SCENES: readonly { src: string; alt: string }[] = [
  { src: scene('#bcd4e6', '#f2c94c', '#6a994e'), alt: 'A green hill under a yellow sun' },
  { src: scene('#dbe7f0', '#f4f1de', '#f4f7f9'), alt: 'A white hill under a pale sun in winter' },
  { src: scene('#274c77', '#f4f1de', '#386641'), alt: 'A dark green hill under a pale moon' },
  { src: scene('#f4a261', '#e76f51', '#6d597a'), alt: 'A purple hill under an orange sunset' },
  { src: scene('#cdeac0', '#f2c94c', '#2d6a4f'), alt: 'A deep green hill in spring light' },
  { src: scene('#e9c46a', '#e76f51', '#8c5e3c'), alt: 'A brown hill under a red sun in autumn' },
];
