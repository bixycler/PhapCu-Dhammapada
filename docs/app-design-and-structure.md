# App Design & Structure: Kinh Pháp Cú (Dhammapada)

## 1. Overview

A single-page web app for browsing and comparing multiple Vietnamese translations of the
Dhammapada (Kinh Pháp Cú). The app displays verses from up to 6 translators side-by-side
in a CSS Grid, with illustrations, verse navigation, context menus, and deep-linkable URLs.

**Entry point:** `index.html`  
**Main logic:** `dhammapada-html.js` (606 lines, vanilla JS)  
**Data:** 7 JSON script files loaded as global variables

---

## 2. Data Model

### 2.1 Global data objects

Seven `.json.js` files are loaded as `<script>` tags in `index.html`. Each defines a
global variable scoped to `window`:

| File | Global Variable | Role |
|------|-----------------|------|
| `PhapCu-CreatZy.json.js` | `PhapCu_CreatZy` | Master index / TOC (`toc`) |
| `PhapCu-TamMinh.json.js` | `PhapCu_TamMinh` | Poetry translation |
| `PhapCu-MinhDuc.json.js` | `PhapCu_MinhDuc` | Poetry translation |
| `PhapCu-ThienNhut.json.js` | `PhapCu_ThienNhut` | Poetry translation |
| `PhapCu-MinhChau.json.js` | `PhapCu_MinhChau` | Poetry translation |
| `PhapCu-ThienSieu.json.js` | `PhapCu_ThienSieu` | Prose translation |
| `Dhammapada-Wickramanayaka.json.js` | `Dhammapada_Wickramanayaka` | Illustrated edition |

### 2.2 Book object structure

Every file defines a **book object** with these properties:

```js
{
  "title": "Kinh Pháp Cú (Dhammapada)",       // full title
  "year": 2000,                                 // publication year
  "author": "Thích Thiện Nhựt",                // translator/author name
  "source": "dịch từ tiếng Pāli",              // source description
  "link": "https://...",                       // source URL (some have 2)
  "preface": "Lời đầu sách...\n...",           // HTML preface text
  "chapters": {
    "1": { "title": "1. Song Đối", "from_verse": 1, "to_verse": 20 },
    "2": { "title": "2. Không Buông Lung", "from_verse": 21, "to_verse": 32 },
    // ... 24 more chapters, through 26
  },
  "imgdir": "Dhammapada-Wickramanayaka/720px",  // only for illustrated books
  "verses": {
    "1": "<verse text with (1) footnote markers>",
    "2": "...",
    // ... through 423; some verses have numeric values meaning "continuation of previous verse"
  },
  "notes": { "1": "footnote text", "2": "...", ... },  // optional footnotes
  "help": "<HTML help text>"                           // only in PhapCu_CreatZy
}
```

### 2.3 Runtime collections

In `dhammapada-html.js`, books are grouped into three **collections**:

| Collection | id | Books | CSS class | Grid column width |
|------------|----|-------|-----------|-------------------|
| `poetries` | `e` | TamMinh, MinhDuc, ThienNhut, MinhChau | `poetry` | `minmax(max-content, 500px)` |
| `proses` | `o` | ThienSieu | `explanation` | `minmax(30%, 500px)` |
| `illustrations` | `i` | Wickramanayaka | `illustration` | `max-content` |

Each book gets a **book id** = `collection.id + index` (e.g., `e0` = first poetry book).

Two books are selected as the **dual view pair** in `dualBooks = [PhapCu_TamMinh, PhapCu_MinhChau]`.

---

## 3. Views

The app has 5 views, toggled by the hamburger menu (`☰`). Only one view is active at a
time, identified by a `.chosen` CSS class on the menu item's parent `<div>`.

### 3.1 ColumnsView (default)
- **Purpose:** Browse verses with up to 3 columns side-by-side (poetry, prose, illustrations)
- **Header:** Chapter `<select>`, verse `<input>` + `<input type="range">`
- **Content:** CSS Grid with verse index column + selected book columns
- **Footer:** Previous chapter / scroll-to-top / next chapter buttons
- **URL:** `#ColumnsView/e0-o0-i0/1/1`
- **Responsive:** Adapts from 3-column down to 1-column based on screen width

### 3.2 DualView
- **Purpose:** Compare two translations side by side (2 columns + verse index)
- **Selectors:** Two book dropdowns `DualBook1` and `DualBook2`
- **URL:** `#DualView/e0-e3/1/1`
- **Disabled** when screen width < 800px

### 3.3 PrefacesView
- **Purpose:** Read translator prefaces/forewords
- **Content:** Large preface text below a book selector
- **URL:** `#PrefacesView/e0`

