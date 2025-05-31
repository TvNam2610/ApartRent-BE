let transactionChart, postChart;

document.addEventListener("DOMContentLoaded", function () {
    const monthInput = document.getElementById("monthFilter");

    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    monthInput.value = currentMonth;

    fetchStats(currentMonth);

    monthInput.addEventListener("change", () => {
        fetchStats(monthInput.value);
    });
});

function fetchStats(month) {
    fetch(`statistics?month=${month}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("post-count").innerText = data.totalPosts;
            document.getElementById("new-users").innerText = data.newUsers;
            document.getElementById("visits").innerText = data.visits;
            document.getElementById("transactions").innerText = data.transactions;

            renderChart("transactionChart", data.chart.transactions, "Giao dịch", "rgb(255, 159, 64)", transactionChart, (chart) => transactionChart = chart);
            renderChart("postChart", data.chart.posts, "Tin đăng", "rgb(54, 162, 235)", postChart, (chart) => postChart = chart);
        });
}

function renderChart(canvasId, dataset, label, color, existingChart, storeChartFn) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (existingChart) existingChart.destroy();

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dataset.labels,
            datasets: [{
                label: label,
                data: dataset.data,
                backgroundColor: color
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });

    storeChartFn(chart);
}
