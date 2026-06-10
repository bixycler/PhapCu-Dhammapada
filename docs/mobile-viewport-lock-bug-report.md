# Bug Report: Mobile Viewport Lock & Column Race Condition

## 1. Symptoms & Context

This bug was observed on **Chrome (Android)** and other modern mobile browsers when migrating the application away from dynamic viewport meta scaling hacks to standard `width=device-width` responsive layouts.

### Symptoms
1. **Portrait Blowup**: On first load in portrait, the page would sometimes render with 2 columns instead of 1, and the layout viewport width (`window.innerWidth`) would jump from 360px to 720px.
2. **Orientation Lock (Blowup after rotation)**: When the user rotated from portrait to landscape (transitioning to 2 or 3 columns), and then rotated back to portrait, the browser would stay locked in the landscape/zoomed layout (e.g. `window.innerWidth` stuck at 1024px, 2-3 columns active). The 2nd and 3rd columns would be hidden off-screen, requiring horizontal panning.
3. **Glitchy Sticky Header**: The header (`#HeaderDiv`) would lose its sticky behavior on mobile, or only cover the viewport portion (the first column) instead of spanning the entire grid width.

---

## 2. Root Cause Analysis

### The Unstable Layout Viewport (`window.innerWidth`)
On mobile browsers (like Chrome Android and Safari), `window.innerWidth` represents the **layout viewport**. 
To prevent excessive horizontal scrolling on pages with wide content, mobile browsers employ a layout heuristic: if any element on the page overflows the initial containing block (viewport), the browser will **expand the layout viewport** to fit the content and zoom out slightly.

### The Feedback Loop (The Race Condition)
This layout behavior created a positive feedback loop (race condition) inside `dhammapada-html.js`:

```
4-col paint → viewport inflates → onresize → more columns → body locks wide → rotate back stuck
```

1. **Initial Wide Template**: In `setView('ColumnsView')`, the app called `updateGridTemplate('ColumnsView')` which instantly rendered all 4 columns (`50px minmax(max-content, 500px) ...`), making the grid ~1200px wide.
2. **Viewport Expansion**: The browser saw a 1200px wide grid and inflated the layout viewport (`window.innerWidth`) to fit.
3. **JS Triggers onresize**: Because `window.innerWidth` changed, the browser fired the `window.onresize` event.
4. **Columns Inflate**: Inside `window.onresize`, `updateColumns(window.innerWidth)` read the inflated width (e.g. 720px) and kept/added columns (e.g., 2 columns instead of 1).
5. **Body Width Locks Viewport**: To fix the header spanning, the `ResizeObserver` on `#ContentDiv` set `Body.style.width` to the grid's actual width (e.g. 770px). 
6. **Orientation Lock**: When the user rotated back to portrait, Chrome saw that the `<body>` had a hardcoded CSS width of `770px`/`849px`. Because Chrome wants to fit the 849px body, it **refused to shrink `window.innerWidth` back to 360px**, locking it at `1024px` instead.
7. **Early Return**: In `onresize`, the delta was 0, so the resize was ignored, and the columns never collapsed back down to 1 in portrait.

---

## 3. The Resolution

To fix the race and the orientation lock completely, we had to decouple the column-count decision from the layout viewport (`window.innerWidth`) on mobile, while still keeping the header spanning correctly.

### 1. CSS Media Query for Initial Paint (`index.html`)
We added a media query to constrain the initial grid template on mobile:
```css
@media (max-width: 600px) {
    #ContentDiv {
        grid-template-columns: 50px 1fr;
    }
}
```
This ensures that on first paint, the grid is only `50px + 1fr` (~360px), so the layout viewport is never initially inflated.

### 2. Skip Redundant Inline Grid Templates (`dhammapada-html.js`)
We modified `setView` to skip calling `updateGridTemplate` for `ColumnsView` initially, letting `updateColumns` handle it in the same synchronous task. This prevents the temporary 4-column paint.

### 3. Stable Width Source Helper (`getWidth()`)
We added a helper that uses the device's physical screen width (`window.screen.width`) on mobile/tablets, and falls back to `window.innerWidth` on desktop:
```js
const isMobileOrTablet = window.matchMedia('(pointer: coarse) and (max-device-width: 1024px)').matches;
const getWidth = () => isMobileOrTablet ? window.screen.width : window.innerWidth;
```
`window.screen.width` is a hardware constant for the current orientation (360px in portrait, 740px in landscape). It is **completely unaffected** by layout overflows, zoom levels, or CSS body widths.

By replacing all instances of `window.innerWidth` with `getWidth()`:
- On rotation back to portrait, `getWidth()` gets 360px (stable).
- `updateColumns(360)` runs, collapsing the columns to 1.
- The grid shrinks, `ResizeObserver` updates `Body.style.width` to match (~450px).
- The layout viewport can now naturally shrink back, and the layout settles cleanly.

---

## 4. Verification Logs (Clean Behavior)

With the fixes active, we can observe the layout settling perfectly with no feedback loops:

### Portrait Load
- Initial viewport settles stably at 360px.
- Grid is placed in **1 column** (correct).
- Body matches content width (~448px), and header/footer stretch to span the entire 448px correctly.

### Rotate to Landscape
- `onresize` fires with screen width = 740px.
- Column count updates to **2 columns** (index + poetry + illustration) correctly.
- Body matches content width (768px). No oscillation.

### Pinch Zooms
- Visual viewport heights/zooms change, but layout columns stay stable (no loops).

### Rotate to Portrait (Collapse Fix)
- `onresize` fires with screen width = 360px (re-collapses to portrait cleanly!).
- Columns correctly collapse back to **1 column**.
- Body successfully shrinks back to 550px.
