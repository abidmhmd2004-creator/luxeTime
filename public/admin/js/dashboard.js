// Revenue Bar Chart
const revCtx = document.getElementById('revenueChart');
if (revCtx) {
  new Chart(revCtx, {
    type: 'bar',
    data: {
      labels: revenueTrend.map((d) =>
        new Date(d._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      ),
      datasets: [
        {
          data: revenueTrend.map((d) => d.revenue),
          backgroundColor: '#38a169',
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#262626' }, ticks: { color: '#737373', font: { size: 9 } } },
        x: { grid: { display: false }, ticks: { color: '#737373', font: { size: 9 } } },
      },
    },
  });
}

// Color Donut Chart
const colorCtx = document.getElementById('colorDonutChart');
if (colorCtx) {
  new Chart(colorCtx, {
    type: 'doughnut',
    data: {
      labels: salesByColor.map((d) => d._id),
      datasets: [
        {
          data: salesByColor.map((d) => d.units),
          backgroundColor: salesByColor.map((d) => d._id.toLowerCase()),
          borderWidth: 2,
          borderColor: '#161b1b',
        },
      ],
    },
    options: {
      cutout: '80%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  });
}

// Range Selection Logic
document.querySelectorAll('.range-btn').forEach((btn) => {
  if (btn.dataset.range === (new URLSearchParams(window.location.search).get('range') || 'daily')) {
    btn.classList.add('bg-neutral-700', 'text-white');
  }
  btn.addEventListener('click', () => {
    window.location.search = `range=${btn.dataset.range}`;
  });
});

document.getElementById('customBtn').addEventListener('click', () => {
  document.getElementById('customDateBox').classList.toggle('hidden');
});

document.getElementById('applyCustom').addEventListener('click', () => {
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  if (start && end) {
    window.location.search = `range=custom&startDate=${start}&endDate=${end}`;
  }
});
