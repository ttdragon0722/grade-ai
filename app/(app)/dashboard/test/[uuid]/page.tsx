'use client';

import { useParams } from 'next/navigation';
import React from 'react';

const TestClientPage = () => {
    // 在 Client Component 中，使用 useParams() hook
    const params = useParams();
    const uuid = params.uuid;

    return (
        <div>
            <h1>課程儀表板 (Client Component)</h1>
            <p>目前正在檢視的課程 UUID 是：{uuid}</p>
        </div>
    );
};

export default TestClientPage;