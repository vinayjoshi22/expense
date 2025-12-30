import { useState, useMemo } from 'react';
import { Card, Table, Button, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import type { Investment } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { EditableCategoryCell } from '../ui/EditableCategoryCell';
import { SearchableSelect } from '../ui/SearchableSelect';

interface InvestmentListProps {
    investments: Investment[];
    currency: string;
    onAdd: (inv: Omit<Investment, 'id'>) => void;
    onUpdate: (id: string, field: keyof Investment, value: any) => void;
    onDelete: (id: string) => void;
}

export function InvestmentList({ investments, currency, onAdd, onUpdate, onDelete }: InvestmentListProps) {
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newType, setNewType] = useState('Stock');
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

    const totalValue = investments.reduce((sum, inv) => sum + inv.amount, 0);

    const handleAdd = () => {
        if (!newName || !newAmount) return;
        onAdd({
            name: newName,
            amount: parseFloat(newAmount),
            type: newType,
            date: newDate,
            currency: currency // default to current
        });
        setNewName('');
        setNewAmount('');
    };

    const uniqueTypes = useMemo(() => {
        const types = new Set(investments.map(i => i.type));
        types.add('Stock');
        types.add('Mutual Fund');
        types.add('FD');
        types.add('Gold');
        types.add('Real Estate');
        return Array.from(types).sort();
    }, [investments]);

    return (
        <Card className="shadow-sm mb-4 border-info">
            <Card.Header className="bg-white py-3">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold text-info d-flex align-items-center gap-2">
                        <TrendingUp size={20} />
                        Investments Portfolio
                    </h5>
                    <h5 className="mb-0 fw-bold text-success">
                        Total: {formatCurrency(totalValue, currency)}
                    </h5>
                </div>
            </Card.Header>
            <Card.Body>
                {/* Add New Investment Form */}
                <Row className="g-2 align-items-end mb-4 border-bottom pb-4">
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="small text-muted mb-1">Name</Form.Label>
                            <Form.Control
                                size="sm"
                                placeholder="e.g. Apple Stock"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={2}>
                        <Form.Group>
                            <Form.Label className="small text-muted mb-1">Type</Form.Label>
                            <SearchableSelect
                                value={newType}
                                options={uniqueTypes}
                                onChange={setNewType}
                                size="sm"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="small text-muted mb-1">Amount</Form.Label>
                            <InputGroup size="sm">
                                <InputGroup.Text>{currency}</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    placeholder="0.00"
                                    value={newAmount}
                                    onChange={e => setNewAmount(e.target.value)}
                                />
                            </InputGroup>
                        </Form.Group>
                    </Col>
                    <Col md={2}>
                        <Form.Group>
                            <Form.Label className="small text-muted mb-1">Date</Form.Label>
                            <Form.Control
                                type="date"
                                size="sm"
                                value={newDate}
                                onChange={e => setNewDate(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={2}>
                        <Button size="sm" variant="info" className="w-100 text-white" onClick={handleAdd}>
                            <Plus size={14} className="me-1" /> Add
                        </Button>
                    </Col>
                </Row>

                {/* List */}
                <div className="table-responsive">
                    <Table hover borderless striped size="sm" className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-3 text-muted fw-semibold">DATE</th>
                                <th className="text-muted fw-semibold">NAME</th>
                                <th className="text-muted fw-semibold">TYPE</th>
                                <th className="text-end pe-3 text-muted fw-semibold">AMOUNT</th>
                                <th className="text-end pe-3 text-muted fw-semibold">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {investments.map(inv => (
                                <tr key={inv.id}>
                                    <td className="ps-3 text-secondary font-monospace">{formatDate(inv.date)}</td>
                                    <td className="fw-500">{inv.name}</td>
                                    <td>
                                        <EditableCategoryCell
                                            id={inv.id}
                                            value={inv.type}
                                            allOptions={uniqueTypes}
                                            onUpdate={(id, val) => onUpdate(id, 'type', val)}
                                            variantMapper={() => 'info'}
                                        />
                                    </td>
                                    <td className="text-end pe-3 fw-bold font-monospace text-success">
                                        {formatCurrency(inv.amount, inv.currency)}
                                    </td>
                                    <td className="text-end pe-3">
                                        <Button variant="link" className="text-danger p-0" size="sm" onClick={() => onDelete(inv.id)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {investments.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-muted">
                                        No investments added yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );
}
