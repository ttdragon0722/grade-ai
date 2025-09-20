import React, { useState, useEffect } from 'react';
import Button from '../../../_components/button';

// 定義測驗資料的介面
interface ExamData {
    id: string;
    class_id: string;
    exam_name: string;
    total_pages: number;
    correct_answer: { [key: string]: string };
}

/**
 * 獨立的測驗儀表板元件
 * 負責獲取並顯示特定班級的所有測驗
 */
const ExamDashboard = ({ classId }: { classId: string }) => {
    const [exams, setExams] = useState<ExamData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchExams = async () => {
            if (!classId) {
                setError("無法取得班級 ID。");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`/api/get_exams/${classId}`);

                if (response.ok) {
                    const data = await response.json();
                    setExams(data);
                } else {
                    const errorData = await response.json();
                    setError(errorData.detail || "無法載入測驗資料");
                }
            } catch (err) {
                setError("無法連線到伺服器。");
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, [classId]);

    return (
        <div className="flex flex-col items-center">

            {loading && <p className="text-neutral-400">載入中...</p>}
            {error && <p className="text-red-500">錯誤：{error}</p>}
            {!loading && !error && (
                <div className="flex w-full flex-col gap-5">
                    {exams.length > 0 ? (
                        exams.map((exam) => (
                            <div
                                key={exam.id}
                                className="w-full bg-neutral-800 rounded-lg p-6 shadow-md border border-neutral-700 hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between"
                            >
                                <div>
                                    <h2 className="text-xl font-semibold text-neutral-50">{exam.exam_name}</h2>
                                    <p className="text-neutral-400 text-sm mt-1">總頁數: {exam.total_pages}</p>
                                    <p className="text-neutral-400 text-sm mt-1">ID: {exam.id}</p>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button
                                        href={`/dashboard/exam/${exam.id}`}
                                    >
                                        進入測驗
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="w-full text-center text-neutral-400 mt-10">
                            目前沒有測驗。
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExamDashboard;
