"use client";

import { useState, useEffect } from "react";
import { useExam } from "../../_context/ExamContext";
import Photo from "../../_components/photo";

// 定義學生資料的介面
interface StudentWithPhotos {
    id: string;
    student_id: string;
    name: string;
    class_name: string;
    photos: string[];
}

const Gallery: React.FC = () => {
    // 從 Context 中獲取測驗 ID
    const { examId } = useExam();
    const [gallery, setGallery] = useState<StudentWithPhotos[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // 當 examId 改變時，觸發 API 呼叫
    useEffect(() => {
        const fetchGallery = async () => {
            if (!examId) {
                setError("無法取得測驗 ID。");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                // 呼叫 API 獲取學生相簿資料
                const response = await fetch(`/api/get_exam_gallery/${examId}`);
                if (response.ok) {
                    const data: StudentWithPhotos[] = await response.json();
                    setGallery(data);
                } else {
                    const errorData = await response.json();
                    setError(errorData.detail || "無法載入學生相簿。");
                }
            } catch (err) {
                setError("無法連線到伺服器。請檢查網路連線。");
            } finally {
                setLoading(false);
            }
        };

        fetchGallery();
    }, [examId]);

    // 單個學生卡片元件
    const StudentCard: React.FC<{ student: StudentWithPhotos }> = ({ student }) => (
        <div className="bg-neutral-800 rounded-lg p-2 shadow-md border border-neutral-700 hover:border-blue-500 transition-all duration-300">
            <p className="text-sm text-neutral-400 my-1">{student.class_name} - {student.student_id} - {student.name}  ({student.photos.length} 張)</p>

            <ul className="space-y-2 flex gap-1 overflow-x-scroll overflow-y-hidden">
                <div className="flex gap-1">
                    {student.photos.map((photoId) => (
                        <Photo key={photoId} src={`/photo/${photoId}`} />
                    ))}
                </div>
            </ul>
        </div>
    );

    return (
        <div className="flex flex-col items-center p-1 font-sans">
            <div className="w-full">
                {loading && (
                    <div className="flex flex-col items-center py-10">
                        <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-4 text-neutral-400">載入中，請稍候...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 text-center">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {!loading && !error && gallery.length === 0 && (
                    <p className="text-neutral-400 text-center py-10">目前沒有學生資料。</p>
                )}

                {!loading && !error && gallery.length > 0 && (
                    <div className="flex flex-col">
                        {gallery.map((student) => (
                            <StudentCard key={student.id} student={student} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gallery;
