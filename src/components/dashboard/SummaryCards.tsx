import { Card, Row, Col } from 'react-bootstrap';
import { formatCurrency } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

interface SummaryCardsProps {
    income: number;
    expense: number;
    savings: number;
    currency: string;
}

export function SummaryCards({ income, expense, savings, currency }: SummaryCardsProps) {
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

    return (
        <Row className="g-3 mb-3">
            {/* Net Savings */}
            <Col sm={6} lg={4}>
                <Card className="h-100 shadow-sm border-primary">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <Card.Subtitle className="mb-2 text-primary fw-bold">NET SAVINGS</Card.Subtitle>
                                <h2 className="display-6 fw-bold mb-0">{formatCurrency(savings, currency)}</h2>
                                <small className="text-muted">{savingsRate}% savings rate</small>
                            </div>
                            <div className="p-2 bg-primary bg-opacity-10 rounded">
                                <Wallet className="text-primary" size={24} />
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            {/* Income */}
            <Col sm={6} lg={4}>
                <Card className="h-100 shadow-sm border-success">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <Card.Subtitle className="mb-2 text-success fw-bold">INCOME</Card.Subtitle>
                                <h3 className="mb-0">{formatCurrency(income, currency)}</h3>
                                <small className="text-muted">Total Inflow</small>
                            </div>
                            <div className="p-2 bg-success bg-opacity-10 rounded">
                                <ArrowUpRight className="text-success" size={24} />
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            {/* Expense */}
            <Col sm={6} lg={4}>
                <Card className="h-100 shadow-sm border-danger">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <Card.Subtitle className="mb-2 text-danger fw-bold">EXPENSES</Card.Subtitle>
                                <h3 className="mb-0">{formatCurrency(expense, currency)}</h3>
                                <small className="text-muted">
                                    {income > 0 ? (expense / income * 100).toFixed(1) : 0}% of Income
                                </small>
                            </div>
                            <div className="p-2 bg-danger bg-opacity-10 rounded">
                                <ArrowDownRight className="text-danger" size={24} />
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
}
