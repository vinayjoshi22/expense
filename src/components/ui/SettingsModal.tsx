import { Modal, Button, Tab, Tabs, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Moon, Sun, Cloud, Download, Upload, AlertTriangle, CloudOff } from 'lucide-react';
import { useState } from 'react';
import { initGoogleAuth, requestAccessToken, revokeAccessToken } from '../../services/googleDrive';

interface SettingsModalProps {
    show: boolean;
    onHide: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onClearData: (type: 'all' | 'transactions' | 'investments') => void;
    onBackup: () => Promise<void>;
    onRestore: () => Promise<void>;
    onExport: () => void;
    backupStatus: 'idle' | 'backing_up' | 'restoring' | 'success' | 'error';
    lastBackupTime: string | null;
    isConnected: boolean;
    onConnectionChange: (connected: boolean) => void;
}

export function SettingsModal({
    show,
    onHide,
    theme,
    toggleTheme,
    onClearData,
    onBackup,
    onRestore,
    onExport,
    backupStatus,
    lastBackupTime,
    isConnected,
    onConnectionChange
}: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState('general');
    // Hardcoded Client ID as requested by user
    const clientId = localStorage.getItem('EA_GOOGLE_CLIENT_ID') || '823725584934-cp7pfh5i05sra6f73d6522d8be4o61qk.apps.googleusercontent.com';
    // const [isConnected, setIsConnected] = useState(false); // Lifted up

    // Check if connected (mock for now, real check via token existence or similar)
    // Actually, we rely on App.tsx to manage connection state if possible? 
    // For now, simple client-side local check if we have a token? 
    // But token expires. Best to trust 'isConnected' state passed down or just Check Auth on mount.

    const handleConnect = () => {
        if (!clientId) return;
        localStorage.setItem('EA_GOOGLE_CLIENT_ID', clientId);
        initGoogleAuth(clientId, (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                onConnectionChange(true);
            }
        });
        requestAccessToken();
    };

    const handleDisconnect = () => {
        revokeAccessToken();
        onConnectionChange(false);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Settings</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ minHeight: '400px' }}>
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'general')} className="mb-4">
                    <Tab eventKey="general" title="General">
                        <div className="d-flex justify-content-between align-items-center mb-4 p-3 border rounded bg-body-tertiary">
                            <div>
                                <h6 className="mb-1 d-flex align-items-center gap-2">
                                    {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                                    Appearance
                                </h6>
                                <small className="text-muted">Toggle between light and dark mode</small>
                            </div>
                            <Button variant={theme === 'light' ? 'outline-dark' : 'outline-light'} onClick={toggleTheme}>
                                {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                            </Button>
                        </div>
                    </Tab>

                    <Tab eventKey="data" title="Data Management">
                        <Alert variant="warning" className="d-flex align-items-start gap-2">
                            <AlertTriangle size={20} className="mt-1 flex-shrink-0" />
                            <div>
                                <strong>Warning:</strong> Deleting data is permanent and cannot be undone unless you have a backup.
                            </div>
                        </Alert>

                        <div className="d-grid gap-3">
                            <div className="p-3 border rounded d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1">Export Data</h6>
                                    <small className="text-muted">Download all your data as a JSON file.</small>
                                </div>
                                <Button variant="outline-success" onClick={onExport}>
                                    <Download size={18} className="me-2" />
                                    Export JSON
                                </Button>
                            </div>

                            <div className="p-3 border rounded d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1 text-danger">Clear Transactions</h6>
                                    <small className="text-muted">Delete specific or all transactions.</small>
                                </div>
                                <Button variant="outline-danger" onClick={() => onClearData('transactions')}>
                                    Manage
                                </Button>
                            </div>

                            <div className="p-3 border rounded d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1 text-danger">Clear Investments</h6>
                                    <small className="text-muted">Delete all portfolio data.</small>
                                </div>
                                <Button variant="outline-danger" onClick={() => onClearData('investments')}>
                                    Clear
                                </Button>
                            </div>

                            <div className="p-3 border rounded d-flex justify-content-between align-items-center bg-danger-subtle border-danger">
                                <div>
                                    <h6 className="mb-1 text-danger fw-bold">Factory Reset</h6>
                                    <small className="text-danger-emphasis">Wipe everything and reset app.</small>
                                </div>
                                <Button variant="danger" onClick={() => onClearData('all')}>
                                    Reset App
                                </Button>
                            </div>
                        </div>
                    </Tab>

                    <Tab eventKey="backup" title="Backup & Restore">
                        {!isConnected ? (
                            <div className="text-center py-5">
                                <CloudOff size={48} className="text-muted mb-3" />
                                <h5>Connect Google Drive</h5>
                                <p className="text-muted mb-4">
                                    Securely backup your financial data to your personal Google Drive (App Data folder).
                                </p>
                                <div className="mx-auto" style={{ maxWidth: '400px' }}>
                                    <Button variant="primary" disabled={!clientId} onClick={handleConnect} className="w-100">
                                        Connect & Authorize
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-success-subtle border border-success rounded">
                                    <div className="d-flex align-items-center gap-3">
                                        <Cloud size={24} className="text-success" />
                                        <div>
                                            <h6 className="mb-0 text-success-emphasis">Connected to Google Drive</h6>
                                            <small className="text-success-emphasis">
                                                {lastBackupTime ? `Last backup: ${new Date(lastBackupTime).toLocaleString()}` : 'No backup found yet'}
                                            </small>
                                        </div>
                                    </div>
                                    <Button variant="outline-success" size="sm" onClick={handleDisconnect}>Disconnect</Button>
                                </div>

                                <Row className="g-3">
                                    <Col md={6}>
                                        <div className="p-4 border rounded text-center h-100">
                                            <Upload size={32} className="text-primary mb-3" />
                                            <h6>Backup Now</h6>
                                            <p className="small text-muted mb-3">
                                                Manually upload your current data to Google Drive.
                                                (Also happens automatically on changes)
                                            </p>
                                            <Button variant="outline-primary" onClick={onBackup} disabled={backupStatus === 'backing_up' || backupStatus === 'restoring'}>
                                                {backupStatus === 'backing_up' ? <Spinner size="sm" animation="border" /> : 'Start Backup'}
                                            </Button>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="p-4 border rounded text-center h-100">
                                            <Download size={32} className="text-warning mb-3" />
                                            <h6>Restore from Cloud</h6>
                                            <p className="small text-muted mb-3">
                                                Replace local data with the version from Google Drive.
                                            </p>
                                            <Button variant="outline-warning" onClick={onRestore} disabled={backupStatus === 'backing_up' || backupStatus === 'restoring'}>
                                                {backupStatus === 'restoring' ? <Spinner size="sm" animation="border" /> : 'Fetch & Restore'}
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        )}
                    </Tab>
                </Tabs>
            </Modal.Body>
        </Modal>
    );
}
