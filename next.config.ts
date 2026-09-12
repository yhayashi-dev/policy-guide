import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: false,
  env: { NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH || '' },
};
export default nextConfig;
