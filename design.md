# Design System

Welcome to the **astrong.xyz** design system documentation. This document outlines the design principles, visual tokens, typography, layout structures, and behavioral rules that govern the user experience of the website and its various subpage portals.

---

## 1. Core Philosophy & Aesthetics

The design of **astrong.xyz** is rooted in a sleek, minimalist dark theme that draws heavy inspiration from **Material Design 3 (M3)** while incorporating unique creative elements (like animated cookie shapes and interactive headers). 

Key visual principles:
- **Premium Dark Mode**: Rich dark purple/black surfaces instead of generic gray or solid black.
- **Zero Shadows**: Flat components with high-contrast outlines instead of floating box-shadows.
- **Micro-Animations**: Snappy, pleasant hover states that use color transitions rather than harsh transforms.
- **Strict Selectability Controls**: Preventing highlight clutter by making interactive elements, images, and input placeholders non-selectable while keeping content text readable and selectable.

---

## 2. Typography

We use **Google Sans Flex** as our single typography family. It is imported dynamically from Google Fonts:

```css
@import url('https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,slnt,wdth,wght,GRAD,ROND@6..144,-10..0,25..151,1..1000,0..100,0..100&display=swap');
```

### Font Configurations
- **Headers & Titles**: Heavy font weight (`800`) with custom variation settings to refine roundness and width.
  - `font-variation-settings: 'ROND' 100, 'wdth' 85;`
- **Subtitles & Card Headings**: Bold weight (`700`) with narrow flex properties.
  - `font-variation-settings: 'ROND' 100, 'wdth' 80;`
- **Body & Content Text**: Medium (`500`) or Regular (`400`) weights for high readability.

---

## 3. Color Palette & M3 Tokens

The file [palette.css](file:///c:/Users/austi/VSCode/astrong.xyz/palette.css) serves as the source-of-truth for all color tokens. Each portal/stylesheet maps local CSS variables from this palette.

### Main Colors
| Token / Variable | Hex Code | Purpose |
| :--- | :--- | :--- |
| `--background` | `#121016` | Deep dark purple background |
| `--surface` | `#1d1b20` | Card and component container background |
| `--surface-variant` | `#2d2a33` | Hover background states |
| `--primary` | `#8859ff` | Signature purple accent color |
| `--primary-container` | `#4527a0` | Dark container fill for icons / buttons |
| `--outline` | `#49454f` | Flat structural borders (1px) |
| `--on-surface` | `#e6e1e5` | Primary text color |
| `--on-surface-variant` | `#cac4d0` | Secondary description text color |

---

## 4. Selection & Interactivity Invariants

To keep interfaces feeling like native applications, text highlight and selectability rules are strictly defined.

### Global Selection Palette
All selection highlights match the uniform signature purple branding:
- **Highlight Text Color**: `#8859ff`
- **Highlight Background Color**: `#f2edff`

```css
*::selection {
    color: var(--highlight-color);
    background: var(--highlight-bg);
}
```

### Selectability Invariants
1. **Interactive Elements**: Elements like buttons, portal cards, navigation controls, back-links, and page titles have text selection disabled.
   ```css
   user-select: none;
   -webkit-user-select: none;
   ```
2. **Content Text**: Data text (such as shifts, hours, calculations, or copyable notes) explicitly remains selectable.
3. **Images & Placeholders**: Images and input placeholder text are strictly non-selectable and non-draggable site-wide:
   ```css
   img {
       -webkit-user-select: none;
       -webkit-user-drag: none;
       user-select: none;
   }
   ::placeholder {
       -webkit-user-select: none;
       user-select: none;
   }
   ```
4. **Clean CSS Cascading**: The universal `*` selector does not declare `user-select: text` to allow proper cascade of `user-select: none` from parent layouts down to descendants.

---

## 5. Component Design

### Material 3 Flat Cards
Cards represent navigation items or utility controls. They have:
- A flat border of `1px solid var(--outline)`
- A border radius of `24px` (matching M3 medium/large corners)
- Zero box-shadows or text-shadows
- Snappy hover states that change background and border color smoothly (`transition: 0.2s ease`):

```css
.portal-card {
    background: var(--surface);
    border: 1px solid var(--outline);
    border-radius: 24px;
    transition: background-color 0.2s ease, border-color 0.2s ease;
}
.portal-card:hover {
    background: var(--surface-variant);
    border-color: var(--primary);
}
```

---

## 6. Unique Creative & Architectural Features

### Interactive Construction H1
The main homepage features a title header `<h1>` containing the name "Austin Strong". When clicked, a script cycles through funny developer construction phrases ("Under construction", "Building cool things", "Pardon the mess", etc.).

### DOM Target Isolation
Because the homepage script targets `<h1>` tags to enable construction cycles, **secondary utility or scheduling pages must avoid using `<h1>` tags for static titles** to prevent the script from intercepting and overriding them. Secondary titles are structured using custom division selectors:
```html
<!-- Secondary Page Title Structure -->
<header class="portal-header">
    <div class="portal-title">Text Toolkit</div>
</header>
```

### SVG Clip Path Cookie Masks
Profile pictures on the website use a dynamic `clip-path` mask loaded from a hidden inline SVG definitions block. The script randomly assigns one of the following cookie-themed shapes to the profile wrapper on load:
- `nine-sided-cookie` (default)
- `four-sided-cookie`
- `six-sided-cookie`
- `sunny`
- `pentagon`
