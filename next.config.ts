import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    localPatterns: [
      {
        pathname: "/auth/captcha/**",
      },
      {
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
