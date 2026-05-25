// ─── TYPOGRAPHY DATABASE ─────────────────────────────────────────────────────

export const TYPO_FONTS = [
  // Sans-Serif
  { name: 'Inter', category: 'sans-serif', import: 'Inter:wght@400;700' },
  { name: 'Roboto', category: 'sans-serif', import: 'Roboto:wght@400;700' },
  { name: 'Oswald', category: 'sans-serif', import: 'Oswald:wght@400;700' },
  { name: 'Montserrat', category: 'sans-serif', import: 'Montserrat:wght@400;700' },
  { name: 'Poppins', category: 'sans-serif', import: 'Poppins:wght@400;700' },
  { name: 'Lato', category: 'sans-serif', import: 'Lato:wght@400;700' },
  { name: 'Work Sans', category: 'sans-serif', import: 'Work+Sans:wght@400;700' },
  { name: 'Outfit', category: 'sans-serif', import: 'Outfit:wght@400;700' },
  { name: 'Space Grotesk', category: 'sans-serif', import: 'Space+Grotesk:wght@400;700' },
  { name: 'Bebas Neue', category: 'sans-serif', import: 'Bebas+Neue' },

  // Serif
  { name: 'Merriweather', category: 'serif', import: 'Merriweather:wght@400;700' },
  { name: 'Playfair Display', category: 'serif', import: 'Playfair+Display:wght@400;700' },
  { name: 'Lora', category: 'serif', import: 'Lora:wght@400;700' },
  { name: 'PT Serif', category: 'serif', import: 'PT+Serif:wght@400;700' },
  { name: 'EB Garamond', category: 'serif', import: 'EB+Garamond:wght@400;700' },

  // Monospace / Display
  { name: 'Space Mono', category: 'monospace', import: 'Space+Mono:wght@400;700' },
  { name: 'Fira Code', category: 'monospace', import: 'Fira+Code:wght@400;700' },
  { name: 'Pacifico', category: 'handwriting', import: 'Pacifico' },
  { name: 'Caveat', category: 'handwriting', import: 'Caveat:wght@400;700' },
  { name: 'Abril Fatface', category: 'display', import: 'Abril+Fatface' }
];

export function getRandomFonts(count = 4) {
  const shuffled = [...TYPO_FONTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
