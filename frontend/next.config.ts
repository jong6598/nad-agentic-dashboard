import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "pino-pretty": false,
        encoding: false,
      };
    }
    if (isServer) {
      config.externals.push("@react-native-async-storage/async-storage");
    }
    return config;
  },
};

export default nextConfig;
