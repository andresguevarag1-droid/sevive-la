import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garantiza que las fuentes/logo de la og:image viajen en el bundle serverless.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./app/og/*.ttf", "./public/logo.svg"],
    "/mi-cupon/[code]/imagen": ["./app/og/*.ttf", "./public/logo.svg"],
  },
};

export default nextConfig;
