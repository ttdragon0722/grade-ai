// DottedHr.tsx
import React from "react";

interface DottedHrProps {
    className?: string;
}

const DottedHr: React.FC<DottedHrProps> = ({ className }) => {
    return (
        <div className={`flex items-center my-8 ${className}`}>
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="flex space-x-1 mx-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
            </div>
            <div className="flex-1 border-t border-gray-300"></div>
        </div>
    );
};

export default DottedHr;
