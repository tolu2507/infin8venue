import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.devtunnels.ms"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // For your Supabase storage URLs
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // For testing with Unsplash
      },
      {
        protocol: "https",
        hostname: "your-project-id.supabase.co", // Optional: more specific
      },
      {
        protocol: "https",
        hostname: "**", // Allows all HTTPS hosts (safe for dev/testing)
      },
      // Or more specific:
      // {
      //   protocol: 'https',
      //   hostname: 'www.stephiecooks.com',
      // },
    ],
  },
};


export default nextConfig;
