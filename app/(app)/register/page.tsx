"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const RegisterPage = () => {
    const router = useRouter();
    const [name, setName] = useState<string>("");
    const [account, setAccount] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [office, setOffice] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, account, password, office }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "註冊失敗，請稍後再試。");
            }

            // 成功後導向登入頁
            router.push("/login");

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(String(err));
            }
        } finally {
            setLoading(false);
        }
    };

    return <div className="flex h-full w-full justify-center items-center">
            <div className="w-full max-w-[400px] min-w-[280px] py-20">
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-2xl font-bold text-neutral-50">教授註冊</h1>
                    <p className="text-neutral-400">自動化批改系統 Grade AI</p>
                </div>

                <div className="rounded-2xl bg-neutral-800 p-4 shadow-lg shadow-neutral-900/25">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {/* 姓名 */}
                        <div className="flex flex-col">
                            <label htmlFor="name" className="flex items-center gap-2 mb-1.5 text-sm font-semibold text-neutral-200">
                                姓名 <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="請輸入您的姓名"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-10 px-3 py-2.5 rounded-md border bg-neutral-800 text-neutral-50 placeholder:text-neutral-400 text-sm font-medium shadow-sm outline-none border-neutral-700 hover:border-primary-400 focus:border-primary-400 focus:ring-primary-400/10 hover:shadow-md focus:shadow-lg focus:ring-4"
                                required
                            />
                        </div>

                        {/* 帳號 */}
                        <div className="flex flex-col">
                            <label htmlFor="account" className="flex items-center gap-2 mb-1.5 text-sm font-semibold text-neutral-200">
                                帳號 <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                id="account"
                                name="account"
                                type="text"
                                autoComplete="username"
                                placeholder="請輸入您的帳號"
                                value={account}
                                onChange={(e) => setAccount(e.target.value)}
                                className="w-full h-10 px-3 py-2.5 rounded-md border bg-neutral-800 text-neutral-50 placeholder:text-neutral-400 text-sm font-medium shadow-sm outline-none border-neutral-700 hover:border-primary-400 focus:border-primary-400 focus:ring-primary-400/10 hover:shadow-md focus:shadow-lg focus:ring-4"
                                required
                            />
                        </div>

                        {/* 密碼 */}
                        <div className="flex flex-col">
                            <label htmlFor="password" className="flex items-center gap-2 mb-1.5 text-sm font-semibold text-neutral-200">
                                密碼 <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="請輸入您的密碼"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-10 px-3 py-2.5 rounded-md border bg-neutral-800 text-neutral-50 placeholder:text-neutral-400 text-sm font-medium shadow-sm outline-none border-neutral-700 hover:border-primary-400 focus:border-primary-400 focus:ring-primary-400/10 hover:shadow-md focus:shadow-lg focus:ring-4"
                                required
                            />
                        </div>

                        {/* 科系 */}
                        <div className="flex flex-col">
                            <label htmlFor="office" className="flex items-center gap-2 mb-1.5 text-sm font-semibold text-neutral-200">
                                科系
                            </label>
                            <input
                                id="office"
                                name="office"
                                type="text"
                                placeholder="請輸入您的科系 (選填)"
                                value={office}
                                onChange={(e) => setOffice(e.target.value)}
                                className="w-full h-10 px-3 py-2.5 rounded-md border bg-neutral-800 text-neutral-50 placeholder:text-neutral-400 text-sm font-medium shadow-sm outline-none border-neutral-700 hover:border-primary-400 focus:border-primary-400 focus:ring-primary-400/10 hover:shadow-md focus:shadow-lg focus:ring-4"
                            />
                        </div>

                        {/* 按鈕 */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center w-full h-10 px-6 text-sm font-medium rounded-md shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                        >
                            {loading ? "註冊中..." : "註冊"}
                        </button>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    </form>
                </div>
            </div>
        </div>
};

export default RegisterPage;