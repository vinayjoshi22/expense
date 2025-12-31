import { Modal, Button, Accordion, Table, Badge } from 'react-bootstrap';
import { Shield, Server, Database, Key, Upload, FileText, Download, Trash2, Zap } from 'lucide-react';

interface HowItWorksModalProps {
    show: boolean;
    onHide: () => void;
}

export function HowItWorksModal({ show, onHide }: HowItWorksModalProps) {
    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title className="fw-bold">How Expense Analyzer Works</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <div className="mb-4">
                    <h5 className="d-flex align-items-center gap-2 text-primary">
                        <Server size={20} />
                        Local-First Architecture
                    </h5>
                    <p className="text-muted">
                        This application runs entirely in your browser. When you upload a bank statement,
                        the file is parsed <strong>locally on your device</strong>. We do not have a backend server,
                        and your raw files are never stored on any server owned by the developers.
                    </p>
                </div>

                <div className="mb-4">
                    <h5 className="d-flex align-items-center gap-2 text-primary">
                        <Shield size={20} />
                        Data Privacy & The Gemini API
                    </h5>
                    <p className="text-muted">
                        To extract financial data from your statements, the text content is sent securely to
                        Google's Gemini API (using your personal API Key). The API processes the text and returns
                        structured JSON data (transactions), which is then saved to your browser's
                        <code>localStorage</code>.
                    </p>
                </div>

                <div className="alert alert-info border-0 bg-light">
                    <h6 className="d-flex align-items-center gap-2 fw-bold text-dark">
                        <Key size={18} />
                        Preventing Data Training (Privacy Recommended)
                    </h6>
                    <p className="small mb-2">
                        By default, data sent to the free tier of Gemini models <em>may</em> be used by Google to improve their products.
                        If you want to ensure your financial data is <strong>private and NOT used for training</strong>,
                        you should use a <strong>Paid API Key</strong> via Google AI Studio.
                    </p>

                    <Accordion>
                        <Accordion.Item eventKey="0" className="border shadow-none">
                            <Accordion.Header>How to get a Private (Paid) API Key</Accordion.Header>
                            <Accordion.Body className="small text-muted">
                                <ol className="mb-0 ps-3">
                                    <li className="mb-1">Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.</li>
                                    <li className="mb-1">Click on <strong>Settings</strong> or <strong>Billing</strong> in the left sidebar.</li>
                                    <li className="mb-1">Set up a billing account (Pay-as-you-go). The costs are extremely low for personal use (often &lt;$0.10/month).</li>
                                    <li className="mb-1">Create a new API Key in a project linked to this billing account.</li>
                                    <li>Use that key in this app. Google's terms state that data from paid projects is <strong>not used for model training</strong>.</li>
                                </ol>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </div>

                <div className="mb-4">
                    <h5 className="d-flex align-items-center gap-2 text-primary">
                        <Database size={20} />
                        Data Persistence
                    </h5>
                    <p className="text-muted mb-0">
                        Your data persists between sessions using your browser's Local Storage.
                        You can clear this at any time using the <span className="text-danger">Trash Icon</span> in the top right.
                        Clearing data removes it permanently from your device.
                    </p>
                </div>

                <div className="border-top pt-4">
                    <Accordion>
                        <Accordion.Item eventKey="0">
                            <Accordion.Header><strong>📖 App Capabilities & Feature Guide</strong></Accordion.Header>
                            <Accordion.Body>
                                <div className="d-flex flex-column gap-4">

                                    {/* Section 1: Getting Started */}
                                    <div>
                                        <h6 className="fw-bold d-flex align-items-center gap-2 text-dark">
                                            <Upload size={16} className="text-primary" /> Getting Started
                                        </h6>
                                        <p className="small text-muted mb-2">
                                            Start by uploading your financial documents. You can drag & drop files directly onto the landing zone.
                                        </p>
                                        <ul className="small text-muted ps-3 mb-0">
                                            <li><strong>Supported Formats:</strong> PDF (Bank Statements), JSON (Backups), Text, CSV.</li>
                                            <li><strong>Add More:</strong> Use the <span className="badge bg-light text-dark border">+ Add Files</span> button in the navbar to append more statements later.</li>
                                            <li><strong>Deduplication:</strong> Smart logic prevents duplicate investments from being added if you re-upload files.</li>
                                        </ul>
                                    </div>

                                    {/* Section 2: Smart Transactions */}
                                    <div>
                                        <h6 className="fw-bold d-flex align-items-center gap-2 text-dark">
                                            <FileText size={16} className="text-success" /> Transaction Management
                                        </h6>
                                        <p className="small text-muted mb-2">
                                            Your transaction table is fully interactive. Click any cell to edit it directly.
                                        </p>
                                        <Table size="sm" bordered hover className="small mb-2">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-bold bg-light">Search</td>
                                                    <td>Type in the global search bar to instantly filter by date, description, category, or amount.</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold bg-light">Edit</td>
                                                    <td>Click Date, Description, Category, or Amount to modify. Changes save automatically.</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold bg-light">Sort</td>
                                                    <td>Click any column header (Date, Amount, etc.) to sort ascending or descending.</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold bg-light">Filter</td>
                                                    <td>Use the dropdowns to filter by Category, Month, or Year.</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>

                                    {/* Section 3: Smart Automations */}
                                    <div>
                                        <h6 className="fw-bold d-flex align-items-center gap-2 text-dark">
                                            <Zap size={16} className="text-warning" /> Smart Automations
                                        </h6>
                                        <ul className="small text-muted ps-3 mb-0">
                                            <li className="mb-1">
                                                <strong>Bulk Updates:</strong> Change a category for one transaction (e.g., "Uber" &rarr; "Transport"), and the app will ask if you want to update <em>all</em> matching "Uber" transactions instantly.
                                            </li>
                                            <li className="mb-1">
                                                <strong>Exclusion Logic:</strong> Categorize a transaction as <Badge bg="light" text="dark" className="border">Not an expense</Badge> (e.g., credit card payments, transfers) to exclude it from your total expense calculations and charts.
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Section 4: Data Management */}
                                    <div>
                                        <h6 className="fw-bold d-flex align-items-center gap-2 text-dark">
                                            <Database size={16} className="text-info" /> Data Management
                                        </h6>
                                        <ul className="small text-muted ps-3 mb-0">
                                            <li className="mb-1">
                                                <strong><Download size={14} /> Export Backup:</strong> Download your entire dataset (Transactions + Investments + Settings) as a JSON file. Use this to move data between devices or keep a personal backup.
                                            </li>
                                            <li className="mb-1">
                                                <strong><Upload size={14} /> Import Backup:</strong> Drag & drop your JSON backup file to restore your data instantly (no API key required).
                                            </li>
                                            <li>
                                                <strong><Trash2 size={14} /> Clear Data:</strong> A "Clear Data" button allows you to wipe everything and start fresh.
                                            </li>
                                        </ul>
                                    </div>

                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={onHide}>Got it</Button>
            </Modal.Footer>
        </Modal>
    );
}
