# Brand Identity Rationale: Portfolio Interview

Visual identity system engineered in compliance with `/plugin-brand-identity-designer` for the Portfolio Interview ChatGPT/Codex Plugin, Claude Code Skill, and open-source distribution.

---

## 1. Core Concept

> **"This mark represents a friendly, enthusiastic creator having an interactive Q&A interview and proudly bringing to life a personalized static portfolio website with verified work samples, avatar, and search-ready metadata."**

The visual identity steers clear of interchangeable, soulless "AI" cliches (no robotic heads, no abstract circuit boards, no arbitrary gradient blobs). Instead, it highlights the human craft and delight of building a personal digital home through conversation:
- The expressive doodle creator wearing an artist beret with warm blushing cheeks.
- The interactive Q&A speech bubble signifying the guided multiple-choice popup rounds.
- The miniature browser window displaying the rendered portfolio layout (avatar, headline, and project cards).

---

## 2. Geometry & Proportions

| Specification | Full Logos (`logo-light.svg`, `logo-dark.svg`) | Composer Icon (`icon.svg`) |
|---|---|---|
| **ViewBox** | `0 0 512 512` (Exact Square) | `0 0 512 512` (Exact Square) |
| **Grid Anchor** | 60% Character & Browser + 40% Wordmark | Centered Zoomed Character & Browser Window |
| **Stroke Hierarchy** | 5px body line, 7px thick contour | 6px detail, 9px window, 12px outer squircle |
| **Edge Radius** | `rx="12"` on browser window | `rx="108"` squircle outer container |
| **Typography** | Embedded system sans font (`font-weight: 900`) | Bold embedded vector typography |

---

## 3. Palette & Contrast

### Light Mode (`assets/logo-light.svg`)
- **Primary Ink**: `#1e293b` (Slate Black — WCAG AAA contrast ratio on light backgrounds)
- **Brand Accent**: `#ea580c` / `#c2410c` (Warm Terracotta Orange)
- **Sunburst Highlights**: `#facc15` / `#fef08a` (Warm Sunshine Yellow)
- **Sky Highlights**: `#38bdf8` / `#bae6fd` (Soft Cyan)
- **Surface Fill**: Clean white `#ffffff` and soft cream `#ffedd5`

### Dark Mode (`assets/logo-dark.svg`)
- **Primary Ink**: `#f8fafc` (Chalk White — WCAG AAA contrast ratio on dark surfaces)
- **Brand Accent**: `#fb923c` (Bright Tangerine)
- **Dark Surfaces**: `#0f172a` (Deep Slate / Obsidian)
- **Energy Drops**: `#38bdf8` (Electric Blue)
- **Emerald Project Badge**: `#4ade80` (Spring Green)

---

## 4. Small-Size Behavior (`assets/icon.svg`)

In small UI surfaces (e.g., ChatGPT plugin drawer at 32×32 px, Codex command icons at 16×16 px):
1. **Outer Squircle Container**: A rounded square with `#fff7ed` gradient ensures high visibility across dark and light host UI themes.
2. **Reinforced Contours**: Strokes are thickened to 9px–12px to preserve silhouette clarity.
3. **Focused Composition**: Removes wordmarks and peripheral stars, concentrating on the creator face, "Q&A" bubble, and browser window.

---

## 5. Packaged Asset Inventory

- `assets/logo-light.svg`: Universal light-theme vector logo (viewBox `0 0 512 512`).
- `assets/logo-dark.svg`: Universal dark-theme vector logo (viewBox `0 0 512 512`).
- `assets/icon.svg`: Square composer icon for ChatGPT/Codex UI (viewBox `0 0 512 512`).
- `assets/logo.svg`: Canonical vector logo mirror.
