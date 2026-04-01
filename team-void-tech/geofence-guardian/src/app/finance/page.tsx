'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FinanceTransaction } from '../../types';
import { smsService } from '../../services/smsService';
import { useSMSListener } from '../../hooks/useSMSListener';

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

  // Scan State
  const [detectedItems, setDetectedItems] = useState<FinanceTransaction[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  // Real-time Toast State
  const [activeToast, setActiveToast] = useState<{ amount: number; source: string } | null>(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

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

  // 1. Filter Transactions by Search Term
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter(t => 
      t.category.toLowerCase().includes(term) || 
      (t.note && t.note.toLowerCase().includes(term))
    );
  }, [transactions, searchTerm]);

  // 2. Group Transactions by Date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: FinanceTransaction[] } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;

    filteredTransactions.forEach(t => {
      const d = new Date(t.date);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      
      let label = '';
      if (dayStart === today) label = 'Today';
      else if (dayStart === yesterday) label = 'Yesterday';
      else {
        label = new Intl.DateTimeFormat('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).format(d);
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(t);
    });

    return groups;
  }, [filteredTransactions]);

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

  const handleScanSMS = async () => {
    setIsScanning(true);
    setScanError('');
    try {
      const newItems = await smsService.scanForIncome();
      setDetectedItems(newItems);
      if (newItems.length === 0) {
        setScanError('No new income messages found in the last 50 messages.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setScanError(message || 'Failed to scan SMS. Make sure you are on Android.');
    } finally {
      setIsScanning(false);
    }
  };

  const confirmDetectedItem = (item: FinanceTransaction) => {
    setTransactions([item, ...transactions]);
    setDetectedItems(prev => prev.filter(i => i.id !== item.id));
    smsService.markAsProcessed([item.id.replace('sms-', '')]);
  };

  const dismissDetectedItem = (id: string) => {
    setDetectedItems(prev => prev.filter(i => i.id !== id));
    smsService.markAsProcessed([id.replace('sms-', '')]);
  };

  // 1. Initialize Real-time Listener
  const handleIncomingTransaction = (transaction: FinanceTransaction) => {
    setTransactions(prev => [transaction, ...prev]);
    setActiveToast({ amount: transaction.amount, source: transaction.category });
    
    // Auto-hide toast after 5 seconds
    setTimeout(() => setActiveToast(null), 5000);
  };

  useSMSListener(handleIncomingTransaction);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6 gap-6 relative pb-32">
      {/* Header */}
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Finance Dashboard</h1>

      {/* Real-time Notification Toast */}
      {activeToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-[slideIn_0.3s_ease-out]">
          <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 text-xl font-bold">₹</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Income Detected!</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">₹{activeToast.amount.toLocaleString('en-IN')} via SMS</p>
              </div>
            </div>
            <button onClick={() => setActiveToast(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 shrink-0">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest relative z-10">Total Balance</span>
          <span className={`text-4xl font-black relative z-10 ${balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            ₹{balance.toLocaleString('en-IN')}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1">
            <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Income</span>
            <span className="text-xl font-bold text-gray-800">₹{totals.income.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1">
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Expenses</span>
            <span className="text-xl font-bold text-gray-800">₹{totals.expense.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* SMS Scan Trigger */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleScanSMS}
          disabled={isScanning}
          className="w-full py-4 bg-blue-50 text-blue-600 font-bold rounded-2xl border-2 border-dashed border-blue-200 flex items-center justify-center gap-3 hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          {isScanning ? (
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
          {isScanning ? 'Scanning Inbox...' : 'Scan SMS for Income'}
        </button>
        {scanError && <p className="text-xs text-center text-amber-600 font-medium">{scanError}</p>}
      </div>

      {/* Detected Items Review Section */}
      {detectedItems.length > 0 && (
        <div className="flex flex-col gap-4 animate-[slideIn_0.3s_ease-out]">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Detected from SMS
            </h2>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {detectedItems.length} found
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {detectedItems.map((item) => (
              <div key={item.id} className="bg-green-50/50 border border-green-100 p-4 rounded-2xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">₹{item.amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-green-600 bg-white px-2 py-0.5 rounded shadow-sm">
                    Income
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmDetectedItem(item)}
                    className="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-transform"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => dismissDetectedItem(item.id)}
                    className="flex-1 py-2 bg-white text-gray-500 text-xs font-bold rounded-lg border border-gray-200 active:scale-95 transition-transform"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-gray-800">Transaction History</h2>
          
          {/* Search Bar */}
          {transactions.length > 0 && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search category or note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">Your expenses & income will appear here</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">No results found</p>
            <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.keys(groupedTransactions).map((date) => (
              <div key={date} className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{date}</h3>
                <div className="flex flex-col gap-2">
                  {groupedTransactions[date].map((t) => (
                    <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm group hover:border-blue-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                          t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {t.type === 'income' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-none mb-1">{t.category}</p>
                          <p className="text-[11px] text-gray-400 font-medium truncate max-w-[150px]">{t.note || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`font-black text-base ${t.type === 'income' ? 'text-green-600' : 'text-red-900'}`}>
                            {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter">
                            {new Date(t.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button 
                          onClick={() => removeTransaction(t.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
