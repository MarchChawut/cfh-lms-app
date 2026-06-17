import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";

// App-wide Content-Security-Policy. No nonce (keeps pages statically renderable);
// the app has no HTML/script-injection sink (content is rendered via iframes only),
// so the high-value directives here are frame-ancestors (clickjacking), frame-src
// (only Canva + StackBlitz may be embedded), object-src/base-uri/form-action.
const csp = [
  "default-src 'self'",
  // Next.js injects inline bootstrap; React needs eval only in dev (error overlay).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Slides (Canva) + labs (StackBlitz) are embedded as iframes.
  "frame-src https://canva.com https://*.canva.com https://stackblitz.com https://*.stackblitz.com https://*.staticblitz.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  turbopack: {
    // Fix: a package-lock.json at ~/package-lock.json causes Turbopack to set
    // the workspace root to $HOME instead of this project, breaking the React
    // Client Manifest (global-error, etc.). Pin it explicitly.
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lms.code-n-fun-house.top' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
    // placehold.co serves SVG. Allow it, but neutralize the XSS risk via CSP +
    // sandbox + attachment so any embedded script can't execute through the optimizer.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: { bodySizeLimit: '30mb' },
  },
  async redirects() {
    // The public course listing now lives only in /admin. Send the old
    // /courses URL to the catalog section on the home page (exact match — the
    // /courses/[slug] detail + lesson-player routes are untouched).
    return [{ source: '/courses', destination: '/#courses', permanent: false }]
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
};

export default nextConfig;
