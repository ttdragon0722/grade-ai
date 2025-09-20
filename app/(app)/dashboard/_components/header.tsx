"use client";

import { useRouter } from "next/navigation";

const Header = () => {
    const router = useRouter();

    return (
        <header className="border-border flex h-16 items-center gap-4 border-b bg-white px-4 dark:bg-neutral-800">
            {/* 左側區塊 */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dashboard")}>
                {/* 標題 */}
                <nav className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="font-black text-neutral-900 dark:text-neutral-50">
                        Grade AI
                    </span>
                </nav>
            </div>

            {/* 右側區塊 */}
            <div className="ml-auto flex items-center gap-3">
                <button
                    type="button"
                    className="inline-flex font-black items-center justify-center rounded-full h-8 w-fit px-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md"
                    onClick={() => router.push("/dashboard/me")}
                >
                    用戶選單
                    <span className="sr-only">用戶選單</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
