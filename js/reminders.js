/**
 * PG SAHARA - Debt & Lending Reminders Engine
 * Handles pending loans and borrowings with automated frequency,
 * overdue indicators, notification badges, and quick actions.
 */

class SaharaReminders {
  constructor(store, calculations) {
    this.store = store;
    this.calc = calculations;
  }

  getActiveReminders() {
    const txs = this.store.getTransactions();
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    const pendingReminders = [];

    txs.forEach(tx => {
      if ((tx.type === 'GIVEN' || tx.type === 'TAKEN') && tx.status === 'PENDING') {
        // Check if snoozed
        if (tx.snoozedUntil && tx.snoozedUntil > todayStr) {
          // Temporarily snoozed
          // We can still list it, but with snoozed status
        }

        const isGiven = tx.type === 'GIVEN';
        const person = tx.person || 'Someone';
        const formattedAmount = this.calc.formatCurrency(tx.amount);

        // Due date calculation
        let dueStatus = 'No due date';
        let isOverdue = false;
        let daysDiff = 0;

        if (tx.expectedDate) {
          const expDate = new Date(tx.expectedDate);
          const timeDiff = expDate.getTime() - today.getTime();
          daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

          if (daysDiff < 0) {
            isOverdue = true;
            dueStatus = `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''}`;
          } else if (daysDiff === 0) {
            dueStatus = 'Due today!';
          } else {
            dueStatus = `Due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
          }
        }

        // Title and description
        const title = isGiven 
          ? `🔔 Money Reminder: ${person} owes you ${formattedAmount}`
          : `🔔 Payment Reminder: Remember to pay ${person} ${formattedAmount}`;

        const message = isGiven
          ? `You gave ${person} ${formattedAmount} on ${tx.date}. Remember to ask for the money back.`
          : `You borrowed ${formattedAmount} from ${person} on ${tx.date}. Make sure to repay on time.`;

        // Frequency label
        let freqLabel = 'Every week';
        if (tx.reminderFrequency === 'DAILY') freqLabel = 'Every day';
        else if (tx.reminderFrequency === '2_DAYS') freqLabel = 'Every 2 days';
        else if (tx.reminderFrequency === '3_DAYS') freqLabel = 'Every 3 days';
        else if (tx.reminderFrequency === 'WEEKLY') freqLabel = 'Every week';
        else if (tx.reminderFrequency === 'CUSTOM') freqLabel = `Every ${tx.reminderIntervalDays || 7} days`;

        pendingReminders.push({
          id: tx.id,
          type: tx.type,
          isGiven,
          person,
          amount: tx.amount,
          formattedAmount,
          date: tx.date,
          expectedDate: tx.expectedDate,
          daysDiff,
          isOverdue,
          dueStatus,
          freqLabel,
          title,
          message,
          note: tx.note || tx.description || '',
          snoozedUntil: tx.snoozedUntil,
          isSnoozed: !!(tx.snoozedUntil && tx.snoozedUntil > todayStr)
        });
      }
    });

    // Sort: overdue first, then by earliest expected date
    pendingReminders.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.daysDiff - b.daysDiff;
    });

    return pendingReminders;
  }

  markAsReceived(txId) {
    return this.store.updateLendingStatus(txId, 'RECEIVED');
  }

  markAsPaid(txId) {
    return this.store.updateLendingStatus(txId, 'PAID');
  }

  snooze(txId, days = 2) {
    return this.store.snoozeReminder(txId, days);
  }
}

window.saharaReminders = new SaharaReminders(window.saharaStore, window.saharaCalc);
