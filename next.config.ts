import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false, // do not generate AGENTS.md
};

export default nextConfig;
