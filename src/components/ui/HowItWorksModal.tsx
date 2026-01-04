import { Modal, Button, Accordion, Badge, Tab, Tabs, Row, Col } from 'react-bootstrap';
import { Server, Database, Key, Upload, FileText, Zap, Cloud, Smartphone, Laptop, CreditCard, TrendingUp, AlertTriangle, Code } from 'lucide-react';

interface HowItWorksModalProps {
    show: boolean;
    onHide: () => void;
}

export function HowItWorksModal({ show, onHide }: HowItWorksModalProps) {
    return (
        <Modal show={show} onHide={onHide} size="xl" centered scrollable>
            <Modal.Header closeButton className="bg-body-tertiary">
                <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                    <Database size={24} className="text-primary" />
                    How Expense Analyzer Works
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                <div className="p-4 bg-primary-subtle border-bottom">
                    <h5 className="d-flex align-items-center gap-2 text-primary-emphasis mb-3">
                        <Server size={20} />
                        Local-First & Private Architecture
                    </h5>
                    <Row className="g-4">
                        <Col md={6}>
                            <p className="small text-muted mb-0">
                                <strong>Your Privacy comes first.</strong> This application runs entirely in your browser.
                                When you upload a bank statement, the file is parsed <strong>locally on your device</strong>.
                                We do not have a backend server, and your raw files are never stored on any server owned by the developers.
                            </p>
                        </Col>
                        <Col md={6}>
                            <p className="small text-muted mb-0">
                                To extract financial data, text is sent securely to <strong>Google's Gemini API</strong> (using your API Key).
                                Structured data is returned and saved to your browser's <code>localStorage</code>.
                            </p>
                        </Col>
                    </Row>
                </div>

                <div className="p-4">
                    <Tabs defaultActiveKey="features" className="mb-4" justify variant="pills">
                        <Tab eventKey="features" title="✨ Feature Guide">
                            <Accordion defaultActiveKey="0" className="shadow-sm">
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header>
                                        <div className="d-flex align-items-center gap-2">
                                            <Cloud size={18} className="text-primary" />
                                            <strong>Backup & Cross-Device Sync</strong>
                                            <Badge bg="primary" pill className="ms-auto me-3">New!</Badge>
                                        </div>
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        <div className="d-flex flex-column gap-3">
                                            <p className="text-muted small">
                                                Since we don't have a central server, your data lives on your device. To access it across multiple devices (e.g., Laptop &rarr; Phone), use our <strong>Google Drive Backup</strong> feature.
                                            </p>

                                            <div className="p-3 bg-body-tertiary border rounded">
                                                <h6 className="fw-bold text-body-emphasis mb-3">How to Sync Data across Devices</h6>

                                                <div className="d-flex flex-column flex-md-row gap-4 align-items-start">
                                                    <div className="flex-1">
                                                        <div className="d-flex align-items-center gap-2 text-primary mb-2">
                                                            <Laptop size={20} />
                                                            <strong>Step 1: On Device A (Source)</strong>
                                                        </div>
                                                        <ol className="small text-muted ps-3">
                                                            <li>Open <strong>Settings</strong> <span className="text-secondary">(Gear Icon)</span>.</li>
                                                            <li>Go to the <strong>Backup & Restore</strong> tab.</li>
                                                            <li>Click <strong>Connect Google Drive</strong> and authorize access.</li>
                                                            <li>Click <strong>Backup Now</strong>. This saves a secure snapshot to your private Google Drive App Data folder.</li>
                                                        </ol>
                                                    </div>

                                                    <div className="d-none d-md-block border-end align-self-stretch mx-2"></div>

                                                    <div className="flex-1">
                                                        <div className="d-flex align-items-center gap-2 text-primary mb-2">
                                                            <Smartphone size={20} />
                                                            <strong>Step 2: On Device B (Target)</strong>
                                                        </div>
                                                        <ol className="small text-muted ps-3">
                                                            <li>Open the app on your second device.</li>
                                                            <li>Go to <strong>Settings</strong> &rarr; <strong>Backup & Restore</strong>.</li>
                                                            <li>Connect the <strong>same Google Account</strong>.</li>
                                                            <li>Click <strong>Restore from Cloud</strong>.</li>
                                                        </ol>
                                                        <AlertTriangle size={14} className="text-warning me-1" />
                                                        <span className="small text-warning-emphasis">
                                                            Restoring will overwrite current data on this device!
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Item>

                                <Accordion.Item eventKey="1">
                                    <Accordion.Header>
                                        <div className="d-flex align-items-center gap-2">
                                            <CreditCard size={18} className="text-warning" />
                                            <strong>Loans & EMI Tracking</strong>
                                        </div>
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        <p className="small text-muted">
                                            Track your active loans and visualize your debt reduction journey.
                                        </p>
                                        <ul className="small text-muted">
                                            <li><strong>Manual Entry:</strong> Add loans manually or let the text parser identify them (coming soon).</li>
                                            <li><strong>EMI Breakdown:</strong> View remaining installments, total outstanding amount, and monthly commitments.</li>
                                            <li><strong>Progress:</strong> As you pay off loans, update the "Remaining Amount" to see your burden decrease.</li>
                                        </ul>
                                    </Accordion.Body>
                                </Accordion.Item>

                                <Accordion.Item eventKey="2">
                                    <Accordion.Header>
                                        <div className="d-flex align-items-center gap-2">
                                            <TrendingUp size={18} className="text-success" />
                                            <strong>Investments Portfolio</strong>
                                        </div>
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        <p className="small text-muted">
                                            Manage your assets alongside your expenses to see your true Net Worth.
                                        </p>
                                        <ul className="small text-muted">
                                            <li><strong>Asset Classes:</strong> Categorize investments into Stocks, Mutual Funds, Real Estate, Gold, etc.</li>
                                            <li><strong>Interactive Table:</strong> Identify smart opportunities by sorting your portfolio.</li>
                                            <li><strong>Total Value:</strong> Your total investment value is calculated automatically and displayed on the dashboard.</li>
                                        </ul>
                                    </Accordion.Body>
                                </Accordion.Item>

                                <Accordion.Item eventKey="3">
                                    <Accordion.Header>
                                        <div className="d-flex align-items-center gap-2">
                                            <FileText size={18} className="text-info" />
                                            <strong>Smart Transactions & Automations</strong>
                                        </div>
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        <div className="mb-3">
                                            <h6 className="fw-bold d-flex align-items-center gap-2 text-body-emphasis">
                                                <Upload size={16} className="text-primary" /> Supported Formats
                                            </h6>
                                            <p className="small text-muted mb-2">
                                                Drag & Drop <strong>PDF Bank Statements</strong>, CSVs, or text files directly.
                                            </p>
                                            <Accordion className="mt-2">
                                                <Accordion.Item eventKey="json-format" className="border shadow-none bg-body">
                                                    <Accordion.Header>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Code size={16} className="text-muted" />
                                                            <small>View JSON Format (for developers)</small>
                                                        </div>
                                                    </Accordion.Header>
                                                    <Accordion.Body className="bg-body-tertiary p-3">
                                                        <p className="small text-muted mb-2">
                                                            You can import a JSON file with the following structure.
                                                            This is useful for restoring backups or migrating data.
                                                        </p>
                                                        <pre className="small bg-dark text-light p-3 rounded mb-0" style={{ fontSize: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                                                            {`{
  "version": 1,
  "currency": "INR",
  "transactions": [
    {
      "id": "uuid-string",
      "date": "2024-03-15",
      "description": "GROCERY STORE",
      "amount": 1500.00,
      "type": "debit",
      "category": "Food"
    }
  ],
  "investments": [
    {
      "id": "uuid-string",
      "name": "Nifty 50 ETF",
      "type": "Mutual Fund",
      "amount": 50000,
      "date": "2024-01-10",
      "currency": "INR"
    }
  ],
  "loans": [],
  "sources": ["statement_mar24.pdf"]
}`}
                                                        </pre>
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            </Accordion>
                                        </div>

                                        <div className="mb-3">
                                            <h6 className="fw-bold d-flex align-items-center gap-2 text-body-emphasis">
                                                <Zap size={16} className="text-warning" /> Smart Automations
                                            </h6>
                                            <ul className="small text-muted ps-3 mb-0">
                                                <li className="mb-1">
                                                    <strong>Bulk Updates:</strong> Rename a category (e.g., "Uber" &rarr; "Transport"), and update all matching past & future transactions instantly.
                                                </li>
                                                <li className="mb-1">
                                                    <strong>Exclusion Logic:</strong> Mark transfers or credit card payments as <Badge bg="secondary" className="border">Not an expense</Badge> to exclude them from totals.
                                                </li>
                                            </ul>
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </Tab>

                        <Tab eventKey="privacy" title="🔒 API & Privacy">
                            <div className="p-3 border rounded bg-body-tertiary">
                                <h6 className="d-flex align-items-center gap-2 fw-bold text-body-emphasis">
                                    <Key size={18} />
                                    Preventing Data Training
                                </h6>
                                <p className="small mb-3 text-muted">
                                    By default, data sent to the free tier of Gemini models <em>may</em> be used by Google.
                                    For <strong>maximum privacy</strong>, use a paid API key.
                                </p>

                                <Accordion>
                                    <Accordion.Item eventKey="0" className="border shadow-none bg-body">
                                        <Accordion.Header>How to get a Private (Paid) API Key</Accordion.Header>
                                        <Accordion.Body className="small text-muted">
                                            <ol className="mb-0 ps-3">
                                                <li className="mb-1">Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.</li>
                                                <li className="mb-1">Click on <strong>Settings</strong> or <strong>Billing</strong> in the left sidebar.</li>
                                                <li className="mb-1">Set up a billing account (Pay-as-you-go). Costs are minimal (&lt;$0.10/month for personal use).</li>
                                                <li className="mb-1">Create a new API Key in this project.</li>
                                                <li>Google's terms state that data from paid projects is <strong>not used for model training</strong>.</li>
                                            </ol>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Accordion>
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </Modal.Body>
            <Modal.Footer className="bg-body-tertiary">
                <Button variant="outline-secondary" onClick={onHide}>Close</Button>
                <Button variant="primary" onClick={onHide}>Got it, thanks!</Button>
            </Modal.Footer>
        </Modal>
    );
}
