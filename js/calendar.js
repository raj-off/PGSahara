/**
 * PG SAHARA - Interactive Monthly Calendar Component
 * Renders Mon-Sun calendar layout, transaction indicators, day inspector,
 * and direct date-level transaction addition.
 */

class SaharaCalendar {
  constructor(store, calculations) {
    this.store = store;
    this.calc = calculations;
    this.selectedDateStr = null;
  }

  render(containerElement, yearMonth, onSelectDateCallback, onAddTransactionForDate) {
    this.container = containerElement;
    this.yearMonth = yearMonth;
    this.onSelectDateCallback = onSelectDateCallback;
    this.onAddTransactionForDate = onAddTransactionForDate;

    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0, Sun = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Collect transactions for this month to index by day
    const monthTxs = this.store.getTransactionsForMonth(yearMonth);
    const txByDay = {};
    monthTxs.forEach(tx => {
      const day = parseInt(tx.date.split('-')[2], 10);
      if (!txByDay[day]) txByDay[day] = [];
      txByDay[day].push(tx);
    });

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Default select date: either existing selectedDate if in this month, or 1st of month, or 7th (for demo)
    if (!this.selectedDateStr || !this.selectedDateStr.startsWith(yearMonth)) {
      if (yearMonth === '2026-09') {
        this.selectedDateStr = '2026-09-07'; // Match prompt demo
      } else {
        this.selectedDateStr = `${yearMonth}-01`;
      }
    }

    let html = `
      <div class="calendar-wrapper">
        <div class="calendar-header-bar">
          <div class="calendar-title">
            <h3>${monthNames[month].toUpperCase()} ${year}</h3>
          </div>
          <div class="calendar-legend">
            <span class="legend-item"><span class="dot dot-spend"></span> Spending</span>
            <span class="legend-item"><span class="dot dot-rent"></span> Rent</span>
            <span class="legend-item"><span class="dot dot-inv"></span> Invest</span>
            <span class="legend-item"><span class="dot dot-debt"></span> Given/Taken</span>
          </div>
        </div>

        <div class="calendar-grid">
          <div class="weekday-header">Mon</div>
          <div class="weekday-header">Tue</div>
          <div class="weekday-header">Wed</div>
          <div class="weekday-header">Thu</div>
          <div class="weekday-header">Fri</div>
          <div class="weekday-header">Sat</div>
          <div class="weekday-header">Sun</div>
    `;

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDayNum = daysInPrevMonth - i;
      html += `<div class="calendar-day-cell prev-month-day">
        <span class="day-num">${prevDayNum}</span>
      </div>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${yearMonth}-${dayStr}`;
      const dayTxs = txByDay[day] || [];
      const isSelected = dateStr === this.selectedDateStr;
      const isToday = dateStr === todayStr;

      // Compute total day spending
      let daySpend = 0;
      let hasRent = false;
      let hasInvest = false;
      let hasDebt = false;
      let hasSpend = false;

      dayTxs.forEach(tx => {
        if (['RENT', 'EXPENSE', 'RECHARGE', 'DONATE'].includes(tx.type)) {
          daySpend += Number(tx.amount) || 0;
          if (tx.type === 'RENT') hasRent = true;
          else hasSpend = true;
        } else if (tx.type === 'INVESTMENT') {
          hasInvest = true;
        } else if (['GIVEN', 'TAKEN'].includes(tx.type)) {
          hasDebt = true;
        }
      });

      html += `
        <div class="calendar-day-cell ${isSelected ? 'active-day' : ''} ${isToday ? 'today-cell' : ''} ${dayTxs.length > 0 ? 'has-tx' : ''}" data-date="${dateStr}">
          <div class="day-top">
            <span class="day-num">${day}</span>
            ${daySpend > 0 ? `<span class="day-spend-pill">₹${daySpend > 999 ? (daySpend/1000).toFixed(1)+'k' : daySpend}</span>` : ''}
          </div>
          <div class="day-indicators">
            ${hasSpend ? '<span class="day-dot dot-spend" title="Expenses"></span>' : ''}
            ${hasRent ? '<span class="day-dot dot-rent" title="Room Rent"></span>' : ''}
            ${hasInvest ? '<span class="day-dot dot-inv" title="Investment"></span>' : ''}
            ${hasDebt ? '<span class="day-dot dot-debt" title="Given/Taken"></span>' : ''}
          </div>
        </div>
      `;
    }

