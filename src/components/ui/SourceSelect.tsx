import { useState, useEffect } from 'react';
import { Form, Button, InputGroup, OverlayTrigger, Popover } from 'react-bootstrap';
import { Plus } from 'lucide-react';

interface SourceSelectProps {
    value: string;
    sources: string[];
    onSelect: (source: string) => void;
    onCreate: (newSource: string) => void;
    placeholder?: string;
    className?: string;
}

export const SourceSelect = ({ value, sources, onSelect, onCreate, placeholder = "Select Source", className = "" }: SourceSelectProps) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Reset search when opening
    useEffect(() => {
        if (isOpen) setSearch('');
    }, [isOpen]);

    const filteredSources = sources.filter(s =>
        s.toLowerCase().includes(search.toLowerCase())
    );

    // Exact match check
    const exactMatch = sources.find(s => s.toLowerCase() === search.toLowerCase());

    const handleCreate = () => {
        if (search && !exactMatch) {
            onCreate(search);
            onSelect(search);
            document.body.click(); // Close popover
        }
    };

    return (
        <OverlayTrigger
            trigger="click"
            placement="bottom-start"
            rootClose
            onToggle={(show) => setIsOpen(show)}
            overlay={
                <Popover id="source-select-popover" className="shadow-sm">
                    <Popover.Body className="p-2">
                        <InputGroup size="sm" className="mb-2">
                            <Form.Control
                                autoFocus
                                placeholder="Search or Create..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (filteredSources.length === 1 && filteredSources[0].toLowerCase().includes(search.toLowerCase())) {
                                            onSelect(filteredSources[0]);
                                            document.body.click();
                                        } else {
                                            handleCreate();
                                        }
                                    }
                                }}
                            />
                        </InputGroup>
                        <div className="d-flex flex-column gap-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {/* Create Option */}
                            {search && !exactMatch && (
                                <Button
                                    variant="light"
                                    size="sm"
                                    className="text-start text-primary d-flex align-items-center gap-2"
                                    onClick={handleCreate}
                                >
                                    <Plus size={14} /> Create "{search}"
                                </Button>
                            )}

                            {/* Existing Options */}
                            {filteredSources.map(source => (
                                <Button
                                    key={source}
                                    variant={value === source ? "primary" : "light"}
                                    size="sm"
                                    className={`text-start ${value === source ? '' : 'text-dark'}`}
                                    onClick={() => {
                                        onSelect(source);
                                        document.body.click(); // Close
                                    }}
                                >
                                    {source}
                                </Button>
                            ))}

                            {filteredSources.length === 0 && !search && (
                                <small className="text-muted text-center py-2">No sources found.</small>
                            )}
                        </div>
                    </Popover.Body>
                </Popover>
            }
        >
            <div
                className={`form-control form-control-sm d-flex align-items-center justify-content-between cursor-pointer ${className}`}
                style={{ cursor: 'pointer', background: '#fff', minHeight: '31px' }}
            >
                <span className={value ? "text-dark" : "text-muted"}>
                    {value || placeholder}
                </span>
                {/* Visual caret could go here */}
            </div>
        </OverlayTrigger>
    );
};
