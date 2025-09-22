"use client";

import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import PrevButton from '../../../_components/prevButton';

/**
 * @interface
 * 定義學生的資料結構
 */
interface Student {
    student_id: string;
    name: string;
    class: string;
}

const AddStudentPage: React.FC = () => {
    // 取得 URL 中的班級 ID
    const pathname = usePathname();
    const classId = pathname ? pathname.split('/')[pathname.split('/').length - 2] : null;


    // 狀態管理
    const [existingStudents, setExistingStudents] = useState<Student[]>([]);
    const [studentsToAdd, setStudentsToAdd] = useState<Student[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState<boolean>(true);

    // 從 API 獲取現有學生列表
    useEffect(() => {
        const fetchExistingStudents = async () => {
            if (!classId) {
                setIsFetching(false);
                return;
            }

            try {
                const response = await fetch(`/api/get_students/${classId}`);
                if (!response.ok) {
                    throw new Error("無法載入現有學生名單。");
                }

                const data = await response.json();
                if (response.ok) {
                    setExistingStudents(data); // 直接使用回傳的陣列來更新狀態
                } else {
                    setUploadError("無法獲取現有學生名單。");
                }
                setExistingStudents(data || []);
            } catch (err) {
                setFetchError("無法載入現有學生名單。");
                console.error("Fetch error:", err);
            } finally {
                setIsFetching(false);
            }
        };

        fetchExistingStudents();
    }, [classId]);

    /**
     * @function
     * 處理新增輸入欄位的變更
     * @param {number} index - 正在變更的學生在列表中的索引
     * @param {string} name - 變更的欄位名稱 (e.g., 'student_id', 'name')
     * @param {string} value - 欄位的新值
     */
    const handleInputChange = (index: number, name: string, value: string) => {
        const updatedStudents = studentsToAdd.map((student, i) =>
            i === index ? { ...student, [name]: value } : student
        );
        setStudentsToAdd(updatedStudents);
    };

    /**
     * @function
     * 將一個新的空學生加入列表，以新增一個輸入欄位
     */
    const handleAddStudentRow = () => {
        setStudentsToAdd(prevStudents => [...prevStudents, { student_id: '', name: '', class: '' }]);
    };

    /**
     * @function
     * 從列表中移除指定的學生
     * @param {number} index - 要移除的學生在列表中的索引
     */
    const handleRemoveStudent = (index: number) => {
        setStudentsToAdd(prevStudents => prevStudents.filter((_, i) => i !== index));
    };

    /**
     * @function
     * 批量上傳同學資料到 API
     */
    const handleUpload = async () => {
        setLoading(true);
        setUploadError(null);
        setUploadSuccess(null);

        // 檢查是否有空欄位
        const hasEmptyFields = studentsToAdd.some(student =>
            !student.student_id || !student.name || !student.class
        );
        if (hasEmptyFields) {
            setUploadError("請填寫所有新增學生的所有欄位。");
            setLoading(false);
            return;
        }

        const payload = {
            class_id: classId,
            members: studentsToAdd.map(student => ({
                student_id: student.student_id,
                name: student.name,
                class: student.class
            }))
        };

        try {
            const response = await fetch("/api/add_students", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setUploadSuccess("所有同學已成功新增！");
                setStudentsToAdd([]); // 上傳成功後清空列表
            } else {
                const errorData = await response.json();
                setUploadError(errorData.detail || "無法上傳同學資料。");
            }
        } catch (err) {
            setUploadError("無法連線到伺服器。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className='flex gap-5 items-center mb-3'>
                <PrevButton />
                <h1 className="text-3xl font-bold mb-6 text-neutral-50">新增同學到班級</h1>
            </div>


            <div className="bg-neutral-800 rounded-lg p-6 shadow-md border border-neutral-700 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-neutral-50">目前班級同學</h2>
                {isFetching ? (
                    <p className="text-neutral-400">正在載入學生名單...</p>
                ) : fetchError ? (
                    <p className="text-red-400 self-center">{fetchError}</p>
                ) : existingStudents.length === 0 ? (
                    <p className="text-neutral-400">目前班級中沒有任何同學。</p>
                ) : (
                    <ul className="space-y-3">
                        {existingStudents.map((student, index) => (
                            <li key={index} className="bg-neutral-700 rounded-lg p-3 text-neutral-50">
                                <div>
                                    <span className="font-semibold">{student.name}</span> - {student.student_id} ({student.class})
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={handleAddStudentRow}
                    className="flex-grow bg-blue-600 text-white rounded-md p-2 font-bold hover:bg-blue-700 transition-colors"
                >
                    新增同學
                </button>
            </div>

            <div className="bg-neutral-800 rounded-lg p-6 shadow-md border border-neutral-700">
                <h2 className="text-xl font-semibold mb-4 text-neutral-50">新增同學</h2>
                {studentsToAdd.length === 0 ? (
                    <p className="text-neutral-400">請按上方的「新增同學」按鈕來新增欄位。</p>
                ) : (
                    <ul className="space-y-3">
                        {studentsToAdd.map((student, index) => (
                            <li key={index} className="bg-neutral-700 rounded-lg p-3 text-neutral-50 flex flex-col md:flex-row justify-between items-center gap-2">
                                <div className="flex-grow w-full md:w-auto flex flex-col md:flex-row gap-2">
                                    <input
                                        type="text"
                                        name="student_id"
                                        placeholder="學號"
                                        value={student.student_id}
                                        onChange={(e) => handleInputChange(index, 'student_id', e.target.value)}
                                        className="flex-1 bg-neutral-600 text-neutral-50 rounded-md p-2 placeholder-neutral-400 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="姓名"
                                        value={student.name}
                                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                                        className="flex-1 bg-neutral-600 text-neutral-50 rounded-md p-2 placeholder-neutral-400 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        name="class"
                                        placeholder="班級"
                                        value={student.class}
                                        onChange={(e) => handleInputChange(index, 'class', e.target.value)}
                                        className="flex-1 bg-neutral-600 text-neutral-50 rounded-md p-2 placeholder-neutral-400 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={() => handleRemoveStudent(index)}
                                    className="p-2 text-red-400 hover:text-red-500 transition-colors"
                                    aria-label="移除此同學"
                                >
                                    &times;
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="mt-8 flex flex-col md:flex-row-reverse justify-end items-center gap-4">
                {uploadError && <p className="text-red-400 self-center">{uploadError}</p>}
                {uploadSuccess && <p className="text-green-400 self-center">{uploadSuccess}</p>}
                {loading && <p className="text-neutral-400 self-center">正在上傳...</p>}
                <button
                    onClick={handleUpload}
                    disabled={studentsToAdd.length === 0 || loading}
                    className={clsx(
                        "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors",
                        "bg-green-600 hover:bg-green-700",
                        {
                            "opacity-50 cursor-not-allowed": studentsToAdd.length === 0 || loading
                        }
                    )}
                >
                    批量上傳 ({studentsToAdd.length})
                </button>
            </div>
        </div>
    );
};

export default AddStudentPage;
