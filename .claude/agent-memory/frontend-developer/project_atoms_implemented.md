---
name: Design system atoms — IMPLEMENTED
description: SPEC-001 design-system-atoms completed 2026-04-22; all 12 atoms + tokens in src/app/shared/ui/atoms/
type: project
---

SPEC-001 design-system-atoms was implemented on 2026-04-22 on branch feature/FE-01-design-system-atoms.

**Why:** Foundation feature — no other UI feature can be built without this atom layer.

**How to apply:** All atoms are available at `src/app/shared/ui/atoms/`. Import them individually as standalone components. Tokens are at `src/styles/tokens.scss` (imported via `@use` in styles.scss).

Atoms created:
- `atoms.models.ts` — shared types (IconName, BadgeVariant, QuoteStatus, BtnVariant, BtnSize, StatTone)
- `icon/` — SVG inline icons (29 icons), DomSanitizer + SafeHtml
- `btn/` — primary/secondary/ghost, sm/xs sizes, iconLeft/iconRight
- `badge/` — ok/warn/info/brand/neutral variants + dot color
- `status-badge/` — maps QuoteStatus to badge variant + Spanish label
- `field/` — label, required, help, error (with alert icon), grid-column span
- `input/` — ControlValueAccessor wrapper
- `select/` — ControlValueAccessor wrapper with ng-content for options
- `textarea/` — ControlValueAccessor wrapper
- `switch/` — WCAG 2.1 AA, role=switch, aria-checked, Enter/Space keyboard, ControlValueAccessor
- `section-header/` — eyebrow/title/subtitle + slot=actions ng-content
- `sparkline/` — progress bar with clampPct utility (TDD tested)
- `stat-card/` — label/value/subtext with brand/info/neutral tone accent

TDD applied to: `sparkline.utils.ts` (clampPct) — 3 tests, all GREEN.
