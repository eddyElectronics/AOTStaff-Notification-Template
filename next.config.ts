import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Allow base64 data URLs for profile pictures
  },
};

export default nextConfig;
