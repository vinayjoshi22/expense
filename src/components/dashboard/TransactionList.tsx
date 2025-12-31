import { useState, useMemo } from 'react';
import { Card, Table, Badge, Form, InputGroup, Row, Col, Button } from 'react-bootstrap';
import type { Transaction } from '../../types';
import { formatDate, formatCurrency } from '../../lib/utils';
import { ArrowUpRight, ArrowUp, ArrowDown, Search, Filter, Trash2 } from 'lucide-react';
import { EditableCategoryCell } from '../ui/EditableCategoryCell';
import { EditableCell } from '../ui/EditableCell';

interface TransactionTableProps {
    transactions: Transaction[];
    currency: string;
    onUpdateTransaction: (id: string, field: keyof Transaction, value: any) => void;
    onDeleteTransaction: (id: string) => void;
}

const getBadgeVariant = (category: string) => {
    switch (category) {
        case 'Transport': return 'info';
        case 'Food': return 'warning';
        case 'Shopping': return 'primary';
        case 'Entertainment': return 'danger';
        case 'Health': return 'danger';
        case 'Utilities': return 'dark';
        case 'Income': return 'success';
        case 'Not an expense': return 'light';
        default: return 'secondary';
    }
}

type SortKey = 'date' | 'description' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

export function TransactionTable({
    transactions,
    currency,
    onUpdateTransaction,
    onDeleteTransaction,
    searchTerm,
    onSearchChange,
    categoryFilter,
    onCategoryChange,
    allCategories
}: TransactionTableProps & {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    categoryFilter: string;
    onCategoryChange: (val: string) => void;
    allCategories: string[];
}) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

    // Categories for Editable Cell (Exclude 'All', ensuring 'Not an expense' is top)
    const uniqueCategoriesList = useMemo(() => {
        const cats = allCategories.filter(c => c !== 'All' && c !== 'Not an expense');
        return ['Not an expense', ...cats];
    }, [allCategories]);

    // Handle Sort Click
    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig.key !== column) return <span className="text-muted ms-1" style={{ opacity: 0.2 }}>⇅</span>;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ms-1" /> : <ArrowDown size={14} className="ms-1" />;
    };

    // Sort Logic (Filtering passed from parent)
    const sortedTransactions = useMemo(() => {
        let result = [...transactions];

        // Sort
        result.sort((a, b) => {
            let valA: any = a[sortConfig.key];
            let valB: any = b[sortConfig.key];

            if (sortConfig.key === 'date') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [transactions, sortConfig]);

    return (
        <Card className="shadow-sm">
            <Card.Header className="bg-white py-3">
                <Row className="g-3 align-items-center">
                    <Col md={4}>
                        <h5 className="mb-0 fw-bold text-secondary d-flex align-items-center gap-2">
                            Transactions
                            <Badge bg="secondary" pill className="fs-6">{sortedTransactions.length}</Badge>
                        </h5>
                    </Col>
                    <Col md={8}>
                        <Row className="g-2 justify-content-end">
                            <Col xs={6} md={5}>
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-light border-end-0"><Search size={14} /></InputGroup.Text>
                                    <Form.Control
                                        placeholder="Search transactions..."
                                        className="border-start-0 bg-light"
                                        value={searchTerm}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                    />
                                </InputGroup>
                            </Col>
                            <Col xs={6} md={4}>
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-light border-end-0"><Filter size={14} /></InputGroup.Text>
                                    <Form.Select
                                        className="border-start-0 bg-light"
                                        value={categoryFilter}
                                        onChange={(e) => onCategoryChange(e.target.value)}
                                    >
                                        {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </Form.Select>
                                </InputGroup>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Card.Header>

            <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <Table hover borderless striped size="sm" className="mb-0 align-middle">
                    <thead className="bg-light sticky-top" style={{ top: 0, zIndex: 1 }}>
                        <tr>
                            <th className="ps-3 text-muted fw-semibold pointer" onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                                DATE <SortIcon column="date" />
                            </th>
                            <th className="text-muted fw-semibold pointer" onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>
                                DESCRIPTION <SortIcon column="description" />
                            </th>
                            <th className="text-muted fw-semibold pointer" onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                                CATEGORY <SortIcon column="category" />
                            </th>
                            <th className="text-end pe-3 text-muted fw-semibold pointer" onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                                AMOUNT <SortIcon column="amount" />
                            </th>
                            <th className="text-end pe-3 text-muted fw-semibold">
                                ACTION
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTransactions.map((t) => (
                            <tr key={t.id}>
                                <td className="ps-3 text-secondary font-monospace" style={{ fontSize: '0.9em' }}>
                                    <EditableCell
                                        value={t.date}
                                        type="date"
                                        onSave={(val) => onUpdateTransaction(t.id, 'date', val)}
                                        format={(val) => formatDate(val)}
                                    />
                                </td>
                                <td className="fw-500 text-dark">
                                    <EditableCell
                                        value={t.description}
                                        type="text"
                                        onSave={(val) => onUpdateTransaction(t.id, 'description', val)}
                                    />
                                </td>
                                <td>
                                    <EditableCategoryCell
                                        id={t.id}
                                        value={t.category}
                                        allOptions={uniqueCategoriesList}
                                        onUpdate={(id, val) => onUpdateTransaction(id, 'category', val)}
                                        variantMapper={getBadgeVariant}
                                    />
                                </td>
                                <td className={`text-end pe-3 fw-bold font-monospace ${t.type === 'credit' ? 'text-success' : 'text-dark'}`}>
                                    <div className="d-flex justify-content-end align-items-center gap-1">
                                        {t.type === 'credit' && <ArrowUpRight size={14} className="me-1" />}
                                        <EditableCell
                                            value={t.amount}
                                            type="number"
                                            onSave={(val) => onUpdateTransaction(t.id, 'amount', val)}
                                            format={(val) => formatCurrency(val, currency)}
                                        />
                                    </div>
                                </td>
                                <td className="text-end pe-3">
                                    <Button variant="link" className="text-danger p-0" size="sm" onClick={() => onDeleteTransaction(t.id)}>
                                        <Trash2 size={14} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {sortedTransactions.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-5 text-muted">
                                    No transactions found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </Card>
    );
}
