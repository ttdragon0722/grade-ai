"use client";
import NeuralNetworkBackground from "@/components/NeuralNetworkBackground";
import { useState } from "react";

const LoginPage = () => {
    const [number, setNumber] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // 阻止表單預設提交
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ "account": number, password }),
            });

            if (!res.ok) {
                throw new Error("登入失敗，請檢查帳號或密碼");
            }

            const data = await res.json();
            console.log("登入成功:", data);

            if (res.ok) {
                // 登入成功
                console.log("登入成功:", data);
                // 處理成功後的邏輯，例如導向到主頁面
                window.location.href = "/dashboard";
            } else {
                // 登入失敗，後端會回傳錯誤訊息
                console.error("登入失敗:", data.detail);
                // 顯示錯誤訊息給使用者
                alert(`登入失敗: ${data.detail}`);
            }

        } catch (err) {
            const error = err as Error;

            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <NeuralNetworkBackground />
            <div className="flex h-full w-full justify-center items-center relative">
                <div className="w-full max-w-[400px] min-w-[280px] py-20">
                    {/* 標題區塊 */}
                    <div className="mb-8 text-center">
                        <h1 className="mb-2 text-2xl font-bold text-neutral-50">教授登入</h1>
                        <p className="text-neutral-400">自動化批改系統 Grade AI</p>
                    </div>

                    {/* 登入表單 */}
                    <div className="rounded-2xl bg-neutral-800 p-4 shadow-lg shadow-neutral-900/25">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                            <div className="flex flex-col">
                                <label
                                    htmlFor="number"
                                    className="flex items-center gap-2 mb-1.5 text-sm font-semibold text-neutral-200"
                                >
                                    帳號 <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    id="number"
                                    name="number"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="請輸入您的帳號"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    className="w-full h-10 px-3 py-2.5 rounded-md border bg-neutral-800 text-neutral-50 placeholder:text-neutral-400 text-sm font-medium shadow-sm outline-none 
                                border-neutral-700 hover:border-primary-400 focus:border-primary-400 focus:ring-primary-400/10 
                                hover:shadow-md focus:shadow-lg focus:ring-4"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label
                                    htmlFor="password"
                                    className="flex items-center gap-2 mb-1.5 text-sm font-semibold text-neutral-200"
                                >
                                    密碼 <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="請輸入您的密碼"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-10 px-3 py-2.5 rounded-md border bg-neutral-800 text-neutral-50 placeholder:text-neutral-400 text-sm font-medium shadow-sm outline-none 
                                border-neutral-700 hover:border-primary-400 focus:border-primary-400 focus:ring-primary-400/10 
                                hover:shadow-md focus:shadow-lg focus:ring-4"
                                />
                            </div>

                            {/* 登入按鈕 */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center w-full h-10 px-6 text-sm font-medium rounded-md shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer 
                            disabled:pointer-events-none disabled:opacity-50"
                            >
                                {loading ? "登入中..." : "登入"}
                            </button>

                            {/* 錯誤訊息 */}
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
