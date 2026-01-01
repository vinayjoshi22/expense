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
            'application/json': ['.json'],
        },
        disabled: isProcessing,
    });

    return (
        <div
            {...getRootProps()}
            className={`p-4 text-center border rounded transition-all ${isDragActive ? 'border-primary bg-body-tertiary' : 'border-secondary bg-body-secondary'} ${isProcessing ? 'opacity-50' : ''}`}
            style={{ borderStyle: 'dashed', borderWidth: '2px', cursor: isProcessing ? 'default' : 'pointer' }}
        >
            <input {...getInputProps()} />

            {isProcessing ? (
                <div className="py-4">
                    <Spinner animation="border" variant="primary" role="status" className="mb-3" />
                    <p className="text-body-secondary mb-0">Processing your file...</p>
                </div>
            ) : (
                <div className="py-2">
                    <div className="mb-3 p-3 d-inline-block rounded-circle bg-body shadow-sm text-primary">
                        <Upload size={32} />
                    </div>
                    <h5 className="mb-2 text-body">Drag & drop bank statement</h5>
                    <p className="text-body-secondary small mb-0">PDF, JSON, or Text files supported</p>
                </div>
            )}
        </div>
    );
}
