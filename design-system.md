# La Traverse - Design System

## Typography (Fontshare)

| Role     | Font           | Weights        | Usage                     |
|----------|----------------|----------------|---------------------------|
| Display  | Clash Display  | 200-700        | Headings, hero titles     |
| Serif    | Zodiak         | 400-700        | Quotes, editorial accents |
| Body     | Satoshi        | 300-700, 900   | Body text, UI elements    |
| Mono     | JetBrains Mono | 400, 700       | Code, technical labels    |

CDN: `https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&f[]=satoshi@300,400,500,600,700,900&f[]=zodiak@400,500,600,700&display=swap`

## Colors

### Light Theme
- Background: `#fafaf8`
- Background Alt: `#f2f0ec`
- Surface: `#ffffff`
- Text Primary: `#1a1a1a`
- Text Secondary: `#55586a`
- Text Tertiary: `#8b8ea0`

### Dark Sections
- Background Dark: `#0f1117`
- Background Dark Alt: `#181b24`
- Text Inverse: `#f0f0f2`

### Accents
- Primary (Terracotta): `#c4622a` / hover `#a84e33`
- Blue (Technical): `#3b6cf5`
- Green (Success): `#2d8a6e`

### Borders
- Light: `rgba(26, 26, 26, 0.10)`
- Medium: `rgba(26, 26, 26, 0.20)`

## Spacing
- Section: `clamp(80px, 12vw, 160px)`
- Block: `clamp(40px, 6vw, 80px)`
- Container Pad: `clamp(20px, 5vw, 80px)`
- Content Max: `680px`
- Wide Max: `1100px`
- Full Max: `1240px`

## Border Radius
- Small: `6px`
- Medium: `12px`
- Large: `16px`
- Round: `50%`

## Buttons
- Primary: bg `--color-accent`, text white, border-radius 6px
- Outline: border 1px `--color-border-dark`, transparent bg
- Sizes: `--lg` = 56px height, default = 44px height

## Cards
- Background: `--color-surface` or dark variant
- Border: `1px solid var(--color-border)`
- Border-radius: `12px`
- Shadow on hover: `0 8px 32px rgba(0,0,0,0.08)`
