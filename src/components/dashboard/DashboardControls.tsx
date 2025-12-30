import { Dropdown, Form, Button } from 'react-bootstrap';
import { Filter } from 'lucide-react';

interface DashboardControlsProps {
    availableYears: string[];
    availableMonths: string[];
    selectedYears: Set<string>;
    selectedMonths: Set<string>;
    onToggleYear: (year: string) => void;
    onToggleMonth: (month: string) => void;
    onSelectAllYears: () => void;
    onDeselectAllYears: () => void;
    onSelectAllMonths: () => void;
    onDeselectAllMonths: () => void;
}

const ALL_MONTHS = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' }, { value: '03', label: 'March' },
    { value: '04', label: 'April' }, { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' }, { value: '09', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
];

export function DashboardControls({
    availableYears,
    availableMonths,
    selectedYears,
    selectedMonths,
    onToggleYear,
    onToggleMonth,
    onSelectAllYears,
    onDeselectAllYears,
    onSelectAllMonths,
    onDeselectAllMonths
}: DashboardControlsProps) {

    return (
        <div className="d-flex justify-content-end mb-3 gap-2 flex-wrap">
            {/* Year Filter */}
            <Dropdown autoClose="outside">
                <Dropdown.Toggle variant="outline-secondary" size="sm" className="d-flex align-items-center bg-white shadow-sm border">
                    <Filter size={14} className="me-2" /> Years ({selectedYears.size})
                </Dropdown.Toggle>
                <Dropdown.Menu className="p-2 shadow-sm" style={{ minWidth: '220px' }}>
                    <div className="d-flex justify-content-between align-items-center px-2 mb-2">
                        <span className="fw-bold small text-muted">Select Years</span>
                        <div className="d-flex gap-1">
                            <Button variant="link" size="sm" className="p-0 text-decoration-none" style={{ fontSize: '0.75rem' }} onClick={onSelectAllYears}>All</Button>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>|</span>
                            <Button variant="link" size="sm" className="p-0 text-decoration-none text-danger" style={{ fontSize: '0.75rem' }} onClick={onDeselectAllYears}>Clear</Button>
                        </div>
                    </div>

                    {availableYears.map(year => (
                        <div key={year} className="dropdown-item-custom rounded" onClick={() => onToggleYear(year)}>
                            <Form.Check
                                type="checkbox"
                                id={`year-${year}`}
                                label={year}
                                checked={selectedYears.has(year)}
                                onChange={() => { }} // Handle click on parent div
                                className="pointer-events-none" // Handled by parent
                                style={{ pointerEvents: 'none' }}
                            />
                        </div>
                    ))}
                </Dropdown.Menu>
            </Dropdown>

            {/* Month Filter */}
            <Dropdown autoClose="outside">
                <Dropdown.Toggle variant="outline-secondary" size="sm" className="d-flex align-items-center bg-white shadow-sm border">
                    <Filter size={14} className="me-2" /> Months ({selectedMonths.size})
                </Dropdown.Toggle>
                <Dropdown.Menu className="p-2 shadow-sm" style={{ minWidth: '220px', maxHeight: '300px', overflowY: 'auto' }}>
                    <div className="d-flex justify-content-between align-items-center px-2 mb-2">
                        <span className="fw-bold small text-muted">Select Months</span>
                        <div className="d-flex gap-1">
                            <Button variant="link" size="sm" className="p-0 text-decoration-none" style={{ fontSize: '0.75rem' }} onClick={onSelectAllMonths}>All</Button>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>|</span>
                            <Button variant="link" size="sm" className="p-0 text-decoration-none text-danger" style={{ fontSize: '0.75rem' }} onClick={onDeselectAllMonths}>Clear</Button>
                        </div>
                    </div>

                    {ALL_MONTHS.filter(m => availableMonths.includes(m.value)).map(month => (
                        <div key={month.value} className="dropdown-item-custom rounded" onClick={() => onToggleMonth(month.value)}>
                            <Form.Check
                                type="checkbox"
                                id={`month-${month.value}`}
                                label={month.label}
                                checked={selectedMonths.has(month.value)}
                                onChange={() => { }}
                                style={{ pointerEvents: 'none' }}
                            />
                        </div>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
}
