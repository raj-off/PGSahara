/**
 * PG SAHARA - Data Store & Persistence Layer
 * Handles schema, default values, localStorage persistence, and CRUD methods.
 */

const STORAGE_KEY = 'pg_sahara_store_v1';

const DEFAULT_CATEGORIES = {
  EXPENSE: {
    'FOOD': ["Swiggy", "Domino's", "Zomato", "Toing", "College Canteen", "Street Food", "Groceries"],
    'ORDER / QUICK DELIVERY': ["Zepto", "Blinkit", "Instamart", "BigBasket", "Amazon Mini"],
    'ONLINE ORDER': ["Amazon", "Flipkart", "Meesho", "Myntra"],
    'TRANSPORT': ["Auto / Cab", "Bus / Metro", "Train", "Fuel"],
    'ACADEMICS': ["Books & Xerox", "College Fees", "Stationery", "Printout"],
    'PERSONAL CARE': ["Laundry", "Saloon / Grooming", "Medicine / Health"],
    'OTHER': ["General Expense", "Room Supplies"]
  },
  RECHARGE: {
    'RECHARGE': ["Mobile Recharge", "Internet/Data", "DTH / Streaming", "Other"]
  },
  INVESTMENT: {
    'INVESTMENT': ["Groww", "SBI FD", "Zerodha", "Mutual Fund", "Gold", "Crypto", "Other"]
  },
  DONATE: {
    'DONATE / LOSS': ["Donation", "Lost Money", "Fine / Penalty", "Temple / Charity", "Other"]
  }
};

