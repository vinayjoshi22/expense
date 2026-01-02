import React from 'react';
import { ComposedChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card } from 'react-bootstrap';
import type { Transaction } from '../../types';
import { formatCurrency, formatCompactNumber } from '../../lib/utils';

interface ExpenseChartsProps {
    transactions: Transaction[];
    currency: string;
    hideHorizontal?: boolean;
}

export function ExpenseCharts({ transactions, currency, hideHorizontal }: ExpenseChartsProps) {
    // Note: transactions passed here are already filtered by the parent App component

    // Process Data for Category Chart (Dual Axis)
    const categoryData = React.useMemo(() => {
        const map = new Map<string, number>();
        let total = 0;

        transactions.filter(t => t.type === 'debit').forEach(t => {
            const current = map.get(t.category) || 0;
            map.set(t.category, current + t.amount);
            total += t.amount;
        });

        return Array.from(map.entries())
            .map(([name, value]) => ({
                name,
                value,
                percentage: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [transactions]);

    // Process Data for Bar Chart (Monthly)
    const monthlyData = React.useMemo(() => {
        const map = new Map<string, { name: string, income: number, expense: number }>();

        transactions.forEach(t => {
            const monthKey = t.date.substring(0, 7); // YYYY-MM
            if (!map.has(monthKey)) {
                map.set(monthKey, { name: monthKey, income: 0, expense: 0 });
            }
            const entry = map.get(monthKey)!;
            if (t.type === 'credit') entry.income += t.amount;
            else entry.expense += t.amount;
        });

        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [transactions]);

    if (transactions.length === 0) {
        return (
            <div className="text-center p-5 bg-body-tertiary rounded border text-muted mb-3">
                <h5>No Data available for selected month year</h5>
                <p className="mb-0">Try adjusting your filters to see visualization.</p>
            </div>
        );
    }

    const colClass = hideHorizontal ? "col-lg-6" : "col-lg-4";

    return (
        <div className="mb-3">
            <div className="row g-4">
                {/* Category Breakdown (Dual Axis) */}
                <div className={colClass}>
                    <Card className="shadow-sm h-100 bg-body">
                        <Card.Header className="bg-body py-3 fw-bold text-secondary">Expense Breakdown</Card.Header>
                        <Card.Body>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <ComposedChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" scale="point" padding={{ left: 10, right: 10 }} />
                                        <YAxis yAxisId="left" tickFormatter={(v) => formatCompactNumber(v)} />
                                        <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} />
                                        <RechartsTooltip
                                            formatter={(value: any, name: any) => {
                                                if (name === 'Amount') return formatCurrency(Number(value), currency);
                                                if (name === 'Share') return `${value}%`;
                                                return value;
                                            }}
                                        />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="value" name="Amount" fill="#0d6efd" barSize={20} />
                                        <Line yAxisId="right" type="monotone" dataKey="percentage" name="Share" stroke="#ffc107" strokeWidth={2} dot={{ r: 4 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                {/* Monthly Trends */}
                <div className={colClass}>
                    <Card className="shadow-sm h-100 bg-body">
                        <Card.Header className="bg-body py-3 fw-bold text-secondary">Cash Flow Trends</Card.Header>
                        <Card.Body>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={(v) => formatCompactNumber(v)} />
                                        <RechartsTooltip formatter={(value) => formatCurrency(Number(value), currency)} />
                                        <Legend />
                                        <Bar dataKey="income" fill="#198754" name="Income" />
                                        <Bar dataKey="expense" fill="#dc3545" name="Expenses" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                {/* Horizontal Category Breakdown */}
                {!hideHorizontal && (
                    <div className="col-lg-4">
                        <Card className="shadow-sm h-100 bg-body">
                            <Card.Header className="bg-body py-3 fw-bold text-secondary">Expense (Horizontal)</Card.Header>
                            <Card.Body>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <ComposedChart
                                            data={categoryData}
                                            layout="vertical"
                                            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" xAxisId="left" tickFormatter={(v) => formatCompactNumber(v)} />
                                            <XAxis type="number" xAxisId="right" orientation="top" unit="%" domain={[0, 100]} hide />
                                            <YAxis dataKey="name" type="category" width={80} />
                                            <RechartsTooltip
                                                formatter={(value: any, name: any) => {
                                                    if (name === 'Amount') return formatCurrency(Number(value), currency);
                                                    if (name === 'Share') return `${value}%`;
                                                    return value;
                                                }}
                                            />
                                            <Legend />
                                            <Bar xAxisId="left" dataKey="value" name="Amount" fill="#6610f2" barSize={20} />
                                            <Line xAxisId="right" type="monotone" dataKey="percentage" name="Share" stroke="#ffc107" strokeWidth={2} dot={{ r: 4 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
