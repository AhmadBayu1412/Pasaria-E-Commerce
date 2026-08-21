import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone untuk optimized production build di Render
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Supabase Storage public bucket
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Backend API domain (untuk gambar yang diserve dari backend)
      {
        protocol: 'https',
        hostname: '*.onrender.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Tambahkan NEXT_PUBLIC_API_URL ke turbopack root supresion
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
