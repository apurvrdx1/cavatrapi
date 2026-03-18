# Cavatrapi Visual Language

## Personality
**Cartoon / Neo-brutalism hybrid.** Playful, casual, energetic — like a board game app for all ages. Every surface has weight and depth; nothing feels flat or corporate.

---

## Color Palette

| Role | Hex | Where |
|------|-----|-------|
| Background | `#7dd3fc` | Sky blue canvas |
| BG dots | `#38bdf8` | Dot grid pattern |
| Dark | `#1e293b` | All borders + shadows |
| Card | `#ffffff` | Card surfaces |
| P1 purple | `#8b5cf6` | Player 1 knight piece |
| P1 light | `#a78bfa` | P1 claimed squares |
| P1 dark | `#7c3aed` | P1 gradient bottom |
| P2 yellow | `#facc15` | Player 2 knight piece |
| P2 light | `#fde047` | P2 claimed squares |
| P2 dark | `#eab308` | P2 gradient bottom |
| CTA green | `#4ade80` | Primary buttons, victory |
| Blue accent | `#60a5fa` | Active timer button |
| Red accent | `#ef4444` | VS text, resign, warnings |
| Text primary | `#1e293b` | All headings and labels |
| Text muted | `#64748b` | Secondary / inactive |
| Surface light | `#f1f5f9` | Section backgrounds, inactive buttons |

---

## Typography

**Nunito only.** No other typeface.

| Use | Weight | Style |
|-----|--------|-------|
| Headings / titles | 900 (Black) | ALL CAPS, tight tracking |
| Labels / badges | 800 | ALL CAPS |
| Body / meta | 600 | Sentence case |

---

## Cartoon Effects

The defining visual signature — applied consistently everywhere.

```
cartoon-border:    5px solid #1e293b
cartoon-border-sm: 3px solid #1e293b
cartoon-shadow-lg: box-shadow 12px 12px 0 #1e293b   (cards)
cartoon-shadow:    box-shadow 8px 8px 0 #1e293b      (panels)
cartoon-shadow-sm: box-shadow 4px 4px 0 #1e293b      (buttons, inner)
btn-press:         translate(4px, 4px) + shadow removed on press
btn-depth:         inset 0 -8px 0 rgba(0,0,0,0.15)
piece-shine:       built into KnightPiece SVG (white ellipse, top-left)
```

Shadow direction always **bottom-right (+x, +y)**. Never blur. Never ambiguous.

---

## Surfaces

| Component | Radius | Border | Shadow |
|-----------|--------|--------|--------|
| Cards | 40px | cartoon-border | cartoon-shadow-lg |
| Inner sections | 16px | none | none |
| Buttons (primary) | 24–32px | cartoon-border | cartoon-shadow-sm + btn-depth |
| Buttons (secondary) | 24px | cartoon-border-sm | cartoon-shadow-sm |
| Board | 8px | cartoon-border-sm | cartoon-shadow-sm |

---

## Background

```
background: #7dd3fc
pattern: radial-gradient(#38bdf8 6px, transparent 6px) 0 0 / 48px 48px
```

Decorative white blurred ellipses (clouds) scattered at low opacity.

---

## Icons

**`@expo/vector-icons` — MaterialCommunityIcons** (filled variants).

---

## Game Pieces

Knight chess silhouette via `KnightPiece` SVG component (`components/KnightPiece.tsx`). Color = player identity.

```
P1:  KnightPiece color="#8b5cf6"   (Royal Purple)
P2:  KnightPiece color="#facc15"   (Golden Yellow)
```

Piece-shine, inset shadow, drop shadow, and outline are all built into the SVG component.

---

## Board Square States

| State | Visual |
|-------|--------|
| Empty | Alternating `#f1f5f9` / `#e2e8f0` |
| Claimed P1 | Solid `#a78bfa` fill |
| Claimed P2 | Solid `#fde047` fill |
| Active piece | `KnightPiece` rendered in cell |
| Legal move | `#4ade80` at 25% opacity + MaterialCommunityIcons `check` in `#4ade80` centered |
