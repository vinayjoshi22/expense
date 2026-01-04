import { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar, Container, Button, Row, Col, Collapse, Form, InputGroup, Modal, Dropdown, Toast, ToastContainer } from 'react-bootstrap';
import { FileDrop } from './components/dashboard/FileDrop';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { ExpenseCharts } from './components/dashboard/ExpenseCharts';
import { TransactionTable } from './components/dashboard/TransactionList';
import { ErrorAlert } from './components/ui/ErrorAlert';
import { parseFile } from './lib/parser';
import { analyzeFinancialText, fetchAvailableModels } from './lib/llm';
import { BalanceCards } from './components/dashboard/BalanceCards';
import { LoanTable } from './components/dashboard/LoanTable';
import { loadTransactions, saveTransactions, loadCurrency, saveCurrency, mergeTransactions, clearStorage, loadInvestments, saveInvestments, mergeInvestments, loadSources, saveSources, loadBalances, saveBalances, mergeBalances, loadCcTransactions, saveCcTransactions, loadLoans, saveLoans, mergeLoans } from './lib/storage';
import type { Transaction, AppError, Investment, StatementBalance, Loan } from './types';
import { validateAppData, type AppData } from './lib/validator';
import { saveAs } from 'file-saver';
import { Key, Plus, Wallet, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { loadGoogleScripts, uploadBackup, downloadBackup, initGoogleAuth } from './services/googleDrive';
import { SettingsModal } from './components/ui/SettingsModal';

import { DashboardControls } from './components/dashboard/DashboardControls';
import { HowItWorksModal } from './components/ui/HowItWorksModal';
import { InvestmentList } from './components/dashboard/InvestmentList';
import { BulkCategoryModal } from './components/dashboard/BulkCategoryModal';
import { ReviewModal } from './components/dashboard/ReviewModal';
import { ClearDataModal } from './components/dashboard/ClearDataModal';
import { ProcessingOverlay, type ProcessingStatus } from './components/ui/ProcessingOverlay';
import { ScrollToTop } from './components/ui/ScrollToTop';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [ccTransactions, setCcTransactions] = useState<Transaction[]>(() => loadCcTransactions());
  const [investments, setInvestments] = useState<Investment[]>(() => loadInvestments());
  const [loans, setLoans] = useState<Loan[]>(() => loadLoans());
  const [balances, setBalances] = useState<StatementBalance[]>(() => loadBalances());

  const [currency, setCurrency] = useState<string>(() => loadCurrency());
  const [sources, setSources] = useState<string[]>(() => loadSources());
  /* isProcessing replaced by processingStatus.isActive */
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [model, setModel] = useState(localStorage.getItem('EA_SELECTED_MODEL') || 'gemini-2.5-flash-lite');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [error, setError] = useState<AppError | null>(null);

  // Notification Toast State
  const [notification, setNotification] = useState<{ show: boolean, title: string, message: string }>({ show: false, title: '', message: '' });

  // Google Drive Integration State
  const [isConnected, setIsConnected] = useState(localStorage.getItem('EA_GOOGLE_CONNECTED') === 'true');
  const googleClientId = localStorage.getItem('EA_GOOGLE_CLIENT_ID') || '823725584934-cp7pfh5i05sra6f73d6522d8be4o61qk.apps.googleusercontent.com';

  // Load available models when API Key is set
  useEffect(() => {
    // ... (existing effect code, assume handled by context or diff)
    if (apiKey) {
      fetchAvailableModels(apiKey).then(models => {
        if (models.length > 0) {
          setAvailableModels(models);
        }
      });
    }
  }, [apiKey]);

  // UI States
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);

  // Backup State
  const [backupStatus, setBackupStatus] = useState<'idle' | 'backing_up' | 'restoring' | 'success' | 'error'>('idle');
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(localStorage.getItem('EA_LAST_BACKUP_TIME'));

  useEffect(() => {
    // Load Google Drive Scripts
    loadGoogleScripts(() => {
      console.log('Google Scripts Loaded');
      // If previously connected, initialize auth silently to be ready for token requests
      if (isConnected) {
        initGoogleAuth(googleClientId, (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            setIsConnected(true);
          }
        });
        // We don't call requestAccessToken() here to avoid popup on load. 
        // It will be called on-demand by uploadBackup/downloadBackup if token is missing (needs wrapper update) 
        // OR we rely on user clicking "Connect" again if actual token expired.
        // But to fix "asking every time", we at least keep isConnected=true so UI doesn't show "Connect".
      }
    });
  }, [isConnected]);

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
    saveCcTransactions(ccTransactions);
  }, [ccTransactions]);

  useEffect(() => {
    saveInvestments(investments);
  }, [investments]);

  useEffect(() => {
    saveBalances(balances);
  }, [balances]);

  useEffect(() => {
    saveLoans(loans);
  }, [loans]);

  useEffect(() => {
    saveSources(sources);
  }, [sources]);

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
  const [deleteTarget, setDeleteTarget] = useState<'bank' | 'cc'>('bank');
  const [showTxDeleteConfirm, setShowTxDeleteConfirm] = useState(false);
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('EA_THEME') as 'light' | 'dark') || 'light');

  const ccSectionRef = useRef<HTMLDivElement>(null);
  const scrollToCc = () => ccSectionRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('EA_THEME', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const [dontAskDeleteAgain, setDontAskDeleteAgain] = useState(() => localStorage.getItem('EA_SKIP_DELETE_WARNING') === 'true');

  const handleDeleteTransaction = (id: string, type: 'bank' | 'cc' = 'bank') => {
    if (dontAskDeleteAgain) {
      if (type === 'cc') {
        setCcTransactions(prev => prev.filter(t => t.id !== id));
      } else {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    } else {
      setDeleteId(id);
      setDeleteTarget(type);
      setShowTxDeleteConfirm(true);
    }
  };

  const confirmTxDelete = (skipFuture: boolean) => {
    if (deleteId) {
      if (deleteTarget === 'cc') {
        setCcTransactions(prev => prev.filter(t => t.id !== deleteId));
      } else {
        setTransactions(prev => prev.filter(t => t.id !== deleteId));
      }

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

  // Source Filtering (Persistence)
  const [selectedSources, setSelectedSources] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('EA_SOURCE_FILTER');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Unique Sources
  const availableSources = useMemo(() => {
    const s = new Set(transactions.map(t => t.source || ''));
    return Array.from(s).sort();
  }, [transactions]);

  // If selectedSources is empty (first load), select ALL available
  useEffect(() => {
    if (localStorage.getItem('EA_SOURCE_FILTER') === null && availableSources.length > 0) {
      setSelectedSources(new Set(availableSources));
    }
  }, [availableSources.length]);

  useEffect(() => {
    localStorage.setItem('EA_SOURCE_FILTER', JSON.stringify(Array.from(selectedSources)));
  }, [selectedSources]);

  const toggleSource = (source: string) => {
    const next = new Set(selectedSources);
    if (next.has(source)) next.delete(source);
    else next.add(source);
    setSelectedSources(next);
  };

  const selectAllSources = () => setSelectedSources(new Set(availableSources));
  const deselectAllSources = () => setSelectedSources(new Set());

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
      const source = t.source || ''; // Match availableSources logic
      return selectedYears.has(year) && selectedMonths.has(month) && selectedSources.has(source);
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
    return result;
  }, [transactions, selectedYears, selectedMonths, selectedSources, searchTerm, categoryFilter, showDuplicates]);

  // Unique Categories for Filter Dropdown (Derived from FULL transaction list)
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => cats.add(t.category));
    ccTransactions.forEach(t => cats.add(t.category));
    return ['All', ...Array.from(cats).sort()];
  }, [transactions, ccTransactions]);

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




  // Investment Filtering (Persistence)
  const [includedInvestmentCategories, setIncludedInvestmentCategories] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('EA_INVESTMENT_FILTER_CATEGORIES');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set(); // Default: Start empty? User explicitly selects.
    }
  });

  useEffect(() => {
    localStorage.setItem('EA_INVESTMENT_FILTER_CATEGORIES', JSON.stringify(Array.from(includedInvestmentCategories)));
  }, [includedInvestmentCategories]);

  const toggleInvestmentCategory = (cat: string) => {
    const next = new Set(includedInvestmentCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setIncludedInvestmentCategories(next);
  };

  const selectAllInvestmentCategories = () => {
    // Select all VALID categories
    const allValid = allCategories.filter(c => c !== 'All' && c !== 'Not an expense' && c !== 'Income');
    setIncludedInvestmentCategories(new Set(allValid));
  }
  const deselectAllInvestmentCategories = () => setIncludedInvestmentCategories(new Set());


  // Calculate Displayed Balances based on Filter
  const displayedBalances = useMemo(() => {
    // 1. Determine Date Range
    let activeMonths: { year: string, month: string }[] = [];

    // If no months selected, use ALL available months
    const monthsToConsider = selectedMonths.size > 0
      ? Array.from(selectedMonths)
      : availableMonths;

    const yearsToConsider = selectedYears.size > 0
      ? Array.from(selectedYears)
      : availableYears;

    // effective list of periods sorted chronologically
    yearsToConsider.forEach(y => {
      monthsToConsider.forEach(m => {
        // Basic cross product, but really we should check if data exists? 
        // Actually, simplest is just to filter the stored 'balances' list by the selected filters.
        activeMonths.push({ year: y, month: m });
      });
    });

    if (activeMonths.length === 0) return { opening: 0, closing: 0 };

    // Sort active periods
    activeMonths.sort((a, b) => {
      const valA = parseInt(a.year) * 12 + parseInt(a.month);
      const valB = parseInt(b.year) * 12 + parseInt(b.month);
      return valA - valB;
    });

    const startPeriod = activeMonths[0]; // Earliest selected
    const endPeriod = activeMonths[activeMonths.length - 1]; // Latest selected

    // 2. Sum Balances for Selected Sources with Carry Forward Logic
    const relevantSources = selectedSources.size > 0 ? Array.from(selectedSources) : availableSources;

    let openingTotal = 0;
    let closingTotal = 0;

    // Helper to get value of a month (YYYY * 12 + MM) for easy comparison
    const getMonthValue = (y: string, m: string) => parseInt(y) * 12 + parseInt(m);

    relevantSources.forEach(source => {
      // Get all balances for this source, sorted by date
      const sourceBalances = balances
        .filter(b => b.source === source)
        .sort((a, b) => getMonthValue(a.year, a.month) - getMonthValue(b.year, b.month));

      if (sourceBalances.length === 0) return;

      const startVal = getMonthValue(startPeriod.year, startPeriod.month);
      const endVal = getMonthValue(endPeriod.year, endPeriod.month);

      // --- OPENING BALANCE ---
      // Try to find exact match for start period
      const exactStart = sourceBalances.find(b => getMonthValue(b.year, b.month) === startVal);
      if (exactStart) {
        openingTotal += exactStart.openingBalance;
      } else {
        // Find latest balance BEFORE start period
        // Since list is sorted, we can iterate backwards or findLast (if avail)
        for (let i = sourceBalances.length - 1; i >= 0; i--) {
          const bVal = getMonthValue(sourceBalances[i].year, sourceBalances[i].month);
          if (bVal < startVal) {
            // Carry forward closing balance of previous period as opening of current
            openingTotal += sourceBalances[i].closingBalance;
            break;
          }
        }
        // If not found (no historical data before start), assume 0
      }

      // --- CLOSING BALANCE ---
      // Try to find exact match for end period
      const exactEnd = sourceBalances.find(b => getMonthValue(b.year, b.month) === endVal);
      if (exactEnd) {
        closingTotal += exactEnd.closingBalance;
      } else {
        // Find latest balance BEFORE OR AT end period (but if exact matched above, we wouldn't be here)
        // Actually, if we selected a range [Jan, Feb, Mar], and we have data for Jan.. but nothing for Mar.
        // The closing balance should be the closing balance of the latest known entry <= Mar.
        // So effectively, find the latest entry where date <= endPeriod.
        // Note: Use closingBalance of that entry.
        for (let i = sourceBalances.length - 1; i >= 0; i--) {
          const bVal = getMonthValue(sourceBalances[i].year, sourceBalances[i].month);
          if (bVal <= endVal) {
            closingTotal += sourceBalances[i].closingBalance;
            break;
          }
        }
      }
    });

    return { opening: openingTotal, closing: closingTotal };
  }, [balances, selectedMonths, selectedYears, selectedSources, availableMonths, availableYears, availableSources]);


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
      let newLoans: Loan[] = [];
      const rawTexts: string[] = [];

      // Process JSON Files (No LLM, direct import - skip review? Or review too? User asked for "intermediate step between file upload + LLM parsing", usually imports are trusted. Let's show JSON results in the review preview so they can confirm before merging.)
      for (const file of jsonFiles) {
        const text = await file.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(`Invalid JSON in file: ${file.name}`);
        }

        if (validateAppData(data)) {
          if (data.transactions) newTransactions.push(...data.transactions);
          // Credit Card Transactions - merge into newTransactions? Or need separate handling?
          // Current ReviewModal takes 'transactions'. We might need to handle CC types there?
          // Actually, App has `ccTransactions` state. But `handleFiles` -> `setReviewData` structure is focused on `transactions`.
          // If we want to import CC transactions, we should probably add them to `newTransactions` but mark them?
          // Or we can add them to `setCcTransactions` directly?
          // ReviewModal currently supports `transactions` prop.
          // Let's add them to `newTransactions` but ensuring they have source/type if possible?
          // Wait, App.tsx has separate `ccTransactions` state. If we import JSON with `creditCardTransactions`,
          // we should probably allow Reviewing them too.
          // For now, let's treat them as transactions and let user Categorize/Review?
          // BETTER: If the JSON explicitly has `creditCardTransactions`, maybe we should just import them directly or ask?
          // Given the prompt "Review Extracted Data", sticking to `reviewData` is safest.
          // BUT `reviewData` interface only has `transactions`.
          // Let's merge `creditCardTransactions` into `transactions` for Review purpose,
          // OR if we want to be smarter, we update `reviewData` type?
          // Simpler approach: Just merge them into `newTransactions`. The user can sort it out or we add a property.
          if (data.creditCardTransactions) {
            // Ensure they have some marker? Or just push.
            // Usually CC transactions might come from export which matches internal structure.
            newTransactions.push(...data.creditCardTransactions);
          }

          if (data.investments) newInvestments.push(...data.investments);
          if (data.loans) newLoans.push(...data.loans);
          if (data.currency) detectedCurrency = data.currency;
        }
      }

      let detectedBalances: { opening: number, closing: number } | undefined = undefined;

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
          if (result.loans) newLoans.push(...result.loans);
          if (result.currency) detectedCurrency = result.currency;

          // Capture balances if found (First occurrence takes precedence or last? Let's take last usually implies closing)
          if (result.balances) {
            detectedBalances = result.balances;
          }

          // Log completion
          setProcessingStatus(prev => ({
            ...prev,
            completedBatches: [...prev.completedBatches, { batchNum: i + 1, timeMs: Date.now() - batchStart }]
          }));
        }
      }



      // Check for Direct Import Scenario (JSON only, no transactions, but has investments/loans)
      // This skips the Review Modal since there are no transactions to verify/categorize.
      if (pdfFiles.length === 0 && newTransactions.length === 0 && (newInvestments.length > 0 || newLoans.length > 0)) {
        let msg = [];
        if (newInvestments.length > 0) {
          setInvestments(prev => mergeInvestments(prev, newInvestments));
          msg.push(`${newInvestments.length} Investments`);
        }
        if (newLoans.length > 0) {
          setLoans(prev => mergeLoans(prev, newLoans));
          // Update sources for loans
          const loanSources = new Set(newLoans.map(l => l.source).filter(Boolean));
          setSources(prev => {
            const unique = new Set([...prev, ...Array.from(loanSources)]);
            return Array.from(unique).sort();
          });
          msg.push(`${newLoans.length} Loans`);
        }
        if (detectedCurrency) setCurrency(detectedCurrency);
        setShowUpload(false);
        setProcessingStatus(prev => ({ ...prev, isActive: false }));

        setNotification({
          show: true,
          title: "Import Successful",
          message: `Successfully imported ${msg.join(' and ')}.`
        });
        return;
      }

      // Instead of merging immediately, trigger Review
      if (newTransactions.length > 0 || newInvestments.length > 0 || newLoans.length > 0) {
        setReviewData({
          transactions: newTransactions,
          rawTexts, // Only has PDF texts
          newInvestments,
          newLoans,
          detectedCurrency,
          balances: detectedBalances
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
    try {
      const data: AppData = {
        transactions,
        investments,
        currency,
        sources,
        version: 1
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      saveAs(blob, `expense-data-${new Date().toISOString().split('T')[0]}.json`);
    } catch (err: any) {
      console.error('Export Failed:', err);
      setError({ title: "Export Failed", message: err instanceof Error ? err.message : "Unknown error" });
    }
  };

  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [clearDataTab, setClearDataTab] = useState<'transactions' | 'investments' | 'reset'>('transactions');

  const handleClearAll = () => {
    setTransactions([]);
    setCcTransactions([]);
    setInvestments([]);
    setLoans([]);
    setBalances([]);
    setCurrency('USD');
    clearStorage();
  };

  const handleClearInvestments = () => {
    setInvestments([]);
  };

  const handleClearTransactions = (year?: string, month?: string, accountType: 'all' | 'bank' | 'cc' = 'all') => {
    // If no year/month provided, we clear ALL (for selected account type)
    const shouldClearAllDates = !year && !month;

    // Helper to filter function
    const shouldKeep = (t: Transaction) => {
      if (shouldClearAllDates) return false; // Delete everything in this list

      const d = new Date(t.date);
      const tYear = d.getFullYear().toString();
      const tMonth = (d.getMonth() + 1).toString().padStart(2, '0');

      if (year && month) {
        // Keep if NOT matching both
        return !(tYear === year && tMonth === month);
      } else if (year) {
        // Keep if NOT matching year
        return tYear !== year;
      }
      return true;
    };

    if (accountType === 'all' || accountType === 'bank') {
      setTransactions(prev => prev.filter(shouldKeep));
    }

    if (accountType === 'all' || accountType === 'cc') {
      setCcTransactions(prev => prev.filter(shouldKeep));
    }
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

  const cleanBulkModal = () => setBulkModal({ show: false, transaction: null, newCategory: '', matchCountFiltered: 0, matchCountAll: 0 });

  // CC Filter States
  const [ccSearchTerm, setCcSearchTerm] = useState('');
  const [ccCategoryFilter, setCcCategoryFilter] = useState('All');
  const [ccSelectedYears, setCcSelectedYears] = useState<Set<string>>(new Set());
  const [ccSelectedMonths, setCcSelectedMonths] = useState<Set<string>>(new Set());
  const [ccSelectedSources, setCcSelectedSources] = useState<Set<string>>(new Set());
  const [ccShowDuplicates, setCcShowDuplicates] = useState(false);

  // CC Data Derivation
  const { availableCcYears, availableCcMonths, availableCcSources } = useMemo(() => {
    const years = new Set<string>();
    const months = new Set<string>();
    const sources = new Set<string>();

    ccTransactions.forEach(t => {
      const date = new Date(t.date);
      years.add(date.getFullYear().toString());
      months.add((date.getMonth() + 1).toString().padStart(2, '0'));
      if (t.source) sources.add(t.source);
    });

    return {
      availableCcYears: Array.from(years).sort(),
      availableCcMonths: Array.from(months).sort(),
      availableCcSources: Array.from(sources).sort()
    };
  }, [ccTransactions]);

  // Initialize CC filters
  useEffect(() => {
    if (availableCcYears.length > 0 && ccSelectedYears.size === 0) setCcSelectedYears(new Set(availableCcYears));
    if (availableCcMonths.length > 0 && ccSelectedMonths.size === 0) setCcSelectedMonths(new Set(availableCcMonths));
    if (availableCcSources.length > 0 && ccSelectedSources.size === 0) setCcSelectedSources(new Set(availableCcSources));
  }, [availableCcYears, availableCcMonths, availableCcSources]);

  // CC Toggle Handlers
  const toggleCcYear = (y: string) => {
    const next = new Set(ccSelectedYears);
    if (next.has(y)) next.delete(y); else next.add(y);
    setCcSelectedYears(next);
  };
  const toggleCcMonth = (m: string) => {
    const next = new Set(ccSelectedMonths);
    if (next.has(m)) next.delete(m); else next.add(m);
    setCcSelectedMonths(next);
  };
  const toggleCcSource = (s: string) => {
    const next = new Set(ccSelectedSources);
    if (next.has(s)) next.delete(s); else next.add(s);
    setCcSelectedSources(next);
  };

  // CC Filtered Transactions
  const filteredCcTransactions = useMemo(() => {
    return ccTransactions.filter(t => {
      const d = new Date(t.date);
      const y = d.getFullYear().toString();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      // Year/Month Filter
      if (!ccSelectedYears.has(y)) return false;
      if (!ccSelectedMonths.has(m)) return false;
      // Source Filter
      if (t.source && !ccSelectedSources.has(t.source)) return false;
      // Search
      if (ccSearchTerm && !t.description.toLowerCase().includes(ccSearchTerm.toLowerCase())) return false;
      // Category
      if (ccCategoryFilter !== 'All' && t.category !== ccCategoryFilter) return false;
      // Duplicates (Not implemented yet for CC but standard pattern)
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ccTransactions, ccSelectedYears, ccSelectedMonths, ccSelectedSources, ccSearchTerm, ccCategoryFilter]);

  // Update CC Transaction Helper
  const handleUpdateCcTransaction = (id: string, field: keyof Transaction, value: any) => {
    setCcTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };



  // Update Loan Helper
  const handleUpdateLoan = (id: string, field: keyof Loan, value: any) => {
    setLoans(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  // Update Single Transaction (Existing Helper - Updated to be explicit for Bank Tx if needed, but it uses setTransactions so it is fine)
  const updateSingleTransaction = (id: string, field: keyof Transaction, value: any) => {
    setTransactions(prev => prev.map(t => {
      if (t.id !== id) return t;

      const updates: Partial<Transaction> = { [field]: value };

      // Auto-update type if category changes
      if (field === 'category') {
        if (value === 'Income') {
          updates.type = 'credit';
        } else if (t.type === 'credit') {
          // If currently Credit (Green) and changing to non-Income, revert to Debit (Red)
          // This handles cases where LLM incorrectly mistakenly marked an expense as income
          updates.type = 'debit';
        }
      }

      return { ...t, ...updates };
    }));
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
      type: 'debit',
      source: '' // Verify it defaults to empty string or undefined? Interface says optional. Let's make it consistent.
    };
    // Add to top of list
    setTransactions(prev => [newTx, ...prev]);

    // Ensure "Unknown" (empty source) is selected in filter so the new row is visible
    setSelectedSources(prev => {
      const next = new Set(prev);
      next.add('');
      return next;
    });
  };



  const [reviewData, setReviewData] = useState<{
    transactions: Transaction[];
    rawTexts: string[];
    newInvestments: Investment[];
    newLoans?: Loan[];
    detectedCurrency: string;
    balances?: { opening: number, closing: number };
    statement_period?: { month: string, year: string };
  } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Redo Analysis with Feedback (No Balance Update needed here usually, but if re-analysis finds it? Maybe. Keep simple for now)
  const handleReviewRedo = async (feedback: string) => {
    // ... (Existing logic same)
    if (!reviewData) return;

    setProcessingStatus({
      isActive: true, // ...
      currentBatch: 1,
      totalBatches: reviewData.rawTexts.length,
      completedBatches: [],
      startTime: Date.now()
    });

    try {
      const newTransactions: Transaction[] = [];
      const newLoans: Loan[] = [];
      const chunks = reviewData.rawTexts;

      for (let i = 0; i < chunks.length; i++) {
        const batchStart = Date.now();
        setProcessingStatus(prev => ({ ...prev, currentBatch: i + 1 }));

        const result = await analyzeFinancialText(apiKey, chunks[i], model, feedback);
        newTransactions.push(...result.transactions);
        if (result.loans) newLoans.push(...result.loans);

        // Should we update balances here? If user corrects prompt, maybe balances appear?
        // Let's defer that for now.

        setProcessingStatus(prev => ({
          ...prev,
          completedBatches: [...prev.completedBatches, { batchNum: i + 1, timeMs: Date.now() - batchStart }]
        }));
      }

      setReviewData(prev => prev ? { ...prev, transactions: newTransactions, newLoans } : null);
    } catch (err: any) {
      console.error(err);
      setError({ title: "Refinement Failed", message: err.message });
    } finally {
      setProcessingStatus(prev => ({ ...prev, isActive: false }));
    }
  };

  const handleReviewApprove = (approvedTx: Transaction[], newSources: string[], newBalance?: StatementBalance, accountType: 'bank' | 'cc' = 'bank', approvedLoans?: Loan[]) => {
    if (!reviewData) return;

    if (newSources && newSources.length > 0) {
      setSources(prev => {
        const unique = new Set([...prev, ...newSources]);
        return Array.from(unique).sort();
      });
      // Auto-select new sources so data is visible immediately
      setSelectedSources(prev => {
        const next = new Set(prev);
        newSources.forEach(s => next.add(s));
        return next;
      });
    }

    if (accountType === 'cc') {
      setCcTransactions(prev => mergeTransactions(prev, approvedTx));
    } else {
      setTransactions(prev => mergeTransactions(prev, approvedTx));
    }

    if (approvedLoans && approvedLoans.length > 0) {
      setLoans(prev => mergeLoans(prev, approvedLoans));
    }

    setInvestments(prev => mergeInvestments(prev, reviewData.newInvestments));

    // Save Balance if provided
    if (newBalance) {
      setBalances(prev => mergeBalances(prev, [newBalance]));
    }

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
  const totalIncome = filteredTransactions.filter((t: Transaction) => t.type === 'credit').reduce((a: number, b: Transaction) => a + b.amount, 0) + displayedBalances.opening;

  const handleSourceCreate = (newSource: string) => {
    if (!sources.includes(newSource)) {
      setSources(prev => [...prev, newSource].sort());
    }
  };




  // Standard Expense (Used for Charts - All categories) -> Logic resides in charts/table components directly via filteredTransactions


  // Custom Expense (Used for Summary Card - Filtered by Expense Card Dropdown)
  const totalExpenseCustom = filteredTransactions
    .filter((t: Transaction) => t.type === 'debit' && t.category !== 'Not an expense' && expenseCardCategories.has(t.category))
    .reduce((a: number, b: Transaction) => a + b.amount, 0);

  // Custom Investment (Filtered by Investment Card Dropdown - Uses TRANSACTION categories)
  const totalInvestmentsCustom = filteredTransactions
    .filter((t: Transaction) => t.category !== 'Not an expense' && t.category !== 'Income' && includedInvestmentCategories.has(t.category))
    .reduce((a: number, b: Transaction) => a + b.amount, 0);

  const totalSavings = totalIncome - totalExpenseCustom - totalInvestmentsCustom;
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
                style={{ '--bs-btn-color': '#0dcaf0', '--bs-btn-border-color': '#0dcaf0', '--bs-btn-hover-color': '#ffffff', '--bs-btn-hover-bg': '#ffffffff' } as React.CSSProperties}
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

              {(transactions.length > 0 || ccTransactions.length > 0 || investments.length > 0) && (
                <>
                  <Button
                    variant={showUpload ? "light" : "primary"}
                    size="sm"
                    onClick={() => setShowUpload(!showUpload)}
                  >
                    <Plus size={16} className={`me-1 transition-transform ${showUpload ? 'rotate-45' : ''}`} />
                    Add Files
                  </Button>

                </>
              )}

              <div className="vr bg-white opacity-25 mx-1"></div>
              <Button
                variant="link"
                className="nav-link text-secondary"
                onClick={() => setShowSettings(true)}
                title="Settings"
              >
                <Settings size={20} />
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
        initialTab={clearDataTab}
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
        {transactions.length === 0 && ccTransactions.length === 0 && investments.length === 0 ? (
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
                <div className="bg-body-tertiary border rounded p-3 mb-4 position-relative">
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
              availableSources={availableSources}
              selectedSources={selectedSources}
              onToggleSource={toggleSource}
              onSelectAllSources={selectAllSources}
              onDeselectAllSources={deselectAllSources}
              onScrollToCreditCards={ccTransactions.length > 0 ? scrollToCc : undefined}
            />

            {/* Balances */}
            {balances.length > 0 && (
              <BalanceCards
                openingBalance={displayedBalances.opening}
                closingBalance={displayedBalances.closing}
                currency={currency}
              />
            )}

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
              investmentTotal={totalInvestmentsCustom}
              // Correctly pass categories (same source as Expenses)
              allInvestmentTypes={allCategories.filter(c => c !== 'All' && c !== 'Not an expense' && c !== 'Income')}
              selectedInvestmentTypes={includedInvestmentCategories}
              onToggleInvestmentType={toggleInvestmentCategory}
              onSelectAllInvestments={selectAllInvestmentCategories}
              onDeselectAllInvestments={deselectAllInvestmentCategories}
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
                  sources={sources}
                  onSourceCreate={handleSourceCreate}
                />
              </Col>
            </Row>

            {/* Credit Card Dashboard */}
            {ccTransactions.length > 0 && (
              <div ref={ccSectionRef} className="mt-5 pt-4 border-top">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h3 className="fw-bold text-primary mb-1">Credit Card Analysis</h3>
                    <p className="text-muted mb-0">Review and analyze your credit card spending separately.</p>
                  </div>
                </div>

                <DashboardControls
                  availableYears={availableCcYears}
                  availableMonths={availableCcMonths}
                  selectedYears={ccSelectedYears}
                  selectedMonths={ccSelectedMonths}
                  onToggleYear={toggleCcYear}
                  onToggleMonth={toggleCcMonth}
                  onSelectAllYears={() => setCcSelectedYears(new Set(availableCcYears))}
                  onDeselectAllYears={() => setCcSelectedYears(new Set())}
                  onSelectAllMonths={() => setCcSelectedMonths(new Set(availableCcMonths))}
                  onDeselectAllMonths={() => setCcSelectedMonths(new Set())}
                  availableSources={availableCcSources}
                  selectedSources={ccSelectedSources}
                  onToggleSource={toggleCcSource}
                  onSelectAllSources={() => setCcSelectedSources(new Set(availableCcSources))}
                  onDeselectAllSources={() => setCcSelectedSources(new Set())}
                />

                <Row className="g-3">
                  <Col lg={12}>
                    <ExpenseCharts
                      transactions={filteredCcTransactions.filter(t => t.category !== 'Not an expense')}
                      currency={currency}
                      hideHorizontal={true}
                    />
                    <TransactionTable
                      transactions={filteredCcTransactions}
                      currency={currency}
                      onUpdateTransaction={handleUpdateCcTransaction}
                      searchTerm={ccSearchTerm}
                      onSearchChange={setCcSearchTerm}
                      categoryFilter={ccCategoryFilter}
                      onCategoryChange={setCcCategoryFilter}
                      allCategories={allCategories}
                      onDeleteTransaction={(id) => handleDeleteTransaction(id, 'cc')}
                      showDuplicates={ccShowDuplicates}
                      onToggleDuplicates={() => setCcShowDuplicates(!ccShowDuplicates)}
                      onAddTransaction={() => { }} // Manual add not strictly requested, keep simple
                      sources={sources} // Allow picking from all sources when editing/adding? Or just CC sources? Use global sources for consistency.
                      onSourceCreate={handleSourceCreate}
                    />
                  </Col>
                </Row>
              </div>
            )}

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
        onHide={() => {
          if (!processingStatus.isActive) {
            setShowReviewModal(false);
            setReviewData(null);
          }
        }}
        transactions={reviewData?.transactions || []}
        loans={reviewData?.newLoans}
        currency={currency}
        processingStatus={processingStatus}
        onApprove={handleReviewApprove}
        onCancel={handleReviewCancel}
        onRedo={handleReviewRedo}
        sources={sources}
        initialBalances={reviewData?.balances}
        initialPeriod={reviewData?.statement_period}
      />

      {/* Active Loans Section */}
      {loans.length > 0 && (
        <Container className="pb-5">
          <div className="mt-5 pt-4 border-top">
            <LoanTable
              loans={loans}
              currency={currency}
              onUpdate={handleUpdateLoan}
              onDelete={(id) => setLoans(prev => prev.filter(l => l.id !== id))}
            />
          </div>
        </Container>
      )}

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

      {/* Notification Toast */}
      <ToastContainer position="bottom-start" className="p-3" style={{ zIndex: 1060, position: 'fixed' }}>
        <Toast show={notification.show} onClose={() => setNotification(prev => ({ ...prev, show: false }))} delay={5000} autohide bg="success">
          <Toast.Header>
            <strong className="me-auto text-dark">{notification.title}</strong>
            <small>Just now</small>
          </Toast.Header>
          <Toast.Body className="text-white">{notification.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Scroll To Top Button */}
      <ScrollToTop />
      <SettingsModal
        show={showSettings}
        onHide={() => setShowSettings(false)}
        theme={theme}
        toggleTheme={toggleTheme}
        onClearData={(type) => {
          if (type === 'all') {
            setClearDataTab('reset');
            setShowClearDataModal(true);
          } else if (type === 'transactions') {
            setClearDataTab('transactions');
            setShowClearDataModal(true);
          } else if (type === 'investments') {
            setClearDataTab('investments');
            setShowClearDataModal(true);
          }
        }}
        onBackup={async () => {
          setBackupStatus('backing_up');
          try {
            const data: AppData = {
              transactions,
              investments,
              loans, // Added loans support
              currency,
              sources,
              version: 1,
              // TODO: Add ccTransactions to export data type if missing
              // For now, assume export logic handles it or we improve data type
            };
            // Quick fix: Add missing fields to AppData or just cast
            const fullData = {
              ...data,
              ccTransactions,
              loans,
              balances,
              excludedCategories: Array.from(excludedCategories),
              includedInvestmentCategories: Array.from(includedInvestmentCategories),
              settings: {
                theme,
                dontAskDeleteAgain,
                model
              }
            };

            const result = await uploadBackup(fullData);
            setLastBackupTime(result.time);
            localStorage.setItem('EA_LAST_BACKUP_TIME', result.time);
            setBackupStatus('success');
            setTimeout(() => setBackupStatus('idle'), 3000);
          } catch (error) {
            console.error("Backup failed", error);
            setBackupStatus('error');
          }
        }}
        onRestore={async () => {
          setBackupStatus('restoring');
          try {
            const data = await downloadBackup();
            if (data) {
              // Restore State
              if (data.transactions) setTransactions(data.transactions);
              if (data.ccTransactions) setCcTransactions(data.ccTransactions);
              if (data.investments) setInvestments(data.investments);
              if (data.loans) setLoans(data.loans);
              if (data.balances) setBalances(data.balances);
              if (data.currency) setCurrency(data.currency);
              if (data.sources) setSources(data.sources);

              if (data.excludedCategories) setExcludedCategories(new Set(data.excludedCategories));
              if (data.includedInvestmentCategories) setIncludedInvestmentCategories(new Set(data.includedInvestmentCategories));

              if (data.settings) {
                if (data.settings.theme) setTheme(data.settings.theme);
                if (data.settings.dontAskDeleteAgain !== undefined) setDontAskDeleteAgain(data.settings.dontAskDeleteAgain);
                if (data.settings.model) setModel(data.settings.model);
              }

              setBackupStatus('success');
              window.location.reload(); // Reload to ensure clean state
            }
          } catch (error) {
            console.error("Restore failed", error);
            setBackupStatus('error');
          }
        }}
        onExport={handleExport}
        backupStatus={backupStatus}
        lastBackupTime={lastBackupTime}
        isConnected={isConnected}
        onConnectionChange={(connected) => {
          setIsConnected(connected);
          if (connected) {
            localStorage.setItem('EA_GOOGLE_CONNECTED', 'true');
          } else {
            localStorage.removeItem('EA_GOOGLE_CONNECTED');
          }
        }}
      />

      {/* Scroll To Top Button */}
      <ScrollToTop />
    </div>
  );
}

export default App;
