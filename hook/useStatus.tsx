import { FC, ReactNode, useState } from 'react';

export type Status = 'loading' | 'success' | 'error';

const useStatus = () => {
    const [status, changeStatus] = useState<Status>('loading'); // 預設狀態為 loading

    const setStatus = {
        success: () => changeStatus('success'),
        loading: () => changeStatus('loading'),
        error: () => changeStatus('error'),

    }

    return { status, setStatus };
}

export default useStatus;

interface StatusViewProp {
    status: Status;
    debug?: boolean;
    success?: ReactNode;
    loading?: ReactNode;
    error?: ReactNode;
}

export const StatusView: FC<StatusViewProp> = ({ status, success, loading, error, debug = false }) => {
    return (
        <>
            {(() => {
                switch (status) {
                    case "loading":
                        return loading ?? (debug ? <p>載入中...</p> : null);
                    case "success":
                        return success ?? (debug ? <p>請求成功！</p> : null);
                    case "error":
                        return error ?? (debug ? <p>發生錯誤，請稍後再試。</p> : null);
                    default:
                        return null; // 預設為不顯示任何內容
                }
            })()}
        </>
    );
};