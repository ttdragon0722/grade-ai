import { useEffect, useState } from "react";
import useStatus, { Status } from "./useStatus";
import { ApiCallable, ApiFunc, ApiFuncWithArgs, Responses } from "@/lib/types/apiResponse";
/**
 * API Hook 的回應型別
 * 
 * @template T - API 回應的資料型別
 * @property {Status} status - API 請求的狀態 (loading, success, error)
 * @property {T} [data] - API 回應的資料 (可選)
 * @property {Responses<T>} [res] - 完整的 API 回應物件 (包含 success, message 等資訊)
 */
interface UseApiResponse<T> {
    /** API 請求的狀態 (loading, success, error) */
    status: Status;

    /** API 回應的資料 (可選) */
    data?: T;
    setData?: React.Dispatch<React.SetStateAction<T | undefined>>;

    /** 完整的 API 回應物件 (包含 success, message 等資訊) */
    res?: Responses<T>;
}


/**
 * 通用的 API Hook，用於執行自動發送的 API 請求並管理其狀態。
 * 
 * @template T - API 回應的資料型別
 * @param {ApiFunc<T>} fetchFunc - API 請求函式，執行時無需傳入參數
 * @returns {UseApiResponse<T>} - 包含 API 狀態、回應資料與完整回應物件
 */
export function useApi<T>(fetchFunc: ApiFunc<T>): UseApiResponse<T> {
    const { status, setStatus } = useStatus(); // 使用 useStatus 管理請求狀態，預設為 loading
    const [data, setData] = useState<T | undefined>(undefined); // 存儲回傳的 API 資料
    const [res, setRes] = useState<Responses<T> | undefined>(undefined); // 存儲完整 API 回應物件 (除錯用)

    useEffect(() => {
        /**
         * 發送 API 請求並更新狀態
         * @async
         * @returns {Promise<void>}
         */
        const fetchData = async (): Promise<void> => {
            try {
                const result: Responses<T> = await fetchFunc(); // 執行 API 請求
                setRes(result); // 存儲完整回應

                if (result.success) {
                    if ("data" in result) {
                        setData(result.data); // 存儲 API 回傳的資料
                    }
                    setStatus.success(); // 更新狀態為成功
                } else {
                    console.error(result.message); // 錯誤訊息
                    setStatus.error(); // 更新狀態為錯誤
                }
            } catch (error) {
                console.error("API 請求錯誤:", error);
                setStatus.error(); // 更新狀態為錯誤
            }
        };

        fetchData(); // 組件掛載時自動執行 API 請求
    }, []);

    return { status, data, setData, res }; // 回傳 API 狀態、資料與完整回應
}

// 定義通用的 POST API Hook 回應型別
interface UsePostApiResponse<T> {
    status: Status; // API 請求狀態
    data?: T; // API 回應的資料
    res?: Responses<T>; // 完整的 API 回應物件
    postData: (
        params?: any[], // 可選的請求參數
        onSuccess?: (data?: T) => void, // 成功時的回調函式
        onError?: (message?: string) => void, // 錯誤時的回調函式
        onFinally?: () => void // 無論成功或失敗都會執行的回調函式
    ) => Promise<Responses<T> | undefined>; // 回傳 API 請求的結果
}

/**
 * 通用的 POST API Hook，支援不固定參數傳遞。
 * @template T - API 回應的資料型別
 * @param {ApiCallable<T>} postFunc - API 請求函式，可能帶參數或不帶參數
 * @returns {UsePostApiResponse<T>} - 包含 API 狀態、回應資料與請求函式
 */
export function usePostApi<T>(postFunc: ApiCallable<T>): UsePostApiResponse<T> {
    const { status, setStatus } = useStatus(); // 使用 useStatus 管理請求狀態
    const [data, setData] = useState<T | undefined>(undefined); // 存儲回傳的資料
    const [res, setRes] = useState<Responses<T> | undefined>(undefined); // 存儲完整回應物件

    /**
     * 發送 POST 請求
     * @param {any[]} [params] - 可選參數
     * @param {(data?: T) => void} [onSuccess] - 成功時的回調函式
     * @param {(message?: string) => void} [onError] - 錯誤時的回調函式
     * @param {() => void} [onFinally] - 最終執行的回調函式
     * @returns {Promise<Responses<T> | undefined>} - API 回應結果
     */
    const postData = async (
        params?: any[],
        onSuccess?: (data?: T) => void,
        onError?: (message?: string) => void,
        onFinally?: () => void
    ): Promise<Responses<T> | undefined> => {
        try {
            setStatus.loading(); // 設定狀態為 loading

            // 根據函式類型決定如何執行
            const result: Responses<T> = Array.isArray(params) && params
                ? await (postFunc as ApiFuncWithArgs<T>)(...params) // 帶參數的 API
                : await (postFunc as ApiFunc<T>)(); // 不帶參數的 API

            setRes(result); // 存儲完整回應物件

            if (result.success) {
                if ("data" in result) {
                    setData(result.data); // 存儲 API 回傳的資料
                    onSuccess?.(result.data); // 執行成功回調函式
                } else {
                    onSuccess?.();
                }
                setStatus.success(); // 更新狀態為成功
            } else {
                console.error(result.message); // 錯誤訊息
                setStatus.error(); // 更新狀態為錯誤
                onError?.(result.message ?? "未知錯誤"); // 執行錯誤回調函式
            }

            return result;
        } catch (error) {
            console.error("API 請求錯誤:", error);
            setStatus.error(); // 更新狀態為錯誤
            onError?.("發生錯誤，請稍後再試"); // 執行錯誤回調函式
            return undefined;
        } finally {
            onFinally?.(); // 總是執行最終回調函式
        }
    };

    return { status, data, res, postData }; // 回傳 API 狀態、資料與請求函式
}

interface UseApiParamResponse<T> {
    status: Status;
    data?: T;
    setData?: React.Dispatch<React.SetStateAction<T | undefined>>;
    res?: Responses<T>;
}

/**
 * 可傳入參數的通用 API Hook
 * 
 * @template T - API 回傳資料型別
 * @param {(...args: any[]) => Promise<Responses<T>>} fetchFunc - 可接受參數的 API 函式
 * @param {any[]} params - 要傳給 fetchFunc 的參數陣列
 * @param {boolean} [auto=true] - 是否自動在 useEffect 時執行
 * @returns {UseApiParamResponse<T>} - 包含 API 狀態、資料與完整回應
 */
export function useApiParam<T>(
    fetchFunc: (...args: any[]) => Promise<Responses<T>>,
    params: any[] = [],
    auto: boolean = true
): UseApiParamResponse<T> {
    const { status, setStatus } = useStatus();
    const [data, setData] = useState<T | undefined>(undefined);
    const [res, setRes] = useState<Responses<T> | undefined>(undefined);

    useEffect(() => {
        if (!auto) return;

        const fetchData = async () => {
            try {
                const result: Responses<T> = await fetchFunc(...params);
                setRes(result);

                if (result.success) {
                    if ("data" in result) {
                        setData(result.data);
                    }
                    setStatus.success();
                } else {
                    console.error(result.message);
                    setStatus.error();
                }
            } catch (error) {
                console.error("API 請求錯誤:", error);
                setStatus.error();
            }
        };

        fetchData();
    }, [JSON.stringify(params)]); // 當參數變動時重新請求

    return { status, data, setData, res };
}
