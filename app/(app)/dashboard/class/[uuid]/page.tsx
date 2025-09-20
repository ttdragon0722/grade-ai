'use client';

import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import ExamDashboard from './_components/examList';
import Button from '../../_components/button';

/**
 * 定義班級資料的介面
 */
interface ClassData {
    teacher_id: string;
    subject: string;
    class_name: string;
    id: string;
}

const ClassClientPage = () => {
    // 在 Client Component 中，使用 useParams() hook
    const params = useParams();
    const uuid = params.uuid;


    const [classData, setClassData] = useState<ClassData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClassData = async () => {
            if (!uuid) {
                setLoading(false);
                setError("無法從 URL 取得班級 ID。");
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`/api/get_class?id=${uuid}`);

                if (response.ok) {
                    const data: ClassData = await response.json();
                    setClassData(data);
                } else {
                    const errorData = await response.json();
                    setError(errorData.detail || "無法載入班級資料。");
                }
            } catch (err) {
                setError("無法連線到伺服器。");
            } finally {
                setLoading(false);
            }
        };

        fetchClassData();
    }, [uuid]); // 當 uuid 改變時重新執行

    return (
        <div className="flex flex-col items-center p-3 min-h-screen text-white">
            <div className="w-full max-w-4xl">

                {/* 顯示載入狀態 */}
                {loading && (
                    <div className="flex justify-center items-center py-10">
                        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="ml-4 text-neutral-400">載入中...</p>
                    </div>
                )}

                {/* 顯示錯誤訊息 */}
                {error && <p className="text-red-500 text-center">{error}</p>}

                {/* 顯示課程資訊 */}
                {!loading && !error && classData && (
                    <>
                        <div>
                            <p className="text-sm font-medium text-neutral-400">課程名稱</p>
                            <h1 className="text-3xl font-bold text-neutral-50 mb-6"> {classData.subject} {classData.class_name}</h1>
                        </div>
                        <div className='flex gap-3 justify-end'>
                            <Button href={`/dashboard/class/${uuid}/add_test`}>新增考試</Button>
                            <Button href={`/dashboard/class/${uuid}/add_member`}>班級列表</Button>
                        </div>
                        <br />
                        <ExamDashboard classId={uuid as string} />
                    </>
                )}
            </div>
        </div>
    );
};

export default ClassClientPage;