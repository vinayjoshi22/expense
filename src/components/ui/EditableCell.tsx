import { useState, useEffect, useRef } from 'react';
import { Form } from 'react-bootstrap';

interface EditableCellProps {
    value: string | number;
    type?: 'text' | 'number' | 'date';
    onSave: (val: any) => void;
    format?: (val: any) => React.ReactNode;
    className?: string;
}

export const EditableCell = ({ value, type = 'text', onSave, format, className }: EditableCellProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (currentValue !== value) {
            onSave(type === 'number' ? parseFloat(currentValue as string) : currentValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setCurrentValue(value);
        }
    };

    if (isEditing) {
        return (
            <Form.Control
                ref={inputRef}
                type={type}
                size="sm"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="p-1"
                style={{ minWidth: '80px' }}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer ${className}`}
            style={{ cursor: 'pointer', minHeight: '20px' }}
            title="Click to edit"
        >
            {format ? format(value) : value}
        </div>
    );
};
