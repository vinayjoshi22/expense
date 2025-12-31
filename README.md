# Expense Analyzer

An intelligent, privacy-focused financial dashboard that runs entirely in your browser. Upload your bank statements, review extracted data, and gain instant insights into your spending and investments.

## 🚀 How It Works

### **1. Local-First Architecture**
This application is designed with privacy as the core principle.
- **No Backend**: The app runs 100% on your device.
- **Private Data**: Your files and financial data are never uploaded to our servers.
- **Secure Persistence**: Data is stored in your browser's `localStorage` and persists between sessions.

### **2. AI-Powered Parsing**
We use Google's **Gemini API** to intelligently parse your PDFs and statements.
- **Smart Extraction**: Automatically identifies dates, descriptions, categories, and amounts.
- **Review Loop**: Before saving, you see a preview of the extracted data. You can refine the AI's results with natural language feedback (e.g., "The date format is DD/MM/YYYY") to get perfect accuracy.
- **Model Selection**: Choose which Gemini model powers your analysis (Flash for speed, Pro for reasoning).

---

## ✨ Key Features

### **📊 Smart Dashboard**
- **Interactive Charts**: Visualize spending by category and net savings over time.
- **Investment Portfolio**: Track stocks, funds, and assets alongside your expenses.
- **Global Search**: Instantly filter transactions by any field.

### **⚡ Intelligent Workflow**
- **Review Modal**: Inspect and approve AI-extracted data before it enters your dashboard.
- **Bulk Updates**: Rename a category once (e.g., "Uber" -> "Transport") and automatically update all matching transactions.
- **Exclusion Logic**: Mark items as "Not an expense" (like credit card payments) to exclude them from totals.

### **🛡️ Data Control**
- **Export & Backup**: Download your entire financial history as a JSON file.
- **Granular Deletion**: Clear specific data—like just your investments, or transactions from a specific month—without wiping your whole app.
- **API Privacy**: Use your own Google AI Studio key to ensure your data is processed privately and not used for model training.

---

## 🛠️ Getting Started

1.  **Set API Key**: Enter your Gemini API Key in the top bar. (Get one for free from Google AI Studio).
2.  **Upload Files**: Drag & drop PDF statements or JSON backups.
3.  **Review**: Verify the extracted transactions in the popup modal.
4.  **Explore**: Use the dashboard to analyze your financial health.
