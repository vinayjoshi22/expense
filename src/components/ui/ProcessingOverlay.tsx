import { useEffect, useState } from 'react';
import { ProgressBar } from 'react-bootstrap';
import { Clock, CheckCircle, Loader2 } from 'lucide-react';

export interface ProcessingStatus {
    isActive: boolean;
    currentBatch: number;
    totalBatches: number;
    completedBatches: { batchNum: number; timeMs: number }[];
    startTime: number;
}

interface ProcessingOverlayProps {
    status: ProcessingStatus;
}

export function ProcessingOverlay({ status }: ProcessingOverlayProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (status.isActive) {
            interval = setInterval(() => {
                setElapsed(Date.now() - status.startTime);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [status.isActive, status.startTime]);

    const progress = status.totalBatches > 0 ? Math.round(((status.currentBatch - 1) / status.totalBatches) * 100) : 0;

    return (
        <div className="text-center p-4">
            <div className="mb-4 d-flex justify-content-center">
                <div className="position-relative d-inline-block">
                    <Loader2 size={48} className="text-primary spin" />
                </div>
            </div>

            <h5 className="fw-bold mb-2">Analyzing your documents...</h5>
            <p className="text-muted mb-4">
                Processing Batch {status.currentBatch} of {status.totalBatches}
            </p>

            <div className="mb-3" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <ProgressBar animated now={progress} variant="primary" style={{ height: '8px' }} />
            </div>

            <div className="d-flex justify-content-center gap-3 mb-4 text-muted small">
                <span className="d-flex align-items-center gap-1">
                    <Clock size={14} />
                    Elapsed: {(elapsed / 1000).toFixed(1)}s
                </span>
            </div>

            {/* Batch Log */}
            {status.completedBatches.length > 0 && (
                <div className="mt-3 text-start d-inline-block bg-light p-3 rounded" style={{ minWidth: '300px' }}>
                    <h6 className="small fw-bold text-muted mb-2">Completed Batches:</h6>
                    <ul className="list-unstyled mb-0 small">
                        {status.completedBatches.map((b) => (
                            <li key={b.batchNum} className="mb-1 d-flex justify-content-between align-items-center text-success">
                                <span><CheckCircle size={12} className="me-1" /> Batch {b.batchNum}</span>
                                <span className="font-monospace">{(b.timeMs / 1000).toFixed(1)}s</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
