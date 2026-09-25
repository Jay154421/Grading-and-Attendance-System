# DESIGN.md

Direction for the Grading and Attendance System UI.
Status: recorded from the owner's choices made on 2026-09-25 (sidebar redesign session).
The owner is the author of the direction; this file only records it.

## Identity

- Internal school tool (teacher and student portals), not a marketing site.
- Existing brand cue: red. The red stays, used as the accent, not the surface.
- Personality: calm, workmanlike, scannable. Nothing playful, nothing trendy.

## Palette

| Token | Value | Role |
|---|---|---|
| Surface | white / gray-50 page background | default everywhere |
| Text | gray-900 headings, gray-600 secondary | hierarchy by weight, not color |
| Accent | red-600 (brand mark, primary action, focus cues) | one accent, used sparingly |
| Active state | red-50 background + red-700 text | marks the current route only |
| Neutral chrome | gray-700 (menu, collapse, close controls) | utility controls must not read as destructive |

Rule: neutrals + one accent (red). No gradients, no glow, no second accent.
Red is reserved for the brand mark, the primary action, and destructive
confirmations, so a red control always means something.

## Typography

- System font stack (Tailwind default). Reason: no webfont is loaded and the
  product has no typographic identity yet; a loaded font is a later decision,
  not a silent default.
- Hierarchy through weight and size only.

## Sidebar (current spec)

- Light surface (white) instead of the old dark red: the old sidebar was a full
  red slab that competed with content; red now marks state, not surface.
- Active route = red-50/red-700 + `aria-current`: the one thing the sidebar
  must tell you is where you are.
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
- Inputs: `border-gray-500` at rest, `focus:ring-2 ring-red-500` on focus, so
  the focus ring has a width and is actually visible.
- Red is for destructive confirmations; status meaning is carried by green/red/
  yellow/blue-100 chips with -800 text (contrast 6.4-7.2:1), never by red alone.
- Date selection uses a native `<input type="date">`: the browser keyboard,
  locale, and mobile pickers are correct and free.

## Dials

ENERGY 1 / RHYTHM 1 / MOTION 1.

Reason: this is a daily-use internal tool. Calm and uniform is the correct
energy; motion is limited to hover feedback, a 200ms drawer slide that shows
where the panel came from, and a single toast entrance. Nothing loops.
