const tracedData = [
  "./data/**/*",
  "./prisma/fixtures/**/*",
  "./prisma/schema.prisma",
  "./prisma/.vercel-seed.sqlite",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
    outputFileTracingIncludes: {
      "/*": tracedData,
      "/api/*": tracedData,
      "/api/**/*": tracedData,
      "/games-content/*": tracedData,
      "/games-content/**/*": tracedData,
      "/uploads/*": tracedData,
      "/uploads/**/*": tracedData,
      "/admin/*": tracedData,
      "/admin/**/*": tracedData,
      "/games/*": tracedData,
      "/games/**/*": tracedData,
    },
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", pathname: "/uploads/**" },
      { protocol: "https", hostname: "localhost", pathname: "/uploads/**" },
      { protocol: "https", hostname: "*.vercel.app", pathname: "/uploads/**" },
    ],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
