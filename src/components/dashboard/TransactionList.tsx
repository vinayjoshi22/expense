import { useState, useMemo } from 'react';
import { Card, Table, Badge, Form, InputGroup, OverlayTrigger, Tooltip, Row, Col } from 'react-bootstrap';
import type { Transaction } from '../../types';
import { formatDate, formatCurrency } from '../../lib/utils';
import { ArrowUpRight, ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import { EditableCategoryCell } from '../ui/EditableCategoryCell';

interface TransactionTableProps {
    transactions: Transaction[];
    currency: string;
    onUpdateCategory: (id: string, newCategory: string) => void;
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
        default: return 'secondary';
    }
}

type SortKey = 'date' | 'description' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

export function TransactionTable({ transactions, currency, onUpdateCategory }: TransactionTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

    // Get Unique Categories for Filter
    const categories = useMemo(() => {
        const cats = new Set(transactions.map(t => t.category));
        return ['All', ...Array.from(cats).sort()];
    }, [transactions]);

    const uniqueCategoriesList = useMemo(() => {
        const cats = new Set(transactions.map(t => t.category));
        return Array.from(cats).sort();
    }, [transactions]);

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

    // Filter and Sort Logic
    const filteredAndSortedTransactions = useMemo(() => {
        let result = [...transactions];

        // Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(t => t.description.toLowerCase().includes(lower));
        }
        if (categoryFilter !== 'All') {
            result = result.filter(t => t.category === categoryFilter);
        }

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
    }, [transactions, searchTerm, categoryFilter, sortConfig]);

    return (
        <Card className="shadow-sm">
            <Card.Header className="bg-white py-3">
                <Row className="g-3 align-items-center">
                    <Col md={4}>
                        <h5 className="mb-0 fw-bold text-secondary d-flex align-items-center gap-2">
                            Transactions
                            <Badge bg="secondary" pill className="fs-6">{filteredAndSortedTransactions.length}</Badge>
                        </h5>
                    </Col>
                    <Col md={8}>
                        <Row className="g-2 justify-content-end">
                            <Col xs={6} md={5}>
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-light border-end-0"><Search size={14} /></InputGroup.Text>
                                    <Form.Control
                                        placeholder="Search description..."
                                        className="border-start-0 bg-light"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </Col>
                            <Col xs={6} md={4}>
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-light border-end-0"><Filter size={14} /></InputGroup.Text>
                                    <Form.Select
                                        className="border-start-0 bg-light"
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedTransactions.map((t) => (
                            <tr key={t.id}>
                                <td className="ps-3 text-secondary font-monospace" style={{ fontSize: '0.9em' }}>{formatDate(t.date)}</td>
                                <td className="fw-500 text-dark">
                                    <OverlayTrigger
                                        placement="top"
                                        delay={{ show: 250, hide: 400 }}
                                        overlay={<Tooltip id={`tooltip-${t.id}`}>{t.description}</Tooltip>}
                                    >
                                        <div className="text-truncate" style={{ maxWidth: '250px', cursor: 'help' }}>{t.description}</div>
                                    </OverlayTrigger>
                                </td>
                                <td>
                                    <EditableCategoryCell
                                        id={t.id}
                                        value={t.category}
                                        allOptions={uniqueCategoriesList}
                                        onUpdate={onUpdateCategory}
                                        variantMapper={getBadgeVariant}
                                    />
                                </td>
                                <td className={`text-end pe-3 fw-bold font-monospace ${t.type === 'credit' ? 'text-success' : 'text-dark'}`}>
                                    {t.type === 'credit' && <ArrowUpRight size={14} className="me-1" />}
                                    {formatCurrency(t.amount, currency)}
                                </td>
                            </tr>
                        ))}
                        {filteredAndSortedTransactions.length === 0 && (
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
