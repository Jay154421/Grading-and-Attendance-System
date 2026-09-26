# DESIGN.md

Direction for the Grading and Attendance System UI.
Status: recorded from the owner's choices made on 2026-09-25 (sidebar redesign session).
The owner is the author of the direction; this file only records it.

## Identity

- Internal school tool (teacher and student portals), not a marketing site.
- The interface uses a restrained indigo palette. Red remains a semantic signal for danger and failure states, not a general brand color.
- Personality: calm, workmanlike, scannable. Nothing playful, nothing trendy.

## Palette

| Token | Value | Role |
|---|---|---|
| Surface | `#F8FAFC` page background / white cards | 60% of the interface |
| Primary | `#4338CA` | 30%: primary actions, focus cues |
| Highlight | `#4338CA` at reduced opacity | 10%: active route/tab indicators and small highlights |
| Active state | primary at 10% opacity + primary text | marks the current route or tab |
| Neutral chrome | gray-700 (menu, collapse, close controls) | utility controls must not read as destructive |

Rule: use `#F8FAFC` for roughly 60% of the surface, `#4338CA` for roughly
30% of primary UI, and reduced-opacity `#4338CA` for roughly 10% of active UI.
Neutrals handle text, borders, and elevation. No gradients, no glow, no second
UI accent hue: the green `#17A668` in the logo is brand artwork only and never
colors an interface state. Red is reserved for errors, destructive actions,
failed grades, absent attendance, and required or invalid field indicators.

## Brand assets

- Approved artwork: `public/logo.png` (EduCheck, blue `#3B3CB2` on green
  `#17A668`). It is the only brand artwork. Nothing is redrawn, recolored, or
  substituted for it.
- Variants are crops of that file, nothing more:
  - `public/logo-lockup.png`: full stacked lockup, auth screen.
  - `public/logo-wordmark.png`: word and tagline, expanded sidebar.
  - `public/logo-mark.png`: cap symbol, collapsed 80px rail.
  - `public/favicon.png`: cap symbol on an opaque white square, because a
    transparent mark loses contrast against dark browser tab themes.
- Reason for two sidebar lockups: the 80px rail fits the symbol only, the
  256px sidebar fits the wordmark. Both are the same approved drawing.

## Typography

- System font stack (Tailwind default). Reason: no webfont is loaded and the
  product has no typographic identity yet; a loaded font is a later decision,
  not a silent default.
- Hierarchy through weight and size only.

## Sidebar (current spec)

- Light surface (white) instead of a full-color slab: the sidebar stays quiet so
  content and status remain easy to scan.
- Active route = primary at 10% opacity, primary text, and `aria-current`: the
  one thing the sidebar must tell you is where you are.
- Collapsible to a 80px icon rail (desktop, persisted): more room for tables
  and grade sheets when reading data.
- Slide-in drawer on mobile with backdrop: replaces the old duplicated inline
  menu; closes on link click, backdrop click, and Escape.
- Minimum 44px tap targets: mobile comfort, hard requirement.
- Focus moves into the drawer on open, is trapped while open, and returns to
  the trigger on close: keyboard use must not leak into the page behind.

## Shared components (src/components/ui)

Every component exists to fix a defect found in audit-002, not to look modern.

| Component | Purpose (one line) |
|---|---|
| `Button.jsx` | One button vocabulary (primary/secondary/quiet) at a guaranteed 44px target, so actions never fall below R-03. |
| `Field.jsx` | One input/label/error vocabulary with `aria-live` hint and error text, so validation is announced instead of silently shown. |
| `States.jsx` | Loading, empty, and error states in one place, because screens previously rendered blank or swallowed failures (R-27). |
| `Modal.jsx` | Focus trap, Escape, focus restore, `role="dialog"` and a title association in one implementation, because four dialogs each re-implemented this badly (R-32). |
| `Toast.jsx` / `toastApi.js` | Success and failure feedback in real `aria-live` regions (assertive for errors, polite for success), replacing a non-announcing toast library. |
| `LoadingScreen.jsx` | Session-load spinner for both layouts, which used to render `null`. |

## Conventions

- Headings: `h1` belongs to the layout header, `h2` is the page title, `h3` is
  a section. One `h1` per view, no skipped levels.
- Inputs: `border-gray-500` at rest, `focus:ring-2 ring-brand` on focus, and
  `aria-invalid` red styling when validation fails.
- Indigo is the general action, focus, and active-state color. Reduced-opacity
  indigo is reserved for active route/tab indicators and small highlights.
- Red is reserved for errors, destructive actions, failed grades, absent
  attendance, and required or invalid field indicators. Status meaning is
  carried by green/red/yellow/blue-100 chips with -800 text (contrast
  6.4-7.2:1), never by red alone.
- Date selection uses a native `<input type="date">`: the browser keyboard,
  locale, and mobile pickers are correct and free.

## Dials

ENERGY 1 / RHYTHM 1 / MOTION 1.

Reason: this is a daily-use internal tool. Calm and uniform is the correct
energy; motion is limited to hover feedback, a 200ms drawer slide that shows
where the panel came from, and a single toast entrance. Nothing loops.
