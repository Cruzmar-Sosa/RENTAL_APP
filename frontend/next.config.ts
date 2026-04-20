import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '4df2-2803-2d60-110e-18a-b9c5-f4b6-669e-ef0c.ngrok-free.app', //http://localhost:3001  
    '.ngrok-free.app'
  ],
};

export default nextConfig;