const DEFAULT_INITIAL_STATE = {
  settings: {
    theme: 'dark',
    defaultMonthlyAllowance: 10000,
    currency: '₹',
    studentName: 'College Student',
    pgName: 'PG Sahara (Room #204)'
  },
  monthlyAllowances: {
    '2026-08': {
      amount: 10000,
      date: '2026-08-01',
      note: 'Monthly money from Papa via UPI'
    },
    '2026-09': {
      amount: 10000,
      date: '2026-09-01',
      note: 'Monthly allowance from Papa'
    }
  },
  categories: DEFAULT_CATEGORIES,
  transactions: [
    // August 2026 Historical
    {
      id: 'tx_aug_rent',
      date: '2026-08-01',
      type: 'RENT',
      amount: 4000,
      category: 'ROOM RENT',
      subcategory: 'Room Rent',
      description: 'August Room Rent',
      note: 'Paid to PG Owner Suresh Uncle',
      createdAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'tx_aug_food',
      date: '2026-08-05',
      type: 'EXPENSE',
      amount: 2500,
      category: 'FOOD',
      subcategory: 'Swiggy',
      description: 'Monthly mess extra + Swiggy orders',
      createdAt: '2026-08-05T12:00:00.000Z'
    },
    {
      id: 'tx_aug_quick',
      date: '2026-08-10',
      type: 'EXPENSE',
      amount: 800,
      category: 'ORDER / QUICK DELIVERY',
      subcategory: 'Blinkit',
      description: 'Room snacks and coffee',
      createdAt: '2026-08-10T14:00:00.000Z'
    },
    {
      id: 'tx_aug_rech',
      date: '2026-08-15',
      type: 'RECHARGE',
      amount: 500,
      category: 'RECHARGE',
      subcategory: 'Internet/Data',
      description: 'Wi-Fi extension pack',
      createdAt: '2026-08-15T09:00:00.000Z'
    },
    {
      id: 'tx_aug_inv',
      date: '2026-08-05',
      type: 'INVESTMENT',
      amount: 1000,
      category: 'INVESTMENT',
      subcategory: 'Groww',
      description: 'Groww Nifty 50 Index SIP',
      createdAt: '2026-08-05T11:00:00.000Z'
    },

    // September 2026 (Current Demo Data)
    {
      id: 'tx_sep_rent',
      date: '2026-09-01',
      type: 'RENT',
      amount: 4000,
      category: 'ROOM RENT',
      subcategory: 'Room Rent',
      description: 'PG Sahara Room Rent for September',
      note: 'Paid to Suresh PG Owner via PhonePe',
      createdAt: '2026-09-01T10:00:00.000Z'
    },
    {
      id: 'tx_sep_inv_1',
      date: '2026-09-03',
      type: 'INVESTMENT',
      amount: 1000,
      category: 'INVESTMENT',
      subcategory: 'Groww',
      description: 'Monthly Index Mutual Fund SIP',
      note: 'Groww Direct Growth Fund',
      createdAt: '2026-09-03T11:30:00.000Z'
    },
    {
      id: 'tx_sep_rech_1',
      date: '2026-09-05',
      type: 'RECHARGE',
      amount: 499,
      category: 'RECHARGE',
      subcategory: 'Internet/Data',
      description: 'PG High Speed Wi-Fi Add-on',
      note: 'Airtel Xstream Data Booster',
      createdAt: '2026-09-05T14:15:00.000Z'
    },
    {
      id: 'tx_sep_food_swiggy_7',
      date: '2026-09-07',
      type: 'EXPENSE',
      amount: 150,
      category: 'FOOD',
      subcategory: 'Swiggy',
      description: 'Dinner combo with roll & lemonade',
      note: 'Swiggy delivery',
      createdAt: '2026-09-07T20:30:00.000Z'
    },
    {
      id: 'tx_sep_online_amz_7',
      date: '2026-09-07',
      type: 'EXPENSE',
      amount: 300,
      category: 'ONLINE ORDER',
      subcategory: 'Amazon',
      description: 'Notebook & study lamp',
      note: 'Amazon Prime student discount',
      createdAt: '2026-09-07T16:00:00.000Z'
    },
    {
      id: 'tx_sep_rech_7',
      date: '2026-09-07',
      type: 'RECHARGE',
      amount: 239,
      category: 'RECHARGE',
      subcategory: 'Mobile Recharge',
      description: 'Jio 28 days 1.5GB/day plan',
      note: 'Mobile recharge',
      createdAt: '2026-09-07T10:00:00.000Z'
    },
    {
      id: 'tx_sep_donate_loss',
      date: '2026-09-10',
      type: 'DONATE',
      amount: 200,
      category: 'DONATE / LOSS',
      subcategory: 'Lost Money',
      description: 'Dropped ₹200 note at college bus stop',
      note: 'Permanent loss',
      createdAt: '2026-09-10T17:45:00.000Z'
    },
    {
      id: 'tx_sep_given_rahul',
      date: '2026-09-11',
      type: 'GIVEN',
      amount: 500,
      category: 'MONEY GIVEN',
      subcategory: 'Lent to Friend',
      description: 'Gave Rahul ₹500 for college fest ticket',
      person: 'Rahul',
      expectedDate: '2026-09-18',
      status: 'PENDING',
      reminderFrequency: 'WEEKLY',
      reminderIntervalDays: 7,
      lastRemindedDate: '2026-09-11',
      snoozedUntil: null,
      note: 'Rahul owes ₹500. Promised to return after weekend',
      createdAt: '2026-09-11T13:00:00.000Z'
    },
    {
      id: 'tx_sep_food_dominos',
      date: '2026-09-12',
      type: 'EXPENSE',
      amount: 450,
      category: 'FOOD',
      subcategory: "Domino's",
      description: 'Roommate birthday pizza share',
      note: "Domino's Pepper Barbecue & Garlic Bread",
      createdAt: '2026-09-12T21:00:00.000Z'
    },
    {
      id: 'tx_sep_quick_zepto',
      date: '2026-09-14',
      type: 'EXPENSE',
      amount: 180,
      category: 'ORDER / QUICK DELIVERY',
      subcategory: 'Zepto',
      description: 'Late night Maggi, eggs & milk',
      note: 'Zepto 10 min delivery',
      createdAt: '2026-09-14T23:15:00.000Z'
    },
    {
      id: 'tx_sep_taken_amit',
      date: '2026-09-15',
      type: 'TAKEN',
      amount: 300,
      category: 'MONEY TAKEN',
      subcategory: 'Borrowed',
      description: 'Took ₹300 from Amit for urgently buying semester textbook',
      person: 'Amit',
      expectedDate: '2026-09-20',
      status: 'PENDING',
      reminderFrequency: '2_DAYS',
      reminderIntervalDays: 2,
      lastRemindedDate: '2026-09-15',
      snoozedUntil: null,
      note: 'Remember to pay Amit ₹300 back soon',
      createdAt: '2026-09-15T15:30:00.000Z'
    },
    {
      id: 'tx_sep_quick_blinkit',
      date: '2026-09-16',
      type: 'EXPENSE',
      amount: 240,
      category: 'ORDER / QUICK DELIVERY',
      subcategory: 'Blinkit',
      description: 'Biscuits, bananas & laundry detergent',
      note: 'Blinkit order',
      createdAt: '2026-09-16T18:00:00.000Z'
    }
  ]
};

