import { useState, useEffect, useMemo } from 'react';
import { Navbar, Container, Button, Row, Col, Collapse, ProgressBar, Form, InputGroup, Modal } from 'react-bootstrap';
import { FileDrop } from './components/dashboard/FileDrop';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { ExpenseCharts } from './components/dashboard/ExpenseCharts';
import { TransactionTable } from './components/dashboard/TransactionList';
import { ErrorAlert } from './components/ui/ErrorAlert';
import { parseFile } from './lib/parser';
import { analyzeFinancialText } from './lib/llm';
import { loadTransactions, saveTransactions, loadCurrency, saveCurrency, mergeTransactions, clearStorage, loadInvestments, saveInvestments } from './lib/storage';
import type { Transaction, AppError, Investment } from './types';
import { Key, Trash2, Plus, Wallet, ChevronDown, ChevronUp } from 'lucide-react';

import { DashboardControls } from './components/dashboard/DashboardControls';
import { HowItWorksModal } from './components/ui/HowItWorksModal';
import { InvestmentList } from './components/dashboard/InvestmentList';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [investments, setInvestments] = useState<Investment[]>(() => loadInvestments());
  const [currency, setCurrency] = useState<string>(() => loadCurrency());
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [error, setError] = useState<AppError | null>(null);

  // UI States
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter States
  const [selectedYears, setSelectedYears] = useState<Set<string>>(new Set());
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());

  // Save Data on Change
  useEffect(() => {
    if (transactions.length > 0) saveTransactions(transactions);
    saveCurrency(currency);
  }, [transactions, currency]);

  useEffect(() => {
    saveInvestments(investments);
  }, [investments]);

  // Investment Handlers
  const handleAddInvestment = (inv: Omit<Investment, 'id'>) => {
    const newInv: Investment = { ...inv, id: crypto.randomUUID() };
    setInvestments(prev => [...prev, newInv]);
  };

  const handleUpdateInvestment = (id: string, field: keyof Investment, value: any) => {
    setInvestments(prev => prev.map(inv =>
      inv.id === id ? { ...inv, [field]: value } : inv
    ));
  };

  const handleDeleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  // Extract Available Years and Months
  const { availableYears, availableMonths } = useMemo(() => {
    const years = new Set<string>();
    const months = new Set<string>();
    transactions.forEach(t => {
      const date = new Date(t.date);
      years.add(date.getFullYear().toString());
      months.add((date.getMonth() + 1).toString().padStart(2, '0'));
    });
    return {
      availableYears: Array.from(years).sort(),
      availableMonths: Array.from(months).sort()
    };
  }, [transactions]);

  // Initialize/Reset selection when data changes
  useEffect(() => {
    if (availableYears.length > 0) setSelectedYears(new Set(availableYears));
    if (availableMonths.length > 0) setSelectedMonths(new Set(availableMonths));
  }, [availableYears.length, availableMonths.length]);

  const toggleYear = (year: string) => {
    const next = new Set(selectedYears);
    if (next.has(year)) next.delete(year);
    else next.add(year);
    setSelectedYears(next);
  };

  const toggleMonth = (month: string) => {
    const next = new Set(selectedMonths);
    if (next.has(month)) next.delete(month);
    else next.add(month);
    setSelectedMonths(next);
  };

  const selectAllYears = () => setSelectedYears(new Set(availableYears));
  const deselectAllYears = () => setSelectedYears(new Set());

  const selectAllMonths = () => setSelectedMonths(new Set(availableMonths));
  const deselectAllMonths = () => setSelectedMonths(new Set());

  // Filter Data
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return selectedYears.has(year) && selectedMonths.has(month);
    });
  }, [transactions, selectedYears, selectedMonths]);

  const handleFiles = async (files: File[]) => {
    if (!apiKey) {
      setError({ title: "API Key Required", message: "Please provide your Gemini API Key." });
      setShowKeyInput(true);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const newTransactions: Transaction[] = [];
      let detectedCurrency = currency;

      for (const file of files) {
        const text = await parseFile(file);
        const result = await analyzeFinancialText(apiKey, text);
        newTransactions.push(...result.transactions);
        if (result.currency) detectedCurrency = result.currency;
      }

      setTransactions(prev => mergeTransactions(prev, newTransactions));
      setCurrency(detectedCurrency);
      setShowUpload(false);

    } catch (err: any) {
      console.error(err);
      setError({ title: "Analysis Failed", message: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearData = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setTransactions([]);
    setInvestments([]);
    setCurrency('USD');
    clearStorage();
    setShowDeleteConfirm(false);
  };

  const saveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    // Don't auto-close, let user decide when done or if they want to edit
  };

  // Update Transaction Category
  const handleUpdateCategory = (id: string, newCategory: string) => {
    setTransactions(prev => prev.map(t =>
      t.id === id ? { ...t, category: newCategory } : t
    ));
    // Persistence handled by useEffect
  };

  // Calculations (Use filteredTransactions)
  const totalIncome = filteredTransactions.filter((t: Transaction) => t.type === 'credit').reduce((a: number, b: Transaction) => a + b.amount, 0);
  const totalExpense = filteredTransactions.filter((t: Transaction) => t.type === 'debit').reduce((a: number, b: Transaction) => a + b.amount, 0);
  const totalSavings = totalIncome - totalExpense;

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navbar */}
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm py-2 sticky-top">
        <Container fluid>
          <Navbar.Brand className="d-flex align-items-center gap-2 fw-bold">
            <div className="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
              <Wallet size={20} />
            </div>
            ExpenseAnalyzer
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="navbar-nav" />

          <Navbar.Collapse id="navbar-nav">
            <div className="d-flex gap-2 ms-auto align-items-center mt-3 mt-lg-0 flex-wrap">
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => setShowHowItWorks(true)}
                className="text-info border-info me-2"
                style={{ '--bs-btn-color': '#0dcaf0', '--bs-btn-border-color': '#0dcaf0', '--bs-btn-hover-color': '#fff', '--bs-btn-hover-bg': '#0dcaf0' } as React.CSSProperties}
              >
                How this works?
              </Button>

              <Button
                variant={showKeyInput ? "secondary" : "outline-light"}
                size="sm"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="d-flex align-items-center gap-1"
              >
                <Key size={14} />
                {apiKey ? 'API Key' : 'Set Key'}
                {showKeyInput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Button>

              {transactions.length > 0 && (
                <>
                  <Button
                    variant={showUpload ? "light" : "primary"}
                    size="sm"
                    onClick={() => setShowUpload(!showUpload)}
                  >
                    <Plus size={16} className={`me-1 transition-transform ${showUpload ? 'rotate-45' : ''}`} />
                    Add Files
                  </Button>
                  <Button variant="danger" size="sm" onClick={clearData}>
                    <Trash2 size={14} />
                  </Button>
                </>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger h5">⚠️ Irreversible Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to clear all data?</p>
          <p className="text-muted small mb-0">This will remove all stored transactions and settings. This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Clear Everything</Button>
        </Modal.Footer>
      </Modal>

      {/* How It Works Modal */}
      <HowItWorksModal show={showHowItWorks} onHide={() => setShowHowItWorks(false)} />

      {/* Main Container */}
      <Container fluid className="py-3 flex-grow-1">

        {/* Error Alert */}
        {error && <ErrorAlert error={error} />}

        {/* API Key Tray (Inline) */}
        <Collapse in={showKeyInput}>
          <div>
            <div className="bg-dark text-white border border-secondary rounded p-4 mb-4 shadow-sm">
              <Row className="align-items-center">
                <Col md={6}>
                  <h6 className="fw-bold text-primary mb-1">Configuration</h6>
                  <p className="text-white-50 small mb-0">
                    Enter your Gemini API key. It is stored securely in your browser's local storage and not stored/shared anywhere else. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-info text-decoration-none">Get API Key here</a>.
                  </p>
                </Col>
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text className="bg-secondary border-secondary text-white border-end-0">
                      <Key size={16} />
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => saveKey(e.target.value)}
                      className="bg-dark text-white border-secondary border-start-0"
                      style={{ boxShadow: 'none' }}
                    />
                    <Button variant="primary" onClick={() => setShowKeyInput(false)}>Done</Button>
                  </InputGroup>
                </Col>
              </Row>
            </div>
          </div>
        </Collapse>

        {/* Empty State / Hero */}
        {transactions.length === 0 ? (
          <Row className="justify-content-center mt-5">
            <Col md={6} lg={5} className="text-center">
              <h1 className="display-4 fw-bold mb-3">Financial Clarity</h1>
              <p className="lead text-muted mb-5">Upload your bank statements to get started.</p>

              <FileDrop onFilesSelected={handleFiles} isProcessing={isProcessing} />
            </Col>
          </Row>
        ) : (
          <>
            {/* Upload Tray */}
            <Collapse in={showUpload}>
              <div>
                <div className="bg-light border rounded p-3 mb-4 position-relative">
                  <div className="d-flex justify-content-between mb-2">
                    <h6 className="fw-bold text-primary">Add More Statements</h6>
                    <Button variant="close" size="sm" onClick={() => setShowUpload(false)} />
                  </div>
                  <FileDrop onFilesSelected={handleFiles} isProcessing={isProcessing} />
                  {isProcessing && <ProgressBar animated now={100} label="Processing..." className="mt-3" />}
                </div>
              </div>
            </Collapse>

            {/* Dashboard Controls */}
            <DashboardControls
              availableYears={availableYears}
              availableMonths={availableMonths}
              selectedYears={selectedYears}
              selectedMonths={selectedMonths}
              onToggleYear={toggleYear}
              onToggleMonth={toggleMonth}
              onSelectAllYears={selectAllYears}
              onDeselectAllYears={deselectAllYears}
              onSelectAllMonths={selectAllMonths}
              onDeselectAllMonths={deselectAllMonths}
            />

            {/* Dashboard */}
            <SummaryCards income={totalIncome} expense={totalExpense} savings={totalSavings} currency={currency} />

            <Row className="g-3">
              <Col lg={12}>
                <InvestmentList
                  investments={investments}
                  currency={currency}
                  onAdd={handleAddInvestment}
                  onUpdate={handleUpdateInvestment}
                  onDelete={handleDeleteInvestment}
                />
                <ExpenseCharts transactions={filteredTransactions} currency={currency} />
                <TransactionTable
                  transactions={filteredTransactions}
                  currency={currency}
                  onUpdateCategory={handleUpdateCategory}
                />
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
}

export default App;
