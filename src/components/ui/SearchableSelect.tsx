import { useState } from 'react';
import { Form, InputGroup, OverlayTrigger, Popover, ListGroup } from 'react-bootstrap';
import { Search, Plus, ChevronDown } from 'lucide-react';

interface SearchableSelectProps {
    value: string;
    options: string[];
    onChange: (newValue: string) => void;
    size?: 'sm' | 'lg';
}

export const SearchableSelect = ({ value, options, onChange, size }: SearchableSelectProps) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Filter options. If exact match not found, show "Create" option.
    const filtered = options.filter(c => c.toLowerCase().includes(search.toLowerCase()));
    const exactMatch = filtered.some(c => c.toLowerCase() === search.toLowerCase());

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearch(''); // Reset search after select? Or keep it? Reset is cleaner.
        document.body.click(); // Hack to ensure OverlayTrigger closes
    };

    const popover = (
        <Popover id="popover-searchable-select" className="shadow">
            <Popover.Body className="p-2">
                <InputGroup size="sm" className="mb-2">
                    <InputGroup.Text className="bg-body-secondary border-secondary"><Search size={12} /></InputGroup.Text>
                    <Form.Control
                        placeholder="Search or create..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-body border-secondary"
                    />
                </InputGroup>

                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <ListGroup variant="flush" className="small">
                        {search && !exactMatch && (
                            <ListGroup.Item action className="text-primary fw-bold" onClick={() => handleSelect(search)}>
                                <Plus size={12} className="me-1" /> Create "{search}"
                            </ListGroup.Item>
                        )}
                        {filtered.map(opt => (
                            <ListGroup.Item
                                key={opt}
                                action
                                active={opt === value}
                                onClick={() => handleSelect(opt)}
                                className="d-flex justify-content-between align-items-center py-1 px-2"
                            >
                                {opt}
                                {opt === value && <span className="text-light">✓</span>}
                            </ListGroup.Item>
                        ))}
                        {filtered.length === 0 && !search && <div className="text-center text-muted p-2">No matches</div>}
                    </ListGroup>
                </div>
            </Popover.Body>
        </Popover>
    );

    return (
        <OverlayTrigger
            trigger="click"
            placement="bottom-start"
            overlay={popover}
            rootClose
            show={isOpen}
            onToggle={(next) => setIsOpen(next)}
        >
            <div
                className={`form-control ${size === 'sm' ? 'form-control-sm' : ''} d-flex justify-content-between align-items-center bg-body`}
                style={{ cursor: 'pointer' }}
            >
                <span className="text-truncate">{value}</span>
                <ChevronDown size={14} className="text-muted ms-1" />
            </div>
        </OverlayTrigger>
    );
};
