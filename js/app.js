/**
 * PG SAHARA - Main Application Controller
 * Coordinates Views, Modals, Month navigation, Forms, Reminders, and Themes.
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.saharaStore;
  const calc = window.saharaCalc;
  const catMgr = window.saharaCategories;
  const remindersMgr = window.saharaReminders;
  const calendarMgr = window.saharaCalendar;
  const chartsMgr = window.saharaCharts;

  // --- State Variables ---
  let currentYearMonth = '2026-09'; // Default as requested in user prompt
  let currentView = 'dashboard';
  let activeEditingTxId = null;

  // --- Cache DOM Elements ---
  const elThemeToggle = document.getElementById('theme-toggle-btn');
  const elMobileThemeToggle = document.getElementById('mobile-theme-toggle-btn');
  const elPrevMonth = document.getElementById('prev-month-btn');
  const elNextMonth = document.getElementById('next-month-btn');
  const elCurrentMonthDisplay = document.getElementById('current-month-display');
  const elToastContainer = document.getElementById('toast-container');

  // Modals
  const modalTx = document.getElementById('modal-transaction');
  const formTx = document.getElementById('form-transaction');
  const btnCloseTxModal = document.getElementById('btn-close-tx-modal');
  const btnCancelTx = document.getElementById('btn-cancel-tx');

  const modalAllowance = document.getElementById('modal-allowance');
  const formAllowance = document.getElementById('form-modal-allowance');
  const btnCloseAllowanceModal = document.getElementById('btn-close-allowance-modal');
  const btnCancelAllowance = document.getElementById('btn-cancel-allowance');
  const btnEditAllowance = document.getElementById('btn-edit-allowance');
  const btnQuickEditIncome = document.getElementById('btn-quick-edit-income');

  // Trigger buttons
  const fabAddBtn = document.getElementById('fab-add-btn');
  const topBtnAdd = document.getElementById('top-btn-add');
  const mobileAddBtn = document.getElementById('mobile-add-btn');

  // ==========================================
  // 1. THEME INITIALIZATION & TOGGLE
  // ==========================================
  function initTheme() {
    const settings = store.getSettings();
    const theme = settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    store.updateSettings({ theme: newTheme });
    updateThemeIcon(newTheme);

    // Refresh charts if on stats or dashboard
    refreshActiveView();
    showToast(`Switched to ${newTheme} mode`);
  }

  function updateThemeIcon(theme) {
    const icon = theme === 'dark' ? '☀️' : '🌙';
    if (elThemeToggle) elThemeToggle.textContent = icon;
    if (elMobileThemeToggle) elMobileThemeToggle.textContent = icon;
  }

  if (elThemeToggle) elThemeToggle.addEventListener('click', toggleTheme);
  if (elMobileThemeToggle) elMobileThemeToggle.addEventListener('click', toggleTheme);

  // ==========================================
  // 2. TOAST NOTIFICATIONS
  // ==========================================
  function showToast(message, type = 'info') {
    if (!elToastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    elToastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ==========================================
  // 3. MONTH NAVIGATION
  // ==========================================
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function updateMonthDisplay() {
    const [yStr, mStr] = currentYearMonth.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10) - 1;
    const label = `${monthNames[m]} ${y}`;
    if (elCurrentMonthDisplay) elCurrentMonthDisplay.textContent = label;

    const summaryTitle = document.getElementById('summary-month-title');
    if (summaryTitle) summaryTitle.textContent = `Monthly Financial Breakdown - ${label}`;

    const settingsLabel = document.getElementById('settings-current-month-label');
    if (settingsLabel) settingsLabel.textContent = label;

    const resetSettingsLabel = document.getElementById('settings-reset-month-name');
    if (resetSettingsLabel) resetSettingsLabel.textContent = label;

    const resetModalLabel = document.getElementById('modal-reset-month-label');
    if (resetModalLabel) resetModalLabel.textContent = label;
  }

  function changeMonth(delta) {
    const [yStr, mStr] = currentYearMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + delta;

    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }

    currentYearMonth = `${y}-${String(m).padStart(2, '0')}`;
    updateMonthDisplay();
    refreshActiveView();
  }

  if (elPrevMonth) elPrevMonth.addEventListener('click', () => changeMonth(-1));
  if (elNextMonth) elNextMonth.addEventListener('click', () => changeMonth(1));

  // ==========================================
  // 4. NAVIGATION & VIEW SWITCHING
  // ==========================================
  function switchView(viewName) {
    currentView = viewName;

    // Desktop nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Mobile nav items
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Toggle pages
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.add('active');

    refreshActiveView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => {
      switchView(item.getAttribute('data-view'));
    });
  });

  document.querySelectorAll('.bottom-nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => {
      switchView(item.getAttribute('data-view'));
    });
  });

  const btnGotoAnalytics = document.getElementById('btn-goto-analytics');
  if (btnGotoAnalytics) {
    btnGotoAnalytics.addEventListener('click', () => switchView('analytics'));
  }

  // ==========================================
  // 5. VIEW REFRESH & DATA RENDERING
  // ==========================================
  function refreshActiveView() {
    updateRemindersBadge();

    switch (currentView) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'calendar':
        renderFullCalendarView();
        break;
      case 'summary':
        renderMonthlySummary();
        break;
      case 'analytics':
        renderAnalyticsView();
        break;
      case 'history':
        renderHistoryTable();
        break;
      case 'reminders':
        renderFullRemindersView();
        break;
      case 'settings':
        renderSettingsView();
        break;
      default:
        renderDashboard();
        break;
    }
  }

  function updateRemindersBadge() {
    const reminders = remindersMgr.getActiveReminders();
    const badge = document.getElementById('sidebar-reminders-badge');
    if (badge) {
      if (reminders.length > 0) {
        badge.textContent = reminders.length;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // --- 5A. DASHBOARD ---
  function renderDashboard() {
    const summary = calc.getMonthSummary(currentYearMonth);

    // Primary Big 3 Cards
    document.getElementById('card-val-received').textContent = calc.formatCurrency(summary.moneyReceived);
    document.getElementById('card-val-spent').textContent = calc.formatCurrency(summary.actualSpending);
    document.getElementById('card-val-saved').textContent = calc.formatCurrency(summary.saved);

    // Ratios
    const spendRatio = summary.moneyReceived > 0 
      ? Math.round((summary.actualSpending / summary.moneyReceived) * 100) 
      : 0;
    document.getElementById('card-spent-ratio').textContent = `${spendRatio}% of income`;
    document.getElementById('card-saved-percentage').textContent = `${summary.savingPercentage}% Saved`;

    // Secondary Cards
    document.getElementById('card-val-rent').textContent = calc.formatCurrency(summary.roomRent);
    document.getElementById('card-val-investment').textContent = calc.formatCurrency(summary.investment);
    document.getElementById('card-val-given').textContent = calc.formatCurrency(summary.moneyGivenTotal);
    document.getElementById('card-val-to-receive').textContent = calc.formatCurrency(summary.moneyToReceivePending);
    document.getElementById('card-val-taken').textContent = calc.formatCurrency(summary.moneyTakenTotal);
    document.getElementById('card-val-to-pay').textContent = calc.formatCurrency(summary.moneyToPayPending);

    // Active Reminder Banners
    renderDashboardReminderAlerts();

    // Render Calendar on Dashboard
    const calMount = document.getElementById('dashboard-calendar-mount');
    if (calMount) {
      calendarMgr.render(
        calMount,
        currentYearMonth,
        null,
        (dateStr) => openAddModalWithDate(dateStr)
      );
    }

    // Category Donut preview
    chartsMgr.renderCategoryDonutChart(summary);
  }

  function renderDashboardReminderAlerts() {
    const alertMount = document.getElementById('dashboard-reminder-alerts');
    if (!alertMount) return;

    const reminders = remindersMgr.getActiveReminders();
    if (reminders.length === 0) {
      alertMount.innerHTML = '';
      return;
    }

    let html = '';
    // Show top 2 most urgent reminders
    reminders.slice(0, 2).forEach(rem => {
      html += `
        <div class="reminder-alert-card ${rem.isOverdue ? 'overdue' : ''}">
          <div class="reminder-info">
            <span class="reminder-icon">${rem.isGiven ? '🤝' : '💵'}</span>
            <div class="reminder-text">
              <h4>${rem.title}</h4>
              <p>${rem.message} <span style="font-weight:700; color:${rem.isOverdue ? 'var(--color-spending)' : 'var(--brand-primary)'};">(${rem.dueStatus} • ${rem.freqLabel})</span></p>
            </div>
          </div>
          <div class="reminder-actions">
            ${rem.isGiven ? `
              <button class="btn btn-sm btn-primary" onclick="window.saharaApp.handleMarkReceived('${rem.id}')">
                Mark as Received
              </button>
            ` : `
              <button class="btn btn-sm btn-primary" onclick="window.saharaApp.handleMarkPaid('${rem.id}')">
                Mark as Paid
              </button>
            `}
            <button class="btn btn-sm btn-outline" onclick="window.saharaApp.handleSnooze('${rem.id}')">
              Remind Later
            </button>
          </div>
        </div>
      `;
    });

    alertMount.innerHTML = html;
  }

  // --- 5B. DEDICATED CALENDAR VIEW ---
  function renderFullCalendarView() {
    const fullCalMount = document.getElementById('full-calendar-mount');
    if (fullCalMount) {
      calendarMgr.render(
        fullCalMount,
        currentYearMonth,
        null,
        (dateStr) => openAddModalWithDate(dateStr)
      );
    }
  }

  // --- 5C. MONTHLY SUMMARY VIEW ---
  function renderMonthlySummary() {
    const tbody = document.getElementById('monthly-summary-tbody');
    if (!tbody) return;

    const summary = calc.getMonthSummary(currentYearMonth);
    const txs = store.getTransactionsForMonth(currentYearMonth);

    let html = `
      <tr style="background: var(--brand-light); font-weight: 700;">
        <td>💰 Money Received (Parents)</td>
        <td>Parental Monthly Allowance</td>
        <td>Fixed monthly income</td>
        <td style="text-align: right; color: var(--brand-primary); font-size: 1.05rem;">+${calc.formatCurrency(summary.moneyReceived)}</td>
      </tr>
      <tr>
        <td>🏠 Room Rent</td>
        <td>PG Room Rent</td>
        <td>Direct Essential Outflow</td>
        <td style="text-align: right; color: var(--color-rent); font-weight: 700;">-${calc.formatCurrency(summary.roomRent)}</td>
      </tr>
      <tr>
        <td>🔴 Daily Expenses</td>
        <td>Food, Quick Delivery, Online Orders</td>
        <td>Daily living expenses</td>
        <td style="text-align: right; color: var(--color-spending); font-weight: 700;">-${calc.formatCurrency(summary.dailyExpenses)}</td>
      </tr>
      <tr>
        <td>📱 Recharge</td>
        <td>Mobile & Internet / Wi-Fi</td>
        <td>Connectivity</td>
        <td style="text-align: right; color: var(--color-recharge); font-weight: 700;">-${calc.formatCurrency(summary.recharge)}</td>
      </tr>
      <tr>
        <td>💸 Donate / Loss</td>
        <td>Lost Money & Donations</td>
        <td>Irrecoverable Outflow</td>
        <td style="text-align: right; color: var(--color-donate); font-weight: 700;">-${calc.formatCurrency(summary.donateLoss)}</td>
      </tr>
      <tr style="background: var(--color-spending-bg); font-weight: 800; border-top: 2px solid var(--color-spending);">
        <td>📊 TOTAL ACTUAL SPENDING</td>
        <td>Rent + Daily + Recharge + Loss</td>
        <td>All completed spending</td>
        <td style="text-align: right; color: var(--color-spending); font-size: 1.15rem;">-${calc.formatCurrency(summary.actualSpending)}</td>
      </tr>
      <tr style="background: var(--color-saving-bg); font-weight: 800; border-top: 2px solid var(--color-saving);">
        <td>🟢 ACTUAL SAVINGS (REMAINING)</td>
        <td>Money Received - Actual Spending</td>
        <td>${summary.savingPercentage}% of allowance preserved</td>
        <td style="text-align: right; color: var(--color-saving); font-size: 1.25rem;">+${calc.formatCurrency(summary.saved)}</td>
      </tr>
      <tr style="border-top: 2px dashed var(--border-subtle);">
        <td>📈 Investment (Tracked Separately)</td>
        <td>Groww SIP, FD, Stocks</td>
        <td>Not treated as spent loss</td>
        <td style="text-align: right; color: var(--color-investment); font-weight: 700;">${calc.formatCurrency(summary.investment)}</td>
      </tr>
      <tr>
        <td>🤝 Money Given (Pending Return)</td>
        <td>Lent to friends</td>
        <td>Expected back (Asset)</td>
        <td style="text-align: right; color: var(--color-given); font-weight: 700;">${calc.formatCurrency(summary.moneyToReceivePending)}</td>
      </tr>
      <tr>
        <td>💵 Money Taken (To Repay)</td>
        <td>Borrowed from friends</td>
        <td>Temporary liability to repay</td>
        <td style="text-align: right; color: var(--color-taken); font-weight: 700;">${calc.formatCurrency(summary.moneyToPayPending)}</td>
      </tr>
    `;

    tbody.innerHTML = html;
  }

  // --- 5D. STATISTICS & GRAPHS VIEW ---
  function renderAnalyticsView() {
    chartsMgr.renderMonthlyCharts(currentYearMonth);
    const year = parseInt(currentYearMonth.split('-')[0], 10);
    const selectYear = document.getElementById('select-stats-year');
    if (selectYear) selectYear.value = String(year);
    chartsMgr.renderYearlyCharts(year);
  }

  const selectStatsYear = document.getElementById('select-stats-year');
  if (selectStatsYear) {
    selectStatsYear.addEventListener('change', (e) => {
      const yr = parseInt(e.target.value, 10);
      chartsMgr.renderYearlyCharts(yr);
      const title = document.getElementById('yearly-graph-title');
      if (title) title.textContent = `Yearly Spending & Saving Trend (${yr})`;
    });
  }

  // --- 5E. EXPENSE HISTORY VIEW ---
  const filterSearch = document.getElementById('filter-search-query');
  const filterType = document.getElementById('filter-tx-type');
  const filterScope = document.getElementById('filter-scope-month');
  const btnClearFilters = document.getElementById('btn-clear-filters');

  if (filterSearch) filterSearch.addEventListener('input', renderHistoryTable);
  if (filterType) filterType.addEventListener('change', renderHistoryTable);
  if (filterScope) filterScope.addEventListener('change', renderHistoryTable);
  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', () => {
      if (filterSearch) filterSearch.value = '';
      if (filterType) filterType.value = 'ALL';
      if (filterScope) filterScope.value = 'CURRENT_MONTH';
      renderHistoryTable();
    });
  }

  function renderHistoryTable() {
    const tbody = document.getElementById('history-tx-tbody');
    if (!tbody) return;

    let txs = store.getTransactions();

    // Scope filter
    if (filterScope && filterScope.value === 'CURRENT_MONTH') {
      txs = txs.filter(tx => tx.date.startsWith(currentYearMonth));
    }

    // Type filter
    if (filterType && filterType.value !== 'ALL') {
      txs = txs.filter(tx => tx.type === filterType.value);
    }

    // Search query filter
    const q = filterSearch ? filterSearch.value.trim().toLowerCase() : '';
    if (q) {
      txs = txs.filter(tx => {
        const desc = (tx.description || '').toLowerCase();
        const note = (tx.note || '').toLowerCase();
        const cat = (tx.category || '').toLowerCase();
        const sub = (tx.subcategory || '').toLowerCase();
        const person = (tx.person || '').toLowerCase();
        return desc.includes(q) || note.includes(q) || cat.includes(q) || sub.includes(q) || person.includes(q);
      });
    }

    // Sort descending by date
    txs.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (txs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">
            No transactions found matching the selected filters.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    txs.forEach(tx => {
      let badgeClass = 'badge-expense';
      let typeLabel = tx.type;

      if (tx.type === 'RENT') badgeClass = 'badge-rent';
      else if (tx.type === 'RECHARGE') badgeClass = 'badge-recharge';
      else if (tx.type === 'INVESTMENT') badgeClass = 'badge-investment';
      else if (tx.type === 'GIVEN') badgeClass = 'badge-given';
      else if (tx.type === 'TAKEN') badgeClass = 'badge-taken';
      else if (tx.type === 'DONATE') badgeClass = 'badge-donate';

      const isSpending = ['RENT', 'EXPENSE', 'RECHARGE', 'DONATE'].includes(tx.type);
      const amtColor = isSpending ? 'var(--color-spending)' : 'var(--text-primary)';

      html += `
        <tr>
          <td style="font-weight: 600; white-space: nowrap;">${tx.date}</td>
          <td><span class="type-badge ${badgeClass}">${tx.type}</span></td>
          <td>
            <div style="font-weight: 600;">${tx.category || '-'}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${tx.subcategory || ''}</div>
          </td>
          <td>
            <div>${tx.description || tx.note || '-'}</div>
            ${tx.person ? `<div style="font-size: 0.78rem; color: var(--brand-primary); font-weight: 600;">👤 ${tx.person}</div>` : ''}
          </td>
          <td style="font-weight: 700; color: ${amtColor}; white-space: nowrap;">
            ${calc.formatCurrency(tx.amount)}
          </td>
          <td>
            <span class="type-badge ${tx.status === 'COMPLETED' || tx.status === 'RECEIVED' || tx.status === 'PAID' ? 'badge-investment' : 'badge-expense'}">
              ${tx.status || 'COMPLETED'}
            </span>
          </td>
          <td>
            <div class="tx-actions-cell">
              <button class="btn-icon" title="Edit Entry" onclick="window.saharaApp.handleEditTx('${tx.id}')">✏️</button>
              <button class="btn-icon btn-delete" title="Delete Entry" onclick="window.saharaApp.handleDeleteTx('${tx.id}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  // --- 5F. FULL REMINDERS VIEW ---
  function renderFullRemindersView() {
    const container = document.getElementById('full-reminders-list');
    if (!container) return;

    const reminders = remindersMgr.getActiveReminders();
    if (reminders.length === 0) {
      container.innerHTML = `
        <div class="chart-card" style="text-align: center; padding: 48px 24px;">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🎉</div>
          <h3>All Caught Up!</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">No pending money to collect or repay right now.</p>
        </div>
      `;
      return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 14px;">';
    reminders.forEach(rem => {
      html += `
        <div class="reminder-alert-card ${rem.isOverdue ? 'overdue' : ''}" style="margin: 0;">
          <div class="reminder-info">
            <span class="reminder-icon">${rem.isGiven ? '🤝' : '💵'}</span>
            <div class="reminder-text">
              <h4>${rem.title}</h4>
              <p>${rem.message}</p>
              <div style="margin-top: 6px; font-size: 0.8rem; display: flex; gap: 16px; flex-wrap: wrap;">
                <span style="font-weight: 700; color: ${rem.isOverdue ? 'var(--color-spending)' : 'var(--brand-primary)'};">Status: ${rem.dueStatus}</span>
                <span style="color: var(--text-muted);">Frequency: ${rem.freqLabel}</span>
                ${rem.expectedDate ? `<span style="color: var(--text-muted);">Target: ${rem.expectedDate}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="reminder-actions">
            ${rem.isGiven ? `
              <button class="btn btn-sm btn-primary" onclick="window.saharaApp.handleMarkReceived('${rem.id}')">
                ✅ Mark as Received
              </button>
            ` : `
              <button class="btn btn-sm btn-primary" onclick="window.saharaApp.handleMarkPaid('${rem.id}')">
                ✅ Mark as Paid
              </button>
            `}
            <button class="btn btn-sm btn-outline" onclick="window.saharaApp.handleSnooze('${rem.id}')">
              ⏰ Remind Later
            </button>
            <button class="btn btn-sm btn-outline" onclick="window.saharaApp.handleEditTx('${rem.id}')">
              ✏️ Edit
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  }

  // --- 5G. SETTINGS & CATEGORIES VIEW ---
  function renderSettingsView() {
    const settings = store.getSettings();
    const curAllowance = store.getMonthlyAllowance(currentYearMonth);

    const inputDef = document.getElementById('input-default-allowance');
    const inputCur = document.getElementById('input-current-month-allowance');
    if (inputDef) inputDef.value = settings.defaultMonthlyAllowance || 10000;
    if (inputCur) inputCur.value = curAllowance.amount || 10000;

    renderCategoryTree();
  }

  function renderCategoryTree() {
    const typeSelect = document.getElementById('manage-category-type-select');
    const display = document.getElementById('category-tree-display');
    if (!typeSelect || !display) return;

    const t = typeSelect.value;
    const catMap = catMgr.getCategoriesForType(t);

    let html = '';
    Object.keys(catMap).forEach(cat => {
      const items = catMap[cat];
      html += `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; color: var(--text-primary);">
            <span>📁 ${cat}</span>
            <button class="btn btn-sm btn-outline" style="padding: 2px 6px; font-size: 0.72rem;" onclick="window.saharaApp.handleAddSubcategory('${t}', '${cat}')">+ Add Item</button>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-left: 14px;">
            ${items.map(item => `<span class="pill-badge pill-success" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-secondary);">${item}</span>`).join('')}
          </div>
        </div>
      `;
    });

    display.innerHTML = html;
  }

  const manageCatSelect = document.getElementById('manage-category-type-select');
  if (manageCatSelect) {
    manageCatSelect.addEventListener('change', renderCategoryTree);
  }

  const btnAddCustomCat = document.getElementById('btn-add-custom-category');
  if (btnAddCustomCat) {
    btnAddCustomCat.addEventListener('click', () => {
      const t = manageCatSelect ? manageCatSelect.value : 'EXPENSE';
      catMgr.addNewCategoryPrompt(t, () => {
        renderCategoryTree();
        showToast('Category created successfully!', 'success');
      });
    });
  }

  // Settings Allowance Form Submit
  const formSettingsAllowance = document.getElementById('form-settings-allowance');
  if (formSettingsAllowance) {
    formSettingsAllowance.addEventListener('submit', (e) => {
      e.preventDefault();
      const defAmt = parseFloat(document.getElementById('input-default-allowance').value);
      const curAmt = parseFloat(document.getElementById('input-current-month-allowance').value);

      store.updateSettings({ defaultMonthlyAllowance: defAmt });
      store.setMonthlyAllowance(currentYearMonth, curAmt, null, 'Updated from settings', false);

      showToast('Allowance settings saved successfully!', 'success');
      refreshActiveView();
    });
  }

  // Backup & Reset Buttons
  const btnExport = document.getElementById('btn-export-json');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(store.exportJSON());
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `pg_sahara_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Backup JSON exported!', 'success');
    });
  }

  const inputImport = document.getElementById('input-import-json');
  if (inputImport) {
    inputImport.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          store.importJSON(event.target.result);
          showToast('Data imported successfully!', 'success');
          refreshActiveView();
        } catch (err) {
          showToast(err.message, 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  const btnResetDemo = document.getElementById('btn-reset-demo-data');
  if (btnResetDemo) {
    btnResetDemo.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data back to initial demo data?')) {
        store.resetDefaults();
        showToast('Reset to default data completed', 'success');
        refreshActiveView();
      }
    });
  }

  // ==========================================
  // 6. MODAL: ADD / EDIT TRANSACTION
  // ==========================================
  const formTxTypeHidden = document.getElementById('form-tx-type');
  const formTxCategorySelect = document.getElementById('form-tx-category');
  const formTxSubcategorySelect = document.getElementById('form-tx-subcategory');

  function openAddModalWithDate(dateStr = null) {
    activeEditingTxId = null;
    document.getElementById('modal-tx-title').textContent = 'Add Transaction';
    formTx.reset();

    const dateToUse = dateStr || `${currentYearMonth}-${String(new Date().getDate()).padStart(2, '0')}`;
    document.getElementById('form-tx-date').value = dateToUse;

    selectTypePill('EXPENSE');
    modalTx.classList.add('active');
  }

  function openEditModal(txId) {
    const tx = store.getTransactionById(txId);
    if (!tx) return;

    activeEditingTxId = txId;
    document.getElementById('modal-tx-title').textContent = 'Edit Transaction';
    document.getElementById('form-tx-id').value = tx.id;
    document.getElementById('form-tx-amount').value = tx.amount;
    document.getElementById('form-tx-date').value = tx.date;
    document.getElementById('form-tx-desc').value = tx.description || tx.note || '';

    if (tx.person) document.getElementById('form-tx-person').value = tx.person;
    if (tx.expectedDate) document.getElementById('form-tx-expected-date').value = tx.expectedDate;
    if (tx.reminderFrequency) document.getElementById('form-tx-reminder-freq').value = tx.reminderFrequency;
    if (tx.reminderIntervalDays) document.getElementById('form-tx-reminder-days').value = tx.reminderIntervalDays;

    selectTypePill(tx.type, tx.category, tx.subcategory);
    modalTx.classList.add('active');
  }

  function closeTxModal() {
    modalTx.classList.remove('active');
    activeEditingTxId = null;
  }

  if (btnCloseTxModal) btnCloseTxModal.addEventListener('click', closeTxModal);
  if (btnCancelTx) btnCancelTx.addEventListener('click', closeTxModal);

  if (fabAddBtn) fabAddBtn.addEventListener('click', () => openAddModalWithDate());
  if (topBtnAdd) topBtnAdd.addEventListener('click', () => openAddModalWithDate());
  if (mobileAddBtn) mobileAddBtn.addEventListener('click', () => openAddModalWithDate());

  // Type Selector Pills Behavior
  function selectTypePill(type, selCategory = null, selSubcategory = null) {
    formTxTypeHidden.value = type;

    document.querySelectorAll('.type-pill').forEach(pill => {
      if (pill.getAttribute('data-type') === type) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    const rowCatSub = document.getElementById('row-category-subcategory');
    const rowPerson = document.getElementById('row-person-details');
    const rowReminder = document.getElementById('row-reminder-frequency');
    const groupIncome = document.getElementById('group-income-default');
    const labelDesc = document.getElementById('label-tx-desc');

    // Dynamic field visibility per type
    if (type === 'INCOME') {
      rowCatSub.style.display = 'none';
      rowPerson.style.display = 'none';
      rowReminder.style.display = 'none';
      groupIncome.style.display = 'block';
      labelDesc.textContent = 'Note / Source (e.g. From Papa via UPI)';
    } else if (type === 'GIVEN' || type === 'TAKEN') {
      rowCatSub.style.display = 'none';
      rowPerson.style.display = 'grid';
      rowReminder.style.display = 'grid';
      groupIncome.style.display = 'none';
      labelDesc.textContent = 'Reason / Note (e.g. College canteen split)';

      const labelExp = document.getElementById('label-expected-date');
      if (labelExp) {
        labelExp.textContent = type === 'GIVEN' ? 'Expected Return Date' : 'Expected Payment Date';
      }

      // Default reminder presets
      const remSelect = document.getElementById('form-tx-reminder-freq');
      if (remSelect && !activeEditingTxId) {
        remSelect.value = type === 'GIVEN' ? 'WEEKLY' : '2_DAYS';
      }
    } else {
      rowCatSub.style.display = 'grid';
      rowPerson.style.display = 'none';
      rowReminder.style.display = 'none';
      groupIncome.style.display = 'none';
      labelDesc.textContent = 'Description / Note';

      catMgr.populateCategorySelect(formTxCategorySelect, type, selCategory);
      const chosenCat = formTxCategorySelect.value;
      catMgr.populateSubcategorySelect(formTxSubcategorySelect, type, chosenCat, selSubcategory);
    }
  }

  document.querySelectorAll('.type-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const type = pill.getAttribute('data-type');
      selectTypePill(type);
    });
  });

  // On Category Select change
  if (formTxCategorySelect) {
    formTxCategorySelect.addEventListener('change', (e) => {
      const val = e.target.value;
      const type = formTxTypeHidden.value;
      if (val === '__ADD_NEW_CATEGORY__') {
        catMgr.addNewCategoryPrompt(type, (newCat) => {
          catMgr.populateCategorySelect(formTxCategorySelect, type, newCat);
          catMgr.populateSubcategorySelect(formTxSubcategorySelect, type, newCat);
        });
      } else {
        catMgr.populateSubcategorySelect(formTxSubcategorySelect, type, val);
      }
    });
  }

  // On Subcategory Select change
  if (formTxSubcategorySelect) {
    formTxSubcategorySelect.addEventListener('change', (e) => {
      const val = e.target.value;
      const type = formTxTypeHidden.value;
      const cat = formTxCategorySelect.value;
      if (val === '__ADD_NEW_SUBCATEGORY__') {
        catMgr.addNewSubcategoryPrompt(type, cat, (newSub) => {
          catMgr.populateSubcategorySelect(formTxSubcategorySelect, type, cat, newSub);
        });
      }
    });
  }

  // Inline "+ New" buttons in form
  const btnInlineAddCat = document.getElementById('btn-inline-add-category');
  if (btnInlineAddCat) {
    btnInlineAddCat.addEventListener('click', () => {
      const type = formTxTypeHidden.value;
      catMgr.addNewCategoryPrompt(type, (newCat) => {
        catMgr.populateCategorySelect(formTxCategorySelect, type, newCat);
        catMgr.populateSubcategorySelect(formTxSubcategorySelect, type, newCat);
      });
    });
  }

  const btnInlineAddSub = document.getElementById('btn-inline-add-subcategory');
  if (btnInlineAddSub) {
    btnInlineAddSub.addEventListener('click', () => {
      const type = formTxTypeHidden.value;
      const cat = formTxCategorySelect.value;
      catMgr.addNewSubcategoryPrompt(type, cat, (newSub) => {
        catMgr.populateSubcategorySelect(formTxSubcategorySelect, type, cat, newSub);
      });
    });
  }

  // Reminder Custom Frequency input toggle
  const formTxReminderFreq = document.getElementById('form-tx-reminder-freq');
  const groupCustomReminderDays = document.getElementById('group-custom-reminder-days');
  if (formTxReminderFreq) {
    formTxReminderFreq.addEventListener('change', () => {
      if (groupCustomReminderDays) {
        groupCustomReminderDays.style.display = formTxReminderFreq.value === 'CUSTOM' ? 'block' : 'none';
      }
    });
  }

  // Submit Transaction Form
  if (formTx) {
    formTx.addEventListener('submit', (e) => {
      e.preventDefault();

      const type = formTxTypeHidden.value;
      const amount = parseFloat(document.getElementById('form-tx-amount').value);
      const date = document.getElementById('form-tx-date').value;
      const desc = document.getElementById('form-tx-desc').value.trim();

      if (isNaN(amount) || amount <= 0) {
        showToast('Please enter an amount greater than zero.', 'error');
        return;
      }

      if (!date) {
        showToast('Please select a date.', 'error');
        return;
      }

      try {
        if (type === 'INCOME') {
          // Record Monthly Money from Parents
          const isDefault = document.getElementById('form-tx-set-default-allowance').checked;
          const ym = date.substring(0, 7);
          store.setMonthlyAllowance(ym, amount, date, desc, isDefault);
          showToast(`Monthly allowance of ${calc.formatCurrency(amount)} recorded!`, 'success');
        } else {
          // Regular or Loan Transaction
          const category = (type === 'GIVEN' || type === 'TAKEN') 
            ? (type === 'GIVEN' ? 'MONEY GIVEN' : 'MONEY TAKEN')
            : formTxCategorySelect.value;

          const subcategory = (type === 'GIVEN' || type === 'TAKEN')
            ? (type === 'GIVEN' ? 'Lent to Friend' : 'Borrowed')
            : formTxSubcategorySelect.value;

          const person = document.getElementById('form-tx-person').value.trim();
          const expectedDate = document.getElementById('form-tx-expected-date').value;
          const reminderFrequency = document.getElementById('form-tx-reminder-freq').value;
          const reminderDays = parseInt(document.getElementById('form-tx-reminder-days').value) || 7;

          const txPayload = {
            type,
            amount,
            date,
            category,
            subcategory,
            description: desc,
            note: desc,
            person,
            expectedDate,
            reminderFrequency,
            reminderIntervalDays: reminderDays
          };

          if (activeEditingTxId) {
            store.updateTransaction(activeEditingTxId, txPayload);
            showToast('Transaction updated successfully!', 'success');
          } else {
            store.addTransaction(txPayload);
            showToast('Transaction recorded successfully!', 'success');
          }
        }

        closeTxModal();
        refreshActiveView();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // ==========================================
  // 7. MODAL: EDIT ALLOWANCE
  // ==========================================
  function openAllowanceModal() {
    const curAllowance = store.getMonthlyAllowance(currentYearMonth);
    const [yStr, mStr] = currentYearMonth.split('-');
    const mName = monthNames[parseInt(mStr, 10) - 1];

    document.getElementById('modal-allowance-month-name').textContent = `${mName} ${yStr}`;
    document.getElementById('modal-input-allowance').value = curAllowance.amount || 10000;
    document.getElementById('modal-input-allowance-date').value = curAllowance.date || `${currentYearMonth}-01`;
    document.getElementById('modal-input-allowance-note').value = curAllowance.note || '';

    modalAllowance.classList.add('active');
  }

  function closeAllowanceModal() {
    modalAllowance.classList.remove('active');
  }

  if (btnEditAllowance) btnEditAllowance.addEventListener('click', openAllowanceModal);
  if (btnQuickEditIncome) btnQuickEditIncome.addEventListener('click', openAllowanceModal);
  if (btnCloseAllowanceModal) btnCloseAllowanceModal.addEventListener('click', closeAllowanceModal);
  if (btnCancelAllowance) btnCancelAllowance.addEventListener('click', closeAllowanceModal);

  if (formAllowance) {
    formAllowance.addEventListener('submit', (e) => {
      e.preventDefault();
      const amt = parseFloat(document.getElementById('modal-input-allowance').value);
      const date = document.getElementById('modal-input-allowance-date').value;
      const note = document.getElementById('modal-input-allowance-note').value.trim();
      const updateDef = document.getElementById('modal-input-allowance-default').checked;

      try {
        store.setMonthlyAllowance(currentYearMonth, amt, date, note, updateDef);
        showToast(`Allowance of ${calc.formatCurrency(amt)} saved!`, 'success');
        closeAllowanceModal();
        refreshActiveView();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // ==========================================
  // 8. GLOBAL EXPOSED ACTIONS FOR INLINE HANDLERS
  // ==========================================
  window.saharaApp = {
    handleMarkReceived: (id) => {
      remindersMgr.markAsReceived(id);
      showToast('Marked as Received! Reminder stopped.', 'success');
      refreshActiveView();
    },
    handleMarkPaid: (id) => {
      remindersMgr.markAsPaid(id);
      showToast('Marked as Paid! Reminder stopped.', 'success');
      refreshActiveView();
    },
    handleSnooze: (id) => {
      remindersMgr.snooze(id, 2);
      showToast('Reminder snoozed for 2 days.', 'info');
      refreshActiveView();
    },
    handleEditTx: (id) => {
      openEditModal(id);
    },
    handleDeleteTx: (id) => {
      if (confirm('Are you sure you want to delete this transaction?')) {
        store.deleteTransaction(id);
        showToast('Transaction deleted.', 'info');
        refreshActiveView();
      }
    },
    handleAddSubcategory: (type, cat) => {
      catMgr.addNewSubcategoryPrompt(type, cat, () => {
        renderCategoryTree();
        showToast('Option added!', 'success');
      });
    }
  };

  // ==========================================
  // 9. AUTHENTICATION & USER PROFILE CONTROLLER
  // ==========================================
  const auth = window.saharaAuth;
  const modalAuth = document.getElementById('modal-auth');
  const btnCloseAuthModal = document.getElementById('btn-close-auth-modal');
  const sidebarUserProfile = document.getElementById('sidebar-user-profile');
  const topUserProfile = document.getElementById('top-user-profile');

  const authLoggedInBox = document.getElementById('auth-logged-in-box');
  const authTabsBar = document.getElementById('auth-tabs-bar');
  const formLogin = document.getElementById('form-login');
  const formSignup = document.getElementById('form-signup');
  const formReset = document.getElementById('form-reset');

  const resetStepTwo = document.getElementById('reset-step-two');
  const btnRequestResetCode = document.getElementById('btn-request-reset-code');
  const btnResendCode = document.getElementById('btn-resend-code');
  const resendTimerLabel = document.getElementById('resend-timer-label');
  const linkGotoReset = document.getElementById('link-goto-reset');
  const linkBackToLogin = document.getElementById('link-back-to-login');
  const btnFillDemoCreds = document.getElementById('btn-fill-demo-creds');

  const btnAuthLogout = document.getElementById('btn-auth-logout');
  const btnAuthSwitchAccount = document.getElementById('btn-auth-switch-account');

  let resendInterval = null;

  function updateUserProfileUI() {
    const user = auth.getCurrentUser();
    const sidebarAvatar = document.getElementById('sidebar-user-avatar');
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarPg = document.getElementById('sidebar-user-pg');
    const topAvatar = document.getElementById('top-user-avatar');
    const topName = document.getElementById('top-user-name');

    if (user) {
      const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
      if (sidebarAvatar) sidebarAvatar.textContent = initial;
      if (sidebarName) sidebarName.textContent = user.name;
      if (sidebarPg) sidebarPg.textContent = user.pgName || 'PG Sahara';
      if (topAvatar) topAvatar.textContent = initial;
      if (topName) topName.textContent = user.name;

      if (authLoggedInBox) {
        document.getElementById('auth-current-avatar').textContent = initial;
        document.getElementById('auth-current-name').textContent = user.name;
        document.getElementById('auth-current-email').textContent = user.email;
        document.getElementById('auth-current-pg').textContent = user.pgName || 'PG Sahara';
      }
    } else {
      if (sidebarAvatar) sidebarAvatar.textContent = '?';
      if (sidebarName) sidebarName.textContent = 'Sign In';
      if (sidebarPg) sidebarPg.textContent = 'Tap to login';
      if (topAvatar) topAvatar.textContent = '?';
      if (topName) topName.textContent = 'Sign In';
    }
  }

  function openAuthModal(tab = 'login') {
    const user = auth.getCurrentUser();
    if (user && tab === 'login') {
      // Show active session info box
      if (authLoggedInBox) authLoggedInBox.style.display = 'block';
    } else {
      if (authLoggedInBox) authLoggedInBox.style.display = 'none';
    }
    switchAuthTab(tab);
    if (modalAuth) modalAuth.classList.add('active');
  }

  function closeAuthModal() {
    if (modalAuth) modalAuth.classList.remove('active');
    if (resendInterval) clearInterval(resendInterval);
  }

  function switchAuthTab(tabName) {
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-auth-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (formLogin) formLogin.style.display = tabName === 'login' ? 'block' : 'none';
    if (formSignup) formSignup.style.display = tabName === 'signup' ? 'block' : 'none';
    if (formReset) formReset.style.display = tabName === 'reset' ? 'block' : 'none';
  }

  if (sidebarUserProfile) sidebarUserProfile.addEventListener('click', () => openAuthModal('login'));
  if (topUserProfile) topUserProfile.addEventListener('click', () => openAuthModal('login'));
  if (btnCloseAuthModal) btnCloseAuthModal.addEventListener('click', closeAuthModal);

  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-auth-tab');
      switchAuthTab(tab);
    });
  });

  if (linkGotoReset) {
    linkGotoReset.addEventListener('click', (e) => {
      e.preventDefault();
      switchAuthTab('reset');
    });
  }

  if (linkBackToLogin) {
    linkBackToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      switchAuthTab('login');
    });
  }

  if (btnFillDemoCreds) {
    btnFillDemoCreds.addEventListener('click', () => {
      document.getElementById('login-email').value = 'student@pgsahara.com';
      document.getElementById('login-password').value = 'sahara123';
      showToast('Filled demo account credentials', 'info');
    });
  }

  // Password visibility eye toggles
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '🙈';
        } else {
          input.type = 'password';
          btn.textContent = '👁️';
        }
      }
    });
  });

  // Handle Login Submit
  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const user = auth.login(email, password);
        showToast(`Welcome back, ${user.name}! 👋`, 'success');
        updateUserProfileUI();
        closeAuthModal();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Handle Sign Up Submit
  if (formSignup) {
    formSignup.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const pgName = document.getElementById('signup-pg').value.trim();
      const college = document.getElementById('signup-college').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirm = document.getElementById('signup-password-confirm').value;

      if (password !== confirm) {
        showToast('Passwords do not match!', 'error');
        return;
      }

      try {
        const user = auth.register(name, email, password, pgName, college);
        showToast(`Account created! Welcome, ${user.name} 🎉`, 'success');
        updateUserProfileUI();
        closeAuthModal();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Handle Send / Resend Code
  function triggerSendResetCode() {
    const emailInput = document.getElementById('reset-email');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
      showToast('Please enter your account email.', 'error');
      return;
    }

    try {
      const res = auth.sendResetCode(email);
      if (resetStepTwo) resetStepTwo.style.display = 'block';

      // Start 30-second countdown for the Resend Option
      startResendCountdown(30);

      // Alert the code clearly to the student
      showToast(`Verification code generated: ${res.code}`, 'success');
      alert(`🔔 PG SAHARA Password Reset\n\nA 6-digit verification code has been generated for ${email}:\n\n👉  ${res.code}  👈\n\nEnter this code below to set your new password.`);

      // Pre-fill the verification code input for maximum convenience
      const codeInput = document.getElementById('reset-code');
      if (codeInput) {
        codeInput.value = res.code;
        codeInput.focus();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function startResendCountdown(seconds = 30) {
    if (resendInterval) clearInterval(resendInterval);
    let remaining = seconds;

    if (btnResendCode) btnResendCode.disabled = true;
    if (resendTimerLabel) resendTimerLabel.textContent = `(${remaining}s)`;

    resendInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(resendInterval);
        if (btnResendCode) btnResendCode.disabled = false;
        if (resendTimerLabel) resendTimerLabel.textContent = '';
      } else {
        if (resendTimerLabel) resendTimerLabel.textContent = `(${remaining}s)`;
      }
    }, 1000);
  }

  if (btnRequestResetCode) btnRequestResetCode.addEventListener('click', triggerSendResetCode);
  if (btnResendCode) {
    btnResendCode.addEventListener('click', () => {
      triggerSendResetCode();
      showToast('New reset code generated and resent!', 'info');
    });
  }

  // Handle Reset Password Submit
  if (formReset) {
    formReset.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('reset-email').value.trim();
      const code = document.getElementById('reset-code').value.trim();
      const newPassword = document.getElementById('reset-new-password').value;
      const confirmPassword = document.getElementById('reset-confirm-password').value;

      if (!code) {
        showToast('Please enter the 6-digit verification code.', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('New passwords do not match!', 'error');
        return;
      }

      try {
        auth.verifyAndResetPassword(email, code, newPassword);
        showToast('Password reset successfully! Please sign in with your new password.', 'success');
        switchAuthTab('login');
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = newPassword;
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Handle Logout & Switch Account
  if (btnAuthLogout) {
    btnAuthLogout.addEventListener('click', () => {
      auth.logout();
      showToast('Logged out of PG SAHARA.', 'info');
      updateUserProfileUI();
      closeAuthModal();
    });
  }

  if (btnAuthSwitchAccount) {
    btnAuthSwitchAccount.addEventListener('click', () => {
      if (authLoggedInBox) authLoggedInBox.style.display = 'none';
      switchAuthTab('login');
    });
  }

  // ==========================================
  // 10. RESET FINANCIAL DATA CONTROLLER
  // ==========================================
  const modalResetData = document.getElementById('modal-reset-data');
  const topBtnResetData = document.getElementById('top-btn-reset-data');
  const btnClearAllZero = document.getElementById('btn-clear-all-zero');
  const btnClearMonthZero = document.getElementById('btn-clear-month-zero');
  const btnCloseResetModal = document.getElementById('btn-close-reset-modal');
  const btnCancelResetModal = document.getElementById('btn-cancel-reset-modal');
  const btnConfirmResetAction = document.getElementById('btn-confirm-reset-action');
  const inputResetInitialAllowance = document.getElementById('input-reset-initial-allowance');

  function openResetModal(scope = 'ALL_ZERO') {
    const radio = document.querySelector(`input[name="reset-scope-choice"][value="${scope}"]`);
    if (radio) radio.checked = true;

    const [yStr, mStr] = currentYearMonth.split('-');
    const mName = monthNames[parseInt(mStr, 10) - 1];
    const label = `${mName} ${yStr}`;
    const resetModalLabel = document.getElementById('modal-reset-month-label');
    if (resetModalLabel) resetModalLabel.textContent = label;

    if (modalResetData) modalResetData.classList.add('active');
  }

  function closeResetModal() {
    if (modalResetData) modalResetData.classList.remove('active');
  }

  const btnQuickResetSpent = document.getElementById('btn-quick-reset-spent');
  const btnQuickResetSavings = document.getElementById('btn-quick-reset-savings');

  if (topBtnResetData) topBtnResetData.addEventListener('click', () => openResetModal('ALL_ZERO'));
  if (btnClearAllZero) btnClearAllZero.addEventListener('click', () => openResetModal('ALL_ZERO'));
  if (btnClearMonthZero) btnClearMonthZero.addEventListener('click', () => openResetModal('MONTH_ZERO'));
  if (btnQuickResetSpent) btnQuickResetSpent.addEventListener('click', () => openResetModal('MONTH_ZERO'));
  if (btnQuickResetSavings) btnQuickResetSavings.addEventListener('click', () => openResetModal('SAVINGS_ZERO'));

  if (btnCloseResetModal) btnCloseResetModal.addEventListener('click', closeResetModal);
  if (btnCancelResetModal) btnCancelResetModal.addEventListener('click', closeResetModal);

  if (btnConfirmResetAction) {
    btnConfirmResetAction.addEventListener('click', () => {
      const selectedScope = document.querySelector('input[name="reset-scope-choice"]:checked')?.value || 'ALL_ZERO';
      const startingAllowance = parseFloat(inputResetInitialAllowance ? inputResetInitialAllowance.value : 0) || 0;

      if (selectedScope === 'ALL_ZERO') {
        store.clearAllPricesAndSavings(startingAllowance);
        showToast('All prices, expenses, and savings reset to zero! (Clean slate)', 'success');
      } else if (selectedScope === 'MONTH_ZERO') {
        store.clearMonthPricesAndSavings(currentYearMonth);
        showToast('Prices and spending for selected month reset to zero!', 'success');
      } else if (selectedScope === 'SAVINGS_ZERO') {
        store.resetSavingsOnly(currentYearMonth);
        showToast('Savings for selected month reset to ₹0!', 'success');
      } else if (selectedScope === 'RESTORE_DEMO') {
        store.resetDefaults();
        showToast('Restored original demo data.', 'info');
      }

      closeResetModal();
      refreshActiveView();
    });
  }

  // ==========================================
  // 11. APP START
  // ==========================================
  initTheme();
  updateMonthDisplay();
  updateUserProfileUI();
  refreshActiveView();
});

