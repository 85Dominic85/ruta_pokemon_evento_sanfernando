---
name: ui-design-system
description: UI design system toolkit for Senior UI Designer including design token generation, component documentation, responsive design calculations, and developer handoff tools. Use for creating design systems, maintaining visual consistency, and facilitating design-dev collaboration.
---

# UI Design System

Professional toolkit for creating and maintaining scalable design systems.

## Core Capabilities

- Design token generation (colors, typography, spacing)
- Component system architecture
- Responsive design calculations
- Accessibility compliance
- Developer handoff documentation

---

## Key Scripts

### `design_token_generator.py`

Generates complete design system tokens from brand colors.

**Usage**
```bash
python scripts/design_token_generator.py [brand_color] [style] [format]
```

- **Styles**: `modern`, `classic`, `playful`
- **Formats**: `json`, `css`, `scss`

**Features**
- Complete color palette generation
- Modular typography scale
- 8pt spacing grid system
- Shadow and animation tokens
- Responsive breakpoints
- Multiple export formats

---

## Suggested Outputs (Handoff-Ready)

When asked to create or extend a design system, produce:

1. **Design Tokens**
   - Colors (semantic + scale)
   - Typography (families, sizes, line-heights, weights)
   - Spacing (8pt scale)
   - Radius, elevation, motion
   - Breakpoints

2. **Component Inventory**
   - Foundations: Buttons, Inputs, Selects, Toggles, Cards, Modals, Tables
   - Patterns: Forms, Empty states, Error states, Loading states, Pagination
   - Layout: Grid, Container, Stack, Sidebar

3. **Documentation**
   - Usage guidelines
   - Do/Don’t examples
   - Accessibility notes (contrast, focus, keyboard nav)
   - Variants and props

4. **Developer Handoff**
   - Token export in requested format (JSON/CSS/SCSS)
   - Component API reference
   - Implementation notes (React/Tailwind/CSS Modules)
   - Versioning and change log guidance

---

## Accessibility Requirements

- Contrast targets: WCAG AA as baseline
- Always define visible focus states
- Keyboard navigation for interactive components
- Reduced motion support where motion is used