### 3.4 IntroView
- **Purpose:** App introduction (from `toc.preface`)
- **Content:** Preface content in `#AppendixDiv`
- **URL:** `#IntroView`

### 3.5 HelpView
- **Purpose:** Usage instructions (from `toc.help`)
- **Content:** Help text in `#AppendixDiv`
- **URL:** `#HelpView`

---

## 4. Layout System

### 4.1 CSS Grid (`#ContentDiv`)
The main content area is a CSS Grid:
```
grid-template-columns: 50px [col1] [col2] [col3]
```
- Column 1: verse index (always present, 50px wide)
- Columns 2-4: dynamically added per collection, controlled by `updateGridTemplate()`
- Grid rows auto-generated per verse with `gridRowStart: span N` for multi-verse cells

### 4.2 Responsive behavior
- **Initial Paint Prevention:** A CSS media query (`@media (max-width: 600px)`) styles `#ContentDiv` to a narrow `50px 1fr` template initially. This prevents Chrome Android and Safari from detecting horizontal overflow on first paint and inflating the layout viewport.
- **Stable Width Source:** Mobile/tablet devices use the device's physical `window.screen.width` via the `getWidth()` helper for columns count calculation. This prevents layout viewport and zoom state changes from triggering a positive feedback loop (or race condition) of column inflation.
- **Column Reduction:** `updateColumns(width)` collapses columns when width < 1000px (3→2) or < 600px (2→1).
- **Body Follows Content:** `ResizeObserver` on `#ContentDiv` keeps the `<body>` element width locked to the grid's actual rendered width on mobile/tablets, ensuring the header and footer span the entire page width.
- **Orientation Changes:** Handled naturally by browser `window.onresize` events utilizing the stable `getWidth()` width tracker.

### 4.3 Sticky header
`#HeaderDiv` uses `position: sticky; top: 0` to stay visible during scroll.

---

## 5. URL Routing

### 5.1 Hash-based routing
URL format: `#[ViewName]/[book-ids]/[chapter]/[verse]`
- `#ColumnsView/e0-o0-i0/1/1` — ColumnsView, poetry book e0, prose o0, illustration i0, ch 1, verse 1
- `#DualView/e0-e3/1/1` — DualView comparing e0 vs e3
- `#PrefacesView/e0` — PrefacesView showing preface of book e0
- `#IntroView` — IntroView (no parameters)
- `#HelpView` — HelpView (no parameters)

### 5.2 History management
- `window.onpopstate` handles browser back/forward
- `autoNavigating` flag distinguishes programmatic navigation (replaceState) from user actions (pushState)
- On page load, `loadPage()` parses the URL hash and restores state
- Deep links work: verse ID is updated in the hash on hover (via `ContextMenuButton.onmouseover`)

---

## 6. Key Functions

| Function | Lines | Purpose |
|----------|-------|---------|
| `loadPage(url)` | 193-220 | Parse URL hash and restore full app state |
| `setView(view)` | 501-552 | Switch between views, show/hide controls and content |
| `loadChapter(cid)` | 290-366 | Render a chapter's verses, footer, and attach event handlers |
| `loadVerse(vid)` | 441-457 | Navigate to a verse, auto-switch chapters if out of range |
| `scrollToVerse()` | 459-470 | Smooth-scroll to the current verse element |
| `updateColumns(width)` | 230-277 | Add/remove columns based on available width |
| `updateGridTemplate(view)` | 279-288 | Set CSS grid column widths for current view |
| `updateVerseId()` | 472-483 | Detect which verse is in the viewport during scroll |
| `updateURL()` | 554-583 | Construct URL hash and update browser title/history |
| `processVerse(book, vid)` | 422-434 | Convert verse text to HTML with footnote indicators |
| `moveColumn(src, dest)` | 222-228 | Move an `<optgroup>` and its options between `<select>` elements |
| `contentHover(event)` | 369-385 | Track hovered verse, position context menu |
| `getBook(bid)` | 33-39 | Resolve a book ID string to a book object |
| `inView(suspects)` | 490-499 | Check which view is currently active |

---

## 7. Interactivity

### 7.1 Chapter & verse navigation
- `<select id="ChapterSel">` triggers `loadChapter()`
- `<input id="VerseId">` (number) + `<input id="VerseSlide">` (range) trigger `loadVerse()`
- Auto-scroll: `window.onscroll` calls `updateVerseId()` to keep the verse input in sync with viewport
- Auto-navigate: if entered verse is outside the current chapter, `loadVerse()` jumps to the correct chapter

### 7.2 Book selection
- Column book `<select class="book">` changes:
  1. Move the old column's content to the new column (via `moveColumn`)
  2. Update grid template
  3. Reload current chapter
