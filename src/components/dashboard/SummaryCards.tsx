import { Card, Row, Col, Dropdown, Form, Button } from 'react-bootstrap';
import { formatCurrency } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight, Wallet, Filter } from 'lucide-react';

interface SummaryCardsProps {
    income: number;
    expense: number;
    savings: number;
    currency: string;
    allCategories: string[];
    selectedCategories: Set<string>;
    onToggleCategory: (cat: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    investmentTotal: number;
    allInvestmentTypes: string[];
    selectedInvestmentTypes: Set<string>;
    onToggleInvestmentType: (type: string) => void;
    onSelectAllInvestments: () => void;
    onDeselectAllInvestments: () => void;
}

export function SummaryCards({
    income,
    expense,
    savings,
    currency,
    allCategories,
    selectedCategories,
    onToggleCategory,
    onSelectAll,
    onDeselectAll,
    investmentTotal,
    allInvestmentTypes,
    selectedInvestmentTypes,
    onToggleInvestmentType,
    onSelectAllInvestments,
    onDeselectAllInvestments
}: SummaryCardsProps) {
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

    return (
        <Row className="g-3 mb-3">
            {/* Net Savings */}
            <Col sm={6} lg={3}>
                <Card className="h-100 shadow-sm border-primary bg-body">
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
            <Col sm={6} lg={3}>
                <Card className="h-100 shadow-sm border-success bg-body">
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

            {/* Investments */}
            <Col sm={6} lg={3}>
                <Card className="h-100 shadow-sm border-warning bg-body">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Card.Subtitle className="text-warning fw-bold mb-0">INVESTMENTS</Card.Subtitle>
                                    <Dropdown autoClose="outside">
                                        <Dropdown.Toggle as={Button} variant="link" size="sm" className="p-0 text-body-secondary border-0 no-caret">
                                            <Filter size={16} />
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu className="p-3 shadow" style={{ minWidth: '250px', maxHeight: '300px', overflowY: 'auto' }}>
                                            <div className="d-flex justify-content-between mb-2">
                                                <small className="fw-bold text-muted">Filter Categories</small>
                                                <div className="d-flex gap-2">
                                                    <Button variant="link" size="sm" className="p-0 text-decoration-none" style={{ fontSize: '0.8rem' }} onClick={onSelectAllInvestments}>All</Button>
                                                    <Button variant="link" size="sm" className="p-0 text-decoration-none" style={{ fontSize: '0.8rem' }} onClick={onDeselectAllInvestments}>None</Button>
                                                </div>
                                            </div>
                                            <hr className="my-1" />
                                            {allInvestmentTypes.map(type => (
                                                <Form.Check
                                                    key={type}
                                                    type="checkbox"
                                                    id={`filter-inv-${type}`}
                                                    label={type}
                                                    checked={selectedInvestmentTypes.has(type)}
                                                    onChange={() => onToggleInvestmentType(type)}
                                                    className="mb-1"
                                                />
                                            ))}
                                            {allInvestmentTypes.length === 0 && <small className="text-muted">No investment types found.</small>}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                                <h3 className="mb-0">{formatCurrency(investmentTotal, currency)}</h3>
                                <small className="text-muted">
                                    {income > 0 ? (investmentTotal / income * 100).toFixed(1) : 0}% of Income
                                </small>
                            </div>
                            <div className="p-2 bg-warning bg-opacity-10 rounded ms-3">
                                <ArrowUpRight className="text-warning" size={24} />
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            {/* Expense */}
            <Col sm={6} lg={3}>
                <Card className="h-100 shadow-sm border-danger bg-body">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Card.Subtitle className="text-danger fw-bold mb-0">EXPENSES</Card.Subtitle>
                                    <Dropdown autoClose="outside">
                                        <Dropdown.Toggle as={Button} variant="link" size="sm" className="p-0 text-body-secondary border-0 no-caret">
                                            <Filter size={16} />
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu className="p-3 shadow" style={{ minWidth: '250px', maxHeight: '300px', overflowY: 'auto' }}>
                                            <div className="d-flex justify-content-between mb-2">
                                                <small className="fw-bold text-muted">Filter Categories</small>
                                                <div className="d-flex gap-2">
                                                    <Button variant="link" size="sm" className="p-0 text-decoration-none" style={{ fontSize: '0.8rem' }} onClick={onSelectAll}>All</Button>
                                                    <Button variant="link" size="sm" className="p-0 text-decoration-none" style={{ fontSize: '0.8rem' }} onClick={onDeselectAll}>None</Button>
                                                </div>
                                            </div>
                                            <hr className="my-1" />
                                            {allCategories.map(cat => (
                                                <Form.Check
                                                    key={cat}
                                                    type="checkbox"
                                                    id={`filter-${cat}`}
                                                    label={cat}
                                                    checked={selectedCategories.has(cat)}
                                                    onChange={() => onToggleCategory(cat)}
                                                    className="mb-1"
                                                />
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                                <h3 className="mb-0">{formatCurrency(expense, currency)}</h3>
                                <small className="text-muted">
                                    {income > 0 ? (expense / income * 100).toFixed(1) : 0}% of Income
                                </small>
                            </div>
                            <div className="p-2 bg-danger bg-opacity-10 rounded ms-3">
                                <ArrowDownRight className="text-danger" size={24} />
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
}
