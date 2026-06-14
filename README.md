# Stor-Elvdal Hotell Landing Page

A premium static website prototype for Stor-Elvdal Hotell in Koppang, positioned around art, food, heritage and the Rv3 Oslo–Trondheim route.

## Preview locally

Start the built-in preview server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000/
```

If your preview environment assigns a port automatically, set `PORT` before starting the server. The server binds to `0.0.0.0`, so hosted workspaces can expose it in a browser. If you are opening the site from a hosted workspace, do not use your personal computer's `localhost`; use the workspace's forwarded-port URL for port 3000:

```bash
PORT=4173 npm run dev
```

## Files

- `index.html` — page structure, messaging, booking CTA and sections.
- `styles.css` — premium visual design and responsive layout.
- `script.js` — mobile navigation toggle and prototype booking form handler.
- `server.js` — tiny dependency-free preview server for browser access.
