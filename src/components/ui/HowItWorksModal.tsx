import { Modal, Button, Accordion } from 'react-bootstrap';
import { Shield, Server, Database, Key } from 'lucide-react';

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

                <div className="mb-0">
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
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={onHide}>Got it</Button>
            </Modal.Footer>
        </Modal>
    );
}
