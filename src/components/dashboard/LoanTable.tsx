import { Card, Table, Badge, Button } from 'react-bootstrap';
import { Trash2 } from 'lucide-react';
import type { Loan } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { EditableCell } from '../ui/EditableCell';

interface LoanTableProps {
    loans: Loan[];
    currency: string;
    onUpdate: (id: string, field: keyof Loan, value: any) => void;
    onDelete?: (id: string) => void;
}

export function LoanTable({ loans, currency, onUpdate, onDelete }: LoanTableProps) {
    if (loans.length === 0) return null;

    return (
        <Card className="shadow-sm border-warning-subtle mb-4">
            <Card.Header className="bg-warning-subtle text-warning-emphasis fw-bold d-flex justify-content-between align-items-center">
                <span>Active Loans / EMIs</span>
                <Badge bg="warning" text="dark" pill>{loans.length} Active</Badge>
            </Card.Header>
            <Card.Body className="p-0">
                <Table hover responsive className="mb-0 text-nowrap align-middle">
                    <thead className="bg-light">
                        <tr>
                            <th className="ps-3 border-0">Description</th>
                            <th className="text-end border-0">Total Amount</th>
                            <th className="text-end border-0">Remaining</th>
                            <th className="text-end border-0">Monthly Installment (EMI)</th>
                            <th className="text-center border-0">Installments Left</th>
                            <th className="text-end pe-3 border-0">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.map(loan => (
                            <tr key={loan.id}>
                                <td className="ps-3 fw-medium">
                                    <EditableCell
                                        value={loan.description}
                                        onSave={(val) => onUpdate(loan.id, 'description', val)}
                                    />
                                </td>
                                <td className="text-end text-muted">
                                    <EditableCell
                                        value={loan.totalAmount}
                                        type="number"
                                        onSave={(val) => onUpdate(loan.id, 'totalAmount', val)}
                                        format={(val) => val > 0 ? formatCurrency(val, currency) : '-'}
                                        className="justify-content-end"
                                    />
                                </td>
                                <td className="text-end fw-bold text-danger">
                                    <EditableCell
                                        value={loan.remainingAmount}
                                        type="number"
                                        onSave={(val) => onUpdate(loan.id, 'remainingAmount', val)}
                                        format={(val) => formatCurrency(val, currency)}
                                        className="justify-content-end"
                                    />
                                </td>
                                <td className="text-end fw-bold">
                                    <EditableCell
                                        value={loan.installmentAmount}
                                        type="number"
                                        onSave={(val) => onUpdate(loan.id, 'installmentAmount', val)}
                                        format={(val) => formatCurrency(val, currency)}
                                        className="justify-content-end"
                                    />
                                </td>
                                <td className="text-center">
                                    <EditableCell
                                        value={loan.remainingInstallments}
                                        type="number"
                                        onSave={(val) => onUpdate(loan.id, 'remainingInstallments', val)}
                                        format={(val) => <Badge bg="secondary" pill>{val} months</Badge>}
                                        className="justify-content-center"
                                    />
                                </td>
                                <td className="text-end pe-3">
                                    {onDelete && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-danger p-0"
                                            onClick={() => onDelete(loan.id)}
                                            style={{ opacity: 0.7 }}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
}
