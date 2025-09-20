"use client";

import { useEffect, useState } from "react";

interface UserInfo {
    id: string;
    name: string;
    office: string;
    account: string;
}

const MePage = () => {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth");
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || "取得使用者資訊失敗");
                }
                const data = await res.json();
                setUserInfo(data.user_info);
            } catch (err: unknown) {
                const e = err as Error;
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    if (loading) return <p className="p-4">載入中...</p>;
    if (error) return <p className="p-4 text-red-500">錯誤: {error}</p>;

    return (
        <div className="py-2 max-w-md mx-auto text-neutral-100">
            <h1 className="text-2xl font-bold mb-4">我的資訊</h1>
            {userInfo && (
                <div className="space-y-2">
                    <p><strong>姓名:</strong> {userInfo.name}</p>
                    <p><strong>帳號:</strong> {userInfo.account}</p>
                    <p><strong>科系:</strong> {userInfo.office}</p>
                    <p><strong>ID:</strong> {userInfo.id}</p>
                </div>
            )}
        </div>
    );
};

export default MePage;
