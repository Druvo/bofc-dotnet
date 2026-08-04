import React, { useState, useRef, useEffect } from "react";
import { EditOutlined } from "@ant-design/icons";

interface DoubleClickTextInputFieldProps {
    initialName: string;
    onNameChange: (newName: string) => void;
    isDiabled?: boolean;
}

const DoubleClickTextInputField: React.FC<DoubleClickTextInputFieldProps> = ({
    initialName,
    onNameChange,
    isDiabled = false,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);
    const [hovered, setHovered] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value.slice(0, 35)); // Limit to 35 characters
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (name !== initialName) {
            onNameChange(name);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleBlur();
        }
    };

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const displayName = name.length > 35 ? name.slice(0, 35) + "..." : name;

    return isEditing && !isDiabled ? (
        <input
            ref={inputRef}
            value={name}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            className="h-8 rounded-md border border-gray-300 bg-transparent px-2 text-theme-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
        />
    ) : (
        <div className="flex items-center" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <span onDoubleClick={handleDoubleClick} className="mr-1 cursor-pointer text-theme-sm">
                {displayName}
            </span>
            {hovered && <EditOutlined onClick={handleDoubleClick} className="cursor-pointer text-theme-xs text-gray-400" />}
        </div>
    );
};

export default DoubleClickTextInputField;