class SaharaStore {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge missing keys gracefully
        return {
          settings: { ...DEFAULT_INITIAL_STATE.settings, ...parsed.settings },
          monthlyAllowances: { ...DEFAULT_INITIAL_STATE.monthlyAllowances, ...parsed.monthlyAllowances },
          categories: { ...DEFAULT_CATEGORIES, ...parsed.categories },
          transactions: parsed.transactions || DEFAULT_INITIAL_STATE.transactions
        };
      }
    } catch (e) {
      console.warn('Could not parse stored data from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // --- Monthly Allowance Management ---
  getMonthlyAllowance(yearMonth) {
    if (this.data.monthlyAllowances && this.data.monthlyAllowances[yearMonth] !== undefined) {
      return this.data.monthlyAllowances[yearMonth];
    }
    // Default fallback to configured monthly allowance (handles 0 correctly)
    const def = this.data.settings.defaultMonthlyAllowance;
    return {
      amount: typeof def === 'number' ? def : 10000,
      date: `${yearMonth}-01`,
      note: 'Standard Monthly Allowance'
    };
  }

  setMonthlyAllowance(yearMonth, amount, date = null, note = '', updateDefault = false) {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) {
      throw new Error('Please enter a valid non-negative amount (0 or greater).');
    }
    const recordDate = date || `${yearMonth}-01`;
    this.data.monthlyAllowances[yearMonth] = {
      amount: num,
      date: recordDate,
      note: note || 'Monthly money from parents'
    };
    if (updateDefault) {
      this.data.settings.defaultMonthlyAllowance = num;
    }
    this.save();
    return this.data.monthlyAllowances[yearMonth];
  }

  // --- Transactions CRUD ---
  getTransactions() {
    return this.data.transactions;
  }

  getTransactionById(id) {
    return this.data.transactions.find(tx => tx.id === id) || null;
  }

  getTransactionsForMonth(yearMonth) {
    return this.data.transactions.filter(tx => tx.date.startsWith(yearMonth));
  }

  getTransactionsForDate(dateStr) {
    return this.data.transactions.filter(tx => tx.date === dateStr);
  }

  addTransaction(txData) {
    this.validateTransaction(txData);

    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      date: txData.date,
      type: txData.type,
      amount: parseFloat(txData.amount),
      category: txData.category || this.getDefaultCategoryForType(txData.type),
      subcategory: txData.subcategory || '',
      description: txData.description || '',
      note: txData.note || '',
      person: txData.person || '',
      expectedDate: txData.expectedDate || '',
      status: txData.status || (txData.type === 'GIVEN' || txData.type === 'TAKEN' ? 'PENDING' : 'COMPLETED'),
      reminderFrequency: txData.reminderFrequency || (txData.type === 'GIVEN' ? 'WEEKLY' : '2_DAYS'),
      reminderIntervalDays: parseInt(txData.reminderIntervalDays) || (txData.type === 'GIVEN' ? 7 : 2),
      lastRemindedDate: txData.lastRemindedDate || txData.date,
      snoozedUntil: null,
      createdAt: new Date().toISOString()
    };

    this.data.transactions.push(newTx);
    this.save();
    return newTx;
  }

  updateTransaction(id, updatedFields) {
    const idx = this.data.transactions.findIndex(tx => tx.id === id);
    if (idx === -1) {
      throw new Error('Transaction not found');
    }

    const current = this.data.transactions[idx];
    const merged = { ...current, ...updatedFields };
    this.validateTransaction(merged);

    if (merged.amount) merged.amount = parseFloat(merged.amount);
    if (merged.reminderIntervalDays) merged.reminderIntervalDays = parseInt(merged.reminderIntervalDays);

    this.data.transactions[idx] = merged;
    this.save();
    return merged;
  }

  deleteTransaction(id) {
    const initialLen = this.data.transactions.length;
    this.data.transactions = this.data.transactions.filter(tx => tx.id !== id);
    if (this.data.transactions.length === initialLen) {
      throw new Error('Transaction not found');
    }
    this.save();
    return true;
  }

  validateTransaction(tx) {
    if (!tx.type) throw new Error('Transaction type is required.');
    const amt = parseFloat(tx.amount);
    if (isNaN(amt) || amt <= 0) {
      throw new Error('Amount must be a positive number greater than zero.');
    }
    if (!tx.date || !/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) {
      throw new Error('Valid date in YYYY-MM-DD format is required.');
    }
    if ((tx.type === 'GIVEN' || tx.type === 'TAKEN') && (!tx.person || !tx.person.trim())) {
      throw new Error('Person name is required for money given or taken.');
    }
  }

  getDefaultCategoryForType(type) {
    switch (type) {
      case 'RENT': return 'ROOM RENT';
      case 'EXPENSE': return 'FOOD';
      case 'RECHARGE': return 'RECHARGE';
      case 'INVESTMENT': return 'INVESTMENT';
      case 'DONATE': return 'DONATE / LOSS';
      case 'GIVEN': return 'MONEY GIVEN';
      case 'TAKEN': return 'MONEY TAKEN';
      default: return 'GENERAL';
    }
  }

  // --- Category & Subcategory Management ---
  getCategories() {
    return this.data.categories;
  }

  addCategory(type, categoryName) {
    const t = type.toUpperCase();
    const cleanName = categoryName.trim().toUpperCase();
    if (!cleanName) throw new Error('Category name cannot be empty.');

    if (!this.data.categories[t]) {
      this.data.categories[t] = {};
    }
    if (!this.data.categories[t][cleanName]) {
      this.data.categories[t][cleanName] = [];
      this.save();
    }
    return this.data.categories[t];
  }

  addSubcategory(type, categoryName, subcategoryName) {
    const t = type.toUpperCase();
    const cat = categoryName.trim();
    const sub = subcategoryName.trim();
    if (!cat || !sub) throw new Error('Category and Subcategory names cannot be empty.');

    if (!this.data.categories[t]) this.data.categories[t] = {};
    if (!this.data.categories[t][cat]) this.data.categories[t][cat] = [];

    if (!this.data.categories[t][cat].includes(sub)) {
      this.data.categories[t][cat].push(sub);
      this.save();
    }
    return this.data.categories[t][cat];
  }

  // --- Debt / Lending Reminders Status ---
  updateLendingStatus(id, newStatus) {
    const tx = this.getTransactionById(id);
    if (!tx) throw new Error('Transaction not found');
    tx.status = newStatus;
    if (newStatus === 'RECEIVED' || newStatus === 'PAID') {
      tx.completedDate = new Date().toISOString().split('T')[0];
    }
    this.save();
    return tx;
  }

  snoozeReminder(id, days = 2) {
    const tx = this.getTransactionById(id);
    if (!tx) throw new Error('Transaction not found');
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + days);
    tx.snoozedUntil = snoozeDate.toISOString().split('T')[0];
    this.save();
    return tx;
  }

  // --- Settings & Theme ---
  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.data.settings;
  }

  // --- Backup & Restore ---
  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed.transactions || !parsed.settings) {
      throw new Error('Invalid PG SAHARA backup format.');
    }
    this.data = parsed;
    this.save();
    return true;
  }

  resetDefaults() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
    this.save();
    return this.data;
  }

  // --- Reset All Prices & Savings Data to Zero ---
  clearAllPricesAndSavings(newDefaultAllowance = 0) {
    this.data.transactions = [];
    const allowance = Number(newDefaultAllowance) || 0;
    this.data.monthlyAllowances = {};
    this.data.settings.defaultMonthlyAllowance = allowance;
    this.save();
    return true;
  }

  // --- Reset Current Month Prices & Savings to Zero ---
  clearMonthPricesAndSavings(yearMonth) {
    this.data.transactions = this.data.transactions.filter(tx => !tx.date.startsWith(yearMonth));
    if (!this.data.monthlyAllowances) this.data.monthlyAllowances = {};
    this.data.monthlyAllowances[yearMonth] = {
      amount: 0,
      date: `${yearMonth}-01`,
      note: 'Allowance reset to 0'
    };
    this.save();
    return true;
  }

  // --- Reset Savings Specifically for Current Month to Zero ---
  resetSavingsOnly(yearMonth) {
    if (!this.data.monthlyAllowances) this.data.monthlyAllowances = {};
    const monthTxs = this.getTransactionsForMonth(yearMonth);
    let spent = 0;
    monthTxs.forEach(tx => {
      if (['RENT', 'EXPENSE', 'RECHARGE', 'DONATE'].includes(tx.type)) {
        spent += Number(tx.amount) || 0;
      }
    });
    this.data.monthlyAllowances[yearMonth] = {
      amount: spent,
      date: `${yearMonth}-01`,
      note: 'Savings reset to ₹0'
    };
    this.save();
    return true;
  }
}

// Singleton global instance
window.saharaStore = new SaharaStore();
