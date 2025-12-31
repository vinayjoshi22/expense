import { Modal, Button } from 'react-bootstrap';

interface BulkCategoryModalProps {
    show: boolean;
    onHide: () => void;
    currentTransactionDescription: string;
    newCategory: string;
    onUpdateSingle: () => void;
    onUpdateFiltered: () => void;
    onUpdateAll: () => void;
    matchCountFiltered: number;
    matchCountAll: number;
}

export function BulkCategoryModal({
    show,
    onHide,
    currentTransactionDescription,
    newCategory,
    onUpdateSingle,
    onUpdateFiltered,
    onUpdateAll,
    matchCountFiltered,
    matchCountAll
}: BulkCategoryModalProps) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Update Category?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    You changed the category for <strong>"{currentTransactionDescription}"</strong> to <span className="badge bg-primary">{newCategory}</span>.
                </p>
                <p className="text-muted small">
                    Do you want to apply this change to other similar transactions?
                </p>
                <ul>
                    <li><strong>This Transaction Only</strong>: Just this one.</li>
                    <li><strong>Filtered Matching ({matchCountFiltered})</strong>: Matching transactions currently visible in your filter/search.</li>
                    <li><strong>All Matching ({matchCountAll})</strong>: Every transaction with this description in your history.</li>
                </ul>
            </Modal.Body>
            <Modal.Footer className="flex-column align-items-stretch">
                <Button variant="outline-secondary" onClick={onUpdateSingle}>
                    Update This Transaction Only
                </Button>
                {matchCountFiltered > 1 && (
                    <Button variant="outline-primary" onClick={onUpdateFiltered}>
                        Update Visible Matches ({matchCountFiltered})
                    </Button>
                )}
                {matchCountAll > 1 && (
                    <Button variant="primary" onClick={onUpdateAll}>
                        Update All Matches ({matchCountAll})
                    </Button>
                )}
                <Button variant="link" size="sm" onClick={onHide} className="text-muted text-decoration-none mt-2">
                    Cancel (No Change)
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
