/** @type {import('next').NextConfig} */
const nextConfig = {
  // The catalog JSON is read at runtime in the Node serverless functions.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
