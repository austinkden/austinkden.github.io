# Repository Design & Aesthetic Rules

To maintain the custom, minimalist aesthetic of the astrong.xyz project, all agents must adhere to the following design guardrails:

## 1. Avoid "AI-Style" Bloat
- **No Glowing Backgrounds**: Do not add glowing orbs, decorative radial background animations, or pulsing light effects.
- **Solid Backgrounds**: Prefer solid background colors (e.g., `#121212` or dark off-black) for subpage designs unless a specific linear gradient is explicitly requested.
- **Zero Shadows**: Do not add box-shadows or text-shadows to cards, buttons, badges, or cells unless specifically requested.
- **Minimalist Hover States**: Keep hovers simple and non-harsh. Avoid translating elements (e.g. `transform: translateY(-8px)`) or expanding box shadows. Use simple, direct color transitions (border color or background color changes).

## 2. Text Selection & Usability Invariants
- **Highlight Styling**: All pages must define uniform selection styling matching the homepage selection palette:
  - highlight color: `#8859ff` on background `#f2edff`.
- **Selection Restrictions**: Explicitly disable text selection (using `user-select: none;` and `-webkit-user-select: none;`) on interactive elements like buttons, day cells, month arrows, navigation bars, and logos. Allow selection only on content text (like hours and notes).

## 3. DOM Target Isolation
- **Prevent Root Script Conflicts**: The root `script.js` targets the page's `<h1>` element to cycle through construction phrases on click. On secondary portal or utility pages (such as `/schedule`), avoid using `<h1>` tags for static titles so that the root script does not target and override them. Use custom styled elements (e.g. `<div class="portal-title">`) instead.
