import { useState, useEffect, useMemo } from 'react';
import { Navbar, Container, Button, Row, Col, Collapse, Form, InputGroup, Modal, Dropdown } from 'react-bootstrap';
import { FileDrop } from './components/dashboard/FileDrop';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { ExpenseCharts } from './components/dashboard/ExpenseCharts';
import { TransactionTable } from './components/dashboard/TransactionList';
import { ErrorAlert } from './components/ui/ErrorAlert';
import { parseFile } from './lib/parser';
import { analyzeFinancialText, fetchAvailableModels } from './lib/llm';
import { loadTransactions, saveTransactions, loadCurrency, saveCurrency, mergeTransactions, clearStorage, loadInvestments, saveInvestments, mergeInvestments } from './lib/storage';
import type { Transaction, AppError, Investment } from './types';
import { validateAppData, type AppData } from './lib/validator';
import { Key, Trash2, Plus, Wallet, ChevronDown, ChevronUp, Download } from 'lucide-react';

import { DashboardControls } from './components/dashboard/DashboardControls';
import { HowItWorksModal } from './components/ui/HowItWorksModal';
import { InvestmentList } from './components/dashboard/InvestmentList';
import { BulkCategoryModal } from './components/dashboard/BulkCategoryModal';
import { ReviewModal } from './components/dashboard/ReviewModal';
import { ClearDataModal } from './components/dashboard/ClearDataModal';
import { ProcessingOverlay, type ProcessingStatus } from './components/ui/ProcessingOverlay';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [investments, setInvestments] = useState<Investment[]>(() => loadInvestments());
  const [currency, setCurrency] = useState<string>(() => loadCurrency());
  /* isProcessing replaced by processingStatus.isActive */
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [model, setModel] = useState(localStorage.getItem('EA_SELECTED_MODEL') || 'gemini-2.5-flash-lite');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [error, setError] = useState<AppError | null>(null);

  // Load available models when API Key is set
  useEffect(() => {
    if (apiKey) {
      fetchAvailableModels(apiKey).then(models => {
        if (models.length > 0) {
          setAvailableModels(models);
          // If current selected model is NOT in list, revert to first available (safe default) or keep custom if legacy?
          // Actually, let's just keep the user's choice unless it clearly fails, but the dropdown will show valid ones.
        }
      });
    }
  }, [apiKey]);

  // UI States
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showDuplicates, setShowDuplicates] = useState(false);

  // Filter States (Date)
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

  useEffect(() => {
    localStorage.setItem('EA_SELECTED_MODEL', model);
  }, [model]);

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

  // Transaction Delete Logic
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showTxDeleteConfirm, setShowTxDeleteConfirm] = useState(false);
  const [dontAskDeleteAgain, setDontAskDeleteAgain] = useState(() => localStorage.getItem('EA_SKIP_DELETE_WARNING') === 'true');

  const handleDeleteTransaction = (id: string) => {
    if (dontAskDeleteAgain) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    } else {
      setDeleteId(id);
      setShowTxDeleteConfirm(true);
    }
  };

  const confirmTxDelete = (skipFuture: boolean) => {
    if (deleteId) {
      setTransactions(prev => prev.filter(t => t.id !== deleteId));
      if (skipFuture) {
        localStorage.setItem('EA_SKIP_DELETE_WARNING', 'true');
        setDontAskDeleteAgain(true);
      }
      setShowTxDeleteConfirm(false);
      setDeleteId(null);
    }
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
    // 1. Duplicate Mode Logic (Overrides other filters)
    if (showDuplicates) {
      const groups = new Map<string, Transaction[]>();

      // Group all transactions by signature
      transactions.forEach(t => {
        const sig = `${t.description.trim().toLowerCase()}|${t.amount}`;
        const group = groups.get(sig) || [];
        group.push(t);
        groups.set(sig, group);
      });

      // Flatten only groups with > 1 item
      const updates: Transaction[] = [];
      groups.forEach(group => {
        if (group.length > 1) {
          updates.push(...group);
        }
      });

      // Sort by description to keep groups together
      return updates.sort((a, b) => a.description.localeCompare(b.description));
    }

    // 2. Standard Filter Logic
    let result = transactions.filter(t => {
      const date = new Date(t.date);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return selectedYears.has(year) && selectedMonths.has(month);
    });

    // Search Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(t =>
        (t.description || '').toLowerCase().includes(lower) ||
        (t.category || '').toLowerCase().includes(lower) ||
        (t.amount != null ? t.amount.toString() : '').includes(lower) ||
        (t.date || '').includes(lower)
      );
    }

    // Category Filter
    if (categoryFilter !== 'All') {
      result = result.filter(t => t.category === categoryFilter);
    }

    return result;
  }, [transactions, selectedYears, selectedMonths, searchTerm, categoryFilter, showDuplicates]);

  // Unique Categories for Filter Dropdown (Derived from FULL transaction list)
  const allCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return ['All', ...Array.from(cats).sort()];
  }, [transactions]);

  // Expense Card Filter Persistence (Store EXCLUDED categories to handle new ones automatically)
  const [excludedCategories, setExcludedCategories] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('EA_EXPENSE_FILTER_EXCLUDED');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save excluded categories
  useEffect(() => {
    localStorage.setItem('EA_EXPENSE_FILTER_EXCLUDED', JSON.stringify(Array.from(excludedCategories)));
  }, [excludedCategories]);

  // Derived "Selected" categories for UI and Logic
  const expenseCardCategories = useMemo(() => {
    const included = new Set<string>();
    allCategories.forEach(cat => {
      if (cat !== 'All' && cat !== 'Not an expense' && cat !== 'Income' && !excludedCategories.has(cat)) {
        included.add(cat);
      }
    });
    return included;
  }, [allCategories, excludedCategories]);

  const toggleExpenseCategory = (cat: string) => {
    const next = new Set(excludedCategories);
    if (next.has(cat)) next.delete(cat); // If excluded, un-exclude (include)
    else next.add(cat); // If included, exclude
    setExcludedCategories(next);
  };

  const selectAllExpenseCategories = () => setExcludedCategories(new Set()); // Clear exclusions

  const deselectAllExpenseCategories = () => {
    // Exclude ALL valid categories
    const allValid = allCategories.filter(c => c !== 'All' && c !== 'Not an expense' && c !== 'Income');
    setExcludedCategories(new Set(allValid));
  };

  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isActive: false,
    currentBatch: 0,
    totalBatches: 0,
    completedBatches: [],
    startTime: 0
  });

  const handleFiles = async (files: File[]) => {
    // Check for JSON files first (bypass API key check for JSON-only imports)
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));
    const pdfFiles = files.filter(f => !f.name.endsWith('.json'));

    if (pdfFiles.length > 0 && !apiKey) {
      setError({ title: "API Key Required", message: "Please provide your Gemini API Key for PDF analysis." });
      setShowKeyInput(true);
      return;
    }

    setProcessingStatus({
      isActive: true,
      currentBatch: 0,
      totalBatches: 0, // Will update once we know chunks
      completedBatches: [],
      startTime: Date.now()
    });
    setError(null);

    try {
      const newTransactions: Transaction[] = [];
      let detectedCurrency = currency;
      let newInvestments: Investment[] = [];
      const rawTexts: string[] = [];

      // Process JSON Files (No LLM, direct import - skip review? Or review too? User asked for "intermediate step between file upload + LLM parsing", usually imports are trusted. Let's trust JSON for now or just merge them? Spec says "User will review the transactions...". Let's show JSON results in the review preview so they can confirm before merging.)
      for (const file of jsonFiles) {
        const text = await file.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(`Invalid JSON in file: ${file.name}`);
        }

        if (validateAppData(data)) {
          newTransactions.push(...data.transactions);
          if (data.investments) newInvestments.push(...data.investments);
          if (data.currency) detectedCurrency = data.currency;
        }
      }

      // Process PDF Files
      if (pdfFiles.length > 0) {
        // First, get all chunks to know total batches
        let allChunks: string[] = [];
        for (const file of pdfFiles) {
          const chunks = await parseFile(file);
          allChunks.push(...chunks);
        }
        rawTexts.push(...allChunks);

        // Update total batches
        setProcessingStatus(prev => ({ ...prev, totalBatches: allChunks.length, currentBatch: 1 }));

        // Process sequentially
        for (let i = 0; i < allChunks.length; i++) {
          const batchStart = Date.now();
          setProcessingStatus(prev => ({ ...prev, currentBatch: i + 1 }));

          const result = await analyzeFinancialText(apiKey, allChunks[i], model);
          newTransactions.push(...result.transactions);
          if (result.currency) detectedCurrency = result.currency;

          // Log completion
          setProcessingStatus(prev => ({
            ...prev,
            completedBatches: [...prev.completedBatches, { batchNum: i + 1, timeMs: Date.now() - batchStart }]
          }));
        }
      }

      // Instead of merging immediately, trigger Review
      if (newTransactions.length > 0 || newInvestments.length > 0) {
        setReviewData({
          transactions: newTransactions,
          rawTexts, // Only has PDF texts
          newInvestments,
          detectedCurrency
        });
        setShowReviewModal(true);
      } else {
        setError({ title: "No Data Found", message: "Could not extract any transactions." });
      }

    } catch (err: any) {
      console.error(err);
      setError({ title: "Import Failed", message: err.message });
    } finally {
      setProcessingStatus(prev => ({ ...prev, isActive: false }));
    }
  };

  const handleExport = () => {
    const data: AppData = {
      transactions,
      investments,
      currency,
      version: 1
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [showClearDataModal, setShowClearDataModal] = useState(false);

  const handleClearAll = () => {
    setTransactions([]);
    setInvestments([]);
    setCurrency('USD');
    clearStorage();
  };

  const handleClearInvestments = () => {
    setInvestments([]);
  };

  const handleClearTransactions = (year?: string, month?: string) => {
    if (!year && !month) {
      setTransactions([]); // Clear all
      return;
    }

    setTransactions(prev => prev.filter(t => {
      const d = new Date(t.date);
      const tYear = d.getFullYear().toString();
      const tMonth = (d.getMonth() + 1).toString().padStart(2, '0');

      if (year && month) {
        // Delete if matches BOTH
        return !(tYear === year && tMonth === month);
      } else if (year) {
        // Delete if matches YEAR
        return tYear !== year;
      }
      return true;
    }));
  };

  const saveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    // Don't auto-close, let user decide when done or if they want to edit
  };

  // Bulk Modal State
  const [bulkModal, setBulkModal] = useState<{
    show: boolean;
    transaction: Transaction | null;
    newCategory: string;
    matchCountFiltered: number;
    matchCountAll: number;
  }>({ show: false, transaction: null, newCategory: '', matchCountFiltered: 0, matchCountAll: 0 });

  // Update Transaction Helper
  const updateSingleTransaction = (id: string, field: keyof Transaction, value: any) => {
    setTransactions(prev => prev.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  // Update Transaction Field
  const handleUpdateTransaction = (id: string, field: keyof Transaction, value: any) => {
    // If updating category, check for bulk update matches
    if (field === 'category') {
      const targetTx = transactions.find(t => t.id === id);
      if (targetTx) {
        const safeDesc = targetTx.description.trim();
        const matchesAll = transactions.filter(t => t.description.trim() === safeDesc && t.id !== id).length;

        // Recalculate filtered matches based on current filters logic
        // We use filteredTransactions directly as it reflects current UI state
        const matchesFiltered = filteredTransactions.filter(t => t.description.trim() === safeDesc && t.id !== id).length;

        if (matchesAll > 0) {
          setBulkModal({
            show: true,
            transaction: targetTx,
            newCategory: value,
            matchCountFiltered: matchesFiltered + 1, // +1 for self
            matchCountAll: matchesAll + 1 // +1 for self
          });
          return; // Wait for user decision
        }
      }
    }

    // Default: Single update
    updateSingleTransaction(id, field, value);
  };



  const cleanBulkModal = () => setBulkModal({ show: false, transaction: null, newCategory: '', matchCountFiltered: 0, matchCountAll: 0 });

  const confirmBulkUpdate = (mode: 'single' | 'filtered' | 'all') => {
    // ... (existing logic)
    if (!bulkModal.transaction) return;

    const targetDesc = bulkModal.transaction.description.trim();
    const newVal = bulkModal.newCategory;
    const targetId = bulkModal.transaction.id;

    if (mode === 'single') {
      updateSingleTransaction(targetId, 'category', newVal);
    } else if (mode === 'all') {
      setTransactions(prev => prev.map(t =>
        (t.description.trim() === targetDesc || t.id === targetId)
          ? { ...t, category: newVal }
          : t
      ));
    } else if (mode === 'filtered') {
      // Update only those in filteredTransactions AND matching description
      const visibleIds = new Set(filteredTransactions.map(t => t.id));
      setTransactions(prev => prev.map(t =>
        ((visibleIds.has(t.id) && t.description.trim() === targetDesc) || t.id === targetId)
          ? { ...t, category: newVal }
          : t
      ));
    }
    cleanBulkModal();
  };

  const handleAddTransaction = () => {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      description: 'New Transaction',
      amount: 0,
      category: 'Uncategorized',
      type: 'debit'
    };
    // Add to top of list
    setTransactions(prev => [newTx, ...prev]);
  };

  // ... (ReviewModal State)
  const [reviewData, setReviewData] = useState<{ transactions: Transaction[], rawTexts: string[], newInvestments: Investment[], detectedCurrency: string } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Redo Analysis with Feedback
  const handleReviewRedo = async (feedback: string) => {
    if (!reviewData) return;

    setProcessingStatus({
      isActive: true,
      currentBatch: 1,
      totalBatches: reviewData.rawTexts.length,
      completedBatches: [],
      startTime: Date.now()
    });

    try {
      const newTransactions: Transaction[] = [];
      const chunks = reviewData.rawTexts;

      for (let i = 0; i < chunks.length; i++) {
        const batchStart = Date.now();
        setProcessingStatus(prev => ({ ...prev, currentBatch: i + 1 }));

        const result = await analyzeFinancialText(apiKey, chunks[i], model, feedback);
        newTransactions.push(...result.transactions);

        setProcessingStatus(prev => ({
          ...prev,
          completedBatches: [...prev.completedBatches, { batchNum: i + 1, timeMs: Date.now() - batchStart }]
        }));
      }

      setReviewData(prev => prev ? { ...prev, transactions: newTransactions } : null);
    } catch (err: any) {
      console.error(err);
      setError({ title: "Refinement Failed", message: err.message });
    } finally {
      setProcessingStatus(prev => ({ ...prev, isActive: false }));
    }
  };

  const handleReviewApprove = () => {
    if (!reviewData) return;
    setTransactions(prev => mergeTransactions(prev, reviewData.transactions));
    setInvestments(prev => mergeInvestments(prev, reviewData.newInvestments));
    setCurrency(reviewData.detectedCurrency);

    setReviewData(null);
    setShowReviewModal(false);
    setShowUpload(false);
  };

  const handleReviewCancel = () => {
    setReviewData(null);
    setShowReviewModal(false);
  };

  // Calculations (Use filteredTransactions)
  const totalIncome = filteredTransactions.filter((t: Transaction) => t.type === 'credit').reduce((a: number, b: Transaction) => a + b.amount, 0);

  // Standard Expense (Used for Charts - All categories) -> Logic resides in charts/table components directly via filteredTransactions


  // Custom Expense (Used for Summary Card - Filtered by Expense Card Dropdown)
  const totalExpenseCustom = filteredTransactions
    .filter((t: Transaction) => t.type === 'debit' && t.category !== 'Not an expense' && expenseCardCategories.has(t.category))
    .reduce((a: number, b: Transaction) => a + b.amount, 0);

  const totalSavings = totalIncome - totalExpenseCustom; // Net savings should probably reflect the "view" the user has chosen for expenses?
  // User asked: "Only selected category transactions should be included for computing expense... only total expense number should change".
  // This implies Net Savings should also update, otherwise `Income - Expense != Savings` which confuses users.
  // I will use `totalExpenseCustom` for Savings calculation too to maintain consistency in the top row.

  return (
    <div className="min-vh-100 d-flex flex-column">
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

              <Dropdown>
                <Dropdown.Toggle variant="outline-light" size="sm" className="me-2 d-flex align-items-center gap-1">
                  <span className="text-muted small">Model:</span> {model.replace('gemini-', '')}
                </Dropdown.Toggle>
                <Dropdown.Menu align="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <Dropdown.Header>Select Parse Model</Dropdown.Header>
                  {(availableModels.length > 0 ? availableModels : ['gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro']).map(m => (
                    <Dropdown.Item key={m} onClick={() => setModel(m)} active={model === m}>
                      {m}
                      {m === 'gemini-2.5-flash-lite' && <small className="text-muted d-block">Default Lite</small>}
                      {m === 'gemini-1.5-flash' && <small className="text-muted d-block">Fast & Efficient</small>}
                      {m === 'gemini-2.0-flash-exp' && <small className="text-muted d-block">Experimental</small>}
                    </Dropdown.Item>
                  ))}
                  {availableModels.length === 0 && <Dropdown.Item disabled><small>Loading or Check API Key...</small></Dropdown.Item>}
                </Dropdown.Menu>
              </Dropdown>

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
                  <Button variant="danger" size="sm" onClick={() => setShowClearDataModal(true)}>
                    <Trash2 size={14} />
                  </Button>
                </>
              )}
              <Button variant="outline-light" size="sm" onClick={handleExport} title="Export Data">
                <Download size={16} />
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <ClearDataModal
        show={showClearDataModal}
        onHide={() => setShowClearDataModal(false)}
        onClearAll={handleClearAll}
        onClearInvestments={handleClearInvestments}
        onClearTransactions={handleClearTransactions}
        availableYears={availableYears}
      />

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

              <FileDrop onFilesSelected={handleFiles} isProcessing={processingStatus.isActive} />
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
                  <FileDrop onFilesSelected={handleFiles} isProcessing={processingStatus.isActive} />
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
            <SummaryCards
              income={totalIncome}
              expense={totalExpenseCustom}
              savings={totalSavings}
              currency={currency}
              allCategories={allCategories.filter(c => c !== 'All' && c !== 'Not an expense' && c !== 'Income')}
              selectedCategories={expenseCardCategories}
              onToggleCategory={toggleExpenseCategory}
              onSelectAll={selectAllExpenseCategories}
              onDeselectAll={deselectAllExpenseCategories}
            />

            <Row className="g-3">
              <Col lg={12}>
                <InvestmentList
                  investments={investments}
                  currency={currency}
                  onAdd={handleAddInvestment}
                  onUpdate={handleUpdateInvestment}
                  onDelete={handleDeleteInvestment}
                />
                <ExpenseCharts
                  transactions={filteredTransactions.filter(t => t.category !== 'Not an expense')}
                  currency={currency}
                />
                <TransactionTable
                  transactions={filteredTransactions} // Now fully filtered
                  currency={currency}
                  onUpdateTransaction={handleUpdateTransaction}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  categoryFilter={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                  allCategories={allCategories}
                  onDeleteTransaction={handleDeleteTransaction}
                  showDuplicates={showDuplicates}
                  onToggleDuplicates={() => setShowDuplicates(!showDuplicates)}
                  onAddTransaction={handleAddTransaction}
                />
              </Col>
            </Row>
          </>
        )}
      </Container>

      {/* Bulk Update Modal */}
      <BulkCategoryModal
        show={bulkModal.show}
        onHide={cleanBulkModal}
        currentTransactionDescription={bulkModal.transaction?.description || ''}
        newCategory={bulkModal.newCategory}
        onUpdateSingle={() => confirmBulkUpdate('single')}
        onUpdateFiltered={() => confirmBulkUpdate('filtered')}
        onUpdateAll={() => confirmBulkUpdate('all')}
        matchCountFiltered={bulkModal.matchCountFiltered}
        matchCountAll={bulkModal.matchCountAll}
      />

      {/* Review Modal */}
      <ReviewModal
        show={showReviewModal}
        onHide={handleReviewCancel} // Clicking backdrop cancels (or we can enforce specific button, user said "Cancel then ... permanently")
        transactions={reviewData?.transactions || []}
        currency={reviewData?.detectedCurrency || currency}
        processingStatus={processingStatus} // New Prop
        onApprove={handleReviewApprove}
        onCancel={handleReviewCancel}
        onRedo={handleReviewRedo}
      />

      {/* Global Processing Overlay (for initial file load) */}
      <Modal show={processingStatus.isActive && !showReviewModal} centered backdrop="static" keyboard={false}>
        <Modal.Body className="p-0">
          <ProcessingOverlay status={processingStatus} />
        </Modal.Body>
      </Modal>

      {/* Transaction Delete Warning Modal */}
      <Modal show={showTxDeleteConfirm} onHide={() => setShowTxDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 text-danger">Delete Transaction?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this transaction? This action cannot be undone.</p>
          <Form.Check
            type="checkbox"
            label="Don't ask me again"
            id="dont-ask-delete"
            onChange={() => {
              // We handle the actual persistence in the Confirm button click, 
              // but we can just pass the checkbox state to the handler.
              // Actually, let's use a local ref or state for the checkbox if we want to read it on submit?
              // Simplest: The handler accepts a boolean. Logic below.
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTxDeleteConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            const checkbox = document.getElementById('dont-ask-delete') as HTMLInputElement;
            confirmTxDelete(checkbox?.checked || false);
          }}>Delete Permanently</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;
