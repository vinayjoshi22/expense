import { useState } from 'react';
import { Modal, Button, Table, Form, Badge, Alert } from 'react-bootstrap';
import { formatDate, formatCurrency } from '../../lib/utils';
import type { Transaction } from '../../types';
import { RefreshCw, Check, X } from 'lucide-react';
import { ProcessingOverlay, type ProcessingStatus } from '../ui/ProcessingOverlay';
import { SourceSelect } from '../ui/SourceSelect';

interface ReviewModalProps {
    show: boolean;
    onHide: () => void;
    transactions: Transaction[];
    currency: string;
    processingStatus: ProcessingStatus;
    onApprove: (transactions: Transaction[], newSources: string[]) => void;
    onCancel: () => void;
    onRedo: (feedback: string) => void;
    sources: string[];
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
    sources
}: ReviewModalProps) {
    const [feedback, setFeedback] = useState('');
    const [selectedSource, setSelectedSource] = useState('');
    const [newSourcesToAdd, setNewSourcesToAdd] = useState<string[]>([]);

    // Derived source options (prop sources + newly created in this session)
    const availableSources = [...sources, ...newSourcesToAdd].sort();

    const handleCreateSource = (newSource: string) => {
        setNewSourcesToAdd(prev => [...prev, newSource]);
        setSelectedSource(newSource);
    };

    const handleApprove = () => {
        if (!selectedSource) return;
        // Apply source to all transactions
        const taggedTransactions = transactions.map(t => ({ ...t, source: selectedSource }));
        onApprove(taggedTransactions, newSourcesToAdd);
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
                        {/* Source Selection (Top) */}
                        <div className="p-3 bg-body-tertiary border-bottom">
                            <Form.Label className="fw-bold small text-body-secondary mb-2">Statement Source (Required)</Form.Label>
                            <div style={{ maxWidth: '300px' }}>
                                <SourceSelect
                                    value={selectedSource}
                                    sources={availableSources}
                                    onSelect={setSelectedSource}
                                    onCreate={handleCreateSource}
                                    placeholder="Select or Create Source (e.g. Chase)"
                                    className="bg-body border-secondary"
                                />
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
                                    {transactions.map((t, index) => (
                                        <tr key={t.id}>
                                            <td className="ps-3 border-0 small align-middle text-muted">{index + 1}</td>
                                            <td className="border-0 small align-middle font-monospace text-secondary">{formatDate(t.date)}</td>
                                            <td className="border-0 small align-middle fw-500">{t.description}</td>
                                            <td className="border-0 small align-middle">
                                                <Badge bg={getBadgeVariant(t.category)} text={t.category === 'Not an expense' || t.category === 'Food' || t.category === 'Income' ? 'dark' : 'light'} pill className="fw-normal">
                                                    {t.category}
                                                </Badge>
                                            </td>
                                            <td className={`pe-3 border-0 small align-middle text-end font-monospace fw-bold ${t.type === 'credit' ? 'text-success' : 'text-dark'}`}>
                                                {formatCurrency(t.amount, currency)}
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
