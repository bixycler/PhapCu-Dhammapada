# jQuery → Vanilla JS Migration Guide

This document is a reference for migrating `dhammapada-html.js` from jQuery to vanilla JavaScript.
Each pattern used in the codebase is documented with its jQuery form, vanilla replacement, and all affected locations.

---

## 1. Remove jQuery dependency

### File: `index.html`

```diff
- <script src="https://code.jquery.com/jquery-3.5.0.js"></script>
```

---

## 2. Pattern Reference

### Pattern A: `$(el).width()` / `.height()` getter → `el.offsetWidth` / `el.offsetHeight`

| jQuery | Vanilla |
|--------|---------|
| `$(el).width()` | `el.offsetWidth` |
| `$(el).height()` | `el.offsetHeight` |

> **Note:** `offsetWidth` includes padding + border, while jQuery `.width()` excludes border.
> In this codebase the difference is negligible for layout calculations.

| File | Line(s) | jQuery | Vanilla |
|------|---------|--------|---------|
| dhammapada-html.js | 74 | `$(ContentDiv).width()` | `ContentDiv.offsetWidth` |
| dhammapada-html.js | 75 | `$(ContentDiv).height()` | `ContentDiv.offsetHeight` |

---

### Pattern B: `$(el).width(val)` setter → `el.style.width = val + 'px'`

| jQuery | Vanilla |
|--------|---------|
| `$(el).width(val)` | `el.style.width = val + 'px'` |

| File | Line(s) | jQuery | Vanilla |
|------|---------|--------|---------|
| dhammapada-html.js | 121 | `$(Body).width(screen.width)` | `Body.style.width = screen.width + 'px'` |
| dhammapada-html.js | 134 | `$(Body).width(contentWidth)` | `Body.style.width = contentWidth + 'px'` |

---

### Pattern C: `$(el).css(prop)` getter → `getComputedStyle(el).camelCaseProp`

| jQuery | Vanilla |
|--------|---------|
| `$(el).css(prop)` | `getComputedStyle(el)[camelCaseProp]` |

CSS property names use camelCase when accessed as JS object properties:
- `'display'` → `.display`
- `'padding-bottom'` → `.paddingBottom`
- `'grid-template-columns'` → `.gridTemplateColumns`

| File | Line(s) | jQuery | Vanilla |
|------|---------|--------|---------|
| dhammapada-html.js | 274 | `$(coll.select).css('display')` | `getComputedStyle(coll.select).display` |
| dhammapada-html.js | 354 | `$(v).css('padding-bottom')` | `getComputedStyle(v).paddingBottom` |

---

### Pattern D: `$(el).css(prop, val)` setter → `el.style.camelCaseProp = val`

| jQuery | Vanilla |
|--------|---------|
| `$(el).css(prop, val)` | `el.style[camelCaseProp] = val` |

For numeric values, append `'px'`:
```js
ContextMenu.style.top = (v.offsetTop + v.clientHeight - padding) + 'px';
ContextMenu.style.left = (v.offsetLeft + v.offsetWidth / 2) + 'px';
```

| File | Line(s) | jQuery | Vanilla |
|------|---------|--------|---------|
| dhammapada-html.js | 277 | `$(ContentDiv).css('grid-template-columns', colw)` | `ContentDiv.style.gridTemplateColumns = colw` |
| dhammapada-html.js | 312 | `cell.css('grid-row-start', 'span ' + res.num)` | `cell.style.gridRowStart = 'span ' + res.num` |
| dhammapada-html.js | 353 | `$(ContextMenu).css('top', val)` | `ContextMenu.style.top = val + 'px'` |
| dhammapada-html.js | 355 | `$(ContextMenu).css('left', val)` | `ContextMenu.style.left = val + 'px'` |

---

### Pattern E: `$.each(arr, fn)` → `arr.forEach(fn)` or `Object.entries(obj).forEach(fn)`

| jQuery | Vanilla (array) | Vanilla (object) |
|--------|-----------------|------------------|
| `$.each(arr, fn)` | `arr.forEach((v,i) => fn(i, v))` | — |
| `$.each(obj, fn)` | — | `Object.entries(obj).forEach(([k,v]) => fn(k, v))` |

| File | Line(s) | jQuery | Vanilla |
|------|---------|--------|---------|
| dhammapada-html.js | 78 | `$.each(toc.chapters, fn)` | `Object.entries(toc.chapters).forEach(([i, chapter]) => {...})` |
| dhammapada-html.js | 91 | `$.each(coll.books, fn)` | `coll.books.forEach((book, i) => {...})` |

---

### Pattern F: `$(el).attr(name)` getter → `el.getAttribute(name)`

| jQuery | Vanilla |
|--------|---------|
| `$(el).attr(name)` | `el.getAttribute(name)` |

| File | Line(s) | jQuery | Vanilla |
|------|---------|--------|---------|
| dhammapada-html.js | 344 | `$(this).attr('vid')` | `this.getAttribute('vid')` |
| dhammapada-html.js | 345 | `$(this).attr('vn')` | `this.getAttribute('vn')` |

