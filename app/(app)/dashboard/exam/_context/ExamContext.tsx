"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams } from 'next/navigation';

/**
 * Interface for the Exam data.
 */
interface Exam {
    id: string;
    teacher_id: string;
    class_id: string;
    exam_name: string;
    total_pages: number;
    correct_answer: { [key: string]: string };
}

/**
 * Interface for the context value.
 */
interface ExamContextType {
    exam: Exam | null;
    loading: boolean;
    error: string | null;
    examId: string | null;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

interface ExamProviderProps {
    children: ReactNode;
}

/**
 * The provider component that fetches and provides exam-related data.
 * @param {ExamProviderProps} props
 */
export const ExamProvider: React.FC<ExamProviderProps> = ({ children }) => {
    const params = useParams();
    const examId = params.uuid as string;

    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchExam = async () => {
            if (!examId) {
                setError("測驗 ID 無效。");
                setLoading(false);
                return;
            }

            try {
                // Only get exam info
                const examResponse = await fetch(`/api/get_exam/${examId}`);
                if (!examResponse.ok) {
                    throw new Error("無法獲取測驗資訊。");
                }
                const examData: Exam = await examResponse.json();
                setExam(examData);

            } catch (err: unknown) {
                const errorMessage = (err as Error).message;
                setError(errorMessage);
                console.error("API 錯誤:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchExam();
    }, [examId]);

    const value = { exam, loading, error, examId };

    return (
        <ExamContext.Provider value={value}>
            {children}
        </ExamContext.Provider>
    );
};

/**
 * Custom hook to easily consume the ExamContext.
 * @returns {ExamContextType} The context value.
 */
export const useExam = () => {
    const context = useContext(ExamContext);
    if (context === undefined) {
        throw new Error('useExam must be used within an ExamProvider');
    }
    return context;
};
