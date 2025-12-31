import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalysisResult } from '../types';

export const analyzeFinancialText = async (apiKey: string, text: string, modelName: string = "gemini-1.5-flash"): Promise<AnalysisResult> => {
  if (!apiKey) throw new Error("API Key is required");

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `
    You are an expert financial analyst. Analyze the following bank statement text and extract all transactions.
    
    1. **Currency Detection**: Look for currency symbols ($, £, €, ₹) or location clues (e.g., "London" -> GBP, "Mumbai" -> INR, "New York" -> USD). Default to USD if unsure.
    2. **Extraction**: Identify Date (ISO YYYY-MM-DD), Description, Amount (absolute number), Type (only 'credit' or 'debit'), and Category.
    3. **Categories**: 'Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Utilities', 'Travel', 'Transfer', 'Income', 'Other'.
    
    Output JSON Format:
    {
      "currency": "USD",
      "transactions": [
        { "date": "2023-10-01", "description": "Starbucks", "amount": 5.50, "type": "debit", "category": "Food" }
      ]
    }

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

    // Add unique IDs
    const transactions = data.transactions.map((t: any) => ({
      ...t,
      id: crypto.randomUUID(),
      date: t.date || new Date().toISOString().split('T')[0] // Fallback
    }));

    return {
      currency: data.currency || 'USD',
      transactions
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
