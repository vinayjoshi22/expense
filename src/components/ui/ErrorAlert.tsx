import { Alert } from 'react-bootstrap';
import type { AppError } from '../../types';

interface ErrorAlertProps {
    error: AppError;
    className?: string; // Kept for compatibility but might not be used heavily
}

export function ErrorAlert({ error }: ErrorAlertProps) {
    return (
        <Alert variant="danger" className="mb-4">
            <Alert.Heading className="h6 fw-bold text-uppercase">{error.title}</Alert.Heading>
            <p className="mb-0 small">{error.message}</p>
            {error.details && (
                <>
                    <hr />
                    <p className="mb-0 font-monospace small text-muted">{error.details}</p>
                </>
            )}
        </Alert>
    );
}
