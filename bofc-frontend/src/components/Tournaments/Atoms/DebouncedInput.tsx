import React, { useState, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";

interface DebouncedInputProps {
    placeholder?: string;
    debounceDuration?: number;
    onChange: (value: string) => void;
    value?: string;
    isDisabled?: boolean;
    className?: string;
    /** Render a multi-line auto-sizing textarea that grows up to `maxRows` lines. */
    autoSize?: boolean;
    maxRows?: number;
}

const sharedClasses =
    "w-full border-0 border-b border-gray-300 bg-transparent px-0 py-1 text-sm text-gray-800 outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-white/90";

const DebouncedInput: React.FC<DebouncedInputProps> = ({
    placeholder = "Enter text...",
    debounceDuration = 500,
    onChange,
    value: controlledValue,
    isDisabled = false,
    className,
    autoSize = false,
    maxRows = 2,
}) => {
    const [value, setValue] = useState(controlledValue || "");

    useEffect(() => {
        setValue(controlledValue || "");
    }, [controlledValue]);

    const debouncedOnChange = useCallback(
        debounce((newValue: string) => {
            onChange(newValue);
        }, debounceDuration),
        [onChange, debounceDuration]
    );

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const newValue = e.target.value;
        setValue(newValue);
        debouncedOnChange(newValue);
    };

    if (autoSize) {
        return (
            <textarea
                className={`${sharedClasses} resize-none ${className || ""}`}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                disabled={isDisabled}
                rows={maxRows}
            />
        );
    }

    return (
        <input
            className={`${sharedClasses} ${className || ""}`}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            disabled={isDisabled}
        />
    );
};

export default DebouncedInput;
