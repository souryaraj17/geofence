'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FinanceTransaction } from '../../types';

const STORAGE_KEY = 'geofence_guardian_finance';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (err) {
          console.error('Failed to parse finance data', err);
        }
      }
    }
    return [];
  });

  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  // Save transactions
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  // Dashboard Calculations
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  const balance = totals.income - totals.expense;

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const newTransaction: FinanceTransaction = {
      id: Math.random().toString(36).substring(2, 9),
      amount: numAmount,
      type,
      category,
      note,
      date: new Date().toISOString(),
    };

    setTransactions([newTransaction, ...transactions]);
    setAmount('');
    setCategory('');
    setNote('');
  };

  const removeTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6 gap-6 relative pb-32">
      {/* Header */}
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Finance Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 shrink-0">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Balance</span>
          <span className={`text-4xl font-black ${balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            ${balance.toLocaleString()}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1">
            <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Income</span>
            <span className="text-xl font-bold text-gray-800">${totals.income.toLocaleString()}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1">
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Expenses</span>
            <span className="text-xl font-bold text-gray-800">${totals.expense.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Add Transaction Form */}
      <form onSubmit={handleAddTransaction} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gray-800">New Transaction</h2>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Income
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            required
            type="number"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 font-medium"
          />
          <input
            required
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 font-medium"
          />
        </div>
        
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 font-medium"
        />

        <button
          type="submit"
          className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform mt-2"
        >
          Add Transaction
        </button>
      </form>

      {/* Transaction History */}
      <div className="flex flex-col gap-4 flex-1">
        <h2 className="text-lg font-bold text-gray-800">Transaction History</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No transactions yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {transactions.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {t.type === 'income' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{t.category}</p>
                    <p className="text-xs text-gray-400">{t.note || 'No note'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                  </span>
                  <button 
                    onClick={() => removeTransaction(t.id)}
                    className="p-2 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
