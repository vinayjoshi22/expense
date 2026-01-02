import { Card, Row, Col } from 'react-bootstrap';
import { formatCurrency } from '../../lib/utils';
import { Wallet, ArrowRight } from 'lucide-react';

interface BalanceCardsProps {
    openingBalance: number;
    closingBalance: number;
    currency: string;
}

export function BalanceCards({ openingBalance, closingBalance, currency }: BalanceCardsProps) {
    return (
        <Row className="g-3 mb-4">
            <Col md={6}>
                <Card className="h-100 shadow-sm border-0 bg-primary bg-opacity-10">
                    <Card.Body className="d-flex align-items-center justify-content-between">
                        <div>
                            <h6 className="text-primary text-uppercase fw-bold small mb-1">Opening Balance</h6>
                            <h3 className="mb-0 fw-bold text-primary">{formatCurrency(openingBalance, currency)}</h3>
                        </div>
                        <div className="bg-primary text-white rounded-circle p-3 d-flex align-items-center justify-content-center bg-opacity-75">
                            <Wallet size={24} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={6}>
                <Card className="h-100 shadow-sm border-0 bg-success bg-opacity-10">
                    <Card.Body className="d-flex align-items-center justify-content-between">
                        <div>
                            <h6 className="text-success text-uppercase fw-bold small mb-1">Closing Balance</h6>
                            <h3 className="mb-0 fw-bold text-success">{formatCurrency(closingBalance, currency)}</h3>
                        </div>
                        <div className="bg-success text-white rounded-circle p-3 d-flex align-items-center justify-content-center bg-opacity-75">
                            <ArrowRight size={24} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
}
