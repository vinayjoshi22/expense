import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalysisResult } from '../types';

export const analyzeFinancialText = async (apiKey: string, text: string, modelName: string = "gemini-2.5-flash-lite", feedback?: string): Promise<AnalysisResult> => {
  if (!apiKey) throw new Error("API Key is required");

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  let prompt = `
    You are an expert financial analyst. Analyze the following bank statement text and extract all transactions and active loans.
    
    1. **Currency Detection**: Look for currency symbols ($, £, €, ₹) or location clues. Default to USD if unsure.
    2. **Statement Period**: Identify the COVERAGE PERIOD of the statement. Extract the Month (MM) and Year (YYYY). If it covers multiple months, choose the END month.
    3. **Balances**: Look for "Opening Balance" (or 'Start Balance', 'Previous Balance', 'Brought Forward') and "Closing Balance" (or 'End Balance', 'New Balance', 'Carried Forward').
    4. **Transactions**: Identify Date (ISO YYYY-MM-DD), Description, Amount (absolute number), Type ('credit' = deposit/return, 'debit' = expense/payment), and Category.
    5. **Categories**: 'Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Utilities', 'Travel', 'Transfer', 'Income', 'Other'.
    6. **Active Loans / EMI**: Look for sections titled "Active Loans", "Ongoing EMI", "Deferred Payment Plans", or similar. Extract details: Description, Total Loan Amount (if available), Remaining Amount (Outstanding Principal), Monthly Installment Amount (EMI), and Remaining Installments (count).
    
    Output JSON Format:
    {
      "currency": "USD",
      "statement_period": { "month": "10", "year": "2023" },
      "opening_balance": 1000.00,
      "closing_balance": 1500.00,
      "transactions": [
        { "date": "2023-10-01", "description": "Starbucks", "amount": 5.50, "type": "debit", "category": "Food" }
      ],
      "loans": [
        { 
            "description": "iPhone 15 EMI", 
            "totalAmount": 1200.00, 
            "remainingAmount": 800.00, 
            "installmentAmount": 100.00, 
            "remainingInstallments": 8 
        }
      ]
    }
  `;

  if (feedback) {
    prompt += `\n\n**IMPORTANT USER FEEDBACK FROM PREVIOUS RUN**: ${feedback}\n Please adjust your analysis strictly based on this feedback.`;
  }

  prompt += `
    Text to analyze:
    ${text.substring(0, 50000)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Clean code blocks if present
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      throw new Error("Failed to parse AI response. The model did not return valid JSON.");
    }

    if (!data.transactions || !Array.isArray(data.transactions)) {
      throw new Error("Invalid response structure: 'transactions' array missing.");
    }

    // Add unique IDs to Transactions
    const transactions = data.transactions.map((t: any) => ({
      ...t,
      id: crypto.randomUUID(),
      date: t.date || new Date().toISOString().split('T')[0] // Fallback
    }));

    // Add unique IDs to Loans
    const loans = Array.isArray(data.loans) ? data.loans.map((l: any) => ({
      ...l,
      id: crypto.randomUUID(),
      // Ensure numbers
      totalAmount: Number(l.totalAmount) || 0,
      remainingAmount: Number(l.remainingAmount) || 0,
      installmentAmount: Number(l.installmentAmount) || 0,
      remainingInstallments: Number(l.remainingInstallments) || 0
    })) : [];

    return {
      currency: data.currency || 'USD',
      transactions,
      loans,
      balances: (data.opening_balance !== undefined && data.closing_balance !== undefined && data.opening_balance !== null && data.closing_balance !== null) ? {
        opening: Number(data.opening_balance),
        closing: Number(data.closing_balance)
      } : undefined,
      statement_period: (data.statement_period && data.statement_period.month && data.statement_period.year) ? {
        month: String(data.statement_period.month).padStart(2, '0'),
        year: String(data.statement_period.year)
      } : undefined
    };

  } catch (error: any) {
    console.error("LLM Analysis Error:", error);
    // Propagate standard error message
    throw new Error(error.message || "Failed to analyze statement.");
  }
};

export const fetchAvailableModels = async (apiKey: string): Promise<string[]> => {
  if (!apiKey) return [];

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn("Failed to fetch models:", response.statusText);
      return [];
    }

    const data = await response.json();
    if (!data.models || !Array.isArray(data.models)) return [];

    // Filter for models that support 'generateContent'
    const textModels = data.models
      .filter((m: any) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', '')); // Remove 'models/' prefix if present for cleaner UI, SDK usually handles both but consistency is good.

    // Sort: Put favored models first if present, otherwise alpha
    const favored = ['gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'];
    textModels.sort((a: string, b: string) => {
      const aIndex = favored.indexOf(a);
      const bIndex = favored.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    return textModels;
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
};
