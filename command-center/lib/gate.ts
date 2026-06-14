// Soft client-side password gate for the static (GitHub Pages) build.
//
// IMPORTANT: this is a DETERRENT, not real security. On a static site the password
// and content live in the client bundle, so a technical visitor can bypass it.
// For real protection, deploy to Vercel with Clerk sign-in (already wired in the
// code) or put the site behind a host with real access control (Vercel/Netlify
// password protection, Cloudflare Access).
export const SITE_PASSWORD = "wealth2026";
