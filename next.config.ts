import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
		return [
			{
				source: "/api/:path*",
				destination:"http://127.0.0.1:8000/:path*"
			},
			{
				source: "/data/:path*",
				destination:"http://127.0.0.1:8000/data/:path*"
			},
			{
				source: "/photo/:path*",
				destination:"http://127.0.0.1:8000/photo/:path*"
			},
			{
				source: "/docs",
				destination:
					process.env.NODE_ENV === "development"
						? "http://127.0.0.1:8000/docs"
						: "http://127.0.0.1:3000",
			},
			{
				source: "/openapi.json",
				destination:
					process.env.NODE_ENV === "development"
						? "http://127.0.0.1:8000/openapi.json"
						: "http://127.0.0.1:3000",
			},
		];
	},
};

export default nextConfig;