---

### Pattern G: `$(el).trigger('change')` → `el.dispatchEvent(new Event('change'))`

| jQuery | Vanilla |
|--------|---------|
| `$(el).trigger('change')` | `el.dispatchEvent(new Event('change'))` |

| File | Line(s) | jQuery | Vanilla |
|------|---------|--------|---------|
| dhammapada-html.js | 330 | `$(VerseId).trigger("change")` | `VerseId.dispatchEvent(new Event('change'))` |
| dhammapada-html.js | 425 | `$(ChapterSel).trigger('change')` | `ChapterSel.dispatchEvent(new Event('change'))` |
| dhammapada-html.js | 496 | `$(DualBook2).trigger('change')` | `DualBook2.dispatchEvent(new Event('change'))` |

Also inside inline `onclick` strings (lines 323, 328):
```diff
- $(ChapterSel).trigger("change")
+ ChapterSel.dispatchEvent(new Event("change"))
```

---

### Pattern H: `$(selector).change(fn)` → `querySelectorAll` + `forEach` + `addEventListener`

| jQuery | Vanilla |
|--------|---------|
| `$(selector).change(fn)` | `document.querySelectorAll(selector).forEach(el => el.addEventListener('change', fn))` |

| File | Line(s) | jQuery | Vanilla |
|------|---------|--------|---------|
| dhammapada-html.js | 146 | `$('select.book').change(loadBook)` | `document.querySelectorAll('select.book').forEach(el => el.addEventListener('change', loadBook))` |
| dhammapada-html.js | 161 | `$('select.book-dual').change(loadBookDual)` | `document.querySelectorAll('select.book-dual').forEach(el => el.addEventListener('change', loadBookDual))` |

---

### Pattern I: `$(el).append(htmlStr)` → `el.insertAdjacentHTML('beforeend', htmlStr)`

| jQuery | Vanilla |
|--------|---------|
| `$(el).append(html)` | `el.insertAdjacentHTML('beforeend', html)` |

| File | Line(s) | jQuery | Vanilla |
|------|---------|--------|---------|
| dhammapada-html.js | 231 | `$(DualView).append(...)` | `DualView.insertAdjacentHTML('beforeend', ...)` |

---

### Pattern J: `$(el).text(val)` setter → `el.textContent = val`

| jQuery | Vanilla |
|--------|---------|
| `$(el).text(val)` | `el.textContent = val` |

| File | Line(s) | jQuery | Vanilla |
|------|---------|--------|---------|
| dhammapada-html.js | 238 | `$(DualView).text(...)` | `DualView.textContent = ...` |

---

### Pattern K: `$('#id')` → `document.getElementById('id')`

| jQuery | Vanilla |
|--------|---------|
| `$('#id')` | `document.getElementById('id')` |
| `$('#id')[0]` | `document.getElementById('id')` (already returns the element) |

| File | Line(s) | jQuery | Vanilla |
|------|---------|--------|---------|
| dhammapada-html.js | 351 | `$('#v'+currentVid)[0]` | `document.getElementById('v'+currentVid)` |
| dhammapada-html.js | 539 | `$('#'+view)[0].innerText` | `document.getElementById(view).innerText` |

---

### Pattern L: `$(el)` wrapping a DOM element → use the element directly

When `el` is already a DOM element reference, `$(el)` just wraps it in jQuery.
Simply remove the `$()` wrapper and use the element directly.

Affected locations (all covered in other patterns above):
- `$(coll.select)` → `coll.select`
- `$(ContentDiv)` → `ContentDiv`
- `$(ContextMenu)` → `ContextMenu`
- `$(v)` → `v`
- `$(Body)` → `Body`
- `$(this)` → `this`

---

### Pattern M: `$('<tag>...</tag>')` DOM creation → `document.createElement` + property setting

**General recipe:**

```js
// BEFORE (jQuery)
$('<tag>').attr('attr1', val1).attr('attr2', val2).text(content).appendTo(parent);

// AFTER (vanilla)
const el = document.createElement('tag');
el.setAttribute('attr1', val1);
el.setAttribute('attr2', val2);
el.textContent = content;
// or el.innerHTML = htmlContent;
// or el.className = 'class-name';
parent.appendChild(el);
```

**Affected locations:**

