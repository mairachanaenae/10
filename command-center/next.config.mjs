/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // EXPORT=1 produces a static `out/` (for Netlify Drop / GitHub Pages). Server
  // features (Clerk middleware, live AI routes) require a normal build on Vercel.
  ...(process.env.EXPORT === "1"
    ? {
        output: "export",
        images: { unoptimized: true },
        // route/index.html so GitHub Pages serves /dashboard/ correctly.
        trailingSlash: true,
        // For GitHub Pages project sites served at /<repo>/ (e.g. /10).
        ...(process.env.BASE_PATH ? { basePath: process.env.BASE_PATH } : {}),
        // Clerk registers server actions (unsupported in static export). Stub it out
        // for the export build — demo mode never calls it anyway.
        webpack: (config) => {
          config.resolve.alias = {
            ...(config.resolve.alias || {}),
            "@clerk/nextjs": false,
            "@clerk/nextjs/server": false,
          };
          return config;
        },
      }
    : {}),
};

export default nextConfig;
