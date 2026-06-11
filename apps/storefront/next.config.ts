import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(path.resolve(__dirname, "../.."));
const nextConfig: NextConfig = {
      turbopack: {
            root: path.resolve(__dirname),
      } /* config options here */,
};

export default nextConfig;
