# Stor-Elvdal Hotell Landing Page

A premium static website prototype for Stor-Elvdal Hotell in Koppang, positioned around art, food, heritage and the Rv3 Oslo–Trondheim route.

## Preview in a browser

Start the preview server from this project folder:

```bash
cd stor-elvdal-hotell
npm run dev
```

Then copy/paste this URL into your browser address bar:

```text
http://localhost:3000/
```

You can also print the URL any time with:

```bash
npm run url
```

## If the browser times out

A timeout usually means the server is not running in the same environment as the browser, or the port is not forwarded.

- If you are working locally on your own computer, keep the `npm run dev` terminal open and use `http://localhost:3000/`.
- If you are working inside a hosted workspace/container, do **not** use your personal computer's `localhost`; use the workspace's forwarded-port URL for port `3000`.
- If port `3000` is already in use, choose another port:

```bash
PORT=4173 npm run dev
```

Then open the matching forwarded-port URL, or locally:

```text
http://localhost:4173/
```

## Files

- `index.html` — page structure, messaging, booking CTA and sections.
- `styles.css` — premium visual design and responsive layout.
- `script.js` — mobile navigation toggle and prototype booking form handler.
- `server.js` — tiny dependency-free preview server for browser access.
