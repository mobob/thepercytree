/**
 * icons.ts — 2016-era Instagram thin-line glyphs as inline SVG strings.
 * Stroke-based, currentColor, 24×24 viewBox. `cls` lets callers style/fill (e.g. liked heart).
 */
const svg = (cls: string, path: string, extra = "") =>
  `<svg class="svg ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}${extra}</svg>`;

export const icons = {
  // feed action row
  heart: svg(
    "i-heart",
    `<path d="M12 20.5C12 20.5 3.5 15.2 3.5 9.2C3.5 6.5 5.6 4.5 8.2 4.5C9.9 4.5 11.3 5.4 12 6.7C12.7 5.4 14.1 4.5 15.8 4.5C18.4 4.5 20.5 6.5 20.5 9.2C20.5 15.2 12 20.5 12 20.5Z"/>`
  ),
  comment: svg(
    "i-comment",
    `<path d="M20.5 11.5C20.5 15.9 16.6 19.5 12 19.5C10.8 19.5 9.7 19.3 8.7 18.9L3.5 20.5L5.2 15.6C4.1 14.4 3.5 13 3.5 11.5C3.5 7.1 7.4 3.5 12 3.5C16.6 3.5 20.5 7.1 20.5 11.5Z"/>`
  ),
  share: svg(
    "i-share",
    `<path d="M21.5 3.5L10.5 13.5"/><path d="M21.5 3.5L14.5 21L10.5 13.5L3 9.5L21.5 3.5Z"/>`
  ),
  bookmark: svg("i-bookmark", `<path d="M6 4.5H18V20.5L12 16L6 20.5V4.5Z"/>`),

  // tab bar
  home: svg("i-home", `<path d="M3.5 11L12 4L20.5 11"/><path d="M5.5 9.5V20H18.5V9.5"/>`),
  search: svg("i-search", `<circle cx="10.5" cy="10.5" r="6.2"/><path d="M15 15L20.5 20.5"/>`),
  plus: svg(
    "i-plus",
    `<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="3.2"/><path d="M12 8.2V15.8M8.2 12H15.8"/>`
  ),
  activity: svg(
    "i-activity",
    `<path d="M12 20.5C12 20.5 3.5 15.2 3.5 9.2C3.5 6.5 5.6 4.5 8.2 4.5C9.9 4.5 11.3 5.4 12 6.7C12.7 5.4 14.1 4.5 15.8 4.5C18.4 4.5 20.5 6.5 20.5 9.2C20.5 15.2 12 20.5 12 20.5Z"/>`
  ),

  // misc
  more: svg("i-more", `<circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/>`),
};

/** iOS-style status-bar glyphs (small, currentColor). */
export const status = {
  signal: `<svg class="sb-ic" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true">
    <rect x="0" y="8" width="3" height="4" rx="0.8"/>
    <rect x="5" y="5.5" width="3" height="6.5" rx="0.8"/>
    <rect x="10" y="3" width="3" height="9" rx="0.8"/>
    <rect x="15" y="0.5" width="3" height="11.5" rx="0.8" opacity="0.3"/>
  </svg>`,
  wifi: `<svg class="sb-ic" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
    <path d="M1.8 4.6C3.4 3 5.6 2.1 8 2.1s4.6.9 6.2 2.5"/>
    <path d="M4 7C5.1 6 6.5 5.4 8 5.4s2.9.6 4 1.6"/>
    <circle cx="8" cy="9.6" r="0.9" fill="currentColor" stroke="none"/>
  </svg>`,
  battery: `<svg class="sb-ic sb-batt" viewBox="0 0 27 12" fill="none" aria-hidden="true">
    <rect x="0.6" y="1" width="22" height="10" rx="2.6" stroke="currentColor" stroke-opacity="0.45"/>
    <rect x="2" y="2.4" width="17" height="7.2" rx="1.4" fill="currentColor"/>
    <path d="M24.4 4.2c1 0 1 3.6 0 3.6z" fill="currentColor" fill-opacity="0.45"/>
  </svg>`,
};
