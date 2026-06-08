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
};

export default nextConfig;