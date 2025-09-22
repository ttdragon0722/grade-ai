"use client"
import React, { useState } from "react";
import PrevButton from "../_components/prevButton";

interface FormData {
    subject: string;
    class_name: string;
}

const CreatePanelForm: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        subject: "",
        class_name: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/create_class", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "建立失敗");
            }

            const createdClass = await res.json();
            console.log("建立成功:", createdClass);
            if (res.ok) {

                window.location.href = "/dashboard";
            } else {
                // 登入失敗，後端會回傳錯誤訊息
                console.error("創建失敗:", createdClass.detail);
                // 顯示錯誤訊息給使用者
                alert(`創建失敗: ${createdClass.detail}`);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className='flex gap-5 items-center mb-3'>
                <PrevButton />
                <h2 className="mt-5 text-lg font-bold text-neutral-50 mb-4">建立班級</h2>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {/* 科目 */}
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-neutral-200 mb-1">
                        科目
                    </label>
                    <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="請輸入科目"
                        className="w-full h-10 px-3 rounded-md bg-neutral-700 text-neutral-50 placeholder:text-neutral-400 border border-neutral-600 focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                        required
                    />
                </div>

                {/* 班級 */}
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-neutral-200 mb-1">
                        班級
                    </label>
                    <input
                        type="text"
                        name="class_name"
                        value={formData.class_name}
                        onChange={handleChange}
                        placeholder="請輸入班級名稱"
                        className="w-full h-10 px-3 rounded-md bg-neutral-700 text-neutral-50 placeholder:text-neutral-400 border border-neutral-600 focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                        required
                    />
                </div>

                {/* 錯誤訊息 */}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                {/* 送出按鈕 */}
                <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 h-10 w-full bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors disabled:pointer-events-none disabled:opacity-50"
                >
                    {loading ? "建立中..." : "建立班級"}
                </button>
            </form>
        </>
    );
};

export default CreatePanelForm;