- Dual books `<select class="book-dual">` changes:
  1. Update the `dualBooks` array
  2. Reload current chapter

### 7.3 Context menu (`···`)
- Appears on hover over any verse element (index, poetry text, prose text, illustration)
- Positioned below the verse index number
- **ShareFB:** Opens Facebook share dialog
- **CopyLinkVerse:** Copies the current page URL to clipboard
- **Bookmark:** Placeholder (shows "to be implemented..." alert)
- **CopyVerseContent:** Copies the hovered element's text content to clipboard
- Right-click (native context menu) is restored; left-click opens the custom `···` menu

### 7.4 Footnote indicators
Verse text containing `(N)` patterns (e.g., `(1)`) is rendered as clickable `<span>` elements
showing a tooltip with the footnote text from `book.notes[N]`.

---

## 8. Mobile Support

- **Detection (Mobile/Tablet):** Detected via CSS media queries matching `(pointer: coarse) and (max-device-width: 1024px)`.
- **Viewport Width Source:** Governed by `getWidth()`, which uses the physical device width `window.screen.width` on mobile/tablets, bypassing the unstable browser-expanded layout viewport (`window.innerWidth`).
- **Initial Render:** Styled via mobile CSS `@media (max-width: 600px)` template `50px 1fr` to prevent initial viewport inflation.
- **Grid Sync:** `ResizeObserver` sets `Body.style.width` to match the grid content width, forcing the header and footer to stretch over any horizontal page overflow.
- **Orientation Changes:** Handled directly in `window.onresize` via `getWidth()`, ensuring columns collapse back down safely (e.g. from 2 columns in landscape to 1 column in portrait) without getting stuck in landscape-zoom layout states.
- **Menu items:** Font scales up via `6vmin` in media query for screens < 800px.
- **DualView:** Disabled on narrow screens, menu item shows "(Xoay ngang màn hình để xem)" hint.

---

## 9. Static Assets

| Path | Purpose |
|------|---------|
| `img/real-lotus.png` | Favicon |
| `img/facebook-button.png` | Facebook share button icon |
| `img/bookmark.png` | Bookmark menu item icon |
| `ref/*.pdf` | Reference PDFs of source texts |
| Google Fonts (Lobster, Lora, Charm, Lemonada) | Typography |
| `google271c70da1dda0983.html` | Google Search Console verification |

---

## 10. Dependencies

**None at runtime** — the app has been migrated from jQuery to pure vanilla JS.

**External resources loaded at page load:**
- Google Fonts CSS (4 font families)
- 7 local `.json.js` data files (loaded as `<script>` tags)
- 1 local `.js` main file (`dhammapada-html.js`)

**Browser APIs used:**
- `ResizeObserver`
- `navigator.clipboard.writeText`
- `window.history.pushState` / `replaceState` / `onpopstate`
- `window.open` (for Facebook sharing)
- `getComputedStyle`
- `scrollIntoView`
- `document.querySelector` / `querySelectorAll`
- `Element.classList`, `setAttribute`, `getAttribute`

---

## 11. File Map

```
index.html                                 Main HTML (278 lines, 1 inline <style>)
├── PhapCu-CreatZy.json.js                 Master index (toc, chapters, help)
├── PhapCu-TamMinh.json.js                 Translation data (Tam Minh)
├── PhapCu-MinhDuc.json.js                 Translation data (Minh Duc)
├── PhapCu-MinhChau.json.js                Translation data (Minh Chau)
├── PhapCu-ThienNhut.json.js               Translation data (Thien Nhut)
├── PhapCu-ThienSieu.json.js               Translation data (Thien Sieu)
├── Dhammapada-Wickramanayaka.json.js      Illustrated edition data
└── dhammapada-html.js                     Main application logic (606 lines)

img/                                       UI icons
├── real-lotus.png                         Favicon
├── facebook-button.png                    Share icon
└── bookmark.png                           Bookmark icon

docs/                                      Documentation
├── app-design-and-structure.md            This file
├── jquery-to-vanilla-migration.md         jQuery removal reference
└── mobile-viewport-lock-bug-report.md     Mobile viewport race condition bug report

ref/                                       Reference PDFs
├── Kinh Loi Vang (Phap Cu).pdf
├── Kinh Phap Cu - Thien Sieu - Minh Chau - Narada.pdf
├── KINHPHAPCU-Wickramanayaka-TamMinhNgoTangGiao.pdf
└── Treasury of Truth - Illustrated Dhammapada.pdf

Dhammapada-Wickramanayaka/                Illustration images (720px subfolder)
PhapCu-TamMinh/                            Book-specific images
PhapCu-MinhDuc/
PhapCu-MinhChau/
PhapCu-ThienNhut/
PhapCu-ThienSieu/
```
