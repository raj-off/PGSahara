/**
 * PG SAHARA - Financial Calculation Engine
 * Enforces strict financial logic according to user rules:
 * - Spending = Room Rent + Daily Expenses + Recharge + Donate/Loss
 * - Savings = Money Received - Actual Spending
 * - Investments = Tracked separately (monthly and yearly)
 * - Money Given = Temporary asset, tracked separately (pending vs received)
 * - Money Taken = Temporary liability, tracked separately (pending vs paid)
 * - Never double-count transactions!
 */

class SaharaCalculations {
  constructor(store) {
    this.store = store;
  }

  formatCurrency(amount, includeSymbol = true) {
    const val = Number(amount) || 0;
    const formatted = val.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    });
    return includeSymbol ? `₹${formatted}` : formatted;
  }

  /**
   * Calculates all metrics for a given YYYY-MM
   */
  getMonthSummary(yearMonth) {
    const allowanceObj = this.store.getMonthlyAllowance(yearMonth);
    const moneyReceived = Number(allowanceObj.amount) || 0;

    const txs = this.store.getTransactionsForMonth(yearMonth);

    let roomRent = 0;
    let dailyExpenses = 0;
    let recharge = 0;
    let donateLoss = 0;
    let investment = 0;

    let moneyGivenTotal = 0;
    let moneyToReceivePending = 0;
    let moneyReceivedBack = 0;

    let moneyTakenTotal = 0;
    let moneyToPayPending = 0;
    let moneyPaidBack = 0;

    // Detailed breakdown by categories
    const categoryBreakdown = {};

    txs.forEach(tx => {
      const amt = Number(tx.amount) || 0;

      switch (tx.type) {
        case 'RENT':
          roomRent += amt;
          categoryBreakdown['Room Rent'] = (categoryBreakdown['Room Rent'] || 0) + amt;
          break;

        case 'EXPENSE':
          dailyExpenses += amt;
          const catKey = tx.category || 'General Expense';
          categoryBreakdown[catKey] = (categoryBreakdown[catKey] || 0) + amt;
          break;

        case 'RECHARGE':
          recharge += amt;
          categoryBreakdown['Recharge'] = (categoryBreakdown['Recharge'] || 0) + amt;
          break;

        case 'DONATE':
          donateLoss += amt;
          categoryBreakdown['Donate / Loss'] = (categoryBreakdown['Donate / Loss'] || 0) + amt;
          break;

        case 'INVESTMENT':
          investment += amt;
          break;

        case 'GIVEN':
          moneyGivenTotal += amt;
          if (tx.status === 'RECEIVED') {
            moneyReceivedBack += amt;
          } else {
            moneyToReceivePending += amt;
          }
          break;

        case 'TAKEN':
          moneyTakenTotal += amt;
          if (tx.status === 'PAID') {
            moneyPaidBack += amt;
          } else {
            moneyToPayPending += amt;
          }
          break;

        default:
          break;
      }
    });

    // Actual spending = Room Rent + Daily Expenses + Recharge + Donate/Loss
    const actualSpending = roomRent + dailyExpenses + recharge + donateLoss;

    // Savings = Money Received - Actual Spending
    const saved = moneyReceived - actualSpending;
    const savingPercentage = moneyReceived > 0 
      ? Math.max(0, Math.round((saved / moneyReceived) * 100)) 
      : 0;

    return {
      yearMonth,
      moneyReceived,
      roomRent,
      dailyExpenses,
      recharge,
      donateLoss,
      actualSpending,
      saved,
      savingPercentage,
      investment,
      moneyGivenTotal,
      moneyToReceivePending,
      moneyReceivedBack,
      moneyTakenTotal,
      moneyToPayPending,
      moneyPaidBack,
      categoryBreakdown,
      transactionCount: txs.length
    };
  }

  /**
   * Day spending calculation for calendar day view
   * Only includes actual spending types (Rent, Expense, Recharge, Donate)
   */
  getDaySpending(dateStr) {
    const txs = this.store.getTransactionsForDate(dateStr);
    let spending = 0;
    let nonSpending = 0;

    txs.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (['RENT', 'EXPENSE', 'RECHARGE', 'DONATE'].includes(tx.type)) {
        spending += amt;
      } else {
        nonSpending += amt;
      }
    });

    return {
      spending,
      nonSpending,
      transactions: txs
    };
  }

  /**
   * Yearly statistics for a given YYYY
   */
  getYearlySummary(year) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthlyData = [];
    let totalYearlySpending = 0;
    let totalYearlySaving = 0;
    let totalYearlyInvestment = 0;
    let totalYearlyRent = 0;
    let totalYearlyAllowance = 0;

    let highestSpendingMonth = { month: 'N/A', amount: 0 };
    let highestSavingMonth = { month: 'N/A', amount: 0 };

    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0');
      const yearMonth = `${year}-${mm}`;
      const summary = this.getMonthSummary(yearMonth);

      totalYearlyAllowance += summary.moneyReceived;
      totalYearlySpending += summary.actualSpending;
      totalYearlySaving += Math.max(0, summary.saved);
      totalYearlyInvestment += summary.investment;
      totalYearlyRent += summary.roomRent;

      const mName = monthNames[m - 1];

      if (summary.actualSpending > highestSpendingMonth.amount) {
        highestSpendingMonth = { month: mName, amount: summary.actualSpending };
      }

      if (summary.saved > highestSavingMonth.amount) {
        highestSavingMonth = { month: mName, amount: summary.saved };
      }

      monthlyData.push({
        monthNumber: m,
        monthName: mName,
        yearMonth,
        moneyReceived: summary.moneyReceived,
        spending: summary.actualSpending,
        saving: summary.saved,
        investment: summary.investment,
        rent: summary.roomRent
      });
    }

    return {
      year,
      monthlyData,
      totalYearlyAllowance,
      totalYearlySpending,
      totalYearlySaving,
      totalYearlyInvestment,
      totalYearlyRent,
      highestSpendingMonth,
      highestSavingMonth
    };
  }
}

// Attach to window
window.saharaCalc = new SaharaCalculations(window.saharaStore);
