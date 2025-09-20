"use client"

import { useState, useEffect } from "react";
import Button from "./_components/button";
import { v4 } from "uuid";
import Link from "next/link";

/**
 * 定義班級資料的介面
 */
interface ClassData {
    teacher_id: string;
    subject: string;
    class_name: string;
    id: string;
}

/**
 * 顯示班級列表的元件
 */
const ClassList: React.FC<{ classes: ClassData[] }> = ({ classes }) => {
    return (
        <div className="flex w-full flex-col gap-5">
            {classes.map((classItem) => (
                <div key={classItem.id} className="w-full bg-neutral-800 rounded-lg p-6 shadow-md border border-neutral-700 hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between">
                    <div>
                        <div className="flex gap-3">
                            <h2 className="text-xl font-semibold text-neutral-50 ">{classItem.subject}</h2>
                            <h2 className="text-lg font-semibold text-neutral-50 mb-2">{classItem.class_name}</h2>
                        </div>
                        <p className="text-neutral-400 text-sm">ID: {classItem.id}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button href={`/dashboard/class/${classItem.id}`}>
                            進入課程
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const DashBoard = () => {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/get_my_classes");

                if (response.ok) {
                    const data: ClassData[] = await response.json();
                    setClasses(data);
                } else {
                    const errorData = await response.json();
                    setError(errorData.detail || "無法載入班級資料");
                }
            } catch (err) {
                setError("無法連線到伺服器。");
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

    return (
        <div className="flex flex-col items-center p-4 min-h-screen">
            <div className="w-full max-w-4xl">
                {/* 標題與建立班級按鈕 */}
                <div className="w-full flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-neutral-50">我的班級</h1>
                    <Button href="/dashboard/create_class">+ 建立班級</Button>
                </div>

                {/* 班級列表內容 */}
                <div className="w-full">
                    {loading && (
                        <div className="flex justify-center items-center py-10">
                            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="ml-4 text-neutral-400">載入中...</p>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-center">{error}</p>}

                    {!loading && !error && classes.length === 0 && (
                        <p className="text-neutral-400 text-center">尚無班級</p>
                    )}

                    {!loading && !error && classes.length > 0 && (
                        <ClassList classes={classes} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashBoard;
