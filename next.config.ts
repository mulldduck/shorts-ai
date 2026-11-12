import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/cli",
    "@rspack/binding",
    "@rspack/binding-darwin-arm64",
    "@rspack/core",
    "esbuild",
  ],
  async rewrites() {
    return [
      {
        source: "/stage-plan",
        destination: "/stage-plan/index.html",
      },
    ];
  },
};

export default nextConfig;
