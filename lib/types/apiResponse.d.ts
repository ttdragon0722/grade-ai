/**
 * 通用 API 回應型別，可能包含數據或僅有狀態與訊息。
 * @template T - API 回應的資料型別
 */
export type Responses<T> = ApiResponse<T> | ApiResponseNoData;

/**
 * 無參數的 API 函式型別，回傳 `Responses<T>` 的 Promise。
 * @template T - API 回應的資料型別
 */
export type ApiFunc<T> = () => Promise<Responses<T>>;

/**
 * 可接受參數的 API 函式型別，回傳 `Responses<T>` 的 Promise。
 * 允許傳入任意數量的參數。
 * @template T - API 回應的資料型別
 * @param {...any[]} args - 可變參數，用於傳遞 API 需要的請求參數
 */
export type ApiFuncWithArgs<T> = (...args: any[]) => Promise<Responses<T>>;

/**
 * 通用的 API 可呼叫函式型別，可能為無參數或帶參數的 API 函式。
 * @template T - API 回應的資料型別
 */
export type ApiCallable<T> = ApiFunc<T> | ApiFuncWithArgs<T>;

/**
 * API 回應格式 (無數據)，僅包含成功狀態與訊息。
 */
export interface ApiResponseNoData {
	/** API 請求是否成功 */
	success: boolean;

	/** API 回應訊息 (可選) */
	message?: string;
}

/**
 * API 回應格式，包含 `success`、`message`，以及可選的 `data`。
 * @template T - API 回應的資料型別
 */
export interface ApiResponse<T> extends ApiResponseNoData {
	/** API 回應的數據 (可選) */
	data?: T;
}
