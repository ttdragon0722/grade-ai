"use client";

import { useParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

/**
 * @typedef {Object} CorrectAnswer
 * @property {string} question_number - 題號，從1開始。
 * @property {string} answer - 正確答案，'a' | 'b' | 'c' | 'd'。
 */
interface CorrectAnswer {
    question_number: string;
    answer: string;
}

/**
 * @typedef {Object} ClassData
 * @property {string} teacher_id - 老師的唯一識別碼。
 * @property {string} subject - 課程科目。
 * @property {string} class_name - 課程名稱。
 * @property {string} id - 課程的唯一識別碼 (UUID)。
 */
interface ClassData {
    teacher_id: string;
    subject: string;
    class_name: string;
    id: string;
}

const AddTestPage = () => {
    // 從 URL 取得 class_id
    const pathname = usePathname();
    const classId = pathname ? pathname.split('/')[pathname.split('/').length - 2] : null;

    const [classData, setClassData] = useState<ClassData | null>(null);
    const [classLoading, setClassLoading] = useState<boolean>(true);
    const [classError, setClassError] = useState<string | null>(null);

    const [examName, setExamName] = useState<string>('');
    const [totalPages, setTotalPages] = useState<string>('');
    const [correctAnswers, setCorrectAnswers] = useState<CorrectAnswer[]>([{ question_number: '1', answer: 'a' }]);
    const [formLoading, setFormLoading] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 處理正確答案的選取
    const handleAnswerChange = (questionNumber: string, value: string) => {
        setCorrectAnswers(correctAnswers.map(ans =>
            ans.question_number === questionNumber ? { ...ans, answer: value } : ans
        ));
    };

    // 處理新增題目
    const handleAddQuestion = () => {
        const nextNumber = correctAnswers.length > 0
            ? (parseInt(correctAnswers[correctAnswers.length - 1].question_number) + 1).toString()
            : '1';
        setCorrectAnswers([...correctAnswers, { question_number: nextNumber, answer: 'a' }]);
    };

    // 處理刪除題目
    const handleDeleteQuestion = (questionNumber: string) => {
        if (correctAnswers.length > 1) {
            setCorrectAnswers(correctAnswers.filter(ans => ans.question_number !== questionNumber));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);
        setSuccessMessage(null);

        if (!classId) {
            setFormError("無法取得班級 ID。");
            setFormLoading(false);
            return;
        }

        try {
            // 將動態答案列表轉換為所需的 JSON 格式
            const formattedAnswers: { [key: string]: string } = {};
            correctAnswers.forEach(ans => {
                formattedAnswers[ans.question_number] = ans.answer;
            });

            const newTestPayload = {
                // id 和 teacher_id 將由後端處理
                class_id: classId,
                exam_name: examName,
                total_pages: parseInt(totalPages),
                correct_answer: formattedAnswers,
            };

            // 模擬提交到後端 API
            const response = await fetch('/api/add_test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTestPayload),
            });

            if (response.ok) {
                setSuccessMessage("測驗新增成功！");
                // 重置表單
                setExamName('');
                setTotalPages('');
                setCorrectAnswers([{ question_number: '1', answer: 'a' }]);
            } else {
                const errorData = await response.json();
                if (errorData.detail && Array.isArray(errorData.detail)) {
                    // 處理 FastAPI 返回的驗證錯誤
                    const errorMessages = errorData.detail.map((err: any) => err.msg).join('; ');
                    setFormError(`新增測驗失敗: ${errorMessages}`);
                } else {
                    setFormError(errorData.detail || "新增測驗失敗。");
                }
            }
        } catch (err) {
            setFormError("無法連線到伺服器。");
        } finally {
            setFormLoading(false);
        }
    };

    // 使用 useEffect 呼叫 API 以獲取課程詳細資料
    useEffect(() => {
        const fetchClassData = async () => {
            if (!classId) {
                setClassLoading(false);
                setClassError("無法從 URL 取得班級 ID。");
                return;
            }

            try {
                const response = await fetch(`/api/get_class?id=${classId}`);
                if (response.ok) {
                    const data: ClassData = await response.json();
                    setClassData(data);
                } else {
                    const errorData = await response.json();
                    setClassError(errorData.detail || "無法載入班級資料。");
                }
            } catch (err) {
                setClassError("無法連線到伺服器。");
            } finally {
                setClassLoading(false);
            }
        };

        fetchClassData();
    }, [classId]);


    return (
        <div className="flex flex-col items-center p-4 min-h-screen">
            <div className="w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-neutral-50 mb-2">新增測驗</h1>
                
                {/* 顯示課程資訊 */}
                {classLoading ? (
                    <p className="text-neutral-400 mb-4">載入課程資訊...</p>
                ) : classError ? (
                    <p className="text-red-500 mb-4">{classError}</p>
                ) : (
                    <p className="text-neutral-400 mb-4">
                        為 <span className="font-semibold text-blue-400">{classData?.class_name}-{classData?.subject}</span> 課程新增測驗。
                    </p>
                )}

                <div className="bg-neutral-800 rounded-lg p-4 shadow-md border border-neutral-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 測驗名稱 */}
                        <div>
                            <label htmlFor="examName" className="block text-sm font-medium text-neutral-300 mb-1">
                                測驗名稱
                            </label>
                            <input
                                id="examName"
                                type="text"
                                value={examName}
                                onChange={(e) => setExamName(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-neutral-700 text-neutral-50 rounded-md border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* 總頁數 */}
                        <div>
                            <label htmlFor="totalPages" className="block text-sm font-medium text-neutral-300 mb-1">
                                總頁數
                            </label>
                            <input
                                id="totalPages"
                                type="number"
                                value={totalPages}
                                onChange={(e) => setTotalPages(e.target.value)}
                                min="1"
                                required
                                className="w-full px-3 py-2 bg-neutral-700 text-neutral-50 rounded-md border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* 正確答案動態表單 */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-neutral-300">
                                    正確答案
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddQuestion}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                                >
                                    + 新增題目
                                </button>
                            </div>
                            <div className="space-y-4">
                                {correctAnswers.map((ans) => (
                                    <div key={ans.question_number} className="flex items-center space-x-4 bg-neutral-700 p-4 rounded-md">
                                        <p className="text-neutral-300 font-semibold">{ans.question_number}.</p>
                                        <div className="flex-1">
                                            <select
                                                value={ans.answer}
                                                onChange={(e) => handleAnswerChange(ans.question_number, e.target.value)}
                                                className="w-full px-3 py-2 bg-neutral-800 text-neutral-50 rounded-md border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="a">a</option>
                                                <option value="b">b</option>
                                                <option value="c">c</option>
                                                <option value="d">d</option>
                                            </select>
                                        </div>
                                        {correctAnswers.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteQuestion(ans.question_number)}
                                                className="p-1 rounded-full text-red-400 hover:bg-red-900 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {formError && <p className="text-red-500 text-center">{formError}</p>}
                        {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}

                        <button
                            type="submit"
                            disabled={formLoading}
                            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
                        >
                            {formLoading ? "提交中..." : "新增測驗"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddTestPage;
