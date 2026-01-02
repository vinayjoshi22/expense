import { useState, useEffect } from 'react';
import { Modal, Button, Table, Form, Badge, Alert } from 'react-bootstrap';
import { formatDate, formatCurrency } from '../../lib/utils';
import type { Transaction } from '../../types';
import { RefreshCw, Check, X } from 'lucide-react';
import { ProcessingOverlay, type ProcessingStatus } from '../ui/ProcessingOverlay';
import { SourceSelect } from '../ui/SourceSelect';
import { EditableCell } from '../ui/EditableCell';
import { EditableCategoryCell } from '../ui/EditableCategoryCell';

interface ReviewModalProps {
    show: boolean;
    onHide: () => void;
    transactions: Transaction[];
    currency: string;
    processingStatus: ProcessingStatus;
    onApprove: (transactions: Transaction[], newSources: string[], balance?: any) => void;
    onCancel: () => void;
    onRedo: (feedback: string) => void;
    sources: string[];
    initialBalances?: { opening: number; closing: number };
    initialPeriod?: { month: string, year: string };
}

export function ReviewModal({
    show,
    onHide,
    transactions,
    currency,
    processingStatus,
    onApprove,
    onCancel,
    onRedo,
    sources,
    initialBalances,
    initialPeriod
}: ReviewModalProps) {
    const [feedback, setFeedback] = useState('');
    const [selectedSource, setSelectedSource] = useState('');
    const [newSourcesToAdd, setNewSourcesToAdd] = useState<string[]>([]);

    // Manage Transactions locally for editing
    const [txList, setTxList] = useState<Transaction[]>(transactions);

    // Sync prop transactions to local state when modal opens or re-processes
    useEffect(() => {
        setTxList(transactions);
    }, [transactions]);

    // Balance State
    const [openingBalance, setOpeningBalance] = useState<string>(initialBalances?.opening?.toString() || '');
    const [closingBalance, setClosingBalance] = useState<string>(initialBalances?.closing?.toString() || '');

    // Period State (Default to most frequent month/year in transactions)
    const [period, setPeriod] = useState<{ month: string, year: string }>({ month: '', year: '' });

    // Initialize period on show
    useState(() => {
        if (transactions.length > 0) {
            // Simple logic: pick date from first transaction
            const d = new Date(transactions[0].date);
            setPeriod({
                month: (d.getMonth() + 1).toString().padStart(2, '0'),
                year: d.getFullYear().toString()
            });
        }
    });

    // Reset/Init state when modal opens
    // (Using useEffect on 'show' to ensure it resets every time modal opens)
    useEffect(() => {
        if (show) {
            if (initialPeriod) {
                setPeriod({
                    month: initialPeriod.month,
                    year: initialPeriod.year
                });
            } else if (transactions.length > 0) {
                const d = new Date(transactions[0].date);
                setPeriod({
                    month: (d.getMonth() + 1).toString().padStart(2, '0'),
                    year: d.getFullYear().toString()
                });
            }

            // Re-sync Balance fields if provided
            if (initialBalances) {
                setOpeningBalance(initialBalances.opening.toString());
                setClosingBalance(initialBalances.closing.toString());
            }
        }
    }, [show, initialPeriod, initialBalances, transactions]);

    // Valid Years (last 10 years)


    // Derived source options (prop sources + newly created in this session)
    const availableSources = [...sources, ...newSourcesToAdd].sort();

    const handleCreateSource = (newSource: string) => {
        setNewSourcesToAdd(prev => [...prev, newSource]);
        setSelectedSource(newSource);
    };

    const handleApprove = () => {
        if (!selectedSource) return;

        // Prepare Balance Object if filled
        let balanceObj = undefined;
        if (openingBalance && closingBalance && period.month && period.year) {
            balanceObj = {
                id: crypto.randomUUID(),
                source: selectedSource,
                month: period.month,
                year: period.year,
                openingBalance: parseFloat(openingBalance),
                closingBalance: parseFloat(closingBalance)
            };
        }

        // Apply source to all transactions
        const taggedTransactions = txList.map(t => ({ ...t, source: selectedSource }));
        onApprove(taggedTransactions, newSourcesToAdd, balanceObj);
    };

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
    };

    const handleRedo = () => {
        if (!feedback.trim()) return;
        onRedo(feedback);
        setFeedback(''); // Clear feedback for next run
    };

    // Calculate generic stats for the alert
    const totalTime = processingStatus.completedBatches.reduce((a, b) => a + b.timeMs, 0);
    const avgTime = processingStatus.completedBatches.length > 0 ? totalTime / processingStatus.completedBatches.length : 0;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" keyboard={false} enforceFocus={false}>
            <Modal.Header>
                <Modal.Title className="h5 fw-bold text-primary">
                    Review Extracted Transactions
                    <Badge bg="secondary" className="ms-2 fs-6">{transactions.length}</Badge>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                {processingStatus.isActive ? (
                    <ProcessingOverlay status={processingStatus} />
                ) : (
                    <>
                        {/* Source Selection & Balance Config */}
                        <div className="p-3 bg-body-tertiary border-bottom">
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <Form.Label className="fw-bold small text-body-secondary mb-1">Statement Source (Required)</Form.Label>
                                    <SourceSelect
                                        value={selectedSource}
                                        sources={availableSources}
                                        onSelect={setSelectedSource}
                                        onCreate={handleCreateSource}
                                        placeholder="Select/Create Source"
                                        className="bg-body border-secondary"
                                    />
                                </div>
                                {/* Hiding Month and Year as per user request to handle multi-month files gracefully.
                                    Logic remains active in background (using extracted or current date). 
                                <div className="col-md-2">
                                    <Form.Label className="fw-bold small text-body-secondary mb-1">Month</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        className="bg-body border-secondary text-body"
                                        value={period.month}
                                        onChange={e => setPeriod(p => ({ ...p, month: e.target.value }))}
                                    >
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </Form.Select>
                                </div>
                                <div className="col-md-2">
                                    <Form.Label className="fw-bold small text-body-secondary mb-1">Year</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        className="bg-body border-secondary text-body"
                                        value={period.year}
                                        onChange={e => setPeriod(p => ({ ...p, year: e.target.value }))}
                                    >
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </Form.Select>
                                </div> 
                                */}
                                <div className="col-md-2">
                                    <Form.Label className="fw-bold small text-body-secondary mb-1">Opening ({currency})</Form.Label>
                                    <Form.Control
                                        type="number"
                                        size="sm"
                                        className="bg-body border-secondary text-body"
                                        placeholder="0.00"
                                        value={openingBalance}
                                        onChange={e => setOpeningBalance(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-2">
                                    <Form.Label className="fw-bold small text-body-secondary mb-1">Closing ({currency})</Form.Label>
                                    <Form.Control
                                        type="number"
                                        size="sm"
                                        className="bg-body border-secondary text-body"
                                        placeholder="0.00"
                                        value={closingBalance}
                                        onChange={e => setClosingBalance(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Transaction Table Preview */}
                        <div className="table-responsive bg-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <Table hover striped size="sm" className="mb-0">
                                <thead className="bg-body-secondary sticky-top shadow-sm" style={{ top: 0 }}>
                                    <tr>
                                        <th className="ps-3 py-2 text-muted small" style={{ width: '50px' }}>#</th>
                                        <th className="py-2 text-muted small">Date</th>
                                        <th className="py-2 text-muted small">Description</th>
                                        <th className="py-2 text-muted small">Category</th>
                                        <th className="pe-3 py-2 text-end text-muted small">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {txList.map((t, index) => (
                                        <tr key={t.id}>
                                            <td className="ps-3 border-0 small align-middle text-muted">{index + 1}</td>
                                            <td className="border-0 small align-middle font-monospace text-secondary">
                                                <EditableCell
                                                    value={t.date}
                                                    type="date"
                                                    onSave={(val) => {
                                                        setTxList(prev => prev.map(tx => tx.id === t.id ? { ...tx, date: val } : tx));
                                                    }}
                                                    format={formatDate}
                                                />
                                            </td>
                                            <td className="border-0 small align-middle fw-500">
                                                <EditableCell
                                                    value={t.description}
                                                    type="text"
                                                    onSave={(val) => {
                                                        setTxList(prev => prev.map(tx => tx.id === t.id ? { ...tx, description: val } : tx));
                                                    }}
                                                />
                                            </td>
                                            <td className="border-0 small align-middle">
                                                <EditableCategoryCell
                                                    id={t.id}
                                                    value={t.category}
                                                    allOptions={['Not an expense', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Utilities', 'Travel', 'Transfer', 'Income', 'Other']} // Use standard list or pass from parent? Standard list fine for now or derived?
                                                    onUpdate={(id, val) => {
                                                        setTxList(prev => prev.map(tx => {
                                                            if (tx.id !== id) return tx;
                                                            // Smart Type Logic
                                                            const updates: Partial<Transaction> = { category: val };
                                                            if (val === 'Income') {
                                                                updates.type = 'credit';
                                                            } else if (tx.type === 'credit') {
                                                                updates.type = 'debit';
                                                            }
                                                            return { ...tx, ...updates };
                                                        }));
                                                    }}
                                                    variantMapper={getBadgeVariant}
                                                />
                                            </td>
                                            <td className={`pe-3 border-0 small align-middle text-end font-monospace fw-bold ${t.type === 'credit' ? 'text-success' : 'text-body'}`}>
                                                <EditableCell
                                                    value={t.amount}
                                                    type="number"
                                                    onSave={(val) => {
                                                        setTxList(prev => prev.map(tx => tx.id === t.id ? { ...tx, amount: val } : tx));
                                                    }}
                                                    format={(val) => formatCurrency(val, currency)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-5 text-muted">
                                                No transactions found. Try refining the prompt.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>

                        {/* Processing Stats Alert */}
                        {processingStatus.completedBatches.length > 0 && !processingStatus.isActive && (
                            <div className="px-3 pt-3">
                                <Alert variant="success" className="mb-0 small d-flex align-items-center justify-content-between py-2">
                                    <span>
                                        <Check className="me-1" size={14} />
                                        Processed <strong>{processingStatus.completedBatches.length}</strong> batches in <strong>{(totalTime / 1000).toFixed(1)}s</strong>.
                                    </span>
                                    <span className="text-muted">Avg: {(avgTime / 1000).toFixed(1)}s/batch</span>
                                </Alert>
                            </div>
                        )}

                        {/* Feedback Area */}
                        <div className="p-3 border-top bg-body">
                            <Form.Group>
                                <Form.Label className="fw-bold small text-body-secondary">Something wrong? Improve the results:</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="e.g. 'The date format is DD/MM/YYYY', 'Amazon should be Shopping', 'Ignore pending txns'..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="bg-body-secondary"
                                    style={{ fontSize: '0.9rem' }}
                                />
                            </Form.Group>
                        </div>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className="bg-body-tertiary">
                <Button variant="outline-danger" onClick={onCancel} disabled={processingStatus.isActive}>
                    <X size={16} className="me-1" /> Discard
                </Button>
                <div className="ms-auto d-flex gap-2">
                    <Button
                        variant="warning"
                        onClick={handleRedo}
                        disabled={!feedback.trim() || processingStatus.isActive}
                        className="text-dark"
                    >
                        <RefreshCw size={16} className={`me-1 ${processingStatus.isActive ? 'spin' : ''}`} />
                        Refine & Redo
                    </Button>
                    <Button variant="success" onClick={handleApprove} disabled={processingStatus.isActive || transactions.length === 0 || !selectedSource}>
                        <Check size={16} className="me-1" /> Approve & Import (With Source)
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
}
