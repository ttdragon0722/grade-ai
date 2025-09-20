"use client";

import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useParams } from 'next/navigation';
import Button from '../../_components/button';

// 使用 window.location.pathname 來獲取路徑
const usePathname = () => {
    if (typeof window !== 'undefined') {
        return window.location.pathname;
    }
    return '';
};

/**
 * @interface
 * 定義從 API 獲取的測驗資料結構
 */
interface Exam {
    id: string;
    teacher_id: string;
    class_id: string;
    exam_name: string;
    total_pages: number;
    correct_answer: string;
}

/**
 * @interface
 * 定義從 API 獲取的學生資料結構
 */
interface Student {
    id: string;
    student_id: string;
    name: string;
    class_id: string;
    class: string;
    uploaded_pages_count: number
}

/**
 * @interface
 * 定義上傳資料結構，用於傳遞給彈出視窗
 */
interface UploadData {
    studentId: string;
    studentName: string;
    examId: string;
    classId: string;
    totalPages: number;
    examName: string;
}

/**
 * @component
 * 可重複使用的彈出視窗組件
 */
const UploadModal: React.FC<{ isOpen: boolean; onClose: () => void; data: UploadData | null }> = ({ isOpen, onClose, data }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

    // 建立 useRef 來分別控制相機和檔案選擇的 input
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen || !data) {
        return null;
    }


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFilesArray = Array.from(e.target.files);
        // 將新選擇的檔案附加到舊的檔案列表中
        setFiles(prevFiles => [...prevFiles, ...newFilesArray]);
        setUploadError(null); // 清除舊的錯誤
        setUploadSuccess(null); // 清除舊的成功訊息

        // 重置 input 的 value，以便下次選擇相同檔案時也能觸發 onChange
        e.target.value = '';
    };
    const handleUploadSubmit = async () => {
        if (files.length === 0) {
            setUploadError("請先選擇要上傳的檔案。");
            return;
        }

        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(null);

        const formData = new FormData();
        formData.append("exam_id", data.examId);
        formData.append("student_id", data.studentId);
        files.forEach(file => {
            formData.append("files", file);
        });

        try {
            const response = await fetch("/api/upload_exam_photos", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "上傳失敗。");
            }

            setUploadSuccess("上傳成功！頁面將自動重新整理...");
            setTimeout(() => {
                window.location.reload();
            }, 1000); // 延遲 1 秒後重新整理

        } catch (err: unknown) {
            const errorMessage = (err as Error).message;
            setUploadError(`上傳失敗：${errorMessage}`);
            console.error("上傳錯誤:", err);
        } finally {
            setIsUploading(false);
            setFiles([]);
        }
    };

    const isUploadButtonDisabled = files.length === 0 || isUploading;

    return (
        <div className="fixed inset-0 bg-neutral-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-800 rounded-lg p-6 shadow-xl border border-neutral-700 w-full max-w-xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">上傳測驗</h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200 transition-colors">&times;</button>
                </div>
                <p className="text-neutral-400 mb-4">
                    為學生 <span className="font-semibold text-neutral-200">{data.studentName}</span> 上傳測驗檔案。
                </p>
                <p className="text-neutral-400 mb-4">
                    測驗名稱：{data.examName}，總頁數：{data.totalPages}
                </p>

                {/* 檔案選擇區塊 */}
                <div className="border-2 border-dashed border-neutral-600 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                    {/* 相機 input */}
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        capture="environment"
                    />
                    {/* 檔案選擇 input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="flex space-x-4">
                        {/* 打開相機按鈕 */}
                        <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="cursor-pointer bg-blue-600 text-white font-bold rounded-md px-4 py-2 hover:bg-blue-700 transition-colors"
                        >
                            打開相機
                        </button>
                        {/* 選擇檔案按鈕 */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer bg-gray-600 text-white font-bold rounded-md px-4 py-2 hover:bg-gray-700 transition-colors"
                        >
                            選擇檔案
                        </button>
                    </div>
                    <p className="mt-2 text-sm text-neutral-400">支援多選圖片</p>
                </div>

                {/* 預覽圖片區塊 */}
                {files.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-lg font-semibold mb-2">預覽 ({files.length} 張)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {files.map((file, index) => (
                                <div key={index} className="relative w-full h-32 rounded-lg overflow-hidden border border-neutral-700">
                                    <img src={URL.createObjectURL(file)} alt={`預覽 ${index + 1}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {uploadError && <p className="mt-4 text-red-400 text-center">{uploadError}</p>}
                {uploadSuccess && <p className="mt-4 text-green-400 text-center">{uploadSuccess}</p>}

                {/* 上傳按鈕 */}
                <button
                    onClick={handleUploadSubmit}
                    disabled={isUploading || files.length === 0}
                    className={clsx(
                        "w-full mt-4 bg-green-600 text-white rounded-md p-2 text-sm font-medium transition-colors",
                        isUploading && "bg-green-700 cursor-not-allowed",
                        !isUploading && "hover:bg-green-700",
                        files.length === 0 && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {isUploading ? "上傳中..." : "確認上傳"}
                </button>
            </div>
        </div>
    );
};

const ExamPage: React.FC = () => {
    const params = useParams();
    const examId = params.uuid;

    const [exam, setExam] = useState<Exam | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [uploadData, setUploadData] = useState<UploadData | null>(null);

    useEffect(() => {
        const fetchExamAndStudents = async () => {
            if (!examId) {
                setError("測驗 ID 無效。");
                setLoading(false);
                return;
            }

            try {
                // 步驟 1: 獲取測驗資訊
                const examResponse = await fetch(`/api/get_exam/${examId}`);
                if (!examResponse.ok) {
                    throw new Error("無法獲取測驗資訊。");
                }
                const examData: Exam = await examResponse.json();
                setExam(examData);

                // 步驟 2: 使用 class_id 獲取學生名單
                const studentsResponse = await fetch(`/api/get_students_test_data/${examData.class_id}/${examData.id}`);
                if (!studentsResponse.ok) {
                    throw new Error("無法獲取學生名單。");
                }
                const studentsData: Student[] = await studentsResponse.json();
                setStudents(studentsData);

            } catch (err: unknown) {
                const errorMessage = (err as Error).message;
                setError(errorMessage);
                console.error("API 錯誤:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchExamAndStudents();
    }, [examId]);

    const handleUploadClick = (student: Student) => {
        if (exam) {
            setUploadData({
                studentId: student.id, // 修正：使用資料庫的 UUID
                studentName: student.name,
                examId: exam.id,
                classId: exam.class_id,
                totalPages: exam.total_pages,
                examName: exam.exam_name,
            });
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setUploadData(null);
    };

    if (loading) {
        return <div className="p-2 text-center text-neutral-400">載入中...</div>;
    }

    if (error) {
        return <div className="p-2 text-center text-red-400">{error}</div>;
    }

    if (!exam) {
        return <div className="p-2 text-center text-red-400">找不到此測驗。</div>;
    }

    return (
        <div className="p-2 max-w-4xl mx-auto min-h-screen">
            <h1 className="text-3xl font-bold mb-2">{exam.exam_name}</h1>
            <p className="text-neutral-400 mb-6">Pages: {exam.total_pages}</p>

            <div className="bg-neutral-800 rounded-lg p-6 shadow-md border border-neutral-700">
                <h2 className="text-xl font-semibold mb-4">學生名單</h2>
                {students.length === 0 ? (
                    <p className="text-neutral-400">此班級目前沒有學生。</p>
                ) : (
                    <ul className="space-y-3">
                        {students.map((student) => (
                            <li key={student.id} className="bg-neutral-700 rounded-lg p-3 flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">{student.name}
                                        <span
                                            className={
                                                clsx(
                                                    "ml-3 text-sm",
                                                    student.uploaded_pages_count <= 0
                                                        ? "text-red-500"
                                                        : student.uploaded_pages_count >= exam.total_pages
                                                            ? "text-green-500"
                                                            : "text-orange-500"
                                                )
                                            }
                                        >
                                            {student.uploaded_pages_count <= 0
                                                ? `尚未上傳 (0/ ${exam.total_pages})`
                                                : `已經上傳 (${student.uploaded_pages_count}/${exam.total_pages})`}
                                        </span>
                                    </div>
                                    {student.student_id} ({student.class})
                                </div>
                                <button
                                    onClick={() => handleUploadClick(student)}
                                    className="bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors"
                                >
                                    上傳
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="flex justify-center items-center mt-5">
                <Button>使用AI匹改</Button>
            </div>
            <UploadModal isOpen={isModalOpen} onClose={handleCloseModal} data={uploadData} />
        </div>
    );
};

export default ExamPage;
