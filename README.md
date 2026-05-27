# danvisser.online

Photography portfolio. Plain HTML / CSS / JS, deployed to Vercel.

## Adding photos to an existing collection

1. Drop JPEGs into `images/<collection>/`, named sequentially: `001.jpg`, `002.jpg`, etc.
2. If a file is over ~3MB, resize it:
   ```
   sips -Z 2400 -s formatOptions 80 file.jpg --out file.jpg
   ```
3. Add a matching entry to `images/<collection>/config.json`:
   ```json
   { "file": "017.jpg", "coords": [48.8566, 2.3522] }
   ```
   `coords` is optional — omit it if you don't have a location.

### Per-image display overrides

Each image entry also supports an optional `style` field whose keys map directly to CSS properties applied inline to the `<img>` element. Useful when a specific photo needs to be shown smaller or constrained differently:

```json
{ "file": "012.jpg", "coords": [...], "style": { "maxHeight": "70vh" } }
{ "file": "013.jpg", "coords": [...], "style": { "maxWidth": "50vw" } }
```

Default behaviour (no `style` block) fills the available viewport while preserving the photo's aspect ratio.

## Switching the active collection

In `script.js`:

```js
const COLLECTION = 'europe_2025';
```

Also update the `og:image` URL in `index.html`'s `<head>` to a representative photo from the new collection.

## Running locally

Because the page fetches `config.json`, opening `index.html` directly via `file://` won't work. Run a local server:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deployment

Push to `main`. Vercel auto-deploys.
