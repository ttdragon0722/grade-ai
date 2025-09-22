'use client';

import { useEffect, useState } from 'react';
import { useExam } from '../../_context/ExamContext';
import FillImage from '@/components/FillImage';
import Photo from '../../_components/photo';


// 定義資料結構的 TypeScript 介面
interface ResultImage {
    ai_result_id: string;
    save_paths: string[];
}

interface StudentResult {
    id: string;
    student_id: string;
    name: string;
    class_name: string;
    score: number;
    result_images: ResultImage[];
}


const AnswerPage = () => {
    const { examId } = useExam();
    const [students, setStudents] = useState<StudentResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState<StudentResult | null>(null);

    useEffect(() => {
        if (!examId) {
            setLoading(false);
            setError('考試ID無效');
            return;
        }

        const fetchResults = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/ai/get_result/${examId}`);
                if (!response.ok) {
                    throw new Error('無法載入批改結果');
                }
                const data: StudentResult[] = await response.json();
                setStudents(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [examId]);

    const openModal = (student: StudentResult) => {
        setModalContent(student);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalContent(null);
    };

    if (loading) {
        return <div className="flex items-center justify-center">載入中...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center  ">錯誤：{error}</div>;
    }

    if (!students || students.length === 0) {
        return <div className="flex items-center justify-center  ">沒有找到批改結果。</div>;
    }

    return (
        <div className="p-2 font-sans">
            <div className="bg-neutral-800 p-2 shadow-md border border-neutral-700 hover:border-blue-500 overflow-x-auto rounded-lg">
                <table className="min-w-full divide-y divide-neutral-700">
                    <thead>
                        <tr>
                            <th scope="col" className="px-3 py-3 md:px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                學號
                            </th>
                            <th scope="col" className="px-3 py-3 md:px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                姓名
                            </th>
                            <th scope="col" className="hidden sm:table-cell px-3 py-3 md:px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                班級
                            </th>
                            <th scope="col" className="px-3 py-3 md:px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                總分
                            </th>
                            <th scope="col" className="px-3 py-3 md:px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className=" divide-y divide-neutral-700">
                        {students && students.length !== 0 && students.map((student) => (
                            <tr key={student.id}>
                                <td className="px-3 py-4 md:px-6 whitespace-nowrap text-sm text-gray-100">
                                    {student.student_id}
                                </td>
                                <td className="px-3 py-4 md:px-6 whitespace-nowrap text-sm text-gray-100">
                                    {student.name}
                                </td>
                                <td className="hidden sm:table-cell px-3 py-4 md:px-6 whitespace-nowrap text-sm text-gray-100">
                                    {student.class_name}
                                </td>
                                <td className="px-3 py-4 md:px-6 whitespace-nowrap text-sm text-gray-100">
                                    {student.score}
                                </td>
                                <td className="px-3 py-4 md:px-6 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => openModal(student)}
                                        className="text-indigo-400 hover:text-indigo-200 font-bold transition-colors duration-200"
                                    >
                                        查看圖片
                                    </button>

                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            {/* 圖片彈窗 */}
            {showModal && modalContent && (
                <div
                    id="image-modal"
                    className="fixed inset-0 bg-black/60 backdrop-blur-xl bg-opacity-90 flex items-center justify-center z-50 p-4"
                >
                    <div className="bg-neutral-800 rounded-lg p-6 max-w-4xl w-full relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 transition-colors duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div id="modal-content" className="text-center">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-100">
                                {modalContent.name} 的批改圖片
                            </h2>
                            <div className="max-h-[70vh] overflow-y-auto">
                                {modalContent.result_images.map((imageBlock, index) => (
                                    <div key={index} className="mb-6 p-4 border rounded-md border-neutral-700">
                                        <p className="text-sm text-gray-300 mb-2">AI 批改結果 ID: {imageBlock.ai_result_id}</p>
                                        <div className="space-y-1 w-full ">
                                            <div className="flex gap-1">
                                                {imageBlock.save_paths.map((path, pathIndex) => (
                                                    <Photo key={pathIndex} src={`/${path.replace(/\\/g, '/')}`} className='absolute' />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnswerPage;
