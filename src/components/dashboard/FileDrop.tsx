import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { Spinner } from 'react-bootstrap';

interface FileDropProps {
    onFilesSelected: (files: File[]) => void;
    isProcessing: boolean;
}

export function FileDrop({ onFilesSelected, isProcessing }: FileDropProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFilesSelected(acceptedFiles);
        }
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt', '.csv'],
        },
        disabled: isProcessing,
    });

    return (
        <div
            {...getRootProps()}
            className={`p-4 text-center border rounded bg-light ${isDragActive ? 'border-primary bg-white' : 'border-secondary'} ${isProcessing ? 'opacity-50' : ''}`}
            style={{ borderStyle: 'dashed', borderWidth: '2px', cursor: isProcessing ? 'default' : 'pointer' }}
        >
            <input {...getInputProps()} />

            {isProcessing ? (
                <div className="py-4">
                    <Spinner animation="border" variant="primary" role="status" className="mb-3" />
                    <p className="text-muted mb-0">Processing your file...</p>
                </div>
            ) : (
                <div className="py-2">
                    <div className="mb-3 p-3 d-inline-block rounded-circle bg-white shadow-sm text-primary">
                        <Upload size={32} />
                    </div>
                    <h5 className="mb-2">Drag & drop bank statement</h5>
                    <p className="text-muted small mb-0">PDF or Text files supported</p>
                </div>
            )}
        </div>
    );
}