    // Trailing next month filler days
    const totalCellsSoFar = firstDayIndex + daysInMonth;
    const remainingCells = (7 - (totalCellsSoFar % 7)) % 7;
    for (let j = 1; j <= remainingCells; j++) {
      html += `<div class="calendar-day-cell next-month-day">
        <span class="day-num">${j}</span>
      </div>`;
    }

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    // Attach click listeners to day cells
    this.container.querySelectorAll('.calendar-day-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const clickedDate = cell.getAttribute('data-date');
        this.selectDate(clickedDate);
      });
    });

    // Render initial day inspector
    this.renderDayInspector(this.selectedDateStr);
  }

  selectDate(dateStr) {
    this.selectedDateStr = dateStr;
    // Highlight cell in calendar
    this.container.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('active-day'));
    const targetCell = this.container.querySelector(`[data-date="${dateStr}"]`);
    if (targetCell) targetCell.classList.add('active-day');

    this.renderDayInspector(dateStr);
    if (this.onSelectDateCallback) {
      this.onSelectDateCallback(dateStr);
    }
  }

  renderDayInspector(dateStr) {
    const inspectorContainer = document.getElementById('calendar-day-inspector');
    if (!inspectorContainer) return;

    const dayData = this.calc.getDaySpending(dateStr);
    const dateObj = new Date(dateStr + 'T00:00:00');
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const dateFormatted = dateObj.toLocaleDateString('en-IN', options);

    let txsHtml = '';
    if (dayData.transactions.length === 0) {
      txsHtml = `
        <div class="empty-day-state">
          <p>No transactions on this date.</p>
        </div>
      `;
    } else {
      txsHtml = '<ul class="day-tx-list">';
      dayData.transactions.forEach(tx => {
        let badgeClass = 'badge-expense';
        let typeLabel = tx.subcategory || tx.category || tx.type;

        if (tx.type === 'RENT') badgeClass = 'badge-rent';
        else if (tx.type === 'RECHARGE') badgeClass = 'badge-recharge';
        else if (tx.type === 'INVESTMENT') badgeClass = 'badge-investment';
        else if (tx.type === 'GIVEN') badgeClass = 'badge-given';
        else if (tx.type === 'TAKEN') badgeClass = 'badge-taken';
        else if (tx.type === 'DONATE') badgeClass = 'badge-donate';

        const amtFormatted = this.calc.formatCurrency(tx.amount);
        const desc = tx.description || tx.note || tx.category;

        txsHtml += `
          <li class="day-tx-item">
            <div class="day-tx-info">
              <div class="day-tx-title">
                <span class="type-badge ${badgeClass}">${typeLabel}</span>
                <span class="tx-desc">${desc}</span>
              </div>
              ${tx.person ? `<span class="person-tag">👤 ${tx.person}</span>` : ''}
            </div>
            <div class="day-tx-amt ${['GIVEN','TAKEN','INVESTMENT'].includes(tx.type) ? 'neutral-amt' : 'spend-amt'}">
              ${amtFormatted}
            </div>
          </li>
        `;
      });
      txsHtml += '</ul>';
    }

    inspectorContainer.innerHTML = `
      <div class="day-inspector-card">
        <div class="inspector-header">
          <div>
            <h4 class="inspector-date">${dateFormatted}</h4>
            <div class="inspector-spend-total">
              Day spending: <strong class="text-danger">${this.calc.formatCurrency(dayData.spending)}</strong>
            </div>
          </div>
          <button class="btn btn-sm btn-primary" id="btn-add-on-date">
            ➕ Add on this Date
          </button>
        </div>
        <div class="inspector-body">
          ${txsHtml}
        </div>
      </div>
    `;

    // Bind Add button
    const addBtn = inspectorContainer.querySelector('#btn-add-on-date');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (this.onAddTransactionForDate) {
          this.onAddTransactionForDate(dateStr);
        }
      });
    }
  }
}

window.saharaCalendar = new SaharaCalendar(window.saharaStore, window.saharaCalc);
