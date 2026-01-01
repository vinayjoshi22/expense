import { useState, useMemo, useEffect } from 'react';
import { Card, Table, Badge, Form, InputGroup, Row, Col, Button, OverlayTrigger, Tooltip, Pagination } from 'react-bootstrap';
import type { Transaction } from '../../types';
import { formatDate, formatCurrency } from '../../lib/utils';
import { ArrowUpRight, ArrowUp, ArrowDown, Search, Filter, Trash2, Copy, Plus } from 'lucide-react';
import { EditableCategoryCell } from '../ui/EditableCategoryCell';
import { EditableCell } from '../ui/EditableCell';
import { SourceSelect } from '../ui/SourceSelect';

interface TransactionTableProps {
    transactions: Transaction[];
    currency: string;
    onUpdateTransaction: (id: string, field: keyof Transaction, value: any) => void;
    onDeleteTransaction: (id: string) => void;
    showDuplicates: boolean;
    onToggleDuplicates: () => void;
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



type SortKey = 'date' | 'description' | 'amount' | 'category' | 'source';
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
    allCategories,
    showDuplicates,
    onToggleDuplicates,
    onAddTransaction,
    sources,
    onSourceCreate
}: TransactionTableProps & {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    categoryFilter: string;
    onCategoryChange: (val: string) => void;
    allCategories: string[];
    onAddTransaction: () => void;
    sources: string[];
    onSourceCreate: (source: string) => void;
}) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

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

        // If Showing Duplicates, we ALREADY sorted by description in App.tsx to keep groups together.
        // But the user might want to re-sort?
        // Actually, for duplicates view, sorting by Description is critical to see them side-by-side.
        // Let's force initial sort if duplicates are ON, or just respect user sort.
        // For now respecting user sort is fine, but default is date.

        // Sort
        result.sort((a, b) => {
            // ... existing sort ...
            let valA: any = a[sortConfig.key];
            let valB: any = b[sortConfig.key];
            // ...
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

    // Pagination Logic
    const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = sortedTransactions.slice(indexOfFirstItem, indexOfLastItem);

    // Reset to page 1 if filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, categoryFilter, showDuplicates, sources]);

    return (
        <Card className={`shadow-sm ${showDuplicates ? 'border-warning' : ''}`}>
            <Card.Header className="bg-white py-3">
                <Row className="g-3 align-items-center">
                    <Col md={4}>
                        <h5 className="mb-0 fw-bold text-secondary d-flex align-items-center gap-2">
                            {showDuplicates ? 'Duplicate Suspects' : 'Transactions'}
                            <Badge bg={showDuplicates ? 'warning' : 'secondary'} text={showDuplicates ? 'dark' : 'light'} pill className="fs-6">
                                {sortedTransactions.length}
                            </Badge>
                        </h5>
                    </Col>
                    <Col md={8}>
                        <Row className="g-2 justify-content-end">
                            <Col xs="auto">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={onAddTransaction}
                                    className="d-flex align-items-center gap-1"
                                >
                                    <Plus size={14} />
                                    <span className="d-none d-sm-inline">Add</span>
                                </Button>
                            </Col>
                            <Col xs="auto">
                                <OverlayTrigger placement="top" overlay={<Tooltip>Show Duplicates (Same Description & Amount)</Tooltip>}>
                                    <Button
                                        variant={showDuplicates ? "warning" : "outline-secondary"}
                                        size="sm"
                                        onClick={onToggleDuplicates}
                                        className="d-flex align-items-center gap-1"
                                    >
                                        <Copy size={14} />
                                        <span className="d-none d-sm-inline">Duplicates</span>
                                    </Button>
                                </OverlayTrigger>
                            </Col>
                            <Col xs={6} md={5}>
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-light border-end-0"><Search size={14} /></InputGroup.Text>
                                    <Form.Control
                                        placeholder="Search transactions..."
                                        className="border-start-0 bg-light"
                                        value={searchTerm}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        disabled={showDuplicates}
                                    />
                                </InputGroup>
                            </Col>
                            <Col xs={6} md={3}>
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-light border-end-0"><Filter size={14} /></InputGroup.Text>
                                    <Form.Select
                                        className="border-start-0 bg-light"
                                        value={categoryFilter}
                                        onChange={(e) => onCategoryChange(e.target.value)}
                                        disabled={showDuplicates}
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
                            <th className="text-muted fw-semibold pointer" onClick={() => handleSort('source')} style={{ cursor: 'pointer', width: '140px' }}>
                                SOURCE <SortIcon column="source" />
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
                        {currentTransactions.map((t) => (
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
                                    <SourceSelect
                                        value={t.source || ''}
                                        sources={sources}
                                        onSelect={(val) => onUpdateTransaction(t.id, 'source', val)}
                                        onCreate={onSourceCreate}
                                        placeholder="No Source"
                                        className="border-0 bg-transparent p-0"
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
                                <td colSpan={6} className="text-center py-5 text-muted">
                                    No transactions found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Pagination Footer */}
            {sortedTransactions.length > 0 && (
                <Card.Footer className="bg-white py-3 border-top-0">
                    <Row className="align-items-center justify-content-between g-3">
                        <Col xs="auto" className="d-flex align-items-center gap-2">
                            <span className="text-muted small">
                                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedTransactions.length)} of {sortedTransactions.length}
                            </span>
                            <Form.Select
                                size="sm"
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                style={{ width: 'auto', cursor: 'pointer' }}
                                className="bg-light border-0 py-0 ps-2 pe-4"
                            >
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={sortedTransactions.length}>All</option>
                            </Form.Select>
                        </Col>

                        <Col xs="auto">
                            <Pagination size="sm" className="mb-0">
                                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                                <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />

                                {totalPages <= 5 ? (
                                    [...Array(totalPages)].map((_, idx) => (
                                        <Pagination.Item key={idx + 1} active={idx + 1 === currentPage} onClick={() => setCurrentPage(idx + 1)}>
                                            {idx + 1}
                                        </Pagination.Item>
                                    ))
                                ) : (
                                    <>
                                        <Pagination.Item active={currentPage === 1} onClick={() => setCurrentPage(1)}>1</Pagination.Item>

                                        {currentPage > 3 && <Pagination.Ellipsis />}

                                        {/* Show range around current */}
                                        {currentPage > 1 && currentPage < totalPages && (
                                            <Pagination.Item active>{currentPage}</Pagination.Item>
                                        )}

                                        {currentPage < totalPages - 2 && <Pagination.Ellipsis />}

                                        <Pagination.Item active={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>{totalPages}</Pagination.Item>
                                    </>
                                )}

                                <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                            </Pagination>
                        </Col>
                    </Row>
                </Card.Footer>
            )}
        </Card>
    );
}
