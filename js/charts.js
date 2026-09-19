/**
 * PG SAHARA - Visual Graphs & Analytics Engine
 * Renders interactive charts using Chart.js:
 * - Monthly Spend vs Save (Red vs Green)
 * - Category Donut / Pie chart
 * - Category Bar chart
 * - Yearly 12-Month Spending vs Saving trends
 */

class SaharaCharts {
  constructor(store, calculations) {
    this.store = store;
    this.calc = calculations;
    this.instances = {};
  }

  destroyChart(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  }

  isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  getTextColor() {
    return this.isDarkMode() ? '#e2e8f0' : '#334155';
  }

  getGridColor() {
    return this.isDarkMode() ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  }

  renderMonthlyCharts(yearMonth) {
    const summary = this.calc.getMonthSummary(yearMonth);

    this.renderSpendVsSaveChart(summary);
    this.renderCategoryDonutChart(summary);
    this.renderCategoryBarChart(summary);
  }

  renderSpendVsSaveChart(summary) {
    const canvas = document.getElementById('chart-spend-vs-save');
    if (!canvas || typeof Chart === 'undefined') return;

    this.destroyChart('spendVsSave');

    const spent = summary.actualSpending;
    const saved = Math.max(0, summary.saved);

    const ctx = canvas.getContext('2d');
    this.instances['spendVsSave'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Spent (Actual Outflow)', 'Saved (Remaining)'],
        datasets: [{
          data: [spent, saved],
          backgroundColor: [
            '#ef4444', // Red = Spending
            '#10b981'  // Green = Saving
          ],
          borderWidth: 2,
          borderColor: this.isDarkMode() ? '#1e293b' : '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: this.getTextColor(),
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 13, weight: '600' },
              padding: 16
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const val = context.raw || 0;
                const total = spent + saved;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${label}: ₹${val.toLocaleString('en-IN')} (${pct}%)`;
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  renderCategoryDonutChart(summary) {
    const canvas = document.getElementById('chart-category-donut');
    if (!canvas || typeof Chart === 'undefined') return;

    this.destroyChart('categoryDonut');

    const breakdown = summary.categoryBreakdown;
    const labels = Object.keys(breakdown);
    const data = Object.values(breakdown);

    if (labels.length === 0) {
      labels.push('No Spending');
      data.push(1);
    }

    const colorPalette = [
      '#8b5cf6', // Purple for Room Rent
      '#f97316', // Orange for Food
      '#06b6d4', // Cyan for Delivery
      '#ec4899', // Pink for Online
      '#eab308', // Yellow for Recharge
      '#e11d48', // Crimson for Donate/Loss
      '#3b82f6', // Blue
      '#14b8a6', // Teal
      '#a855f7'  // Violet
    ];

    const ctx = canvas.getContext('2d');
    this.instances['categoryDonut'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colorPalette.slice(0, labels.length),
          borderWidth: 2,
          borderColor: this.isDarkMode() ? '#1e293b' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: this.getTextColor(),
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
              boxWidth: 12,
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ₹${(context.raw || 0).toLocaleString('en-IN')}`
            }
          }
        }
      }
    });
  }

  renderCategoryBarChart(summary) {
    const canvas = document.getElementById('chart-category-bar');
    if (!canvas || typeof Chart === 'undefined') return;

    this.destroyChart('categoryBar');

    const breakdown = summary.categoryBreakdown;
    // Sort highest to lowest
    const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(item => item[0]);
    const data = sorted.map(item => item[1]);

    const ctx = canvas.getContext('2d');
    this.instances['categoryBar'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['None'],
        datasets: [{
          label: 'Spending Amount (₹)',
          data: data.length ? data : [0],
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          maxBarThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // Horizontal bars for clean readability of category names
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ₹${(context.raw || 0).toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: this.getGridColor() },
            ticks: {
              color: this.getTextColor(),
              callback: (v) => `₹${v >= 1000 ? v/1000 + 'k' : v}`
            }
          },
          y: {
            grid: { display: false },
            ticks: { color: this.getTextColor(), font: { weight: '600' } }
          }
        }
      }
    });
  }

  renderYearlyCharts(year) {
    const yearly = this.calc.getYearlySummary(year);

    const canvas = document.getElementById('chart-yearly-trend');
    if (!canvas || typeof Chart === 'undefined') return;

    this.destroyChart('yearlyTrend');

    const labels = yearly.monthlyData.map(d => d.monthName.substring(0, 3));
    const spendingData = yearly.monthlyData.map(d => d.spending);
    const savingData = yearly.monthlyData.map(d => d.saving);

    const ctx = canvas.getContext('2d');
    this.instances['yearlyTrend'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '🔴 Spending (Actual Outflow)',
            data: spendingData,
            backgroundColor: '#ef4444',
            borderRadius: 6,
            maxBarThickness: 24
          },
          {
            label: '🟢 Saving (Remaining)',
            data: savingData,
            backgroundColor: '#10b981',
            borderRadius: 6,
            maxBarThickness: 24
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: this.getTextColor(),
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 13, weight: '600' }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ₹${(context.raw || 0).toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this.getTextColor(), font: { weight: '600' } }
          },
          y: {
            grid: { color: this.getGridColor() },
            ticks: {
              color: this.getTextColor(),
              callback: (v) => `₹${v >= 1000 ? v/1000 + 'k' : v}`
            }
          }
        }
      }
    });

    // Populate yearly key metric boxes
    const elSpend = document.getElementById('yearly-stat-spend');
    const elSave = document.getElementById('yearly-stat-save');
    const elInvest = document.getElementById('yearly-stat-invest');
    const elRent = document.getElementById('yearly-stat-rent');
    const elHighSpend = document.getElementById('yearly-stat-high-spend');
    const elHighSave = document.getElementById('yearly-stat-high-save');

    if (elSpend) elSpend.textContent = this.calc.formatCurrency(yearly.totalYearlySpending);
    if (elSave) elSave.textContent = this.calc.formatCurrency(yearly.totalYearlySaving);
    if (elInvest) elInvest.textContent = this.calc.formatCurrency(yearly.totalYearlyInvestment);
    if (elRent) elRent.textContent = this.calc.formatCurrency(yearly.totalYearlyRent);
    if (elHighSpend) elHighSpend.textContent = `${yearly.highestSpendingMonth.month} (${this.calc.formatCurrency(yearly.highestSpendingMonth.amount)})`;
    if (elHighSave) elHighSave.textContent = `${yearly.highestSavingMonth.month} (${this.calc.formatCurrency(yearly.highestSavingMonth.amount)})`;
  }
}

window.saharaCharts = new SaharaCharts(window.saharaStore, window.saharaCalc);
