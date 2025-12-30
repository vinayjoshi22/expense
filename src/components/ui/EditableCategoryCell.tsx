import { useState } from 'react';
import { Badge, Form, InputGroup, OverlayTrigger, Popover, ListGroup } from 'react-bootstrap';
import { Search, Plus } from 'lucide-react';

interface EditableCategoryCellProps {
    value: string;
    id: string;
    allOptions: string[];
    onUpdate: (id: string, newValue: string) => void;
    variantMapper?: (val: string) => string;
}

export const EditableCategoryCell = ({ value, id, allOptions, onUpdate, variantMapper }: EditableCategoryCellProps) => {
    const [search, setSearch] = useState('');

    // Filter options. If exact match not found, show "Create" option.
    const filtered = allOptions.filter(c => c.toLowerCase().includes(search.toLowerCase()));
    const exactMatch = filtered.some(c => c.toLowerCase() === search.toLowerCase());

    const handleSelect = (val: string) => {
        onUpdate(id, val);
        document.body.click(); // Quick hack to close OverlayTrigger rootClose
    };

    const getVariant = (val: string) => {
        if (variantMapper) return variantMapper(val);
        return 'secondary';
    };

    const popover = (
        <Popover id={`popover-edit-${id}`} className="shadow">
            <Popover.Body className="p-2">
                <InputGroup size="sm" className="mb-2">
                    <InputGroup.Text className="bg-light"><Search size={12} /></InputGroup.Text>
                    <Form.Control
                        placeholder="Search or create..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-light"
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
        <OverlayTrigger trigger="click" placement="bottom" overlay={popover} rootClose>
            <span style={{ cursor: 'pointer' }} className="d-inline-flex align-items-center gap-1 group-hover-trigger">
                <Badge bg={getVariant(value)} text={getVariant(value) === 'warning' ? 'dark' : 'white'} className="fw-normal">
                    {value}
                </Badge>
            </span>
        </OverlayTrigger>
    );
};
