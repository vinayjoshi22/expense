import { useState, useEffect } from 'react';
import { Modal, Button, Form, Tab, Nav, Alert } from 'react-bootstrap';
import { Trash2, AlertTriangle, Calendar, PieChart } from 'lucide-react';

interface ClearDataModalProps {
    show: boolean;
    onHide: () => void;
    onClearAll: () => void;
    onClearInvestments: () => void;
    onClearTransactions: (year?: string, month?: string, accountType?: 'all' | 'bank' | 'cc') => void;
    availableYears: string[];
    initialTab?: 'transactions' | 'investments' | 'reset';
}

export function ClearDataModal({
    show,
    onHide,
    onClearAll,
    onClearInvestments,
    onClearTransactions,
    availableYears,
    initialTab = 'transactions'
}: ClearDataModalProps) {
    const [activeTab, setActiveTab] = useState<'transactions' | 'investments' | 'reset'>(initialTab);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [accountType, setAccountType] = useState<'all' | 'bank' | 'cc'>('all');

    // Sync tab when prop changes or modal opens
    useEffect(() => {
        if (show && initialTab) {
            setActiveTab(initialTab);
        }
    }, [show, initialTab]);

    // Reset selection on open/tab change
    const handleTabSelect = (k: string | null) => {
        if (k) setActiveTab(k as any);
        setSelectedYear('');
        setSelectedMonth('');
        setAccountType('all');
    };

    const handleTxDelete = () => {
        onClearTransactions(selectedYear, selectedMonth, accountType);
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="h5 fw-bold">Manage Data</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tab.Container activeKey={activeTab} onSelect={handleTabSelect}>
                    <Nav variant="tabs" className="mb-3">
                        <Nav.Item>
                            <Nav.Link eventKey="transactions" className="d-flex align-items-center gap-2">
                                <Calendar size={16} /> Transactions
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="investments" className="d-flex align-items-center gap-2">
                                <PieChart size={16} /> Investments
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="reset" className="text-danger d-flex align-items-center gap-2">
                                <AlertTriangle size={16} /> Danger Zone
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <Tab.Content>
                        {/* Transaction Deletion */}
                        <Tab.Pane eventKey="transactions">
                            <p className="small text-muted mb-3">Delete specific transactions by date, or clear your entire transaction history.</p>

                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Account Type</Form.Label>
                                <Form.Select value={accountType} onChange={e => setAccountType(e.target.value as any)}>
                                    <option value="all">All Accounts</option>
                                    <option value="bank">Bank Accounts Only</option>
                                    <option value="cc">Credit Cards Only</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Select Year (Optional)</Form.Label>
                                <Form.Select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                                    <option value="">-- All Years --</option>
                                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="small fw-bold">Select Month (Optional)</Form.Label>
                                <Form.Select
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(e.target.value)}
                                    disabled={!selectedYear}
                                >
                                    <option value="">-- All Months --</option>
                                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                                        <option key={m} value={m}>{new Date(`2000-${m}-01`).toLocaleString('default', { month: 'long' })}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <div className="d-grid gap-2">
                                <Button variant="outline-danger" onClick={handleTxDelete}>
                                    <Trash2 size={16} className="me-2" />
                                    Delete Transactions
                                </Button>
                            </div>
                        </Tab.Pane>

                        {/* Investment Deletion */}
                        <Tab.Pane eventKey="investments">
                            <div className="text-center p-4 bg-light rounded border border-warning-subtle mb-3">
                                <PieChart size={48} className="text-muted mb-3" />
                                <h6 className="fw-bold text-dark">Clear Investment Portfolio</h6>
                                <p className="small text-muted">This will permanently delete all stocks, funds, and assets you've tracked.</p>
                                <Button variant="warning" onClick={() => { onClearInvestments(); onHide(); }}>
                                    Clear Investments
                                </Button>
                            </div>
                        </Tab.Pane>

                        {/* Full Reset */}
                        <Tab.Pane eventKey="reset">
                            <Alert variant="danger">
                                <Alert.Heading className="h6 fw-bold"><AlertTriangle size={18} className="me-2" />Warning</Alert.Heading>
                                <p className="small mb-0">
                                    This action will wipe <strong>everything</strong>: transactions, investments, settings, and your API key preference.
                                    This cannot be undone.
                                </p>
                            </Alert>
                            <div className="d-grid">
                                <Button variant="danger" size="lg" onClick={() => { onClearAll(); onHide(); }}>
                                    Reset Application
                                </Button>
                            </div>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Modal.Body>
        </Modal>
    );
}