| Line(s) | Creates | Key attributes |
|---------|---------|---------------|
| 79 | `<option>` | `value=i`, `textContent=chapter.title` |
| 92-93 | `<option>` | `value=coll.id+i`, `textContent='© '+book.year+' '+book.author` |
| 170 | `<p>` | `innerHTML=book.preface.replace(/\n/g,'<br/>\n')` |
| 297 | `<div class="index">` | `id='v'+vid`, `setAttribute('vid',vid)`, `textContent=vid` |
| 300-303 | `<img>` | `className=illustrations.class`, `src=...`, `title='kệ số '+vid`, `setAttribute('vid',vid)` |
| 307 | `<p>` | `className=book.collection.class`, `innerHTML=res.txt` |
| 309 | `<div>` | `className=book.collection.class` |
| 310 | (set attribute) | `setAttribute('vn', res.num)` |
| 312 | (set style + attr + append) | `style.gridRowStart='span '+res.num`, `setAttribute('vid',vid)`, append to ContentDiv |
| 321-323 | `<input type="button">` | `className='chapter'`, `value=toc.chapters[cid-1].title+' ◁'`, `onclick=...` |
| 324-325 | `<input type="button">` | `className='chapter'`, `value='△'`, `onclick='scrollToTop();'` |
| 326-328 | `<input type="button">` | `className='chapter'`, `value='▷ '+toc.chapters[cid+1].title`, `onclick=...` |
| 508 | `<h3>` | `textContent='Giới thiệu'` |
| 511 | `<p>` | `innerHTML=toc.preface` |
| 512 | `<h3>` | `textContent='Hướng dẫn sử dụng'` |
| 515 | `<p>` | `innerHTML=toc.help` |

For line 310 (`p.appendTo(cell)`): `p` is a jQuery object wrapping a `<p>` element.
Save the raw DOM element and use `cell.appendChild(pElem)`:

```js
const pElem = document.createElement('p');
pElem.className = book.collection.class;
pElem.innerHTML = res.txt;
let cell = pElem;
if (res.num > 1) {
  const div = document.createElement('div');
  div.className = book.collection.class;
  div.appendChild(pElem);
  cell = div;
  cell.setAttribute('vn', res.num);
}
cell.style.gridRowStart = 'span ' + res.num;
cell.setAttribute('vid', vid);
ContentDiv.appendChild(cell);
```

---

## 3. Affected UI places

Each change corresponds to a visible part of the application:

| UI Place | Lines | Description |
|----------|-------|-------------|
| **Chapter dropdown** | 78-80 | `<select id="ChapterSel">` — populates chapter list in the header bar |
| **Book dropdowns** | 91-94 | `<select class="book">` — populates Poetry/Prose/Illustration selectors |
| **Body sizing (mobile)** | 121, 134 | Sets `<body>` width for responsive mobile layout |
| **Book selector changes** | 146 | When user picks a book from Poetry/Prose/Illustration dropdown |
| **Dual book selector changes** | 161 | When user picks a book in DualView mode |
| **Preface text** | 170 | Book preface displayed in PrefacesView |
| **DualView menu hint** | 231 | "Xoay ngang màn hình để xem" hint on narrow mobile screens |
| **DualView menu text** | 238 | "So sánh 2 bản song song" text reset when wide enough |
| **Column visibility** | 274 | Checks whether a book column `<select>` is displayed |
| **Grid layout** | 277 | The main 4-column CSS grid (`#ContentDiv`) |
| **Verse index numbers** | 297 | Grey verse number column on the left |
| **Illustration images** | 300-303 | 320px-wide Dhammapada artwork |
| **Poetry/prose content** | 307-312 | Verse text cells (poetry italic or prose right-aligned) |
| **Footer: prev chapter** | 321-323 | ◁ button at the bottom |
| **Footer: scroll to top** | 324-325 | △ button at the bottom |
| **Footer: next chapter** | 326-328 | ▷ button at the bottom |
| **Verse ID input sync** | 330 | Auto-updates `#VerseId` number input when chapter changes |
| **Hover context menu** | 344-355 | `···` menu positioned under the verse index on hover |
| **Chapter auto-navigate** | 425 | Jumps to correct chapter when verse is out of range |
| **Preface view trigger** | 496 | Loads preface content when entering PrefacesView |
| **Intro heading** | 508 | "Giới thiệu" `<h3>` heading |
| **Intro body** | 511 | Preface paragraph in IntroView |
| **Help heading** | 512 | "Hướng dẫn sử dụng" `<h3>` heading |
| **Help body** | 515 | Help paragraph in HelpView |
| **Page title** | 539 | Document `<title>` updated in the browser tab/bar |

---

## 4. Summary of all changes

| Pattern | Count | Lines |
|---------|-------|-------|
| A: width/height getter | 2 | 74, 75 |
| B: width setter | 2 | 121, 134 |
| C: css getter | 2 | 274, 354 |
| D: css setter | 4 | 277, 312, 353, 355 |
| E: $.each | 2 | 78, 91 |
| F: attr getter | 2 | 344, 345 |
| G: trigger change | 5 | 323, 328, 330, 425, 496 |
| H: change binding | 2 | 146, 161 |
| I: append html | 1 | 231 |
| J: text setter | 1 | 238 |
| K: #id selector | 2 | 351, 539 |
| L: unwrap $() | (covered by other patterns) | — |
| M: DOM creation | ~15 | 79, 92, 170, 297, 300, 307, 309, 312, 321, 324, 326, 508, 511, 512, 515 |

**Total: ~40 jQuery expressions to replace, plus removing the CDN script tag.**
