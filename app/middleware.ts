// middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 定義受保護的路由和公開的路由
const PROTECTED_ROUTES = ["/dashboard"];
const PUBLIC_ROUTES = ["/login"];

export async function middleware(request: NextRequest) {
	const path = request.nextUrl.pathname;

	// 檢查是否為受保護的路由
	const isProtectedRoute = PROTECTED_ROUTES.includes(path);
	// 檢查是否為公開的登入路由
	const isPublicRoute = PUBLIC_ROUTES.includes(path);

	// 1. 新增的邏輯：如果路徑是根目錄，直接導向到 /dashboard
	if (path === "/") {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// 2. 呼叫後端 API 進行認證，手動傳遞 Cookie
	const authResponse = await fetch(`/api/auth`, {
		method: "GET",
		headers: {
			Cookie: request.headers.get("Cookie") || "",
		},
	});

	const isAuthenticated = authResponse.ok;

	// 3. 處理不同的路由情況
	if (isPublicRoute && isAuthenticated) {
		// 情況 A: 已登入的使用者嘗試訪問登入頁面，導向到主頁面 (Dashboard)
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	if (isProtectedRoute && !isAuthenticated) {
		// 情況 B: 未登入的使用者嘗試訪問受保護的頁面，導向到登入頁面
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// 4. 處理其他情況，允許繼續訪問
	// 例如，未登入者訪問登入頁面，或已登入者訪問受保護頁面
	return NextResponse.next();
}

// 可選：使用 matcher 優化 middleware 執行範圍
export const config = {
	matcher: ["/", "/dashboard/:path*", "/login"],
};
